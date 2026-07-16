CREATE TABLE IF NOT EXISTS website_statistical_aggregate (
  day TEXT NOT NULL,
  hour_utc INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  page_path TEXT NOT NULL DEFAULT '',
  referrer_host TEXT NOT NULL DEFAULT '',
  device_type TEXT NOT NULL DEFAULT '',
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, hour_utc, event_type, page_path, referrer_host, device_type)
);

CREATE INDEX IF NOT EXISTS idx_website_statistical_aggregate_day
  ON website_statistical_aggregate(day, event_type);
