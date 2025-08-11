import { renderHook, act } from '@testing-library/react';
import { useChatState } from '../useChatState';
import { Message } from '../../types';

// Mock the messageUtils
jest.mock('../../utils/messageUtils', () => ({
  createMessage: jest.fn((content: string, type: string, source?: string) => ({
    id: `mock-id-${Date.now()}`,
    content,
    type,
    timestamp: new Date(),
    source,
  })),
}));

describe('useChatState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useChatState());

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.currentInput).toBe('');
  });

  describe('addMessage', () => {
    it('should add a user message', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.addMessage('Hello world', 'user');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toMatchObject({
        content: 'Hello world',
        type: 'user',
      });
    });

    it('should add an assistant message with source', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.addMessage('Hello back', 'assistant', 'local');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toMatchObject({
        content: 'Hello back',
        type: 'assistant',
        source: 'local',
      });
    });

    it('should add an error message', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.addMessage('Something went wrong', 'error');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toMatchObject({
        content: 'Something went wrong',
        type: 'error',
      });
    });

    it('should add multiple messages in order', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.addMessage('First message', 'user');
        result.current.addMessage('Second message', 'assistant', 'remote');
        result.current.addMessage('Third message', 'user');
      });

      expect(result.current.messages).toHaveLength(3);
      expect(result.current.messages[0].content).toBe('First message');
      expect(result.current.messages[1].content).toBe('Second message');
      expect(result.current.messages[2].content).toBe('Third message');
    });

    it('should clear error when adding a new message', () => {
      const { result } = renderHook(() => useChatState());

      // Set an error first
      act(() => {
        result.current.setError('Some error');
      });

      expect(result.current.error).toBe('Some error');

      // Add a message
      act(() => {
        result.current.addMessage('New message', 'user');
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should set loading to false', () => {
      const { result } = renderHook(() => useChatState());

      // Set loading to true first
      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      // Set loading to false
      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.setError('Network error');
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should clear error when set to null', () => {
      const { result } = renderHook(() => useChatState());

      // Set error first
      act(() => {
        result.current.setError('Some error');
      });

      expect(result.current.error).toBe('Some error');

      // Clear error
      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBe(null);
    });

    it('should stop loading when error is set', () => {
      const { result } = renderHook(() => useChatState());

      // Set loading to true first
      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      // Set error
      act(() => {
        result.current.setError('API error');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('API error');
    });
  });

  describe('setCurrentInput', () => {
    it('should update current input', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.setCurrentInput('Hello world');
      });

      expect(result.current.currentInput).toBe('Hello world');
    });

    it('should update current input multiple times', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.setCurrentInput('H');
      });

      expect(result.current.currentInput).toBe('H');

      act(() => {
        result.current.setCurrentInput('Hello');
      });

      expect(result.current.currentInput).toBe('Hello');

      act(() => {
        result.current.setCurrentInput('');
      });

      expect(result.current.currentInput).toBe('');
    });
  });

  describe('clearChat', () => {
    it('should clear all messages', () => {
      const { result } = renderHook(() => useChatState());

      // Add some messages first
      act(() => {
        result.current.addMessage('Message 1', 'user');
        result.current.addMessage('Message 2', 'assistant', 'local');
        result.current.addMessage('Message 3', 'error');
      });

      expect(result.current.messages).toHaveLength(3);

      // Clear chat
      act(() => {
        result.current.clearChat();
      });

      expect(result.current.messages).toHaveLength(0);
    });

    it('should clear error when clearing chat', () => {
      const { result } = renderHook(() => useChatState());

      // Set error and add messages
      act(() => {
        result.current.setError('Some error');
        result.current.addMessage('Message 1', 'user');
      });

      expect(result.current.error).toBe(null); // Error cleared by addMessage
      
      // Set error again
      act(() => {
        result.current.setError('Another error');
      });

      expect(result.current.error).toBe('Another error');

      // Clear chat
      act(() => {
        result.current.clearChat();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.messages).toHaveLength(0);
    });

    it('should not affect loading state when clearing chat', () => {
      const { result } = renderHook(() => useChatState());

      // Set loading and add messages
      act(() => {
        result.current.setLoading(true);
        result.current.addMessage('Message 1', 'user');
      });

      expect(result.current.isLoading).toBe(true);

      // Clear chat
      act(() => {
        result.current.clearChat();
      });

      expect(result.current.isLoading).toBe(true); // Loading state preserved
      expect(result.current.messages).toHaveLength(0);
    });

    it('should not affect current input when clearing chat', () => {
      const { result } = renderHook(() => useChatState());

      // Set input and add messages
      act(() => {
        result.current.setCurrentInput('Current input');
        result.current.addMessage('Message 1', 'user');
      });

      expect(result.current.currentInput).toBe('Current input');

      // Clear chat
      act(() => {
        result.current.clearChat();
      });

      expect(result.current.currentInput).toBe('Current input'); // Input preserved
      expect(result.current.messages).toHaveLength(0);
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useChatState());

      // Set error first
      act(() => {
        result.current.setError('Some error');
      });

      expect(result.current.error).toBe('Some error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });

    it('should not affect other state when clearing error', () => {
      const { result } = renderHook(() => useChatState());

      // Set up state
      act(() => {
        result.current.addMessage('Test message', 'user');
        result.current.setLoading(true);
        result.current.setCurrentInput('Test input');
        result.current.setError('Test error');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.isLoading).toBe(false); // Loading cleared by setError
      expect(result.current.currentInput).toBe('Test input');
      expect(result.current.error).toBe('Test error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.messages).toHaveLength(1); // Messages preserved
      expect(result.current.isLoading).toBe(false); // Loading state preserved
      expect(result.current.currentInput).toBe('Test input'); // Input preserved
      expect(result.current.error).toBe(null); // Error cleared
    });
  });

  describe('state consistency', () => {
    it('should maintain state consistency across multiple operations', () => {
      const { result } = renderHook(() => useChatState());

      // Complex sequence of operations
      act(() => {
        result.current.setCurrentInput('Hello');
        result.current.setLoading(true);
        result.current.addMessage('Hello', 'user');
        result.current.setLoading(false);
        result.current.addMessage('Hi there!', 'assistant', 'local');
        result.current.setCurrentInput('');
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0]).toMatchObject({
        content: 'Hello',
        type: 'user',
      });
      expect(result.current.messages[1]).toMatchObject({
        content: 'Hi there!',
        type: 'assistant',
        source: 'local',
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.currentInput).toBe('');
    });

    it('should handle error scenarios correctly', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.setCurrentInput('Test message');
        result.current.setLoading(true);
        result.current.addMessage('Test message', 'user');
        result.current.setError('API failed');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.isLoading).toBe(false); // Cleared by setError
      expect(result.current.error).toBe('API failed');
      expect(result.current.currentInput).toBe('Test message');

      // Add error message and verify error is cleared
      act(() => {
        result.current.addMessage('Failed to send message', 'error');
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.error).toBe(null); // Cleared by addMessage
    });
  });
});