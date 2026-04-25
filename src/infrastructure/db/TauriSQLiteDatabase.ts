import Database from "@tauri-apps/plugin-sql";
import type { IDatabase } from "./IDatabase";

export class TauriSQLiteDatabase implements IDatabase {
  private constructor(private readonly db: Database) {}

  static async open(path: string): Promise<TauriSQLiteDatabase> {
    const db = await Database.load(`sqlite:${path}`);
    return new TauriSQLiteDatabase(db);
  }

  async execute(sql: string, params?: unknown[]): Promise<void> {
    await this.db.execute(sql, params);
  }

  async select<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<T[]> {
    return this.db.select<T[]>(sql, params);
  }
}
