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

1. A visitor accepts analytics cookies. The website creates an opaque browser visitor ID (`FGV-...`) and session/journey ID (`FG2-...`). The visitor ID lasts up to 90 days; the journey rotates after 30 minutes without a tracked action.
2. The website sends consented, non-PII activity to the dashboard: pages, active time, scroll depth and meaningful actions.
3. When the quote tool opens, the site adds the `FG2-...` value to the WindowCAD URL's **tracking** parameter.
4. WindowCAD saves that value in its separate **Tracking** field. Its office-owned **Reference** field must remain untouched.
5. When WindowCAD posts a completed quote back to WordPress, WordPress relays only the opaque `FG2-...` completion to the dashboard. The dashboard attaches it to the matching visitor journey.

The join is deliberately two IDs:

| Value | Meaning | Where it appears |
| --- | --- | --- |
| `FGV-...` | Anonymous, consented browser visitor | Customer database and visitor timelines |
| `FG2-...` | Anonymous, consented journey/WindowCAD quote reference | Journey events and WindowCAD Tracking field |
| `FGA-...` | Marketing-only attribution reference when analytics consent is off | WindowCAD and WordPress only; never creates a dashboard journey |
| `rejected-cookies` | A quote was created after optional-cookie rejection | WindowCAD only; never joined to a dashboard journey |
| `cookie-consent-not-accepted` | A quote was created before a cookie choice | WindowCAD only; never joined to a dashboard journey |

An `FG2` is not expected to equal the visitor's `FGV`: it is the reference that lets the dashboard say “this visitor completed this WindowCAD quote.” One visitor can have multiple 30-minute journeys and more than one quote submission.

## Consent, identity and privacy

- Analytics consent is required for a persistent `FGV`, an `FG2`, browsing events and dashboard journey joining.
- Marketing consent independently controls Google/Meta tags, click identifiers, enhanced/offline matching and the marketing-only `FGA` reference. GCLID/BRAID values and Google `_gcl_*` storage must be cleared when marketing consent is withdrawn.
- A returning consenting browser normally keeps the same `FGV` for 90 days. Incognito, cleared site storage, a new browser/device or an expired ID becomes a different visitor.
- Rejected/no-choice visitors can still submit a WindowCAD quote or website form to the office, but they do **not** get a consented tracker visitor, journey or individual browsing record. Separate aggregate-only statistical totals may include their page views and high-level actions.
- Consent Health is aggregate-only and distinguishes `Accept all`, `Analytics only`, `Marketing only` and `Necessary only`. It is never tied to a visitor, page, source, device or journey.
- Banner impressions (`banner_shown`) are counted separately from choices, but only as an implementation health check: a live figure of zero means the consent modal or the `/consent` endpoint has broken. **They cannot measure abandonment.** The count structurally undercounts against choices, so impressions minus choices can go negative. See the note under Overview and funnel for why, and never build a rate on it.

### Non-consented statistical traffic

The dashboard keeps a separate `website_statistical_aggregate_v2` table for visitors who have not accepted analytics cookies. This is aggregate-only measurement for website health: hourly page views, engagement, deliberate quote opens, form starts/sends and phone/email intent, grouped by environment, page, broad device class and referrer host. It never receives `FGV`/`FG2`, creates a visitor or journey, or joins a lead to a person.

The individual browser request is reduced into an hourly bucket at ingestion. Do not add visitor IDs, IP-derived keys, fingerprints, ad click IDs, customer values or per-person timelines to this table. It must remain solely for improving the website. Consent is still required for individual journey tracking, ad measurement, remarketing or cross-site/cross-device attribution.

## How to read the dashboard

The Website Tracker is the dashboard's landing view. Everything else — Dashboard,
Projects, Tickets, Plan, Completed, Social Media — sits under **Marketing
workspace** in the sidebar, collapsed until you need it.

Six tabs, each named for the question it answers:

| Tab | Answers |
| --- | --- |
| **Overview** | What happened in the period: attributable share, headline counts, daily traffic, funnel, consent health |
| **Leads** | Every attributed completed quote and sent form, with first-touch source and office outcome |
| **Channels** | Which sources and campaigns produced journeys, quote starts and leads |
| **Behaviour** | Pages, devices, CTA clicks and form validation friction |
| **Visitors** | The anonymous consented visitor list and individual journey timelines |
| **Legend** | Saved Legend transcripts for 30-day quality assurance |

A period control (**7 / 30 / 90 days / 1 year**) sits above the tabs and drives
every figure and the daily chart. It was previously hardcoded to 30 days.

### Overview and funnel

Overview opens with an **attributable share** panel, because every other number
on the screen is a subset of your traffic and the screen has to say so first. It
reports the percentage of page views that came from visitors who accepted
analytics, and the count of cookie choices recorded.

That headline is deliberately the **page-view split**, not "percentage who
answered the banner". In production `banner_shown` undercounts against the
choices actually recorded (562 choices against 499 impressions on 3 August
2026), which rendered as a nonsensical "113% of visitors answered". A ratio that
can exceed 100% is not a measurement. The choice *count* is sound, so it is
shown as a count and never as a rate.

