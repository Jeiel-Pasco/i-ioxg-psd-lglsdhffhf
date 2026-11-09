import { describe, expect, it } from 'vitest';
import { loadEntryFiles } from '../../tools/validate-data';
import { PALETTE } from '../../src/sprites/palette';
import {
  MACHINE_SPRITES,
  ROBOT_JETPACK_PIXELS,
  ROBOT_PIXELS,
  ROBOT_WALK1_PIXELS,
  ROBOT_WALK2_PIXELS,
  machineKindForEntry,
  machinePixelsForEntry,
} from '../../src/sprites/entities';
import {
  CRATER_PIXELS,
  FLAME_PIXELS,
  MARS_TILE_PALETTE,
  MOON_TILE_PALETTE,
  PUFF_PIXELS,
  REGOLITH_TILE_PIXELS,
  ROCK_PIXELS,
} from '../../src/sprites/tiles';

describe('pixel art sprites (GDD 4.1, 4.3, 4.4)', () => {
  it('palette index 0 is transparent and all other entries are 24-bit hex numbers', () => {
    expect(PALETTE[0]).toBeNull();
    for (let i = 1; i < PALETTE.length; i++) {
      const c = PALETTE[i];
      expect(typeof c).toBe('number');
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(0xffffff);
    }
  });

  it('robot sprites and walk frames are 12x14 matrices with valid palette indices', () => {
    for (const mat of [ROBOT_PIXELS, ROBOT_WALK1_PIXELS, ROBOT_WALK2_PIXELS, ROBOT_JETPACK_PIXELS]) {
      expect(mat.length).toBe(14);
      for (const row of mat) {
        expect(row.length).toBe(12);
        for (const px of row) {
          expect(px).toBeGreaterThanOrEqual(0);
          expect(px).toBeLessThan(PALETTE.length);
        }
      }
    }
    expect(ROBOT_WALK1_PIXELS).not.toEqual(ROBOT_PIXELS);
    expect(ROBOT_WALK2_PIXELS).not.toEqual(ROBOT_WALK1_PIXELS);
  });

  it('props, thruster effects, and ground tiles have valid palette indices', () => {
    for (const mat of [CRATER_PIXELS, ROCK_PIXELS, FLAME_PIXELS, PUFF_PIXELS]) {
      for (const row of mat) {
        expect(row.length).toBe(mat[0].length);
        for (const px of row) {
          expect(px).toBeGreaterThanOrEqual(0);
          expect(px).toBeLessThan(PALETTE.length);
        }
      }
    }
    expect(REGOLITH_TILE_PIXELS.length).toBe(16);
    for (const row of REGOLITH_TILE_PIXELS) {
      expect(row.length).toBe(16);
      for (const px of row) {
        expect(px).toBeGreaterThanOrEqual(0);
        expect(px).toBeLessThan(MOON_TILE_PALETTE.length);
        expect(px).toBeLessThan(MARS_TILE_PALETTE.length);
      }
    }
  });

  it('every one of the 17 entries maps to a distinct hardware silhouette with valid palette indices', () => {
    const entries = loadEntryFiles('data/artifacts') as { id: string }[];
    expect(entries.length).toBe(17);
    const seenKinds = new Set<string>();
    for (const e of entries) {
      const kind = machineKindForEntry(e.id);
      seenKinds.add(kind);
      const mat = machinePixelsForEntry(e.id);
      expect(mat.length).toBeGreaterThanOrEqual(16);
      expect(mat[0].length).toBeGreaterThanOrEqual(16);
      for (const row of mat) {
        expect(row.length).toBe(mat[0].length);
        for (const px of row) {
          expect(px).toBeGreaterThanOrEqual(0);
          expect(px).toBeLessThan(PALETTE.length);
        }
      }
    }
    // All 5 hardware archetypes (lander, rover, probe, reflector, helicopter) are represented.
    expect(seenKinds).toEqual(new Set(Object.keys(MACHINE_SPRITES)));
  });
});

