import * as z from "zod";
import { McpServer } from "@modelcontextprotocol/server";
import {
  countProgressRecordsByUserSearch,
  getLatestProgressByDocument,
  getProgressSummaryByUser,
  getStatisticsSnapshot,
  listDeviceUsageByUser,
  listProgressRecordsByUser,
  listProgressRecordsByUserSearch,
} from "../db";
import {
  computeBookTrajectory,
  computeHourlyDistribution,
  computeReadingStreaks,
  getStatisticsWithSummary,
  parseSnapshotFromJson,
  type StatisticsBookSummary,
  type StatisticsSummary,
} from "../services/statistics";
import {
  bookProgressPercent,
  computeReadingTotals,
  queryStatisticsBooks,
  type BookSortField,
  type BookStatusFilter,
  type SortOrder,
} from "../services/books";
import type { DatabaseAdapter } from "../database/adapter";
import type { McpIdentity } from "./auth";

export const MCP_SERVER_NAME = "koreader-sync";
export const MCP_SERVER_VERSION = "1.0.0";

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

type ToolErrorCode = "invalid_argument" | "not_found" | "internal";

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

const anyObject = z.record(z.string(), z.unknown());

function textResult<T extends Record<string, unknown>>(payload: T): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(payload) }],
    structuredContent: payload,
  };
}

function toolError(code: ToolErrorCode, message: string, details?: unknown): ToolResult {
  const payload = {
    error: { code, message, ...(details === undefined ? {} : { details }) },
  };
  return { content: [{ type: "text", text: JSON.stringify(payload) }], isError: true };
}

function serverTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function toIsoOrNull(seconds: number | null | undefined): string | null {
  const value = Number(seconds ?? 0);
  if (!Number.isFinite(value) || value <= 0) return null;
  return new Date(value * 1000).toISOString();
}

function toBookListItem(book: StatisticsBookSummary) {
  const progressPercent = Math.round(bookProgressPercent(book) * 100) / 100;
  return {
    md5: book.md5,
    title: book.title,
    authors: book.authors,
    series: book.series,
    language: book.language,
    pages: Number(book.pages || 0),
    totalReadPages: Number(book.total_read_pages || 0),
    totalReadSeconds: Number(book.total_read_time || 0),
    totalReadMinutes: Math.round(Number(book.total_read_time || 0) / 60),
    progressPercent,
    notes: Number(book.notes || 0),
    highlights: Number(book.highlights || 0),
    lastOpenAt: Number(book.last_open || 0) || null,
    lastOpenAtIso: toIsoOrNull(book.last_open),
  };
}

async function loadSummary(db: DatabaseAdapter, userId: number): Promise<{
  found: boolean;
  summary: StatisticsSummary | null;
  schemaVersion: number | null;
  device: string | null;
  deviceId: string | null;
}> {
  const row = await getStatisticsWithSummary(db, userId);
  return {
    found: Boolean(row?.summary),
    summary: row?.summary ?? null,
    schemaVersion: row?.schema_version ?? null,
    device: row?.device ?? null,
    deviceId: row?.device_id ?? null,
  };
}

function findBookByTitle(summary: StatisticsSummary, title: string) {
  const needle = title.trim().toLowerCase();
  if (!needle) return { matches: [] as StatisticsBookSummary[] };
  const books = Object.values(summary.books);
  const exact = books.filter((book) => (book.title || "").trim().toLowerCase() === needle);
  if (exact.length > 0) return { matches: exact };
  return {
    matches: books.filter(
      (book) =>
        (book.title || "").toLowerCase().includes(needle) ||
        (book.authors || "").toLowerCase().includes(needle)
    ),
  };
}

function sumBookMinutesForMonth(book: StatisticsBookSummary, monthPrefix: string) {
  let minutes = 0;
  const days: Record<string, Record<string, number>> = {};
  for (const [date, hours] of Object.entries(book.days)) {
    if (!date.startsWith(monthPrefix)) continue;
    days[date] = hours;
    for (const value of Object.values(hours)) {
      minutes += Number(value) || 0;
    }
  }
  return { minutes, days };
}

