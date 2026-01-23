import { test, expect } from '@playwright/test';
import {
  waitForStep,
  clickContinue,
  clickBack,
  createMockVideoFile,
  uploadVideoFile,
  mockYouTubeAPI,
  cleanupFixtures,
} from './helpers/test-helpers';

test.describe('Step 3: YouTube Integration', () => {
  test.afterAll(async () => {
    cleanupFixtures();
  });

  test.beforeEach(async ({ page }) => {
    // Navigate through Step 1 and 2
    await page.goto('/');
    await waitForStep(page, 1);

    // Upload a test video
    const { path: videoPath } = await createMockVideoFile('test.mp4', 50);
    await uploadVideoFile(page, videoPath);
    await page.waitForTimeout(1500);

    // Navigate to Step 2
    await clickContinue(page);
    await waitForStep(page, 2);

    // Navigate to Step 3
    await clickContinue(page);
    await waitForStep(page, 3);
  });

  test('should display YouTube page correctly', async ({ page }) => {
    // Check step indicator
    await expect(page.locator('text=Bước 3/5')).toBeVisible();

    // Check title
    await expect(page.locator('text=Nhập link YouTube')).toBeVisible();

    // Check input field
    await expect(page.locator('input[placeholder*="YouTube"]')).toBeVisible();

    // Check paste button
    await expect(page.locator('button:has-text("Dán")')).toBeVisible();

    // Continue button should be disabled initially
    const continueButton = page.locator('button:has-text("Tiếp tục")');
    await expect(continueButton).toBeDisabled();
  });

  test('should show disclaimer on first use', async ({ page }) => {
    // Check if disclaimer is visible
    const disclaimer = page.locator('text=Chỉ tải âm thanh từ video bạn có quyền sử dụng');
    await expect(disclaimer).toBeVisible({ timeout: 5000 });

    // Check "I understand" button
    await expect(page.locator('button:has-text("Tôi hiểu")')).toBeVisible();
  });

  test('should validate YouTube URL', async ({ page }) => {
    // Accept disclaimer if present
    const acceptButton = page.locator('button:has-text("Tôi hiểu")');
    if (await acceptButton.isVisible()) {
      await acceptButton.click();
      await page.waitForTimeout(500);
    }

    // Enter invalid URL
    const input = page.locator('input[placeholder*="YouTube"]');
    await input.fill('https://notayoutubeurl.com');
    await page.waitForTimeout(500);

    // Should show validation error
    await expect(
      page.locator('text=Link không đúng định dạng')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should accept valid YouTube URL', async ({ page }) => {
    // Mock YouTube API
    await mockYouTubeAPI(page, true);

    // Accept disclaimer if present
    const acceptButton = page.locator('button:has-text("Tôi hiểu")');
    if (await acceptButton.isVisible()) {
      await acceptButton.click();
      await page.waitForTimeout(500);
    }

    // Enter valid YouTube URL
    const input = page.locator('input[placeholder*="YouTube"]');
    await input.fill('https://youtube.com/watch?v=dQw4w9WgXcQ');

    // Click preview button
    const previewButton = page.locator('button:has-text("Xem trước")');
    await previewButton.click();
    await page.waitForTimeout(1000);

    // Should show video metadata (mocked)
    await expect(page.locator('text=Test YouTube Video')).toBeVisible({ timeout: 10000 });
  });

  test('should handle YouTube API error', async ({ page }) => {
    // Mock YouTube API failure
    await mockYouTubeAPI(page, false);

    // Accept disclaimer if present
    const acceptButton = page.locator('button:has-text("Tôi hiểu")');
    if (await acceptButton.isVisible()) {
      await acceptButton.click();
      await page.waitForTimeout(500);
    }

    // Enter valid YouTube URL
    const input = page.locator('input[placeholder*="YouTube"]');
    await input.fill('https://youtube.com/watch?v=invalid');

    // Click preview button
    const previewButton = page.locator('button:has-text("Xem trước")');
    await previewButton.click();
    await page.waitForTimeout(1000);

    // Should show error message
    await expect(
      page.locator('text=Không thể tải âm thanh')
    ).toBeVisible({ timeout: 10000 });
  });

  test('should navigate back to Step 2', async ({ page }) => {
    await clickBack(page);

    // Should be back at Step 2
    await waitForStep(page, 2);
    await expect(page.locator('text=Sắp xếp thứ tự video')).toBeVisible();
  });
});
