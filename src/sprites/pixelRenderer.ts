import type { Scene } from 'phaser';
import { PALETTE } from './palette';
import {
  MACHINE_SPRITES,
  ROBOT_JETPACK_PIXELS,
  ROBOT_PIXELS,
  ROBOT_WALK1_PIXELS,
  ROBOT_WALK2_PIXELS,
  machineKindForEntry,
  type MachineKind,
  type PixelMatrix,
} from './entities';
import {
  CRATER_PIXELS,
  FLAME_PIXELS,
  MARS_TILE_PALETTE,
  MOON_TILE_PALETTE,
  PUFF_PIXELS,
  REGOLITH_TILE_PIXELS,
  ROCK_PIXELS,
} from './tiles';

export const ROBOT_SITE_TEX = 'site-robot';
export const ROBOT_WALK1_TEX = 'site-robot-walk1';
export const ROBOT_WALK2_TEX = 'site-robot-walk2';
export const ROBOT_SITE_FRAMES = [ROBOT_SITE_TEX, ROBOT_WALK1_TEX, ROBOT_SITE_TEX, ROBOT_WALK2_TEX] as const;

export const ROBOT_LANDING_TEX = 'landing-robot';
export const PROP_CRATER_TEX = 'prop-crater';
export const PROP_ROCK_TEX = 'prop-rock';
export const FX_FLAME_TEX = 'fx-flame';
export const FX_PUFF_TEX = 'fx-puff';

export function machineTextureKey(entryId: string): string {
  return `machine-${machineKindForEntry(entryId)}`;
}

export function groundTileTextureKey(world: 'moon' | 'mars'): string {
  return `tile-ground-${world}`;
}

/**
 * Renders a 2D pixel matrix into a Phaser texture using the shared palette (GDD 4.1).
 * Index 0 is transparent unless `palette[0]` defines an opaque base color.
 */
export function renderPixelArt(
  scene: Scene,
  pixels: PixelMatrix,
  key: string,
  scale = 1,
  palette: readonly (number | null)[] = PALETTE,
): void {
  if (scene.textures.exists(key)) return;
  const h = pixels.length;
  const w = pixels[0]?.length ?? 0;
  const g = scene.make.graphics({}, false);
  for (let y = 0; y < h; y++) {
    const row = pixels[y];
    for (let x = 0; x < w; x++) {
      const idx = row[x];
      const color = palette[idx];
      if (color === null || color === undefined) continue;
      g.fillStyle(color, 1);
      g.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  g.generateTexture(key, w * scale, h * scale);
  g.destroy();
}

/** Registers robot frames, 5 hardware archetypes, surface props, thruster effects, and ground tiles on `scene`. */
export function ensureEntityTextures(scene: Scene): void {
  renderPixelArt(scene, ROBOT_PIXELS, ROBOT_SITE_TEX, 1);
  renderPixelArt(scene, ROBOT_WALK1_PIXELS, ROBOT_WALK1_TEX, 1);
  renderPixelArt(scene, ROBOT_WALK2_PIXELS, ROBOT_WALK2_TEX, 1);
  renderPixelArt(scene, ROBOT_JETPACK_PIXELS, ROBOT_LANDING_TEX, 1);
  for (const kind of Object.keys(MACHINE_SPRITES) as MachineKind[]) {
    renderPixelArt(scene, MACHINE_SPRITES[kind], `machine-${kind}`, 1);
  }
  renderPixelArt(scene, CRATER_PIXELS, PROP_CRATER_TEX, 1);
  renderPixelArt(scene, ROCK_PIXELS, PROP_ROCK_TEX, 1);
  renderPixelArt(scene, FLAME_PIXELS, FX_FLAME_TEX, 1);
  renderPixelArt(scene, PUFF_PIXELS, FX_PUFF_TEX, 1);
  renderPixelArt(scene, REGOLITH_TILE_PIXELS, groundTileTextureKey('moon'), 1, MOON_TILE_PALETTE);
  renderPixelArt(scene, REGOLITH_TILE_PIXELS, groundTileTextureKey('mars'), 1, MARS_TILE_PALETTE);
}
