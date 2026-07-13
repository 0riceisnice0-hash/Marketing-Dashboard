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
- Tools tab for the Fenster Meta/social inbox bot.
- Tools tab Website section for consented website journeys, WindowCAD quote outcomes, forms and contact intent.
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

The Fenster theme creates an opaque `FG2-…` reference for a quote journey and
appends it to every WindowCAD URL using the configured `reference` parameter.
WindowCAD must have its hidden **Reference** customer field enabled and mapped
from that URL parameter. When WindowCAD posts to WordPress, WordPress relays a
non-PII `quote_completed` event to this dashboard and D1 joins it to the first
website event with the same reference.

Required configuration (never commit either secret):

- Optional hardening: Cloudflare Pages `WEBSITE_INGEST_SECRET` and matching WordPress/Bedrock `FENSTER_WEBSITE_DASHBOARD_SECRET`. The first release also accepts a server relay which declares a trusted Fenster host, by the owner's explicit phase-one decision; replace that fallback with strict HMAC validation before treating the endpoint as hostile-facing.
- Optional WordPress overrides: `FENSTER_WEBSITE_DASHBOARD_URL` and `FENSTER_WINDOWCAD_REFERENCE_PARAMETER` (default: `reference`)

The browser endpoint accepts only `fensterglazing.com`, `www.fensterglazing.com`
and `test.fensterglazing.com` origins. Browser events only run after the site
cookie choice is accepted. Names, emails, phones, addresses and raw WindowCAD
fields remain in WordPress/AdminBase and are never sent to this dashboard.

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
