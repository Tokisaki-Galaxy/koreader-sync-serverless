import type { Context } from "hono";
import type { DatabaseAdapter } from "./db/adapter";
import { createDatabaseAdapter } from "./db";
import type { Env } from "./types";

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

export function withDatabaseAdapter(c: AppContext, next: () => Promise<void>): Promise<void> {
  const existing = c.get("db");
  if (!existing) {
    if (fallbackDbAdapter) {
      c.set("db", fallbackDbAdapter);
    } else {
      c.set("db", createDatabaseAdapter(c.env));
    }
  }
  return next();
}
