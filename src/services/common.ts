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

export function parsePbkdf2Iterations(env: Env): number {
  const value = Number(env.PBKDF2_ITERATIONS ?? DEFAULT_PBKDF2_ITERATIONS);
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < DEFAULT_PBKDF2_ITERATIONS) {
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

export function withSecurityHeaders(headers: Headers): Headers {
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("referrer-policy", "no-referrer");
  headers.set(
    "content-security-policy",
    "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors 'none';"
  );
  return headers;
}
