# Pokemon Card Catalog — Implementation Plan

## Principles

Each phase delivers a vertically complete, committable increment:
- The app must build and run at the end of every phase.
- No phase leaves the codebase in a broken or partially-integrated state.
- Phases are ordered so each one unlocks the next; later phases do not require revisiting earlier structural decisions.
- Stub or in-memory implementations are used to satisfy interface contracts in early phases, replaced by real implementations in dedicated later phases.

---

## Phase 1: Project Scaffold

**Goal:** A Tauri 2 desktop application that builds, launches, and renders a minimal shell UI. A plain Vite build of the same frontend also renders in a browser. No functional features yet.

### 1.1 Repository and Tooling Setup

- Initialise a git repository with a `.gitignore` appropriate for Node.js, Rust, and Tauri artefacts.
- Initialise a Tauri 2 project using the official Tauri CLI with a Vite + React + TypeScript frontend template.
- Add Tailwind CSS, configured via PostCSS.
- Add Zustand and TanStack Query as frontend dependencies.
- Add Vitest and React Testing Library as dev dependencies for unit testing.
- Verify that `tauri dev` launches the desktop shell and `vite build` produces a browser-deployable bundle.

### 1.2 Directory Structure

Establish the four-layer directory structure under `src/`:

```
src/
  domain/
    entities/         # TypeScript type definitions for all domain entities
    interfaces/       # Repository and service interface definitions (TypeScript interfaces only)
  application/
    usecases/         # One file per use case — empty shells at this stage
    services/         # Orchestration services — empty shells
  infrastructure/
    platform/         # IPlatform adapter and runtime resolver
    db/               # Repository implementations (stubs returning empty data)
    api/              # External API clients (stubs)
    vision/           # Card identification strategies (stubs)
  presentation/
    components/       # Shared UI components
    pages/            # Top-level page components
    hooks/            # Custom React hooks
```

The Tauri Rust source remains under `src-tauri/` as per Tauri convention.

### 1.3 Domain Layer Definitions

Define all TypeScript types and interfaces from the architecture document — no implementations, no logic:

- Entity types: `PokemonCard`, `CardSet`, `CatalogEntry`, `ScanEvent`, `ScanSession`, `CardType`.
- Repository interfaces: `ICardRepository`, `ICatalogRepository`, `IScanEventRepository`, `IScanSessionRepository`.
- Service interfaces: `ICardIdentificationService`, `IPokemonCardDataProvider`.
- Platform interfaces: `IPlatform`, `IStorageAdapter`, `IImageCacheAdapter`, `ICameraAdapter`.
- Supporting types: `CardFilter`, `CatalogFilter`, `IdentificationResult`, `ImageFrame`.

### 1.4 Stub Infrastructure

Provide stub implementations of all interfaces so the application layer and presentation layer can be wired up without real backends:

- `StubCardRepository`, `StubCatalogRepository` etc. — return empty arrays or null.
- `StubCardIdentificationService` — always returns `status: 'not_a_card'`.
- `StubPokemonCardDataProvider` — returns a small set of hard-coded cards.
- `StubPlatform` — assembles the stub adapters; registered as the active platform for both Tauri and browser at this stage.

### 1.5 Application Layer Shells

Create empty use case files and service files with the correct signatures, wired to the stub infrastructure via dependency injection. No logic yet — each use case returns a resolved promise with a stub value.

Use cases to scaffold: `AddCardToCatalog`, `ConfirmScan`, `RejectScan`, `SearchCatalog`, `GetCardDetail`, `StartScanSession`, `EndScanSession`.

### 1.6 Routing and Shell UI

- Install and configure a client-side router (React Router or TanStack Router).
- Create two top-level routes: `/dashboard` and `/scanner`.
- Create placeholder page components for each: a heading, a brief description, and a navigation link to the other route.
- Create a persistent top-level layout shell with a navigation bar linking the two pages.
- The app opens to `/dashboard` by default.

### 1.7 Acceptance Criteria

- `tauri dev` launches the desktop application window showing the shell UI.
- `vite build` completes without errors and the output opens in a browser showing the same shell.
- `cargo build` (inside `src-tauri/`) compiles without errors.
- Navigating between `/dashboard` and `/scanner` routes works in both targets.
- TypeScript compilation (`tsc --noEmit`) passes with zero errors.

---

## Phase 2: CI/CD Pipeline

