// Site scene tuning (GDD 5.1, 6.3, 6.4). Plain data, no Phaser import, so unit tests can load it.
// D5 (proposed, not yet confirmed): eight-direction movement with a short ramp and a following camera.
export const SITE = {
  /** About three screens by three at the 320x180 internal resolution. */
  width: 960,
  height: 540,
  movement: {
    /** px per second. */
    maxSpeed: 90,
    /** px per second squared; full speed after maxSpeed / accel = 0.15 s. */
    accel: 600,
    /** px per second squared when no direction is held. */
    decel: 900,
    /** The robot's centre never gets closer than this to the scene edge. */
    edgePx: 8,
  },
  echo: {
    /** Within this distance (px) the echo is "near": faster pulse and edge arrow. */
    nearPx: 160,
    /** Within this distance (px) the machine can be recovered. */
    readyPx: 28,
    /** Pulse period in ms, far and near. */
    pulseFarMs: 1600,
    pulseNearMs: 600,
  },
  camera: {
    /** Follow easing; reduced motion uses 1 (no easing). */
    lerp: 0.12,
  },
  /** Joystick knob travel in CSS px, and the dead zone as a share of it. */
  joystick: { radiusPx: 48, deadZone: 0.15 },
  ground: { moon: 0x3b3f47, mars: 0x6e3220 },
  colors: { cyan: 0x4fd8ff, amber: 0xffbf5e, rock: 0x5a5f69, crater: 0x2c2f36, robot: 0xe8edf5, machine: 0xa9b4c6 },
} as const;
