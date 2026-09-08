import { onRequest } from "../functions/api/[[path]].js";
import { searchFensterKnowledge } from "../functions/_reception/knowledge.js";
import { officeStatus, buildReceptionistInstructions } from "../functions/_reception/prompt.js";

const tables = {
  tickets: [],
  ideas: [],
  tasks: [],
  todays_plan: [],
  social_posts: [],
  social_guidelines: [],
  action_plan_items: [],
  content_requests: [],
  website_updates: [],
  changelog: [],
  daily_reports: [],
  notes: [],
  fenster_conversations: [],
  fenster_messages: [],
  fenster_reviews: [],
  fenster_events: [],
  fenster_settings: [
    { key: "bot_active", value: "false" },
    { key: "ai_prompt_context", value: "Never say warranties or guarantees are transferable." }
  ],
  fenster_bot_queue: [],
  website_statistical_aggregate: [],
  website_statistical_aggregate_v2: [],
  website_stat_receipts: [],
  website_consent_daily_v2: [],
  website_visitors: [],
  website_journeys: [],
  website_events: [],
  website_chat_messages: [],
  website_lead_outcomes: [],
  reception_calls: [],
  reception_call_messages: [],
  reception_notifications: [],
  reception_call_events: []
};

let forcedUuid = 1;

let nextId = 1;

const env = {
  SESSION_SECRET: "test-secret",
  PASSWORD_ZAC: "test-password",
  PASSWORD_ADAM: "test-password",
  PASSWORD_NICK: "test-password",
  META_PAGE_ACCESS_TOKEN: "test-meta-token",
  WEBSITE_INGEST_SECRET: "website-ingest-secret",
  LEAD_EMAIL_WEBHOOK_URL: "https://lead-email.test/send",
  LEAD_EMAIL_WEBHOOK_SECRET: "lead-secret",
  DB: {
    prepare(sql) {
      const statement = { sql, values: [] };
      statement.bind = (...values) => {
        statement.values = values;
        return statement;
      };
      statement.all = async () => queryAll(statement);
      statement.first = async () => queryFirst(statement);
      statement.run = async () => run(statement);
      return statement;
    }
  }
};

const base = "http://local.test";
const realFetch = globalThis.fetch;
const sentMetaMessages = [];
const sentLeadEmails = [];
// OpenAI is mocked at the fetch boundary: the smoke test never calls it live.
const openAiRequests = [];
const openAiMode = { session: "ok", summary: "ok" };
const openAiSummaryPayload = {
  caller_name: "John Smith",
  callback_number: "07700 900123",
  email: null,
  postcode: null,
  requested_person: "Nick Baker",
  topic: "Aluminium bifold doors",
  summary: "John spoke to Nick earlier about a bifold door quotation and has a question about the opening size.",
  message: "John would like Nick to call him back tomorrow about the bifold opening size.",
  action_required: "Nick to call John back tomorrow about the bifold opening size.",
  urgency: "normal",
  resolved_during_call: false
};

