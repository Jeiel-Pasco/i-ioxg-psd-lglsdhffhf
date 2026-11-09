import { LevelSchema, type Level } from '../systems/level';

// Bundled at build time (no runtime fetch). Tools and unit tests read the same files with node:fs.
const files = import.meta.glob<{ default: unknown }>('../../data/levels/*.json', { eager: true });

export function loadLevels(): Map<string, Level> {
  const out = new Map<string, Level>();
  for (const mod of Object.values(files)) {
    const level = LevelSchema.parse(mod.default);
    out.set(level.id, level);
  }
  return out;
}
