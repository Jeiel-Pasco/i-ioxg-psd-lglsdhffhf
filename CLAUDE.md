# Still Out There

Tagline: **Abandoned, but not forgotten.**

A responsive browser game about NASA equipment left on the Moon and Mars. A small robot follows "echoes" to 17 real sites, completes a short side-view jetpack landing at each, and unlocks a sourced Archive entry. The full design is in `docs/GDD.md` (v2.0). Read it before starting any task. If this file and the GDD disagree, ask before choosing.

## Hard rules

1. **TypeScript only, strict mode.** No plain JavaScript source files and no `any`. Run the type check before calling work done.
2. **No third-party network requests at runtime.** Fonts, images, map tiles and audio are hosted with the game. NASA assets are downloaded at build time by `tools/fetch-assets.ts`, never fetched while the game runs.
3. **No source, no ship.** Never write a historical fact, date, number, coordinate or status into an entry unless the team gave you a NASA source URL for it. Use `TODO` instead. Never treat your own knowledge or AI output as a source.
4. **Do not invent feelings or claims for machines.** The first-person `hook` line may only state facts the entry's sources support.
5. **The real machines stay in the world.** Recovering an entry restores its story; it never removes the machine from the scene.
6. **Never call an active machine abandoned.** Every entry shows a status badge.
7. **No accounts, analytics, cookies, ads, monetization, leaderboards or wallet/token features.** Ignore any game-creator step that adds them.
8. **No NASA logos or insignia.** Sprites are original pixel art.
9. **Pin exact dependency versions.** Confirm the Phaser version with the team (GDD decision D2) before installing.

## Scope: build in this order

- **Core:** hub maps (Moon, Mars) with all markers; Archive with all 17 entries; playable Moon loop for the three Moon flagships (`apollo-11-site`, `apollo-15-lrv`, `surveyor-3`); save and restore; desktop and touch; accessibility basics.
- **Target:** all 8 Moon entries playable, Mars unlock, three Mars flagships playable (`sojourner-pathfinder`, `spirit-opportunity`, `ingenuity`).
- **Stretch:** all 17 playable, audio, extras.

Do not start Target or Stretch work until Core meets the acceptance criteria in GDD Section 15.2. Any entry without a landing challenge uses `recovery: "visit"` so it stays reachable.

## Structure

- Hub map (HTML/CSS) → site scene (Phaser, top-down) → landing scene (Phaser, side-view) → entry reveal.
- The Archive, menus, settings and About screen are real DOM elements over the canvas, for screen readers and keyboard users.
- Layout:

```
data/artifacts/{moon,mars}/<id>.json   one file per entry
data/levels/<id>.json                  one landing level per jetpack entry
public/assets/                         sprites, maps, images, audio, fonts
src/                                   main.ts, scenes/, systems/, ui/, data/, save/
tools/                                 validate-data.ts, solve-levels.ts, fetch-assets.ts
tests/
```

## Data rules

- Entry fields and rules: GDD Section 8.3. `locations` is always a **list** (Viking, Spirit/Opportunity have 2 markers; the Apollo retroreflectors have 3).
- `status` is exactly one of: `active`, `dormant`, `ended`, `lost`, `drifting`.
- Coordinates: latitude positive north; longitude positive east, -180 to 180. Convert Mars 0-360 values. Mark unconfirmed positions `approximate: true`.
- Apollo site markers use the lunar module descent stage position from the NASA catalogue.
- `written_by` and `verified_by` must differ. Never fill `verified_by` or `last_verified` yourself; those are human fields.
- Text is stored in data files, not hard-coded in scenes, so it can be translated later.
- Summaries target a grade 4 to 5 reading level.
- The build must fail on: empty or `TODO` fields, a fact without a source URL, invalid status, matching writer and verifier, missing image credit or alt text, missing `last_verified`, non-list `locations`, out-of-range coordinates, duplicate IDs, or a level the solver bot cannot win. Non-NASA source URLs raise a warning.

## Landing challenge physics

- Fixed timestep: 60 steps per second with an accumulator, separate from rendering.
- The y-axis points down: `v_y += (g - a_t * T) * dt` and `v_x += a_h * S * dt`.
- Thrust is a ratio of gravity: `a_t = r * g`. Gravity is about 1.62 m/s² (Moon) and 3.71 m/s² (Mars); cite a NASA page before showing these numbers to players.
- 1 game metre = 8 px at a 320 by 180 internal resolution. The robot stays upright; steering is sideways acceleration and uses fuel at half the thrust rate.
- Starting values (Easy / Normal / Hard) are in GDD Section 7.4. Keep all of them in config, not in code, because they will be tuned by play-testing.
- Mars: multiply safe-speed limits by about 1.51 unless Mars is made harder on purpose.
- Fuel for each level is a multiple of what the solver bot's route uses. Hard asks for precision, never impossible fuel.
- Failure: instant "Try again" and "Back to site". After 3 failures offer Assist (+25% fuel, wider platform) and Skip challenge. Failure never removes progress. The Archive never shows that an entry was assisted.

## Accessibility and performance

- Adjustable text size, high-contrast mode, reduced motion, keyboard-accessible menus, touch targets of at least 44 by 44 px, captions for every sound and cinematic line, alt text on every image, no flashing, no information by color alone.
- Mobile gets its own layout. Test narrow portrait screens.
- Budget (proposed): under about 8 MB before first interaction, 60 fps on a mid-range phone, a reduced-effects option, per-world asset loading.

## Saving

Versioned save in browser local storage with a migration path and a Reset progress button. Autosave after a recovery, an entry read, and a settings change. If storage is blocked, run in memory and show a notice. Store no personal data.

## Fiction and fact

- Game story text (cinematic, robot messages, echoes): cyan frame, "Game story" tag.
- Archive text: amber frame, "Verified record" tag, last-verified date.

## Workflow

- Work one GDD milestone at a time (GDD Section 15.1), then stop for human review.
- Before finishing a milestone: run the type check, tests and the data validator. Use game-creator's review and QA commands where they fit; do not use its viral-game orchestrator.
- Keep `docs/STATE.md` current: what is done, what is next, and open questions.
- Record decisions (GDD Section 16, D1 to D11) in `docs/STATE.md` when the team settles them.
- When you find a conflict between data files, list it; do not silently pick a value. GDD Section 14 tracks the known ones.
- Log AI use: tell the team to add a line to the SI Log tab for each task you complete. The team must have the Local Lead's confirmation before project work begins if the challenge rules require it.

## Definition of done

A task is done when it type-checks, tests pass, the data validator passes, nothing makes a third-party request at runtime, and any text you wrote is either marked `TODO` for human sourcing or backed by a team-supplied NASA source.
