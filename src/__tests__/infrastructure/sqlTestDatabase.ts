import initSqlJs from "sql.js";
import type { Database } from "sql.js";
import type { IDatabase } from "../../infrastructure/db/IDatabase";

export async function createSqlTestDatabase(): Promise<IDatabase> {
  const SQL = await initSqlJs();
  const db: Database = new SQL.Database();

  return {
    async execute(sql: string, params?: unknown[]): Promise<void> {
      db.run(sql, (params as any[]) ?? []);
    },

    async select<T = Record<string, unknown>>(
      sql: string,
      params?: unknown[],
    ): Promise<T[]> {
      const stmt = db.prepare(sql);
      if (params?.length) stmt.bind(params as any[]);
      const rows: T[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as unknown as T);
      }
      stmt.free();
      return rows;
    },
  };
}
