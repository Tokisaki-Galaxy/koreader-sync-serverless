import { getCookie } from "hono/cookie";
import { findUserByUsername, findWebUserBySessionTokenHash } from "../db";
import { sha256, verifyPassword } from "../crypto";
import { parsePbkdf2Iterations } from "./common";
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

  const tokenHash = await sha256(`${token}:${c.env.PASSWORD_PEPPER}`);
  const row = await findWebUserBySessionTokenHash(resolveDb(c), tokenHash);

  if (!row) return null;
  return { userId: row.id, username: row.username };
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
