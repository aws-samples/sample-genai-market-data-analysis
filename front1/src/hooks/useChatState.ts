import { useState, useCallback } from 'react';
import { Message, ChatState } from '../types';
import { createMessage } from '../utils/messageUtils';

export interface UseChatStateReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentInput: string;
  addMessage: (content: any, type: Message['type'], source?: Message['source']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentInput: (input: string) => void;
  clearChat: () => void;
  clearError: () => void;
}

export const useChatState = (): UseChatStateReturn => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    currentInput: '',
  });

  const addMessage = useCallback((
    content: any, // Accept any type and convert to string
    type: Message['type'], 
    source?: Message['source']
  ) => {
    // Ensure content is always a string
    let stringContent = '';
    if (typeof content === 'string') {
      stringContent = content;
    } else if (content && typeof content === 'object') {
      stringContent = JSON.stringify(content, null, 2);
    } else {
      stringContent = String(content || '');
    }
    
    const newMessage = createMessage(stringContent, type, source);
    
    setState(prevState => ({
      ...prevState,
      messages: [...prevState.messages, newMessage],
      error: null, // Clear any existing errors when adding a new message
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prevState => ({
      ...prevState,
      isLoading: loading,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prevState => ({
      ...prevState,
      error,
      isLoading: false, // Stop loading when an error occurs
    }));
  }, []);

  const setCurrentInput = useCallback((input: string) => {
    setState(prevState => ({
      ...prevState,
      currentInput: input,
    }));
  }, []);

  const clearChat = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      messages: [],
      error: null,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      error: null,
    }));
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    currentInput: state.currentInput,
    addMessage,
    setLoading,
    setError,
    setCurrentInput,
    clearChat,
    clearError,
  };
};