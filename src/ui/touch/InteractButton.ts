import { el } from '../dom';

/** Large Recover button (GDD 6.2). Enabled only when the echo is ready. */
export class InteractButton {
  readonly root = el('button', 'interact-button');

  constructor(label: string, onPress: () => void) {
    this.root.type = 'button';
    this.root.textContent = label;
    this.root.disabled = true;
    this.root.addEventListener('click', onPress);
  }

  setReady(ready: boolean): void {
    this.root.disabled = !ready;
  }
}
