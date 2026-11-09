import text from '../../../data/text/en.json';
import { STATUSES, type Entry } from '../../data/schema';
import { archiveCards, type ArchiveFilter, type StatusFilter, type WorldFilter } from '../../systems/archive';
import { el, fill } from '../dom';
import { renderEntryPage } from './EntryPage';
import '../styles/archive.css';

const t = text.archive;
const hub = text.hub;

export interface ArchiveOptions {
  getArchived: () => ReadonlySet<string>;
  onRead: (id: string) => void;
  onReset: () => void;
  /** Called when the overlay opens or closes, so the game can stop reading keys. */
  onOpenChange: (open: boolean) => void;
}

function select<T extends string>(className: string, label: string, options: readonly [T, string][], onChange: (v: T) => void): HTMLLabelElement {
  const wrap = el('label', 'archive-filter');
  const s = el('select', className);
  for (const [v, name] of options) {
    const o = el('option', '', name);
    o.value = v;
    s.append(o);
  }
  s.addEventListener('change', () => onChange(s.value as T));
  wrap.append(el('span', '', label), s);
  return wrap;
}

/** The Archive (GDD 9.3): a modal dialog over the canvas with a card grid and the entry page. */
export class Archive {
  private readonly dialog = el('dialog', 'archive');
  private readonly grid = el('ul', 'archive-grid');
  private readonly empty = el('p', 'archive-empty', t.empty);
  private readonly gridView = el('div', 'archive-grid-view');
  private readonly entryView = el('article');
  private readonly entryWrap = el('div', 'archive-entry-view');
  private readonly entries: readonly Entry[];
  private readonly byId: Map<string, Entry>;
  private filter: ArchiveFilter = { world: 'all', status: 'all' };
  private opener: HTMLElement | null = null;
  private lastCardId: string | null = null;

  constructor(
    entries: readonly Entry[],
    private readonly opts: ArchiveOptions,
  ) {
    // The Moon comes first, matching the order the player travels.
    this.entries = [...entries].sort((a, b) => Number(a.world === 'mars') - Number(b.world === 'mars'));
    this.byId = new Map(entries.map((e) => [e.id, e]));
    this.dialog.setAttribute('aria-labelledby', 'archive-title');

    const close = el('button', 'archive-button archive-close', t.close);
    close.type = 'button';
    close.addEventListener('click', () => this.close());
    const title = el('h1', '', t.title);
    title.id = 'archive-title';
    const head = el('header', 'archive-head');
    head.append(title, close);

    const worlds: [WorldFilter, string][] = [['all', t.all], ['moon', hub.worlds.moon], ['mars', hub.worlds.mars]];
    const statuses: [StatusFilter, string][] = [['all', t.all], ...STATUSES.map((s): [StatusFilter, string] => [s, hub.status[s]])];
    const filters = el('div', 'archive-filters');
    filters.append(
      select('archive-filter-world', t.filterWorld, worlds, (v) => this.setFilter({ world: v })),
      select('archive-filter-status', t.filterStatus, statuses, (v) => this.setFilter({ status: v })),
    );

    const reset = el('button', 'archive-button archive-reset', t.reset);
    reset.type = 'button';
    reset.addEventListener('click', () => {
      if (window.confirm(t.resetConfirm)) this.opts.onReset();
    });

    this.empty.hidden = true;
    this.gridView.append(filters, this.grid, this.empty, reset);

    const back = el('button', 'archive-button archive-back', t.back);
    back.type = 'button';
    back.addEventListener('click', () => this.showGrid());
    this.entryWrap.append(back, this.entryView);
    this.entryWrap.hidden = true;

    this.dialog.append(head, this.gridView, this.entryWrap);
    // Escape closes the dialog natively; `close` covers every way it can close.
    this.dialog.addEventListener('close', () => this.afterClose());
    document.body.append(this.dialog);
  }

  open(opener: HTMLElement | null): void {
    if (this.dialog.open) return;
    this.opener = opener;
    this.showGrid();
    this.dialog.showModal();
    this.opts.onOpenChange(true);
  }

  close(): void {
    if (this.dialog.open) this.dialog.close();
  }

  /** Redraws after progress changes. */
  refresh(): void {
    if (!this.entryWrap.hidden) {
      const id = this.entryView.dataset.id;
      if (id && !this.opts.getArchived().has(id)) this.showGrid();
      return;
    }
    this.renderGrid();
  }

  private afterClose(): void {
    this.opts.onOpenChange(false);
    const target = this.opener?.isConnected ? this.opener : document.querySelector<HTMLElement>('#game-container canvas');
    target?.focus();
    this.opener = null;
  }

  private setFilter(patch: Partial<ArchiveFilter>): void {
    this.filter = { ...this.filter, ...patch };
    this.renderGrid();
  }

  private showGrid(): void {
    this.entryWrap.hidden = true;
    this.gridView.hidden = false;
    this.renderGrid();
    if (this.lastCardId) this.grid.querySelector<HTMLElement>(`[data-id="${this.lastCardId}"] button`)?.focus();
  }

  private renderGrid(): void {
    const cards = archiveCards(this.entries, this.opts.getArchived(), this.filter);
    this.grid.replaceChildren();
    for (const c of cards) {
      const li = el('li', c.locked ? 'archive-card archive-card--locked' : 'archive-card record-frame');
      li.dataset.id = c.id;
      li.dataset.locked = String(c.locked);
      if (c.locked) {
        const sil = el('div', 'archive-silhouette');
        sil.setAttribute('role', 'img');
        sil.setAttribute('aria-label', fill(t.lockedLabel, { world: hub.worlds[c.world] }));
        li.append(sil, el('p', 'archive-locked-text', t.locked), el('p', 'entry-world', hub.worlds[c.world]));
      } else {
        const entry = this.byId.get(c.id);
        const status = c.status ?? 'TODO';
        li.append(
          el('p', 'record-tag', t.verifiedTag),
          el('h2', '', c.name ?? c.id),
          el('span', `hub-status hub-status--${status === 'TODO' ? 'pending' : status}`, status === 'TODO' ? hub.statusPending : hub.status[status]),
          el('p', 'entry-world', hub.worlds[c.world]),
        );
        const open = el('button', 'archive-button archive-open', t.open);
        open.type = 'button';
        open.setAttribute('aria-label', `${t.open}: ${c.name ?? c.id}`);
        open.addEventListener('click', () => entry && this.showEntry(entry));
        li.append(open);
      }
      this.grid.append(li);
    }
    this.empty.hidden = cards.length > 0;
  }

  private showEntry(entry: Entry): void {
    this.lastCardId = entry.id;
    renderEntryPage(this.entryView, entry);
    this.gridView.hidden = true;
    this.entryWrap.hidden = false;
    this.dialog.scrollTop = 0;
    this.entryView.querySelector<HTMLElement>('h2')?.setAttribute('tabindex', '-1');
    this.entryView.querySelector<HTMLElement>('h2')?.focus();
    this.opts.onRead(entry.id);
  }
}
