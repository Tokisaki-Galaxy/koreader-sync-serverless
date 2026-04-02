import type { DatabaseAdapter } from "./adapter";
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
    throw new Error(`Runtime target 'node' requires node-only bootstrap (driver=${driver})`);
  }
  if (runtime === "vercel") {
    throw new Error("Runtime target 'vercel' is reserved and not implemented yet");
  }
  if (!env.DB) {
    throw new Error("Cloudflare runtime requires D1 binding DB");
  }
  return new D1DatabaseAdapter(env.DB);
}
