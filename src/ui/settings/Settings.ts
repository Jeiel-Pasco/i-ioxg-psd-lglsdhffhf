import text from '../../../data/text/en.json';
import type { Settings as SettingsData } from '../../save/migrate';
import { el } from '../dom';
import '../styles/a11y.css';

const t = text.settings;

export interface SettingsOptions {
  get: () => Readonly<SettingsData>;
  update: (patch: Partial<SettingsData>) => void;
  /** Opens the About screen; the Settings dialog closes first. */
  onAbout: (opener: HTMLElement | null) => void;
  /** Called after the dialog opens or closes. */
  onOpenChange: () => void;
}

type Toggle = 'highContrast' | 'reducedMotion' | 'reducedEffects' | 'audio' | 'captions' | 'alwaysOfferSkip';

/** Settings (GDD 11.1, 11.4): text size, contrast, motion, effects, audio and captions. Each change saves at once. */
export class SettingsMenu {
  private readonly dialog = el('dialog', 'settings');
  private readonly size = el('select', 'settings-text-size');
  private readonly toggles = new Map<Toggle, HTMLInputElement>();
  private readonly paused = el('p', 'settings-paused', t.paused);
  private opener: HTMLElement | null = null;

  constructor(private readonly opts: SettingsOptions) {
    this.dialog.setAttribute('aria-labelledby', 'settings-title');
    const title = el('h1', '', t.title);
    title.id = 'settings-title';
    const close = el('button', 'dialog-button settings-close', t.close);
    close.type = 'button';
    close.addEventListener('click', () => {
      this.dialog.close();
      this.opts.onOpenChange();
    });
    const head = el('header', 'dialog-head');
    head.append(title, close);

    for (const { value, label } of t.textSizes) {
      const o = el('option', '', label);
      o.value = value;
      this.size.append(o);
    }
    this.size.addEventListener('change', () => this.opts.update({ textScale: Number(this.size.value) }));
    const sizeRow = el('label', 'settings-row');
    sizeRow.append(el('span', '', t.textSize), this.size);

    const rows: [Toggle, string, string][] = [
      ['highContrast', 'settings-contrast', t.highContrast],
      ['reducedMotion', 'settings-motion', t.reducedMotion],
      ['reducedEffects', 'settings-effects', t.reducedEffects],
      ['audio', 'settings-audio', t.audio],
      ['captions', 'settings-captions', t.captions],
      ['alwaysOfferSkip', 'settings-skip', t.alwaysOfferSkip],
    ];
    const toggleRows = rows.map(([key, className, label]) => {
      const box = el('input', className);
      box.type = 'checkbox';
      box.addEventListener('change', () => this.opts.update({ [key]: box.checked }));
      this.toggles.set(key, box);
      const row = el('label', 'settings-row');
      row.append(box, el('span', '', label));
      return row;
    });

    const about = el('button', 'dialog-button settings-about', t.about);
    about.type = 'button';
    about.addEventListener('click', () => {
      const opener = this.opener;
      this.dialog.close();
      this.opts.onAbout(opener);
    });
    const actions = el('div', 'dialog-actions');
    actions.append(about);

    this.paused.hidden = true;
    this.dialog.append(head, this.paused, sizeRow, ...toggleRows, actions);
    this.dialog.addEventListener('close', () => {
      // Focus goes back to whatever opened the menu, if it is still on screen.
      if (this.opener?.isConnected && this.opener.offsetParent !== null) this.opener.focus();
      this.opts.onOpenChange();
    });
    document.body.append(this.dialog);
  }

  get isOpen(): boolean {
    return this.dialog.open;
  }

  /** `paused` shows a line saying the game waits while the menu is open. */
  open(opener: HTMLElement | null, paused = false): void {
    if (this.dialog.open) return;
    this.opener = opener;
    const s = this.opts.get();
    this.size.value = String(s.textScale);
    if (this.size.selectedIndex < 0) this.size.selectedIndex = 0;
    for (const [key, box] of this.toggles) box.checked = s[key];
    this.paused.hidden = !paused;
    this.dialog.showModal();
    this.opts.onOpenChange();
  }
}
