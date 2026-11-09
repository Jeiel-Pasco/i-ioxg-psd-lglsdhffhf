import type { Game } from 'phaser';
import { Events, eventBus } from './core/events';
import { LANDING_SCENE_KEY, type LandingScene } from './scenes/LandingScene';
import { SITE_SCENE_KEY, type SiteScene } from './scenes/SiteScene';
import { solve } from './systems/solver';

/** Only the e2e build (`vite build --mode e2e`) installs this; production builds drop it. */
export function installTestHook(game: Game): void {
  const landingScene = () =>
    game.scene.isActive(LANDING_SCENE_KEY) ? (game.scene.getScene(LANDING_SCENE_KEY) as LandingScene) : null;
  Object.assign(window, {
    __stillOutThere: {
      recover: (entryId: string, assisted: boolean) => eventBus.emit(Events.ENTRY_RECOVERED, { entryId, assisted }),
      keyboardEnabled: () => game.input.keyboard?.enabled ?? false,
      paused: () => game.scene.isPaused(SITE_SCENE_KEY) || game.scene.isPaused(LANDING_SCENE_KEY),
      fly: (entryId: string) => eventBus.emit(Events.HUB_FLY, { entryId, markerIndex: 0 }),
      site: () =>
        game.scene.isActive(SITE_SCENE_KEY) ? (game.scene.getScene(SITE_SCENE_KEY) as SiteScene).snapshot() : null,
      land: (entryId: string) => eventBus.emit(Events.SITE_LAND, { entryId }),
      landing: () => landingScene()?.snapshot() ?? null,
      /** Restarts the current run with the solver bot's route, or with no buttons held at all. */
      landScript: (kind: 'solver' | 'none') => {
        const scene = landingScene();
        if (!scene) return;
        scene.useScript(kind === 'solver' ? (solve(scene.level()) ?? []) : []);
      },
    },
  });
}
