import { describe, expect, it } from "vitest";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSqliteDatabaseAdapter } from "../src/node/sqlite";
import { runMigrations, type Migration } from "../src/migrations";
import { MIGRATIONS } from "../src/migrations-bundle";
import { getDatabaseInitStatus } from "../src/db";

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

      const deviceColumns = await db.prepare("PRAGMA table_info(user_devices)").all<{ name: string }>();
      expect(columnNames(deviceColumns)).toEqual(
        expect.arrayContaining(["user_id", "device_key", "device", "device_id", "alias", "hidden"])
      );

      const chunkColumns = await db
        .prepare("PRAGMA table_info(statistics_snapshot_chunk)")
        .all<{ name: string }>();
      expect(columnNames(chunkColumns)).toEqual(
        expect.arrayContaining(["user_id", "kind", "chunk_index", "data"])
      );

      const applied = await db
        .prepare("SELECT version FROM schema_migrations ORDER BY version")
        .all<{ version: string }>();
      expect(applied.results.map((row) => row.version)).toEqual([
        "0001_init",
        "0002_statistics_sync",
        "0003_statistics_summary",
        "0004_progress_metadata",
        "0005_user_devices",
        "0006_user_devices_backfill",
        "0007_statistics_snapshot_chunks",
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
        "0005_user_devices",
        "0006_user_devices_backfill",
        "0007_statistics_snapshot_chunks",
      ]);
    } finally {
      db.close?.();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("backfills user devices from progress and statistics", async () => {
    const dir = mkdtempSync(join(tmpdir(), "koreader-sync-devices-"));
    const db = createSqliteDatabaseAdapter(join(dir, "test.db"));
    try {
      const migrations = loadMigrations();
      await runMigrations(db, migrations.slice(0, 4));
      await db.prepare(
        "INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)"
      ).bind(1, "device-user", "hash").run();
      await db.prepare(
        `INSERT INTO progress (user_id, document, progress, percentage, device, device_id, timestamp, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(1, "doc-a", "page:1", 0.1, "Kindle", "id-1", 100, 100).run();
      await db.prepare(
        `INSERT INTO progress (user_id, document, progress, percentage, device, device_id, timestamp, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(1, "doc-b", "page:2", 0.2, "Kobo", "", 200, 200).run();
      await db.prepare(
        `INSERT INTO statistics_snapshot (user_id, schema_version, device, device_id, snapshot_json, statistics_summary_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(1, 20221111, "PocketBook", "id-3", "{}", null, 300).run();

      await runMigrations(db, migrations.slice(4));

      const devices = await db.prepare(
        "SELECT device_key, device, first_seen_at, last_seen_at FROM user_devices ORDER BY device_key"
      ).all<{ device_key: string; device: string; first_seen_at: number; last_seen_at: number }>();
      expect(devices.results).toEqual([
        { device_key: "id:id-1", device: "Kindle", first_seen_at: 100, last_seen_at: 100 },
        { device_key: "id:id-3", device: "PocketBook", first_seen_at: 300, last_seen_at: 300 },
        { device_key: "name:Kobo", device: "Kobo", first_seen_at: 200, last_seen_at: 200 },
      ]);
    } finally {
      db.close?.();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("keeps the generated bundle in sync with the SQL files", () => {
    expect(MIGRATIONS).toEqual(loadMigrations());
  });

  it("reports missing columns on a partially migrated database", async () => {
    const dir = mkdtempSync(join(tmpdir(), "koreader-sync-partial-"));
    const db = createSqliteDatabaseAdapter(join(dir, "test.db"));
    try {
      await runMigrations(db, loadMigrations().slice(0, 2));

      const status = await getDatabaseInitStatus(db);
      expect(status.initialized).toBe(false);
      expect(status.missingTables).toContain("progress.metadata");
      expect(status.missingTables).toContain("statistics_snapshot.statistics_summary_json");
    } finally {
      db.close?.();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
