import text from '../../../data/text/en.json';
import { TODO, type Entry } from '../../data/schema';
import { el, fill } from '../dom';
import { formatCoords } from '../hub/MarkerCard';

const t = text.archive;
const hub = text.hub;

/** Text from the data file, or a plain "not yet written" note while it is still TODO. */
function value(s: string): string {
  return s === TODO || s.trim() === '' ? t.pending : s;
}

function isUrl(s: string): boolean {
  return s !== TODO && /^https?:\/\//.test(s);
}

/** A link to a source page (opened by the player; the game itself never fetches it). */
function sourceLink(url: string, label: string): HTMLElement {
  if (!isUrl(url)) return el('span', 'entry-pending', t.noSources);
  const a = el('a', 'entry-link', label);
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}

function section(name: string, heading?: string): HTMLElement {
  const s = el('section', `entry-${name}`);
  s.dataset.section = name;
  if (heading) s.append(el('h3', '', heading));
  return s;
}

function dateList(d: Entry['launch_date']): string {
  return (Array.isArray(d) ? d : [d]).map(value).join(', ');
}

/** Image path for a NASA image downloaded at build time by tools/fetch-assets.ts. */
function imageSrc(nasaId: string): string {
  return `${import.meta.env.BASE_URL}assets/archive/${encodeURIComponent(nasaId)}.jpg`;
}

/** Renders one entry in the GDD 8.2 order, inside an amber "Verified record" frame. */
export function renderEntryPage(root: HTMLElement, entry: Entry): void {
  root.replaceChildren();
  root.className = 'entry record-frame';
  root.dataset.id = entry.id;

  const header = section('header');
  const tag = el('p', 'record-tag', t.verifiedTag);
  const status = el(
    'span',
    `hub-status hub-status--${entry.status === TODO ? 'pending' : entry.status}`,
    entry.status === TODO ? hub.statusPending : hub.status[entry.status],
  );
  header.append(tag, el('h2', '', entry.name), status, ' ', el('span', 'entry-world', hub.worlds[entry.world]));

  const image = section('image');
  const { nasa_id, credit, alt, source_url } = entry.image;
  if (nasa_id !== TODO && alt !== TODO && alt.trim() !== '') {
    const fig = el('figure');
    const img = el('img');
    img.src = imageSrc(nasa_id);
    img.alt = alt;
    img.loading = 'lazy';
    const caption = el('figcaption', '', fill(t.imageCredit, { credit: value(credit) }));
    if (isUrl(source_url)) caption.append(' ', sourceLink(source_url, t.source));
    fig.append(img, caption);
    image.append(fig);
  } else {
    image.append(el('p', 'entry-pending', t.imagePending));
  }

  const summary = section('summary');
  summary.append(el('p', 'entry-summary-text', value(entry.summary)));

  // The hook is the machine's first-person line (GDD 3.4), shown as a quote.
  const hook = section('hook');
  hook.append(el('blockquote', '', value(entry.hook)));

  // Long text stays short by default, with expandable details (GDD 8.2).
  const how = section('how');
  const details = el('details');
  details.append(el('summary', '', t.howItWorked));
  for (const para of value(entry.how_it_worked).split(/\n\s*\n/)) details.append(el('p', '', para));
  how.append(details);

  const science = section('science', t.science);
  science.append(el('p', '', value(entry.science)));

  const facts = section('facts', t.facts);
  const factList = el('ul');
  for (const f of entry.facts) {
    const li = el('li', '', value(f.text));
    li.append(' ', sourceLink(f.source_url, t.source));
    factList.append(li);
  }
  facts.append(factList);

  const dates = section('dates', t.dates);
  dates.append(el('p', '', fill(t.launched, { date: dateList(entry.launch_date) })));
  if (entry.end_date !== null) dates.append(el('p', '', fill(t.ended, { date: dateList(entry.end_date) })));

  const locations = section('locations', t.locations);
  const locList = el('ul');
  for (const loc of entry.locations) {
    const li = el('li');
    li.append(el('strong', '', loc.label), el('br'), formatCoords(loc), el('br'));
    li.append(isUrl(loc.source_url) ? sourceLink(loc.source_url, t.coordinateSource) : el('span', 'entry-pending', t.noSources));
    locList.append(li);
  }
  locations.append(locList);

  const sources = section('sources', t.sources);
  const urls = [...new Set([...entry.facts.map((f) => f.source_url), source_url, ...entry.locations.map((l) => l.source_url)])].filter(isUrl);
  if (urls.length === 0) sources.append(el('p', 'entry-pending', t.noSources));
  else {
    const list = el('ul');
    for (const u of urls) {
      const li = el('li');
      li.append(sourceLink(u, u));
      list.append(li);
    }
    sources.append(list);
  }

  const verified = section('verified');
  verified.append(
    el('p', 'entry-verified', entry.last_verified ? fill(t.lastVerified, { date: entry.last_verified }) : t.notVerified),
  );

  root.append(header, image, summary, hook, how, science, facts, dates, locations, sources, verified);
}
