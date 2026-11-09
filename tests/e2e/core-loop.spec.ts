import { expect, test } from './fixtures';
import { MOON_FLAGSHIPS, flyFromHub, landWithSolver, marsLocked, playOpening, walkToMachine } from './play';

// `?opening` asks the e2e build to play the opening; other specs start at the hub.
test('core loop: opening, three Moon flagships, reveal, Mars unlock, reload', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/?opening');
  await playOpening(page);
  expect(await marsLocked(page)).toBe(true);

  for (const id of MOON_FLAGSHIPS) {
    await flyFromHub(page, id);
    await walkToMachine(page);
    await landWithSolver(page);

    // Reveal: the landing result offers the new entry, which opens in the Archive.
    await page.locator('.landing-read').click();
    const archive = page.locator('dialog.archive');
    await expect(archive).toBeVisible();
    await expect(archive.locator('.archive-entry-view')).toBeVisible();
    await expect(archive.locator('.archive-entry-view article')).toHaveAttribute('data-id', id);
    await archive.locator('.archive-close').click();

    // Back to the site: the machine is still there. Then the map, where the marker is amber.
    await page.locator('.landing-back').click();
    await expect(page.locator('#game-container')).toHaveAttribute('data-scene', 'Site');
    await page.keyboard.press('m');
    await expect(page.locator('#hub')).toBeVisible();
    await expect(page.locator(`.hub-marker[data-entries~="${id}"]`).first()).not.toHaveAttribute('data-archived', 'none');
  }

  expect(await marsLocked(page)).toBe(false);

  // The state survives a reload, and the opening does not play a second time.
  await page.reload();
  await expect(page.locator('.opening')).toBeHidden();
  await expect(page.locator('#hub')).toBeVisible();
  expect(await marsLocked(page)).toBe(false);
  await page.locator('.hub-open-archive').click();
  for (const id of MOON_FLAGSHIPS) {
    await expect(page.locator(`.archive-card[data-id="${id}"]`)).toHaveAttribute('data-locked', 'false');
  }
});

test('the opening can be skipped at once, by keyboard', async ({ page }) => {
  await page.goto('/?opening');
  await expect(page.locator('.opening')).toBeVisible();
  await expect(page.locator('#hub')).toBeHidden();
  // Every line is shown as text in a "Game story" frame (the caption is the line itself).
  await expect(page.locator('.opening .story-tag')).toHaveText('Game story');
  await expect(page.locator('.opening-line')).not.toBeEmpty();
  await page.locator('.opening-skip').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.opening')).toBeHidden();
  await expect(page.locator('#hub')).toBeVisible();
});

test('the opening counts the Moon echoes from the data', async ({ page }) => {
  await page.goto('/?opening');
  const lines: string[] = [];
  while (await page.locator('.opening-next').isVisible()) {
    lines.push((await page.locator('.opening-line').textContent()) ?? '');
    await page.locator('.opening-next').click();
  }
  expect(lines.join(' ')).toContain('ECHOES FOUND: 8.');
});

test('the Epilogue opens when every entry is recovered', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hub-open-epilogue')).toBeHidden();
  const ids = await page.locator('.hub-marker').evaluateAll((els) => els.flatMap((e) => (e as HTMLElement).dataset.entries?.split(' ') ?? []));
  await page.evaluate((list) => {
    const h = (window as unknown as { __stillOutThere: { recover(id: string, a: boolean): void } }).__stillOutThere;
    for (const id of list) h.recover(id, false);
  }, ids);
  // Mars markers appear once Mars unlocks; recover those too.
  await page.locator('.hub-world[data-world="mars"]').click();
  const marsList = await page.locator('.hub-marker').evaluateAll((els) => els.flatMap((e) => (e as HTMLElement).dataset.entries?.split(' ') ?? []));
  await page.evaluate((list) => {
    const h = (window as unknown as { __stillOutThere: { recover(id: string, a: boolean): void } }).__stillOutThere;
    for (const id of list) h.recover(id, false);
  }, marsList);

  const epilogue = page.locator('dialog.epilogue');
  await expect(epilogue).toBeVisible();
  await expect(epilogue).toContainText('17 of 17');
  await expect(epilogue.locator('.story-frame')).toContainText('all are still out there');
  await epilogue.locator('.epilogue-close').click();
  await expect(epilogue).toBeHidden();
  await expect(page.locator('.hub-open-epilogue')).toBeVisible();
});
