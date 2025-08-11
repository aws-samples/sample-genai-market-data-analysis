import React, { useEffect, useRef } from 'react';
import { Message } from '@/types';
import { MessageItem } from './MessageItem';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added or loading state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages, isLoading]);

  const renderEmptyState = () => (
    <div 
      className="flex flex-col items-center justify-center h-full text-slate-500 p-8"
      role="status"
      aria-label="No research queries in session"
    >
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold financial-heading mb-2">Ready for Research</h3>
      <p className="financial-caption text-center max-w-md leading-relaxed">
        Enter your financial research query, market analysis request, or data question to begin your research session.
      </p>
      <div className="mt-6 flex items-center space-x-4 text-xs text-slate-400">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Local Analysis</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Cloud Research</span>
        </div>
      </div>
    </div>
  );

  const renderLoadingIndicator = () => (
    <div 
      className="flex justify-start mb-6 message-slide-in"
      role="status"
      aria-label="Processing research query"
      aria-live="polite"
    >
      <div className="financial-card border-blue-200 bg-blue-50 px-4 py-3 max-w-md">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-sm font-medium text-blue-700">
            Analyzing your research query...
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-slate-50 min-h-0"
      ref={chatContainerRef}
      role="log"
      aria-label="Research session history"
      aria-live="polite"
      aria-atomic="false"
      tabIndex={0}
      style={{ maxHeight: '100%' }}
    >
      {messages.length === 0 && !isLoading ? (
        renderEmptyState()
      ) : (
        <div 
          className="space-y-4"
          role="list"
          aria-label={`${messages.length} research exchanges`}
        >
          {messages
            .filter(message => message.content !== null && message.content !== undefined)
            .map((message, index) => (
              <MessageItem 
                key={message.id} 
                message={message}
                isLatest={index === messages.length - 1}
              />
            ))}
          {isLoading && renderLoadingIndicator()}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;