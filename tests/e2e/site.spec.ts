import { expect, test, type Page } from './fixtures';

interface Snapshot {
  entryId: string;
  echo: 'unvisited' | 'near' | 'ready' | 'archived';
  robot: { x: number; y: number };
  machine: { x: number; y: number; visible: boolean; archivedTag: boolean };
}

/** The e2e build exposes a small test hook (see src/testHook.ts). */
interface TestHook {
  fly(id: string): void;
  site(): Snapshot | null;
}

const FLAGSHIPS = ['apollo-11-site', 'apollo-15-lrv', 'surveyor-3'];
const STEP_MS = 120;
const MAX_STEPS = 120;
/** Stop steering on an axis when this close (px); the ready radius is larger. */
const AXIS_SLACK = 6;

async function snapshot(page: Page): Promise<Snapshot> {
  const s = await page.evaluate(() => (window as unknown as { __stillOutThere: TestHook }).__stillOutThere.site());
  if (!s) throw new Error('site scene is not running');
  return s;
}

async function fly(page: Page, id: string): Promise<void> {
  await page.evaluate((entryId) => (window as unknown as { __stillOutThere: TestHook }).__stillOutThere.fly(entryId), id);
  await expect(page.locator('#game-container')).toHaveAttribute('data-scene', 'Site');
  await expect(page.locator('#hub')).toBeHidden();
}

/** Direction from the robot to the machine, as -1/0/1 per axis. */
function heading(s: Snapshot): { x: number; y: number } {
  const dx = s.machine.x - s.robot.x;
  const dy = s.machine.y - s.robot.y;
  return { x: Math.abs(dx) < AXIS_SLACK ? 0 : Math.sign(dx), y: Math.abs(dy) < AXIS_SLACK ? 0 : Math.sign(dy) };
}

async function driveByKeyboard(page: Page): Promise<Snapshot> {
  const held = new Set<string>();
  const set = async (key: string, on: boolean) => {
    if (on && !held.has(key)) await page.keyboard.down(key);
    if (!on && held.has(key)) await page.keyboard.up(key);
    if (on) held.add(key);
    else held.delete(key);
  };
  for (let i = 0; i < MAX_STEPS; i++) {
    const s = await snapshot(page);
    if (s.echo === 'ready') {
      for (const k of [...held]) await set(k, false);
      return s;
    }
    const h = heading(s);
    await set('ArrowRight', h.x > 0);
    await set('ArrowLeft', h.x < 0);
    await set('ArrowDown', h.y > 0);
    await set('ArrowUp', h.y < 0);
    await page.waitForTimeout(STEP_MS);
  }
  throw new Error('robot did not reach Ready');
}

/** Holds a touch on the joystick and moves it toward the machine (Chrome touch events via CDP). */
async function driveByTouch(page: Page): Promise<Snapshot> {
  const box = await page.locator('.joystick').boundingBox();
  if (!box) throw new Error('joystick not visible');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x: number, y: number) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  await touch('touchStart', cx, cy);
  for (let i = 0; i < MAX_STEPS; i++) {
    const s = await snapshot(page);
    if (s.echo === 'ready') {
      await touch('touchEnd', cx, cy);
      return s;
    }
    const h = heading(s);
    await touch('touchMove', cx + h.x * 40, cy + h.y * 40);
    await page.waitForTimeout(STEP_MS);
  }
  throw new Error('robot did not reach Ready by touch');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#game-container canvas')).toHaveCount(1);
});

for (const id of FLAGSHIPS) {
  test(`keyboard drives the robot to Ready at ${id}`, async ({ page }) => {
    await fly(page, id);
    expect((await snapshot(page)).echo).toBe('unvisited');
    const s = await driveByKeyboard(page);
    expect(s.entryId).toBe(id);
    await expect(page.locator('.site-status')).toContainText('You found it');
    await expect(page.locator('.interact-button')).toBeEnabled();
  });
}

test.describe('touch', () => {
  test.use({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });

  for (const id of FLAGSHIPS) {
    test(`touch drives the robot to Ready at ${id}`, async ({ page }) => {
      await fly(page, id);
      await driveByTouch(page);
      await expect(page.locator('.interact-button')).toBeEnabled();
    });
  }

  test('controls are at least 44 px', async ({ page }) => {
    await fly(page, 'surveyor-3');
    for (const sel of ['.site-map', '.interact-button', '.joystick']) {
      const b = await page.locator(sel).boundingBox();
      expect(b?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(b?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });
});

test('the echo gets near before it is ready', async ({ page }) => {
  await fly(page, 'surveyor-3');
  const seen = new Set<string>();
  await page.keyboard.down('ArrowUp');
  for (let i = 0; i < MAX_STEPS && !seen.has('ready'); i++) {
    seen.add((await snapshot(page)).echo);
    await page.waitForTimeout(STEP_MS / 2);
  }
  await page.keyboard.up('ArrowUp');
  expect([...seen]).toEqual(['unvisited', 'near', 'ready']);
});

test('a visit recovery keeps the machine in the scene, tagged Archived', async ({ page }) => {
  await fly(page, 'apollo-12-site');
  await driveByKeyboard(page);
  await page.keyboard.press('e');
  await expect.poll(async () => (await snapshot(page)).echo).toBe('archived');
  const s = await snapshot(page);
  expect(s.machine.visible).toBe(true);
  expect(s.machine.archivedTag).toBe(true);
  await expect(page.locator('.site-status')).toContainText('Archived');

  // The recovery is saved, and the machine is still there on a return visit.
  await page.locator('.site-map').click();
  await expect(page.locator('#hub')).toBeVisible();
  await expect(page.locator('.hub-marker[data-entries~="apollo-12-site"]')).toHaveAttribute('data-archived', /all|some/);
  await fly(page, 'apollo-12-site');
  const again = await snapshot(page);
  expect(again.echo).toBe('archived');
  expect(again.machine.visible).toBe(true);
});

test('a jetpack site asks for a landing instead of recovering at once', async ({ page }) => {
  await fly(page, 'surveyor-3');
  await driveByKeyboard(page);
  await page.locator('.interact-button').click();
  await expect(page.locator('#game-container')).toHaveAttribute('data-scene', 'Landing');
  await expect(page.locator('.site-ui')).toBeHidden();
});

test('M returns to the hub and stops the site scene', async ({ page }) => {
  await fly(page, 'apollo-11-site');
  await page.keyboard.press('m');
  await expect(page.locator('#hub')).toBeVisible();
  await expect(page.locator('.site-ui')).toBeHidden();
  await expect(page.locator('#game-container')).toHaveAttribute('data-scene', 'Hub');
  const s = await page.evaluate(() => (window as unknown as { __stillOutThere: TestHook }).__stillOutThere.site());
  expect(s).toBeNull();
});

test('site Archive button and I key open the archive from site', async ({ page }) => {
  await fly(page, 'apollo-11-site');
  await expect(page.locator('.site-archive')).toBeVisible();

  // Test button click
  await page.locator('.site-archive').click();
  await expect(page.locator('.archive')).toBeVisible();
  await page.locator('.archive-close').click();
  await expect(page.locator('.archive')).toBeHidden();

  // Test 'I' shortcut
  await page.keyboard.press('i');
  await expect(page.locator('.archive')).toBeVisible();
  await page.locator('.archive-close').click();
  await expect(page.locator('.archive')).toBeHidden();
});
