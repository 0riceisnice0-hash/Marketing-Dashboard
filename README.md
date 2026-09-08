# Marketing Dashboard

Cloudflare Pages marketing operations dashboard for Fenster Glazing.

Live app:

https://marketing-dashboard-1d0.pages.dev

Important: GitHub Pages is not the working app. The dashboard needs Cloudflare Pages Functions and D1, so use the Cloudflare Pages URL.

## Read This First

This project is a static frontend plus Cloudflare Pages Functions.

The repository is on GitHub, but this Cloudflare Pages project has historically needed an explicit Wrangler deploy after pushing code:

```bash
npx wrangler pages deploy public --project-name marketing-dashboard --branch main
```

Do not assume a GitHub push alone has updated the live dashboard. After deploying, check the live asset:

```bash
curl https://marketing-dashboard-1d0.pages.dev/app.js
```

If the live file still contains old code, Cloudflare has not deployed the new version yet.

## What The App Does

- Dashboard overview for current marketing work.
- Tickets board with drag-and-drop workflow movement.
- Today's Plan for shared daily tasks.
- Action Plan for the wider Fenster marketing plan.
- Social Media planner and guidelines.
- Ideas board.
- Roadmap tasks.
- Website work board.
- **The Website Tracker is the landing view.** Everything above sits under a collapsible "Marketing workspace" group in the sidebar. The tracker was previously three levels deep at Projects → Tools → Website Tracker; that route still works and still hosts the Fenster Meta Bot.
- Website Tracker tabs, each named for the question it answers: **Overview** (attributable share, headline counts, daily traffic chart, funnel, consent health), **Leads** (attributed completed quotes and sent forms with first-touch source and office outcome), **Channels** (sources, quote products, top CTAs), **Behaviour** (consented and anonymous top pages, devices, form friction), **Visitors** (consented visitor list and journey timelines) and **Legend** (chat QA).
- Reporting period control: 7 / 30 / 90 days / 1 year, driving every figure and the daily chart.
- Auto-refresh-safe browser-session drafts for end-of-day reports, Facebook/Instagram replies and bot context, so the 60-second refresh cannot discard text being written.
- Notes attached to records through the shared `notes` table.
- **AI Receptionist** (first-class sidebar section): an out-of-hours phone
  assistant prototype. **Test Call** connects the laptop microphone to the
  OpenAI Realtime API over WebRTC, **Calls** lists every saved call with its
  transcript, structured summary and the simulated email the office would
  have received. See [AI Receptionist](#ai-receptionist) below.

## Project Structure

```text
public/
  index.html          Main HTML shell.
  app.js              Main frontend app, rendering, tab logic, board logic, API calls.
  reception-call.js   Browser test-call transport: microphone, WebRTC, Realtime events.
  styles.css          Dashboard styling.
  fenster-logo.png    Local logo asset.

functions/
  api/[[path]].js     Main Cloudflare Pages API: login, records, notes, Fenster bot endpoints.
  _data/users.js      Login users and secret names.
  _lib/http.js        Shared JSON response and HTML escaping helpers.
  _reception/         AI Receptionist: API routes, receptionist prompt, verified
                      knowledge, post-call summary and notification providers.
  webhooks/meta.js    Meta/Facebook webhook handler.

migrations/
  0001_initial.sql    Core dashboard tables.
  0002_*.sql          Today's plan, social posts, Fenster conversation tables.
  0003-0007_*.sql     Bot decisions, queue, prompt context, action plan, guidelines.
  0019_*.sql          AI Receptionist calls, transcripts, notifications, events.

scripts/
  smoke-test.mjs      API smoke test with an in-memory D1-style mock.

workers/
  lead-email/         Separate Worker for sending lead emails.

wrangler.toml         Cloudflare Pages/D1 config.
package.json          Wrangler scripts.
```

There is currently no `.github/workflows` deployment workflow in this repo.

## How The Code Works

`public/index.html` loads `public/app.js`.

`public/app.js`:

- builds the sidebar tabs;
- calls `/api/me` to restore a session;
- calls `/api/bootstrap` to load all dashboard data;
- renders the current tab into `#view`;
- sends record changes to `/api/records/:table`;
- opens notes through `/api/notes/:table/:id`;
- renders the Tools/Fenster bot UI and calls `/api/fenster/...`.

`functions/api/[[path]].js` is the backend router. It handles:

- `POST /api/login`
- `GET /api/me`
- `GET /api/bootstrap`
- `GET/POST/PATCH/DELETE /api/records/:table`
- `GET/POST /api/notes/:table/:id`
- `/api/fenster/...` bot and conversation endpoints
- `/api/reception/...` AI Receptionist endpoints (see below)

The database is Cloudflare D1. Tables are created by the SQL files in `migrations/`.

## Data Tables

Main record tables:

- `tickets`
- `ideas`
- `tasks`
- `todays_plan`
- `social_posts`
- `social_guidelines`
- `action_plan_items`
- `content_requests`
- `website_updates`
- `changelog`
- `notes`

Fenster bot tables:

- `fenster_conversations`
- `fenster_messages`
- `fenster_reviews`
- `fenster_events`
- `fenster_settings`
- `fenster_bot_queue`
- `website_journeys` (opaque `FG2-…` journey references and first-touch attribution)
- `website_events` (quote starts, forms, contact clicks and completed WindowCAD quotes; no customer PII)
- `website_statistical_aggregate` (hourly aggregate-only statistics for non-consented traffic; no visitor IDs or journeys)

AI Receptionist tables:

- `reception_calls` (one row per call: source, timings, caller details, structured summary, summary/notification status)
- `reception_call_messages` (the transcript, one row per spoken turn; no audio is stored)
- `reception_notifications` (every generated notification and its delivery status; V1 only ever writes `simulated`)
- `reception_call_events` (technical audit trail per call)

## Login And Secrets

Users live in `functions/_data/users.js`.

Passwords are not committed. Cloudflare Pages must have these secrets:

- `PASSWORD_ZAC`
- `PASSWORD_ADAM`
- `PASSWORD_NICK`
- `SESSION_SECRET`

The AI Receptionist additionally needs `OPENAI_API_KEY` (already used by the
Meta bot). Optional receptionist settings, all plain environment variables:

- `OPENAI_REALTIME_MODEL` (default `gpt-realtime-2.1`)
- `OPENAI_SUMMARY_MODEL` (default `gpt-5.6-luna`; falls back to `gpt-5.4-mini` if the configured model is unknown)
- `OPENAI_TRANSCRIBE_MODEL` (default `gpt-4o-transcribe`)
- `OPENAI_REALTIME_VOICE` (default `marin`)
- `OPENAI_REALTIME_VAD` (`semantic_vad`, the default, or `server_vad`)
- `OPENAI_REALTIME_NOISE_REDUCTION` (`far_field`, the default for a laptop microphone, or `near_field`)
- `RECEPTION_NOTIFICATION_TO` (default `info@fensterglazing.com`)

To add the OpenAI secret to the Pages project if it is ever missing:

```bash
npx wrangler pages secret put OPENAI_API_KEY --project-name marketing-dashboard
```

For local development, copy `.dev.vars.example` to `.dev.vars`.

## Local Development

Local development is optional. The real app runs on Cloudflare.

```bash
npm install
npm run db:migrate:local
npm run dev
```

If PowerShell blocks `npm.ps1`, use:

```powershell
npm.cmd install
npm.cmd run dev
```

Wrangler local D1 can be awkward. If local Pages dev says tables are missing, verify the real behavior with the smoke test and deploy to Cloudflare when the code is ready.

## Testing

Run the smoke test before pushing:

```bash
npm run smoke
```

This exercises the Pages Function API with an in-memory mock database.

Also run JS syntax checks after editing frontend/backend JS:

```bash
node --check public/app.js
node --check functions/api/[[path]].js
```

## Updating The Live Site

Recommended workflow:

```bash
git status -sb
npm run smoke
node --check public/app.js
node --check functions/api/[[path]].js
git add .
git commit -m "Describe the update"
git push origin main
npx wrangler pages deploy public --project-name marketing-dashboard --branch main
```

The deploy command prints a preview URL like:

```text
https://<hash>.marketing-dashboard-1d0.pages.dev
```

After deploy, confirm production is serving the new code:

```bash
curl https://marketing-dashboard-1d0.pages.dev/app.js
```

Search that output for a string from your new code. If it is not there, Cloudflare is still serving an older deployment.

Three things that will catch you out:

- **`--branch main` is not optional.** Without it wrangler names the deployment
  after your current git branch and publishes a *preview*, not production. On
  3 August 2026 a deploy from `codex/website-tracking-repair` silently went to
  `codex-website-tracking-repai.marketing-dashboard-1d0.pages.dev` while
  production stayed on the old build.
- **Cache-bust the verification.** Immediately after a deploy the edge can serve
  the old and new file to consecutive requests. `curl` the asset with a
  `?cb=$(date +%s)` query and compare an `md5sum` against
  `git show <sha>:public/app.js | md5sum`, rather than trusting a single fetch.
- **`main` is not automatically the source of truth.** Production has been
  deployed from a working branch before, leaving `main` *behind* what is live.
  Establish what is actually running by checksum before assuming.

### Migrations that add a column

Adding a column with a `DEFAULT` stamps every existing row with that default. If
reporting queries filter on the new column, all historical data silently
disappears the moment the migration runs — this is exactly what happened on
31 July 2026 (see `WEBSITE-TRACKER.md`). Before deploying such a migration,
check what the reads will exclude:

```bash
npx wrangler d1 execute marketing_dashboard --remote \
  --command "SELECT environment, COUNT(*) FROM website_events GROUP BY environment"
```

## Database Migrations

For local D1:

```bash
npm run db:migrate:local
```

For production D1:

```bash
npm run db:migrate:remote
```

Only run remote migrations when a code change actually needs schema changes.

## Website / WindowCAD Attribution

Read [WEBSITE-TRACKER.md](WEBSITE-TRACKER.md) before interpreting the Website
Tracker or changing its consent, WindowCAD or chat behaviour. It is the
operator-facing source of truth for data meanings and limits.

The Fenster theme creates an opaque `FG2-…` reference for an analytics-consented
30-minute quote journey and appends it to WindowCAD URLs using the configured
`tracking` parameter. A marketing-only visitor instead receives an `FGA-…`
attribution reference, which never creates a dashboard visitor or journey.
WindowCAD must map that URL parameter into its separate **Tracking** customer
field. The office-owned **Reference** field is intentionally not used. When
WindowCAD posts to WordPress, WordPress relays a
non-PII `quote_completed` event to this dashboard and D1 joins it to the first
website event with the same reference. Only a valid `FG2-…` value can join a
dashboard journey; `FGA-…` remains private marketing attribution.

The theme also creates opaque `FGV-…` visitor values after analytics consent.
`FGV-…` persists for 90 days in the same consenting browser, while `FG2-…`
rotates after 30 minutes of inactivity. The tracker
stores first touch, page views, time on page, 25/50/75/90% scroll milestones,
meaningful link/CTA clicks, quote/form/contact intent, form starts and the first
validation warning (field name only), plus completed WindowCAD quotes. The
Website Tracker UI provides an acquisition funnel, consent health, an anonymous
customer list, a clickable chronological journey timeline and a manual non-PII
lead status (`new`, `contacted`, `qualified`, `appointment`, `won` or `lost`) for a completed
`FG2-...` lead. This is an attribution status, not a CRM record: one journey can
legitimately produce more than one WindowCAD submission until a unique WindowCAD
project ID is included in the callback.

If optional cookies are rejected, WindowCAD receives `rejected-cookies`; before
a choice it receives `cookie-consent-not-accepted`, and the quote iframe cannot
load. Those values must never create or join a dashboard journey. Consent health
uses environment-separated daily aggregate-only counters for banner shown,
necessary-only, analytics-only, marketing-only and all cookies, with no visitor
ID, URL, referrer, device or personal data.

The separate statistical aggregate endpoint may count non-consented page views and
high-level interaction totals for website improvement. It stores only hourly
buckets by page, broad device class and referrer host. It must not be used for
individual tracking, advertising measurement, remarketing, cross-site attribution
or lead joins.

Required configuration (never commit secrets):

- Cloudflare Pages `WEBSITE_INGEST_SECRET` and matching WordPress/Bedrock
  `FENSTER_WEBSITE_DASHBOARD_SECRET` (or the protected WordPress option). Server
  relays and `/api/website/outcome-ingest` are rejected without this signature.
- Optional WordPress overrides: `FENSTER_WEBSITE_DASHBOARD_URL` and `FENSTER_WINDOWCAD_REFERENCE_PARAMETER` (default: `tracking`)

The browser endpoint accepts only `fensterglazing.com`, `www.fensterglazing.com`
and `test.fensterglazing.com` origins. It derives `production` or `test` from the
real browser Origin; production reporting filters out test and legacy rows.
Identified browser events only run after analytics consent, carry an idempotent
event ID, and retry without PII. Names, emails, phones, addresses, ad click IDs
and raw WindowCAD fields remain in WordPress/AdminBase and are never sent to
this dashboard.

Focus Group phone integration is intentionally pending API, webhook or scheduled
call-detail export access. Website `phone_click` means dial intent only; it is
not an answered or confirmed call.

## Legend Chat Quality Assurance

Legend is live. Its composer is immediately available; using it accepts the
displayed chat terms. The Website Tracker stores the actual user/assistant
transcript in `website_chat_messages` for 30 days for authenticated QA review.
Accepted-cookie chats link to the existing `FGV-...` visitor, `FG2-...` journey,
page path and timestamp and appear in the visitor timeline and **Legend chats**.
Rejected-cookie chats are deliberately chat-only: they have no `FGV`/`FG2`,
journey, browsing events or attribution but remain visible in **Legend chats**.
Do not copy transcript personal details into other tools.

## AI Receptionist

**AI Receptionist** is a first-class sidebar section next to the Website
Tracker. It is the V1 of Fenster's out-of-hours phone assistant: a browser
prototype that proves the whole workflow before a real telephone number is
connected. Nothing in it is Legend; Legend is website chat QA.

What happens on **Test Call → Start Test Call**:

1. The browser asks for microphone permission.
2. `POST /api/reception/calls` creates a `browser_test` call row.
3. `POST /api/reception/calls/:id/session` builds the receptionist
   instructions server-side and asks OpenAI for a short-lived Realtime
   client secret. The browser never receives `OPENAI_API_KEY`.
4. `public/reception-call.js` opens an `RTCPeerConnection` to
   `https://api.openai.com/v1/realtime/calls`, sends the microphone track,
   plays the receptionist through an audio element, and sends
   `response.create` so the receptionist speaks its greeting first.
5. Realtime transcription events build a structured in-memory transcript
   (never scraped from the DOM). The voice model may call one tool,
   `search_fenster_knowledge`, which the browser relays to
   `POST /api/reception/calls/:id/tool`.
6. **End Call** closes the microphone, audio and WebRTC resources, then
   `POST /api/reception/calls/:id/finalise` stores the transcript,
   summarises it server-side with the Responses API (Structured Outputs),
   generates the office email and records it as `simulated`. Finalisation
   is idempotent. A failed summary keeps the call with
   `summary_status = failed` and a **Retry summary** button.
7. The call appears in **Calls**, newest first, with the transcript, the
   structured summary and the exact email preview. **No email is sent.**

Where things live:

- `functions/_reception/prompt.js` is the receptionist's personality and
  rules. Edit it there; it is not stored in D1.
- `functions/_reception/knowledge.js` holds the owner-confirmed Fenster facts
  (taken from the website repository's `LIVECHAT.md` and Legend backend) and
  `searchFensterKnowledge(query)`, the retrieval boundary to widen later.
- `functions/_reception/summary.js` is the post-call summariser.
- `functions/_reception/notifications.js` is `sendReceptionNotification()`
  and the `SimulatedNotificationProvider`. A Brevo provider slots in behind
  the same `deliver()` contract without touching the call pipeline.
- `functions/_reception/api.js` is the router for `/api/reception/*`.

Designed for what comes next: `reception_calls.source` (`browser_test` now;
`twilio`, `focus`, `sip` later), `external_call_id`, `caller_number` and
`called_number` already exist, and the receptionist logic takes no
dependency on the browser. Twilio, Focus Group, Brevo and CRM lookups are
deliberately not implemented yet.

Testing: `npm run smoke` covers the whole API with the OpenAI boundary
mocked (no live calls). A real microphone conversation has to be checked by
hand on the live dashboard.

## Common Gotchas

- Pushing to GitHub may not update the live Cloudflare app. Run the Wrangler Pages deploy command.
- The live app URL is `https://marketing-dashboard-1d0.pages.dev`.
- `public/app.js` is a single large file. Most UI bugs are in render helpers near the bottom or tab render functions near the middle.
- If a tab header changes but the old tab content stays visible, a JavaScript error probably happened during render.
- Notes are generic. They should use `/api/notes/:table/:id`, not ticket-only code.
- If changing card metadata dropdowns, make sure only fields with real option arrays are rendered as selects.
- The smoke test has a mock SQL layer. If backend SQL changes, update `scripts/smoke-test.mjs` too.
- The smoke test sends a browser `User-Agent`. Without one the website ingest endpoints classify the request as automated and drop it, which made the consent assertion fail after the bot filtering landed.
- A test call is ended automatically if you navigate away from the AI Receptionist section or close the tab, so the microphone is never left open.

## Last Known Deploy Pattern

Previous successful Cloudflare deployments used:

```bash
npx wrangler pages deploy public --project-name marketing-dashboard --branch main
```

Keep this command in future Codex chats so the same GitHub-vs-Cloudflare confusion does not happen again.
