import { test, expect } from '@playwright/test';

test.describe('Dashboard (unauthenticated)', () => {
  test('/prds redirects to login', async ({ page }) => {
    await page.goto('/prds');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/prds/pipeline redirects to login', async ({ page }) => {
    await page.goto('/prds/pipeline');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/home redirects to login', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
  });
});
