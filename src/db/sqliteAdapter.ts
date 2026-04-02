import { DatabaseSync, type StatementSync } from "node:sqlite";
import type { DatabaseAdapter, SqlRunResult, SqlStatement } from "./adapter";

class SqliteStatementAdapter implements SqlStatement {
  private params: unknown[] = [];

  constructor(private readonly statement: StatementSync) {}

  bind(...values: unknown[]): SqlStatement {
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

  async run(): Promise<SqlRunResult> {
    const result = this.statement.run(...this.params);
    return { meta: { changes: result.changes } };
  }
}

export class SqliteDatabaseAdapter implements DatabaseAdapter {
  constructor(private readonly db: DatabaseSync) {}

  prepare(sql: string): SqlStatement {
    return new SqliteStatementAdapter(this.db.prepare(sql));
  }
}

export function createSqliteDatabaseAdapter(sqlitePath: string): DatabaseAdapter {
  const db = new DatabaseSync(sqlitePath);
  db.exec("PRAGMA foreign_keys = ON");
  return new SqliteDatabaseAdapter(db);
}
