import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSqliteDatabaseAdapter } from "../src/node/sqlite";
import { setFallbackDatabaseAdapter } from "../src/context";
import app from "../src/index";
import type { Env } from "../src/types";
import { getCookieHeaderFromResponse } from "./helpers/http";

// In-process smoke test against a REAL SQLite database (node:sqlite),
// driving the worker's default export directly (no wrangler dev).
let tmpDir: string;
let sqlitePath: string;
let closeDb: (() => void) | null = null;

const env: Env = {
  PASSWORD_PEPPER: "smoke-pepper",
  ADMIN_TOKEN: "smoke-admin",
  RUNTIME_TARGET: "node",
  DB_DRIVER: "sqlite",
  SQLITE_PATH: "",
  SESSION_TTL_HOURS: "168",
  PBKDF2_ITERATIONS: "1000",
  ENABLE_USER_REGISTRATION: "1",
};

beforeAll(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "koreader-sync-smoke-"));
  sqlitePath = join(tmpDir, "koreader-sync.db");
  env.SQLITE_PATH = sqlitePath;
  const db = createSqliteDatabaseAdapter(sqlitePath);
  db.prepare(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`
  ).run();
  db.prepare(
    `CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      document TEXT NOT NULL,
      progress TEXT NOT NULL,
      percentage REAL NOT NULL,
      device TEXT NOT NULL,
      device_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE (user_id, document)
    )`
  ).run();
  db.prepare(
    `CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`
  ).run();
  db.prepare(
    `CREATE TABLE IF NOT EXISTS statistics_snapshot (
      user_id INTEGER PRIMARY KEY,
      schema_version INTEGER NOT NULL,
      device TEXT NOT NULL,
      device_id TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      statistics_summary_json TEXT,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`
  ).run();
  setFallbackDatabaseAdapter(db);
  closeDb = () => db.close?.();
});

afterAll(() => {
  if (closeDb) closeDb();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("real-sqlite in-process smoke", () => {
  it("runs register -> sync -> web login -> export -> import round-trip", async () => {
    // Register via KOReader API
    const registerRes = await app.request(
      "/users/create",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "smokeuser", password: "password" }),
      },
      env
    );
    expect(registerRes.status).toBe(201);

    // Sync progress via KOReader API
    const authHeaders = {
      "x-auth-user": "smokeuser",
      "x-auth-key": "5f4dcc3b5aa765d61d8327deb882cf99",
      "content-type": "application/json",
    };
    const putRes = await app.request(
      "/syncs/progress",
      {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          document: "smoke-book",
          progress: "page:42",
          percentage: 42.5,
          device: "kobo",
          device_id: "dev-1",
        }),
      },
      env
    );
    expect(putRes.status).toBe(200);

    // Sync statistics via KOReader API
    const statsRes = await app.request(
      "/syncs/statistics",
      {
        method: "PUT",
        headers: { ...authHeaders, "x-client-version": "y-anna-1.0", "User-Agent": "Mozilla/DONTLIKE/ANYTHING" },
        body: JSON.stringify({
          schema_version: 20221111,
          device: "Kindle",
          device_id: "k-1",
          snapshot: {
            books: [
              {
                md5: "smoke-md5",
                title: "Smoke Book",
                authors: "Tester",
                notes: 1,
                last_open: 100,
                highlights: 2,
                pages: 200,
                series: "",
                language: "en",
                total_read_time: 30,
                total_read_pages: 15,
                page_stat_data: [{ page: 1, start_time: 1, duration: 10, total_pages: 200 }],
              },
            ],
          },
        }),
      },
      env
    );
    expect(statsRes.status).toBe(200);

    // Web login
    const loginRes = await app.request(
      "/web/auth/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "smokeuser", password: "password" }),
      },
      env
    );
    expect(loginRes.status).toBe(200);
    const cookie = getCookieHeaderFromResponse(loginRes, "ks_session");

    // Export full data
    const exportRes = await app.request("/web/export/data", { method: "GET", headers: { cookie } }, env);
    expect(exportRes.status).toBe(200);
    const exportData = await exportRes.json();
    expect(exportData.username).toBe("smokeuser");
    expect(exportData.progress).toHaveLength(1);
    expect(exportData.statistics.snapshot.books).toHaveLength(1);
    expect(exportData.statistics.snapshot.books[0].page_stat_data).toHaveLength(1);

    // Import (merge) additional progress + statistics
    const importRes = await app.request(
      "/web/import",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          progress: [
            {
              document: "smoke-book-2",
              progress: "page:7",
              percentage: 7.5,
              device: "pc",
              device_id: "pc-1",
              timestamp: 999,
              updated_at: 999,
            },
          ],
          statistics: {
            schema_version: 20221111,
            device: "imported",
            device_id: "",
            snapshot: {
              books: [
                {
                  md5: "smoke-md5-2",
                  title: "Imported Book",
                  authors: "Someone",
                  notes: 0,
                  last_open: 200,
                  highlights: 0,
                  pages: 50,
                  series: "",
                  language: "en",
                  total_read_time: 5,
                  total_read_pages: 2,
                  page_stat_data: [{ page: 1, start_time: 5, duration: 9, total_pages: 50 }],
                },
              ],
            },
          },
        }),
      },
      env
    );
    expect(importRes.status).toBe(200);
    const importBody = await importRes.json();
    expect(importBody).toMatchObject({ status: "ok", progress: 1, statisticsBooks: 2 });

    // Verify merged state via export again
    const exportRes2 = await app.request("/web/export/data", { method: "GET", headers: { cookie } }, env);
    const exportData2 = await exportRes2.json();
    expect(exportData2.progress).toHaveLength(2);
    expect(exportData2.statistics.snapshot.books).toHaveLength(2);
  });

  it("serves db-format schema payload on real runtime", async () => {
    const res = await app.request("/web/export/db-format", { method: "GET" }, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.statisticsSchemaSql).toContain("CREATE TABLE");
    expect(data.progressSchemaSql).toContain("CREATE TABLE");
  });
});
