import type { StatisticsBookRow, StatisticsSnapshot } from "../types";
import { numberOrZero } from "./statistics";

// ---------------------------------------------------------------------------
// Single source of truth for the SQLite schemas used by the user data
// export/import feature. The schema SQL is served to the browser via
// GET /web/export/db-format so that generation happens client-side (keeps
// Worker CPU usage within the free-tier 10ms budget).
// ---------------------------------------------------------------------------

// Official KOReader reading-statistics database (statistics.sqlite3), schema
// version 20221111. Copied verbatim from koreader/koreader
// plugins/statistics.koplugin/main.lua (createDB + page_stat view).
export const OFFICIAL_STATISTICS_DB_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS book
    (
        id integer PRIMARY KEY autoincrement,
        title text,
        authors text,
        notes      integer,
        last_open  integer,
        highlights integer,
        pages      integer,
        series text,
        language text,
        md5 text,
        total_read_time  integer,
        total_read_pages integer
    );
CREATE UNIQUE INDEX IF NOT EXISTS book_title_authors_md5 ON book(title, authors, md5);

CREATE TABLE IF NOT EXISTS page_stat_data
    (
        id_book     integer,
        page        integer NOT NULL DEFAULT 0,
        start_time  integer NOT NULL DEFAULT 0,
        duration    integer NOT NULL DEFAULT 0,
        total_pages integer NOT NULL DEFAULT 0,
        UNIQUE (id_book, page, start_time),
        FOREIGN KEY(id_book) REFERENCES book(id)
    );
CREATE INDEX IF NOT EXISTS page_stat_data_start_time ON page_stat_data(start_time);

CREATE TABLE IF NOT EXISTS numbers
    (
        number INTEGER PRIMARY KEY
    );
    WITH RECURSIVE counter AS
    (
        SELECT 1 as N UNION ALL
        SELECT N + 1 FROM counter WHERE N < 1000
    )
    INSERT OR IGNORE INTO numbers SELECT N AS number FROM counter;

CREATE VIEW IF NOT EXISTS page_stat AS
    SELECT id_book, first_page + idx - 1 AS page, start_time, duration / (last_page - first_page + 1) AS duration
    FROM (
        SELECT id_book, page, total_pages, pages, start_time, duration,
            ((page - 1) * pages) / total_pages + 1 AS first_page,
            max(((page - 1) * pages) / total_pages + 1, (page * pages) / total_pages) AS last_page,
            idx
        FROM page_stat_data
        JOIN book ON book.id = id_book
        JOIN (SELECT number as idx FROM numbers) AS N ON idx <= (last_page - first_page + 1)
    );

PRAGMA user_version = 20221111;
`;

// Custom progress database (progress.db). Official KOReader has no unified
// progress DB (progress lives per-book in .sdr/metadata.lua), so we define
// this schema for single-user backup/restore.
export const PROGRESS_DB_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users
    (
        id integer PRIMARY KEY autoincrement,
        username text,
        created_at integer
    );
CREATE TABLE IF NOT EXISTS progress
    (
        id integer PRIMARY KEY autoincrement,
        user_id integer NOT NULL,
        document text NOT NULL,
        progress text NOT NULL,
        percentage real NOT NULL,
        device text NOT NULL,
        device_id text NOT NULL,
        timestamp integer NOT NULL,
        updated_at integer NOT NULL,
        UNIQUE (user_id, document)
    );
CREATE INDEX IF NOT EXISTS idx_progress_user_timestamp ON progress (user_id, timestamp DESC);
`;

export interface DbFormatPayload {
  statisticsSchemaSql: string;
  progressSchemaSql: string;
}

export function getDbFormatPayload(): DbFormatPayload {
  return {
    statisticsSchemaSql: OFFICIAL_STATISTICS_DB_SCHEMA_SQL,
    progressSchemaSql: PROGRESS_DB_SCHEMA_SQL,
  };
}

// ---------------------------------------------------------------------------
// Mapping between the service data model and the SQLite row formats.
// These pure functions are unit-tested and reused by the import route.
// ---------------------------------------------------------------------------

export interface BookDbRow {
  id: number;
  title: string;
  authors: string;
  notes: number;
  last_open: number;
  highlights: number;
  pages: number;
  series: string;
  language: string;
  md5: string;
  total_read_time: number;
  total_read_pages: number;
}

