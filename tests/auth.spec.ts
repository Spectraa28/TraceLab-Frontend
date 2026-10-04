import { test, expect } from '@playwright/test';

const account = {
  user: { id: 'test-owner', name: 'Test owner', email: 'owner@example.com', provider: 'github' },
  project: { id: 'private-project', name: 'My project' },
  csrf_token: 'test-csrf-token', ingest_url: 'https://api.example.com',
};

test('credentials: create, copy, dismiss, revoke and sign out', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let signedIn = true;
  let key: Record<string, unknown> | null = null;
  await page.route('**/api/v1/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/v1/auth/me') return route.fulfill({ status: signedIn ? 200 : 401, json: signedIn ? account : { detail: 'Sign in' } });
    if (path === '/api/v1/auth/providers') return route.fulfill({ json: { google: true, github: true } });
    if (path === '/api/v1/credentials' && request.method() === 'POST') {
      expect(request.headers()['x-csrf-token']).toBe(account.csrf_token);
      expect(request.headers()['authorization']).toBeUndefined();
      expect(request.postDataJSON()).toEqual({ name: 'production-agent', expires_in_days: 90 });
      key = { id: 'key-id', name: 'production-agent', prefix: 'tlk_visible', created_at: '2026-10-04T10:00:00Z', last_used_at: null, expires_at: '2027-01-02T10:00:00Z', revoked_at: null };
      return route.fulfill({ status: 201, json: { ...key, key: 'tlk_only_shown_once_for_browser_test' } });
    }
    if (path === '/api/v1/credentials/key-id' && request.method() === 'DELETE') {
      expect(request.headers()['x-csrf-token']).toBe(account.csrf_token);
      key = { ...key!, revoked_at: '2026-10-04T10:01:00Z' };
      return route.fulfill({ json: key });
    }
    if (path === '/api/v1/credentials') return route.fulfill({ json: { items: key ? [key] : [] } });
    if (path === '/api/v1/auth/logout') {
      expect(request.headers()['x-csrf-token']).toBe(account.csrf_token);
      signedIn = false;
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ json: { items: [], next_cursor: null } });
  });
  await page.goto('/app/credentials');
  await expect(page.getByRole('heading', { name: 'Connect your agent.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No project keys yet' })).toBeVisible();
  await page.getByRole('button', { name: 'Copy endpoint', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(account.ingest_url);
  await expect(page.locator('body')).not.toContainText('pip install');
  await page.getByLabel('Key name').fill('production-agent');
  await page.getByRole('button', { name: 'Create key', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Save this key now.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Save this key now.' })).toBeFocused();
  await page.getByRole('button', { name: 'Copy key', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('tlk_only_shown_once_for_browser_test');
  expect(await page.evaluate(() => JSON.stringify({ ...sessionStorage, ...localStorage }))).not.toContain('tlk_only_shown_once');
  expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'I’ve saved the key' }).click();
  await expect(page.getByLabel('New API key')).toHaveCount(0);
  await page.getByRole('button', { name: 'Revoke', exact: true }).click();
  await page.getByRole('button', { name: 'Revoke key', exact: true }).click();
  await expect(page.getByText('Revoked', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Open your workspace' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Continue with GitHub' })).toBeEnabled();
  expect(errors).toEqual([]);
});

test('existing project key uses the site proxy without storing the key', async ({ page }) => {
  await page.route('**/api/v1/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    expect(url.origin).toBe('http://127.0.0.1:5173');
    if (url.pathname === '/api/v1/auth/me') return route.fulfill({ status: 401, json: { detail: 'Sign in' } });
    if (url.pathname === '/api/v1/auth/providers') return route.fulfill({ json: { google: false, github: true } });
    expect(request.headers()['authorization']).toBe('Bearer tlk_proxy_test_only');
    return route.fulfill({ json: { items: [], next_cursor: null } });
  });
  await page.goto('/app');
  await page.getByLabel('Project API key', { exact: true }).fill('tlk_proxy_test_only');
  await page.getByRole('button', { name: 'Connect project', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Follow the evidence.' })).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify({ ...sessionStorage, ...localStorage }))).not.toContain('tlk_proxy_test_only');
  await expect(page.getByRole('link', { name: 'Run the agent', exact: true })).toHaveCount(0);
});
