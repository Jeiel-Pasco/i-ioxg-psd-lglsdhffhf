# Still Out There: Core Implementation Plan (M0 to M7)

> **For agentic workers:** Work one milestone at a time, then stop for human review (CLAUDE.md, Workflow). Use superpowers:executing-plans. Tick `- [ ]` boxes as you go and update `docs/STATE.md`.

**Goal:** Ship the Core scope from GDD 2.4: hub maps, all 17 Archive entries, a playable Moon loop for `apollo-11-site`, `apollo-15-lrv` and `surveyor-3`, save, touch, accessibility.
**Architecture:** DOM hub map, Archive and menus over a Phaser canvas. Phaser runs `SiteScene` (top-down) and `LandingScene` (side-view). Pure TypeScript systems (physics, solver, save, data) hold no Phaser imports, so Vitest can test them.
**Tech stack:** TypeScript strict, Phaser (version per D2), Vite, Zod, Vitest, Playwright, tsx. Every version pinned exactly.
**Spec:** `docs/GDD.md` (v2.0) and `CLAUDE.md`. Section numbers below (§) refer to the GDD.

## Global constraints
- No `any`, no `.js` source files. `npm run check` (`tsc --noEmit`) passes at every milestone.
- No runtime requests to third-party hosts. No accounts, analytics, cookies, ads, monetization or leaderboards.
- Facts, dates, coordinates and statuses come only from team-supplied NASA URLs. Anything else is `TODO`. Never fill `verified_by` or `last_verified`.
- Text lives in `data/`, not in scenes. Physics and difficulty values live in `src/config/landing.ts`, not in code (§7.4).
- Never use these skills: viral-game, make-game, quick-game, monetize-game, add-multiplayer, or any 3D skill.

## Review focus (inputs no exit test names; pin a test in the owning milestone)
1. Local storage blocked or full: the game runs in memory and shows a notice (M3: `save.test.ts › falls back to memory when storage throws`).
2. A save that is corrupt or an older version migrates or resets, and never crashes (M3: `save.test.ts › migrates v0`, `› ignores corrupt JSON`).
3. The tab is hidden, then a frame arrives with a 5 s gap: the accumulator clamps the gap, the robot does not tunnel through the platform, and the run stays deterministic (M5: `physics.test.ts › clamps large frame delta`).
4. Thrust and steer are held together on touch (multi-touch) and on a keyboard (M5: `landing.spec.ts › thrust+steer together`).
5. When a DOM overlay is open, Phaser does not swallow key presses, and focus returns to the canvas when it closes (M3: `archive.spec.ts › keyboard focus`).

---

## M0. Setup
- [x] Move `docs/CLAUDE.md` to the repo root. Rename `docs/Still Out There Game Design Document.md` to `docs/GDD.md`.
- [x] Confirm D2. The template pins `phaser` 4.0.0; check that the phaser skill's patterns work on Phaser 4. Record the result in STATE.
- [x] Pin exact versions (`typescript`, `vite` and `terser` are currently ranges). Add `zod`, `vitest`, `@playwright/test` and `tsx`, pinned.
- [x] Restructure the template to the CLAUDE.md layout: `src/{scenes,systems,ui,data,save,config}`. Delete the demo scenes and assets.
- [x] Add npm scripts: `check`, `test` (Vitest), `e2e` (Playwright), `validate` (`tsx tools/validate-data.ts`).
- **Files:** `CLAUDE.md`, `package.json`, `tsconfig.json` (`strict`, `noImplicitAny`), `vitest.config.ts`, `playwright.config.ts`, `src/main.ts`, `src/scenes/Boot.ts`, `tests/unit/smoke.test.ts`, `tests/e2e/boot.spec.ts`
- **Exit tests:** `npm run check` passes. `smoke.test.ts` passes. `boot.spec.ts` asserts a Phaser canvas is mounted and the console shows no errors. `npm run build` succeeds.
- **Skills:** phaser, game-architecture, test-driven-development

