import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { AudioSystem } from '../../src/systems/audio';

interface MockEl {
  tagName: string;
  className: string;
  textContent: string;
  hidden: boolean;
  setAttribute(name: string, val: string): void;
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  append(...nodes: unknown[]): void;
}

function createMockElement(tag: string): MockEl {
  const attrs = new Map<string, string>();
  const children: unknown[] = [];
  return {
    tagName: tag.toUpperCase(),
    className: '',
    textContent: '',
    hidden: false,
    setAttribute(name: string, val: string) {
      attrs.set(name, val);
    },
    getAttribute(name: string) {
      return attrs.get(name) ?? null;
    },
    hasAttribute(name: string) {
      return attrs.has(name) || (name === 'hidden' && this.hidden);
    },
    append(...nodes: unknown[]) {
      children.push(...nodes);
    },
  };
}

describe('AudioSystem', () => {
  beforeEach(() => {
    if (typeof globalThis.document === 'undefined') {
      const body = createMockElement('body');
      (globalThis as unknown as { document: unknown }).document = {
        createElement: (tag: string) => createMockElement(tag),
        body,
      };
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes caption element with accessibility attributes', () => {
    const audio = new AudioSystem();
    const caption = audio.captionElement;
    expect(caption).not.toBeNull();
    expect(caption?.getAttribute('role')).toBe('status');
    expect(caption?.getAttribute('aria-live')).toBe('polite');
    expect(caption?.hidden).toBe(true);
  });

  it('displays captions when captions are enabled', () => {
    const audio = new AudioSystem();
    const caption = audio.captionElement!;
    audio.updateSettings({ audio: false, captions: true });

    audio.openingBoot();
    expect(caption.hidden).toBe(false);
    expect(caption.textContent).toContain('Faint electronic hum');

    audio.echoNear();
    expect(caption.hidden).toBe(false);
    expect(caption.textContent).toContain('Echo pulse detected');

    audio.echoReady();
    expect(caption.textContent).toContain('Echo signal locked');

    audio.landed();
    expect(caption.textContent).toContain('Soft touchdown');

    audio.crash();
    expect(caption.textContent).toContain('Hard impact');

    audio.recovered();
    expect(caption.textContent).toContain('Archive record restored');
  });

  it('suppresses captions when captions are disabled', () => {
    const audio = new AudioSystem();
    const caption = audio.captionElement!;
    audio.updateSettings({ audio: false, captions: false });

    audio.echoNear();
    expect(caption.hidden).toBe(true);
  });

  it('runs audio methods safely without throwing in headless/Node environment', () => {
    const audio = new AudioSystem();
    audio.updateSettings({ audio: true, captions: true });
    expect(() => {
      audio.echoNear();
      audio.echoReady();
      audio.startThrust();
      audio.stopThrust();
      audio.landed();
      audio.crash();
      audio.recovered();
      audio.stopAll();
    }).not.toThrow();
  });

  it('stops thrust when audio setting is toggled off', () => {
    const audio = new AudioSystem();
    audio.updateSettings({ audio: true, captions: true });
    audio.startThrust();
    const stopSpy = vi.spyOn(audio, 'stopThrust');
    audio.updateSettings({ audio: false, captions: true });
    expect(stopSpy).toHaveBeenCalled();
  });
});
