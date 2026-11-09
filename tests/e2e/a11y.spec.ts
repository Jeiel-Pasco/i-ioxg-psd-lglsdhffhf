import { expect, test, type Page } from './fixtures';

interface TestHook {
  fly(id: string): void;
  land(id: string): void;
  paused(): boolean;
}

function hook(page: Page): Promise<void> {
  return page.waitForFunction(() => '__stillOutThere' in window).then(() => undefined);
}

async function call(page: Page, name: 'fly' | 'land', id: string): Promise<void> {
  await page.evaluate(
    ([n, entryId]) => (window as unknown as { __stillOutThere: TestHook }).__stillOutThere[n](entryId),
    [name, id] as const,
  );
}

async function paused(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as unknown as { __stillOutThere: TestHook }).__stillOutThere.paused());
}

/** Presses Tab until the element matching `selector` has focus. */
async function tabTo(page: Page, selector: string): Promise<void> {
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    if (await page.locator(selector).evaluate((n) => n === document.activeElement)) return;
  }
  throw new Error(`Tab never reached ${selector}`);
}

/** Every visible button is at least 44 by 44 CSS pixels. */
async function expectButtonTargets(page: Page): Promise<void> {
  const small = await page.locator('button:visible').evaluateAll((nodes) =>
    nodes
      .map((n) => ({ text: n.textContent?.trim() ?? n.className, r: n.getBoundingClientRect() }))
      .filter(({ r }) => r.width < 44 || r.height < 44)
      .map(({ text, r }) => `${text} ${Math.round(r.width)}x${Math.round(r.height)}`),
  );
  expect(small).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#game-container canvas')).toHaveCount(1);
  await hook(page);
});

test('every hub menu opens by Tab and Enter and closes by Escape', async ({ page }) => {
  const menus: [string, string][] = [
    ['.hub-open-settings', '.settings'],
    ['.hub-open-about', '.about'],
    ['.hub-open-archive', '.archive'],
  ];
  for (const [button, dialog] of menus) {
    await tabTo(page, button);
    await page.keyboard.press('Enter');
    await expect(page.locator(dialog)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator(dialog)).toBeHidden();
    await expect(page.locator(button)).toBeFocused();
  }
});

test('settings controls are reachable by keyboard inside the dialog', async ({ page }) => {
  await page.locator('.hub-open-settings').click();
  for (const sel of ['.settings-text-size', '.settings-contrast', '.settings-motion', '.settings-effects', '.settings-close']) {
    await tabTo(page, sel);
  }
});

test('text size changes computed font size and is saved', async ({ page }) => {
  const size = () => page.locator('.hub-inner h1').evaluate((n) => parseFloat(getComputedStyle(n).fontSize));
  const before = await size();
  await page.locator('.hub-open-settings').click();
  await page.locator('.settings-text-size').selectOption('1.5');
  const after = await size();
  expect(after).toBeCloseTo(before * 1.5, 0);

  await page.reload();
  await hook(page);
  expect(await size()).toBeCloseTo(before * 1.5, 0);
});

test('high contrast changes computed colours', async ({ page }) => {
  const colours = () =>
    page.locator('.hub-open-archive').evaluate((n) => {
      const s = getComputedStyle(n);
      return `${s.color} ${s.backgroundColor} ${s.borderColor}`;
    });
  const before = await colours();
  await page.locator('.hub-open-settings').click();
  await page.locator('.settings-contrast').check();
  expect(await colours()).not.toBe(before);
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
});

test('reduced motion removes transitions and is passed to the scenes', async ({ page }) => {
  await page.locator('.hub-open-settings').click();
  await page.locator('.settings-motion').check();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  const duration = await page.locator('.settings-close').evaluate((n) => getComputedStyle(n).transitionDuration);
  expect(duration.split(',').every((d) => parseFloat(d) === 0)).toBe(true);
});

test('reduced effects changes computed styles', async ({ page }) => {
  await page.locator('.hub-open-settings').click();
  const grid = () => page.locator('.hub-map').evaluate((n) => getComputedStyle(n).backgroundImage);
  expect(await grid()).not.toBe('none');
  await page.locator('.settings-effects').check();
  await expect(page.locator('html')).toHaveAttribute('data-effects', 'reduced');
  expect(await grid()).toBe('none');
});

test('every button is at least 44x44 in each menu and HUD', async ({ page }) => {
  await expectButtonTargets(page);
  for (const [button, dialog] of [
    ['.hub-open-settings', '.settings'],
    ['.hub-open-about', '.about'],
    ['.hub-open-archive', '.archive'],
  ]) {
    await page.locator(button).click();
    await expect(page.locator(dialog)).toBeVisible();
    await expectButtonTargets(page);
    await page.keyboard.press('Escape');
  }
  await call(page, 'fly', 'apollo-11-site');
  await expect(page.locator('.site-ui')).toBeVisible();
  await expectButtonTargets(page);
  await call(page, 'land', 'apollo-11-site');
  await expect(page.locator('.landing-ui')).toBeVisible();
  await expectButtonTargets(page);
});

test('every img has alt text', async ({ page }) => {
  await page.locator('.hub-open-archive').click();
  const missing = await page.locator('img').evaluateAll((imgs) => imgs.filter((i) => !i.hasAttribute('alt')).length);
  expect(missing).toBe(0);
});

test('game story text has a cyan "Game story" frame; About explains it', async ({ page }) => {
  await call(page, 'fly', 'apollo-11-site');
  const story = page.locator('.site-ui .story-frame');
  await expect(story).toBeVisible();
  await expect(story.locator('.story-tag')).toHaveText('Game story');

  await page.keyboard.press('Escape');
  await expect(page.locator('.settings')).toBeVisible();
  await page.locator('.settings-about').click();
  await expect(page.locator('.about')).toBeVisible();
  await expect(page.locator('.about')).toContainText('Game story');
  await expect(page.locator('.about')).toContainText('Verified record');
});

test('Escape pauses the site and landing scenes and opens settings', async ({ page }) => {
  await call(page, 'fly', 'apollo-11-site');
  await expect(page.locator('.site-ui')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.settings')).toBeVisible();
  expect(await paused(page)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('.settings')).toBeHidden();
  expect(await paused(page)).toBe(false);

  await call(page, 'land', 'apollo-11-site');
  await expect(page.locator('.landing-ui')).toBeVisible();
  await page.locator('.landing-settings').click();
  await expect(page.locator('.settings')).toBeVisible();
  expect(await paused(page)).toBe(true);
  await page.locator('.settings-close').click();
  expect(await paused(page)).toBe(false);
});
