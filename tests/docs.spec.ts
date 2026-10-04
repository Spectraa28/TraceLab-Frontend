import { test, expect } from '@playwright/test';

test('docs: discover setup, select a platform, copy commands and troubleshoot', async ({ page, context }, testInfo) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Docs', exact: true }).click();
  await expect(page).toHaveURL(/\/docs$/);
  await expect(page.getByRole('heading', { name: 'Get started with TraceLab.' })).toBeVisible();
  await expect(page).toHaveTitle('TraceLab Docs | Python SDK setup');

  const platforms = page.getByRole('tablist', { name: 'install platform' });
  await platforms.getByRole('tab', { name: 'macOS / Linux' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(platforms.getByRole('tab', { name: 'Windows PowerShell' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#install-code')).toContainText('.\\.venv\\Scripts\\Activate.ps1');
  await page.getByRole('button', { name: 'Copy Install SDK', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('python -m pip install tracelab-sdk==0.1.0');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Activate.ps1');
  await page.getByRole('button', { name: 'Copy first_trace.py', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('client.last_export_error');

  if (testInfo.project.name === 'mobile') await page.locator('.docs-mobile-contents summary').click();
  const contents = testInfo.project.name === 'mobile' ? page.locator('.docs-mobile-contents') : page.locator('.docs-sidebar');
  await contents.getByRole('link', { name: 'Troubleshooting', exact: true }).click();
  await expect(page).toHaveURL(/#troubleshooting$/);
  await page.getByText('pip reports “externally-managed-environment”', { exact: true }).click();
  await expect(page.getByText('Your operating system manages its Python installation.', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(await page.evaluate(() => innerWidth));
  expect(errors).toEqual([]);

  await page.getByRole('link', { name: 'Open workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Open your workspace' })).toBeVisible();
  await page.getByRole('link', { name: 'SDK setup guide', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Get started with TraceLab.' })).toBeVisible();
});
