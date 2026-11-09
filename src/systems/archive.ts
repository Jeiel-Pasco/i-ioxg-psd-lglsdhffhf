import { STATUSES, type Entry } from '../data/schema';

export type WorldFilter = Entry['world'] | 'all';
export type StatusFilter = (typeof STATUSES)[number] | 'all';
export interface ArchiveFilter {
  world: WorldFilter;
  status: StatusFilter;
}

/** What one Archive card may show. Locked cards carry no spoilers, and no card says whether it was assisted. */
export interface ArchiveCard {
  id: string;
  world: Entry['world'];
  locked: boolean;
  name: string | null;
  status: Entry['status'] | null;
}

export function archiveCards(entries: readonly Entry[], archived: ReadonlySet<string>, filter: ArchiveFilter): ArchiveCard[] {
  const cards: ArchiveCard[] = [];
  for (const e of entries) {
    if (filter.world !== 'all' && e.world !== filter.world) continue;
    const locked = !archived.has(e.id);
    // A status filter shows only open cards, so it cannot reveal anything about locked ones.
    if (filter.status !== 'all' && (locked || e.status !== filter.status)) continue;
    cards.push({ id: e.id, world: e.world, locked, name: locked ? null : e.name, status: locked ? null : e.status });
  }
  return cards;
}
