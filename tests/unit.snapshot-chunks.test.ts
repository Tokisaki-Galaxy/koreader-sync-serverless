import { describe, expect, it } from "vitest";
import {
  SNAPSHOT_CHUNK_BYTES,
  joinSnapshotChunks,
  snapshotByteLength,
  splitSnapshotJson,
} from "../src/services/snapshotChunks";

describe("snapshot chunks", () => {
  it("keeps a small payload in one chunk", () => {
    const value = JSON.stringify({ books: [] });
    expect(splitSnapshotJson(value)).toEqual([value]);
  });

  it("splits a large payload into bounded chunks", () => {
    const value = JSON.stringify({
      books: Array.from({ length: 4000 }, (_, index) => ({
        md5: String(index).padStart(32, "0"),
        title: "Book " + index,
        page_stat_data: [{ page: 1, start_time: 1700000000 + index, duration: 45, total_pages: 300 }],
      })),
    });
    expect(snapshotByteLength(value)).toBeGreaterThan(SNAPSHOT_CHUNK_BYTES);

    const chunks = splitSnapshotJson(value);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(snapshotByteLength(chunk)).toBeLessThanOrEqual(SNAPSHOT_CHUNK_BYTES);
    }
    expect(joinSnapshotChunks(chunks)).toBe(value);
  });

  it("never cuts a multi-byte character in half", () => {
    const value = "书".repeat(5000) + "😀".repeat(2000) + "plain ascii";
    const chunks = splitSnapshotJson(value, 4);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk).not.toContain("\uFFFD");
    }
    expect(joinSnapshotChunks(chunks)).toBe(value);
  });

  it("handles an empty payload", () => {
    expect(splitSnapshotJson("")).toEqual([""]);
  });

  it("rejects a chunk size that cannot hold one code point", () => {
    expect(() => splitSnapshotJson("abc", 3)).toThrow();
    expect(() => splitSnapshotJson("abc", 0)).toThrow();
  });
});
