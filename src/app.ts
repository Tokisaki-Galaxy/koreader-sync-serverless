import { Hono } from "hono";
import koreaderRoutes from "./routes/koreader";
import userRoutes from "./routes/user";
import adminRoutes from "./routes/admin";
import { withSecurityHeaders } from "./services/common";
import type { Env } from "./types";
import type { AppEnv } from "./context";
import { withDatabaseAdapter } from "./context";

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use("*", withDatabaseAdapter);
  app.use("*", async (c, next) => {
    await next();
    withSecurityHeaders(c.res.headers);
  });

  app.route("/", koreaderRoutes);
  app.route("/", userRoutes);
  app.route("/", adminRoutes);

  app.get("/healthcheck", (c) => c.json({ state: "OK" }));
  app.get("/health", (c) => c.json({ status: "ok" }));
  return app;
}
