import { mkdirSync, readFileSync } from "node:fs";
import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { createDatabaseAdapter } from "./db";
import type { Env } from "./types";
import { setFallbackDatabaseAdapter } from "./context";

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
    PBKDF2_ITERATIONS: process.env.PBKDF2_ITERATIONS,
    ENABLE_USER_REGISTRATION: process.env.ENABLE_USER_REGISTRATION,
  };
}

function splitSqlStatements(sql: string): string[] {
  const parts = sql
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts;
}

function ensureDatabaseInitialized(sqlitePath: string) {
  mkdirSync(new URL(".", `file://${sqlitePath}`).pathname, { recursive: true });
  const db = createDatabaseAdapter({
    PASSWORD_PEPPER: "bootstrap",
    ADMIN_TOKEN: "bootstrap",
    RUNTIME_TARGET: "node",
    DB_DRIVER: "sqlite",
    SQLITE_PATH: sqlitePath,
  });
  const migrations = [
    readFileSync(new URL("../migrations/0001_init.sql", import.meta.url), "utf8"),
    readFileSync(new URL("../migrations/0002_statistics_sync.sql", import.meta.url), "utf8"),
  ];
  for (const sql of migrations) {
    for (const statement of splitSqlStatements(sql)) {
      db.prepare(statement).run();
    }
  }
  return db;
}

const app = createApp();
const port = Number(process.env.PORT ?? "8787");
const sqlitePath = process.env.SQLITE_PATH ?? "./data/koreader-sync.db";
const env = parseNodeEnv();
const db = ensureDatabaseInitialized(sqlitePath);
setFallbackDatabaseAdapter(db);

serve({
  fetch: (request) =>
    app.fetch(request, env, {
      db,
    }),
  port,
});
