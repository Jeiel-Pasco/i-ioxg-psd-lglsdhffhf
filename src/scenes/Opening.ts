import { Scene, type GameObjects } from 'phaser';
import { DISPLAY } from '../config/display';

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
    const { width: w, height: h } = DISPLAY;
    this.cameras.main.setBackgroundColor('#000000');

    // 0: the visor, a thin cyan line in the dark.
    const visor = this.add.container(0, 0, [this.add.rectangle(w / 2, h / 2, w * 0.6, 2, 0x5ad1e6)]);

    // 1: listening, rings around the visor line.
    const rings = this.add.container(0, 0, [
      this.add.circle(w / 2, h / 2, 24).setStrokeStyle(1, 0x5ad1e6, 0.6),
      this.add.circle(w / 2, h / 2, 44).setStrokeStyle(1, 0x5ad1e6, 0.3),
    ]);

    // 2: first-person view, black sky with stars over a grey horizon.
    const stars = Array.from({ length: 24 }, (_, i) =>
      this.add.rectangle((i * 53) % w, ((i * 29) % (h * 0.5)) + 4, 1, 1, 0xdfe6f0),
    );
    const surface = this.add.container(0, 0, [
      ...stars,
      this.add.rectangle(w / 2, h * 0.8, w, h * 0.4, 0x8a8a86),
      this.add.ellipse(w * 0.3, h * 0.78, 40, 8, 0x6f6f6b),
      this.add.ellipse(w * 0.72, h * 0.88, 56, 10, 0x6f6f6b),
    ]);

    // 3: pulled back to the top-down view, the robot and the first echo.
    const echo = this.add.circle(w * 0.62, h * 0.42, 10).setStrokeStyle(1, 0x5ad1e6);
    const topDown = this.add.container(0, 0, [
      this.add.rectangle(w / 2, h / 2, w, h, 0x8a8a86),
      this.add.ellipse(w * 0.25, h * 0.7, 30, 20, 0x6f6f6b),
      this.add.rectangle(w * 0.4, h * 0.6, 5, 5, 0xf2b84b),
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
