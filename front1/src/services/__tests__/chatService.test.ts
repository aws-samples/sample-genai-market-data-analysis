/**
 * Unit tests for ChatService
 */

import { ChatService, ChatServiceError } from '../chatService';
import { ChatResponse } from '../../types';

// Mock the config module
jest.mock('../../config', () => ({
  getConfigInstance: jest.fn(() => ({
    localEndpoint: 'http://127.0.0.1:8080/invocations',
    remoteEndpoint: '',
    timeout: 900000,
    maxRetries: 3,
    retryDelay: 1000,
    headers: {
      'Content-Type': 'application/json',
    },
  })),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock setTimeout and clearTimeout
const mockSetTimeout = jest.fn();
const mockClearTimeout = jest.fn();
global.setTimeout = mockSetTimeout;
global.clearTimeout = mockClearTimeout;

describe('ChatService', () => {
  let chatService: ChatService;
  let mockAbortController: {
    abort: jest.Mock;
    signal: AbortSignal;
  };

  beforeEach(() => {
    chatService = new ChatService();

    // Mock AbortController
    mockAbortController = {
      abort: jest.fn(),
      signal: {} as AbortSignal,
    };

    global.AbortController = jest.fn(() => mockAbortController) as any;

    // Reset mocks
    mockFetch.mockReset();
    mockSetTimeout.mockReset();
    mockClearTimeout.mockReset();
    mockSetTimeout.mockImplementation((callback, delay) => {
      return 123; // Return a mock timer ID
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const service = new ChatService();
      const config = service.getConfig();

      expect(config.localEndpoint).toBe('http://127.0.0.1:8080/invocations');
      expect(config.remoteEndpoint).toBe('');
      expect(config.timeout).toBe(900000); // 15 minutes
      expect(config.headers).toEqual({
        'Content-Type': 'application/json',
      });
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        localEndpoint: 'http://localhost:3000/api',
        remoteEndpoint: 'https://api.example.com/chat',
        timeout: 30000,
        headers: { 'Authorization': 'Bearer token' },
      };

      const service = new ChatService(customConfig);
      const config = service.getConfig();

      expect(config.localEndpoint).toBe(customConfig.localEndpoint);
      expect(config.remoteEndpoint).toBe(customConfig.remoteEndpoint);
      expect(config.timeout).toBe(customConfig.timeout);
      expect(config.headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
      });
    });
  });

  describe('sendToLocal', () => {
    const mockSuccessResponse: ChatResponse = {
      response: 'Hello from local endpoint',
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });
    });

    it('should send message to local endpoint successfully', async () => {
      const message = 'Hello world';
      const result = await chatService.sendToLocal(message);

      expect(result).toBe('Hello from local endpoint');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8080/invocations',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: message }),
          signal: mockAbortController.signal,
        }
      );
    });

    it('should throw error for empty message', async () => {
      await expect(chatService.sendToLocal('')).rejects.toThrow(
        new ChatServiceError('Message cannot be empty', 'config')
      );

      await expect(chatService.sendToLocal('   ')).rejects.toThrow(
        new ChatServiceError('Message cannot be empty', 'config')
      );
    });

    it('should handle API error response', async () => {
      const errorResponse: ChatResponse = {
        error: 'Internal server error',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(chatService.sendToLocal('test')).rejects.toThrow(
        new ChatServiceError('Internal server error', 'api')
      );
    });

    it('should handle HTTP error status', async () => {
      // Mock delay to avoid actual delays
      jest.spyOn(chatService as any, 'delay').mockResolvedValue(undefined);

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(chatService.sendToLocal('test')).rejects.toThrow(
        new ChatServiceError('HTTP 500: Internal Server Error', 'api', 500, true)
      );
    });

    it('should handle network error', async () => {
      // Mock delay to avoid actual delays
      jest.spyOn(chatService as any, 'delay').mockResolvedValue(undefined);

      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(chatService.sendToLocal('test')).rejects.toThrow(
        new ChatServiceError('Network error: Unable to connect', 'network', undefined, true)
      );
    });

    it('should handle timeout', async () => {
      // Mock delay to avoid actual delays
      jest.spyOn(chatService as any, 'delay').mockResolvedValue(undefined);

      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      await expect(chatService.sendToLocal('test')).rejects.toThrow(
        new ChatServiceError('Request timeout', 'timeout', undefined, true)
      );
    });

    it('should handle invalid response format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}), // Missing response field
      });

      await expect(chatService.sendToLocal('test')).rejects.toThrow(
        new ChatServiceError('Invalid response format: missing response field', 'api')
      );
    });

    it('should set up and clear timeout correctly', async () => {
      await chatService.sendToLocal('test');

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 900000);
      expect(mockClearTimeout).toHaveBeenCalled();
    });
  });

  describe('sendToRemote', () => {
    const mockSuccessResponse: ChatResponse = {
      response: 'Hello from remote endpoint',
    };

    beforeEach(() => {
      chatService.updateConfig({ remoteEndpoint: 'https://api.example.com/chat' });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });
    });

    it('should send message to remote endpoint successfully', async () => {
      const message = 'Hello remote';
      const result = await chatService.sendToRemote(message);

      expect(result).toBe('Hello from remote endpoint');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/chat',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: message }),
          signal: mockAbortController.signal,
        }
      );
    });

    it('should throw error when remote endpoint not configured', async () => {
      const serviceWithoutRemote = new ChatService();

      await expect(serviceWithoutRemote.sendToRemote('test')).rejects.toThrow(
        new ChatServiceError('Remote endpoint not configured', 'config')
      );
    });

    it('should throw error for empty message', async () => {
      await expect(chatService.sendToRemote('')).rejects.toThrow(
        new ChatServiceError('Message cannot be empty', 'config')
      );
    });

    it('should handle remote endpoint errors with proper context', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      await expect(chatService.sendToRemote('test')).rejects.toThrow(
        new ChatServiceError('Connection refused', 'api')
      );
    });
  });

  describe('updateConfig', () => {
    it('should update configuration partially', () => {
      const newConfig = {
        timeout: 60000,
        headers: { 'Authorization': 'Bearer new-token' },
      };

      chatService.updateConfig(newConfig);
      const config = chatService.getConfig();

      expect(config.timeout).toBe(60000);
      expect(config.headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer new-token',
      });
      expect(config.localEndpoint).toBe('http://127.0.0.1:8080/invocations'); // Should remain unchanged
    });

    it('should merge headers correctly', () => {
      chatService.updateConfig({
        headers: { 'X-Custom-Header': 'value1' },
      });

      chatService.updateConfig({
        headers: { 'Authorization': 'Bearer token' },
      });

      const config = chatService.getConfig();
      expect(config.headers).toEqual({
        'Content-Type': 'application/json',
        'X-Custom-Header': 'value1',
        'Authorization': 'Bearer token',
      });
    });
  });

  describe('error handling', () => {
    it('should preserve ChatServiceError instances', async () => {
      const originalError = new ChatServiceError('Original error', 'api', 400);
      mockFetch.mockRejectedValue(originalError);

      try {
        await chatService.sendToLocal('test');
      } catch (error) {
        expect(error).toBe(originalError);
        expect(error).toBeInstanceOf(ChatServiceError);
        expect((error as ChatServiceError).type).toBe('api');
        expect((error as ChatServiceError).statusCode).toBe(400);
      }
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValue('string error');

      await expect(chatService.sendToLocal('test')).rejects.toThrow(
        new ChatServiceError('Unknown error occurred', 'api')
      );
    });
  });

  describe('retry mechanism', () => {
    beforeEach(() => {
      chatService = new ChatService({ maxRetries: 2, retryDelay: 100 });
      // Mock the delay method to avoid actual delays in tests
      jest.spyOn(chatService as any, 'delay').mockResolvedValue(undefined);
    });

    it('should retry on network errors', async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ response: 'Success after retry' }),
        });

      const result = await chatService.sendToLocal('test');
      expect(result).toBe('Success after retry');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should retry on timeout errors', async () => {
      const timeoutError = new Error('AbortError');
      timeoutError.name = 'AbortError';

      mockFetch
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ response: 'Success after timeout retry' }),
        });

      const result = await chatService.sendToLocal('test');
      expect(result).toBe('Success after timeout retry');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on 5xx server errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ response: 'Success after server error retry' }),
        });

      const result = await chatService.sendToLocal('test');
      expect(result).toBe('Success after server error retry');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx client errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(chatService.sendToLocal('test')).rejects.toThrow(
        new ChatServiceError('HTTP 400: Bad Request', 'api', 400, false)
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on configuration errors', async () => {
      await expect(chatService.sendToLocal('')).rejects.toThrow(
        new ChatServiceError('Message cannot be empty', 'config')
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should exhaust all retries and throw last error', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(chatService.sendToLocal('test')).rejects.toThrow(
        new ChatServiceError('Network error: Unable to connect', 'network', undefined, true)
      );
      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use exponential backoff for retry delays', async () => {
      // Mock the delay method to track calls
      const originalDelay = (chatService as any).delay;
      const delaySpy = jest.fn().mockResolvedValue(undefined);
      (chatService as any).delay = delaySpy;

      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      try {
        await chatService.sendToLocal('test');
      } catch (error) {
        // Expected to fail
      }

      expect(delaySpy).toHaveBeenCalledWith(100); // First retry: 100ms
      expect(delaySpy).toHaveBeenCalledWith(200); // Second retry: 200ms

      // Restore original method
      (chatService as any).delay = originalDelay;
    });
  });

  describe('ChatServiceError', () => {
    it('should create error with all properties', () => {
      const error = new ChatServiceError('Test error', 'network', 404, true);

      expect(error.message).toBe('Test error');
      expect(error.type).toBe('network');
      expect(error.statusCode).toBe(404);
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('ChatServiceError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create error without status code and default retryable to false', () => {
      const error = new ChatServiceError('Test error', 'timeout');

      expect(error.message).toBe('Test error');
      expect(error.type).toBe('timeout');
      expect(error.statusCode).toBeUndefined();
      expect(error.isRetryable).toBe(false);
    });

    it('should create retryable error', () => {
      const error = new ChatServiceError('Test error', 'network', undefined, true);

      expect(error.isRetryable).toBe(true);
    });
  });
});