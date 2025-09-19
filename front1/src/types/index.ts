/**
 * Core data models and types for the Next.js chat application
 */

export interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant' | 'error';
  timestamp: Date;
  source?: 'local' | 'remote' | 'bedrock';
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  response?: string;
  timestamp?: string;
  source?: string;
  error?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentInput: string;
}