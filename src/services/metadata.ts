const MAX_METADATA_BYTES = 8192;
const MAX_METADATA_FIELD_BYTES = 512;
const utf8Encoder = new TextEncoder();

function truncateUtf8(value: string, maxBytes: number): string {
  const source = value.length > maxBytes * 4 ? value.slice(0, maxBytes * 4) : value;
  if (utf8Encoder.encode(source).length <= maxBytes) return source;
  let result = "";
  let used = 0;
  for (const char of source) {
    const charBytes = utf8Encoder.encode(char).length;
    if (used + charBytes > maxBytes) break;
    result += char;
    used += charBytes;
  }
  return result;
}

export function normalizeProgressMetadata(value: unknown): string | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const metadata: Record<string, string> = {};
  for (const key of ["filename", "title", "authors"] as const) {
    const field = source[key];
    if (typeof field === "string") {
      const trimmed = field.trim();
      if (trimmed.length > 0) {
        metadata[key] = truncateUtf8(trimmed, MAX_METADATA_FIELD_BYTES);
      }
    }
  }
  if (Object.keys(metadata).length === 0) return null;
  const json = JSON.stringify(metadata);
  return utf8Encoder.encode(json).length <= MAX_METADATA_BYTES ? json : null;
}

export function parseProgressMetadata(
  value: string | null | undefined
): Record<string, string> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const source = parsed as Record<string, unknown>;
    const metadata: Record<string, string> = {};
    for (const key of ["filename", "title", "authors"] as const) {
      const field = source[key];
      if (typeof field === "string") {
        const trimmed = field.trim();
        if (trimmed.length > 0) {
          metadata[key] = truncateUtf8(trimmed, MAX_METADATA_FIELD_BYTES);
        }
      }
    }
    return Object.keys(metadata).length > 0 ? metadata : null;
  } catch {
    return null;
  }
}
