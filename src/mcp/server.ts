import * as z from "zod";
import { McpServer } from "@modelcontextprotocol/server";
import {
  getLatestProgressByDocument,
  getProgressSummaryByUser,
  getStatisticsSnapshot,
  listDeviceUsageByUser,
  listProgressRecordsByUser,
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

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function textResult(payload: unknown): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
  };
}

function errorResult(message: string, extra?: unknown): ToolResult {
  const text = extra === undefined ? message : `${message}\n\n${JSON.stringify(extra, null, 2)}`;
  return { content: [{ type: "text", text }], isError: true };
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
        "unless the field name says `Minutes`. Calendar dates are the dates recorded by the " +
        "device that produced the statistics, so they reflect the reader's local day.",
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
    },
    async () => {
      const progress = await getProgressSummaryByUser(db, user.userId);
      const devices = await listDeviceUsageByUser(db, user.userId);
      const { found, summary, schemaVersion, device, deviceId } = await loadSummary(db, user.userId);
      const books = summary ? Object.values(summary.books) : [];
      const totals = computeReadingTotals(books);
      const daily = summary?.daily ?? {};
      const streaks = computeReadingStreaks(daily);

      return textResult({
        username: user.username,
        hasStatistics: found,
        statisticsSource: found ? { schemaVersion, device, deviceId } : null,
        sync: {
          documents: progress?.total_documents ?? 0,
          progressRecords: progress?.total_records ?? 0,
          devices: progress?.total_devices ?? 0,
          activeDays: progress?.active_days ?? 0,
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
          activeDays: streaks.activeDays,
          currentStreak: streaks.currentStreak,
          longestStreak: streaks.longestStreak,
        },
        devices: devices ?? [],
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
        "completed, reading, unread. Sort by read_time, last_open, pages, or progress.",
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
    },
    async (args) => {
      const { found, summary } = await loadSummary(db, user.userId);
      if (!found || !summary) {
        return errorResult("No reading statistics have been synced for this account yet.");
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
        total: books.length,
        offset,
        limit,
        returned: page.length,
        books: page.map(toBookListItem),
      });
    }
  );

  server.registerTool(
    "get_book_details",
    {
      title: "Book details",
      description:
        "Get one book's reading trajectory: progress, pages read, reading speed, per-day " +
        "history, and the most recent reading sessions. Pass either the md5 or a title. When " +
        "a title is ambiguous the tool returns the candidate list instead of guessing.",
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: z.object({
        md5: z.string().optional().describe("Book md5 as shown by list_books"),
        title: z.string().optional().describe("Book title or author, used when md5 is absent"),
        recent_sessions_limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .optional()
          .describe("How many recent reading sessions to include, default 20"),
      }),
    },
    async (args) => {
      const row = await getStatisticsSnapshot(db, user.userId);
      const snapshot = row ? parseSnapshotFromJson(row.snapshot_json) : null;
      if (!snapshot) {
        return errorResult("No reading statistics have been synced for this account yet.");
      }

      let book = null;
      if (args.md5) {
        const needle = args.md5.trim().toLowerCase();
        book = snapshot.books.find((item) => (item.md5 || "").toLowerCase() === needle) ?? null;
        if (!book) return errorResult(`No book found for md5 "${args.md5}".`);
      } else if (args.title) {
        const summary = (await loadSummary(db, user.userId)).summary;
        if (!summary) return errorResult("No reading statistics have been synced for this account yet.");
        const { matches } = findBookByTitle(summary, args.title);
        if (matches.length === 0) {
          return errorResult(`No book matched title "${args.title}".`);
        }
        if (matches.length > 1) {
          return errorResult(
            `Title "${args.title}" matched ${matches.length} books. Retry with one of these md5 values.`,
            matches.slice(0, 20).map((item) => ({ md5: item.md5, title: item.title, authors: item.authors }))
          );
        }
        book = snapshot.books.find((item) => item.md5 === matches[0].md5) ?? null;
      } else {
        return errorResult("Provide either md5 or title.");
      }

      if (!book) return errorResult("Book not found in the statistics snapshot.");

      const trajectory = computeBookTrajectory(book);
      const sessionLimit = args.recent_sessions_limit ?? 20;

      return textResult({
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
        dailyHistory: trajectory.daily_history,
        recentSessions: trajectory.recent_sessions.slice(0, sessionLimit).map((session) => ({
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
    "get_document_progress",
    {
      title: "Document sync progress",
      description:
        "Get the latest sync position for one document, including the raw KOReader progress " +
        "string, percentage, device and timestamp. Useful for answering where the user stopped " +
        "in a specific file.",
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: z.object({
        document: z
          .string()
          .min(1)
          .describe("Document identifier exactly as stored, usually the file path or a hash"),
      }),
    },
    async ({ document }) => {
      const row = await getLatestProgressByDocument(db, user.userId, document);
      if (!row) {
        return textResult({ document, found: false, progress: null });
      }
      return textResult({
        document,
        found: true,
        progress: row.progress,
        percentage: row.percentage,
        device: row.device,
        deviceId: row.device_id || null,
        timestamp: row.timestamp,
        timestampIso: toIsoOrNull(row.timestamp),
      });
    }
  );

  server.registerTool(
    "list_progress_records",
    {
      title: "List sync records",
      description:
        "List the most recently synced document positions, newest first. Filter with `search` " +
        "to match a document path fragment.",
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: z.object({
        search: z.string().optional().describe("Case-insensitive fragment of the document id"),
        limit: z.number().int().min(1).max(100).optional().describe("Page size, default 20"),
        offset: z.number().int().min(0).optional().describe("Records to skip, default 0"),
      }),
    },
    async (args) => {
      const limit = args.limit ?? 20;
      const offset = args.offset ?? 0;
      const fetchSize = args.search ? Math.min(1000, offset + limit * 10) : limit;

      if (!args.search) {
        const rows = await listProgressRecordsByUser(db, user.userId, limit, offset);
        return textResult({
          offset,
          limit,
          returned: rows.length,
          records: rows.map((row) => ({
            document: row.document,
            progress: row.progress,
            percentage: row.percentage,
            device: row.device,
            deviceId: row.device_id || null,
            timestamp: row.timestamp,
            timestampIso: toIsoOrNull(row.timestamp),
          })),
        });
      }

      const needle = args.search.trim().toLowerCase();
      const rows = await listProgressRecordsByUser(db, user.userId, fetchSize, 0);
      const matched = rows.filter((row) => row.document.toLowerCase().includes(needle));
      const page = matched.slice(offset, offset + limit);
      return textResult({
        offset,
        limit,
        totalMatched: matched.length,
        returned: page.length,
        records: page.map((row) => ({
          document: row.document,
          progress: row.progress,
          percentage: row.percentage,
          device: row.device,
          deviceId: row.device_id || null,
          timestamp: row.timestamp,
          timestampIso: toIsoOrNull(row.timestamp),
        })),
      });
    }
  );

  server.registerTool(
    "get_reading_activity",
    {
      title: "Reading activity calendar",
      description:
        "Get per-day reading minutes, active day counts, current and longest streaks, plus a " +
        "24-hour distribution. Filter with `year` to keep a single year of daily data. " +
        "`timezone_offset_hours` shifts the hourly distribution, for example 8 for UTC+8.",
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: z.object({
        year: z.number().int().min(1970).max(9999).optional().describe("Only return days in this year"),
        timezone_offset_hours: z
          .number()
          .min(-14)
          .max(14)
          .optional()
          .describe("Offset applied to the hourly distribution, default 0"),
      }),
    },
    async (args) => {
      const { found, summary } = await loadSummary(db, user.userId);
      if (!found || !summary) {
        return errorResult("No reading statistics have been synced for this account yet.");
      }

      const daily = summary.daily ?? {};
      const prefix = args.year === undefined ? null : String(args.year) + "-";
      const days = Object.entries(daily)
        .filter(([date]) => (prefix ? date.startsWith(prefix) : true))
        .map(([date, minutes]) => ({ date, minutes }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const streaks = computeReadingStreaks(daily);
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
        years,
        filterYear: args.year ?? null,
        activeDays: streaks.activeDays,
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
        totalMinutes: days.reduce((sum, day) => sum + day.minutes, 0),
        monthlyTotals: Array.from(monthlyTotals.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([month, minutes]) => ({ month, minutes })),
        hourlyDistribution: hourlyDistribution.map((minutes, hour) => ({ hour, minutes })),
        days,
      });
    }
  );

  server.registerTool(
    "get_month_activity",
    {
      title: "Monthly reading breakdown",
      description:
        "Break a single month's reading down by book, with each book's minutes and per-day " +
        "hour buckets for that month.",
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: z.object({
        year: z.number().int().min(1970).max(9999).describe("Four digit year"),
        month: z.number().int().min(1).max(12).describe("Month number, 1 to 12"),
      }),
    },
    async ({ year, month }) => {
      const { found, summary } = await loadSummary(db, user.userId);
      if (!found || !summary) {
        return errorResult("No reading statistics have been synced for this account yet.");
      }

      const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
      const books: Array<{
        md5: string;
        title: string;
        authors: string;
        minutes: number;
        days: Record<string, Record<string, number>>;
      }> = [];
      let totalMinutes = 0;

      for (const book of Object.values(summary.books)) {
        const { minutes, days } = sumBookMinutesForMonth(book, monthPrefix);
        if (minutes <= 0) continue;
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
      return textResult({ year, month, totalMinutes, books });
    }
  );

  return server;
}
