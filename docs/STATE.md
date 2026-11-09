# State

next: M5

review: owner waived per-milestone human review (2026-11-09). Do not stop for review; stop only for blockers.

## Done
- **M4 Site scene** (2026-11-09).
  - `src/scenes/SiteScene.ts` (key `Site`), pure `src/systems/{movement,echo}.ts`, tuning `src/config/site.ts` (960x540 scene, speed 90 px/s, ramp 0.15 s, near 160 px, ready 28 px).
  - Layouts: `data/sites/sites.json` (start, machine, generic rock/crater props) for the 3 flagships + apollo-12-site; others use `default`. Game layout only, no facts. Loader `src/data/sites.ts` (Zod).
  - Flow: Fly here → hub hidden, `Site` starts; Map button or M → `site:leave`, hub back, focus to marker card, `data-scene="Hub"`. Shutdown removes bus listeners and key capture.
  - Interact (E or Recover button) only when ready. `visit` → `entry:recovered`, machine stays, amber "Archived" tag. `jetpack` → emits `site:land`; nothing listens until M5 (flagships dead-end at Ready for now).
  - DOM HUD `src/ui/site/SiteHud.ts` + `src/ui/touch/{Joystick,InteractButton}.ts`: shown on all devices; status line is a live region; disabled Recover = dashed border (not colour only). Joystick tracks one pointer, so Recover works with a second finger.
  - Edge arrow only in `near` while the machine is off screen. Pulse faster when near; reduced motion = steady ring, no camera easing.
  - New events: `site:move|interact|leave|echo|land`. Test hook adds `fly(id)`, `site()`.
  - Sprites: placeholder original pixel art (robot, generic lander) drawn in code. Real per-entry machine sprites are later art work.
  - Tests: unit 87 passed (echo 15, movement 6); e2e 31 passed (site.spec 11: keyboard + touch (CDP) to Ready at all 3 flagships, near before ready, visit keeps machine + saved, 44 px controls, M back). Validator unchanged (17 / 21 / 319).
  - game-qa: JS helpers skipped again (TS-only); visual check by screenshots, desktop and 360 px. No defects found.
  - D5 used as proposed default (8-dir, ramp, follow camera); team still to confirm.
- **M3 Archive and save** (2026-11-09).
  - Save: `src/save/{save,migrate,memoryStore}.ts`. `openStore` probes localStorage, falls back to `MemoryStore`. Failed write (quota) switches to memory too. `migrate` never throws; bad data gives fresh save. `Progress` autosaves on `recover`, `markRead`, `updateSettings`; sets `unlocks.mars`.
  - Key `still-out-there:save`. v0 = assumed unversioned `{archived: string[], read?: string[]}` (no real v0 ever shipped; shape is my pick).
  - Settings defaults in `defaultSave()`: textScale 1, highContrast/reducedMotion/reducedEffects/audio off, captions on. UI for them waits for M6.
  - Archive: `src/ui/archive/{ArchiveGrid,EntryPage}.ts`, `src/ui/styles/archive.css`, card model `src/systems/archive.ts` (no `assisted` field). Native `<dialog>` over hub; opened by hub **Archive** button. Escape closes; focus back to opener (canvas if opener gone). Phaser keyboard off while open.
  - Locked cards: silhouette, "Echo not yet visited", world only. Status filter shows open cards only (no spoilers). Moon cards first.
  - Entry page: §8.2 order, amber frame, "Verified record" tag. `TODO` text shows "Not yet written."; no link for `TODO` URLs. Image path `assets/archive/<nasa_id>.jpg` (fetch-assets must write that name).
  - Hub: recovered marker = amber square (shape + colour + "recovered" in label); part-recovered cluster gets amber corner badge. Storage-blocked notice above map.
  - New event `entry:recovered {entryId, assisted}`; M5 emits it.
  - Test hook `window.__stillOutThere` only in `vite build --mode e2e` (Playwright uses that); grep confirms absent from prod build.
  - Tests: unit 67 passed (save.test.ts 21); e2e 20 passed (archive.spec.ts 11, incl. unlock survives reload, keyboard focus, blocked storage, 360 px phone). Validator report unchanged (17 / 21 / 319).
  - game-qa: JS helpers skipped (TS-only rule). Used its visual-inspection method via Playwright screenshots. Fixed: cluster badge covered count; dialog wider than 360 px screen.
  - Not done: glossary tooltips (§9.3); need sourced definitions first.
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
- **Archive focus:** PLAN says focus returns to canvas on close. Hub covers canvas now, so focus returns to the Archive button instead (canvas only if opener gone). M4 has no Archive button in site scene (I key / icon), so unchanged; add in M6.
- **Site on phone portrait:** 320x180 canvas is a thin strip at 360x740 (FIT). Works, but M6 should give portrait its own layout.
- **Site gaps for M6:** no Esc pause, no I (Archive) key in site, no echo sound cue (audio is Stretch), no captions needed yet.
- **Reset confirm:** uses native `window.confirm`. M6 may want an in-game confirm.
- Decisions D1 and D3 to D11 are still open (GDD §16).

## Decisions
(none recorded yet)
