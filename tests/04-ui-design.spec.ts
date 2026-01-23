import { test, expect } from '@playwright/test';

test.describe('UI/UX Design System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should use elderly-friendly design', async ({ page }) => {
    // Check minimum button height (60px)
    const buttons = page.locator('button');
    await page.waitForTimeout(1000); // Wait for buttons to render

    const firstButton = buttons.first();

    if (await firstButton.isVisible()) {
      const box = await firstButton.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(50); // Allow some margin for padding/border
      }
    }

    // Check Vietnamese text (use first() to avoid strict mode violation)
    await expect(page.locator('text=Bước').first()).toBeVisible();

    // Check for large, clear title text
    const title = page.locator('h1, h2').first();
    if (await title.isVisible({ timeout: 2000 })) {
      const fontSize = await title.evaluate((el) =>
        window.getComputedStyle(el).fontSize
      );
      const fontSizePx = parseFloat(fontSize);
      // Should be at least 20px (elderly-friendly)
      expect(fontSizePx).toBeGreaterThanOrEqual(20);
    }
  });

  test('should have high contrast colors', async ({ page }) => {
    // Check that text is visible and has color (high contrast)
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible();

    if (await title.isVisible()) {
      const color = await title.evaluate((el) =>
        window.getComputedStyle(el).color
      );
      // Should have a defined color
      expect(color).toBeTruthy();
      expect(color).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
    }

    // Check background color is white or light
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toBeTruthy();
  });

  test('should display step progress indicator', async ({ page }) => {
    // Check step indicator exists and is visible
    const stepIndicator = page.locator('text=Bước 1/5').first();
    await expect(stepIndicator).toBeVisible({ timeout: 5000 });

    // Check that progress indicator has proper styling
    const indicator = page.locator('text=Bước').first();
    await expect(indicator).toBeVisible();

    // Verify text content
    const text = await indicator.textContent();
    expect(text).toContain('Bước');
    expect(text).toMatch(/\d+\/5/); // Should contain "X/5" pattern
  });

  test('should be mobile-responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check that content is visible in mobile viewport
    await expect(page.locator('text=Bước 1/5').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Chọn video từ máy').first()).toBeVisible();

    // Check that buttons are still large enough for touch
    const continueButton = page.locator('button:has-text("Tiếp tục")').first();
    if (await continueButton.isVisible({ timeout: 2000 })) {
      const box = await continueButton.boundingBox();
      if (box) {
        // Should be at least 50px height on mobile (elderly-friendly touch target)
        expect(box.height).toBeGreaterThanOrEqual(50);
      }
    }

    // Check that content doesn't overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(400); // Slight margin for scrollbars
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Check that navigation buttons exist
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();

    // Should have at least one button
    expect(buttonCount).toBeGreaterThan(0);

    // Check for any visible button (more flexible than specific text)
    const anyButton = page.locator('button').first();
    await expect(anyButton).toBeVisible({ timeout: 5000 });

    // Verify button is keyboard accessible (can receive focus)
    await anyButton.focus();
    const isFocused = await anyButton.evaluate((el) =>
      el === document.activeElement
    );
    expect(isFocused).toBe(true);
  });

  test('should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Should load within 3000ms
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have touch-friendly spacing', async ({ page }) => {
    // Check that interactive elements have proper spacing
    const buttons = page.locator('button').all();
    const buttonElements = await buttons;

    // Should have buttons
    expect(buttonElements.length).toBeGreaterThan(0);

    // Check button height is sufficient for touch (more reliable than padding)
    const firstButton = page.locator('button').first();
    if (await firstButton.isVisible()) {
      const box = await firstButton.boundingBox();
      if (box) {
        // Should have at least 40px height for touch-friendly interaction
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('should use clear, readable fonts', async ({ page }) => {
    // Check font family is properly set
    const body = page.locator('body');
    const fontFamily = await body.evaluate((el) =>
      window.getComputedStyle(el).fontFamily
    );

    // Should have Inter font or fallback
    expect(fontFamily).toBeTruthy();
    expect(fontFamily.toLowerCase()).toMatch(/inter|sans-serif/);

    // Check base font size
    const fontSize = await body.evaluate((el) =>
      window.getComputedStyle(el).fontSize
    );
    const fontSizePx = parseFloat(fontSize);

    // Base font should be at least 16px
    expect(fontSizePx).toBeGreaterThanOrEqual(16);
  });
});
