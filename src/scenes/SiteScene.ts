import { Scene, type GameObjects, type Input } from 'phaser';
import text from '../../data/text/en.json';
import { SITE } from '../config/site';
import { Events, eventBus } from '../core/events';
import { siteLayout, type SiteLayout } from '../data/sites';
import { echoArrowAngle, echoState, type EchoState } from '../systems/echo';
import { stepMovement, type Body } from '../systems/movement';

export const SITE_SCENE_KEY = 'Site';

export interface SiteData {
  entryId: string;
  world: 'moon' | 'mars';
  recovery: 'jetpack' | 'visit';
  recovered: boolean;
  reducedMotion: boolean;
}

export interface SiteSnapshot {
  entryId: string;
  echo: EchoState;
  robot: { x: number; y: number };
  machine: { x: number; y: number; visible: boolean; archivedTag: boolean };
}

const ROBOT_TEX = 'site-robot';
const MACHINE_TEX = 'site-machine';
const C = SITE.colors;
/** Longest step a single frame may take, so a hidden tab does not make the robot jump. */
const MAX_DT = 0.1;

type Keys = Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'E' | 'M', Input.Keyboard.Key>;

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
    this.body = { ...this.layout.start, vx: 0, vy: 0 };
    this.echo = data.recovered ? 'archived' : 'unvisited';
    this.touch = { x: 0, y: 0 };
  }

  create(): void {
    this.makeTextures();
    this.add.rectangle(0, 0, SITE.width, SITE.height, SITE.ground[this.site.world]).setOrigin(0);
    for (const p of this.layout.props) {
      if (p.kind === 'crater') this.add.circle(p.x, p.y, p.r, C.crater).setStrokeStyle(2, C.rock);
      else this.add.circle(p.x, p.y, p.r, C.rock);
    }

    const m = this.layout.machine;
    this.pulse = this.add.graphics();
    // The real machine always stays in the scene, recovered or not (CLAUDE.md rule 5).
    this.machine = this.add.image(m.x, m.y, MACHINE_TEX);
    const label = { fontFamily: 'system-ui, sans-serif', fontSize: '8px', resolution: 4 };
    this.tag = this.add.text(m.x, m.y - 20, text.site.archivedTag, { ...label, color: '#ffbf5e' }).setOrigin(0.5, 1);
    this.prompt = this.add.text(m.x + 16, m.y, text.site.prompt, { ...label, color: '#4fd8ff' }).setOrigin(0, 0.5);
    this.robot = this.add.image(this.body.x, this.body.y, ROBOT_TEX);
    this.arrow = this.add.triangle(0, 0, 0, -5, 10, 0, 0, 5, C.cyan).setScrollFactor(0).setVisible(false);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, SITE.width, SITE.height);
    cam.setRoundPixels(true);
    const lerp = this.site.reducedMotion ? 1 : SITE.camera.lerp;
    cam.startFollow(this.robot, true, lerp, lerp);

    const kb = this.input.keyboard;
    if (kb) {
      this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,M') as Keys;
      this.keys.E.on('down', () => this.interact());
      this.keys.M.on('down', () => eventBus.emit(Events.SITE_LEAVE, {}));
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

    const m = this.layout.machine;
    const next = echoState(Math.hypot(this.body.x - m.x, this.body.y - m.y), this.site.recovered);
    if (next !== this.echo) this.applyEcho(next);
    this.drawPulse(time);
    this.drawArrow();
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

  /** Original placeholder pixel art: a small upright robot and a generic lander shape. */
  private makeTextures(): void {
    if (!this.textures.exists(ROBOT_TEX)) {
      const g = this.make.graphics({}, false);
      g.fillStyle(C.robot).fillRect(3, 0, 6, 5).fillRect(1, 5, 10, 7).fillStyle(C.cyan).fillRect(4, 2, 4, 1);
      g.fillStyle(C.rock).fillRect(1, 12, 3, 2).fillRect(8, 12, 3, 2);
      g.generateTexture(ROBOT_TEX, 12, 14);
      g.destroy();
    }
    if (!this.textures.exists(MACHINE_TEX)) {
      const g = this.make.graphics({}, false);
      g.fillStyle(C.machine).fillRect(5, 3, 14, 9).fillStyle(C.amber).fillRect(8, 0, 8, 3);
      g.lineStyle(2, C.machine).lineBetween(6, 12, 1, 20).lineBetween(18, 12, 23, 20).lineBetween(12, 12, 12, 20);
      g.generateTexture(MACHINE_TEX, 24, 21);
      g.destroy();
    }
  }

  private cleanup(): void {
    for (const off of this.offs) off();
    this.offs = [];
    // Release key capture so arrow keys and WASD work in the hub's DOM again.
    this.input.keyboard?.removeAllKeys(true, true);
    this.keys = null;
  }
}
