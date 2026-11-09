import { Scene } from 'phaser';

export const BOOT_SCENE_KEY = 'Boot';

export class Boot extends Scene {
  constructor() {
    super(BOOT_SCENE_KEY);
  }

  create(): void {
    // Expose the active scene on the container so e2e tests can tell the game is up.
    this.game.canvas.parentElement?.setAttribute('data-scene', BOOT_SCENE_KEY);
  }
}
