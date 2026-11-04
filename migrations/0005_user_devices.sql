CREATE TABLE IF NOT EXISTS user_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  device_key TEXT NOT NULL,
  device TEXT NOT NULL,
  device_id TEXT NOT NULL,
  alias TEXT,
  hidden INTEGER NOT NULL DEFAULT 0,
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  UNIQUE (user_id, device_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_last_seen ON user_devices (user_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_user_device_id ON progress (user_id, device_id);

WITH grouped AS (
  SELECT
    user_id,
    CASE WHEN device_id IS NOT NULL AND device_id <> '' THEN 'id:' || device_id ELSE 'name:' || device END AS device_key,
    MAX(device) AS device,
    MAX(COALESCE(device_id, '')) AS device_id,
    MIN(timestamp) AS first_seen_at,
    MAX(timestamp) AS last_seen_at
  FROM progress
  GROUP BY user_id, device_key
)
INSERT OR IGNORE INTO user_devices (user_id, device_key, device, device_id, first_seen_at, last_seen_at)
SELECT user_id, device_key, device, device_id, first_seen_at, last_seen_at FROM grouped;

WITH stats_grouped AS (
  SELECT
    user_id,
    CASE WHEN device_id IS NOT NULL AND device_id <> '' THEN 'id:' || device_id ELSE 'name:' || device END AS device_key,
    MAX(device) AS device,
    MAX(COALESCE(device_id, '')) AS device_id,
    MIN(updated_at) AS first_seen_at,
    MAX(updated_at) AS last_seen_at
  FROM statistics_snapshot
  GROUP BY user_id, device_key
)
INSERT OR IGNORE INTO user_devices (user_id, device_key, device, device_id, first_seen_at, last_seen_at)
SELECT user_id, device_key, device, device_id, first_seen_at, last_seen_at FROM stats_grouped;
