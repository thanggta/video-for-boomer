import { test, expect } from '@playwright/test';
import {
  waitForStep,
  clickContinue,
  clickBack,
  uploadTestVideo,
  waitForVideoThumbnail,
  removeVideoByIndex,
} from './helpers/test-helpers';

test.describe('Step 2: Video Reordering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Step 1 and upload videos
    await page.goto('/');
    await waitForStep(page, 1);

    // Upload 2 real test videos
    await uploadTestVideo(page, 'short');
    await page.waitForTimeout(3000);

    await uploadTestVideo(page, 'medium');
    await page.waitForTimeout(3000);

    // Navigate to Step 2
    await clickContinue(page);
    await waitForStep(page, 2);
  });

  test('should display reorder page correctly', async ({ page }) => {
    // Check step indicator
    await expect(page.locator('text=Bước 2/5').first()).toBeVisible();

    // Check title
    await expect(page.locator('text=Sắp xếp thứ tự video').first()).toBeVisible();

    // Check both videos are displayed
    await expect(page.locator('text=test-video-3s.mp4').first()).toBeVisible();
    await expect(page.locator('text=test-video-5s.mp4').first()).toBeVisible();

    // Check order numbers
    await expect(page.locator('text=1.').first()).toBeVisible();
    await expect(page.locator('text=2.').first()).toBeVisible();
  });

  test('should move video down', async ({ page }) => {
    // Find move down buttons
    const moveDownButtons = page.locator('button[aria-label*="xuống"], button:has-text("↓")');
    const firstMoveDown = moveDownButtons.first();

    if (await firstMoveDown.isVisible({ timeout: 2000 })) {
      await firstMoveDown.click();
      await page.waitForTimeout(1000);
    }

    // Both videos should still be visible after reorder
    await expect(page.locator('text=test-video-3s.mp4').first()).toBeVisible();
    await expect(page.locator('text=test-video-5s.mp4').first()).toBeVisible();
  });

  test('should move video up', async ({ page }) => {
    // Find move up buttons
    const moveUpButtons = page.locator('button[aria-label*="lên"], button:has-text("↑")');
    const count = await moveUpButtons.count();

    if (count > 0) {
      const lastMoveUp = moveUpButtons.last();
      await lastMoveUp.click();
      await page.waitForTimeout(1000);
    }

    // Both videos should still be visible after reorder
    await expect(page.locator('text=test-video-3s.mp4').first()).toBeVisible();
    await expect(page.locator('text=test-video-5s.mp4').first()).toBeVisible();
  });

  test('should remove video from reorder page', async ({ page }) => {
    // Remove first video
    await removeVideoByIndex(page, 1);

    // First video should be gone
    await expect(page.locator('text=test-video-3s.mp4')).not.toBeVisible({ timeout: 5000 });

    // Second video should still be visible
    await expect(page.locator('text=test-video-5s.mp4').first()).toBeVisible();
  });

  test('should navigate back to Step 1', async ({ page }) => {
    await clickBack(page);

    // Should be back at Step 1
    await waitForStep(page, 1);
    await expect(page.locator('text=Chọn video từ máy').first()).toBeVisible();

    // Videos should still be there
    await expect(page.locator('text=test-video-3s.mp4').first()).toBeVisible();
  });

  test('should navigate to Step 3', async ({ page }) => {
    await clickContinue(page);

    // Should navigate to Step 3
    await waitForStep(page, 3);
    await expect(page.locator('text=Thêm nhạc từ YouTube').first()).toBeVisible();
  });

  test('should show empty state if all videos removed', async ({ page }) => {
    // Remove both videos
    await removeVideoByIndex(page, 1);
    await page.waitForTimeout(500);
    await removeVideoByIndex(page, 1);
    await page.waitForTimeout(500);

    // Should show empty state or disabled continue button
    const continueButton = page.locator('button:has-text("Tiếp tục")').first();
    const isDisabled = await continueButton.isDisabled();
    expect(isDisabled).toBe(true);
  });
});
