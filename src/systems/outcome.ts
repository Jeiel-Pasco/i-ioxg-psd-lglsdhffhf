import type { ResolvedLevel } from './level';
import type { LanderState } from './physics';

export type Outcome = 'landed' | 'too_fast' | 'missed' | 'no_fuel';

/** Landing conditions (GDD 7.5). Null while the robot is still flying. */
export function landingOutcome(s: LanderState, level: ResolvedLevel): Outcome | null {
  if (s.y >= level.groundM) {
    const onPlatform = Math.abs(s.x - level.platform.x) <= level.platform.width / 2;
    if (!onPlatform) return 'missed';
    if (Math.abs(s.vy) > level.safeVertical || Math.abs(s.vx) > level.safeSideways) return 'too_fast';
    return 'landed';
  }
  if (s.x < 0 || s.x > level.widthM) return 'missed';
  if (s.fuel <= 0) return 'no_fuel';
  return null;
}
