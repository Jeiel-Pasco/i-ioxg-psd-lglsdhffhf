import { Scene, type GameObjects } from 'phaser';
import { DISPLAY } from '../config/display';
import { SITE } from '../config/site';
import { ROBOT_SITE_TEX, ensureEntityTextures } from '../sprites/pixelRenderer';

export const OPENING_SCENE_KEY = 'Opening';

/** How long each picture fades in (ms). Slow on purpose: nothing in the opening flashes. */
const FADE_MS = 900;

/**
 * Opening pictures (GDD 3.3). Each step matches one caption line in the DOM panel:
 * 0 black screen and visor, 1 listening, 2 first-person view of the surface, 3 pull back to top-down.
 * The DOM panel drives the steps, so the player sets the pace and can skip at any time.
 */
export class Opening extends Scene {
  private reducedMotion = false;
  private layers: GameObjects.Container[] = [];

  constructor() {
    super(OPENING_SCENE_KEY);
  }

  init(data: { reducedMotion?: boolean }): void {
    this.reducedMotion = data.reducedMotion ?? false;
  }

  create(): void {
    this.game.canvas.parentElement?.setAttribute('data-scene', OPENING_SCENE_KEY);
    ensureEntityTextures(this);
    const { width: w, height: h } = DISPLAY;
    this.cameras.main.setBackgroundColor('#05070d');

    // 0: the robot's pixel-art visor waking up in the dark.
    const visorFrame = this.add.graphics();
    visorFrame.fillStyle(0x3b3f47, 1).fillRect(w / 2 - 44, h / 2 - 10, 88, 20);
    visorFrame.fillStyle(0x0e1320, 1).fillRect(w / 2 - 40, h / 2 - 6, 80, 12);
    visorFrame.fillStyle(0x4fd8ff, 1).fillRect(w / 2 - 36, h / 2 - 2, 72, 4);
    visorFrame.fillStyle(0xe8edf5, 1).fillRect(w / 2 - 32, h / 2 - 2, 16, 2);
    const visor = this.add.container(0, 0, [visorFrame]);

    // 1: listening, concentric signal rings around the visor.
    const rings = this.add.container(0, 0, [
      this.add.circle(w / 2, h / 2, 26).setStrokeStyle(1, 0x4fd8ff, 0.7),
      this.add.circle(w / 2, h / 2, 46).setStrokeStyle(1, 0x4fd8ff, 0.4),
      this.add.circle(w / 2, h / 2, 68).setStrokeStyle(1, 0x4fd8ff, 0.2),
    ]);

    // 2: first-person view, starry lunar sky over a cratered horizon with a distant lander silhouette.
    const horizon = this.add.graphics();
    horizon.fillStyle(0x252830, 1);
    horizon.fillTriangle(0, h * 0.65, 80, h * 0.5, 170, h * 0.65);
    horizon.fillTriangle(140, h * 0.65, 230, h * 0.46, 320, h * 0.65);
    horizon.fillStyle(SITE.ground.moon, 1).fillRect(0, h * 0.65, w, h * 0.35);
    const stars = Array.from({ length: 28 }, (_, i) =>
      this.add.rectangle((i * 53 + 11) % w, ((i * 29 + 7) % (h * 0.45)) + 4, 1, 1, 0xe8edf5),
    );
    const distantLander = this.add.image(w * 0.72, h * 0.65, 'machine-lander').setOrigin(0.5, 1).setScale(0.75);
    const surface = this.add.container(0, 0, [
      ...stars,
      horizon,
      this.add.ellipse(w * 0.28, h * 0.78, 42, 10, 0x2c2f36).setStrokeStyle(1, 0x5a5f69),
      this.add.ellipse(w * 0.68, h * 0.86, 58, 12, 0x2c2f36).setStrokeStyle(1, 0x5a5f69),
      distantLander,
    ]);

    // 3: pulled back to the top-down view, the pixel-art robot and the first echo around a lander.
    const echo = this.add.circle(w * 0.65, h * 0.42, 14).setStrokeStyle(1, 0x4fd8ff);
    const topDown = this.add.container(0, 0, [
      this.add.rectangle(w / 2, h / 2, w, h, SITE.ground.moon),
      this.add.circle(w * 0.25, h * 0.72, 18, 0x2c2f36).setStrokeStyle(2, 0x5a5f69),
      this.add.circle(w * 0.78, h * 0.76, 12, 0x2c2f36).setStrokeStyle(2, 0x5a5f69),
      this.add.circle(w * 0.48, h * 0.28, 5, 0x5a5f69),
      this.add.image(w * 0.65, h * 0.42, 'machine-lander'),
      this.add.image(w * 0.36, h * 0.62, ROBOT_SITE_TEX),
      echo,
    ]);
    if (!this.reducedMotion) {
      this.tweens.add({ targets: echo, scale: 1.6, alpha: 0.3, duration: 1400, yoyo: true, repeat: -1 });
    }

    this.layers = [visor, rings, surface, topDown];
    for (const l of this.layers) l.setAlpha(0);
    this.show(0);
  }

  /** Shows the picture for caption line `step`. */
  show(step: number): void {
    this.layers.forEach((layer, i) => {
      // Step 1 keeps the visor; later steps replace it.
      const on = i === step || (step === 1 && i === 0);
      this.tweens.killTweensOf(layer);
      if (this.reducedMotion || !on) layer.setAlpha(on ? 1 : 0);
      else this.tweens.add({ targets: layer, alpha: 1, duration: FADE_MS });
    });
    if (step === 3 && !this.reducedMotion) {
      // The camera pulls back: start close, ease out to the full view.
      this.cameras.main.setZoom(2.5);
      this.cameras.main.zoomTo(1, FADE_MS * 1.5);
    } else {
      this.cameras.main.setZoom(1);
    }
  }
}
