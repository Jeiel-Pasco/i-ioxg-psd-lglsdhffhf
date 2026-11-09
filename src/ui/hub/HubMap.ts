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
  private readonly map = el('div', 'hub-map');
  private readonly card = el('section', 'hub-card');
  private readonly resize = new ResizeObserver(() => this.renderMarkers());

  constructor(
    root: HTMLElement,
    private readonly entries: readonly Entry[],
    private readonly getArchived: () => ReadonlySet<string>,
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

    this.map.setAttribute('role', 'group');
    this.card.setAttribute('aria-live', 'polite');
    this.card.tabIndex = -1;

    const frame = el('div', 'hub-map-frame');
    frame.append(this.map);
    const layout = el('div', 'hub-layout');
    layout.append(frame, this.card);
    const header = el('header', 'hub-header');
    header.append(el('h1', '', t.title), switcher);
    const inner = el('div', 'hub-inner');
    inner.append(header, this.lock, layout);
    root.append(inner);

    this.resize.observe(this.map);
    this.setWorld('moon');
  }

  destroy(): void {
    this.resize.disconnect();
  }

  private marsLocked(): boolean {
    return this.world === 'mars' && !isMarsUnlocked(this.getArchived());
  }

  private setWorld(world: World): void {
    this.world = world;
    this.selectedAnchor = null;
    for (const [w, b] of this.tabs) b.setAttribute('aria-pressed', String(w === world));
    this.lock.hidden = !this.marsLocked();
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

    const inWorld = this.entries.filter((e) => e.world === this.world);
    for (const c of clusterMarkers(markerPoints(inWorld, w, h), HUB.clusterRadiusPx)) {
      const anchor = c.members[0].key;
      const b = el('button', c.members.length > 1 ? 'hub-marker hub-marker--cluster' : 'hub-marker');
      b.type = 'button';
      b.style.left = `${(c.x / w) * 100}%`;
      b.style.top = `${(c.y / h) * 100}%`;
      b.dataset.anchor = anchor;
      b.setAttribute('aria-pressed', String(anchor === this.selectedAnchor));
      b.setAttribute('aria-label', this.markerLabel(c));
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

  private markerLabel(c: Cluster): string {
    if (c.members.length === 1) return fill(t.markerLabel, this.memberInfo(c.members[0].key));
    const names = c.members.map((m) => this.memberInfo(m.key).name).join(', ');
    return fill(t.clusterLabel, { count: String(c.members.length), names });
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
