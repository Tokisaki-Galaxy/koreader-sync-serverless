import type { DatabaseAdapter } from "./database/adapter";
import type { DeviceUsage, ProgressRow, UserDeviceRow, UserRow } from "./types";
import { runMigrations } from "./migrations";
import { MIGRATIONS } from "./migrations-bundle";

const REQUIRED_TABLES = ["users", "progress", "sessions", "statistics_snapshot", "user_devices"] as const;

const REQUIRED_COLUMNS: Array<{ table: string; columns: string[] }> = [
  { table: "progress", columns: ["metadata"] },
  { table: "statistics_snapshot", columns: ["statistics_summary_json"] },
];

export async function getDatabaseInitStatus(
  db: DatabaseAdapter
): Promise<{ initialized: boolean; missingTables: string[] }> {
  const checks = await Promise.all(
    REQUIRED_TABLES.map(async (tableName) => {
      const row = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
        .bind(tableName)
        .first<{ name: string }>();
      return row?.name ? null : tableName;
    })
  );
  const missing: string[] = checks.filter((name) => name !== null);

  const migrationTable = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .bind("schema_migrations")
    .first<{ name: string }>();
  const appliedVersions = new Set<string>();
  if (migrationTable) {
    const rows = await db
      .prepare("SELECT version FROM schema_migrations")
      .all<{ version: string }>();
    for (const row of rows.results ?? []) {
      appliedVersions.add(row.version);
    }
  }

  // `wrangler d1 migrations apply` records versions in d1_migrations instead
  // of schema_migrations. Treat both as proof that a migration was applied.
  const d1MigrationTable = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .bind("d1_migrations")
    .first<{ name: string }>();
  if (d1MigrationTable) {
    try {
      const rows = await db.prepare("SELECT name FROM d1_migrations").all<{ name: string }>();
      for (const row of rows.results ?? []) {
        appliedVersions.add(row.name.replace(/\.sql$/, ""));
      }
    } catch {
      // Keep the schema_migrations result if the D1 table shape is unexpected.
    }
  }

  for (const migration of MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      missing.push(`migration:${migration.version}`);
    }
  }

  for (const requirement of REQUIRED_COLUMNS) {
    if (missing.includes(requirement.table)) continue;
    try {
      const info = await db
        .prepare(`PRAGMA table_info(${requirement.table})`)
        .all<{ name: string }>();
      const present = new Set((info.results ?? []).map((row) => row.name));
      for (const column of requirement.columns) {
        if (!present.has(column)) missing.push(`${requirement.table}.${column}`);
      }
    } catch {
      // Fail closed: if the column cannot be verified, report it so the admin
      // UI offers to run migrations instead of hiding the action. The suffix
      // distinguishes "not verified" from a confirmed missing column.
      for (const column of requirement.columns) {
        missing.push(`${requirement.table}.${column}:unverified`);
      }
    }
  }

  return { initialized: missing.length === 0, missingTables: missing };
}

export async function initializeDatabase(db: DatabaseAdapter): Promise<void> {
  await runMigrations(db, MIGRATIONS);
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
      user_id, document, progress, percentage, device, device_id, timestamp, metadata, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
    ON CONFLICT(user_id, document) DO UPDATE SET
      progress = excluded.progress,
      percentage = excluded.percentage,
      device = excluded.device,
      device_id = excluded.device_id,
      timestamp = excluded.timestamp,
      metadata = COALESCE(excluded.metadata, progress.metadata),
      updated_at = unixepoch()`
  )
    .bind(
      userId,
      payload.document,
      payload.progress,
      payload.percentage,
      payload.device,
      payload.device_id,
      payload.timestamp,
      payload.metadata ?? null
    )
    .run();
}

export async function getLatestProgressByDocument(
  db: DatabaseAdapter,
  userId: number,
  document: string
): Promise<ProgressRow | null> {
  const row = await db.prepare(
    `SELECT progress, percentage, device, device_id, metadata, timestamp
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
): Promise<{
  schema_version: number;
  device: string;
  device_id: string;
  snapshot_json: string;
  statistics_summary_json: string | null;
} | null> {
  const row = await db.prepare(
    `SELECT schema_version, device, device_id, snapshot_json, statistics_summary_json
     FROM statistics_snapshot
     WHERE user_id = ?`
  )
    .bind(userId)
    .first<{
      schema_version: number;
      device: string;
      device_id: string;
      snapshot_json: string;
      statistics_summary_json: string | null;
    }>();
  return row ?? null;
}

