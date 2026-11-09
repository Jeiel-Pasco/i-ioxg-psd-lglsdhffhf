import { EntrySchema, TODO, type Entry } from './schema';

export interface Issue {
  id: string;
  path: string;
  message: string;
}

export interface Report {
  errors: Issue[];
  warnings: Issue[];
}

/** Errors whose message starts with this are missing content, not broken data. */
export const GAP = 'gap: ';

const HUMAN_FIELDS = ['written_by', 'verified_by', 'last_verified'] as const;

function idOf(raw: unknown): string {
  if (typeof raw === 'object' && raw !== null && 'id' in raw && typeof raw.id === 'string') return raw.id;
  return '(no id)';
}

function isGap(value: string): boolean {
  const v = value.trim();
  return v === '' || v === TODO;
}

/** Calls `visit` for every string inside `value`, with its dotted path. */
function walkStrings(value: unknown, path: string, visit: (path: string, s: string) => void): void {
  if (typeof value === 'string') visit(path, value);
  else if (Array.isArray(value)) value.forEach((v, i) => walkStrings(v, path ? `${path}.${i}` : String(i), visit));
  else if (typeof value === 'object' && value !== null) {
    for (const [k, v] of Object.entries(value)) walkStrings(v, path ? `${path}.${k}` : k, visit);
  }
}

function sourceUrls(e: Entry): [string, string][] {
  return [
    ...e.locations.map((l, i): [string, string] => [`locations.${i}.source_url`, l.source_url]),
    ...e.facts.map((f, i): [string, string] => [`facts.${i}.source_url`, f.source_url]),
    ['image.source_url', e.image.source_url],
  ];
}

function isNasaHost(host: string): boolean {
  return host === 'nasa.gov' || host.endsWith('.nasa.gov');
}

/** Checks entries against the build gates in GDD 12.5. */
export function validateEntries(entries: readonly unknown[]): Report {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const seen = new Set<string>();

  for (const raw of entries) {
    const id = idOf(raw);
    const err = (path: string, message: string) => errors.push({ id, path, message });

    if (seen.has(id)) err('id', `duplicate id "${id}"`);
    seen.add(id);

    walkStrings(raw, '', (path, s) => {
      if (isGap(s)) err(path, `${GAP}empty or TODO`);
    });

    const parsed = EntrySchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) err(issue.path.join('.'), issue.message);
      continue;
    }
    const e = parsed.data;

    for (const field of HUMAN_FIELDS) {
      if (e[field] === null) err(field, `${GAP}missing (human field)`);
    }
    if (e.written_by !== null && e.verified_by !== null && !isGap(e.written_by)) {
      if (e.written_by.trim().toLowerCase() === e.verified_by.trim().toLowerCase()) {
        err('verified_by', 'must differ from written_by');
      }
    }

    for (const [path, url] of sourceUrls(e)) {
      if (isGap(url)) continue; // already reported as a gap
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        err(path, 'not an http(s) URL');
        continue;
      }
      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') err(path, 'not an http(s) URL');
      else if (!isNasaHost(parsedUrl.hostname)) warnings.push({ id, path, message: `non-NASA source: ${parsedUrl.hostname}` });
    }
  }

  return { errors, warnings };
}
