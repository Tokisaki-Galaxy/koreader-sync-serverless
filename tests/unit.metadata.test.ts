import { describe, expect, it } from "vitest";
import { normalizeProgressMetadata, parseProgressMetadata } from "../src/services/metadata";

describe("progress metadata", () => {
  it("keeps only known string fields", () => {
    const raw = normalizeProgressMetadata({
      filename: "book.epub",
      title: "Book",
      authors: "Author",
      ignored: "value",
    });
    expect(raw).not.toBeNull();
    expect(JSON.parse(String(raw))).toEqual({
      filename: "book.epub",
      title: "Book",
      authors: "Author",
    });
  });

  it("rejects non-string and empty fields", () => {
    expect(normalizeProgressMetadata({ title: { nested: true } })).toBeNull();
    expect(normalizeProgressMetadata({ title: "   " })).toBeNull();
    expect(normalizeProgressMetadata({})).toBeNull();
    expect(normalizeProgressMetadata("not an object")).toBeNull();
  });

  it("caps long fields by bytes", () => {
    const raw = normalizeProgressMetadata({ title: "书".repeat(300) });
    const parsed = JSON.parse(String(raw));
    expect(new TextEncoder().encode(parsed.title).length).toBeLessThanOrEqual(512);
    expect(parsed.title).toBe("书".repeat(170));
  });

  it("parses stored metadata safely", () => {
    expect(parseProgressMetadata('{"title":"Book","authors":"Author"}')).toEqual({
      title: "Book",
      authors: "Author",
    });
    expect(parseProgressMetadata('{"title":{"nested":true}}')).toBeNull();
    expect(parseProgressMetadata("not json")).toBeNull();
    expect(parseProgressMetadata(null)).toBeNull();
  });
});
