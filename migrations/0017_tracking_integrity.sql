ALTER TABLE website_visitors ADD COLUMN environment TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE website_journeys ADD COLUMN environment TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE website_events ADD COLUMN environment TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE website_chat_messages ADD COLUMN environment TEXT NOT NULL DEFAULT 'legacy';

ALTER TABLE website_lead_outcomes ADD COLUMN value REAL NOT NULL DEFAULT 0;
ALTER TABLE website_lead_outcomes ADD COLUMN currency TEXT NOT NULL DEFAULT 'GBP';
ALTER TABLE website_lead_outcomes ADD COLUMN occurred_at TEXT NOT NULL DEFAULT '';
ALTER TABLE website_lead_outcomes ADD COLUMN environment TEXT NOT NULL DEFAULT 'legacy';

CREATE INDEX IF NOT EXISTS idx_website_visitors_environment_seen
  ON website_visitors(environment, last_seen_at);
CREATE INDEX IF NOT EXISTS idx_website_journeys_environment_event
  ON website_journeys(environment, last_event_at);
CREATE INDEX IF NOT EXISTS idx_website_events_environment_event
  ON website_events(environment, occurred_at, event_type);
CREATE INDEX IF NOT EXISTS idx_website_chat_environment_expiry
  ON website_chat_messages(environment, expires_at);

CREATE TABLE IF NOT EXISTS website_consent_daily_v2 (
  environment TEXT NOT NULL,
  day TEXT NOT NULL,
  banner_shown INTEGER NOT NULL DEFAULT 0,
  necessary_only INTEGER NOT NULL DEFAULT 0,
  analytics_only INTEGER NOT NULL DEFAULT 0,
  marketing_only INTEGER NOT NULL DEFAULT 0,
  all_optional INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (environment, day)
);

CREATE TABLE IF NOT EXISTS website_statistical_aggregate_v2 (
  environment TEXT NOT NULL,
  day TEXT NOT NULL,
  hour_utc INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  page_path TEXT NOT NULL DEFAULT '',
  referrer_host TEXT NOT NULL DEFAULT '',
  device_type TEXT NOT NULL DEFAULT '',
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (environment, day, hour_utc, event_type, page_path, referrer_host, device_type)
);

CREATE INDEX IF NOT EXISTS idx_website_statistical_aggregate_v2_day
  ON website_statistical_aggregate_v2(environment, day, event_type);

CREATE TABLE IF NOT EXISTS website_stat_receipts (
  event_id TEXT PRIMARY KEY,
  environment TEXT NOT NULL,
  received_at TEXT NOT NULL
);
