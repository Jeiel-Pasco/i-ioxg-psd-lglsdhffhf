import { describe, expect, it } from 'vitest';
import { DISPLAY } from '../../src/config/display';

describe('display config', () => {
  it('uses the GDD internal resolution of 320 by 180 (GDD 7.3, 11.3)', () => {
    expect(DISPLAY.width).toBe(320);
    expect(DISPLAY.height).toBe(180);
  });

  it('renders pixel art without smoothing', () => {
    expect(DISPLAY.pixelArt).toBe(true);
  });
});
