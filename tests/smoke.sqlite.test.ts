import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSqliteDatabaseAdapter } from "../src/node/sqlite";
import { setFallbackDatabaseAdapter } from "../src/context";
import { runMigrations, type Migration } from "../src/migrations";
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

beforeAll(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), "koreader-sync-smoke-"));
  sqlitePath = join(tmpDir, "koreader-sync.db");
  env.SQLITE_PATH = sqlitePath;
  const db = createSqliteDatabaseAdapter(sqlitePath);
  const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "../migrations");
  const migrations: Migration[] = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => ({
      version: file.replace(/\.sql$/, ""),
      sql: readFileSync(join(migrationsDir, file), "utf8"),
    }));
  await runMigrations(db, migrations);
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
          metadata: { title: "Smoke Book", authors: "Tester" },
        }),
      },
      env
    );
    expect(putRes.status).toBe(200);

    const getProgressRes = await app.request(
      "/syncs/progress/smoke-book",
      { method: "GET", headers: authHeaders },
      env
    );
    expect(getProgressRes.status).toBe(200);
    await expect(getProgressRes.json()).resolves.toMatchObject({
      document: "smoke-book",
      metadata: { title: "Smoke Book", authors: "Tester" },
    });

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
    // "smoke-md5" already exists from the seed, so only "smoke-md5-2" is new.
    expect(importBody).toMatchObject({ status: "ok", progress: 1, statisticsBooks: 1 });

    // Verify merged state via export again
    const exportRes2 = await app.request("/web/export/data", { method: "GET", headers: { cookie } }, env);
    const exportData2 = await exportRes2.json();
    expect(exportData2.progress).toHaveLength(2);
    expect(exportData2.statistics.snapshot.books).toHaveLength(2);
  });

  it("lists, renames, hides, merges, and filters devices", async () => {
    await app.request(
      "/users/create",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "deviceuser", password: "password" }),
      },
      env
    );

    const authHeaders = {
      "x-auth-user": "deviceuser",
      "x-auth-key": "5f4dcc3b5aa765d61d8327deb882cf99",
      "content-type": "application/json",
    };

    const putProgress = (body: Record<string, unknown>) =>
      app.request(
        "/syncs/progress",
        { method: "PUT", headers: authHeaders, body: JSON.stringify(body) },
        env
      );

    expect((await putProgress({
      document: "device-doc-a",
      progress: "page:1",
      percentage: 0.1,
      device: "Kindle",
      device_id: "id-1",
    })).status).toBe(200);
    expect((await putProgress({
      document: "device-doc-b",
      progress: "page:2",
      percentage: 0.2,
      device: "Kobo",
      device_id: "",
    })).status).toBe(200);

    const statsPut = await app.request(
      "/syncs/statistics",
      {
        method: "PUT",
        headers: { ...authHeaders, "x-client-version": "y-anna-1.0", "User-Agent": "Mozilla/DONTLIKE/ANYTHING" },
        body: JSON.stringify({
          schema_version: 20221111,
          device: "PocketBook",
          device_id: "id-3",
          snapshot: { books: [] },
        }),
      },
      env
    );
    expect(statsPut.status).toBe(200);

    const login = await app.request(
      "/web/auth/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "deviceuser", password: "password" }),
      },
      env
    );
    const cookie = getCookieHeaderFromResponse(login, "ks_session");

    const initial = await (await app.request("/web/stats", { headers: { cookie } }, env)).json();
    expect(initial.devices).toHaveLength(3);
    const kindle = initial.devices.find((d: { device: string }) => d.device === "Kindle");
    const kobo = initial.devices.find((d: { device: string }) => d.device === "Kobo");
    const pocket = initial.devices.find((d: { device: string }) => d.device === "PocketBook");
    expect(kindle).toMatchObject({ deviceId: "id-1", records: 1, hidden: false });
    expect(kobo).toMatchObject({ deviceId: "", records: 1, hidden: false });
    expect(pocket).toMatchObject({ deviceId: "id-3", records: 0, hidden: false });

    const rename = await app.request(
      `/web/devices/${kindle.id}`,
      {
        method: "PATCH",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ alias: "Kindle PW5" }),
      },
      env
    );
    expect(rename.status).toBe(200);

    const hide = await app.request(
      `/web/devices/${kobo.id}`,
      {
        method: "PATCH",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ hidden: true }),
      },
      env
    );
    expect(hide.status).toBe(200);

    const merge = await app.request(
      `/web/devices/${kobo.id}/merge`,
      {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ targetId: kindle.id }),
      },
      env
    );
    expect(merge.status).toBe(200);

    const hidePocket = await app.request(
      `/web/devices/${pocket.id}`,
      {
        method: "PATCH",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ hidden: true }),
      },
      env
    );
    expect(hidePocket.status).toBe(200);

    const hiddenStats = await (await app.request("/web/stats", { headers: { cookie } }, env)).json();
    expect(hiddenStats.devices).toHaveLength(2);
    expect(hiddenStats.devices.find((d: { id: number }) => d.id === kindle.id)).toMatchObject({
      alias: "Kindle PW5",
      records: 2,
    });
    expect(hiddenStats.devices.find((d: { id: number }) => d.id === pocket.id)).toMatchObject({
      hidden: true,
    });
    expect(hiddenStats.summary.totalDevices).toBe(1);

    const unhidePocket = await app.request(
      `/web/devices/${pocket.id}`,
      {
        method: "PATCH",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ hidden: false }),
      },
      env
    );
    expect(unhidePocket.status).toBe(200);

    const records = await app.request(
      "/web/records?device_id=id-1&pageSize=10",
      { headers: { cookie } },
      env
    );
    const recordsData = await records.json();
    expect(recordsData.items).toHaveLength(2);
    expect(recordsData.items.every((item: { device_id: string }) => item.device_id === "id-1")).toBe(true);
  });

  it("serves db-format schema payload on real runtime", async () => {
    const res = await app.request("/web/export/db-format", { method: "GET" }, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.statisticsSchemaSql).toContain("CREATE TABLE");
    expect(data.progressSchemaSql).toContain("CREATE TABLE");
  });
  it("serves self-hosted sql.js assets on real runtime", async () => {
    const jsRes = await app.request("/assets/sql-wasm.js", { method: "GET" }, env);
    expect(jsRes.status).toBe(200);
    expect(jsRes.headers.get("content-type")).toContain("javascript");
    expect(await jsRes.text()).toContain("var initSqlJs = function");
    expect(jsRes.headers.get("content-security-policy")).toContain("'wasm-unsafe-eval'");

    const wasmRes = await app.request("/assets/sql-wasm.wasm", { method: "GET" }, env);
    expect(wasmRes.status).toBe(200);
    expect(wasmRes.headers.get("content-type")).toContain("wasm");
    const bytes = new Uint8Array(await wasmRes.arrayBuffer());
    expect(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])).toBe("\0asm");
    expect(bytes.byteLength).toBeGreaterThan(100000);
  });
});
