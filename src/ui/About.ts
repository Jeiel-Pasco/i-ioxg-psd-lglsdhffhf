import text from '../../data/text/en.json';
import { el } from './dom';
import './styles/a11y.css';

const t = text.about;

/** About screen (GDD 3.6): explains the "Game story" and "Verified record" frames in one short page. */
export class About {
  private readonly dialog = el('dialog', 'about');
  private opener: HTMLElement | null = null;

  /** `onOpenChange` runs after the dialog opens or closes. */
  constructor(private readonly onOpenChange: () => void) {
    this.dialog.setAttribute('aria-labelledby', 'about-title');
    const title = el('h1', '', t.title);
    title.id = 'about-title';
    const close = el('button', 'dialog-button about-close', t.close);
    close.type = 'button';
    close.addEventListener('click', () => this.dialog.close());
    const head = el('header', 'dialog-head');
    head.append(title, close);

    const story = el('div', 'story-frame');
    story.append(el('span', 'story-tag', t.storyTag), el('p', '', t.story));
    const record = el('div', 'record-frame');
    record.append(el('span', 'story-tag', t.recordTag), el('p', '', t.record));

    this.dialog.append(head, el('p', '', t.intro), story, record, el('p', '', t.privacy));
    this.dialog.addEventListener('close', () => {
      // Focus goes back to whatever opened the screen, if it is still on screen.
      if (this.opener?.isConnected && this.opener.offsetParent !== null) this.opener.focus();
      this.onOpenChange();
    });
    document.body.append(this.dialog);
  }

  open(opener: HTMLElement | null): void {
    if (this.dialog.open) return;
    this.opener = opener;
    this.dialog.showModal();
    this.onOpenChange();
  }
}
