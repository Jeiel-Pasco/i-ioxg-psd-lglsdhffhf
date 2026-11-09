import { describe, expect, it } from 'vitest';
import { EntrySchema, type Entry } from '../../src/data/schema';
import { epilogueSummary } from '../../src/systems/epilogue';
import { loadEntryFiles } from '../../tools/validate-data';

const entries: Entry[] = loadEntryFiles('data/artifacts').map((e) => EntrySchema.parse(e));
const withStatus = (id: string, status: Entry['status']): Entry => ({ ...entries.find((e) => e.id === id)!, status });

describe('epilogue summary', () => {
  it('counts recovered and read entries out of the total', () => {
    const s = epilogueSummary(entries, new Set(['surveyor-3', 'apollo-11-site']), new Set(['surveyor-3']));
    expect(s).toMatchObject({ total: 17, recovered: 2, read: 1, complete: false });
  });

  it('is complete only when every entry is recovered', () => {
    const all = new Set(entries.map((e) => e.id));
    expect(epilogueSummary(entries, all, new Set()).complete).toBe(true);
  });

  it('ignores read IDs that are not entries', () => {
    expect(epilogueSummary(entries, new Set(), new Set(['nope'])).read).toBe(0);
  });

  it('groups recovered entries by status, with unverified ones apart', () => {
    const list = [withStatus('surveyor-3', 'ended'), withStatus('apollo-11-site', 'ended'), withStatus('ingenuity', 'TODO')];
    const s = epilogueSummary(list, new Set(['surveyor-3', 'apollo-11-site', 'ingenuity']), new Set());
    expect(s.statuses).toEqual([
      { status: 'ended', count: 2 },
      { status: 'TODO', count: 1 },
    ]);
  });

  it('never counts a locked entry in the statuses', () => {
    const s = epilogueSummary([withStatus('surveyor-3', 'ended')], new Set(), new Set());
    expect(s.statuses).toEqual([]);
  });
});
