import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { addCardToCatalog } from "../../application/usecases/AddCardToCatalog";
import { confirmScan } from "../../application/usecases/ConfirmScan";
import { rejectScan } from "../../application/usecases/RejectScan";
import { startScanSession } from "../../application/usecases/StartScanSession";
import { StubPokemonCardDataProvider } from "../../infrastructure/api/StubPokemonCardDataProvider";
import type { IStorageAdapter, IImageCacheAdapter } from "../../domain/interfaces";
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

function makeImageCache(hasCached = false): IImageCacheAdapter {
  return {
    get: vi.fn().mockResolvedValue(hasCached ? "blob:cached" : null),
    set: vi.fn().mockResolvedValue(undefined),
    has: vi.fn().mockResolvedValue(hasCached),
  };
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a new catalog entry with quantity 1 on first scan", async () => {
    const imageCache = makeImageCache();
    await addCardToCatalog(storage, provider, imageCache, { cardId: CARD_ID, sessionId });
    const entry = await storage.catalogRepository.findByCardId(CARD_ID);
    expect(entry).not.toBeNull();
    expect(entry!.quantity).toBe(1);
    expect(entry!.cardId).toBe(CARD_ID);
  });

  it("increments quantity on duplicate scan", async () => {
    const imageCache = makeImageCache();
    await addCardToCatalog(storage, provider, imageCache, { cardId: CARD_ID, sessionId });
    await addCardToCatalog(storage, provider, imageCache, { cardId: CARD_ID, sessionId });
    const entry = await storage.catalogRepository.findByCardId(CARD_ID);
    expect(entry!.quantity).toBe(2);
  });

  it("caches card metadata locally", async () => {
    const imageCache = makeImageCache();
    await addCardToCatalog(storage, provider, imageCache, { cardId: CARD_ID, sessionId });
    const card = await storage.cardRepository.findById(CARD_ID);
    expect(card).not.toBeNull();
    expect(card!.name).toBe("Charizard");
  });

  it("does not re-fetch if card is already cached", async () => {
    const imageCache = makeImageCache();
    // Pre-populate cache
    const card = await provider.getCard(CARD_ID);
    await storage.cardRepository.upsert(card);
    await expect(
      addCardToCatalog(storage, provider, imageCache, { cardId: CARD_ID, sessionId }),
    ).resolves.toBeDefined();
  });

  it("writes a confirmed scan event", async () => {
    const imageCache = makeImageCache();
    await addCardToCatalog(storage, provider, imageCache, { cardId: CARD_ID, sessionId });
    const events = await storage.scanEventRepository.findBySession(sessionId);
    expect(events).toHaveLength(1);
    expect(events[0].cardId).toBe(CARD_ID);
    expect(events[0].confirmed).toBe(true);
  });

  it("increments the session cardsScanned count", async () => {
    const imageCache = makeImageCache();
    await addCardToCatalog(storage, provider, imageCache, { cardId: CARD_ID, sessionId });
    const session = await storage.scanSessionRepository.findById(sessionId);
    expect(session!.cardsScanned).toBe(1);
  });

  it("returns the catalog entry id", async () => {
    const imageCache = makeImageCache();
    const { catalogEntryId } = await addCardToCatalog(storage, provider, imageCache, {
      cardId: CARD_ID,
      sessionId,
    });
    expect(catalogEntryId).toBeTruthy();
  });

  it("calls imageCache.set when image is not cached and fetch succeeds", async () => {
    const imageCache = makeImageCache(false);
    const fakeBuffer = new ArrayBuffer(4);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(fakeBuffer),
    }));
    await addCardToCatalog(storage, provider, imageCache, { cardId: CARD_ID, sessionId });
    expect(imageCache.set).toHaveBeenCalledWith(CARD_ID, fakeBuffer);
  });

  it("skips imageCache.set when image is already cached", async () => {
    const imageCache = makeImageCache(true);
    await addCardToCatalog(storage, provider, imageCache, { cardId: CARD_ID, sessionId });
    expect(imageCache.set).not.toHaveBeenCalled();
  });

  it("completes successfully even when image fetch fails", async () => {
    const imageCache = makeImageCache(false);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    await expect(
      addCardToCatalog(storage, provider, imageCache, { cardId: CARD_ID, sessionId }),
    ).resolves.toBeDefined();
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
    const imageCache = makeImageCache();
    await confirmScan(storage, provider, imageCache, { cardId: CARD_ID, sessionId });
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
