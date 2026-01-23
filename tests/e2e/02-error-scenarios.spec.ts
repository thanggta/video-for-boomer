import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * E2E Test: Error Scenarios & Recovery
 * Tests how the app handles real-world errors and edge cases
 */

test.describe('E2E: Error Handling & Recovery', () => {
  test('Error Recovery: Invalid file format', async ({ page }) => {
    /**
     * Scenario: User accidentally selects a photo instead of video
     * Expected: Clear error message, user can try again
     */

    console.log('❌ Testing: User selects wrong file type...');

    await page.goto('/');
    await expect(page.locator('text=Bước 1/5')).toBeVisible();

    // Create an invalid file (image, not video)
    const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    const invalidFile = path.join(fixturesDir, 'photo.jpg');
    fs.writeFileSync(invalidFile, Buffer.from('fake image data'));

    // Try to upload invalid file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidFile);
    await page.waitForTimeout(1500);

    // Should show error message
    await expect(
      page.locator('text=không đúng định dạng').or(page.locator('text=Chỉ hỗ trợ'))
    ).toBeVisible({ timeout: 10000 });

    console.log('✅ Error message displayed correctly');

    // User can still upload correct file
    const validFile = path.join(fixturesDir, 'correct-video.mp4');
    const buffer = Buffer.alloc(2 * 1024 * 1024);
    buffer.write('ftypisom', 4);
    fs.writeFileSync(validFile, buffer);

    await fileInput.setInputFiles(validFile);
    await page.waitForTimeout(2000);

    // Should now show uploaded video
    await expect(page.locator('text=correct-video.mp4').first()).toBeVisible({ timeout: 10000 });

    console.log('✅ Recovery successful - user uploaded correct file');

    // Cleanup
    fs.unlinkSync(invalidFile);
    fs.unlinkSync(validFile);
  });

  test('Error Recovery: File too large', async ({ page }) => {
    /**
     * Scenario: User tries to upload a file larger than 600MB
     * Expected: Clear error message about file size limit
     */

    console.log('❌ Testing: File size limit exceeded...');

    await page.goto('/');

    // Note: We can't actually create a 600MB+ file in tests
    // But we can verify the validation logic by checking the error message exists
    // This is a UI-only test to verify the error handling is in place

    await expect(page.locator('text=Tối đa 600MB')).toBeVisible();

    console.log('✅ File size limit is clearly displayed to user');
  });

  test('Error Recovery: Invalid YouTube URL', async ({ page }) => {
    /**
     * Scenario: User pastes incorrect link or Facebook video link
     * Expected: Validation error, user can correct
     */

    test.setTimeout(120000);

    console.log('❌ Testing: Invalid YouTube URL...');

    // Upload a video first
    const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    const videoPath = path.join(fixturesDir, 'test.mp4');
    const buffer = Buffer.alloc(2 * 1024 * 1024);
    buffer.write('ftypisom', 4);
    fs.writeFileSync(videoPath, buffer);

    await page.goto('/');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(videoPath);
    await page.waitForTimeout(2000);

    // Navigate to YouTube step
    await page.locator('button:has-text("Tiếp tục")').click();
    await expect(page.locator('text=Bước 2/5')).toBeVisible();
    await page.locator('button:has-text("Tiếp tục")').click();
    await expect(page.locator('text=Bước 3/5')).toBeVisible();

    // Handle disclaimer
    const disclaimerButton = page.locator('button:has-text("Tôi hiểu")');
    if (await disclaimerButton.isVisible({ timeout: 2000 })) {
      await disclaimerButton.click();
      await page.waitForTimeout(500);
    }

    // Try invalid URL (Facebook video)
    const youtubeInput = page.locator('input[placeholder*="YouTube"]');
    await youtubeInput.fill('https://facebook.com/watch/video123');
    await page.waitForTimeout(1000);

    // Should show validation error
    await expect(
      page.locator('text=Link không đúng định dạng')
    ).toBeVisible({ timeout: 5000 });

    console.log('✅ Validation error for non-YouTube URL');

    // User corrects the URL
    await youtubeInput.clear();
    await youtubeInput.fill('https://youtube.com/watch?v=correctId');

    // Mock successful API response
    await page.route('**/api/youtube', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          metadata: {
            title: 'Correct Video',
            duration: 180,
            thumbnail: 'https://i.ytimg.com/vi/test/maxresdefault.jpg',
            url: 'https://youtube.com/watch?v=correctId',
          },
          audioUrl: 'data:audio/mp3;base64,TESTDATA',
        }),
      });
    });

    await page.locator('button:has-text("Xem trước")').click();
    await page.waitForTimeout(1500);

    // Should now show correct video
    await expect(page.locator('text=Correct Video')).toBeVisible({ timeout: 15000 });

    console.log('✅ User successfully corrected URL');

    // Cleanup
    fs.unlinkSync(videoPath);
  });

  test('Error Recovery: YouTube video unavailable', async ({ page }) => {
    /**
     * Scenario: User tries to use a private or deleted YouTube video
     * Expected: Clear error message, option to try different video
     */

    test.setTimeout(120000);

    console.log('❌ Testing: YouTube video unavailable...');

    // Upload video
    const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');
    const videoPath = path.join(fixturesDir, 'test.mp4');
    const buffer = Buffer.alloc(2 * 1024 * 1024);
    buffer.write('ftypisom', 4);
    fs.writeFileSync(videoPath, buffer);

    await page.goto('/');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(videoPath);
    await page.waitForTimeout(2000);

    // Navigate to YouTube step
    await page.locator('button:has-text("Tiếp tục")').click();
    await page.locator('button:has-text("Tiếp tục")').click();

    const disclaimerButton = page.locator('button:has-text("Tôi hiểu")');
    if (await disclaimerButton.isVisible({ timeout: 2000 })) {
      await disclaimerButton.click();
    }

    // Mock API error (video unavailable)
    await page.route('**/api/youtube', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Video is private or unavailable',
        }),
      });
    });

    const youtubeInput = page.locator('input[placeholder*="YouTube"]');
    await youtubeInput.fill('https://youtube.com/watch?v=privateVideo');
    await page.locator('button:has-text("Xem trước")').click();
    await page.waitForTimeout(1500);

    // Should show error
    await expect(
      page.locator('text=Không thể tải âm thanh')
    ).toBeVisible({ timeout: 15000 });

    console.log('✅ Error message for unavailable video');

    // Verify retry option exists
    await expect(page.locator('button:has-text("Thử lại")')).toBeVisible({ timeout: 5000 });

    console.log('✅ User can retry with different video');

    // Cleanup
    fs.unlinkSync(videoPath);
  });

  test('User Journey: Accidental navigation back', async ({ page }) => {
    /**
     * Scenario: User accidentally clicks back button after uploading
     * Expected: Videos are still there, can continue
     */

    console.log('↩️ Testing: Accidental back navigation...');

    const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');
    const videoPath = path.join(fixturesDir, 'important-video.mp4');
    const buffer = Buffer.alloc(2 * 1024 * 1024);
    buffer.write('ftypisom', 4);
    fs.writeFileSync(videoPath, buffer);

    await page.goto('/');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(videoPath);
    await page.waitForTimeout(2000);

    // Video uploaded
    await expect(page.locator('text=important-video.mp4').first()).toBeVisible();

    console.log('✅ Video uploaded');

    // Go to step 2
    await page.locator('button:has-text("Tiếp tục")').click();
    await expect(page.locator('text=Bước 2/5')).toBeVisible();

    // User accidentally clicks back
    console.log('⬅️ User clicks back button...');
    await page.locator('button:has-text("Quay lại")').click();

    // Should be back at step 1
    await expect(page.locator('text=Bước 1/5')).toBeVisible();

    // Video should still be there!
    await expect(page.locator('text=important-video.mp4').first()).toBeVisible();

    console.log('✅ Video preserved after navigation!');

    // User can continue again
    await page.locator('button:has-text("Tiếp tục")').click();
    await expect(page.locator('text=Bước 2/5')).toBeVisible();
    await expect(page.locator('text=important-video.mp4').first()).toBeVisible();

    console.log('✅ User successfully recovered and continued');

    // Cleanup
    fs.unlinkSync(videoPath);
  });

  test('Edge Case: Maximum videos limit', async ({ page }) => {
    /**
     * Scenario: User tries to upload 6 videos (limit is 5)
     * Expected: Clear message about limit, first 5 accepted
     */

    console.log('🔢 Testing: Maximum videos limit (5)...');

    await page.goto('/');

    const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');
    const videoPaths: string[] = [];

    // Create 6 small videos
    for (let i = 1; i <= 6; i++) {
      const videoPath = path.join(fixturesDir, `video${i}.mp4`);
      const buffer = Buffer.alloc(1 * 1024 * 1024); // 1MB each
      buffer.write('ftypisom', 4);
      fs.writeFileSync(videoPath, buffer);
      videoPaths.push(videoPath);
    }

    // Try to upload all 6
    for (const videoPath of videoPaths) {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(videoPath);
      await page.waitForTimeout(1000);
    }

    // Should show limit message
    await expect(
      page.locator('text=tối đa 5 video')
    ).toBeVisible({ timeout: 10000 });

    console.log('✅ Limit message displayed');

    // Should only have 5 videos uploaded
    const video6 = page.locator('text=video6.mp4').first();
    const isVisible = await video6.isVisible().catch(() => false);
    expect(isVisible).toBeFalsy();

    console.log('✅ Only 5 videos accepted, 6th rejected');

    // Cleanup
    for (const videoPath of videoPaths) {
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }
  });
});
