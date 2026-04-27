import { describe, it, expect, beforeEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import {
  IndexedDBCardRepository,
  IndexedDBCardSetRepository,
  IndexedDBCatalogRepository,
  IndexedDBScanEventRepository,
  IndexedDBScanSessionRepository,
  IndexedDBPHashIndexRepository,
} from "../../infrastructure/db/IndexedDBRepositories";
import { IndexedDBDatabase } from "../../infrastructure/db/IndexedDBDatabase";
import type {
  PokemonCard,
  CardSet,
  CatalogEntry,
  ScanEvent,
  ScanSession,
  PHashEntry,
} from "../../domain/entities";

const CARD: PokemonCard = {
  id: "base1-4",
  name: "Charizard",
  setId: "base1",
  setName: "Base Set",
  number: "4",
  rarity: "Rare Holo",
  type: "Pokemon",
  imageUrl: "https://example.com/charizard.png",
};

const CARD2: PokemonCard = {
  id: "base1-25",
  name: "Pikachu",
  setId: "base1",
  setName: "Base Set",
  number: "25",
  rarity: "Common",
  type: "Pokemon",
  imageUrl: "https://example.com/pikachu.png",
};

const TRAINER: PokemonCard = {
  id: "base1-58",
  name: "Professor Oak",
  setId: "base1",
  setName: "Base Set",
  number: "58",
  rarity: "Uncommon",
  type: "Trainer",
  imageUrl: "https://example.com/oak.png",
};

const SET: CardSet = {
  id: "base1",
  name: "Base Set",
  series: "Base",
  releaseDate: "1998/12/18",
  total: 102,
};

const ENTRY: CatalogEntry = {
  id: "entry-1",
  cardId: "base1-4",
  quantity: 1,
  firstAddedAt: new Date("2026-01-01T00:00:00Z"),
};

const EVENT: ScanEvent = {
  id: "event-1",
  cardId: "base1-4",
  scannedAt: new Date("2026-01-01T10:00:00Z"),
  sessionId: "session-1",
  confirmed: true,
};

const SESSION: ScanSession = {
  id: "session-1",
  startedAt: new Date("2026-01-01T09:00:00Z"),
  endedAt: null,
  cardsScanned: 0,
};

let dbCounter = 0;

function freshDbPromise(): Promise<IndexedDBDatabase> {
  // Each call gets a unique DB name so tests are isolated
  (globalThis as any).indexedDB = new IDBFactory();
  return IndexedDBDatabase.open(`test-catalog-${++dbCounter}`);
}

// ---------------------------------------------------------------------------

describe("IndexedDBCardRepository", () => {
  let dbPromise: Promise<IndexedDBDatabase>;
  let repo: IndexedDBCardRepository;

  beforeEach(() => {
    dbPromise = freshDbPromise();
    repo = new IndexedDBCardRepository(dbPromise);
  });

  it("returns null for unknown id", async () => {
    expect(await repo.findById("unknown")).toBeNull();
  });

  it("upserts and retrieves a card by id", async () => {
    await repo.upsert(CARD);
    const found = await repo.findById(CARD.id);
    expect(found!.name).toBe("Charizard");
    expect(found!.type).toBe("Pokemon");
  });

  it("upsert replaces an existing card", async () => {
    await repo.upsert(CARD);
    await repo.upsert({ ...CARD, rarity: "Rare" });
    const found = await repo.findById(CARD.id);
    expect(found!.rarity).toBe("Rare");
  });

  it("findAll returns empty array before any upserts", async () => {
    expect(await repo.findAll()).toEqual([]);
  });

  it("findAll returns all cards sorted by name", async () => {
    await repo.upsert(CARD2); // Pikachu
    await repo.upsert(CARD);  // Charizard
    const cards = await repo.findAll();
    expect(cards).toHaveLength(2);
    expect(cards[0].name).toBe("Charizard");
    expect(cards[1].name).toBe("Pikachu");
  });

  it("findAll filters by type", async () => {
    await repo.upsert(CARD);
    await repo.upsert(TRAINER);
    const trainers = await repo.findAll({ type: "Trainer" });
    expect(trainers).toHaveLength(1);
    expect(trainers[0].name).toBe("Professor Oak");
  });

  it("findAll filters by name case-insensitively", async () => {
    await repo.upsert(CARD);
    await repo.upsert(CARD2);
    const results = await repo.findAll({ name: "PIKACHU" });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Pikachu");
  });
});

// ---------------------------------------------------------------------------

describe("IndexedDBCardSetRepository", () => {
  let dbPromise: Promise<IndexedDBDatabase>;
  let repo: IndexedDBCardSetRepository;

  beforeEach(() => {
    dbPromise = freshDbPromise();
    repo = new IndexedDBCardSetRepository(dbPromise);
  });

  it("returns null for unknown id", async () => {
    expect(await repo.findById("unknown")).toBeNull();
  });

  it("upserts and retrieves a set", async () => {
    await repo.upsert(SET);
    const found = await repo.findById(SET.id);
    expect(found!.name).toBe("Base Set");
    expect(found!.total).toBe(102);
  });

  it("findAll returns all sets", async () => {
    await repo.upsert(SET);
    const sets = await repo.findAll();
    expect(sets).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------

describe("IndexedDBCatalogRepository", () => {
  let dbPromise: Promise<IndexedDBDatabase>;
  let repo: IndexedDBCatalogRepository;

  beforeEach(() => {
    dbPromise = freshDbPromise();
    repo = new IndexedDBCatalogRepository(dbPromise);
  });

  it("returns null for unknown cardId", async () => {
    expect(await repo.findByCardId("unknown")).toBeNull();
  });

  it("saves and retrieves an entry by cardId", async () => {
    await repo.save(ENTRY);
    const found = await repo.findByCardId(ENTRY.cardId);
    expect(found!.id).toBe("entry-1");
    expect(found!.quantity).toBe(1);
  });

  it("incrementQuantity updates an existing entry", async () => {
    await repo.save(ENTRY);
    await repo.incrementQuantity(ENTRY.cardId);
    const updated = await repo.findByCardId(ENTRY.cardId);
    expect(updated!.quantity).toBe(2);
  });

  it("findAll returns all entries", async () => {
    await repo.save(ENTRY);
    const all = await repo.findAll();
    expect(all).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------

describe("IndexedDBScanEventRepository", () => {
  let dbPromise: Promise<IndexedDBDatabase>;
  let repo: IndexedDBScanEventRepository;

  beforeEach(() => {
    dbPromise = freshDbPromise();
    repo = new IndexedDBScanEventRepository(dbPromise);
  });

  it("saves and retrieves events by session", async () => {
    await repo.save(EVENT);
    const events = await repo.findBySession(EVENT.sessionId);
    expect(events).toHaveLength(1);
    expect(events[0].cardId).toBe("base1-4");
    expect(events[0].confirmed).toBe(true);
  });

  it("findBySession returns empty array for unknown session", async () => {
    expect(await repo.findBySession("unknown")).toEqual([]);
  });

  it("only returns events for the requested session", async () => {
    await repo.save(EVENT);
    await repo.save({ ...EVENT, id: "event-2", sessionId: "session-2" });
    const events = await repo.findBySession("session-1");
    expect(events).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------

describe("IndexedDBScanSessionRepository", () => {
  let dbPromise: Promise<IndexedDBDatabase>;
  let repo: IndexedDBScanSessionRepository;

  beforeEach(() => {
    dbPromise = freshDbPromise();
    repo = new IndexedDBScanSessionRepository(dbPromise);
  });

  it("returns null for unknown id", async () => {
    expect(await repo.findById("unknown")).toBeNull();
  });

  it("saves and retrieves a session", async () => {
    await repo.save(SESSION);
    const found = await repo.findById(SESSION.id);
    expect(found!.endedAt).toBeNull();
    expect(found!.cardsScanned).toBe(0);
  });

  it("update persists changes to an existing session", async () => {
    await repo.save(SESSION);
    const ended = new Date("2026-01-01T10:00:00Z");
    await repo.update({ ...SESSION, endedAt: ended, cardsScanned: 3 });
    const found = await repo.findById(SESSION.id);
    expect(found!.cardsScanned).toBe(3);
    expect(found!.endedAt).not.toBeNull();
  });
});

describe("IndexedDBPHashIndexRepository", () => {
  let dbPromise: Promise<IndexedDBDatabase>;
  let repo: IndexedDBPHashIndexRepository;

  const ENTRY_A: PHashEntry = {
    cardId: "base1-4",
    hashHex: "deadbeefcafe0123",
    indexedAt: new Date("2026-01-01T00:00:00Z"),
  };
  const ENTRY_B: PHashEntry = {
    cardId: "base1-25",
    hashHex: "0123456789abcdef",
    indexedAt: new Date("2026-01-02T00:00:00Z"),
  };

  beforeEach(() => {
    dbPromise = freshDbPromise();
    repo = new IndexedDBPHashIndexRepository(dbPromise);
  });

  it("findAll returns empty array on fresh database", async () => {
    expect(await repo.findAll()).toHaveLength(0);
  });

  it("upsert stores an entry and findAll returns it", async () => {
    await repo.upsert(ENTRY_A);
    const all = await repo.findAll();
    expect(all).toHaveLength(1);
    expect(all[0].cardId).toBe(ENTRY_A.cardId);
    expect(all[0].hashHex).toBe(ENTRY_A.hashHex);
  });

  it("upsert replaces an existing entry with the same cardId", async () => {
    await repo.upsert(ENTRY_A);
    await repo.upsert({ ...ENTRY_A, hashHex: "ffffffffffffffff" });
    const all = await repo.findAll();
    expect(all).toHaveLength(1);
    expect(all[0].hashHex).toBe("ffffffffffffffff");
  });

  it("hasCard returns false for unknown cardId", async () => {
    expect(await repo.hasCard("base1-4")).toBe(false);
  });

  it("hasCard returns true after upsert", async () => {
    await repo.upsert(ENTRY_A);
    expect(await repo.hasCard(ENTRY_A.cardId)).toBe(true);
  });

  it("count reflects number of entries", async () => {
    expect(await repo.count()).toBe(0);
    await repo.upsert(ENTRY_A);
    await repo.upsert(ENTRY_B);
    expect(await repo.count()).toBe(2);
  });
});
