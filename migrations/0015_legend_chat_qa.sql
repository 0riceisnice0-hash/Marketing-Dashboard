CREATE TABLE IF NOT EXISTS website_chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  journey_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  page_path TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_website_chat_messages_conversation ON website_chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_website_chat_messages_visitor ON website_chat_messages(visitor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_website_chat_messages_expiry ON website_chat_messages(expires_at);
