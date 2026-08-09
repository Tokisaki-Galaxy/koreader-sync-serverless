import { describe, expect, it } from "vitest";
import { buildStatisticsSummary, parseStatisticsSummary } from "../src/services/statistics";
import type { StatisticsSnapshot } from "../src/types";

function snapshotWithPageStats(books: Array<{ md5: string; page_stat_data: Array<{ start_time: number; duration: number }> }>): StatisticsSnapshot {
  return {
    books: books.map((b) => ({
      md5: b.md5,
      title: "T",
      authors: "",
      notes: 0,
      last_open: 0,
      highlights: 0,
      pages: 1,
      series: "",
      language: "",
      total_read_time: 0,
      total_read_pages: 0,
      page_stat_data: b.page_stat_data.map((s, i) => ({ page: i + 1, start_time: s.start_time, duration: s.duration, total_pages: 1 })),
    })),
  };
}

describe("buildStatisticsSummary", () => {
  it("aggregates daily and per-book per-day per-hour minutes with rounding", () => {
    const base = new Date(2024, 0, 5, 10, 30, 0);
    const t1 = Math.floor(base.getTime() / 1000);
    const t2 = t1 + 3600;

    const snapshot = snapshotWithPageStats([
      {
        md5: "abc",
        page_stat_data: [
          { start_time: t1, duration: 61 },
          { start_time: t1 + 90, duration: 59 },
          { start_time: t2, duration: 120 },
        ],
      },
      {
        md5: "def",
        page_stat_data: [{ start_time: t2, duration: 30 }],
      },
    ]);

    const summary = buildStatisticsSummary(snapshot);

    // 61 -> 1, 59 -> 1, 120 -> 2, 30 -> 1
    expect(summary.daily["2024-01-05"]).toBe(5);

    expect(summary.books.abc.days["2024-01-05"]["10"]).toBe(2);
    expect(summary.books.abc.days["2024-01-05"]["11"]).toBe(2);
    expect(summary.books.def.days["2024-01-05"]["11"]).toBe(1);
  });

  it("ignores invalid page stat entries", () => {
    const base = new Date(2024, 0, 5, 10, 30, 0);
    const t1 = Math.floor(base.getTime() / 1000);

    const snapshot = snapshotWithPageStats([
      {
        md5: "abc",
        page_stat_data: [
          { start_time: NaN, duration: 10 },
          { start_time: t1, duration: 0 },
          { start_time: t1, duration: -5 },
        ],
      },
    ]);

    const summary = buildStatisticsSummary(snapshot);
    expect(Object.keys(summary.daily)).toHaveLength(0);
    expect(Object.keys(summary.books.abc.days)).toHaveLength(0);
  });

  it("carries book metadata into the summary", () => {
    const snapshot: StatisticsSnapshot = {
      books: [
        {
          md5: "abc",
          title: "Book A",
          authors: "X",
          notes: 3,
          last_open: 42,
          highlights: 7,
          pages: 300,
          series: "S1",
          language: "en",
          total_read_time: 120,
          total_read_pages: 60,
          page_stat_data: [],
        },
      ],
    };
    const summary = buildStatisticsSummary(snapshot);
    expect(summary.books.abc).toMatchObject({
      md5: "abc",
      title: "Book A",
      authors: "X",
      notes: 3,
      last_open: 42,
      highlights: 7,
      pages: 300,
      series: "S1",
      language: "en",
      total_read_time: 120,
      total_read_pages: 60,
    });
  });
});

describe("parseStatisticsSummary", () => {
  it("round-trips through JSON and rejects invalid input", () => {
    const snapshot = snapshotWithPageStats([]);
    const summary = buildStatisticsSummary(snapshot);

    expect(parseStatisticsSummary(JSON.stringify(summary))).toEqual(summary);
    expect(parseStatisticsSummary(null)).toBeNull();
    expect(parseStatisticsSummary(undefined)).toBeNull();
    expect(parseStatisticsSummary("")).toBeNull();
    expect(parseStatisticsSummary("{bad json")).toBeNull();
    expect(parseStatisticsSummary(JSON.stringify({ version: 2, daily: {}, books: {} }))).toBeNull();
  });
});
