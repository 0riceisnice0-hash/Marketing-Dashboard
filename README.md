# Marketing Dashboard

All-in-one marketing operations dashboard for tickets, ideas, tasks, content requests, website work, tools, and shipped updates.

## Live app

Use the Cloudflare Pages URL for the real dashboard:

https://marketing-dashboard-1d0.pages.dev

GitHub Pages is only static hosting and cannot run the login API, Cloudflare Functions, or D1 database. Do not use the GitHub Pages URL for the working app.

## Stack

- Cloudflare Pages for the frontend.
- Cloudflare Pages Functions for the API.
- Cloudflare D1 for tickets, tasks, ideas, website updates, content requests, notes, and changelog data.
- GitHub connected to Cloudflare Pages for automatic deploys on push.

## First login

The users live in `functions/_data/users.js`. Password values are intentionally not committed because this repository is public.

| User | Username | Password secret |
| --- | --- | --- |
| Zac | `zac` | `PASSWORD_ZAC` |
| Adam | `adam` | `PASSWORD_ADAM` |
| Nick | `nick` | `PASSWORD_NICK` |

For local development, create `.dev.vars` with:

```bash
PASSWORD_ZAC=change-this
PASSWORD_ADAM=change-this
PASSWORD_NICK=change-this
SESSION_SECRET=change-this-local-session-secret
```

For Cloudflare, add those same names as Pages/Workers secrets before using real data.

## Cloudflare setup

The current project is deployed to Cloudflare Pages as `marketing-dashboard`, backed by the D1 database `marketing_dashboard`.

For a fresh setup:

1. Create a Cloudflare Pages project named `marketing-dashboard`.
2. Set output directory to `public`.
3. Create a D1 database named `marketing_dashboard`.
4. Replace `database_id` in `wrangler.toml` with the D1 database ID.
5. Run the migration:

```bash
npm install
npm run db:migrate:remote
```

6. Add a Pages/Workers secret named `SESSION_SECRET`:

```bash
npx wrangler pages secret put SESSION_SECRET
```

7. Add the three password secrets:

```bash
npx wrangler pages secret put PASSWORD_ZAC
npx wrangler pages secret put PASSWORD_ADAM
npx wrangler pages secret put PASSWORD_NICK
```

## Local development

```bash
npm install
npm run db:migrate:local
npm run dev
```

Open the local URL from Wrangler and sign in with one of the temporary users.

Local development is optional. The live dashboard runs on Cloudflare and does not require your personal machine to stay on.

## What is included

- Dashboard overview with open tickets, urgent work, content requests, and website updates.
- Ticket board with New, In Progress, Waiting on Someone, and Done lanes.
- Ideas bank for staff suggestions.
- Marketing roadmap split into Today, This Week, and Later.
- Website tab for planned/live site work and shipped updates.
- Content request board for photos, videos, reviews, case studies, and showroom assets.
- Tools placeholder section for the future Facebook messaging app and other marketing tools.
- Changelog for weekly shipped updates.

## Next sensible upgrades

- Replace the temporary shared password with Cloudflare Access or hashed credentials.
- Add role-specific permissions.
- Add R2 uploads for screenshots, photos, and video assets.
- Add the Facebook messaging module as a separate Worker-backed tool.
