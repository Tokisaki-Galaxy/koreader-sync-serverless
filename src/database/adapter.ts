export type SqlParams = unknown[];

export interface SqlResultMeta {
  changes?: number;
}

export interface SqlRunResult {
  meta: SqlResultMeta;
}

export interface SqlStatement {
  bind(...values: unknown[]): SqlStatement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<SqlRunResult>;
}

export interface DatabaseAdapter {
  prepare(sql: string): SqlStatement;
  // Runs the statements in a single transaction. On D1 this maps to one batch,
  // which also counts as a single query against the per-invocation limit.
  batch(statements: SqlStatement[]): Promise<void>;
  close?(): void;
}
