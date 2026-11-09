import { z } from 'zod';

// Entry shape from GDD 8.3. `TODO` is accepted here so stubs parse; the validator
// reports every TODO as a content gap.
export const TODO = 'TODO';
export const STATUSES = ['active', 'dormant', 'ended', 'lost', 'drifting'] as const;

const todo = z.literal(TODO);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');
const dateOrTodo = z.union([isoDate, todo]);
// Two-craft entries give one date per craft.
const dates = z.union([dateOrTodo, z.array(dateOrTodo).min(1)]);

export const LocationSchema = z.object({
  label: z.string(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  source_url: z.string(),
  approximate: z.boolean(),
});

export const EntrySchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be lowercase with hyphens'),
  name: z.string(),
  world: z.enum(['moon', 'mars']),
  tier: z.enum(['flagship', 'standard']),
  status: z.union([z.enum(STATUSES), todo]),
  launch_date: dates,
  end_date: z.union([dates, z.null()]),
  locations: z.array(LocationSchema).min(1, 'locations must list at least one marker'),
  summary: z.string(),
  hook: z.string(),
  how_it_worked: z.string(),
  science: z.string(),
  facts: z.array(z.object({ text: z.string(), source_url: z.string() })).length(2),
  image: z.object({
    nasa_id: z.string(),
    credit: z.string(),
    source_url: z.string(),
    alt: z.string(),
  }),
  // Human fields: never filled by tools or AI.
  written_by: z.string().nullable(),
  verified_by: z.string().nullable(),
  last_verified: isoDate.nullable(),
  recovery: z.enum(['jetpack', 'visit']),
  notes: z.string().optional(),
});

export type Entry = z.infer<typeof EntrySchema>;
export type EntryLocation = z.infer<typeof LocationSchema>;
