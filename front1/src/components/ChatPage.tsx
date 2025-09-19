'use client';

import React, { useCallback, useEffect } from 'react';
import { ChatWindow } from './ChatWindow';
import { MessageInput } from './MessageInput';
import { ActionButtons } from './ActionButtons';
import { UserProfile } from './UserProfile';
import { BuildInfo } from './BuildInfo';
import { useChatState } from '../hooks/useChatState';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { ChatService, type ChatServiceError } from '../services/chatService';
import { useConfig } from './ConfigProvider';

interface ErrorInfo {
  message: string;
  isRetryable: boolean;
  userFriendlyMessage: string;
}

const formatErrorMessage = (error: unknown, endpoint: 'local' | 'remote' | 'bedrock'): ErrorInfo => {
  if (error && typeof error === 'object' && 'type' in error && 'name' in error && error.name === 'ChatServiceError') {
    const chatError = error as ChatServiceError;
    
    switch (chatError.type) {
      case 'network':
        return {
          message: `Unable to connect to ${endpoint} endpoint. Please check your connection and try again.`,
          isRetryable: chatError.isRetryable,
          userFriendlyMessage: `Connection failed to ${endpoint} service`
        };
      case 'timeout':
        return {
          message: `Request to ${endpoint} endpoint timed out. The service may be busy, please try again.`,
          isRetryable: chatError.isRetryable,
          userFriendlyMessage: `${endpoint} service is taking too long to respond`
        };
      case 'api':
        if (chatError.statusCode) {
          if (chatError.statusCode >= 500) {
            return {
              message: `${endpoint} service is temporarily unavailable (Error ${chatError.statusCode}). Please try again later.`,
              isRetryable: chatError.isRetryable,
              userFriendlyMessage: `${endpoint} service error`
            };
          } else if (chatError.statusCode === 429) {
            return {
              message: `Too many requests to ${endpoint} endpoint. Please wait a moment and try again.`,
              isRetryable: chatError.isRetryable,
              userFriendlyMessage: 'Rate limit exceeded'
            };
          } else if (chatError.statusCode >= 400) {
            return {
              message: `Invalid request to ${endpoint} endpoint (Error ${chatError.statusCode}). Please check your message and try again.`,
              isRetryable: chatError.isRetryable,
              userFriendlyMessage: 'Invalid request'
            };
          }
        }
        return {
          message: `${endpoint} service error: ${chatError.message}`,
          isRetryable: chatError.isRetryable,
          userFriendlyMessage: `${endpoint} service error`
        };
      case 'config':
        return {
          message: `Configuration error: ${chatError.message}`,
          isRetryable: false,
          userFriendlyMessage: 'Configuration error'
        };
      default:
        return {
          message: chatError.message,
          isRetryable: chatError.isRetryable,
          userFriendlyMessage: 'Unknown error'
        };
    }
  } else if (error instanceof Error) {
    return {
      message: `Unexpected error: ${error.message}`,
      isRetryable: false,
      userFriendlyMessage: 'Unexpected error occurred'
    };
  }
  
  return {
    message: 'An unknown error occurred. Please try again.',
    isRetryable: false,
    userFriendlyMessage: 'Unknown error'
  };
};

export interface ChatPageProps {
  className?: string;
}

