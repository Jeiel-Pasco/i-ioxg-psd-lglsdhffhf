import text from '../../../data/text/en.json';
import { Events, eventBus } from '../../core/events';
import { el } from '../dom';
import { InteractButton } from '../touch/InteractButton';
import { Joystick } from '../touch/Joystick';
import '../styles/site.css';

const t = text.site;

/** DOM controls over the site scene: Map button, echo status, joystick and Recover button. */
export class SiteHud {
  private readonly root = el('div', 'site-ui');
  private readonly status = el('p', 'site-status');
  private readonly joystick = new Joystick(t.joystick, (v) => eventBus.emit(Events.SITE_MOVE, v));
  private readonly interact = new InteractButton(t.interact, () => eventBus.emit(Events.SITE_INTERACT, {}));

  constructor(parent: HTMLElement, onSettings: (opener: HTMLElement) => void) {
    // GDD 9.1: pause and settings top left, world map top right.
    const settings = el('button', 'site-settings', text.settings.open);
    settings.type = 'button';
    settings.addEventListener('click', () => onSettings(settings));
    const map = el('button', 'site-map', t.map);
    map.type = 'button';
    map.addEventListener('click', () => eventBus.emit(Events.SITE_LEAVE, {}));
    this.status.setAttribute('role', 'status');
    const story = el('div', 'story-frame site-story');
    story.append(el('span', 'story-tag', text.story.tag), this.status);
    const top = el('div', 'site-top');
    top.append(settings, story, map);
    const bottom = el('div', 'site-bottom');
    bottom.append(this.joystick.root, this.interact.root);
    this.root.append(top, bottom);
    this.root.hidden = true;
    parent.append(this.root);

    eventBus.on(Events.SITE_ECHO, ({ state }) => {
      this.root.dataset.echo = state;
      this.status.textContent = t.echo[state];
      this.interact.setReady(state === 'ready');
    });
  }

  show(): void {
    this.root.hidden = false;
  }

  hide(): void {
    this.root.hidden = true;
    this.joystick.release();
    this.interact.setReady(false);
  }
}
