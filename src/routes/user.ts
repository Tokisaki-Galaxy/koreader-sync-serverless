import { Hono } from "hono";
import { deleteCookie, setCookie, getCookie } from "hono/cookie";
import {
  createSession,
  deleteSessionByTokenHash,
  findUserByUsername,
  getProgressSummaryByUser,
  listDeviceUsageByUser,
  listProgressRecordsByUser,
} from "../db";
import { md5 } from "js-md5";
import { generateSessionToken, sha256, verifyPassword } from "../crypto";
import { pickLocale } from "../i18n";
import { authWebUser, USER_SESSION_COOKIE } from "../services/auth";
import { badRequest, parsePbkdf2Iterations, parseSessionTtlHours } from "../services/common";
import { getStatisticsWithSummary } from "../services/statistics";
import { renderUserPage } from "../ui/userPage";
import type { UserLoginRequest } from "../types";
import type { AppEnv } from "../context";

const router = new Hono<AppEnv>();

router.post("/web/auth/login", async (c) => {
  let body: UserLoginRequest;
  try {
    body = await c.req.json<UserLoginRequest>();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const username = (body.username || "").trim();
  const password = body.password || "";
  const user = await findUserByUsername(c.get("db"), username);
  if (!user) return c.json({ error: "Invalid credentials" }, 401);

  const md5HashedPassword = md5(password);
  const iterations = parsePbkdf2Iterations(c.env);
  const ok = await verifyPassword(md5HashedPassword, user.username, c.env.PASSWORD_PEPPER, user.password_hash, iterations);
  if (!ok) return c.json({ error: "Invalid credentials" }, 401);

  const token = generateSessionToken();
  const tokenHash = await sha256(`${token}:${c.env.PASSWORD_PEPPER}`);
  const ttlHours = parseSessionTtlHours(c.env);
  const expiresAt = Math.floor(Date.now() / 1000) + ttlHours * 3600;

  await createSession(c.get("db"), user.id, tokenHash, expiresAt);

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
    await deleteSessionByTokenHash(c.get("db"), tokenHash);
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

  const results = await listProgressRecordsByUser(c.get("db"), auth.userId, pageSize, offset);

  return c.json({ page, pageSize, items: results ?? [] });
});

router.get("/web/stats", async (c) => {
  const auth = await authWebUser(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const summary = await getProgressSummaryByUser(c.get("db"), auth.userId);

  const devices = await listDeviceUsageByUser(c.get("db"), auth.userId);

  const withSummary = await getStatisticsWithSummary(c.get("db"), auth.userId);
  const books = withSummary?.summary ? Object.values(withSummary.summary.books) : [];
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
  const page = Math.max(1, Number(c.req.query("page") || "1"));
  const pageSize = c.req.query("pageSize") === "100" ? 100 : 50;
  const offset = (page - 1) * pageSize;

  const withSummary = await getStatisticsWithSummary(c.get("db"), auth.userId);
  if (!withSummary || !withSummary.summary) {
    return c.json({ schemaVersion: null, page, pageSize, total: 0, items: [] });
  }
  const books = Object.values(withSummary.summary.books).sort(
    (a, b) => Number(b.total_read_time || 0) - Number(a.total_read_time || 0)
  );
  const pagedBooks = books.slice(offset, offset + pageSize);
  return c.json({
    schemaVersion: withSummary.schema_version,
    device: withSummary.device,
    deviceId: withSummary.device_id,
    page,
    pageSize,
    total: books.length,
    items: pagedBooks,
  });
});

router.get("/web/stats/calendar", async (c) => {
  const auth = await authWebUser(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const withSummary = await getStatisticsWithSummary(c.get("db"), auth.userId);
  const daily = withSummary?.summary?.daily ?? {};

  const days = Object.entries(daily)
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const years: number[] = [];
  for (const d of days) {
    const y = Number(d.date.slice(0, 4));
    if (!years.includes(y)) years.push(y);
  }

  return c.json({ years, days });
});

router.get("/web/stats/calendar/detail", async (c) => {
  const auth = await authWebUser(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const year = Number(c.req.query("year"));
  const month = Number(c.req.query("month"));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return c.json({ error: "Invalid year/month" }, 400);
  }

  const withSummary = await getStatisticsWithSummary(c.get("db"), auth.userId);
  const booksMap: Record<string, { title: string; authors: string; days: Record<string, Record<string, number>>; totalMinutes: number }> = {};
  let totalMinutes = 0;

  if (withSummary?.summary) {
    const monthPrefix = year + '-' + String(month).padStart(2, '0') + '-';
    for (const book of Object.values(withSummary.summary.books)) {
      const days: Record<string, Record<string, number>> = {};
      let bookMinutes = 0;
      for (const [dateKey, hours] of Object.entries(book.days)) {
        if (!dateKey.startsWith(monthPrefix)) continue;
        days[dateKey] = hours;
        for (const hourKey of Object.keys(hours)) {
          bookMinutes += hours[hourKey];
        }
      }
      if (bookMinutes > 0) {
        booksMap[book.md5] = { title: book.title, authors: book.authors, days, totalMinutes: bookMinutes };
        totalMinutes += bookMinutes;
      }
    }
  }

  return c.json({ year, month, totalMinutes, books: booksMap });
});

router.get("/", (c) => {
  const locale = pickLocale(c.req.header("accept-language"));
  return c.html(renderUserPage(locale));
});

export default router;
