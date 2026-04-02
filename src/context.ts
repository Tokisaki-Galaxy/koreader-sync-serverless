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

export function withDatabaseAdapter(c: AppContext, next: () => Promise<void>): Promise<void> {
  const existing = c.get("db");
  if (!existing) {
    if (c.env.DB) {
      c.set("db", new D1DatabaseAdapter(c.env.DB));
    } else if (fallbackDbAdapter) {
      c.set("db", fallbackDbAdapter);
    } else {
      c.set("db", createDatabaseAdapter(c.env));
    }
  }
  return next();
}
