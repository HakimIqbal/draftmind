import { test, expect } from '@playwright/test';

test.describe('Auth routes', () => {
  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders editorial split layout', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator('text=Continue with Google')).toBeVisible();
    await expect(page.locator('text=Send magic link')).toBeVisible();
  });

  test('public share route is accessible without auth', async ({ page }) => {
    const response = await page.goto('/share/test-token');
    expect(response?.status()).toBe(200);
  });

  test('root page is accessible without auth', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=DraftMind')).toBeVisible();
  });

  test('onboarding pages are accessible', async ({ page }) => {
    await page.goto('/onboarding/step-1');
    await expect(page.locator('text=Tell us about you')).toBeVisible();
  });

  test('protected API routes redirect to login', async ({ page }) => {
    await page.goto('/prds');
    await expect(page).toHaveURL(/\/login/);
  });
});
