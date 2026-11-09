import text from '../../../data/text/en.json';
import { HUB } from '../../config/hub';
import { Events, eventBus } from '../../core/events';
import type { Entry } from '../../data/schema';
import { isMarsUnlocked } from '../../systems/unlock';
import { el, fill } from '../dom';
import { renderClusterCard, renderEmptyCard, renderMarkerCard } from './MarkerCard';
import { clusterMarkers, markerPoints, type Cluster } from './markers';
import '../styles/hub.css';

type World = Entry['world'];
const WORLDS: readonly World[] = ['moon', 'mars'];
const LOCK_REASON_ID = 'hub-lock-reason';
const t = text.hub;

/** DOM hub map (GDD 9.2): world switch, markers with clusters, and a marker card. */
export class HubMap {
  private world: World = 'moon';
  private selectedAnchor: string | null = null;
  private readonly byId: Map<string, Entry>;
  private readonly tabs = new Map<World, HTMLButtonElement>();
  private readonly lock = el('p', 'hub-lock');
  private readonly progress = el('p', 'hub-progress');
  private readonly storyBanner = el('div', 'story-frame hub-mars-story');
  private readonly map = el('div', 'hub-map');
  private readonly card = el('section', 'hub-card');
  private readonly resize = new ResizeObserver(() => this.renderMarkers());
  private readonly epilogueButton: HTMLButtonElement;

  constructor(
    root: HTMLElement,
    private readonly entries: readonly Entry[],
    private readonly getArchived: () => ReadonlySet<string>,
    menus: Record<'archive' | 'settings' | 'about' | 'epilogue', (opener: HTMLElement) => void>,
    /** True once every entry is recovered; shows the Epilogue button. */
    private readonly epilogueReady: () => boolean = () => false,
  ) {
    this.byId = new Map(entries.map((e) => [e.id, e]));

    const switcher = el('div', 'hub-worlds');
    switcher.setAttribute('role', 'group');
    switcher.setAttribute('aria-label', t.worldSwitch);
    for (const w of WORLDS) {
      const b = el('button', 'hub-world', t.worlds[w]);
      b.type = 'button';
      b.dataset.world = w;
      b.addEventListener('click', () => this.setWorld(w));
      this.tabs.set(w, b);
      switcher.append(b);
    }

    this.lock.id = LOCK_REASON_ID;
    this.lock.append(el('strong', '', t.marsLocked), ' ', t.marsLockedReason);

    this.storyBanner.append(
      el('span', 'story-tag', text.story.tag),
      el('p', '', fill(t.marsUnlockedStory, { count: String(entries.filter((e) => e.world === 'mars').length) })),
    );
    this.storyBanner.hidden = true;

    this.map.setAttribute('role', 'group');
    this.card.setAttribute('aria-live', 'polite');
    this.card.tabIndex = -1;

    const frame = el('div', 'hub-map-frame');
    frame.append(this.map);
    const layout = el('div', 'hub-layout');
    layout.append(frame, this.card);
    const header = el('header', 'hub-header');
    const menuButton = (className: string, label: string, open: (opener: HTMLElement) => void) => {
      const b = el('button', `hub-menu ${className}`, label);
      b.type = 'button';
      b.addEventListener('click', () => open(b));
      return b;
    };
    // GDD 9.1: settings on the left, the Archive on the right.
    const settings = el('div', 'hub-actions hub-menus');
    settings.append(
      menuButton('hub-open-settings', text.settings.open, menus.settings),
      menuButton('hub-open-about', text.about.open, menus.about),
    );
    const actions = el('div', 'hub-actions');
    this.epilogueButton = menuButton('hub-open-epilogue', text.epilogue.open, menus.epilogue);
    this.epilogueButton.hidden = !this.epilogueReady();
    actions.append(switcher, menuButton('hub-open-archive', t.openArchive, menus.archive), this.epilogueButton);
    const titleWrap = el('div', 'hub-title-wrap');
    titleWrap.append(el('h1', '', t.title), this.progress);
    header.append(settings, titleWrap, actions);
    const inner = el('div', 'hub-inner');
    inner.append(header, this.lock, this.storyBanner, layout);
    root.append(inner);

    this.resize.observe(this.map);
    this.updateProgress();
    this.setWorld('moon');
  }

  destroy(): void {
    this.resize.disconnect();
  }

  /** Redraws after progress changes (a recovery or a reset). */
  refresh(): void {
    const unlocked = isMarsUnlocked(this.getArchived());
    this.lock.hidden = !this.marsLocked();
    this.storyBanner.hidden = !(this.world === 'mars' && unlocked);
    this.epilogueButton.hidden = !this.epilogueReady();
    this.updateProgress();
    this.renderMarkers();
  }

