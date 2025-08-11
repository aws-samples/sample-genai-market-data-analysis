import { test, expect, Page } from '@playwright/test';

// Mock server setup for testing
const setupMockServer = async (page: Page) => {
  // Mock successful local endpoint
  await page.route('http://127.0.0.1:8080/invocations', async route => {
    const request = route.request();
    const postData = request.postData();
    
    if (postData) {
      const data = JSON.parse(postData);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ response: `Local response to: ${data.prompt}` })
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'No prompt provided' })
      });
    }
  });

  // Mock remote endpoint (using environment variable or default)
  await page.route('**/remote-endpoint/**', async route => {
    const request = route.request();
    const postData = request.postData();
    
    if (postData) {
      const data = JSON.parse(postData);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ response: `Remote response to: ${data.prompt}` })
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'No prompt provided' })
      });
    }
  });
};

const setupErrorMockServer = async (page: Page, errorType: 'network' | 'timeout' | 'server') => {
  const handler = async (route: any) => {
    if (errorType === 'network') {
      await route.abort('failed');
    } else if (errorType === 'timeout') {
      // Simulate timeout by delaying response
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 408,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Request timeout' })
      });
    } else if (errorType === 'server') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    }
  };

  await page.route('http://127.0.0.1:8080/invocations', handler);
  await page.route('**/remote-endpoint/**', handler);
};