**Goal:** A GitHub Actions pipeline that runs on every push and pull request, builds the frontend, runs unit tests, and verifies the Tauri desktop build compiles.

### 2.1 Frontend Build and Test Workflow

Trigger: push to any branch, pull request to `main`.

Steps:
1. Check out repository.
2. Set up Node.js (current LTS).
3. Install dependencies (`npm ci`).
4. TypeScript type-check (`tsc --noEmit`).
5. Run unit tests with Vitest (`vitest run`).
6. Build the Vite frontend (`vite build`).
7. Upload the `dist/` artefact.

### 2.2 Tauri Desktop Build Workflow

Trigger: push to `main` and pull requests to `main`.

Build matrix: Ubuntu, macOS, Windows (using `runs-on` matrix strategy).

Steps:
1. Check out repository.
2. Install system dependencies for each platform (WebKit on Ubuntu, Xcode tools on macOS, etc.).
3. Set up Rust (stable toolchain via `dtolnay/rust-toolchain`).
4. Cache Rust build artefacts (`Swatinem/rust-cache`).
5. Set up Node.js and install frontend dependencies.
6. Run the Tauri build (`tauri build`).
7. Upload platform-specific installer artefacts.

### 2.3 Unit Test Coverage

At the end of Phase 1 there is minimal logic to test. Phase 2 establishes the test infrastructure:

- Configure Vitest with a jsdom environment for React component tests.
- Add a test for each domain entity shape (type assertion tests confirming objects satisfy interfaces).
- Add a test for the stub implementations (confirming they satisfy their interfaces and return without throwing).
- Add a smoke test per page component (renders without crashing).

This gives a working test baseline that later phases extend.

### 2.4 Branch Protection

Document (do not automate) the recommended GitHub branch protection rules for `main`:
- Require the frontend build and test workflow to pass before merge.
- Require at least one approving review (optional for a solo project, noted for future team use).

### 2.5 Acceptance Criteria

- Pushing to any branch triggers the frontend workflow; pushing to `main` or opening a PR against it also triggers the Tauri build matrix.
- All three platform builds complete successfully.
- Vitest reports all tests passing.
- A failing test causes the workflow to fail and blocks a green status check.

---

## Phase 3: Pokemon TCG API Integration

**Goal:** Replace the stub card data provider with a real implementation backed by `pokemontcg.io`. Card metadata and images can be fetched, and fetched data is persisted locally so subsequent lookups are served from the local cache.

### 3.1 API Client

- Implement `PokemonTCGApiClient` in the infrastructure API layer.
- Methods: `getCard(id)`, `getSet(id)`, `searchCards(query)`, `getAllSets()`.
- Responses mapped to domain entity types before returning; raw API shapes do not leak outside the client.
- API key read from an environment variable or app settings; gracefully degrades to unauthenticated (lower rate limit) if absent.

### 3.2 Metadata Cache

- Implement a metadata caching wrapper that decorates `IPokemonCardDataProvider`.
- On first fetch, writes the result to the local database via `ICardRepository`.
- On subsequent calls, reads from the database and skips the network request.
- Image URLs are stored in the cached metadata; image files themselves are handled separately (Phase 7).

### 3.3 Provider Registration

- Wire `PokemonTCGApiClient` (with the caching wrapper) as the active `IPokemonCardDataProvider` in the platform adapter.
- The stub provider is retained as an offline fallback for use in tests.

### 3.4 Unit Tests

- Mock HTTP responses for all API client methods.
- Test the caching wrapper: verify a second call for the same card does not make a network request.

---

## Phase 4: Local Persistence Layer

**Goal:** Replace stub repositories with real SQLite implementations (desktop) and an IndexedDB implementation (browser). Data written in one session is present in the next.

### 4.1 Database Schema and Migrations

Define the schema for:
- `pokemon_cards` — cached card reference data.
- `card_sets` — cached set data.
- `catalog_entries` — user's collection.
- `scan_events` — immutable scan log.
- `scan_sessions` — session records.

Implement a lightweight migration runner: each migration is a numbered SQL file; on startup, the runner checks which have been applied and runs any pending ones.

### 4.2 Tauri SQL Plugin Setup

- Add the Tauri SQL plugin to `src-tauri/`.
- Expose Rust commands for executing SQL and returning results as JSON.
- Implement the IPC bridge that the frontend infrastructure layer calls.

### 4.3 Repository Implementations (Desktop)

