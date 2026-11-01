import { getCookie, setCookie } from "hono/cookie";
import { findUserByUsername, findWebUserBySessionTokenHash, renewSession } from "../db";
import { sha256, verifyPassword } from "../crypto";
import { parsePbkdf2Iterations, parseSessionRenewWindowHours, parseSessionTtlHours } from "./common";
import type { AppContext } from "../context";
import type { DatabaseAdapter } from "../database/adapter";
import { resolveDatabaseAdapter } from "../context";

type AppContextWithDb = AppContext & {
  get<K extends "db">(key: K): DatabaseAdapter;
};

function resolveDb(c: AppContextWithDb): DatabaseAdapter {
  return resolveDatabaseAdapter(c);
}

export const USER_SESSION_COOKIE = "ks_session";
export const ADMIN_SESSION_COOKIE = "ks_admin_session";
const TIMING_COMPARE_STEPS = 256;

export function isValidField(field: unknown): field is string {
  return typeof field === "string" && field.length > 0;
}

export function isValidKeyField(field: unknown): field is string {
  return isValidField(field) && !field.includes(":");
}

export function timingSafeEqual(a: string, b: string): boolean {
  let diff = 0;
  for (let i = 0; i < TIMING_COMPARE_STEPS; i++) {
    const ac = i < a.length ? a.charCodeAt(i) : 0;
    const bc = i < b.length ? b.charCodeAt(i) : 0;
    diff |= ac ^ bc;
  }
  diff |= a.length ^ b.length;
  return diff === 0;
}

export async function authKoreader(c: AppContextWithDb): Promise<{ userId: number; username: string } | null> {
  const username = c.req.header("x-auth-user");
  const password = c.req.header("x-auth-key");
  if (!isValidKeyField(username) || !isValidField(password)) return null;

  const user = await findUserByUsername(resolveDb(c), username);
  if (!user) return null;

  const iterations = parsePbkdf2Iterations(c.env);
  const ok = await verifyPassword(password, user.username, c.env.PASSWORD_PEPPER, user.password_hash, iterations);
  if (!ok) return null;
  return { userId: user.id, username: user.username };
}

export async function authWebUser(c: AppContextWithDb): Promise<{ userId: number; username: string } | null> {
  const token = getCookie(c, USER_SESSION_COOKIE);
  if (!token) return null;

  const db = resolveDb(c);
  const tokenHash = await sha256(`${token}:${c.env.PASSWORD_PEPPER}`);
  const row = await findWebUserBySessionTokenHash(db, tokenHash);

  if (!row) return null;
  await maybeRenewSession(c, db, token, tokenHash, row.expires_at);
  return { userId: row.id, username: row.username };
}

// Shared sliding-expiry core for web sessions and MCP bearer tokens. Extends the
// stored expiry back to a full TTL once the row enters the renewal window and
// returns the new expiry, or null when no write was needed. Callers decide how
// long a TTL to apply and whether a cookie must be refreshed alongside it.
export async function slideSessionExpiry(
  db: DatabaseAdapter,
  tokenHash: string,
  currentExpiresAt: number,
  ttlHours: number,
  windowHours: number
): Promise<number | null> {
  if (windowHours <= 0) return null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (currentExpiresAt > nowSeconds + windowHours * 3600) return null;

  const nextExpiresAt = nowSeconds + ttlHours * 3600;
  if (nextExpiresAt <= currentExpiresAt) return null;

  await renewSession(db, tokenHash, nextExpiresAt);
  return nextExpiresAt;
}

// Sliding session: extend the stored expiry and refresh the cookie when the session is close
// to lapsing. Only writes when a renewal is actually due, so the common case stays read-only.
async function maybeRenewSession(
  c: AppContextWithDb,
  db: DatabaseAdapter,
  token: string,
  tokenHash: string,
  currentExpiresAt: number
): Promise<void> {
  const ttlHours = parseSessionTtlHours(c.env);
  const windowHours = parseSessionRenewWindowHours(c.env);
  const nextExpiresAt = await slideSessionExpiry(db, tokenHash, currentExpiresAt, ttlHours, windowHours);
  if (nextExpiresAt === null) return;

  setCookie(c, USER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: ttlHours * 3600,
  });
}

export async function authAdmin(c: AppContext): Promise<{ mode: "token" } | null> {
  const adminToken = getCookie(c, ADMIN_SESSION_COOKIE);
  const expectedToken = c.env.ADMIN_TOKEN ?? "";
  if (!adminToken || !expectedToken) return null;
  const expectedTokenHash = await sha256(`${expectedToken}:${c.env.PASSWORD_PEPPER}`);
  const ok = timingSafeEqual(adminToken, expectedTokenHash);
  if (!ok) return null;
  return { mode: "token" };
}
