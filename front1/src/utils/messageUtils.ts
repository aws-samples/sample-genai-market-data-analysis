import { Message } from '../types';

/**
 * Utility functions for message creation and validation
 */

/**
 * Creates a new message with generated ID and timestamp
 */
export function createMessage(
  content: any,
  type: Message['type'],
  source?: Message['source']
): Message {
  // Ensure content is always a string
  let stringContent = '';
  if (typeof content === 'string') {
    stringContent = content.trim();
  } else if (content && typeof content === 'object') {
    stringContent = JSON.stringify(content, null, 2);
  } else {
    stringContent = String(content || '').trim();
  }

  return {
    id: generateMessageId(),
    content: stringContent,
    type,
    timestamp: new Date(),
    source,
  };
}

/**
 * Creates a user message
 */
export function createUserMessage(content: string): Message {
  return createMessage(content, 'user');
}

/**
 * Creates an assistant message with source information
 */
export function createAssistantMessage(
  content: string,
  source: 'local' | 'remote'
): Message {
  return createMessage(content, 'assistant', source);
}

/**
 * Creates an error message
 */
export function createErrorMessage(
  content: string,
  source?: 'local' | 'remote'
): Message {
  return createMessage(content, 'error', source);
}

/**
 * Validates message content
 */
export function validateMessageContent(content: string): boolean {
  return typeof content === 'string' && content.trim().length > 0;
}

/**
 * Validates a complete message object
 */
export function validateMessage(message: any): message is Message {
  if (!message || typeof message !== 'object') {
    return false;
  }
  
  return (
    typeof message.id === 'string' &&
    message.id.length > 0 &&
    typeof message.content === 'string' &&
    message.content.trim().length > 0 &&
    ['user', 'assistant', 'error'].includes(message.type) &&
    message.timestamp instanceof Date &&
    (message.source === undefined || ['local', 'remote'].includes(message.source))
  );
}

/**
 * Validates chat request payload
 */
export function validateChatRequest(request: any): request is { prompt: string } {
  if (!request || typeof request !== 'object') {
    return false;
  }
  
  return (
    typeof request.prompt === 'string' &&
    request.prompt.trim().length > 0
  );
}

/**
 * Validates chat response payload
 */
export function validateChatResponse(response: any): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  return (
    typeof response.response === 'string' || typeof response.error === 'string'
  );
}

/**
 * Generates a unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}