CREATE TABLE IF NOT EXISTS todays_plan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Planned',
  notes TEXT NOT NULL DEFAULT '',
  updated_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'Instagram',
  content_type TEXT NOT NULL DEFAULT 'Post',
  status TEXT NOT NULL DEFAULT 'Idea',
  scheduled_for TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fenster_conversations (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL DEFAULT 'facebook',
  external_user_id TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT 'New customer',
  status TEXT NOT NULL DEFAULT 'new',
  draft TEXT NOT NULL DEFAULT '',
  draft_status TEXT NOT NULL DEFAULT 'none',
  meta_conversation_id TEXT NOT NULL DEFAULT '',
  hidden_until_message_id TEXT NOT NULL DEFAULT '',
  hidden_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fenster_conversations_channel_user
  ON fenster_conversations (channel, external_user_id);

CREATE TABLE IF NOT EXISTS fenster_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  external_id TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL,
  text TEXT NOT NULL,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES fenster_conversations(id)
);

CREATE INDEX IF NOT EXISTS idx_fenster_messages_conversation
  ON fenster_messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_fenster_messages_external
  ON fenster_messages (external_id);

CREATE TABLE IF NOT EXISTS fenster_reviews (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  external_id TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 0,
  text TEXT NOT NULL DEFAULT '',
  draft TEXT NOT NULL DEFAULT '',
  reply TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fenster_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO todays_plan (title, owner, status, notes, updated_by) VALUES
  ('Check new Meta messages', 'Zac', 'Planned', 'Use the Fenster Meta Bot in Tools and reply from the approval queue.', 'System'),
  ('Write the day''s marketing priorities', 'Zac', 'Planned', 'Add updates here through the day, then mark done or carry forward.', 'System');

INSERT INTO social_posts (title, platform, content_type, status, scheduled_for, owner, notes) VALUES
  ('Showroom product close-up', 'Instagram', 'Story', 'Idea', '', 'Zac', 'Quick daily story showing handles, colours, and product quality.'),
  ('Three pinned posts refresh', 'Instagram', 'Post', 'Planned', '', 'Zac', 'Why choose Fenster, recent work, and reviews/showroom/how to quote.'),
  ('Customer review reply highlight', 'Facebook', 'Post', 'Idea', '', 'Zac', 'Turn a strong review into a trust-building social post.');
