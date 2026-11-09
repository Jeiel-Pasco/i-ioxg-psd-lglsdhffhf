// Landing physics (GDD 7.3). Pure TypeScript, no Phaser. Units: metres, seconds; y points down.

export interface LanderState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds of thrust left. */
  fuel: number;
}

export interface Input {
  thrust: 0 | 1;
  steer: -1 | 0 | 1;
}

export interface LandingParams {
  g: number;
  /** a_t = r * g. */
  thrustAccel: number;
  /** a_h, sideways acceleration. */
  sideAccel: number;
  /** Steering burns fuel at this share of the thrust rate. */
  steerFuelShare: number;
}

/**
 * One fixed step: v_y += (g - a_t T) dt, v_x += a_h S dt, then position from the new velocity.
 * With an empty tank, thrust and steering do nothing.
 */
export function stepPhysics(s: LanderState, input: Input, p: LandingParams, dt = 1 / 60): LanderState {
  const hasFuel = s.fuel > 0;
  const T = hasFuel ? input.thrust : 0;
  const S = hasFuel ? input.steer : 0;
  const vy = s.vy + (p.g - p.thrustAccel * T) * dt;
  const vx = s.vx + p.sideAccel * S * dt;
  const burn = (T + p.steerFuelShare * Math.abs(S)) * dt;
  return { x: s.x + vx * dt, y: s.y + vy * dt, vx, vy, fuel: Math.max(0, s.fuel - burn) };
}
