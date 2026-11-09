import { describe, expect, it } from 'vitest';
import { LANDING } from '../../src/config/landing';
import { landingOutcome } from '../../src/systems/outcome';
import { stepPhysics, type Input, type LanderState, type LandingParams } from '../../src/systems/physics';
import { resolveLevel, type Level } from '../../src/systems/level';

const dt = 1 / 60;
const g = LANDING.gravity.moon;
const params: LandingParams = { g, thrustAccel: 2 * g, sideAccel: g, steerFuelShare: 0.5 };
const start = (): LanderState => ({ x: 10, y: 2, vx: 0, vy: 0, fuel: 100 });
const NONE: Input = { thrust: 0, steer: 0 };

function run(s: LanderState, input: Input, steps: number, p = params): LanderState {
  let out = s;
  for (let i = 0; i < steps; i++) out = stepPhysics(out, input, p, dt);
  return out;
}

const level: Level = {
  id: 'test',
  world: 'moon',
  difficulty: 'easy',
  start: { x: 4, y: 4 },
  startVelocity: { x: 0, y: 0 },
  platform: { x: 24, width: 8 },
  fuel: 10,
};

describe('stepPhysics', () => {
  it('free fall matches g', () => {
    const s = run(start(), NONE, 60);
    expect(s.vy).toBeCloseTo(g, 6);
    expect(s.vx).toBe(0);
    // Semi-implicit Euler: within one step's worth of the exact g t^2 / 2.
    expect(Math.abs(s.y - 2 - g / 2)).toBeLessThan(g * dt);
    expect(s.fuel).toBe(100);
  });

  it('thrust pushes up as a ratio of gravity', () => {
    const s = run(start(), { thrust: 1, steer: 0 }, 60);
    // Net acceleration is g - 2g = -g (up, because y points down).
    expect(s.vy).toBeCloseTo(-g, 6);
    expect(s.fuel).toBeCloseTo(99, 6);
  });

  it('steering accelerates sideways and uses half the fuel of thrust', () => {
    const s = run(start(), { thrust: 0, steer: 1 }, 60);
    expect(s.vx).toBeCloseTo(g, 6);
    expect(s.fuel).toBeCloseTo(99.5, 6);
    const left = run(start(), { thrust: 0, steer: -1 }, 60);
    expect(left.vx).toBeCloseTo(-g, 6);
  });

  it('thrust and steer work together', () => {
    const s = run(start(), { thrust: 1, steer: 1 }, 60);
    expect(s.vy).toBeCloseTo(-g, 6);
    expect(s.vx).toBeCloseTo(g, 6);
    expect(s.fuel).toBeCloseTo(98.5, 6);
  });

  it('an empty tank gives no thrust and fuel never goes below zero', () => {
    const s = run({ ...start(), fuel: 0.1 }, { thrust: 1, steer: 1 }, 60);
    expect(s.fuel).toBe(0);
    const empty = run({ ...start(), fuel: 0 }, { thrust: 1, steer: 1 }, 60);
    expect(empty.vy).toBeCloseTo(g, 6);
    expect(empty.vx).toBe(0);
  });

  it('deterministic over 10 runs', () => {
    const inputs: Input[] = Array.from({ length: 300 }, (_, i) => ({
      thrust: (i % 7 < 3 ? 1 : 0) as 0 | 1,
      steer: ((i % 5) - 2 > 0 ? 1 : (i % 5) - 2 < 0 ? -1 : 0) as -1 | 0 | 1,
    }));
    const results = Array.from({ length: 10 }, () => {
      let s = start();
      for (const input of inputs) s = stepPhysics(s, input, params, dt);
      return s;
    });
    for (const r of results) expect(r).toEqual(results[0]);
  });
});

describe('resolveLevel', () => {
  it('uses the difficulty table and scales safe speeds on Mars', () => {
    const moon = resolveLevel(level);
    const easy = LANDING.difficulty.easy;
    expect(moon.params.thrustAccel).toBeCloseTo(easy.thrustRatio * LANDING.gravity.moon);
    expect(moon.params.sideAccel).toBeCloseTo(easy.sideShare * easy.thrustRatio * LANDING.gravity.moon);
    expect(moon.safeVertical).toBe(easy.safeVertical);
    const mars = resolveLevel({ ...level, world: 'mars' });
    expect(mars.params.g).toBe(LANDING.gravity.mars);
    expect(mars.safeVertical).toBeCloseTo(easy.safeVertical * LANDING.marsSpeedScale);
    expect(mars.safeSideways).toBeCloseTo(easy.safeSideways * LANDING.marsSpeedScale);
  });

  it('assist adds 25% fuel and widens the platform', () => {
    const a = resolveLevel(level, { assist: true });
    expect(a.fuel).toBeCloseTo(12.5);
    expect(a.platform.width).toBeCloseTo(8 * LANDING.assist.platformScale);
  });
});

describe('landingOutcome', () => {
  const r = resolveLevel(level);
  const at = (x: number, vx: number, vy: number, fuel = 5): LanderState => ({ x, y: LANDING.groundM, vx, vy, fuel });

  it('is null while flying', () => {
    expect(landingOutcome({ x: 10, y: 5, vx: 0, vy: 1, fuel: 5 }, r)).toBeNull();
  });
  it('lands softly inside the platform edges', () => {
    expect(landingOutcome(at(24, 0.5, 1), r)).toBe('landed');
    expect(landingOutcome(at(27.9, 0, 1), r)).toBe('landed');
  });
  it('fails when too fast down or sideways', () => {
    expect(landingOutcome(at(24, 0, 3), r)).toBe('too_fast');
    expect(landingOutcome(at(24, 2.5, 1), r)).toBe('too_fast');
  });
  it('fails outside the platform or off the screen', () => {
    expect(landingOutcome(at(29, 0, 1), r)).toBe('missed');
    expect(landingOutcome({ x: -1, y: 5, vx: -1, vy: 0, fuel: 5 }, r)).toBe('missed');
    expect(landingOutcome({ x: 41, y: 5, vx: 1, vy: 0, fuel: 5 }, r)).toBe('missed');
  });
  it('fails when fuel runs out in the air', () => {
    expect(landingOutcome({ x: 10, y: 5, vx: 0, vy: 1, fuel: 0 }, r)).toBe('no_fuel');
  });
});
