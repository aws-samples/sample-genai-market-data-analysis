import { test, expect } from '@playwright/test';

test.describe('Accessibility E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('http://127.0.0.1:8080/invocations', async route => {
      const request = route.request();
      const postData = request.postData();
      const data = JSON.parse(postData || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ response: `Response to: ${data.prompt}` })
      });
    });
    
    await page.goto('/');
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper ARIA landmarks and structure', async ({ page }) => {
      // Check main content structure
      await expect(page.locator('main')).toBeVisible();
      
      // Check heading hierarchy
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
      await expect(h1).toHaveText(/next\.js chat app/i);
      
      // Check form elements have proper labels
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      await expect(messageInput).toHaveAttribute('aria-label');
      
      // Check buttons have proper labels
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      
      await expect(localButton).toHaveAttribute('aria-label');
      await expect(remoteButton).toHaveAttribute('aria-label');
      await expect(clearButton).toHaveAttribute('aria-label');
      
      // Check chat window has proper role and label
      const chatWindow = page.getByRole('log', { name: /chat message history/i });
      await expect(chatWindow).toBeVisible();
      await expect(chatWindow).toHaveAttribute('aria-label', 'Chat message history');
    });

    test('should announce new messages to screen readers', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      // Send a message
      await messageInput.fill('Test announcement');
      await localButton.click();
      
      // Check that announcement region exists and gets updated
      const announcementRegion = page.locator('[role="status"]');
      await expect(announcementRegion).toBeVisible();
      
      // Wait for response and check announcement
      await expect(page.getByText('Response to: Test announcement')).toBeVisible();
      
      // The announcement region should have been updated
      const announcementText = await announcementRegion.textContent();
      expect(announcementText).toContain('New message received');
    });

    test('should announce errors with proper priority', async ({ page }) => {
      // Setup error response
      await page.route('http://127.0.0.1:8080/invocations', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Test error announcement');
      await localButton.click();
      
      // Check error alert has proper ARIA attributes
      const alert = page.getByRole('alert');
      await expect(alert).toBeVisible();
      await expect(alert).toHaveAttribute('aria-live', 'assertive');
      await expect(alert).toHaveAttribute('aria-atomic', 'true');
      
      // Check announcement region also gets updated
      const announcementRegion = page.locator('[role="status"]');
      await expect(announcementRegion).toBeVisible();
    });

    test('should provide proper loading state announcements', async ({ page }) => {
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
      
      await messageInput.fill('Test loading announcement');
      await localButton.click();
      
      // Check loading indicators have proper text
      await expect(page.getByText(/sending\.\.\./i).first()).toBeVisible();
      
      // Wait for completion
      await expect(page.getByText('Delayed response to: Test loading announcement')).toBeVisible();
      
      // Loading indicators should be gone
      await expect(page.getByText(/sending\.\.\./i)).not.toBeVisible();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support full keyboard navigation', async ({ page }) => {
      // Start with input focused
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      await expect(messageInput).toBeFocused();
      
      // Type to enable buttons
      await messageInput.fill('Keyboard test');
      
      // Tab through all interactive elements
      await page.keyboard.press('Tab');
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      await expect(localButton).toBeFocused();
      
      await page.keyboard.press('Tab');
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      await expect(remoteButton).toBeFocused();
      
      await page.keyboard.press('Tab');
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      await expect(clearButton).toBeFocused();
      
      // Test reverse tab navigation
      await page.keyboard.press('Shift+Tab');
      await expect(remoteButton).toBeFocused();
      
      await page.keyboard.press('Shift+Tab');
      await expect(localButton).toBeFocused();
      
      await page.keyboard.press('Shift+Tab');
      await expect(messageInput).toBeFocused();
    });

    test('should support Enter key for sending messages', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      
      await messageInput.fill('Enter key test');
      await page.keyboard.press('Enter');
      
      // Should send to local endpoint by default
      await expect(page.getByText('Enter key test')).toBeVisible();
      await expect(page.getByText('Response to: Enter key test')).toBeVisible();
    });

    test('should support Space and Enter for button activation', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Space key test');
      
      // Focus the button and activate with Space
      await localButton.focus();
      await expect(localButton).toBeFocused();
      await page.keyboard.press('Space');
      
      await expect(page.getByText('Space key test')).toBeVisible();
      await expect(page.getByText('Response to: Space key test')).toBeVisible();
      
      // Test Enter key activation
      await messageInput.fill('Enter button test');
      await localButton.focus();
      await page.keyboard.press('Enter');
      
      await expect(page.getByText('Enter button test')).toBeVisible();
      await expect(page.getByText('Response to: Enter button test')).toBeVisible();
    });

    test('should handle keyboard navigation in dialogs', async ({ page }) => {
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      
      // Open dialog with keyboard
      await clearButton.focus();
      await page.keyboard.press('Enter');
      
      // Dialog should be open and confirm button focused
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      
      const confirmButton = page.getByRole('button', { name: /confirm clearing chat/i });
      const cancelButton = page.getByRole('button', { name: /cancel clearing chat/i });
      
      await expect(confirmButton).toBeFocused();
      
      // Tab to cancel button
      await page.keyboard.press('Shift+Tab');
      await expect(cancelButton).toBeFocused();
      
      // Tab back to confirm
      await page.keyboard.press('Tab');
      await expect(confirmButton).toBeFocused();
      
      // Escape should close dialog
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      
      // Focus should return to clear button
      await expect(clearButton).toBeFocused();
    });

    test('should trap focus within dialogs', async ({ page }) => {
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      
      await clearButton.click();
      
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      
      const confirmButton = page.getByRole('button', { name: /confirm clearing chat/i });
      const cancelButton = page.getByRole('button', { name: /cancel clearing chat/i });
      
      // Should start with confirm button focused
      await expect(confirmButton).toBeFocused();
      
      // Tab should cycle between dialog buttons only
      await page.keyboard.press('Tab');
      await expect(cancelButton).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(confirmButton).toBeFocused(); // Should wrap around
      
      // Shift+Tab should go backwards
      await page.keyboard.press('Shift+Tab');
      await expect(cancelButton).toBeFocused();
      
      await page.keyboard.press('Shift+Tab');
      await expect(confirmButton).toBeFocused(); // Should wrap around backwards
    });
  });

  test.describe('Focus Management', () => {
    test('should maintain logical focus order', async ({ page }) => {
      // Check initial focus
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      await expect(messageInput).toBeFocused();
      
      // After sending a message, focus should return to input
      await messageInput.fill('Focus test');
      await page.keyboard.press('Enter');
      
      await expect(page.getByText('Response to: Focus test')).toBeVisible();
      await expect(messageInput).toBeFocused();
      await expect(messageInput).toHaveValue(''); // Should be cleared
    });

    test('should restore focus after dialog interactions', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      
      // Send a message first
      await messageInput.fill('Dialog focus test');
      await page.keyboard.press('Enter');
      await expect(page.getByText('Response to: Dialog focus test')).toBeVisible();
      
      // Focus clear button and open dialog
      await clearButton.focus();
      await page.keyboard.press('Enter');
      
      // Cancel dialog
      const cancelButton = page.getByRole('button', { name: /cancel clearing chat/i });
      await cancelButton.click();
      
      // Focus should return to clear button
      await expect(clearButton).toBeFocused();
      
      // Test with confirm action
      await page.keyboard.press('Enter'); // Open dialog again
      const confirmButton = page.getByRole('button', { name: /confirm clearing chat/i });
      await confirmButton.click();
      
      // After clearing, focus should go to input
      await expect(messageInput).toBeFocused();
    });

    test('should handle focus during loading states', async ({ page }) => {
      // Setup delayed response
      await page.route('http://127.0.0.1:8080/invocations', async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
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
      
      await messageInput.fill('Loading focus test');
      await localButton.click();
      
      // During loading, buttons should be disabled but focusable
      await expect(localButton).toBeDisabled();
      await expect(messageInput).toBeDisabled();
      
      // Focus should still be manageable
      await localButton.focus();
      await expect(localButton).toBeFocused();
      
      // After loading completes, focus should return to input
      await expect(page.getByText('Delayed response to: Loading focus test')).toBeVisible();
      await expect(messageInput).toBeFocused();
      await expect(messageInput).toBeEnabled();
    });

    test('should handle focus during error states', async ({ page }) => {
      // Setup error response
      await page.route('http://127.0.0.1:8080/invocations', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Error focus test');
      await localButton.click();
      
      // Error should appear
      await expect(page.getByRole('alert')).toBeVisible();
      
      // Focus should return to input for user to try again
      await expect(messageInput).toBeFocused();
      
      // Retry button should be focusable if present
      const retryButton = page.getByRole('button', { name: /retry failed request/i });
      if (await retryButton.isVisible()) {
        await retryButton.focus();
        await expect(retryButton).toBeFocused();
      }
    });
  });

  test.describe('High Contrast and Visual Accessibility', () => {
    test('should work with high contrast mode', async ({ page }) => {
      // Simulate high contrast mode
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      
      // Add high contrast styles
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            * {
              background-color: black !important;
              color: white !important;
              border-color: white !important;
            }
            button {
              background-color: white !important;
              color: black !important;
              border: 2px solid white !important;
            }
            input {
              background-color: black !important;
              color: white !important;
              border: 2px solid white !important;
            }
          }
        `
      });
      
      // Test that elements are still visible and functional
      await expect(page.getByRole('heading', { name: /next\.js chat app/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /message input/i })).toBeVisible();
      
      // Test interaction
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('High contrast test');
      await localButton.click();
      
      await expect(page.getByText('High contrast test')).toBeVisible();
      await expect(page.getByText('Response to: High contrast test')).toBeVisible();
    });

    test('should respect reduced motion preferences', async ({ page }) => {
      // Enable reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      // Test that animations are reduced/disabled
      await messageInput.fill('Reduced motion test');
      await localButton.click();
      
      // Messages should still appear but without excessive animation
      await expect(page.getByText('Reduced motion test')).toBeVisible();
      await expect(page.getByText('Response to: Reduced motion test')).toBeVisible();
      
      // Check that any CSS animations respect the preference
      const computedStyle = await page.evaluate(() => {
        const element = document.querySelector('button');
        return element ? getComputedStyle(element).animationDuration : null;
      });
      
      // If animations are present, they should be very short or disabled
      if (computedStyle && computedStyle !== 'none') {
        expect(parseFloat(computedStyle)).toBeLessThanOrEqual(0.1); // 100ms or less
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // This is a basic test - in a real scenario you'd use tools like axe-core
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      // Check that elements have visible text
      await expect(messageInput).toBeVisible();
      await expect(localButton).toBeVisible();
      
      // Send a message to test message contrast
      await messageInput.fill('Contrast test');
      await localButton.click();
      
      await expect(page.getByText('Contrast test')).toBeVisible();
      await expect(page.getByText('Response to: Contrast test')).toBeVisible();
      
      // Check that error messages are also visible
      await page.route('http://127.0.0.1:8080/invocations', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      });
      
      await messageInput.fill('Error contrast test');
      await localButton.click();
      
      const alert = page.getByRole('alert');
      await expect(alert).toBeVisible();
      
      // Error text should be visible
      await expect(page.getByText(/local service is temporarily unavailable/i)).toBeVisible();
    });
  });

  test.describe('Screen Reader Specific Tests', () => {
    test('should provide meaningful button descriptions', async ({ page }) => {
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      
      // Check that buttons have descriptive aria-labels
      await expect(localButton).toHaveAttribute('aria-label', 'Send message to local endpoint at 127.0.0.1:8080');
      await expect(remoteButton).toHaveAttribute('aria-label', 'Send message to remote endpoint');
      await expect(clearButton).toHaveAttribute('aria-label', 'Clear chat history');
    });

    test('should provide context for form inputs', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      
      // Check that input has proper labeling and description
      await expect(messageInput).toHaveAttribute('aria-label', 'Message input');
      
      const describedBy = await messageInput.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      
      // Check that the description element exists
      if (describedBy) {
        const descriptionElement = page.locator(`#${describedBy}`);
        await expect(descriptionElement).toBeVisible();
      }
    });

    test('should announce dynamic content changes', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      // Send a message
      await messageInput.fill('Dynamic content test');
      await localButton.click();
      
      // Check that the chat log is updated
      const chatLog = page.getByRole('log', { name: /chat message history/i });
      await expect(chatLog).toContainText('Dynamic content test');
      await expect(chatLog).toContainText('Response to: Dynamic content test');
      
      // Check that announcement region is updated
      const announcementRegion = page.locator('[role="status"]');
      await expect(announcementRegion).toBeVisible();
    });

    test('should handle live region updates properly', async ({ page }) => {
      // Setup delayed response to test live region timing
      await page.route('http://127.0.0.1:8080/invocations', async route => {
        await new Promise(resolve => setTimeout(resolve, 800));
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
      
      await messageInput.fill('Live region test');
      await localButton.click();
      
      // Check that loading state is announced
      const announcementRegion = page.locator('[role="status"]');
      await expect(announcementRegion).toBeVisible();
      
      // Wait for response
      await expect(page.getByText('Delayed response to: Live region test')).toBeVisible();
      
      // Check that completion is announced
      const finalAnnouncement = await announcementRegion.textContent();
      expect(finalAnnouncement).toContain('New message received');
    });
  });
});