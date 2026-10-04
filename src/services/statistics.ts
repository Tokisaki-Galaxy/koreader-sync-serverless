import type { DatabaseAdapter } from "../database/adapter";
import { getStatisticsSnapshot, upsertStatisticsSnapshot } from "../db";
import type { StatisticsBookRow, StatisticsPageStatRow, StatisticsSnapshot } from "../types";

export interface StatisticsBookSummary {
  md5: string;
  title: string;
  authors: string;
  notes: number;
  last_open: number;
  highlights: number;
  pages: number;
  series: string;
  language: string;
  total_read_time: number;
  total_read_pages: number;
  days: Record<string, Record<string, number>>;
}

export interface StatisticsSummary {
  version: 1;
  daily: Record<string, number>;
  books: Record<string, StatisticsBookSummary>;
}

export interface StatisticsRowWithSummary {
  schema_version: number;
  device: string;
  device_id: string;
  summary: StatisticsSummary | null;
}

export function numberOrZero(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function normalizePageStatData(value: unknown): StatisticsPageStatRow[] {
  if (!Array.isArray(value)) return [];
  const rows: StatisticsPageStatRow[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const { page, start_time, duration, total_pages, ...rest } = record;
    const normalizedPage = page == null ? null : Number(page);
    const normalizedStartTime = Number(start_time);
    const normalizedDuration = Number(duration);
    const normalizedTotalPages = Number(total_pages);
    if (
      !Number.isFinite(normalizedStartTime) ||
      !Number.isFinite(normalizedDuration) ||
      !Number.isFinite(normalizedTotalPages)
    ) {
      continue;
    }
    rows.push({
      ...rest,
      page: normalizedPage == null || !Number.isFinite(normalizedPage) ? null : normalizedPage,
      start_time: normalizedStartTime,
      duration: normalizedDuration,
      total_pages: normalizedTotalPages,
    });
  }
  return rows;
}

export function normalizeBook(value: unknown): StatisticsBookRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const { md5, page_stat_data, ...rest } = row;
  const md5Value = typeof md5 === "string" ? md5.trim() : "";
  if (!md5Value) return null;
  return {
    ...rest,
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
    page_stat_data: normalizePageStatData(page_stat_data),
  };
}

export function parseSnapshotFromJson(value: string): StatisticsSnapshot | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const booksRaw = (parsed as Record<string, unknown>).books;
    const books: unknown[] = Array.isArray(booksRaw) ? booksRaw : [];
    const normalizedBooks = books.map(normalizeBook).filter((row): row is StatisticsBookRow => row !== null);
    return { books: normalizedBooks };
  } catch {
    return null;
  }
}

export function buildStatisticsSummary(snapshot: StatisticsSnapshot): StatisticsSummary {
  const daily: Record<string, number> = {};
  const books: Record<string, StatisticsBookSummary> = {};
  for (const book of snapshot.books ?? []) {
    const days: Record<string, Record<string, number>> = {};
    for (const stat of book.page_stat_data ?? []) {
      const startTime = Number(stat.start_time);
      const duration = Number(stat.duration);
      if (!Number.isFinite(startTime) || !Number.isFinite(duration) || duration <= 0) continue;
      const d = new Date(startTime * 1000);
      const dateKey =
        d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const hour = String(d.getHours());
      const mins = Math.round(duration / 60);
      if (!days[dateKey]) days[dateKey] = {};
      days[dateKey][hour] = (days[dateKey][hour] || 0) + mins;
      daily[dateKey] = (daily[dateKey] || 0) + mins;
    }
    books[book.md5] = {
      md5: book.md5,
      title: book.title,
      authors: book.authors,
      notes: numberOrZero(book.notes),
      last_open: numberOrZero(book.last_open),
      highlights: numberOrZero(book.highlights),
      pages: numberOrZero(book.pages),
      series: book.series,
      language: book.language,
      total_read_time: numberOrZero(book.total_read_time),
      total_read_pages: numberOrZero(book.total_read_pages),
      days,
    };
  }
  return { version: 1, daily, books };
}

