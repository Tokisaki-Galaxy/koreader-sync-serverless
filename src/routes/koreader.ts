import { Hono } from "hono";
import { createUser, getLatestProgressByDocument, upsertProgress } from "../db";
import { hashPassword } from "../crypto";
import { authKoreader, isValidField, isValidKeyField } from "../services/auth";
import { badRequest } from "../services/common";
import type { Env, ProgressUpdateRequest, RegisterRequest } from "../types";

const router = new Hono<{ Bindings: Env }>();
const INVALID_REQUEST_MESSAGE = "Invalid request";
const DOCUMENT_MISSING_MESSAGE = "Field 'document' not provided.";
const UNAUTHORIZED_MESSAGE = "Unauthorized";

router.post("/users/create", async (c) => {
  let body: RegisterRequest;
  try {
    body = await c.req.json<RegisterRequest>();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const username = body.username ?? "";
  const password = body.password ?? "";
  if (!isValidKeyField(username) || !isValidField(password)) {
    return c.json({ message: INVALID_REQUEST_MESSAGE }, 403);
  }

  try {
    const passwordHash = await hashPassword(password, username, c.env.PASSWORD_PEPPER);
    await createUser(c.env, username, passwordHash);
    return c.json({ username }, 201);
  } catch {
    return c.json({ message: "Username is already registered." }, 402);
  }
});

router.get("/users/auth", async (c) => {
  const auth = await authKoreader(c);
  if (!auth) return c.json({ message: UNAUTHORIZED_MESSAGE }, 401);
  return c.json({ authorized: "OK" });
});

router.put("/syncs/progress", async (c) => {
  const auth = await authKoreader(c);
  if (!auth) return c.json({ message: UNAUTHORIZED_MESSAGE }, 401);

  let body: ProgressUpdateRequest;
  try {
    body = await c.req.json<ProgressUpdateRequest>();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { document, progress, percentage, device, device_id } = body;
  if (!isValidKeyField(document)) {
    return c.json({ message: DOCUMENT_MISSING_MESSAGE }, 403);
  }
  if (!progress || typeof percentage !== "number" || !device) {
    return c.json({ message: INVALID_REQUEST_MESSAGE }, 403);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  await upsertProgress(c.env, auth.userId, {
    document,
    progress,
    percentage,
    device,
    device_id: device_id ?? "",
    timestamp,
  });

  return c.json({
    document,
    timestamp,
  });
});

router.get("/syncs/progress/:document", async (c) => {
  const auth = await authKoreader(c);
  if (!auth) return c.json({ message: UNAUTHORIZED_MESSAGE }, 401);

  const document = c.req.param("document");
  if (!isValidKeyField(document)) {
    return c.json({ message: DOCUMENT_MISSING_MESSAGE }, 403);
  }
  const row = await getLatestProgressByDocument(c.env, auth.userId, document);
  // KOReader compatibility: official server returns 200 with empty object when no progress exists.
  if (!row) return c.json({});

  return c.json({
    document,
    progress: row.progress,
    percentage: row.percentage,
    device: row.device,
    ...(row.device_id ? { device_id: row.device_id } : {}),
    timestamp: row.timestamp,
  });
});

export default router;
