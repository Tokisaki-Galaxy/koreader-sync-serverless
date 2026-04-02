import { createRequire } from "node:module";
import type { DatabaseAdapter } from "../database/adapter";

const require = createRequire(import.meta.url);
type NodeSqlite = {
  DatabaseSync: new (location: string) => {
    exec(sql: string): void;
    prepare(sql: string): {
      get(...params: unknown[]): unknown;
      all(...params: unknown[]): unknown[];
      run(...params: unknown[]): { changes?: number };
    };
  };
};

const sqliteModule = require("node:sqlite") as NodeSqlite;
const DatabaseSync = sqliteModule.DatabaseSync;

class SqliteStatementAdapter {
  private params: unknown[] = [];
  constructor(
    private readonly statement: {
      get(...params: unknown[]): unknown;
      all(...params: unknown[]): unknown[];
      run(...params: unknown[]): { changes?: number };
    }
  ) {}

  bind(...values: unknown[]) {
    this.params = values;
    return this;
  }

  async first<T>(): Promise<T | null> {
    const row = this.statement.get(...this.params) as T | undefined;
    return row ?? null;
  }

  async all<T>(): Promise<{ results: T[] }> {
    const rows = this.statement.all(...this.params) as T[];
    return { results: rows ?? [] };
  }

  async run(): Promise<{ meta: { changes?: number } }> {
    const result = this.statement.run(...this.params);
    return { meta: { changes: result.changes } };
  }
}

class SqliteDatabaseAdapter implements DatabaseAdapter {
  constructor(
    private readonly db: {
      prepare(sql: string): {
        get(...params: unknown[]): unknown;
        all(...params: unknown[]): unknown[];
        run(...params: unknown[]): { changes?: number };
      };
    }
  ) {}

  prepare(sql: string) {
    return new SqliteStatementAdapter(this.db.prepare(sql));
  }
}

export function createSqliteDatabaseAdapter(sqlitePath: string): DatabaseAdapter {
  const db = new DatabaseSync(sqlitePath);
  db.exec("PRAGMA foreign_keys = ON");
  return new SqliteDatabaseAdapter(db);
}