**The undercount is structural, not crawler noise.** That was the assumption for
a while and it is wrong, which matters because it means the gap will not settle
down on its own. Two deterministic causes, either enough by itself:

1. The theme records an impression only when the *mandatory* first-visit modal
   opens (`openDialog(true)` in `inc/consent.php`). Footer **Cookie settings**
   reopens the same dialog through `openDialog(false)`, which records no
   impression, while saving from that panel still records a choice. Every
   preference change after the first is a choice with no matching impression.
2. The consent queries `UNION` the v1 `website_consent_daily` table. Impression
   recording was removed from the theme on 13 July 2026 while accepts and
   rejects kept being written, so every pre-31-July row contributes choices
   against zero impressions.

Pre-consent crawler and prefetch traffic moves the number in both directions on
top of that. The consequence is that **impressions minus choices is not an
abandonment figure** — it can go negative. Treat `banner_shown` as a binary
health check and nothing more.

| Metric | What it means | Do not read it as |
| --- | --- | --- |
| Attributable share | Page views from analytics-accepting visitors, over all recorded page views | The proportion of people who accepted |
| Leads (headline KPI) | Every completed quote and sent form, consented **and** anonymous | Deduplicated people, or confirmed sales |
| Unique visitors | Distinct consented `FGV` values in the selected period | All people who saw the website |
| Journeys | Consented visits/sessions recorded by the tracker | Distinct people |
| CTA clicks | Commercial links/buttons selected | A lead or a sale |
| Quote starts | A visitor deliberately opened or expanded the quote tool | An iframe exposure or a quote submitted |
| Forms started | A website form received meaningful interaction | A form sent |
| Forms sent | A website form was submitted | A confirmed appointment or sale |
| WindowCAD quotes | A callback confirmed WindowCAD received a completed quote | A unique person; one visitor may submit several |
| Phone or email clicks | Tap/click intent | A connected or answered call/email |
| Legend chats | Saved Legend conversations in the last 30 days | A lead or a human-support conversation |
| Won leads | Completed consented leads manually marked `won` | Automatically measured revenue |

The funnel is a diagnostic sequence: consented visitors → commercial CTA clicks → quote starts → leads. “Leads” is the total of completed WindowCAD quotes and sent forms, so a person who does both can contribute to both parts. Treat it as a conversion activity count, not a deduplicated CRM count.

Time on a page is based on visible/engaged browsing. It is useful for comparing pages and spotting short visits, but it is not a stopwatch and should not be treated as exact reading time.

### Acquisition, source and landing pages

First touch records the source, campaign and landing page that began a consented 30-minute journey. A returning campaign starts a new journey while the 90-day visitor record remains the same. This is session first-touch attribution, not proof that the last interaction caused the lead.

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

For a consented completed WindowCAD quote or form, staff can set a non-PII business outcome: `new`, `contacted`, `qualified`, `appointment`, `won` or `lost`. The WordPress Enquiries screen also stores the won value and relays the outcome to the dashboard. Qualified and won outcomes enter the protected Google Ads offline feed when a consented click ID or enhanced-conversion hash is available. Apply outcomes only after checking the actual lead in AdminBase/WindowCAD, and do not add personal details in dashboard notes.

## Data integrity and environments

### The 31 July 2026 history blackout

Migration `0017` added an `environment` column to the tracking tables with
`DEFAULT 'legacy'`, and created `_v2` copies of the two aggregate tables. Every
row written before it ran was therefore stamped `legacy`, while all 32 reporting
queries filtered on `environment = 'production'`. The dashboard lost its entire
history in a single deploy:

| Table | Stranded as `legacy` | Still visible |
| --- | --- | --- |
| `website_events` | 8,223 | 1,099 |
| `website_visitors` | 211 | 64 |
| `website_journeys` | 221 | 96 |

Every aggregate count before 31 July went with it, since those live only in the
v1 tables that nothing read. This is why the tracker appeared to show no page
views for most of its own reporting window.

**Nothing was deleted, so nothing needed restoring.** The fix widened the reads:
filters now accept `('production','legacy')`, and the aggregate and consent
queries `UNION` their v1 predecessors. Data is left exactly as written, so this
is reversible by narrowing the reads again.

Two caveats to keep in mind when reading anything before 31 July 2026:

- `legacy` predates the environment split, so it mixes live and test traffic. It
  is reported as production because `test.fensterglazing.com` is Basic Auth
  protected and contributed negligible volume in that window.
- The v1 consent table only recorded accepted/rejected. For those days the
  decision **count** is exact, but the four-way necessary / analytics / marketing
  / all split is approximate.

Traffic recorded since the split is properly separated and `test` stays excluded
from live reporting.

### General

