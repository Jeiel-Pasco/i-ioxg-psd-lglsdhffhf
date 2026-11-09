import type { Game } from 'phaser';
import { Events, eventBus } from './core/events';

/** Only the e2e build (`vite build --mode e2e`) installs this; production builds drop it. */
export function installTestHook(game: Game): void {
  Object.assign(window, {
    __stillOutThere: {
      recover: (entryId: string, assisted: boolean) => eventBus.emit(Events.ENTRY_RECOVERED, { entryId, assisted }),
      keyboardEnabled: () => game.input.keyboard?.enabled ?? false,
    },
  });
}
