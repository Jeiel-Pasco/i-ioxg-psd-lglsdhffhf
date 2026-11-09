import { Scene, type GameObjects, type Input } from 'phaser';
import text from '../../data/text/en.json';
import { SITE } from '../config/site';
import { Events, eventBus } from '../core/events';
import { siteLayout, type SiteLayout } from '../data/sites';
import { echoArrowAngle, echoState, type EchoState } from '../systems/echo';
import { stepMovement, type Body } from '../systems/movement';
import {
  PROP_CRATER_TEX,
  PROP_ROCK_TEX,
  ROBOT_SITE_FRAMES,
  ROBOT_SITE_TEX,
  ensureEntityTextures,
  groundTileTextureKey,
  machineTextureKey,
} from '../sprites/pixelRenderer';

export const SITE_SCENE_KEY = 'Site';

export interface SiteData {
  entryId: string;
  world: 'moon' | 'mars';
  recovery: 'jetpack' | 'visit';
  recovered: boolean;
  reducedMotion: boolean;
  reducedEffects?: boolean;
  /** Start beside the machine (coming back from a landing) instead of at the layout start. */
  atMachine?: boolean;
}

/** How far left of the machine (px) the robot stands when it comes back from a landing; inside the ready radius. */
const BESIDE_MACHINE_PX = 20;

export interface SiteSnapshot {
  entryId: string;
  echo: EchoState;
  robot: { x: number; y: number };
  machine: { x: number; y: number; visible: boolean; archivedTag: boolean };
}

const C = SITE.colors;
/** Longest step a single frame may take, so a hidden tab does not make the robot jump. */
const MAX_DT = 0.1;

type Keys = Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'E' | 'M' | 'I', Input.Keyboard.Key>;

/** Top-down site scene (GDD 5.1, 6.3, 6.4). One shared template per world plus the entry's layout. */
export class SiteScene extends Scene {
  private site: SiteData;
  private layout: SiteLayout;
  private body: Body;
  private echo: EchoState;
  private touch = { x: 0, y: 0 };
  private keys: Keys | null = null;
  private robot: GameObjects.Image;
  private machine: GameObjects.Image;
  private groundTile: GameObjects.TileSprite;
  private pulse: GameObjects.Graphics;
  private arrow: GameObjects.Triangle;
  private prompt: GameObjects.Text;
  private tag: GameObjects.Text;
  private offs: (() => void)[] = [];

  constructor() {
    super(SITE_SCENE_KEY);
  }

  init(data: SiteData): void {
    this.site = data;
    this.layout = siteLayout(data.entryId);
    const m = this.layout.machine;
    const start = data.atMachine ? { x: m.x - BESIDE_MACHINE_PX, y: m.y } : this.layout.start;
    this.body = { ...start, vx: 0, vy: 0 };
    this.echo = echoState(Math.hypot(this.body.x - m.x, this.body.y - m.y), data.recovered);
    this.touch = { x: 0, y: 0 };
  }

  create(): void {
    ensureEntityTextures(this);
    this.add.rectangle(0, 0, SITE.width, SITE.height, SITE.ground[this.site.world]).setOrigin(0);
    this.groundTile = this.add
      .tileSprite(0, 0, SITE.width, SITE.height, groundTileTextureKey(this.site.world))
      .setOrigin(0)
      .setVisible(!this.site.reducedEffects);

    for (const p of this.layout.props) {
      if (p.kind === 'crater') {
        this.add.image(p.x, p.y, PROP_CRATER_TEX).setScale(Math.max(0.75, p.r / 8));
      } else {
        this.add.image(p.x, p.y, PROP_ROCK_TEX).setScale(Math.max(0.75, p.r / 5));
      }
    }

    const m = this.layout.machine;
    this.pulse = this.add.graphics();
    // The real machine always stays in the scene, recovered or not (CLAUDE.md rule 5).
    this.machine = this.add.image(m.x, m.y, machineTextureKey(this.site.entryId));
    const label = { fontFamily: 'system-ui, sans-serif', fontSize: '8px', resolution: 4 };
    this.tag = this.add.text(m.x, m.y - 20, text.site.archivedTag, { ...label, color: '#ffbf5e' }).setOrigin(0.5, 1);
    this.prompt = this.add.text(m.x + 16, m.y, text.site.prompt, { ...label, color: '#4fd8ff' }).setOrigin(0, 0.5);
    this.robot = this.add.image(this.body.x, this.body.y, ROBOT_SITE_TEX);
    this.arrow = this.add.triangle(0, 0, 0, -5, 10, 0, 0, 5, C.cyan).setScrollFactor(0).setVisible(false);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, SITE.width, SITE.height);
    cam.setRoundPixels(true);
    const lerp = this.site.reducedMotion ? 1 : SITE.camera.lerp;
    cam.startFollow(this.robot, true, lerp, lerp);

