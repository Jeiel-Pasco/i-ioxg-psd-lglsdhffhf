import { expect, test, type Page } from './fixtures';

interface TestHook {
  fly(id: string): void;
  land(id: string): void;
}

test.use({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });

async function call(page: Page, name: 'fly' | 'land', id: string): Promise<void> {
  await page.evaluate(
    ([n, entryId]) => (window as unknown as { __stillOutThere: TestHook }).__stillOutThere[n](entryId),
    [name, id] as const,
  );
}

async function expectNoSideScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const wide = [document.documentElement, document.body, ...document.querySelectorAll<HTMLElement>('#hub, dialog[open]')];
    return wide.filter((n) => n.scrollWidth > n.clientWidth + 1).map((n) => n.id || n.className || n.tagName);
  });
  expect(overflow).toEqual([]);
}

function box(page: Page, selector: string) {
  return page.locator(selector).evaluate((n) => {
    const r = n.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#game-container canvas')).toHaveCount(1);
  await page.waitForFunction(() => '__stillOutThere' in window);
});

test('hub, menus and Archive have no sideways scroll at 360x740', async ({ page }) => {
  await expectNoSideScroll(page);
  for (const [button, dialog] of [
    ['.hub-open-settings', '.settings'],
    ['.hub-open-about', '.about'],
    ['.hub-open-archive', '.archive'],
  ]) {
    await page.locator(button).tap();
    await expect(page.locator(dialog)).toBeVisible();
    await expectNoSideScroll(page);
    await page.keyboard.press('Escape');
  }
});

test('portrait site HUD sits around the canvas, not on top of it', async ({ page }) => {
  await call(page, 'fly', 'apollo-11-site');
  await expect(page.locator('.site-ui')).toBeVisible();
  await expectNoSideScroll(page);
  const canvas = await box(page, '#game-container canvas');
  const top = await box(page, '.site-top');
  const bottom = await box(page, '.site-bottom');
  expect(top.bottom).toBeLessThanOrEqual(canvas.top + 1);
  expect(bottom.top).toBeGreaterThanOrEqual(canvas.bottom - 1);
  expect(bottom.bottom).toBeLessThanOrEqual(740);
});

test('portrait landing HUD sits around the canvas, not on top of it', async ({ page }) => {
  await call(page, 'fly', 'apollo-11-site');
  await call(page, 'land', 'apollo-11-site');
  await expect(page.locator('.landing-ui')).toBeVisible();
  await expectNoSideScroll(page);
  const canvas = await box(page, '#game-container canvas');
  const top = await box(page, '.landing-top');
  const controls = await box(page, '.landing-controls');
  expect(top.bottom).toBeLessThanOrEqual(canvas.top + 1);
  expect(controls.top).toBeGreaterThanOrEqual(canvas.bottom - 1);
  expect(controls.bottom).toBeLessThanOrEqual(740);
});
