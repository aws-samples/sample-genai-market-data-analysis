import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageItem } from '../MessageItem';
import { Message } from '@/types';

describe('MessageItem', () => {
  const baseMessage: Message = {
    id: '1',
    content: 'Test message content',
    timestamp: new Date('2024-01-01T12:00:00Z'),
    type: 'user'
  };

  describe('User Messages', () => {
    it('renders user message with correct styling', () => {
      render(<MessageItem message={baseMessage} />);
      
      const messageElement = screen.getByText('Test message content');
      const container = messageElement.closest('.bg-blue-500');
      
      expect(messageElement).toBeInTheDocument();
      expect(container).toHaveClass('bg-blue-500', 'text-white', 'rounded-lg');
    });

    it('displays user message aligned to the right', () => {
      render(<MessageItem message={baseMessage} />);
      
      const containerDiv = screen.getByRole('listitem');
      expect(containerDiv).toHaveClass('justify-end');
    });

    it('displays timestamp for user message', () => {
      render(<MessageItem message={baseMessage} />);
      
      // The timestamp should be formatted as HH:MM (locale dependent)
      const timestamp = screen.getByText(/\d{1,2}:\d{2}/);
      expect(timestamp).toBeInTheDocument();
    });
  });

  describe('Assistant Messages', () => {
    const assistantMessage: Message = {
      ...baseMessage,
      type: 'assistant'
    };

    it('renders assistant message with correct styling', () => {
      render(<MessageItem message={assistantMessage} />);
      
      const messageElement = screen.getByText('Test message content');
      const container = messageElement.closest('.bg-gray-200');
      
      expect(messageElement).toBeInTheDocument();
      expect(container).toHaveClass('bg-gray-200', 'text-gray-800', 'rounded-lg');
    });

    it('displays assistant message aligned to the left', () => {
      render(<MessageItem message={assistantMessage} />);
      
      const containerDiv = screen.getByRole('listitem');
      expect(containerDiv).toHaveClass('justify-start');
    });
  });

  describe('Error Messages', () => {
    const errorMessage: Message = {
      ...baseMessage,
      type: 'error'
    };

    it('renders error message with correct styling', () => {
      render(<MessageItem message={errorMessage} />);
      
      const messageElement = screen.getByText('Test message content');
      const container = messageElement.closest('.bg-red-100');
      
      expect(messageElement).toBeInTheDocument();
      expect(container).toHaveClass('bg-red-100', 'text-red-800', 'border-red-300');
    });

    it('displays error message centered', () => {
      render(<MessageItem message={errorMessage} />);
      
      const containerDiv = screen.getByRole('listitem');
      expect(containerDiv).toHaveClass('justify-center');
    });
  });

  describe('Source Indication', () => {
    it('displays local source when provided', () => {
      const messageWithSource: Message = {
        ...baseMessage,
        source: 'local'
      };

      render(<MessageItem message={messageWithSource} />);
      
      const sourceElement = screen.getByText('(local)');
      expect(sourceElement).toBeInTheDocument();
      expect(sourceElement).toHaveAttribute('aria-label', 'Message from local source');
    });

    it('displays remote source when provided', () => {
      const messageWithSource: Message = {
        ...baseMessage,
        source: 'remote'
      };

      render(<MessageItem message={messageWithSource} />);
      
      const sourceElement = screen.getByText('(remote)');
      expect(sourceElement).toBeInTheDocument();
      expect(sourceElement).toHaveAttribute('aria-label', 'Message from remote source');
    });

    it('does not display source when not provided', () => {
      render(<MessageItem message={baseMessage} />);
      
      const localSource = screen.queryByText('(local)');
      const remoteSource = screen.queryByText('(remote)');
      
      expect(localSource).not.toBeInTheDocument();
      expect(remoteSource).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<MessageItem message={baseMessage} />);
      
      const listItem = screen.getByRole('listitem');
      expect(listItem).toHaveAttribute('aria-label', 'user message from 06:00 AM');
    });

    it('has aria-live region for message content', () => {
      render(<MessageItem message={baseMessage} isLatest={true} />);
      
      const liveRegion = screen.getByText('Test message content').closest('[aria-live="polite"]');
      
      expect(liveRegion).toBeInTheDocument();
    });

    it('handles different message types in aria-label', () => {
      const errorMessage: Message = { ...baseMessage, type: 'error' };
      render(<MessageItem message={errorMessage} />);
      
      const listItem = screen.getByRole('listitem');
      expect(listItem).toHaveAttribute('aria-label', 'error message from 06:00 AM');
    });
  });

  describe('Content Formatting', () => {
    it('preserves whitespace and line breaks', () => {
      const multilineMessage: Message = {
        ...baseMessage,
        content: 'Line 1\nLine 2\n\nLine 4'
      };

      render(<MessageItem message={multilineMessage} />);
      
      // Check that the content is rendered with proper whitespace preservation
      const containers = screen.getAllByText((content, element) => {
        return element?.textContent === 'Line 1\nLine 2\n\nLine 4';
      });
      // Get the inner div with the whitespace-pre-wrap class
      const container = containers.find(el => el.classList.contains('whitespace-pre-wrap'));
      expect(container).toHaveClass('whitespace-pre-wrap');
    });

    it('handles long words with word breaking', () => {
      const longWordMessage: Message = {
        ...baseMessage,
        content: 'supercalifragilisticexpialidocious'
      };

      render(<MessageItem message={longWordMessage} />);
      
      const messageElement = screen.getByText('supercalifragilisticexpialidocious');
      const container = messageElement.closest('.break-words');
      expect(container).toHaveClass('break-words');
    });

    it('renders HTML content safely', () => {
      const htmlMessage: Message = {
        ...baseMessage,
        content: '<p>Hello <strong>world</strong></p><ul><li>Item 1</li><li>Item 2</li></ul>'
      };

      render(<MessageItem message={htmlMessage} />);
      
      // Check that HTML elements are rendered
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('world')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      
      // Check that strong tag is rendered
      const strongElement = screen.getByText('world');
      expect(strongElement.tagName).toBe('STRONG');
    });

    it('handles code blocks and inline code', () => {
      const codeMessage: Message = {
        ...baseMessage,
        content: '<p>Here is some <code>inline code</code></p><pre><code>function test() {\n  return "hello";\n}</code></pre>'
      };

      render(<MessageItem message={codeMessage} />);
      
      expect(screen.getByText('inline code')).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return element?.tagName === 'CODE' && element?.textContent?.includes('function test()');
      })).toBeInTheDocument();
    });
  });

  describe('Timestamp Formatting', () => {
    it('formats timestamp correctly', () => {
      const specificTimeMessage: Message = {
        ...baseMessage,
        timestamp: new Date('2024-01-01T15:30:45Z')
      };

      render(<MessageItem message={specificTimeMessage} />);
      
      // Should display time in HH:MM format (locale dependent)
      const timestamp = screen.getByText(/\d{1,2}:\d{2}/);
      expect(timestamp).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive max-width classes', () => {
      render(<MessageItem message={baseMessage} />);
      
      const messageElement = screen.getByText('Test message content');
      const bubble = messageElement.closest('.max-w-\\[85\\%\\]');
      
      expect(bubble).toHaveClass('max-w-[85%]', 'sm:max-w-xs', 'lg:max-w-2xl');
    });

    it('applies overflow handling for long content', () => {
      render(<MessageItem message={baseMessage} />);
      
      const messageElement = screen.getByText('Test message content');
      const bubble = messageElement.closest('.overflow-hidden');
      
      expect(bubble).toHaveClass('overflow-hidden');
    });
  });
});