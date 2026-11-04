import type { DatabaseAdapter } from "./database/adapter";

export type Migration = {
  version: string;
  sql: string;
};

const MIGRATIONS_TABLE = "schema_migrations";

export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      current += char;
      continue;
    }

    if (inBlockComment) {
      current += char;
      if (char === "*" && next === "/") {
        current += next;
        i++;
        inBlockComment = false;
      }
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && char === "-" && next === "-") {
      current += char + next;
      i++;
      inLineComment = true;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && char === "/" && next === "*") {
      current += char + next;
      i++;
      inBlockComment = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      if (inSingleQuote && next === "'") {
        current += char + next;
        i++;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      if (inDoubleQuote && next === '"') {
        current += char + next;
        i++;
        continue;
      }
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }

    if (char === ";" && !inSingleQuote && !inDoubleQuote) {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
      continue;
    }

    current += char;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

function isDuplicateColumnError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /duplicate column name/i.test(message);
}

/**
 * Apply migrations in filename order and record the versions that succeeded.
 *
 * `CREATE TABLE IF NOT EXISTS` handles fresh and legacy databases. SQLite has
 * no `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, so a legacy database that
 * already has the column but no migration row is treated as applied when the
 * only error is a duplicate column.
 */
export async function runMigrations(db: DatabaseAdapter, migrations: Migration[]): Promise<void> {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      version TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`
  ).run();

  const appliedRows = await db
    .prepare(`SELECT version FROM ${MIGRATIONS_TABLE}`)
    .all<{ version: string }>();
  const applied = new Set((appliedRows.results ?? []).map((row) => row.version));

  const ordered = [...migrations].sort((a, b) => a.version.localeCompare(b.version));
  for (const migration of ordered) {
    if (applied.has(migration.version)) continue;
    for (const statement of splitSqlStatements(migration.sql)) {
      try {
        await db.prepare(statement).run();
      } catch (error) {
        if (!isDuplicateColumnError(error)) throw error;
      }
    }
    await db
      .prepare(`INSERT OR IGNORE INTO ${MIGRATIONS_TABLE} (version) VALUES (?)`)
      .bind(migration.version)
      .run();
  }
}
