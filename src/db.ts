import type { Env, ProgressRow, UserRow } from "./types";

export async function findUserByUsername(
  env: Env,
  username: string
): Promise<UserRow | null> {
  const row = await env.DB.prepare(
    "SELECT id, username, password_hash FROM users WHERE username = ?"
  )
    .bind(username)
    .first<UserRow>();
  return row ?? null;
}

export async function createUser(
  env: Env,
  username: string,
  passwordHash: string
): Promise<void> {
  await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .bind(username, passwordHash)
    .run();
}

export async function listUsers(env: Env): Promise<Array<{ id: number; username: string; created_at: number }>> {
  const { results } = await env.DB.prepare(
    "SELECT id, username, created_at FROM users ORDER BY created_at DESC, id DESC"
  ).all<{ id: number; username: string; created_at: number }>();
  return results ?? [];
}

export async function deleteUserById(env: Env, userId: number): Promise<boolean> {
  await env.DB.prepare("DELETE FROM progress WHERE user_id = ?").bind(userId).run();
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
  const result = await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
  return (result.meta.changes ?? 0) > 0;
}

export async function updateUserPasswordById(env: Env, userId: number, passwordHash: string): Promise<boolean> {
  const result = await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .bind(passwordHash, userId)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function upsertProgress(
  env: Env,
  userId: number,
  payload: ProgressRow & { document: string }
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO progress (
      user_id, document, progress, percentage, device, device_id, timestamp, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
    ON CONFLICT(user_id, document) DO UPDATE SET
      progress = excluded.progress,
      percentage = excluded.percentage,
      device = excluded.device,
      device_id = excluded.device_id,
      timestamp = excluded.timestamp,
      updated_at = unixepoch()`
  )
    .bind(
      userId,
      payload.document,
      payload.progress,
      payload.percentage,
      payload.device,
      payload.device_id,
      payload.timestamp
    )
    .run();
}

export async function getLatestProgressByDocument(
  env: Env,
  userId: number,
  document: string
): Promise<ProgressRow | null> {
  const row = await env.DB.prepare(
    `SELECT progress, percentage, device, device_id, timestamp
     FROM progress
     WHERE user_id = ? AND document = ?
     ORDER BY timestamp DESC
     LIMIT 1`
  )
    .bind(userId, document)
    .first<ProgressRow>();

  return row ?? null;
}