globalThis.fetch = async (url, init = {}) => {
  if (String(url).includes("lead-email.test")) {
    const auth = (init.headers?.Authorization || init.headers?.authorization || "").replace(/^Bearer\s+/i, "");
    if (auth !== env.LEAD_EMAIL_WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const payload = JSON.parse(init.body || "{}");
    sentLeadEmails.push(payload);
    return new Response(JSON.stringify({ ok: true, id: `email-${sentLeadEmails.length}` }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (String(url).includes("api.openai.com/v1/realtime/client_secrets")) {
    const body = JSON.parse(init.body || "{}");
    openAiRequests.push({ url: String(url), init, body });
    if (openAiMode.session === "fail") {
      return new Response(JSON.stringify({ error: { message: "Incorrect API key provided", type: "invalid_request_error" } }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ value: "ek_test_secret_123", expires_at: Math.floor(Date.now() / 1000) + 300, session: { id: "sess_test", type: "realtime", model: body.session?.model } }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (String(url).includes("api.openai.com/v1/responses")) {
    const body = JSON.parse(init.body || "{}");
    openAiRequests.push({ url: String(url), init, body });
    if (openAiMode.summary === "fail") {
      return new Response(JSON.stringify({ error: { message: "The server had an error while processing your request." } }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    if (openAiMode.summary === "model_missing_first" && body.model !== "gpt-5.4-mini") {
      return new Response(JSON.stringify({ error: { message: `The model \`${body.model}\` does not exist or you do not have access to it.`, code: "model_not_found" } }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ output_text: JSON.stringify(openAiSummaryPayload) }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  if (String(url).includes("api.openai.com")) {
    throw new Error(`Unexpected OpenAI request in smoke test: ${url}`);
  }
  if (String(url).includes("graph.facebook.com")) {
    const payload = JSON.parse(init.body || "{}");
    sentMetaMessages.push(payload);
    return new Response(JSON.stringify({ message_id: `sent-${sentMetaMessages.length}` }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  return realFetch(url, init);
};

const login = await call("/api/login", {
  method: "POST",
  body: JSON.stringify({ username: "zac", password: "test-password" })
});

assert(login.status === 200, "login should work");
const cookie = login.headers.get("Set-Cookie");

const me = await call("/api/me", { headers: { Cookie: cookie } });
assert(me.status === 200, "session should verify");

const perryLogin = await call("/api/login", {
  method: "POST",
  body: JSON.stringify({ username: "perry", password: "test-password" })
});

assert(perryLogin.status === 200, "Perry should share the dashboard password");

const anonymousStat = await call("/api/website/stat", {
  method: "POST",
  headers: { Origin: "https://www.fensterglazing.com", "Content-Type": "text/plain;charset=UTF-8" },
  body: JSON.stringify({ event: "page_view", page_path: "/", device_type: "desktop", referrer_host: "www.google.com", origin: "https://www.fensterglazing.com" })
});
assert(anonymousStat.status === 201, "anonymous statistical event should be accepted");
assert(tables.website_statistical_aggregate_v2.length > 0, "anonymous statistical event should be stored in the environment-separated aggregate table");
assert(!tables.website_visitors || tables.website_visitors.length === 0, "anonymous statistical event should not create a visitor record");

const spoofedServerStat = await call("/api/website/stat", {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=UTF-8" },
  body: JSON.stringify({ event: "quote_completed", page_path: "/online-quote/", origin: "https://www.fensterglazing.com" })
});
assert(spoofedServerStat.status === 403, "an unsigned server event must not be trusted from a claimed JSON origin");

const signedServerStatBody = {
  event: "quote_completed",
  event_id: "wp-windowcad-smoke-1",
  page_path: "/online-quote/",
  origin: "https://www.fensterglazing.com"
};
const signedServerStat = await call("/api/website/stat", {
  method: "POST",
  headers: { "X-Fenster-Website-Secret": env.WEBSITE_INGEST_SECRET },
  body: JSON.stringify(signedServerStatBody)
});
assert(signedServerStat.status === 201, "a signed aggregate lead should be accepted");
const duplicateServerStat = await call("/api/website/stat", {
  method: "POST",
  headers: { "X-Fenster-Website-Secret": env.WEBSITE_INGEST_SECRET },
  body: JSON.stringify(signedServerStatBody)
});
assert(duplicateServerStat.status === 200, "a repeated aggregate receipt should be acknowledged without recounting");

const unsignedBrowserLeadStat = await call("/api/website/stat", {
  method: "POST",
  headers: { Origin: "https://www.fensterglazing.com", "Content-Type": "text/plain;charset=UTF-8" },
  body: JSON.stringify({ event: "form_submitted", page_path: "/contact/" })
});
assert(unsignedBrowserLeadStat.status === 403, "browser traffic must not create completed aggregate leads");

const testStat = await call("/api/website/stat", {
  method: "POST",
  headers: { Origin: "https://test.fensterglazing.com", "Content-Type": "text/plain;charset=UTF-8" },
  body: JSON.stringify({ event: "page_view", page_path: "/test-only/", device_type: "desktop" })
});
assert(testStat.status === 201, "test-site statistical event should be accepted");
assert(tables.website_statistical_aggregate_v2.some((item) => item.environment === "test"), "test traffic must be labelled separately");

const consentAll = await call("/api/website/consent", {
  method: "POST",
  headers: { Origin: "https://www.fensterglazing.com", "Content-Type": "text/plain;charset=UTF-8" },
  body: JSON.stringify({ choice: "all" })
});
assert(consentAll.status === 201, "granular consent choice should be accepted");
assert(tables.website_consent_daily_v2.some((item) => item.environment === "production" && item.all_optional === 1), "granular consent should retain its category");

const websiteEventBody = {
  event_id: "event-website-smoke-1",
  event: "page_view",
  journey_id: "FG2-SMOKEJOURNEY123",
  visitor_id: "FGV-SMOKEVISITOR123",
  page_path: "/",
  landing_path: "/",
  source: "google",
  medium: "cpc"
};
const websiteEvent = await call("/api/website/event", {
  method: "POST",
  headers: { Origin: "https://www.fensterglazing.com", "Content-Type": "text/plain;charset=UTF-8" },
  body: JSON.stringify(websiteEventBody)
});
assert(websiteEvent.status === 201, "consented website event should be accepted");
const duplicateWebsiteEvent = await call("/api/website/event", {
  method: "POST",
  headers: { Origin: "https://www.fensterglazing.com", "Content-Type": "text/plain;charset=UTF-8" },
  body: JSON.stringify(websiteEventBody)
});
assert(duplicateWebsiteEvent.status === 200, "replayed event IDs should be acknowledged without recounting");
assert(tables.website_events.filter((item) => item.id === websiteEventBody.event_id).length === 1, "replayed event IDs must be idempotent");

const unsignedBrowserLead = await call("/api/website/event", {
  method: "POST",
  headers: { Origin: "https://www.fensterglazing.com", "Content-Type": "text/plain;charset=UTF-8" },
  body: JSON.stringify({ ...websiteEventBody, event_id: "event-website-smoke-lead", event: "form_submitted" })
});
assert(unsignedBrowserLead.status === 403, "browser traffic must not create an identified completed lead");

const signedLead = await call("/api/website/event", {
  method: "POST",
  headers: { "X-Fenster-Website-Secret": env.WEBSITE_INGEST_SECRET },
  body: JSON.stringify({
    ...websiteEventBody,
    event_id: "wp-form-smoke-1",
    event: "form_submitted",
    origin: "https://www.fensterglazing.com"
  })
});
assert(signedLead.status === 201, "a signed identified lead should be accepted");
const signedOutcome = await call("/api/website/outcome-ingest", {
  method: "POST",
  headers: { "X-Fenster-Website-Secret": env.WEBSITE_INGEST_SECRET },
  body: JSON.stringify({
    journey_id: websiteEventBody.journey_id,
    status: "qualified",
    value: 0,
    currency: "GBP",
    origin: "https://www.fensterglazing.com"
  })
});
assert(signedOutcome.status === 201, "a signed outcome should attach to a completed lead");

const ticket = await call("/api/records/tickets", {
  method: "POST",
  headers: { Cookie: cookie },
  body: JSON.stringify({
    title: "Smoke test ticket",
    requester: "Zac",
    category: "Marketing",
    priority: "Normal",
    status: "New",
    owner: "Zac",
    detail: "Created by smoke test."
  })
});

assert(ticket.status === 201, "ticket create should work");

const bootstrap = await call("/api/bootstrap", { headers: { Cookie: cookie } });
const data = await bootstrap.json();
assert(data.tickets.some((item) => item.title === "Smoke test ticket"), "bootstrap should include new ticket");

const plan = await call("/api/records/todays_plan", {
  method: "POST",
  headers: { Cookie: cookie },
  body: JSON.stringify({
    title: "Smoke test plan",
    owner: "Zac",
    status: "Planned",
    notes: "Created by smoke test.",
    updated_by: "Zac"
  })
});

assert(plan.status === 201, "today's plan create should work");
const planJson = await plan.json();

const parkedPlan = await call("/api/records/todays_plan", {
  method: "PATCH",
  headers: { Cookie: cookie },
  body: JSON.stringify({ id: planJson.id, status: "Parked" })
});

assert(parkedPlan.status === 200, "today's plan should be parkable");

const seed = await call("/api/fenster/demo/seed", {
  method: "POST",
  headers: { Cookie: cookie },
  body: "{}"
});

assert(seed.status === 200, "Fenster demo seed should work");
const seeded = await seed.json();
assert(seeded.conversations.length >= 2, "Fenster state should include seeded conversations");

const callbackId = `callback-${forcedUuid++}`;
tables.fenster_conversations.push({
  id: callbackId,
  channel: "facebook",
  external_user_id: "callback-recipient",
  display_name: "Callback Lead",
  status: "new",
  draft: "",
  draft_status: "none",
  decision_action: "",
  internal_note: "",
  lead_notified_at: "",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});
tables.fenster_messages.push({
  id: `message-${forcedUuid++}`,
  conversation_id: callbackId,
  external_id: "callback-message",
  direction: "inbound",
  text: "Yeah give me a call at 3pm - 07926037173. Interested in getting 5 doors",
  raw_json: "{}",
  created_at: new Date().toISOString()
});

const callbackDecision = await call(`/api/fenster/conversations/${callbackId}/generate-draft`, {
  method: "POST",
  headers: { Cookie: cookie },
  body: "{}"
});

assert(callbackDecision.status === 200, "callback lead decision should work");
const callbackData = await callbackDecision.json();
assert(callbackData.decision_action === "FLAG_HUMAN", "callback leads should flag human");
assert(callbackData.draft_status === "flag-human", "callback leads should not create a sendable draft");
assert(sentLeadEmails.length === 1, "human-flagged callback leads should email the office automatically");
assert(callbackData.lead_notified_at, "automatic office emails should stamp lead_notified_at");

const namedStaffId = `staff-${forcedUuid++}`;
tables.fenster_conversations.push({
  id: namedStaffId,
  channel: "facebook",
  external_user_id: "staff-recipient",
  display_name: "Staff Request",
  status: "new",
  draft: "",
  draft_status: "none",
  decision_action: "",
  internal_note: "",
  lead_notified_at: "",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});
tables.fenster_messages.push({
  id: `message-${forcedUuid++}`,
  conversation_id: namedStaffId,
  external_id: "staff-message",
  direction: "inbound",
  text: "Can Adam see this please?",
  raw_json: "{}",
  created_at: new Date().toISOString()
});

const staffDecision = await call(`/api/fenster/conversations/${namedStaffId}/generate-draft`, {
  method: "POST",
  headers: { Cookie: cookie },
  body: "{}"
});

assert(staffDecision.status === 200, "named staff decision should work");
const staffData = await staffDecision.json();
assert(staffData.decision_action === "FLAG_HUMAN", "named staff requests should flag human");
assert(sentLeadEmails.length === 2, "all human flags should email the office automatically, even without quote keywords");

const manualDraft = await call(`/api/fenster/conversations/${callbackId}/draft`, {
  method: "POST",
  headers: { Cookie: cookie },
  body: JSON.stringify({ draft: "Thanks, I have passed this to the office team and they will follow up with you." })
});

assert(manualDraft.status === 200, "manual draft should save");
const manualDraftData = await manualDraft.json();
assert(manualDraftData.decision_action === "FLAG_HUMAN", "manual drafts on human handoffs should keep the thread human-owned");
assert(manualDraftData.draft_status === "flag-human", "manual drafts on human handoffs should not become auto-approvable drafts");

await call(`/api/fenster/conversations/${callbackId}/reject`, {
  method: "POST",
  headers: { Cookie: cookie },
  body: JSON.stringify({ note: "Human reply needed." })
});

const manualSend = await call(`/api/fenster/conversations/${callbackId}/send`, {
  method: "POST",
  headers: { Cookie: cookie },
  body: JSON.stringify({
    text: "Thanks, I have passed this to the office team and they will follow up with you.",
    manual: true,
    confirm: `SEND:${callbackId}`
  })
});

assert(manualSend.status === 200, "manual replies should send after human flag");
assert(sentMetaMessages.at(-1)?.message?.text.includes("office team"), "manual reply should be sent to Meta");
const manualSendData = await manualSend.json();
assert(manualSendData.conversation.internal_note === "Manual reply written and sent.", "manual send should be recorded clearly");
assert(manualSendData.conversation.decision_action === "FLAG_HUMAN", "manual send should not clear the human-owned thread flag");

tables.fenster_messages.push({
  id: `message-${forcedUuid++}`,
  conversation_id: callbackId,
  external_id: "callback-followup",
  direction: "inbound",
  text: "Also can you send me the instant pricing link please?",
  raw_json: "{}",
  created_at: new Date().toISOString()
});

const followupDecision = await call(`/api/fenster/conversations/${callbackId}/generate-draft`, {
  method: "POST",
  headers: { Cookie: cookie },
  body: "{}"
});

assert(followupDecision.status === 200, "follow-up on human-owned thread should process");
const followupData = await followupDecision.json();
assert(followupData.decision_action === "FLAG_HUMAN", "human-owned threads should stay human-owned after later replyable messages");
assert(followupData.draft_status === "flag-human", "human-owned follow-ups should not create sendable drafts");

const promptSave = await call("/api/fenster/bot/prompt", {
  method: "POST",
  headers: { Cookie: cookie },
  body: JSON.stringify({ promptContext: "Never say warranties or guarantees are transferable." })
});

assert(promptSave.status === 200, "AI prompt context save should work");
const promptData = await promptSave.json();
assert(promptData.bot.promptContext.includes("warranties"), "Fenster state should return saved prompt context");

const social = await call("/api/records/social_posts", {
  method: "POST",
  headers: { Cookie: cookie },
  body: JSON.stringify({
    title: "Smoke test social idea",
    platform: "Instagram",
    content_type: "Story",
    status: "Idea",
    scheduled_for: "",
    owner: "Zac",
    notes: "Created by smoke test."
  })
});

assert(social.status === 201, "social post create should work");

const guideline = await call("/api/records/social_guidelines", {
  method: "POST",
  headers: { Cookie: cookie },
  body: JSON.stringify({
    title: "Smoke guideline",
    category: "Brand voice",
    body: "Keep social captions helpful and direct."
  })
});

assert(guideline.status === 201, "social guideline create should work");

const actionItem = await call("/api/records/action_plan_items", {
  method: "POST",
  headers: { Cookie: cookie },
  body: JSON.stringify({
    title: "Smoke action item",
    section: "Custom",
    effort: "easy",
    detail: "Created by smoke test.",
    status: "Active"
  })
});

assert(actionItem.status === 201, "custom action plan item create should work");

const idea = await call("/api/records/ideas", {
  method: "POST",
  headers: { Cookie: cookie },
  body: JSON.stringify({
    title: "Smoke idea",
    author: "Zac",
    impact: "Medium",
    status: "Inbox",
    detail: "Created by smoke test."
  })
});

const ideaJson = await idea.json();
const approvedIdea = await call("/api/records/ideas", {
  method: "PATCH",
  headers: { Cookie: cookie },
  body: JSON.stringify({ id: ideaJson.id, status: "Approved" })
});

assert(approvedIdea.status === 200, "ideas should be approvable");

const deleteTicket = await call("/api/records/tickets", {
  method: "DELETE",
  headers: { Cookie: cookie },
  body: JSON.stringify({ id: (await ticket.json()).id })
});

assert(deleteTicket.status === 200, "ticket delete should work");

// ---------------------------------------------------------------------------
// AI Receptionist
// ---------------------------------------------------------------------------

// Knowledge and prompt helpers are pure and checked without any API.
assert(searchFensterKnowledge("what time are you open tomorrow")[0]?.id === "hours", "opening-hours question should find the hours fact");
assert(searchFensterKnowledge("do you do triple glazing")[0]?.id === "glazing", "triple glazing question should find the glazing fact");
assert(searchFensterKnowledge("how long is your guarantee")[0]?.id === "guarantee", "guarantee question should find the guarantee fact");
assert(searchFensterKnowledge("do you work in Bedford")[0]?.id === "coverage-residential", "Bedford should resolve to residential coverage");
assert(searchFensterKnowledge("do you fit bifold doors")[0]?.id === "bifold", "bifold question should find the bifold fact");
assert(searchFensterKnowledge("can you quote for a composite door").some((result) => result.id === "composite-doors"), "composite door quote should surface the composite fact");
assert(searchFensterKnowledge("xyzzy quantum flux").length === 0, "nonsense should find nothing rather than guessing");

const tuesdayEvening = officeStatus(new Date("2026-09-08T18:42:00Z"));
assert(tuesdayEvening.open === false && tuesdayEvening.reopens === "tomorrow morning at 8.30am", `Tuesday evening should reopen tomorrow morning (got ${tuesdayEvening.reopens})`);
assert(officeStatus(new Date("2026-09-11T17:30:00Z")).reopens === "on Monday morning at 8.30am", "Friday evening should reopen Monday");
assert(officeStatus(new Date("2026-09-08T09:00:00Z")).open === true, "Tuesday 10am UK should be open");
const promptWithNumber = buildReceptionistInstructions({ callerNumber: "07700 900123", source: "browser_test", now: new Date("2026-09-08T18:42:00Z") });
assert(promptWithNumber.includes("07700 900123") && promptWithNumber.includes("on this number"), "caller number should be passed into the instructions");
assert(promptWithNumber.includes("Hi, Fenster Glazing. The team's not in just now, so you've got the AI assistant"), "instructions should carry the greeting");
assert(!/Our office is currently closed/.test(promptWithNumber) && promptWithNumber.includes("do not explain that the person is unavailable"), "no answerphone opening, and no restating the obvious");
assert(!/Chief Meow Officer|purr|meow/i.test(promptWithNumber), "the receptionist must not inherit Legend's cat persona");
assert(promptWithNumber.includes("Nick Baker, Sales Director"), "the published team roster is in the instructions");
assert(promptWithNumber.includes("end_call") && promptWithNumber.includes("You end the call, not the caller"), "the receptionist is told to hang up itself");
assert(promptWithNumber.includes("do not ask whether it is urgent or time-sensitive"), "the receptionist must not ask about urgency");
assert(promptWithNumber.includes("on this number") && promptWithNumber.includes("do not read the digits out"), "a supplied caller number is never read back");
assert(promptWithNumber.includes("Calls are limited to about 3 minutes"), "the time limit is explained to the receptionist");

// Unauthenticated access is refused everywhere.
assert((await call("/api/reception/state")).status === 401, "reception state must require a session");
assert((await call("/api/reception/calls", { method: "POST", body: "{}" })).status === 401, "creating a call must require a session");
assert((await call("/api/reception/calls/abc/finalise", { method: "POST", body: "{}" })).status === 401, "finalising must require a session");

const emptyReception = await call("/api/reception/state", { headers: { Cookie: cookie } });
assert(emptyReception.status === 200, "reception state should load");
const emptyReceptionData = await emptyReception.json();
assert(Array.isArray(emptyReceptionData.calls) && emptyReceptionData.calls.length === 0, "no calls initially");
assert(emptyReceptionData.config.openAi === false, "config should report OpenAI missing until the secret exists");
assert(emptyReceptionData.config.notificationProvider === "simulated", "V1 provider is simulated");
assert(emptyReceptionData.config.voice === "ballad" && emptyReceptionData.config.transcribeModel === "whisper-1", "owner-requested defaults: ballad voice, whisper transcription");

// Malformed input.
assert((await call("/api/reception/calls", { method: "POST", headers: { Cookie: cookie }, body: "not json" })).status === 400, "non-JSON body should be rejected");
assert((await call("/api/reception/calls", { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ caller_number: "call me maybe" }) })).status === 400, "a non-numeric caller number should be rejected");
assert((await call("/api/reception/calls", { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ source: "twilio" }) })).status === 400, "only browser_test calls can be created from the dashboard");
assert((await call("/api/reception/calls", { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ voice: "brian" }) })).status === 400, "unknown voices are refused");
assert(promptWithNumber.includes("ACCENT: a natural, understated southern English accent") && promptWithNumber.includes("do not perform it"), "the accent is pinned in the instructions without caricature");
assert(promptWithNumber.includes("NEVER call end_call in the same turn as a question"), "hanging up before the goodbye is forbidden");

// Session without an OpenAI key fails clearly and closes the call.
const noKeyCall = await (await call("/api/reception/calls", { method: "POST", headers: { Cookie: cookie }, body: "{}" })).json();
const noKeySession = await call(`/api/reception/calls/${noKeyCall.call.id}/session`, { method: "POST", headers: { Cookie: cookie }, body: "{}" });
assert(noKeySession.status === 503, "session without OPENAI_API_KEY should be a 503");
assert((await noKeySession.json()).code === "openai_not_configured", "the error code should say the key is missing");
assert(tables.reception_calls.find((row) => row.id === noKeyCall.call.id).status === "failed", "a call that never got a session is marked failed");

env.OPENAI_API_KEY = "test-openai-key";

// Create a browser test call with a simulated caller number.
const created = await call("/api/reception/calls", { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ source: "browser_test", caller_number: " 07700  900123 ", voice: "ballad" }) });
assert(created.status === 201, "creating a browser test call should work");
const createdCall = (await created.json()).call;
assert(createdCall.status === "in_progress" && createdCall.source === "browser_test", "new call should be an in-progress browser test");
assert(createdCall.caller_number === "07700 900123", "caller number should be normalised");
assert(createdCall.metadata.simulated_caller_number === true, "simulated caller metadata should be stored");
assert(createdCall.started_by === "Zac", "the dashboard user who started the call is recorded");

// Realtime session: the browser gets a client secret, never the API key.
assert((await call("/api/reception/calls/not-a-real-call/session", { method: "POST", headers: { Cookie: cookie }, body: "{}" })).status === 404, "unknown call session should 404");
const session = await call(`/api/reception/calls/${createdCall.id}/session`, { method: "POST", headers: { Cookie: cookie }, body: "{}" });
assert(session.status === 200, "session creation should work with a key");
const sessionJson = await session.json();
assert(sessionJson.client_secret === "ek_test_secret_123", "the ephemeral client secret is returned");
assert(!JSON.stringify(sessionJson).includes("test-openai-key"), "the OpenAI API key must never reach the browser");
assert(sessionJson.model === "gpt-realtime-2.1", "default realtime model should be the current one");
assert(sessionJson.voice === "ballad" && emptyReceptionData.config.voices.includes("ballad"), "a per-call voice choice reaches the session");
const secretRequest = openAiRequests.find((item) => item.url.includes("client_secrets"));
assert(secretRequest, "a client secret should have been requested from OpenAI");
assert((secretRequest.init.headers.authorization || secretRequest.init.headers.Authorization) === "Bearer test-openai-key", "the server uses the real key against OpenAI");
assert(secretRequest.body.session.type === "realtime" && secretRequest.body.session.model === "gpt-realtime-2.1", "session config should target a realtime session");
assert(secretRequest.body.session.instructions.includes("07700 900123"), "the caller number reaches the receptionist instructions");
assert(secretRequest.body.session.tools.some((tool) => tool.name === "search_fenster_knowledge"), "the knowledge tool is exposed to the voice model");
assert(secretRequest.body.session.tools.some((tool) => tool.name === "end_call"), "the hang-up tool is exposed to the voice model");
assert(sessionJson.max_call_seconds === 180 && sessionJson.wrap_up_seconds === 20, "the transport is told the call time limit");
assert(secretRequest.body.session.audio.input.transcription.model === "whisper-1", "input transcription defaults to whisper-1");
assert(secretRequest.body.session.audio.output.voice === "ballad", "the chosen voice is sent to OpenAI");
assert(secretRequest.body.session.audio.input.turn_detection.interrupt_response === true, "barge-in must be enabled");
assert(secretRequest.body.expires_after.seconds === 300, "client secrets should be short-lived");
assert(secretRequest.body.session.max_output_tokens === 400, "replies are capped so the receptionist cannot monologue");
assert(/Fenster Glazing/.test(secretRequest.body.session.audio.input.transcription.prompt || ""), "the transcriber gets a Fenster vocabulary hint");
assert(promptWithNumber.indexOf("be brief") < promptWithNumber.indexOf("# Situation"), "brevity is the first rule in the instructions");

// Tools: allowlisted, verified answers only.
const toolCall = await call(`/api/reception/calls/${createdCall.id}/tool`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "search_fenster_knowledge", arguments: { query: "Do you cover Bedford?" } }) });
assert(toolCall.status === 200, "knowledge tool should run");
const toolJson = await toolCall.json();
assert(toolJson.output.found === true && /Bedfordshire/.test(toolJson.output.results[0].answer), "Bedford should be answered with the verified coverage fact");
assert((await call(`/api/reception/calls/${createdCall.id}/tool`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "drop_database", arguments: {} }) })).status === 400, "unknown tools are refused");
const hangupTool = await call(`/api/reception/calls/${createdCall.id}/tool`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "end_call", arguments: { reason: "message_taken" } }) });
assert(hangupTool.status === 200 && (await hangupTool.json()).output.hang_up === true, "end_call tells the transport to hang up");

