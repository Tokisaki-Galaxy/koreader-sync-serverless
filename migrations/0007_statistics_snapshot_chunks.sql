CREATE TABLE IF NOT EXISTS statistics_snapshot_chunk (
  user_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (user_id, kind, chunk_index),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
