import type { Game } from 'phaser';
import { Events, eventBus } from './core/events';
import { SITE_SCENE_KEY, type SiteScene } from './scenes/SiteScene';

/** Only the e2e build (`vite build --mode e2e`) installs this; production builds drop it. */
export function installTestHook(game: Game): void {
  Object.assign(window, {
    __stillOutThere: {
      recover: (entryId: string, assisted: boolean) => eventBus.emit(Events.ENTRY_RECOVERED, { entryId, assisted }),
      keyboardEnabled: () => game.input.keyboard?.enabled ?? false,
      fly: (entryId: string) => eventBus.emit(Events.HUB_FLY, { entryId, markerIndex: 0 }),
      site: () =>
        game.scene.isActive(SITE_SCENE_KEY) ? (game.scene.getScene(SITE_SCENE_KEY) as SiteScene).snapshot() : null,
    },
  });
}
