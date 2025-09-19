/**
 * ChatService handles API communication for both local and remote endpoints
 */

import { ChatRequest, ChatResponse } from '../types';

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

  constructor(config: Required<ChatServiceConfig>) {
    this.config = config;
  }

  /**
   * Send message to local endpoint
   */
  async sendToLocal(message: string): Promise<string> {
    if (!message.trim()) {
      throw new ChatServiceError('Message cannot be empty', 'config');
    }

    const request: ChatRequest = { message };

    const response = await this.makeRequestWithRetry(this.config.localEndpoint, request, 'local');

    // Format the plain text response as HTML for consistent rendering
    return this.formatPlainTextAsHtml(response);
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

    const request: ChatRequest = { message };

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

        // Retry attempt

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
   * Format plain text response as HTML for consistent rendering
   */
  private formatPlainTextAsHtml(content: string): string {
    // If content already contains HTML tags, return as-is
    if (/<[^>]+>/.test(content)) {
      return content;
    }

    // Convert plain text to HTML
    const lines = content.split('\n');
    const formattedLines: string[] = [];
    let inList = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        if (inList) {
          formattedLines.push('</ul>');
          inList = false;
        }
        formattedLines.push('<br>');
        continue;
      }

      // Handle list items
      if (/^[-•*]\s/.test(trimmedLine) || /^\d+\.\s/.test(trimmedLine)) {
        if (!inList) {
          formattedLines.push('<ul style="list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem;">');
          inList = true;
        }
        const listContent = trimmedLine.replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, '');
        const escapedContent = this.escapeHtml(listContent);
        formattedLines.push(`<li style="margin-bottom: 0.25rem; color: rgb(51 65 85);">${escapedContent}</li>`);
        continue;
      } else if (inList) {
        formattedLines.push('</ul>');
        inList = false;
      }

      // Handle headers (lines that look like titles)
      if (/^[A-Z][^.]*[^.]$/.test(trimmedLine) && trimmedLine.length < 100 && !trimmedLine.includes(':')) {
        const escapedLine = this.escapeHtml(trimmedLine);
        formattedLines.push(`<h3 style="font-size: 1.125rem; font-weight: 600; color: rgb(15 23 42); margin-top: 1rem; margin-bottom: 0.5rem;">${escapedLine}</h3>`);
        continue;
      }

      // Handle key-value pairs
      if (trimmedLine.includes(':') && trimmedLine.split(':').length === 2) {
        const [key, value] = trimmedLine.split(':').map(s => s.trim());
        const escapedKey = this.escapeHtml(key);
        const escapedValue = this.escapeHtml(value);
        formattedLines.push(`<div style="margin-bottom: 0.5rem;"><strong style="color: rgb(15 23 42);">${escapedKey}:</strong> <span style="color: rgb(51 65 85);">${escapedValue}</span></div>`);
        continue;
      }

      // Handle code-like content (multiple spaces or tabs)
      if (/\s{3,}/.test(trimmedLine) || trimmedLine.includes('\t')) {
        const escapedLine = this.escapeHtml(trimmedLine);
        formattedLines.push(`<div style="font-family: monospace; font-size: 0.875rem; background-color: rgb(241 245 249); padding: 0.5rem; border-radius: 0.25rem; margin-bottom: 0.5rem;">${escapedLine}</div>`);
        continue;
      }

      // Regular paragraph
      const escapedLine = this.escapeHtml(trimmedLine);
      formattedLines.push(`<p style="margin-bottom: 0.75rem; color: rgb(51 65 85);">${escapedLine}</p>`);
    }

    if (inList) {
      formattedLines.push('</ul>');
    }

    return formattedLines.join('\n');
  }

  /**
   * Escape HTML entities to prevent XSS
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
   * Send message to Bedrock Agent for research
   */
  async sendToBedrockAgent(request: ChatRequest): Promise<ChatResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000); // 30 minutes

      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: request.message }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ChatServiceError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          'api',
          response.status,
          response.status >= 500 || response.status === 429
        );
      }

      const data = await response.json();

      return {
        response: data.content,
        timestamp: data.timestamp,
        source: data.source,
      } as ChatResponse;

    } catch (error) {
      if (error instanceof ChatServiceError) {
        throw error;
      }

      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ChatServiceError(
          'Request timeout: The research query took longer than 30 minutes to complete',
          'timeout',
          408,
          true
        );
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ChatServiceError(
          'Network error: Unable to connect to research service',
          'network',
          undefined,
          true
        );
      }

      throw new ChatServiceError(
        `Bedrock Agent error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'api',
        undefined,
        false
      );
    }
  }

  /**
   * Get current configuration (for testing/debugging)
   */
  getConfig(): ChatServiceConfig {
    return { ...this.config };
  }
}

// ChatService must be instantiated with configuration
// Use ConfigProvider context to get configuration and create instances as needed