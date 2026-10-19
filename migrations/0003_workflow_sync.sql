CREATE TABLE IF NOT EXISTS routine_plan_items (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  step TEXT NOT NULL,
  source TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS makeup_follow_progress (
  look_id TEXT PRIMARY KEY,
  progress_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
