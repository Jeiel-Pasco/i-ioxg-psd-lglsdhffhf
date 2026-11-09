import { z } from 'zod';
import { LANDING, type Difficulty, type World } from '../config/landing';
import type { LandingParams } from './physics';

const Vec = z.object({ x: z.number(), y: z.number() });

/** One landing level file in data/levels/<id>.json (GDD 7.7). Distances in metres. */
export const LevelSchema = z.object({
  id: z.string().min(1),
  world: z.enum(['moon', 'mars']),
  difficulty: z.enum(['easy', 'normal', 'hard']),
  start: Vec,
  startVelocity: Vec,
  platform: z.object({ x: z.number(), width: z.number().positive() }),
  /** Seconds of thrust; written by tools/solve-levels.ts as a multiple of the solver route. */
  fuel: z.number().positive(),
});

export type Level = z.infer<typeof LevelSchema>;

/** A level with its physics and limits worked out, ready to play or solve. */
export interface ResolvedLevel {
  id: string;
  world: World;
  difficulty: Difficulty;
  assisted: boolean;
  params: LandingParams;
  start: { x: number; y: number; vx: number; vy: number };
  platform: { x: number; width: number };
  fuel: number;
  safeVertical: number;
  safeSideways: number;
  groundM: number;
  widthM: number;
}

export function resolveLevel(level: Level, opts: { assist?: boolean } = {}): ResolvedLevel {
  const d = LANDING.difficulty[level.difficulty];
  const g = LANDING.gravity[level.world];
  const thrustAccel = d.thrustRatio * g;
  const speedScale = level.world === 'mars' ? LANDING.marsSpeedScale : 1;
  const assist = opts.assist === true;
  return {
    id: level.id,
    world: level.world,
    difficulty: level.difficulty,
    assisted: assist,
    params: { g, thrustAccel, sideAccel: d.sideShare * thrustAccel, steerFuelShare: LANDING.steerFuelShare },
    start: { x: level.start.x, y: level.start.y, vx: level.startVelocity.x, vy: level.startVelocity.y },
    platform: {
      x: level.platform.x,
      width: level.platform.width * (assist ? LANDING.assist.platformScale : 1),
    },
    fuel: level.fuel * (assist ? LANDING.assist.fuelScale : 1),
    safeVertical: d.safeVertical * speedScale,
    safeSideways: d.safeSideways * speedScale,
    groundM: LANDING.groundM,
    widthM: LANDING.widthM,
  };
}
