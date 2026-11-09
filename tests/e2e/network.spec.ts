import { expect, test } from './fixtures';
import { flyFromHub, landWithSolver, playOpening, walkToMachine } from './play';

// The `networkGuard` fixture fails this test on any request to a host other than the app's own.
test('a full play session makes zero third-party requests', async ({ page, networkGuard }) => {
  test.setTimeout(90_000);
  await page.goto('/?opening');
  await playOpening(page);
  await page.locator('.hub-open-about').click();
  await page.keyboard.press('Escape');
  await flyFromHub(page, 'apollo-11-site');
  await walkToMachine(page);
  await landWithSolver(page);
  await page.locator('.landing-read').click();
  await expect(page.locator('dialog.archive .archive-entry-view')).toBeVisible();
  await page.locator('dialog.archive .archive-close').click();
  await page.locator('.landing-back').click();
  await page.keyboard.press('m');
  await page.waitForLoadState('networkidle');
  expect(networkGuard).toEqual([]);
});
