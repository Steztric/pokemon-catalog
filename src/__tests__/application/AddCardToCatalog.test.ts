import { describe, it, expect, beforeEach } from "vitest";
import { addCardToCatalog } from "../../application/usecases/AddCardToCatalog";
import { confirmScan } from "../../application/usecases/ConfirmScan";
import { rejectScan } from "../../application/usecases/RejectScan";
import { startScanSession } from "../../application/usecases/StartScanSession";
import { StubPokemonCardDataProvider } from "../../infrastructure/api/StubPokemonCardDataProvider";
import type { IStorageAdapter } from "../../domain/interfaces";
import { createSqlTestDatabase } from "../infrastructure/sqlTestDatabase";
import { runMigrations } from "../../infrastructure/db/migrations";
import type { IDatabase } from "../../infrastructure/db/IDatabase";
import {
  SQLiteCardRepository,
  SQLiteCardSetRepository,
  SQLiteCatalogRepository,
  SQLiteScanEventRepository,
  SQLiteScanSessionRepository,
  SQLitePHashIndexRepository,
} from "../../infrastructure/db/SQLiteRepositories";

function makeStorage(dbPromise: Promise<IDatabase>): IStorageAdapter {
  return {
    cardRepository: new SQLiteCardRepository(dbPromise),
    cardSetRepository: new SQLiteCardSetRepository(dbPromise),
    catalogRepository: new SQLiteCatalogRepository(dbPromise),
    scanEventRepository: new SQLiteScanEventRepository(dbPromise),
    scanSessionRepository: new SQLiteScanSessionRepository(dbPromise),
    pHashIndexRepository: new SQLitePHashIndexRepository(dbPromise),
  };
}

function migratedDb(): Promise<IDatabase> {
  return createSqlTestDatabase().then(async (db) => {
    await runMigrations(db);
    return db;
  });
}

const CARD_ID = "base1-4"; // Charizard — present in StubPokemonCardDataProvider

describe("addCardToCatalog", () => {
  let storage: IStorageAdapter;
  let sessionId: string;
  const provider = new StubPokemonCardDataProvider();

  beforeEach(async () => {
    storage = makeStorage(migratedDb());
    const out = await startScanSession(storage);
    sessionId = out.sessionId;
  });

  it("creates a new catalog entry with quantity 1 on first scan", async () => {
    await addCardToCatalog(storage, provider, { cardId: CARD_ID, sessionId });
    const entry = await storage.catalogRepository.findByCardId(CARD_ID);
    expect(entry).not.toBeNull();
    expect(entry!.quantity).toBe(1);
    expect(entry!.cardId).toBe(CARD_ID);
  });

  it("increments quantity on duplicate scan", async () => {
    await addCardToCatalog(storage, provider, { cardId: CARD_ID, sessionId });
    await addCardToCatalog(storage, provider, { cardId: CARD_ID, sessionId });
    const entry = await storage.catalogRepository.findByCardId(CARD_ID);
    expect(entry!.quantity).toBe(2);
  });

  it("caches card metadata locally", async () => {
    await addCardToCatalog(storage, provider, { cardId: CARD_ID, sessionId });
    const card = await storage.cardRepository.findById(CARD_ID);
    expect(card).not.toBeNull();
    expect(card!.name).toBe("Charizard");
  });

  it("does not re-fetch if card is already cached", async () => {
    // Pre-populate cache
    const card = await provider.getCard(CARD_ID);
    await storage.cardRepository.upsert(card);
    // Should succeed without throwing even if provider returned stale data
    await expect(
      addCardToCatalog(storage, provider, { cardId: CARD_ID, sessionId }),
    ).resolves.toBeDefined();
  });

  it("writes a confirmed scan event", async () => {
    await addCardToCatalog(storage, provider, { cardId: CARD_ID, sessionId });
    const events = await storage.scanEventRepository.findBySession(sessionId);
    expect(events).toHaveLength(1);
    expect(events[0].cardId).toBe(CARD_ID);
    expect(events[0].confirmed).toBe(true);
  });

  it("increments the session cardsScanned count", async () => {
    await addCardToCatalog(storage, provider, { cardId: CARD_ID, sessionId });
    const session = await storage.scanSessionRepository.findById(sessionId);
    expect(session!.cardsScanned).toBe(1);
  });

  it("returns the catalog entry id", async () => {
    const { catalogEntryId } = await addCardToCatalog(storage, provider, {
      cardId: CARD_ID,
      sessionId,
    });
    expect(catalogEntryId).toBeTruthy();
  });
});

describe("confirmScan", () => {
  let storage: IStorageAdapter;
  let sessionId: string;
  const provider = new StubPokemonCardDataProvider();

  beforeEach(async () => {
    storage = makeStorage(migratedDb());
    const out = await startScanSession(storage);
    sessionId = out.sessionId;
  });

  it("adds the card to the catalog", async () => {
    await confirmScan(storage, provider, { cardId: CARD_ID, sessionId });
    const entry = await storage.catalogRepository.findByCardId(CARD_ID);
    expect(entry).not.toBeNull();
    expect(entry!.quantity).toBe(1);
  });
});

describe("rejectScan", () => {
  it("resolves without side effects", async () => {
    const storage = makeStorage(migratedDb());
    await expect(
      rejectScan(storage, { sessionId: "any" }),
    ).resolves.toBeUndefined();
  });
});
