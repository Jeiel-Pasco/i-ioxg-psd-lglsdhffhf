import { expect, test, type Page } from './fixtures';

interface LandingSnap {
  entryId: string;
  outcome: 'landed' | 'too_fast' | 'missed' | 'no_fuel' | null;
  input: { thrust: 0 | 1; steer: -1 | 0 | 1 };
  assisted: boolean;
  fuel: number;
  platformWidth: number;
}

/** The e2e build exposes a small test hook (see src/testHook.ts). */
interface TestHook {
  fly(id: string): void;
  land(id: string): void;
  landScript(kind: 'solver' | 'none'): void;
  landing(): LandingSnap | null;
  site(): { echo: string } | null;
}

const SAVE_KEY = 'still-out-there:save';
const snap = (page: Page) =>
  page.evaluate(() => (window as unknown as { __stillOutThere: TestHook }).__stillOutThere.landing());
const siteSnap = (page: Page) =>
  page.evaluate(() => (window as unknown as { __stillOutThere: TestHook }).__stillOutThere.site());

async function startLanding(page: Page, id: string): Promise<void> {
  await page.evaluate((entryId) => {
    const h = (window as unknown as { __stillOutThere: TestHook }).__stillOutThere;
    h.fly(entryId);
    h.land(entryId);
  }, id);
  await expect(page.locator('#game-container')).toHaveAttribute('data-scene', 'Landing');
  await expect(page.locator('.landing-ui')).toBeVisible();
}

async function script(page: Page, kind: 'solver' | 'none'): Promise<void> {
  await page.evaluate((k) => (window as unknown as { __stillOutThere: TestHook }).__stillOutThere.landScript(k), kind);
}

async function outcome(page: Page): Promise<LandingSnap['outcome']> {
  return (await snap(page))?.outcome ?? null;
}

const save = (page: Page) => page.evaluate((k) => localStorage.getItem(k), SAVE_KEY);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#game-container canvas')).toHaveCount(1);
});

test('a scripted safe input lands and recovers the entry', async ({ page }) => {
  await startLanding(page, 'apollo-11-site');
  await script(page, 'solver');
  await expect.poll(() => outcome(page), { timeout: 20_000 }).toBe('landed');
  await expect(page.locator('.landing-result')).toBeVisible();
  await expect(page.locator('.landing-result')).toContainText('Landed');
  expect(await save(page)).toContain('apollo-11-site');

  // Back to site: the robot is beside the machine, which is still there, now archived.
  await page.locator('.landing-back').click();
  await expect(page.locator('#game-container')).toHaveAttribute('data-scene', 'Site');
  await expect(page.locator('.landing-ui')).toBeHidden();
  await expect.poll(async () => (await siteSnap(page))?.echo).toBe('archived');
});

test('an unsafe input fails and leaves the save alone', async ({ page }) => {
  const before = await save(page);
  await startLanding(page, 'surveyor-3');
  await script(page, 'none');
  await expect.poll(() => outcome(page), { timeout: 20_000 }).not.toBeNull();
  expect(await outcome(page)).not.toBe('landed');
  await expect(page.locator('.landing-retry')).toBeVisible();
  await expect(page.locator('.landing-retry')).toBeFocused();
  await expect(page.locator('.landing-back')).toBeVisible();
  await expect(page.locator('.landing-assist')).toBeHidden();
  expect(await save(page)).toBe(before);

  await page.locator('.landing-back').click();
  await expect(page.locator('#game-container')).toHaveAttribute('data-scene', 'Site');
  await expect.poll(async () => (await siteSnap(page))?.echo).toBe('ready');
});

test('after 3 failures Assist and Skip appear, and the save is unchanged', async ({ page }) => {
  const before = await save(page);
  await startLanding(page, 'apollo-15-lrv');
  for (let i = 1; i <= 3; i++) {
    await script(page, 'none');
    await expect.poll(() => outcome(page), { timeout: 20_000 }).not.toBeNull();
    if (i < 3) {
      await expect(page.locator('.landing-assist')).toBeHidden();
      await expect(page.locator('.landing-skip')).toBeHidden();
      await page.locator('.landing-retry').click();
      await expect.poll(() => outcome(page)).toBeNull();
    }
  }
  await expect(page.locator('.landing-assist')).toBeVisible();
  await expect(page.locator('.landing-skip')).toBeVisible();
  expect(await save(page)).toBe(before);

  // Assist: more fuel and a wider platform.
  const plain = await snap(page);
  await page.locator('.landing-assist').click();
  await expect.poll(() => outcome(page)).toBeNull();
  const assisted = await snap(page);
  expect(assisted?.assisted).toBe(true);
  expect(assisted?.platformWidth ?? 0).toBeGreaterThan(plain?.platformWidth ?? 0);

  // Skip: a visit-only recovery that returns to the site.
  await script(page, 'none');
  await expect.poll(() => outcome(page), { timeout: 20_000 }).not.toBeNull();
  await page.locator('.landing-skip').click();
  await expect(page.locator('#game-container')).toHaveAttribute('data-scene', 'Site');
  expect(await save(page)).toContain('apollo-15-lrv');
});

test('thrust+steer together on the keyboard', async ({ page }) => {
  await startLanding(page, 'apollo-11-site');
  await page.keyboard.down('Space');
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await snap(page))?.input).toEqual({ thrust: 1, steer: 1 });
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('a');
  await expect.poll(async () => (await snap(page))?.input).toEqual({ thrust: 1, steer: -1 });
  await page.keyboard.up('a');
  await page.keyboard.up('Space');
  await expect.poll(async () => (await snap(page))?.input).toEqual({ thrust: 0, steer: 0 });
});

test.describe('touch', () => {
  test.use({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });

  test('thrust+steer together with two fingers', async ({ page }) => {
    await startLanding(page, 'apollo-11-site');
    const center = async (sel: string) => {
      const b = await page.locator(sel).boundingBox();
      if (!b) throw new Error(`${sel} not visible`);
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    };
    const thrust = await center('.landing-thrust');
    const right = await center('.landing-right');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...thrust, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { ...thrust, id: 1 },
        { ...right, id: 2 },
      ],
    });
    await expect.poll(async () => (await snap(page))?.input).toEqual({ thrust: 1, steer: 1 });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(async () => (await snap(page))?.input).toEqual({ thrust: 0, steer: 0 });
  });

  test('landing controls are at least 44 px and well apart', async ({ page }) => {
    await startLanding(page, 'apollo-11-site');
    for (const sel of ['.landing-left', '.landing-right', '.landing-thrust']) {
      const b = await page.locator(sel).boundingBox();
      expect(b?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(b?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    const right = await page.locator('.landing-right').boundingBox();
    const thrust = await page.locator('.landing-thrust').boundingBox();
    expect((thrust?.x ?? 0) - ((right?.x ?? 0) + (right?.width ?? 0))).toBeGreaterThanOrEqual(16);
  });
});
