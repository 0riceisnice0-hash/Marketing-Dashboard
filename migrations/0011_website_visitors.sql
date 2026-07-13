ALTER TABLE website_journeys ADD COLUMN visitor_id TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS website_visitors (
  visitor_id TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  first_landing_path TEXT NOT NULL DEFAULT '',
  first_source TEXT NOT NULL DEFAULT '',
  first_medium TEXT NOT NULL DEFAULT '',
  first_campaign TEXT NOT NULL DEFAULT '',
  first_content TEXT NOT NULL DEFAULT '',
  first_term TEXT NOT NULL DEFAULT '',
  first_referrer_host TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_website_journeys_visitor ON website_journeys(visitor_id);
CREATE INDEX IF NOT EXISTS idx_website_visitors_last_seen ON website_visitors(last_seen_at);