Implement all four repository interfaces against SQLite:
- `SQLiteCardRepository`
- `SQLiteCatalogRepository`
- `SQLiteScanEventRepository`
- `SQLiteScanSessionRepository`

### 4.4 Repository Implementations (Browser)

Implement all four repository interfaces against IndexedDB:
- `IndexedDBCardRepository`
- `IndexedDBCatalogRepository`
- `IndexedDBScanEventRepository`
- `IndexedDBScanSessionRepository`

### 4.5 Platform Adapter Resolver

Update `IPlatform` resolver to detect the runtime:
- If running inside a Tauri WebView (`window.__TAURI__` is defined): use SQLite adapters.
- Otherwise: use IndexedDB adapters.

### 4.6 Unit Tests

- Test each repository implementation against an in-memory or temporary database.
- Test the migration runner: verify a fresh database has all tables, and a partially migrated database applies only pending migrations.

---

## Phase 5: Collection Dashboard

**Goal:** The Dashboard page displays the user's actual catalog using real card data and persisted catalog entries, with working grid/list toggle, filtering, and sorting.

### 5.1 Card Grid View

- `CardGrid` component renders a responsive grid of `CardTile` components.
- `CardTile` displays the stock card image (URL from cached metadata), card name, set name, and a quantity badge if quantity > 1.
- Images are loaded lazily.

### 5.2 Card List View

- `CardList` component renders a table or row-based list.
- Each row shows a small card thumbnail, name, set, sequence number, rarity, type, quantity, and date first added.

### 5.3 View Toggle

- A toggle control switches between grid and list modes.
- The selected mode is persisted to `localStorage` so it survives page reloads.

### 5.4 Filtering and Sorting Controls

- Filter bar: text search (name), set/edition picker, rarity picker, card type picker.
- Sort control: name, set, sequence number, rarity, date added — ascending/descending.
- All filters and sort state are URL query parameters so views can be bookmarked or linked.

### 5.5 Empty and Loading States

- Empty state shown when the catalog has no entries, with a call-to-action directing to the Scanner.
- Skeleton loaders shown while data is loading.

### 5.6 Use Case Integration

- `SearchCatalog` use case is fully implemented: queries `ICatalogRepository` with filter and sort parameters, joins to `ICardRepository` for display metadata.
- `GetCardDetail` use case is fully implemented: retrieves a single catalog entry and its full card metadata.

### 5.7 Unit Tests

- Test `SearchCatalog` use case with various filter and sort combinations against a stub repository.
- Test `CardGrid` and `CardList` components render correctly given a list of catalog entries.

---

## Phase 6: Webcam Feed and Card Presence Detection

**Goal:** The Scanner page displays a live webcam feed. A card held in front of the camera is visually highlighted when its rectangular shape is detected. No identification yet.

### 6.1 Camera Adapter

- Implement `WebRTCCameraAdapter` satisfying `ICameraAdapter`.
- Opens a `getUserMedia` stream, exposes the stream for rendering and frame capture.
- Exposes a method to enumerate available cameras and select one.

### 6.2 Scanner Page Layout

- Live video feed rendered at a prominent size.
- Camera selector dropdown shown above the feed.
- Visual overlay drawn on a `<canvas>` layered over the video element for detection feedback.
- A session tally panel shows cards scanned this session (zero at this stage).

### 6.3 Card Presence Detector

- A lightweight client-side detector runs on extracted frames at ~4 fps.
- Uses geometric edge and rectangle detection (e.g. via a small canvas-based implementation or a WebAssembly OpenCV build) to identify a card-shaped object in the frame.
- When a stable card-shaped region is detected across several consecutive frames, the detected card bounds are highlighted on the overlay canvas.
- No identification is triggered yet.

### 6.4 Frame Preprocessor

- When a stable card detection occurs, the preprocessor crops the frame to the detected card bounds, normalises the image size, and corrects perspective skew.
- The normalised frame is an `ImageFrame` value as defined in the domain layer — ready to pass to the identification service in Phase 7.

### 6.5 Scan Session Lifecycle

- `StartScanSession` use case is fully implemented: creates and persists a `ScanSession`, returns the session ID.
- `EndScanSession` use case is fully implemented: marks the session ended, records final card count.
- The Scanner page starts a session on mount and ends it on unmount.

### 6.6 Unit Tests

