import { LANDING } from '../config/landing';

// Float slack so 0.05 s counts as exactly 3 steps.
const EPS = 1e-9;

/** Fixed-timestep accumulator, separate from rendering (GDD 7.3). */
export class FixedStepper {
  private acc = 0;

  constructor(
    readonly dt = 1 / LANDING.stepsPerSecond,
    private readonly maxDelta: number = LANDING.maxFrameDelta,
  ) {}

  /**
   * Adds one frame's time (seconds, clamped to maxDelta) and runs whole steps.
   * `step` returns true to end the run; leftover time is then dropped.
   */
  advance(frameSeconds: number, step: () => boolean | void): number {
    this.acc += Math.min(Math.max(frameSeconds, 0), this.maxDelta);
    let n = 0;
    while (this.acc + EPS >= this.dt) {
      this.acc -= this.dt;
      n++;
      if (step() === true) {
        this.acc = 0;
        break;
      }
    }
    return n;
  }
}
