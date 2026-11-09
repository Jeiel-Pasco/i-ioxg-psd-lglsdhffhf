import { AUTO, Game, Scale } from 'phaser';
import text from '../data/text/en.json';
import { DISPLAY } from './config/display';
import { Events, eventBus } from './core/events';
import { Boot } from './scenes/Boot';
import { SITE_SCENE_KEY, SiteScene } from './scenes/SiteScene';
import { loadEntries } from './data/loadEntries';
import { Progress, openStore } from './save/save';
import { Archive } from './ui/archive/ArchiveGrid';
import { el } from './ui/dom';
import { HubMap } from './ui/hub/HubMap';
import { SiteHud } from './ui/site/SiteHud';
import { installTestHook } from './testHook';
import { LANDING } from './config/landing';
import { loadLevels } from './data/loadLevels';
import { LANDING_SCENE_KEY, LandingScene } from './scenes/LandingScene';
import { resolveLevel, type ResolvedLevel } from './systems/level';
import { LandingHud } from './ui/landing/LandingHud';

export function startGame(parent: string): Game {
  return new Game({
    type: AUTO,
    parent,
    width: DISPLAY.width,
    height: DISPLAY.height,
    pixelArt: DISPLAY.pixelArt,
    backgroundColor: DISPLAY.backgroundColor,
    scale: { mode: Scale.FIT, autoCenter: Scale.CENTER_BOTH },
    // Keep Phaser's console banner off; it is noise in tests.
    banner: false,
    scene: [Boot, SiteScene, LandingScene],
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const game = startGame(DISPLAY.parentId);
  const entries = loadEntries();
  const progress = new Progress(openStore());
  const getArchived = () => progress.archivedIds();

  const archive = new Archive(entries, {
    getArchived,
    onRead: (id) => progress.markRead(id),
    onReset: () => progress.reset(),
    // While a DOM overlay is open, Phaser must not read or swallow key presses.
    onOpenChange: (open) => {
      if (game.input.keyboard) game.input.keyboard.enabled = !open;
    },
  });

  const hubRoot = document.getElementById('hub');
  const hub = hubRoot ? new HubMap(hubRoot, entries, getArchived, (opener) => archive.open(opener)) : null;

  const showNotice = () => {
    if (progress.persistent || document.querySelector('.save-notice')) return;
    const notice = el('p', 'save-notice', text.save.notice);
    notice.setAttribute('role', 'status');
    hubRoot?.querySelector('.hub-inner')?.prepend(notice);
  };
  showNotice();

  progress.onChange(() => {
    hub?.refresh();
    archive.refresh();
    showNotice();
  });
  eventBus.on(Events.ENTRY_RECOVERED, ({ entryId, assisted }) => progress.recover(entryId, assisted));

  // Hub -> site scene -> hub. The hub hides while a site is open so the canvas is visible.
  const siteHud = new SiteHud(document.body);
  const byId = new Map(entries.map((e) => [e.id, e]));
  const startSite = (entryId: string, atMachine: boolean) => {
    const entry = byId.get(entryId);
    if (!entry || !hubRoot) return;
    hubRoot.hidden = true;
    siteHud.show();
    game.scene.start(SITE_SCENE_KEY, {
      entryId,
      world: entry.world,
      recovery: entry.recovery,
      recovered: progress.archivedIds().has(entryId),
      reducedMotion: progress.settings.reducedMotion,
      atMachine,
    });
    game.canvas.tabIndex = -1;
    game.canvas.focus();
  };
  eventBus.on(Events.HUB_FLY, ({ entryId }) => startSite(entryId, false));

  // Site -> landing -> site (GDD 7.6). Failures are counted in memory only; they never touch the save.
  const levels = loadLevels();
  const failures = new Map<string, number>();
  let landing: { entryId: string; level: ResolvedLevel } | null = null;
  const startLanding = (entryId: string, assist: boolean) => {
    const level = levels.get(entryId);
    if (!level) return;
    const resolved = resolveLevel(level, { assist });
    landing = { entryId, level: resolved };
    game.scene.stop(SITE_SCENE_KEY);
    siteHud.hide();
    if (game.scene.isActive(LANDING_SCENE_KEY)) game.scene.stop(LANDING_SCENE_KEY);
    game.scene.start(LANDING_SCENE_KEY, { entryId, level: resolved, reducedMotion: progress.settings.reducedMotion });
    landingHud.show(resolved);
    game.canvas.focus();
  };
  const backToSite = () => {
    if (!landing) return;
    const { entryId } = landing;
    landing = null;
    game.scene.stop(LANDING_SCENE_KEY);
    landingHud.hide();
    startSite(entryId, true);
  };
  const landingHud = new LandingHud(document.body, {
    retry: () => landing && startLanding(landing.entryId, landing.level.assisted),
    assist: () => landing && startLanding(landing.entryId, true),
    back: backToSite,
    // Skip completes a visit-only recovery; the save marks it assisted, the Archive never shows that.
    skip: () => {
      if (!landing) return;
      eventBus.emit(Events.ENTRY_RECOVERED, { entryId: landing.entryId, assisted: true });
      backToSite();
    },
  });
  eventBus.on(Events.SITE_LAND, ({ entryId }) => startLanding(entryId, false));
  eventBus.on(Events.LANDING_RESULT, ({ entryId, outcome }) => {
    if (!landing || landing.entryId !== entryId) return;
    const assisted = landing.level.assisted;
    if (outcome === 'landed') {
      failures.delete(entryId);
      eventBus.emit(Events.ENTRY_RECOVERED, { entryId, assisted });
    } else {
      failures.set(entryId, (failures.get(entryId) ?? 0) + 1);
    }
    const offerHelp = (failures.get(entryId) ?? 0) >= LANDING.assist.afterFailures;
    landingHud.showResult(outcome, { offerHelp, assisted });
  });
  eventBus.on(Events.SITE_LEAVE, () => {
    game.scene.stop(SITE_SCENE_KEY);
    game.canvas.parentElement?.setAttribute('data-scene', 'Hub');
    siteHud.hide();
    if (!hubRoot) return;
    hubRoot.hidden = false;
    hub?.refresh();
    hubRoot.querySelector<HTMLElement>('.hub-card')?.focus();
  });

  if (import.meta.env.MODE === 'e2e') installTestHook(game);
});
