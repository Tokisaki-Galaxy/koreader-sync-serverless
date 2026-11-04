import { describe, expect, it } from "vitest";
import { upsertStatisticsSnapshot } from "../src/db";
import { createMockEnv } from "./helpers/mock-db";

type MockDatabase = {
  prepare(sql: string): { bind(...values: unknown[]): unknown };
  batch(statements: unknown[]): Promise<unknown>;
  getChunkCount(userId: number, kind: string): number;
};

function mockDb(userId: number) {
  const env = createMockEnv();
  const db = env.DB as unknown as MockDatabase;
  return { env, db, userId };
}

const CHUNK_INSERT =
  "INSERT INTO statistics_snapshot_chunk (user_id, kind, chunk_index, data) VALUES (?, ?, ?, ?)";

describe("mock D1 batch", () => {
  it("rolls back every statement when one fails", async () => {
    const { env, db, userId } = mockDb(1);
    const largeSnapshot = JSON.stringify({
      books: [{ md5: "a".repeat(32), title: "x".repeat(600000), page_stat_data: [] }],
    });
    await upsertStatisticsSnapshot(env.DB, userId, 20221111, "Kindle", "k-1", largeSnapshot, null);
    const before = db.getChunkCount(userId, "snapshot");
    expect(before).toBeGreaterThan(0);

    await expect(
      db.batch([
        db.prepare(CHUNK_INSERT).bind(userId, "snapshot", 999, "stale"),
        db.prepare("THIS IS NOT VALID SQL").bind(),
      ])
    ).rejects.toThrow();

    expect(db.getChunkCount(userId, "snapshot")).toBe(before);
  });

  it("rejects a chunk row above the D1 row limit and rolls back", async () => {
    const { env, db, userId } = mockDb(1);
    const largeSnapshot = JSON.stringify({
      books: [{ md5: "a".repeat(32), title: "x".repeat(600000), page_stat_data: [] }],
    });
    await upsertStatisticsSnapshot(env.DB, userId, 20221111, "Kindle", "k-1", largeSnapshot, null);
    const before = db.getChunkCount(userId, "snapshot");

    await expect(
      db.batch([db.prepare(CHUNK_INSERT).bind(userId, "snapshot", 999, "a".repeat(2_000_001))])
    ).rejects.toThrow(/row size limit/);

    expect(db.getChunkCount(userId, "snapshot")).toBe(before);
  });
});
