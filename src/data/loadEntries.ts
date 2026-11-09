import { EntrySchema, type Entry } from './schema';

// Bundled at build time by Vite; nothing is fetched at runtime.
const files = import.meta.glob<unknown>('../../data/artifacts/*/*.json', { eager: true, import: 'default' });

export function loadEntries(): Entry[] {
  return Object.values(files).map((raw) => EntrySchema.parse(raw));
}
