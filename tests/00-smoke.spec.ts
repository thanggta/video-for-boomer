import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load homepage successfully', async ({ page }) => {
    const response = await page.goto('/');

    // Check response is successful
    expect(response?.status()).toBe(200);

    // Check page loaded
    await expect(page).toHaveTitle(/GhepVideo/i);
  });

  test('should display Vietnamese UI', async ({ page }) => {
    await page.goto('/');

    // Check Vietnamese text is present
    await expect(page.locator('text=Bước')).toBeVisible({ timeout: 5000 });
  });

  test('should have step indicator', async ({ page }) => {
    await page.goto('/');

    // Check step indicator
    await expect(page.locator('text=1/5')).toBeVisible({ timeout: 5000 });
  });

  test('should have upload title', async ({ page }) => {
    await page.goto('/');

    // Check upload page title
    const titleVisible = await page.locator('text=Chọn video').first().isVisible({ timeout: 10000 });
    expect(titleVisible).toBeTruthy();
  });

  test('should have navigation buttons', async ({ page }) => {
    await page.goto('/');

    // Check for any button
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should load and be visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have correct language attribute', async ({ page }) => {
    await page.goto('/');

    // Check HTML lang attribute
    const html = page.locator('html');
    const lang = await html.getAttribute('lang');
    expect(lang).toBe('vi');
  });
});
