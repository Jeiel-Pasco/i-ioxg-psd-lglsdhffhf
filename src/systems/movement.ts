import { SITE } from '../config/site';

export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Vec {
  x: number;
  y: number;
}

/** One step of eight-direction movement with an acceleration ramp, kept inside the scene. */
export function stepMovement(
  b: Body,
  input: Vec,
  dt: number,
  bounds: { width: number; height: number },
  cfg: typeof SITE.movement = SITE.movement,
): Body {
  const len = Math.hypot(input.x, input.y);
  const dir = len > 1 ? { x: input.x / len, y: input.y / len } : input;
  const target = { x: dir.x * cfg.maxSpeed, y: dir.y * cfg.maxSpeed };
  const rate = (len > 0 ? cfg.accel : cfg.decel) * dt;

  // Move the velocity toward the target by at most `rate`, as one vector so diagonals stay even.
  const dvx = target.x - b.vx;
  const dvy = target.y - b.vy;
  const dlen = Math.hypot(dvx, dvy);
  const k = dlen <= rate ? 1 : rate / dlen;
  let vx = b.vx + dvx * k;
  let vy = b.vy + dvy * k;

  let x = b.x + vx * dt;
  let y = b.y + vy * dt;
  const e = cfg.edgePx;
  if (x < e || x > bounds.width - e) {
    x = Math.min(Math.max(x, e), bounds.width - e);
    vx = 0;
  }
  if (y < e || y > bounds.height - e) {
    y = Math.min(Math.max(y, e), bounds.height - e);
    vy = 0;
  }
  return { x, y, vx, vy };
}
