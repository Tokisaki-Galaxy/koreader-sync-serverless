import type { Context } from "hono";
import type { DatabaseAdapter } from "./database/adapter";
import { createDatabaseAdapter } from "./database/index";
import type { Env } from "./types";
import { D1DatabaseAdapter } from "./database/d1Adapter";

export type AppEnv = {
  Bindings: Env;
  Variables: {
    db: DatabaseAdapter;
  };
};

export type AppContext = Context<AppEnv>;

let fallbackDbAdapter: DatabaseAdapter | null = null;

export function setFallbackDatabaseAdapter(adapter: DatabaseAdapter) {
  fallbackDbAdapter = adapter;
}

export function resolveDatabaseAdapter(c: AppContext): DatabaseAdapter {
  if (c.env.DB) {
    return new D1DatabaseAdapter(c.env.DB);
  }
  if (fallbackDbAdapter) {
    return fallbackDbAdapter;
  }
  return createDatabaseAdapter(c.env);
}

export function withDatabaseAdapter(c: AppContext, next: () => Promise<void>): Promise<void> {
  const existing = c.get("db");
  if (!existing) {
    c.set("db", resolveDatabaseAdapter(c));
  }
  return next();
}