export interface PageStatDataDbRow {
  id_book: number;
  page: number | null;
  start_time: number;
  duration: number;
  total_pages: number;
}

export interface StatisticsDbData {
  books: BookDbRow[];
  pageStatData: PageStatDataDbRow[];
}

export interface ProgressDbRow {
  user_id: number;
  document: string;
  progress: string;
  percentage: number;
  device: string;
  device_id: string;
  timestamp: number;
  updated_at: number;
}

export interface ProgressUserDbRow {
  id: number;
  username: string;
  created_at: number;
}

export interface ProgressDbData {
  users: ProgressUserDbRow[];
  progress: ProgressDbRow[];
}

export interface ServiceProgressRow {
  document: string;
  progress: string;
  percentage: number;
  device: string;
  device_id: string;
  timestamp: number;
  updated_at: number;
}

// Map a service statistics snapshot into official book / page_stat_data rows.
export function snapshotToStatisticsDbRows(snapshot: StatisticsSnapshot): StatisticsDbData {
  const books: BookDbRow[] = [];
  const pageStatData: PageStatDataDbRow[] = [];
  for (let i = 0; i < (snapshot.books ?? []).length; i++) {
    const book = snapshot.books[i];
    const id = i + 1;
    books.push({
      id,
      title: book.title ?? "",
      authors: book.authors ?? "",
      notes: numberOrZero(book.notes),
      last_open: numberOrZero(book.last_open),
      highlights: numberOrZero(book.highlights),
      pages: numberOrZero(book.pages),
      series: book.series ?? "",
      language: book.language ?? "",
      md5: book.md5,
      total_read_time: numberOrZero(book.total_read_time),
      total_read_pages: numberOrZero(book.total_read_pages),
    });
    for (const stat of book.page_stat_data ?? []) {
      pageStatData.push({
        id_book: id,
        page: stat.page == null ? null : Number(stat.page),
        start_time: numberOrZero(stat.start_time),
        duration: numberOrZero(stat.duration),
        total_pages: numberOrZero(stat.total_pages),
      });
    }
  }
  return { books, pageStatData };
}

// Reverse: official book / page_stat_data rows back into a service snapshot.
export function statisticsDbRowsToSnapshot(data: StatisticsDbData): StatisticsSnapshot {
  const books: StatisticsBookRow[] = [];
  for (const book of data.books ?? []) {
    const pageStatData = (data.pageStatData ?? [])
      .filter((row) => row.id_book === book.id)
      .map((row) => ({
        page: row.page,
        start_time: row.start_time,
        duration: row.duration,
        total_pages: row.total_pages,
      }));
    books.push({
      md5: book.md5 ?? "",
      title: book.title ?? "",
      authors: book.authors ?? "",
      notes: numberOrZero(book.notes),
      last_open: numberOrZero(book.last_open),
      highlights: numberOrZero(book.highlights),
      pages: numberOrZero(book.pages),
      series: book.series ?? "",
      language: book.language ?? "",
      total_read_time: numberOrZero(book.total_read_time),
      total_read_pages: numberOrZero(book.total_read_pages),
      page_stat_data: pageStatData,
    });
  }
  return { books };
}

// Map service progress rows into the custom progress.db layout.
export function progressRowsToProgressDbData(
  username: string,
  createdAt: number,
  rows: ServiceProgressRow[]
): ProgressDbData {
  return {
    users: [{ id: 1, username, created_at: createdAt }],
    progress: rows.map((row) => ({
      user_id: 1,
      document: row.document,
      progress: row.progress,
      percentage: numberOrZero(row.percentage),
      device: row.device,
      device_id: row.device_id,
      timestamp: numberOrZero(row.timestamp),
      updated_at: numberOrZero(row.updated_at),
    })),
  };
}

// Reverse: progress.db rows (user_id ignored) back into service progress rows.
export function progressDbDataToProgressRows(data: { progress?: ProgressDbRow[] }): ServiceProgressRow[] {
  return (data.progress ?? []).map((row) => ({
    document: row.document,
    progress: row.progress,
    percentage: numberOrZero(row.percentage),
    device: row.device,
    device_id: row.device_id,
    timestamp: numberOrZero(row.timestamp),
    updated_at: numberOrZero(row.updated_at) || numberOrZero(row.timestamp),
  }));
}
