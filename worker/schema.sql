CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  pass_hash  TEXT NOT NULL,
  stage_name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sets (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venue              TEXT,
  performed_at       TEXT NOT NULL,
  stage_time_minutes INTEGER,
  rating             REAL CHECK (rating BETWEEN 1 AND 10),
  notes              TEXT,
  created_at         TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bits (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  notes      TEXT,
  tags       TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS set_bits (
  id           TEXT PRIMARY KEY,
  set_id       TEXT NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  bit_id       TEXT NOT NULL REFERENCES bits(id) ON DELETE CASCADE,
  rating       REAL CHECK (rating BETWEEN 1 AND 10),
  notes        TEXT,
  order_in_set INTEGER,
  created_at   TEXT DEFAULT (datetime('now')),
  UNIQUE(set_id, bit_id)
);

CREATE INDEX IF NOT EXISTS idx_sets_user   ON sets(user_id);
CREATE INDEX IF NOT EXISTS idx_bits_user   ON bits(user_id);
CREATE INDEX IF NOT EXISTS idx_setbits_set ON set_bits(set_id);
CREATE INDEX IF NOT EXISTS idx_setbits_bit ON set_bits(bit_id);
