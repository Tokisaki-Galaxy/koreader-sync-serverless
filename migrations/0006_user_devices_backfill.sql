WITH grouped AS (
  SELECT
    p.user_id,
    CASE WHEN p.device_id IS NOT NULL AND p.device_id <> '' THEN 'id:' || p.device_id ELSE 'name:' || p.device END AS device_key,
    MAX(p.device) AS device,
    MAX(COALESCE(p.device_id, '')) AS device_id,
    MIN(p.timestamp) AS first_seen_at,
    MAX(p.timestamp) AS last_seen_at
  FROM progress p
  JOIN users u ON u.id = p.user_id
  WHERE p.device <> '' OR p.device_id <> ''
  GROUP BY p.user_id, device_key
)
INSERT INTO user_devices (user_id, device_key, device, device_id, first_seen_at, last_seen_at)
SELECT user_id, device_key, device, device_id, first_seen_at, last_seen_at FROM grouped WHERE true
ON CONFLICT(user_id, device_key) DO UPDATE SET
  first_seen_at = MIN(user_devices.first_seen_at, excluded.first_seen_at),
  last_seen_at = MAX(user_devices.last_seen_at, excluded.last_seen_at);

WITH stats_grouped AS (
  SELECT
    s.user_id,
    CASE WHEN s.device_id IS NOT NULL AND s.device_id <> '' THEN 'id:' || s.device_id ELSE 'name:' || s.device END AS device_key,
    MAX(s.device) AS device,
    MAX(COALESCE(s.device_id, '')) AS device_id,
    MIN(s.updated_at) AS first_seen_at,
    MAX(s.updated_at) AS last_seen_at
  FROM statistics_snapshot s
  JOIN users u ON u.id = s.user_id
  WHERE s.device <> '' OR s.device_id <> ''
  GROUP BY s.user_id, device_key
)
INSERT INTO user_devices (user_id, device_key, device, device_id, first_seen_at, last_seen_at)
SELECT user_id, device_key, device, device_id, first_seen_at, last_seen_at FROM stats_grouped WHERE true
ON CONFLICT(user_id, device_key) DO UPDATE SET
  first_seen_at = MIN(user_devices.first_seen_at, excluded.first_seen_at),
  last_seen_at = MAX(user_devices.last_seen_at, excluded.last_seen_at);
