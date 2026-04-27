import type { IPlatform, IStorageAdapter } from "../../domain/interfaces";
import { stubPlatform } from "./StubPlatform";
import { WebRTCCameraAdapter } from "../camera/WebRTCCameraAdapter";
import { PokemonTCGApiClient } from "../api/PokemonTCGApiClient";
import { CachingCardDataProvider } from "../api/CachingCardDataProvider";
import { TauriSQLiteDatabase } from "../db/TauriSQLiteDatabase";
import { runMigrations } from "../db/migrations";
import { homeDir, join } from "@tauri-apps/api/path";
import {
  SQLiteCardRepository,
  SQLiteCardSetRepository,
  SQLiteCatalogRepository,
  SQLiteScanEventRepository,
  SQLiteScanSessionRepository,
  SQLitePHashIndexRepository,
} from "../db/SQLiteRepositories";
import { IndexedDBDatabase } from "../db/IndexedDBDatabase";
import {
  IndexedDBCardRepository,
  IndexedDBCardSetRepository,
  IndexedDBCatalogRepository,
  IndexedDBScanEventRepository,
  IndexedDBScanSessionRepository,
  IndexedDBPHashIndexRepository,
} from "../db/IndexedDBRepositories";
import { LocalPHashIdentifier } from "../vision/localPHashIdentifier";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function buildTauriStorage(): IStorageAdapter {
  const dbPromise = (async () => {
    const home = await homeDir();
    const dbPath = await join(home, "pokemon-catalog", "pokemon-catalog.db");
    const db = await TauriSQLiteDatabase.open(dbPath);
    await runMigrations(db);
    return db;
  })();
  return {
    cardRepository: new SQLiteCardRepository(dbPromise),
    cardSetRepository: new SQLiteCardSetRepository(dbPromise),
    catalogRepository: new SQLiteCatalogRepository(dbPromise),
    scanEventRepository: new SQLiteScanEventRepository(dbPromise),
    scanSessionRepository: new SQLiteScanSessionRepository(dbPromise),
    pHashIndexRepository: new SQLitePHashIndexRepository(dbPromise),
  };
}

function buildBrowserStorage(): IStorageAdapter {
  const dbPromise = IndexedDBDatabase.open();
  return {
    cardRepository: new IndexedDBCardRepository(dbPromise),
    cardSetRepository: new IndexedDBCardSetRepository(dbPromise),
    catalogRepository: new IndexedDBCatalogRepository(dbPromise),
    scanEventRepository: new IndexedDBScanEventRepository(dbPromise),
    scanSessionRepository: new IndexedDBScanSessionRepository(dbPromise),
    pHashIndexRepository: new IndexedDBPHashIndexRepository(dbPromise),
  };
}

function resolvePlatform(): IPlatform {
  const storage = isTauri() ? buildTauriStorage() : buildBrowserStorage();
  return {
    storage,
    imageCache: stubPlatform.imageCache,
    camera: new WebRTCCameraAdapter(),
    cardDataProvider: new CachingCardDataProvider(
      new PokemonTCGApiClient(),
      storage.cardRepository,
      storage.cardSetRepository,
    ),
    cardIdentificationService: new LocalPHashIdentifier(storage.pHashIndexRepository),
  };
}

export const platform: IPlatform = resolvePlatform();
