import { describe, expect, it } from 'vitest';
import { SITE } from '../../src/config/site';
import { siteLayout, siteLayoutIds } from '../../src/data/sites';
import { echoArrowAngle, echoState } from '../../src/systems/echo';

const { nearPx, readyPx } = SITE.echo;

describe('echoState', () => {
  it('is unvisited when far away', () => {
    expect(echoState(nearPx + 1, false)).toBe('unvisited');
  });

  it('unvisited -> near at the near threshold', () => {
    expect(echoState(nearPx, false)).toBe('near');
  });

  it('near -> ready at the ready threshold', () => {
    expect(echoState(readyPx + 1, false)).toBe('near');
    expect(echoState(readyPx, false)).toBe('ready');
    expect(echoState(0, false)).toBe('ready');
  });

  it('ready -> near -> unvisited when walking away', () => {
    expect(echoState(readyPx + 1, false)).toBe('near');
    expect(echoState(nearPx + 1, false)).toBe('unvisited');
  });

  it('ready -> archived once recovered, at any distance', () => {
    expect(echoState(0, true)).toBe('archived');
    expect(echoState(nearPx, true)).toBe('archived');
    expect(echoState(nearPx * 10, true)).toBe('archived');
  });

  it('uses thresholds from config', () => {
    expect(echoState(50, false, { nearPx: 40, readyPx: 10 })).toBe('unvisited');
    expect(echoState(40, false, { nearPx: 40, readyPx: 10 })).toBe('near');
  });
});

describe('site layouts', () => {
  it.each(['default', ...siteLayoutIds()])('%s starts far from its machine and stays in bounds', (id) => {
    const l = siteLayout(id);
    for (const p of [l.start, l.machine, ...l.props]) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(SITE.width);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(SITE.height);
    }
    const d = Math.hypot(l.start.x - l.machine.x, l.start.y - l.machine.y);
    expect(echoState(d, false)).toBe('unvisited');
  });
});

describe('echoArrowAngle', () => {
  const view = { x: 0, y: 0, width: 320, height: 180 };

  it('is null when the machine is on screen', () => {
    expect(echoArrowAngle({ x: 100, y: 100 }, view)).toBeNull();
  });

  it('points right when the machine is off the right edge', () => {
    expect(echoArrowAngle({ x: 400, y: 90 }, view)).toBeCloseTo(0);
  });

  it('points down when the machine is below the view', () => {
    expect(echoArrowAngle({ x: 160, y: 400 }, view)).toBeCloseTo(Math.PI / 2);
  });
});
