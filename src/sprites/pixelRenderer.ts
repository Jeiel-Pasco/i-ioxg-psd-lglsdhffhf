import type { Scene } from 'phaser';
import { PALETTE } from './palette';
import {
  MACHINE_SPRITES,
  ROBOT_JETPACK_PIXELS,
  ROBOT_PIXELS,
  machineKindForEntry,
  type MachineKind,
  type PixelMatrix,
} from './entities';

export const ROBOT_SITE_TEX = 'site-robot';
export const ROBOT_LANDING_TEX = 'landing-robot';

export function machineTextureKey(entryId: string): string {
  return `machine-${machineKindForEntry(entryId)}`;
}

/**
 * Renders a 2D pixel matrix into a Phaser texture using the shared palette (GDD 4.1).
 * Index 0 is transparent.
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
      const color = idx ? palette[idx] : null;
      if (color === null || color === undefined) continue;
      g.fillStyle(color, 1);
      g.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  g.generateTexture(key, w * scale, h * scale);
  g.destroy();
}

/** Registers the top-down robot, jetpack robot, and all 5 hardware archetype textures on `scene`. */
export function ensureEntityTextures(scene: Scene): void {
  renderPixelArt(scene, ROBOT_PIXELS, ROBOT_SITE_TEX, 1);
  renderPixelArt(scene, ROBOT_JETPACK_PIXELS, ROBOT_LANDING_TEX, 1);
  for (const kind of Object.keys(MACHINE_SPRITES) as MachineKind[]) {
    renderPixelArt(scene, MACHINE_SPRITES[kind], `machine-${kind}`, 1);
  }
}

