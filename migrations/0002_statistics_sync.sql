CREATE TABLE IF NOT EXISTS statistics_snapshot (
  user_id INTEGER PRIMARY KEY,
  schema_version INTEGER NOT NULL,
  device TEXT NOT NULL,
  device_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
