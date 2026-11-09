import type { Settings } from '../../save/migrate';
import '../styles/a11y.css';

/** Puts the display settings on <html> so every DOM layer picks them up through a11y.css. */
export function applySettings(s: Readonly<Settings>, root: HTMLElement = document.documentElement): void {
  root.style.setProperty('--text-scale', String(s.textScale));
  root.dataset.contrast = s.highContrast ? 'high' : 'normal';
  root.dataset.motion = s.reducedMotion ? 'reduced' : 'full';
  root.dataset.effects = s.reducedEffects ? 'reduced' : 'full';
}
