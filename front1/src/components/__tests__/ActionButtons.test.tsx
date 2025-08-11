import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionButtons } from '../ActionButtons';

describe('ActionButtons', () => {
  const mockOnSendLocal = jest.fn();
  const mockOnSendRemote = jest.fn();
  const mockOnClear = jest.fn();

  const defaultProps = {
    onSendLocal: mockOnSendLocal,
    onSendRemote: mockOnSendRemote,
    onClear: mockOnClear,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all three buttons', () => {
      render(<ActionButtons {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /send message to local endpoint/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message to remote endpoint/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear chat history/i })).toBeInTheDocument();
    });

    it('displays correct button text when not loading', () => {
      render(<ActionButtons {...defaultProps} />);
      
      expect(screen.getByText('Send to Local')).toBeInTheDocument();
      expect(screen.getByText('Send to Remote')).toBeInTheDocument();
      expect(screen.getByText('Clear Chat')).toBeInTheDocument();
    });

    it('displays loading text when loading', () => {
      render(<ActionButtons {...defaultProps} isLoading={true} />);
      
      expect(screen.getAllByText('Sending...')).toHaveLength(2);
      expect(screen.getByText('Clear Chat')).toBeInTheDocument();
    });

    it('renders help text for all buttons', () => {
      render(<ActionButtons {...defaultProps} />);
      
      expect(screen.getByText('Send to local endpoint (127.0.0.1:8080)')).toBeInTheDocument();
      expect(screen.getByText('Send to configured remote endpoint')).toBeInTheDocument();
      expect(screen.getByText('Remove all messages from chat history')).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('enables all buttons by default', () => {
      render(<ActionButtons {...defaultProps} />);
      
      const localButton = screen.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = screen.getByRole('button', { name: /send message to remote endpoint/i });
      const clearButton = screen.getByRole('button', { name: /clear chat history/i });
      
      expect(localButton).not.toBeDisabled();
      expect(remoteButton).not.toBeDisabled();
      expect(clearButton).not.toBeDisabled();
    });

    it('disables send buttons when input is empty', () => {
      render(<ActionButtons {...defaultProps} isInputEmpty={true} />);
      
      const localButton = screen.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = screen.getByRole('button', { name: /send message to remote endpoint/i });
      const clearButton = screen.getByRole('button', { name: /clear chat history/i });
      
      expect(localButton).toBeDisabled();
      expect(remoteButton).toBeDisabled();
      expect(clearButton).not.toBeDisabled();
    });

    it('disables send buttons when loading', () => {
      render(<ActionButtons {...defaultProps} isLoading={true} />);
      
      const localButton = screen.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = screen.getByRole('button', { name: /send message to remote endpoint/i });
      const clearButton = screen.getByRole('button', { name: /clear chat history/i });
      
      expect(localButton).toBeDisabled();
      expect(remoteButton).toBeDisabled();
      expect(clearButton).not.toBeDisabled();
    });

    it('disables all buttons when disabled prop is true', () => {
      render(<ActionButtons {...defaultProps} disabled={true} />);
      
      const localButton = screen.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = screen.getByRole('button', { name: /send message to remote endpoint/i });
      const clearButton = screen.getByRole('button', { name: /clear chat history/i });
      
      expect(localButton).toBeDisabled();
      expect(remoteButton).toBeDisabled();
      expect(clearButton).toBeDisabled();
    });
  });

  describe('Button Interactions', () => {
    it('calls onSendLocal when local button is clicked', async () => {
      const user = userEvent.setup();
      render(<ActionButtons {...defaultProps} />);
      
      const localButton = screen.getByRole('button', { name: /send message to local endpoint/i });
      await user.click(localButton);
      
      expect(mockOnSendLocal).toHaveBeenCalledTimes(1);
    });

    it('calls onSendRemote when remote button is clicked', async () => {
      const user = userEvent.setup();
      render(<ActionButtons {...defaultProps} />);
      
      const remoteButton = screen.getByRole('button', { name: /send message to remote endpoint/i });
      await user.click(remoteButton);
      
      expect(mockOnSendRemote).toHaveBeenCalledTimes(1);
    });

    it('does not call send handlers when buttons are disabled', async () => {
      const user = userEvent.setup();
      render(<ActionButtons {...defaultProps} isInputEmpty={true} />);
      
      const localButton = screen.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = screen.getByRole('button', { name: /send message to remote endpoint/i });
      
      await user.click(localButton);
      await user.click(remoteButton);
      
      expect(mockOnSendLocal).not.toHaveBeenCalled();
      expect(mockOnSendRemote).not.toHaveBeenCalled();
    });
  });

  describe('Clear Chat Confirmation Dialog', () => {
    it('shows confirmation dialog when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<ActionButtons {...defaultProps} />);
      
      const clearButton = screen.getByRole('button', { name: /clear chat history/i });
      await user.click(clearButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Clear Chat History')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to clear all messages? This action cannot be undone.')).toBeInTheDocument();
    });

    it('has proper ARIA attributes for dialog', async () => {
      const user = userEvent.setup();
      render(<ActionButtons {...defaultProps} />);
      
      const clearButton = screen.getByRole('button', { name: /clear chat history/i });
      await user.click(clearButton);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'clear-dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'clear-dialog-description');
    });

    it('calls onClear when confirm button is clicked', async () => {
      const user = userEvent.setup();
      render(<ActionButtons {...defaultProps} />);
      
      const clearButton = screen.getByRole('button', { name: /clear chat history/i });
      await user.click(clearButton);
      
      const confirmButton = screen.getByRole('button', { name: /confirm clearing chat/i });
      await user.click(confirmButton);
      
      expect(mockOnClear).toHaveBeenCalledTimes(1);
    });

    it('closes dialog when confirm button is clicked', async () => {
      const user = userEvent.setup();
      render(<ActionButtons {...defaultProps} />);
      
      const clearButton = screen.getByRole('button', { name: /clear chat history/i });
      await user.click(clearButton);
      
      const confirmButton = screen.getByRole('button', { name: /confirm clearing chat/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('closes dialog when cancel button is clicked without calling onClear', async () => {
      const user = userEvent.setup();
      render(<ActionButtons {...defaultProps} />);
      
      const clearButton = screen.getByRole('button', { name: /clear chat history/i });
      await user.click(clearButton);
      
      const cancelButton = screen.getByRole('button', { name: /cancel clearing chat/i });
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      expect(mockOnClear).not.toHaveBeenCalled();
    });

    it('does not show dialog when clear button is disabled', async () => {
      const user = userEvent.setup();
      render(<ActionButtons {...defaultProps} disabled={true} />);
      
      const clearButton = screen.getByRole('button', { name: /clear chat history/i });
      await user.click(clearButton);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation for all buttons', async () => {
      const user = userEvent.setup();
      render(<ActionButtons {...defaultProps} />);
      
      const localButton = screen.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = screen.getByRole('button', { name: /send message to remote endpoint/i });
      const clearButton = screen.getByRole('button', { name: /clear chat history/i });
      
      // Tab through buttons
      await user.tab();
      expect(localButton).toHaveFocus();
      
      await user.tab();
      expect(remoteButton).toHaveFocus();
      
      await user.tab();
      expect(clearButton).toHaveFocus();
    });

    it('activates buttons with Enter key', async () => {
      const user = userEvent.setup();
      render(<ActionButtons {...defaultProps} />);
      
      const localButton = screen.getByRole('button', { name: /send message to local endpoint/i });
      localButton.focus();
      
      await user.keyboard('{Enter}');
      expect(mockOnSendLocal).toHaveBeenCalledTimes(1);
    });

    it('activates buttons with Space key', async () => {
      const user = userEvent.setup();
      render(<ActionButtons {...defaultProps} />);
      
      const remoteButton = screen.getByRole('button', { name: /send message to remote endpoint/i });
      remoteButton.focus();
      
      await user.keyboard(' ');
      expect(mockOnSendRemote).toHaveBeenCalledTimes(1);
    });

    it('focuses confirm button by default in dialog', async () => {
      const user = userEvent.setup();
      render(<ActionButtons {...defaultProps} />);
      
      const clearButton = screen.getByRole('button', { name: /clear chat history/i });
      await user.click(clearButton);
      
      const confirmButton = screen.getByRole('button', { name: /confirm clearing chat/i });
      expect(confirmButton).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for all buttons', () => {
      render(<ActionButtons {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /send message to local endpoint at 127\.0\.0\.1:8080/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message to remote endpoint/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear chat history/i })).toBeInTheDocument();
    });

    it('has proper aria-describedby attributes', () => {
      render(<ActionButtons {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /send message to local endpoint/i })).toHaveAttribute('aria-describedby', 'send-local-help');
      expect(screen.getByRole('button', { name: /send message to remote endpoint/i })).toHaveAttribute('aria-describedby', 'send-remote-help');
      expect(screen.getByRole('button', { name: /clear chat history/i })).toHaveAttribute('aria-describedby', 'clear-chat-help');
    });

    it('has proper focus ring styles', () => {
      render(<ActionButtons {...defaultProps} />);
      
      const localButton = screen.getByRole('button', { name: /send message to local endpoint/i });
      expect(localButton).toHaveClass('focus:ring-2', 'focus:ring-blue-500', 'focus:ring-offset-2');
    });

    it('has proper button types', () => {
      render(<ActionButtons {...defaultProps} />);
      
      const localButton = screen.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = screen.getByRole('button', { name: /send message to remote endpoint/i });
      const clearButton = screen.getByRole('button', { name: /clear chat history/i });
      
      expect(localButton).toHaveAttribute('type', 'button');
      expect(remoteButton).toHaveAttribute('type', 'button');
      expect(clearButton).toHaveAttribute('type', 'button');
    });

    it('provides loading state indicators with proper accessibility', () => {
      render(<ActionButtons {...defaultProps} isLoading={true} />);
      
      const loadingSpinners = document.querySelectorAll('[aria-hidden="true"]');
      expect(loadingSpinners.length).toBeGreaterThan(0);
    });

    it('supports dialog keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ActionButtons {...defaultProps} />);
      
      // Open dialog
      const clearButton = screen.getByRole('button', { name: /clear chat history/i });
      await user.click(clearButton);
      
      const confirmButton = screen.getByRole('button', { name: /confirm clearing chat/i });
      const cancelButton = screen.getByRole('button', { name: /cancel clearing chat/i });
      
      // Confirm button should be focused initially
      expect(confirmButton).toHaveFocus();
      
      // Tab should move to cancel button
      await user.tab({ shift: true });
      expect(cancelButton).toHaveFocus();
      
      // Tab forward should go back to confirm
      await user.tab();
      expect(confirmButton).toHaveFocus();
    });

    it('closes dialog when clicking outside (backdrop)', async () => {
      const user = userEvent.setup();
      render(<ActionButtons {...defaultProps} />);
      
      // Open dialog
      const clearButton = screen.getByRole('button', { name: /clear chat history/i });
      await user.click(clearButton);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Click on backdrop (the dialog itself, which has the click handler)
      fireEvent.click(dialog);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('has proper color contrast for disabled states', () => {
      render(<ActionButtons {...defaultProps} disabled={true} />);
      
      const localButton = screen.getByRole('button', { name: /send message to local endpoint/i });
      expect(localButton).toHaveClass('bg-gray-300', 'text-gray-500');
    });

    it('provides visual feedback for hover states', () => {
      render(<ActionButtons {...defaultProps} />);
      
      const localButton = screen.getByRole('button', { name: /send message to local endpoint/i });
      expect(localButton).toHaveClass('hover:bg-blue-700', 'hover:shadow-md');
    });

    it('has proper transition animations', () => {
      render(<ActionButtons {...defaultProps} />);
      
      const localButton = screen.getByRole('button', { name: /send message to local endpoint/i });
      expect(localButton).toHaveClass('transition-all', 'duration-200');
    });

    it('hides help text on mobile for better space usage', () => {
      render(<ActionButtons {...defaultProps} />);
      
      const helpContainer = document.querySelector('.text-xs.text-gray-500.space-y-1');
      expect(helpContainer).toHaveClass('hidden', 'sm:block');
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes for mobile and desktop layouts', () => {
      render(<ActionButtons {...defaultProps} />);
      
      const buttonContainer = screen.getByRole('button', { name: /send message to local endpoint/i }).parentElement;
      expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row', 'gap-2', 'sm:gap-3');
    });

    it('applies proper flex classes to buttons', () => {
      render(<ActionButtons {...defaultProps} />);
      
      const localButton = screen.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = screen.getByRole('button', { name: /send message to remote endpoint/i });
      const clearButton = screen.getByRole('button', { name: /clear chat history/i });
      
      expect(localButton).toHaveClass('flex-1');
      expect(remoteButton).toHaveClass('flex-1');
      expect(clearButton).toHaveClass('flex-1', 'sm:flex-none');
    });
  });
});