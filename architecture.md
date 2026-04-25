# Pokemon Card Catalog — Architecture

## Technology Decisions

### Desktop / Browser Framework: Tauri 2

Tauri 2 is selected over Electron for the following reasons:
- Significantly smaller bundle size (uses the OS system WebView rather than bundling Chromium).
- Rust backend provides memory safety and a strong security model for local file and database access.
- The frontend is a standard web application (Vite + React) that can be built independently and deployed to a browser without modification.
- Tauri 2 has stable Windows, macOS, and Linux support.

The web frontend build is deployable as a standalone static site for browser use. When running in the browser, platform-specific features (SQLite, native file paths) are replaced by browser-native equivalents via the abstraction layer described below.

### Frontend: React + TypeScript + Vite

- React with TypeScript for the UI, chosen for its mature ecosystem and strong typing support.
- Vite as the build tool for fast development iteration and lean production bundles.
- Tailwind CSS for styling — utility-first, no design system dependency, easy to keep consistent across grid and list views.
- TanStack Query for asynchronous data fetching and cache management (API calls, image loading).
- Zustand for lightweight global UI state (active view, current scan session, selected filters).

### Local Database: SQLite

- SQLite is used as the local persistence store on desktop (via the Tauri SQL plugin, backed by `rusqlite`).
- On browser, the repository abstraction is implemented over IndexedDB.
- A single schema is defined and versioned; migrations are managed explicitly rather than via an ORM, keeping the database portable and inspectable.
- The database file on desktop is stored in the OS application data directory and is a plain `.db` file the user can copy or back up.

### Pokemon Card Data: Pokemon TCG API

- `pokemontcg.io` (Pokemon TCG Developers API) is used as the authoritative source for card metadata and stock images.
- It provides card name, set, sequence number, rarity, type, and high-resolution card images.
- All metadata and images fetched from the API are cached locally so the dashboard works offline once cards have been catalogued.
- The API is free tier with rate limits; the local cache eliminates repeat calls for already-fetched cards.

### Card Identification: Hybrid Vision Pipeline

Card identification during webcam scanning uses a two-stage pipeline with a local-first, LLM-fallback strategy:

**Stage 1 — Local Perceptual Hash Matching**
A local index of perceptual hashes (pHash) is built from the thumbnail images of all cards in the Pokemon TCG API. When a card is detected in the webcam feed, a pHash of the captured frame is compared against the index. If a match is found above a confidence threshold, the card is identified immediately without a network call. This supports fast offline scanning once the index has been built.

**Stage 2 — LLM Vision Fallback**
If the local match confidence is below the threshold (e.g. foil cards, unusual lighting, significant angle), a frame is sent to a vision-capable LLM (Claude claude-sonnet-4-6 via the Anthropic API). The model is prompted to identify the card name, set, and number from the image. The returned values are resolved against the Pokemon TCG API to obtain the canonical card ID. This stage requires an active internet connection and an Anthropic API key.

The identification strategy is injected at runtime — the pipeline is not hardcoded to either approach, making it straightforward to swap or extend (e.g. a future local ML model).

---

## Layered Architecture

The codebase is structured into four layers. Dependencies point inward: infrastructure depends on domain, application depends on domain, presentation depends on application.

```
┌───────────────────────────────────────────────────────┐
│                  Presentation Layer                    │
│         React components, pages, UI-only state        │
├───────────────────────────────────────────────────────┤
│                  Application Layer                     │
│     Use cases, service orchestration, session logic   │
├───────────────────────────────────────────────────────┤
│                    Domain Layer                        │
│   Entities, value objects, repository interfaces,     │
│   service interfaces — no framework dependencies      │
├──────────────────────────┬────────────────────────────┤
│    Infrastructure Layer  │   Infrastructure Layer     │
│    (Desktop / Tauri)     │   (Browser / Web)          │
│  SQLite, native FS,      │  IndexedDB, localStorage,  │
│  Tauri IPC commands      │  browser WebRTC            │
└──────────────────────────┴────────────────────────────┘
```

### Presentation Layer

Responsibilities:
- Render the collection dashboard (grid and list views).
- Render the scanning UI (live camera feed, confirmation panel, session tally).
- Handle user interactions: filter changes, layout toggle, scan confirmations and rejections.
- Consume application layer services and use cases only — no direct database or API calls.

Contains no business logic. All state that needs to persist beyond a page render is managed via the application layer or the query cache.

### Application Layer

Responsibilities:
- Implement the use cases: `AddCardToCatalog`, `ConfirmScan`, `RejectScan`, `SearchCatalog`, `GetCardDetail`, `StartScanSession`, `EndScanSession`.
- Orchestrate the card identification pipeline: invoke the `CardIdentificationService`, handle fallback logic, map results to domain entities.
- Coordinate between the domain repository interfaces and the external data provider to ensure metadata and images are cached locally before a card is confirmed.
- Expose clean, async service methods to the presentation layer; surface errors as typed result types rather than exceptions.

### Domain Layer

