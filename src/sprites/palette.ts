/**
 * Shared 16-bit pixel art palette (GDD 4.2).
 * Index 0 is always transparent; every sprite matrix indexes into this array.
 */
export const PALETTE: readonly (number | null)[] = [
  null, // 0: transparent
  0x0e1320, // 1: dark outline / deep shadow
  0x3b3f47, // 2: dark stone / treads / landing gear
  0x6f7785, // 3: mid steel / structural struts
  0xa9b4c6, // 4: silver hardware body
  0xe8edf5, // 5: bright white shell / highlight
  0x4fd8ff, // 6: cyan visor / optical prism glint
  0xffbf5e, // 7: warm amber / gold thermal foil
  0xc87d32, // 8: shaded gold foil
  0x2a5c8a, // 9: solar array blue
  0xff8a5c, // 10: muted orange thruster / warning accent
] as const;

