// Level solver (GDD 7.7). Runs the solver bot on every data/levels/*.json file.
// Default: exits 1 if any level cannot be won with its fuel, or its fuel is not
// fuelMultiplier x the bot's route. `--write` recomputes and saves each level's fuel.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { LANDING } from '../src/config/landing';
import { LevelSchema, resolveLevel, type Level } from '../src/systems/level';
import { fuelUsed, simulate, solve } from '../src/systems/solver';

const DIR = 'data/levels';

export interface LevelIssue {
  id: string;
  message: string;
}

export function loadLevelFiles(dir = DIR): { path: string; level: Level }[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const path = join(dir, f);
      return { path, level: LevelSchema.parse(JSON.parse(readFileSync(path, 'utf8'))) };
    });
}

/** Fuel for a level: its difficulty's multiple of the cheapest bot route, rounded up to 0.01 s. */
export function targetFuel(level: Level): number | null {
  const r = resolveLevel(level);
  const route = solve({ ...r, fuel: Infinity });
  if (!route) return null;
  const mult = LANDING.difficulty[level.difficulty].fuelMultiplier;
  return Math.ceil(mult * fuelUsed(route, r.params) * 100) / 100;
}

export function checkLevels(levels: Level[]): LevelIssue[] {
  const issues: LevelIssue[] = [];
  for (const level of levels) {
    const r = resolveLevel(level);
    const route = solve(r);
    if (!route || simulate(r, route).outcome !== 'landed') {
      issues.push({ id: level.id, message: 'the solver bot cannot win this level' });
      continue;
    }
    const want = targetFuel(level);
    if (want === null || Math.abs(want - level.fuel) > 0.01) {
      issues.push({ id: level.id, message: `fuel ${level.fuel} should be ${want} (run solve-levels -- --write)` });
    }
  }
  return issues;
}

function main(args: string[]): number {
  const files = loadLevelFiles();
  if (args.includes('--write')) {
    for (const { path, level } of files) {
      const fuel = targetFuel(level);
      if (fuel === null) continue;
      writeFileSync(path, `${JSON.stringify({ ...level, fuel }, null, 2)}\n`);
      console.log(`${level.id}: fuel ${fuel}`);
    }
  }
  const issues = checkLevels(loadLevelFiles().map((f) => f.level));
  for (const i of issues) console.log(`${i.id}: ${i.message}`);
  console.log(`${files.length} levels, ${issues.length} errors`);
  return issues.length > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
