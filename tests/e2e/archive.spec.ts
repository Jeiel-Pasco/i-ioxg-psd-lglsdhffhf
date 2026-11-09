import { expect, test, type Page } from '@playwright/test';

/** The e2e build exposes a small test hook (see src/testHook.ts). */
interface TestHook {
  recover(id: string, assisted: boolean): void;
  keyboardEnabled(): boolean;
}

async function recover(page: Page, id: string, assisted = false): Promise<void> {
  await page.evaluate(
    ([entryId, a]) => (window as unknown as { __stillOutThere: TestHook }).__stillOutThere.recover(entryId, a),
    [id, assisted] as const,
  );
}

async function keyboardEnabled(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as unknown as { __stillOutThere: TestHook }).__stillOutThere.keyboardEnabled());
}

async function openArchive(page: Page): Promise<void> {
  await page.locator('.hub-open-archive').click();
  await expect(page.locator('.archive')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#game-container canvas')).toHaveCount(1);
});

test('unlock survives reload', async ({ page }) => {
  await recover(page, 'surveyor-3');
  await page.reload();

  const marker = page.locator('.hub-marker[data-entries~="surveyor-3"]');
  await expect(marker).toHaveAttribute('data-archived', /^(all|some)$/);
  await expect(marker).toHaveAttribute('aria-label', /recovered/i);

  await openArchive(page);
  const card = page.locator('.archive-card[data-id="surveyor-3"]');
  await expect(card).toHaveAttribute('data-locked', 'false');
  await expect(card).toContainText('Surveyor 3');
  await card.locator('button').click();
  await expect(page.locator('.entry h2')).toHaveText('Surveyor 3');
});

test('locked cards show a silhouette and no name', async ({ page }) => {
  await openArchive(page);
  await expect(page.locator('.archive-card')).toHaveCount(17);
  const locked = page.locator('.archive-card[data-locked="true"]');
  await expect(locked).toHaveCount(17);
  await expect(locked.first()).toContainText('Echo not yet visited');
  await expect(locked.first().locator('.archive-silhouette')).toBeVisible();
  await expect(page.locator('.archive')).not.toContainText('Surveyor 3');
});

test('filters by world and status', async ({ page }) => {
  await recover(page, 'surveyor-3');
  await openArchive(page);
  await page.locator('.archive-filter-world').selectOption('moon');
  await expect(page.locator('.archive-card')).toHaveCount(8);
  await page.locator('.archive-filter-world').selectOption('mars');
  await expect(page.locator('.archive-card')).toHaveCount(9);
  await page.locator('.archive-filter-world').selectOption('all');
  await page.locator('.archive-filter-status').selectOption('active');
  // Every status is still TODO in the stubs, so no open card matches yet.
  await expect(page.locator('.archive-card')).toHaveCount(0);
  await expect(page.locator('.archive-empty')).toBeVisible();
});

test('entry page follows the GDD 8.2 order and is a verified record', async ({ page }) => {
  await recover(page, 'surveyor-3');
  await openArchive(page);
  await page.locator('.archive-card[data-id="surveyor-3"] button').click();
  const entry = page.locator('.entry');
  await expect(entry).toContainText('Verified record');
  const order = await entry.locator('[data-section]').evaluateAll((els) => els.map((e) => e.getAttribute('data-section')));
  expect(order).toEqual([
    'header',
    'image',
    'summary',
    'hook',
    'how',
    'science',
    'facts',
    'dates',
    'locations',
    'sources',
    'verified',
  ]);
  for (const alt of await entry.locator('img').evaluateAll((els) => els.map((e) => e.getAttribute('alt')))) {
    expect(alt).toBeTruthy();
  }
});

test('the archive never shows that an entry was assisted', async ({ page }) => {
  await recover(page, 'surveyor-3', true);
  await openArchive(page);
  await expect(page.locator('.archive')).not.toContainText(/assist/i);
  await page.locator('.archive-card[data-id="surveyor-3"] button').click();
  await expect(page.locator('.entry h2')).toHaveText('Surveyor 3');
  await expect(page.locator('.archive')).not.toContainText(/assist/i);
});

test('keyboard focus', async ({ page }) => {
  expect(await keyboardEnabled(page)).toBe(true);
  const opener = page.locator('.hub-open-archive');
  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.archive')).toBeVisible();
  expect(await keyboardEnabled(page)).toBe(false);

  // Keys reach the overlay, not Phaser.
  const world = page.locator('.archive-filter-world');
  await world.focus();
  await page.keyboard.press('ArrowDown');
  await expect(world).not.toHaveValue('all');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.closest('.archive') !== null)).toBe(true);

  await page.keyboard.press('Escape');
  await expect(page.locator('.archive')).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await keyboardEnabled(page)).toBe(true);
});

test('reset progress locks every card again', async ({ page }) => {
  await recover(page, 'surveyor-3');
  await openArchive(page);
  page.once('dialog', (d) => void d.accept());
  await page.locator('.archive-reset').click();
  await expect(page.locator('.archive-card[data-id="surveyor-3"]')).toHaveAttribute('data-locked', 'true');
  await page.reload();
  await openArchive(page);
  await expect(page.locator('.archive-card[data-locked="false"]')).toHaveCount(0);
});

test('reading an entry is saved', async ({ page }) => {
  await recover(page, 'surveyor-3');
  await openArchive(page);
  await page.locator('.archive-card[data-id="surveyor-3"] button').click();
  const read = await page.evaluate(() => JSON.parse(localStorage.getItem('still-out-there:save') ?? '{}').read);
  expect(read).toEqual(['surveyor-3']);
});

test('phone: no sideways scroll and 44 px targets', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await recover(page, 'surveyor-3');
  await openArchive(page);
  const check = async () => {
    const overflow = await page.locator('.archive').evaluate((d) => d.scrollWidth - d.clientWidth);
    expect(overflow).toBe(0);
    const box = await page.locator('.archive').boundingBox();
    expect(box && box.x >= 0 && box.x + box.width <= 360).toBe(true);
    const boxes = await page
      .locator('.archive button:visible, .archive select:visible')
      .evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => [r.width, r.height]));
    for (const [w, h] of boxes) {
      expect(w).toBeGreaterThanOrEqual(44);
      expect(h).toBeGreaterThanOrEqual(44);
    }
  };
  await check();
  await page.locator('.archive-card[data-id="surveyor-3"] button').click();
  await check();
});

test.describe('blocked storage', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError');
        },
      });
    });
  });

  test('runs in memory and shows a notice', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.save-notice')).toBeVisible();
    await expect(page.locator('.save-notice')).toContainText(/not be kept/i);
    await recover(page, 'surveyor-3');
    await openArchive(page);
    await expect(page.locator('.archive-card[data-id="surveyor-3"]')).toHaveAttribute('data-locked', 'false');
  });
});
