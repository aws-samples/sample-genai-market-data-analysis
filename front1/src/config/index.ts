/**
 * Configuration module for the chat application
 * Loads and validates environment variables
 */

export interface AppConfig {
  localEndpoint: string;
  remoteEndpoint: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  headers: Record<string, string>;
}

export class ConfigError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: AppConfig = {
  localEndpoint: 'http://127.0.0.1:8080/invocations',
  remoteEndpoint: '',
  timeout: 900000, // 15 minutes
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Parse JSON string safely
 */
function parseJsonSafely(jsonString: string, fieldName: string): Record<string, string> {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new ConfigError(`${fieldName} must be a valid JSON object`, fieldName);
    }
    return parsed;
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    throw new ConfigError(`Invalid JSON format for ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`, fieldName);
  }
}

/**
 * Validate and parse a non-negative integer
 */
function parseNonNegativeInteger(value: string, fieldName: string, defaultValue: number): number {
  if (!value) {
    return defaultValue;
  }
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 0) {
    throw new ConfigError(`${fieldName} must be a non-negative integer, got: ${value}`, fieldName);
  }
  
  return parsed;
}

/**
 * Validate and parse a positive integer
 */
function parsePositiveInteger(value: string, fieldName: string, defaultValue: number): number {
  if (!value) {
    return defaultValue;
  }
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new ConfigError(`${fieldName} must be a positive integer, got: ${value}`, fieldName);
  }
  
  return parsed;
}

/**
 * Validate URL format
 */
function validateUrl(url: string, fieldName: string, required: boolean = true): string {
  if (!url || !url.trim()) {
    if (required) {
      throw new ConfigError(`${fieldName} is required`, fieldName);
    }
    return '';
  }
  
  const trimmedUrl = url.trim();
  try {
    new URL(trimmedUrl);
    return trimmedUrl;
  } catch {
    throw new ConfigError(`${fieldName} must be a valid URL, got: ${url}`, fieldName);
  }
}

/**
 * Load configuration from environment variables
 */
export function loadConfig(): AppConfig {
  const errors: string[] = [];
  
  try {
    // Load and validate endpoints
    const localEndpoint = validateUrl(
      process.env.NEXT_PUBLIC_LOCAL_ENDPOINT || DEFAULT_CONFIG.localEndpoint,
      'NEXT_PUBLIC_LOCAL_ENDPOINT',
      true
    );
    
    const remoteEndpoint = validateUrl(
      process.env.NEXT_PUBLIC_REMOTE_ENDPOINT || DEFAULT_CONFIG.remoteEndpoint,
      'NEXT_PUBLIC_REMOTE_ENDPOINT',
      false
    );
    
    // Load and validate numeric values
    const timeout = parsePositiveInteger(
      process.env.NEXT_PUBLIC_REQUEST_TIMEOUT || '',
      'NEXT_PUBLIC_REQUEST_TIMEOUT',
      DEFAULT_CONFIG.timeout
    );
    
    const maxRetries = parseNonNegativeInteger(
      process.env.NEXT_PUBLIC_MAX_RETRIES || '',
      'NEXT_PUBLIC_MAX_RETRIES',
      DEFAULT_CONFIG.maxRetries
    );
    
    const retryDelay = parsePositiveInteger(
      process.env.NEXT_PUBLIC_RETRY_DELAY || '',
      'NEXT_PUBLIC_RETRY_DELAY',
      DEFAULT_CONFIG.retryDelay
    );
    
    // Load and validate headers
    let headers = DEFAULT_CONFIG.headers;
    const headersEnv = process.env.NEXT_PUBLIC_REQUEST_HEADERS;
    if (headersEnv) {
      headers = {
        ...DEFAULT_CONFIG.headers,
        ...parseJsonSafely(headersEnv, 'NEXT_PUBLIC_REQUEST_HEADERS'),
      };
    }
    
    return {
      localEndpoint,
      remoteEndpoint,
      timeout,
      maxRetries,
      retryDelay,
      headers,
    };
    
  } catch (error) {
    if (error instanceof ConfigError) {
      errors.push(error.message);
    } else {
      errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  if (errors.length > 0) {
    throw new ConfigError(`Configuration validation failed:\n${errors.join('\n')}`);
  }
  
  // This should never be reached due to the try-catch, but TypeScript needs it
  return DEFAULT_CONFIG;
}

/**
 * Validate that required configuration is present
 */
export function validateConfig(config: AppConfig): void {
  const errors: string[] = [];
  
  if (!config.localEndpoint) {
    errors.push('Local endpoint is required');
  }
  
  if (config.timeout <= 0) {
    errors.push('Timeout must be greater than 0');
  }
  
  if (config.maxRetries < 0) {
    errors.push('Max retries must be 0 or greater');
  }
  
  if (config.retryDelay <= 0) {
    errors.push('Retry delay must be greater than 0');
  }
  
  if (!config.headers || typeof config.headers !== 'object') {
    errors.push('Headers must be a valid object');
  }
  
  if (errors.length > 0) {
    throw new ConfigError(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Get the application configuration
 * This is the main export that should be used throughout the application
 */
export function getConfig(): AppConfig {
  const config = loadConfig();
  validateConfig(config);
  return config;
}

// Export a singleton instance for convenience
let configInstance: AppConfig | null = null;

export function getConfigInstance(): AppConfig {
  if (!configInstance) {
    configInstance = getConfig();
  }
  return configInstance;
}

/**
 * Reset the configuration instance (useful for testing)
 */
export function resetConfigInstance(): void {
  configInstance = null;
}