// Finalise: malformed, then the real transcript. The call is backdated so the
// duration maths has something to measure.
assert((await call(`/api/reception/calls/${createdCall.id}/finalise`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ transcript: "not a list" }) })).status === 400, "transcript must be an array");
const createdRow = tables.reception_calls.find((row) => row.id === createdCall.id);
createdRow.started_at = new Date(Date.now() - 180000).toISOString();
const connectedAt = new Date(Date.parse(createdRow.started_at) + 5000).toISOString();
const spokenAt = (offsetSeconds) => new Date(Date.parse(connectedAt) + offsetSeconds * 1000).toISOString();
const transcript = [
  { role: "assistant", body: "Thanks for calling Fenster Glazing. Our office is currently closed, but I'm Fenster's automated assistant. I can answer general questions or take a message for the team. How can I help?", at: spokenAt(0) },
  { role: "user", body: "Hi, I spoke to Nick earlier about some bifold doors. Can you ask him to give me a ring tomorrow?", at: spokenAt(9) },
  { role: "assistant", body: "Of course. I'll leave Nick a message. Can I take your name?", at: spokenAt(13) },
  { role: "user", body: "John Smith.", at: spokenAt(16) },
  { role: "assistant", body: "Thanks John. Is the number you're calling from, oh seven seven double-oh nine double-oh one two three, the best one for Nick to call you back on?", at: spokenAt(19) },
  { role: "user", body: "Yes that's fine, it's about the opening size.", at: spokenAt(24) },
  { role: "assistant", body: "Perfect, I've got that. I'll leave that for Nick and the team will pick it up when the office reopens.", at: spokenAt(28) },
  { role: "system", body: "should be ignored", at: spokenAt(29) },
  { role: "user", body: "   ", at: spokenAt(30) },
  "not an object"
];
const finalised = await call(`/api/reception/calls/${createdCall.id}/finalise`, {
  method: "POST",
  headers: { Cookie: cookie },
  body: JSON.stringify({ ended_at: new Date().toISOString(), connected_at: connectedAt, reason: "caller_ended", transcript, client_stats: { user_turns: 3, assistant_turns: 4, model: "gpt-realtime-2.1" } })
});
assert(finalised.status === 200, "finalising should work");
const finalCall = (await finalised.json()).call;
assert(finalCall.status === "completed", "finalised call is completed");
assert(finalCall.duration_seconds >= 170 && finalCall.duration_seconds <= 180, `duration should run from connect to end (got ${finalCall.duration_seconds})`);
assert(finalCall.summary_status === "completed", "summary should complete");
assert(finalCall.caller_name === "John Smith" && finalCall.callback_number === "07700 900123" && finalCall.requested_person === "Nick Baker", "structured fields come from the summary");
assert(finalCall.topic === "Aluminium bifold doors" && finalCall.urgency === "normal" && finalCall.resolved_during_call === false, "topic, urgency and resolution are stored");
assert(finalCall.summary_model === "gpt-5.6-luna", "default summary model should be the configured inexpensive model");
assert(finalCall.notification_status === "simulated", "a simulated notification should be recorded");
assert(finalCall.notification?.status === "simulated" && finalCall.notification.recipient === "info@fensterglazing.com", "notification summary rides along with the call");
assert(finalCall.metadata.client_stats.user_turns === 3 && finalCall.metadata.dropped_transcript_entries === 3, "client stats and dropped entries are kept in metadata");
const storedMessages = tables.reception_call_messages.filter((row) => row.call_id === createdCall.id);
assert(storedMessages.length === 7, `seven spoken turns should be stored (got ${storedMessages.length})`);
assert(storedMessages.every((row, index) => row.sequence === index + 1), "messages are sequenced");
assert(storedMessages[1].role === "user" && storedMessages[1].spoken_at === spokenAt(9), "caller turns keep their role and timestamp");
const summaryRequest = openAiRequests.find((item) => item.url.includes("/v1/responses"));
assert(summaryRequest, "the summary should be requested from the Responses API");
assert(summaryRequest.body.text.format.type === "json_schema" && summaryRequest.body.text.format.strict === true, "summary must use strict Structured Outputs");
assert(summaryRequest.body.model === "gpt-5.6-luna", "summary uses the default model");
assert(summaryRequest.body.input[0].content.includes("Can you ask him to give me a ring tomorrow") && summaryRequest.body.input[0].content.includes("07700 900123"), "transcript and caller ID are sent for summarisation");
assert(summaryRequest.body.store === false, "summary requests should not be stored by OpenAI");
const storedNotification = tables.reception_notifications.find((row) => row.call_id === createdCall.id);
assert(storedNotification && storedNotification.status === "simulated" && storedNotification.provider === "simulated", "notification row is simulated");
assert(storedNotification.subject === "Out-of-hours call: Nick callback requested – John Smith", `subject should follow the agreed format (got ${storedNotification.subject})`);
assert(storedNotification.body_text.includes("Caller: John Smith") && storedNotification.body_text.includes("Requested: Nick Baker") && storedNotification.body_text.includes("Action required:\nNick to call John back tomorrow"), "plain-text email carries the structured data");
assert(storedNotification.body_text.includes("Duration: 2m") && storedNotification.body_text.includes("Urgency:\nNormal"), "email carries duration and urgency");
assert(storedNotification.body_text.includes("Receptionist: Thanks for calling Fenster Glazing"), "email includes the transcript");
assert(storedNotification.body_html.includes("Out-of-hours call received") && storedNotification.body_html.includes(`/#reception/call/${createdCall.id}`), "HTML email links back to the dashboard record");
const eventTypes = tables.reception_call_events.filter((row) => row.call_id === createdCall.id).map((row) => row.type);
assert(["call.created", "session.created", "tool.called", "call.finalised", "summary.completed", "notification.simulated"].every((type) => eventTypes.includes(type)), `audit trail should be complete (got ${eventTypes.join(", ")})`);

