import { Hono } from "hono";
import {
  createUser,
  getLatestProgressByDocument,
  getStatisticsSnapshot,
  upsertProgress,
  upsertStatisticsSnapshot,
} from "../db";
import { md5 } from "js-md5";
import { hashPassword } from "../crypto";
import { authKoreader, isValidField, isValidKeyField } from "../services/auth";
import { badRequest, parsePbkdf2Iterations } from "../services/common";
import type {
  Env,
  ProgressUpdateRequest,
  RegisterRequest,
  StatisticsBookRow,
  StatisticsPageStatRow,
  StatisticsSnapshot,
} from "../types";

const router = new Hono<{ Bindings: Env }>();
const INVALID_REQUEST_MESSAGE = "Invalid request";
const DOCUMENT_MISSING_MESSAGE = "Field 'document' not provided.";
const UNAUTHORIZED_MESSAGE = "Unauthorized";
const REGISTRATION_DISABLED_MESSAGE = "User registration is disabled.";
const INVALID_SNAPSHOT_MESSAGE = "Invalid statistics snapshot payload";

function logError(c: any, label: string, error: unknown) {
  const isDebug = c.env.DEBUG === "1" || c.env.DEBUG === "true";
  if (isDebug) {
    console.error(`[DEBUG ERROR] ${label}:`, error);
    if (error instanceof Error && error.cause) {
      console.error(`[DEBUG CAUSE] ${label}:`, error.cause);
    }
  }
}

function isRegistrationEnabled(env: Env): boolean {
  const flag = env.ENABLE_USER_REGISTRATION;
  if (flag === undefined) return true;
  return flag === "true" || flag === "1";
}

function normalizePageStatData(value: unknown): StatisticsPageStatRow[] {
  if (!Array.isArray(value)) return [];
  const rows: StatisticsPageStatRow[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const page = record.page == null ? null : Number(record.page);
    const start_time = Number(record.start_time);
    const duration = Number(record.duration);
    const total_pages = Number(record.total_pages);
    if (!Number.isFinite(start_time) || !Number.isFinite(duration) || !Number.isFinite(total_pages)) {
      continue;
    }
    rows.push({
      page: page == null || !Number.isFinite(page) ? null : page,
      start_time,
      duration,
      total_pages,
    });
  }
  return rows;
}

function numberOrZero(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeBook(value: unknown): StatisticsBookRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const md5Value = typeof row.md5 === "string" ? row.md5.trim() : "";
  if (!md5Value) return null;
  return {
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
    page_stat_data: normalizePageStatData(row.page_stat_data),
  };
}

function dedupePageStats(rows: StatisticsPageStatRow[]): StatisticsPageStatRow[] {
  const map = new Map<string, StatisticsPageStatRow>();
  for (const row of rows) {
    const key = JSON.stringify([row.page, row.start_time, row.duration, row.total_pages]);
    map.set(key, row);
  }
  return Array.from(map.values());
}

function mergeBooks(existing: StatisticsBookRow, incoming: StatisticsBookRow): StatisticsBookRow {
  return {
    md5: existing.md5,
    title: incoming.title || existing.title,
    authors: incoming.authors || existing.authors,
    notes: Math.max(existing.notes, incoming.notes),
    last_open: Math.max(existing.last_open, incoming.last_open),
    highlights: Math.max(existing.highlights, incoming.highlights),
    pages: Math.max(existing.pages, incoming.pages),
    series: incoming.series || existing.series,
    language: incoming.language || existing.language,
    total_read_time: Math.max(existing.total_read_time, incoming.total_read_time),
    total_read_pages: Math.max(existing.total_read_pages, incoming.total_read_pages),
    page_stat_data: dedupePageStats([...existing.page_stat_data, ...incoming.page_stat_data]),
  };
}

