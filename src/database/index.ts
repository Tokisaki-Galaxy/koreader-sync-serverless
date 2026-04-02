import type { DatabaseAdapter } from "./adapter";
import { createSqliteDatabaseAdapter } from "../node/sqlite";
import { D1DatabaseAdapter } from "./d1Adapter";
import { resolveRuntimeTarget } from "../runtime";
import type { Env } from "../types";

export type DatabaseDriver = "d1" | "sqlite" | "postgres";

export function resolveDatabaseDriver(value: string | undefined): DatabaseDriver {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "sqlite") return "sqlite";
  if (normalized === "postgres") return "postgres";
  return "d1";
}

export function createDatabaseAdapter(env: Env): DatabaseAdapter {
  const runtime = resolveRuntimeTarget(env.RUNTIME_TARGET);
  const driver = resolveDatabaseDriver(env.DB_DRIVER);
  if (runtime === "node") {
    if (driver === "postgres") {
      throw new Error("DB_DRIVER=postgres is reserved and not implemented yet");
    }
    const sqlitePath = env.SQLITE_PATH?.trim() || "./data/koreader-sync.db";
    return createSqliteDatabaseAdapter(sqlitePath);
  }
  if (runtime === "vercel") {
    throw new Error("Runtime target 'vercel' is reserved and not implemented yet");
  }
  if (!env.DB) {
    throw new Error("Cloudflare runtime requires D1 binding DB");
  }
  return new D1DatabaseAdapter(env.DB);
}
