/**
 * Integration tests for configuration with ChatService
 */

import { ChatService } from '../../services/chatService';
import { resetConfigInstance, getConfigSync } from '../index';

// Mock process.env
const originalEnv = process.env;

describe('Configuration Integration', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    resetConfigInstance();
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should use environment configuration in ChatService', () => {
    // Set custom environment variables
    process.env.LOCAL_ENDPOINT = 'http://custom-local:9000/api';
    process.env.REMOTE_ENDPOINT = 'https://custom-remote.com/chat';
    process.env.REQUEST_TIMEOUT = '120000';
    process.env.MAX_RETRIES = '5';
    process.env.RETRY_DELAY = '2000';
    process.env.REQUEST_HEADERS = '{"Content-Type":"application/json","X-API-Key":"test-key"}';

    // Load config and create ChatService instance
    const config = getConfigSync();
    const chatService = new ChatService({
      localEndpoint: config.localEndpoint,
      remoteEndpoint: config.remoteEndpoint,
      timeout: config.timeout,
      maxRetries: config.maxRetries,
      retryDelay: config.retryDelay,
      headers: config.headers,
    });

    expect(chatService).toBeDefined();
    expect(config.localEndpoint).toBe('http://custom-local:9000/api');
    expect(config.remoteEndpoint).toBe('https://custom-remote.com/chat');
    expect(config.timeout).toBe(120000);
    expect(config.maxRetries).toBe(5);
    expect(config.retryDelay).toBe(2000);
    expect(config.headers).toEqual({
      'Content-Type': 'application/json',
      'X-API-Key': 'test-key',
    });
  });

  it('should allow ChatService to use custom configuration', () => {
    // Create ChatService with custom config
    const customConfig = {
      localEndpoint: 'http://override-local:3000/api',
      remoteEndpoint: 'https://override-remote.com/chat',
      timeout: 30000,
      maxRetries: 2,
      retryDelay: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer override-token' 
      },
    };

    const chatService = new ChatService(customConfig);
    expect(chatService).toBeDefined();
  });

  it('should handle missing environment variables gracefully', () => {
    // Clear all environment variables
    delete process.env.LOCAL_ENDPOINT;
    delete process.env.REMOTE_ENDPOINT;
    delete process.env.REQUEST_TIMEOUT;
    delete process.env.MAX_RETRIES;
    delete process.env.RETRY_DELAY;
    delete process.env.REQUEST_HEADERS;

    // Should use defaults
    const config = getConfigSync();
    const chatService = new ChatService({
      localEndpoint: config.localEndpoint,
      remoteEndpoint: config.remoteEndpoint,
      timeout: config.timeout,
      maxRetries: config.maxRetries,
      retryDelay: config.retryDelay,
      headers: config.headers,
    });

    expect(chatService).toBeDefined();
    expect(config.localEndpoint).toBe('http://127.0.0.1:8080/invocations');
    expect(config.remoteEndpoint).toBe('');
    expect(config.timeout).toBe(900000);
    expect(config.maxRetries).toBe(3);
    expect(config.retryDelay).toBe(1000);
    expect(config.headers).toEqual({
      'Content-Type': 'application/json',
    });
  });

  it('should throw error for invalid environment configuration', () => {
    // Set invalid environment variable
    process.env.LOCAL_ENDPOINT = 'invalid-url';

    // Should throw when loading config
    expect(() => getConfigSync()).toThrow();
  });

  it('should validate configuration on load', () => {
    // Set valid environment
    process.env.LOCAL_ENDPOINT = 'http://valid-local:8080/api';

    // Should not throw
    expect(() => getConfigSync()).not.toThrow();
  });
});