function mergeSnapshots(existing: StatisticsSnapshot | null, incoming: StatisticsSnapshot): StatisticsSnapshot {
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

function parseSnapshotFromJson(value: string): StatisticsSnapshot | null {
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

router.post("/users/create", async (c) => {
  if (!isRegistrationEnabled(c.env)) {
    return c.json({ message: REGISTRATION_DISABLED_MESSAGE }, 402);
  }

  let body: RegisterRequest;
  try {
    body = await c.req.json<RegisterRequest>();
  } catch (e) {
    logError(c, "JSON Parse Error", e);
    return badRequest("Invalid JSON body");
  }

  const { username = "", password = "" } = body;
  if (!isValidKeyField(username) || !isValidField(password)) {
    return c.json({ message: INVALID_REQUEST_MESSAGE }, 403);
  }

  try {
    const iterations = parsePbkdf2Iterations(c.env);
    const passwordHash = await hashPassword(md5(password), username, c.env.PASSWORD_PEPPER, iterations);
    await createUser(c.env, username, passwordHash);
    return c.json({ username }, 201);
  } catch (error: any) {
    logError(c, "User Creation Failed", error);

    const errorMsg = error?.message ? String(error.message).toUpperCase() : "";

    let causeMsg = "";
    if (error?.cause) {
      causeMsg = typeof error.cause === 'string'
        ? error.cause.toUpperCase()
        : (error.cause.message ? String(error.cause.message).toUpperCase() : "");
    }

    const isDuplicate = errorMsg.includes("UNIQUE") || causeMsg.includes("UNIQUE");

    if (isDuplicate) {
      return c.json({ message: "Username is already registered." }, 402);
    }

    const errMsg = (c.env.DEBUG === "1" || c.env.DEBUG === "true")
      ? `Creation failed: ${error?.message || "Unknown error"}`
      : "Username is already registered.";

    return c.json({ message: errMsg }, 402);
  }
});

router.get("/users/auth", async (c) => {
  try {
    const auth = await authKoreader(c);
    if (!auth) return c.json({ message: UNAUTHORIZED_MESSAGE }, 401);
    return c.json({ authorized: "OK" });
  } catch (error) {
    logError(c, "Auth Error", error);
    return c.json({ message: "Auth internal error" }, 500);
  }
});

router.put("/syncs/progress", async (c) => {
  const auth = await authKoreader(c).catch(e => {
    logError(c, "Auth Check Error in PUT", e);
    return null;
  });

  if (!auth) return c.json({ message: UNAUTHORIZED_MESSAGE }, 401);

  let body: ProgressUpdateRequest;
  try {
    body = await c.req.json<ProgressUpdateRequest>();
  } catch (e) {
    logError(c, "JSON Parse Error (/syncs/progress)", e);
    return badRequest("Invalid JSON body");
  }

  const { document, progress, percentage, device, device_id } = body;
  if (!isValidKeyField(document)) {
    return c.json({ message: DOCUMENT_MISSING_MESSAGE }, 403);
  }
  if (!progress || typeof percentage !== "number" || !device) {
    return c.json({ message: INVALID_REQUEST_MESSAGE }, 403);
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    await upsertProgress(c.env, auth.userId, {
      document,
      progress,
      percentage,
      device,
      device_id: device_id ?? "",
      timestamp,
    });
    return c.json({ document, timestamp });
  } catch (error) {
    logError(c, "Upsert Progress Error", error);
    return c.json({ message: "Failed to save progress" }, 500);
  }
});

router.get("/syncs/progress/:document", async (c) => {
  const auth = await authKoreader(c).catch(e => {
    logError(c, "Auth Check Error in GET", e);
    return null;
  });
  if (!auth) return c.json({ message: UNAUTHORIZED_MESSAGE }, 401);

  const document = c.req.param("document");
  if (!isValidKeyField(document)) {
    return c.json({ message: DOCUMENT_MISSING_MESSAGE }, 403);
  }

  try {
    const row = await getLatestProgressByDocument(c.env, auth.userId, document);
    // KOReader compatibility: official server always returns 200 and includes the document key.
    if (!row) return c.json({ document });

    return c.json({
      document,
      progress: row.progress,
      percentage: row.percentage,
      device: row.device,
      ...(row.device_id ? { device_id: row.device_id } : {}),
      timestamp: row.timestamp,
    });
  } catch (error) {
    logError(c, "Get Progress Error", error);
    return c.json({ message: "Failed to fetch progress" }, 500);
  }
});

router.put("/syncs/statistics", async (c) => {
  const auth = await authKoreader(c).catch((e) => {
    logError(c, "Auth Check Error in PUT /syncs/statistics", e);
    return null;
  });
  if (!auth) return c.json({ message: UNAUTHORIZED_MESSAGE }, 401);

  let body: {
    schema_version?: unknown;
    device?: unknown;
    device_id?: unknown;
    snapshot?: unknown;
  };
  try {
    body = await c.req.json();
  } catch (e) {
    logError(c, "JSON Parse Error (/syncs/statistics)", e);
    return badRequest("Invalid JSON body");
  }

  const schemaVersion = Number(body.schema_version);
  const device = typeof body.device === "string" ? body.device : "";
  const deviceId = typeof body.device_id === "string" ? body.device_id : "";
  const snapshotPayload = body.snapshot;
  if (!Number.isInteger(schemaVersion) || !device || typeof snapshotPayload !== "object" || !snapshotPayload) {
    return c.json({ message: INVALID_SNAPSHOT_MESSAGE }, 400);
  }
  const incomingBooksRaw = (snapshotPayload as Record<string, unknown>).books;
  if (!Array.isArray(incomingBooksRaw)) {
    return c.json({ message: INVALID_SNAPSHOT_MESSAGE }, 400);
  }

  const incomingSnapshot: StatisticsSnapshot = {
    books: incomingBooksRaw.map(normalizeBook).filter((row): row is StatisticsBookRow => row !== null),
  };

  try {
    const existing = await getStatisticsSnapshot(c.env, auth.userId);
    const existingSnapshot = existing ? parseSnapshotFromJson(existing.snapshot_json) : null;
    const mergedSnapshot = mergeSnapshots(existingSnapshot, incomingSnapshot);

    await upsertStatisticsSnapshot(
      c.env,
      auth.userId,
      schemaVersion,
      device,
      deviceId,
      JSON.stringify(mergedSnapshot)
    );

    return c.json({
      ok: true,
      snapshot: mergedSnapshot,
    });
  } catch (error) {
    logError(c, "Upsert Statistics Error", error);
    return c.json({ message: "Failed to sync statistics" }, 500);
  }
});

export default router;
