// Data validator (GDD 12.5). Exits 1 on any error; `--report` prints the same
// report but exits 0, for use while entries are still stubs.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateEntries, type Issue } from '../src/data/validate';

const DATA_DIR = 'data/artifacts';

/** Reads every `.json` file under `dir` (recursively) as one entry object. */
export function loadEntryFiles(dir: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) out.push(...loadEntryFiles(path));
    else if (item.name.endsWith('.json')) {
      const value: unknown = JSON.parse(readFileSync(path, 'utf8'));
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(`${path}: expected one entry object`);
      }
      out.push(value as Record<string, unknown>);
    }
  }
  return out;
}

function group(issues: Issue[]): Map<string, Issue[]> {
  const byId = new Map<string, Issue[]>();
  for (const i of issues) byId.set(i.id, [...(byId.get(i.id) ?? []), i]);
  return byId;
}

function main(args: string[]): number {
  const entries = loadEntryFiles(DATA_DIR);
  const { errors, warnings } = validateEntries(entries);
  const markers = entries.reduce((n, e) => n + (Array.isArray(e.locations) ? e.locations.length : 0), 0);

  for (const [id, list] of group(errors)) {
    console.log(`${id}: ${list.length} errors: ${list.map((i) => i.path).join(', ')}`);
  }
  for (const w of warnings) console.log(`warning ${w.id} ${w.path}: ${w.message}`);
  console.log(`${entries.length} entries, ${markers} markers, ${errors.length} errors, ${warnings.length} warnings`);

  return errors.length > 0 && !args.includes('--report') ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
