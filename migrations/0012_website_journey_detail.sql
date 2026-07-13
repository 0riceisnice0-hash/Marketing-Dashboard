ALTER TABLE website_events ADD COLUMN link_target TEXT NOT NULL DEFAULT '';
ALTER TABLE website_events ADD COLUMN page_duration_seconds INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_website_events_journey_time ON website_events(journey_id, occurred_at);
