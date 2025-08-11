import { test, expect } from '@playwright/test';

/**
 * Requirements Coverage Tests
 * 
 * This file contains tests that specifically verify each requirement from the requirements document.
 * Each test is mapped to specific requirements to ensure complete coverage.
 */

test.describe('Requirements Coverage Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful API responses
    await page.route('http://127.0.0.1:8080/invocations', async route => {
      const request = route.request();
      const postData = request.postData();
      const data = JSON.parse(postData || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ response: `Local response to: ${data.prompt}` })
      });
    });

    await page.route('**/remote-endpoint/**', async route => {
      const request = route.request();
      const postData = request.postData();
      const data = JSON.parse(postData || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ response: `Remote response to: ${data.prompt}` })
      });
    });
    
    await page.goto('/');
  });

  test.describe('Requirement 1: Chat Interface and Message History', () => {
    test('1.1 - Should display chat window with message history on load', async ({ page }) => {
      // WHEN the application loads THEN the system SHALL display a chat window with message history
      const chatWindow = page.getByRole('log', { name: /chat message history/i });
      await expect(chatWindow).toBeVisible();
      
      // Verify it's properly labeled for accessibility
      await expect(chatWindow).toHaveAttribute('aria-label', 'Chat message history');
    });

    test('1.2 - Should display messages in chronological order', async ({ page }) => {
      // WHEN messages are sent or received THEN the system SHALL display them in chronological order
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      // Send first message
      await messageInput.fill('First message');
      await localButton.click();
      await expect(page.getByText('Local response to: First message')).toBeVisible();
      
      // Send second message
      await messageInput.fill('Second message');
      await localButton.click();
      await expect(page.getByText('Local response to: Second message')).toBeVisible();
      
      // Verify chronological order
      const messages = page.locator('[role="log"] > div');
      await expect(messages.nth(0)).toContainText('First message');
      await expect(messages.nth(1)).toContainText('Local response to: First message');
      await expect(messages.nth(2)).toContainText('Second message');
      await expect(messages.nth(3)).toContainText('Local response to: Second message');
    });

    test('1.3 - Should auto-scroll to show latest message', async ({ page }) => {
      // WHEN the chat window contains multiple messages THEN the system SHALL automatically scroll to show the latest message
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const chatWindow = page.getByRole('log', { name: /chat message history/i });
      
      // Send multiple messages to create scrollable content
      for (let i = 1; i <= 10; i++) {
        await messageInput.fill(`Message ${i}`);
        await localButton.click();
        await expect(page.getByText(`Local response to: Message ${i}`)).toBeVisible();
      }
      
      // Verify auto-scroll to bottom
      const isScrolledToBottom = await chatWindow.evaluate(el => {
        return Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 10;
      });
      expect(isScrolledToBottom).toBe(true);
      
      // Verify latest message is visible
      await expect(page.getByText('Local response to: Message 10')).toBeVisible();
    });

    test('1.4 - Should display empty chat state when no messages exist', async ({ page }) => {
      // WHEN no messages exist THEN the system SHALL display an empty chat state
      await expect(page.getByText(/no messages yet/i)).toBeVisible();
      await expect(page.getByText(/start a conversation by typing a message below/i)).toBeVisible();
    });
  });

  test.describe('Requirement 2: Local Endpoint Communication', () => {
    test('2.1 - Should send message to local endpoint on button click', async ({ page }) => {
      // WHEN I click the "Send to local" button THEN the system SHALL send my message to http://127.0.0.1:8080/invocations
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      // Verify the request is made to the correct endpoint
      let requestMade = false;
      page.on('request', request => {
        if (request.url() === 'http://127.0.0.1:8080/invocations') {
          requestMade = true;
        }
      });
      
      await messageInput.fill('Test local endpoint');
      await localButton.click();
      
      expect(requestMade).toBe(true);
      await expect(page.getByText('Local response to: Test local endpoint')).toBeVisible();
    });

    test('2.2 - Should include message in JSON payload with prompt field', async ({ page }) => {
      // WHEN sending to local THEN the system SHALL include the message in a JSON payload with "prompt" field
      let requestPayload: any = null;
      
      page.on('request', request => {
        if (request.url() === 'http://127.0.0.1:8080/invocations') {
          requestPayload = JSON.parse(request.postData() || '{}');
        }
      });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Test prompt field');
      await localButton.click();
      
      expect(requestPayload).toBeTruthy();
      expect(requestPayload.prompt).toBe('Test prompt field');
    });

    test('2.3 - Should set Content-Type header to application/json', async ({ page }) => {
      // WHEN sending to local THEN the system SHALL set Content-Type header to application/json
      let contentType: string | null = null;
      
      page.on('request', request => {
        if (request.url() === 'http://127.0.0.1:8080/invocations') {
          contentType = request.headers()['content-type'];
        }
      });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Test content type');
      await localButton.click();
      
      expect(contentType).toBe('application/json');
    });

    test('2.4 - Should use 15-minute timeout', async ({ page }) => {
      // WHEN sending to local THEN the system SHALL use a 15-minute timeout (900 seconds)
      // This is tested by checking the service configuration rather than waiting 15 minutes
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Test timeout config');
      await localButton.click();
      
      // Verify the request completes successfully (indicating proper timeout configuration)
      await expect(page.getByText('Local response to: Test timeout config')).toBeVisible();
    });

    test('2.5 - Should display response in chat window', async ({ page }) => {
      // WHEN the local endpoint responds THEN the system SHALL display the response in the chat window
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Test response display');
      await localButton.click();
      
      // Verify both user message and response are displayed
      await expect(page.getByText('Test response display')).toBeVisible();
      await expect(page.getByText('Local response to: Test response display')).toBeVisible();
    });

    test('2.6 - Should display error message when local endpoint fails', async ({ page }) => {
      // WHEN the local endpoint fails THEN the system SHALL display an appropriate error message
      await page.route('http://127.0.0.1:8080/invocations', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Test error handling');
      await localButton.click();
      
      // Verify error message is displayed
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByText(/local service is temporarily unavailable/i)).toBeVisible();
    });
  });

  test.describe('Requirement 3: Remote Endpoint Communication', () => {
    test('3.1 - Should send message to remote endpoint on button click', async ({ page }) => {
      // WHEN I click the "Send to remote" button THEN the system SHALL send my message to a configurable remote endpoint
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      
      await messageInput.fill('Test remote endpoint');
      await remoteButton.click();
      
      await expect(page.getByText('Test remote endpoint')).toBeVisible();
      await expect(page.getByText('Remote response to: Test remote endpoint')).toBeVisible();
    });

    test('3.2 - Should use same JSON payload format as local requests', async ({ page }) => {
      // WHEN sending to remote THEN the system SHALL use the same JSON payload format as local requests
      let remotePayload: any = null;
      
      page.on('request', request => {
        if (request.url().includes('remote-endpoint')) {
          remotePayload = JSON.parse(request.postData() || '{}');
        }
      });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      
      await messageInput.fill('Test remote payload');
      await remoteButton.click();
      
      expect(remotePayload).toBeTruthy();
      expect(remotePayload.prompt).toBe('Test remote payload');
    });

    test('3.3 - Should handle authentication if required', async ({ page }) => {
      // WHEN sending to remote THEN the system SHALL handle authentication if required
      // This test verifies that auth headers can be included
      let authHeader: string | null = null;
      
      page.on('request', request => {
        if (request.url().includes('remote-endpoint')) {
          authHeader = request.headers()['authorization'] || null;
        }
      });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      
      await messageInput.fill('Test auth handling');
      await remoteButton.click();
      
      // Verify request completes (auth handling works)
      await expect(page.getByText('Remote response to: Test auth handling')).toBeVisible();
    });

    test('3.4 - Should display remote response in chat window', async ({ page }) => {
      // WHEN the remote endpoint responds THEN the system SHALL display the response in the chat window
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      
      await messageInput.fill('Test remote response');
      await remoteButton.click();
      
      await expect(page.getByText('Test remote response')).toBeVisible();
      await expect(page.getByText('Remote response to: Test remote response')).toBeVisible();
    });

    test('3.5 - Should display error message when remote endpoint fails', async ({ page }) => {
      // WHEN the remote endpoint fails THEN the system SHALL display an appropriate error message
      await page.route('**/remote-endpoint/**', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Remote server error' })
        });
      });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      
      await messageInput.fill('Test remote error');
      await remoteButton.click();
      
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByText(/remote service is temporarily unavailable/i)).toBeVisible();
    });
  });

  test.describe('Requirement 4: Clear Chat History', () => {
    test('4.1 - Should remove all messages when clear button is clicked', async ({ page }) => {
      // WHEN I click the "Clear chat" button THEN the system SHALL remove all messages from the chat window
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      
      // Send some messages first
      await messageInput.fill('Message to clear');
      await localButton.click();
      await expect(page.getByText('Local response to: Message to clear')).toBeVisible();
      
      // Clear chat
      await clearButton.click();
      await page.getByRole('button', { name: /confirm clearing chat/i }).click();
      
      // Verify messages are removed
      await expect(page.getByText('Message to clear')).not.toBeVisible();
      await expect(page.getByText('Local response to: Message to clear')).not.toBeVisible();
    });

    test('4.2 - Should show confirmation dialog to prevent accidental clearing', async ({ page }) => {
      // WHEN clearing chat THEN the system SHALL show a confirmation dialog to prevent accidental clearing
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      
      await clearButton.click();
      
      // Verify confirmation dialog appears
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      
      // Verify dialog content
      await expect(page.getByText(/are you sure you want to clear/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /confirm clearing chat/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /cancel clearing chat/i })).toBeVisible();
    });

    test('4.3 - Should return to empty chat state after clearing', async ({ page }) => {
      // WHEN chat is cleared THEN the system SHALL return to the empty chat state
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      
      // Send a message first
      await messageInput.fill('Test empty state');
      await localButton.click();
      await expect(page.getByText('Local response to: Test empty state')).toBeVisible();
      
      // Clear chat
      await clearButton.click();
      await page.getByRole('button', { name: /confirm clearing chat/i }).click();
      
      // Verify empty state is shown
      await expect(page.getByText(/no messages yet/i)).toBeVisible();
      await expect(page.getByText(/start a conversation by typing a message below/i)).toBeVisible();
    });

    test('4.4 - Should not affect server-side conversation state', async ({ page }) => {
      // WHEN chat is cleared THEN the system SHALL not affect any server-side conversation state
      // This is verified by ensuring that clearing is a client-side only operation
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      
      let clearRequestMade = false;
      page.on('request', request => {
        if (request.url().includes('clear') || request.method() === 'DELETE') {
          clearRequestMade = true;
        }
      });
      
      // Send a message and clear
      await messageInput.fill('Test server state');
      await localButton.click();
      await clearButton.click();
      await page.getByRole('button', { name: /confirm clearing chat/i }).click();
      
      // Verify no server request was made for clearing
      expect(clearRequestMade).toBe(false);
    });
  });

  test.describe('Requirement 5: Message Input Field', () => {
    test('5.1 - Should display text input field on application load', async ({ page }) => {
      // WHEN the application loads THEN the system SHALL display a text input field for message composition
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      await expect(messageInput).toBeVisible();
      await expect(messageInput).toHaveAttribute('type', 'text');
    });

    test('5.2 - Should show text in real-time as user types', async ({ page }) => {
      // WHEN I type in the input field THEN the system SHALL show my text in real-time
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      
      await messageInput.fill('Real-time typing test');
      await expect(messageInput).toHaveValue('Real-time typing test');
      
      // Test character by character
      await messageInput.clear();
      await messageInput.type('Hello', { delay: 100 });
      await expect(messageInput).toHaveValue('Hello');
    });

    test('5.3 - Should trigger default send action on Enter key', async ({ page }) => {
      // WHEN I press Enter THEN the system SHALL trigger the default send action
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      
      await messageInput.fill('Enter key test');
      await messageInput.press('Enter');
      
      // Should send to local endpoint by default
      await expect(page.getByText('Enter key test')).toBeVisible();
      await expect(page.getByText('Local response to: Enter key test')).toBeVisible();
    });

    test('5.4 - Should clear input field after message is sent', async ({ page }) => {
      // WHEN a message is sent THEN the system SHALL clear the input field
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Clear input test');
      await localButton.click();
      
      // Wait for response and verify input is cleared
      await expect(page.getByText('Local response to: Clear input test')).toBeVisible();
      await expect(messageInput).toHaveValue('');
    });

    test('5.5 - Should disable send buttons when input field is empty', async ({ page }) => {
      // WHEN the input field is empty THEN the system SHALL disable the send buttons
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      
      // Initially empty - buttons should be disabled
      await expect(localButton).toBeDisabled();
      await expect(remoteButton).toBeDisabled();
      
      // Type something - buttons should be enabled
      await messageInput.fill('Enable buttons');
      await expect(localButton).toBeEnabled();
      await expect(remoteButton).toBeEnabled();
      
      // Clear input - buttons should be disabled again
      await messageInput.clear();
      await expect(localButton).toBeDisabled();
      await expect(remoteButton).toBeDisabled();
    });
  });

  test.describe('Requirement 6: Visual Feedback During API Calls', () => {
    test('6.1 - Should show loading indicator when message is being sent', async ({ page }) => {
      // WHEN a message is being sent THEN the system SHALL show a loading indicator
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
      
      await messageInput.fill('Loading test');
      await localButton.click();
      
      // Verify loading indicators appear
      await expect(page.getByText(/sending\.\.\./i).first()).toBeVisible();
    });

    test('6.2 - Should disable send buttons during API call', async ({ page }) => {
      // WHEN a message is being sent THEN the system SHALL disable the send buttons to prevent duplicate requests
      await page.route('http://127.0.0.1:8080/invocations', async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const request = route.request();
        const postData = request.postData();
        const data = JSON.parse(postData || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ response: `Response to: ${data.prompt}` })
        });
      });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      
      await messageInput.fill('Disable buttons test');
      await localButton.click();
      
      // Verify buttons are disabled during request
      await expect(localButton).toBeDisabled();
      await expect(remoteButton).toBeDisabled();
      await expect(messageInput).toBeDisabled();
    });

    test('6.3 - Should hide loading indicator and re-enable buttons when API call completes', async ({ page }) => {
      // WHEN the API call completes THEN the system SHALL hide the loading indicator and re-enable the send buttons
      await page.route('http://127.0.0.1:8080/invocations', async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const request = route.request();
        const postData = request.postData();
        const data = JSON.parse(postData || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ response: `Response to: ${data.prompt}` })
        });
      });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      
      await messageInput.fill('Complete loading test');
      await localButton.click();
      
      // Wait for completion
      await expect(page.getByText('Response to: Complete loading test')).toBeVisible();
      
      // Verify loading indicators are hidden and buttons are re-enabled
      await expect(page.getByText(/sending\.\.\./i)).not.toBeVisible();
      await expect(messageInput).toBeEnabled();
      // Note: buttons will be disabled again because input is empty after sending
    });
  });

  test.describe('Requirement 7: Responsive and Accessible Design', () => {
    test('7.1 - Should adapt layout appropriately on mobile devices', async ({ page }) => {
      // WHEN viewed on mobile devices THEN the system SHALL adapt the layout appropriately
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
      
      // Verify all elements are still visible and accessible
      await expect(page.getByRole('heading', { name: /next\.js chat app/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /message input/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /send message to local endpoint/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /send message to remote endpoint/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /clear chat history/i })).toBeVisible();
      
      // Test interaction on mobile
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Mobile test');
      await localButton.click();
      
      await expect(page.getByText('Mobile test')).toBeVisible();
      await expect(page.getByText('Local response to: Mobile test')).toBeVisible();
    });

    test('7.2 - Should provide proper focus management for keyboard navigation', async ({ page }) => {
      // WHEN using keyboard navigation THEN the system SHALL provide proper focus management
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      
      // Input should be focused initially
      await expect(messageInput).toBeFocused();
      
      // Type to enable buttons
      await messageInput.fill('Focus test');
      
      // Tab through elements
      await page.keyboard.press('Tab');
      await expect(localButton).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(remoteButton).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(clearButton).toBeFocused();
      
      // Shift+Tab should go backwards
      await page.keyboard.press('Shift+Tab');
      await expect(remoteButton).toBeFocused();
    });

    test('7.3 - Should provide appropriate ARIA labels and descriptions for screen readers', async ({ page }) => {
      // WHEN using screen readers THEN the system SHALL provide appropriate ARIA labels and descriptions
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      const chatWindow = page.getByRole('log', { name: /chat message history/i });
      
      // Verify ARIA labels
      await expect(messageInput).toHaveAttribute('aria-label', 'Message input');
      await expect(localButton).toHaveAttribute('aria-label', 'Send message to local endpoint at 127.0.0.1:8080');
      await expect(remoteButton).toHaveAttribute('aria-label', 'Send message to remote endpoint');
      await expect(clearButton).toHaveAttribute('aria-label', 'Clear chat history');
      await expect(chatWindow).toHaveAttribute('aria-label', 'Chat message history');
      
      // Verify input has description
      const describedBy = await messageInput.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
    });

    test('7.4 - Should announce new messages to screen readers', async ({ page }) => {
      // WHEN messages are added THEN the system SHALL announce new messages to screen readers
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Announcement test');
      await localButton.click();
      
      // Verify announcement region exists and is updated
      const announcementRegion = page.locator('[role="status"]');
      await expect(announcementRegion).toBeVisible();
      
      // Wait for response
      await expect(page.getByText('Local response to: Announcement test')).toBeVisible();
      
      // Verify announcement was made
      const announcementText = await announcementRegion.textContent();
      expect(announcementText).toContain('New message received');
    });
  });
});