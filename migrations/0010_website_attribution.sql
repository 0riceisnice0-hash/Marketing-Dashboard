CREATE TABLE IF NOT EXISTS website_journeys (
  journey_id TEXT PRIMARY KEY,
  first_event_at TEXT NOT NULL,
  last_event_at TEXT NOT NULL,
  landing_path TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  medium TEXT NOT NULL DEFAULT '',
  campaign TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  term TEXT NOT NULL DEFAULT '',
  referrer_host TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS website_events (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  page_path TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  product_collection TEXT NOT NULL DEFAULT '',
  price_amount REAL NOT NULL DEFAULT 0,
  price_currency TEXT NOT NULL DEFAULT 'GBP',
  FOREIGN KEY (journey_id) REFERENCES website_journeys(journey_id)
);

CREATE INDEX IF NOT EXISTS idx_website_events_occurred_at ON website_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_website_events_journey ON website_events(journey_id, event_type);
