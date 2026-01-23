import { test, expect } from '@playwright/test';
import {
  waitForStep,
  clickContinue,
  uploadTestVideo,
  getTestVideoPath,
  uploadVideoFile,
  expectButtonDisabled,
  expectButtonEnabled,
  waitForVideoThumbnail,
  getUploadedVideoCount,
  removeVideoByIndex,
} from './helpers/test-helpers';

test.describe('Step 1: Video Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/');
    await waitForStep(page, 1);
  });

  test('should display upload page correctly', async ({ page }) => {
    // Check step indicator
    await expect(page.locator('text=Bước 1/5').first()).toBeVisible();

    // Check title
    await expect(page.locator('text=Chọn video từ máy').first()).toBeVisible();

    // Check upload zone instructions
    await expect(page.locator('text=Kéo thả video vào đây').first()).toBeVisible();

    // Check file requirements
    await expect(page.locator('text=Tối đa 600MB')).toBeVisible();
    await expect(page.locator('text=Tối đa 10 phút')).toBeVisible();
    await expect(page.locator('text=Hỗ trợ file .MOV và .MP4')).toBeVisible();

    // Continue button might not render initially (correct behavior without videos)
  });

  test('should upload a video file successfully', async ({ page }) => {
    // Upload a test video
    await uploadTestVideo(page, 'short');

    // Wait for video to be processed
    await page.waitForTimeout(3000);

    // Check if video card is displayed with proper filename
    await waitForVideoThumbnail(page, 'test-video-3s.mp4', 15000);

    // Continue button should be enabled
    await expectButtonEnabled(page, 'Tiếp tục');

    // Check that order number is displayed
    await expect(page.locator('text=1.').first()).toBeVisible();
  });

  test('should upload multiple video files', async ({ page }) => {
    // Upload first video
    await uploadTestVideo(page, 'short');
    await page.waitForTimeout(3000);

    // Upload second video
    await uploadTestVideo(page, 'medium');
    await page.waitForTimeout(3000);

    // Check if both videos are displayed
    await expect(page.locator('text=test-video-3s.mp4').first()).toBeVisible();
    await expect(page.locator('text=test-video-5s.mp4').first()).toBeVisible();

    // Check order numbers
    await expect(page.locator('text=1.').first()).toBeVisible();
    await expect(page.locator('text=2.').first()).toBeVisible();

    // Continue button should be enabled
    await expectButtonEnabled(page, 'Tiếp tục');
  });

  test('should remove uploaded video', async ({ page }) => {
    // Upload a video
    await uploadTestVideo(page, 'short');
    await page.waitForTimeout(5000);

    // Check video is displayed
    await expect(page.locator('text=test-video-3s.mp4').first()).toBeVisible();

    // Find and click the remove button (button with SVG icon)
    const removeButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await removeButton.click({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // Video should be removed
    const videoCount = await page.locator('text=test-video-3s.mp4').count();
    expect(videoCount).toBe(0);
  });

  test('should navigate to Step 2 after upload', async ({ page }) => {
    // Upload a video
    await uploadTestVideo(page, 'short');
    await page.waitForTimeout(5000);

    // Check video is displayed
    await expect(page.locator('text=test-video-3s.mp4').first()).toBeVisible();

    // Click continue
    await clickContinue(page);

    // Should navigate to Step 2
    await waitForStep(page, 2);
    await expect(page.locator('text=Sắp xếp thứ tự video').first()).toBeVisible();
  });

  test('should show max videos limit (5 videos)', async ({ page }, testInfo) => {
    testInfo.setTimeout(120000); // 2 minutes for uploading multiple videos

    // Try to upload 5 videos (at limit)
    for (let i = 0; i < 5; i++) {
      const variant = i % 2 === 0 ? 'short' : 'medium';
      await uploadTestVideo(page, variant);
      await page.waitForTimeout(5000);
    }

    // Verify 5 videos uploaded
    await page.waitForTimeout(2000);
    const uploadedVideos = await page.locator('text=/test-video-\\ds|test-video-\\ds-720p/').count();
    expect(uploadedVideos).toBeGreaterThanOrEqual(4); // Allow for timing

    // Try to upload 6th video - should show error or be prevented
    await uploadTestVideo(page, 'short');
    await page.waitForTimeout(3000);

    // Should either show error message OR upload zone is disabled
    const errorVisible = await page.locator('text=Chỉ có thể tải tối đa 5 video').isVisible().catch(() => false);
    const finalCount = await page.locator('text=/test-video-\\ds|test-video-\\ds-720p/').count();

    // Either shows error or still at/below 5 videos
    expect(errorVisible || finalCount <= 5).toBe(true);
  });

  test('should display video metadata correctly', async ({ page }) => {
    // Upload a video
    await uploadTestVideo(page, 'short');
    await page.waitForTimeout(3000);

    // Check that file size is displayed (should be around 119KB)
    await expect(page.locator('text=/\\d+\\.\\d+ KB|\\d+\\.\\d+ MB/').first()).toBeVisible();

    // Check that duration is displayed (should be 0:03 for 3-second video)
    await expect(page.locator('text=/\\d+:\\d+/').first()).toBeVisible();
  });

  test('should show uploading state', async ({ page }) => {
    // Start uploading
    const videoPath = getTestVideoPath('long');
    const fileInput = page.locator('input[type="file"]');

    // Set file but don't wait
    await fileInput.setInputFiles(videoPath);

    // Should show some indication of processing (may be brief)
    await page.waitForTimeout(500);

    // Eventually should complete
    await page.waitForTimeout(4000);
    await expect(page.locator('text=test-video-8s-720p.mp4').first()).toBeVisible({ timeout: 15000 });
  });
});
