Note: Target engineering started ahead of content sign-off per user instruction. Production build gates still require human NASA sourcing before final release.

# State

next: Target and Stretch engineering completed. Content track pending human NASA verification before production release.

review: owner waived per-milestone human review (2026-11-09). Stop only for blockers.

## Done
- **M9 Polish Pass (`design-game`, `game-assets`, `add-assets`, `game-qa`, `review-game`, `ponytail-review`)** (2026-11-09).
  - Pixel Art (`src/sprites/{palette,entities,tiles,pixelRenderer}.ts`): 11-color GDD §4.2 palette, 12x14 robot + 4-step walk cycle + jetpack sprites, 5 machine archetypes (`lander`, `rover`, `probe`, `reflector`, `helicopter`) mapped across all 17 entries, pixel-art props (`prop-crater` 16x16, `prop-rock` 12x10), thruster effects (`fx-flame`, `fx-puff`), and 16x16 regolith ground tiles (`tile-ground-moon`, `tile-ground-mars`). Verified by `tests/unit/sprites.test.ts`.
  - Scene Atmosphere (`SiteScene`, `LandingScene`, `Opening`): pixel-art entities, props, thruster plumes, and tiled regolith replace geometric shapes; regolith tiles + sky stars + distant horizon ridge respect `reducedEffects`; Opening visor frame, listening rings, lunar horizon, and `audio.openingBoot()` hum + caption.
  - Review Fixes (`ponytail-review` 1–6): initial `SiteScene` echo state computed from robot distance (`atMachine: true` starts in `'ready'`), live `LandingHud.refreshSkip()` when `alwaysOfferSkip` toggled on failure screen, `cancelScheduledValues` on thruster stop, shared `playNotes` helper in `AudioSystem`, `--world-map` CSS variable in `hub.css`, and E2E test for `alwaysOfferSkip` + Hard drift (`landing.spec.ts`).
  - Hub & Landing Polish: header recovery progress counter (`.hub-progress`), unvisited marker beacon pulse (`@keyframes echo-pulse`, respects `reducedMotion`), local SVG equirectangular basemaps (`public/assets/maps/{moon,mars}.svg` + `CREDITS.md`, hidden on `reducedEffects`), build-time asset pipeline (`tools/fetch-assets.ts`), `alwaysOfferSkip` setting (§7.6), and Hard start speed display (§7.4).
- **M8 Target & Stretch: Mars Flagships, Site Layouts & Procedural Audio System** (2026-11-09).
  - Mars Flagships: `sojourner-pathfinder`, `spirit-opportunity`, and `ingenuity` updated to `recovery: "jetpack"`.
  - Levels: `data/levels/sojourner-pathfinder.json` (normal, fuel 5.48), `data/levels/spirit-opportunity.json` (normal, fuel 5.46), and `data/levels/ingenuity.json` (hard, 4m pad, fuel 6.87). All solved and verified by solver bot (`npm run solve`).
  - Mars Physics: tested with Mars gravity (3.71 m/s²) and speed scaling (1.51×).
  - All 17 Site Layouts: unique handcrafted layouts for all 17 sites (Moon and Mars) configured in `data/sites/sites.json`.
  - Procedural Web Audio (GDD 11.4): zero-dependency Web Audio API synthesizer (`src/systems/audio.ts`) for thruster rumble, echo pulses, ready signals, landing touchdown, impact, and archive restoration. Zero runtime network requests.
  - Sound Captions (GDD 11.1): floating accessible caption notification banner (`.audio-caption`, `role="status"`, `aria-live="polite"`) providing text equivalents for every audio cue.
  - Settings Toggles: added "Audio" and "Sound captions" controls to `SettingsMenu`.
  - Site HUD & Shortcuts: Archive button (amber border) added to top right of Site HUD; `I` keyboard shortcut wired in Site scene.
  - Tests: unit test suite expanded to 142 tests (`tests/unit/audio.test.ts`); 58 Playwright E2E tests passing. Clean build (`npm run build:draft`).
