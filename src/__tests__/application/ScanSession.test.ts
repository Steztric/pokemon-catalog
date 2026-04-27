import { describe, it, expect, beforeEach } from "vitest";
import { startScanSession } from "../../application/usecases/StartScanSession";
import { endScanSession } from "../../application/usecases/EndScanSession";
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
} from "../../infrastructure/db/SQLiteRepositories";

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

describe("startScanSession", () => {
  let storage: IStorageAdapter;

  beforeEach(() => {
    storage = makeStorage(migratedDb());
  });

  it("returns a non-empty sessionId", async () => {
    const { sessionId } = await startScanSession(storage);
    expect(sessionId).toBeTruthy();
  });

  it("persists the session so it can be retrieved", async () => {
    const { sessionId } = await startScanSession(storage);
    const session = await storage.scanSessionRepository.findById(sessionId);
    expect(session).not.toBeNull();
    expect(session!.endedAt).toBeNull();
    expect(session!.cardsScanned).toBe(0);
  });

  it("each call creates a distinct session", async () => {
    const { sessionId: a } = await startScanSession(storage);
    const { sessionId: b } = await startScanSession(storage);
    expect(a).not.toBe(b);
  });
});

describe("endScanSession", () => {
  let storage: IStorageAdapter;

  beforeEach(() => {
    storage = makeStorage(migratedDb());
  });

  it("sets endedAt on the session", async () => {
    const { sessionId } = await startScanSession(storage);
    await endScanSession(storage, { sessionId });
    const session = await storage.scanSessionRepository.findById(sessionId);
    expect(session!.endedAt).toBeInstanceOf(Date);
  });

  it("records cardsScanned when provided", async () => {
    const { sessionId } = await startScanSession(storage);
    await endScanSession(storage, { sessionId, cardsScanned: 5 });
    const session = await storage.scanSessionRepository.findById(sessionId);
    expect(session!.cardsScanned).toBe(5);
  });

  it("does nothing for an unknown sessionId", async () => {
    await expect(
      endScanSession(storage, { sessionId: "nonexistent" }),
    ).resolves.toBeUndefined();
  });
});
