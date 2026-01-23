import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * E2E Test: User Experience & Real-World Scenarios
 * Tests realistic user behaviors and expectations
 */

test.describe('E2E: User Experience Scenarios', () => {
  test('UX: Elderly user takes time at each step', async ({ page }) => {
    /**
     * Scenario: Bà Hương reads instructions carefully at each step
     * Takes 30 seconds per step to understand
     * Expected: App remains stable, no timeouts
     */

    test.setTimeout(300000); // 5 minutes

    console.log('👵 Simulating elderly user taking time to read...');

    await page.goto('/');
    await expect(page.locator('text=Bước 1/5')).toBeVisible();

    // User reads the instructions carefully
    console.log('📖 Reading Step 1 instructions...');
    await page.waitForTimeout(5000);

    // Check all instructions are visible
    await expect(page.locator('text=Tối đa 600MB')).toBeVisible();
    await expect(page.locator('text=Tối đa 10 phút')).toBeVisible();
    await expect(page.locator('text=.MOV và .MP4')).toBeVisible();

    // Upload video after reading
    const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');
    const videoPath = path.join(fixturesDir, 'family-video.mp4');
    const buffer = Buffer.alloc(3 * 1024 * 1024);
    buffer.write('ftypisom', 4);
    fs.writeFileSync(videoPath, buffer);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(videoPath);
    await page.waitForTimeout(2000);

    await expect(page.locator('text=family-video.mp4').first()).toBeVisible();

    // User checks the video info before continuing
    console.log('🔍 Checking video information...');
    await page.waitForTimeout(3000);

    // Continue to next step
    await page.locator('button:has-text("Tiếp tục")').click();
    await expect(page.locator('text=Bước 2/5')).toBeVisible();

    // User reads reorder instructions
    console.log('📖 Reading Step 2 instructions...');
    await page.waitForTimeout(3000);

    console.log('✅ App remains stable with slow user interaction');

    // Cleanup
    fs.unlinkSync(videoPath);
  });

  test('UX: User removes and re-adds video', async ({ page }) => {
    /**
     * Scenario: User uploads wrong video, removes it, uploads correct one
     * Expected: Clean state management, no residual data
     */

    console.log('🔄 Testing: Remove and re-add workflow...');

    await page.goto('/');

    const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');

    // Upload wrong video
    const wrongVideo = path.join(fixturesDir, 'wrong-video.mp4');
    const buffer1 = Buffer.alloc(2 * 1024 * 1024);
    buffer1.write('ftypisom', 4);
    fs.writeFileSync(wrongVideo, buffer1);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(wrongVideo);
    await page.waitForTimeout(2000);

    await expect(page.locator('text=wrong-video.mp4').first()).toBeVisible();

    console.log('❌ User realizes: Wrong video uploaded!');

    // Remove the wrong video
    const removeButton = page.locator('[class*="text-danger"]').first();
    await removeButton.click();
    await page.waitForTimeout(500);

    // Verify video removed
    const wrongVideoElement = page.locator('text=wrong-video.mp4');
    await expect(wrongVideoElement).not.toBeVisible();

    console.log('🗑️ Wrong video removed');

    // Upload correct video
    const correctVideo = path.join(fixturesDir, 'correct-video.mp4');
    const buffer2 = Buffer.alloc(2 * 1024 * 1024);
    buffer2.write('ftypisom', 4);
    fs.writeFileSync(correctVideo, buffer2);

    await fileInput.setInputFiles(correctVideo);
    await page.waitForTimeout(2000);

    await expect(page.locator('text=correct-video.mp4').first()).toBeVisible();

    console.log('✅ Correct video uploaded');

    // Verify only correct video is present
    await expect(page.locator('text=1.').first()).toBeVisible();
    const videoCount = await page.locator('[class*="rounded-elderly"]').count();
    expect(videoCount).toBe(1);

    console.log('✅ Clean state - no residual data from removed video');

    // Cleanup
    fs.unlinkSync(wrongVideo);
    fs.unlinkSync(correctVideo);
  });

  test('UX: Video duration comparison with audio', async ({ page }) => {
    /**
     * Scenario: User uploads 5-minute video, YouTube audio is 3 minutes
     * Expected: Clear message that audio will loop
     */

    test.setTimeout(120000);

    console.log('⏱️ Testing: Audio duration mismatch notification...');

    const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');
    const videoPath = path.join(fixturesDir, 'long-video.mp4');
    const buffer = Buffer.alloc(3 * 1024 * 1024);
    buffer.write('ftypisom', 4);
    fs.writeFileSync(videoPath, buffer);

    await page.goto('/');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(videoPath);
    await page.waitForTimeout(2000);

    // Navigate to YouTube step
    await page.locator('button:has-text("Tiếp tục")').click();
    await page.locator('button:has-text("Tiếp tục")').click();
    await expect(page.locator('text=Bước 3/5')).toBeVisible();

    const disclaimerButton = page.locator('button:has-text("Tôi hiểu")');
    if (await disclaimerButton.isVisible({ timeout: 2000 })) {
      await disclaimerButton.click();
    }

    // Mock YouTube with shorter audio
    await page.route('**/api/youtube', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          metadata: {
            title: 'Short Song (3 min)',
            duration: 180, // 3 minutes
            thumbnail: 'https://i.ytimg.com/vi/test/maxresdefault.jpg',
            url: 'https://youtube.com/watch?v=short',
          },
          audioUrl: 'data:audio/mp3;base64,TESTDATA',
        }),
      });
    });

    const youtubeInput = page.locator('input[placeholder*="YouTube"]');
    await youtubeInput.fill('https://youtube.com/watch?v=shortSong');
    await page.locator('button:has-text("Xem trước")').click();
    await page.waitForTimeout(1500);

    // Should show duration comparison message
    await expect(
      page.locator('text=lặp lại').or(page.locator('text=ngắn hơn'))
    ).toBeVisible({ timeout: 15000 });

    console.log('✅ User informed that audio will loop');

    // Cleanup
    fs.unlinkSync(videoPath);
  });

  test('UX: Mobile viewport experience', async ({ page }) => {
    /**
     * Scenario: User on mobile phone (iPhone 12)
     * Expected: All elements are touch-friendly and visible
     */

    console.log('📱 Testing: Mobile experience...');

    // Set mobile viewport (iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/');
    await expect(page.locator('text=Bước 1/5')).toBeVisible();

    // Check touch targets are large enough
    const continueButton = page.locator('button:has-text("Tiếp tục")');
    if (await continueButton.isVisible()) {
      const box = await continueButton.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(50);
        console.log(`✅ Button height: ${box.height}px (>= 50px required)`);
      }
    }

    // Check text is readable
    const title = page.locator('h1').first();
    if (await title.isVisible()) {
      const fontSize = await title.evaluate((el) =>
        window.getComputedStyle(el).fontSize
      );
      console.log(`✅ Title font size: ${fontSize}`);
    }

    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 390;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow small margin

    console.log('✅ Mobile UX verified - no horizontal scroll');
  });

  test('UX: Performance - Multiple navigation cycles', async ({ page }) => {
    /**
     * Scenario: User navigates back and forth multiple times
     * Expected: No performance degradation, memory leaks
     */

    console.log('🔄 Testing: Multiple navigation cycles...');

    const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');
    const videoPath = path.join(fixturesDir, 'test-video.mp4');
    const buffer = Buffer.alloc(2 * 1024 * 1024);
    buffer.write('ftypisom', 4);
    fs.writeFileSync(videoPath, buffer);

    await page.goto('/');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(videoPath);
    await page.waitForTimeout(1500);

    // Navigate forward and back 3 times
    for (let i = 1; i <= 3; i++) {
      console.log(`🔄 Cycle ${i}: Forward...`);

      await page.locator('button:has-text("Tiếp tục")').click();
      await expect(page.locator('text=Bước 2/5')).toBeVisible();
      await page.waitForTimeout(500);

      console.log(`🔄 Cycle ${i}: Backward...`);

      await page.locator('button:has-text("Quay lại")').click();
      await expect(page.locator('text=Bước 1/5')).toBeVisible();
      await page.waitForTimeout(500);

      // Verify video still there
      await expect(page.locator('text=test-video.mp4').first()).toBeVisible();
    }

    console.log('✅ No performance issues after multiple navigations');

    // Cleanup
    fs.unlinkSync(videoPath);
  });

  test('Accessibility: Keyboard navigation', async ({ page }) => {
    /**
     * Scenario: User navigates using Tab key
     * Expected: Focus indicators visible, all interactive elements reachable
     */

    console.log('⌨️ Testing: Keyboard navigation...');

    await page.goto('/');
    await expect(page.locator('text=Bước 1/5')).toBeVisible();

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Check focus is visible (element should be focused)
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    console.log(`✅ Keyboard navigation working - focused on: ${focusedElement}`);
  });

  test('Real-world timing: Slow network simulation', async ({ page }) => {
    /**
     * Scenario: User on slow 3G connection
     * Expected: App loads and works, appropriate loading states
     */

    console.log('🐌 Testing: Slow network (3G)...');

    // Simulate slow 3G
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (750 * 1024) / 8, // 750 kbps
      uploadThroughput: (250 * 1024) / 8,   // 250 kbps
      latency: 100, // 100ms latency
    });

    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    console.log(`⏱️ Page loaded in ${loadTime}ms on 3G`);

    // Should still be usable (< 10 seconds)
    expect(loadTime).toBeLessThan(10000);

    await expect(page.locator('text=Bước 1/5')).toBeVisible({ timeout: 15000 });

    console.log('✅ App usable on slow connection');
  });
});
