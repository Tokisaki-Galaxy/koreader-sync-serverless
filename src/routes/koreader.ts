import { Hono } from "hono";
import { createUser, getLatestProgressByDocument, upsertProgress } from "../db";
import { hashPassword } from "../crypto";
import { authKoreader } from "../services/auth";
import { badRequest, isValidPassword, isValidUsername } from "../services/common";
import type { Env, ProgressUpdateRequest, RegisterRequest } from "../types";

const router = new Hono<{ Bindings: Env }>();

router.post("/users/create", async (c) => {
  let body: RegisterRequest;
  try {
    body = await c.req.json<RegisterRequest>();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const username = (body.username || "").trim();
  const password = body.password || "";
  if (!isValidUsername(username) || !isValidPassword(password)) {
    return badRequest("Invalid username or password");
  }

  try {
    const passwordHash = await hashPassword(password, username, c.env.PASSWORD_PEPPER);
    await createUser(c.env, username, passwordHash);
    return c.json({ username }, 201);
  } catch {
    return c.json({ error: "Username already exists" }, 402);
  }
});

router.get("/users/auth", async (c) => {
  const auth = await authKoreader(c);
  if (!auth) return c.json({ error: "Invalid credentials" }, 401);
  return c.json({ authorized: "OK" });
});

router.put("/syncs/progress", async (c) => {
  const auth = await authKoreader(c);
  if (!auth) return c.json({ error: "Invalid credentials" }, 401);

  let body: ProgressUpdateRequest;
  try {
    body = await c.req.json<ProgressUpdateRequest>();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { document, progress, percentage, device, device_id } = body;
  if (!document || !progress || typeof percentage !== "number" || !device) {
    return badRequest("Missing required fields");
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
    progress,
    percentage,
    device,
    ...(device_id !== undefined ? { device_id } : {}),
    timestamp,
  });
});

router.get("/syncs/progress/:document", async (c) => {
  const auth = await authKoreader(c);
  if (!auth) return c.json({ error: "Invalid credentials" }, 401);

  const document = c.req.param("document");
  const row = await getLatestProgressByDocument(c.env, auth.userId, document);
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