Responsibilities:
- Define the core entities and value objects (see Data Model section below).
- Define repository interfaces that the infrastructure layer must satisfy.
- Define service interfaces for external concerns (card identification, card data).
- Contain no framework, database, or HTTP dependencies.

This layer is the stable centre of the application. Changes to the database technology, the external API, or the identification strategy should not require changes here.

### Infrastructure Layer

Responsibilities:
- Implement the repository interfaces defined in the domain layer.
- Implement the external API client for the Pokemon TCG API.
- Implement the card identification strategies (local pHash matcher, LLM vision client).
- Provide platform adapters: the Tauri adapter uses IPC commands to call Rust for SQLite access; the browser adapter uses IndexedDB.
- Manage the local image and metadata cache (writes fetched assets to disk or to the browser cache API).

---

## Domain Entities and Interfaces

### Core Entities

**`PokemonCard`**
The canonical representation of a single card as defined by the Pokemon TCG. Sourced from and keyed to the Pokemon TCG API.
- `id: string` — Pokemon TCG API card ID (e.g. `"base1-4"`)
- `name: string`
- `setId: string`
- `setName: string`
- `number: string` — sequence number within set (e.g. `"006"`)
- `rarity: string`
- `type: CardType` — Pokémon | Trainer | Energy
- `imageUrl: string` — high-resolution stock image URL

**`CardSet`**
- `id: string` — Pokemon TCG API set ID
- `name: string`
- `series: string`
- `releaseDate: string`
- `total: number` — total cards in the set

**`CatalogEntry`**
A user-owned record linking a `PokemonCard` to their collection.
- `id: string`
- `cardId: string` — foreign key to `PokemonCard.id`
- `quantity: number`
- `firstAddedAt: Date`

**`ScanEvent`**
An immutable record of a single scan action.
- `id: string`
- `cardId: string`
- `scannedAt: Date`
- `sessionId: string`
- `confirmed: boolean`

**`ScanSession`**
A bounded scanning session (start to finish of the scanning UI view).
- `id: string`
- `startedAt: Date`
- `endedAt: Date | null`
- `cardsScanned: number`

### Repository Interfaces

All repository interfaces are defined in the domain layer. Implementations live in the infrastructure layer.

```
ICardRepository
  findById(id: string): Promise<PokemonCard | null>
  findAll(filter?: CardFilter): Promise<PokemonCard[]>
  upsert(card: PokemonCard): Promise<void>

ICatalogRepository
  findByCardId(cardId: string): Promise<CatalogEntry | null>
  findAll(filter?: CatalogFilter): Promise<CatalogEntry[]>
  save(entry: CatalogEntry): Promise<void>
  incrementQuantity(cardId: string): Promise<void>

IScanEventRepository
  save(event: ScanEvent): Promise<void>
  findBySession(sessionId: string): Promise<ScanEvent[]>

IScanSessionRepository
  save(session: ScanSession): Promise<void>
  findById(id: string): Promise<ScanSession | null>
  update(session: ScanSession): Promise<void>
```