- Test `StartScanSession` and `EndScanSession` use cases.
- Test the frame preprocessor with a synthetic card-shaped image: confirm the output is correctly cropped and normalised.

---

## Phase 7: Local pHash Card Identification

**Goal:** When a card is detected and a preprocessed frame is ready, the app attempts to identify the card by perceptual hash matching against a local index of card thumbnails.

### 7.1 pHash Index Builder

- A background process fetches thumbnail images for all cards from the Pokemon TCG API (using the cached metadata from Phase 3).
- For each thumbnail, a perceptual hash is computed and stored alongside the card ID in a dedicated database table.
- The build process is idempotent: cards already in the index are skipped.
- A progress indicator in the app settings page shows how many cards have been indexed.

### 7.2 Local pHash Matcher

- Implement `LocalPHashIdentifier` satisfying `ICardIdentificationService`.
- Computes a pHash of the incoming `ImageFrame`.
- Queries the index for the closest match (Hamming distance).
- Returns an `IdentificationResult` with the matched card ID and a confidence score derived from the Hamming distance.
- Below a configurable distance threshold, returns `status: 'low_confidence'`.

### 7.3 Identification Service Registration

- Register `LocalPHashIdentifier` as the active `ICardIdentificationService` in the platform adapter.
- The LLM fallback (Phase 8) is not yet wired in; low-confidence results go to the confirmation panel with a warning.

### 7.4 Identification Loop in Scanner

- Once card detection stabilises, the scanner service submits the preprocessed frame to `ICardIdentificationService`.
- A loading indicator is shown on the overlay canvas during identification.
- On a result, the scanner transitions to the confirmation panel (Phase 9).

### 7.5 Unit Tests

- Test `LocalPHashIdentifier` with known card images: verify correct identification above threshold and `low_confidence` for dissimilar images.
- Test the pHash index builder: verify hashes are stored and not duplicated on repeated runs.

---

## Phase 8: LLM Vision Fallback

**Goal:** When the local pHash matcher returns low confidence, the frame is sent to the Claude claude-sonnet-4-6 vision API. The LLM response is parsed and resolved to a canonical card ID.

### 8.1 Anthropic API Client

- Implement `AnthropicVisionClient` in the infrastructure vision layer.
- Sends a base64-encoded `ImageFrame` to the Claude claude-sonnet-4-6 API with a structured prompt.
- The prompt requests a JSON response containing `cardName`, `setName`, and `cardNumber`.
- Response is validated and parsed; parsing errors return a failure result rather than throwing.

### 8.2 LLM Result Resolution

- The parsed LLM response (name + set + number) is resolved to a `PokemonCard` by calling `IPokemonCardDataProvider.searchCards()`.
- If a unique match is found, returns `IdentificationResult` with the card ID and `strategy: 'llm_vision'`.
- If no unique match is found, returns a low-confidence result for manual resolution.

### 8.3 Composite Identification Service

- Implement `HybridIdentificationService` that wraps both the local and LLM strategies.
- Calls local pHash first; if confidence is below threshold, calls the LLM client.
- Register this composite as the active `ICardIdentificationService`.

### 8.4 API Key Configuration

- The Anthropic API key is read from an environment variable or a settings store.
- If the key is absent, `HybridIdentificationService` skips the LLM step and surfaces low-confidence results to the user for manual correction.

### 8.5 Unit Tests

- Mock the Anthropic API response; test that the resolution logic maps the LLM output to a card ID correctly.
- Test `HybridIdentificationService`: verify the LLM path is taken only when the local matcher returns low confidence.
- Test API key absence: verify graceful degradation with no key configured.

---

## Phase 9: Scan Confirmation Flow and Catalog Management

**Goal:** The full end-to-end scan flow works: detect → identify → confirm → add to catalog. The confirmation panel is fully functional, and catalog state is correctly updated and persisted.

### 9.1 Confirmation Panel

- Shown after a card is identified (either strategy).
- Displays: matched stock image, card name, set, sequence number, confidence level, whether the card is already in the catalog and current quantity.
- Highlights duplicates with a visible indicator.
- Two actions: Confirm (adds to catalog) and Reject (dismisses and returns to active scanning).
- Reject also offers a manual search: the user can type a card name, see matching results from `IPokemonCardDataProvider`, and select the correct card to add.

### 9.2 AddCardToCatalog Use Case (Full Implementation)