export async function upsertStatisticsSnapshot(
  db: DatabaseAdapter,
  userId: number,
  schemaVersion: number,
  device: string,
  deviceId: string,
  snapshotJson: string,
  summaryJson: string | null
): Promise<void> {
  await db.prepare(
    `INSERT INTO statistics_snapshot (
      user_id, schema_version, device, device_id, snapshot_json, statistics_summary_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, unixepoch())
    ON CONFLICT(user_id) DO UPDATE SET
      schema_version = excluded.schema_version,
      device = excluded.device,
      device_id = excluded.device_id,
      snapshot_json = excluded.snapshot_json,
      statistics_summary_json = excluded.statistics_summary_json,
      updated_at = unixepoch()`
  )
    .bind(userId, schemaVersion, device, deviceId, snapshotJson, summaryJson)
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

export async function getUserMetaById(
  db: DatabaseAdapter,
  userId: number
): Promise<{ username: string; created_at: number } | null> {
  const row = await db.prepare("SELECT username, created_at FROM users WHERE id = ?")
    .bind(userId)
    .first<{ username: string; created_at: number }>();
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

export async function renewSession(
  db: DatabaseAdapter,
  tokenHash: string,
  expiresAt: number
): Promise<void> {
  await db.prepare("UPDATE sessions SET expires_at = ? WHERE token_hash = ?")
    .bind(expiresAt, tokenHash)
    .run();
}

export async function findWebUserBySessionTokenHash(
  db: DatabaseAdapter,
  tokenHash: string
): Promise<{ id: number; username: string; expires_at: number } | null> {
  const row = await db.prepare(
    `SELECT users.id AS id, users.username AS username, sessions.expires_at AS expires_at
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > unixepoch()
     LIMIT 1`
  )
    .bind(tokenHash)
    .first<{ id: number; username: string; expires_at: number }>();
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

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function likeParam(value: string): string {
  return `%${escapeLikePattern(value.toLowerCase())}%`;
}

export async function listProgressRecordsByUserSearch(
  db: DatabaseAdapter,
  userId: number,
  search: string,
  pageSize: number,
  offset: number
): Promise<Array<{ document: string; progress: string; percentage: number; device: string; device_id: string; timestamp: number }>> {
  const { results } = await db.prepare(
    `SELECT document, progress, percentage, device, device_id, timestamp
     FROM progress
     WHERE user_id = ? AND lower(document) LIKE ? ESCAPE '\\'
     ORDER BY timestamp DESC
     LIMIT ? OFFSET ?`
  )
    .bind(userId, likeParam(search), pageSize, offset)
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

export async function countProgressRecordsByUserSearch(
  db: DatabaseAdapter,
  userId: number,
  search: string
): Promise<number> {
  const row = await db.prepare(
    `SELECT COUNT(*) AS total
     FROM progress
     WHERE user_id = ? AND lower(document) LIKE ? ESCAPE '\\'`
  )
    .bind(userId, likeParam(search))
    .first<{ total: number }>();
  return Number(row?.total ?? 0);
}

export async function listAllProgressByUser(
  db: DatabaseAdapter,
  userId: number
): Promise<Array<{
  document: string;
  progress: string;
  percentage: number;
  device: string;
  device_id: string;
  timestamp: number;
  updated_at: number;
}>> {
  const { results } = await db.prepare(
    `SELECT document, progress, percentage, device, device_id, timestamp, updated_at
     FROM progress
     WHERE user_id = ?
     ORDER BY timestamp DESC`
  )
    .bind(userId)
    .all<{
      document: string;
      progress: string;
      percentage: number;
      device: string;
      device_id: string;
      timestamp: number;
      updated_at: number;
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

function deviceKeyFor(device: string, deviceId: string): string {
  return deviceId ? `id:${deviceId}` : `name:${device}`;
}

export async function touchUserDevice(
  db: DatabaseAdapter,
  userId: number,
  device: string,
  deviceId: string,
  timestamp: number
): Promise<void> {
  const normalizedDevice = device || "";
  const normalizedDeviceId = deviceId || "";
  const deviceKey = deviceKeyFor(normalizedDevice, normalizedDeviceId);
  await db.prepare(
    `INSERT INTO user_devices (
      user_id, device_key, device, device_id, first_seen_at, last_seen_at
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, device_key) DO UPDATE SET
      device = excluded.device,
      device_id = excluded.device_id,
      first_seen_at = MIN(user_devices.first_seen_at, excluded.first_seen_at),
      last_seen_at = MAX(user_devices.last_seen_at, excluded.last_seen_at)`
  )
    .bind(userId, deviceKey, normalizedDevice, normalizedDeviceId, timestamp, timestamp)
    .run();
}

export async function listUserDevicesWithUsage(
  db: DatabaseAdapter,
  userId: number
): Promise<DeviceUsage[]> {
  let deviceRows: UserDeviceRow[];
  let usageRows: Array<{
    device: string;
    device_id: string;
    records: number;
    avg_percentage: number | null;
  }>;
  try {
    const deviceResult = await db.prepare(
      `SELECT id, user_id, device_key, device, device_id, alias, hidden, first_seen_at, last_seen_at
       FROM user_devices
       WHERE user_id = ?
       ORDER BY last_seen_at DESC, id ASC`
    )
      .bind(userId)
      .all<UserDeviceRow>();
    deviceRows = deviceResult.results ?? [];

    const usageResult = await db.prepare(
      `SELECT device, device_id, COUNT(*) AS records, AVG(percentage) AS avg_percentage
       FROM progress
       WHERE user_id = ?
       GROUP BY device, device_id`
    )
      .bind(userId)
      .all<{
        device: string;
        device_id: string;
        records: number;
        avg_percentage: number | null;
      }>();
    usageRows = usageResult.results ?? [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/no such table: user_devices/i.test(message)) {
      // The caller falls back to the legacy progress-derived device list when
      // the user_devices table is not available yet.
      return [];
    }
    throw error;
  }

  const usage = new Map<string, { records: number; averageProgress: number | null }>();
  for (const row of usageRows) {
    usage.set(deviceKeyFor(row.device || "", row.device_id || ""), {
      records: Number(row.records) || 0,
      averageProgress: row.avg_percentage == null ? null : Number(row.avg_percentage),
    });
  }

  return deviceRows.map((row) => {
    const entry = usage.get(row.device_key);
    const records = entry?.records ?? 0;
    return {
      id: row.id,
      deviceKey: row.device_key,
      device: row.device,
      deviceId: row.device_id,
      alias: row.alias,
      hidden: row.hidden === 1,
      firstSeenAt: row.first_seen_at,
      lastSeenAt: row.last_seen_at,
      records,
      count: records,
      averageProgress: entry?.averageProgress ?? null,
    };
  });
}

export async function getUserDeviceById(
  db: DatabaseAdapter,
  userId: number,
  id: number
): Promise<UserDeviceRow | null> {
  const row = await db.prepare(
    `SELECT id, user_id, device_key, device, device_id, alias, hidden, first_seen_at, last_seen_at
     FROM user_devices
     WHERE id = ? AND user_id = ?`
  )
    .bind(id, userId)
    .first<UserDeviceRow>();
  return row ?? null;
}

export async function updateUserDeviceSettings(
  db: DatabaseAdapter,
  userId: number,
  id: number,
  settings: { alias?: string | null; hidden?: boolean }
): Promise<boolean> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (settings.alias !== undefined) {
    sets.push("alias = ?");
    values.push(settings.alias);
  }
  if (settings.hidden !== undefined) {
    sets.push("hidden = ?");
    values.push(settings.hidden ? 1 : 0);
  }
  if (sets.length === 0) return false;
  values.push(id, userId);
  const result = await db.prepare(
    `UPDATE user_devices SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`
  )
    .bind(...values)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function mergeUserDevices(
  db: DatabaseAdapter,
  userId: number,
  sourceId: number,
  targetId: number
): Promise<{ ok: boolean; error?: "not_found" | "same_device" | "invalid_target" }> {
  if (sourceId === targetId) return { ok: false, error: "same_device" };
  const source = await getUserDeviceById(db, userId, sourceId);
  const target = await getUserDeviceById(db, userId, targetId);
  if (!source || !target) return { ok: false, error: "not_found" };
  if (source.device_id && !target.device_id) {
    // A name-only target would be recreated as a separate id-keyed device on
    // the next sync. Require an id-bearing target when the source has an id.
    return { ok: false, error: "invalid_target" };
  }

  if (source.device_id) {
    await db.prepare(
      `UPDATE progress SET device = ?, device_id = ? WHERE user_id = ? AND device_id = ?`
    )
      .bind(target.device, target.device_id, userId, source.device_id)
      .run();
  } else {
    await db.prepare(
      `UPDATE progress SET device = ?, device_id = ?
       WHERE user_id = ? AND device = ? AND (device_id IS NULL OR device_id = '')`
    )
      .bind(target.device, target.device_id, userId, source.device)
      .run();
  }

  if (source.device_id) {
    await db.prepare(
      `UPDATE statistics_snapshot SET device = ?, device_id = ?
       WHERE user_id = ? AND (
         device_id = ? OR (device = ? AND (device_id IS NULL OR device_id = ''))
       )`
    )
      .bind(target.device, target.device_id, userId, source.device_id, source.device)
      .run();
  } else {
    await db.prepare(
      `UPDATE statistics_snapshot SET device = ?, device_id = ?
       WHERE user_id = ? AND device = ? AND (device_id IS NULL OR device_id = '')`
    )
      .bind(target.device, target.device_id, userId, source.device)
      .run();
  }

  const nextAlias = target.alias ?? source.alias;
  await db.prepare(
    `UPDATE user_devices SET
       first_seen_at = MIN(first_seen_at, ?),
       last_seen_at = MAX(last_seen_at, ?),
       alias = ?
     WHERE id = ? AND user_id = ?`
  )
    .bind(source.first_seen_at, source.last_seen_at, nextAlias, targetId, userId)
    .run();

  await db.prepare(`DELETE FROM user_devices WHERE id = ? AND user_id = ?`)
    .bind(sourceId, userId)
    .run();

  return { ok: true };
}

export async function listProgressRecordsByUserFiltered(
  db: DatabaseAdapter,
  userId: number,
  options: { search?: string; deviceId?: string; device?: string; pageSize: number; offset: number }
): Promise<Array<{ document: string; progress: string; percentage: number; device: string; device_id: string; metadata: string | null; timestamp: number }>> {
  const where: string[] = ["user_id = ?"];
  const values: unknown[] = [userId];
  if (options.search) {
    where.push("lower(document) LIKE ? ESCAPE '\\'");
    values.push(likeParam(options.search));
  }
  if (options.deviceId) {
    where.push("device_id = ?");
    values.push(options.deviceId);
  } else if (options.device) {
    where.push("device = ? AND (device_id IS NULL OR device_id = '')");
    values.push(options.device);
  }
  values.push(options.pageSize, options.offset);
  const { results } = await db.prepare(
    `SELECT document, progress, percentage, device, device_id, metadata, timestamp
     FROM progress
     WHERE ${where.join(" AND ")}
     ORDER BY timestamp DESC
     LIMIT ? OFFSET ?`
  )
    .bind(...values)
    .all<{
      document: string;
      progress: string;
      percentage: number;
      device: string;
      device_id: string;
      metadata: string | null;
      timestamp: number;
    }>();
  return results ?? [];
}
