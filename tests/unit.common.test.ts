import { describe, expect, it } from "vitest";
import {
  badRequest,
  isValidPassword,
  isValidUsername,
  parsePbkdf2Iterations,
  parseSessionTtlHours,
  withSecurityHeaders,
} from "../src/services/common";
import type { Env } from "../src/types";

describe("common service helpers", () => {
  it("returns a normalized badRequest response", async () => {
    const res = badRequest("Invalid JSON");
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid JSON" });
  });

  it("parses session ttl with fallback", () => {
    const env = { SESSION_TTL_HOURS: "24" } as Env;
    expect(parseSessionTtlHours(env)).toBe(24);
    expect(parseSessionTtlHours({ SESSION_TTL_HOURS: "0" } as Env)).toBe(168);
    expect(parseSessionTtlHours({ SESSION_TTL_HOURS: "nope" } as Env)).toBe(168);
  });

  it("parses pbkdf2 iterations with fallback", () => {
    const env = { PBKDF2_ITERATIONS: "30000" } as Env;
    expect(parsePbkdf2Iterations(env)).toBe(30000);
    expect(parsePbkdf2Iterations({ PBKDF2_ITERATIONS: "-1" } as Env)).toBe(-1);
    expect(parsePbkdf2Iterations({ PBKDF2_ITERATIONS: "abc" } as Env)).toBe(20000);
  });

  it("validates username and password constraints", () => {
    expect(isValidUsername("user_01")).toBe(true);
    expect(isValidUsername("a")).toBe(false);
    expect(isValidUsername("x:y")).toBe(false);
    expect(isValidPassword("12345678")).toBe(true);
    expect(isValidPassword("1234567")).toBe(false);
  });

  it("adds security headers", () => {
    const headers = new Headers();
    withSecurityHeaders(headers);
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("x-frame-options")).toBe("DENY");
    expect(headers.get("referrer-policy")).toBe("no-referrer");
    expect(headers.get("content-security-policy")).toContain("default-src 'self'");
  });
});