  private updateProgress(): void {
    const archived = this.getArchived();
    const moonEntries = this.entries.filter((e) => e.world === 'moon');
    const marsEntries = this.entries.filter((e) => e.world === 'mars');
    const moonDone = moonEntries.filter((e) => archived.has(e.id)).length;
    const marsDone = marsEntries.filter((e) => archived.has(e.id)).length;
    this.progress.textContent = fill(t.progress, {
      done: String(moonDone + marsDone),
      total: String(this.entries.length),
      moonDone: String(moonDone),
      moonTotal: String(moonEntries.length),
      marsDone: String(marsDone),
      marsTotal: String(marsEntries.length),
    });
  }

  private marsLocked(): boolean {
    return this.world === 'mars' && !isMarsUnlocked(this.getArchived());
  }

  setWorld(world: World): void {
    this.world = world;
    this.selectedAnchor = null;
    for (const [w, b] of this.tabs) b.setAttribute('aria-pressed', String(w === world));
    const unlocked = isMarsUnlocked(this.getArchived());
    this.lock.hidden = !this.marsLocked();
    this.storyBanner.hidden = !(world === 'mars' && unlocked);
    this.map.dataset.world = world;
    this.map.setAttribute('aria-label', fill(t.mapLabel, { world: t.worlds[world] }));
    renderEmptyCard(this.card);
    this.renderMarkers();
  }

  private renderMarkers(): void {
    const w = this.map.clientWidth;
    const h = this.map.clientHeight;
    this.map.replaceChildren();
    if (w === 0 || h === 0) return;

    const archived = this.getArchived();
    const inWorld = this.entries.filter((e) => e.world === this.world);
    for (const c of clusterMarkers(markerPoints(inWorld, w, h), HUB.clusterRadiusPx)) {
      const anchor = c.members[0].key;
      const b = el('button', c.members.length > 1 ? 'hub-marker hub-marker--cluster' : 'hub-marker');
      b.type = 'button';
      b.style.left = `${(c.x / w) * 100}%`;
      b.style.top = `${(c.y / h) * 100}%`;
      b.dataset.anchor = anchor;
      const ids = c.members.map((m) => m.key.split(':')[0]);
      const done = ids.filter((id) => archived.has(id)).length;
      b.dataset.entries = [...new Set(ids)].join(' ');
      b.dataset.archived = done === 0 ? 'none' : done === ids.length ? 'all' : 'some';
      b.setAttribute('aria-pressed', String(anchor === this.selectedAnchor));
      b.setAttribute('aria-label', this.markerLabel(c, done));
      if (c.members.length > 1) b.append(el('span', 'hub-count', String(c.members.length)));
      b.addEventListener('click', () => this.select(c));
      this.map.append(b);
    }
  }

  private memberInfo(key: string): { key: string; name: string; label: string } {
    const [id, index] = key.split(':');
    const entry = this.byId.get(id);
    return { key, name: entry?.name ?? id, label: entry?.locations[Number(index)]?.label ?? '' };
  }

  private markerLabel(c: Cluster, done: number): string {
    const total = c.members.length;
    if (total === 1) {
      const label = fill(t.markerLabel, this.memberInfo(c.members[0].key));
      return done ? `${label} (${t.recovered})` : label;
    }
    const names = c.members.map((m) => this.memberInfo(m.key).name).join(', ');
    const label = fill(t.clusterLabel, { count: String(total), names });
    return done ? `${label} (${fill(t.someRecovered, { count: String(done), total: String(total) })})` : label;
  }

  private select(c: Cluster): void {
    this.selectedAnchor = c.members[0].key;
    for (const b of this.map.querySelectorAll<HTMLButtonElement>('.hub-marker')) {
      b.setAttribute('aria-pressed', String(b.dataset.anchor === this.selectedAnchor));
    }
    if (c.members.length === 1) this.showMarker(c.members[0].key);
    else {
      renderClusterCard(this.card, c.members.map((m) => this.memberInfo(m.key)), (key) => {
        this.showMarker(key);
        this.card.focus();
      });
    }
  }

  private showMarker(key: string): void {
    const [id, indexText] = key.split(':');
    const entry = this.byId.get(id);
    if (!entry) return;
    const markerIndex = Number(indexText);
    renderMarkerCard(this.card, entry, markerIndex, {
      locked: this.marsLocked(),
      lockReasonId: LOCK_REASON_ID,
      onFly: () => eventBus.emit(Events.HUB_FLY, { entryId: id, markerIndex }),
    });
  }
}
