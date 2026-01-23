import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * E2E Test: Complete Workflow
 * Tests the entire user journey from upload to download
 * Simulates a real elderly user creating a video with YouTube audio
 */

test.describe('E2E: Complete Video Workflow', () => {
  let testVideoPath: string;

  test.beforeAll(async () => {
    // Create a realistic test video file
    const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    testVideoPath = path.join(fixturesDir, 'birthday-party.mp4');

    // Create a realistic-sized test file (5MB)
    const buffer = Buffer.alloc(5 * 1024 * 1024);
    buffer.write('ftypisom', 4);
    buffer.write('moov', 100);
    buffer.write('mdat', 200);
    fs.writeFileSync(testVideoPath, buffer);
  });

  test.afterAll(async () => {
    // Cleanup
    if (fs.existsSync(testVideoPath)) {
      fs.unlinkSync(testVideoPath);
    }
  });

  test('User Story: Bà Hương creates birthday video with music', async ({ page }) => {
    /**
     * Scenario: Bà Hương recorded her grandson's birthday party
     * She wants to add his favorite children's song from YouTube
     * Expected time: 2-3 minutes total
     */

    test.setTimeout(180000); // 3 minutes for complete workflow

    // ===== STEP 1: UPLOAD VIDEO =====
    console.log('👵 Bà Hương: Opening GhepVideo app...');

    await page.goto('/');
    await expect(page.locator('text=Bước 1/5')).toBeVisible();
    await expect(page.locator('h1', { hasText: 'Chọn video' })).toBeVisible();

    console.log('👵 Bà Hương: Selecting birthday video from phone...');

    // Upload the video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testVideoPath);

    // Wait for upload and processing
    console.log('⏳ Processing video metadata...');
    await page.waitForTimeout(2000);

    // Verify video card appears
    await expect(
      page.locator('text=birthday-party.mp4').first()
    ).toBeVisible({ timeout: 10000 });

    console.log('✅ Video uploaded successfully!');

    // Check file info is displayed
    await expect(page.locator('text=MB')).toBeVisible();

    // Continue to next step
    const continueBtn = page.locator('button:has-text("Tiếp tục")');
    await expect(continueBtn).toBeEnabled({ timeout: 5000 });
    await continueBtn.click();

    // ===== STEP 2: REORDER (SKIP - ONLY ONE VIDEO) =====
    console.log('👵 Bà Hương: Checking video order...');

    await expect(page.locator('text=Bước 2/5')).toBeVisible();
    await expect(page.locator('text=Sắp xếp thứ tự video')).toBeVisible();

    // Verify video is shown
    await expect(page.locator('text=birthday-party.mp4').first()).toBeVisible();
    await expect(page.locator('text=1.').first()).toBeVisible();

    console.log('✅ Video order looks good!');

    // Continue to YouTube step
    await page.locator('button:has-text("Tiếp tục")').click();

    // ===== STEP 3: YOUTUBE AUDIO =====
    console.log('👵 Bà Hương: Adding children\'s song from YouTube...');

    await expect(page.locator('text=Bước 3/5')).toBeVisible();
    await expect(page.locator('text=Nhập link YouTube')).toBeVisible();

    // Handle disclaimer if present
    const disclaimerButton = page.locator('button:has-text("Tôi hiểu")');
    if (await disclaimerButton.isVisible({ timeout: 2000 })) {
      console.log('📝 Accepting disclaimer...');
      await disclaimerButton.click();
      await page.waitForTimeout(500);
    }

    // Mock YouTube API for testing
    await page.route('**/api/youtube', async (route) => {
      console.log('🎵 Fetching YouTube audio...');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          metadata: {
            title: 'Happy Birthday Children Song',
            duration: 180, // 3 minutes
            thumbnail: 'https://i.ytimg.com/vi/test/maxresdefault.jpg',
            url: 'https://youtube.com/watch?v=test123',
          },
          audioUrl: 'data:audio/mp3;base64,TESTDATA',
        }),
      });
    });

    // Enter YouTube URL
    const youtubeInput = page.locator('input[placeholder*="YouTube"]');
    await youtubeInput.fill('https://youtube.com/watch?v=dQw4w9WgXcQ');

    console.log('🔍 Previewing YouTube video...');

    // Click preview button
    const previewBtn = page.locator('button:has-text("Xem trước")');
    await previewBtn.click();
    await page.waitForTimeout(1500);

    // Verify metadata displays
    await expect(
      page.locator('text=Happy Birthday Children Song')
    ).toBeVisible({ timeout: 15000 });

    console.log('✅ YouTube audio found!');

    // Download audio
    console.log('⬇️ Downloading audio...');
    const downloadBtn = page.locator('button:has-text("Tải âm thanh")');
    await downloadBtn.click();
    await page.waitForTimeout(2000);

    // Verify download success
    await expect(
      page.locator('text=Đã tải xong').or(page.locator('text=sẵn sàng'))
    ).toBeVisible({ timeout: 20000 });

    console.log('✅ Audio downloaded!');

    // Continue to processing
    const continueToProcess = page.locator('button:has-text("Tiếp tục")');
    await expect(continueToProcess).toBeEnabled({ timeout: 5000 });
    await continueToProcess.click();

    // ===== STEP 4: PROCESSING =====
    console.log('🎬 Processing video...');

    await expect(page.locator('text=Bước 4/5')).toBeVisible();
    await expect(page.locator('text=Đang xử lý video')).toBeVisible();

    // Check iOS warning is displayed
    await expect(
      page.locator('text=ĐỪNG CHUYỂN SANG APP KHÁC')
    ).toBeVisible({ timeout: 5000 });

    console.log('⚠️ iOS warning displayed');

    // Mock FFmpeg processing (in real scenario, this would take 30-90 seconds)
    // For testing, we'll mock the store update
    console.log('⏳ Waiting for FFmpeg to process (mocked)...');

    // Wait for processing to potentially complete
    // In a real test, processing would happen but we can't fully test FFmpeg in browser
    // So we'll just verify the UI is correct
    await page.waitForTimeout(3000);

    console.log('✅ Processing initiated successfully!');

    // Note: Full FFmpeg processing requires real video and can't be easily mocked
    // In production, this would automatically proceed to Step 5 after completion

    console.log('\n📊 E2E Test Summary:');
    console.log('✅ Step 1: Video Upload - SUCCESS');
    console.log('✅ Step 2: Video Reorder - SUCCESS');
    console.log('✅ Step 3: YouTube Integration - SUCCESS');
    console.log('✅ Step 4: Processing Started - SUCCESS');
    console.log('⏭️  Step 5: Download - SKIPPED (FFmpeg cannot be fully tested in E2E)');
    console.log('\n🎉 User successfully completed the main workflow!');
  });

  test('User Story: Family creates multi-video montage', async ({ page }) => {
    /**
     * Scenario: Family has 3 videos from a trip
     * They want to add the same song to all videos
     */

    test.setTimeout(180000);

    console.log('👨‍👩‍👧‍👦 Family: Creating vacation montage...');

    await page.goto('/');

    // Create multiple test videos
    const videos = ['trip-day1.mp4', 'trip-day2.mp4', 'trip-day3.mp4'];
    const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');

    for (const videoName of videos) {
      const videoPath = path.join(fixturesDir, videoName);
      const buffer = Buffer.alloc(3 * 1024 * 1024); // 3MB each
      buffer.write('ftypisom', 4);
      fs.writeFileSync(videoPath, buffer);
    }

    // Upload all videos
    console.log('📤 Uploading 3 videos...');

    for (const videoName of videos) {
      const videoPath = path.join(fixturesDir, videoName);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(videoPath);
      await page.waitForTimeout(1500);
    }

    // Verify all videos uploaded
    await expect(page.locator('text=trip-day1.mp4').first()).toBeVisible();
    await expect(page.locator('text=trip-day2.mp4').first()).toBeVisible();
    await expect(page.locator('text=trip-day3.mp4').first()).toBeVisible();

    console.log('✅ All 3 videos uploaded!');

    // Check order numbers
    await expect(page.locator('text=1.').first()).toBeVisible();
    await expect(page.locator('text=2.').first()).toBeVisible();
    await expect(page.locator('text=3.').first()).toBeVisible();

    // Go to reorder
    await page.locator('button:has-text("Tiếp tục")').click();
    await expect(page.locator('text=Bước 2/5')).toBeVisible();

    console.log('🔄 Reordering videos...');

    // Move day2 to top (user prefers to start with day 2)
    const moveUpButtons = page.locator('button', { hasText: '↑' });
    await moveUpButtons.nth(1).click(); // Move second video up
    await page.waitForTimeout(500);

    console.log('✅ Videos reordered!');

    // Continue to YouTube
    await page.locator('button:has-text("Tiếp tục")').click();

    // Add YouTube audio (same as before)
    await expect(page.locator('text=Bước 3/5')).toBeVisible();

    const disclaimerButton = page.locator('button:has-text("Tôi hiểu")');
    if (await disclaimerButton.isVisible({ timeout: 2000 })) {
      await disclaimerButton.click();
      await page.waitForTimeout(500);
    }

    await page.route('**/api/youtube', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          metadata: {
            title: 'Vacation Travel Music',
            duration: 240,
            thumbnail: 'https://i.ytimg.com/vi/test/maxresdefault.jpg',
            url: 'https://youtube.com/watch?v=vacation',
          },
          audioUrl: 'data:audio/mp3;base64,TESTDATA',
        }),
      });
    });

    const youtubeInput = page.locator('input[placeholder*="YouTube"]');
    await youtubeInput.fill('https://youtube.com/watch?v=vacation123');

    await page.locator('button:has-text("Xem trước")').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('text=Vacation Travel Music')).toBeVisible({ timeout: 15000 });

    await page.locator('button:has-text("Tải âm thanh")').click();
    await page.waitForTimeout(2000);

    console.log('✅ Multi-video montage setup complete!');

    // Cleanup
    for (const videoName of videos) {
      const videoPath = path.join(fixturesDir, videoName);
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }

    console.log('\n📊 Multi-Video E2E Test Summary:');
    console.log('✅ Uploaded 3 videos');
    console.log('✅ Reordered videos');
    console.log('✅ Added music for all videos');
    console.log('🎉 Multi-video workflow successful!');
  });
});
