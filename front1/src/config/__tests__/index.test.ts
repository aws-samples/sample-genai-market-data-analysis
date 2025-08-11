/**
 * Tests for configuration module
 */

import { 
  loadConfig, 
  validateConfig, 
  getConfig, 
  getConfigInstance, 
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

  describe('loadConfig', () => {
    it('should load default configuration when no environment variables are set', () => {
      // Clear all relevant env vars
      delete process.env.NEXT_PUBLIC_LOCAL_ENDPOINT;
      delete process.env.NEXT_PUBLIC_REMOTE_ENDPOINT;
      delete process.env.NEXT_PUBLIC_REQUEST_TIMEOUT;
      delete process.env.NEXT_PUBLIC_MAX_RETRIES;
      delete process.env.NEXT_PUBLIC_RETRY_DELAY;
      delete process.env.NEXT_PUBLIC_REQUEST_HEADERS;

      const config = loadConfig();

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
      process.env.NEXT_PUBLIC_LOCAL_ENDPOINT = 'http://localhost:3000/api/local';
      process.env.NEXT_PUBLIC_REMOTE_ENDPOINT = 'https://api.example.com/chat';
      process.env.NEXT_PUBLIC_REQUEST_TIMEOUT = '60000';
      process.env.NEXT_PUBLIC_MAX_RETRIES = '5';
      process.env.NEXT_PUBLIC_RETRY_DELAY = '2000';
      process.env.NEXT_PUBLIC_REQUEST_HEADERS = '{"Content-Type":"application/json","Authorization":"Bearer token"}';

      const config = loadConfig();

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
      process.env.NEXT_PUBLIC_LOCAL_ENDPOINT = 'http://localhost:3000/api/local';
      process.env.NEXT_PUBLIC_REMOTE_ENDPOINT = '';

      const config = loadConfig();

      expect(config.localEndpoint).toBe('http://localhost:3000/api/local');
      expect(config.remoteEndpoint).toBe('');
    });

    it('should throw ConfigError for invalid local endpoint URL', () => {
      process.env.NEXT_PUBLIC_LOCAL_ENDPOINT = 'invalid-url';

      expect(() => loadConfig()).toThrow(ConfigError);
      expect(() => loadConfig()).toThrow('NEXT_PUBLIC_LOCAL_ENDPOINT must be a valid URL');
    });

    it('should throw ConfigError for invalid remote endpoint URL', () => {
      process.env.NEXT_PUBLIC_REMOTE_ENDPOINT = 'invalid-url';

      expect(() => loadConfig()).toThrow(ConfigError);
      expect(() => loadConfig()).toThrow('NEXT_PUBLIC_REMOTE_ENDPOINT must be a valid URL');
    });

    it('should throw ConfigError for invalid timeout value', () => {
      process.env.NEXT_PUBLIC_REQUEST_TIMEOUT = 'invalid';

      expect(() => loadConfig()).toThrow(ConfigError);
      expect(() => loadConfig()).toThrow('NEXT_PUBLIC_REQUEST_TIMEOUT must be a positive integer');
    });

    it('should throw ConfigError for negative timeout value', () => {
      process.env.NEXT_PUBLIC_REQUEST_TIMEOUT = '-1000';

      expect(() => loadConfig()).toThrow(ConfigError);
      expect(() => loadConfig()).toThrow('NEXT_PUBLIC_REQUEST_TIMEOUT must be a positive integer');
    });

    it('should throw ConfigError for invalid max retries value', () => {
      process.env.NEXT_PUBLIC_MAX_RETRIES = 'invalid';

      expect(() => loadConfig()).toThrow(ConfigError);
      expect(() => loadConfig()).toThrow('NEXT_PUBLIC_MAX_RETRIES must be a non-negative integer');
    });

    it('should throw ConfigError for negative max retries value', () => {
      process.env.NEXT_PUBLIC_MAX_RETRIES = '-1';

      expect(() => loadConfig()).toThrow(ConfigError);
      expect(() => loadConfig()).toThrow('NEXT_PUBLIC_MAX_RETRIES must be a non-negative integer');
    });

    it('should throw ConfigError for invalid retry delay value', () => {
      process.env.NEXT_PUBLIC_RETRY_DELAY = 'invalid';

      expect(() => loadConfig()).toThrow(ConfigError);
      expect(() => loadConfig()).toThrow('NEXT_PUBLIC_RETRY_DELAY must be a positive integer');
    });

    it('should throw ConfigError for invalid JSON headers', () => {
      process.env.NEXT_PUBLIC_REQUEST_HEADERS = 'invalid-json';

      expect(() => loadConfig()).toThrow(ConfigError);
      expect(() => loadConfig()).toThrow('Invalid JSON format for NEXT_PUBLIC_REQUEST_HEADERS');
    });

    it('should throw ConfigError for non-object JSON headers', () => {
      process.env.NEXT_PUBLIC_REQUEST_HEADERS = '["array", "not", "object"]';

      expect(() => loadConfig()).toThrow(ConfigError);
      expect(() => loadConfig()).toThrow('NEXT_PUBLIC_REQUEST_HEADERS must be a valid JSON object');
    });

    it('should merge custom headers with default headers', () => {
      process.env.NEXT_PUBLIC_REQUEST_HEADERS = '{"Authorization":"Bearer token","Custom-Header":"value"}';

      const config = loadConfig();

      expect(config.headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
        'Custom-Header': 'value',
      });
    });

    it('should allow overriding default Content-Type header', () => {
      process.env.NEXT_PUBLIC_REQUEST_HEADERS = '{"Content-Type":"application/xml"}';

      const config = loadConfig();

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

    it('should throw ConfigError for negative max retries', () => {
      const invalidConfig: AppConfig = {
        localEndpoint: 'http://localhost:3000/api/local',
        remoteEndpoint: '',
        timeout: 60000,
        maxRetries: -1,
        retryDelay: 1000,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      expect(() => validateConfig(invalidConfig)).toThrow(ConfigError);
      expect(() => validateConfig(invalidConfig)).toThrow('Max retries must be 0 or greater');
    });

    it('should throw ConfigError for invalid retry delay', () => {
      const invalidConfig: AppConfig = {
        localEndpoint: 'http://localhost:3000/api/local',
        remoteEndpoint: '',
        timeout: 60000,
        maxRetries: 3,
        retryDelay: 0,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      expect(() => validateConfig(invalidConfig)).toThrow(ConfigError);
      expect(() => validateConfig(invalidConfig)).toThrow('Retry delay must be greater than 0');
    });

    it('should throw ConfigError for invalid headers', () => {
      const invalidConfig: AppConfig = {
        localEndpoint: 'http://localhost:3000/api/local',
        remoteEndpoint: '',
        timeout: 60000,
        maxRetries: 3,
        retryDelay: 1000,
        headers: null as any,
      };

      expect(() => validateConfig(invalidConfig)).toThrow(ConfigError);
      expect(() => validateConfig(invalidConfig)).toThrow('Headers must be a valid object');
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

  describe('getConfig', () => {
    it('should return valid configuration', () => {
      process.env.NEXT_PUBLIC_LOCAL_ENDPOINT = 'http://localhost:3000/api/local';

      const config = getConfig();

      expect(config).toBeDefined();
      expect(config.localEndpoint).toBe('http://localhost:3000/api/local');
    });

    it('should throw ConfigError for invalid configuration', () => {
      process.env.NEXT_PUBLIC_LOCAL_ENDPOINT = 'invalid-url';

      expect(() => getConfig()).toThrow(ConfigError);
    });
  });

  describe('getConfigInstance', () => {
    it('should return the same instance on multiple calls', () => {
      process.env.NEXT_PUBLIC_LOCAL_ENDPOINT = 'http://localhost:3000/api/local';

      const config1 = getConfigInstance();
      const config2 = getConfigInstance();

      expect(config1).toBe(config2);
    });

    it('should create new instance after reset', () => {
      process.env.NEXT_PUBLIC_LOCAL_ENDPOINT = 'http://localhost:3000/api/local';

      const config1 = getConfigInstance();
      resetConfigInstance();
      const config2 = getConfigInstance();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
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
      process.env.NEXT_PUBLIC_LOCAL_ENDPOINT = 'http://localhost:3000/api/local';
      process.env.NEXT_PUBLIC_REMOTE_ENDPOINT = '';
      process.env.NEXT_PUBLIC_REQUEST_TIMEOUT = '';
      process.env.NEXT_PUBLIC_MAX_RETRIES = '';
      process.env.NEXT_PUBLIC_RETRY_DELAY = '';
      process.env.NEXT_PUBLIC_REQUEST_HEADERS = '';

      const config = loadConfig();

      expect(config.localEndpoint).toBe('http://localhost:3000/api/local');
      expect(config.remoteEndpoint).toBe('');
      expect(config.timeout).toBe(900000); // default
      expect(config.maxRetries).toBe(3); // default
      expect(config.retryDelay).toBe(1000); // default
      expect(config.headers).toEqual({ 'Content-Type': 'application/json' }); // default
    });

    it('should handle zero values correctly', () => {
      process.env.NEXT_PUBLIC_LOCAL_ENDPOINT = 'http://localhost:3000/api/local';
      process.env.NEXT_PUBLIC_MAX_RETRIES = '0';

      const config = loadConfig();

      expect(config.maxRetries).toBe(0);
    });

    it('should handle whitespace in URLs by trimming them', () => {
      process.env.NEXT_PUBLIC_LOCAL_ENDPOINT = '  http://localhost:3000/api/local  ';

      const config = loadConfig();
      expect(config.localEndpoint).toBe('http://localhost:3000/api/local');
    });
  });
});