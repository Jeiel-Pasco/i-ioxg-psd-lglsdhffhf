import type { Entry } from '../data/schema';

export interface EpilogueSummary {
  total: number;
  recovered: number;
  read: number;
  /** True when every entry is recovered (GDD 10.1: the Epilogue opens). */
  complete: boolean;
  /** Recovered entries per status, in first-seen order. `TODO` means not yet verified. */
  statuses: { status: Entry['status']; count: number }[];
}

export function epilogueSummary(entries: readonly Entry[], archived: ReadonlySet<string>, read: ReadonlySet<string>): EpilogueSummary {
  const counts = new Map<Entry['status'], number>();
  let recovered = 0;
  let readCount = 0;
  for (const e of entries) {
    if (read.has(e.id)) readCount++;
    if (!archived.has(e.id)) continue;
    recovered++;
    counts.set(e.status, (counts.get(e.status) ?? 0) + 1);
  }
  return {
    total: entries.length,
    recovered,
    read: readCount,
    complete: entries.length > 0 && recovered === entries.length,
    statuses: [...counts].map(([status, count]) => ({ status, count })),
  };
}
