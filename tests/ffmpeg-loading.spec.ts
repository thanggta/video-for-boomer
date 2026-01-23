import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('FFmpeg Loading', () => {
  test('should load FFmpeg from CDN without errors', async ({ page }) => {
    // Track console messages
    const consoleMessages: string[] = [];
    const errorMessages: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(text);
      if (msg.type() === 'error') {
        errorMessages.push(text);
      }
    });

    // Navigate to the app
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Chọn video từ máy');

    // Upload a test video
    const videoPath = path.join(__dirname, 'fixtures', 'test-video-3s.mp4');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(videoPath);

    // Wait for video to be processed
    await expect(page.locator('text=test-video-3s.mp4')).toBeVisible({ timeout: 10000 });

    // Navigate to Step 2
    await page.click('button:has-text("Tiếp tục")');
    await expect(page.locator('h1')).toContainText('Sắp xếp video');

    // Navigate to Step 3
    await page.click('button:has-text("Tiếp tục")');
    await expect(page.locator('h1')).toContainText('Chọn âm thanh YouTube');

    // Enter a YouTube URL
    await page.fill('input[placeholder*="youtube.com"]', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.click('button:has-text("Tải âm thanh")');

    // Wait for audio to load (or error, which is fine for this test)
    await page.waitForTimeout(3000);

    // Navigate to Step 4 (Processing) - this is where FFmpeg loads
    await page.click('button:has-text("Tiếp tục")');
    await expect(page.locator('h1')).toContainText('Xử lý video');

    // Wait for FFmpeg to start loading
    await page.waitForTimeout(2000);

    // Check console for FFmpeg loading messages
    const ffmpegLoadingMessage = consoleMessages.find((msg) =>
      msg.includes('Loading FFmpeg from CDN')
    );
    expect(ffmpegLoadingMessage).toBeTruthy();

    // Check that there are no module loading errors
    const moduleErrors = errorMessages.filter(
      (msg) =>
        msg.includes('Cannot find module') ||
        msg.includes('ffmpeg-core.js') ||
        msg.includes('import.meta.url')
    );
    expect(moduleErrors).toHaveLength(0);

    // Check for successful FFmpeg load or proper error handling
    const hasLoadSuccess = consoleMessages.some((msg) =>
      msg.includes('FFmpeg loaded successfully')
    );
    const hasLoadAttempt = consoleMessages.some((msg) =>
      msg.includes('Loading FFmpeg')
    );

    expect(hasLoadAttempt).toBeTruthy();

    // If there are errors, they should be proper FFmpeg errors, not module errors
    if (errorMessages.length > 0) {
      const hasModuleError = errorMessages.some(
        (msg) =>
          msg.includes('Cannot find module') ||
          msg.includes('import.meta.url')
      );
      expect(hasModuleError).toBeFalsy();
    }
  });

  test('should use CDN URLs for FFmpeg core files', async ({ page }) => {
    const networkRequests: string[] = [];

    page.on('request', (request) => {
      networkRequests.push(request.url());
    });

    await page.goto('/');

    // Upload a test video and navigate to processing
    const videoPath = path.join(__dirname, 'fixtures', 'test-video-3s.mp4');
    await page.locator('input[type="file"]').setInputFiles(videoPath);
    await page.click('button:has-text("Tiếp tục")');
    await page.click('button:has-text("Tiếp tục")');
    
    // Skip YouTube step or use mock
    await page.fill('input[placeholder*="youtube.com"]', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.click('button:has-text("Tải âm thanh")');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Tiếp tục")');

    // Wait for FFmpeg loading
    await page.waitForTimeout(3000);

    // Check that CDN URLs are being used
    const cdnRequests = networkRequests.filter((url) =>
      url.includes('cdn.jsdelivr.net/npm/@ffmpeg/core')
    );

    // Should have requests to CDN for FFmpeg core files
    expect(cdnRequests.length).toBeGreaterThan(0);

    // Should NOT have requests to local /ffmpeg/ directory
    const localFFmpegRequests = networkRequests.filter((url) =>
      url.includes('localhost') && url.includes('/ffmpeg/')
    );
    expect(localFFmpegRequests).toHaveLength(0);
  });
});

