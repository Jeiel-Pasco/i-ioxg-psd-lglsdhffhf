import type { EchoState } from '../systems/echo';
import type { Outcome } from '../systems/outcome';
import type { Input } from '../systems/physics';

// Typed event bus: modules talk through events, never direct references.
export const Events = {
  HUB_FLY: 'hub:fly',
  ENTRY_RECOVERED: 'entry:recovered',
  SITE_MOVE: 'site:move',
  SITE_INTERACT: 'site:interact',
  SITE_LEAVE: 'site:leave',
  SITE_ECHO: 'site:echo',
  SITE_LAND: 'site:land',
  LANDING_INPUT: 'landing:input',
  LANDING_TICK: 'landing:tick',
  LANDING_RESULT: 'landing:result',
} as const;

export interface EventPayloads {
  'hub:fly': { entryId: string; markerIndex: number };
  /** A landing or visit finished; `assisted` is saved but never shown in the Archive. */
  'entry:recovered': { entryId: string; assisted: boolean };
  /** Touch joystick direction, each axis -1..1 (the keyboard is read inside the scene). */
  'site:move': { x: number; y: number };
  /** The on-screen Recover button. */
  'site:interact': Record<string, never>;
  /** Back to the hub map (Map button or M). */
  'site:leave': Record<string, never>;
  /** The echo state changed, for the DOM HUD. */
  'site:echo': { state: EchoState };
  /** The robot is ready to start a jetpack landing (M5 listens). */
  'site:land': { entryId: string };
  /** On-screen jetpack buttons held right now (the keyboard is read inside the scene). */
  'landing:input': Input;
  /** About 10 times a second while flying, for the DOM meters. */
  'landing:tick': { fuel: number; fuelMax: number; vx: number; vy: number };
  /** The landing run ended. A failure never touches the save. */
  'landing:result': { entryId: string; outcome: Outcome };
}

type EventName = keyof EventPayloads;

class EventBus {
  private readonly target = new EventTarget();

  /** Subscribes and returns the unsubscribe function (call it on shutdown). */
  on<K extends EventName>(type: K, handler: (payload: EventPayloads[K]) => void): () => void {
    const listener = (e: Event) => handler((e as CustomEvent<EventPayloads[K]>).detail);
    this.target.addEventListener(type, listener);
    return () => this.target.removeEventListener(type, listener);
  }

  emit<K extends EventName>(type: K, payload: EventPayloads[K]): void {
    this.target.dispatchEvent(new CustomEvent(type, { detail: payload }));
  }
}

export const eventBus = new EventBus();