    const kb = this.input.keyboard;
    if (kb) {
      this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,M,I') as Keys;
      this.keys.E.on('down', () => this.interact());
      this.keys.M.on('down', () => eventBus.emit(Events.SITE_LEAVE, {}));
      this.keys.I.on('down', () => eventBus.emit(Events.SITE_ARCHIVE, {}));
    }
    this.offs = [
      eventBus.on(Events.SITE_MOVE, (v) => (this.touch = v)),
      eventBus.on(Events.SITE_INTERACT, () => this.interact()),
      eventBus.on(Events.ENTRY_RECOVERED, ({ entryId }) => {
        if (entryId === this.site.entryId) this.setRecovered();
      }),
    ];
    this.events.once('shutdown', () => this.cleanup());

    this.applyEcho(this.echo);
    this.game.canvas.parentElement?.setAttribute('data-scene', SITE_SCENE_KEY);
  }

  update(time: number, delta: number): void {
    const dt = Math.min(delta / 1000, MAX_DT);
    this.body = stepMovement(this.body, this.readInput(), dt, SITE);
    this.robot.setPosition(Math.round(this.body.x), Math.round(this.body.y));
    const moving = !this.site.reducedMotion && Math.hypot(this.body.vx, this.body.vy) > 4;
    const frameKey = moving ? ROBOT_SITE_FRAMES[Math.floor(time / 140) % ROBOT_SITE_FRAMES.length] : ROBOT_SITE_TEX;
    if (this.robot.texture.key !== frameKey) this.robot.setTexture(frameKey);

    const m = this.layout.machine;
    const next = echoState(Math.hypot(this.body.x - m.x, this.body.y - m.y), this.site.recovered);
    if (next !== this.echo) this.applyEcho(next);
    this.drawPulse(time);
    this.drawArrow();
  }

  /** Applies a settings change while the scene runs: no camera easing and a steady echo ring. */
  setReducedMotion(on: boolean): void {
    this.site.reducedMotion = on;
    const lerp = on ? 1 : SITE.camera.lerp;
    this.cameras.main.setLerp(lerp, lerp);
  }

  /** Toggles decorative surface regolith tiles while the scene runs. */
  setReducedEffects(on: boolean): void {
    this.site.reducedEffects = on;
    this.groundTile?.setVisible(!on);
  }

  snapshot(): SiteSnapshot {
    const m = this.layout.machine;
    return {
      entryId: this.site.entryId,
      echo: this.echo,
      robot: { x: this.body.x, y: this.body.y },
      machine: { x: m.x, y: m.y, visible: this.machine.active && this.machine.visible, archivedTag: this.tag.visible },
    };
  }

  private readInput(): { x: number; y: number } {
    const k = this.keys;
    const kx = k ? Number(k.RIGHT.isDown || k.D.isDown) - Number(k.LEFT.isDown || k.A.isDown) : 0;
    const ky = k ? Number(k.DOWN.isDown || k.S.isDown) - Number(k.UP.isDown || k.W.isDown) : 0;
    return kx || ky ? { x: kx, y: ky } : this.touch;
  }

  private interact(): void {
    if (this.echo !== 'ready') return;
    if (this.site.recovery === 'visit') {
      eventBus.emit(Events.ENTRY_RECOVERED, { entryId: this.site.entryId, assisted: false });
      this.setRecovered();
    } else {
      eventBus.emit(Events.SITE_LAND, { entryId: this.site.entryId });
    }
  }

  private setRecovered(): void {
    this.site = { ...this.site, recovered: true };
    this.applyEcho('archived');
  }

  private applyEcho(state: EchoState): void {
    this.echo = state;
    this.prompt.setVisible(state === 'ready');
    this.tag.setVisible(state === 'archived');
    eventBus.emit(Events.SITE_ECHO, { state });
  }

  private drawPulse(time: number): void {
    const m = this.layout.machine;
    this.pulse.clear();
    if (this.echo === 'archived') return;
    const period = this.echo === 'unvisited' ? SITE.echo.pulseFarMs : SITE.echo.pulseNearMs;
    // Reduced motion keeps a steady ring instead of a growing one.
    const phase = this.site.reducedMotion ? 0.5 : (time % period) / period;
    this.pulse.lineStyle(1, C.cyan, 1 - phase);
    this.pulse.strokeCircle(m.x, m.y, 12 + phase * 24);
  }

  private drawArrow(): void {
    const v = this.cameras.main.worldView;
    const angle = this.echo === 'near' ? echoArrowAngle(this.layout.machine, v) : null;
    this.arrow.setVisible(angle !== null);
    if (angle === null) return;
    const hw = v.width / 2 - 10;
    const hh = v.height / 2 - 10;
    const s = Math.min(hw / Math.abs(Math.cos(angle) || 1e-6), hh / Math.abs(Math.sin(angle) || 1e-6));
    this.arrow.setPosition(v.width / 2 + Math.cos(angle) * s, v.height / 2 + Math.sin(angle) * s).setRotation(angle);
  }

  private cleanup(): void {
    for (const off of this.offs) off();
    this.offs = [];
    // Release key capture so arrow keys and WASD work in the hub's DOM again.
    this.input.keyboard?.removeAllKeys(true, true);
    this.keys = null;
  }
}
