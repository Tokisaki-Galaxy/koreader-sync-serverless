import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import initSqlJs from "sql.js";
import type { Database, SqlJsStatic } from "sql.js";
import {
  getDbFormatPayload,
  OFFICIAL_STATISTICS_DB_SCHEMA_SQL,
  PROGRESS_DB_SCHEMA_SQL,
  progressDbDataToProgressRows,
  progressRowsToProgressDbData,
  snapshotToStatisticsDbRows,
  statisticsDbRowsToSnapshot,
  type BookDbRow,
  type PageStatDataDbRow,
} from "../src/services/dbformat";
import type { StatisticsBookRow, StatisticsSnapshot } from "../src/types";

let sqlPromise: Promise<SqlJsStatic> | null = null;
function getSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = initSqlJs();
  }
  return sqlPromise;
}

const sampleBooks: StatisticsBookRow[] = [
  {
    md5: "abc123",
    title: "Alice in Wonderland",
    authors: "Lewis Carroll",
    notes: 2,
    last_open: 1710000000,
    highlights: 5,
    pages: 320,
    series: "Classics #1",
    language: "en",
    total_read_time: 3600,
    total_read_pages: 88,
    page_stat_data: [
      { page: 12, start_time: 1710000100, duration: 24, total_pages: 320 },
      { page: 13, start_time: 1710000200, duration: 40, total_pages: 320 },
    ],
  },
  {
    md5: "def456",
    title: "The Great Gatsby",
    authors: "F. Scott Fitzgerald",
    notes: 0,
    last_open: 1710100000,
    highlights: 1,
    pages: 180,
    series: "",
    language: "en",
    total_read_time: 1200,
    total_read_pages: 30,
    page_stat_data: [
      { page: 5, start_time: 1710100100, duration: 15, total_pages: 180 },
    ],
  },
];

function readTable(db: Database, sql: string): Array<Record<string, unknown>> {
  const res = db.exec(sql);
  if (!res.length) return [];
  const { columns, values } = res[0];
  return values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, idx) => (obj[col] = row[idx]));
    return obj;
  });
}