// Idempotent finalisation.
const again = await call(`/api/reception/calls/${createdCall.id}/finalise`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ transcript: [] }) });
assert(again.status === 200 && (await again.json()).already_finalised === true, "a second End Call returns the stored result");
assert(tables.reception_call_messages.filter((row) => row.call_id === createdCall.id).length === 7, "re-finalising must not touch the transcript");
assert(tables.reception_notifications.filter((row) => row.call_id === createdCall.id).length === 1, "re-finalising must not duplicate the notification");
assert(openAiRequests.filter((item) => item.url.includes("/v1/responses")).length === 1, "re-finalising must not call OpenAI again");

// Detail view.
const detail = await call(`/api/reception/calls/${createdCall.id}`, { headers: { Cookie: cookie } });
assert(detail.status === 200, "call detail should load");
const detailJson = await detail.json();
assert(detailJson.messages.length === 7 && detailJson.notifications.length === 1 && detailJson.notifications[0].body_html.includes("<html>"), "detail includes transcript and full email");
assert(detailJson.events.some((event) => event.type === "summary.completed" && event.detail.model === "gpt-5.6-luna"), "detail includes parsed events");
assert((await call("/api/reception/calls/does-not-exist", { headers: { Cookie: cookie } })).status === 404, "unknown call detail should 404");

