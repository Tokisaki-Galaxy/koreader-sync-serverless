import type { Env, ProgressRow, UserRow } from "./types";

const REQUIRED_TABLES = ["users", "progress", "sessions"] as const;

export async function getDatabaseInitStatus(
  env: Env
): Promise<{ initialized: boolean; missingTables: Array<(typeof REQUIRED_TABLES)[number]> }> {
  const checks = await Promise.all(
    REQUIRED_TABLES.map(async (tableName) => {
      const row = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
        .bind(tableName)
        .first<{ name: string }>();
      return row?.name ? null : tableName;
    })
  );
  const missingTables = checks.filter((name) => name !== null);
  return { initialized: missingTables.length === 0, missingTables };
}

export async function initializeDatabase(env: Env): Promise<void> {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`
  ).run();

  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      document TEXT NOT NULL,
      progress TEXT NOT NULL,
      percentage REAL NOT NULL,
      device TEXT NOT NULL,
      device_id TEXT NOT NULL DEFAULT '',
      timestamp INTEGER NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(user_id, document)
    )`
  ).run();

  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`
  ).run();

  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_progress_user_timestamp ON progress(user_id, timestamp DESC)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_progress_user_device ON progress(user_id, device)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)").run();
}

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
