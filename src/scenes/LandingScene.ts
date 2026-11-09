import { Scene, type GameObjects, type Input as PhaserInput } from 'phaser';
import { LANDING } from '../config/landing';
import { SITE } from '../config/site';
import { Events, eventBus } from '../core/events';
import type { ResolvedLevel } from '../systems/level';
import { landingOutcome, type Outcome } from '../systems/outcome';
import { stepPhysics, type Input, type LanderState } from '../systems/physics';
import { startState } from '../systems/solver';
import { FixedStepper } from '../systems/stepper';
import { ROBOT_LANDING_TEX, ensureEntityTextures, machineTextureKey } from '../sprites/pixelRenderer';

export const LANDING_SCENE_KEY = 'Landing';

export interface LandingData {
  entryId: string;
  level: ResolvedLevel;
  reducedMotion: boolean;
  reducedEffects?: boolean;
}

export interface LandingSnapshot {
  entryId: string;
  outcome: Outcome | null;
  input: Input;
  assisted: boolean;
  fuel: number;
  platformWidth: number;
}

const PX = LANDING.pxPerMetre;
const C = SITE.colors;
const NONE: Input = { thrust: 0, steer: 0 };
/** Meters in the DOM update every this many physics steps (about 10 times a second). */
const TICK_EVERY = 6;

type Keys = Record<'SPACE' | 'UP' | 'W' | 'A' | 'D' | 'LEFT' | 'RIGHT', PhaserInput.Keyboard.Key>;

/** Side-view jetpack landing (GDD 7). Physics runs in fixed steps, apart from rendering. */
export class LandingScene extends Scene {
  private data_: LandingData;
  private state: LanderState;
  private stepper = new FixedStepper();
  private outcome: Outcome | null = null;
  private input_: Input = NONE;
  private touch: Input = NONE;
  private script: readonly Input[] | null = null;
  private scriptIndex = 0;
  private steps = 0;
  private keys: Keys | null = null;
  private robot: GameObjects.Image;
  private flame: GameObjects.Triangle;
  private puff: GameObjects.Rectangle;
  private skyDecor: GameObjects.Graphics;
  private offs: (() => void)[] = [];
  private wasThrusting = false;

  constructor() {
    super(LANDING_SCENE_KEY);
  }

  init(data: LandingData): void {
    this.data_ = data;
    this.touch = NONE;
    this.reset(null);
  }

  create(): void {
    const level = this.data_.level;
    ensureEntityTextures(this);
    const wPx = LANDING.widthM * PX;
    const hPx = LANDING.heightM * PX;
    const ground = level.groundM * PX;

    // Sky stars and distant horizon ridge (GDD 4.2), hidden when reducedEffects is enabled.
    this.skyDecor = this.add.graphics();
    const starColor = level.world === 'mars' ? 0xffd2a6 : 0xe8edf5;
    this.skyDecor.fillStyle(starColor, level.world === 'mars' ? 0.55 : 0.85);
    for (let i = 0; i < 28; i++) {
      const sx = (i * 67 + 19) % wPx;
      const sy = (i * 31 + 7) % Math.max(16, ground - 24);
      this.skyDecor.fillRect(sx, sy, 1, 1);
    }
    const ridgeColor = level.world === 'mars' ? 0x4b2013 : 0x252830;
    this.skyDecor.fillStyle(ridgeColor, 1);
    this.skyDecor.fillTriangle(0, ground, 56, ground - 18, 128, ground);
    this.skyDecor.fillTriangle(96, ground, 176, ground - 24, 256, ground);
    this.skyDecor.fillTriangle(216, ground, 276, ground - 15, wPx, ground);
    this.skyDecor.setVisible(!this.data_.reducedEffects);

    this.add.rectangle(0, ground, wPx, hPx - ground, SITE.ground[level.world]).setOrigin(0);
    this.drawPlatform();
    // The real machine stays in the scene beside the pad (CLAUDE.md rule 5).
    const mx = (level.platform.x + level.platform.width / 2 + 2.5) * PX;
    this.add.image(mx, ground, machineTextureKey(this.data_.entryId)).setOrigin(0.5, 1);

    this.flame = this.add.triangle(0, 0, -3, 0, 3, 0, 0, 6, C.amber).setOrigin(0.5, 0).setVisible(false);
    this.puff = this.add.rectangle(0, 0, 3, 2, C.cyan).setVisible(false);
    this.robot = this.add.image(0, 0, ROBOT_LANDING_TEX).setOrigin(0.5, 1);
    this.cameras.main.setRoundPixels(true);

    const kb = this.input.keyboard;
    if (kb) this.keys = kb.addKeys('SPACE,UP,W,A,D,LEFT,RIGHT') as Keys;
    this.offs = [eventBus.on(Events.LANDING_INPUT, (v) => (this.touch = v))];
    this.events.once('shutdown', () => this.cleanup());
    this.draw();
    this.game.canvas.parentElement?.setAttribute('data-scene', LANDING_SCENE_KEY);
  }

