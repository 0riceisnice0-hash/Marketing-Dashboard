-- AI Receptionist V1: browser-test calls, transcripts, notifications and an
-- audit log.
--
-- The schema is written for the telephone integration that follows, not just
-- the browser prototype. A call has a `source` (browser_test today; twilio,
-- focus or sip later), an `external_call_id` for the carrier's own reference,
-- and both `caller_number` and `called_number` so an inbound line can be
-- recorded without a redesign. A browser test stores the operator's
-- "simulated caller number" in `caller_number` and says so in `metadata_json`.
--
-- Nothing here stores audio. The transcript is text only.

CREATE TABLE IF NOT EXISTS reception_calls (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'browser_test',
  external_call_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL DEFAULT '',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  end_reason TEXT NOT NULL DEFAULT '',
  caller_number TEXT NOT NULL DEFAULT '',
  called_number TEXT NOT NULL DEFAULT '',
  caller_name TEXT NOT NULL DEFAULT '',
  callback_number TEXT NOT NULL DEFAULT '',
  caller_email TEXT NOT NULL DEFAULT '',
  postcode TEXT NOT NULL DEFAULT '',
  requested_person TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  action_required TEXT NOT NULL DEFAULT '',
  urgency TEXT NOT NULL DEFAULT '',
  resolved_during_call INTEGER NOT NULL DEFAULT 0,
  summary_status TEXT NOT NULL DEFAULT 'pending',
  summary_error TEXT NOT NULL DEFAULT '',
  summary_model TEXT NOT NULL DEFAULT '',
  notification_status TEXT NOT NULL DEFAULT 'pending',
  realtime_model TEXT NOT NULL DEFAULT '',
  started_by TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reception_calls_started
  ON reception_calls(started_at);
CREATE INDEX IF NOT EXISTS idx_reception_calls_source_status
  ON reception_calls(source, status);
CREATE INDEX IF NOT EXISTS idx_reception_calls_external
  ON reception_calls(source, external_call_id);

-- One row per spoken turn. `role` is 'user' (the caller) or 'assistant' (the
-- receptionist), matching the convention already used by website_chat_messages.
CREATE TABLE IF NOT EXISTS reception_call_messages (
  id TEXT PRIMARY KEY,
  call_id TEXT NOT NULL REFERENCES reception_calls(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  role TEXT NOT NULL,
  body TEXT NOT NULL,
  spoken_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reception_call_messages_call
  ON reception_call_messages(call_id, sequence);

-- Every notification the pipeline generates, whether or not it was delivered.
-- V1 only ever writes status 'simulated' through the simulated provider; a real
-- provider (Brevo) writes 'sent' or 'failed' through the same interface.
CREATE TABLE IF NOT EXISTS reception_notifications (
  id TEXT PRIMARY KEY,
  call_id TEXT NOT NULL REFERENCES reception_calls(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'email',
  provider TEXT NOT NULL DEFAULT 'simulated',
  status TEXT NOT NULL DEFAULT 'simulated',
  recipient TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  provider_reference TEXT NOT NULL DEFAULT '',
  error TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reception_notifications_call
  ON reception_notifications(call_id, created_at);

-- Technical audit trail per call: session created, tool calls, finalisation,
-- summary and notification outcomes, client-reported errors.
CREATE TABLE IF NOT EXISTS reception_call_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  call_id TEXT NOT NULL,
  type TEXT NOT NULL,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reception_call_events_call
  ON reception_call_events(call_id, id);
