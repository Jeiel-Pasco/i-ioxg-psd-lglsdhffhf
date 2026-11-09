// Landing challenge tuning (GDD 7.3, 7.4). Plain data, no Phaser import, so unit tests and tools can load it.
// Every value here is a proposed starting value; play-testing will tune them.

export type Difficulty = 'easy' | 'normal' | 'hard';
export type World = 'moon' | 'mars';

export interface DifficultyParams {
  /** Thrust-to-gravity ratio r: a_t = r * g. */
  thrustRatio: number;
  /** Sideways acceleration as a share of a_t. */
  sideShare: number;
  /** Level fuel = fuelMultiplier * the fuel the solver bot's route uses. */
  fuelMultiplier: number;
  /** Safe landing speeds in m/s (Moon; Mars multiplies them by MARS_SPEED_SCALE). */
  safeVertical: number;
  safeSideways: number;
  /** Platform width in metres. */
  platformWidth: number;
}

export const LANDING = {
  /** Physics steps per second (fixed timestep). */
  stepsPerSecond: 60,
  /** Longest frame gap the accumulator accepts, in seconds (a hidden tab returns with a big gap). */
  maxFrameDelta: 0.25,
  /** 1 game metre = 8 px at the 320x180 internal resolution. */
  pxPerMetre: 8,
  /** Level area in metres (320x180 px). */
  widthM: 40,
  heightM: 22.5,
  /** Ground line in metres from the top. */
  groundM: 20,
  /**
   * Gravity in m/s^2. TODO: cite a NASA page before these numbers are shown to players
   * (CLAUDE.md, Landing challenge physics). They are not shown anywhere yet.
   */
  gravity: { moon: 1.62, mars: 3.71 } satisfies Record<World, number>,
  /** Steering uses fuel at this share of the thrust rate. */
  steerFuelShare: 0.5,
  difficulty: {
    easy: { thrustRatio: 2.6, sideShare: 0.5, fuelMultiplier: 1.5, safeVertical: 2.5, safeSideways: 2.0, platformWidth: 8 },
    normal: { thrustRatio: 2.2, sideShare: 0.45, fuelMultiplier: 1.35, safeVertical: 2.0, safeSideways: 1.5, platformWidth: 6 },
    hard: { thrustRatio: 1.9, sideShare: 0.4, fuelMultiplier: 1.2, safeVertical: 1.5, safeSideways: 1.0, platformWidth: 4 },
  } satisfies Record<Difficulty, DifficultyParams>,
  /** Mars safe speeds are multiplied by this, so Mars is as fair as the Moon (GDD 7.4). */
  marsSpeedScale: 1.51,
  assist: {
    /** Assist gives this much more fuel (+25%). */
    fuelScale: 1.25,
    /** Assist widens the platform by this factor. */
    platformScale: 1.5,
    /** Assist and Skip appear after this many failures in a row. */
    afterFailures: 3,
  },
} as const;

export const MARS_SPEED_SCALE = LANDING.marsSpeedScale;
