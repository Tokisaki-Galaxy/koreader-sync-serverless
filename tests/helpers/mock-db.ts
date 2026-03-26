import type { Env } from "../../src/types";

type User = { id: number; username: string; password_hash: string; created_at: number };
type Progress = {
  user_id: number;
  document: string;
  progress: string;
  percentage: number;
  device: string;
  device_id: string;
  timestamp: number;
  updated_at: number;
};
type Session = { user_id: number; token_hash: string; expires_at: number };
type StatisticsSnapshot = {
  user_id: number;
  schema_version: number;
  device: string;
  device_id: string;
  snapshot_json: string;
  updated_at: number;
};

type MockDbOptions = {
  initialized?: boolean;
  missingTables?: string[];
};

class MockD1Statement {
  private bound: unknown[] = [];

  constructor(
    private readonly db: MockD1Database,
    private readonly sql: string
  ) {}

  bind(...values: unknown[]) {
    this.bound = values;
    return this;
  }

  async first<T>(): Promise<T | null> {
    return this.db.execute("first", this.sql, this.bound) as Promise<T | null>;
  }

  async all<T>(): Promise<{ results: T[] }> {
    const results = (await this.db.execute("all", this.sql, this.bound)) as T[];
    return { results };
  }

  async run(): Promise<{ meta: { changes: number } }> {
    return (await this.db.execute("run", this.sql, this.bound)) as { meta: { changes: number } };
  }
}

class MockD1Database {
  private users: User[] = [];
  private progress: Progress[] = [];
  private sessions: Session[] = [];
  private statistics = new Map<number, StatisticsSnapshot>();
  private userSeq = 1;
  private initialized = true;
  private missingTables = new Set<string>();

  constructor(options: MockDbOptions = {}) {
    this.initialized = options.initialized ?? true;
    for (const table of options.missingTables ?? []) {
      this.missingTables.add(table);
    }
  }

  prepare(sql: string) {
    return new MockD1Statement(this, sql);
  }

  private normalizeSql(sql: string): string {
    return sql.replace(/\s+/g, " ").trim().toLowerCase();
  }