## M1. Data foundation
- [x] Write `EntrySchema` (Zod) for the §8.3 fields: `status` is an enum of the 5 values, `locations` is an array of at least 1 item, lat runs -90..90, lon runs -180..180.
- [x] Write `validateEntries(entries): { errors: Issue[]; warnings: Issue[] }`. It flags every §12.5 gate (TODO or empty fields, a missing fact URL, writer equal to verifier, a missing image credit or alt text, a missing `last_verified`, duplicate IDs). A non-NASA host raises a warning.
- [x] Create 17 stub files with coordinates from §5.3 and §5.4 (21 markers, `approximate` where listed). Every other field is `TODO`.
- [x] The CLI prints a gap report per entry. It exits 1 when there are errors (`--report` forces exit 0 during development).
- **Files:** `src/data/schema.ts`, `src/data/loadEntries.ts`, `tools/validate-data.ts`, `data/artifacts/moon/*.json` (8), `data/artifacts/mars/*.json` (9), `tests/unit/validate.test.ts`, `tests/fixtures/entries/*.json`
- **Exit tests:** `validate.test.ts` has one failing fixture per gate (for example `rejects lon -225.99`, `rejects writer == verifier`, `warns on non-NASA url`) plus a passing complete fixture. `npm run validate -- --report` lists the gaps for all 17 stubs and counts 21 markers.
- **Skills:** test-driven-development, game-architecture

## M2. Hub map
- [x] Use an equirectangular `project(lat, lon, w, h): {x, y}`. Group markers closer than 24 px into a numbered cluster badge that expands on select (§5.5).
- [x] The marker card shows the name, status badge, coordinates (with "approximate" where it applies) and a **Fly here** button.
- [x] The Moon/Mars switch shows Mars as locked, with a reason (D4: the 3 Moon flagships).
- [ ] Map tiles from `data.zip` are hosted under `public/assets/maps/`, with credit.
- **Files:** `src/ui/hub/HubMap.ts`, `src/ui/hub/markers.ts` (`project`, `clusterMarkers`), `src/ui/hub/MarkerCard.ts`, `src/ui/styles/hub.css`, `tests/unit/markers.test.ts`, `tests/e2e/hub.spec.ts`
- **Exit tests:** `markers.test.ts` covers projection corners and the Surveyor 3 / Apollo 12 cluster. `hub.spec.ts` selects all 21 markers, both with a mouse and with touch emulation at 360x740, and checks the card fields plus the Mars lock reason.
- **Skills:** design-taste-frontend, add-feature, test-driven-development

## M3. Archive and save
- [x] The card grid has locked cards (silhouette, "Echo not yet visited"), world and status filters, and a "Verified record" amber frame.
- [x] The entry page follows the §8.2 order. Images use `alt`, with credit and the source list.
- [x] `SaveV1 { version: 1; archived: Record<id, {assisted: boolean}>; read: id[]; results; position; unlocks; settings }`. Add `loadSave()`, `writeSave(s)`, `migrate(raw): SaveV1` and `resetProgress()`. Autosave on recovery, on read, and on a settings change.
- **Files:** `src/ui/archive/{ArchiveGrid,EntryPage}.ts`, `src/ui/styles/archive.css`, `src/save/{save,migrate,memoryStore}.ts`, `tests/unit/save.test.ts`, `tests/e2e/archive.spec.ts`
- **Exit tests:** `archive.spec.ts › unlock survives reload` unlocks `surveyor-3`, reloads, and checks that the card is open and the marker is amber. `save.test.ts` covers the memory fallback, migration, corrupt JSON, reset, and checks that the archive never shows `assisted`.
- **Skills:** design-taste-frontend, add-feature, test-driven-development

## M4. Site scene
- [x] A shared Moon template about 3x3 screens, with props per entry from data. 8-direction movement with an acceleration ramp. The camera is clamped to the scene (D5).
- [x] `echoState(dist, recovered): 'unvisited'|'near'|'ready'|'archived'`, with the thresholds in config. Add an edge arrow and an interaction prompt (E, or the touch button).
- [x] A recovered machine stays in the scene, tagged "Archived". `recovery: "visit"` unlocks on interact.
- **Files:** `src/scenes/SiteScene.ts`, `src/systems/movement.ts`, `src/systems/echo.ts`, `src/ui/touch/{Joystick,InteractButton}.ts`, `tests/unit/echo.test.ts`, `tests/unit/movement.test.ts`, `tests/e2e/site.spec.ts`
- **Exit tests:** `echo.test.ts` covers every state transition. `site.spec.ts` drives the robot by keyboard and by touch to Ready at each of the 3 flagship sites, and checks that the machine sprite remains after a visit recovery.
- **Skills:** phaser, add-feature, test-driven-development

