import { test, expect } from '@playwright/test';

test('landing: inspect spans, compare evals, and open the workspace', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('See the trace.Ship with confidence.');
  await page.getByRole('button', { name: /check_faithfulness/ }).click();
  await expect(page.locator('.inspector-title')).toBeVisible();
  await expect(page.locator('.inspector-title')).toContainText('check_faithfulness');
  await expect(page.locator('.inspector-content')).toContainText('The answer contradicts the 30-day return window.');
  await page.getByRole('button', { name: 'Failures only' }).click();
  await expect(page.locator('.eval-table tbody tr')).toHaveCount(1);
  await expect(page.locator('.eval-table tbody')).toContainText('Return after 30 days');
  await page.getByRole('button', { name: 'Show all cases' }).click();
  await page.getByRole('button', { name: 'v13', exact: true }).click();
  await expect(page.locator('.root-cause')).toContainText('Baseline within threshold');
  await expect(page.locator('.code-section')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('localhost:8000');
  if (testInfo.project.name === 'mobile') {
    const replay = await page.getByRole('button', { name: 'Replay trace animation' }).boundingBox();
    const console = await page.locator('.trace-console').boundingBox();
    expect(replay!.x + replay!.width).toBeLessThanOrEqual(console!.x + console!.width);
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await page.getByRole('button', { name: 'Close navigation' }).click();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(await page.evaluate(() => window.innerWidth));
  await page.getByRole('link', { name: 'Get started', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Open your workspace' })).toBeVisible();
  await page.goto('/app/guide');
  await expect(page.getByRole('heading', { name: 'Open your workspace' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('tracelab-evaluate');
  expect(errors).toEqual([]);
});

test('reduced motion: content visible and animation disabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.trace-bar.failed')).toHaveCSS('animation-name', 'none');
});
