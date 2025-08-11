/**
 * Core data models and types for the Next.js chat application
 */

export interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant' | 'error';
  timestamp: Date;
  source?: 'local' | 'remote';
}

export interface ChatRequest {
  prompt: string;
}

export interface ChatResponse {
  response?: string;
  error?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentInput: string;
}