// Empty call: nothing to summarise, nothing to email.
const emptyCall = (await (await call("/api/reception/calls", { method: "POST", headers: { Cookie: cookie }, body: "{}" })).json()).call;
await call(`/api/reception/calls/${emptyCall.id}/session`, { method: "POST", headers: { Cookie: cookie }, body: "{}" });
const emptyFinal = await (await call(`/api/reception/calls/${emptyCall.id}/finalise`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ transcript: [transcript[0]] }) })).json();
assert(emptyFinal.empty === true && emptyFinal.call.summary_status === "skipped" && emptyFinal.call.notification_status === "skipped", "a call with no caller speech is skipped, not summarised");
assert(emptyFinal.call.topic === "No conversation", "empty calls are labelled as such");
assert(openAiRequests.filter((item) => item.url.includes("/v1/responses")).length === 1, "empty calls must not call the summary model");

// The list is newest first and reports counts.
const listed = await (await call("/api/reception/state", { headers: { Cookie: cookie } })).json();
assert(listed.calls[0].id === emptyCall.id && listed.calls.some((item) => item.id === createdCall.id), "state lists calls newest first");
assert(listed.config.openAi === true && listed.stats.simulatedNotifications === 1 && listed.stats.needsAction === 1, "state reports configuration and counts");

