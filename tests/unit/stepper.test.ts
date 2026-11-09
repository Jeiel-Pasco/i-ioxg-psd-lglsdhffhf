import { describe, expect, it } from 'vitest';
import { LANDING } from '../../src/config/landing';
import { FixedStepper } from '../../src/systems/stepper';

describe('FixedStepper', () => {
  it('runs one step per 1/60 s and keeps the remainder', () => {
    const st = new FixedStepper();
    let n = 0;
    expect(st.advance(1 / 120, () => void n++)).toBe(0);
    expect(st.advance(1 / 120 + 1e-9, () => void n++)).toBe(1);
    expect(st.advance(0.05, () => void n++)).toBe(3);
    expect(n).toBe(4);
  });

  it('clamps large frame delta', () => {
    const st = new FixedStepper();
    let n = 0;
    // A hidden tab comes back with a 5 s gap: only maxFrameDelta worth of steps run.
    const steps = st.advance(5, () => void n++);
    expect(steps).toBe(Math.round(LANDING.maxFrameDelta * LANDING.stepsPerSecond));
    expect(n).toBe(steps);
  });

  it('stops early when a step reports the run is over', () => {
    const st = new FixedStepper();
    let n = 0;
    expect(st.advance(0.25, () => ++n === 2)).toBe(2);
    // The leftover time is dropped, so nothing runs on the next small frame.
    expect(st.advance(0, () => void n++)).toBe(0);
  });

  it('gives the same steps for the same frames', () => {
    const frames = [0.016, 0.033, 0.2, 5, 0.001, 0.017];
    const count = () => {
      const st = new FixedStepper();
      return frames.map((f) => st.advance(f, () => undefined));
    };
    expect(count()).toEqual(count());
  });
});
