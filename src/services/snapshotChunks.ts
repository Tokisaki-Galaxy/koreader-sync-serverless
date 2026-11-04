// Splits the serialized statistics snapshot into D1-safe rows. A single D1 row
// cannot exceed 2 MB, so the JSON is cut on UTF-8 code point boundaries and
// stored in several chunk rows. Chunks are concatenated before parsing.
// The input is expected to be `JSON.stringify` output; that escapes lone
// surrogates, so every chunk round-trips exactly.
export const SNAPSHOT_CHUNK_BYTES = 512 * 1024;

// Upper bound for a merged statistics snapshot. This keeps the read path well
// below D1's 50 MB query result limit and Worker memory limits while leaving
// plenty of headroom over the 5 MB payloads seen in practice.
export const MAX_SNAPSHOT_BYTES = 8 * 1024 * 1024;

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

export function snapshotByteLength(value: string): number {
  return utf8Encoder.encode(value).length;
}

export function splitSnapshotJson(
  value: string,
  maxBytes: number = SNAPSHOT_CHUNK_BYTES
): string[] {
  if (!Number.isInteger(maxBytes) || maxBytes < 4) {
    throw new Error("maxBytes must be an integer of at least 4");
  }
  const bytes = utf8Encoder.encode(value);
  if (bytes.length <= maxBytes) return [value];

  const chunks: string[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    let end = Math.min(offset + maxBytes, bytes.length);
    if (end < bytes.length) {
      // Never cut inside a multi-byte UTF-8 sequence.
      while (end > offset + 1 && (bytes[end] & 0xc0) === 0x80) {
        end--;
      }
    }
    chunks.push(utf8Decoder.decode(bytes.subarray(offset, end)));
    offset = end;
  }
  return chunks;
}

export function joinSnapshotChunks(chunks: string[]): string {
  return chunks.join("");
}