// Summary failure keeps the call and the transcript.
openAiMode.summary = "fail";
const failingCall = (await (await call("/api/reception/calls", { method: "POST", headers: { Cookie: cookie }, body: "{}" })).json()).call;
await call(`/api/reception/calls/${failingCall.id}/session`, { method: "POST", headers: { Cookie: cookie }, body: "{}" });
const failedFinal = await call(`/api/reception/calls/${failingCall.id}/finalise`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ transcript: transcript.slice(0, 4) }) });
assert(failedFinal.status === 200, "a summary failure must not fail the End Call request");
const failedJson = await failedFinal.json();
assert(failedJson.call.status === "completed" && failedJson.call.summary_status === "failed", "the call is saved with summary_status failed");
assert(failedJson.call.summary_error && !failedJson.call.summary_error.includes("test-openai-key"), "summary_error is readable and secret-free");
assert(failedJson.call.notification_status === "skipped", "no email is simulated when the summary failed");
assert(tables.reception_call_messages.filter((row) => row.call_id === failingCall.id).length === 4, "the transcript survives a summary failure");

// Retry once the model is back, via the unknown-model fallback, with a different recipient configured.
openAiMode.summary = "model_missing_first";
env.RECEPTION_NOTIFICATION_TO = "office-test@fensterglazing.com";
const retried = await call(`/api/reception/calls/${failingCall.id}/summarise`, { method: "POST", headers: { Cookie: cookie }, body: "{}" });
assert(retried.status === 200, "retrying the summary should work");
const retriedJson = await retried.json();
assert(retriedJson.call.summary_status === "completed" && retriedJson.call.summary_model === "gpt-5.4-mini", `an unknown model falls back to the known-good model (got ${retriedJson.call.summary_model})`);
assert(retriedJson.call.notification_status === "simulated" && retriedJson.notifications[0].recipient === "office-test@fensterglazing.com", "RECEPTION_NOTIFICATION_TO controls the simulated recipient");
openAiMode.summary = "ok";
delete env.RECEPTION_NOTIFICATION_TO;

