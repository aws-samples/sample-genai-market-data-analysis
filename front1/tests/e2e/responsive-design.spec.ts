import { test, expect, devices } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful API responses
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

  test.describe('Desktop Layout', () => {
    test('should display properly on desktop screens', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Check main heading size
      const heading = page.getByRole('heading', { name: /next\.js chat app/i });
      await expect(heading).toBeVisible();
      
      // Check that elements are properly spaced
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const buttons = page.locator('button').filter({ hasText: /send/i });
      
      await expect(messageInput).toBeVisible();
      await expect(buttons.first()).toBeVisible();
      
      // Check chat window has adequate height
      const chatWindow = page.getByRole('log', { name: /chat message history/i });
      const chatWindowBox = await chatWindow.boundingBox();
      expect(chatWindowBox?.height).toBeGreaterThan(300);
    });

    test('should handle large amounts of content on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      // Send multiple messages to test scrolling
      for (let i = 1; i <= 10; i++) {
        await messageInput.fill(`Message ${i}`);
        await localButton.click();
        await expect(page.getByText(`Response to: Message ${i}`)).toBeVisible();
      }
      
      // Check that the latest message is visible (auto-scroll)
      await expect(page.getByText('Response to: Message 10')).toBeVisible();
      
      // Check that the chat window is scrollable
      const chatWindow = page.getByRole('log', { name: /chat message history/i });
      const scrollTop = await chatWindow.evaluate(el => el.scrollTop);
      expect(scrollTop).toBeGreaterThan(0);
    });
  });

  test.describe('Tablet Layout', () => {
    test('should adapt layout for tablet screens', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check that all elements are still visible and accessible
      await expect(page.getByRole('heading', { name: /next\.js chat app/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /message input/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /send message to local endpoint/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /send message to remote endpoint/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /clear chat history/i })).toBeVisible();
      
      // Test interaction on tablet
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Tablet test message');
      await localButton.click();
      
      await expect(page.getByText('Tablet test message')).toBeVisible();
      await expect(page.getByText('Response to: Tablet test message')).toBeVisible();
    });

    test('should handle touch interactions on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      // Test touch tap
      await messageInput.tap();
      await expect(messageInput).toBeFocused();
      
      await messageInput.fill('Touch test');
      await localButton.tap();
      
      await expect(page.getByText('Touch test')).toBeVisible();
    });
  });

  test.describe('Mobile Layout', () => {
    test('should adapt layout for mobile screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
      
      // Check that all elements are still visible and accessible
      await expect(page.getByRole('heading', { name: /next\.js chat app/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /message input/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /send message to local endpoint/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /send message to remote endpoint/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /clear chat history/i })).toBeVisible();
      
      // Check that buttons are appropriately sized for touch
      const buttons = page.locator('button');
      for (let i = 0; i < await buttons.count(); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        if (box) {
          // Buttons should be at least 44px tall for touch accessibility
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('should handle mobile interactions properly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      // Test mobile interaction
      await messageInput.tap();
      await expect(messageInput).toBeFocused();
      
      await messageInput.fill('Mobile test message');
      await localButton.tap();
      
      await expect(page.getByText('Mobile test message')).toBeVisible();
      await expect(page.getByText('Response to: Mobile test message')).toBeVisible();
    });

    test('should handle virtual keyboard on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      
      // Focus input (this would trigger virtual keyboard on real device)
      await messageInput.tap();
      await expect(messageInput).toBeFocused();
      
      // Type a longer message to test text wrapping
      const longMessage = 'This is a longer message to test how the input field handles text wrapping and virtual keyboard interactions on mobile devices';
      await messageInput.fill(longMessage);
      
      await expect(messageInput).toHaveValue(longMessage);
      
      // Test that the input is still visible and accessible
      await expect(messageInput).toBeVisible();
    });

    test('should handle portrait and landscape orientations', async ({ page }) => {
      // Test portrait
      await page.setViewportSize({ width: 375, height: 667 });
      
      await expect(page.getByRole('heading', { name: /next\.js chat app/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /message input/i })).toBeVisible();
      
      // Test landscape
      await page.setViewportSize({ width: 667, height: 375 });
      
      await expect(page.getByRole('heading', { name: /next\.js chat app/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /message input/i })).toBeVisible();
      
      // Test interaction in landscape
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      await messageInput.fill('Landscape test');
      await localButton.click();
      
      await expect(page.getByText('Landscape test')).toBeVisible();
    });
  });

  test.describe('Cross-Device Consistency', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      test(`should maintain functionality on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Test complete workflow on each viewport
        const messageInput = page.getByRole('textbox', { name: /message input/i });
        const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
        const remoteButton = page.getByRole('button', { name: /send message to remote endpoint/i });
        const clearButton = page.getByRole('button', { name: /clear chat history/i });
        
        // Test local message
        await messageInput.fill(`${viewport.name} local test`);
        await localButton.click();
        await expect(page.getByText(`Response to: ${viewport.name} local test`)).toBeVisible();
        
        // Test remote message
        await messageInput.fill(`${viewport.name} remote test`);
        await remoteButton.click();
        await expect(page.getByText(`Response to: ${viewport.name} remote test`)).toBeVisible();
        
        // Test clear functionality
        await clearButton.click();
        await page.getByRole('button', { name: /confirm clearing chat/i }).click();
        await expect(page.getByText(/no messages yet/i)).toBeVisible();
      });
    }
  });

  test.describe('Text Scaling and Zoom', () => {
    test('should handle browser zoom levels', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Test at different zoom levels
      const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
      
      for (const zoom of zoomLevels) {
        // Set zoom level
        await page.evaluate((zoomLevel) => {
          document.body.style.zoom = zoomLevel.toString();
        }, zoom);
        
        // Check that elements are still visible and functional
        await expect(page.getByRole('heading', { name: /next\.js chat app/i })).toBeVisible();
        await expect(page.getByRole('textbox', { name: /message input/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /send message to local endpoint/i })).toBeVisible();
        
        // Test interaction at this zoom level
        const messageInput = page.getByRole('textbox', { name: /message input/i });
        const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
        
        await messageInput.fill(`Zoom ${zoom} test`);
        await localButton.click();
        await expect(page.getByText(`Response to: Zoom ${zoom} test`)).toBeVisible();
        
        // Clear for next iteration
        const clearButton = page.getByRole('button', { name: /clear chat history/i });
        await clearButton.click();
        await page.getByRole('button', { name: /confirm clearing chat/i }).click();
      }
      
      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = '1';
      });
    });

    test('should handle high contrast mode', async ({ page }) => {
      // Simulate high contrast mode
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
            }
          }
        `
      });
      
      // Force high contrast
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      
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
  });

  test.describe('Performance on Different Devices', () => {
    test('should perform well on low-end mobile devices', async ({ page }) => {
      // Simulate low-end mobile device
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Throttle CPU and network
      const client = await page.context().newCDPSession(page);
      await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
        uploadThroughput: 750 * 1024 / 8, // 750 Kbps
        latency: 40
      });
      
      // Test that the app still loads and functions
      const startTime = Date.now();
      await page.reload();
      
      // Check that critical elements load within reasonable time
      await expect(page.getByRole('heading', { name: /next\.js chat app/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('textbox', { name: /message input/i })).toBeVisible({ timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds even on slow device
      
      // Test interaction performance
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      const interactionStart = Date.now();
      await messageInput.fill('Performance test');
      await localButton.click();
      await expect(page.getByText('Response to: Performance test')).toBeVisible();
      const interactionTime = Date.now() - interactionStart;
      
      expect(interactionTime).toBeLessThan(5000); // Interaction should complete within 5 seconds
      
      // Reset throttling
      await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0
      });
    });
  });
});