import { Hono } from "hono";
import {
  createUser,
  getLatestProgressByDocument,
  getStatisticsSnapshot,
  touchUserDevice,
  upsertProgress,
  upsertStatisticsSnapshot,
} from "../db";
import { md5 } from "js-md5";
import { hashPassword } from "../crypto";
import { authKoreader, isValidField, isValidKeyField } from "../services/auth";
import { badRequest, parsePbkdf2Iterations } from "../services/common";
import { buildStatisticsSummary, mergeSnapshots, normalizeBook, parseSnapshotFromJson } from "../services/statistics";
import type {
  Env,
  ProgressUpdateRequest,
  RegisterRequest,
  StatisticsBookRow,
  StatisticsSnapshot,
} from "../types";
import type { AppEnv, AppContext } from "../context";
import { logServerError } from "../services/errors";
import { normalizeProgressMetadata, parseProgressMetadata } from "../services/metadata";
import { MAX_SNAPSHOT_BYTES, snapshotByteLength } from "../services/snapshotChunks";

const router = new Hono<AppEnv>();
const INVALID_REQUEST_MESSAGE = "Invalid request";
const DOCUMENT_MISSING_MESSAGE = "Field 'document' not provided.";
const UNAUTHORIZED_MESSAGE = "Unauthorized";
const REGISTRATION_DISABLED_MESSAGE = "User registration is disabled.";
const INVALID_SNAPSHOT_MESSAGE = "Invalid statistics snapshot payload";

function logError(c: AppContext, label: string, error: unknown) {
  logServerError(c, label, error);
}

function isRegistrationEnabled(env: Env): boolean {
  const flag = env.ENABLE_USER_REGISTRATION;
  if (flag === undefined) return true;
  return flag === "true" || flag === "1";
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
    await createUser(c.get("db"), username, passwordHash);
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
    await upsertProgress(c.get("db"), auth.userId, {
      document,
      progress,
      percentage,
      device,
      device_id: device_id ?? "",
      timestamp,
      metadata: normalizeProgressMetadata(body.metadata),
    });
    try {
      await touchUserDevice(c.get("db"), auth.userId, device, device_id ?? "", timestamp);
    } catch (error) {
      // Device bookkeeping must never break progress sync.
      logError(c, "Touch Device Error (/syncs/progress)", error);
    }
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
    const row = await getLatestProgressByDocument(c.get("db"), auth.userId, document);
    // KOReader compatibility: official server always returns 200 and includes the document key.
    if (!row) return c.json({ document });

    const metadata = parseProgressMetadata(row.metadata);
    return c.json({
      document,
      progress: row.progress,
      percentage: row.percentage,
      device: row.device,
      ...(row.device_id ? { device_id: row.device_id } : {}),
      ...(metadata ? { metadata } : {}),
      timestamp: row.timestamp,
    });
  } catch (error) {
    logError(c, "Get Progress Error", error);
    return c.json({ message: "Failed to fetch progress" }, 500);
  }
});

router.put("/syncs/statistics", async (c) => {
  const declaredLength = c.req.header("content-length");
  if (declaredLength !== undefined) {
    const parsedLength = Number(declaredLength);
    if (Number.isFinite(parsedLength) && parsedLength > MAX_SNAPSHOT_BYTES) {
      return c.json({ message: "Statistics snapshot too large" }, 413);
    }
  }
  const ua = c.req.header("user-agent");
  const version = c.req.header("x-client-version");
  if (!version || !version.startsWith("y-anna-") || ua !== "Mozilla/DONTLIKE/ANYTHING") {
    return c.text("404 Not Found", 404);
  }
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
    const existing = await getStatisticsSnapshot(c.get("db"), auth.userId);
    if (existing && !existing.snapshot_json) {
      return c.json({ message: "Statistics temporarily unavailable" }, 503);
    }
    const existingSnapshot = existing ? parseSnapshotFromJson(existing.snapshot_json) : null;
    if (existing && !existingSnapshot) {
      return c.json({ message: "Statistics snapshot is corrupted" }, 500);
    }
    const mergedSnapshot = mergeSnapshots(existingSnapshot, incomingSnapshot);
    const mergedJson = JSON.stringify(mergedSnapshot);
    if (snapshotByteLength(mergedJson) > MAX_SNAPSHOT_BYTES) {
      return c.json({ message: "Statistics snapshot too large" }, 413);
    }
    const summary = buildStatisticsSummary(mergedSnapshot);

    await upsertStatisticsSnapshot(
      c.get("db"),
      auth.userId,
      schemaVersion,
      device,
      deviceId,
      mergedJson,
      JSON.stringify(summary)
    );
    try {
      await touchUserDevice(c.get("db"), auth.userId, device, deviceId, Math.floor(Date.now() / 1000));
    } catch (error) {
      // Device bookkeeping must never break statistics sync.
      logError(c, "Touch Device Error (/syncs/statistics)", error);
    }

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