// Client-side technical events.
assert((await call(`/api/reception/calls/${createdCall.id}/event`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ type: "webrtc_disconnected", detail: { state: "failed" } }) })).status === 200, "client events are logged");
assert((await call(`/api/reception/calls/${createdCall.id}/event`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ type: "bad type!" }) })).status === 400, "client event types are validated");

// Delete a browser test call and everything attached to it.
assert((await call("/api/reception/calls/does-not-exist", { method: "DELETE", headers: { Cookie: cookie } })).status === 404, "deleting an unknown call should 404");
const removed = await call(`/api/reception/calls/${createdCall.id}`, { method: "DELETE", headers: { Cookie: cookie } });
assert(removed.status === 200, "deleting a browser test call should work");
assert((await call(`/api/reception/calls/${createdCall.id}`, { headers: { Cookie: cookie } })).status === 404, "deleted call is gone");
assert(
  !tables.reception_call_messages.some((row) => row.call_id === createdCall.id)
  && !tables.reception_notifications.some((row) => row.call_id === createdCall.id)
  && !tables.reception_call_events.some((row) => row.call_id === createdCall.id),
  "transcript, notification and events are removed with the call"
);
tables.reception_calls.push({ id: "tel-0001", source: "twilio", status: "completed", started_at: new Date().toISOString(), metadata_json: "{}" });
assert((await call("/api/reception/calls/tel-0001", { method: "DELETE", headers: { Cookie: cookie } })).status === 403, "telephone calls are protected from casual deletion");

