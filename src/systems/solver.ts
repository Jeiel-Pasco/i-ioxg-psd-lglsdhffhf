// Solver bot (GDD 7.7): searches burn timings for a route that lands, and picks the one using the
// least fuel. Level fuel is then set as a multiple of that route (tools/solve-levels.ts).
import { landingOutcome, type Outcome } from './outcome';
import type { ResolvedLevel } from './level';
import { stepPhysics, type Input, type LanderState, type LandingParams } from './physics';

const DT = 1 / 60;
/** Give up on a route after this many steps (60 s). */
const MAX_STEPS = 3600;
const NONE: Input = { thrust: 0, steer: 0 };

export interface SimResult {
  outcome: Outcome | null;
  state: LanderState;
  steps: number;
}

export function startState(level: ResolvedLevel): LanderState {
  return { ...level.start, fuel: level.fuel };
}

/** Plays a route step by step; after the route ends, no buttons are held. */
export function simulate(level: ResolvedLevel, route: readonly Input[]): SimResult {
  let s = startState(level);
  for (let i = 0; i < MAX_STEPS; i++) {
    s = stepPhysics(s, route[i] ?? NONE, level.params, DT);
    const outcome = landingOutcome(s, level);
    if (outcome) return { outcome, state: s, steps: i + 1 };
  }
  return { outcome: null, state: s, steps: MAX_STEPS };
}

/** Fuel (seconds of thrust) a route burns, ignoring the tank size. */
export function fuelUsed(route: readonly Input[], p: LandingParams): number {
  return route.reduce((sum, i) => sum + (i.thrust + p.steerFuelShare * Math.abs(i.steer)) * DT, 0);
}

interface Plan {
  /** Top sideways cruise speed, m/s. */
  cruise: number;
  /** Share of the hardest safe braking curve to follow when descending. */
  brake: number;
  /** Hold this height (m) above the ground until the robot is over the platform. */
  guard: number;
}

/** Turns one plan into button presses by flying it; returns the route only if it lands. */
function fly(level: ResolvedLevel, plan: Plan): Input[] | null {
  const p = level.params;
  const halfW = level.platform.width / 2;
  const vLand = 0.5 * level.safeVertical;
  const curve = plan.brake * Math.sqrt(2 * (p.thrustAccel - p.g));
  const route: Input[] = [];
  let s = startState(level);
  for (let i = 0; i < MAX_STEPS; i++) {
    const dx = level.platform.x - s.x;
    const h = level.groundM - s.y;
    // Sideways: speed up toward the platform, then brake so the speed is near zero on arrival.
    const wantVx = Math.sign(dx) * Math.min(plan.cruise, Math.sqrt(p.sideAccel * Math.abs(dx)));
    const steer: Input['steer'] = s.vx < wantVx - 0.05 ? 1 : s.vx > wantVx + 0.05 ? -1 : 0;
    // Down: fall freely, then follow a braking curve; hover at the guard height until over the platform.
    const over = Math.abs(dx) < halfW * 0.5 && Math.abs(s.vx) < level.safeSideways * 0.5;
    const room = over ? h : h - plan.guard;
    const wantVy = room > 0 ? vLand + curve * Math.sqrt(room) : 0;
    const input: Input = { thrust: s.vy > wantVy ? 1 : 0, steer };
    route.push(input);
    s = stepPhysics(s, input, p, DT);
    const outcome = landingOutcome(s, level);
    if (outcome) return outcome === 'landed' ? route : null;
  }
  return null;
}

const CRUISE = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6];
const BRAKE = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
const GUARD = [1, 2, 4];

/** The landing route with the least fuel among the searched plans, or null if none lands. */
export function solve(level: ResolvedLevel): Input[] | null {
  let best: Input[] | null = null;
  let bestFuel = Infinity;
  for (const cruise of CRUISE) {
    for (const brake of BRAKE) {
      for (const guard of GUARD) {
        const route = fly(level, { cruise, brake, guard });
        if (!route) continue;
        const used = fuelUsed(route, level.params);
        if (used < bestFuel) {
          best = route;
          bestFuel = used;
        }
      }
    }
  }
  return best;
}
