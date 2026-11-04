import { describe, expect, it } from "vitest";
import app from "../src/index";
import { hashPassword, sha256 } from "../src/crypto";
import { parsePbkdf2Iterations } from "../src/services/common";
import { getDatabaseInitStatus, getStatisticsSnapshot, listAllProgressByUser, upsertStatisticsSnapshot } from "../src/db";
import { D1DatabaseAdapter } from "../src/database/d1Adapter";
import { STATISTICS_SUMMARY_VERSION } from "../src/services/statistics";
import { MAX_SNAPSHOT_BYTES } from "../src/services/snapshotChunks";
import { createMockEnv, readSessionExpiry, seedSession } from "./helpers/mock-db";
import { getCookieHeaderFromResponse } from "./helpers/http";

describe("worker integration", () => {
  it("exposes healthcheck endpoint", async () => {
    const env = createMockEnv();
    const res = await app.request("/healthcheck", undefined, env);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ state: "OK" });
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("content-security-policy")).toContain("'wasm-unsafe-eval'");
  });

  it("reports a default mock database as initialized", async () => {
    const env = createMockEnv();
    const adapter = new D1DatabaseAdapter(env.DB!);
    const status = await getDatabaseInitStatus(adapter);
    expect(status.initialized).toBe(true);
    expect(status.missingTables).toEqual([]);
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

  it("stores optional progress metadata and keeps it when older clients omit it", async () => {
    const env = createMockEnv();

    await app.request(
      "/users/create",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "metareader", password: "password" }),
      },
      env
    );

    const authHeaders = {
      "x-auth-user": "metareader",
      "x-auth-key": "5f4dcc3b5aa765d61d8327deb882cf99",
      "content-type": "application/json",
    };

    const putWithMetadata = await app.request(
      "/syncs/progress",
      {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          document: "meta-book",
          progress: "page:12",
          percentage: 12.5,
          device: "kobo",
          device_id: "device-a",
          metadata: {
            filename: "meta-book.epub",
            title: "Meta Book",
            authors: "Test Author",
            ignored: "not persisted",
          },
        }),
      },
      env
    );
    expect(putWithMetadata.status).toBe(200);

    const firstGet = await app.request(
      "/syncs/progress/meta-book",
      { method: "GET", headers: authHeaders },
      env
    );
    expect(firstGet.status).toBe(200);
    await expect(firstGet.json()).resolves.toMatchObject({
      document: "meta-book",
      metadata: {
        filename: "meta-book.epub",
        title: "Meta Book",
        authors: "Test Author",
      },
    });

    // An older plugin does not send metadata at all. The stored value must survive.
    const putWithoutMetadata = await app.request(
      "/syncs/progress",
      {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          document: "meta-book",
          progress: "page:20",
          percentage: 20,
          device: "kobo",
          device_id: "device-a",
        }),
      },
      env
    );
    expect(putWithoutMetadata.status).toBe(200);

    const secondGet = await app.request(
      "/syncs/progress/meta-book",
      { method: "GET", headers: authHeaders },
      env
    );
    await expect(secondGet.json()).resolves.toMatchObject({
      progress: "page:20",
      metadata: {
        filename: "meta-book.epub",
        title: "Meta Book",
        authors: "Test Author",
      },
    });

    // Malformed metadata must not clear the previous value.
    const putInvalidMetadata = await app.request(
      "/syncs/progress",
      {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          document: "meta-book",
          progress: "page:30",
          percentage: 30,
          device: "kobo",
          device_id: "device-a",
          metadata: "not-an-object",
        }),
      },
      env
    );
    expect(putInvalidMetadata.status).toBe(200);

    const thirdGet = await app.request(
      "/syncs/progress/meta-book",
      { method: "GET", headers: authHeaders },
      env
    );
    await expect(thirdGet.json()).resolves.toMatchObject({
      progress: "page:30",
      metadata: { title: "Meta Book" },
    });

    const longTitle = "a".repeat(600);
    await app.request(
      "/syncs/progress",
      {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          document: "meta-book",
          progress: "page:40",
          percentage: 40,
          device: "kobo",
          device_id: "device-a",
          metadata: { title: longTitle },
        }),
      },
      env
    );
    const longGet = await app.request(
      "/syncs/progress/meta-book",
      { method: "GET", headers: authHeaders },
      env
    );
    const longPayload = await longGet.json();
    expect(longPayload.metadata.title.length).toBe(512);

    const wideTitle = "书".repeat(300);
    await app.request(
      "/syncs/progress",
      {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          document: "meta-book",
          progress: "page:50",
          percentage: 50,
          device: "kobo",
          device_id: "device-a",
          metadata: { title: wideTitle },
        }),
      },
      env
    );
    const wideGet = await app.request(
      "/syncs/progress/meta-book",
      { method: "GET", headers: authHeaders },
      env
    );
    const widePayload = await wideGet.json();
    expect(new TextEncoder().encode(widePayload.metadata.title).length).toBeLessThanOrEqual(512);
    expect(widePayload.metadata.title).toBe("书".repeat(170));
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

  it("renews a near-expiry session on an authenticated request", async () => {
    const env = createMockEnv();
    const md5Password = "5f4dcc3b5aa765d61d8327deb882cf99";
    const hash = await hashPassword(
      md5Password,
      "renewuser",
      env.PASSWORD_PEPPER,
      parsePbkdf2Iterations(env)
    );
    await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").bind("renewuser", hash).run();

    const token = "renew-token";
    const tokenHash = await sha256(`${token}:${env.PASSWORD_PEPPER}`);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const shortExpiry = nowSeconds + 60; // inside the default 168h renewal window
    await seedSession(env, 1, tokenHash, shortExpiry);

    const meRes = await app.request("/web/me", { method: "GET", headers: { cookie: `ks_session=${token}` } }, env);
    expect(meRes.status).toBe(200);
    await expect(meRes.json()).resolves.toMatchObject({ username: "renewuser" });

    const refreshed = readSessionExpiry(env, tokenHash);
    expect(refreshed).not.toBeNull();
    expect(refreshed!).toBeGreaterThan(shortExpiry);

    // The renewed cookie is re-issued with a fresh max-age.
    const setCookie = meRes.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("ks_session=");
    expect(setCookie).toContain(`Max-Age=${168 * 3600}`);

    // The re-issued token still authenticates a follow-up request.
    const followUp = await app.request("/web/me", { method: "GET", headers: { cookie: `ks_session=${token}` } }, env);
    expect(followUp.status).toBe(200);
  });

  it("leaves a fresh session untouched under the default renewal window", async () => {
    const env = createMockEnv();
    const md5Password = "5f4dcc3b5aa765d61d8327deb882cf99";
    const hash = await hashPassword(
      md5Password,
      "freshuser",
      env.PASSWORD_PEPPER,
      parsePbkdf2Iterations(env)
    );
    await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").bind("freshuser", hash).run();

    const token = "fresh-token";
    const tokenHash = await sha256(`${token}:${env.PASSWORD_PEPPER}`);
    const nowSeconds = Math.floor(Date.now() / 1000);
    // A brand-new full-TTL session sits well outside the default half-TTL renewal window.
    const fullExpiry = nowSeconds + 168 * 3600;
    await seedSession(env, 1, tokenHash, fullExpiry);

    const meRes = await app.request("/web/me", { method: "GET", headers: { cookie: `ks_session=${token}` } }, env);
    expect(meRes.status).toBe(200);
    expect(readSessionExpiry(env, tokenHash)).toBe(fullExpiry);
    expect(meRes.headers.get("set-cookie")).toBeNull();
  });

  it("leaves a long-lived session untouched until it nears expiry", async () => {
    const env = createMockEnv();
    const md5Password = "5f4dcc3b5aa765d61d8327deb882cf99";
    const hash = await hashPassword(
      md5Password,
      "steadyuser",
      env.PASSWORD_PEPPER,
      parsePbkdf2Iterations(env)
    );
    await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").bind("steadyuser", hash).run();

    const token = "steady-token";
    const tokenHash = await sha256(`${token}:${env.PASSWORD_PEPPER}`);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const farExpiry = nowSeconds + 30 * 24 * 3600; // 30 days out, well beyond the 7-day window
    await seedSession(env, 1, tokenHash, farExpiry);

    const meRes = await app.request("/web/me", { method: "GET", headers: { cookie: `ks_session=${token}` } }, env);
    expect(meRes.status).toBe(200);
    expect(readSessionExpiry(env, tokenHash)).toBe(farExpiry);
  });

  it("does not renew when the renewal window is disabled", async () => {
    const env = createMockEnv();
    env.SESSION_RENEW_WINDOW_HOURS = "0";
    const md5Password = "5f4dcc3b5aa765d61d8327deb882cf99";
    const hash = await hashPassword(
      md5Password,
      "staticuser",
      env.PASSWORD_PEPPER,
      parsePbkdf2Iterations(env)
    );
    await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").bind("staticuser", hash).run();

    const token = "static-token";
    const tokenHash = await sha256(`${token}:${env.PASSWORD_PEPPER}`);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const shortExpiry = nowSeconds + 60;
    await seedSession(env, 1, tokenHash, shortExpiry);

    const meRes = await app.request("/web/me", { method: "GET", headers: { cookie: `ks_session=${token}` } }, env);
    expect(meRes.status).toBe(200);
    expect(readSessionExpiry(env, tokenHash)).toBe(shortExpiry);
    expect(meRes.headers.get("set-cookie")).toBeNull();
  });

  it("renews only the session that was presented", async () => {
    const env = createMockEnv();
    const md5Password = "5f4dcc3b5aa765d61d8327deb882cf99";
    const hash = await hashPassword(
      md5Password,
      "multiuser",
      env.PASSWORD_PEPPER,
      parsePbkdf2Iterations(env)
    );
    await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").bind("multiuser", hash).run();

    const nowSeconds = Math.floor(Date.now() / 1000);
    const activeToken = "active-token";
    const otherToken = "other-token";
    const activeHash = await sha256(`${activeToken}:${env.PASSWORD_PEPPER}`);
    const otherHash = await sha256(`${otherToken}:${env.PASSWORD_PEPPER}`);
    const shortExpiry = nowSeconds + 60;
    const otherExpiry = nowSeconds + 30 * 24 * 3600;
    await seedSession(env, 1, activeHash, shortExpiry);
    await seedSession(env, 1, otherHash, otherExpiry);

    const meRes = await app.request("/web/me", { method: "GET", headers: { cookie: `ks_session=${activeToken}` } }, env);
    expect(meRes.status).toBe(200);
    expect(readSessionExpiry(env, activeHash)).toBeGreaterThan(shortExpiry);
    expect(readSessionExpiry(env, otherHash)).toBe(otherExpiry);
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

    const filteredRes = await app.request("/web/statistics/books?search=a2&status=reading&sort=read_time", { headers: { cookie } }, env);
    expect(filteredRes.status).toBe(200);
    const filteredData = await filteredRes.json();
    expect(filteredData.total).toBe(1);
    expect(filteredData.items).toHaveLength(1);

    const emptyRes = await app.request("/web/statistics/books?search=nonexistent", { headers: { cookie } }, env);
    expect(emptyRes.status).toBe(200);
    const emptyData = await emptyRes.json();
    expect(emptyData.total).toBe(0);
    expect(emptyData.items).toHaveLength(0);

    // P3: GET /web/statistics/book/:md5 tests
    const unauthBookRes = await app.request("/web/statistics/book/abc", {}, env);
    expect(unauthBookRes.status).toBe(401);

    const notFoundBookRes = await app.request("/web/statistics/book/nonexistent", { headers: { cookie } }, env);
    expect(notFoundBookRes.status).toBe(404);
    expect(await notFoundBookRes.json()).toEqual({ error: "Book not found" });

    const bookDetailRes = await app.request("/web/statistics/book/abc", { headers: { cookie } }, env);
    expect(bookDetailRes.status).toBe(200);
    const bookDetailData = await bookDetailRes.json();
    expect(bookDetailData.ok).toBe(true);
    expect(bookDetailData.book.md5).toBe("abc");
    expect(bookDetailData.book.title).toBe("A2");
    expect(bookDetailData.book.total_read_time).toBe(20);
    expect(bookDetailData.book.total_read_pages).toBe(9);
    expect(bookDetailData.book.daily_history).toHaveLength(1);
    expect(bookDetailData.book.recent_sessions).toHaveLength(1);
    expect(bookDetailData.book.reading_speed.seconds_per_page).toBe(2.2);
  });

  it("accepts a multi-megabyte statistics snapshot and reads it back", async () => {
    const env = createMockEnv();
    const md5Password = "5f4dcc3b5aa765d61d8327deb882cf99";
    const hash = await hashPassword(
      md5Password,
      "bigstats",
      env.PASSWORD_PEPPER,
      parsePbkdf2Iterations(env)
    );
    await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .bind("bigstats", hash)
      .run();

    const now = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const pageStatData = Array.from({ length: 42000 }, (_, index) => ({
      page: (index % 500) + 1,
      start_time: now + index * 60,
      duration: 45,
      total_pages: 500,
    }));
    const snapshot = {
      books: [
        {
          md5: "d".repeat(32),
          title: "A very large library entry " + "书".repeat(200000),
          authors: "Big Author",
          notes: 0,
          last_open: now + pageStatData.length * 60,
          highlights: 0,
          pages: 500,
          series: "",
          language: "en",
          total_read_time: pageStatData.length * 45,
          total_read_pages: pageStatData.length,
          page_stat_data: pageStatData,
        },
      ],
    };
    const body = JSON.stringify({
      schema_version: 20221111,
      device: "Kindle",
      device_id: "big-1",
      snapshot,
    });
    expect(new TextEncoder().encode(body).length).toBeGreaterThan(2 * 1024 * 1024);

    const statsHeaders = {
      "x-auth-user": "bigstats",
      "x-auth-key": md5Password,
      "content-type": "application/json",
      "x-client-version": "y-anna-1.0",
      "User-Agent": "Mozilla/DONTLIKE/ANYTHING",
    };
    const putRes = await app.request(
      "/syncs/statistics",
      { method: "PUT", headers: statsHeaders, body },
      env
    );
    expect(putRes.status).toBe(200);
    const putData = await putRes.json();
    expect(putData.snapshot.books).toHaveLength(1);
    expect(putData.snapshot.books[0].page_stat_data).toHaveLength(42000);

    const webLogin = await app.request(
      "/web/auth/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "bigstats", password: "password" }),
      },
      env
    );
    const cookie = getCookieHeaderFromResponse(webLogin, "ks_session");

    const exportRes = await app.request("/web/export/data", { headers: { cookie } }, env);
    expect(exportRes.status).toBe(200);
    const exportData = await exportRes.json();
    expect(exportData.statistics.snapshot.books).toHaveLength(1);
    expect(exportData.statistics.snapshot.books[0].page_stat_data).toHaveLength(42000);
    expect(exportData.statistics.snapshot.books[0].title).toBe(snapshot.books[0].title);

    const statsRes = await app.request("/web/stats", { headers: { cookie } }, env);
    expect(statsRes.status).toBe(200);
    await expect(statsRes.json()).resolves.toMatchObject({
      readingStatistics: { totalBooks: 1 },
    });
  });

  it("rejects an oversized statistics payload before parsing it", async () => {
    const env = createMockEnv();
    const md5Password = "5f4dcc3b5aa765d61d8327deb882cf99";
    const hash = await hashPassword(
      md5Password,
      "toolarge",
      env.PASSWORD_PEPPER,
      parsePbkdf2Iterations(env)
    );
    await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .bind("toolarge", hash)
      .run();

    const res = await app.request(
      "/syncs/statistics",
      {
        method: "PUT",
        headers: {
          "x-auth-user": "toolarge",
          "x-auth-key": md5Password,
          "content-type": "application/json",
          "x-client-version": "y-anna-1.0",
          "User-Agent": "Mozilla/DONTLIKE/ANYTHING",
          "content-length": String(MAX_SNAPSHOT_BYTES + 1),
        },
        body: "{}",
      },
      env
    );
    expect(res.status).toBe(413);
    await expect(res.json()).resolves.toEqual({ message: "Statistics snapshot too large" });
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
    expect(calData.activeDays).toBe(1);
    expect(typeof calData.currentStreak).toBe("number");
    expect(calData.longestStreak).toBe(1);
    expect(calData.hourlyDistribution).toHaveLength(24);
    expect(calData.hourlyDistribution[10]).toBe(2);
    expect(calData.hourlyDistribution[11]).toBe(3);

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

  it("keeps future-dated device timestamps out of the calendar aggregates", async () => {
    const env = createMockEnv();
    const md5Password = "5f4dcc3b5aa765d61d8327deb882cf99";
    const register = await app.request(
      "/users/create",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "skewuser", password: "password" }),
      },
      env
    );
    expect(register.status).toBe(201);

    const nowSeconds = Math.floor(Date.now() / 1000);
    const past = nowSeconds - 3600;
    const future = nowSeconds + 30 * 24 * 60 * 60; // clock jumped a month ahead

    const putRes = await app.request(
      "/syncs/statistics",
      {
        method: "PUT",
        headers: {
          "x-auth-user": "skewuser",
          "x-auth-key": md5Password,
          "content-type": "application/json",
          "x-client-version": "y-anna-1.0",
          "User-Agent": "Mozilla/DONTLIKE/ANYTHING",
        },
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
                notes: 0,
                last_open: past,
                highlights: 0,
                pages: 100,
                series: "",
                language: "en",
                total_read_time: 10,
                total_read_pages: 5,
                page_stat_data: [
                  { page: 1, start_time: past, duration: 120, total_pages: 100 },
                  { page: 2, start_time: future, duration: 600, total_pages: 100 },
                ],
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
        body: JSON.stringify({ username: "skewuser", password: "password" }),
      },
      env
    );
    const cookie = getCookieHeaderFromResponse(loginRes, "ks_session");

    const calRes = await app.request("/web/stats/calendar", { headers: { cookie } }, env);
    expect(calRes.status).toBe(200);
    const calData = await calRes.json();
    // Only the past session is counted; the future one is dropped.
    expect(calData.days).toHaveLength(1);
    expect(calData.days[0].minutes).toBe(2);
    expect(calData.activeDays).toBe(1);
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
    expect(JSON.parse(stored?.statistics_summary_json ?? "{}").version).toBe(STATISTICS_SUMMARY_VERSION);
  });

  it("rebuilds a stale cached summary that predates the current version", async () => {
    const env = createMockEnv();
    const md5Password = "5f4dcc3b5aa765d61d8327deb882cf99";
    const register = await app.request(
      "/users/create",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "staleuser", password: "password" }),
      },
      env
    );
    expect(register.status).toBe(201);

    const loginRes = await app.request(
      "/web/auth/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "staleuser", password: "password" }),
      },
      env
    );
    const cookie = getCookieHeaderFromResponse(loginRes, "ks_session");
    const me = await (await app.request("/web/me", { headers: { cookie } }, env)).json();

    const base = new Date(2024, 0, 5, 10, 30, 0);
    const t1 = Math.floor(base.getTime() / 1000);
    const snapshot = {
      books: [
        {
          md5: "stale",
          title: "Stale Book",
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
    // Seed a summary written by an older build: correct shape, obsolete version, empty body.
    await upsertStatisticsSnapshot(
      env.DB,
      me.id,
      20221111,
      "Kindle",
      "k-1",
      JSON.stringify(snapshot),
      JSON.stringify({ version: 1, daily: {}, books: {} })
    );

    const calRes = await app.request("/web/stats/calendar", { headers: { cookie } }, env);
    expect(calRes.status).toBe(200);
    // The stale empty summary must be rejected and rebuilt from the raw snapshot.
    await expect(calRes.json()).resolves.toMatchObject({
      years: [2024],
      days: [{ date: "2024-01-05", minutes: 2 }],
    });

    const stored = await getStatisticsSnapshot(env.DB, me.id);
    expect(JSON.parse(stored?.statistics_summary_json ?? "{}").version).toBe(STATISTICS_SUMMARY_VERSION);
  });

  describe("user data export/import", () => {
    it("serves self-hosted sql.js assets (real bytes, no CDN needed)", async () => {
      const env = createMockEnv();
      const jsRes = await app.request("/assets/sql-wasm.js", { method: "GET" }, env);
      expect(jsRes.status).toBe(200);
      expect(jsRes.headers.get("content-type")).toContain("javascript");
      const jsText = await jsRes.text();
      expect(jsText).toContain("var initSqlJs = function");

      const wasmRes = await app.request("/assets/sql-wasm.wasm", { method: "GET" }, env);
      expect(wasmRes.status).toBe(200);
      expect(wasmRes.headers.get("content-type")).toContain("wasm");
      const bytes = new Uint8Array(await wasmRes.arrayBuffer());
      // Real wasm magic: \0asm
      expect(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])).toBe("\0asm");
      expect(bytes.byteLength).toBeGreaterThan(100000);
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
      // "abc" already exists from the seeded account, so only "newbook" counts.
      expect(body).toMatchObject({ status: "ok", statisticsBooks: 1 });

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

    it("rejects statistics import with zero books", async () => {
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
              snapshot: { books: [] },
            },
          }),
        },
        env
      );
      expect(res.status).toBe(400);
    });

    it("reports only newly added books when merging statistics", async () => {
      const env = createMockEnv();
      const cookie = await loginAndSeed(env);

      // Existing book "abc" already in the account; importing it again plus
      // one new book should report statisticsBooks = 1 (the new md5 only).
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
                    md5: "brand-new",
                    title: "Brand New",
                    authors: "Z",
                    notes: 0,
                    last_open: 300,
                    highlights: 0,
                    pages: 60,
                    series: "",
                    language: "en",
                    total_read_time: 4,
                    total_read_pages: 2,
                    page_stat_data: [{ page: 1, start_time: 9, duration: 12, total_pages: 60 }],
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
      expect(body).toMatchObject({ status: "ok", statisticsBooks: 1 });
    });
  });
});