## M5. Landing challenge
- [x] `stepPhysics(s: LanderState, input: {thrust: 0|1; steer: -1|0|1}, p: LandingParams, dt = 1/60): LanderState` uses the §7.3 equations. `a_t = r*g`. Steering uses fuel at half the thrust rate. 8 px per metre at 320x180.
- [x] `FixedStepper` uses an accumulator and clamps the frame delta to 0.25 s. `landingOutcome(s, level): 'landed'|'too_fast'|'missed'|'no_fuel'|null`.
- [x] `solve(level): Input[] | null` (a search over burn timings). Level fuel = `fuelMultiplier × fuelUsed(route)`. On Mars, safe speeds are multiplied by `MARS_SPEED_SCALE = 1.51`.
- [x] Add Try again and Back to site. After 3 consecutive failures, offer Assist (+25% fuel, a wider platform) and Skip challenge. A failure never touches the save.
- **Files:** `src/systems/physics.ts`, `src/systems/stepper.ts`, `src/systems/outcome.ts`, `src/config/landing.ts`, `src/scenes/LandingScene.ts`, `tools/solve-levels.ts`, `data/levels/{apollo-11-site,apollo-15-lrv,surveyor-3}.json`, `tests/unit/{physics,stepper,solver}.test.ts`, `tests/e2e/landing.spec.ts`
- **Exit tests:** `physics.test.ts › free fall matches g` and `› deterministic over 10 runs`. `solver.test.ts › every level solvable within fuel` and `› zero input fails every level`. `landing.spec.ts` checks that a scripted safe input lands and an unsafe one fails, then forces 3 failures and checks that Assist and Skip appear and the save is unchanged.
- **Skills:** phaser, test-driven-development, add-feature

## M6. Access and polish
- [x] Settings for text size, high contrast and reduced motion (no camera easing or shake), all saved. Touch targets are at least 44x44. No flashing. Captions for every cue.
- [x] A dedicated portrait layout for the mobile hub, Archive and HUD (§9.1). Load assets per world. A reduced-effects option.
- [x] Fiction and fact frames (cyan "Game story" vs amber "Verified record"), plus an About screen.
- **Files:** `src/ui/settings/Settings.ts`, `src/ui/About.ts`, `src/ui/styles/{a11y,mobile}.css`, `tests/e2e/a11y.spec.ts`, `tests/e2e/mobile.spec.ts`
- **Exit tests:** `a11y.spec.ts` reaches every menu by Tab/Enter/Esc, checks that each setting changes the computed styles, and checks that every button is at least 44x44 and every `img` has `alt`. `mobile.spec.ts` runs at 360x740 with no horizontal scroll. The team runs a manual checklist of §15.2 on a real phone and records the result in STATE.
- **Skills:** design-taste-frontend, add-feature

## M7. Core release
- [x] Wire up the opening sequence (skippable and captioned) → hub → site → landing → reveal → Archive. The Epilogue summary uses the recovered and read entries.
- [x] `npm run build` runs the validator in strict mode and `solve-levels`, and fails on any gate.
- [x] Add a network guard: Playwright fails on any request whose host is not the app's own origin.
- **Files:** `src/scenes/Opening.ts`, `src/ui/Epilogue.ts`, `tests/e2e/core-loop.spec.ts`, `tests/e2e/network.spec.ts`
- **Exit tests:** `core-loop.spec.ts` plays all 3 Moon flagships end to end, checks that Mars unlocks, and that the state survives a reload. `network.spec.ts` sees zero third-party requests. Every §15.2 bullet maps to a passing test or a recorded manual check. The build is green once the content track has filled all 17 entries.
- **Skills:** game-architecture, phaser, test-driven-development
