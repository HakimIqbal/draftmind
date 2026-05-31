import { expect, test } from '@playwright/test';
import { e2ePrdId, failOnConsoleErrors, login, requireE2EPrd } from './helpers/auth';

test.describe('Authenticated editor regression', () => {
  test.beforeEach(() => {
    requireE2EPrd();
  });

  test('loads editor without client console errors', async ({ page }) => {
    const assertNoConsoleErrors = await failOnConsoleErrors(page);
    await login(page);
    await page.goto(`/prds/${e2ePrdId}`);
    await expect(page.getByTestId('editor-content')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('comments-sidebar')).toBeVisible({ timeout: 30000 });
    assertNoConsoleErrors();
  });

  test('heading dropdown can convert selected paragraph and back to normal text', async ({
    page,
  }) => {
    await login(page);
    await page.goto(`/prds/${e2ePrdId}`);
    const editor = page.getByTestId('editor-content');
    await expect(editor).toBeVisible({ timeout: 30000 });

    await editor.click();
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await page.getByTestId('editor-heading-dropdown').click();
    await page.getByTestId('editor-heading-2').click();
    await expect(
      page.locator('.ProseMirror h2, [data-testid="editor-content"] h2').first(),
    ).toBeVisible({ timeout: 10000 });

    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await page.getByTestId('editor-heading-dropdown').click();
    await page.getByTestId('editor-heading-0').click();
    await expect(
      page.locator('.ProseMirror p, [data-testid="editor-content"] p').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('bare domain link is normalized to https URL', async ({ page }) => {
    await login(page);
    await page.goto(`/prds/${e2ePrdId}`);
    const editor = page.getByTestId('editor-content');
    await expect(editor).toBeVisible({ timeout: 30000 });

    await editor.click();
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await page.getByTitle('Link (Cmd+K)').click();
    await page.getByTestId('editor-link-input').fill('google.com');
    await page.keyboard.press('Enter');

    await expect(page.locator('a[href="https://google.com"]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('selected text comment appears in comments sidebar', async ({ page }) => {
    await login(page);
    await page.goto(`/prds/${e2ePrdId}`);
    const editor = page.getByTestId('editor-content');
    await expect(editor).toBeVisible({ timeout: 30000 });

    await editor.click();
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await page.getByTestId('editor-add-comment').click();
    const commentBody = `E2E comment ${Date.now()}`;
    await page.getByTestId('inline-comment-body').fill(commentBody);
    await page.getByTestId('inline-comment-submit').click();

    await expect(page.getByTestId('comments-sidebar')).toContainText(commentBody, {
      timeout: 15000,
    });
  });

  test('AI Assist opens for selected text without modifying outline immediately', async ({
    page,
  }) => {
    await login(page);
    await page.goto(`/prds/${e2ePrdId}`);
    const editor = page.getByTestId('editor-content');
    await expect(editor).toBeVisible({ timeout: 30000 });

    const outline = page
      .locator('[data-testid="outline-panel"], nav:has-text("Outline"), aside:has-text("Outline")')
      .first();
    const outlineBefore = await outline.textContent().catch(() => '');
    await editor.click();
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await page.getByTestId('editor-ai-assist').click();
    await expect(
      page.getByText(/AI Assist|Improve|Rewrite|Make shorter|Make longer/i).first(),
    ).toBeVisible({ timeout: 15000 });
    const outlineAfter = await outline.textContent().catch(() => '');
    expect(outlineAfter).toBe(outlineBefore);
  });

  test('history highlight toggle does not crash editor', async ({ page }) => {
    await login(page);
    await page.goto(`/prds/${e2ePrdId}`);
    await expect(page.getByTestId('editor-content')).toBeVisible({ timeout: 30000 });
    const historyToggle = page
      .getByLabel(/Highlight changes/i)
      .or(page.getByText(/Highlight changes/i));
    await historyToggle.first().click({ timeout: 15000 });
    await expect(page.getByTestId('editor-content')).toBeVisible();
  });
});
