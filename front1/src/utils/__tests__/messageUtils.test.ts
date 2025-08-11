import {
  createMessage,
  createUserMessage,
  createAssistantMessage,
  createErrorMessage,
  validateMessageContent,
  validateMessage,
  validateChatRequest,
  validateChatResponse,
} from '../messageUtils';
import { Message } from '../../types';

describe('messageUtils', () => {
  describe('createMessage', () => {
    it('should create a message with all required fields', () => {
      const content = 'Test message';
      const type = 'user';
      const message = createMessage(content, type);

      expect(message).toHaveProperty('id');
      expect(message.id).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(message.content).toBe(content);
      expect(message.type).toBe(type);
      expect(message.timestamp).toBeInstanceOf(Date);
      expect(message.source).toBeUndefined();
    });

    it('should create a message with source when provided', () => {
      const content = 'Test message';
      const type = 'assistant';
      const source = 'local';
      const message = createMessage(content, type, source);

      expect(message.source).toBe(source);
    });

    it('should trim whitespace from content', () => {
      const content = '  Test message  ';
      const message = createMessage(content, 'user');

      expect(message.content).toBe('Test message');
    });

    it('should generate unique IDs for different messages', () => {
      const message1 = createMessage('Test 1', 'user');
      const message2 = createMessage('Test 2', 'user');

      expect(message1.id).not.toBe(message2.id);
    });
  });

  describe('createUserMessage', () => {
    it('should create a user message', () => {
      const content = 'User message';
      const message = createUserMessage(content);

      expect(message.type).toBe('user');
      expect(message.content).toBe(content);
      expect(message.source).toBeUndefined();
    });
  });

  describe('createAssistantMessage', () => {
    it('should create an assistant message with local source', () => {
      const content = 'Assistant response';
      const source = 'local';
      const message = createAssistantMessage(content, source);

      expect(message.type).toBe('assistant');
      expect(message.content).toBe(content);
      expect(message.source).toBe(source);
    });

    it('should create an assistant message with remote source', () => {
      const content = 'Assistant response';
      const source = 'remote';
      const message = createAssistantMessage(content, source);

      expect(message.type).toBe('assistant');
      expect(message.content).toBe(content);
      expect(message.source).toBe(source);
    });
  });

  describe('createErrorMessage', () => {
    it('should create an error message without source', () => {
      const content = 'Error occurred';
      const message = createErrorMessage(content);

      expect(message.type).toBe('error');
      expect(message.content).toBe(content);
      expect(message.source).toBeUndefined();
    });

    it('should create an error message with source', () => {
      const content = 'API error';
      const source = 'remote';
      const message = createErrorMessage(content, source);

      expect(message.type).toBe('error');
      expect(message.content).toBe(content);
      expect(message.source).toBe(source);
    });
  });

  describe('validateMessageContent', () => {
    it('should return true for valid content', () => {
      expect(validateMessageContent('Valid message')).toBe(true);
      expect(validateMessageContent('  Valid message  ')).toBe(true);
    });

    it('should return false for invalid content', () => {
      expect(validateMessageContent('')).toBe(false);
      expect(validateMessageContent('   ')).toBe(false);
      expect(validateMessageContent(null as any)).toBe(false);
      expect(validateMessageContent(undefined as any)).toBe(false);
      expect(validateMessageContent(123 as any)).toBe(false);
    });
  });

  describe('validateMessage', () => {
    const validMessage: Message = {
      id: 'msg_123_abc',
      content: 'Test message',
      type: 'user',
      timestamp: new Date(),
    };

    it('should return true for valid message', () => {
      expect(validateMessage(validMessage)).toBe(true);
    });

    it('should return true for valid message with source', () => {
      const messageWithSource = { ...validMessage, source: 'local' as const };
      expect(validateMessage(messageWithSource)).toBe(true);
    });

    it('should return false for message with missing id', () => {
      const invalidMessage = { ...validMessage, id: '' };
      expect(validateMessage(invalidMessage)).toBe(false);
    });

    it('should return false for message with empty content', () => {
      const invalidMessage = { ...validMessage, content: '' };
      expect(validateMessage(invalidMessage)).toBe(false);
    });

    it('should return false for message with whitespace-only content', () => {
      const invalidMessage = { ...validMessage, content: '   ' };
      expect(validateMessage(invalidMessage)).toBe(false);
    });

    it('should return false for message with invalid type', () => {
      const invalidMessage = { ...validMessage, type: 'invalid' as any };
      expect(validateMessage(invalidMessage)).toBe(false);
    });

    it('should return false for message with invalid timestamp', () => {
      const invalidMessage = { ...validMessage, timestamp: 'invalid' as any };
      expect(validateMessage(invalidMessage)).toBe(false);
    });

    it('should return false for message with invalid source', () => {
      const invalidMessage = { ...validMessage, source: 'invalid' as any };
      expect(validateMessage(invalidMessage)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(validateMessage(null)).toBe(false);
      expect(validateMessage(undefined)).toBe(false);
    });
  });

  describe('validateChatRequest', () => {
    it('should return true for valid chat request', () => {
      expect(validateChatRequest({ prompt: 'Test prompt' })).toBe(true);
      expect(validateChatRequest({ prompt: '  Test prompt  ' })).toBe(true);
    });

    it('should return false for invalid chat request', () => {
      expect(validateChatRequest({})).toBe(false);
      expect(validateChatRequest({ prompt: '' })).toBe(false);
      expect(validateChatRequest({ prompt: '   ' })).toBe(false);
      expect(validateChatRequest({ prompt: null })).toBe(false);
      expect(validateChatRequest({ prompt: undefined })).toBe(false);
      expect(validateChatRequest({ prompt: 123 })).toBe(false);
      expect(validateChatRequest(null)).toBe(false);
      expect(validateChatRequest(undefined)).toBe(false);
    });
  });

  describe('validateChatResponse', () => {
    it('should return true for valid response with response field', () => {
      expect(validateChatResponse({ response: 'Test response' })).toBe(true);
    });

    it('should return true for valid response with error field', () => {
      expect(validateChatResponse({ error: 'Test error' })).toBe(true);
    });

    it('should return true for response with both fields', () => {
      expect(validateChatResponse({ response: 'Test', error: 'Error' })).toBe(true);
    });

    it('should return false for invalid response', () => {
      expect(validateChatResponse({})).toBe(false);
      expect(validateChatResponse({ response: null })).toBe(false);
      expect(validateChatResponse({ error: null })).toBe(false);
      expect(validateChatResponse({ response: 123 })).toBe(false);
      expect(validateChatResponse({ error: 123 })).toBe(false);
      expect(validateChatResponse(null)).toBe(false);
      expect(validateChatResponse(undefined)).toBe(false);
    });
  });
});