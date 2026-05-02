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
import { AnthropicVisionClient } from "../vision/anthropicVisionClient";
import { HybridIdentificationService } from "../vision/hybridIdentificationService";

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
  const cardDataProvider = new CachingCardDataProvider(
    new PokemonTCGApiClient(),
    storage.cardRepository,
    storage.cardSetRepository,
  );
  const apiKey =
    typeof import.meta !== "undefined" ? (import.meta.env?.VITE_ANTHROPIC_API_KEY as string | undefined) : undefined;
  const llmClient = apiKey ? new AnthropicVisionClient(apiKey) : null;
  const cardIdentificationService = new HybridIdentificationService(
    new LocalPHashIdentifier(storage.pHashIndexRepository),
    llmClient,
    cardDataProvider,
  );
  return {
    storage,
    imageCache: stubPlatform.imageCache,
    camera: new WebRTCCameraAdapter(),
    cardDataProvider,
    cardIdentificationService,
  };
}

export const platform: IPlatform = resolvePlatform();
