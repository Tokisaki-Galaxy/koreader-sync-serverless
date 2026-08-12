import { describe, expect, it } from "vitest";
import app from "../src/index";
import { hashPassword, sha256 } from "../src/crypto";
import { parsePbkdf2Iterations } from "../src/services/common";
import { getStatisticsSnapshot, listAllProgressByUser, upsertStatisticsSnapshot } from "../src/db";
import { createMockEnv } from "./helpers/mock-db";
import { getCookieHeaderFromResponse } from "./helpers/http";

describe("worker integration", () => {
  it("exposes healthcheck endpoint", async () => {
    const env = createMockEnv();
    const res = await app.request("/healthcheck", undefined, env);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ state: "OK" });
    expect(res.headers.get("x-frame-options")).toBe("DENY");
  });

  it("handles KOReader register + sync + fetch flow", async () => {
    const env = createMockEnv();

    const registerRes = await app.request(
      "/users/create",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "reader", password: "password" }),
      },
      env
    );
    expect(registerRes.status).toBe(201);

    const authHeaders = {
      "x-auth-user": "reader",
      "x-auth-key": "5f4dcc3b5aa765d61d8327deb882cf99",
      "content-type": "application/json",
    };

    const putRes = await app.request(
      "/syncs/progress",
      {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          document: "book-1",
          progress: "page:10",
          percentage: 23.5,
          device: "kobo",
          device_id: "device-a",
        }),
      },
      env
    );
    expect(putRes.status).toBe(200);

    const getRes = await app.request(
      "/syncs/progress/book-1",
      { method: "GET", headers: { "x-auth-user": "reader", "x-auth-key": "5f4dcc3b5aa765d61d8327deb882cf99" } },
      env
    );
    expect(getRes.status).toBe(200);
    const payload = await getRes.json();
    expect(payload.document).toBe("book-1");
    expect(payload.progress).toBe("page:10");
    expect(payload.device_id).toBe("device-a");
  });

  it("returns document-only payload when progress does not exist", async () => {
    const env = createMockEnv();
    const md5Password = "5f4dcc3b5aa765d61d8327deb882cf99";
    const hash = await hashPassword(
      md5Password,
      "reader2",
      env.PASSWORD_PEPPER,
      parsePbkdf2Iterations(env)
    );
    await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").bind("reader2", hash).run();

    const res = await app.request(
      "/syncs/progress/missing-book",
      { method: "GET", headers: { "x-auth-user": "reader2", "x-auth-key": md5Password } },
      env
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ document: "missing-book" });
  });

  it("supports web login -> me -> logout", async () => {
    const env = createMockEnv();
    const md5Password = "5f4dcc3b5aa765d61d8327deb882cf99";
    const hash = await hashPassword(
      md5Password,
      "webuser",
      env.PASSWORD_PEPPER,
      parsePbkdf2Iterations(env)
    );
    await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").bind("webuser", hash).run();

    const loginRes = await app.request(
      "/web/auth/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "webuser", password: "password" }),
      },
      env
    );
    expect(loginRes.status).toBe(200);
    const cookie = getCookieHeaderFromResponse(loginRes, "ks_session");

    const meRes = await app.request(
      "/web/me",
      { method: "GET", headers: { cookie } },
      env
    );
    expect(meRes.status).toBe(200);
    await expect(meRes.json()).resolves.toMatchObject({ username: "webuser" });

    const logoutRes = await app.request(
      "/web/auth/logout",
      { method: "POST", headers: { cookie } },
      env
    );
    expect(logoutRes.status).toBe(200);
  });

  it("supports admin login and init-status checks", async () => {
    const env = createMockEnv({ initialized: false, missingTables: ["users", "progress"] });

    const unauthorized = await app.request("/admin/init/status", { method: "GET" }, env);
    expect(unauthorized.status).toBe(401);

    const loginRes = await app.request(
      "/admin/auth/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "admin-token" }),
      },
      env
    );
    expect(loginRes.status).toBe(200);

    const adminCookie = getCookieHeaderFromResponse(loginRes, "ks_admin_session");
    const statusRes = await app.request(
      "/admin/init/status",
      { method: "GET", headers: { cookie: adminCookie } },
      env
    );
    expect(statusRes.status).toBe(200);
    await expect(statusRes.json()).resolves.toMatchObject({ initialized: false });
  });

  it("merges statistics snapshots by md5", async () => {
    const env = createMockEnv();
    const md5Password = "5f4dcc3b5aa765d61d8327deb882cf99";
    const hash = await hashPassword(
      md5Password,
      "stats",
      env.PASSWORD_PEPPER,
      parsePbkdf2Iterations(env)
    );
    await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").bind("stats", hash).run();

    const baseHeaders = {
      "x-auth-user": "stats",
      "x-auth-key": md5Password,
      "content-type": "application/json",
      "x-client-version": "y-anna-1.0",
      "User-Agent": "Mozilla/DONTLIKE/ANYTHING",
    };

    const body1 = {
      schema_version: 20221111,
      device: "Kindle",
      device_id: "k-1",
      snapshot: {
        books: [
          {
            md5: "abc",
            title: "A",
            authors: "X",
            notes: 1,
            last_open: 100,
            highlights: 2,
            pages: 100,
            series: "",
            language: "en",
            total_read_time: 10,
            total_read_pages: 5,
            page_stat_data: [{ page: 1, start_time: 1, duration: 10, total_pages: 100 }],
          },
        ],
      },
    };

    const body2 = {
      schema_version: 20221111,
      device: "Kindle",
      device_id: "k-1",
      snapshot: {
        books: [
          {
            md5: "abc",
            title: "A2",
            authors: "X",
            notes: 2,
            last_open: 120,
            highlights: 3,
            pages: 100,
            series: "",
            language: "en",
            total_read_time: 20,
            total_read_pages: 9,
            page_stat_data: [{ page: 1, start_time: 1, duration: 10, total_pages: 100 }],
          },
        ],
      },
    };

    const put1 = await app.request(
      "/syncs/statistics",
      { method: "PUT", headers: baseHeaders, body: JSON.stringify(body1) },
      env
    );
    expect(put1.status).toBe(200);

    const put2 = await app.request(
      "/syncs/statistics",
      { method: "PUT", headers: baseHeaders, body: JSON.stringify(body2) },
      env
    );
    expect(put2.status).toBe(200);

    const webLogin = await app.request(
      "/web/auth/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "stats", password: "password" }),
      },
      env
    );
    const cookie = getCookieHeaderFromResponse(webLogin, "ks_session");
    const booksRes = await app.request("/web/statistics/books", { headers: { cookie } }, env);
    expect(booksRes.status).toBe(200);
    const booksData = await booksRes.json();
    expect(booksData.page).toBe(1);
    expect(booksData.pageSize).toBe(50);
    expect(booksData.total).toBe(1);
    expect(booksData.items).toHaveLength(1);
    expect(booksData.items[0].notes).toBe(2);
    expect(booksData.items[0].total_read_time).toBe(20);
  });

  it("accepts admin cookie computed from token and pepper", async () => {
    const env = createMockEnv();
    const adminSessionHash = await sha256(`${env.ADMIN_TOKEN}:${env.PASSWORD_PEPPER}`);
    const res = await app.request(
      "/admin/me",
      { method: "GET", headers: { cookie: `ks_admin_session=${adminSessionHash}` } },
      env
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ mode: "token" });
  });

  it("serves calendar aggregates from the statistics summary", async () => {
    const env = createMockEnv();
    const md5Password = "5f4dcc3b5aa765d61d8327deb882cf99";
    const register = await app.request(
      "/users/create",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "caluser", password: "password" }),
      },
      env
    );
    expect(register.status).toBe(201);

    const base = new Date(2024, 0, 5, 10, 30, 0);
    const t1 = Math.floor(base.getTime() / 1000);
    const t2 = t1 + 3600;

    const statsHeaders = {
      "x-auth-user": "caluser",
      "x-auth-key": md5Password,
      "content-type": "application/json",
      "x-client-version": "y-anna-1.0",
      "User-Agent": "Mozilla/DONTLIKE/ANYTHING",
    };
    const putRes = await app.request(
      "/syncs/statistics",
      {
        method: "PUT",
        headers: statsHeaders,
        body: JSON.stringify({
          schema_version: 20221111,
          device: "Kindle",
          device_id: "k-1",
          snapshot: {
            books: [
              {
                md5: "abc",
                title: "A",
                authors: "X",
                notes: 1,
                last_open: t1,
                highlights: 2,
                pages: 100,
                series: "",
                language: "en",
                total_read_time: 10,
                total_read_pages: 5,
                page_stat_data: [
                  { page: 1, start_time: t1, duration: 61, total_pages: 100 },
                  { page: 2, start_time: t1 + 90, duration: 59, total_pages: 100 },
                  { page: 3, start_time: t2, duration: 120, total_pages: 100 },
                ],
              },
              {
                md5: "def",
                title: "B",
                authors: "Y",
                notes: 0,
                last_open: 0,
                highlights: 0,
                pages: 200,
                series: "",
                language: "en",
                total_read_time: 5,
                total_read_pages: 2,
                page_stat_data: [{ page: 1, start_time: t2, duration: 30, total_pages: 200 }],
              },
            ],
          },
        }),
      },
      env
    );
    expect(putRes.status).toBe(200);

    const loginRes = await app.request(
      "/web/auth/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "caluser", password: "password" }),
      },
      env
    );
    const cookie = getCookieHeaderFromResponse(loginRes, "ks_session");

    const statsRes = await app.request("/web/stats", { headers: { cookie } }, env);
    expect(statsRes.status).toBe(200);
    const statsData = await statsRes.json();
    expect(statsData.readingStatistics).toMatchObject({ totalBooks: 2, totalReadTime: 15, totalReadPages: 7 });

    const calRes = await app.request("/web/stats/calendar", { headers: { cookie } }, env);
    expect(calRes.status).toBe(200);
    const calData = await calRes.json();
    expect(calData.years).toEqual([2024]);
    expect(calData.days).toEqual([{ date: "2024-01-05", minutes: 5 }]);

    const detailRes = await app.request("/web/stats/calendar/detail?year=2024&month=1", { headers: { cookie } }, env);
    expect(detailRes.status).toBe(200);
    const detailData = await detailRes.json();
    expect(detailData.totalMinutes).toBe(5);
    expect(detailData.books.abc).toMatchObject({ title: "A", authors: "X", totalMinutes: 4 });
    expect(detailData.books.abc.days["2024-01-05"]["10"]).toBe(2);
    expect(detailData.books.abc.days["2024-01-05"]["11"]).toBe(2);
    expect(detailData.books.def).toMatchObject({ title: "B", authors: "Y", totalMinutes: 1 });

    const detailOther = await app.request("/web/stats/calendar/detail?year=2024&month=2", { headers: { cookie } }, env);
    expect(detailOther.status).toBe(200);
    await expect(detailOther.json()).resolves.toMatchObject({ totalMinutes: 0, books: {} });
  });

  it("lazy-backfills the statistics summary for legacy rows", async () => {
    const env = createMockEnv();
    const md5Password = "5f4dcc3b5aa765d61d8327deb882cf99";
    const register = await app.request(
      "/users/create",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "legacy", password: "password" }),
      },
      env
    );
    expect(register.status).toBe(201);

    const loginRes = await app.request(
      "/web/auth/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "legacy", password: "password" }),
      },
      env
    );
    const cookie = getCookieHeaderFromResponse(loginRes, "ks_session");

    const meRes = await app.request("/web/me", { headers: { cookie } }, env);
    const me = await meRes.json();
    const userId = me.id;

    const base = new Date(2024, 0, 5, 10, 30, 0);
    const t1 = Math.floor(base.getTime() / 1000);
    const legacySnapshot = {
      books: [
        {
          md5: "legacy",
          title: "Legacy Book",
          authors: "",
          notes: 0,
          last_open: t1,
          highlights: 0,
          pages: 100,
          series: "",
          language: "en",
          total_read_time: 30,
          total_read_pages: 10,
          page_stat_data: [{ page: 1, start_time: t1, duration: 120, total_pages: 100 }],
        },
      ],
    };
    await upsertStatisticsSnapshot(
      env.DB,
      userId,
      20221111,
      "Kindle",
      "k-1",
      JSON.stringify(legacySnapshot),
      null
    );

    const statsRes = await app.request("/web/stats", { headers: { cookie } }, env);
    expect(statsRes.status).toBe(200);
    const statsData = await statsRes.json();
    expect(statsData.readingStatistics).toMatchObject({
      totalBooks: 1,
      totalReadTime: 30,
      totalReadPages: 10,
      lastOpenAt: t1,
    });

    const calRes = await app.request("/web/stats/calendar", { headers: { cookie } }, env);
    expect(calRes.status).toBe(200);
    await expect(calRes.json()).resolves.toMatchObject({
      years: [2024],
      days: [{ date: "2024-01-05", minutes: 2 }],
    });

    const stored = await getStatisticsSnapshot(env.DB, userId);
    expect(stored?.statistics_summary_json).not.toBeNull();
    expect(JSON.parse(stored?.statistics_summary_json ?? "{}").version).toBe(1);
  });

  describe("user data export/import", () => {
    it("serves self-hosted sql.js assets (no CDN needed)", async () => {
      const env = createMockEnv();
      const jsRes = await app.request("/assets/sql-wasm.js", { method: "GET" }, env);
      expect(jsRes.status).toBe(200);
      expect(jsRes.headers.get("content-type")).toContain("javascript");
      expect(await jsRes.text()).toContain("sql-wasm");

      const wasmRes = await app.request("/assets/sql-wasm.wasm", { method: "GET" }, env);
      expect(wasmRes.status).toBe(200);
      expect(wasmRes.headers.get("content-type")).toContain("wasm");
      const bytes = await wasmRes.arrayBuffer();
      expect(bytes.byteLength).toBe(0); // stubbed in vitest; real bytes at deploy
    });

    async function loginAndSeed(env: ReturnType<typeof createMockEnv>) {
      const md5Password = "5f4dcc3b5aa765d61d8327deb882cf99";
      const register = await app.request(
        "/users/create",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ username: "backupuser", password: "password" }),
        },
        env
      );
      expect(register.status).toBe(201);

      const authHeaders = {
        "x-auth-user": "backupuser",
        "x-auth-key": md5Password,
        "content-type": "application/json",
      };
      const putRes = await app.request(
        "/syncs/progress",
        {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({
            document: "book-1",
            progress: "page:10",
            percentage: 23.5,
            device: "kobo",
            device_id: "device-a",
          }),
        },
        env
      );
      expect(putRes.status).toBe(200);

      const statsHeaders = {
        ...authHeaders,
        "x-client-version": "y-anna-1.0",
        "User-Agent": "Mozilla/DONTLIKE/ANYTHING",
      };
      const statsRes = await app.request(
        "/syncs/statistics",
        {
          method: "PUT",
          headers: statsHeaders,
          body: JSON.stringify({
            schema_version: 20221111,
            device: "Kindle",
            device_id: "k-1",
            snapshot: {
              books: [
                {
                  md5: "abc",
                  title: "A",
                  authors: "X",
                  notes: 1,
                  last_open: 100,
                  highlights: 2,
                  pages: 100,
                  series: "",
                  language: "en",
                  total_read_time: 10,
                  total_read_pages: 5,
                  page_stat_data: [{ page: 1, start_time: 1, duration: 10, total_pages: 100 }],
                },
              ],
            },
          }),
        },
        env
      );
      expect(statsRes.status).toBe(200);

      const loginRes = await app.request(
        "/web/auth/login",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ username: "backupuser", password: "password" }),
        },
        env
      );
      expect(loginRes.status).toBe(200);
      return getCookieHeaderFromResponse(loginRes, "ks_session");
    }

    it("serves db-format schema payload", async () => {
      const env = createMockEnv();
      const res = await app.request("/web/export/db-format", { method: "GET" }, env);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.statisticsSchemaSql).toContain("CREATE TABLE");
      expect(data.progressSchemaSql).toContain("CREATE TABLE");
    });

    it("requires auth for export/import", async () => {
      const env = createMockEnv();
      const exportRes = await app.request("/web/export/data", { method: "GET" }, env);
      expect(exportRes.status).toBe(401);
      const importRes = await app.request(
        "/web/import",
        { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
        env
      );
      expect(importRes.status).toBe(401);
    });

    it("exports full user data", async () => {
      const env = createMockEnv();
      const cookie = await loginAndSeed(env);

      const res = await app.request("/web/export/data", { method: "GET", headers: { cookie } }, env);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.username).toBe("backupuser");
      expect(data.progress).toHaveLength(1);
      expect(data.progress[0]).toMatchObject({ document: "book-1", percentage: 23.5 });
      expect(data.statistics).toMatchObject({ schema_version: 20221111, device: "Kindle" });
      expect(data.statistics.snapshot.books).toHaveLength(1);
      expect(data.statistics.snapshot.books[0].page_stat_data).toHaveLength(1);
    });

    it("imports progress records", async () => {
      const env = createMockEnv();
      const cookie = await loginAndSeed(env);

      const res = await app.request(
        "/web/import",
        {
          method: "POST",
          headers: { "content-type": "application/json", cookie },
          body: JSON.stringify({
            progress: [
              {
                document: "imported-doc",
                progress: "page:5",
                percentage: 42,
                device: "pc",
                device_id: "pc-1",
                timestamp: 999,
                updated_at: 999,
              },
            ],
          }),
        },
        env
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({ status: "ok", progress: 1 });

      const meRes = await app.request("/web/me", { headers: { cookie } }, env);
      const me = await meRes.json();
      const progress = await listAllProgressByUser(env.DB, me.id);
      expect(progress.find((p) => p.document === "imported-doc")).toMatchObject({ percentage: 42, device: "pc" });
    });

    it("imports statistics snapshot by merging with existing", async () => {
      const env = createMockEnv();
      const cookie = await loginAndSeed(env);

      const res = await app.request(
        "/web/import",
        {
          method: "POST",
          headers: { "content-type": "application/json", cookie },
          body: JSON.stringify({
            statistics: {
              schema_version: 20221111,
              device: "imported",
              device_id: "",
              snapshot: {
                books: [
                  {
                    md5: "abc",
                    title: "A",
                    authors: "X",
                    notes: 1,
                    last_open: 100,
                    highlights: 2,
                    pages: 100,
                    series: "",
                    language: "en",
                    total_read_time: 10,
                    total_read_pages: 5,
                    page_stat_data: [{ page: 1, start_time: 1, duration: 10, total_pages: 100 }],
                  },
                  {
                    md5: "newbook",
                    title: "New Book",
                    authors: "Y",
                    notes: 0,
                    last_open: 200,
                    highlights: 0,
                    pages: 50,
                    series: "",
                    language: "en",
                    total_read_time: 3,
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
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({ status: "ok", statisticsBooks: 2 });

      const meRes = await app.request("/web/me", { headers: { cookie } }, env);
      const me = await meRes.json();
      const stored = await getStatisticsSnapshot(env.DB, me.id);
      expect(stored).not.toBeNull();
      const snapshot = JSON.parse(stored?.snapshot_json ?? "{}");
      expect(snapshot.books).toHaveLength(2);
      const mergedBook = snapshot.books.find((b: { md5: string }) => b.md5 === "abc");
      expect(mergedBook).toMatchObject({ total_read_time: 10, total_read_pages: 5 });
    });

    it("rejects empty import payload", async () => {
      const env = createMockEnv();
      const cookie = await loginAndSeed(env);
      const res = await app.request(
        "/web/import",
        {
          method: "POST",
          headers: { "content-type": "application/json", cookie },
          body: JSON.stringify({}),
        },
        env
      );
      expect(res.status).toBe(400);
    });
  });
});
