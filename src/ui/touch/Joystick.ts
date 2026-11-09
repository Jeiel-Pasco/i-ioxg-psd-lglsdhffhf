import { SITE } from '../../config/site';
import { el } from '../dom';

/**
 * Virtual joystick (GDD 6.2). Pointer events work for touch, pen and mouse.
 * It tracks one pointer, so another finger can press Recover at the same time.
 */
export class Joystick {
  readonly root = el('div', 'joystick');
  private readonly knob = el('div', 'joystick-knob');
  private pointer: number | null = null;

  constructor(
    label: string,
    private readonly onMove: (v: { x: number; y: number }) => void,
  ) {
    this.root.setAttribute('role', 'img');
    this.root.setAttribute('aria-label', label);
    this.root.append(this.knob);
    this.root.addEventListener('pointerdown', (e) => {
      if (this.pointer !== null) return;
      this.pointer = e.pointerId;
      this.root.setPointerCapture(e.pointerId);
      this.track(e);
    });
    this.root.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.pointer) this.track(e);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId === this.pointer) this.release();
    };
    this.root.addEventListener('pointerup', end);
    this.root.addEventListener('pointercancel', end);
  }

  release(): void {
    this.pointer = null;
    this.knob.style.transform = '';
    this.onMove({ x: 0, y: 0 });
  }

  private track(e: PointerEvent): void {
    const { radiusPx, deadZone } = SITE.joystick;
    const r = this.root.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > radiusPx) {
      dx = (dx / len) * radiusPx;
      dy = (dy / len) * radiusPx;
    }
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const v = len / radiusPx < deadZone ? { x: 0, y: 0 } : { x: dx / radiusPx, y: dy / radiusPx };
    this.onMove(v);
  }
}
