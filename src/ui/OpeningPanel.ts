import text from '../../data/text/en.json';
import { el, fill } from './dom';
import './styles/a11y.css';

const t = text.opening;

export interface OpeningOptions {
  /** Number of echoes in the first world, counted from the data. */
  echoCount: number;
  onStep: (step: number) => void;
  onDone: () => void;
}

/**
 * Caption panel for the opening (GDD 3.3, 11.1). Every line is shown as text in a "Game story" frame.
 * The player moves on with Next, so nothing is timed, and Skip ends it at once.
 */
export class OpeningPanel {
  private readonly root = el('section', 'opening story-frame');
  private readonly line = el('p', 'opening-line');
  private readonly next = el('button', 'dialog-button opening-next', t.next);
  private readonly lines: string[];
  private step = 0;

  constructor(parent: HTMLElement, private readonly opts: OpeningOptions) {
    this.lines = t.lines.map((l) => fill(l, { count: String(opts.echoCount) }));
    this.root.setAttribute('aria-label', t.label);
    this.line.setAttribute('aria-live', 'polite');
    this.next.type = 'button';
    this.next.addEventListener('click', () => this.advance());
    const skip = el('button', 'dialog-button opening-skip', t.skip);
    skip.type = 'button';
    skip.addEventListener('click', () => this.finish());
    const actions = el('div', 'dialog-actions');
    actions.append(this.next, skip);
    this.root.append(el('span', 'story-tag', text.story.tag), this.line, actions);
    parent.append(this.root);
    this.render();
    this.next.focus();
  }

  private advance(): void {
    if (this.step >= this.lines.length - 1) return this.finish();
    this.step++;
    this.render();
  }

  private render(): void {
    this.line.textContent = this.lines[this.step];
    this.next.textContent = this.step === this.lines.length - 1 ? t.begin : t.next;
    this.opts.onStep(this.step);
  }

  private finish(): void {
    this.root.remove();
    this.opts.onDone();
  }
}
