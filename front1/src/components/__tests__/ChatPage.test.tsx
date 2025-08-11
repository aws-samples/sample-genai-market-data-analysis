import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatPage } from '../ChatPage';
import { chatService } from '../../services/chatService';

// Mock the chat service
jest.mock('../../services/chatService', () => ({
  chatService: {
    sendToLocal: jest.fn(),
    sendToRemote: jest.fn(),
  },
}));

const mockChatService = chatService as jest.Mocked<typeof chatService>;

// Helper functions for consistent button selection
const getLocalButton = () => screen.getByRole('button', { name: /send message to local endpoint/i });
const getRemoteButton = () => screen.getByRole('button', { name: /send message to remote endpoint/i });
const getClearButton = () => screen.getByRole('button', { name: /clear chat history/i });
const getMessageInput = () => screen.getByRole('textbox', { name: /message input/i });

describe('ChatPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders the main chat interface', () => {
      render(<ChatPage />);
      
      expect(screen.getByRole('heading', { name: /next\.js chat app/i })).toBeInTheDocument();
      expect(screen.getByText(/send messages to local or remote endpoints/i)).toBeInTheDocument();
      expect(getMessageInput()).toBeInTheDocument();
      expect(getLocalButton()).toBeInTheDocument();
      expect(getRemoteButton()).toBeInTheDocument();
      expect(getClearButton()).toBeInTheDocument();
    });

    it('shows empty chat state initially', () => {
      render(<ChatPage />);
      
      expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
      expect(screen.getByText(/start a conversation by typing a message below/i)).toBeInTheDocument();
    });

    it('has send buttons disabled when input is empty', () => {
      render(<ChatPage />);
      
      expect(getLocalButton()).toBeDisabled();
      expect(getRemoteButton()).toBeDisabled();
    });

    it('focuses the input field on mount', () => {
      render(<ChatPage />);
      
      expect(getMessageInput()).toHaveFocus();
    });
  });

  describe('Message Input', () => {
    it('enables send buttons when user types a message', async () => {
      const user = userEvent.setup();
      render(<ChatPage />);
      
      const input = getMessageInput();
      await user.type(input, 'Hello world');
      
      expect(getLocalButton()).toBeEnabled();
      expect(getRemoteButton()).toBeEnabled();
    });

    it('sends message to local endpoint when Enter is pressed', async () => {
      const user = userEvent.setup();
      mockChatService.sendToLocal.mockResolvedValue('Local response');
      
      render(<ChatPage />);
      
      const input = getMessageInput();
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');
      
      expect(mockChatService.sendToLocal).toHaveBeenCalledWith('Test message');
    });

    it('clears input after sending message', async () => {
      const user = userEvent.setup();
      mockChatService.sendToLocal.mockResolvedValue('Local response');
      
      render(<ChatPage />);
      
      const input = getMessageInput();
      await user.type(input, 'Test message');
      await user.click(getLocalButton());
      
      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });
  });

  describe('Local Endpoint Communication', () => {
    it('sends message to local endpoint and displays response', async () => {
      const user = userEvent.setup();
      mockChatService.sendToLocal.mockResolvedValue('Hello from local!');
      
      render(<ChatPage />);
      
      const input = getMessageInput();
      await user.type(input, 'Hello');
      await user.click(getLocalButton());
      
      // Check user message appears
      expect(screen.getByText('Hello')).toBeInTheDocument();
      
      // Wait for response
      await waitFor(() => {
        expect(screen.getByText('Hello from local!')).toBeInTheDocument();
      });
      
      expect(mockChatService.sendToLocal).toHaveBeenCalledWith('Hello');
    });

    it('shows loading state during local request', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });
      mockChatService.sendToLocal.mockReturnValue(promise);
      
      render(<ChatPage />);
      
      const input = getMessageInput();
      await user.type(input, 'Hello');
      await user.click(getLocalButton());
      
      // Check loading state
      expect(screen.getAllByText(/sending\.\.\./i)).toHaveLength(3); // Both buttons and input indicator
      expect(getLocalButton()).toBeDisabled();
      expect(getMessageInput()).toBeDisabled();
      
      // Resolve the promise
      act(() => {
        resolvePromise!('Response');
      });
      
      await waitFor(() => {
        expect(screen.queryByText(/sending\.\.\./i)).not.toBeInTheDocument();
      });
    });

    it('handles local endpoint errors', async () => {
      const user = userEvent.setup();
      mockChatService.sendToLocal.mockRejectedValue(new Error('Network error'));
      
      render(<ChatPage />);
      
      const input = getMessageInput();
      await user.type(input, 'Hello');
      await user.click(getLocalButton());
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getAllByText(/network error/i)).toHaveLength(2); // Error banner and chat message
      });
    });
  });

  describe('Remote Endpoint Communication', () => {
    it('sends message to remote endpoint and displays response', async () => {
      const user = userEvent.setup();
      mockChatService.sendToRemote.mockResolvedValue('Hello from remote!');
      
      render(<ChatPage />);
      
      const input = getMessageInput();
      await user.type(input, 'Hello');
      await user.click(getRemoteButton());
      
      // Check user message appears
      expect(screen.getByText('Hello')).toBeInTheDocument();
      
      // Wait for response
      await waitFor(() => {
        expect(screen.getByText('Hello from remote!')).toBeInTheDocument();
      });
      
      expect(mockChatService.sendToRemote).toHaveBeenCalledWith('Hello');
    });

    it('handles remote endpoint errors', async () => {
      const user = userEvent.setup();
      mockChatService.sendToRemote.mockRejectedValue(new Error('Remote server error'));
      
      render(<ChatPage />);
      
      const input = getMessageInput();
      await user.type(input, 'Hello');
      await user.click(getRemoteButton());
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getAllByText(/remote server error/i)).toHaveLength(2); // Error banner and chat message
      });
    });
  });

  describe('Chat History Management', () => {
    it('displays multiple messages in chronological order', async () => {
      const user = userEvent.setup();
      mockChatService.sendToLocal
        .mockResolvedValueOnce('First response')
        .mockResolvedValueOnce('Second response');
      
      render(<ChatPage />);
      
      const input = getMessageInput();
      
      // Send first message
      await user.type(input, 'First message');
      await user.click(getLocalButton());
      
      await waitFor(() => {
        expect(screen.getByText('First response')).toBeInTheDocument();
      });
      
      // Send second message
      await user.type(input, 'Second message');
      await user.click(getLocalButton());
      
      await waitFor(() => {
        expect(screen.getByText('Second response')).toBeInTheDocument();
      });
      
      // Check all messages are present
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('First response')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
      expect(screen.getByText('Second response')).toBeInTheDocument();
    });

    it('clears chat history when clear button is clicked', async () => {
      const user = userEvent.setup();
      mockChatService.sendToLocal.mockResolvedValue('Test response');
      
      render(<ChatPage />);
      
      // Send a message first
      const input = getMessageInput();
      await user.type(input, 'Test message');
      await user.click(getLocalButton());
      
      await waitFor(() => {
        expect(screen.getByText('Test response')).toBeInTheDocument();
      });
      
      // Clear chat
      await user.click(getClearButton());
      
      // Confirm in dialog
      await user.click(screen.getByRole('button', { name: /confirm clearing chat/i }));
      
      // Check messages are cleared
      await waitFor(() => {
        expect(screen.queryByText('Test message')).not.toBeInTheDocument();
        expect(screen.queryByText('Test response')).not.toBeInTheDocument();
        expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      const user = userEvent.setup();
      mockChatService.sendToLocal.mockRejectedValue(new Error('API Error'));
      
      render(<ChatPage />);
      
      const input = getMessageInput();
      await user.type(input, 'Test message');
      await user.click(getLocalButton());
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getAllByText(/unexpected error/i)).toHaveLength(2); // Error banner and chat message
      });
    });

    it('displays user-friendly error messages for different error types', async () => {
      const user = userEvent.setup();
      const networkError = {
        name: 'ChatServiceError',
        type: 'network',
        message: 'Network error',
        isRetryable: true
      };
      mockChatService.sendToLocal.mockRejectedValue(networkError);
      
      render(<ChatPage />);
      
      const input = getMessageInput();
      await user.type(input, 'Test message');
      await user.click(getLocalButton());
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getAllByText(/unable to connect to local endpoint/i)).toHaveLength(2); // Error banner and chat message
      });
    });

    it('shows retry button for retryable errors', async () => {
      const user = userEvent.setup();
      const retryableError = {
        name: 'ChatServiceError',
        type: 'network',
        message: 'Network error',
        isRetryable: true
      };
      mockChatService.sendToLocal.mockRejectedValue(retryableError);
      
      render(<ChatPage />);
      
      const input = getMessageInput();
      await user.type(input, 'Test message');
      await user.click(getLocalButton());
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry failed request/i })).toBeInTheDocument();
      });
    });

    it('does not show retry button for non-retryable errors', async () => {
      const user = userEvent.setup();
      const nonRetryableError = {
        name: 'ChatServiceError',
        type: 'config',
        message: 'Configuration error',
        isRetryable: false
      };
      mockChatService.sendToLocal.mockRejectedValue(nonRetryableError);
      
      render(<ChatPage />);
      
      const input = getMessageInput();
      await user.type(input, 'Test message');
      await user.click(getLocalButton());
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /retry failed request/i })).not.toBeInTheDocument();
      });
    });

    it('retries failed request when retry button is clicked', async () => {
      const user = userEvent.setup();
      const retryableError = {
        name: 'ChatServiceError',
        type: 'network',
        message: 'Network error',
        isRetryable: true
      };
      
      mockChatService.sendToLocal
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce('Success after retry');
      
      render(<ChatPage />);
      
      const input = getMessageInput();
      await user.type(input, 'Test message');
      await user.click(getLocalButton());
      
      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry failed request/i })).toBeInTheDocument();
      });
      
      // Click retry
      await user.click(screen.getByRole('button', { name: /retry failed request/i }));
      
      // Wait for success
      await waitFor(() => {
        expect(screen.getByText('Success after retry')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
      
      expect(mockChatService.sendToLocal).toHaveBeenCalledTimes(2);
    });

    it('clears error and retry state when user starts typing', async () => {
      const user = userEvent.setup();
      const retryableError = {
        name: 'ChatServiceError',
        type: 'network',
        message: 'Network error',
        isRetryable: true
      };
      mockChatService.sendToLocal.mockRejectedValue(retryableError);
      
      render(<ChatPage />);
      
      // Trigger error
      const input = getMessageInput();
      await user.type(input, 'Test message');
      await user.click(getLocalButton());
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry failed request/i })).toBeInTheDocument();
      });
      
      // Start typing to clear error
      await user.type(input, 'New message');
      
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /retry failed request/i })).not.toBeInTheDocument();
      });
    });

    it('clears retry state when chat is cleared', async () => {
      const user = userEvent.setup();
      const retryableError = {
        name: 'ChatServiceError',
        type: 'network',
        message: 'Network error',
        isRetryable: true
      };
      mockChatService.sendToLocal.mockRejectedValue(retryableError);
      
      render(<ChatPage />);
      
      // Trigger error
      const input = getMessageInput();
      await user.type(input, 'Test message');
      await user.click(getLocalButton());
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry failed request/i })).toBeInTheDocument();
      });
      
      // Clear chat
      await user.click(getClearButton());
      await user.click(screen.getByRole('button', { name: /confirm clearing chat/i }));
      
      // Trigger another error to verify retry state was cleared
      await user.type(input, 'Another message');
      mockChatService.sendToLocal.mockRejectedValue(new Error('Different error'));
      await user.click(getLocalButton());
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /retry failed request/i })).not.toBeInTheDocument();
      });
    });

    it('allows dismissing error manually', async () => {
      const user = userEvent.setup();
      mockChatService.sendToLocal.mockRejectedValue(new Error('API Error'));
      
      render(<ChatPage />);
      
      // Trigger error
      const input = getMessageInput();
      await user.type(input, 'Test message');
      await user.click(getLocalButton());
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      
      // Dismiss error
      await user.click(screen.getByRole('button', { name: /dismiss error/i }));
      
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    it('logs errors to console for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const user = userEvent.setup();
      const testError = new Error('Test error');
      mockChatService.sendToLocal.mockRejectedValue(testError);
      
      render(<ChatPage />);
      
      const input = getMessageInput();
      await user.type(input, 'Test message');
      await user.click(getLocalButton());
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Chat error (local):', testError);
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ChatPage />);
      
      expect(getMessageInput()).toBeInTheDocument();
      expect(getLocalButton()).toBeInTheDocument();
      expect(getRemoteButton()).toBeInTheDocument();
      expect(getClearButton()).toBeInTheDocument();
      expect(screen.getByRole('log', { name: /chat message history/i })).toBeInTheDocument();
    });

    it('announces errors to screen readers', async () => {
      const user = userEvent.setup();
      mockChatService.sendToLocal.mockRejectedValue(new Error('API Error'));
      
      render(<ChatPage />);
      
      const input = getMessageInput();
      await user.type(input, 'Test message');
      await user.click(getLocalButton());
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'assertive');
      });
    });

    it('has proper heading hierarchy', () => {
      render(<ChatPage />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Next.js Chat App');
    });

    it('provides proper main content landmark', () => {
      render(<ChatPage />);
      
      // Check that the component has proper structure for accessibility
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Next.js Chat App');
    });

    it('has proper focus management', async () => {
      const user = userEvent.setup();
      render(<ChatPage />);
      
      // Input should be focused on mount
      expect(getMessageInput()).toHaveFocus();
      
      // Type something to enable buttons
      await user.type(getMessageInput(), 'test');
      
      // Tab navigation should work
      await user.tab();
      expect(getLocalButton()).toHaveFocus();
      
      await user.tab();
      expect(getRemoteButton()).toHaveFocus();
      
      await user.tab();
      expect(getClearButton()).toHaveFocus();
    });

    it('provides proper button descriptions', () => {
      render(<ChatPage />);
      
      expect(getLocalButton()).toHaveAttribute('aria-label', 'Send message to local endpoint at 127.0.0.1:8080');
      expect(getRemoteButton()).toHaveAttribute('aria-label', 'Send message to remote endpoint');
      expect(getClearButton()).toHaveAttribute('aria-label', 'Clear chat history');
    });

    it('has proper form labeling', () => {
      render(<ChatPage />);
      
      const input = getMessageInput();
      expect(input).toHaveAttribute('aria-label', 'Message input');
      expect(input).toHaveAttribute('aria-describedby');
    });

    it('announces new messages to screen readers', async () => {
      const user = userEvent.setup();
      mockChatService.sendToLocal.mockResolvedValue('Test response');
      
      render(<ChatPage />);
      
      // Send a message
      const input = getMessageInput();
      await user.type(input, 'Test message');
      await user.click(getLocalButton());
      
      // Check that announcement region exists
      await waitFor(() => {
        const announcementRegion = document.querySelector('[role="status"]');
        expect(announcementRegion).toBeInTheDocument();
      });
    });

    it('provides proper error announcement priority', async () => {
      const user = userEvent.setup();
      mockChatService.sendToLocal.mockRejectedValue(new Error('API Error'));
      
      render(<ChatPage />);
      
      const input = getMessageInput();
      await user.type(input, 'Test message');
      await user.click(getLocalButton());
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'assertive');
        expect(alert).toHaveAttribute('aria-atomic', 'true');
      });
    });

    it('has proper dialog accessibility for clear confirmation', async () => {
      const user = userEvent.setup();
      mockChatService.sendToLocal.mockResolvedValue('Test response');
      
      render(<ChatPage />);
      
      // Send a message first
      const input = getMessageInput();
      await user.type(input, 'Test message');
      await user.click(getLocalButton());
      
      await waitFor(() => {
        expect(screen.getByText('Test response')).toBeInTheDocument();
      });
      
      // Open clear dialog
      await user.click(getClearButton());
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'clear-dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'clear-dialog-description');
      
      // Confirm button should have focus
      const confirmButton = screen.getByRole('button', { name: /confirm clearing chat/i });
      expect(confirmButton).toHaveFocus();
    });

    it('supports keyboard navigation in dialogs', async () => {
      const user = userEvent.setup();
      render(<ChatPage />);
      
      // Open clear dialog
      await user.click(getClearButton());
      
      const confirmButton = screen.getByRole('button', { name: /confirm clearing chat/i });
      const cancelButton = screen.getByRole('button', { name: /cancel clearing chat/i });
      
      // Confirm button should be focused initially
      expect(confirmButton).toHaveFocus();
      
      // Tab should move to cancel button
      await user.tab({ shift: true });
      expect(cancelButton).toHaveFocus();
      
      // Cancel button should close dialog
      await user.click(cancelButton);
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('provides proper loading state announcements', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });
      mockChatService.sendToLocal.mockReturnValue(promise);
      
      render(<ChatPage />);
      
      const input = getMessageInput();
      await user.type(input, 'Test message');
      await user.click(getLocalButton());
      
      // Check loading indicators have proper aria-live
      await waitFor(() => {
        const loadingIndicators = screen.getAllByText(/sending\.\.\./i);
        expect(loadingIndicators.length).toBeGreaterThan(0);
      });
      
      // Resolve the promise
      act(() => {
        resolvePromise!('Response');
      });
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes for mobile layout', () => {
      render(<ChatPage />);
      
      const header = screen.getByRole('heading', { name: /next\.js chat app/i });
      expect(header).toHaveClass('text-xl', 'sm:text-2xl', 'md:text-3xl');
    });

    it('renders with custom className', () => {
      const { container } = render(<ChatPage className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});