test.describe('Chat Application E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockServer(page);
    await page.goto('/');
  });

  test.describe('Initial Page Load', () => {
    test('should display the main chat interface', async ({ page }) => {
      // Check main heading
      await expect(page.getByRole('heading', { name: /next\.js chat app/i })).toBeVisible();
      
      // Check subtitle
      await expect(page.getByText(/send messages to local or remote endpoints/i)).toBeVisible();
      
      // Check input field
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      await expect(messageInput).toBeVisible();
      await expect(messageInput).toBeFocused();
      
      // Check buttons
      await expect(page.getByRole('button', { name: /send message to local endpoint/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /send message to remote endpoint/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /clear chat history/i })).toBeVisible();
      
      // Check empty state
      await expect(page.getByText(/no messages yet/i)).toBeVisible();
      await expect(page.getByText(/start a conversation by typing a message below/i)).toBeVisible();
    });

    test('should have send buttons disabled initially', async ({ page }) => {
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      
      await expect(localButton).toBeDisabled();
      await expect(remoteButton).toBeDisabled();
    });

    test('should enable send buttons when user types', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      
      await messageInput.fill('Hello world');
      
      await expect(localButton).toBeEnabled();
      await expect(remoteButton).toBeEnabled();
    });
  });

  test.describe('Local Endpoint Communication', () => {
    test('should send message to local endpoint and display response', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      // Type and send message
      await messageInput.fill('Hello local endpoint');
      await localButton.click();
      
      // Check user message appears
      await expect(page.getByText('Hello local endpoint')).toBeVisible();
      
      // Check response appears
      await expect(page.getByText('Local response to: Hello local endpoint')).toBeVisible();
      
      // Check input is cleared
      await expect(messageInput).toHaveValue('');
      
      // Check empty state is gone
      await expect(page.getByText(/no messages yet/i)).not.toBeVisible();
    });

    test('should send message via Enter key', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      
      // Type message and press Enter
      await messageInput.fill('Hello via Enter');
      await messageInput.press('Enter');
      
      // Check user message appears
      await expect(page.getByText('Hello via Enter')).toBeVisible();
      
      // Check response appears (should go to local by default)
      await expect(page.getByText('Local response to: Hello via Enter')).toBeVisible();
    });

    test('should show loading state during request', async ({ page }) => {
      // Setup delayed response
      await page.route('http://127.0.0.1:8080/invocations', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const request = route.request();
        const postData = request.postData();
        const data = JSON.parse(postData || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ response: `Delayed response to: ${data.prompt}` })
        });
      });

      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Test loading');
      await localButton.click();
      
      // Check loading indicators
      await expect(page.getByText(/sending\.\.\./i).first()).toBeVisible();
      await expect(localButton).toBeDisabled();
      await expect(messageInput).toBeDisabled();
      
      // Wait for response
      await expect(page.getByText('Delayed response to: Test loading')).toBeVisible();
      
      // Check loading state is cleared
      await expect(page.getByText(/sending\.\.\./i)).not.toBeVisible();
      await expect(localButton).toBeEnabled();
      await expect(messageInput).toBeEnabled();
    });
  });

  test.describe('Remote Endpoint Communication', () => {
    test('should send message to remote endpoint and display response', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      
      // Type and send message
      await messageInput.fill('Hello remote endpoint');
      await remoteButton.click();
      
      // Check user message appears
      await expect(page.getByText('Hello remote endpoint')).toBeVisible();
      
      // Check response appears
      await expect(page.getByText('Remote response to: Hello remote endpoint')).toBeVisible();
      
      // Check input is cleared
      await expect(messageInput).toHaveValue('');
    });
  });

  test.describe('Chat History Management', () => {
    test('should display multiple messages in chronological order', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      
      // Send first message to local
      await messageInput.fill('First message');
      await localButton.click();
      await expect(page.getByText('Local response to: First message')).toBeVisible();
      
      // Send second message to remote
      await messageInput.fill('Second message');
      await remoteButton.click();
      await expect(page.getByText('Remote response to: Second message')).toBeVisible();
      
      // Check all messages are present in order
      const messages = page.locator('[role="log"] > div');
      await expect(messages).toHaveCount(4); // 2 user messages + 2 responses
      
      // Check order
      await expect(messages.nth(0)).toContainText('First message');
      await expect(messages.nth(1)).toContainText('Local response to: First message');
      await expect(messages.nth(2)).toContainText('Second message');
      await expect(messages.nth(3)).toContainText('Remote response to: Second message');
    });

    test('should clear chat history when clear button is clicked', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      
      // Send a message first
      await messageInput.fill('Test message');
      await localButton.click();
      await expect(page.getByText('Local response to: Test message')).toBeVisible();
      
      // Clear chat
      await clearButton.click();
      
      // Confirm in dialog
      const confirmButton = page.getByRole('button', { name: /confirm clearing chat/i });
      await expect(confirmButton).toBeVisible();
      await confirmButton.click();
      
      // Check messages are cleared
      await expect(page.getByText('Test message')).not.toBeVisible();
      await expect(page.getByText('Local response to: Test message')).not.toBeVisible();
      await expect(page.getByText(/no messages yet/i)).toBeVisible();
    });

    test('should cancel clear chat dialog', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      
      // Send a message first
      await messageInput.fill('Test message');
      await localButton.click();
      await expect(page.getByText('Local response to: Test message')).toBeVisible();
      
      // Open clear dialog
      await clearButton.click();
      
      // Cancel dialog
      const cancelButton = page.getByRole('button', { name: /cancel clearing chat/i });
      await expect(cancelButton).toBeVisible();
      await cancelButton.click();
      
      // Check messages are still there
      await expect(page.getByText('Test message')).toBeVisible();
      await expect(page.getByText('Local response to: Test message')).toBeVisible();
      await expect(page.getByText(/no messages yet/i)).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await setupErrorMockServer(page, 'network');
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Test network error');
      await localButton.click();
      
      // Check error message appears
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByText(/unable to connect to local endpoint/i)).toBeVisible();
      
      // Check error message in chat
      await expect(page.getByText(/unable to connect to local endpoint/i)).toBeVisible();
    });

    test('should handle server errors gracefully', async ({ page }) => {
      await setupErrorMockServer(page, 'server');
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Test server error');
      await localButton.click();
      
      // Check error message appears
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByText(/local service is temporarily unavailable/i)).toBeVisible();
    });

    test('should show retry button for retryable errors', async ({ page }) => {
      await setupErrorMockServer(page, 'network');
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Test retry');
      await localButton.click();
      
      // Check retry button appears
      await expect(page.getByRole('button', { name: /retry failed request/i })).toBeVisible();
    });

    test('should retry failed request when retry button is clicked', async ({ page }) => {
      // First setup error, then success
      let callCount = 0;
      await page.route('http://127.0.0.1:8080/invocations', async route => {
        callCount++;
        if (callCount === 1) {
          await route.abort('failed');
        } else {
          const request = route.request();
          const postData = request.postData();
          const data = JSON.parse(postData || '{}');
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ response: `Retry success: ${data.prompt}` })
          });
        }
      });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Test retry success');
      await localButton.click();
      
      // Wait for error and retry button
      const retryButton = page.getByRole('button', { name: /retry failed request/i });
      await expect(retryButton).toBeVisible();
      
      // Click retry
      await retryButton.click();
      
      // Check success response
      await expect(page.getByText('Retry success: Test retry success')).toBeVisible();
      await expect(page.getByRole('alert')).not.toBeVisible();
    });

    test('should dismiss error manually', async ({ page }) => {
      await setupErrorMockServer(page, 'server');
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Test dismiss error');
      await localButton.click();
      
      // Wait for error
      await expect(page.getByRole('alert')).toBeVisible();
      
      // Dismiss error
      const dismissButton = page.getByRole('button', { name: /dismiss error/i });
      await dismissButton.click();
      
      // Check error is dismissed
      await expect(page.getByRole('alert')).not.toBeVisible();
    });

    test('should clear error when user starts typing', async ({ page }) => {
      await setupErrorMockServer(page, 'server');
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Test error clear');
      await localButton.click();
      
      // Wait for error
      await expect(page.getByRole('alert')).toBeVisible();
      
      // Start typing
      await messageInput.fill('New message');
      
      // Check error is cleared
      await expect(page.getByRole('alert')).not.toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check main landmarks
      await expect(page.getByRole('textbox', { name: /message input/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /send message to local endpoint/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /send message to remote endpoint/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /clear chat history/i })).toBeVisible();
      await expect(page.getByRole('log', { name: /chat message history/i })).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      
      // Input should be focused initially
      await expect(messageInput).toBeFocused();
      
      // Type to enable buttons
      await messageInput.fill('test');
      
      // Tab through buttons
      await page.keyboard.press('Tab');
      await expect(localButton).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(remoteButton).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(clearButton).toBeFocused();
    });

    test('should announce errors to screen readers', async ({ page }) => {
      await setupErrorMockServer(page, 'server');
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Test error announcement');
      await localButton.click();
      
      // Check error has proper ARIA attributes
      const alert = page.getByRole('alert');
      await expect(alert).toBeVisible();
      await expect(alert).toHaveAttribute('aria-live', 'assertive');
      await expect(alert).toHaveAttribute('aria-atomic', 'true');
    });

    test('should have proper dialog accessibility', async ({ page }) => {
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      
      // Open dialog
      await clearButton.click();
      
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(dialog).toHaveAttribute('aria-labelledby', 'clear-dialog-title');
      await expect(dialog).toHaveAttribute('aria-describedby', 'clear-dialog-description');
      
      // Confirm button should have focus
      const confirmButton = page.getByRole('button', { name: /confirm clearing chat/i });
      await expect(confirmButton).toBeFocused();
    });

    test('should support keyboard navigation in dialogs', async ({ page }) => {
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      
      // Open dialog
      await clearButton.click();
      
      const confirmButton = page.getByRole('button', { name: /confirm clearing chat/i });
      const cancelButton = page.getByRole('button', { name: /cancel clearing chat/i });
      
      // Confirm button should be focused initially
      await expect(confirmButton).toBeFocused();
      
      // Shift+Tab should move to cancel button
      await page.keyboard.press('Shift+Tab');
      await expect(cancelButton).toBeFocused();
      
      // Escape should close dialog
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });
});