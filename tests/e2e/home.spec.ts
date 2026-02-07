import { test, expect } from '@playwright/test';

test('Home page displays content correctly', async ({ page }) => {
  await page.goto('/');

  // Check title
  await expect(page).toHaveTitle(/Adrián Hernández Padrón/);

  // Check hero section
  const hero = page.locator('.hero');
  await expect(hero).toBeVisible();
  await expect(hero.locator('h1')).toContainText('Adrián Hernández Padrón');

  // Check trajectory section
  const trajectory = page.locator('.trajectory');
  await expect(trajectory).toBeVisible();
  await expect(trajectory.locator('h2')).toContainText('Trajectory');

  // Check for at least one CV item
  const cvItems = trajectory.locator('.cv-item');
  const count = await cvItems.count();
  expect(count).toBeGreaterThan(0);

  // Check "The Now" section
  const now = page.locator('.now');
  await expect(now).toBeVisible();
  await expect(now.locator('h2')).toContainText('The Now');

  // Check styling (Background color)
  // BaseLayout applies background to html, so we check that.
  const html = page.locator('html');
  const backgroundColor = await html.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });
  // Check that it's the expected color (rgb(243, 241, 231) for #F3F1E7)
  expect(backgroundColor).toBe('rgb(243, 241, 231)');

  // Check font family of h1 (serif)
  const h1 = page.locator('h1');
  const fontFamily = await h1.evaluate((el) => {
    return window.getComputedStyle(el).fontFamily;
  });
  // Check for serif font family being present (e.g. "Georgia, serif" or similar)
  // Usually Playwright resolves to computed value.
  // We can just check for 'serif' string presence as most serif fonts include 'serif' as fallback.
  expect(fontFamily).toContain('serif');
});
