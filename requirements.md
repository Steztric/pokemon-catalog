# Pokemon Card Catalog — Requirements

## Overview

A cross-platform application for cataloging a personal Pokemon card collection. The app runs on desktop and in the browser from a single codebase. It serves two primary purposes: browsing the catalogued collection visually, and rapidly scanning physical cards via webcam to add them to the catalog.

---

## Platform Requirements

- Must run as a native desktop application on Windows, macOS, and Linux.
- Must also be usable directly in a modern web browser without installation.
- A single codebase should target both deployment targets (e.g. Electron or Tauri for desktop; the same web bundle for browser).
- Webcam access is required on both desktop and browser targets.

---

## Feature 1: Collection Dashboard

### Purpose
Display the user's full card catalog as a browsable, visual collection using stock card images sourced from an online database.

### Requirements

**Layout**
- Cards are displayed in either a grid layout or a list layout.
- The user can switch between grid and list views.
- Grid view shows card artwork prominently; list view shows smaller thumbnails alongside text metadata.

**Card Representation**
- Each card in the catalog is rendered using its official stock image (sourced from an external Pokemon card image API or database, e.g. the Pokemon TCG API).
- Stock images are used as display assets; the user does not upload their own images.

**Card Metadata**
Each catalog entry stores and displays:
- Card name
- Set/edition name
- Set symbol / set code
- Card sequence number within the set (e.g. 025/102)
- Rarity
- Card type (Pokémon, Trainer, Energy, etc.)
- Quantity owned (including duplicates)
- Date first added to catalog

**Filtering and Sorting**
- Filter by set/edition, rarity, card type, or name search.
- Sort by name, set, sequence number, rarity, or date added.

**Duplicate Handling**
- If the same card appears more than once in the catalog, a duplicate count badge is shown on the card in grid view, and a quantity field is shown in list view.
- The full history of when each copy was scanned is retained internally (even if only the total quantity is shown in the UI).

---

## Feature 2: Real-Time Webcam Card Scanning

### Purpose
Allow the user to rapidly add cards to the catalog by holding them up to a webcam one at a time. The app identifies each card automatically and registers it in the catalog.

### Requirements

**Camera Feed**
- The app accesses the device's webcam and displays a live video feed in the scanning UI.
- The user can select which camera to use if multiple are available.
- The feed is shown at a size large enough to frame a standard Pokemon card clearly.

**Card Detection**
- The app continuously analyzes the webcam feed to detect when a Pokemon card is held in front of the camera.
- Detection should be tolerant of moderate lighting variation, slight angles, and minor obstructions.
- The app should not trigger a false identification on non-card objects.

**Card Identification**
- Once a card is detected, the app identifies it by matching visual features against a reference database of Pokemon card images.
- Identification must resolve the card to its specific edition and sequence number within that edition (e.g. Charizard 006/102 Base Set vs. Charizard 3/106 EX FireRed & LeafGreen).
- The identification process should complete within a few seconds of the card being held steady.

**Confirmation Step**
- After identification, the app displays a confirmation panel showing:
  - The matched stock image of the identified card.
  - The card name, set, and sequence number.
  - Whether this card is already in the catalog (and current quantity if so).
- The user can confirm the match or reject it (e.g. if the identification was incorrect).
- On confirmation, the card is added to the catalog (or its quantity incremented if already present).
- On rejection, the user can manually search for the correct card and add it instead.

**Duplicate Detection**
- If the same card (same set and sequence number) has already been scanned in the current session or is already in the catalog, the confirmation panel highlights this.
- Confirming adds another copy to the catalog; the quantity for that card increments by one.

**Session Flow**
- The scanning UI is designed for rapid sequential scanning: after confirming one card, the feed immediately returns to active scanning mode for the next card.
- No manual reset or button press should be required between cards.
- A running tally of cards scanned in the current session is shown during scanning.

**Scan History**
- Each individual scan event is logged with a timestamp, even for duplicates.
- The user can review a log of recent scans within the session.

---

## Data Storage

- The catalog (card entries, quantities, scan history) is persisted locally on the device.
- No account or cloud sync is required for the initial version.
- The data format should be portable (e.g. a local SQLite database or structured JSON file) so the user can back it up or migrate it.

---

## External Data Dependencies

- A public Pokemon card database or API is used to:
  - Supply stock card images for display.
  - Supply the reference image set used for card identification during scanning.
  - Supply card metadata (name, set, sequence number, rarity, type).
- The app should cache card images and metadata locally to support offline browsing of already-catalogued cards.
- Identification during scanning may require an active internet connection if the reference matching is server-side, or may be performed locally if a local model/index is used — this is an architectural decision to be made during design.

---

## Out of Scope (Initial Version)

- Cloud sync or multi-device support.
- Deck building or game-play features.
- Card valuation or market price integration.
- Trading or sharing catalogs with other users.
- Support for non-Pokemon trading card games.