- Receives a confirmed `cardId`.
- Ensures the card's metadata is cached locally via `ICardRepository` (fetches from API if not already cached).
- Fetches and caches the card image.
- Upserts a `CatalogEntry`: creates a new entry at quantity 1, or increments quantity if an entry already exists.
- Writes a `ScanEvent` to `IScanEventRepository`.
- Updates the active `ScanSession` scan count.

### 9.3 Post-Confirmation Flow

- After a successful `AddCardToCatalog`, the confirmation panel is dismissed.
- The scanner returns immediately to active scanning mode — camera feed resumes, detection loop restarts.
- The session tally increments.

### 9.4 Session Scan Log

- A collapsible panel in the Scanner page lists all `ScanEvent` records from the current session.
- Each entry shows the card image thumbnail, name, set, and time scanned.

### 9.5 Unit Tests

- Test `AddCardToCatalog`: verify catalog entry is created on first scan, and quantity increments on duplicate.
- Test `ConfirmScan` and `RejectScan` use cases.
- Test the confirmation panel component renders correctly for new cards, duplicates, and low-confidence identifications.

---

## Phase 10: Image Caching and Offline Support

**Goal:** All card images are stored locally after first fetch. The dashboard and confirmed scan history render fully offline once cards have been catalogued.

### 10.1 Desktop Image Cache

- `FilesystemImageCacheAdapter` writes downloaded card images to the OS application data directory, keyed by card ID.
- Before a card is confirmed into the catalog, its high-resolution image is downloaded and written to the cache.
- Dashboard `CardTile` and `CardList` components resolve image paths through the cache adapter; they serve the local file path when cached, or the remote URL with a network fallback when not.

### 10.2 Browser Image Cache

- `ServiceWorkerImageCacheAdapter` stores images in the Cache API.
- A service worker is registered at app startup to intercept image requests and serve from cache when available.

### 10.3 Cache Pre-population

- When a card is added to the catalog, its stock image is proactively downloaded and cached even if the dashboard has not been visited.

### 10.4 Unit Tests

- Test `FilesystemImageCacheAdapter`: verify images are written and retrieved correctly; verify a missing image returns a fallback.

---

## Phase 11: Settings, Error Handling, and Polish

**Goal:** The application is production-quality. Users can configure API keys and camera selection. Errors are handled gracefully at all points.

### 11.1 Settings Page

- Route: `/settings`.
- Fields: Anthropic API key (masked input, saved to platform settings store), Pokemon TCG API key, default camera device, grid/list preference.
- pHash index status: shows count of indexed cards, a button to trigger a full rebuild.

### 11.2 Error Boundaries

- React error boundaries wrap each page to prevent a component crash from taking down the entire app.
- Network errors from the API client are caught and surfaced as inline error messages rather than broken UI states.
- Camera access errors (permissions denied, no camera found) are shown as actionable messages in the Scanner page.

### 11.3 Accessibility and Responsiveness

- All interactive elements are keyboard-navigable.
- ARIA labels on the camera feed, confirmation panel, and filter controls.
- Layouts are responsive down to a minimum 1024px viewport width (desktop-primary).

### 11.4 Production Build Verification

- Confirm `tauri build` produces signed installers for all three platforms via the CI matrix.
- Confirm `vite build` produces a static bundle that works when served from any path prefix.
- Confirm all unit tests pass in CI.

---

## Phase Summary

| Phase | Deliverable | Acceptance Gate |
|---|---|---|
| 1 | Tauri 2 scaffold, all layers stubbed, shell UI | `tauri dev` and `vite build` succeed; TypeScript passes |
| 2 | GitHub Actions CI/CD | All workflows green; failing test blocks merge |
| 3 | Pokemon TCG API integration + metadata cache | Cards fetchable; cache prevents duplicate network calls |
| 4 | SQLite + IndexedDB repositories | Persisted data survives app restart on both targets |
| 5 | Collection dashboard | Grid/list views render real catalog data with filters |
| 6 | Webcam feed + card presence detection | Camera renders; card rectangle highlighted on detection |
| 7 | Local pHash identification | Known cards identified offline; low-confidence surfaced |
| 8 | LLM vision fallback | Low-confidence cards resolved via Claude vision API |
| 9 | Full scan confirmation flow | End-to-end scan adds to catalog; duplicates handled |
| 10 | Image caching + offline support | Dashboard renders fully offline after first use |
| 11 | Settings, error handling, polish | App is production-ready on all three platforms |