export function parseStatisticsSummary(value: string | null | undefined): StatisticsSummary | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    if (record.version !== 1 || typeof record.daily !== "object" || typeof record.books !== "object") return null;
    return parsed as StatisticsSummary;
  } catch {
    return null;
  }
}

function dedupePageStats(rows: StatisticsPageStatRow[]): StatisticsPageStatRow[] {
  const map = new Map<string, StatisticsPageStatRow>();
  for (const row of rows) {
    const key = JSON.stringify([row.page, row.start_time, row.duration, row.total_pages]);
    map.set(key, row);
  }
  return Array.from(map.values());
}

function mergeUnknownFields(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...existing };
  for (const [key, incomingValue] of Object.entries(incoming)) {
    const existingValue = merged[key];
    if (incomingValue === undefined || incomingValue === null) continue;
    if (typeof incomingValue === "string") {
      if (incomingValue.trim() === "") continue;
      merged[key] = incomingValue;
      continue;
    }
    if (
      Array.isArray(incomingValue) &&
      incomingValue.length === 0 &&
      Array.isArray(existingValue) &&
      existingValue.length > 0
    ) {
      continue;
    }
    merged[key] = incomingValue;
  }
  return merged;
}

function mergeBooks(existing: StatisticsBookRow, incoming: StatisticsBookRow): StatisticsBookRow {
  const {
    page_stat_data: existingPageStats,
    md5: existingMd5,
    title: existingTitle,
    authors: existingAuthors,
    notes: existingNotes,
    last_open: existingLastOpen,
    highlights: existingHighlights,
    pages: existingPages,
    series: existingSeries,
    language: existingLanguage,
    total_read_time: existingTotalReadTime,
    total_read_pages: existingTotalReadPages,
    ...existingRest
  } = existing;
  const {
    page_stat_data: incomingPageStats,
    md5: incomingMd5,
    title: incomingTitle,
    authors: incomingAuthors,
    notes: incomingNotes,
    last_open: incomingLastOpen,
    highlights: incomingHighlights,
    pages: incomingPages,
    series: incomingSeries,
    language: incomingLanguage,
    total_read_time: incomingTotalReadTime,
    total_read_pages: incomingTotalReadPages,
    ...incomingRest
  } = incoming;
  const unknownFields = mergeUnknownFields(existingRest, incomingRest);
  return {
    ...unknownFields,
    md5: existingMd5,
    title: incomingTitle || existingTitle,
    authors: incomingAuthors || existingAuthors,
    notes: Math.max(existingNotes, incomingNotes),
    last_open: Math.max(existingLastOpen, incomingLastOpen),
    highlights: Math.max(existingHighlights, incomingHighlights),
    pages: Math.max(existingPages, incomingPages),
    series: incomingSeries || existingSeries,
    language: incomingLanguage || existingLanguage,
    total_read_time: Math.max(existingTotalReadTime, incomingTotalReadTime),
    total_read_pages: Math.max(existingTotalReadPages, incomingTotalReadPages),
    page_stat_data: dedupePageStats([...existingPageStats, ...incomingPageStats]),
  };
}

export function mergeSnapshots(
  existing: StatisticsSnapshot | null,
  incoming: StatisticsSnapshot
): StatisticsSnapshot {
  const merged = new Map<string, StatisticsBookRow>();
  for (const book of existing?.books ?? []) {
    merged.set(book.md5, book);
  }
  for (const book of incoming.books) {
    const current = merged.get(book.md5);
    merged.set(book.md5, current ? mergeBooks(current, book) : book);
  }
  return {
    books: Array.from(merged.values()).sort((a, b) => a.md5.localeCompare(b.md5)),
  };
}

export interface ReadingStreaks {
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
}