describe("dbformat schemas", () => {
  it("official statistics schema executes and sets user_version", async () => {
    const SQL = await getSql();
    const db = new SQL.Database();
    db.run(OFFICIAL_STATISTICS_DB_SCHEMA_SQL);
    const version = readTable(db, "PRAGMA user_version");
    expect(Number(version[0]?.user_version)).toBe(20221111);
    const tables = readTable(db, "SELECT name FROM sqlite_master WHERE type IN ('table','view') ORDER BY name");
    const names = tables.map((r) => r.name);
    expect(names).toContain("book");
    expect(names).toContain("page_stat_data");
    expect(names).toContain("page_stat");
    expect(names).toContain("numbers");
    // page_stat view must be queryable (empty result set is fine)
    expect(() => db.exec("SELECT * FROM page_stat LIMIT 1")).not.toThrow();
    db.close();
  });

  it("official statistics schema is idempotent (safe to re-run)", async () => {
    const SQL = await getSql();
    const db = new SQL.Database();
    // Running the full schema twice must not throw (numbers table reseed uses
    // INSERT OR IGNORE so the PRIMARY KEY never conflicts).
    expect(() => {
      db.run(OFFICIAL_STATISTICS_DB_SCHEMA_SQL);
      db.run(OFFICIAL_STATISTICS_DB_SCHEMA_SQL);
    }).not.toThrow();
    const numbers = readTable(db, "SELECT count(*) AS c FROM numbers");
    expect(Number(numbers[0]?.c)).toBe(1000);
    db.close();
  });

  it("progress schema executes with users/progress tables", async () => {
    const SQL = await getSql();
    const db = new SQL.Database();
    db.run(PROGRESS_DB_SCHEMA_SQL);
    const tables = readTable(db, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    const names = tables.map((r) => r.name);
    expect(names).toContain("users");
    expect(names).toContain("progress");
    db.close();
  });

  it("getDbFormatPayload returns both schemas", () => {
    const payload = getDbFormatPayload();
    expect(payload.statisticsSchemaSql).toContain("CREATE TABLE");
    expect(payload.progressSchemaSql).toContain("CREATE TABLE");
  });
});

describe("statistics snapshot <-> official db rows", () => {
  it("maps snapshot to book/page_stat_data rows and back", () => {
    const snapshot: StatisticsSnapshot = { books: sampleBooks };
    const dbData = snapshotToStatisticsDbRows(snapshot);

    expect(dbData.books).toHaveLength(2);
    expect(dbData.books[0]).toMatchObject({
      id: 1,
      title: "Alice in Wonderland",
      authors: "Lewis Carroll",
      md5: "abc123",
      total_read_time: 3600,
      total_read_pages: 88,
    });
    expect(dbData.pageStatData).toHaveLength(3);
    expect(dbData.pageStatData[0]).toMatchObject({ id_book: 1, page: 12 });
    expect(dbData.pageStatData[2]).toMatchObject({ id_book: 2, page: 5 });

    const roundTrip = statisticsDbRowsToSnapshot(dbData);
    expect(roundTrip.books).toHaveLength(2);
    expect(roundTrip.books[0].md5).toBe("abc123");
    expect(roundTrip.books[0].page_stat_data).toHaveLength(2);
    expect(roundTrip.books[1].page_stat_data).toHaveLength(1);
    expect(roundTrip.books[0].total_read_pages).toBe(88);
  });

  it("attaches page stats by exact id_book even with id gaps", () => {
    // Real KOReader DBs can have deleted books, leaving id gaps (e.g. 3, 7).
    const dbData: StatisticsDbData = {
      books: [
        { id: 3, title: "B1", authors: "A", notes: 0, last_open: 1, highlights: 0, pages: 100, series: "", language: "en", md5: "m1", total_read_time: 10, total_read_pages: 5 },
        { id: 7, title: "B2", authors: "A", notes: 0, last_open: 1, highlights: 0, pages: 50, series: "", language: "en", md5: "m2", total_read_time: 4, total_read_pages: 2 },
      ],
      pageStatData: [
        { id_book: 3, page: 1, start_time: 1, duration: 10, total_pages: 100 },
        { id_book: 7, page: 2, start_time: 2, duration: 20, total_pages: 50 },
      ],
    };

    const snapshot = statisticsDbRowsToSnapshot(dbData);
    expect(snapshot.books).toHaveLength(2);
    const b1 = snapshot.books.find((b) => b.md5 === "m1");
    const b2 = snapshot.books.find((b) => b.md5 === "m2");
    expect(b1?.page_stat_data).toHaveLength(1);
    expect(b1?.page_stat_data[0].page).toBe(1);
    expect(b2?.page_stat_data).toHaveLength(1);
    expect(b2?.page_stat_data[0].page).toBe(2);
  });

  it("statistics round-trips through a real sql.js database", async () => {
    const SQL = await getSql();
    const db = new SQL.Database();
    db.run(OFFICIAL_STATISTICS_DB_SCHEMA_SQL);

    const { books, pageStatData } = snapshotToStatisticsDbRows({ books: sampleBooks });

    const insertBook = db.prepare(
      "INSERT INTO book (title, authors, notes, last_open, highlights, pages, series, language, md5, total_read_time, total_read_pages) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
    );
    const insertStat = db.prepare(
      "INSERT INTO page_stat_data (id_book, page, start_time, duration, total_pages) VALUES (?,?,?,?,?)"
    );
    db.run("BEGIN TRANSACTION;");
    for (const book of books) {
      insertBook.run([book.title, book.authors, book.notes, book.last_open, book.highlights, book.pages, book.series, book.language, book.md5, book.total_read_time, book.total_read_pages]);
    }
    for (const stat of pageStatData) {
      insertStat.run([stat.id_book, stat.page, stat.start_time, stat.duration, stat.total_pages]);
    }
    db.run("COMMIT;");

    const exported = db.export();
    db.close();

    const db2 = new SQL.Database(exported);
    const readBooks = readTable(db2, "SELECT id, title, authors, notes, last_open, highlights, pages, series, language, md5, total_read_time, total_read_pages FROM book ORDER BY id");
    const readStats = readTable(db2, "SELECT id_book, page, start_time, duration, total_pages FROM page_stat_data ORDER BY id_book, start_time");
    db2.close();

    const converted = statisticsDbRowsToSnapshot({
      books: readBooks.map((r) => ({
        id: Number(r.id),
        title: String(r.title ?? ""),
        authors: String(r.authors ?? ""),
        notes: Number(r.notes ?? 0),
        last_open: Number(r.last_open ?? 0),
        highlights: Number(r.highlights ?? 0),
        pages: Number(r.pages ?? 0),
        series: String(r.series ?? ""),
        language: String(r.language ?? ""),
        md5: String(r.md5 ?? ""),
        total_read_time: Number(r.total_read_time ?? 0),
        total_read_pages: Number(r.total_read_pages ?? 0),
      })) as BookDbRow[],
      pageStatData: readStats.map((r) => ({
        id_book: Number(r.id_book),
        page: r.page == null ? null : Number(r.page),
        start_time: Number(r.start_time),
        duration: Number(r.duration),
        total_pages: Number(r.total_pages),
      })) as PageStatDataDbRow[],
    });

    expect(converted.books).toHaveLength(2);
    expect(converted.books[0].title).toBe("Alice in Wonderland");
    expect(converted.books[0].page_stat_data.map((s) => s.duration)).toEqual([24, 40]);
    expect(converted.books[1].page_stat_data).toHaveLength(1);
  });
});

describe("progress rows <-> progress.db", () => {
  const sampleProgress = [
    {
      document: "doc-1",
      progress: "page:10",
      percentage: 23.5,
      device: "kobo",
      device_id: "device-a",
      timestamp: 1710000000,
      updated_at: 1710000100,
    },
    {
      document: "doc-2",
      progress: "page:50",
      percentage: 60,
      device: "kindle",
      device_id: "device-b",
      timestamp: 1710000200,
      updated_at: 1710000200,
    },
  ];

  it("maps progress rows to db rows and back", () => {
    const dbData = progressRowsToProgressDbData("reader", 1700000000, sampleProgress);
    expect(dbData.users).toEqual([{ id: 1, username: "reader", created_at: 1700000000 }]);
    expect(dbData.progress).toHaveLength(2);
    expect(dbData.progress[0]).toMatchObject({ user_id: 1, document: "doc-1", percentage: 23.5 });

    const rows = progressDbDataToProgressRows(dbData);
    expect(rows).toHaveLength(2);
    expect(rows[0].document).toBe("doc-1");
    expect(rows[1].device).toBe("kindle");
    expect(rows[1].updated_at).toBe(1710000200);
  });

  it("round-trips through a real sql.js database", async () => {
    const SQL = await getSql();
    const db = new SQL.Database();
    db.run(PROGRESS_DB_SCHEMA_SQL);

    const { users, progress } = progressRowsToProgressDbData("reader", 1700000000, sampleProgress);
    db.run("INSERT INTO users (id, username, created_at) VALUES (?,?,?)", [users[0].id, users[0].username, users[0].created_at]);
    const insert = db.prepare(
      "INSERT INTO progress (user_id, document, progress, percentage, device, device_id, timestamp, updated_at) VALUES (?,?,?,?,?,?,?,?)"
    );
    db.run("BEGIN TRANSACTION;");
    for (const row of progress) {
      insert.run([row.user_id, row.document, row.progress, row.percentage, row.device, row.device_id, row.timestamp, row.updated_at]);
    }
    db.run("COMMIT;");

    const exported = db.export();
    db.close();

    const db2 = new SQL.Database(exported);
    const readProgress = readTable(db2, "SELECT document, progress, percentage, device, device_id, timestamp, updated_at FROM progress ORDER BY timestamp");
    db2.close();

    const converted = progressDbDataToProgressRows({ progress: readProgress });
    expect(converted).toHaveLength(2);
    expect(converted[0]).toMatchObject({ document: "doc-1", percentage: 23.5 });
    expect(converted[1]).toMatchObject({ document: "doc-2", device_id: "device-b" });
  });

  it("handles missing updated_at by falling back to timestamp", () => {
    const rows = progressDbDataToProgressRows({
      progress: [
        {
          user_id: 1,
          document: "doc-x",
          progress: "p",
          percentage: 10,
          device: "d",
          device_id: "id",
          timestamp: 1234,
          updated_at: 0,
        },
      ],
    });
    expect(rows[0].updated_at).toBe(1234);
  });
});

// ---------------------------------------------------------------------------
// End-to-end check of the client-side exporter contract: the vendored
// sql-wasm.js source (served from /assets/sql-wasm.js) must expose a global
// initSqlJs when executed like a classic browser script, and the served wasm
// must produce a valid SQLite database in the official KOReader schema.
// ---------------------------------------------------------------------------

describe("vendored browser assets", () => {
  it("vendored sql-wasm.js.txt exposes initSqlJs as a global function", () => {
    const source = readVendoredSqlJs();
    expect(source).toContain("var initSqlJs = function");
    // Classic script semantics: no exports/module/define in scope.
    const fn = new Function(source + "\nreturn typeof initSqlJs;");
    expect(fn()).toBe("function");
  });

  it("generates a valid official statistics.sqlite3 via the vendored source + real wasm", async () => {
    const SQL = await loadBrowserSqlJs();
    const db = new SQL.Database();
    db.run(OFFICIAL_STATISTICS_DB_SCHEMA_SQL);
    db.run("PRAGMA user_version;");

    const { books, pageStatData } = snapshotToStatisticsDbRows({ books: sampleBooks });
    const insertBook = db.prepare(
      "INSERT INTO book (title, authors, notes, last_open, highlights, pages, series, language, md5, total_read_time, total_read_pages) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
    );
    const insertStat = db.prepare(
      "INSERT INTO page_stat_data (id_book, page, start_time, duration, total_pages) VALUES (?,?,?,?,?)"
    );
    for (const book of books) {
      insertBook.run([book.title, book.authors, book.notes, book.last_open, book.highlights, book.pages, book.series, book.language, book.md5, book.total_read_time, book.total_read_pages]);
    }
    for (const stat of pageStatData) {
      insertStat.run([stat.id_book, stat.page, stat.start_time, stat.duration, stat.total_pages]);
    }

    const exported = db.export();
    db.close();

    // The exported bytes must be a real SQLite file readable by sql.js again.
    const db2 = new SQL.Database(exported);
    const version = readTable(db2, "PRAGMA user_version");
    expect(Number(version[0]?.user_version)).toBe(20221111);
    const bookCount = readTable(db2, "SELECT count(*) AS c FROM book");
    expect(Number(bookCount[0]?.c)).toBe(2);
    db2.close();
  });
});

function readVendoredSqlJs(): string {
  const here = fileURLToPath(import.meta.url);
  const vendorPath = here.replace(/tests[\\/]unit\.dbformat\.test\.ts$/, "src/vendor/sql-wasm.js.txt");
  return readFileSync(vendorPath, "utf8");
}

let browserSqlPromise: Promise<Database> | null = null;
async function loadBrowserSqlJs(): Promise<Database> {
  if (!browserSqlPromise) {
    const wasmPath = fileURLToPath(import.meta.url).replace(
      /tests[\\/]unit\.dbformat\.test\.ts$/,
      "node_modules/sql.js/dist/sql-wasm.wasm"
    );
    const wasm = readFileSync(wasmPath);
    const source = readVendoredSqlJs();
    const { createContext, runInContext } = await import("node:vm");

    const sandbox: Record<string, unknown> = {
      fetch: async (url: string) => {
        if (String(url).endsWith(".wasm")) {
          return {
            ok: true,
            arrayBuffer: () =>
              Promise.resolve(
                wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength)
              ),
          };
        }
        throw new Error("unexpected fetch: " + url);
      },
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      atob,
      btoa,
      TextDecoder,
      TextEncoder,
      performance: { now: () => Date.now() },
      crypto: {},
      console,
    };
    sandbox.window = sandbox;
    createContext(sandbox);
    runInContext(source, sandbox, { filename: "sql-wasm.js" });
    const init = sandbox.initSqlJs as (config: unknown) => Promise<Database>;
    browserSqlPromise = init({
      locateFile: (f: string) => "https://example.com/" + f,
    });
  }
  return browserSqlPromise;
}