  update(_time: number, delta: number): void {
    if (!this.script) this.input_ = this.readInput();
    if (this.outcome) return;
    this.stepper.advance(delta / 1000, () => this.step());
    this.draw();
  }

  /** Test hook: replay a fixed route from the start instead of reading the buttons. */
  useScript(route: readonly Input[]): void {
    this.reset(route);
  }

  /** Applies a settings change while the scene runs. */
  setReducedMotion(on: boolean): void {
    this.data_.reducedMotion = on;
  }

  /** Toggles decorative sky stars and horizon ridges while the scene runs. */
  setReducedEffects(on: boolean): void {
    this.data_.reducedEffects = on;
    this.skyDecor?.setVisible(!on);
  }

  level(): ResolvedLevel {
    return this.data_.level;
  }

  snapshot(): LandingSnapshot {
    return {
      entryId: this.data_.entryId,
      outcome: this.outcome,
      input: this.input_,
      assisted: this.data_.level.assisted,
      fuel: this.state.fuel,
      platformWidth: this.data_.level.platform.width,
    };
  }

  private reset(script: readonly Input[] | null): void {
    if (this.wasThrusting) {
      this.wasThrusting = false;
      eventBus.emit(Events.LANDING_THRUST, { thrusting: false });
    }
    this.state = startState(this.data_.level);
    this.stepper = new FixedStepper();
    this.outcome = null;
    this.script = script;
    this.scriptIndex = 0;
    this.steps = 0;
    this.input_ = NONE;
  }

  /** One fixed physics step; returns true when the run is over. */
  private step(): boolean {
    if (this.script) this.input_ = this.script[this.scriptIndex++] ?? NONE;
    const level = this.data_.level;
    this.state = stepPhysics(this.state, this.input_, level.params, this.stepper.dt);
    this.steps++;
    this.outcome = landingOutcome(this.state, level);
    if (this.steps % TICK_EVERY === 0 || this.outcome) {
      const s = this.state;
      eventBus.emit(Events.LANDING_TICK, { fuel: s.fuel, fuelMax: level.fuel, vx: s.vx, vy: s.vy });
    }
    if (!this.outcome) return false;
    // Rest on the ground so the robot never draws below it.
    this.state = { ...this.state, y: Math.min(this.state.y, level.groundM) };
    // Let Space and arrow keys reach the DOM result buttons again.
    this.input.keyboard?.removeAllKeys(true, true);
    this.keys = null;
    eventBus.emit(Events.LANDING_RESULT, { entryId: this.data_.entryId, outcome: this.outcome });
    return true;
  }

  private readInput(): Input {
    const k = this.keys;
    const thrust = k ? k.SPACE.isDown || k.UP.isDown || k.W.isDown : false;
    const steer = k ? Number(k.RIGHT.isDown || k.D.isDown) - Number(k.LEFT.isDown || k.A.isDown) : 0;
    return {
      thrust: thrust || this.touch.thrust === 1 ? 1 : 0,
      steer: (steer !== 0 ? steer : this.touch.steer) as Input['steer'],
    };
  }

  private draw(): void {
    const s = this.state;
    const x = Math.round(s.x * PX);
    const y = Math.round(s.y * PX);
    this.robot.setPosition(x, y);
    const flying = !this.outcome && s.fuel > 0;
    const thrusting = flying && this.input_.thrust === 1;
    if (thrusting !== this.wasThrusting) {
      this.wasThrusting = thrusting;
      eventBus.emit(Events.LANDING_THRUST, { thrusting });
    }
    this.flame.setPosition(x, y).setVisible(thrusting);
    this.puff.setPosition(x - this.input_.steer * 8, y - 8).setVisible(flying && this.input_.steer !== 0);
    // A failed run tips the robot over a little: short and not punishing (GDD 7.6). No motion if reduced.
    const tipped = this.outcome && this.outcome !== 'landed' && !this.data_.reducedMotion;
    this.robot.setAngle(tipped ? 20 : 0);
  }

  /** The landing pad: amber with dark stripes and two posts, so it does not rely on colour alone. */
  private drawPlatform(): void {
    const p = this.data_.level.platform;
    const g = this.add.graphics();
    const left = (p.x - p.width / 2) * PX;
    const w = p.width * PX;
    const top = this.data_.level.groundM * PX;
    g.fillStyle(C.amber).fillRect(left, top, w, 3);
    g.fillStyle(0x1a1a1a);
    for (let sx = left + 2; sx < left + w - 2; sx += 6) g.fillRect(sx, top, 3, 3);
    g.fillStyle(C.amber).fillRect(left, top - 6, 1, 6).fillRect(left + w - 1, top - 6, 1, 6);
  }

  private cleanup(): void {
    if (this.wasThrusting) {
      this.wasThrusting = false;
      eventBus.emit(Events.LANDING_THRUST, { thrusting: false });
    }
    for (const off of this.offs) off();
    this.offs = [];
    this.input.keyboard?.removeAllKeys(true, true);
    this.keys = null;
  }
}
