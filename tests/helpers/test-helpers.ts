import { Page, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Wait for a specific step to be visible
 */
export async function waitForStep(page: Page, stepNumber: number) {
  await expect(page.locator(`text=Bước ${stepNumber}/5`)).toBeVisible({ timeout: 10000 });
}

/**
 * Click the Continue button
 */
export async function clickContinue(page: Page) {
  const button = page.locator('button:has-text("Tiếp tục")');
  await button.waitFor({ state: 'visible', timeout: 5000 });
  await button.click();
  await page.waitForTimeout(500);
}

/**
 * Click the Back button
 */
export async function clickBack(page: Page) {
  const button = page.locator('button:has-text("Quay lại")');
  await button.waitFor({ state: 'visible', timeout: 5000 });
  await button.click();
  await page.waitForTimeout(500);
}

/**
 * Get path to a real test video file
 * These are actual H.264 MP4 files with video and audio streams
 */
export function getTestVideoPath(
  variant: 'short' | 'medium' | 'long' = 'short'
): string {
  const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');

  const videoFiles = {
    short: 'test-video-3s.mp4',    // 3 seconds, ~119KB
    medium: 'test-video-5s.mp4',   // 5 seconds, ~191KB
    long: 'test-video-8s-720p.mp4', // 8 seconds, ~420KB, 720p
  };

  return path.join(fixturesDir, videoFiles[variant]);
}

/**
 * Create a mock video file for testing (DEPRECATED - use getTestVideoPath instead)
 * This function now returns a path to a real video file
 */
export async function createMockVideoFile(
  fileName: string = 'test-video.mp4',
  sizeKB: number = 100
): Promise<{ path: string; buffer: Buffer }> {
  // Return path to real video file based on requested size
  let variant: 'short' | 'medium' | 'long' = 'short';

  if (sizeKB > 200) {
    variant = 'long';
  } else if (sizeKB > 150) {
    variant = 'medium';
  }

  const realVideoPath = getTestVideoPath(variant);

  // Read the real video file
  const buffer = fs.readFileSync(realVideoPath);

  return { path: realVideoPath, buffer };
}

/**
 * Upload a video file using file input
 */
export async function uploadVideoFile(page: Page, filePath: string) {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);

  // Wait for upload to process (increased timeout for real validation)
  await page.waitForTimeout(2000);
}

/**
 * Upload test video with specified variant
 */
export async function uploadTestVideo(
  page: Page,
  variant: 'short' | 'medium' | 'long' = 'short'
) {
  const videoPath = getTestVideoPath(variant);
  await uploadVideoFile(page, videoPath);
}

/**
 * Check if error message is displayed
 */
export async function expectErrorMessage(page: Page, errorText?: string) {
  const errorElement = page.locator('[class*="border-danger"]').first();
  await expect(errorElement).toBeVisible({ timeout: 5000 });

  if (errorText) {
    await expect(page.locator(`text=${errorText}`).first()).toBeVisible();
  }
}

/**
 * Check if step navigation button is disabled
 */
export async function expectButtonDisabled(page: Page, buttonText: string) {
  const button = page.locator(`button:has-text("${buttonText}")`).first();
  await expect(button).toBeDisabled({ timeout: 5000 });
}

/**
 * Check if step navigation button is enabled
 */
export async function expectButtonEnabled(page: Page, buttonText: string) {
  const button = page.locator(`button:has-text("${buttonText}")`).first();
  await expect(button).toBeEnabled({ timeout: 5000 });
}

/**
 * Clean up test fixtures
 */
export function cleanupFixtures() {
  // Don't delete the fixtures directory anymore since we have real videos
  // Just clean up any temporary files if needed
  const tempDir = path.join(process.cwd(), 'tests', 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Mock YouTube API response
 */
export async function mockYouTubeAPI(page: Page, success: boolean = true) {
  await page.route('**/api/youtube', async (route) => {
    if (success) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          metadata: {
            title: 'Test YouTube Video',
            duration: 180,
            thumbnail: 'https://i.ytimg.com/vi/test/maxresdefault.jpg',
            url: 'https://youtube.com/watch?v=test',
          },
          audioUrl: 'https://example.com/audio.mp3',
        }),
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid YouTube URL',
        }),
      });
    }
  });
}

/**
 * Wait for video thumbnail to appear
 */
export async function waitForVideoThumbnail(page: Page, fileName: string, timeout: number = 10000) {
  await expect(page.locator(`text=${fileName}`).first()).toBeVisible({ timeout });
}

/**
 * Get count of uploaded videos
 */
export async function getUploadedVideoCount(page: Page): Promise<number> {
  // Count video thumbnail cards by looking for file size indicators
  const videoCards = page.locator('[class*="rounded-elderly shadow-elderly"]');
  await page.waitForTimeout(500);
  return await videoCards.count();
}

/**
 * Remove video by index (1-based)
 */
export async function removeVideoByIndex(page: Page, index: number) {
  const removeButtons = page.locator('button[class*="text-danger"]');
  const button = removeButtons.nth(index - 1);
  await button.click();
  await page.waitForTimeout(500);
}