export const ChatPage: React.FC<ChatPageProps> = ({ className = '' }) => {
  const {
    messages,
    isLoading,
    error,
    currentInput,
    addMessage,
    setLoading,
    setError,
    setCurrentInput,
    clearChat,
    clearError,
  } = useChatState();

  const { announce, AnnouncementRegion } = useAnnouncements();
  const { config } = useConfig();

  const [lastFailedRequest, setLastFailedRequest] = React.useState<{
    message: string;
    endpoint: 'local' | 'remote' | 'bedrock';
    isRetryable: boolean;
  } | null>(null);

  const [currentTime, setCurrentTime] = React.useState<string>('');

  // Update time on client side to avoid hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    
    // Set initial time
    updateTime();
    
    // Update time every second
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Clear error when user starts typing
  useEffect(() => {
    if (error && currentInput) {
      clearError();
      setLastFailedRequest(null);
    }
  }, [currentInput, error, clearError]);

  const handleSendMessage = useCallback(async (message: string, endpoint: 'local' | 'remote' | 'bedrock') => {
    if (!message.trim() || isLoading || !config) return;

    // Create ChatService instance with current config
    const chatService = new ChatService({
      localEndpoint: config.localEndpoint,
      remoteEndpoint: config.remoteEndpoint,
      timeout: config.timeout,
      maxRetries: config.maxRetries,
      retryDelay: config.retryDelay,
      headers: config.headers,
    });

    // Add user message to chat
    addMessage(message, 'user');
    setLoading(true);
    setCurrentInput('');

    try {
      let response: string;
      
      if (endpoint === 'local') {
        response = await chatService.sendToLocal(message);
        addMessage(response, 'assistant', 'local');
        announce(`New message received from local endpoint`);
      } else if (endpoint === 'bedrock') {
        const bedrockResponse = await chatService.sendToBedrockAgent({ message });
        response = bedrockResponse.response || 'No response received from Bedrock Agent';
        addMessage(response, 'assistant', 'bedrock');
        announce(`New research response received from Bedrock Agent`);
      } else {
        response = await chatService.sendToRemote(message);
        addMessage(response, 'assistant', 'remote');
        announce(`New message received from remote endpoint`);
      }
    } catch (error) {
      const errorInfo = formatErrorMessage(error, endpoint);
      
      addMessage(errorInfo.message, 'error');
      setError(errorInfo.message);
      announce(`Error: ${errorInfo.userFriendlyMessage}`, 'assertive');
      
      // Store failed request info for retry
      if (errorInfo.isRetryable) {
        setLastFailedRequest({
          message,
          endpoint,
          isRetryable: true
        });
      } else {
        setLastFailedRequest(null);
      }
      

    } finally {
      setLoading(false);
    }
  }, [isLoading, addMessage, setLoading, setCurrentInput, setError, announce, config]);

  const handleSendLocal = useCallback(() => {
    handleSendMessage(currentInput, 'local');
  }, [currentInput, handleSendMessage]);

  const handleSendRemote = useCallback(() => {
    handleSendMessage(currentInput, 'bedrock');
  }, [currentInput, handleSendMessage]);

  const handleClear = useCallback(() => {
    clearChat();
    clearError();
    setLastFailedRequest(null);
    announce('Chat history cleared');
  }, [clearChat, clearError, announce]);

  const handleRetry = useCallback(() => {
    if (lastFailedRequest) {
      clearError();
      handleSendMessage(lastFailedRequest.message, lastFailedRequest.endpoint);
      setLastFailedRequest(null);
    }
  }, [lastFailedRequest, clearError, handleSendMessage]);

  const handleInputChange = useCallback((value: string) => {
    setCurrentInput(value);
  }, [setCurrentInput]);

  const handleEnterPress = useCallback(() => {
    // Default to Research (Bedrock Agent) when Enter is pressed
    handleSendRemote();
  }, [handleSendRemote]);

  const isInputEmpty = !currentInput.trim();

  return (
    <div className={`flex flex-col h-full w-[85%] mx-auto p-6 space-y-6 ${className}`}>
      <div {...AnnouncementRegion()} />
      
      {/* Professional Header */}
      <header className="border-b border-slate-200 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold financial-heading">
                Financial Research Assistant
              </h1>
              <p className="financial-caption mt-1">
                AI-powered research and analysis platform
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full status-online"></div>
              <span className="financial-caption">System Online</span>
            </div>
            <div className="text-right">
              <div className="financial-caption">Session Active</div>
              <div className="text-xs text-slate-400">{currentTime}</div>
            </div>
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Professional Error Display */}
      {error && (
        <div 
          className="financial-card border-red-200 bg-red-50 p-4 error-shake"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-red-800 mb-1">
                System Alert
              </h3>
              <p className="text-sm text-red-700 financial-body">
                {error}
              </p>
              {lastFailedRequest?.isRetryable && (
                <div className="mt-3">
                  <button
                    onClick={handleRetry}
                    disabled={isLoading}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    aria-label="Retry failed request"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isLoading ? 'Retrying Connection...' : 'Retry Request'}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={clearError}
              className="ml-4 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors"
              aria-label="Dismiss alert"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Research Chat Interface */}
      <div className="flex-1 min-h-0">
        <div className="financial-card h-full flex flex-col">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold financial-heading">Research Session</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="financial-caption">Messages:</span>
                  <span className="text-sm font-medium text-slate-900">{messages.length}</span>
                </div>
                {isLoading && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="financial-caption">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-h-0">
            <ChatWindow 
              messages={messages} 
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Professional Input Panel */}
      <div className="financial-card p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold financial-heading">Research Query</h3>
            <div className="flex items-center space-x-2 financial-caption">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Enter your research question or data request</span>
            </div>
          </div>
          
          <MessageInput
            onSendMessage={() => {}}
            disabled={isLoading}
            placeholder="Enter your research query, market analysis request, or data question..."
            value={currentInput}
            onChange={handleInputChange}
            onEnterPress={handleEnterPress}
            autoFocus
          />
          
          <ActionButtons
            onSendLocal={handleSendLocal}
            onSendRemote={handleSendRemote}
            onClear={handleClear}
            disabled={isLoading}
            isInputEmpty={isInputEmpty}
            isLoading={isLoading}
          />
        </div>
      </div>
      
      {/* Build Information */}
      <div className="text-center">
        <BuildInfo />
      </div>
    </div>
  );
};

export default ChatPage;