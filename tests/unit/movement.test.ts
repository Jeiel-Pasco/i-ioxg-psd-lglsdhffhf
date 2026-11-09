import { describe, expect, it } from 'vitest';
import { SITE } from '../../src/config/site';
import { stepMovement, type Body } from '../../src/systems/movement';

const cfg = SITE.movement;
const bounds = { width: 960, height: 540 };
const dt = 1 / 60;
const still = (): Body => ({ x: 480, y: 270, vx: 0, vy: 0 });
const speed = (b: Body) => Math.hypot(b.vx, b.vy);

function run(b: Body, input: { x: number; y: number }, seconds: number): Body {
  let s = b;
  for (let t = 0; t < seconds; t += dt) s = stepMovement(s, input, dt, bounds);
  return s;
}

describe('stepMovement', () => {
  it('ramps up instead of jumping to full speed', () => {
    const one = stepMovement(still(), { x: 1, y: 0 }, dt, bounds);
    expect(speed(one)).toBeGreaterThan(0);
    expect(speed(one)).toBeLessThan(cfg.maxSpeed);
  });

  it('reaches full speed after the ramp time', () => {
    const b = run(still(), { x: 1, y: 0 }, cfg.maxSpeed / cfg.accel + 0.05);
    expect(speed(b)).toBeCloseTo(cfg.maxSpeed);
  });

  it('moves in all 8 directions', () => {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const input = { x: Math.round(Math.cos(a)), y: Math.round(Math.sin(a)) };
      const b = run(still(), input, 0.5);
      const sign = (n: number) => Math.sign(Math.round(n)) || 0;
      expect(sign(b.x - 480)).toBe(sign(input.x));
      expect(sign(b.y - 270)).toBe(sign(input.y));
    }
  });

  it('is not faster on a diagonal', () => {
    const b = run(still(), { x: 1, y: 1 }, 2);
    expect(speed(b)).toBeCloseTo(cfg.maxSpeed);
  });

  it('slows to a stop when input is released', () => {
    const moving = run(still(), { x: 1, y: 0 }, 1);
    const stopped = run(moving, { x: 0, y: 0 }, cfg.maxSpeed / cfg.decel + 0.05);
    expect(speed(stopped)).toBe(0);
  });

  it('stays inside the scene', () => {
    const b = run({ x: 10, y: 10, vx: 0, vy: 0 }, { x: -1, y: -1 }, 2);
    expect(b.x).toBe(cfg.edgePx);
    expect(b.y).toBe(cfg.edgePx);
    expect(speed(b)).toBe(0);
    const c = run({ x: 950, y: 530, vx: 0, vy: 0 }, { x: 1, y: 1 }, 2);
    expect(c.x).toBe(bounds.width - cfg.edgePx);
    expect(c.y).toBe(bounds.height - cfg.edgePx);
  });
});
