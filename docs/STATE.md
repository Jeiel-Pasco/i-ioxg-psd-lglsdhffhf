# State

next: Core done (M0-M7). Human §15.2 sign-off + content track, then Target (GDD §15.1). Not started.

review: owner waived per-milestone human review (2026-11-09). Stop only for blockers.

## Done
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
  - game-qa: screenshots opening (desk + 360x740) and Epilogue. No defects. JS helpers skipped (TS-only). `tests/e2e/zz-shots.spec.ts` untracked temp; delete.
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
- **`src/data/artifacts.json`:** AI-drafted untracked file, not mine. Split into per-entry files only after human check vs sources.
- **Opening in e2e:** opening skipped unless `?opening` in e2e build only. Prod always plays it on first load.
- **Mars unlock story line:** GDD 3.3 "count changes to 9 echoes" message not built. Add with Mars (Target).
- **Epilogue:** shows counts by status; no last-verified date there (it is a summary, not a record). Achievements (§10.2) not built (optional).
- **Opening art:** placeholder shapes; first-person view + robot need real pixel art. No audio ("faint electronic sound" is Stretch).
- **D4 Mars unlock:** using 3 Moon flagships. Team confirm.
- **Map imagery:** data.zip tiles cover only west hemisphere. Need east tiles or global image + Trek layer + credit URL, via `tools/fetch-assets.ts`.
- **Large text phone landing:** 200% text may touch canvas band in portrait; 150% fine.
- **High contrast:** button borders white, amber/cyan border cue lost on buttons; labels keep meaning.
- **Phone map:** 360 px folds 9 of 10 Moon markers into one cluster. Zoom maybe later.
- **Statuses / Mars URLs / §14 conflicts:** all `TODO` until team sources (D3).
- **Leftovers:** template `README.md`, `screenshot.png`, `public/favicon.png` still there.
- **Site gaps:** no I key / Archive button in site; no echo sound cue.
- **Reset confirm:** native `window.confirm`.
- **Landing gaps:** no "ready" panel before run; no Skip setting (§7.6); Hard start velocity display needed for Mars.
- **Gravity numbers:** 1.62 / 3.71 only in config; need NASA source before showing.
- **Landing values:** my picks; tune by play-test.
- **Bundle size:** Vite warns chunk > 500 kB (Phaser). Check against 8 MB budget on real build; fine so far.
- Decisions D1, D3 to D11 still open (GDD §16).
- **SI Log:** team add one line per milestone task (M7 now).

## Decisions
(none recorded yet)
