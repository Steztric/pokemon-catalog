# Implementation Status

<!-- This file is the authoritative record of what has been built.
     Update it at the end of each phase or significant sub-task.
     The /project-status command reads this file to report status. -->

last_updated: 2026-04-26
current_phase: 7
overall_status: in_progress

---

## Current Focus

Phase 6 (Webcam Feed and Card Presence Detection) is complete. `WebRTCCameraAdapter`
implements `ICameraAdapter` via `getUserMedia`. `CardPresenceDetector` runs a Sobel-edge /
density-bin rectangle detector at ~4 fps and signals stable detection after 3 consistent
frames. `preprocessFrame` crops and normalises the detected region to a 300×420 `ImageFrame`.
`StartScanSession` and `EndScanSession` use cases are fully implemented. `ScannerPage`
rewritten with live video feed, canvas overlay, camera selector, error state, and session tally.
161 tests passing.

Next: Phase 7 — Local pHash Card Identification.

---

## Phase Status

| # | Phase | Status | Completed |
|---|---|---|---|
| 1 | Project Scaffold | complete | 2026-04-25 |
| 2 | CI/CD Pipeline | complete | 2026-04-25 |
| 3 | Pokemon TCG API Integration | complete | 2026-04-25 |
| 4 | Local Persistence Layer | complete | 2026-04-25 |
| 5 | Collection Dashboard | complete | 2026-04-26 |
| 6 | Webcam Feed and Card Presence Detection | complete | 2026-04-26 |
| 7 | Local pHash Card Identification | not-started | — |
| 8 | LLM Vision Fallback | not-started | — |
| 9 | Scan Confirmation Flow and Catalog Management | not-started | — |
| 10 | Image Caching and Offline Support | not-started | — |
| 11 | Settings, Error Handling, and Polish | not-started | — |

Status values: `not-started` | `in-progress` | `complete` | `blocked`

---

## Phase Notes

### Phase 1 — Project Scaffold
- Status: complete
- Blockers: none
- Notes: All acceptance criteria met. `tsc --noEmit`, `vite build`, and `cargo build` all pass.
  All domain types, repository/service/platform interfaces, stub infrastructure, and application
  use case shells are in place. Shell UI with React Router, NavBar, Dashboard, and Scanner pages.

### Phase 2 — CI/CD Pipeline
- Status: complete
- Blockers: none
- Notes: `.github/workflows/frontend.yml` triggers on every push (typecheck → test → vite build →
  upload dist). `.github/workflows/tauri.yml` triggers on main/PRs with a 3-platform matrix
  (ubuntu-22.04, macos-latest, windows-latest) using `tauri-apps/tauri-action@v0`. 41 unit tests
  added under `src/__tests__/`: entity shape tests, stub interface tests, page smoke tests.
  Branch protection rules documented in `docs/branch-protection.md`.

### Phase 3 — Pokemon TCG API Integration
- Status: complete
- Blockers: none
- Notes: `PokemonTCGApiClient` implements `IPokemonCardDataProvider` against the pokemontcg.io v2
  API. API key injected via `VITE_POKEMON_TCG_API_KEY` env var; absent key degrades to
  unauthenticated (lower rate limit). `CachingCardDataProvider` decorates the client with a
  read-through cache: card/set lookups check `ICardRepository`/`ICardSetRepository` first;
  searches and set listings always hit the network but cache individual results as a side-effect.
  `IPlatform` extended with `cardDataProvider`; production resolver wires real client+cache;
  `StubPlatform` uses `StubPokemonCardDataProvider`. 27 new tests (18 API client, 9 caching).

### Phase 4 — Local Persistence Layer
- Status: complete
- Blockers: none
- Notes: `IDatabase` interface abstracts SQL execution for both Tauri and test environments.
  `TauriSQLiteDatabase` wraps `@tauri-apps/plugin-sql`. `IndexedDBDatabase` wraps the native
  browser IndexedDB API. Migration 1 creates all five domain tables; `runMigrations()` accepts
  injectable migration arrays for testability. Platform resolver updated to detect
  `window.__TAURI_INTERNALS__` and select SQLite (desktop) or IndexedDB (browser) storage.
  `tauri-plugin-sql` registered in Rust and SQL permissions added to capabilities.
  45 new tests: 5 migration runner + 20 SQLite repo + 20 IndexedDB repo.

### Phase 5 — Collection Dashboard
- Status: complete
- Blockers: none
- Notes: `searchCatalog` and `getCardDetail` use cases extended to return `CardDetail` (entry +
  card joined in memory, compatible with both SQLite and IndexedDB backends). `DashboardPage`
  rewritten: `useCatalog` hook wraps TanStack Query around `searchCatalog`; filter/sort state
  lives in URL search params via `useSearchParams`; grid/list view persists to `localStorage`
  via `useLocalStorage` hook. New components: `CardTile`, `CardGrid`, `CardList`, `ViewToggle`,
  `FilterBar`, `CatalogSkeleton`. 31 new tests added (6 application, 25 presentation).
  Total: 146 tests passing.

### Phase 6 — Webcam Feed and Card Presence Detection
- Status: complete
- Blockers: none
- Notes: `WebRTCCameraAdapter` wraps `getUserMedia`; enumerates devices and supports device
  switching. `CardPresenceDetector` downsamples to half resolution, applies Sobel edge
  detection, uses 20×20 density bins to locate the largest high-edge region, validates aspect
  ratio (0.714 ± 0.18) and area fraction (4–85%). Stability requires 3 consecutive frames
  with ≥70% IoU overlap. `preprocessFrame` renders the detected bounds at 300×420 via canvas.
  `StartScanSession` / `EndScanSession` use cases persist `ScanSession` records. `ScannerPage`
  rewritten with live video, canvas overlay (yellow = detecting, green = stable), camera
  selector, camera-error state with retry, and session tally. `useScanSession` hook starts/
  ends sessions on mount/unmount. 15 new tests. Total: 161 tests passing.

### Phase 7 — Local pHash Card Identification
- Status: not-started
- Blockers: Phases 3 and 6 must be complete
- Notes: —

### Phase 8 — LLM Vision Fallback
- Status: not-started
- Blockers: Phase 7 must be complete
- Notes: —

### Phase 9 — Scan Confirmation Flow and Catalog Management
- Status: not-started
- Blockers: Phases 4, 7, and 8 must be complete
- Notes: —

### Phase 10 — Image Caching and Offline Support
- Status: not-started
- Blockers: Phase 9 must be complete
- Notes: —

### Phase 11 — Settings, Error Handling, and Polish
- Status: not-started
- Blockers: Phase 10 must be complete
- Notes: —

---

## Decisions and Deviations

- 2026-04-25 — Phase 1 — Used `react-router-dom` v7 (TanStack Router was not chosen; React Router
  is more widely used and the plan did not mandate one over the other).
- 2026-04-25 — Phase 1 — Added `ICardSetRepository` to the storage adapter (architecture diagram
  implied it but did not list it explicitly; it is needed to support CardSet persistence in Phase 4).
- 2026-04-25 — Phase 1 — Required Ubuntu 22.04 for `libwebkit2gtk-4.1-dev`; WSL2 was upgraded
  from 20.04 to 22.04 before scaffolding.

---

## Known Issues and Blockers

None.
