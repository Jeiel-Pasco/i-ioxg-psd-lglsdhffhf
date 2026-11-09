import { z } from 'zod';
import raw from '../../data/sites/sites.json';

const Point = z.object({ x: z.number(), y: z.number() });
const Layout = z.object({
  start: Point,
  machine: Point,
  props: z.array(z.object({ kind: z.enum(['rock', 'crater']), x: z.number(), y: z.number(), r: z.number().positive() })),
});
const SitesFile = z.object({ default: Layout, sites: z.record(z.string(), Layout) });

export type SiteLayout = z.infer<typeof Layout>;

const file = SitesFile.parse(raw);

/** The layout for an entry's site scene; entries without one use the shared default. */
export function siteLayout(entryId: string): SiteLayout {
  return file.sites[entryId] ?? file.default;
}

export function siteLayoutIds(): string[] {
  return Object.keys(file.sites);
}