export function computeReadingStreaks(
  daily: Record<string, number> | string[],
  todayRef?: string | Date
): ReadingStreaks {
  // Support both Record<string, number> and string[]
  let activeDates: string[];
  if (Array.isArray(daily)) {
    activeDates = daily.slice().sort();
  } else {
    activeDates = Object.entries(daily)
      .filter(([_, mins]) => Number(mins) > 0)
      .map(([date]) => date)
      .sort();
  }

  const activeDays = activeDates.length;
  if (activeDays === 0) {
    return { currentStreak: 0, longestStreak: 0, activeDays: 0 };
  }

  // Helper to parse "YYYY-MM-DD" to UTC day timestamp (in integer days)
  const parseDayNumber = (dStr: string): number => {
    const [y, m, d] = dStr.split("-").map(Number);
    return Math.round(Date.UTC(y, m - 1, d) / 86400000);
  };

  const dayNumbers = Array.from(new Set(activeDates.map(parseDayNumber))).sort((a, b) => a - b);

  let longestStreak = 0;
  let currentRun = 0;
  let prevDay: number | null = null;

  for (const day of dayNumbers) {
    if (prevDay === null || day === prevDay + 1) {
      currentRun++;
    } else {
      currentRun = 1;
    }
    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
    prevDay = day;
  }

  // Calculate current streak
  // Reference date: default to today in UTC or provided date/string
  let targetDayNumber: number;
  if (todayRef instanceof Date) {
    targetDayNumber = Math.round(
      Date.UTC(todayRef.getUTCFullYear(), todayRef.getUTCMonth(), todayRef.getUTCDate()) / 86400000
    );
  } else if (typeof todayRef === "string") {
    targetDayNumber = parseDayNumber(todayRef);
  } else {
    const now = new Date();
    targetDayNumber = Math.round(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86400000
    );
  }

  const activeDaySet = new Set(dayNumbers);
  let currentStreak = 0;

  if (activeDaySet.has(targetDayNumber)) {
    // Today is active: count backwards from today
    let checkDay = targetDayNumber;
    while (activeDaySet.has(checkDay)) {
      currentStreak++;
      checkDay--;
    }
  } else if (activeDaySet.has(targetDayNumber - 1)) {
    // Today is not active, but yesterday was active: count backwards from yesterday
    let checkDay = targetDayNumber - 1;
    while (activeDaySet.has(checkDay)) {
      currentStreak++;
      checkDay--;
    }
  } else {
    currentStreak = 0;
  }

  return { currentStreak, longestStreak, activeDays };
}

export function computeHourlyDistribution(
  summary: StatisticsSummary | null | undefined
): number[] {
  const distribution = new Array<number>(24).fill(0);
  if (!summary || !summary.books) return distribution;

  for (const book of Object.values(summary.books)) {
    if (!book.days) continue;
    for (const hours of Object.values(book.days)) {
      for (const [hourKey, mins] of Object.entries(hours)) {
        const hour = Number(hourKey);
        if (Number.isInteger(hour) && hour >= 0 && hour < 24) {
          distribution[hour] += Number(mins) || 0;
        }
      }
    }
  }

  return distribution;
}

export async function getStatisticsWithSummary(
  db: DatabaseAdapter,
  userId: number
): Promise<StatisticsRowWithSummary | null> {
  const row = await getStatisticsSnapshot(db, userId);
  if (!row) return null;

  let summary = parseStatisticsSummary(row.statistics_summary_json);
  if (summary === null) {
    const snapshot = parseSnapshotFromJson(row.snapshot_json);
    if (snapshot) {
      summary = buildStatisticsSummary(snapshot);
      try {
        await upsertStatisticsSnapshot(
          db,
          userId,
          row.schema_version,
          row.device,
          row.device_id,
          row.snapshot_json,
          JSON.stringify(summary)
        );
      } catch {
        // Non-fatal: the backfill is retried on the next read.
      }
    }
  }

  return {
    schema_version: row.schema_version,
    device: row.device,
    device_id: row.device_id,
    summary,
  };
}
