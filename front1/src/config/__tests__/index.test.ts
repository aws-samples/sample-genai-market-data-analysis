/**
 * Tests for configuration module
 */

import { 
  loadConfigSync, 
  validateConfig, 
  getConfigSync, 
  resetConfigInstance,
  ConfigError,
  AppConfig 
} from '../index';

// Mock process.env
const originalEnv = process.env;

describe('Configuration Module', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    resetConfigInstance();
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('loadConfigSync', () => {
    it('should load default configuration when no environment variables are set', () => {
      // Clear all relevant env vars
      delete process.env.LOCAL_ENDPOINT;
      delete process.env.REMOTE_ENDPOINT;
      delete process.env.REQUEST_TIMEOUT;
      delete process.env.MAX_RETRIES;
      delete process.env.RETRY_DELAY;
      delete process.env.REQUEST_HEADERS;

      const config = loadConfigSync();

      expect(config).toEqual({
        localEndpoint: 'http://127.0.0.1:8080/invocations',
        remoteEndpoint: '',
        timeout: 900000,
        maxRetries: 3,
        retryDelay: 1000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should load configuration from environment variables', () => {
      process.env.LOCAL_ENDPOINT = 'http://localhost:3000/api/local';
      process.env.REMOTE_ENDPOINT = 'https://api.example.com/chat';
      process.env.REQUEST_TIMEOUT = '60000';
      process.env.MAX_RETRIES = '5';
      process.env.RETRY_DELAY = '2000';
      process.env.REQUEST_HEADERS = '{"Content-Type":"application/json","Authorization":"Bearer token"}';

      const config = loadConfigSync();

      expect(config).toEqual({
        localEndpoint: 'http://localhost:3000/api/local',
        remoteEndpoint: 'https://api.example.com/chat',
        timeout: 60000,
        maxRetries: 5,
        retryDelay: 2000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token',
        },
      });
    });

    it('should allow empty remote endpoint', () => {
      process.env.LOCAL_ENDPOINT = 'http://localhost:3000/api/local';
      process.env.REMOTE_ENDPOINT = '';

      const config = loadConfigSync();

      expect(config.localEndpoint).toBe('http://localhost:3000/api/local');
      expect(config.remoteEndpoint).toBe('');
    });

    it('should throw ConfigError for invalid local endpoint URL', () => {
      process.env.LOCAL_ENDPOINT = 'invalid-url';

      expect(() => loadConfigSync()).toThrow(ConfigError);
      expect(() => loadConfigSync()).toThrow('LOCAL_ENDPOINT must be a valid URL');
    });

    it('should throw ConfigError for invalid remote endpoint URL', () => {
      process.env.REMOTE_ENDPOINT = 'invalid-url';

      expect(() => loadConfigSync()).toThrow(ConfigError);
      expect(() => loadConfigSync()).toThrow('REMOTE_ENDPOINT must be a valid URL');
    });

    it('should throw ConfigError for invalid timeout value', () => {
      process.env.REQUEST_TIMEOUT = 'invalid';

      expect(() => loadConfigSync()).toThrow(ConfigError);
      expect(() => loadConfigSync()).toThrow('REQUEST_TIMEOUT must be a positive integer');
    });

    it('should throw ConfigError for negative timeout value', () => {
      process.env.REQUEST_TIMEOUT = '-1000';

      expect(() => loadConfigSync()).toThrow(ConfigError);
      expect(() => loadConfigSync()).toThrow('REQUEST_TIMEOUT must be a positive integer');
    });

    it('should throw ConfigError for invalid max retries value', () => {
      process.env.MAX_RETRIES = 'invalid';

      expect(() => loadConfigSync()).toThrow(ConfigError);
      expect(() => loadConfigSync()).toThrow('MAX_RETRIES must be a non-negative integer');
    });

    it('should throw ConfigError for negative max retries value', () => {
      process.env.MAX_RETRIES = '-1';

      expect(() => loadConfigSync()).toThrow(ConfigError);
      expect(() => loadConfigSync()).toThrow('MAX_RETRIES must be a non-negative integer');
    });

    it('should throw ConfigError for invalid retry delay value', () => {
      process.env.RETRY_DELAY = 'invalid';

      expect(() => loadConfigSync()).toThrow(ConfigError);
      expect(() => loadConfigSync()).toThrow('RETRY_DELAY must be a positive integer');
    });

    it('should throw ConfigError for invalid JSON headers', () => {
      process.env.REQUEST_HEADERS = 'invalid-json';

      expect(() => loadConfigSync()).toThrow(ConfigError);
      expect(() => loadConfigSync()).toThrow('Invalid JSON format for REQUEST_HEADERS');
    });

    it('should throw ConfigError for non-object JSON headers', () => {
      process.env.REQUEST_HEADERS = '["array", "not", "object"]';

      expect(() => loadConfigSync()).toThrow(ConfigError);
      expect(() => loadConfigSync()).toThrow('REQUEST_HEADERS must be a valid JSON object');
    });

    it('should merge custom headers with default headers', () => {
      process.env.REQUEST_HEADERS = '{"Authorization":"Bearer token","Custom-Header":"value"}';

      const config = loadConfigSync();

      expect(config.headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
        'Custom-Header': 'value',
      });
    });

    it('should allow overriding default Content-Type header', () => {
      process.env.REQUEST_HEADERS = '{"Content-Type":"application/xml"}';

      const config = loadConfigSync();

      expect(config.headers['Content-Type']).toBe('application/xml');
    });
  });

  describe('validateConfig', () => {
    it('should pass validation for valid configuration', () => {
      const validConfig: AppConfig = {
        localEndpoint: 'http://localhost:3000/api/local',
        remoteEndpoint: 'https://api.example.com/chat',
        timeout: 60000,
        maxRetries: 3,
        retryDelay: 1000,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    it('should throw ConfigError for missing local endpoint', () => {
      const invalidConfig: AppConfig = {
        localEndpoint: '',
        remoteEndpoint: '',
        timeout: 60000,
        maxRetries: 3,
        retryDelay: 1000,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      expect(() => validateConfig(invalidConfig)).toThrow(ConfigError);
      expect(() => validateConfig(invalidConfig)).toThrow('Local endpoint is required');
    });

    it('should throw ConfigError for invalid timeout', () => {
      const invalidConfig: AppConfig = {
        localEndpoint: 'http://localhost:3000/api/local',
        remoteEndpoint: '',
        timeout: 0,
        maxRetries: 3,
        retryDelay: 1000,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      expect(() => validateConfig(invalidConfig)).toThrow(ConfigError);
      expect(() => validateConfig(invalidConfig)).toThrow('Timeout must be greater than 0');
    });

    it('should allow zero max retries', () => {
      const validConfig: AppConfig = {
        localEndpoint: 'http://localhost:3000/api/local',
        remoteEndpoint: '',
        timeout: 60000,
        maxRetries: 0,
        retryDelay: 1000,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      expect(() => validateConfig(validConfig)).not.toThrow();
    });
  });

  describe('getConfigSync', () => {
    it('should return valid configuration', () => {
      process.env.LOCAL_ENDPOINT = 'http://localhost:3000/api/local';

      const config = getConfigSync();

      expect(config).toBeDefined();
      expect(config.localEndpoint).toBe('http://localhost:3000/api/local');
    });

    it('should throw ConfigError for invalid configuration', () => {
      process.env.LOCAL_ENDPOINT = 'invalid-url';

      expect(() => getConfigSync()).toThrow(ConfigError);
    });
  });

  describe('ConfigError', () => {
    it('should create error with message and field', () => {
      const error = new ConfigError('Test error', 'testField');

      expect(error.message).toBe('Test error');
      expect(error.field).toBe('testField');
      expect(error.name).toBe('ConfigError');
    });

    it('should create error with message only', () => {
      const error = new ConfigError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.field).toBeUndefined();
      expect(error.name).toBe('ConfigError');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string environment variables', () => {
      process.env.LOCAL_ENDPOINT = 'http://localhost:3000/api/local';
      process.env.REMOTE_ENDPOINT = '';
      process.env.REQUEST_TIMEOUT = '';
      process.env.MAX_RETRIES = '';
      process.env.RETRY_DELAY = '';
      process.env.REQUEST_HEADERS = '';

      const config = loadConfigSync();

      expect(config.localEndpoint).toBe('http://localhost:3000/api/local');
      expect(config.remoteEndpoint).toBe('');
      expect(config.timeout).toBe(900000); // default
      expect(config.maxRetries).toBe(3); // default
      expect(config.retryDelay).toBe(1000); // default
      expect(config.headers).toEqual({ 'Content-Type': 'application/json' }); // default
    });

    it('should handle zero values correctly', () => {
      process.env.LOCAL_ENDPOINT = 'http://localhost:3000/api/local';
      process.env.MAX_RETRIES = '0';

      const config = loadConfigSync();

      expect(config.maxRetries).toBe(0);
    });

    it('should handle whitespace in URLs by trimming them', () => {
      process.env.LOCAL_ENDPOINT = '  http://localhost:3000/api/local  ';

      const config = loadConfigSync();
      expect(config.localEndpoint).toBe('http://localhost:3000/api/local');
    });
  });
});