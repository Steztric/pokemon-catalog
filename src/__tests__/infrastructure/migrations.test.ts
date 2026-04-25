import { describe, it, expect, beforeEach } from "vitest";
import { runMigrations, type Migration } from "../../infrastructure/db/migrations";
import type { IDatabase } from "../../infrastructure/db/IDatabase";
import { createSqlTestDatabase } from "./sqlTestDatabase";

const TABLE_NAMES = [
  "schema_migrations",
  "pokemon_cards",
  "card_sets",
  "catalog_entries",
  "scan_events",
  "scan_sessions",
];

async function getTableNames(db: IDatabase): Promise<string[]> {
  const rows = await db.select<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
  );
  return rows.map((r) => r.name);
}

async function getAppliedIds(db: IDatabase): Promise<number[]> {
  const rows = await db.select<{ id: number }>(
    "SELECT id FROM schema_migrations ORDER BY id",
  );
  return rows.map((r) => r.id);
}

describe("runMigrations", () => {
  let db: IDatabase;

  beforeEach(async () => {
    db = await createSqlTestDatabase();
  });

  it("creates schema_migrations table and all domain tables on a fresh database", async () => {
    await runMigrations(db);
    const tables = await getTableNames(db);
    for (const name of TABLE_NAMES) {
      expect(tables).toContain(name);
    }
  });

  it("records each migration in schema_migrations", async () => {
    await runMigrations(db);
    const ids = await getAppliedIds(db);
    expect(ids).toContain(1);
  });

  it("is idempotent — running twice leaves the same state", async () => {
    await runMigrations(db);
    await runMigrations(db);
    const ids = await getAppliedIds(db);
    expect(ids.filter((id) => id === 1)).toHaveLength(1);
  });

  it("only applies pending migrations when one is already recorded", async () => {
    const testMigrations: Migration[] = [
      { id: 1, statements: ["CREATE TABLE test_a (id TEXT PRIMARY KEY)"] },
      { id: 2, statements: ["CREATE TABLE test_b (id TEXT PRIMARY KEY)"] },
    ];

    // Apply only migration 1 manually
    await runMigrations(db, [testMigrations[0]]);
    let tables = await getTableNames(db);
    expect(tables).toContain("test_a");
    expect(tables).not.toContain("test_b");

    // Now run both — only migration 2 should be applied
    await runMigrations(db, testMigrations);
    tables = await getTableNames(db);
    expect(tables).toContain("test_a");
    expect(tables).toContain("test_b");

    const ids = await getAppliedIds(db);
    expect(ids).toContain(1);
    expect(ids).toContain(2);
  });

  it("does not create duplicate schema_migrations rows", async () => {
    await runMigrations(db);
    await runMigrations(db);
    const rows = await db.select<{ id: number }>(
      "SELECT id FROM schema_migrations WHERE id = 1",
    );
    expect(rows).toHaveLength(1);
  });
});
