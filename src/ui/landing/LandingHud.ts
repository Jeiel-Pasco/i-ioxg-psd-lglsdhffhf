import text from '../../../data/text/en.json';
import { Events, eventBus } from '../../core/events';
import type { ResolvedLevel } from '../../systems/level';
import type { Outcome } from '../../systems/outcome';
import type { Input } from '../../systems/physics';
import { el, fill } from '../dom';
import '../styles/landing.css';

const t = text.landing;

export interface LandingActions {
  retry(): void;
  back(): void;
  assist(): void;
  skip(): void;
  /** Entry reveal after a safe landing. */
  read(opener: HTMLElement): void;
  settings(opener: HTMLElement): void;
}

/** A button that counts as held while a finger, pen or mouse is down on it. Each button tracks its own pointer. */
function holdButton(className: string, label: string, onChange: (held: boolean) => void): HTMLButtonElement {
  const b = el('button', `landing-hold ${className}`, label);
  b.type = 'button';
  const set = (held: boolean) => {
    b.dataset.held = String(held);
    onChange(held);
  };
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    b.setPointerCapture?.(e.pointerId);
    set(true);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) b.addEventListener(type, () => set(false));
  b.addEventListener('contextmenu', (e) => e.preventDefault());
  return b;
}

/** DOM layer over the landing scene: level info, meters, hold buttons and the result panel (GDD 7.2, 7.6). */
export class LandingHud {
  private readonly root = el('div', 'landing-ui');
  private readonly info = el('p', 'landing-info');
  private readonly fuel = el('p', 'landing-meter');
  private readonly down = el('p', 'landing-meter');
  private readonly side = el('p', 'landing-meter');
  private readonly result = el('section', 'landing-result');
  private readonly message = el('p', 'landing-message');
  private readonly hint = el('p', 'landing-hint', t.assistHint);
  private readonly retryBtn = this.action('landing-retry', t.retry, () => this.actions.retry());
  private readonly backBtn = this.action('landing-back', t.back, () => this.actions.back());
  private readonly assistBtn = this.action('landing-assist', t.assist, () => this.actions.assist());
  private readonly skipBtn = this.action('landing-skip', t.skip, () => this.actions.skip());
  private readonly readBtn: HTMLButtonElement = this.action('landing-read', t.read, () => this.actions.read(this.readBtn));
  private readonly held = { left: false, right: false, thrust: false };
  private readonly holds: HTMLButtonElement[];
  private level: ResolvedLevel | null = null;
  private lastResult: { outcome: Outcome; offerHelp: boolean; assisted: boolean } | null = null;

  constructor(
    parent: HTMLElement,
    private readonly actions: LandingActions,
  ) {
    const top = el('div', 'landing-top');
    const meters = el('div', 'landing-meters');
    meters.append(this.fuel, this.down, this.side);
    // GDD 9.1: pause and settings top left.
    const settings = this.action('landing-settings', text.settings.open, () => this.actions.settings(settings));
    top.append(settings, this.info, meters, el('p', 'landing-help', t.help));

    const controls = el('div', 'landing-controls');
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', t.controls);
    const steer = el('div', 'landing-steer');
    const left = holdButton('landing-left', t.left, (h) => this.hold('left', h));
    const right = holdButton('landing-right', t.right, (h) => this.hold('right', h));
    const thrust = holdButton('landing-thrust', t.thrust, (h) => this.hold('thrust', h));
    this.holds = [left, right, thrust];
    steer.append(left, right);
    controls.append(steer, thrust);

    this.result.setAttribute('role', 'status');
    this.result.setAttribute('aria-label', t.title);
    const buttons = el('div', 'landing-actions');
    buttons.append(this.readBtn, this.retryBtn, this.backBtn, this.assistBtn, this.skipBtn);
    this.result.append(this.message, this.hint, buttons);
    this.result.hidden = true;

    this.root.append(top, controls, this.result);
    this.root.hidden = true;
    parent.append(this.root);

    eventBus.on(Events.LANDING_TICK, (m) => this.meters(m.fuel, m.fuelMax, m.vx, m.vy));
  }