The separation of `ICardRepository` (the reference catalog of all Pokemon cards) from `ICatalogRepository` (the user's personal collection) is intentional. The card reference data is a shared, append-only lookup table populated from the API. The catalog data is the user's mutable personal records.

### Service Interfaces

```
ICardIdentificationService
  identify(frame: ImageFrame): Promise<IdentificationResult>

  IdentificationResult:
    status: 'identified' | 'low_confidence' | 'not_a_card'
    cardId?: string
    confidence: number
    strategy: 'local_hash' | 'llm_vision'

IPokemonCardDataProvider
  getCard(id: string): Promise<PokemonCard>
  getSet(id: string): Promise<CardSet>
  searchCards(query: string): Promise<PokemonCard[]>
  getAllSets(): Promise<CardSet[]>
```

---

## Card Identification Pipeline (Detail)

```
Webcam frame
      │
      ▼
┌─────────────────────┐
│  Card Presence      │  Lightweight detector (edge/rectangle detection)
│  Detector           │  Filters out frames with no card-shaped object
└────────┬────────────┘
         │ card detected
         ▼
┌─────────────────────┐
│  Frame Preprocessor │  Crop to card bounds, normalise size and
│                     │  brightness, correct perspective skew
└────────┬────────────┘
         ▼
┌─────────────────────┐
│  Local pHash        │  Compare against pre-built index of card
│  Matcher            │  thumbnails; return best match + confidence
└────────┬────────────┘
         │
    ┌────┴────────────────┐
    │ confidence ≥ threshold│──► return result to application layer
    └─────────────────────┘
         │ confidence < threshold
         ▼
┌─────────────────────┐
│  LLM Vision Client  │  Send frame to Claude claude-sonnet-4-6 vision API;
│  (Anthropic API)    │  parse card name, set, number from response;
│                     │  resolve to Pokemon TCG API card ID
└─────────────────────┘
```

The card presence detector runs continuously on the live feed at a low frequency (e.g. 4 fps). The heavier identification pipeline is only triggered once a stable card presence is confirmed across several consecutive frames, reducing spurious triggers and API costs.

---

## Caching Strategy

**Card Metadata Cache**
- On first fetch, card and set metadata from the Pokemon TCG API is written to the local SQLite database (or IndexedDB on browser) via `ICardRepository`.
- Subsequent lookups read from the local database without hitting the network.
- No TTL on metadata (Pokemon card data is effectively immutable).

**Card Image Cache**
- On desktop, card images are downloaded and stored in the OS application data directory under a flat content-addressed directory keyed by card ID.
- On browser, images are stored via the Cache API (service worker) keyed by card ID.
- Before any card is confirmed into the catalog, its image is downloaded and cached, so the dashboard renders immediately without network dependency.

**pHash Index**
- The local perceptual hash index is built lazily: hashes are computed and stored for each card image as it is cached. A full pre-build step can be triggered manually.
- The index is stored as a binary file or a table in the local database for fast lookup.

---

## Platform Adapter Pattern

To support both Tauri desktop and browser without branching logic in the application or domain layers, a `Platform` interface is resolved at startup:

```
IPlatform
  storage: IStorageAdapter       // SQLite (Tauri) or IndexedDB (browser)
  imageCache: IImageCacheAdapter // Filesystem (Tauri) or Cache API (browser)
  camera: ICameraAdapter         // WebRTC getUserMedia (both, via web layer)
```

The correct implementation is injected once at application bootstrap based on whether the app is running inside a Tauri WebView or a plain browser. All layers above infrastructure depend only on the `IPlatform` interface.

Camera access is identical on both targets because Tauri's WebView exposes the standard WebRTC `getUserMedia` API — no Tauri-specific camera bindings are needed.

---

## External API Integration

### Pokemon TCG API (`pokemontcg.io`)

- REST API, JSON responses.
- Used for: card search, card detail, set listing, card image URLs.
- A single `PokemonTCGApiClient` class in the infrastructure layer wraps all calls.
- Responses are mapped to domain entities before being returned; the rest of the app never handles raw API shapes.
- An API key is optional for the free tier but recommended to raise rate limits; it is stored in the app settings.

### Anthropic API (LLM Vision Fallback)

- Used only when local pHash matching fails to produce a confident result.
- A single `AnthropicVisionClient` class sends a base64-encoded frame to the Claude claude-sonnet-4-6 API with a structured prompt.
- The prompt instructs the model to return a structured JSON object containing card name, set name, and sequence number; the client validates and parses this before returning.
- The API key is stored in app settings; if no key is configured, the LLM fallback is disabled and low-confidence matches are surfaced to the user for manual confirmation instead.
- API calls are debounced and only made when local matching fails, keeping cost low.

---

## Data Flow: Scanning a Card

1. Webcam feed renders in the `ScannerView` component via WebRTC.
2. The `ScanSessionService` (application layer) polls frames from the feed at 4 fps and passes them to `CardPresenceDetector`.
3. On stable card detection, a frame is captured and passed to `CardIdentificationService`.
4. `CardIdentificationService` runs the local pHash matcher. On success, returns an `IdentificationResult`.
5. On low confidence, the LLM vision client is invoked. The LLM response is resolved to a `PokemonCard` via `IPokemonCardDataProvider`.
6. `ScanSessionService` checks `ICatalogRepository` to determine if the card is already owned and at what quantity.
7. The result (matched card, confidence, existing quantity) is surfaced to the `ConfirmationPanel` in the UI.
8. On user confirmation, `AddCardToCatalog` use case is called: upserts the `PokemonCard` reference, increments or creates the `CatalogEntry`, and writes a `ScanEvent` to `IScanEventRepository`.
9. The UI resets to active scanning mode; session tally increments.

---

## Future-Proofing: Distributed or Multi-Tenant Data

The repository interfaces are the sole abstraction boundary between the application logic and persistence. Moving to a remote database or a multi-tenant data API requires only:

1. Implementing the repository interfaces against the new backend (e.g. a REST or GraphQL API).
2. Updating the `IPlatform` storage adapter to return the new implementations.
3. No changes to the application layer, domain layer, or presentation layer.

Considerations already reflected in the design:
- All repository methods are async, so remote I/O is a first-class concern.
- `ScanEvent` records are append-only and timestamped, which maps well to an event-sourced or audit-log backend.
- `CatalogEntry` uses a stable external key (`cardId` from the Pokemon TCG API) so records can be reconciled across devices without conflict.
- Authentication and multi-tenancy would be introduced at the `IPlatform` layer (e.g. an auth adapter) without leaking into domain logic.

---

## Summary: Technology Stack

| Concern | Technology |
|---|---|
| Desktop wrapper | Tauri 2 (Rust) |
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Async data / caching | TanStack Query |
| UI state | Zustand |
| Local database (desktop) | SQLite via Tauri SQL plugin |
| Local database (browser) | IndexedDB |
| Card data & images | Pokemon TCG Developers API |
| Card identification (primary) | Perceptual hash (pHash) matching against local index |
| Card identification (fallback) | Claude claude-sonnet-4-6 vision via Anthropic API |
| Camera access | WebRTC `getUserMedia` (both targets) |
