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
- Projects → Tools hub with two full-screen tools: the Fenster Meta Bot (social inbox) and the Website Tracker.
- Website Tracker views: Overview (KPIs, daily traffic chart, funnel, consent health, recent lead outcomes), Acquisition (channels, quote products, top CTAs), Pages (consented and anonymous top pages, devices), Customers (visitor journeys) and Legend chats.
- Auto-refresh-safe browser-session drafts for end-of-day reports, Facebook/Instagram replies and bot context, so the 60-second refresh cannot discard text being written.
- Notes attached to records through the shared `notes` table.

## Project Structure

```text
public/
  index.html          Main HTML shell.
  app.js              Main frontend app, rendering, tab logic, board logic, API calls.
  styles.css          Dashboard styling.
  fenster-logo.png    Local logo asset.

functions/
  api/[[path]].js     Main Cloudflare Pages API: login, records, notes, Fenster bot endpoints.
  _data/users.js      Login users and secret names.
  webhooks/meta.js    Meta/Facebook webhook handler.

migrations/
  0001_initial.sql    Core dashboard tables.
  0002_*.sql          Today's plan, social posts, Fenster conversation tables.
  0003-0007_*.sql     Bot decisions, queue, prompt context, action plan, guidelines.

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

## Login And Secrets

Users live in `functions/_data/users.js`.

Passwords are not committed. Cloudflare Pages must have these secrets:

- `PASSWORD_ZAC`
- `PASSWORD_ADAM`
- `PASSWORD_NICK`
- `SESSION_SECRET`

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

The Fenster theme creates an opaque `FG2-…` reference for a quote journey and
appends it to WindowCAD URLs only after optional-cookie acceptance, using the configured `tracking` parameter.
WindowCAD must map that URL parameter into its separate **Tracking** customer
field. The office-owned **Reference** field is intentionally not used. When
WindowCAD posts to WordPress, WordPress relays a
non-PII `quote_completed` event to this dashboard and D1 joins it to the first
website event with the same reference. The relay must run only for a valid `FG2-…` Tracking value.

The theme also creates opaque `FGV-…` visitor values after acceptance. `FG2-…`
and `FGV-…` persist for 90 days in the same consenting browser. The tracker
stores first touch, page views, time on page, 25/50/75/90% scroll milestones,
meaningful link/CTA clicks, quote/form/contact intent, form starts and the first
validation warning (field name only), plus completed WindowCAD quotes. The
Website Tracker UI provides an acquisition funnel, consent health, an anonymous
customer list, a clickable chronological journey timeline and a manual non-PII
lead status (`new`, `contacted`, `appointment`, `won` or `lost`) for a completed
`FG2-...` lead. This is an attribution status, not a CRM record: one journey can
legitimately produce more than one WindowCAD submission until a unique WindowCAD
project ID is included in the callback.

If optional cookies are rejected, WindowCAD receives `rejected-cookies`; before
a choice it receives `cookie-consent-not-accepted`. Those values still reach
the office/CRM but must never create or join a dashboard journey. Consent health
uses daily aggregate-only `accepted` and `rejected` counters, with no visitor
ID, URL, referrer, device or personal data. Banner impressions are deliberately
not counted because anonymous crawler/session traffic makes them unreliable.

The separate statistical aggregate endpoint may count non-consented page views and
high-level interaction totals for website improvement. It stores only hourly
buckets by page, broad device class and referrer host. It must not be used for
individual tracking, advertising measurement, remarketing, cross-site attribution
or lead joins.

Required configuration (never commit either secret):

- Optional hardening: Cloudflare Pages `WEBSITE_INGEST_SECRET` and matching WordPress/Bedrock `FENSTER_WEBSITE_DASHBOARD_SECRET`. The first release also accepts a server relay which declares a trusted Fenster host, by the owner's explicit phase-one decision; replace that fallback with strict HMAC validation before treating the endpoint as hostile-facing.
- Optional WordPress overrides: `FENSTER_WEBSITE_DASHBOARD_URL` and `FENSTER_WINDOWCAD_REFERENCE_PARAMETER` (default: `tracking`)

The browser endpoint accepts only `fensterglazing.com`, `www.fensterglazing.com`
and `test.fensterglazing.com` origins. Browser events only run after the site
cookie choice is accepted. Names, emails, phones, addresses and raw WindowCAD
fields remain in WordPress/AdminBase and are never sent to this dashboard.

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

## Common Gotchas

- Pushing to GitHub may not update the live Cloudflare app. Run the Wrangler Pages deploy command.
- The live app URL is `https://marketing-dashboard-1d0.pages.dev`.
- `public/app.js` is a single large file. Most UI bugs are in render helpers near the bottom or tab render functions near the middle.
- If a tab header changes but the old tab content stays visible, a JavaScript error probably happened during render.
- Notes are generic. They should use `/api/notes/:table/:id`, not ticket-only code.
- If changing card metadata dropdowns, make sure only fields with real option arrays are rendered as selects.
- The smoke test has a mock SQL layer. If backend SQL changes, update `scripts/smoke-test.mjs` too.

## Last Known Deploy Pattern

Previous successful Cloudflare deployments used:

```bash
npx wrangler pages deploy public --project-name marketing-dashboard --branch main
```

Keep this command in future Codex chats so the same GitHub-vs-Cloudflare confusion does not happen again.
