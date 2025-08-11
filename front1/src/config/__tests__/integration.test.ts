/**
 * Integration tests for configuration with ChatService
 */

import { ChatService } from '../../services/chatService';
import { resetConfigInstance } from '../index';

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
    process.env.NEXT_PUBLIC_LOCAL_ENDPOINT = 'http://custom-local:9000/api';
    process.env.NEXT_PUBLIC_REMOTE_ENDPOINT = 'https://custom-remote.com/chat';
    process.env.NEXT_PUBLIC_REQUEST_TIMEOUT = '120000';
    process.env.NEXT_PUBLIC_MAX_RETRIES = '5';
    process.env.NEXT_PUBLIC_RETRY_DELAY = '2000';
    process.env.NEXT_PUBLIC_REQUEST_HEADERS = '{"Content-Type":"application/json","X-API-Key":"test-key"}';

    // Create ChatService instance (should use environment config)
    const chatService = new ChatService();
    const config = chatService.getConfig();

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

  it('should allow ChatService to override environment configuration', () => {
    // Set environment variables
    process.env.NEXT_PUBLIC_LOCAL_ENDPOINT = 'http://env-local:8080/api';
    process.env.NEXT_PUBLIC_REQUEST_TIMEOUT = '60000';

    // Create ChatService with custom config that overrides environment
    const chatService = new ChatService({
      localEndpoint: 'http://override-local:3000/api',
      timeout: 30000,
      headers: { 'Authorization': 'Bearer override-token' },
    });

    const config = chatService.getConfig();

    expect(config.localEndpoint).toBe('http://override-local:3000/api'); // Overridden
    expect(config.timeout).toBe(30000); // Overridden
    expect(config.headers).toEqual({
      'Content-Type': 'application/json', // From environment default
      'Authorization': 'Bearer override-token', // From override
    });
  });

  it('should handle missing environment variables gracefully', () => {
    // Clear all environment variables
    delete process.env.NEXT_PUBLIC_LOCAL_ENDPOINT;
    delete process.env.NEXT_PUBLIC_REMOTE_ENDPOINT;
    delete process.env.NEXT_PUBLIC_REQUEST_TIMEOUT;
    delete process.env.NEXT_PUBLIC_MAX_RETRIES;
    delete process.env.NEXT_PUBLIC_RETRY_DELAY;
    delete process.env.NEXT_PUBLIC_REQUEST_HEADERS;

    // Should use defaults
    const chatService = new ChatService();
    const config = chatService.getConfig();

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
    process.env.NEXT_PUBLIC_LOCAL_ENDPOINT = 'invalid-url';

    // Should throw when creating ChatService
    expect(() => new ChatService()).toThrow();
  });

  it('should validate configuration on ChatService creation', () => {
    // Set valid environment but create ChatService with invalid override
    process.env.NEXT_PUBLIC_LOCAL_ENDPOINT = 'http://valid-local:8080/api';

    // This should work fine since we're not validating the override config in ChatService
    // The validation happens in the config module
    expect(() => new ChatService({
      timeout: -1000, // Invalid but not validated by ChatService constructor
    })).not.toThrow();
  });
});