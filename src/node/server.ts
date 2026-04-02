import { mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { createApp } from "../app";
import { createDatabaseAdapter } from "../database/index";
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
    PBKDF2_ITERATIONS: process.env.PBKDF2_ITERATIONS,
    ENABLE_USER_REGISTRATION: process.env.ENABLE_USER_REGISTRATION,
  };
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      current += char;
      continue;
    }

    if (inBlockComment) {
      current += char;
      if (char === "*" && next === "/") {
        current += next;
        i++;
        inBlockComment = false;
      }
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && char === "-" && next === "-") {
      current += char + next;
      i++;
      inLineComment = true;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && char === "/" && next === "*") {
      current += char + next;
      i++;
      inBlockComment = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      if (inSingleQuote && next === "'") {
        current += char + next;
        i++;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      if (inDoubleQuote && next === '"') {
        current += char + next;
        i++;
        continue;
      }
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }

    if (char === ";" && !inSingleQuote && !inDoubleQuote) {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
      continue;
    }

    current += char;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

function ensureDatabaseInitialized(sqlitePath: string) {
  mkdirSync(dirname(sqlitePath), { recursive: true });
  const db = createDatabaseAdapter({
    PASSWORD_PEPPER: "bootstrap",
    ADMIN_TOKEN: "bootstrap",
    RUNTIME_TARGET: "node",
    DB_DRIVER: "sqlite",
    SQLITE_PATH: sqlitePath,
  });
  const baseDir = dirname(fileURLToPath(import.meta.url));
  const migrations = [
    readFileSync(`${baseDir}/../../migrations/0001_init.sql`, "utf8"),
    readFileSync(`${baseDir}/../../migrations/0002_statistics_sync.sql`, "utf8"),
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
const env = parseNodeEnv();
const sqlitePath = env.SQLITE_PATH ?? "./data/koreader-sync.db";
const db = ensureDatabaseInitialized(sqlitePath);
setFallbackDatabaseAdapter(db);

serve({
  fetch: (request) => app.fetch(request, env),
  port,
});
