import { isMarsUnlocked } from '../systems/unlock';
import { MemoryStore, type KeyValueStore } from './memoryStore';
import { defaultSave, migrate, type SaveV1, type Settings } from './migrate';

export const SAVE_KEY = 'still-out-there:save';
const PROBE_KEY = 'still-out-there:probe';

export interface SaveHandle {
  store: KeyValueStore;
  /** False when progress lives only in memory and is lost on reload. */
  persistent: boolean;
}

function browserStorage(): KeyValueStore {
  return window.localStorage;
}

/** Opens local storage, or a memory store when storage is blocked. */
export function openStore(getStorage: () => KeyValueStore = browserStorage): SaveHandle {
  try {
    const store = getStorage();
    store.setItem(PROBE_KEY, '1');
    store.removeItem(PROBE_KEY);
    return { store, persistent: true };
  } catch {
    return { store: new MemoryStore(), persistent: false };
  }
}

export function loadSave(handle: SaveHandle): SaveV1 {
  let text: string | null = null;
  try {
    text = handle.store.getItem(SAVE_KEY);
  } catch {
    return defaultSave();
  }
  if (text === null) return defaultSave();
  try {
    return migrate(JSON.parse(text));
  } catch {
    return defaultSave();
  }
}

/** Writes the save. If storage fails (for example, it is full), the game keeps running in memory. */
export function writeSave(handle: SaveHandle, save: SaveV1): void {
  const text = JSON.stringify(save);
  try {
    handle.store.setItem(SAVE_KEY, text);
  } catch {
    handle.store = new MemoryStore();
    handle.persistent = false;
    handle.store.setItem(SAVE_KEY, text);
  }
}

export function resetProgress(handle: SaveHandle): SaveV1 {
  try {
    handle.store.removeItem(SAVE_KEY);
  } catch {
    handle.store = new MemoryStore();
    handle.persistent = false;
  }
  return defaultSave();
}

/** Player progress with autosave after a recovery, an entry read, and a settings change (GDD 10.3). */
export class Progress {
  private save: SaveV1;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly handle: SaveHandle) {
    this.save = loadSave(handle);
  }

  get persistent(): boolean {
    return this.handle.persistent;
  }

  get settings(): Readonly<Settings> {
    return this.save.settings;
  }

  /** Subscribes to changes and returns the unsubscribe function. */
  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  archivedIds(): ReadonlySet<string> {
    return new Set(Object.keys(this.save.archived));
  }

  hasRead(id: string): boolean {
    return this.save.read.includes(id);
  }

  recover(id: string, assisted: boolean): void {
    // An unassisted recovery later replaces an assisted one, never the other way round.
    const before = this.save.archived[id];
    this.save.archived[id] = { assisted: (before?.assisted ?? true) && assisted };
    this.save.unlocks.mars = isMarsUnlocked(this.archivedIds());
    this.commit();
  }

  markRead(id: string): void {
    if (this.save.read.includes(id)) return;
    this.save.read.push(id);
    this.commit();
  }

  updateSettings(patch: Partial<Settings>): void {
    this.save.settings = { ...this.save.settings, ...patch };
    this.commit();
  }

  reset(): void {
    this.save = resetProgress(this.handle);
    this.notify();
  }

  private commit(): void {
    writeSave(this.handle, this.save);
    this.notify();
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }
}