console.log("Smoke test passed");

async function call(path, init = {}) {
  // A real browser always sends a user agent; without one the ingest endpoints
  // rightly classify the request as automated and drop it.
  const request = new Request(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SmokeTest/1.0 Chrome/128.0 Safari/537.36",
      ...(init.headers || {})
    }
  });
  return onRequest({ request, env });
}

function queryAll({ sql, values }) {
  const table = tableFrom(sql);
  if (sql.includes("COUNT(*) AS count")) {
    const grouped = new Map();
    for (const note of tables.notes) {
      const key = `${note.parent_type}:${note.parent_id}`;
      grouped.set(key, {
        parent_type: note.parent_type,
        parent_id: note.parent_id,
        count: (grouped.get(key)?.count || 0) + 1
      });
    }
    return { results: [...grouped.values()] };
  }
  if (sql.includes("WHERE parent_type")) {
    const [parentType, parentId] = values;
    return { results: tables.notes.filter((note) => note.parent_type === parentType && note.parent_id === parentId) };
  }
  if (sql.includes("WHERE conversation_id")) {
    return { results: tables.fenster_messages.filter((message) => message.conversation_id === values[0]) };
  }
  if (sql.includes("WHERE call_id = ?")) {
    return { results: tables[table].filter((row) => row.call_id === values[0]) };
  }
  return { results: [...tables[table]].sort((a, b) => b.id - a.id) };
}

function queryFirst({ sql, values }) {
  const table = tableFrom(sql);
  if (!sql.includes("WHERE")) return tables[table][0] || null;
  if (table === "fenster_settings") return tables[table].find((item) => item.key === values[0]) || null;
  if (table === "website_events" && sql.includes("journey_id = ?")) {
    return tables[table].find((item) => item.journey_id === values[0]
      && (!sql.includes("event_type IN") || ["quote_completed", "form_submitted"].includes(item.event_type))) || null;
  }
  return tables[table].find((item) => item.id === values[0]) || null;
}

function run({ sql, values }) {
  sql = sql.trim();
  const table = tableFrom(sql);
  if (sql.startsWith("INSERT")) {
    const columns = sql.match(/\(([^)]+)\)/)[1].split(",").map((value) => value.trim());
    const item = columns.includes("id") ? {} : { id: nextId++ };
    const valueTokens = sql.match(/VALUES\s*\(([^)]+)\)/i)?.[1].split(",").map((value) => value.trim()) || [];
    let boundIndex = 0;
    columns.forEach((column, index) => {
      const token = valueTokens[index] || "?";
      if (token === "?") {
        item[column] = values[boundIndex++];
      } else if (/^-?\d+(?:\.\d+)?$/.test(token)) {
        item[column] = Number(token);
      } else {
        item[column] = token.replace(/^'(.*)'$/, "$1");
      }
    });
    if (sql.startsWith("INSERT OR IGNORE") && tables[table].some((row) => (
      (item.event_id && row.event_id === item.event_id)
      || (item.id && row.id === item.id)
    ))) {
      return { meta: { changes: 0 } };
    }
    tables[table].push(item);
    return { meta: { last_row_id: item.id, changes: 1 } };
  }
  if (sql.startsWith("UPDATE")) {
    const item = table === "fenster_settings"
      ? tables[table].find((row) => row.key === values[0])
      : tables[table].find((row) => row.id === values.at(-1));
    if (!item) return { meta: {} };
    if (table === "fenster_settings") {
      item.value = values[1];
      return { meta: {} };
    }
    let valueIndex = 0;
    const assignments = sql.match(/SET (.+?) WHERE/i)[1].split(",").map((part) => part.trim());
    assignments.forEach((assignment) => {
      const [column, expression] = assignment.split("=").map((part) => part.trim());
      if (expression === "?") {
        item[column] = values[valueIndex++];
      } else if (expression === "CURRENT_TIMESTAMP") {
        item[column] = new Date().toISOString();
      } else {
        item[column] = expression.replace(/^'(.*)'$/, "$1");
      }
    });
  }
  if (sql.startsWith("DELETE")) {
    if (sql.includes("WHERE call_id = ?")) {
      tables[table] = tables[table].filter((row) => row.call_id !== values[0]);
      return { meta: {} };
    }
    if (sql.includes("parent_type")) {
      const [parentType, parentId] = values;
      tables.notes = tables.notes.filter((note) => note.parent_type !== parentType || note.parent_id !== parentId);
      return { meta: {} };
    }
    tables[table] = tables[table].filter((item) => item.id !== values[0]);
  }
  return { meta: {} };
}

function tableFrom(sql) {
  const match = sql.match(/(?:FROM|INTO|UPDATE)\s+([a-z0-9_]+)/);
  if (!match) throw new Error(`Could not detect table from SQL: ${sql}`);
  return match[1];
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
