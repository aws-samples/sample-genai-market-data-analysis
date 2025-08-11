import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '../MessageInput';

describe('MessageInput', () => {
  const mockOnSendMessage = jest.fn();
  const mockOnChange = jest.fn();
  const mockOnEnterPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox', { name: /message input/i });
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder', 'Type your message...');
      expect(textarea).not.toBeDisabled();
    });

    it('renders with custom placeholder', () => {
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage} 
          placeholder="Enter your question..." 
        />
      );
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Enter your question...');
    });

    it('renders help text', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      expect(screen.getByText('Press Enter to send, Shift+Enter for new line')).toBeInTheDocument();
    });

    it('has proper accessibility attributes', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-label', 'Message input');
      expect(textarea).toHaveAttribute('aria-describedby', 'message-input-help message-input-status');
      expect(textarea).toHaveAttribute('aria-invalid', 'false');
    });
  });

  describe('Input Handling', () => {
    it('handles text input changes', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello world');
      
      expect(textarea).toHaveValue('Hello world');
    });

    it('calls controlled onChange when provided', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage}
          value="controlled"
          onChange={mockOnChange}
        />
      );
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'a');
      
      expect(mockOnChange).toHaveBeenCalledWith('controlleda');
    });

    it('uses controlled value when provided', () => {
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage}
          value="controlled value"
          onChange={mockOnChange}
        />
      );
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('controlled value');
    });
  });

  describe('Enter Key Handling', () => {
    it('sends message on Enter key press', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test message');
      await user.keyboard('{Enter}');
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('does not send message on Shift+Enter', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test message');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('calls custom onEnterPress when provided', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage}
          onEnterPress={mockOnEnterPress}
        />
      );
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test message');
      await user.keyboard('{Enter}');
      
      expect(mockOnEnterPress).toHaveBeenCalled();
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('does not send empty or whitespace-only messages', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      
      // Test empty message
      await user.keyboard('{Enter}');
      expect(mockOnSendMessage).not.toHaveBeenCalled();
      
      // Test whitespace-only message
      await user.type(textarea, '   ');
      await user.keyboard('{Enter}');
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('trims whitespace from messages before sending', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '  Test message  ');
      await user.keyboard('{Enter}');
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  describe('Input Clearing', () => {
    it('clears input after sending message (uncontrolled)', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test message');
      await user.keyboard('{Enter}');
      
      expect(textarea).toHaveValue('');
    });

    it('does not clear input after sending message (controlled)', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput 
          onSendMessage={mockOnSendMessage}
          value="controlled message"
          onChange={mockOnChange}
        />
      );
      
      const textarea = screen.getByRole('textbox');
      await user.keyboard('{Enter}');
      
      expect(textarea).toHaveValue('controlled message');
    });
  });

  describe('Disabled State', () => {
    it('renders disabled state correctly', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} disabled />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
      expect(textarea).toHaveClass('disabled:bg-gray-100', 'disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('shows loading indicator when disabled', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} disabled />);
      
      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });

    it('does not send message when disabled', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} disabled />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test message');
      await user.keyboard('{Enter}');
      
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('prevents input when disabled', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} disabled />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test message');
      
      expect(textarea).toHaveValue('');
    });
  });

  describe('Focus Management', () => {
    it('auto-focuses when autoFocus is true', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} autoFocus />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveFocus();
    });

    it('does not auto-focus by default', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).not.toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-label', 'Message input');
      expect(textarea).toHaveAttribute('aria-describedby', 'message-input-help message-input-status');
      expect(textarea).toHaveAttribute('aria-invalid', 'false');
    });

    it('has live region for status updates', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} disabled />);
      
      const liveRegion = screen.getByText('Sending...');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('associates help text with input', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const helpText = screen.getByText('Press Enter to send, Shift+Enter for new line');
      expect(helpText).toHaveAttribute('id', 'message-input-help');
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-describedby', 'message-input-help message-input-status');
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid key presses gracefully', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test');
      
      // Rapid Enter presses
      await user.keyboard('{Enter}{Enter}{Enter}');
      
      expect(mockOnSendMessage).toHaveBeenCalledTimes(1);
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test');
    });

    it('handles special characters in messages', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      const specialMessage = 'Hello! @#$%^&*()_+ 🚀 <script>alert("test")</script>';
      await user.type(textarea, specialMessage);
      await user.keyboard('{Enter}');
      
      expect(mockOnSendMessage).toHaveBeenCalledWith(specialMessage);
    });

    it('handles very long messages', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const textarea = screen.getByRole('textbox');
      const longMessage = 'A'.repeat(1000);
      await user.type(textarea, longMessage);
      await user.keyboard('{Enter}');
      
      expect(mockOnSendMessage).toHaveBeenCalledWith(longMessage);
    });
  });
});