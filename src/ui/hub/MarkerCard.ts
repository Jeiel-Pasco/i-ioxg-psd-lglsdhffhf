import text from '../../../data/text/en.json';
import type { Entry, EntryLocation } from '../../data/schema';
import { el, fill } from '../dom';

const t = text.hub;

export function formatCoords(loc: EntryLocation): string {
  const lat = loc.lat === 0 ? '0°' : `${Math.abs(loc.lat)}° ${loc.lat > 0 ? 'N' : 'S'}`;
  const lon = loc.lon === 0 ? '0°' : `${Math.abs(loc.lon)}° ${loc.lon > 0 ? 'E' : 'W'}`;
  return `${lat}, ${lon}${loc.approximate ? ` (${t.approximate})` : ''}`;
}

function statusText(entry: Entry): string {
  return entry.status === 'TODO' ? t.statusPending : t.status[entry.status];
}

/** Fills `card` with one marker's details. */
export function renderMarkerCard(
  card: HTMLElement,
  entry: Entry,
  index: number,
  opts: { locked: boolean; lockReasonId: string; onFly: () => void },
): void {
  const loc = entry.locations[index];
  card.replaceChildren();
  card.dataset.markerKey = `${entry.id}:${index}`;
  card.dataset.approximate = String(loc.approximate);

  const fly = el('button', 'hub-fly', t.flyHere);
  fly.type = 'button';
  fly.disabled = opts.locked;
  if (opts.locked) fly.setAttribute('aria-describedby', opts.lockReasonId);
  fly.addEventListener('click', opts.onFly);

  card.append(
    el('h2', '', entry.name),
    el('p', `hub-status hub-status--${entry.status === 'TODO' ? 'pending' : entry.status}`, statusText(entry)),
    el('p', 'hub-place', loc.label),
    el('p', 'hub-coords', formatCoords(loc)),
    fly,
  );
}

/** Fills `card` with the list of markers inside a cluster. */
export function renderClusterCard(
  card: HTMLElement,
  members: readonly { key: string; name: string; label: string }[],
  onPick: (key: string) => void,
): void {
  card.replaceChildren();
  delete card.dataset.markerKey;
  delete card.dataset.approximate;
  const list = el('ul', 'hub-cluster-list');
  for (const m of members) {
    const b = el('button', 'hub-cluster-member', fill(t.markerLabel, { name: m.name, label: m.label }));
    b.type = 'button';
    b.dataset.key = m.key;
    b.addEventListener('click', () => onPick(m.key));
    const li = el('li');
    li.append(b);
    list.append(li);
  }
  card.append(el('h2', '', fill(t.clusterTitle, { count: String(members.length) })), list);
}

/** Shows the empty prompt. */
export function renderEmptyCard(card: HTMLElement): void {
  card.replaceChildren(el('p', 'hub-hint', t.chooseMarker));
  delete card.dataset.markerKey;
  delete card.dataset.approximate;
}
