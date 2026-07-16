import { onRequest } from "../functions/api/[[path]].js";

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
  website_statistical_aggregate: []
};

let forcedUuid = 1;

let nextId = 1;

const env = {
  SESSION_SECRET: "test-secret",
  PASSWORD_ZAC: "test-password",
  PASSWORD_ADAM: "test-password",
  PASSWORD_NICK: "test-password",
  META_PAGE_ACCESS_TOKEN: "test-meta-token",
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
assert(tables.website_statistical_aggregate.length > 0, "anonymous statistical event should be stored in the aggregate table");
assert(!tables.website_visitors || tables.website_visitors.length === 0, "anonymous statistical event should not create a visitor record");

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

console.log("Smoke test passed");

async function call(path, init = {}) {
  const request = new Request(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
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
  return { results: [...tables[table]].sort((a, b) => b.id - a.id) };
}

function queryFirst({ sql, values }) {
  const table = tableFrom(sql);
  if (!sql.includes("WHERE")) return tables[table][0] || null;
  if (table === "fenster_settings") return tables[table].find((item) => item.key === values[0]) || null;
  return tables[table].find((item) => item.id === values[0]) || null;
}

function run({ sql, values }) {
  sql = sql.trim();
  const table = tableFrom(sql);
  if (sql.startsWith("INSERT")) {
    const columns = sql.match(/\(([^)]+)\)/)[1].split(",").map((value) => value.trim());
    const item = columns.includes("id") ? {} : { id: nextId++ };
    columns.forEach((column, index) => {
      item[column] = values[index];
    });
    tables[table].push(item);
    return { meta: { last_row_id: item.id } };
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
  const match = sql.match(/(?:FROM|INTO|UPDATE)\s+([a-z_]+)/);
  if (!match) throw new Error(`Could not detect table from SQL: ${sql}`);
  return match[1];
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
