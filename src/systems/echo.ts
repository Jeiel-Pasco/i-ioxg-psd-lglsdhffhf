import { SITE } from '../config/site';

export type EchoState = 'unvisited' | 'near' | 'ready' | 'archived';

export interface EchoThresholds {
  nearPx: number;
  readyPx: number;
}

/** GDD 6.4. A recovered machine is always "archived"; it is never removed from the scene. */
export function echoState(dist: number, recovered: boolean, t: EchoThresholds = SITE.echo): EchoState {
  if (recovered) return 'archived';
  if (dist <= t.readyPx) return 'ready';
  if (dist <= t.nearPx) return 'near';
  return 'unvisited';
}

interface Point {
  x: number;
  y: number;
}

interface View extends Point {
  width: number;
  height: number;
}

/** Angle (radians, y down) from the view centre to the machine, or null if the machine is on screen. */
export function echoArrowAngle(machine: Point, view: View): number | null {
  const inside =
    machine.x >= view.x && machine.x <= view.x + view.width && machine.y >= view.y && machine.y <= view.y + view.height;
  if (inside) return null;
  return Math.atan2(machine.y - (view.y + view.height / 2), machine.x - (view.x + view.width / 2));
}
