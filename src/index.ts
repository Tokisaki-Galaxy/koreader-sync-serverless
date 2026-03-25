import { Hono } from "hono";
import koreaderRoutes from "./routes/koreader";
import userRoutes from "./routes/user";
import adminRoutes from "./routes/admin";
import { withSecurityHeaders } from "./services/common";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  await next();
  withSecurityHeaders(c.res.headers);
});

app.route("/", koreaderRoutes);
app.route("/", userRoutes);
app.route("/", adminRoutes);

app.get("/health", (c) => c.json({ status: "ok" }));

export default app;

