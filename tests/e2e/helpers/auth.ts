import { expect, type Page, test } from '@playwright/test';

export const e2eEmail = process.env.E2E_EMAIL;
export const e2ePassword = process.env.E2E_PASSWORD;
export const e2ePrdId = process.env.E2E_PRD_ID;

export function requireE2ECredentials() {
  test.skip(
    !e2eEmail || !e2ePassword,
    'Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E tests.',
  );
}

export function requireE2EPrd() {
  requireE2ECredentials();
  test.skip(!e2ePrdId, 'Set E2E_PRD_ID to run editor E2E tests against an existing PRD.');
}

export async function login(page: Page) {
  requireE2ECredentials();
  await page.goto('/login');
  await page.getByTestId('login-email').fill(e2eEmail!);
  await page.getByTestId('login-password').fill(e2ePassword!);
  await page.getByTestId('login-submit').click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30000 });
  await expect(page).not.toHaveURL(/\/login/);
}

/** Known benign patterns from Next.js RSC, analytics, etc. */
const IGNORE_PATTERNS = [
  /Failed to fetch RSC payload/i,
  /favicon/i,
  /service.worker/i,
  /Manifest/i,
  /third-party cookie/i,
  /third.party cookie/i,
];

export async function failOnConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!IGNORE_PATTERNS.some((p) => p.test(text))) {
        errors.push(text);
      }
    }
  });
  page.on('pageerror', (err) => {
    const text = err.message;
    if (!IGNORE_PATTERNS.some((p) => p.test(text))) {
      errors.push(text);
    }
  });
  return () => expect(errors, errors.join('\n')).toEqual([]);
}
