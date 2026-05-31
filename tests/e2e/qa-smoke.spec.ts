import { expect, test } from '@playwright/test';
import { failOnConsoleErrors } from './helpers/auth';

test.describe('Public QA smoke', () => {
  test('public pages load without console errors', async ({ page }) => {
    const assertNoConsoleErrors = await failOnConsoleErrors(page);
    for (const route of ['/', '/login', '/privacy', '/terms']) {
      const response = await page.goto(route);
      expect(response?.status(), `${route} should respond successfully`).toBeLessThan(400);
    }
    assertNoConsoleErrors();
  });

  test('protected PRD editor redirects anonymous users to login', async ({ page }) => {
    await page
      .goto('/prds/00000000-0000-0000-0000-000000000001', { waitUntil: 'commit' })
      .catch(() => {});
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});