  show(level: ResolvedLevel): void {
    this.level = level;
    const word = t.difficulty[level.difficulty];
    const startDrift =
      level.difficulty === 'hard' && level.start.vx !== 0
        ? ` · ${fill(t.startSpeed, { vx: Math.abs(level.start.vx).toFixed(1) })}`
        : '';
    this.info.textContent =
      fill(t.difficultyLabel, { difficulty: word }) + startDrift + (level.assisted ? ` · ${t.assisted}` : '');
    this.root.dataset.difficulty = level.difficulty;
    this.lastResult = null;
    this.result.hidden = true;
    this.meters(level.fuel, level.fuel, level.start.vx, level.start.vy);
    this.root.hidden = false;
  }

  hide(): void {
    this.lastResult = null;
    this.root.hidden = true;
    this.result.hidden = true;
    this.releaseAll();
  }

  /** Shows the end of a run. Assist appears after enough failures in a row; Skip also shows when enabled in Settings. */
  showResult(outcome: Outcome, opts: { offerHelp: boolean; offerSkip?: boolean; assisted: boolean }): void {
    this.releaseAll();
    this.lastResult = { outcome, offerHelp: opts.offerHelp, assisted: opts.assisted };
    const landed = outcome === 'landed';
    this.message.textContent = t.result[outcome];
    this.root.dataset.outcome = outcome;
    this.retryBtn.hidden = landed;
    this.readBtn.hidden = !landed;
    this.assistBtn.hidden = landed || !opts.offerHelp || opts.assisted;
    this.hint.hidden = this.assistBtn.hidden;
    this.skipBtn.hidden = landed || !(opts.offerHelp || opts.offerSkip);
    this.result.hidden = false;
    (landed ? this.readBtn : this.retryBtn).focus();
  }

  /** Updates Skip button visibility if the player toggles `alwaysOfferSkip` while the result panel is open. */
  refreshSkip(alwaysOfferSkip: boolean): void {
    if (!this.lastResult || this.result.hidden) return;
    const landed = this.lastResult.outcome === 'landed';
    this.skipBtn.hidden = landed || !(this.lastResult.offerHelp || alwaysOfferSkip);
  }

  private meters(fuel: number, fuelMax: number, vx: number, vy: number): void {
    const l = this.level;
    if (!l) return;
    const percent = fuelMax > 0 && Number.isFinite(fuelMax) ? Math.round((fuel / fuelMax) * 100) : 0;
    this.fuel.textContent = fill(t.fuel, { percent: String(percent) });
    const downSpeed = Math.max(0, vy);
    const sideSpeed = Math.abs(vx);
    const over = (speed: number, safe: number) => (speed > safe ? ` ${t.tooFast}` : '');
    // Too fast is said in words (and bold), not by colour alone.
    this.down.textContent =
      fill(t.speedDown, { speed: downSpeed.toFixed(1), safe: l.safeVertical.toFixed(1) }) + over(downSpeed, l.safeVertical);
    this.side.textContent =
      fill(t.speedSide, { speed: sideSpeed.toFixed(1), safe: l.safeSideways.toFixed(1) }) + over(sideSpeed, l.safeSideways);
    this.down.dataset.over = String(downSpeed > l.safeVertical);
    this.side.dataset.over = String(sideSpeed > l.safeSideways);
  }

  private hold(key: keyof LandingHud['held'], on: boolean): void {
    if (this.held[key] === on) return;
    this.held[key] = on;
    const input: Input = {
      thrust: this.held.thrust ? 1 : 0,
      steer: (Number(this.held.right) - Number(this.held.left)) as Input['steer'],
    };
    eventBus.emit(Events.LANDING_INPUT, input);
  }

  /** Lets go of every hold button, for example when the game pauses. */
  releaseAll(): void {
    for (const b of this.holds) b.dataset.held = 'false';
    this.hold('left', false);
    this.hold('right', false);
    this.hold('thrust', false);
  }

  private action(className: string, label: string, onClick: () => void): HTMLButtonElement {
    const b = el('button', `landing-action ${className}`, label);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }
}
