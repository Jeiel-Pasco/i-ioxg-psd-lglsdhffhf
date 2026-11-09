import { describe, expect, it } from 'vitest';
import { MemoryStore, type KeyValueStore } from '../../src/save/memoryStore';
import { SAVE_VERSION, defaultSave, migrate } from '../../src/save/migrate';
import { Progress, SAVE_KEY, loadSave, openStore, resetProgress, writeSave } from '../../src/save/save';
import { archiveCards } from '../../src/systems/archive';
import { EntrySchema, type Entry } from '../../src/data/schema';
import { loadEntryFiles } from '../../tools/validate-data';

const entries: Entry[] = loadEntryFiles('data/artifacts').map((e) => EntrySchema.parse(e));

/** A store whose every call throws, like local storage in a locked-down browser. */
class BlockedStore implements KeyValueStore {
  getItem(): string | null {
    throw new Error('SecurityError');
  }
  setItem(): void {
    throw new Error('SecurityError');
  }
  removeItem(): void {
    throw new Error('SecurityError');
  }
}

/** Reads work, writes fail as if the quota is full. */
class FullStore extends MemoryStore {
  override setItem(): void {
    throw new Error('QuotaExceededError');
  }
}

describe('save', () => {
  it('falls back to memory when storage throws', () => {
    const handle = openStore(() => new BlockedStore());
    expect(handle.persistent).toBe(false);
    const save = loadSave(handle);
    save.read.push('surveyor-3');
    writeSave(handle, save);
    expect(loadSave(handle).read).toEqual(['surveyor-3']);
  });

  it('falls back to memory when getting storage itself throws', () => {
    const handle = openStore(() => {
      throw new Error('SecurityError');
    });
    expect(handle.persistent).toBe(false);
    expect(loadSave(handle)).toEqual(defaultSave());
  });

  it('switches to memory when a write fails (storage full)', () => {
    const handle = openStore(() => new FullStore());
    const save = loadSave(handle);
    save.read.push('apollo-11-site');
    expect(() => writeSave(handle, save)).not.toThrow();
    expect(handle.persistent).toBe(false);
    expect(loadSave(handle).read).toEqual(['apollo-11-site']);
  });

  it('round-trips through storage', () => {
    const store = new MemoryStore();
    const handle = openStore(() => store);
    expect(handle.persistent).toBe(true);
    const save = loadSave(handle);
    save.archived['surveyor-3'] = { assisted: false };
    writeSave(handle, save);
    expect(loadSave(openStore(() => store)).archived).toEqual({ 'surveyor-3': { assisted: false } });
  });

  it('ignores corrupt JSON', () => {
    const store = new MemoryStore();
    store.setItem(SAVE_KEY, '{not json');
    expect(loadSave(openStore(() => store))).toEqual(defaultSave());
  });

  it('reset clears progress', () => {
    const store = new MemoryStore();
    const handle = openStore(() => store);
    const save = loadSave(handle);
    save.archived['surveyor-3'] = { assisted: true };
    writeSave(handle, save);
    expect(resetProgress(handle)).toEqual(defaultSave());
    expect(store.getItem(SAVE_KEY)).toBeNull();
    expect(loadSave(handle)).toEqual(defaultSave());
  });
});

describe('migrate', () => {
  it('migrates v0', () => {
    const v1 = migrate({ archived: ['surveyor-3', 'apollo-11-site'], read: ['surveyor-3'] });
    expect(v1.version).toBe(SAVE_VERSION);
    expect(v1.archived).toEqual({ 'surveyor-3': { assisted: false }, 'apollo-11-site': { assisted: false } });
    expect(v1.read).toEqual(['surveyor-3']);
  });

  it('keeps a valid v1 save', () => {
    const s = defaultSave();
    s.archived['ingenuity'] = { assisted: true };
    s.position = { world: 'mars', siteId: 'ingenuity' };
    expect(migrate(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it('keeps a v1 save written before the opening flag existed', () => {
    const { openingSeen: _, ...old } = defaultSave();
    old.archived['surveyor-3'] = { assisted: false };
    const s = migrate(JSON.parse(JSON.stringify(old)));
    expect(s.archived).toEqual({ 'surveyor-3': { assisted: false } });
    expect(s.openingSeen).toBe(false);
  });

  it.each([null, 42, 'save', [], { version: 1, archived: 'x' }, { version: 99 }])('resets unusable data %#', (raw) => {
    expect(migrate(raw)).toEqual(defaultSave());
  });
});

describe('progress autosave', () => {
  function setup() {
    const store = new MemoryStore();
    const progress = new Progress(openStore(() => store));
    const saved = () => migrate(JSON.parse(store.getItem(SAVE_KEY) ?? 'null'));
    return { progress, saved };
  }

  it('saves after a recovery', () => {
    const { progress, saved } = setup();
    progress.recover('surveyor-3', false);
    expect(saved().archived['surveyor-3']).toEqual({ assisted: false });
  });

  it('unlocks Mars after the three Moon flagships', () => {
    const { progress, saved } = setup();
    for (const id of ['apollo-11-site', 'apollo-15-lrv', 'surveyor-3']) progress.recover(id, false);
    expect(saved().unlocks.mars).toBe(true);
  });

  it('saves after an entry is read, once per entry', () => {
    const { progress, saved } = setup();
    progress.markRead('surveyor-3');
    progress.markRead('surveyor-3');
    expect(saved().read).toEqual(['surveyor-3']);
  });

  it('saves after a settings change', () => {
    const { progress, saved } = setup();
    progress.updateSettings({ highContrast: true });
    expect(saved().settings.highContrast).toBe(true);
  });

  it('saves when the opening is finished, and reset plays it again', () => {
    const { progress, saved } = setup();
    expect(progress.openingSeen).toBe(false);
    progress.finishOpening();
    expect(saved().openingSeen).toBe(true);
    progress.reset();
    expect(progress.openingSeen).toBe(false);
  });

  it('exposes read IDs for the Epilogue', () => {
    const { progress } = setup();
    progress.markRead('surveyor-3');
    expect([...progress.readIds()]).toEqual(['surveyor-3']);
  });
});

describe('archive cards', () => {
  it('locks every entry that is not archived and hides its name', () => {
    const cards = archiveCards(entries, new Set(), { world: 'all', status: 'all' });
    expect(cards).toHaveLength(17);
    for (const c of cards) {
      expect(c.locked).toBe(true);
      expect(c.name).toBeNull();
    }
  });

  it('filters by world', () => {
    expect(archiveCards(entries, new Set(), { world: 'moon', status: 'all' })).toHaveLength(8);
    expect(archiveCards(entries, new Set(), { world: 'mars', status: 'all' })).toHaveLength(9);
  });

  it('never shows assisted', () => {
    const { progress } = (() => {
      const p = new Progress(openStore(() => new MemoryStore()));
      return { progress: p };
    })();
    progress.recover('surveyor-3', true);
    progress.recover('apollo-11-site', false);
    const cards = archiveCards(entries, progress.archivedIds(), { world: 'all', status: 'all' });
    const surveyor = cards.find((c) => c.id === 'surveyor-3');
    const apollo = cards.find((c) => c.id === 'apollo-11-site');
    expect(surveyor?.locked).toBe(false);
    expect(Object.keys(surveyor ?? {})).toEqual(Object.keys(apollo ?? {}));
    expect(JSON.stringify(cards)).not.toMatch(/assist/i);
  });
});
