import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatWindow } from '../ChatWindow';
import { Message } from '@/types';

// Mock the MessageItem component
jest.mock('../MessageItem', () => ({
  MessageItem: ({ message }: { message: Message }) => (
    <div data-testid={`message-${message.id}`}>
      {message.content} - {message.type}
    </div>
  ),
}));

describe('ChatWindow', () => {
  const mockMessages: Message[] = [
    {
      id: '1',
      content: 'Hello, world!',
      type: 'user',
      timestamp: new Date('2023-01-01T10:00:00Z'),
      source: 'local',
    },
    {
      id: '2',
      content: 'Hi there! How can I help you?',
      type: 'assistant',
      timestamp: new Date('2023-01-01T10:01:00Z'),
      source: 'remote',
    },
    {
      id: '3',
      content: 'Connection failed',
      type: 'error',
      timestamp: new Date('2023-01-01T10:02:00Z'),
    },
  ];

  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should display empty state when no messages exist and not loading', () => {
      render(<ChatWindow messages={[]} isLoading={false} />);
      
      expect(screen.getByRole('status', { name: /no messages in chat/i })).toBeInTheDocument();
      expect(screen.getByText('No messages yet')).toBeInTheDocument();
      expect(screen.getByText('Start a conversation by typing a message below')).toBeInTheDocument();
      expect(screen.getByText('💬')).toBeInTheDocument();
    });

    it('should not display empty state when loading', () => {
      render(<ChatWindow messages={[]} isLoading={true} />);
      
      expect(screen.queryByText('No messages yet')).not.toBeInTheDocument();
      expect(screen.getByRole('status', { name: /loading message/i })).toBeInTheDocument();
    });

    it('should not display empty state when messages exist', () => {
      render(<ChatWindow messages={mockMessages} isLoading={false} />);
      
      expect(screen.queryByText('No messages yet')).not.toBeInTheDocument();
    });
  });

  describe('Message Display', () => {
    it('should render all messages when provided', () => {
      render(<ChatWindow messages={mockMessages} isLoading={false} />);
      
      expect(screen.getByTestId('message-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-2')).toBeInTheDocument();
      expect(screen.getByTestId('message-3')).toBeInTheDocument();
      
      expect(screen.getByText('Hello, world! - user')).toBeInTheDocument();
      expect(screen.getByText('Hi there! How can I help you? - assistant')).toBeInTheDocument();
      expect(screen.getByText('Connection failed - error')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for message list', () => {
      render(<ChatWindow messages={mockMessages} isLoading={false} />);
      
      const messageList = screen.getByRole('list', { name: /messages/i });
      expect(messageList).toBeInTheDocument();
      
      const chatLog = screen.getByRole('log', { name: /chat message history/i });
      expect(chatLog).toBeInTheDocument();
      expect(chatLog).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Loading Indicator', () => {
    it('should display loading indicator when isLoading is true', () => {
      render(<ChatWindow messages={mockMessages} isLoading={true} />);
      
      const loadingIndicator = screen.getByRole('status', { name: /loading message/i });
      expect(loadingIndicator).toBeInTheDocument();
      
      // Check for animated dots
      const dots = screen.getAllByRole('status', { name: /loading message/i })[0]
        .querySelectorAll('.animate-bounce');
      expect(dots).toHaveLength(3);
    });

    it('should not display loading indicator when isLoading is false', () => {
      render(<ChatWindow messages={mockMessages} isLoading={false} />);
      
      expect(screen.queryByRole('status', { name: /loading message/i })).not.toBeInTheDocument();
    });

    it('should display loading indicator with messages', () => {
      render(<ChatWindow messages={mockMessages} isLoading={true} />);
      
      // Should show both messages and loading indicator
      expect(screen.getByTestId('message-1')).toBeInTheDocument();
      expect(screen.getByRole('status', { name: /loading message/i })).toBeInTheDocument();
    });
  });

  describe('Auto-scroll Behavior', () => {
    it('should call scrollIntoView when messages change', async () => {
      const { rerender } = render(<ChatWindow messages={[]} isLoading={false} />);
      
      // Add a message
      rerender(<ChatWindow messages={[mockMessages[0]]} isLoading={false} />);
      
      await waitFor(() => {
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'end',
        });
      });
    });

    it('should scroll when new messages are added', async () => {
      const { rerender } = render(<ChatWindow messages={[mockMessages[0]]} isLoading={false} />);
      
      // Add another message
      rerender(<ChatWindow messages={mockMessages.slice(0, 2)} isLoading={false} />);
      
      await waitFor(() => {
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(2);
      });
    });

    it('should scroll when loading state changes', async () => {
      const { rerender } = render(<ChatWindow messages={mockMessages} isLoading={false} />);
      
      // Start loading
      rerender(<ChatWindow messages={mockMessages} isLoading={true} />);
      
      await waitFor(() => {
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles and labels', () => {
      render(<ChatWindow messages={mockMessages} isLoading={false} />);
      
      const chatContainer = screen.getByRole('log');
      expect(chatContainer).toHaveAttribute('aria-label', 'Chat message history');
      expect(chatContainer).toHaveAttribute('aria-live', 'polite');
      
      const messagesList = screen.getByRole('list');
      expect(messagesList).toHaveAttribute('aria-label', '3 messages');
    });

    it('should have proper empty state accessibility', () => {
      render(<ChatWindow messages={[]} isLoading={false} />);
      
      const emptyState = screen.getByRole('status');
      expect(emptyState).toHaveAttribute('aria-label', 'No messages in chat');
    });

    it('should have proper loading state accessibility', () => {
      render(<ChatWindow messages={[]} isLoading={true} />);
      
      const loadingState = screen.getByRole('status');
      expect(loadingState).toHaveAttribute('aria-label', 'Loading message');
    });
  });

  describe('Styling and Layout', () => {
    it('should have proper CSS classes for layout', () => {
      render(<ChatWindow messages={mockMessages} isLoading={false} />);
      
      const container = screen.getByRole('log');
      expect(container).toHaveClass('flex-1', 'overflow-y-auto', 'p-3', 'sm:p-4', 'bg-white', 'border', 'border-gray-200', 'rounded-lg');
    });

    it('should have proper spacing for messages', () => {
      render(<ChatWindow messages={mockMessages} isLoading={false} />);
      
      const messagesList = screen.getByRole('list');
      expect(messagesList).toHaveClass('space-y-2');
    });

    it('should center empty state content', () => {
      render(<ChatWindow messages={[]} isLoading={false} />);
      
      const emptyState = screen.getByRole('status');
      expect(emptyState).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'h-full');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single message correctly', () => {
      render(<ChatWindow messages={[mockMessages[0]]} isLoading={false} />);
      
      expect(screen.getByTestId('message-1')).toBeInTheDocument();
      expect(screen.queryByText('No messages yet')).not.toBeInTheDocument();
    });

    it('should handle rapid message updates', async () => {
      const { rerender } = render(<ChatWindow messages={[]} isLoading={false} />);
      
      // Rapidly add messages
      rerender(<ChatWindow messages={[mockMessages[0]]} isLoading={false} />);
      rerender(<ChatWindow messages={mockMessages.slice(0, 2)} isLoading={false} />);
      rerender(<ChatWindow messages={mockMessages} isLoading={false} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('message-1')).toBeInTheDocument();
        expect(screen.getByTestId('message-2')).toBeInTheDocument();
        expect(screen.getByTestId('message-3')).toBeInTheDocument();
      });
    });

    it('should handle loading state transitions correctly', () => {
      const { rerender } = render(<ChatWindow messages={mockMessages} isLoading={true} />);
      
      expect(screen.getByRole('status', { name: /loading message/i })).toBeInTheDocument();
      
      rerender(<ChatWindow messages={mockMessages} isLoading={false} />);
      
      expect(screen.queryByRole('status', { name: /loading message/i })).not.toBeInTheDocument();
    });
  });
});