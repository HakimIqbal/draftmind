import { test, expect } from '@playwright/test';

test.describe('PRD creation flow', () => {
  test('new PRD page loads and shows form', async ({ page }) => {
    await page.goto('/prds/new');
    // Should redirect to login if not authenticated
    const url = page.url();
    if (url.includes('/login')) {
      await expect(page.locator('text=Welcome back')).toBeVisible();
    } else {
      await expect(page.locator('text=Create new PRD')).toBeVisible();
    }
  });

  test('templates page loads', async ({ page }) => {
    await page.goto('/templates');
    const url = page.url();
    if (url.includes('/login')) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      await expect(page.locator('text=Templates')).toBeVisible();
    }
  });
});

test.describe('Editor routes', () => {
  test('PRD editor redirects unauthenticated users', async ({ page }) => {
    await page.goto('/prds/00000000-0000-0000-0000-000000000001');
    await expect(page).toHaveURL(/\/login/);
  });

  test('AI runs page requires auth', async ({ page }) => {
    await page.goto('/ai-runs');
    await expect(page).toHaveURL(/\/login/);
  });

  test('search page requires auth', async ({ page }) => {
    await page.goto('/search');
    await expect(page).toHaveURL(/\/login/);
  });

  test('settings page requires auth', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);
  });

  test('workspace members page requires auth', async ({ page }) => {
    await page.goto('/workspace/members');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Export API', () => {
  test('export API rejects unauthenticated requests', async ({ request }) => {
    const response = await request.get('/api/prd/export?prdId=test&format=markdown');
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('generate API rejects unauthenticated requests', async ({ request }) => {
    const response = await request.post('/api/prd/generate', {
      data: { prdId: 'test', aiRunId: 'test' },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
