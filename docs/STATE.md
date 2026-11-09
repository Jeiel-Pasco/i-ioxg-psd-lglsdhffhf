# State

next: M3 (after human review of M2)

## Done
- **M2 Hub map** (2026-11-09).
  - A DOM hub over the canvas: `src/ui/hub/{HubMap,MarkerCard,markers}.ts`, `src/ui/styles/hub.css`, `src/ui/dom.ts`.
  - Added the typed `src/core/events.ts` (`hub:fly`), `src/data/loadEntries.ts` (bundled with `import.meta.glob`, no fetch), `src/systems/unlock.ts`, `src/config/hub.ts`, and UI text in `data/text/en.json`.
  - Equirectangular projection with clusters that expand into a member list. The marker card shows the name, status badge, place, coordinates (with "approximate" where it applies) and **Fly here**.
  - Mars shows a lock banner with its reason, and Fly here is disabled there.
  - Tests: `npm test` 46 passed; e2e 10 passed. All 21 markers are selected by mouse at 1280x720 and by tap at 360x740. Also covered: the Mars lock, no sideways scroll, 44 px targets, keyboard selection.
  - Validator report unchanged (17 / 21 / 319 gaps).
  - Deviation: the cluster radius is 44 px, not the plan's 24 px. That equals the touch target, so marker hit areas never overlap. Clusters sit on their first member's true position, so no marker is moved.
  - Not done: map imagery (see open questions). The map is a 30° grid on a flat Moon or Mars ground colour.
  - Skills: add-feature (no Play.fun or score HUD was added). From design-taste-frontend, only the UI rules were used (targets, focus, edges, motion). Its photo search, palette dealing, effects and gate were skipped because they are for marketing sites and would make third-party requests.
- **M1 Data foundation** (2026-11-09).
  - `src/data/schema.ts` (Zod `EntrySchema`) and `src/data/validate.ts` (`validateEntries` checks every gate in GDD §12.5; non-NASA hosts are warnings).
  - `tools/validate-data.ts`: `npm run validate` exits 1 on errors; `-- --report` exits 0.
  - 17 stubs in `data/artifacts/{moon,mars}/` with 21 markers. Names, tiers and markers come from GDD §2.2, §5.3 and §5.4. A location `source_url` is the NASA catalogue only where the GDD says so; everything else is `TODO`.
  - `status`, dates and all text are `TODO`; the human fields are `null`.
  - Report: 17 entries, 21 markers, 319 gap errors, 0 warnings. `npm run check`, `npm test` (32 passed) and e2e (2 passed) are green.
  - `recovery` is `jetpack` for the 3 Moon flagships and `visit` for the rest (Core scope).
  - Markers flagged `approximate` (the GDD marks them unconfirmed or approximate): blue-ghost-1, im-1-odysseus, ingenuity, insight, mars-polar-lander, perseverance-landing-hardware.
  - Deviation from the plan: the loader lives in `tools/validate-data.ts` (`loadEntryFiles`). The browser loader `src/data/loadEntries.ts` waits for M2. There is one `complete.json` fixture, and tests mutate it per gate.
  - QA: the game-qa skill's JS helpers conflict with the TypeScript-only rule, so the Playwright e2e suite was run instead.
- Plan written: `docs/PLAN.md` (M0 to M7).
- **M0 Setup** (2026-11-09). `npm run check`, `npm test` (2 passed), `npm run build` and `npm run e2e` (2 passed: canvas boots with no console errors, no third-party requests) are all green.
  - `CLAUDE.md` is now at the root; the GDD is at `docs/GDD.md`.
  - All versions are exact (`.npmrc` sets `save-exact`): phaser 4.0.0, typescript 5.7.3, vite 6.4.5, vitest 5.1.0, @playwright/test 1.65.0, tsx 4.23.15, zod 4.6.7.
  - Vite went from 6.3.2 to 6.4.5 because vitest 5.1.0 needs Vite 6.4 or later. terser was removed (Vite's default minifier is used).
  - Removed the template's `log.js`, which sent build pings to gryzor.co (rules 1 and 7), its demo scenes and assets, and the `.mjs` Vite configs. There is now one `vite.config.ts`.
  - Playwright uses the locally installed Chrome (`channel: 'chrome'`), so no browser download is needed.
  - The internal resolution is 320x180 with `pixelArt` (`src/config/display.ts`).

## Open questions
- **D2 Phaser version:** 4.0.0 builds, type-checks and boots. The phaser skill is written for Phaser 3, and its scene patterns used so far work on 4. The team still needs to confirm 4.0.0, or choose 4.1.0, which the GDD says was released 30 April 2026.
- **Timing:** the GDD says Space Apps asks teams not to start project work before 14 Nov, 9:00 local time. Confirm with the Local Lead.
- **`src/data/artifacts.json`:** an AI-drafted data file (single JSON, `_meta` header) that I did not create. M1 expects one file per entry in `data/artifacts/<world>/`. Decide whether to split it into those files, and have a human check every value against its source first.
- **Skills:** `use-template` needs the game-creator gallery, which isn't installed, and it copies an example game into a subfolder, so it wasn't used. The phaser and game-architecture skills' Play.fun, leaderboard and "no title screen" guidance is ignored under CLAUDE.md rule 7.
- **D4 Mars unlock rule:** M2 uses the GDD's proposal (the three Moon flagships, in `src/config/hub.ts`, with the lock reason in `data/text/en.json`). The team must confirm it, or switch to "all 8 Moon entries".
- **Map imagery:** the `data.zip` tiles (`moon_lro_tile_0_0_0.jpg`, `mars_mola_tile_0_0_0.jpg`) cover only the western hemisphere (−180° to 0°), so half the markers would sit off the image. The eastern tiles (`0_0_1`) or a full global image are needed, plus the exact Trek layer name and a credit URL, fetched at build time by `tools/fetch-assets.ts`.
- **Phone map:** at 360 px, 9 of the 10 Moon markers fold into one cluster. It works, but zoom or a larger map may be wanted in M6.
- **Draft statuses:** the stubs leave `status` as `TODO` rather than copying the draft statuses from GDD §2.2. The team fills them from NASA pages (D3).
- **Mars marker URLs:** the GDD names a source type (Mars24, PDS) but no URLs, so every Mars `source_url` is `TODO`. The GDD §14 conflicts are still open.
- **Strict validation in the build:** `npm run validate` fails until the content track fills the entries, so it is not yet part of `npm run build` (planned for M7).
- **Leftovers:** the template's `README.md`, `screenshot.png` and `public/favicon.png` are still there.
- Decisions D1 and D3 to D11 are still open (GDD §16).

## Decisions
(none recorded yet)
