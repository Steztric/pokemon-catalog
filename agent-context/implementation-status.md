# Implementation Status

<!-- This file is the authoritative record of what has been built.
     Update it at the end of each phase or significant sub-task.
     The /project-status command reads this file to report status. -->

last_updated: 2026-05-02
current_phase: 10
overall_status: in_progress

---

## Current Focus

Phase 9 (Scan Confirmation Flow and Catalog Management) is complete. `addCardToCatalog`
fully implemented: caches card metadata via `ICardRepository` (fetches from API if absent),
upserts `CatalogEntry` (create at qty 1 or increment), writes a confirmed `ScanEvent`, and
increments `ScanSession.cardsScanned`. `confirmScan` delegates to `addCardToCatalog`.
`rejectScan` is a no-op. `ConfirmationPanel` component overlays the camera feed on stable
detection: shows card image, name, set, rarity, confidence, strategy, duplicate badge (with
current quantity), and low-confidence badge. Two primary actions — Confirm and Reject — plus
a "Search manually" mode with debounced `searchCards()` and result list. `ScannerPage`
extended with the confirmation phase (`{ confirming: ConfirmationData }`), `handleConfirm`
(async: adds to catalog, increments session tally, refreshes log), `handleReject` (resumes
detection loop), and a collapsible session scan log showing confirmed cards with thumbnail,
name, set, and time. 20 new tests (9 AddCardToCatalog/ConfirmScan/RejectScan, 11
ConfirmationPanel). Total: 234 tests passing.

Next: Phase 10 — Image Caching and Offline Support.

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
| 7 | Local pHash Card Identification | complete | 2026-04-27 |
| 8 | LLM Vision Fallback | complete | 2026-04-28 |
| 9 | Scan Confirmation Flow and Catalog Management | complete | 2026-05-02 |
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
- Status: complete
- Blockers: none
- Notes: `PHashEntry` entity and `IPHashIndexRepository` interface added to domain. Migration 2
  creates `phash_index` SQLite table; IndexedDB bumped to v2 with a `phash_index` store.
  `SQLitePHashIndexRepository` and `IndexedDBPHashIndexRepository` implement the interface.
  `pHash.ts` implements DCT-based 64-bit perceptual hashing. `LocalPHashIdentifier` queries
  the index and applies a Hamming-distance threshold (≤10 → identified). `buildPHashIndex`
  is an injectable, idempotent index builder (uses `ImageLoader` callback for testability).
  `browserImageLoader` provided for production canvas-based image loading. `IStorageAdapter`
  extended with `pHashIndexRepository`; `IPlatform` extended with `cardIdentificationService`;
  all platform implementations (Tauri, browser, stub) wired accordingly. `ScannerPage`
  triggers identification on stable detection, shows Identifying/Match/Low-confidence states.
  27 new tests (7 pHash, 4 index builder, 4 identifier, 6 SQLite repo, 6 IndexedDB repo).
  Total: 192 tests passing.

### Phase 8 — LLM Vision Fallback
- Status: complete
- Blockers: none
- Notes: `AnthropicVisionClient` posts base64 JPEG frames to `claude-sonnet-4-6` and parses
  structured JSON card identification results. `HybridIdentificationService` composes local
  pHash and LLM strategies: pHash first, LLM fallback on low confidence. LLM result resolved
  via `searchCards()` filtered by set name + card number; unique match → identified.
  Gracefully degrades with no API key. Wired as live `ICardIdentificationService`.
  15 new tests. Total: 214 tests passing.

### Phase 9 — Scan Confirmation Flow and Catalog Management
- Status: complete
- Blockers: none
- Notes: `addCardToCatalog` fully implemented (cache card metadata, upsert catalog entry,
  write confirmed ScanEvent, increment session count). `confirmScan` delegates to it;
  `rejectScan` is a no-op. `ConfirmationPanel` component overlays camera feed: shows card
  image/details, low-confidence and duplicate badges, Confirm + Reject + Search manually
  (debounced search mode with result list). `ScannerPage` extended with confirmation phase,
  confirmation handlers, and collapsible session scan log. 20 new tests.
  Total: 234 tests passing.

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
