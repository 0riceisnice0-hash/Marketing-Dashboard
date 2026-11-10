// The Website / WindowCAD tab's numbers, read off the kept counts (D1 reads audit, 10/11/2026).
//
// 10/11 15:12-15:24 UTC one open tab of this dashboard read ~1.6M rows a minute from marketing_dashboard:
// the tab re-read every 60 s, and each read was ~25 COUNTs over every website_events row behind a
// "did this journey ever do anything" subquery. Glasshouse (Marketing -> Website) has kept those answers
// since 09/11 in gh_web_* tables that triggers fill as the rows arrive
// (Glasshouse-CRM field/apps/api/marketing-db/glasshouse-0001-website-kept-counts.sql). This is
// Glasshouse's reader, field/apps/api/src/services/marketing-website.ts `websiteStateKept`, as plain
// JS: change one, change the other. When the kept counts are not whole this answers 503 and reads
// nothing raw; Glasshouse's Website tab rebuilds them.
//
// Nothing here writes. The tracker intake (website/track, the relay, the bridge) is untouched.

const LIVE_ENV = "IN ('production','legacy')";
export async function keptCountsWhole(db) {
    const row = await db
        .prepare('SELECT ready, events_rowid AS kept, (SELECT MAX(rowid) FROM website_events) AS newest FROM gh_web_state WHERE id = 1')
        .first()
        .catch(() => null);
    return Boolean(row && Number(row.ready) === 1 && Number(row.kept) >= Number(row.newest ?? 0));
}
const n = (value) => Number(value || 0);
export async function websiteStateKept(db, periodDays, since, nowIso, view) {
    const sinceDay = since.slice(0, 10);
    const want = (part) => view === null || view === part;
    const [days, journeyDays, classes, visitorDays, statDays, consent, consentDaily, outcomes, adClicks, quoteJourneys, bridge,] = await Promise.all([
        db
            .prepare(`SELECT day, SUM(n) AS n, SUM(page_view) AS page_view, SUM(scroll_depth) AS scroll_depth,
             SUM(page_engaged) AS page_engaged, SUM(cta_click) AS cta_click, SUM(quote_step) AS quote_step,
             SUM(quote_opened) AS quote_opened, SUM(quote_tool_left) AS quote_tool_left,
             SUM(quote_completed) AS quote_completed, SUM(form_started) AS form_started,
             SUM(form_submitted) AS form_submitted, SUM(form_validation_error) AS form_validation_error,
             SUM(phone_click) AS phone_click, SUM(email_click) AS email_click, SUM(iframe_live) AS iframe_live
           FROM gh_web_day WHERE environment ${LIVE_ENV} AND day >= ? GROUP BY day ORDER BY day`)
            .bind(sinceDay)
            .all(),
        db
            .prepare(`SELECT COALESCE(SUM(live), 0) AS live, COALESCE(SUM(dead), 0) AS dead FROM gh_web_journey_day
           WHERE environment ${LIVE_ENV} AND day >= ?`)
            .bind(sinceDay)
            .first(),
        db
            .prepare(`SELECT traffic_class, SUM(journeys) AS count FROM gh_web_class_day
           WHERE environment ${LIVE_ENV} AND day >= ? GROUP BY traffic_class HAVING SUM(journeys) > 0`)
            .bind(sinceDay)
            .all(),
        db
            .prepare(`SELECT COALESCE(SUM(visitors), 0) AS count FROM gh_web_visitor_day WHERE environment ${LIVE_ENV} AND day >= ?`)
            .bind(sinceDay)
            .first(),
        db
            .prepare(`SELECT day, SUM(rows_n) AS rows_n, SUM(page_view) AS page_views, SUM(quote_opened) AS quote_starts,
             SUM(form_started) AS form_starts, SUM(form_submitted) AS forms, SUM(contact) AS contact_clicks,
             SUM(cta_click) AS cta_clicks, SUM(page_engaged) AS engaged, SUM(quote_completed) AS quote_completions
           FROM gh_web_stat_day WHERE environment ${LIVE_ENV} AND day >= ? GROUP BY day ORDER BY day`)
            .bind(sinceDay)
            .all(),
        db
            .prepare("SELECT COALESCE(SUM(banner_shown), 0) AS shown, COALESCE(SUM(necessary_only), 0) AS necessary_only, COALESCE(SUM(analytics_only), 0) AS analytics_only, COALESCE(SUM(marketing_only), 0) AS marketing_only, COALESCE(SUM(all_optional), 0) AS all_optional FROM (SELECT environment, day, banner_shown, necessary_only, analytics_only, marketing_only, all_optional FROM website_consent_daily_v2 UNION ALL SELECT 'production' AS environment, day, banner_shown, rejected AS necessary_only, 0 AS analytics_only, 0 AS marketing_only, accepted AS all_optional FROM website_consent_daily) AS con WHERE day >= ? AND environment IN ('production','legacy')")
            .bind(sinceDay)
            .first(),
        db
            .prepare("SELECT day, necessary_only, analytics_only, marketing_only, all_optional FROM (SELECT environment, day, banner_shown, necessary_only, analytics_only, marketing_only, all_optional FROM website_consent_daily_v2 UNION ALL SELECT 'production' AS environment, day, banner_shown, rejected AS necessary_only, 0 AS analytics_only, 0 AS marketing_only, accepted AS all_optional FROM website_consent_daily) AS con WHERE day >= ? AND environment IN ('production','legacy') ORDER BY day ASC")
            .bind(sinceDay)
            .all(),
        db
            .prepare("SELECT status, COUNT(*) AS count FROM website_lead_outcomes WHERE environment IN ('production','legacy') GROUP BY status")
            .all(),
        db
            .prepare(`SELECT COALESCE(campaign, '') AS campaign, COUNT(*) AS clicks,
             SUM(CASE WHEN outcome <> '' THEN 1 ELSE 0 END) AS leads,
             SUM(CASE WHEN outcome = 'quote_completed' THEN 1 ELSE 0 END) AS quotes,
             SUM(CASE WHEN outcome = 'form_submitted' THEN 1 ELSE 0 END) AS forms
           FROM website_ad_clicks
           WHERE occurred_at >= ? AND environment IN ('production','legacy') AND traffic_class <> 'bot'
           GROUP BY campaign ORDER BY clicks DESC, campaign LIMIT 40`)
            .bind(since)
            .all(),
        db
            .prepare(`SELECT COUNT(DISTINCT journey_id) AS count FROM website_events
           WHERE event_type = 'quote_opened' AND environment ${LIVE_ENV} AND occurred_at >= ?`)
            .bind(since)
            .first(),
        // When the WindowCAD bridge first reported: one seek a type and environment on gh_web_events_type.
        db
            .prepare(`SELECT ${['quote_tool_engaged', 'quote_step', 'quote_tool_left']
            .flatMap((type) => ['production', 'legacy'].map((env) => `(SELECT MIN(occurred_at) FROM website_events WHERE event_type = '${type}' AND environment = '${env}') AS "${type}:${env}"`))
            .join(', ')}`)
            .first(),
    ]);
    const firsts = Object.values(bridge ?? {}).filter((v) => typeof v === 'string' && v !== '');
    const bridgeFirst = firsts.length ? firsts.reduce((a, b) => (b < a ? b : a)) : null;
    const toolSince = bridgeFirst && bridgeFirst > since ? bridgeFirst : since;
    const toolEngaged = await db
        .prepare(`SELECT COUNT(DISTINCT journey_id) AS count FROM website_events
       WHERE event_type = 'quote_tool_engaged' AND environment ${LIVE_ENV} AND occurred_at >= ?`)
        .bind(toolSince)
        .first();
    const dayRows = days.results || [];
    const total = (column) => dayRows.reduce((sum, row) => sum + n(row[column]), 0);
    const seen = total('iframe_live');
    const opened = total('quote_opened');
    const completed = total('quote_completed');
    const statRows = statDays.results || [];
    const stat = (column) => statRows.reduce((sum, row) => sum + n(row[column]), 0);
    const state = {
        periodDays,
        journeys: n(journeyDays?.live),
        uniqueVisitors: n(visitorDays?.count),
        quoteJourneys: n(quoteJourneys?.count),
        forms: total('form_submitted'),
        formStarts: total('form_started'),
        formErrors: total('form_validation_error'),
        ctaClicks: total('cta_click'),
        pageEngagements: total('page_engaged'),
        scrollDepths: total('scroll_depth'),
        quotes: completed,
        toolEngaged: n(toolEngaged?.count),
        toolCompletedAfterEngaging: 0,
        toolLeft: total('quote_tool_left'),
        toolStepEvents: total('quote_step'),
        toolLeaveSteps: [],
        toolChoices: [],
        toolDepth: [],
        toolTrailRows: [],
        toolUntouched: 0,
        toolUnseen: 0,
        toolSince,
        quoteDaily: dayRows
            .filter((row) => n(row.iframe_live) + n(row.quote_opened) + n(row.quote_completed) > 0)
            .map((row) => ({
            day: row.day,
            seen: n(row.iframe_live),
            opened: n(row.quote_opened),
            completed: n(row.quote_completed),
        })),
        // As SUM over no rows: no live quote event in the period is NULL, not 0.
        quoteTotals: seen + opened + completed > 0
            ? { seen, opened, completed, openers: n(quoteJourneys?.count) }
            : { seen: null, opened: null, completed: null, openers: n(quoteJourneys?.count) },
        deadJourneys: n(journeyDays?.dead),
        quotePages: [],
        quoteSources: [],
        toolDaily: [],
        calls: total('phone_click') + total('email_click'),
        legendChats: 0,
        chats: [],
        recent: [],
        visitors: [],
        acquisition: [],
        statistical: {
            pageViews: stat('page_views'),
            quoteStarts: stat('quote_starts'),
            formStarts: stat('form_starts'),
            forms: stat('forms'),
            contactClicks: stat('contact_clicks'),
            ctaClicks: stat('cta_clicks'),
            engaged: stat('engaged'),
            quoteCompletions: stat('quote_completions'),
        },
        consent: {
            shown: n(consent?.shown),
            necessaryOnly: n(consent?.necessary_only),
            analyticsOnly: n(consent?.analytics_only),
            marketingOnly: n(consent?.marketing_only),
            allOptional: n(consent?.all_optional),
        },
        outcomes: Object.fromEntries((outcomes.results || []).map((row) => [row.status, n(row.count)])),
        integrity: Object.fromEntries((classes.results || []).map((row) => [row.traffic_class || 'unclassified', n(row.count)])),
        adClicks: adClicks.results || [],
        series: {
            events: dayRows
                .filter((row) => n(row.n) > 0)
                .map((row) => ({
                day: row.day,
                page_views: n(row.page_view),
                quote_starts: n(row.quote_opened),
                leads: n(row.quote_completed) + n(row.form_submitted),
            })),
            statistical: statRows
                .filter((row) => n(row.rows_n) > 0)
                .map((row) => ({
                day: row.day,
                page_views: n(row.page_views),
                quote_completions: n(row.quote_completions),
            })),
            consent: consentDaily.results || [],
        },
        topPages: [],
        statTopPages: [],
        deviceSplit: [],
        topCtas: [],
        formFields: [],
        products: [],
    };
    const parts = [];
    if (want('leads')) {
        parts.push(db
            .prepare(`SELECT e.event_type, e.occurred_at, e.page_path, e.cta, e.product_collection, e.price_amount, e.price_currency,
             j.journey_id, j.landing_path, j.source, j.medium, j.campaign, COALESCE(o.status, 'new') AS outcome_status
           FROM website_events e
           LEFT JOIN website_journeys j ON j.journey_id = e.journey_id
           LEFT JOIN website_lead_outcomes o ON o.journey_id = e.journey_id AND o.environment IN ('production','legacy')
           WHERE e.event_type IN ('form_submitted', 'quote_completed') AND e.environment IN ('production','legacy')
           ORDER BY e.occurred_at DESC LIMIT 80`)
            .all()
            .then((r) => {
            state.recent = r.results || [];
        }));
    }
    if (want('channels')) {
        parts.push(Promise.all([
            // Each journey once, its E events already counted on it.
            db
                .prepare(`SELECT channel, COUNT(DISTINCT NULLIF(visitor_id, '')) AS visitors, COUNT(*) AS journeys,
               SUM(qo_n > 0) AS quote_starts, SUM(qc_n) AS quotes, SUM(fs_n) AS forms, SUM(ct_n) AS contact_clicks
             FROM gh_web_journey WHERE jenv ${LIVE_ENV} AND last_at >= ? AND j_exists = 1
             GROUP BY channel ORDER BY quotes DESC, forms DESC, quote_starts DESC, visitors DESC, channel LIMIT 40`)
                .bind(since)
                .all(),
            db
                .prepare(`SELECT product_collection,
               SUM(CASE WHEN event_type = 'quote_opened' THEN 1 ELSE 0 END) AS opens,
               SUM(CASE WHEN event_type = 'quote_completed' THEN 1 ELSE 0 END) AS completions
             FROM website_events
             WHERE occurred_at >= ? AND environment ${LIVE_ENV} AND product_collection <> ''
             GROUP BY product_collection ORDER BY completions DESC, opens DESC, product_collection LIMIT 25`)
                .bind(since)
                .all(),
            db
                .prepare(`SELECT cta, COUNT(*) AS clicks FROM website_events
             WHERE event_type = 'cta_click' AND environment ${LIVE_ENV} AND occurred_at >= ? AND cta <> ''
             GROUP BY cta ORDER BY clicks DESC, cta LIMIT 25`)
                .bind(since)
                .all(),
        ]).then(([acquisition, products, topCtas]) => {
            state.acquisition = acquisition.results || [];
            state.products = products.results || [];
            state.topCtas = topCtas.results || [];
        }));
    }
    if (want('behaviour')) {
        const agg = `(SELECT environment, day, hour_utc, event_type, page_path, referrer_host, device_type, count FROM website_statistical_aggregate_v2 UNION ALL SELECT 'production' AS environment, day, hour_utc, event_type, page_path, referrer_host, device_type, count FROM website_statistical_aggregate) AS agg`;
        parts.push(Promise.all([
            db
                .prepare(`SELECT page_path, SUM(views) AS views,
               CAST(ROUND(CAST(SUM(eng_sum) AS REAL) / NULLIF(SUM(eng_n), 0)) AS INTEGER) AS avg_seconds
             FROM gh_web_page_day WHERE environment ${LIVE_ENV} AND day >= ?
             GROUP BY page_path HAVING SUM(views) > 0 ORDER BY SUM(views) DESC, page_path LIMIT 40`)
                .bind(sinceDay)
                .all(),
            db
                .prepare(`SELECT page_path, SUM(count) AS views FROM ${agg}
             WHERE day >= ? AND environment IN ('production','legacy') AND event_type = 'page_view' AND device_type NOT IN ('bot', 'server')
             GROUP BY page_path ORDER BY views DESC, page_path LIMIT 40`)
                .bind(sinceDay)
                .all(),
            db
                .prepare(`SELECT device_type, SUM(count) AS views FROM ${agg}
             WHERE day >= ? AND environment IN ('production','legacy') AND event_type = 'page_view' GROUP BY device_type ORDER BY views DESC, device_type`)
                .bind(sinceDay)
                .all(),
            db
                .prepare(`SELECT cta AS field, COUNT(*) AS warnings FROM website_events
             WHERE event_type = 'form_validation_error' AND environment ${LIVE_ENV} AND occurred_at >= ? AND cta <> ''
             GROUP BY cta ORDER BY warnings DESC, cta LIMIT 25`)
                .bind(since)
                .all(),
        ]).then(([topPages, statTopPages, deviceSplit, formFields]) => {
            state.topPages = topPages.results || [];
            state.statTopPages = statTopPages.results || [];
            state.deviceSplit = deviceSplit.results || [];
            state.formFields = formFields.results || [];
        }));
    }
    if (want('visitors')) {
        parts.push(db
            .prepare(`WITH listed AS (
             SELECT visitor_id FROM gh_web_visitor
             WHERE v_exists = 1 AND live2_j > 0 AND venv ${LIVE_ENV} AND last_seen_at >= ?2
             ORDER BY last_seen_at DESC, visitor_id DESC LIMIT 300
           )
           SELECT v.visitor_id, v.first_seen_at, v.last_seen_at, v.first_landing_path, v.first_source, v.first_medium, v.first_campaign,
             COUNT(j.journey_id) AS journeys,
             COALESCE(SUM(j.qo_n), 0) AS quote_starts, COALESCE(SUM(j.qc_n), 0) AS quotes,
             COALESCE(SUM(j.fs_n), 0) AS forms, COALESCE(SUM(j.ct_n), 0) AS contact_clicks,
             (SELECT COUNT(DISTINCT c.conversation_id) FROM website_chat_messages c WHERE c.visitor_id = v.visitor_id AND c.expires_at > ?1 AND c.environment IN ('production','legacy')) AS legend_chats
           FROM listed l
           JOIN website_visitors v ON v.visitor_id = l.visitor_id
           LEFT JOIN gh_web_journey j ON j.visitor_id = v.visitor_id AND j.j_exists = 1 AND j.jenv ${LIVE_ENV}
           GROUP BY v.visitor_id
           ORDER BY v.last_seen_at DESC, v.visitor_id DESC`)
            .bind(nowIso, since)
            .all()
            .then((r) => {
            state.visitors = r.results || [];
        }));
    }
    if (want('legend')) {
        parts.push(Promise.all([
            db
                .prepare(`SELECT conversation_id, visitor_id, journey_id, page_path, MIN(created_at) AS started_at, MAX(created_at) AS last_message_at, COUNT(*) AS messages FROM website_chat_messages WHERE expires_at > ? AND environment IN ('production','legacy') GROUP BY conversation_id, visitor_id, journey_id, page_path ORDER BY last_message_at DESC LIMIT 300`)
                .bind(nowIso)
                .all(),
            db
                .prepare("SELECT COUNT(DISTINCT conversation_id) AS count FROM website_chat_messages WHERE expires_at > ? AND environment IN ('production','legacy')")
                .bind(nowIso)
                .first(),
        ]).then(([chats, chatCount]) => {
            state.chats = chats.results || [];
            state.legendChats = n(chatCount?.count);
        }));
    }
    if (want('tool')) {
        const tool = (sql, at) => db.prepare(sql).bind(at);
        parts.push(Promise.all([
            tool(`SELECT page_path AS page, COUNT(*) AS opened, COUNT(DISTINCT journey_id) AS people
           FROM website_events
           WHERE event_type = 'quote_opened' AND environment ${LIVE_ENV} AND occurred_at >= ? AND page_path <> ''
           GROUP BY page ORDER BY opened DESC, page LIMIT 10`, since).all(),
            tool(`SELECT
             CASE WHEN COALESCE(NULLIF(w.source,''),'') = '' THEN 'Direct / unattributed'
                  ELSE w.source || CASE WHEN w.medium <> '' THEN ' / ' || w.medium ELSE '' END END AS src,
             COUNT(DISTINCT e.journey_id) AS quotes
           FROM website_events e
           JOIN website_journeys w ON w.journey_id = e.journey_id
           WHERE e.event_type = 'quote_completed' AND e.environment ${LIVE_ENV} AND e.occurred_at >= ?
           GROUP BY src ORDER BY quotes DESC, src LIMIT 8`, since).all(),
            tool(`SELECT COUNT(DISTINCT journey_id) AS count FROM website_events
           WHERE event_type = 'quote_completed' AND environment ${LIVE_ENV} AND occurred_at >= ?1
             AND EXISTS (
               SELECT 1 FROM website_events qe
               WHERE qe.journey_id = website_events.journey_id AND qe.occurred_at >= ?1
                 AND qe.event_type = 'quote_tool_engaged' AND qe.environment ${LIVE_ENV}
             )`, toolSince).first(),
            tool(`SELECT cta AS step, COUNT(DISTINCT journey_id) AS count FROM website_events
           WHERE event_type = 'quote_tool_left' AND environment ${LIVE_ENV} AND occurred_at >= ?
           GROUP BY cta ORDER BY count DESC, cta LIMIT 8`, toolSince).all(),
            tool(`SELECT cta AS choice, COUNT(DISTINCT journey_id) AS count FROM website_events
           WHERE event_type = 'quote_step' AND environment ${LIVE_ENV} AND occurred_at >= ?
             AND cta <> '' AND cta NOT LIKE 'step %'
           GROUP BY cta ORDER BY count DESC, cta LIMIT 12`, toolSince).all(),
            tool(`SELECT depth, COUNT(*) AS journeys FROM (
             SELECT journey_id, COUNT(*) AS depth FROM website_events
             WHERE event_type = 'quote_step' AND environment ${LIVE_ENV} AND occurred_at >= ?
             GROUP BY journey_id
           ) GROUP BY depth ORDER BY depth`, toolSince).all(),
            tool(`SELECT journey_id, event_type, cta, occurred_at FROM website_events INDEXED BY gh_web_events_type
           WHERE event_type IN ('quote_tool_engaged','quote_step','quote_tool_left','quote_completed')
             AND environment ${LIVE_ENV} AND occurred_at >= ?
             AND EXISTS (
               SELECT 1 FROM website_events te
               WHERE te.journey_id = website_events.journey_id AND te.event_type IN ('quote_tool_engaged','quote_step')
                 AND te.environment ${LIVE_ENV}
             )
           ORDER BY occurred_at DESC, id DESC LIMIT 400`, toolSince).all(),
            // Journeys with a quote frame in the window and no use of the tool in it.
            tool(`SELECT COUNT(*) AS count FROM (
             SELECT journey_id FROM website_events
             WHERE event_type = 'quote_iframe_loaded' AND environment ${LIVE_ENV} AND occurred_at >= ?1
             EXCEPT
             SELECT journey_id FROM website_events
             WHERE event_type = 'quote_tool_engaged' AND environment ${LIVE_ENV} AND occurred_at >= ?1
           )`, toolSince).first(),
            tool(`SELECT COUNT(DISTINCT journey_id) AS count FROM website_events
           WHERE event_type = 'quote_completed' AND environment ${LIVE_ENV} AND occurred_at >= ?
             AND NOT EXISTS (
               SELECT 1 FROM website_events ue INDEXED BY idx_website_events_journey
               WHERE ue.journey_id = website_events.journey_id AND ue.event_type = 'quote_tool_engaged'
                 AND ue.environment ${LIVE_ENV}
             )`, toolSince).first(),
            tool(`SELECT substr(occurred_at, 1, 10) AS day,
             COUNT(DISTINCT CASE WHEN event_type = 'quote_tool_engaged' THEN journey_id END) AS engaged,
             COUNT(DISTINCT CASE WHEN event_type = 'quote_completed' THEN journey_id END) AS completed
           FROM website_events
           WHERE event_type IN ('quote_tool_engaged','quote_completed') AND environment ${LIVE_ENV} AND occurred_at >= ?
           GROUP BY day ORDER BY day`, toolSince).all(),
        ]).then(([quotePages, quoteSources, afterEngaging, leaveSteps, choices, depth, trail, untouched, unseen, daily,]) => {
            state.quotePages = quotePages.results || [];
            state.quoteSources = quoteSources.results || [];
            state.toolCompletedAfterEngaging = n(afterEngaging?.count);
            state.toolLeaveSteps = leaveSteps.results || [];
            state.toolChoices = choices.results || [];
            state.toolDepth = depth.results || [];
            state.toolTrailRows = trail.results || [];
            state.toolUntouched = n(untouched?.count);
            state.toolUnseen = n(unseen?.count);
            state.toolDaily = daily.results || [];
        }));
    }
    await Promise.all(parts);
    return state;
}
const ENV_LIVE = "environment IN ('production','legacy')";