- Browser traffic is classified from the real request `Origin`; JSON cannot claim to be production.
- Server relays require the shared `WEBSITE_INGEST_SECRET`.
- Production reporting reads only `environment = production`; test traffic remains available in storage but cannot inflate live KPIs.
- Every identified event has an `event_id`. Replayed events are acknowledged without being counted twice.
- Server aggregate lead events use deterministic receipt IDs, so the daily WordPress reconciliation can safely retry the last seven days.
- Automatic `quote_iframe_loaded` remains an exposure/technical event and is never counted as a quote start.

## Legend chat quality assurance

Legend is live. The composer is immediately available; using it accepts the displayed chat terms, which disclose AI processing and 30-day QA retention.

- The dashboard stores the actual visitor and assistant transcript for 30 days so quality can be reviewed.
- With analytics cookies accepted, the chat is linked to its `FGV`, `FG2` and page and appears in both the visitor journey and **Legend chats**.
- After rejected/no optional cookies, the transcript is chat-only: it has no visitor ID, journey, browsing events or attribution, but is still visible in **Legend chats** for QA.
- Legend chats are not proof of a lead. Look for a later quote/form/contact action or an office outcome before treating a chat as commercial value.
- Dashboard access is authenticated, but transcripts may contain personal information despite the warning. Do not copy them to unrelated systems.

## Calls and other channels

The website can measure a `tel:` link click, which is useful as dial intent. It cannot tell whether Focus Group answered the call, who called, duration, recording outcome, appointment or sale. When Focus Group provides an API, webhook or scheduled call-detail export, send non-PII call outcomes into the dashboard and use a shared lead/call reference where available. Until then, keep “phone clicks” labelled as intent only.

Office lead outcomes, booked consultations, qualified leads and confirmed sales values are now supported. The remaining useful addition is an authorised Focus Group call outcome feed, subject to a stable shared reference, consent and data minimisation. Do not add raw PII, ad click IDs or full CRM records to browser tracking.

## Troubleshooting checklist

| Symptom | Check first |
| --- | --- |
| WindowCAD completion is missing | Confirm the quote URL uses `tracking`, the value starts `FG2-` (analytics) or `FGA-` (marketing-only), and the WordPress callback has run. WindowCAD's capture is invisible and URL-driven: the app stores the `tracking=` URL value under its Tracking property independent of the visible form field list (verified end-to-end July 2026). A submission with no tracking value means the session did not start from a site URL — office-entered projects and direct or re-opened WindowCAD links are the normal causes. **Known failure (July 2026): AdminBase renewed its TLS certificate onto the Sectigo R46 root, WordPress' bundled CA file predated it, and relays failed with cURL error 60** — leads stayed in WordPress with `_fenster_adminbase_sent = 0`; the theme now uses the host system trust store for AdminBase requests and sends the dashboard `quote_completed` before the AdminBase attempt. The Overview tab shows an amber alert counting completions that arrive without a tracking reference (relayed into the aggregate statistics as `quote_completed`). |
| A WindowCAD row has `FG2` but no customer match | Search the Customer database/timeline for that `FG2`; it should appear as a completed quote event against an `FGV` visitor. If it does not, inspect the relay rather than creating office test quotes. |
| Meta is not visible as a source | Confirm the live ad URL carries the UTM parameters and test a fresh, consented browser journey. |
| Consent Health is zero | Check that a fresh visitor makes a granular choice, then confirm the dashboard API/state response and deployed frontend. Do not diagnose this by comparing choices with banner impressions; that difference is not abandonment. |
| Legend Chats is empty | Send a real message, not merely open the drawer; then check the site-to-dashboard chat endpoint and dashboard deployment. Rejected-cookie chats should be chat-only, not Customer database rows. |
| Counts look larger than expected | Check whether the metric counts actions/journeys rather than people. Multiple starts or WindowCAD submissions from one visitor are legitimate. |
| History disappears after a deploy | Check `SELECT environment, COUNT(*) FROM website_events GROUP BY environment` before anything else. A migration that adds a defaulted column will strand every existing row under that default while the reads still filter on `production`. See the 31 July 2026 blackout above. |
| Channels are almost all "Direct or unknown" | The live ad URLs are not carrying UTM parameters. Nothing in the dashboard can recover a source that was never sent; fix the tagging on the ad destination URLs. Observed across nearly every attributed lead on 3 August 2026. |
| Leads show no product or value | WindowCAD is not relaying `product_collection` or `price_amount` on the completion callback, so lead value cannot be computed and cost-per-lead stays unavailable. |
| A consent percentage exceeds 100% | It was derived from `banner_shown`, which is unreliable. Use the page-view split instead and report choices as a count. |

## Technical ownership

- Website collector: Fenster theme `inc/website-tracking.php` and `src/js/main.js`.
- WindowCAD/AdminBase callback relay: Fenster theme `inc/adminbase.php`.
- Dashboard API, D1 storage and UI: this repository (`functions/api/[[path]].js`, `migrations/`, `public/app.js`).
- Dashboard changes deploy separately to Cloudflare Pages; a theme deploy does not update it.

For implementation and deployment details, see `README.md`. Update this guide whenever tracker behaviour, fields, retention or consent handling changes.
