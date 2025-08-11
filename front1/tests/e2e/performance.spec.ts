import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock fast API responses for performance testing
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

  test.describe('Message Rendering Performance', () => {
    test('should handle large message histories efficiently', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      // Send 50 messages to create a large history
      const messageCount = 50;
      const startTime = Date.now();
      
      for (let i = 1; i <= messageCount; i++) {
        await messageInput.fill(`Message ${i}`);
        await localButton.click();
        
        // Wait for response to appear
        await expect(page.getByText(`Response to: Message ${i}`)).toBeVisible();
        
        // Check performance every 10 messages
        if (i % 10 === 0) {
          const currentTime = Date.now();
          const timePerMessage = (currentTime - startTime) / i;
          
          // Each message pair (user + response) should take less than 500ms on average
          expect(timePerMessage).toBeLessThan(500);
          
          console.log(`Performance check at ${i} messages: ${timePerMessage.toFixed(2)}ms per message`);
        }
      }
      
      const totalTime = Date.now() - startTime;
      const averageTimePerMessage = totalTime / messageCount;
      
      console.log(`Total time for ${messageCount} messages: ${totalTime}ms`);
      console.log(`Average time per message: ${averageTimePerMessage.toFixed(2)}ms`);
      
      // Performance assertions
      expect(averageTimePerMessage).toBeLessThan(400); // Should be under 400ms per message on average
      expect(totalTime).toBeLessThan(20000); // Should complete within 20 seconds
      
      // Check that all messages are still visible
      await expect(page.getByText('Message 1')).toBeVisible();
      await expect(page.getByText(`Message ${messageCount}`)).toBeVisible();
      await expect(page.getByText(`Response to: Message ${messageCount}`)).toBeVisible();
      
      // Check that the chat window has auto-scrolled to the bottom
      const chatWindow = page.getByRole('log', { name: /chat message history/i });
      const isScrolledToBottom = await chatWindow.evaluate(el => {
        return Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 10;
      });
      expect(isScrolledToBottom).toBe(true);
    });

    test('should maintain smooth scrolling with large message count', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      // Create 30 messages
      for (let i = 1; i <= 30; i++) {
        await messageInput.fill(`Scroll test message ${i}`);
        await localButton.click();
        await expect(page.getByText(`Response to: Scroll test message ${i}`)).toBeVisible();
      }
      
      const chatWindow = page.getByRole('log', { name: /chat message history/i });
      
      // Test scrolling performance
      const scrollTests = [
        { action: 'scroll to top', script: 'el.scrollTop = 0' },
        { action: 'scroll to middle', script: 'el.scrollTop = el.scrollHeight / 2' },
        { action: 'scroll to bottom', script: 'el.scrollTop = el.scrollHeight' },
      ];
      
      for (const scrollTest of scrollTests) {
        const startTime = Date.now();
        
        await chatWindow.evaluate((el, script) => {
          eval(script);
        }, scrollTest.script);
        
        // Wait for scroll to complete
        await page.waitForTimeout(100);
        
        const scrollTime = Date.now() - startTime;
        expect(scrollTime).toBeLessThan(200); // Scrolling should be smooth and fast
        
        console.log(`${scrollTest.action}: ${scrollTime}ms`);
      }
    });

    test('should handle rapid message sending efficiently', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      // Test rapid message sending (simulating fast user interaction)
      const rapidMessageCount = 10;
      const startTime = Date.now();
      
      // Send messages as quickly as possible
      for (let i = 1; i <= rapidMessageCount; i++) {
        await messageInput.fill(`Rapid message ${i}`);
        await localButton.click();
        // Don't wait for response, send next message immediately
      }
      
      // Now wait for all responses to appear
      for (let i = 1; i <= rapidMessageCount; i++) {
        await expect(page.getByText(`Response to: Rapid message ${i}`)).toBeVisible({ timeout: 10000 });
      }
      
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / rapidMessageCount;
      
      console.log(`Rapid sending: ${totalTime}ms total, ${averageTime.toFixed(2)}ms per message`);
      
      // Should handle rapid sending efficiently
      expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds
      expect(averageTime).toBeLessThan(1500); // Average should be reasonable
    });

    test('should maintain performance during error scenarios', async ({ page }) => {
      // Setup alternating success/error responses
      let callCount = 0;
      await page.route('http://127.0.0.1:8080/invocations', async route => {
        callCount++;
        if (callCount % 2 === 0) {
          // Every second call fails
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Server error' })
          });
        } else {
          const request = route.request();
          const postData = request.postData();
          const data = JSON.parse(postData || '{}');
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ response: `Success response to: ${data.prompt}` })
          });
        }
      });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      const messageCount = 20;
      const startTime = Date.now();
      
      for (let i = 1; i <= messageCount; i++) {
        await messageInput.fill(`Error test message ${i}`);
        await localButton.click();
        
        if (i % 2 === 1) {
          // Odd messages should succeed
          await expect(page.getByText(`Success response to: Error test message ${i}`)).toBeVisible();
        } else {
          // Even messages should fail
          await expect(page.getByRole('alert')).toBeVisible();
          // Dismiss error to continue
          await page.getByRole('button', { name: /dismiss error/i }).click();
        }
      }
      
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / messageCount;
      
      console.log(`Error scenario performance: ${totalTime}ms total, ${averageTime.toFixed(2)}ms per message`);
      
      // Should handle errors without significant performance degradation
      expect(averageTime).toBeLessThan(800); // Should still be reasonably fast
    });
  });

  test.describe('Memory Usage', () => {
    test('should not have memory leaks with large message histories', async ({ page }) => {
      // Enable performance monitoring
      await page.addInitScript(() => {
        (window as any).performanceData = {
          initialMemory: (performance as any).memory?.usedJSHeapSize || 0,
          measurements: []
        };
      });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      // Take initial memory measurement
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Send messages and measure memory usage
      const messageCount = 100;
      const memoryMeasurements = [];
      
      for (let i = 1; i <= messageCount; i++) {
        await messageInput.fill(`Memory test message ${i}`);
        await localButton.click();
        await expect(page.getByText(`Response to: Memory test message ${i}`)).toBeVisible();
        
        // Measure memory every 20 messages
        if (i % 20 === 0) {
          const currentMemory = await page.evaluate(() => {
            return (performance as any).memory?.usedJSHeapSize || 0;
          });
          
          memoryMeasurements.push({
            messageCount: i,
            memory: currentMemory,
            memoryIncrease: currentMemory - initialMemory
          });
          
          console.log(`Memory at ${i} messages: ${(currentMemory / 1024 / 1024).toFixed(2)}MB`);
        }
      }
      
      // Analyze memory growth
      if (memoryMeasurements.length > 1) {
        const firstMeasurement = memoryMeasurements[0];
        const lastMeasurement = memoryMeasurements[memoryMeasurements.length - 1];
        
        const memoryGrowthPerMessage = 
          (lastMeasurement.memory - firstMeasurement.memory) / 
          (lastMeasurement.messageCount - firstMeasurement.messageCount);
        
        console.log(`Memory growth per message: ${(memoryGrowthPerMessage / 1024).toFixed(2)}KB`);
        
        // Memory growth should be reasonable (less than 10KB per message)
        expect(memoryGrowthPerMessage).toBeLessThan(10 * 1024);
        
        // Total memory increase should be reasonable (less than 50MB for 100 messages)
        expect(lastMeasurement.memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      }
    });

    test('should clean up memory when chat is cleared', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      const clearButton = page.getByRole('button', { name: /clear chat history/i });
      
      // Take initial memory measurement
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Send many messages
      for (let i = 1; i <= 50; i++) {
        await messageInput.fill(`Cleanup test message ${i}`);
        await localButton.click();
        await expect(page.getByText(`Response to: Cleanup test message ${i}`)).toBeVisible();
      }
      
      // Measure memory after messages
      const memoryAfterMessages = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Clear chat
      await clearButton.click();
      await page.getByRole('button', { name: /confirm clearing chat/i }).click();
      await expect(page.getByText(/no messages yet/i)).toBeVisible();
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
      
      // Wait a bit for cleanup
      await page.waitForTimeout(1000);
      
      // Measure memory after clearing
      const memoryAfterClear = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      const memoryIncrease = memoryAfterMessages - initialMemory;
      const memoryAfterClearIncrease = memoryAfterClear - initialMemory;
      
      console.log(`Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Memory after messages: ${(memoryAfterMessages / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Memory after clear: ${(memoryAfterClear / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Memory increase from messages: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Memory increase after clear: ${(memoryAfterClearIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Memory should be significantly reduced after clearing
      // Allow for some overhead, but should be at least 50% reduction
      const memoryReduction = memoryIncrease - memoryAfterClearIncrease;
      const reductionPercentage = (memoryReduction / memoryIncrease) * 100;
      
      console.log(`Memory reduction: ${reductionPercentage.toFixed(2)}%`);
      
      // Should have some memory reduction (at least 30%)
      expect(reductionPercentage).toBeGreaterThan(30);
    });
  });

  test.describe('Rendering Performance', () => {
    test('should maintain smooth frame rate during interactions', async ({ page }) => {
      // Enable performance monitoring
      await page.addInitScript(() => {
        let frameCount = 0;
        let lastTime = performance.now();
        
        function countFrames() {
          frameCount++;
          const currentTime = performance.now();
          
          if (currentTime - lastTime >= 1000) {
            (window as any).fps = frameCount;
            frameCount = 0;
            lastTime = currentTime;
          }
          
          requestAnimationFrame(countFrames);
        }
        
        requestAnimationFrame(countFrames);
      });
      
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      // Send several messages while monitoring FPS
      for (let i = 1; i <= 10; i++) {
        await messageInput.fill(`FPS test message ${i}`);
        await localButton.click();
        await expect(page.getByText(`Response to: FPS test message ${i}`)).toBeVisible();
        
        // Check FPS periodically
        if (i % 3 === 0) {
          await page.waitForTimeout(1100); // Wait for FPS calculation
          
          const fps = await page.evaluate(() => (window as any).fps || 0);
          console.log(`FPS at message ${i}: ${fps}`);
          
          // Should maintain reasonable frame rate (at least 30 FPS)
          if (fps > 0) {
            expect(fps).toBeGreaterThan(30);
          }
        }
      }
    });

    test('should handle DOM updates efficiently', async ({ page }) => {
      const messageInput = page.getByRole('textbox', { name: /message input/i });
      const localButton = page.getByRole('button', { name: /send message to local endpoint/i });
      
      // Measure DOM update performance
      const startTime = Date.now();
      
      // Send messages and measure DOM node count
      for (let i = 1; i <= 25; i++) {
        await messageInput.fill(`DOM test message ${i}`);
        await localButton.click();
        await expect(page.getByText(`Response to: DOM test message ${i}`)).toBeVisible();
        
        if (i % 5 === 0) {
          const nodeCount = await page.evaluate(() => {
            return document.querySelectorAll('*').length;
          });
          
          const currentTime = Date.now();
          const timePerMessage = (currentTime - startTime) / i;
          
          console.log(`Message ${i}: ${nodeCount} DOM nodes, ${timePerMessage.toFixed(2)}ms per message`);
          
          // DOM updates should remain efficient
          expect(timePerMessage).toBeLessThan(300);
        }
      }
    });
  });
});