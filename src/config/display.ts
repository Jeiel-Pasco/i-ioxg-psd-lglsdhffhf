// Internal render resolution and look (GDD 7.3, 11.3). Plain data, no Phaser import,
// so unit tests can load it in Node.
export const DISPLAY = {
  width: 320,
  height: 180,
  pixelArt: true,
  backgroundColor: '#05070d',
  parentId: 'game-container',
} as const;
