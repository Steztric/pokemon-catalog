const DB_NAME = "pokemon-catalog";
const DB_VERSION = 2;

export class IndexedDBDatabase {
  private constructor(private readonly db: IDBDatabase) {}

  static async open(
    name = DB_NAME,
    version = DB_VERSION,
  ): Promise<IndexedDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(name, version);

      req.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains("pokemon_cards")) {
          db.createObjectStore("pokemon_cards", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("card_sets")) {
          db.createObjectStore("card_sets", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("catalog_entries")) {
          const store = db.createObjectStore("catalog_entries", {
            keyPath: "id",
          });
          store.createIndex("by_card_id", "cardId", { unique: true });
        }
        if (!db.objectStoreNames.contains("scan_events")) {
          const store = db.createObjectStore("scan_events", { keyPath: "id" });
          store.createIndex("by_session_id", "sessionId", { unique: false });
        }
        if (!db.objectStoreNames.contains("scan_sessions")) {
          db.createObjectStore("scan_sessions", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("phash_index")) {
          db.createObjectStore("phash_index", { keyPath: "cardId" });
        }
      };

      req.onsuccess = () => resolve(new IndexedDBDatabase(req.result));
      req.onerror = () => reject(req.error);
    });
  }

  get<T>(storeName: string, key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const req = this.db
        .transaction(storeName, "readonly")
        .objectStore(storeName)
        .get(key);
      req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  put<T>(storeName: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = this.db
        .transaction(storeName, "readwrite")
        .objectStore(storeName)
        .put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const req = this.db
        .transaction(storeName, "readonly")
        .objectStore(storeName)
        .getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  getAllByIndex<T>(
    storeName: string,
    indexName: string,
    value: IDBValidKey,
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const req = this.db
        .transaction(storeName, "readonly")
        .objectStore(storeName)
        .index(indexName)
        .getAll(value);
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  delete(storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = this.db
        .transaction(storeName, "readwrite")
        .objectStore(storeName)
        .delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}
