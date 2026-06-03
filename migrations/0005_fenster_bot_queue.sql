CREATE TABLE IF NOT EXISTS fenster_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO fenster_settings (key, value) VALUES ('bot_active', 'false');

CREATE TABLE IF NOT EXISTS fenster_bot_queue (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  message_id TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reply TEXT NOT NULL DEFAULT '',
  decision_action TEXT NOT NULL DEFAULT '',
  internal_note TEXT NOT NULL DEFAULT '',
  not_before TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fenster_bot_queue_status_due ON fenster_bot_queue (status, not_before);
CREATE INDEX IF NOT EXISTS idx_fenster_bot_queue_conversation ON fenster_bot_queue (conversation_id, message_id);
