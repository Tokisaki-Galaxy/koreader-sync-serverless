import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { timingSafeEqual } from "../src/services/auth";
import { hashPassword } from "../src/crypto";
import { createMockEnv } from "./helpers/mock-db";
import koreaderRoutes from "../src/routes/koreader";

describe("auth helpers", () => {
  it("timingSafeEqual compares exact string values", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "ab")).toBe(false);
  });

  it("authenticates koreader route using x-auth-key md5 payload", async () => {
    const env = createMockEnv();
    const md5Password = "5f4dcc3b5aa765d61d8327deb882cf99";
    const hashed = await hashPassword(md5Password, "alice", env.PASSWORD_PEPPER, 1000);
    await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").bind("alice", hashed).run();

    const app = new Hono<{ Bindings: typeof env }>();
    app.route("/", koreaderRoutes);

    const unauthorized = await app.request("/users/auth", { method: "GET" }, env);
    expect(unauthorized.status).toBe(401);

    const authorized = await app.request(
      "/users/auth",
      {
        method: "GET",
        headers: {
          "x-auth-user": "alice",
          "x-auth-key": md5Password,
        },
      },
      env
    );
    expect(authorized.status).toBe(200);
    await expect(authorized.json()).resolves.toEqual({ authorized: "OK" });
  });
});
