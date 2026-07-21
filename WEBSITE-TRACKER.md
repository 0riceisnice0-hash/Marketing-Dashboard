# Fenster Website Tracker operating guide

This is the source of truth for how the Website Tracker works, what each number means, and its privacy boundaries. The live dashboard is [Marketing Dashboard](https://marketing-dashboard-1d0.pages.dev); it is an attribution and quality-assurance tool, **not** a CRM.

## What it is for

Use it to answer practical marketing questions:

- Which first-touch sources and landing pages create quote completions or forms?
- Where do people abandon the commercial journey?
- What did a consenting visitor actually do before their quote?
- Are visitors using Legend, phone/email links, forms or the quote tool?
- Which completed leads eventually become contacted, appointments, wins or losses?

Names, emails, phone numbers, addresses, quote details and other customer-entered data stay in WordPress/AdminBase. Do not paste them into this dashboard.

## The data flow

1. A visitor accepts optional cookies. The website creates an opaque browser visitor ID (`FGV-...`) and journey/quote ID (`FG2-...`).
2. The website sends consented, non-PII activity to the dashboard: pages, active time, scroll depth and meaningful actions.
3. When the quote tool opens, the site adds the `FG2-...` value to the WindowCAD URL's **tracking** parameter.
4. WindowCAD saves that value in its separate **Tracking** field. Its office-owned **Reference** field must remain untouched.
5. When WindowCAD posts a completed quote back to WordPress, WordPress relays only the opaque `FG2-...` completion to the dashboard. The dashboard attaches it to the matching visitor journey.

The join is deliberately two IDs:

| Value | Meaning | Where it appears |
| --- | --- | --- |
| `FGV-...` | Anonymous, consented browser visitor | Customer database and visitor timelines |
| `FG2-...` | Anonymous, consented journey/WindowCAD quote reference | Journey events and WindowCAD Tracking field |
| `rejected-cookies` | A quote was created after optional-cookie rejection | WindowCAD only; never joined to a dashboard journey |
| `cookie-consent-not-accepted` | A quote was created before a cookie choice | WindowCAD only; never joined to a dashboard journey |

An `FG2` is not expected to equal the visitor's `FGV`: it is the reference that lets the dashboard say “this visitor completed this WindowCAD quote.” One visitor can have multiple journeys and more than one quote submission.

## Consent, identity and privacy

- Accepted optional cookies are required for a persistent `FGV`, an `FG2`, browsing events, attribution and WindowCAD joining.
- A returning consenting browser normally keeps the same `FGV` for 90 days. Incognito, cleared site storage, a new browser/device or an expired ID becomes a different visitor.
- Rejected/no-choice visitors can still submit a WindowCAD quote or website form to the office, but they do **not** get a consented tracker visitor, journey or individual browsing record. Separate aggregate-only statistical totals may include their page views and high-level actions.
- Consent Health is aggregate-only: choices recorded, accepted, rejected and acceptance rate. It is never tied to a visitor, page, source, device or journey.
- Banner impressions are intentionally not counted. Crawlers and pre-consent sessions made that figure misleading.

### Non-consented statistical traffic

The dashboard also keeps a separate `website_statistical_aggregate` table for visitors who have not accepted optional cookies. This is aggregate-only measurement for website health: hourly page views, engagement, quote starts, form starts/sends and phone/email intent, grouped by page, broad device class and referrer host. It never receives `FGV`/`FG2`, creates a visitor or journey, or joins a lead to a person.

The individual browser request is reduced into an hourly bucket at ingestion. Do not add visitor IDs, IP-derived keys, fingerprints, ad click IDs, customer values or per-person timelines to this table. It must remain solely for improving the website. Consent is still required for individual journey tracking, ad measurement, remarketing or cross-site/cross-device attribution.

## How to read the dashboard

### Overview and funnel

| Metric | What it means | Do not read it as |
| --- | --- | --- |
| Unique visitors | Distinct consented `FGV` values in the selected period | All people who saw the website |
| Journeys | Consented visits/sessions recorded by the tracker | Distinct people |
| CTA clicks | Commercial links/buttons selected | A lead or a sale |
| Quote starts | Quote tool opened or loaded | A quote submitted |
| Forms started | A website form received meaningful interaction | A form sent |
| Forms sent | A website form was submitted | A confirmed appointment or sale |
| WindowCAD quotes | A callback confirmed WindowCAD received a completed quote | A unique person; one visitor may submit several |
| Phone or email clicks | Tap/click intent | A connected or answered call/email |
| Legend chats | Saved Legend conversations in the last 30 days | A lead or a human-support conversation |
| Won leads | Completed consented leads manually marked `won` | Automatically measured revenue |

The funnel is a diagnostic sequence: consented visitors → commercial CTA clicks → quote starts → leads. “Leads” is the total of completed WindowCAD quotes and sent forms, so a person who does both can contribute to both parts. Treat it as a conversion activity count, not a deduplicated CRM count.

Time on a page is based on visible/engaged browsing. It is useful for comparing pages and spotting short visits, but it is not a stopwatch and should not be treated as exact reading time.

### Acquisition, source and landing pages

First touch records the source, campaign and landing page that brought a consented visitor in. This is first-touch attribution, not proof that the last interaction caused the lead.

For Meta, keep ad destination URLs tagged, for example:

`utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}`

Then use source/campaign breakdowns to compare the leads and quote completions attributed to Meta with Google, direct traffic and other channels. If the UTM tags are absent, traffic will often appear as direct or unknown.

### Customer database and journey timeline

The Customer database is an anonymous list of consented browser visitors, not a list of CRM customers. Open a row to see the chronological journey: pages, active time, scroll milestones, clicks, quote actions, form milestones, contact taps and any consent-linked Legend chat activity.

Useful questions to ask of a timeline:

- Which landing page started the journey?
- Did they reach a product/local page before the quote tool?
- Did they open the tool and abandon, or did WindowCAD confirm completion?
- Did they favour a phone/email tap, a form or Legend instead?
- Is a high-intent route repeatedly failing at the same step?

The timeline does not contain typed form values, WindowCAD product configurations, calls or personal contact data.

### Lead outcomes

For a consented completed WindowCAD quote or form, staff can set a non-PII business outcome: `new`, `contacted`, `appointment`, `won` or `lost`. This is the bridge between website attribution and the office result. Apply it only after checking the actual lead in AdminBase/WindowCAD, and do not add personal details in dashboard notes.

## Legend chat quality assurance

Legend is live. The composer is immediately available; using it accepts the displayed chat terms, which disclose AI processing and 30-day QA retention.

- The dashboard stores the actual visitor and assistant transcript for 30 days so quality can be reviewed.
- With accepted optional cookies, the chat is linked to its `FGV`, `FG2` and page and appears in both the visitor journey and **Legend chats**.
- After rejected/no optional cookies, the transcript is chat-only: it has no visitor ID, journey, browsing events or attribution, but is still visible in **Legend chats** for QA.
- Legend chats are not proof of a lead. Look for a later quote/form/contact action or an office outcome before treating a chat as commercial value.
- Dashboard access is authenticated, but transcripts may contain personal information despite the warning. Do not copy them to unrelated systems.

## Calls and other channels

The website can measure a `tel:` link click, which is useful as dial intent. It cannot tell whether Focus Group answered the call, who called, duration, recording outcome, appointment or sale. When Focus Group provides an API, webhook or scheduled call-detail export, send non-PII call outcomes into the dashboard and use a shared lead/call reference where available. Until then, keep “phone clicks” labelled as intent only.

Other useful future additions, subject to consent and data minimisation, are office lead outcomes, booked consultations, confirmed appointments, sales values/bands and authorised call outcomes. Do not add raw PII, ad click IDs or full CRM records to browser tracking.

## Troubleshooting checklist

| Symptom | Check first |
| --- | --- |
| WindowCAD completion is missing | Confirm the quote URL uses `tracking`, the value starts `FG2-`, and the WordPress callback has run. WindowCAD's capture is invisible and URL-driven: the app stores the `tracking=` URL value under its Tracking property independent of the visible form field list (verified end-to-end July 2026). A submission with no tracking value means the session did not start from a site URL — office-entered projects and direct or re-opened WindowCAD links are the normal causes. **Known failure (July 2026): AdminBase renewed its TLS certificate onto the Sectigo R46 root, WordPress' bundled CA file predated it, and relays failed with cURL error 60** — leads stayed in WordPress with `_fenster_adminbase_sent = 0`; the theme now uses the host system trust store for AdminBase requests and sends the dashboard `quote_completed` before the AdminBase attempt. The Overview tab shows an amber alert counting completions that arrive without a tracking reference (relayed into the aggregate statistics as `quote_completed`). |
| A WindowCAD row has `FG2` but no customer match | Search the Customer database/timeline for that `FG2`; it should appear as a completed quote event against an `FGV` visitor. If it does not, inspect the relay rather than creating office test quotes. |
| Meta is not visible as a source | Confirm the live ad URL carries the UTM parameters and test a fresh, consented browser journey. |
| Consent Health is zero | Check that a fresh visitor makes an accept/reject choice, then confirm the dashboard API/state response and deployed frontend. Banner impressions are not a valid comparison. |
| Legend Chats is empty | Send a real message, not merely open the drawer; then check the site-to-dashboard chat endpoint and dashboard deployment. Rejected-cookie chats should be chat-only, not Customer database rows. |
| Counts look larger than expected | Check whether the metric counts actions/journeys rather than people. Multiple starts or WindowCAD submissions from one visitor are legitimate. |

## Technical ownership

- Website collector: Fenster theme `inc/website-tracking.php` and `src/js/main.js`.
- WindowCAD/AdminBase callback relay: Fenster theme `inc/adminbase.php`.
- Dashboard API, D1 storage and UI: this repository (`functions/api/[[path]].js`, `migrations/`, `public/app.js`).
- Dashboard changes deploy separately to Cloudflare Pages; a theme deploy does not update it.

For implementation and deployment details, see `README.md`. Update this guide whenever tracker behaviour, fields, retention or consent handling changes.
