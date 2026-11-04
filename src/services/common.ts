import { DEFAULT_PBKDF2_ITERATIONS } from "../crypto";
import type { Env } from "../types";

export function badRequest(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}

export function parseSessionTtlHours(env: Env): number {
  const value = Number(env.SESSION_TTL_HOURS ?? "168");
  return Number.isFinite(value) && value > 0 ? value : 168;
}

// Sliding-session renewal window in hours. When an authenticated request arrives and the
// session has at most this much lifetime left, the session is extended back to a full TTL.
// Defaults to half the TTL, so an active session is renewed well before it lapses while the
// number of expiry writes stays low (roughly one write per half-TTL of activity). Set 0 to
// disable renewal entirely, or the full TTL to renew on every authenticated request.
export function parseSessionRenewWindowHours(env: Env): number {
  const raw = env.SESSION_RENEW_WINDOW_HOURS?.trim();
  if (raw === undefined || raw === "") return parseSessionTtlHours(env) / 2;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : parseSessionTtlHours(env) / 2;
}

// Bearer tokens for MCP clients live in the same sessions table as web sessions but
// get their own lifetime, since a chat client should keep working for months.
// Default is 90 days.
export function parseMcpTokenTtlHours(env: Env): number {
  const value = Number(env.MCP_TOKEN_TTL_HOURS ?? "2160");
  return Number.isFinite(value) && value > 0 ? value : 2160;
}

// Bearer tokens slide forward while a client keeps using them, so an active
// integration never hits a surprise 401. Renewal only writes when the token is
// inside this window, which keeps it to roughly one write per half TTL.
// Defaults to half the token TTL; set 0 to make tokens die at their fixed expiry.
export function parseMcpTokenRenewWindowHours(env: Env): number {
  const raw = env.MCP_TOKEN_RENEW_WINDOW_HOURS?.trim();
  if (raw === undefined || raw === "") return parseMcpTokenTtlHours(env) / 2;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : parseMcpTokenTtlHours(env) / 2;
}

export function parsePbkdf2Iterations(env: Env): number {
  const value = Number(env.PBKDF2_ITERATIONS ?? DEFAULT_PBKDF2_ITERATIONS);
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return DEFAULT_PBKDF2_ITERATIONS;
  }
  return value;
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_.-]{3,64}$/.test(username);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function withSecurityHeaders(headers: Headers, nonce?: string): Headers {
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("referrer-policy", "no-referrer");
  const scriptSrc = nonce
    ? `'self' 'nonce-${nonce}' 'wasm-unsafe-eval'`
    : `'self' 'wasm-unsafe-eval'`;
  const styleSrc = `'self' 'unsafe-inline'`;
  const styleElemSrc = nonce ? `'self' 'nonce-${nonce}'` : `'self'`;
  headers.set(
    "content-security-policy",
    `default-src 'self'; style-src ${styleSrc}; style-src-elem ${styleElemSrc}; style-src-attr 'unsafe-inline'; script-src ${scriptSrc}; script-src-attr 'none'; object-src 'none'; frame-ancestors 'none';`
  );
  return headers;
}