  async execute(kind: "first" | "all" | "run", sql: string, bound: unknown[]) {
    const q = this.normalizeSql(sql);
    const now = Math.floor(Date.now() / 1000);

    if (q.includes("from sqlite_master") && q.includes("name = ?")) {
      const table = String(bound[0] ?? "");
      const exists = this.initialized && !this.missingTables.has(table);
      return kind === "first" ? (exists ? { name: table } : null) : [];
    }

    if (q.startsWith("create table") || q.startsWith("create index") || q.startsWith("pragma") || q.startsWith("drop ")) {
      this.initialized = true;
      this.missingTables.clear();
      return { meta: { changes: 0 } };
    }

    if (q.startsWith("insert into users")) {
      const username = String(bound[0] ?? "");
      const passwordHash = String(bound[1] ?? "");
      if (this.users.some((u) => u.username === username)) {
        throw new Error("UNIQUE constraint failed: users.username");
      }
      this.users.push({ id: this.userSeq++, username, password_hash: passwordHash, created_at: now });
      return { meta: { changes: 1 } };
    }

    if (q.includes("select id, username, password_hash from users where username = ?")) {
      const username = String(bound[0] ?? "");
      const user = this.users.find((u) => u.username === username);
      return user ? { id: user.id, username: user.username, password_hash: user.password_hash } : null;
    }

    if (q.includes("select username from users where id = ?")) {
      const userId = Number(bound[0]);
      const user = this.users.find((u) => u.id === userId);
      return user ? { username: user.username } : null;
    }

    if (q.includes("select id, username, created_at from users order by")) {
      return [...this.users]
        .sort((a, b) => (b.created_at - a.created_at) || (b.id - a.id))
        .map(({ id, username, created_at }) => ({ id, username, created_at }));
    }

    if (q.startsWith("update users set password_hash = ? where id = ?")) {
      const password_hash = String(bound[0] ?? "");
      const userId = Number(bound[1]);
      const user = this.users.find((u) => u.id === userId);
      if (!user) return { meta: { changes: 0 } };
      user.password_hash = password_hash;
      return { meta: { changes: 1 } };
    }

    if (q.startsWith("delete from users where id = ?")) {
      const userId = Number(bound[0]);
      const before = this.users.length;
      this.users = this.users.filter((u) => u.id !== userId);
      this.progress = this.progress.filter((p) => p.user_id !== userId);
      this.sessions = this.sessions.filter((s) => s.user_id !== userId);
      this.statistics.delete(userId);
      return { meta: { changes: before - this.users.length } };
    }

    if (q.startsWith("delete from progress where user_id = ?")) {
      const userId = Number(bound[0]);
      const before = this.progress.length;
      this.progress = this.progress.filter((p) => p.user_id !== userId);
      return { meta: { changes: before - this.progress.length } };
    }

    if (q.startsWith("delete from sessions where user_id = ?")) {
      const userId = Number(bound[0]);
      const before = this.sessions.length;
      this.sessions = this.sessions.filter((s) => s.user_id !== userId);
      return { meta: { changes: before - this.sessions.length } };
    }

    if (q.startsWith("insert into progress") && q.includes("on conflict(user_id, document)")) {
      const user_id = Number(bound[0]);
      const document = String(bound[1] ?? "");
      const payload: Progress = {
        user_id,
        document,
        progress: String(bound[2] ?? ""),
        percentage: Number(bound[3]),
        device: String(bound[4] ?? ""),
        device_id: String(bound[5] ?? ""),
        timestamp: Number(bound[6]),
        updated_at: now,
      };
      const index = this.progress.findIndex((p) => p.user_id === user_id && p.document === document);
      if (index >= 0) {
        this.progress[index] = payload;
      } else {
        this.progress.push(payload);
      }
      return { meta: { changes: 1 } };
    }

    if (q.includes("from progress where user_id = ? and document = ?")) {
      const userId = Number(bound[0]);
      const document = String(bound[1] ?? "");
      const row = this.progress
        .filter((p) => p.user_id === userId && p.document === document)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      if (!row) return null;
      return {
        progress: row.progress,
        percentage: row.percentage,
        device: row.device,
        device_id: row.device_id,
        timestamp: row.timestamp,
      };
    }

    if (q.includes("select document, progress, percentage, device, device_id, timestamp") && q.includes("from progress")) {
      const userId = Number(bound[0]);
      const limit = Number(bound[1]);
      const offset = Number(bound[2]);
      return this.progress
        .filter((p) => p.user_id === userId)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(offset, offset + limit)
        .map(({ document, progress, percentage, device, device_id, timestamp }) => ({
          document,
          progress,
          percentage,
          device,
          device_id,
          timestamp,
        }));
    }

    if (q.startsWith("insert into sessions (user_id, token_hash, expires_at) values (?, ?, ?)")) {
      this.sessions.push({
        user_id: Number(bound[0]),
        token_hash: String(bound[1] ?? ""),
        expires_at: Number(bound[2]),
      });
      return { meta: { changes: 1 } };
    }

    if (q.startsWith("delete from sessions where token_hash = ?")) {
      const tokenHash = String(bound[0] ?? "");
      const before = this.sessions.length;
      this.sessions = this.sessions.filter((s) => s.token_hash !== tokenHash);
      return { meta: { changes: before - this.sessions.length } };
    }

    if (q.includes("from sessions join users on users.id = sessions.user_id")) {
      const tokenHash = String(bound[0] ?? "");
      const session = this.sessions.find((s) => s.token_hash === tokenHash && s.expires_at > now);
      if (!session) return null;
      const user = this.users.find((u) => u.id === session.user_id);
      if (!user) return null;
      return { id: user.id, username: user.username };
    }

    if (q.includes("count(*) as total_records") && q.includes("from progress") && q.includes("where user_id = ?")) {
      const userId = Number(bound[0]);
      const rows = this.progress.filter((p) => p.user_id === userId);
      const documents = new Set(rows.map((r) => r.document));
      const devices = new Set(rows.map((r) => r.device));
      const days = new Set(rows.map((r) => new Date(r.timestamp * 1000).toISOString().slice(0, 10)));
      const avg = rows.length ? rows.reduce((sum, r) => sum + r.percentage, 0) / rows.length : null;
      const last = rows.length ? Math.max(...rows.map((r) => r.timestamp)) : null;
      return {
        total_records: rows.length,
        total_documents: documents.size,
        total_devices: devices.size,
        active_days: days.size,
        avg_percentage: avg,
        last_sync_at: last,
      };
    }

    if (q.includes("select device, count(*) as count") && q.includes("from progress") && q.includes("group by device")) {
      const userId = Number(bound[0]);
      const counts = new Map<string, number>();
      for (const row of this.progress.filter((p) => p.user_id === userId)) {
        counts.set(row.device, (counts.get(row.device) ?? 0) + 1);
      }
      return Array.from(counts.entries())
        .map(([device, count]) => ({ device, count }))
        .sort((a, b) => b.count - a.count);
    }

    if (q.includes("select schema_version, device, device_id, snapshot_json from statistics_snapshot where user_id = ?")) {
      const userId = Number(bound[0]);
      const row = this.statistics.get(userId);
      if (!row) return null;
      return {
        schema_version: row.schema_version,
        device: row.device,
        device_id: row.device_id,
        snapshot_json: row.snapshot_json,
      };
    }

    if (q.startsWith("insert into statistics_snapshot") && q.includes("on conflict(user_id) do update set")) {
      const userId = Number(bound[0]);
      this.statistics.set(userId, {
        user_id: userId,
        schema_version: Number(bound[1]),
        device: String(bound[2] ?? ""),
        device_id: String(bound[3] ?? ""),
        snapshot_json: String(bound[4] ?? ""),
        updated_at: now,
      });
      return { meta: { changes: 1 } };
    }

    throw new Error(`Unhandled SQL in mock DB (${kind}): ${sql}`);
  }
}

export function createMockEnv(options: MockDbOptions = {}): Env {
  const db = new MockD1Database(options);
  return {
    DB: db as unknown as D1Database,
    PASSWORD_PEPPER: "test-pepper",
    ADMIN_TOKEN: "admin-token",
    ENABLE_USER_REGISTRATION: "1",
    SESSION_TTL_HOURS: "168",
    PBKDF2_ITERATIONS: "1000",
  };
}
