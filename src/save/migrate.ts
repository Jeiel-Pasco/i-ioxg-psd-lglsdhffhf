import { z } from 'zod';

export const SAVE_VERSION = 1;

const SettingsSchema = z.object({
  textScale: z.number().min(0.5).max(3),
  highContrast: z.boolean(),
  reducedMotion: z.boolean(),
  reducedEffects: z.boolean(),
  audio: z.boolean(),
  captions: z.boolean(),
});

const SaveV1Schema = z.object({
  version: z.literal(1),
  // Whether an entry was assisted is kept for the player's own record only; the Archive never shows it.
  archived: z.record(z.string(), z.object({ assisted: z.boolean() })),
  read: z.array(z.string()),
  results: z.record(z.string(), z.object({ attempts: z.number().int().min(0), completed: z.boolean() })),
  position: z.object({ world: z.enum(['moon', 'mars']), siteId: z.string().nullable() }),
  unlocks: z.object({ mars: z.boolean() }),
  settings: SettingsSchema,
});

export type SaveV1 = z.infer<typeof SaveV1Schema>;
export type Settings = SaveV1['settings'];

export function defaultSave(): SaveV1 {
  return {
    version: SAVE_VERSION,
    archived: {},
    read: [],
    results: {},
    position: { world: 'moon', siteId: null },
    unlocks: { mars: false },
    settings: {
      textScale: 1,
      highContrast: false,
      reducedMotion: false,
      reducedEffects: false,
      audio: false,
      captions: true,
    },
  };
}

/** v0: the unversioned prototype save, a list of archived IDs and read IDs. */
const SaveV0Schema = z.object({
  archived: z.array(z.string()),
  read: z.array(z.string()).optional(),
});

/** Turns any stored value into a valid current save. Unusable data becomes a fresh save; it never throws. */
export function migrate(raw: unknown): SaveV1 {
  const v1 = SaveV1Schema.safeParse(raw);
  if (v1.success) return v1.data;

  const v0 = SaveV0Schema.safeParse(raw);
  if (v0.success && !('version' in (raw as object))) {
    const save = defaultSave();
    for (const id of v0.data.archived) save.archived[id] = { assisted: false };
    save.read = [...new Set(v0.data.read ?? [])];
    return save;
  }

  return defaultSave();
}
