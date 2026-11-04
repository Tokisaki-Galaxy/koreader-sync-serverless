import { describe, expect, it } from "vitest";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSqliteDatabaseAdapter } from "../src/node/sqlite";
import { runMigrations, type Migration } from "../src/migrations";

function loadMigrations(): Migration[] {
  const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "../migrations");
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => ({
      version: file.replace(/\.sql$/, ""),
      sql: readFileSync(join(migrationsDir, file), "utf8"),
    }));
}

function columnNames(rows: { results: Array<{ name: string }> }): string[] {
  return rows.results.map((row) => row.name);
}

describe("migrations", () => {
  it("applies every migration and is idempotent", async () => {
    const dir = mkdtempSync(join(tmpdir(), "koreader-sync-migrations-"));
    const db = createSqliteDatabaseAdapter(join(dir, "test.db"));
    try {
      const migrations = loadMigrations();
      await runMigrations(db, migrations);
      await runMigrations(db, migrations);

      const progressColumns = await db.prepare("PRAGMA table_info(progress)").all<{ name: string }>();
      expect(columnNames(progressColumns)).toContain("metadata");

      const statisticsColumns = await db
        .prepare("PRAGMA table_info(statistics_snapshot)")
        .all<{ name: string }>();
      expect(columnNames(statisticsColumns)).toContain("statistics_summary_json");

      const applied = await db
        .prepare("SELECT version FROM schema_migrations ORDER BY version")
        .all<{ version: string }>();
      expect(applied.results.map((row) => row.version)).toEqual([
        "0001_init",
        "0002_statistics_sync",
        "0003_statistics_summary",
        "0004_progress_metadata",
      ]);
    } finally {
      db.close?.();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("recovers when columns exist but migration records were lost", async () => {
    const dir = mkdtempSync(join(tmpdir(), "koreader-sync-legacy-"));
    const db = createSqliteDatabaseAdapter(join(dir, "test.db"));
    try {
      const migrations = loadMigrations();
      await runMigrations(db, migrations);
      await db.prepare("DELETE FROM schema_migrations").run();

      await expect(runMigrations(db, migrations)).resolves.toBeUndefined();

      const applied = await db
        .prepare("SELECT version FROM schema_migrations ORDER BY version")
        .all<{ version: string }>();
      expect(applied.results.map((row) => row.version)).toEqual([
        "0001_init",
        "0002_statistics_sync",
        "0003_statistics_summary",
        "0004_progress_metadata",
      ]);
    } finally {
      db.close?.();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
