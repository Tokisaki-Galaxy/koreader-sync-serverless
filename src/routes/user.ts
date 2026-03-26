import { Hono } from "hono";
import { deleteCookie, setCookie, getCookie } from "hono/cookie";
import { findUserByUsername, getStatisticsSnapshot } from "../db";
import { md5 } from "js-md5";
import { generateSessionToken, sha256, verifyPassword } from "../crypto";
import { pickLocale } from "../i18n";
import { authWebUser, USER_SESSION_COOKIE } from "../services/auth";
import { badRequest, parsePbkdf2Iterations, parseSessionTtlHours } from "../services/common";
import { renderUserPage } from "../ui/userPage";
import type { Env, StatisticsBookRow, StatisticsSnapshot, UserLoginRequest } from "../types";

const router = new Hono<{ Bindings: Env }>();

function numberOrZero(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseStatisticsSnapshot(snapshotJson: string): StatisticsSnapshot | null {
  try {
    const parsed = JSON.parse(snapshotJson) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const booksRaw = (parsed as Record<string, unknown>).books;
    if (!Array.isArray(booksRaw)) return { books: [] };
    const books: StatisticsBookRow[] = [];
    for (const item of booksRaw) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const md5Value = typeof row.md5 === "string" ? row.md5.trim() : "";
      if (!md5Value) continue;
      books.push({
        md5: md5Value,
        title: typeof row.title === "string" ? row.title : "",
        authors: typeof row.authors === "string" ? row.authors : "",
        notes: numberOrZero(row.notes),
        last_open: numberOrZero(row.last_open),
        highlights: numberOrZero(row.highlights),
        pages: numberOrZero(row.pages),
        series: typeof row.series === "string" ? row.series : "",
        language: typeof row.language === "string" ? row.language : "",
        total_read_time: numberOrZero(row.total_read_time),
        total_read_pages: numberOrZero(row.total_read_pages),
        page_stat_data: [],
      });
    }
    return { books };
  } catch {
    return null;
  }
}

router.post("/web/auth/login", async (c) => {
  let body: UserLoginRequest;
  try {
    body = await c.req.json<UserLoginRequest>();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const username = (body.username || "").trim();
  const password = body.password || "";
  const user = await findUserByUsername(c.env, username);
  if (!user) return c.json({ error: "Invalid credentials" }, 401);

  const md5HashedPassword = md5(password);
  const iterations = parsePbkdf2Iterations(c.env);
  const ok = await verifyPassword(md5HashedPassword, user.username, c.env.PASSWORD_PEPPER, user.password_hash, iterations);
  if (!ok) return c.json({ error: "Invalid credentials" }, 401);

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
  if (!auth) return c.json({ error: "Unauthorized" }, 401);
  return c.json({ id: auth.userId, username: auth.username });
});

router.get("/web/records", async (c) => {
  const auth = await authWebUser(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const page = Math.max(1, Number(c.req.query("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(c.req.query("pageSize") || "20")));
  const offset = (page - 1) * pageSize;

  const { results } = await c.env.DB.prepare(
    `SELECT document, progress, percentage, device, device_id, timestamp
     FROM progress
     WHERE user_id = ?
     ORDER BY timestamp DESC
     LIMIT ? OFFSET ?`
  )
    .bind(auth.userId, pageSize, offset)
    .all();

  return c.json({ page, pageSize, items: results ?? [] });
});

router.get("/web/stats", async (c) => {
  const auth = await authWebUser(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const summary = await c.env.DB.prepare(
    `SELECT
      COUNT(*) AS total_records,
      COUNT(DISTINCT document) AS total_documents,
      COUNT(DISTINCT device) AS total_devices,
      COUNT(DISTINCT date(timestamp, 'unixepoch')) AS active_days,
      AVG(percentage) AS avg_percentage,
      MAX(timestamp) AS last_sync_at
     FROM progress
     WHERE user_id = ?`
  )
    .bind(auth.userId)
    .first<{
      total_records: number;
      total_documents: number;
      total_devices: number;
      active_days: number;
      avg_percentage: number | null;
      last_sync_at: number | null;
    }>();

  const { results: devices } = await c.env.DB.prepare(
    `SELECT device, COUNT(*) as count
     FROM progress
     WHERE user_id = ?
     GROUP BY device
     ORDER BY count DESC`
  )
    .bind(auth.userId)
    .all();

  const statistics = await getStatisticsSnapshot(c.env, auth.userId);
  const snapshot = statistics ? parseStatisticsSnapshot(statistics.snapshot_json) : null;
  const books = snapshot?.books ?? [];
  const totalReadTime = books.reduce((sum, item) => sum + Number(item.total_read_time || 0), 0);
  const totalReadPages = books.reduce((sum, item) => sum + Number(item.total_read_pages || 0), 0);
  const statisticsLastOpen = books.reduce((max, item) => Math.max(max, Number(item.last_open || 0)), 0);

  return c.json({
    summary: {
      totalRecords: summary?.total_records ?? 0,
      totalDocuments: summary?.total_documents ?? 0,
      totalDevices: summary?.total_devices ?? 0,
      activeDays: summary?.active_days ?? 0,
      averagePercentage: summary?.avg_percentage ?? 0,
      lastSyncAt: summary?.last_sync_at ?? null,
    },
    readingStatistics: {
      totalBooks: books.length,
      totalReadTime,
      totalReadPages,
      lastOpenAt: statisticsLastOpen || null,
    },
    devices: devices ?? [],
  });
});

router.get("/web/statistics/books", async (c) => {
  const auth = await authWebUser(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const statistics = await getStatisticsSnapshot(c.env, auth.userId);
  if (!statistics) return c.json({ schemaVersion: null, items: [] });
  const snapshot = parseStatisticsSnapshot(statistics.snapshot_json);
  const books = (snapshot?.books ?? []).sort(
    (a, b) => Number(b.total_read_time || 0) - Number(a.total_read_time || 0)
  );
  return c.json({
    schemaVersion: statistics.schema_version,
    device: statistics.device,
    deviceId: statistics.device_id,
    items: books,
  });
});

router.get("/", (c) => {
  const locale = pickLocale(c.req.header("accept-language"));
  return c.html(renderUserPage(locale));
});

export default router;
