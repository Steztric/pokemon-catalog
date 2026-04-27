import type { IDatabase } from "./IDatabase";

export interface Migration {
  id: number;
  statements: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    id: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS pokemon_cards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        set_id TEXT NOT NULL,
        set_name TEXT NOT NULL,
        number TEXT NOT NULL,
        rarity TEXT NOT NULL,
        type TEXT NOT NULL,
        image_url TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS card_sets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        series TEXT NOT NULL,
        release_date TEXT NOT NULL,
        total INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS catalog_entries (
        id TEXT PRIMARY KEY,
        card_id TEXT NOT NULL UNIQUE,
        quantity INTEGER NOT NULL DEFAULT 1,
        first_added_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS scan_events (
        id TEXT PRIMARY KEY,
        card_id TEXT NOT NULL,
        scanned_at TEXT NOT NULL,
        session_id TEXT NOT NULL,
        confirmed INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS scan_sessions (
        id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        cards_scanned INTEGER NOT NULL DEFAULT 0
      )`,
    ],
  },
  {
    id: 2,
    statements: [
      `CREATE TABLE IF NOT EXISTS phash_index (
        card_id TEXT PRIMARY KEY,
        hash_hex TEXT NOT NULL,
        indexed_at TEXT NOT NULL
      )`,
    ],
  },
];

export async function runMigrations(
  db: IDatabase,
  migrations: Migration[] = MIGRATIONS,
): Promise<void> {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )`,
  );

  const applied = await db.select<{ id: number }>(
    "SELECT id FROM schema_migrations ORDER BY id",
  );
  const appliedIds = new Set(applied.map((r) => r.id));

  for (const migration of migrations) {
    if (appliedIds.has(migration.id)) continue;
    for (const statement of migration.statements) {
      await db.execute(statement);
    }
    await db.execute(
      "INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)",
      [migration.id, new Date().toISOString()],
    );
  }
}
