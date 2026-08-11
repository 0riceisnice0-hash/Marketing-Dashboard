-- Traffic classification and the consent-free ad click log.
--
-- Two problems this closes.
--
-- 1. NOTHING CLASSIFIED AUTOMATED TRAFFIC on the consented path. `websiteEvent`
--    validated the origin and the ingest secret and then wrote the row, so any
--    crawler executing JavaScript became a real visitor with a real journey.
--    The aggregate path had a partial check via `websiteStatDevice`; the
--    visitor/journey/event tables had none at all.
--
-- 2. AD ATTRIBUTION DEPENDED ON CONSENT, which it does not need to. The
--    campaign is in the landing URL, and counting an arrival stores nothing on
--    anyone's device. `website_ad_clicks` records that arrival so cost per lead
--    per campaign survives a consent-first model.
--
-- `traffic_class` values, each meaning something different on purpose:
--   human        - a user agent with no automation signature. Not a claim that
--                  a person was definitely present; see inc/traffic-classification.php.
--   bot          - self-identified automation.
--   server       - a signed server-to-server relay (WindowCAD callback,
--                  reconciliation). Never a browser and never a crawler.
--   unclassified - written before this migration. The user agent was never
--                  stored, so it CANNOT be recovered. Do not report these as
--                  human.
--   no_signal    - a pre-migration row that produced no engagement of any kind
--                  and lasted zero seconds. Evidence of absence, not proof of a
--                  bot. Useful for re-reading history; not a verdict.

ALTER TABLE website_visitors ADD COLUMN traffic_class TEXT NOT NULL DEFAULT 'unclassified';
ALTER TABLE website_journeys ADD COLUMN traffic_class TEXT NOT NULL DEFAULT 'unclassified';
ALTER TABLE website_events   ADD COLUMN traffic_class TEXT NOT NULL DEFAULT 'unclassified';

CREATE INDEX IF NOT EXISTS idx_website_visitors_class
  ON website_visitors(environment, traffic_class, last_seen_at);
CREATE INDEX IF NOT EXISTS idx_website_journeys_class
  ON website_journeys(environment, traffic_class, last_event_at);
CREATE INDEX IF NOT EXISTS idx_website_events_class
  ON website_events(environment, traffic_class, occurred_at, event_type);

-- Historic re-read. A journey that recorded no engagement event of any kind and
-- began and ended in the same instant showed nothing a person does. Marked so
-- old reports can exclude it, NOT deleted, so the call stays reversible.
UPDATE website_journeys
SET traffic_class = 'no_signal'
WHERE traffic_class = 'unclassified'
  AND first_event_at = last_event_at
  AND journey_id NOT IN (
    SELECT DISTINCT journey_id FROM website_events
    WHERE event_type NOT IN ('visitor_seen', 'page_view')
  );

UPDATE website_events
SET traffic_class = 'no_signal'
WHERE traffic_class = 'unclassified'
  AND journey_id IN (
    SELECT journey_id FROM website_journeys WHERE traffic_class = 'no_signal'
  );

-- The consent-free ad click log.
--
-- THE CLICK ID IS NEVER STORED HERE. `AI.md`: "Ad click IDs never enter the
-- Marketing Dashboard or AdminBase." `click_hash` is a salted one-way hash used
-- only so a reload of the same landing page does not count as a second click.
-- The raw gclid/gbraid/wbraid stays in WordPress, where it already lives for the
-- offline conversion feed.
CREATE TABLE IF NOT EXISTS website_ad_clicks (
  click_hash      TEXT PRIMARY KEY,
  click_type      TEXT NOT NULL DEFAULT '',
  environment     TEXT NOT NULL DEFAULT 'production',
  occurred_at     TEXT NOT NULL,
  landing_path    TEXT NOT NULL DEFAULT '',
  source          TEXT NOT NULL DEFAULT '',
  medium          TEXT NOT NULL DEFAULT '',
  campaign        TEXT NOT NULL DEFAULT '',
  content         TEXT NOT NULL DEFAULT '',
  term            TEXT NOT NULL DEFAULT '',
  ad_group        TEXT NOT NULL DEFAULT '',
  device_type     TEXT NOT NULL DEFAULT '',
  traffic_class   TEXT NOT NULL DEFAULT 'human',
  -- The same-visit join. An opaque FGA- reference that exists only for this
  -- visit and is never written to the visitor's device.
  attribution_ref TEXT NOT NULL DEFAULT '',
  outcome         TEXT NOT NULL DEFAULT '',
  outcome_at      TEXT NOT NULL DEFAULT '',
  outcome_value   REAL NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_website_ad_clicks_day
  ON website_ad_clicks(environment, occurred_at, campaign);
CREATE INDEX IF NOT EXISTS idx_website_ad_clicks_ref
  ON website_ad_clicks(attribution_ref);
CREATE INDEX IF NOT EXISTS idx_website_ad_clicks_outcome
  ON website_ad_clicks(environment, outcome, outcome_at);
