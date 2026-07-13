ALTER TABLE website_events ADD COLUMN event_value INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS website_lead_outcomes (
  journey_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'new',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_website_lead_outcomes_status ON website_lead_outcomes(status, updated_at);
