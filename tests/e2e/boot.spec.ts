import { expect, test } from './fixtures';

test('boots a Phaser canvas with no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');

  await expect(page.locator('#game-container canvas')).toHaveCount(1);
  await expect(page.locator('#game-container')).toHaveAttribute('data-scene', 'Boot');
  expect(errors).toEqual([]);
});

test('makes no requests to third-party hosts', async ({ page, baseURL }) => {
  const appOrigin = new URL(baseURL ?? '').origin;
  const foreign: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.protocol.startsWith('http') && url.origin !== appOrigin) foreign.push(req.url());
  });

  await page.goto('/');
  await expect(page.locator('#game-container canvas')).toHaveCount(1);
  await page.waitForLoadState('networkidle');

  expect(foreign).toEqual([]);
});
