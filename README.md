# Still Out There

> **Abandoned, but not forgotten.**

A responsive browser game and historical archive about NASA equipment left on the Moon and Mars. A small exploratory robot follows "echoes" across equirectangular planetary maps to 17 real landing and crash sites, navigates top-down terrain, completes side-view jetpack landing challenges, and unlocks verified Archive records sourced from NASA documentation.

Detailed design and game design decisions are documented in [`docs/GDD.md`](docs/GDD.md).

---

## Features

- **Dual-Layer Architecture:** Pure TypeScript Phaser 4 canvas for top-down exploration and 60 FPS physics-based landing simulation, coupled with an accessible semantic DOM overlay for menus, maps, HUD, and the Archive.
- **Accessible & Responsive:** Screen reader support, keyboard navigation everywhere, touch controls (virtual joystick and hold buttons with minimum 44×44 px touch targets), adjustable text scaling, high-contrast mode, reduced motion, and reduced effects settings.
- **Offline & Self-Contained:** Zero third-party network requests at runtime. All fonts, sprites, map tiles, and assets are hosted locally.
- **Source-Backed Records:** Historical facts and positions must link to verified NASA URLs. Active machines maintain distinct status badges and remain permanently in the world.
- **Resilient Save System:** Versioned save schema with automatic fallback to in-memory storage if `localStorage` is blocked or unavailable.

---

## Tech Stack

- **Engine:** [Phaser 4](https://github.com/phaserjs/phaser) (canvas rendering)
- **Language:** TypeScript 5.7 (strict mode, zero `any`)
- **Bundler:** Vite 6
- **Validation:** Zod 4
- **Testing:** Vitest (unit physics & data tests) and Playwright (cross-browser accessibility, mobile viewport, and E2E core loop)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v20+ recommended)

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Starts the local development server at `http://localhost:8080`.

---

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server with hot-reload |
| `npm run check` | Run TypeScript strict type-checking (`tsc --noEmit`) |
| `npm test` | Run all unit tests with Vitest |
| `npm run e2e` | Run end-to-end tests with Playwright |
| `npm run validate` | Validate artifact schema, NASA sources, and human verifier gates |
| `npm run solve` | Run solver bot against all landing levels to verify and set fuel limits |
| `npm run build` | Full production build (type-check, validate data, solve levels, and bundle) |
| `npm run build:draft` | Fast draft bundle without strict data validation gates |
| `npm run preview` | Locally preview the built production bundle in `dist/` |

---

## Project Structure

```
still-out-there/
├── data/
│   ├── artifacts/           # Entry data per world (moon, mars)
│   ├── levels/              # Landing level definitions
│   ├── sites/               # Top-down site layout data
│   └── text/                # Localized strings (en.json)
├── docs/
│   ├── GDD.md               # Game Design Document (v2.0)
│   └── STATE.md             # Current milestone state and open questions
├── public/
│   └── assets/              # Local static assets (maps, tiles, archive images)
├── src/
│   ├── config/              # Physics, landing, and display constants
│   ├── core/                # Typed event bus and core interfaces
│   ├── data/                # Data loaders, Zod schemas, and validators
│   ├── save/                # Save manager, migrations, and memory store
│   ├── scenes/              # Phaser scenes (Boot, Opening, SiteScene, LandingScene)
│   ├── systems/             # Pure physics, movement, solver bot, and outcomes
│   ├── ui/                  # Semantic DOM components (HubMap, Archive, HUDs, Settings)
│   └── main.ts              # Game bootstrap and event wiring
├── tests/
│   ├── unit/                # Unit tests for stepper, physics, save, and solver
│   └── e2e/                 # Playwright tests for accessibility, mobile, and core loop
└── tools/
    ├── solve-levels.ts      # Bot solving script for landing fuel calibration
    └── validate-data.ts     # CLI data validator for NASA sources and schemas
```

---

## License

MIT
