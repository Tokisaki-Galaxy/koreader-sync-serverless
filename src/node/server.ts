import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { serve } from "@hono/node-server";
import { createApp } from "../app";
import { createSqliteDatabaseAdapter } from "./sqlite";
import { runMigrations } from "../migrations";
import { MIGRATIONS } from "../migrations-bundle";
import type { Env } from "../types";
import { setFallbackDatabaseAdapter } from "../context";

function parseNodeEnv(): Env {
  const pepper = process.env.PASSWORD_PEPPER ?? "";
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  if (!pepper || !adminToken) {
    throw new Error("PASSWORD_PEPPER and ADMIN_TOKEN are required in local production mode");
  }
  return {
    PASSWORD_PEPPER: pepper,
    ADMIN_TOKEN: adminToken,
    RUNTIME_TARGET: "node",
    DB_DRIVER: process.env.DB_DRIVER ?? "sqlite",
    SQLITE_PATH: process.env.SQLITE_PATH ?? "./data/koreader-sync.db",
    DEBUG: process.env.DEBUG,
    SESSION_TTL_HOURS: process.env.SESSION_TTL_HOURS,
    SESSION_RENEW_WINDOW_HOURS: process.env.SESSION_RENEW_WINDOW_HOURS,
    PBKDF2_ITERATIONS: process.env.PBKDF2_ITERATIONS,
    ENABLE_USER_REGISTRATION: process.env.ENABLE_USER_REGISTRATION,
    MCP_TOKEN_TTL_HOURS: process.env.MCP_TOKEN_TTL_HOURS,
    MCP_TOKEN_RENEW_WINDOW_HOURS: process.env.MCP_TOKEN_RENEW_WINDOW_HOURS,
    MCP_ALLOWED_ORIGINS: process.env.MCP_ALLOWED_ORIGINS,
  };
}

async function ensureDatabaseInitialized(sqlitePath: string) {
  mkdirSync(dirname(sqlitePath), { recursive: true });
  const db = createSqliteDatabaseAdapter(sqlitePath);
  await runMigrations(db, MIGRATIONS);
  return db;
}

const app = createApp();
const port = Number(process.env.PORT ?? "8787");
const env = parseNodeEnv();
const sqlitePath = env.SQLITE_PATH ?? "./data/koreader-sync.db";
const db = await ensureDatabaseInitialized(sqlitePath);
setFallbackDatabaseAdapter(db);

serve({
  fetch: (request) => app.fetch(request, env),
  port,
});
