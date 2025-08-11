/**
 * ChatService handles API communication for both local and remote endpoints
 */

import { ChatRequest, ChatResponse } from '../types';
import { getConfigInstance } from '../config';

export interface ChatServiceConfig {
  localEndpoint?: string;
  remoteEndpoint?: string;
  timeout?: number;
  headers?: Record<string, string>;
  maxRetries?: number;
  retryDelay?: number;
}

export class ChatServiceError extends Error {
  constructor(
    message: string,
    public readonly type: 'network' | 'timeout' | 'api' | 'config',
    public readonly statusCode?: number,
    public readonly isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'ChatServiceError';
  }
}

export class ChatService {
  private config: Required<ChatServiceConfig>;

  constructor(config: ChatServiceConfig = {}) {
    // Load configuration from environment variables as defaults
    const envConfig = getConfigInstance();
    
    this.config = {
      localEndpoint: config.localEndpoint || envConfig.localEndpoint,
      remoteEndpoint: config.remoteEndpoint || envConfig.remoteEndpoint,
      timeout: config.timeout || envConfig.timeout,
      maxRetries: config.maxRetries || envConfig.maxRetries,
      retryDelay: config.retryDelay || envConfig.retryDelay,
      headers: {
        ...envConfig.headers,
        ...config.headers,
      },
    };
  }

  /**
   * Send message to local endpoint
   */
  async sendToLocal(message: string): Promise<string> {
    if (!message.trim()) {
      throw new ChatServiceError('Message cannot be empty', 'config');
    }

    const request: ChatRequest = { prompt: message };
    
    return this.makeRequestWithRetry(this.config.localEndpoint, request, 'local');
  }

  /**
   * Send message to remote endpoint
   */
  async sendToRemote(message: string): Promise<string> {
    if (!message.trim()) {
      throw new ChatServiceError('Message cannot be empty', 'config');
    }

    if (!this.config.remoteEndpoint) {
      throw new ChatServiceError('Remote endpoint not configured', 'config');
    }

    const request: ChatRequest = { prompt: message };
    
    return this.makeRequestWithRetry(this.config.remoteEndpoint, request, 'remote');
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequestWithRetry(
    endpoint: string, 
    request: ChatRequest, 
    source: 'local' | 'remote'
  ): Promise<string> {
    let lastError: ChatServiceError | null = null;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(endpoint, request);
        return this.transformResponse(response);
      } catch (error) {
        lastError = error instanceof ChatServiceError ? error : this.handleError(error, source);
        
        // Don't retry for non-retryable errors or on the last attempt
        if (!lastError.isRetryable || attempt === this.config.maxRetries) {
          break;
        }
        
        // Log retry attempt
        console.warn(`Request failed (attempt ${attempt + 1}/${this.config.maxRetries + 1}): ${lastError.message}. Retrying in ${this.config.retryDelay}ms...`);
        
        // Wait before retrying
        await this.delay(this.config.retryDelay * Math.pow(2, attempt)); // Exponential backoff
      }
    }
    
    throw lastError;
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  private async makeRequest(endpoint: string, request: ChatRequest): Promise<ChatResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.config.headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const isRetryable = response.status >= 500 || response.status === 429; // Server errors and rate limiting
        throw new ChatServiceError(
          `HTTP ${response.status}: ${response.statusText}`,
          'api',
          response.status,
          isRetryable
        );
      }

      // Try to parse as JSON first (backward compatibility)
      try {
        const data = await response.json();
        return data as ChatResponse;
      } catch (jsonError) {
        // If JSON parsing fails, try to get as text (for HTML responses)
        try {
          if (typeof response.text === 'function') {
            const textContent = await response.text();
            return { response: textContent } as ChatResponse;
          } else {
            // Fallback for test mocks that don't have text() method
            throw new ChatServiceError('Invalid response format: unable to parse response', 'api');
          }
        } catch (textError) {
          throw new ChatServiceError('Invalid response format: unable to parse response', 'api');
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ChatServiceError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ChatServiceError('Request timeout', 'timeout', undefined, true);
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ChatServiceError('Network error: Unable to connect', 'network', undefined, true);
      }

      // Handle JSON parsing errors
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        throw new ChatServiceError('Invalid JSON response from server', 'api', undefined, false);
      }

      throw new ChatServiceError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'api',
        undefined,
        false
      );
    }
  }

  /**
   * Transform API response to string format
   */
  private transformResponse(response: ChatResponse): string {
    // Check for error in response
    if (response.error) {
      throw new ChatServiceError(response.error, 'api');
    }

    // Return the response content
    if (response.response) {
      return response.response;
    }

    // Fallback: if response is a string itself (for direct text responses)
    if (typeof response === 'string') {
      return response;
    }

    throw new ChatServiceError('Invalid response format: missing response field', 'api');
  }

  /**
   * Handle and categorize errors
   */
  private handleError(error: unknown, source: 'local' | 'remote'): ChatServiceError {
    if (error instanceof ChatServiceError) {
      return error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new ChatServiceError(`${source} endpoint error: ${errorMessage}`, 'api', undefined, false);
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ChatServiceConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      headers: {
        ...this.config.headers,
        ...config.headers,
      },
    };
  }

  /**
   * Get current configuration (for testing/debugging)
   */
  getConfig(): ChatServiceConfig {
    return { ...this.config };
  }
}

// Export a default instance with environment configuration
export const chatService = new ChatService();