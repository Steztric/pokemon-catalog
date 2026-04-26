import { describe, it, expect, beforeEach } from "vitest";
import { getCardDetail } from "../../application/usecases/GetCardDetail";
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

const ENTRY: CatalogEntry = {
  id: "e1",
  cardId: "base1-4",
  quantity: 1,
  firstAddedAt: new Date("2026-01-01T00:00:00Z"),
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

describe("getCardDetail", () => {
  let storage: IStorageAdapter;

  beforeEach(async () => {
    const dbPromise = migratedDb();
    storage = makeStorage(dbPromise);
    await storage.cardRepository.upsert(CARD);
    await storage.catalogRepository.save(ENTRY);
  });

  it("returns the entry and card when both exist", async () => {
    const result = await getCardDetail(storage, "base1-4");
    expect(result).not.toBeNull();
    expect(result!.card.name).toBe("Charizard");
    expect(result!.entry.quantity).toBe(1);
  });

  it("returns null when the catalog entry does not exist", async () => {
    const result = await getCardDetail(storage, "nonexistent-card");
    expect(result).toBeNull();
  });

  it("returns null when the catalog entry exists but the card record is missing", async () => {
    const orphan: CatalogEntry = {
      id: "e-orphan",
      cardId: "ghost-card",
      quantity: 1,
      firstAddedAt: new Date(),
    };
    await storage.catalogRepository.save(orphan);
    const result = await getCardDetail(storage, "ghost-card");
    expect(result).toBeNull();
  });
});
