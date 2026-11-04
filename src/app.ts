import { Hono } from "hono";
import koreaderRoutes from "./routes/koreader";
import userRoutes from "./routes/user";
import adminRoutes from "./routes/admin";
import assetRoutes from "./routes/assets";
import mcpRoutes from "./routes/mcp";
import { withSecurityHeaders } from "./services/common";
import { logServerError } from "./services/errors";
import type { Env } from "./types";
import type { AppEnv } from "./context";
import { withDatabaseAdapter } from "./context";

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use("*", async (c, next) => {
    const requestId = c.req.header("x-request-id") || crypto.randomUUID();
    c.set("requestId", requestId);
    c.header("x-request-id", requestId);
    await next();
  });
  app.use("*", withDatabaseAdapter);
  app.use("*", async (c, next) => {
    await next();
    withSecurityHeaders(c.res.headers, c.get("cspNonce"));
  });

  app.route("/", assetRoutes);
  app.route("/", koreaderRoutes);
  app.route("/", userRoutes);
  app.route("/", adminRoutes);
  app.route("/", mcpRoutes);

  app.get("/healthcheck", (c) => c.json({ state: "OK" }));
  app.get("/health", (c) => c.json({ status: "ok" }));

  app.onError((err, c) => {
    logServerError(c, "unhandled", err);
    const response = c.json({ error: "Internal server error" }, 500);
    withSecurityHeaders(response.headers, c.get("cspNonce"));
    const requestId = c.get("requestId");
    if (requestId) response.headers.set("x-request-id", requestId);
    return response;
  });

  return app;
}
