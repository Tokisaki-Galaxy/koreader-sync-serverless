import { md5 } from "js-md5";
import { findUserByUsername, findWebUserBySessionTokenHash } from "../db";
import { sha256, verifyPassword } from "../crypto";
import { isValidField, isValidKeyField } from "../services/auth";
import { parsePbkdf2Iterations } from "../services/common";
import type { AppContext } from "../context";

export type McpAuthMethod = "bearer" | "basic" | "koreader";

export interface McpIdentity {
  userId: number;
  username: string;
  method: McpAuthMethod;
}

function decodeBase64(value: string): string | null {
  try {
    return atob(value);
  } catch {
    return null;
  }
}

async function verifyCredentials(
  c: AppContext,
  username: string,
  password: string,
  method: McpAuthMethod
): Promise<McpIdentity | null> {
  const user = await findUserByUsername(c.get("db"), username);
  if (!user) return null;

  const ok = await verifyPassword(
    md5(password),
    user.username,
    c.env.PASSWORD_PEPPER,
    user.password_hash,
    parsePbkdf2Iterations(c.env)
  );
  return ok ? { userId: user.id, username: user.username, method } : null;
}

/**
 * Resolves the MCP caller from request headers. Accepted forms, in order:
 *
 * - `x-auth-user` + `x-auth-key` (KOReader native, password already md5-hashed)
 * - `Authorization: Bearer <token>` minted by `POST /mcp/token`
 * - `Authorization: Basic base64(username:password)` with the account password
 *
 * Cookie sessions are intentionally not accepted: MCP clients are not browsers and
 * sending credentials explicitly keeps CSRF out of the picture.
 */
export async function authenticateMcpRequest(c: AppContext): Promise<McpIdentity | null> {
  const usernameHeader = c.req.header("x-auth-user");
  const keyHeader = c.req.header("x-auth-key");
  if (isValidKeyField(usernameHeader) && isValidField(keyHeader)) {
    const user = await findUserByUsername(c.get("db"), usernameHeader);
    if (!user) return null;
    const ok = await verifyPassword(
      keyHeader,
      user.username,
      c.env.PASSWORD_PEPPER,
      user.password_hash,
      parsePbkdf2Iterations(c.env)
    );
    return ok ? { userId: user.id, username: user.username, method: "koreader" } : null;
  }

  const header = c.req.header("authorization")?.trim();
  if (!header) return null;

  const separator = header.indexOf(" ");
  const scheme = (separator === -1 ? header : header.slice(0, separator)).toLowerCase();
  const credentials = separator === -1 ? "" : header.slice(separator + 1).trim();
  if (!credentials) return null;

  if (scheme === "bearer") {
    const tokenHash = await sha256(`${credentials}:${c.env.PASSWORD_PEPPER}`);
    const row = await findWebUserBySessionTokenHash(c.get("db"), tokenHash);
    if (!row) return null;
    return { userId: row.id, username: row.username, method: "bearer" };
  }

  if (scheme === "basic") {
    const decoded = decodeBase64(credentials);
    if (!decoded) return null;
    const splitAt = decoded.indexOf(":");
    if (splitAt <= 0) return null;
    const username = decoded.slice(0, splitAt);
    const password = decoded.slice(splitAt + 1);
    if (!isValidKeyField(username) || !isValidField(password)) return null;
    return verifyCredentials(c, username, password, "basic");
  }

  return null;
}
