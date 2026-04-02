import type { DatabaseAdapter } from "./database/adapter";
import type { ProgressRow, UserRow } from "./types";
import initMigrationSql from "../migrations/0001_init.sql";
import statisticsMigrationSql from "../migrations/0002_statistics_sync.sql";

const REQUIRED_TABLES = ["users", "progress", "sessions", "statistics_snapshot"] as const;

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      current += char;
      continue;
    }

    if (inBlockComment) {
      current += char;
      if (char === "*" && next === "/") {
        current += next;
        i++;
        inBlockComment = false;
      }
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && char === "-" && next === "-") {
      current += char + next;
      i++;
      inLineComment = true;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && char === "/" && next === "*") {
      current += char + next;
      i++;
      inBlockComment = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      if (inSingleQuote && next === "'") {
        current += char + next;
        i++;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      if (inDoubleQuote && next === '"') {
        current += char + next;
        i++;
        continue;
      }
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }

    if (char === ";" && !inSingleQuote && !inDoubleQuote) {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
      continue;
    }

    current += char;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

export async function getDatabaseInitStatus(
  db: DatabaseAdapter
): Promise<{ initialized: boolean; missingTables: Array<(typeof REQUIRED_TABLES)[number]> }> {
  const checks = await Promise.all(
    REQUIRED_TABLES.map(async (tableName) => {
      const row = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
        .bind(tableName)
        .first<{ name: string }>();
      return row?.name ? null : tableName;
    })
  );
  const missingTables = checks.filter((name) => name !== null);
  return { initialized: missingTables.length === 0, missingTables };
}

export async function initializeDatabase(db: DatabaseAdapter): Promise<void> {
  const statements = [
    ...splitSqlStatements(initMigrationSql),
    ...splitSqlStatements(statisticsMigrationSql),
  ];

  for (const statement of statements) {
    await db.prepare(statement).run();
  }
}

export async function findUserByUsername(
  db: DatabaseAdapter,
  username: string
): Promise<UserRow | null> {
  const row = await db.prepare(
    "SELECT id, username, password_hash FROM users WHERE username = ?"
  )
    .bind(username)
    .first<UserRow>();
  return row ?? null;
}

export async function createUser(
  db: DatabaseAdapter,
  username: string,
  passwordHash: string
): Promise<void> {
  await db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .bind(username, passwordHash)
    .run();
}

export async function listUsers(db: DatabaseAdapter): Promise<Array<{ id: number; username: string; created_at: number }>> {
  const { results } = await db.prepare(
    "SELECT id, username, created_at FROM users ORDER BY created_at DESC, id DESC"
  ).all<{ id: number; username: string; created_at: number }>();
  return results ?? [];
}

export async function deleteUserById(db: DatabaseAdapter, userId: number): Promise<boolean> {
  await db.prepare("DELETE FROM progress WHERE user_id = ?").bind(userId).run();
  await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
  const result = await db.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
  return (result.meta.changes ?? 0) > 0;
}

export async function updateUserPasswordById(db: DatabaseAdapter, userId: number, passwordHash: string): Promise<boolean> {
  const result = await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .bind(passwordHash, userId)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function upsertProgress(
  db: DatabaseAdapter,
  userId: number,
  payload: ProgressRow & { document: string }
): Promise<void> {
  await db.prepare(
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
  db: DatabaseAdapter,
  userId: number,
  document: string
): Promise<ProgressRow | null> {
  const row = await db.prepare(
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

export async function getStatisticsSnapshot(
  db: DatabaseAdapter,
  userId: number
): Promise<{ schema_version: number; device: string; device_id: string; snapshot_json: string } | null> {
  const row = await db.prepare(
    `SELECT schema_version, device, device_id, snapshot_json
     FROM statistics_snapshot
     WHERE user_id = ?`
  )
    .bind(userId)
    .first<{ schema_version: number; device: string; device_id: string; snapshot_json: string }>();
  return row ?? null;
}

export async function upsertStatisticsSnapshot(
  db: DatabaseAdapter,
  userId: number,
  schemaVersion: number,
  device: string,
  deviceId: string,
  snapshotJson: string
): Promise<void> {
  await db.prepare(
    `INSERT INTO statistics_snapshot (
      user_id, schema_version, device, device_id, snapshot_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, unixepoch())
    ON CONFLICT(user_id) DO UPDATE SET
      schema_version = excluded.schema_version,
      device = excluded.device,
      device_id = excluded.device_id,
      snapshot_json = excluded.snapshot_json,
      updated_at = unixepoch()`
  )
    .bind(userId, schemaVersion, device, deviceId, snapshotJson)
    .run();
}

export async function getUserById(
  db: DatabaseAdapter,
  userId: number
): Promise<{ username: string } | null> {
  const row = await db.prepare("SELECT username FROM users WHERE id = ?")
    .bind(userId)
    .first<{ username: string }>();
  return row ?? null;
}

export async function createSession(
  db: DatabaseAdapter,
  userId: number,
  tokenHash: string,
  expiresAt: number
): Promise<void> {
  await db.prepare("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)")
    .bind(userId, tokenHash, expiresAt)
    .run();
}

export async function deleteSessionByTokenHash(db: DatabaseAdapter, tokenHash: string): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
}

export async function deleteSessionsByUserId(db: DatabaseAdapter, userId: number): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
}

export async function findWebUserBySessionTokenHash(
  db: DatabaseAdapter,
  tokenHash: string
): Promise<{ id: number; username: string } | null> {
  const row = await db.prepare(
    `SELECT users.id AS id, users.username AS username
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > unixepoch()
     LIMIT 1`
  )
    .bind(tokenHash)
    .first<{ id: number; username: string }>();
  return row ?? null;
}

export async function listProgressRecordsByUser(
  db: DatabaseAdapter,
  userId: number,
  pageSize: number,
  offset: number
): Promise<Array<{ document: string; progress: string; percentage: number; device: string; device_id: string; timestamp: number }>> {
  const { results } = await db.prepare(
    `SELECT document, progress, percentage, device, device_id, timestamp
     FROM progress
     WHERE user_id = ?
     ORDER BY timestamp DESC
     LIMIT ? OFFSET ?`
  )
    .bind(userId, pageSize, offset)
    .all<{
      document: string;
      progress: string;
      percentage: number;
      device: string;
      device_id: string;
      timestamp: number;
    }>();
  return results ?? [];
}

export async function getProgressSummaryByUser(
  db: DatabaseAdapter,
  userId: number
): Promise<{
  total_records: number;
  total_documents: number;
  total_devices: number;
  active_days: number;
  avg_percentage: number | null;
  last_sync_at: number | null;
} | null> {
  const row = await db.prepare(
    `SELECT
      COUNT(*) AS total_records,
      COUNT(DISTINCT document) AS total_documents,
      COUNT(DISTINCT device) AS total_devices,
      COUNT(DISTINCT date(timestamp, 'unixepoch')) AS active_days,
      AVG(percentage) AS avg_percentage,
      MAX(timestamp) AS last_sync_at
     FROM progress
     WHERE user_id = ?`
  )
    .bind(userId)
    .first<{
      total_records: number;
      total_documents: number;
      total_devices: number;
      active_days: number;
      avg_percentage: number | null;
      last_sync_at: number | null;
    }>();
  return row ?? null;
}

export async function listDeviceUsageByUser(
  db: DatabaseAdapter,
  userId: number
): Promise<Array<{ device: string; count: number }>> {
  const { results } = await db.prepare(
    `SELECT device, COUNT(*) as count
     FROM progress
     WHERE user_id = ?
     GROUP BY device
     ORDER BY count DESC`
  )
    .bind(userId)
    .all<{ device: string; count: number }>();
  return results ?? [];
}
