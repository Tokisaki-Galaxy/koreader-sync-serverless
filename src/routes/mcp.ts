import { Hono } from "hono";
import type { Context } from "hono";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { createMcpServer } from "../mcp/server";
import { authenticateMcpRequest } from "../mcp/auth";
import { createSession, deleteSessionByTokenHash, findUserByUsername } from "../db";
import { generateSessionToken, sha256, verifyPassword } from "../crypto";
import { md5 } from "js-md5";
import { isValidField, isValidKeyField } from "../services/auth";
import { parseMcpTokenTtlHours, parsePbkdf2Iterations } from "../services/common";
import type { AppEnv } from "../context";
import type { UserLoginRequest } from "../types";

const router = new Hono<AppEnv>();

const UNAUTHORIZED_JSON_RPC = JSON.stringify({
  jsonrpc: "2.0",
  error: { code: -32001, message: "Unauthorized" },
  id: null,
});

function parseAllowedOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildCorsHeaders(origin: string | undefined): Headers {
  const headers = new Headers();
  headers.set("access-control-allow-methods", "POST, GET, DELETE, OPTIONS");
  headers.set(
    "access-control-allow-headers",
    "Content-Type, Authorization, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID"
  );
  headers.set("access-control-expose-headers", "MCP-Session-Id, MCP-Protocol-Version");
  headers.set("access-control-max-age", "86400");
  headers.set("vary", "Origin");
  if (origin) {
    headers.set("access-control-allow-origin", origin);
  }
  return headers;
}

function withCors(response: Response, cors: Headers): Response {
  for (const [name, value] of cors) {
    response.headers.set(name, value);
  }
  return response;
}

// Best-effort fixed-window limiter for token minting. It is per isolate, so it
// blunts brute force without pretending to be a distributed rate limiter.
const TOKEN_RATE_LIMIT = 10;
const TOKEN_RATE_WINDOW_MS = 60_000;
const tokenAttempts = new Map<string, { count: number; resetAt: number }>();

function clientAddress(c: Context<AppEnv>): string {
  const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  return c.req.header("cf-connecting-ip") ?? (forwarded || "unknown");
}

function consumeTokenAttempt(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  if (tokenAttempts.size > 500) {
    for (const [entryKey, entry] of tokenAttempts) {
      if (entry.resetAt <= now) tokenAttempts.delete(entryKey);
    }
  }

  const existing = tokenAttempts.get(key);
  if (!existing || existing.resetAt <= now) {
    tokenAttempts.set(key, { count: 1, resetAt: now + TOKEN_RATE_WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }
  if (existing.count >= TOKEN_RATE_LIMIT) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  existing.count += 1;
  return { ok: true, retryAfter: 0 };
}

function resetTokenAttempts(key: string): void {
  tokenAttempts.delete(key);
}

// Mints a long-lived bearer token from the account password. The token is stored
// hashed in the existing sessions table, so it can be revoked without touching the
// password and never exposes the credential to the client configuration afterwards.
router.post("/mcp/token", async (c) => {
  let body: UserLoginRequest;
  try {
    body = await c.req.json<UserLoginRequest>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";
  const rateKey = `${clientAddress(c)}|${username.toLowerCase()}`;
  const limit = consumeTokenAttempt(rateKey);
  if (!limit.ok) {
    return c.json({ error: "Too many attempts", retry_after: limit.retryAfter }, 429, {
      "retry-after": String(limit.retryAfter),
    });
  }

  if (!isValidKeyField(username) || !isValidField(password)) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const user = await findUserByUsername(c.get("db"), username);
  if (!user) return c.json({ error: "Invalid credentials" }, 401);

  const ok = await verifyPassword(
    md5(password),
    user.username,
    c.env.PASSWORD_PEPPER,
    user.password_hash,
    parsePbkdf2Iterations(c.env)
  );
  if (!ok) return c.json({ error: "Invalid credentials" }, 401);

  const ttlSeconds = Math.floor(parseMcpTokenTtlHours(c.env) * 3600);
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const token = generateSessionToken();
  await createSession(c.get("db"), user.id, await sha256(`${token}:${c.env.PASSWORD_PEPPER}`), expiresAt);

  resetTokenAttempts(rateKey);

  return c.json(
    {
      access_token: token,
      token_type: "Bearer",
      expires_in: ttlSeconds,
      expires_at: expiresAt,
      username: user.username,
    },
    201
  );
});

// Revokes the bearer token used to authenticate the call.
router.delete("/mcp/token", async (c) => {
  const header = c.req.header("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return c.json({ error: "Missing bearer token" }, 401);

  const tokenHash = await sha256(`${match[1].trim()}:${c.env.PASSWORD_PEPPER}`);
  await deleteSessionByTokenHash(c.get("db"), tokenHash);
  return c.json({ status: "ok" });
});

router.all("/mcp", async (c) => {
  const origin = c.req.header("origin");
  const requestOrigin = new URL(c.req.url).origin;
  const allowedOrigins = parseAllowedOrigins(c.env.MCP_ALLOWED_ORIGINS);

  // Spec 2026-07-28 still rejects unexpected Origin values with 403 to block DNS rebinding.
  if (origin && origin !== requestOrigin && !allowedOrigins.includes(origin)) {
    return c.json({ error: "Forbidden origin" }, 403);
  }

  const cors = buildCorsHeaders(origin);

  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const identity = await authenticateMcpRequest(c);
  if (!identity) {
    cors.set("www-authenticate", 'Bearer realm="koreader-sync"');
    cors.set("content-type", "application/json");
    return new Response(UNAUTHORIZED_JSON_RPC, { status: 401, headers: cors });
  }

  // No server-initiated messages, so the optional SSE stream is not offered.
  if (c.req.method === "GET") {
    cors.set("allow", "POST, DELETE, OPTIONS");
    return new Response(null, { status: 405, headers: cors });
  }

  if (c.req.method !== "POST" && c.req.method !== "DELETE") {
    cors.set("allow", "POST, GET, DELETE, OPTIONS");
    return new Response(null, { status: 405, headers: cors });
  }

  const db = c.get("db");
  const handler = createMcpHandler(() => createMcpServer({ db, user: identity }), {
    legacy: "stateless",
    maxRequestBodySize: 1024 * 1024,
  });

  // The handler's factory runs per request, so the authenticated identity is
  // captured here without threading it through MCP request metadata.
  const response = await handler.fetch(c.req.raw);
  return withCors(response, cors);
});

export default router;