// Statistics date keys come from the server's local date at sync time, so the
// MCP window boundaries must use the same calendar. On Cloudflare Workers this
// is UTC; on a Node host it follows the host timezone.
function serverDateKey(timestampMs: number = Date.now()): string {
  const date = new Date(timestampMs);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function utcDateKey(timestampMs: number = Date.now()): string {
  const date = new Date(timestampMs);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function dateKeyDaysAgo(days: number): string {
  return serverDateKey(Date.now() - (days - 1) * 86400000);
}

function sumHourBuckets(hours: Record<string, number>): number {
  let minutes = 0;
  for (const value of Object.values(hours)) {
    minutes += Number(value) || 0;
  }
  return minutes;
}

function hourEntries(hours: Record<string, number>): Array<{ hour: number; minutes: number }> {
  return Object.entries(hours)
    .map(([hour, value]) => ({ hour: Number(hour), minutes: Number(value) || 0 }))
    .filter((entry) => entry.minutes > 0)
    .sort((a, b) => a.hour - b.hour);
}

function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && utcDateKey(parsed.getTime()) === value;
}

// Output schemas cover the top level. Nested rows stay loosely typed so the
// reader-facing fields can evolve without a schema migration on every tweak.
const overviewOutput = z.object({
  username: z.string(),
  hasStatistics: z.boolean(),
  statisticsSource: anyObject.nullable(),
  sync: anyObject,
  reading: anyObject,
  streaks: anyObject,
  devices: z.array(anyObject),
  asOf: z.string(),
});

const bookListOutput = z.object({
  hasData: z.boolean(),
  total: z.number(),
  offset: z.number(),
  limit: z.number(),
  returned: z.number(),
  books: z.array(anyObject),
});

const recentReadingOutput = z.object({
  hasData: z.boolean(),
  window: anyObject,
  timezone: z.string(),
  totalMinutes: z.number(),
  activeDays: z.number(),
  total: z.number(),
  returned: z.number(),
  books: z.array(anyObject),
});

const progressOutput = z.object({
  mode: z.enum(["document", "list", "search"]),
  offset: z.number(),
  limit: z.number(),
  total: z.number(),
  returned: z.number(),
  hasMore: z.boolean(),
  records: z.array(anyObject),
});

const readingActivityOutput = z.object({
  hasData: z.boolean(),
  timezone: z.string(),
  years: z.array(z.number()),
  filterYear: z.number().nullable(),
  daysWindow: anyObject,
  lifetimeActiveDays: z.number(),
  lifetimeCurrentStreak: z.number(),
  lifetimeLongestStreak: z.number(),
  windowTotalMinutes: z.number(),
  windowMonthlyTotals: z.array(anyObject),
  allTimeHourlyDistribution: z.array(anyObject),
  days: z.array(anyObject),
});

const activityBreakdownOutput = z.object({
  hasData: z.boolean(),
  scope: z.enum(["day", "month"]),
  date: z.string().optional(),
  year: z.number().optional(),
  month: z.number().optional(),
  timezone: z.string(),
  totalMinutes: z.number(),
  total: z.number(),
  returned: z.number(),
  hasMore: z.boolean(),
  books: z.array(anyObject),
});

export interface McpServerConfig {
  db: DatabaseAdapter;
  user: McpIdentity;
}

export function createMcpServer({ db, user }: McpServerConfig): McpServer {
  const server = new McpServer(
    {
      name: MCP_SERVER_NAME,
      title: "KOReader Sync",
      version: MCP_SERVER_VERSION,
    },
    {
      instructions:
        "Read-only access to a KOReader sync account. Reading progress comes from the sync " +
        "protocol and covers one record per document; reading statistics come from KOReader's " +
        "statistics.sqlite3 and cover per-book reading time, pages, highlights and notes. " +
        "Timestamps are unix seconds (UTC) unless a field ends in `Iso`. Durations are seconds " +
        "unless the field name says `Minutes`. Progress percentages are 0 to 100. Calendar dates " +
        "are derived from session start times in the server's timezone at sync time, which is " +
        "UTC on Cloudflare Workers; `timezone_offset_hours` only shifts hour buckets, not dates.",
    }
  );

  server.registerTool(
    "get_reading_overview",
    {
      title: "Reading overview",
      description:
        "Get a single snapshot of the account: synced document/device counts, total reading " +
        "time, pages, completed books, highlights, notes, devices in use, and current/longest " +
        "reading streaks. Use this first when the user asks something broad like how much they " +
        "have read or which devices they sync from.",
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: z.object({}),
      outputSchema: overviewOutput,
    },
    async () => {
      const progress = await getProgressSummaryByUser(db, user.userId);
      const devices = await listDeviceUsageByUser(db, user.userId);
      const { found, summary, schemaVersion, device, deviceId } = await loadSummary(db, user.userId);
      const books = summary ? Object.values(summary.books) : [];
      const totals = computeReadingTotals(books);
      const daily = summary?.daily ?? {};
      const streaks = computeReadingStreaks(daily, serverDateKey());

      return textResult({
        username: user.username,
        hasStatistics: found,
        statisticsSource: found ? { schemaVersion, device, deviceId } : null,
        sync: {
          documents: progress?.total_documents ?? 0,
          progressRecords: progress?.total_records ?? 0,
          devices: progress?.total_devices ?? 0,
          syncActiveDays: progress?.active_days ?? 0,
          averageProgressPercent:
            progress?.avg_percentage == null ? null : Math.round(progress.avg_percentage * 100) / 100,
          lastSyncAt: progress?.last_sync_at ?? null,
          lastSyncAtIso: toIsoOrNull(progress?.last_sync_at),
        },
        reading: {
          books: totals.totalBooks,
          completedBooks: totals.completedBooks,
          totalReadSeconds: totals.totalReadTime,
          totalReadMinutes: Math.round(totals.totalReadTime / 60),
          totalReadPages: totals.totalReadPages,
          highlights: totals.totalHighlights,
          notes: totals.totalNotes,
          lastOpenAt: totals.lastOpenAt,
          lastOpenAtIso: toIsoOrNull(totals.lastOpenAt),
        },
        streaks: {
          readingDays: streaks.activeDays,
          currentStreak: streaks.currentStreak,
          longestStreak: streaks.longestStreak,
        },
        devices: (devices ?? []).map((row) => ({ device: row.device, progressRecords: row.count })),
        asOf: new Date().toISOString(),
      });
    }
  );

  server.registerTool(
    "list_books",
    {
      title: "List books",
      description:
        "List books from the reading statistics with search, status filter, sorting and " +
        "pagination. Use `search` for title, author or md5 fragments. Status values: all, " +
        "completed, reading, unread. Sort by read_time, last_open, pages, or progress. Only " +
        "books present in the statistics snapshot are listed, so a book that was synced but " +
        "never opened in KOReader does not appear here.",
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: z.object({
        search: z.string().optional().describe("Case-insensitive fragment of title, author or md5"),
        status: z
          .enum(["all", "completed", "reading", "unread"])
          .optional()
          .describe("Filter by reading status, default all"),
        sort_by: z
          .enum(["read_time", "last_open", "pages", "progress"])
          .optional()
          .describe("Sort field, default read_time"),
        sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction, default desc"),
        limit: z.number().int().min(1).max(100).optional().describe("Page size, default 20"),
        offset: z.number().int().min(0).optional().describe("Number of books to skip, default 0"),
      }),
      outputSchema: bookListOutput,
    },
    async (args) => {
      const { found, summary } = await loadSummary(db, user.userId);
      if (!found || !summary) {
        return textResult({
          hasData: false,
          total: 0,
          offset: args.offset ?? 0,
          limit: args.limit ?? 20,
          returned: 0,
          books: [],
        });
      }

      const books = queryStatisticsBooks(Object.values(summary.books), {
        search: args.search,
        status: args.status as BookStatusFilter | undefined,
        sortBy: args.sort_by as BookSortField | undefined,
        sortOrder: args.sort_order as SortOrder | undefined,
      });

      const limit = args.limit ?? 20;
      const offset = args.offset ?? 0;
      const page = books.slice(offset, offset + limit);

      return textResult({
        hasData: true,
        total: books.length,
        offset,
        limit,
        returned: page.length,
        books: page.map(toBookListItem),
      });
    }
  );

  server.registerTool(
    "get_recent_reading",
    {
      title: "Recent reading",
      description:
        "List what was read in the last N days, aggregated per book with minutes, active " +
        "days and the last day it was read. Use this for questions like what have I been " +
        "reading this week. Defaults to the last 7 days. The window ends today and is compared " +
        "against date keys generated in the server's timezone.",
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: z.object({
        days: z.number().int().min(1).max(90).optional().describe("Window size in days, default 7"),
        limit: z.number().int().min(1).max(50).optional().describe("Maximum books to return, default 20"),
      }),
      outputSchema: recentReadingOutput,
    },
    async (args) => {
      const { found, summary } = await loadSummary(db, user.userId);
      const days = args.days ?? 7;
      const cutoff = dateKeyDaysAgo(days);
      const timezone = serverTimeZone();

      if (!found || !summary) {
        return textResult({
          hasData: false,
          window: { days, from: cutoff, to: serverDateKey() },
          timezone,
          totalMinutes: 0,
          activeDays: 0,
          total: 0,
          returned: 0,
          books: [],
        });
      }

      const activeDates = new Set<string>();
      const entries: Array<{
        md5: string;
        title: string;
        authors: string;
        minutes: number;
        activeDays: number;
        lastReadDate: string | null;
        progressPercent: number;
        lastOpenAt: number | null;
        lastOpenAtIso: string | null;
      }> = [];
      let totalMinutes = 0;

      for (const book of Object.values(summary.books)) {
        let minutes = 0;
        let activeDays = 0;
        let lastReadDate: string | null = null;

        for (const [date, hours] of Object.entries(book.days ?? {})) {
          if (date < cutoff) continue;
          const dayMinutes = sumHourBuckets(hours);
          if (dayMinutes <= 0) continue;
          minutes += dayMinutes;
          activeDays += 1;
          activeDates.add(date);
          if (lastReadDate === null || date > lastReadDate) lastReadDate = date;
        }

        if (minutes <= 0) continue;
        totalMinutes += minutes;
        entries.push({
          md5: book.md5,
          title: book.title,
          authors: book.authors,
          minutes,
          activeDays,
          lastReadDate,
          progressPercent: Math.round(bookProgressPercent(book) * 100) / 100,
          lastOpenAt: Number(book.last_open || 0) || null,
          lastOpenAtIso: toIsoOrNull(book.last_open),
        });
      }

      entries.sort((a, b) => b.minutes - a.minutes || (b.lastReadDate ?? "").localeCompare(a.lastReadDate ?? ""));
      const limit = args.limit ?? 20;

      return textResult({
        hasData: true,
        window: { days, from: cutoff, to: serverDateKey() },
        timezone,
        totalMinutes,
        activeDays: activeDates.size,
        total: entries.length,
        returned: Math.min(entries.length, limit),
        books: entries.slice(0, limit),
      });
    }
  );

  server.registerTool(
    "get_book_details",
    {
      title: "Book details",
      description:
        "Get one book's reading trajectory: progress, pages read, reading speed, per-day " +
        "history, and the most recent reading sessions. Pass either `md5` or `title`; a title " +
        "also matches authors. When a title is ambiguous the tool returns `ambiguous: true` " +
        "with candidates instead of guessing. Daily dates use the server's timezone.",
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: z.object({
        md5: z.string().optional().describe("Book md5 as shown by list_books"),
        title: z.string().optional().describe("Book title or author fragment, used when md5 is absent"),
        recent_sessions_limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .optional()
          .describe("How many recent reading sessions to include, default 20"),
        history_days: z
          .number()
          .int()
          .min(1)
          .max(3650)
          .optional()
          .describe("How many days of daily history to include, default 365"),
      }),
    },
    async (args) => {
      if (args.md5 && args.title) {
        return toolError("invalid_argument", "Pass either md5 or title, not both.");
      }
      if (!args.md5 && !args.title) {
        return toolError("invalid_argument", "Provide either md5 or title.");
      }

      const row = await getStatisticsSnapshot(db, user.userId);
      const snapshot = row ? parseSnapshotFromJson(row.snapshot_json) : null;
      if (!snapshot) {
        return textResult({ hasData: false, found: false, ambiguous: false, reason: "no_statistics" });
      }

      let book = null;
      if (args.md5) {
        const needle = args.md5.trim().toLowerCase();
        book = snapshot.books.find((item) => (item.md5 || "").toLowerCase() === needle) ?? null;
        if (!book) return toolError("not_found", `No book found for md5 "${args.md5}".`);
      } else if (args.title) {
        const summary = (await loadSummary(db, user.userId)).summary;
        if (!summary) {
          return textResult({ hasData: false, found: false, ambiguous: false, reason: "no_statistics" });
        }
        const { matches } = findBookByTitle(summary, args.title);
        if (matches.length === 0) {
          return toolError("not_found", `No book matched "${args.title}".`);
        }
        if (matches.length > 1) {
          return textResult({
            hasData: true,
            found: false,
            ambiguous: true,
            total: matches.length,
            candidatesTruncated: matches.length > 20,
            candidates: matches
              .slice(0, 20)
              .map((item) => ({ md5: item.md5, title: item.title, authors: item.authors })),
          });
        }
        book = snapshot.books.find((item) => item.md5 === matches[0].md5) ?? null;
      }

      if (!book) return toolError("not_found", "Book not found in the statistics snapshot.");

      const trajectory = computeBookTrajectory(book);
      const sessionLimit = args.recent_sessions_limit ?? 20;
      const historyDays = args.history_days ?? 365;
      const historyCutoff = dateKeyDaysAgo(historyDays);
      const dailyHistory = trajectory.daily_history.filter((entry) => entry.date >= historyCutoff);
      const sessions = trajectory.recent_sessions.slice(0, sessionLimit);

      return textResult({
        hasData: true,
        found: true,
        ambiguous: false,
        md5: trajectory.md5,
        title: trajectory.title,
        authors: trajectory.authors,
        series: trajectory.series,
        language: trajectory.language,
        pages: trajectory.pages,
        totalReadPages: trajectory.total_read_pages,
        totalReadSeconds: trajectory.total_read_time,
        totalReadMinutes: Math.round(trajectory.total_read_time / 60),
        progressPercent: trajectory.progress,
        notes: trajectory.notes,
        highlights: trajectory.highlights,
        lastOpenAt: trajectory.last_open || null,
        lastOpenAtIso: toIsoOrNull(trajectory.last_open),
        readingSpeed: {
          secondsPerPage: trajectory.reading_speed.seconds_per_page,
          pagesPerHour: trajectory.reading_speed.pages_per_hour,
        },
        dailyHistory,
        dailyHistoryTruncated: dailyHistory.length < trajectory.daily_history.length,
        historyWindowDays: historyDays,
        sessionsTotal: trajectory.recent_sessions.length,
        sessionsReturned: sessions.length,
        sessionsTruncated: trajectory.recent_sessions.length > sessionLimit,
        recentSessions: sessions.map((session) => ({
          startAt: session.start_time,
          startAtIso: toIsoOrNull(session.start_time),
          durationSeconds: session.duration,
          page: session.page,
          totalPages: session.total_pages,
        })),
      });
    }
  );

  server.registerTool(
    "list_progress_records",
    {
      title: "Sync records",
      description:
        "Read sync positions for documents. Pass `document` for an exact lookup of where one " +
        "file stopped, or `search` for a case-insensitive path fragment. Without either it " +
        "lists the most recently synced records, newest first. `progressPercent` is 0 to 100.",
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: z.object({
        document: z
          .string()
          .min(1)
          .optional()
          .describe("Exact document identifier, usually the file path or a hash"),
        search: z.string().optional().describe("Case-insensitive fragment of the document id"),
        limit: z.number().int().min(1).max(100).optional().describe("Page size, default 20"),
        offset: z.number().int().min(0).optional().describe("Records to skip, default 0"),
      }),
      outputSchema: progressOutput,
    },
    async (args) => {
      if (args.document && args.search) {
        return toolError("invalid_argument", "Pass either document or search, not both.");
      }

      const limit = args.limit ?? 20;
      const offset = args.offset ?? 0;
      const mapRow = (
        row: {
          document?: string;
          progress: string;
          percentage: number;
          device: string;
          device_id: string;
          timestamp: number;
        },
        document: string = row.document ?? ""
      ) => ({
        document,
        progress: row.progress,
        progressPercent: Math.round(Number(row.percentage) * 10000) / 100,
        device: row.device,
        deviceId: row.device_id || null,
        timestamp: row.timestamp,
        timestampIso: toIsoOrNull(row.timestamp),
      });

      if (args.document) {
        const row = await getLatestProgressByDocument(db, user.userId, args.document);
        return textResult({
          mode: "document",
          offset: 0,
          limit: 1,
          total: row ? 1 : 0,
          returned: row ? 1 : 0,
          hasMore: false,
          records: row ? [mapRow(row, args.document)] : [],
        });
      }

      if (!args.search) {
        const rows = await listProgressRecordsByUser(db, user.userId, limit, offset);
        const summary = await getProgressSummaryByUser(db, user.userId);
        const total = summary?.total_records ?? rows.length;
        return textResult({
          mode: "list",
          offset,
          limit,
          total,
          returned: rows.length,
          hasMore: offset + rows.length < total,
          records: rows.map((row) => mapRow(row)),
        });
      }

      const search = args.search.trim();
      const total = await countProgressRecordsByUserSearch(db, user.userId, search);
      const rows = await listProgressRecordsByUserSearch(db, user.userId, search, limit, offset);
      return textResult({
        mode: "search",
        offset,
        limit,
        total,
        returned: rows.length,
        hasMore: offset + rows.length < total,
        records: rows.map((row) => mapRow(row)),
      });
    }
  );

  server.registerTool(
    "get_reading_activity",
    {
      title: "Reading activity calendar",
      description:
        "Get the reading calendar: per-day minutes in the requested window, lifetime active " +
        "days and streaks, plus an all-time 24-hour distribution. Filter with `year` to keep a " +
        "single year of daily rows; without it only the last 365 days are returned. Lifetime " +
        "fields always cover the full history. `timezone_offset_hours` shifts hour buckets only, " +
        "it does not move dates.",
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: z.object({
        year: z.number().int().min(1970).max(9999).optional().describe("Only return days in this year"),
        timezone_offset_hours: z
          .number()
          .int()
          .min(-14)
          .max(14)
          .optional()
          .describe("Whole hour offset applied to hour buckets, default 0"),
      }),
      outputSchema: readingActivityOutput,
    },
    async (args) => {
      const timezone = serverTimeZone();
      const prefix = args.year === undefined ? null : String(args.year) + "-";
      const cutoff = prefix ? null : dateKeyDaysAgo(365);
      const daysWindow = prefix
        ? { from: `${args.year}-01-01`, to: `${args.year}-12-31` }
        : { from: cutoff, to: serverDateKey() };
      const { found, summary } = await loadSummary(db, user.userId);

      if (!found || !summary) {
        return textResult({
          hasData: false,
          timezone,
          years: [],
          filterYear: args.year ?? null,
          daysWindow,
          lifetimeActiveDays: 0,
          lifetimeCurrentStreak: 0,
          lifetimeLongestStreak: 0,
          windowTotalMinutes: 0,
          windowMonthlyTotals: [],
          allTimeHourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({ hour, minutes: 0 })),
          days: [],
        });
      }

      const daily = summary.daily ?? {};
      const days = Object.entries(daily)
        .filter(([date]) => (prefix ? date.startsWith(prefix) : cutoff !== null && date >= cutoff))
        .map(([date, minutes]) => ({ date, minutes }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const streaks = computeReadingStreaks(daily, serverDateKey());
      const hourlyDistribution = computeHourlyDistribution(summary, args.timezone_offset_hours ?? 0);

      const years: number[] = [];
      for (const date of Object.keys(daily)) {
        const value = Number(date.slice(0, 4));
        if (Number.isInteger(value) && !years.includes(value)) years.push(value);
      }
      years.sort();

      const monthlyTotals = new Map<string, number>();
      for (const day of days) {
        const month = day.date.slice(0, 7);
        monthlyTotals.set(month, (monthlyTotals.get(month) ?? 0) + day.minutes);
      }

      return textResult({
        hasData: true,
        timezone,
        years,
        filterYear: args.year ?? null,
        daysWindow,
        lifetimeActiveDays: streaks.activeDays,
        lifetimeCurrentStreak: streaks.currentStreak,
        lifetimeLongestStreak: streaks.longestStreak,
        windowTotalMinutes: days.reduce((sum, day) => sum + day.minutes, 0),
        windowMonthlyTotals: Array.from(monthlyTotals.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([month, minutes]) => ({ month, minutes })),
        allTimeHourlyDistribution: hourlyDistribution.map((minutes, hour) => ({ hour, minutes })),
        days,
      });
    }
  );

  server.registerTool(
    "get_activity_breakdown",
    {
      title: "Activity breakdown",
      description:
        "Break reading down by book for one day or one month. Pass `date` for a single day, or " +
        "`year` and `month` for the month. Each book reports a `days` array whose entries carry " +
        "`date`, `minutes` and `hours`. Dates use the server's timezone.",
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: z.object({
        date: z
          .string()
          .optional()
          .describe("Day in YYYY-MM-DD format, used for a single-day breakdown"),
        year: z.number().int().min(1970).max(9999).optional().describe("Four digit year, used with month"),
        month: z.number().int().min(1).max(12).optional().describe("Month number 1 to 12, used with year"),
        limit: z.number().int().min(1).max(100).optional().describe("Maximum books to return, default 50"),
      }),
      outputSchema: activityBreakdownOutput,
    },
    async ({ date, year, month, limit: limitArg }) => {
      const hasMonthArgs = year !== undefined || month !== undefined;
      if (date !== undefined && hasMonthArgs) {
        return toolError("invalid_argument", "Pass either date or year and month, not both.");
      }
      if (date === undefined && (year === undefined || month === undefined)) {
        return toolError("invalid_argument", "Pass `date` for one day, or both `year` and `month` for a month.");
      }
      if (date !== undefined && !isValidDateKey(date)) {
        return toolError("invalid_argument", `"${date}" is not a valid YYYY-MM-DD date.`);
      }

      const scope = date !== undefined ? "day" : "month";
      const scopeFields = date !== undefined ? { date } : { year: Number(year), month: Number(month) };
      const timezone = serverTimeZone();
      const limit = limitArg ?? 50;
      const { found, summary } = await loadSummary(db, user.userId);

      if (!found || !summary) {
        return textResult({
          hasData: false,
          scope,
          ...scopeFields,
          timezone,
          totalMinutes: 0,
          total: 0,
          returned: 0,
          hasMore: false,
          books: [],
        });
      }

      const books: Array<{
        md5: string;
        title: string;
        authors: string;
        minutes: number;
        days: Array<{
          date: string;
          minutes: number;
          hours: Array<{ hour: number; minutes: number }>;
        }>;
      }> = [];
      let totalMinutes = 0;

      for (const book of Object.values(summary.books)) {
        if (date !== undefined) {
          const buckets = book.days?.[date];
          if (!buckets) continue;
          const minutes = sumHourBuckets(buckets);
          if (minutes <= 0) continue;
          totalMinutes += minutes;
          books.push({
            md5: book.md5,
            title: book.title,
            authors: book.authors,
            minutes,
            days: [{ date, minutes, hours: hourEntries(buckets) }],
          });
          continue;
        }

        const monthPrefix = `${Number(year)}-${String(Number(month)).padStart(2, "0")}-`;
        const { minutes, days: dayMap } = sumBookMinutesForMonth(book, monthPrefix);
        if (minutes <= 0) continue;
        const days = Object.entries(dayMap)
          .map(([dayDate, buckets]) => ({
            date: dayDate,
            minutes: sumHourBuckets(buckets),
            hours: hourEntries(buckets),
          }))
          .filter((entry) => entry.minutes > 0)
          .sort((a, b) => a.date.localeCompare(b.date));
        if (days.length === 0) continue;
        totalMinutes += minutes;
        books.push({
          md5: book.md5,
          title: book.title,
          authors: book.authors,
          minutes,
          days,
        });
      }

      books.sort((a, b) => b.minutes - a.minutes);
      return textResult({
        hasData: true,
        scope,
        ...scopeFields,
        timezone,
        totalMinutes,
        total: books.length,
        returned: Math.min(books.length, limit),
        hasMore: books.length > limit,
        books: books.slice(0, limit),
      });
    }
  );

  return server;
}