- **M7 Core release** (2026-11-09).
  - Opening: `src/scenes/Opening.ts` (pictures, GDD 3.3) + DOM `src/ui/OpeningPanel.ts` (captions in cyan "Game story" frame). Player paces with Next/Begin; Skip anytime. No timer, no flashing (slow fades; visor "flicker" = one fade). Reduced motion = no fades/zoom. Echo count from data (Moon entries = 8). Text `data/text/en.json` `opening`.
  - Save: `openingSeen` added to v1 with zod default false (old v1 saves keep progress, no version bump). Reset progress → opening plays again next load. e2e build plays opening only with `?opening`.
  - Reveal: landing result "Read the new entry" (focused on success) → `Archive.openEntry` opens entry page; close returns focus to button.
  - Epilogue: `src/systems/epilogue.ts` (pure summary) + `src/ui/Epilogue.ts` dialog. Recovered/read counts + statuses in amber frame; GDD closing line in cyan frame. Auto-opens once when last entry recovered (at hub, or on next return to hub); hub "Epilogue" button after.
  - Build: `npm run build` = check + validate (strict) + solve + vite. Fails now (319 TODO content errors), by design. `npm run build:draft` = check + vite for dev.
  - Network guard: `tests/e2e/fixtures.ts` auto fixture fails any test on non-origin request; all specs import from it. `network.spec.ts` full session = 0 foreign requests.
  - `core-loop.spec.ts`: opening → 3 Moon flagships via hub UI, walk, E, solver landing, reveal, M → amber marker; Mars unlocks; reload keeps state, no opening replay. Plus skip by keyboard, echo count, Epilogue.
  - Cluster member buttons got `data-key`. Helpers `tests/e2e/play.ts`.
  - Tests: unit 119 passed; e2e 57 passed (incl. temp `zz-shots`). Validator 17 / 21 / 319 errors (content TODO), 3 levels 0 errors. Solver 0 errors.
  - game-qa: screenshots opening (desk + 360x740) and Epilogue. No defects. JS helpers skipped (TS-only). `tests/e2e/zz-shots.spec.ts` deleted.
  - §15.2 map: start/opening/hub → core-loop; 21 markers + card → hub.spec; Mars lock → hub.spec + core-loop; move desktop/touch + echo → site.spec; landing enter/exit, safe/unsafe, determinism → landing.spec + physics.test; fail keeps progress, Assist, Skip → landing.spec; Archive + reload + amber + machine stays → archive.spec, core-loop, site.spec; entry fields → validator (fails until content filled); 17 gates → `npm run build`; network → network.spec + guard; text size/contrast/motion/keyboard/narrow → a11y.spec, mobile.spec; no active called abandoned → **manual** (team, when statuses filled). Real phone check → **manual** (team).
- **M6 Access and polish.** Settings (text size, contrast, reduced motion/effects, autosave), About, pause on any dialog, Esc menu, portrait layout, cyan echo frame. Captions N/A then (no audio).
- **M5 Landing.** Pure physics/stepper/outcome/level/solver; config `src/config/landing.ts`. Solver sets fuel (`npm run solve -- --write`). LandingScene + LandingHud, Assist/Skip after 3 fails (memory only). Levels: apollo-11 Easy, apollo-15-lrv + surveyor-3 Normal.
- **M4 Site scene.** Top-down SiteScene, echo states, joystick + Recover, visit recovery keeps machine. Layouts `data/sites/sites.json` (game only). D5 default used.
- **M3 Archive and save.** Versioned save, memory fallback, migrate never throws, Archive dialog, amber markers. Test hook only in e2e build.
- **M2 Hub map.** DOM hub, clusters (44 px radius), marker card, Mars lock.
- **M1 Data.** Zod schema, validator, 17 stubs / 21 markers, all facts `TODO`.
- **M0 Setup.** Pinned: phaser 4.0.0, typescript 5.7.3, vite 6.4.5, vitest 5.1.0, @playwright/test 1.65.0, tsx 4.23.15, zod 4.6.7. Template ping script removed.

## Open questions
- **D2 Phaser:** 4.0.0 works. Team confirm, or pick 4.1.0.
- **Timing:** Space Apps says no project work before 14 Nov 9:00 local. Confirm with Local Lead.
- **`docs/artifacts-draft.json`:** AI-drafted reference file, moved from src. Split into per-entry files only after human check vs sources.
- **Opening in e2e:** opening skipped unless `?opening` in e2e build only. Prod always plays it on first load.
- **Mars unlock story line:** Done in M8 (GDD 3.3 narrative frame on Hub map).
- **Epilogue:** shows counts by status; no last-verified date there (it is a summary, not a record). Achievements (§10.2) not built (optional).
- **Opening art:** pixel-art visor, listening rings, horizon silhouette, top-down robot + lander, and `openingBoot` electronic hum + caption complete.
- **D4 Mars unlock:** using 3 Moon flagships. Team confirm.
- **Map imagery:** local vector basemaps (`public/assets/maps/{moon,mars}.svg` + `CREDITS.md`) and `tools/fetch-assets.ts` complete; team can swap in NASA Trek global imagery with credit URL when ready.
- **Large text phone landing:** 200% text may touch canvas band in portrait; 150% fine.
- **High contrast:** button borders white, amber/cyan border cue lost on buttons; labels keep meaning.
- **Phone map:** 360 px folds 9 of 10 Moon markers into one cluster. Zoom maybe later.
- **Statuses / Mars URLs / §14 conflicts:** all `TODO` until team sources (D3).
- **Leftovers:** template `screenshot.png` deleted, `README.md` updated for Still Out There; `public/favicon.png` still there.
- **Site gaps:** Archive button, `I` key shortcut, procedural audio cues and captions are all built and verified.
- **Reset confirm:** native `window.confirm`.
- **Landing gaps:** `alwaysOfferSkip` setting (§7.6) and Hard start velocity display (§7.4) complete.
- **Gravity numbers:** 1.62 / 3.71 only in config; need NASA source before showing.
- **Landing values:** my picks; tune by play-test.
- **Bundle size:** `manualChunks: { phaser: ['phaser'] }` and warning limit configured; Phaser minified gzip ~374 kB within 8 MB budget.
- Decisions D1, D3 to D11 still open (GDD §16).
- **SI Log:** team add one line per milestone task (M7 now).

## Decisions
(none recorded yet)
