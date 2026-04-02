import initMigrationSql from "../migrations/0001_init.sql";
import statisticsMigrationSql from "../migrations/0002_statistics_sync.sql";
const REQUIRED_TABLES = ["users", "progress", "sessions", "statistics_snapshot"];
function splitSqlStatements(sql) {
    const statements = [];
    let current = "";
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inLineComment = false;
    let inBlockComment = false;
    for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        const next = sql[i + 1];
        if (inLineComment) {
            if (char === "\n")
                inLineComment = false;
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
            if (statement)
                statements.push(statement);
            current = "";
            continue;
        }
        current += char;
    }
    const tail = current.trim();
    if (tail)
        statements.push(tail);
    return statements;
}
export async function getDatabaseInitStatus(db) {
    const checks = await Promise.all(REQUIRED_TABLES.map(async (tableName) => {
        const row = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
            .bind(tableName)
            .first();
        return row?.name ? null : tableName;
    }));
    const missingTables = checks.filter((name) => name !== null);
    return { initialized: missingTables.length === 0, missingTables };
}
export async function initializeDatabase(db) {
    const statements = [
        ...splitSqlStatements(initMigrationSql),
        ...splitSqlStatements(statisticsMigrationSql),
    ];
    for (const statement of statements) {
        await db.prepare(statement).run();
    }
}
export async function findUserByUsername(db, username) {
    const row = await db.prepare("SELECT id, username, password_hash FROM users WHERE username = ?")
        .bind(username)
        .first();
    return row ?? null;
}
export async function createUser(db, username, passwordHash) {
    await db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
        .bind(username, passwordHash)
        .run();
}
export async function listUsers(db) {
    const { results } = await db.prepare("SELECT id, username, created_at FROM users ORDER BY created_at DESC, id DESC").all();
    return results ?? [];
}
export async function deleteUserById(db, userId) {
    await db.prepare("DELETE FROM progress WHERE user_id = ?").bind(userId).run();
    await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
    const result = await db.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
    return (result.meta.changes ?? 0) > 0;
}
export async function updateUserPasswordById(db, userId, passwordHash) {
    const result = await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
        .bind(passwordHash, userId)
        .run();
    return (result.meta.changes ?? 0) > 0;
}
export async function upsertProgress(db, userId, payload) {
    await db.prepare(`INSERT INTO progress (
      user_id, document, progress, percentage, device, device_id, timestamp, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
    ON CONFLICT(user_id, document) DO UPDATE SET
      progress = excluded.progress,
      percentage = excluded.percentage,
      device = excluded.device,
      device_id = excluded.device_id,
      timestamp = excluded.timestamp,
      updated_at = unixepoch()`)
        .bind(userId, payload.document, payload.progress, payload.percentage, payload.device, payload.device_id, payload.timestamp)
        .run();
}
export async function getLatestProgressByDocument(db, userId, document) {
    const row = await db.prepare(`SELECT progress, percentage, device, device_id, timestamp
     FROM progress
     WHERE user_id = ? AND document = ?
     ORDER BY timestamp DESC
     LIMIT 1`)
        .bind(userId, document)
        .first();
    return row ?? null;
}
export async function getStatisticsSnapshot(db, userId) {
    const row = await db.prepare(`SELECT schema_version, device, device_id, snapshot_json
     FROM statistics_snapshot
     WHERE user_id = ?`)
        .bind(userId)
        .first();
    return row ?? null;
}
export async function upsertStatisticsSnapshot(db, userId, schemaVersion, device, deviceId, snapshotJson) {
    await db.prepare(`INSERT INTO statistics_snapshot (
      user_id, schema_version, device, device_id, snapshot_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, unixepoch())
    ON CONFLICT(user_id) DO UPDATE SET
      schema_version = excluded.schema_version,
      device = excluded.device,
      device_id = excluded.device_id,
      snapshot_json = excluded.snapshot_json,
      updated_at = unixepoch()`)
        .bind(userId, schemaVersion, device, deviceId, snapshotJson)
        .run();
}
export async function getUserById(db, userId) {
    const row = await db.prepare("SELECT username FROM users WHERE id = ?")
        .bind(userId)
        .first();
    return row ?? null;
}
export async function createSession(db, userId, tokenHash, expiresAt) {
    await db.prepare("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)")
        .bind(userId, tokenHash, expiresAt)
        .run();
}
export async function deleteSessionByTokenHash(db, tokenHash) {
    await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
}
export async function deleteSessionsByUserId(db, userId) {
    await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
}
export async function findWebUserBySessionTokenHash(db, tokenHash) {
    const row = await db.prepare(`SELECT users.id AS id, users.username AS username
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > unixepoch()
     LIMIT 1`)
        .bind(tokenHash)
        .first();
    return row ?? null;
}
export async function listProgressRecordsByUser(db, userId, pageSize, offset) {
    const { results } = await db.prepare(`SELECT document, progress, percentage, device, device_id, timestamp
     FROM progress
     WHERE user_id = ?
     ORDER BY timestamp DESC
     LIMIT ? OFFSET ?`)
        .bind(userId, pageSize, offset)
        .all();
    return results ?? [];
}
export async function getProgressSummaryByUser(db, userId) {
    const row = await db.prepare(`SELECT
      COUNT(*) AS total_records,
      COUNT(DISTINCT document) AS total_documents,
      COUNT(DISTINCT device) AS total_devices,
      COUNT(DISTINCT date(timestamp, 'unixepoch')) AS active_days,
      AVG(percentage) AS avg_percentage,
      MAX(timestamp) AS last_sync_at
     FROM progress
     WHERE user_id = ?`)
        .bind(userId)
        .first();
    return row ?? null;
}
export async function listDeviceUsageByUser(db, userId) {
    const { results } = await db.prepare(`SELECT device, COUNT(*) as count
     FROM progress
     WHERE user_id = ?
     GROUP BY device
     ORDER BY count DESC`)
        .bind(userId)
        .all();
    return results ?? [];
}
