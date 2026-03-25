import initMigrationSql from "../migrations/0001_init.sql";
const REQUIRED_TABLES = ["users", "progress", "sessions"];
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
export async function getDatabaseInitStatus(env) {
    const checks = await Promise.all(REQUIRED_TABLES.map(async (tableName) => {
        const row = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
            .bind(tableName)
            .first();
        return row?.name ? null : tableName;
    }));
    const missingTables = checks.filter((name) => name !== null);
    return { initialized: missingTables.length === 0, missingTables };
}
export async function initializeDatabase(env) {
    const statements = splitSqlStatements(initMigrationSql);
    for (const statement of statements) {
        await env.DB.prepare(statement).run();
    }
}
export async function findUserByUsername(env, username) {
    const row = await env.DB.prepare("SELECT id, username, password_hash FROM users WHERE username = ?")
        .bind(username)
        .first();
    return row ?? null;
}
export async function createUser(env, username, passwordHash) {
    await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
        .bind(username, passwordHash)
        .run();
}
export async function listUsers(env) {
    const { results } = await env.DB.prepare("SELECT id, username, created_at FROM users ORDER BY created_at DESC, id DESC").all();
    return results ?? [];
}
export async function deleteUserById(env, userId) {
    await env.DB.prepare("DELETE FROM progress WHERE user_id = ?").bind(userId).run();
    await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
    const result = await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
    return (result.meta.changes ?? 0) > 0;
}
export async function updateUserPasswordById(env, userId, passwordHash) {
    const result = await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
        .bind(passwordHash, userId)
        .run();
    return (result.meta.changes ?? 0) > 0;
}
export async function upsertProgress(env, userId, payload) {
    await env.DB.prepare(`INSERT INTO progress (
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
export async function getLatestProgressByDocument(env, userId, document) {
    const row = await env.DB.prepare(`SELECT progress, percentage, device, device_id, timestamp
     FROM progress
     WHERE user_id = ? AND document = ?
     ORDER BY timestamp DESC
     LIMIT 1`)
        .bind(userId, document)
        .first();
    return row ?? null;
}
