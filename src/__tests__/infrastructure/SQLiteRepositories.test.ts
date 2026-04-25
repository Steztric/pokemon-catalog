import { describe, it, expect, beforeEach } from "vitest";
import {
  SQLiteCardRepository,
  SQLiteCardSetRepository,
  SQLiteCatalogRepository,
  SQLiteScanEventRepository,
  SQLiteScanSessionRepository,
} from "../../infrastructure/db/SQLiteRepositories";
import { runMigrations } from "../../infrastructure/db/migrations";
import type { IDatabase } from "../../infrastructure/db/IDatabase";
import type {
  PokemonCard,
  CardSet,
  CatalogEntry,
  ScanEvent,
  ScanSession,
} from "../../domain/entities";
import { createSqlTestDatabase } from "./sqlTestDatabase";

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

function migratedDb(): Promise<IDatabase> {
  return createSqlTestDatabase().then(async (db) => {
    await runMigrations(db);
    return db;
  });
}

// ---------------------------------------------------------------------------

describe("SQLiteCardRepository", () => {
  let dbPromise: Promise<IDatabase>;
  let repo: SQLiteCardRepository;

  beforeEach(async () => {
    dbPromise = migratedDb();
    repo = new SQLiteCardRepository(dbPromise);
  });

  it("returns null for unknown id", async () => {
    expect(await repo.findById("unknown")).toBeNull();
  });

  it("upserts and retrieves a card by id", async () => {
    await repo.upsert(CARD);
    const found = await repo.findById(CARD.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Charizard");
    expect(found!.type).toBe("Pokemon");
    expect(found!.setId).toBe("base1");
  });

  it("upsert is idempotent", async () => {
    await repo.upsert(CARD);
    await repo.upsert({ ...CARD, rarity: "Rare" });
    const found = await repo.findById(CARD.id);
    expect(found!.rarity).toBe("Rare");
  });

  it("findAll returns empty array before any upserts", async () => {
    expect(await repo.findAll()).toEqual([]);
  });

  it("findAll returns all upserted cards sorted by name", async () => {
    await repo.upsert(CARD);
    await repo.upsert(CARD2);
    const cards = await repo.findAll();
    expect(cards).toHaveLength(2);
    expect(cards[0].name).toBe("Charizard");
    expect(cards[1].name).toBe("Pikachu");
  });

  it("findAll filters by name (case-insensitive substring)", async () => {
    await repo.upsert(CARD);
    await repo.upsert(CARD2);
    const results = await repo.findAll({ name: "pikachu" });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Pikachu");
  });

  it("findAll filters by type", async () => {
    await repo.upsert(CARD);
    await repo.upsert(TRAINER);
    const trainers = await repo.findAll({ type: "Trainer" });
    expect(trainers).toHaveLength(1);
    expect(trainers[0].name).toBe("Professor Oak");
  });
});

// ---------------------------------------------------------------------------

describe("SQLiteCardSetRepository", () => {
  let dbPromise: Promise<IDatabase>;
  let repo: SQLiteCardSetRepository;

  beforeEach(async () => {
    dbPromise = migratedDb();
    repo = new SQLiteCardSetRepository(dbPromise);
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
    expect(sets[0].id).toBe("base1");
  });
});

// ---------------------------------------------------------------------------

describe("SQLiteCatalogRepository", () => {
  let dbPromise: Promise<IDatabase>;
  let repo: SQLiteCatalogRepository;

  beforeEach(async () => {
    dbPromise = migratedDb();
    repo = new SQLiteCatalogRepository(dbPromise);
  });

  it("returns null for unknown cardId", async () => {
    expect(await repo.findByCardId("unknown")).toBeNull();
  });

  it("saves and retrieves an entry", async () => {
    await repo.save(ENTRY);
    const found = await repo.findByCardId(ENTRY.cardId);
    expect(found!.id).toBe("entry-1");
    expect(found!.quantity).toBe(1);
    expect(found!.firstAddedAt).toBeInstanceOf(Date);
  });

  it("incrementQuantity updates an existing entry", async () => {
    await repo.save(ENTRY);
    await repo.incrementQuantity(ENTRY.cardId);
    const updated = await repo.findByCardId(ENTRY.cardId);
    expect(updated!.quantity).toBe(2);
  });

  it("findAll returns all entries", async () => {
    await repo.save(ENTRY);
    const entries = await repo.findAll();
    expect(entries).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------

describe("SQLiteScanEventRepository", () => {
  let dbPromise: Promise<IDatabase>;
  let repo: SQLiteScanEventRepository;

  beforeEach(async () => {
    dbPromise = migratedDb();
    repo = new SQLiteScanEventRepository(dbPromise);
  });

  it("saves an event and retrieves it by session", async () => {
    await repo.save(EVENT);
    const events = await repo.findBySession(EVENT.sessionId);
    expect(events).toHaveLength(1);
    expect(events[0].cardId).toBe("base1-4");
    expect(events[0].confirmed).toBe(true);
    expect(events[0].scannedAt).toBeInstanceOf(Date);
  });

  it("findBySession returns empty array for unknown session", async () => {
    expect(await repo.findBySession("unknown")).toEqual([]);
  });

  it("preserves false confirmed value", async () => {
    await repo.save({ ...EVENT, confirmed: false });
    const events = await repo.findBySession(EVENT.sessionId);
    expect(events[0].confirmed).toBe(false);
  });
});

// ---------------------------------------------------------------------------

describe("SQLiteScanSessionRepository", () => {
  let dbPromise: Promise<IDatabase>;
  let repo: SQLiteScanSessionRepository;

  beforeEach(async () => {
    dbPromise = migratedDb();
    repo = new SQLiteScanSessionRepository(dbPromise);
  });

  it("returns null for unknown id", async () => {
    expect(await repo.findById("unknown")).toBeNull();
  });

  it("saves and retrieves a session with null endedAt", async () => {
    await repo.save(SESSION);
    const found = await repo.findById(SESSION.id);
    expect(found!.endedAt).toBeNull();
    expect(found!.cardsScanned).toBe(0);
    expect(found!.startedAt).toBeInstanceOf(Date);
  });

  it("update persists changes", async () => {
    await repo.save(SESSION);
    const ended = new Date("2026-01-01T10:00:00Z");
    await repo.update({ ...SESSION, endedAt: ended, cardsScanned: 5 });
    const found = await repo.findById(SESSION.id);
    expect(found!.endedAt).toBeInstanceOf(Date);
    expect(found!.cardsScanned).toBe(5);
  });
});
