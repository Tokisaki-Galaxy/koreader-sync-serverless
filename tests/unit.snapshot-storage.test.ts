import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getStatisticsSnapshot,
  getStatisticsSnapshotMeta,
  loadStatisticsSnapshotJson,
  loadStatisticsSummaryJson,
  updateStatisticsSummary,
  upsertStatisticsSnapshot,
} from "../src/db";
import { getStatisticsWithSummary, STATISTICS_SUMMARY_VERSION } from "../src/services/statistics";
import type { DatabaseAdapter } from "../src/database/adapter";
import { createSqliteDatabaseAdapter } from "../src/node/sqlite";
import { runMigrations } from "../src/migrations";
import { MIGRATIONS } from "../src/migrations-bundle";

const SMALL_SNAPSHOT = JSON.stringify({
  books: [
    {
      md5: "a".repeat(32),
      title: "Small Book",
      page_stat_data: [{ page: 1, start_time: 1700000000, duration: 60, total_pages: 100 }],
    },
  ],
});

const LARGE_SNAPSHOT_MD5 = "b".repeat(32);

const LARGE_SNAPSHOT = JSON.stringify({
  books: [
    {
      md5: LARGE_SNAPSHOT_MD5,
      title: "书".repeat(250000),
      page_stat_data: [{ page: 1, start_time: 1700000000, duration: 60, total_pages: 100 }],
    },
  ],
});

describe("statistics snapshot storage", () => {
  let dir: string;
  let db: DatabaseAdapter;
  let userId: number;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "koreader-sync-chunks-"));
    db = createSqliteDatabaseAdapter(join(dir, "test.db"));
    await runMigrations(db, MIGRATIONS);
    const result = await db
      .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .bind("chunkuser", "hash")
      .run();
    expect(result.meta.changes).toBe(1);
    userId = 1;
  });

  afterEach(() => {
    db.close?.();
    rmSync(dir, { recursive: true, force: true });
  });

  async function chunkCount(kind: "snapshot" | "summary" = "snapshot"): Promise<number> {
    const row = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM statistics_snapshot_chunk WHERE user_id = ? AND kind = ?"
      )
      .bind(userId, kind)
      .first<{ count: number }>();
    return Number(row?.count ?? 0);
  }

  it("keeps a small snapshot inline", async () => {
    await upsertStatisticsSnapshot(db, userId, 20221111, "Kindle", "k-1", SMALL_SNAPSHOT, null);

    const meta = await getStatisticsSnapshotMeta(db, userId);
    expect(meta?.snapshot_json).toBe(SMALL_SNAPSHOT);
    expect(await chunkCount()).toBe(0);

    const loaded = await getStatisticsSnapshot(db, userId);
    expect(loaded?.snapshot_json).toBe(SMALL_SNAPSHOT);
  });

  it("splits a large snapshot across chunk rows and reassembles it", async () => {
    await upsertStatisticsSnapshot(db, userId, 20221111, "Kindle", "k-1", LARGE_SNAPSHOT, null);

    const meta = await getStatisticsSnapshotMeta(db, userId);
    expect(meta?.snapshot_json).toBe("");
    expect(await chunkCount("snapshot")).toBeGreaterThan(1);

    const loaded = await getStatisticsSnapshot(db, userId);
    expect(loaded?.snapshot_json).toBe(LARGE_SNAPSHOT);
    expect(await loadStatisticsSnapshotJson(db, userId)).toBe(LARGE_SNAPSHOT);
  });

  it("replaces chunk rows when the snapshot shrinks", async () => {
    await upsertStatisticsSnapshot(db, userId, 20221111, "Kindle", "k-1", LARGE_SNAPSHOT, null);
    expect(await chunkCount()).toBeGreaterThan(1);

    await upsertStatisticsSnapshot(db, userId, 20221111, "Kindle", "k-1", SMALL_SNAPSHOT, null);
    expect(await chunkCount()).toBe(0);
    expect((await getStatisticsSnapshot(db, userId))?.snapshot_json).toBe(SMALL_SNAPSHOT);
  });

  it("falls back to a legacy inline row without chunks", async () => {
    await db
      .prepare(
        `INSERT INTO statistics_snapshot
          (user_id, schema_version, device, device_id, snapshot_json, statistics_summary_json)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(userId, 20221111, "Legacy", "legacy-1", SMALL_SNAPSHOT, null)
      .run();

    const loaded = await getStatisticsSnapshot(db, userId);
    expect(loaded?.snapshot_json).toBe(SMALL_SNAPSHOT);
    expect(await chunkCount()).toBe(0);
  });

  it("updates the cached summary without rewriting chunks", async () => {
    await upsertStatisticsSnapshot(db, userId, 20221111, "Kindle", "k-1", LARGE_SNAPSHOT, null);
    const before = await chunkCount();

    await updateStatisticsSummary(db, userId, '{"version":2}');

    const meta = await getStatisticsSnapshotMeta(db, userId);
    expect(meta?.statistics_summary_json).toBe('{"version":2}');
    expect(await chunkCount()).toBe(before);
    expect((await getStatisticsSnapshot(db, userId))?.snapshot_json).toBe(LARGE_SNAPSHOT);
  });

  it("rebuilds a stale summary from chunked storage", async () => {
    await upsertStatisticsSnapshot(
      db,
      userId,
      20221111,
      "Kindle",
      "k-1",
      LARGE_SNAPSHOT,
      JSON.stringify({ version: 1, daily: {}, books: {} })
    );

    const result = await getStatisticsWithSummary(db, userId);
    expect(result?.summary?.version).toBe(STATISTICS_SUMMARY_VERSION);
    expect(result?.summary?.books[LARGE_SNAPSHOT_MD5]).toBeDefined();

    const meta = await getStatisticsSnapshotMeta(db, userId);
    const summaryJson = await loadStatisticsSummaryJson(db, userId, meta);
    expect(JSON.parse(summaryJson ?? "{}").version).toBe(STATISTICS_SUMMARY_VERSION);
    expect(await chunkCount("summary")).toBeGreaterThan(0);
    expect((await getStatisticsSnapshot(db, userId))?.snapshot_json).toBe(LARGE_SNAPSHOT);
  });

  it("chunks an oversized summary so the metadata row stays small", async () => {
    const bigTitle = "书".repeat(250000);
    await upsertStatisticsSnapshot(db, userId, 20221111, "Kindle", "k-1", SMALL_SNAPSHOT, null);

    const bigSummary = JSON.stringify({
      version: STATISTICS_SUMMARY_VERSION,
      daily: {},
      books: {
        [LARGE_SNAPSHOT_MD5]: {
          md5: LARGE_SNAPSHOT_MD5,
          title: bigTitle,
          authors: "Author",
          notes: 0,
          last_open: 1700000000,
          highlights: 0,
          pages: 100,
          series: "",
          language: "en",
          total_read_time: 60,
          total_read_pages: 1,
          days: {},
        },
      },
    });
    expect(new TextEncoder().encode(bigSummary).length).toBeGreaterThan(512 * 1024);

    await updateStatisticsSummary(db, userId, bigSummary);

    const meta = await getStatisticsSnapshotMeta(db, userId);
    expect(meta?.statistics_summary_json).toBe("");
    expect(await chunkCount("summary")).toBeGreaterThan(1);
    expect(await loadStatisticsSummaryJson(db, userId)).toBe(bigSummary);

    const result = await getStatisticsWithSummary(db, userId);
    expect(result?.summary?.books[LARGE_SNAPSHOT_MD5].title).toBe(bigTitle);
  });
});
