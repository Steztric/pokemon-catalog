import { describe, it, expect, beforeEach } from "vitest";
import { searchCatalog } from "../../application/usecases/SearchCatalog";
import type { IStorageAdapter } from "../../domain/interfaces";
import type { PokemonCard, CatalogEntry } from "../../domain/entities";
import { createSqlTestDatabase } from "../infrastructure/sqlTestDatabase";
import { runMigrations } from "../../infrastructure/db/migrations";
import type { IDatabase } from "../../infrastructure/db/IDatabase";
import {
  SQLiteCardRepository,
  SQLiteCatalogRepository,
  SQLiteCardSetRepository,
  SQLiteScanEventRepository,
  SQLiteScanSessionRepository,
} from "../../infrastructure/db/SQLiteRepositories";

const CHARIZARD: PokemonCard = {
  id: "base1-4",
  name: "Charizard",
  setId: "base1",
  setName: "Base Set",
  number: "4",
  rarity: "Rare Holo",
  type: "Pokemon",
  imageUrl: "https://example.com/charizard.png",
};

const PIKACHU: PokemonCard = {
  id: "base1-58",
  name: "Pikachu",
  setId: "base1",
  setName: "Base Set",
  number: "58",
  rarity: "Common",
  type: "Pokemon",
  imageUrl: "https://example.com/pikachu.png",
};

const OAK: PokemonCard = {
  id: "base1-88",
  name: "Professor Oak",
  setId: "base1",
  setName: "Base Set",
  number: "88",
  rarity: "Uncommon",
  type: "Trainer",
  imageUrl: "https://example.com/oak.png",
};

const ENTRY_CHAR: CatalogEntry = {
  id: "e1",
  cardId: "base1-4",
  quantity: 2,
  firstAddedAt: new Date("2026-01-03T00:00:00Z"),
};

const ENTRY_PIKA: CatalogEntry = {
  id: "e2",
  cardId: "base1-58",
  quantity: 1,
  firstAddedAt: new Date("2026-01-01T00:00:00Z"),
};

const ENTRY_OAK: CatalogEntry = {
  id: "e3",
  cardId: "base1-88",
  quantity: 1,
  firstAddedAt: new Date("2026-01-02T00:00:00Z"),
};

function makeStorage(dbPromise: Promise<IDatabase>): IStorageAdapter {
  return {
    cardRepository: new SQLiteCardRepository(dbPromise),
    cardSetRepository: new SQLiteCardSetRepository(dbPromise),
    catalogRepository: new SQLiteCatalogRepository(dbPromise),
    scanEventRepository: new SQLiteScanEventRepository(dbPromise),
    scanSessionRepository: new SQLiteScanSessionRepository(dbPromise),
  };
}

function migratedDb(): Promise<IDatabase> {
  return createSqlTestDatabase().then(async (db) => {
    await runMigrations(db);
    return db;
  });
}

describe("searchCatalog", () => {
  let storage: IStorageAdapter;

  beforeEach(async () => {
    const dbPromise = migratedDb();
    storage = makeStorage(dbPromise);
    await storage.cardRepository.upsert(CHARIZARD);
    await storage.cardRepository.upsert(PIKACHU);
    await storage.cardRepository.upsert(OAK);
    await storage.catalogRepository.save(ENTRY_CHAR);
    await storage.catalogRepository.save(ENTRY_PIKA);
    await storage.catalogRepository.save(ENTRY_OAK);
  });

  it("returns all catalog entries joined with card data", async () => {
    const results = await searchCatalog(storage);
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.card.name)).toEqual(
      expect.arrayContaining(["Charizard", "Pikachu", "Professor Oak"])
    );
  });

  it("filters by name (case-insensitive substring)", async () => {
    const results = await searchCatalog(storage, { name: "char" });
    expect(results).toHaveLength(1);
    expect(results[0].card.name).toBe("Charizard");
  });

  it("filters by type", async () => {
    const results = await searchCatalog(storage, { type: "Trainer" });
    expect(results).toHaveLength(1);
    expect(results[0].card.name).toBe("Professor Oak");
  });

  it("sorts by name ascending", async () => {
    const results = await searchCatalog(storage, { sortBy: "name", sortDir: "asc" });
    expect(results.map((r) => r.card.name)).toEqual([
      "Charizard",
      "Pikachu",
      "Professor Oak",
    ]);
  });

  it("sorts by firstAddedAt descending", async () => {
    const results = await searchCatalog(storage, {
      sortBy: "firstAddedAt",
      sortDir: "desc",
    });
    expect(results[0].card.name).toBe("Charizard");
    expect(results[2].card.name).toBe("Pikachu");
  });

  it("omits entries whose card is missing from the card repository", async () => {
    const orphan: CatalogEntry = {
      id: "e-orphan",
      cardId: "ghost-card",
      quantity: 1,
      firstAddedAt: new Date(),
    };
    await storage.catalogRepository.save(orphan);
    const results = await searchCatalog(storage);
    expect(results.every((r) => r.card.id !== "ghost-card")).toBe(true);
  });
});
