import { expect, type Page } from './fixtures';

/** The e2e build exposes a small test hook (see src/testHook.ts). */
interface TestHook {
  site(): { echo: string; robot: { x: number; y: number }; machine: { x: number; y: number } } | null;
  landing(): { outcome: string | null } | null;
  landScript(kind: 'solver' | 'none'): void;
}
const hook = <T>(page: Page, fn: (h: TestHook) => T) =>
  page.evaluate(`(${fn.toString()})(window.__stillOutThere)`) as Promise<T>;

export const MOON_FLAGSHIPS = ['apollo-11-site', 'apollo-15-lrv', 'surveyor-3'];
export const MARS_FLAGSHIPS = ['sojourner-pathfinder', 'spirit-opportunity', 'ingenuity'];

/** Clicks through the opening, one line at a time, to the hub. */
export async function playOpening(page: Page): Promise<void> {
  const opening = page.locator('.opening');
  await expect(opening).toBeVisible();
  while (await page.locator('.opening-next').isVisible()) await page.locator('.opening-next').click();
  await expect(opening).toBeHidden();
  await expect(page.locator('#hub')).toBeVisible();
}

/** Picks an entry's marker on the hub map (opening a cluster if needed) and presses Fly here. */
export async function flyFromHub(page: Page, id: string): Promise<void> {
  await page.locator(`.hub-marker[data-entries~="${id}"]`).first().click();
  const member = page.locator(`.hub-card .hub-cluster-member[data-key^="${id}:"]`).first();
  if (await member.isVisible()) await member.click();
  await page.locator('.hub-card .hub-fly').click();
  await expect(page.locator('#game-container')).toHaveAttribute('data-scene', 'Site');
}

/** Walks the robot to the machine with the arrow keys until the echo is Ready. */
export async function walkToMachine(page: Page): Promise<void> {
  const held = new Set<string>();
  const set = async (key: string, on: boolean) => {
    if (on && !held.has(key)) await page.keyboard.down(key);
    if (!on && held.has(key)) await page.keyboard.up(key);
    if (on) held.add(key);
    else held.delete(key);
  };
  for (let i = 0; i < 120; i++) {
    const s = await hook(page, (h) => h.site());
    if (!s) throw new Error('site scene is not running');
    if (s.echo === 'ready') {
      for (const k of [...held]) await set(k, false);
      return;
    }
    const dx = s.machine.x - s.robot.x;
    const dy = s.machine.y - s.robot.y;
    await set('ArrowRight', dx > 6);
    await set('ArrowLeft', dx < -6);
    await set('ArrowDown', dy > 6);
    await set('ArrowUp', dy < -6);
    await page.waitForTimeout(120);
  }
  throw new Error('robot did not reach Ready');
}

/** Opens the Mars map and reports whether it shows the lock, then goes back to the Moon map. */
export async function marsLocked(page: Page): Promise<boolean> {
  await page.locator('.hub-world[data-world="mars"]').click();
  const locked = await page.locator('.hub-lock').isVisible();
  await page.locator('.hub-world[data-world="moon"]').click();
  return locked;
}

/** Starts the landing with E, lets the solver bot fly it, and waits for a safe landing. */
export async function landWithSolver(page: Page): Promise<void> {
  await page.keyboard.press('e');
  await expect(page.locator('#game-container')).toHaveAttribute('data-scene', 'Landing');
  await hook(page, (h) => h.landScript('solver'));
  await expect.poll(() => hook(page, (h) => h.landing()?.outcome ?? null), { timeout: 20_000 }).toBe('landed');
}
