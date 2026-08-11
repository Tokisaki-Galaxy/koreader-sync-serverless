import { Hono } from "hono";
import { deleteCookie, setCookie, getCookie } from "hono/cookie";
import {
  createSession,
  deleteSessionByTokenHash,
  findUserByUsername,
  getProgressSummaryByUser,
  getUserMetaById,
  getStatisticsSnapshot,
  listAllProgressByUser,
  listDeviceUsageByUser,
  listProgressRecordsByUser,
  upsertProgress,
  upsertStatisticsSnapshot,
} from "../db";
import { md5 } from "js-md5";
import { generateSessionToken, sha256, verifyPassword } from "../crypto";
import { pickLocale } from "../i18n";
import { authWebUser, USER_SESSION_COOKIE } from "../services/auth";
import { badRequest, parsePbkdf2Iterations, parseSessionTtlHours } from "../services/common";
import {
  buildStatisticsSummary,
  getStatisticsWithSummary,
  mergeSnapshots,
  normalizeBook,
  parseSnapshotFromJson,
} from "../services/statistics";
import {
  getDbFormatPayload,
  progressDbDataToProgressRows,
} from "../services/dbformat";
import { renderUserPage } from "../ui/userPage";
import type { StatisticsBookRow, UserLoginRequest } from "../types";
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

// Schema SQL served to the browser so .db files are generated client-side.
router.get("/web/export/db-format", (c) => {
  return c.json(getDbFormatPayload());
});

// Full data export for the current user (progress + statistics snapshot).
router.get("/web/export/data", async (c) => {
  const auth = await authWebUser(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const meta = await getUserMetaById(c.get("db"), auth.userId);
  const progress = await listAllProgressByUser(c.get("db"), auth.userId);
  const statisticsRow = await getStatisticsSnapshot(c.get("db"), auth.userId);
  const snapshot = statisticsRow ? parseSnapshotFromJson(statisticsRow.snapshot_json) : null;

  return c.json({
    username: auth.username,
    created_at: meta?.created_at ?? 0,
    progress,
    statistics: statisticsRow
      ? {
          schema_version: statisticsRow.schema_version,
          device: statisticsRow.device,
          device_id: statisticsRow.device_id,
          snapshot,
        }
      : null,
  });
});

// Import data parsed client-side from a .db file back into this user's account.
router.post("/web/import", async (c) => {
  const auth = await authWebUser(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  let body: {
    progress?: unknown;
    statistics?: {
      schema_version?: unknown;
      device?: unknown;
      device_id?: unknown;
      snapshot?: { books?: unknown };
    };
  };
  try {
    body = await c.req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const imported = {
    progress: 0,
    statisticsBooks: 0,
  };

  if (body.progress !== undefined) {
    if (!Array.isArray(body.progress)) return badRequest("progress must be an array");
    const rows = progressDbDataToProgressRows({ progress: body.progress });
    for (const row of rows) {
      if (!row.document || typeof row.document !== "string") continue;
      const timestamp = Number.isFinite(Number(row.timestamp)) ? Number(row.timestamp) : Math.floor(Date.now() / 1000);
      await upsertProgress(c.get("db"), auth.userId, {
        document: row.document,
        progress: String(row.progress ?? ""),
        percentage: Number.isFinite(Number(row.percentage)) ? Number(row.percentage) : 0,
        device: String(row.device ?? ""),
        device_id: String(row.device_id ?? ""),
        timestamp,
      });
      imported.progress += 1;
    }
  }

  if (body.statistics !== undefined) {
    const raw = body.statistics;
    const snapshotPayload = raw.snapshot;
    const incomingBooksRaw: unknown = snapshotPayload && typeof snapshotPayload === "object"
      ? (snapshotPayload as { books?: unknown }).books
      : null;
    if (snapshotPayload && !Array.isArray(incomingBooksRaw)) {
      return badRequest("statistics.snapshot.books must be an array");
    }
    const rawBooks: unknown[] = Array.isArray(incomingBooksRaw) ? incomingBooksRaw : [];

    const incomingSnapshot = {
      books: rawBooks.map(normalizeBook).filter((row): row is StatisticsBookRow => row !== null),
    };
    const schemaVersion = Number(raw.schema_version) || 20221111;
    const device = typeof raw.device === "string" && raw.device ? raw.device : "imported";
    const deviceId = typeof raw.device_id === "string" ? raw.device_id : "";

    const existing = await getStatisticsSnapshot(c.get("db"), auth.userId);
    const existingSnapshot = existing ? parseSnapshotFromJson(existing.snapshot_json) : null;
    const mergedSnapshot = mergeSnapshots(existingSnapshot, incomingSnapshot);
    const summary = buildStatisticsSummary(mergedSnapshot);

    await upsertStatisticsSnapshot(
      c.get("db"),
      auth.userId,
      schemaVersion,
      device,
      deviceId,
      JSON.stringify(mergedSnapshot),
      JSON.stringify(summary)
    );
    imported.statisticsBooks = mergedSnapshot.books.length;
  }

  if (imported.progress === 0 && imported.statisticsBooks === 0) {
    return badRequest("Nothing to import");
  }

  return c.json({ status: "ok", ...imported });
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
