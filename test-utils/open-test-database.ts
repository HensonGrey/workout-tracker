import { DatabaseSync } from 'node:sqlite';

type SqlParam = string | number | null;

// Exposes the expo-sqlite methods the data layer uses, backed by Node's built-in SQLite so tests run real SQL.
export function openTestDatabase() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');

  return {
    async execAsync(sql: string): Promise<void> {
      db.exec(sql);
    },
    async runAsync(sql: string, params: SqlParam[] = []) {
      const result = db.prepare(sql).run(...params);
      return { lastInsertRowId: Number(result.lastInsertRowid), changes: Number(result.changes) };
    },
    async getAllAsync<T>(sql: string, params: SqlParam[] = []): Promise<T[]> {
      return db.prepare(sql).all(...params).map((row) => ({ ...row })) as T[];
    },
    async getFirstAsync<T>(sql: string, params: SqlParam[] = []): Promise<T | null> {
      const row = db.prepare(sql).get(...params);
      return row ? ({ ...row } as T) : null;
    },
    async withTransactionAsync(task: () => Promise<void>): Promise<void> {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
