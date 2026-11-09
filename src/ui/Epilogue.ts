import text from '../../data/text/en.json';
import type { EpilogueSummary } from '../systems/epilogue';
import { el, fill } from './dom';
import './styles/a11y.css';

const t = text.epilogue;

/** Epilogue (GDD 3.5, 10.1): sums up the recovered and read entries and their statuses. */
export class Epilogue {
  private readonly dialog = el('dialog', 'epilogue');
  private readonly body = el('div', 'epilogue-body');
  private opener: HTMLElement | null = null;

  constructor(private readonly onOpenChange: () => void) {
    this.dialog.setAttribute('aria-labelledby', 'epilogue-title');
    const title = el('h1', '', t.title);
    title.id = 'epilogue-title';
    const close = el('button', 'dialog-button epilogue-close', t.close);
    close.type = 'button';
    close.addEventListener('click', () => this.dialog.close());
    const head = el('header', 'dialog-head');
    head.append(title, close);
    this.dialog.append(head, this.body);
    this.dialog.addEventListener('close', () => {
      if (this.opener?.isConnected && this.opener.offsetParent !== null) this.opener.focus();
      this.onOpenChange();
    });
    document.body.append(this.dialog);
  }

  get isOpen(): boolean {
    return this.dialog.open;
  }

  open(summary: EpilogueSummary, opener: HTMLElement | null): void {
    if (this.dialog.open) return;
    this.opener = opener;
    const total = String(summary.total);
    // Counts and statuses come from the Archive, so they sit in the amber record frame.
    const record = el('div', 'record-frame');
    const list = el('ul', 'epilogue-statuses');
    for (const s of summary.statuses) {
      const label = s.status === 'TODO' ? text.hub.statusPending : text.hub.status[s.status];
      list.append(el('li', '', fill(t.statusLine, { status: label, count: String(s.count) })));
    }
    record.append(
      el('span', 'story-tag', text.archive.verifiedTag),
      el('p', '', fill(t.recovered, { count: String(summary.recovered), total })),
      el('p', '', fill(t.read, { count: String(summary.read), total })),
      el('h2', '', t.statuses),
      list,
    );
    // The closing line is game story (GDD 3.5), so it sits in the cyan frame.
    const story = el('div', 'story-frame');
    story.append(el('span', 'story-tag', text.story.tag), el('p', '', t.closing));
    this.body.replaceChildren(record, story);
    this.dialog.showModal();
    this.onOpenChange();
  }
}
