import { AUTO, Game, Scale } from 'phaser';
import text from '../data/text/en.json';
import { DISPLAY } from './config/display';
import { Events, eventBus } from './core/events';
import { Boot } from './scenes/Boot';
import { loadEntries } from './data/loadEntries';
import { Progress, openStore } from './save/save';
import { Archive } from './ui/archive/ArchiveGrid';
import { el } from './ui/dom';
import { HubMap } from './ui/hub/HubMap';
import { installTestHook } from './testHook';

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
    scene: [Boot],
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

  if (import.meta.env.MODE === 'e2e') installTestHook(game);
});
