import text from '../../data/text/en.json';
import { el } from '../ui/dom';
import '../ui/styles/a11y.css';

const t = text.captions;

/**
 * Procedural Web Audio API synthesizer (GDD 11.4).
 * Completely zero-dependency: no audio files or external network requests.
 * Audio is off by default until the player turns it on in Settings.
 * Captions provide a visual equivalent for all sound cues.
 */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private audioEnabled = false;
  private captionsEnabled = true;

  // Thruster loop nodes
  private thrustGain: GainNode | null = null;
  private thrustOsc: OscillatorNode | null = null;
  private isThrusting = false;

  // Caption element
  private readonly captionEl: HTMLElement | null = null;
  private captionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(parent?: HTMLElement) {
    if (typeof document !== 'undefined') {
      const p = parent ?? document.body;
      this.captionEl = el('div', 'audio-caption');
      this.captionEl.setAttribute('role', 'status');
      this.captionEl.setAttribute('aria-live', 'polite');
      this.captionEl.hidden = true;
      p.append(this.captionEl);
    }
  }

  get captionElement(): HTMLElement | null {
    return this.captionEl;
  }

  updateSettings(settings: { audio: boolean; captions: boolean }): void {
    this.audioEnabled = settings.audio;
    this.captionsEnabled = settings.captions;
    if (!this.audioEnabled) {
      this.stopThrust();
    }
  }

  private getContext(): AudioContext | null {
    if (!this.audioEnabled) return null;
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  showCaption(captionText: string): void {
    if (!this.captionEl) return;
    if (!this.captionsEnabled) {
      this.captionEl.hidden = true;
      return;
    }
    this.captionEl.textContent = `[ ${captionText} ]`;
    this.captionEl.hidden = false;

    if (this.captionTimer !== null) {
      clearTimeout(this.captionTimer);
    }
    this.captionTimer = setTimeout(() => {
      if (this.captionEl) this.captionEl.hidden = true;
      this.captionTimer = null;
    }, 1800);
  }

  /** Opening sequence power-on hum (GDD 3.3). */
  openingBoot(): void {
    this.showCaption(t.opening);
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /** Echo pulse: soft sine frequency sweep. */
  echoNear(): void {
    this.showCaption(t.echoNear);
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.12);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  private playNotes(notes: readonly number[], stepSec: number, durationSec: number, peakGain: number): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * stepSec;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(peakGain, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + durationSec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + durationSec);
    });
  }

  /** Echo ready: dual harmonic chime indicating the target is found. */
  echoReady(): void {
    this.showCaption(t.echoReady);
    this.playNotes([587.33, 880], 0, 0.25, 0.09);
  }

  /** Starts the thruster drone loop. */
  startThrust(): void {
    if (this.isThrusting) return;
    this.isThrusting = true;
    this.showCaption(t.thrust);

    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(65, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    this.thrustOsc = osc;
    this.thrustGain = gain;
  }

  /** Stops the thruster drone loop. */
  stopThrust(): void {
    if (!this.isThrusting) return;
    this.isThrusting = false;

    if (this.thrustGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.thrustGain.gain.cancelScheduledValues(now);
      this.thrustGain.gain.setValueAtTime(this.thrustGain.gain.value, now);
      this.thrustGain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      const osc = this.thrustOsc;
      setTimeout(() => {
        try {
          osc?.stop();
          osc?.disconnect();
        } catch {
          // Ignore if already stopped
        }
      }, 60);
    }
    this.thrustOsc = null;
    this.thrustGain = null;
  }

  /** Soft safe landing chime: ascending major chord. */
  landed(): void {
    this.stopThrust();
    this.showCaption(t.landed);
    this.playNotes([523.25, 659.25, 783.99], 0.08, 0.35, 0.1);
  }

  /** Crash or hard impact thump. */
  crash(): void {
    this.stopThrust();
    this.showCaption(t.crash);
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  /** Archive record restored celebration chime. */
  recovered(): void {
    this.stopThrust();
    this.showCaption(t.recovered);
    this.playNotes([440, 554.37, 659.25, 880], 0.09, 0.4, 0.09);
  }

  /** Stops any ongoing audio when leaving scenes or opening overlays. */
  stopAll(): void {
    this.stopThrust();
  }
}
