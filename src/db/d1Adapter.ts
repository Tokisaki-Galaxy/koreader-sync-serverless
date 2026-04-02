import type { DatabaseAdapter, SqlRunResult, SqlStatement } from "./adapter";

class D1StatementAdapter implements SqlStatement {
  private statement: D1PreparedStatement;

  constructor(statement: D1PreparedStatement) {
    this.statement = statement;
  }

  bind(...values: unknown[]): SqlStatement {
    this.statement = this.statement.bind(...values);
    return this;
  }

  async first<T>(): Promise<T | null> {
    return (await this.statement.first<T>()) ?? null;
  }

  async all<T>(): Promise<{ results: T[] }> {
    const data = await this.statement.all<T>();
    return { results: data.results ?? [] };
  }

  async run(): Promise<SqlRunResult> {
    const result = await this.statement.run();
    return { meta: { changes: result.meta.changes } };
  }
}

export class D1DatabaseAdapter implements DatabaseAdapter {
  constructor(private readonly db: D1Database) {}

  prepare(sql: string): SqlStatement {
    return new D1StatementAdapter(this.db.prepare(sql));
  }
}
