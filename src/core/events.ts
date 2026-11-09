// Typed event bus: modules talk through events, never direct references.
export const Events = {
  HUB_FLY: 'hub:fly',
} as const;

export interface EventPayloads {
  'hub:fly': { entryId: string; markerIndex: number };
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
