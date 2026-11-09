import { describe, expect, it } from 'vitest';
import { clusterMarkers, markerPoints, project, type MarkerPoint } from '../../src/ui/hub/markers';
import { isMarsUnlocked } from '../../src/systems/unlock';
import { EntrySchema, type Entry } from '../../src/data/schema';
import { loadEntryFiles } from '../../tools/validate-data';

const entries: Entry[] = loadEntryFiles('data/artifacts').map((e) => EntrySchema.parse(e));
const moon = entries.filter((e) => e.world === 'moon');
const mars = entries.filter((e) => e.world === 'mars');

function point(key: string, x: number, y: number): MarkerPoint {
  return { key, entryId: key, index: 0, x, y };
}

function clusterOf(clusters: ReturnType<typeof clusterMarkers>, key: string): string[] {
  const c = clusters.find((cl) => cl.members.some((m) => m.key === key));
  return (c?.members ?? []).map((m) => m.key).sort();
}

describe('project (equirectangular)', () => {
  it('maps the north-west corner to 0,0', () => {
    expect(project(90, -180, 1000, 500)).toEqual({ x: 0, y: 0 });
  });
  it('maps the south-east corner to w,h', () => {
    expect(project(-90, 180, 1000, 500)).toEqual({ x: 1000, y: 500 });
  });
  it('maps 0,0 to the centre', () => {
    expect(project(0, 0, 1000, 500)).toEqual({ x: 500, y: 250 });
  });
  it('puts east longitudes right of centre and south latitudes below it', () => {
    const p = project(-10, 20, 1000, 500);
    expect(p.x).toBeGreaterThan(500);
    expect(p.y).toBeGreaterThan(250);
  });
});

describe('markerPoints', () => {
  it('gives 10 Moon and 11 Mars markers with unique keys', () => {
    const m = markerPoints(moon, 1000, 500);
    const r = markerPoints(mars, 1000, 500);
    expect(m).toHaveLength(10);
    expect(r).toHaveLength(11);
    expect(new Set([...m, ...r].map((p) => p.key)).size).toBe(21);
  });
});

describe('clusterMarkers', () => {
  it('groups points within the radius and keeps points beyond it apart', () => {
    const c = clusterMarkers([point('a', 0, 0), point('b', 43, 0), point('c', 45, 0)], 44);
    expect(clusterOf(c, 'a')).toEqual(['a', 'b']);
    expect(clusterOf(c, 'c')).toEqual(['c']);
  });

  it('keeps every cluster anchor at least the radius from every other', () => {
    const pts = markerPoints(moon, 328, 164);
    const c = clusterMarkers(pts, 44);
    for (const a of c) for (const b of c) {
      if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(44);
    }
  });

  it('never loses a marker', () => {
    const pts = markerPoints(moon, 328, 164);
    expect(clusterMarkers(pts, 44).flatMap((c) => c.members)).toHaveLength(10);
  });

  it('clusters Surveyor 3 with the Apollo 12 descent stage', () => {
    const c = clusterMarkers(markerPoints(moon, 1000, 500), 44);
    expect(clusterOf(c, 'surveyor-3:0')).toEqual(expect.arrayContaining(['apollo-12-site:0', 'surveyor-3:0']));
  });

  it('clusters the identical Ingenuity and Perseverance placeholders', () => {
    const c = clusterMarkers(markerPoints(mars, 1000, 500), 44);
    expect(clusterOf(c, 'ingenuity:0')).toEqual(['ingenuity:0', 'perseverance-landing-hardware:0']);
  });

  it('keeps Apollo 11 and Apollo 17 apart on a wide map', () => {
    const c = clusterMarkers(markerPoints(moon, 1000, 500), 44);
    expect(clusterOf(c, 'apollo-11-site:0')).not.toContain('apollo-17-site:0');
  });
});

describe('isMarsUnlocked (D4 proposal: the three Moon flagships)', () => {
  it('is locked with nothing archived', () => {
    expect(isMarsUnlocked(new Set())).toBe(false);
  });
  it('is locked with two of three flagships', () => {
    expect(isMarsUnlocked(new Set(['apollo-11-site', 'surveyor-3']))).toBe(false);
  });
  it('unlocks with all three flagships', () => {
    expect(isMarsUnlocked(new Set(['apollo-11-site', 'apollo-15-lrv', 'surveyor-3']))).toBe(true);
  });
});
