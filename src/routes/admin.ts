import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { md5 } from "js-md5";
import { deleteUserById, getDatabaseInitStatus, initializeDatabase, listUsers, updateUserPasswordById } from "../db";
import { hashPassword, sha256 } from "../crypto";
import { getMessages, pickLocale } from "../i18n";
import { ADMIN_SESSION_COOKIE, authAdmin, timingSafeEqual } from "../services/auth";
import { badRequest, isValidPassword, parsePbkdf2Iterations, parseSessionTtlHours } from "../services/common";
import { renderAdminPage } from "../ui/adminPage";
import type { Env } from "../types";

const router = new Hono<{ Bindings: Env }>();

router.post("/admin/auth/login", async (c) => {
  let body: { token?: string };
  try {
    body = await c.req.json<{ token?: string }>();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const token = body.token || "";
  const expectedToken = c.env.ADMIN_TOKEN ?? "";
  if (!expectedToken) return c.json({ error: "Admin token is not configured" }, 500);
  if (!token || !timingSafeEqual(token, expectedToken)) return c.json({ error: "Invalid token" }, 401);

  const ttlHours = parseSessionTtlHours(c.env);
  const adminSessionHash = await sha256(`${expectedToken}:${c.env.PASSWORD_PEPPER}`);
  setCookie(c, ADMIN_SESSION_COOKIE, adminSessionHash, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: ttlHours * 3600,
  });
  return c.json({ status: "ok" });
});

router.post("/admin/auth/logout", async (c) => {
  deleteCookie(c, ADMIN_SESSION_COOKIE, { path: "/" });
  return c.json({ status: "ok" });
});

router.get("/admin/me", async (c) => {
  const auth = await authAdmin(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  return c.json({ mode: auth.mode });
});

router.get("/admin/users", async (c) => {
  const locale = pickLocale(c.req.header("accept-language"));
  const messages = getMessages(locale).admin;
  const auth = await authAdmin(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  const status = await getDatabaseInitStatus(c.env);
  if (!status.initialized) return c.json({ error: messages.initRequired, code: "DB_NOT_INITIALIZED", missingTables: status.missingTables }, 409);
  const users = await listUsers(c.env);
  return c.json({ items: users });
});

router.delete("/admin/users/:id", async (c) => {
  const locale = pickLocale(c.req.header("accept-language"));
  const messages = getMessages(locale).admin;
  const auth = await authAdmin(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  const status = await getDatabaseInitStatus(c.env);
  if (!status.initialized) return c.json({ error: messages.initRequired, code: "DB_NOT_INITIALIZED", missingTables: status.missingTables }, 409);
  const userId = Number(c.req.param("id"));
  if (!Number.isInteger(userId) || userId <= 0) return badRequest("Invalid user id");
  const deleted = await deleteUserById(c.env, userId);
  if (!deleted) return c.json({ error: "User not found" }, 404);
  return c.json({ status: "ok" });
});

router.put("/admin/users/:id/password", async (c) => {
  const locale = pickLocale(c.req.header("accept-language"));
  const messages = getMessages(locale).admin;
  const auth = await authAdmin(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  const status = await getDatabaseInitStatus(c.env);
  if (!status.initialized) return c.json({ error: messages.initRequired, code: "DB_NOT_INITIALIZED", missingTables: status.missingTables }, 409);
  const userId = Number(c.req.param("id"));
  if (!Number.isInteger(userId) || userId <= 0) return badRequest("Invalid user id");

  let body: { password?: string };
  try {
    body = await c.req.json<{ password?: string }>();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const newPassword = body.password || "";
  if (!isValidPassword(newPassword)) return badRequest("Password must be at least 8 characters");

  const user = await c.env.DB.prepare("SELECT username FROM users WHERE id = ?").bind(userId).first<{ username: string }>();
  if (!user) return c.json({ error: "User not found" }, 404);

  const iterations = parsePbkdf2Iterations(c.env);
  const passwordHash = await hashPassword(md5(newPassword), user.username, c.env.PASSWORD_PEPPER, iterations);
  const updated = await updateUserPasswordById(c.env, userId, passwordHash);
  if (!updated) return c.json({ error: "User not found" }, 404);
  await c.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
  return c.json({ status: "ok" });
});

router.get("/admin/init/status", async (c) => {
  const auth = await authAdmin(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  const status = await getDatabaseInitStatus(c.env);
  return c.json(status);
});

router.post("/admin/init", async (c) => {
  const locale = pickLocale(c.req.header("accept-language"));
  const messages = getMessages(locale).admin;
  const auth = await authAdmin(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  await initializeDatabase(c.env);
  return c.json({ status: "ok", message: messages.initSuccess });
});

router.get("/admin", (c) => {
  const locale = pickLocale(c.req.header("accept-language"));
  return c.html(renderAdminPage(locale));
});

export default router;
