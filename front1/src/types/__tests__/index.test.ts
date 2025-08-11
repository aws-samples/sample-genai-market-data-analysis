import { Message, ChatRequest, ChatResponse, ChatState } from '../index';

describe('TypeScript Interfaces', () => {
  describe('Message interface', () => {
    it('should accept valid message objects', () => {
      const userMessage: Message = {
        id: 'msg_123',
        content: 'Hello world',
        type: 'user',
        timestamp: new Date(),
      };

      const assistantMessage: Message = {
        id: 'msg_456',
        content: 'Hello back',
        type: 'assistant',
        timestamp: new Date(),
        source: 'local',
      };

      const errorMessage: Message = {
        id: 'msg_789',
        content: 'Something went wrong',
        type: 'error',
        timestamp: new Date(),
        source: 'remote',
      };

      // These should compile without errors
      expect(userMessage.type).toBe('user');
      expect(assistantMessage.source).toBe('local');
      expect(errorMessage.type).toBe('error');
    });

    it('should enforce required fields', () => {
      // This test ensures TypeScript compilation catches missing fields
      const validMessage: Message = {
        id: 'msg_123',
        content: 'Test',
        type: 'user',
        timestamp: new Date(),
      };

      expect(validMessage).toBeDefined();
    });
  });

  describe('ChatRequest interface', () => {
    it('should accept valid chat request objects', () => {
      const request: ChatRequest = {
        prompt: 'What is the weather today?',
      };

      expect(request.prompt).toBe('What is the weather today?');
    });
  });

  describe('ChatResponse interface', () => {
    it('should accept response with response field', () => {
      const response: ChatResponse = {
        response: 'The weather is sunny today.',
      };

      expect(response.response).toBe('The weather is sunny today.');
    });

    it('should accept response with error field', () => {
      const response: ChatResponse = {
        error: 'Failed to fetch weather data.',
      };

      expect(response.error).toBe('Failed to fetch weather data.');
    });

    it('should accept response with both fields', () => {
      const response: ChatResponse = {
        response: 'Partial data available',
        error: 'Some services unavailable',
      };

      expect(response.response).toBe('Partial data available');
      expect(response.error).toBe('Some services unavailable');
    });

    it('should accept empty response object', () => {
      const response: ChatResponse = {};

      expect(response).toBeDefined();
    });
  });

  describe('ChatState interface', () => {
    it('should accept valid chat state objects', () => {
      const messages: Message[] = [
        {
          id: 'msg_1',
          content: 'Hello',
          type: 'user',
          timestamp: new Date(),
        },
        {
          id: 'msg_2',
          content: 'Hi there!',
          type: 'assistant',
          timestamp: new Date(),
          source: 'local',
        },
      ];

      const chatState: ChatState = {
        messages,
        isLoading: false,
        error: null,
        currentInput: 'Typing...',
      };

      expect(chatState.messages).toHaveLength(2);
      expect(chatState.isLoading).toBe(false);
      expect(chatState.error).toBeNull();
      expect(chatState.currentInput).toBe('Typing...');
    });

    it('should accept state with error', () => {
      const chatState: ChatState = {
        messages: [],
        isLoading: false,
        error: 'Network connection failed',
        currentInput: '',
      };

      expect(chatState.error).toBe('Network connection failed');
    });

    it('should accept loading state', () => {
      const chatState: ChatState = {
        messages: [],
        isLoading: true,
        error: null,
        currentInput: 'Please wait...',
      };

      expect(chatState.isLoading).toBe(true);
    });
  });
});