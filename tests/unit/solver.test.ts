import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LANDING } from '../../src/config/landing';
import { LevelSchema, resolveLevel, type Level } from '../../src/systems/level';
import { fuelUsed, simulate, solve } from '../../src/systems/solver';

const DIR = 'data/levels';
const levels: Level[] = readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => LevelSchema.parse(JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8'))));

describe('level files', () => {
  it('cover the three Moon flagships', () => {
    expect(levels.map((l) => l.id).sort()).toEqual(['apollo-11-site', 'apollo-15-lrv', 'surveyor-3']);
  });

  it('use the difficulty platform width and the GDD travel distance', () => {
    const travel = { easy: 20, normal: 26, hard: 32 };
    for (const l of levels) {
      expect(l.platform.width).toBe(LANDING.difficulty[l.difficulty].platformWidth);
      expect(Math.abs(l.platform.x - l.start.x - travel[l.difficulty])).toBeLessThanOrEqual(2);
    }
  });

  it('start the first Moon flagship on Easy and keep Hard off the Moon', () => {
    expect(levels.find((l) => l.id === 'apollo-11-site')?.difficulty).toBe('easy');
    for (const l of levels) if (l.world === 'moon') expect(l.difficulty).not.toBe('hard');
  });
});

describe('solve', () => {
  it('every level solvable within fuel', () => {
    for (const l of levels) {
      const r = resolveLevel(l);
      const route = solve(r);
      expect(route, l.id).not.toBeNull();
      expect(simulate(r, route ?? []).outcome, l.id).toBe('landed');
      const used = fuelUsed(route ?? [], r.params);
      expect(used, l.id).toBeLessThanOrEqual(l.fuel);
      // Fuel is a multiple of the bot's route, never a tight or impossible amount.
      const best = solve({ ...r, fuel: Infinity });
      const mult = LANDING.difficulty[l.difficulty].fuelMultiplier;
      expect(l.fuel, l.id).toBeCloseTo(mult * fuelUsed(best ?? [], r.params), 1);
    }
  });

  it('zero input fails every level', () => {
    for (const l of levels) {
      const out = simulate(resolveLevel(l), []).outcome;
      expect(out, l.id).not.toBe('landed');
      expect(out, l.id).not.toBeNull();
    }
  });

  it('assist keeps every level solvable', () => {
    for (const l of levels) {
      const r = resolveLevel(l, { assist: true });
      expect(simulate(r, solve(r) ?? []).outcome, l.id).toBe('landed');
    }
  });

  it('solves the same level the same way each time', () => {
    const r = resolveLevel(levels[0]);
    expect(solve(r)).toEqual(solve(r));
  });
});
