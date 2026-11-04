import { describe, expect, it } from "vitest";
import { Script } from "node:vm";
import app from "../src/index";
import { renderUserPage } from "../src/ui/userPage";
import { createMockEnv } from "./helpers/mock-db";

describe("user page render", () => {
  for (const locale of ["en", "zh", "ja"] as const) {
    it(`renders a parseable client script for ${locale}`, () => {
      const html = renderUserPage(locale, "test-nonce");
      expect(html).toContain('<style nonce="test-nonce">');
      expect(html).toContain('<script nonce="test-nonce">');
      const matches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
      expect(matches.length).toBeGreaterThan(0);
      const script = matches[matches.length - 1][1];
      expect(script).not.toContain("${");
      expect(() => new Script(script)).not.toThrow();
    });
  }

  it("sets a nonce-based CSP on the user page", async () => {
    const env = createMockEnv();
    const res = await app.request("/", undefined, env);
    expect(res.status).toBe(200);
    const csp = res.headers.get("content-security-policy") || "";
    expect(csp).toContain("script-src 'self' 'nonce-");
    expect(csp).toContain("style-src-elem 'self' 'nonce-");
    expect(csp).toContain("style-src-attr 'unsafe-inline'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    const html = await res.text();
    expect(html).toMatch(/<script nonce="[0-9a-f]+">/);
  });
});
