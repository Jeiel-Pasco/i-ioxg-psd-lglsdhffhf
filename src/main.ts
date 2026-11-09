import { AUTO, Game, Scale } from 'phaser';
import { DISPLAY } from './config/display';
import { Boot } from './scenes/Boot';

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
  startGame(DISPLAY.parentId);
});
