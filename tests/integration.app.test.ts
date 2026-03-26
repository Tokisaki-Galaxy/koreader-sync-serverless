import { describe, expect, it } from "vitest";
import app from "../src/index";
import { hashPassword, sha256 } from "../src/crypto";
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
    const hash = await hashPassword(md5Password, "reader2", env.PASSWORD_PEPPER, 1000);
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
    const hash = await hashPassword(md5Password, "webuser", env.PASSWORD_PEPPER, 1000);
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
    const hash = await hashPassword(md5Password, "stats", env.PASSWORD_PEPPER, 1000);
    await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").bind("stats", hash).run();

    const baseHeaders = {
      "x-auth-user": "stats",
      "x-auth-key": md5Password,
      "content-type": "application/json",
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
});
