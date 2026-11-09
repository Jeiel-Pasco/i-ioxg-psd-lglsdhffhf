import { expect, test, type Page } from './fixtures';

/**
 * Selects every marker in the current world (expanding clusters) and checks the card.
 * Returns the marker keys seen.
 */
async function selectAll(page: Page, useTap: boolean): Promise<string[]> {
  const press = (sel: ReturnType<Page['locator']>) => (useTap ? sel.tap() : sel.click());
  const seen: string[] = [];
  const card = page.locator('.hub-card');
  const count = await page.locator('.hub-marker').count();

  for (let i = 0; i < count; i++) {
    await press(page.locator('.hub-marker').nth(i));
    const members = card.locator('.hub-cluster-member');
    const memberCount = await members.count();
    const picks = memberCount === 0 ? [null] : Array.from({ length: memberCount }, (_, j) => j);

    for (const j of picks) {
      if (j !== null) {
        if (j > 0) await press(page.locator('.hub-marker').nth(i)); // reopen the cluster
        await press(card.locator('.hub-cluster-member').nth(j));
      }
      const key = await card.getAttribute('data-marker-key');
      expect(key).toBeTruthy();
      await expect(card.locator('h2')).not.toBeEmpty();
      await expect(card.locator('.hub-status')).toBeVisible();
      await expect(card.locator('.hub-coords')).toContainText('°');
      if ((await card.getAttribute('data-approximate')) === 'true') {
        await expect(card.locator('.hub-coords')).toContainText('approximate');
      }
      await expect(card.locator('.hub-fly')).toBeVisible();
      seen.push(key ?? '');
    }
  }
  return seen;
}

async function selectWorld(page: Page, world: 'moon' | 'mars', useTap: boolean) {
  const tab = page.locator(`.hub-world[data-world="${world}"]`);
  await (useTap ? tab.tap() : tab.click());
  await expect(tab).toHaveAttribute('aria-pressed', 'true');
}

for (const mode of ['mouse', 'touch'] as const) {
  test.describe(`hub map (${mode})`, () => {
    const useTap = mode === 'touch';
    test.use(useTap ? { viewport: { width: 360, height: 740 }, hasTouch: true } : { viewport: { width: 1280, height: 720 } });

    test('every one of the 21 markers is selectable and shows its card', async ({ page }) => {
      await page.goto('/');
      await selectWorld(page, 'moon', useTap);
      const moonKeys = await selectAll(page, useTap);
      await selectWorld(page, 'mars', useTap);
      const marsKeys = await selectAll(page, useTap);

      expect(new Set(moonKeys).size).toBe(10);
      expect(new Set(marsKeys).size).toBe(11);
    });

    test('Mars shows a locked state with a reason and cannot be flown to', async ({ page }) => {
      await page.goto('/');
      await selectWorld(page, 'mars', useTap);
      await expect(page.locator('.hub-lock')).toBeVisible();
      await expect(page.locator('.hub-lock')).toContainText('Moon');
      const first = page.locator('.hub-marker').first();
      await (useTap ? first.tap() : first.click());
      const member = page.locator('.hub-card .hub-cluster-member').first();
      if (await member.count()) await (useTap ? member.tap() : member.click());
      await expect(page.locator('.hub-card .hub-fly')).toBeDisabled();
    });

    test('the page never scrolls sideways', async ({ page }) => {
      await page.goto('/');
      for (const world of ['moon', 'mars'] as const) {
        await selectWorld(page, world, useTap);
        const overflow = await page.evaluate(() => {
          const hub = document.getElementById('hub');
          return hub ? hub.scrollWidth - hub.clientWidth : -1;
        });
        expect(overflow).toBe(0);
      }
    });
  });
}

test('markers are at least 44 by 44 px and reachable by keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  const boxes = await page.locator('.hub-marker').evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect()).map((r) => [r.width, r.height]),
  );
  for (const [w, h] of boxes) {
    expect(w).toBeGreaterThanOrEqual(44);
    expect(h).toBeGreaterThanOrEqual(44);
  }
  await page.locator('.hub-marker').first().focus();
  await page.keyboard.press('Enter');
  const member = page.locator('.hub-card .hub-cluster-member').first();
  if (await member.count()) {
    await member.focus();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('.hub-card')).toHaveAttribute('data-marker-key', /.+/);
});

test('Fly here is enabled on Moon markers and hub shows recovery progress', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hub-progress')).toContainText('0 of 17 (0 of 8 Moon · 0 of 9 Mars)');
  const first = page.locator('.hub-marker').first();
  await first.click();
  const member = page.locator('.hub-card .hub-cluster-member').first();
  if (await member.count()) await member.click();
  await expect(page.locator('.hub-card .hub-fly')).toBeEnabled();
});
