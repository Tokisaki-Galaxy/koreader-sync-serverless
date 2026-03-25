import { Hono } from "hono";
import { deleteCookie, setCookie, getCookie } from "hono/cookie";
import { findUserByUsername } from "../db";
import { md5 } from "js-md5";
import { generateSessionToken, sha256, verifyPassword } from "../crypto";
import { pickLocale } from "../i18n";
import { authWebUser, USER_SESSION_COOKIE } from "../services/auth";
import { badRequest, parsePbkdf2Iterations, parseSessionTtlHours } from "../services/common";
import { renderUserPage } from "../ui/userPage";
const router = new Hono();
router.post("/web/auth/login", async (c) => {
    let body;
    try {
        body = await c.req.json();
    }
    catch {
        return badRequest("Invalid JSON body");
    }
    const username = (body.username || "").trim();
    const password = body.password || "";
    const user = await findUserByUsername(c.env, username);
    if (!user)
        return c.json({ error: "Invalid credentials" }, 401);
    const md5HashedPassword = md5(password);
    const iterations = parsePbkdf2Iterations(c.env);
    const ok = await verifyPassword(md5HashedPassword, user.username, c.env.PASSWORD_PEPPER, user.password_hash, iterations);
    if (!ok)
        return c.json({ error: "Invalid credentials" }, 401);
    const token = generateSessionToken();
    const tokenHash = await sha256(`${token}:${c.env.PASSWORD_PEPPER}`);
    const ttlHours = parseSessionTtlHours(c.env);
    const expiresAt = Math.floor(Date.now() / 1000) + ttlHours * 3600;
    await c.env.DB.prepare("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)")
        .bind(user.id, tokenHash, expiresAt)
        .run();
    setCookie(c, USER_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/",
        maxAge: ttlHours * 3600,
    });
    return c.json({ username: user.username });
});
router.post("/web/auth/logout", async (c) => {
    const token = getCookie(c, USER_SESSION_COOKIE);
    if (token) {
        const tokenHash = await sha256(`${token}:${c.env.PASSWORD_PEPPER}`);
        await c.env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
    }
    deleteCookie(c, USER_SESSION_COOKIE, { path: "/" });
    return c.json({ status: "ok" });
});
router.get("/web/me", async (c) => {
    const auth = await authWebUser(c);
    if (!auth)
        return c.json({ error: "Unauthorized" }, 401);
    return c.json({ id: auth.userId, username: auth.username });
});
router.get("/web/records", async (c) => {
    const auth = await authWebUser(c);
    if (!auth)
        return c.json({ error: "Unauthorized" }, 401);
    const page = Math.max(1, Number(c.req.query("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(c.req.query("pageSize") || "20")));
    const offset = (page - 1) * pageSize;
    const { results } = await c.env.DB.prepare(`SELECT document, progress, percentage, device, device_id, timestamp
     FROM progress
     WHERE user_id = ?
     ORDER BY timestamp DESC
     LIMIT ? OFFSET ?`)
        .bind(auth.userId, pageSize, offset)
        .all();
    return c.json({ page, pageSize, items: results ?? [] });
});
router.get("/web/stats", async (c) => {
    const auth = await authWebUser(c);
    if (!auth)
        return c.json({ error: "Unauthorized" }, 401);
    const summary = await c.env.DB.prepare(`SELECT
      COUNT(*) AS total_records,
      COUNT(DISTINCT document) AS total_documents,
      COUNT(DISTINCT device) AS total_devices,
      COUNT(DISTINCT date(timestamp, 'unixepoch')) AS active_days,
      AVG(percentage) AS avg_percentage,
      MAX(timestamp) AS last_sync_at
     FROM progress
     WHERE user_id = ?`)
        .bind(auth.userId)
        .first();
    const { results: devices } = await c.env.DB.prepare(`SELECT device, COUNT(*) as count
     FROM progress
     WHERE user_id = ?
     GROUP BY device
     ORDER BY count DESC`)
        .bind(auth.userId)
        .all();
    return c.json({
        summary: {
            totalRecords: summary?.total_records ?? 0,
            totalDocuments: summary?.total_documents ?? 0,
            totalDevices: summary?.total_devices ?? 0,
            activeDays: summary?.active_days ?? 0,
            averagePercentage: summary?.avg_percentage ?? 0,
            lastSyncAt: summary?.last_sync_at ?? null,
        },
        devices: devices ?? [],
    });
});
router.get("/", (c) => {
    const locale = pickLocale(c.req.header("accept-language"));
    return c.html(renderUserPage(locale));
});
export default router;
