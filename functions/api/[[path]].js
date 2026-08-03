import { USERS } from "../_data/users.js";

const TABLES = {
  tickets: ["title", "requester", "category", "priority", "status", "owner", "detail", "project_key"],
  ideas: ["title", "author", "impact", "priority", "status", "detail", "project_key"],
  tasks: ["title", "lane", "owner", "priority", "due_date", "done", "project_key"],
  todays_plan: ["title", "owner", "priority", "status", "notes", "updated_by", "project_key"],
  social_posts: ["title", "platform", "content_type", "priority", "status", "scheduled_for", "owner", "notes", "project_key"],
  social_guidelines: ["title", "category", "priority", "body"],
  action_plan_items: ["title", "section", "effort", "priority", "detail", "status", "project_key"],
  content_requests: ["title", "requester", "asset_type", "priority", "deadline", "status", "detail", "project_key"],
  website_updates: ["title", "area", "priority", "status", "release_date", "detail", "project_key"],
  changelog: ["title", "shipped_at", "area", "priority", "detail", "project_key"],
  daily_reports: ["title", "report_date", "body", "wins", "blockers", "updated_by"]
};

const ALLOWED_TABLES = new Set(Object.keys(TABLES));

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const route = url.pathname.replace(/^\/api\/?/, "");

  try {
    if (route === "website/event" && context.request.method === "OPTIONS") return websiteCors(context.request);
    if (route === "website/event" && context.request.method === "POST") return websiteEvent(context);
    if (route === "website/chat" && context.request.method === "OPTIONS") return websiteCors(context.request);
    if (route === "website/chat" && context.request.method === "POST") return websiteChat(context);
    if (route === "website/consent" && context.request.method === "OPTIONS") return websiteCors(context.request);
    if (route === "website/consent" && context.request.method === "POST") return websiteConsent(context);
    if (route === "website/stat" && context.request.method === "OPTIONS") return websiteCors(context.request);
    if (route === "website/stat" && context.request.method === "POST") return websiteStat(context);
    if (route === "website/outcome-ingest" && context.request.method === "POST") return websiteOutcomeIngest(context);
    if (route === "login" && context.request.method === "POST") return login(context);
    if (route === "logout") return logout(context);

    const user = await getUser(context.request, context.env);
    if (!user) return json({ error: "Not signed in" }, 401);

    if (route === "me") return json({ user });
    if (route === "bootstrap") return bootstrap(context.env);
    if (route.startsWith("records/")) return records(context, route.replace("records/", ""));
    if (route.startsWith("notes/")) return notes(context, route.replace("notes/", ""), user);
    if (route.startsWith("fenster/")) return fenster(context, route.replace("fenster/", ""), user);

    return json({ error: "Not found" }, 404);
  } catch (error) {
    return json({ error: error.message || "Something went wrong" }, 500);
  }
}

async function login({ request, env }) {
  const body = await request.json();
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  const found = USERS.find((user) => user.username === username && env[user.passwordSecret] === password);

  if (!found) return json({ error: "Wrong username or password" }, 401);

  const publicUser = { name: found.name, username: found.username, role: found.role };
  const session = await signSession(publicUser, env);
  const cookie = cookieOptions(request);
  return json(
    { user: publicUser },
    200,
    { "Set-Cookie": `md_session=${session}; ${cookie}; Max-Age=604800` }
  );
}

function logout({ request } = {}) {
  const cookie = request ? cookieOptions(request) : "Path=/; HttpOnly; Secure; SameSite=Lax";
  return json({ ok: true }, 200, {
    "Set-Cookie": `md_session=; ${cookie}; Max-Age=0`
  });
}

function cookieOptions(request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `Path=/; HttpOnly${secure}; SameSite=Lax`;
}

async function bootstrap(env) {
  const data = {};
  for (const table of Object.keys(TABLES)) {
    data[table] = await selectAll(env, table);
  }
  data.note_counts = await noteCounts(env);
  return json(data);
}

async function records(context, table) {
  const { request, env } = context;
  if (!ALLOWED_TABLES.has(table)) return json({ error: "Unknown table" }, 404);

  if (request.method === "GET") return json(await selectAll(env, table));

  if (request.method === "POST") {
    const body = sanitize(await request.json(), TABLES[table]);
    const keys = Object.keys(body);
    if (!keys.length || !body.title) return json({ error: "A title is required" }, 400);

    const placeholders = keys.map(() => "?").join(", ");
    const result = await env.DB.prepare(
      `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`
    ).bind(...keys.map((key) => body[key])).run();

    return json((await selectOne(env, table, result.meta.last_row_id)) || body, 201);
  }

  if (request.method === "PATCH") {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) return json({ error: "An id is required" }, 400);

    const updates = sanitize(body, TABLES[table]);
    delete updates.id;
    const keys = Object.keys(updates);
    if (!keys.length) return json({ error: "No valid fields to update" }, 400);

    await env.DB.prepare(
      `UPDATE ${table} SET ${keys.map((key) => `${key} = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(...keys.map((key) => updates[key]), id).run();

    return json(await selectOne(env, table, id));
  }

  if (request.method === "DELETE") {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) return json({ error: "An id is required" }, 400);
    await env.DB.prepare("DELETE FROM notes WHERE parent_type = ? AND parent_id = ?").bind(table, id).run();
    await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
    return json({ ok: true, id });
  }

  return json({ error: "Method not allowed" }, 405);
}

async function notes(context, target, user) {
  const { request, env } = context;
  const [parentType, parentId] = target.split("/");
  const id = Number(parentId);
  if (!ALLOWED_TABLES.has(parentType) || !id) return json({ error: "Invalid note target" }, 400);

  if (request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT * FROM notes WHERE parent_type = ? AND parent_id = ? ORDER BY created_at DESC"
    ).bind(parentType, id).all();
    return json(rows.results || []);
  }

  if (request.method === "POST") {
    const body = await request.json();
    const text = String(body.body || "").trim();
    if (!text) return json({ error: "A note body is required" }, 400);
    await env.DB.prepare(
      "INSERT INTO notes (parent_type, parent_id, author, body) VALUES (?, ?, ?, ?)"
    ).bind(parentType, id, user.name, text).run();
    return notes({ request: new Request(request.url, { method: "GET" }), env }, target, user);
  }

  return json({ error: "Method not allowed" }, 405);
}

async function selectAll(env, table) {
  const rows = await env.DB.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all();
  return rows.results || [];
}

async function selectOne(env, table, id) {
  const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
  return row || null;
}

async function noteCounts(env) {
  const rows = await env.DB.prepare(
    "SELECT parent_type, parent_id, COUNT(*) AS count FROM notes GROUP BY parent_type, parent_id"
  ).all();
  const counts = {};
  for (const row of rows.results || []) {
    counts[`${row.parent_type}:${row.parent_id}`] = row.count;
  }
  return counts;
}

function sanitize(body, allowed) {
  const clean = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      clean[key] = key === "done" ? Number(Boolean(body[key])) : String(body[key] ?? "").trim();
    }
  }
  return clean;
}

async function fenster(context, route, user) {
  const { request, env } = context;

  if (request.method === "GET" && route === "state") return fensterState(env);
  if (request.method === "POST" && route === "demo/seed") return fensterSeed(env, user);
  if (request.method === "POST" && route === "meta/sync") return fensterSyncMeta(env);
  if (request.method === "POST" && route === "drafts/regenerate") return fensterRegenerateDrafts(env);
  if (request.method === "POST" && route === "bot/start") return fensterSetBotActive(env, true, user);
  if (request.method === "POST" && route === "bot/stop") return fensterSetBotActive(env, false, user);
  if (request.method === "POST" && route === "bot/process") return json(await processBotQueue(env, user.name));
  if (request.method === "POST" && route === "bot/prompt") return fensterUpdatePromptContext(env, request, user);
  if (request.method === "GET" && route === "website/state") return fensterWebsiteState(env);
  if (request.method === "POST" && route === "website/outcome") return fensterWebsiteOutcome(env, request);
  const chatMatch = route.match(/^website\/chat\/(CHT-[A-Z0-9-]{8,80})$/i);
  if (request.method === "GET" && chatMatch) return fensterWebsiteChat(env, chatMatch[1]);
  const visitorMatch = route.match(/^website\/visitor\/(FGV-[A-Z0-9-]{8,80})$/i);
  if (request.method === "GET" && visitorMatch) return fensterWebsiteVisitor(env, visitorMatch[1]);

  const draftMatch = route.match(/^conversations\/([^/]+)\/(draft|generate-draft|send|hide|reject|email-office)$/);
  if (draftMatch && request.method === "POST") {
    return fensterConversationAction(env, request, draftMatch[1], draftMatch[2], user);
  }

  return json({ error: "Not found" }, 404);
}

async function fensterState(env) {
  if (await isBotActive(env)) await processBotQueue(env, "auto-refresh");
  const conversations = await fensterConversations(env);
  const reviews = await fensterRows(env, "fenster_reviews");
  const events = await fensterRows(env, "fenster_events", "created_at DESC");
  const queue = await fensterQueue(env);
  const botActive = await isBotActive(env);
  const promptContext = await getPromptContext(env);

  return json({
    conversations,
    reviews,
    events,
    bot: {
      active: botActive,
      queue,
      waitingToSend: queue.filter((item) => item.status === "pending" && item.action === "SEND_REPLY").length,
      waitingForHuman: conversations.filter((item) => item.decision_action === "FLAG_HUMAN" && latestInboundMessage(item)).length,
      promptContext
    },
    config: {
      openAi: Boolean(env.OPENAI_API_KEY),
      meta: Boolean(env.META_PAGE_ACCESS_TOKEN || env.META_INSTAGRAM_ACCESS_TOKEN),
      google: Boolean(env.GOOGLE_BUSINESS_ACCESS_TOKEN),
      trustpilot: Boolean(env.TRUSTPILOT_ACCESS_TOKEN)
    }
  });
}

async function fensterConversations(env) {
  const conversations = await fensterRows(env, "fenster_conversations", "updated_at DESC");
  const messages = await fensterRows(env, "fenster_messages", "created_at ASC");
  return conversations.map((conversation) => ({
    ...conversation,
    messages: messages.filter((message) => message.conversation_id === conversation.id)
  }));
}

async function fensterRows(env, table, order = "id DESC") {
  const rows = await env.DB.prepare(`SELECT * FROM ${table} ORDER BY ${order}`).all();
  return rows.results || [];
}

async function fensterQueue(env) {
  const rows = await env.DB.prepare("SELECT * FROM fenster_bot_queue ORDER BY created_at DESC LIMIT 30").all();
  return rows.results || [];
}

async function isBotActive(env) {
  const row = await env.DB.prepare("SELECT value FROM fenster_settings WHERE key = ?").bind("bot_active").first();
  return row?.value === "true";
}

async function setBotSetting(env, active) {
  await env.DB.prepare(
    "INSERT INTO fenster_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP"
  ).bind("bot_active", active ? "true" : "false").run();
}

async function getSetting(env, key, fallback = "") {
  const row = await env.DB.prepare("SELECT value FROM fenster_settings WHERE key = ?").bind(key).first();
  return row?.value || fallback;
}

async function setSetting(env, key, value) {
  await env.DB.prepare(
    "INSERT INTO fenster_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP"
  ).bind(key, value).run();
}

function defaultPromptContext() {
  return `Extra AI context and rules:
- Never say warranties or guarantees are transferable.
- If asked about warranty or guarantee transfer, say the office team can confirm the exact position for that product/order.`;
}

async function getPromptContext(env) {
  return getSetting(env, "ai_prompt_context", defaultPromptContext());
}

async function fensterUpdatePromptContext(env, request, user) {
  const body = await request.json().catch(() => ({}));
  const promptContext = String(body.promptContext || "").trim() || defaultPromptContext();
  await setSetting(env, "ai_prompt_context", promptContext);
  await fensterEvent(env, "bot.prompt_updated", { by: user.name });
  return fensterState(env);
}

async function fensterSetBotActive(env, active, user) {
  await setBotSetting(env, active);
  await fensterEvent(env, active ? "bot.started" : "bot.stopped", { by: user.name });
  if (active) {
    await fensterSyncMeta(env);
    await enqueuePendingBotActions(env);
    await processBotQueue(env, user.name);
  }
  return fensterState(env);
}

async function fensterSeed(env, user) {
  const existing = await env.DB.prepare("SELECT id FROM fenster_conversations LIMIT 1").first();
  if (!existing) {
    const now = new Date().toISOString();
    const fb = crypto.randomUUID();
    const ig = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO fenster_conversations (id, channel, external_user_id, display_name, status, draft, draft_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(fb, "facebook", "demo-fb-001", "Sarah on Facebook", "new", unavailableDraft(), "draft", now, now).run();
    await env.DB.prepare(
      "INSERT INTO fenster_messages (id, conversation_id, direction, text, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(crypto.randomUUID(), fb, "inbound", "Hi, can you give me a price for 3 new windows in Milton Keynes?", now).run();
    await env.DB.prepare(
      "INSERT INTO fenster_conversations (id, channel, external_user_id, display_name, status, draft, draft_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(ig, "instagram", "demo-ig-001", "Tom on Instagram", "new", unavailableDraft(), "draft", now, now).run();
    await env.DB.prepare(
      "INSERT INTO fenster_messages (id, conversation_id, direction, text, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(crypto.randomUUID(), ig, "inbound", "Do you do aluminium bifold doors? I have photos if that helps.", now).run();
  }
  await fensterEvent(env, "demo.seeded", { by: user.name });
  return fensterState(env);
}

async function fensterSyncMeta(env) {
  if (!env.META_PAGE_ACCESS_TOKEN) return json({ error: "META_PAGE_ACCESS_TOKEN is not configured" }, 400);
  const result = await graphGet(env, "me/conversations?limit=8&fields=id,updated_time,participants,messages.limit(5){id,message,created_time,from,to}");
  let importedConversations = 0;
  let importedMessages = 0;

  for (const thread of result.data || []) {
    const messages = [...(thread.messages?.data || [])].reverse();
    const customerMessage = messages.find((message) => {
      const name = message.from?.name || "";
      return name && name.toLowerCase() !== "fenster glazing";
    });
    const externalUserId = customerMessage?.from?.id || thread.id;
    const displayName = customerMessage?.from?.name || "Facebook customer";
    let conversation = await findFensterConversation(env, "facebook", externalUserId);
    if (!conversation) {
      conversation = await createFensterConversation(env, {
        channel: "facebook",
        externalUserId,
        displayName,
        metaConversationId: thread.id,
        updatedAt: thread.updated_time || new Date().toISOString()
      });
      importedConversations += 1;
    }

    for (const message of messages) {
      if (!message.message) continue;
      const duplicate = await env.DB.prepare("SELECT id FROM fenster_messages WHERE external_id = ?").bind(message.id).first();
      if (duplicate) continue;
      const fromName = message.from?.name || "";
      const direction = fromName.toLowerCase() === "fenster glazing" ? "outbound" : "inbound";
      await addFensterMessage(env, conversation.id, direction, message.message, message.id, message.created_time, message);
      importedMessages += 1;
      if (direction === "inbound") {
        const latestConversation = await fensterConversation(env, conversation.id);
        const decision = await safeGenerateDecision(env, latestConversation);
        await notifyLeadIfNeeded(env, latestConversation, decision);
        await queueBotDecisionIfActive(env, latestConversation, decision, message.id);
        await env.DB.prepare(
          "UPDATE fenster_conversations SET status = ?, draft = ?, draft_status = ?, decision_action = ?, internal_note = ?, hidden_until_message_id = '', updated_at = ? WHERE id = ?"
        ).bind(
          statusForDecision(decision),
          decision.reply,
          draftStatusForDecision(decision),
          decision.action,
          decision.internal_note,
          message.created_time || new Date().toISOString(),
          conversation.id
        ).run();
      } else {
        await reconcileOutboundMessage(env, conversation.id, message.message, message.id, message.created_time, message);
      }
    }
  }

  await processBotQueue(env, "sync");
  await fensterEvent(env, "meta.synced", { importedConversations, importedMessages });
  return json({ importedConversations, importedMessages });
}

async function fensterRegenerateDrafts(env) {
  const conversations = await fensterConversations(env);
  let regenerated = 0;
  for (const conversation of conversations) {
    if (conversation.channel !== "facebook") continue;
    if (conversation.messages.at(-1)?.direction !== "inbound") continue;
    if (conversation.draft_status === "sent") continue;
    if (!isGeneratedPlaceholder(conversation.draft) && conversation.decision_action === "REPLY") continue;
    const decision = await safeGenerateDecision(env, conversation);
    await notifyLeadIfNeeded(env, conversation, decision);
    await queueBotDecisionIfActive(env, conversation, decision);
    await env.DB.prepare(
      "UPDATE fenster_conversations SET status = ?, draft = ?, draft_status = ?, decision_action = ?, internal_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(statusForDecision(decision), decision.reply, draftStatusForDecision(decision), decision.action, decision.internal_note, conversation.id).run();
    regenerated += 1;
  }
  await fensterEvent(env, "drafts.regenerated", { regenerated });
  return json({ regenerated });
}

async function fensterConversationAction(env, request, id, action, user) {
  const conversation = await fensterConversation(env, id);
  if (!conversation) return json({ error: "Conversation not found" }, 404);
  const body = await request.json().catch(() => ({}));

  if (action === "draft") {
    const existingHandoff = conversation.decision_action === "FLAG_HUMAN";
    await env.DB.prepare(
      "UPDATE fenster_conversations SET draft = ?, draft_status = ?, decision_action = ?, internal_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(
      String(body.draft || ""),
      existingHandoff ? "flag-human" : "draft",
      existingHandoff ? "FLAG_HUMAN" : "REPLY",
      existingHandoff ? "Manual reply saved; conversation remains assigned to a human." : "Manual reply edit saved for approval.",
      id
    ).run();
    await fensterEvent(env, "draft.updated", { conversationId: id, by: user.name });
    return json(await fensterConversation(env, id));
  }

  if (action === "generate-draft") {
    const decision = await safeGenerateDecision(env, conversation);
    await notifyLeadIfNeeded(env, conversation, decision);
    await queueBotDecisionIfActive(env, conversation, decision);
    await env.DB.prepare(
      "UPDATE fenster_conversations SET status = ?, draft = ?, draft_status = ?, decision_action = ?, internal_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(statusForDecision(decision), decision.reply, draftStatusForDecision(decision), decision.action, decision.internal_note, id).run();
    await fensterEvent(env, "decision.generated", { conversationId: id, by: user.name, action: decision.action, internal_note: decision.internal_note });
    return json(await fensterConversation(env, id));
  }

  if (action === "hide") {
    const latestInbound = latestInboundMessage(conversation);
    if (!latestInbound) return json({ error: "No customer message to hide" }, 400);
    await env.DB.prepare(
      "UPDATE fenster_conversations SET status = ?, hidden_until_message_id = ?, hidden_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind("hidden", latestInbound.id, id).run();
    await fensterEvent(env, "conversation.hidden", { conversationId: id, by: user.name });
    return json(await fensterConversation(env, id));
  }

  if (action === "send") {
    if (body.confirm !== `SEND:${id}`) return json({ error: "Send confirmation missing; message was not sent." }, 400);
    const text = String(body.text || conversation.draft || "").trim();
    const manual = body.manual === true;
    if (conversation.decision_action !== "REPLY" && !manual) {
      return json({ error: "This conversation needs a manual reply confirmation before sending." }, 400);
    }
    if (!text) return json({ error: "No reply text provided" }, 400);
    if (text.includes("[Draft unavailable:")) return json({ error: "Draft is unavailable; generate or write a valid reply first." }, 400);
    const result = await sendMetaMessage(env, conversation, text);
    await addFensterMessage(env, id, "outbound", text, result.message_id || "", new Date().toISOString(), result);
    const note = manual ? "Manual reply written and sent." : "Reply approved and sent.";
    await env.DB.prepare(
      "UPDATE fenster_conversations SET draft = '', draft_status = ?, status = ?, internal_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind("sent", "replied", note, id).run();
    await fensterEvent(env, "message.sent", { conversationId: id, by: user.name, manual });
    return json({ ok: true, result, conversation: await fensterConversation(env, id) });
  }

  if (action === "email-office") {
    const decision = {
      action: conversation.decision_action || "FLAG_HUMAN",
      reply: conversation.draft || "",
      internal_note: String(body.note || conversation.internal_note || "Manual office email requested from the dashboard.")
    };
    const result = await sendLeadEmail(env, conversation, decision, {
      force: true,
      eventPrefix: "lead.email_manual",
      by: user.name,
      subjectPrefix: "Manual office forward"
    });
    await env.DB.prepare(
      "UPDATE fenster_conversations SET status = ?, internal_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind("human-review", "Conversation emailed to info@fensterglazing.com for office follow-up.", id).run();
    return json({ ok: true, result, conversation: await fensterConversation(env, id) });
  }

  if (action === "reject") {
    await env.DB.prepare(
      "UPDATE fenster_conversations SET draft_status = ?, status = ?, internal_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind("rejected", "human-review", String(body.note || "Bot decision rejected by user."), id).run();
    await fensterEvent(env, "decision.rejected", { conversationId: id, by: user.name, note: body.note || "" });
    return json(await fensterConversation(env, id));
  }

  return json({ error: "Not found" }, 404);
}

async function fensterConversation(env, id) {
  const conversation = await env.DB.prepare("SELECT * FROM fenster_conversations WHERE id = ?").bind(id).first();
  if (!conversation) return null;
  const rows = await env.DB.prepare("SELECT * FROM fenster_messages WHERE conversation_id = ? ORDER BY created_at ASC").bind(id).all();
  return { ...conversation, messages: rows.results || [] };
}

async function findFensterConversation(env, channel, externalUserId) {
  return env.DB.prepare(
    "SELECT * FROM fenster_conversations WHERE channel = ? AND external_user_id = ?"
  ).bind(channel, externalUserId).first();
}

async function createFensterConversation(env, input) {
  const id = crypto.randomUUID();
  const now = input.updatedAt || new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO fenster_conversations (id, channel, external_user_id, display_name, status, draft, draft_status, meta_conversation_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, input.channel, input.externalUserId, input.displayName, "new", "", "none", input.metaConversationId || "", now, now).run();
  return fensterConversation(env, id);
}

async function addFensterMessage(env, conversationId, direction, text, externalId = "", createdAt = "", raw = {}) {
  if (externalId) {
    const duplicate = await env.DB.prepare("SELECT id FROM fenster_messages WHERE external_id = ?").bind(externalId).first();
    if (duplicate) return;
  }
  await env.DB.prepare(
    "INSERT INTO fenster_messages (id, conversation_id, external_id, direction, text, raw_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    crypto.randomUUID(),
    conversationId,
    externalId || "",
    direction,
    text,
    JSON.stringify(raw || {}),
    createdAt || new Date().toISOString()
  ).run();
}

async function reconcileOutboundMessage(env, conversationId, text, externalId = "", createdAt = "", raw = {}) {
  if (!text) return;
  if (externalId) {
    const duplicate = await env.DB.prepare("SELECT id FROM fenster_messages WHERE external_id = ?").bind(externalId).first();
    if (duplicate) return;
  }
  const recent = await env.DB.prepare(
    "SELECT id FROM fenster_messages WHERE conversation_id = ? AND direction = 'outbound' AND text = ? AND external_id = '' ORDER BY created_at DESC LIMIT 1"
  ).bind(conversationId, text).first();
  if (recent) {
    await env.DB.prepare("UPDATE fenster_messages SET external_id = ?, raw_json = ? WHERE id = ?")
      .bind(externalId || "", JSON.stringify(raw || {}), recent.id).run();
    return;
  }
  await addFensterMessage(env, conversationId, "outbound", text, externalId, createdAt, raw);
}

async function fensterEvent(env, type, detail = {}) {
  await env.DB.prepare("INSERT INTO fenster_events (id, type, detail_json) VALUES (?, ?, ?)")
    .bind(crypto.randomUUID(), type, JSON.stringify(detail)).run();
}

function latestInboundMessage(conversation) {
  return [...(conversation.messages || [])].reverse().find((message) => message.direction === "inbound");
}

function compactHistory(conversation) {
  return (conversation.messages || []).map((message) => ({
    role: message.direction === "outbound" ? "assistant" : "user",
    content: message.text
  }));
}

function unavailableDraft(reason = "OpenAI key missing") {
  return `[Draft unavailable: ${reason}. Add OPENAI_API_KEY in Cloudflare, then generate again.]`;
}

function isGeneratedPlaceholder(text = "") {
  return !text ||
    text.startsWith("[Draft unavailable:") ||
    text.startsWith("Thanks for your message. We can help with") ||
    text.startsWith("Thanks for getting in touch. Could you send");
}

async function safeGenerateDecision(env, conversation) {
  try {
    return await generateDecision(env, conversation);
  } catch (error) {
    return flagHuman(`Decision failed: ${error.message}`);
  }
}

async function generateDecision(env, conversation) {
  const existingHandoff = humanHandoffDecision(conversation);
  if (existingHandoff) return existingHandoff;
  const prefilter = localDecision(conversation);
  if (prefilter) return prefilter;
  if (!env.OPENAI_API_KEY) return flagHuman("OpenAI key missing. Human review needed.");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-5.1",
      instructions: await fensterInstructions(env),
      input: [
        ...compactHistory(conversation),
        {
          role: "user",
          content: "Return the JSON decision object for the latest inbound customer message. Return valid JSON only."
        }
      ],
      text: { verbosity: "low" }
    })
  });
  if (!response.ok) throw new Error(`OpenAI error ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return normaliseDecision(extractOpenAiText(data));
}

function extractOpenAiText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") chunks.push(content.text);
      if (typeof content.value === "string") chunks.push(content.value);
    }
  }
  return chunks.join("\n").trim();
}

async function fensterInstructions(env) {
  const extraContext = await getPromptContext(env);
  return `You are the customer enquiry assistant for Fenster Glazing.

Your job is to decide whether an incoming Facebook or Instagram message should receive an automatic reply, be ignored, or be flagged for a human.

Return valid JSON only with exactly these keys: action, reply, internal_note.

Allowed actions:
REPLY: normal customer enquiry, quote request, product question, appointment request, showroom question, pricing question, or general sales conversation.
NO_REPLY: thanks, thank you, okay, cheers, sounds good, thumbs-up style messages, short acknowledgements ending the conversation, duplicate messages, or automated spam with no useful enquiry.
FLAG_HUMAN: complaint, angry customer, warranty issue, existing job issue, supplier/trade message, message asking for a specific person/director/boss/manager/Nick/Perry/Adam/Jayk/named staff member, legal/planning/payment/invoice/refund/cancellation/contract issue, callback request, phone number supplied, appointment/survey time supplied, anything unclear or risky, internal/boss/team messages, sensitive personal situations, or anything outside Fenster Glazing's normal products and services.

For REPLY, set reply to the customer-facing reply and internal_note to an empty string unless there is something useful for the team.
For NO_REPLY, set reply to an empty string and internal_note to the reason.
For FLAG_HUMAN, set reply to an empty string and internal_note to what the team should check. If the customer gives a phone number, asks for a call, asks for a callback, gives a preferred time, or provides enough quote details for the office to follow up, always use FLAG_HUMAN so the office team can handle it directly.

Fenster Glazing supplies and installs high-quality windows and doors for residential and commercial customers. The company is based at 97-98 Alston Drive, Bradwell Abbey, Milton Keynes, Buckinghamshire, MK13 9HF. Phone: 01908 429200. Email: info@fensterglazing.com.

Fenster Glazing works mainly across Milton Keynes, Northampton, Bedfordshire, Buckinghamshire, Ampthill, Toddington, Leighton Buzzard and surrounding areas. Commercial projects may be handled more widely across the UK.

Help customers quickly and politely, then guide them towards either the Instant Pricing Tool, a consultation, or giving enough details for the team to follow up.

Core products: casement windows, flush casement windows, sliding sash windows, French casement windows, tilt and turn windows, bow and bay windows, aluminium windows, heritage windows, composite doors, uPVC doors, aluminium doors, aluminium bifold doors, slide and fold doors, patio doors, French doors, heritage aluminium doors, roofline, integral blinds, replacement glazing, secondary glazing, roof lanterns, pet flaps, repairs, commercial glazing, curtain walling, louvre vents, and automation.

Main selling points: over 1000 installations, in-house installers, 10-year guarantee, 200+ five-star reviews, FENSA approved, clear technical advice, fixed-fee quotations, secure and energy-efficient products, and strong aftercare.

Use British English. Sound friendly, helpful, human, and concise. Do not invent prices, lead times, survey dates, guarantees, discounts, or technical specs. If unsure, say the team can confirm.

For new enquiries, collect name, phone, email, postcode or town, product wanted, residential or commercial, rough measurements, supply and install requirement, photos, and whether they want Instant Pricing or a team callback.

If asked for a quote, price, cost, estimate, or how to get pricing, keep the reply short. Give the direct Instant Pricing link first: https://fensterglazing.com/instant-pricing/. Then say they can call 01908 429200 or email info@fensterglazing.com. Then say that if they want to schedule a callback, they can leave their name, phone number, and any extra details. Do not ask for a long list of details in quote replies.

Never offer legal planning advice as fact. Never promise an exact fitting date. Never diagnose repair issues from a message alone. Never mention being an AI unless asked. Never handle complaints, warranty issues, invoices, refunds, cancellations, existing job problems, or messages for named staff automatically. Never say warranties or guarantees are transferable.

Editable extra context:
${extraContext}

Return valid JSON only.`;
}

function normaliseDecision(raw) {
  try {
    const parsed = JSON.parse(raw);
    const action = String(parsed.action || "").trim().toUpperCase();
    if (!["REPLY", "NO_REPLY", "FLAG_HUMAN"].includes(action)) return flagHuman("Invalid OpenAI decision action.");
    const reply = String(parsed.reply || "").trim();
    const internalNote = String(parsed.internal_note || "").trim();
    if (action === "REPLY" && !reply) return flagHuman("OpenAI chose REPLY but returned an empty reply.");
    if (action !== "REPLY") return { action, reply: "", internal_note: internalNote || reasonForAction(action) };
    return { action, reply, internal_note: internalNote };
  } catch {
    return flagHuman("OpenAI decision JSON could not be parsed.");
  }
}

function flagHuman(reason) {
  return { action: "FLAG_HUMAN", reply: "", internal_note: reason };
}

const WEBSITE_EVENT_TYPES = new Set([
  "visitor_seen",
  "page_view",
  "page_engaged",
  "link_click",
  "cta_click",
  "scroll_depth",
  "quote_opened",
  "quote_iframe_loaded",
  "form_started",
  "form_validation_error",
  "form_submitted",
  "phone_click",
  "email_click",
  "chat_opened",
  "chat_acknowledged",
  "chat_message_sent",
  "chat_reply_received",
  "quote_completed"
]);

// This endpoint is deliberately aggregate-only. It accepts no visitor or
// journey identifier and stores only hourly buckets for statistical purposes.
const WEBSITE_STAT_TYPES = new Set([
  "page_view",
  "page_engaged",
  "quote_opened",
  "quote_iframe_loaded",
  "form_started",
  "form_submitted",
  "phone_click",
  "email_click",
  // Server-relayed total for WindowCAD completions that arrive without a
  // consented FG2 reference. Aggregate count only; no journey is created.
  "quote_completed"
]);

function websiteCors(request) {
  const origin = request.headers.get("Origin") || "";
  return new Response(null, { status: 204, headers: websiteCorsHeaders(origin) });
}

function websiteCorsHeaders(origin) {
  return isFensterWebsiteOrigin(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Vary": "Origin"
      }
    : {};
}

function isFensterWebsiteOrigin(origin) {
  try {
    return ["fensterglazing.com", "www.fensterglazing.com", "test.fensterglazing.com"].includes(new URL(origin).hostname);
  } catch {
    return false;
  }
}

function websiteEnvironment(origin) {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    if (host === "test.fensterglazing.com") return "test";
    if (["fensterglazing.com", "www.fensterglazing.com"].includes(host)) return "production";
  } catch {}
  return "";
}

function signedWebsiteRequest(request, env) {
  return Boolean(env.WEBSITE_INGEST_SECRET)
    && request.headers.get("X-Fenster-Website-Secret") === env.WEBSITE_INGEST_SECRET;
}

function websiteRequestEnvironment(request, body, signed) {
  const browserEnvironment = websiteEnvironment(request.headers.get("Origin") || "");
  if (browserEnvironment) return browserEnvironment;
  return signed ? websiteEnvironment(websiteText(body.origin, 300)) : "";
}

function websiteText(value, limit = 180) {
  return String(value || "").trim().slice(0, limit);
}

function websiteJourneyId(value, fallback = "") {
  const id = websiteText(value, 96).toUpperCase();
  return /^FG2-[A-Z0-9-]{8,80}$/.test(id) ? id : fallback;
}

function websiteVisitorId(value) {
  const id = websiteText(value, 96).toUpperCase();
  return /^FGV-[A-Z0-9-]{8,80}$/.test(id) ? id : "";
}

function websiteNumber(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 && amount < 1000000 ? amount : 0;
}

function websiteDuration(value) {
  const seconds = Math.round(Number(value));
  return Number.isFinite(seconds) && seconds > 0 && seconds <= 1800 ? seconds : 0;
}

async function websiteEvent({ request, env }) {
  const origin = request.headers.get("Origin") || "";
  const body = await request.json().catch(() => ({}));
  const signed = signedWebsiteRequest(request, env);
  const environment = websiteRequestEnvironment(request, body, signed);
  if (!environment) {
    return json({ error: "Untrusted website event" }, 403);
  }

  const event = websiteText(body.event, 64);
  if (!WEBSITE_EVENT_TYPES.has(event)) return json({ error: "Unsupported website event" }, 400, websiteCorsHeaders(origin));
  if (["form_submitted", "quote_completed"].includes(event) && !signed) {
    return json({ error: "Completed lead events require a signed server relay" }, 403, websiteCorsHeaders(origin));
  }

  const journeyId = websiteJourneyId(body.journey_id, event === "quote_completed" ? `UNATTRIBUTED-${crypto.randomUUID()}` : "");
  if (!journeyId) return json({ error: "A valid journey reference is required" }, 400, websiteCorsHeaders(origin));
  const existingJourney = await env.DB.prepare("SELECT visitor_id, environment FROM website_journeys WHERE journey_id = ?").bind(journeyId).first();
  if (existingJourney?.environment && !["legacy", environment].includes(existingJourney.environment)) {
    return json({ error: "Journey belongs to another environment" }, 409, websiteCorsHeaders(origin));
  }

  const requestedEventId = websiteText(body.event_id, 120);
  const eventId = /^[A-Za-z0-9-]{8,120}$/.test(requestedEventId) ? requestedEventId : crypto.randomUUID();
  const duplicate = await env.DB.prepare("SELECT 1 FROM website_events WHERE id = ?").bind(eventId).first();
  if (duplicate) return json({ ok: true, journey_id: journeyId, duplicate: true }, 200, websiteCorsHeaders(origin));

  let visitorId = websiteVisitorId(body.visitor_id);
  if (!visitorId) {
    visitorId = websiteVisitorId(existingJourney?.visitor_id);
  }

  const data = {
    journeyId,
    visitorId,
    event,
    occurredAt: (() => {
      const requested = signed ? Date.parse(websiteText(body.occurred_at, 40)) : NaN;
      const now = Date.now();
      return Number.isFinite(requested) && requested <= now + 300000 && requested >= now - (2 * 365 * 86400000)
        ? new Date(requested).toISOString()
        : new Date(now).toISOString();
    })(),
    pagePath: websiteText(body.page_path, 500),
    landingPath: websiteText(body.landing_path, 500),
    source: websiteText(body.source, 120),
    medium: websiteText(body.medium, 120),
    campaign: websiteText(body.campaign, 180),
    content: websiteText(body.content, 180),
    term: websiteText(body.term, 180),
    referrerHost: websiteText(body.referrer_host, 180),
    cta: websiteText(body.cta, 180),
    linkTarget: websiteText(body.link_target, 500),
    pageDurationSeconds: websiteDuration(body.page_duration_seconds),
    productCollection: websiteText(body.product_collection, 120),
    priceAmount: websiteNumber(body.price_amount),
    priceCurrency: websiteText(body.price_currency, 8) || "GBP",
    eventValue: Math.round(websiteNumber(body.event_value))
  };

  if (data.visitorId) {
    await env.DB.prepare(`
      INSERT INTO website_visitors (visitor_id, first_seen_at, last_seen_at, first_landing_path, first_source, first_medium, first_campaign, first_content, first_term, first_referrer_host, environment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(visitor_id) DO UPDATE SET
        last_seen_at = excluded.last_seen_at,
        environment = CASE WHEN website_visitors.environment = 'legacy' THEN excluded.environment ELSE website_visitors.environment END
    `).bind(
      data.visitorId, data.occurredAt, data.occurredAt, data.landingPath, data.source, data.medium,
      data.campaign, data.content, data.term, data.referrerHost, environment
    ).run();
  }

  await env.DB.prepare(`
    INSERT INTO website_journeys (journey_id, visitor_id, first_event_at, last_event_at, landing_path, source, medium, campaign, content, term, referrer_host, environment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(journey_id) DO UPDATE SET
      last_event_at = excluded.last_event_at,
      visitor_id = CASE WHEN website_journeys.visitor_id = '' THEN excluded.visitor_id ELSE website_journeys.visitor_id END,
      landing_path = CASE WHEN website_journeys.landing_path = '' THEN excluded.landing_path ELSE website_journeys.landing_path END,
      source = CASE WHEN website_journeys.source = '' THEN excluded.source ELSE website_journeys.source END,
      medium = CASE WHEN website_journeys.medium = '' THEN excluded.medium ELSE website_journeys.medium END,
      campaign = CASE WHEN website_journeys.campaign = '' THEN excluded.campaign ELSE website_journeys.campaign END,
      content = CASE WHEN website_journeys.content = '' THEN excluded.content ELSE website_journeys.content END,
      term = CASE WHEN website_journeys.term = '' THEN excluded.term ELSE website_journeys.term END,
      referrer_host = CASE WHEN website_journeys.referrer_host = '' THEN excluded.referrer_host ELSE website_journeys.referrer_host END,
      environment = CASE WHEN website_journeys.environment = 'legacy' THEN excluded.environment ELSE website_journeys.environment END
  `).bind(
    data.journeyId, data.visitorId, data.occurredAt, data.occurredAt, data.landingPath, data.source, data.medium,
    data.campaign, data.content, data.term, data.referrerHost, environment
  ).run();

  await env.DB.prepare(`
    INSERT INTO website_events (id, journey_id, event_type, occurred_at, page_path, cta, link_target, page_duration_seconds, product_collection, price_amount, price_currency, event_value, environment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    eventId, data.journeyId, data.event, data.occurredAt, data.pagePath, data.cta,
    data.linkTarget, data.pageDurationSeconds, data.productCollection, data.priceAmount, data.priceCurrency, data.eventValue,
    environment
  ).run();

  return json({ ok: true, journey_id: data.journeyId }, 201, websiteCorsHeaders(origin));
}

async function websiteConsent({ request, env }) {
  const origin = request.headers.get("Origin") || "";
  const environment = websiteEnvironment(origin);
  if (!environment) return json({ error: "Untrusted consent event" }, 403);
  const body = await request.json().catch(() => ({}));
  const choice = websiteText(body.choice, 24);
  const column = {
    shown: "banner_shown",
    necessary_only: "necessary_only",
    analytics_only: "analytics_only",
    marketing_only: "marketing_only",
    all: "all_optional"
  }[choice];
  if (!column) return json({ error: "Unsupported consent choice" }, 400, websiteCorsHeaders(origin));

  const day = new Date().toISOString().slice(0, 10);
  await env.DB.prepare(`
    INSERT INTO website_consent_daily_v2 (environment, day, ${column}) VALUES (?, ?, 1)
    ON CONFLICT(environment, day) DO UPDATE SET ${column} = ${column} + 1
  `).bind(environment, day).run();

  return json({ ok: true }, 201, websiteCorsHeaders(origin));
}

function websiteStatPath(value) {
  const path = websiteText(value, 240).split(/[?#]/, 1)[0];
  return path.startsWith("/") ? path : "/";
}

function websiteStatDevice(value, userAgent = "") {
  const requested = websiteText(value, 16).toLowerCase();
  if (requested === "server") return "server";
  if (/bot|crawler|spider|headless|preview|lighthouse|pagespeed/i.test(userAgent)) return "bot";
  if (["mobile", "tablet", "desktop"].includes(requested)) return requested;
  return /tablet|ipad/i.test(userAgent) ? "tablet" : /mobi|android/i.test(userAgent) ? "mobile" : "desktop";
}

async function websiteStat({ request, env }) {
  const origin = request.headers.get("Origin") || "";
  const bodyText = await request.text();
  let body = {};
  try { body = JSON.parse(bodyText || "{}"); } catch {}

  const signed = signedWebsiteRequest(request, env);
  const environment = websiteRequestEnvironment(request, body, signed);
  if (!environment) {
    return json({ error: "Untrusted website statistic" }, 403, websiteCorsHeaders(origin));
  }

  const event = websiteText(body.event, 40);
  if (!WEBSITE_STAT_TYPES.has(event)) {
    return json({ error: "Unsupported website statistic" }, 400, websiteCorsHeaders(origin));
  }
  if (["form_submitted", "quote_completed"].includes(event) && !signed) {
    return json({ error: "Completed lead statistics require a signed server relay" }, 403, websiteCorsHeaders(origin));
  }

  const requestedAt = signed ? Date.parse(websiteText(body.occurred_at, 40)) : NaN;
  const currentTime = Date.now();
  const now = new Date(
    Number.isFinite(requestedAt) && requestedAt <= currentTime + 300000 && requestedAt >= currentTime - (2 * 365 * 86400000)
      ? requestedAt
      : currentTime
  );
  const day = now.toISOString().slice(0, 10);
  const hourUtc = now.getUTCHours();
  const pagePath = websiteStatPath(body.page_path);
  const referrerHost = websiteText(body.referrer_host, 180).toLowerCase().replace(/[^a-z0-9.-]/g, "");
  const deviceType = websiteStatDevice(body.device_type, request.headers.get("User-Agent") || "");
  const eventId = signed ? websiteText(body.event_id, 120) : "";
  if (eventId && /^[A-Za-z0-9-]{8,120}$/.test(eventId)) {
    const receipt = await env.DB.prepare(`
      INSERT OR IGNORE INTO website_stat_receipts (event_id, environment, received_at)
      VALUES (?, ?, ?)
    `).bind(eventId, environment, new Date().toISOString()).run();
    if (!Number(receipt.meta?.changes || 0)) {
      return json({ ok: true, duplicate: true }, 200, websiteCorsHeaders(origin));
    }
  }

  await env.DB.prepare(`
    INSERT INTO website_statistical_aggregate_v2
      (environment, day, hour_utc, event_type, page_path, referrer_host, device_type, count)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(environment, day, hour_utc, event_type, page_path, referrer_host, device_type)
    DO UPDATE SET count = website_statistical_aggregate_v2.count + 1
  `).bind(environment, day, hourUtc, event, pagePath, referrerHost, deviceType).run();

  return json({ ok: true }, 201, websiteCorsHeaders(origin));
}

function websiteChatId(value) {
  const id = websiteText(value, 96).toUpperCase();
  return /^CHT-[A-Z0-9-]{8,80}$/.test(id) ? id : "";
}

async function websiteChat({ request, env }) {
  const origin = request.headers.get("Origin") || "";
  const environment = websiteEnvironment(origin);
  if (!environment) return json({ error: "Untrusted chat transcript" }, 403);
  const body = await request.json().catch(() => ({}));
  const conversationId = websiteChatId(body.conversation_id);
  const journeyId = websiteJourneyId(body.journey_id);
  const visitorId = websiteVisitorId(body.visitor_id);
  const role = websiteText(body.role, 16);
  const messageId = websiteText(body.message_id, 96);
  const text = websiteText(body.body, 900);
  if (!conversationId || !messageId || !["user", "assistant"].includes(role) || !text) {
    return json({ error: "A valid chat message is required" }, 400, websiteCorsHeaders(origin));
  }
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (30 * 86400000)).toISOString();
  await env.DB.prepare("DELETE FROM website_chat_messages WHERE expires_at <= ?").bind(now.toISOString()).run();
  await env.DB.prepare(`
    INSERT OR IGNORE INTO website_chat_messages (id, conversation_id, journey_id, visitor_id, page_path, role, body, created_at, expires_at, environment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(messageId, conversationId, journeyId, visitorId, websiteText(body.page_path, 500), role, text, now.toISOString(), expiresAt, environment).run();
  return json({ ok: true, conversation_id: conversationId }, 201, websiteCorsHeaders(origin));
}

async function websiteOutcomeIngest({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const signed = signedWebsiteRequest(request, env);
  const environment = websiteRequestEnvironment(request, body, signed);
  if (!signed || !environment) return json({ error: "Untrusted website outcome" }, 403);

  const journeyId = websiteJourneyId(body.journey_id);
  const status = websiteText(body.status, 24).toLowerCase();
  if (!journeyId || !["new", "contacted", "qualified", "appointment", "won", "lost"].includes(status)) {
    return json({ error: "A valid journey and sales outcome are required" }, 400);
  }

  const exists = await env.DB.prepare(`
    SELECT 1 FROM website_events
    WHERE journey_id = ? AND environment = ? AND event_type IN ('quote_completed', 'form_submitted')
    LIMIT 1
  `).bind(journeyId, environment).first();
  if (!exists) return json({ error: "That journey has no completed website lead" }, 404);

  const value = websiteNumber(body.value);
  const currency = websiteText(body.currency, 8).toUpperCase() || "GBP";
  const occurredAt = websiteText(body.occurred_at, 40) || new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO website_lead_outcomes (journey_id, status, updated_at, value, currency, occurred_at, environment)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(journey_id) DO UPDATE SET
      status = excluded.status,
      updated_at = excluded.updated_at,
      value = excluded.value,
      currency = excluded.currency,
      occurred_at = excluded.occurred_at,
      environment = excluded.environment
  `).bind(journeyId, status, new Date().toISOString(), value, currency, occurredAt, environment).run();

  return json({ ok: true, journey_id: journeyId, status }, 201);
}

async function fensterWebsiteOutcome(env, request) {
  const body = await request.json().catch(() => ({}));
  const journeyId = websiteJourneyId(body.journey_id);
  const status = websiteText(body.status, 24).toLowerCase();
  if (!journeyId || !["new", "contacted", "qualified", "appointment", "won", "lost"].includes(status)) {
    return json({ error: "A valid journey and sales outcome are required" }, 400);
  }
  const exists = await env.DB.prepare("SELECT 1 FROM website_events WHERE journey_id = ? AND environment IN ('production','legacy') AND event_type IN ('quote_completed', 'form_submitted') LIMIT 1").bind(journeyId).first();
  if (!exists) return json({ error: "That journey has no completed website lead" }, 404);
  await env.DB.prepare(`
    INSERT INTO website_lead_outcomes (journey_id, status, updated_at, environment) VALUES (?, ?, ?, 'production')
    ON CONFLICT(journey_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at, environment = 'production'
  `).bind(journeyId, status, new Date().toISOString()).run();
  return json({ ok: true, journey_id: journeyId, status });
}

async function fensterWebsiteVisitor(env, value) {
  const visitorId = websiteVisitorId(value);
  if (!visitorId) return json({ error: "Invalid visitor" }, 400);

  const [visitor, journeys, events, chats] = await Promise.all([
    env.DB.prepare("SELECT * FROM website_visitors WHERE visitor_id = ? AND environment IN ('production','legacy')").bind(visitorId).first(),
    env.DB.prepare("SELECT journey_id, first_event_at, last_event_at, landing_path, source, medium, campaign FROM website_journeys WHERE visitor_id = ? AND environment IN ('production','legacy') ORDER BY first_event_at ASC").bind(visitorId).all(),
    env.DB.prepare(`
      SELECT e.event_type, e.occurred_at, e.page_path, e.cta, e.link_target, e.page_duration_seconds, e.product_collection, e.price_amount, e.price_currency, e.event_value, e.journey_id
      FROM website_events e
      INNER JOIN website_journeys j ON j.journey_id = e.journey_id
      WHERE j.visitor_id = ? AND e.environment IN ('production','legacy') AND j.environment IN ('production','legacy')
      ORDER BY e.occurred_at ASC
      LIMIT 500
    `).bind(visitorId).all()
    ,env.DB.prepare(`SELECT conversation_id, journey_id, page_path, MIN(created_at) AS started_at, MAX(created_at) AS last_message_at, COUNT(*) AS messages FROM website_chat_messages WHERE visitor_id = ? AND expires_at > ? AND environment IN ('production','legacy') GROUP BY conversation_id, journey_id, page_path ORDER BY last_message_at DESC`).bind(visitorId, new Date().toISOString()).all()
  ]);

  if (!visitor) return json({ error: "Visitor not found" }, 404);
  return json({ visitor, journeys: journeys.results || [], events: events.results || [], chats: chats.results || [] });
}

async function fensterWebsiteChat(env, value) {
  const conversationId = websiteChatId(value);
  if (!conversationId) return json({ error: "Invalid chat" }, 400);
  const rows = await env.DB.prepare(`SELECT conversation_id, journey_id, visitor_id, page_path, role, body, created_at FROM website_chat_messages WHERE conversation_id = ? AND expires_at > ? AND environment IN ('production','legacy') ORDER BY created_at ASC`).bind(conversationId, new Date().toISOString()).all();
  if (!(rows.results || []).length) return json({ error: "Chat not found or expired" }, 404);
  return json({ conversation_id: conversationId, messages: rows.results });
}

/*
 * Reporting reads deliberately span two generations of storage.
 *
 * Migration 0017 added `environment` to the tracking tables with
 * DEFAULT 'legacy', and created _v2 copies of the two aggregate tables. Every
 * row written before it ran was therefore stamped 'legacy', while every read
 * here filtered on 'production' -- so on 31 July 2026 the dashboard silently
 * lost its entire history: 8,223 of 9,322 events, 211 of 275 visitors and 221
 * of 317 journeys became invisible in a single deploy, and the pre-31-July
 * aggregate counts vanished with the v1 tables they still live in.
 *
 * Nothing was deleted, so nothing needed restoring: the reads simply widened.
 * Filters accept ('production','legacy') and the aggregate/consent queries
 * UNION their v1 predecessors. Data is left exactly as written -- this is
 * reversible by narrowing the reads again.
 *
 * 'legacy' predates the environment split, so it mixes live and test traffic.
 * It is reported as production because test.fensterglazing.com is Basic Auth
 * protected and contributed negligible volume in that window. Traffic recorded
 * since the split is properly separated and 'test' stays excluded.
 *
 * The v1 consent table only recorded accepted/rejected, so for those older days
 * the decision COUNT is exact -- which is what the coverage figure depends on --
 * but the four-way necessary/analytics/marketing/all split is approximate.
 */
async function fensterWebsiteState(env) {
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const [events, journeys, uniqueVisitors, recent, visitors, chats, chatCount, outcomes, consent, acquisition, statistical] = await Promise.all([
    env.DB.prepare("SELECT event_type, COUNT(*) AS count FROM website_events WHERE occurred_at >= ? AND environment IN ('production','legacy') GROUP BY event_type").bind(since).all(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM website_journeys WHERE first_event_at >= ? AND environment IN ('production','legacy')").bind(since).first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM website_visitors WHERE last_seen_at >= ? AND environment IN ('production','legacy')").bind(since).first(),
    env.DB.prepare(`
      SELECT e.event_type, e.occurred_at, e.page_path, e.cta, e.product_collection, e.price_amount, e.price_currency,
        j.journey_id, j.landing_path, j.source, j.medium, j.campaign, COALESCE(o.status, 'new') AS outcome_status
      FROM website_events e
      LEFT JOIN website_journeys j ON j.journey_id = e.journey_id
      LEFT JOIN website_lead_outcomes o ON o.journey_id = e.journey_id AND o.environment IN ('production','legacy')
      WHERE e.event_type IN ('form_submitted', 'quote_completed') AND e.environment IN ('production','legacy')
      ORDER BY e.occurred_at DESC LIMIT 16
    `).all(),
    env.DB.prepare(`
      SELECT v.visitor_id, v.first_seen_at, v.last_seen_at, v.first_landing_path, v.first_source, v.first_medium, v.first_campaign,
        COUNT(DISTINCT j.journey_id) AS journeys,
        SUM(CASE WHEN e.event_type = 'quote_opened' THEN 1 ELSE 0 END) AS quote_starts,
        SUM(CASE WHEN e.event_type = 'quote_completed' THEN 1 ELSE 0 END) AS quotes,
        SUM(CASE WHEN e.event_type = 'form_submitted' THEN 1 ELSE 0 END) AS forms,
        SUM(CASE WHEN e.event_type IN ('phone_click', 'email_click') THEN 1 ELSE 0 END) AS contact_clicks,
        (SELECT COUNT(DISTINCT c.conversation_id) FROM website_chat_messages c WHERE c.visitor_id = v.visitor_id AND c.expires_at > ? AND c.environment IN ('production','legacy')) AS legend_chats
      FROM website_visitors v
      LEFT JOIN website_journeys j ON j.visitor_id = v.visitor_id AND j.environment IN ('production','legacy')
      LEFT JOIN website_events e ON e.journey_id = j.journey_id AND e.environment IN ('production','legacy')
      WHERE v.last_seen_at >= ? AND v.environment IN ('production','legacy')
      GROUP BY v.visitor_id
      ORDER BY v.last_seen_at DESC LIMIT 100
    `).bind(new Date().toISOString(), since).all()
    ,env.DB.prepare(`SELECT conversation_id, visitor_id, journey_id, page_path, MIN(created_at) AS started_at, MAX(created_at) AS last_message_at, COUNT(*) AS messages FROM website_chat_messages WHERE expires_at > ? AND environment IN ('production','legacy') GROUP BY conversation_id, visitor_id, journey_id, page_path ORDER BY last_message_at DESC LIMIT 50`).bind(new Date().toISOString()).all()
    ,env.DB.prepare("SELECT COUNT(DISTINCT conversation_id) AS count FROM website_chat_messages WHERE expires_at > ? AND environment IN ('production','legacy')").bind(new Date().toISOString()).first()
    ,env.DB.prepare("SELECT status, COUNT(*) AS count FROM website_lead_outcomes WHERE environment IN ('production','legacy') GROUP BY status").all()
    ,env.DB.prepare("SELECT COALESCE(SUM(banner_shown), 0) AS shown, COALESCE(SUM(necessary_only), 0) AS necessary_only, COALESCE(SUM(analytics_only), 0) AS analytics_only, COALESCE(SUM(marketing_only), 0) AS marketing_only, COALESCE(SUM(all_optional), 0) AS all_optional FROM (SELECT environment, day, banner_shown, necessary_only, analytics_only, marketing_only, all_optional FROM website_consent_daily_v2 UNION ALL SELECT 'production' AS environment, day, banner_shown, rejected AS necessary_only, 0 AS analytics_only, 0 AS marketing_only, accepted AS all_optional FROM website_consent_daily) AS con WHERE day >= ? AND environment IN ('production','legacy')").bind(since.slice(0, 10)).first()
    ,env.DB.prepare(`
      SELECT
        CASE
          WHEN j.source <> '' THEN j.source || CASE WHEN j.medium <> '' THEN ' / ' || j.medium ELSE '' END
          WHEN j.referrer_host <> '' THEN j.referrer_host
          ELSE 'Direct or unknown'
        END AS channel,
        COUNT(DISTINCT NULLIF(j.visitor_id, '')) AS visitors,
        COUNT(DISTINCT j.journey_id) AS journeys,
        COUNT(DISTINCT CASE WHEN e.event_type = 'quote_opened' THEN j.journey_id END) AS quote_starts,
        SUM(CASE WHEN e.event_type = 'quote_completed' THEN 1 ELSE 0 END) AS quotes,
        SUM(CASE WHEN e.event_type = 'form_submitted' THEN 1 ELSE 0 END) AS forms,
        SUM(CASE WHEN e.event_type IN ('phone_click', 'email_click') THEN 1 ELSE 0 END) AS contact_clicks
      FROM website_journeys j
      LEFT JOIN website_events e ON e.journey_id = j.journey_id AND e.environment IN ('production','legacy')
      WHERE j.last_event_at >= ? AND j.environment IN ('production','legacy')
      GROUP BY channel
      ORDER BY quotes DESC, forms DESC, quote_starts DESC, visitors DESC
      LIMIT 12
    `).bind(since).all()
    ,env.DB.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN event_type = 'page_view' THEN count ELSE 0 END), 0) AS page_views,
        COALESCE(SUM(CASE WHEN event_type = 'quote_opened' THEN count ELSE 0 END), 0) AS quote_starts,
        COALESCE(SUM(CASE WHEN event_type = 'form_started' THEN count ELSE 0 END), 0) AS form_starts,
        COALESCE(SUM(CASE WHEN event_type = 'form_submitted' THEN count ELSE 0 END), 0) AS forms,
        COALESCE(SUM(CASE WHEN event_type IN ('phone_click', 'email_click') THEN count ELSE 0 END), 0) AS contact_clicks,
        COALESCE(SUM(CASE WHEN event_type = 'quote_completed' THEN count ELSE 0 END), 0) AS quote_completions
      FROM (SELECT environment, day, hour_utc, event_type, page_path, referrer_host, device_type, count FROM website_statistical_aggregate_v2 UNION ALL SELECT 'production' AS environment, day, hour_utc, event_type, page_path, referrer_host, device_type, count FROM website_statistical_aggregate) AS agg
      WHERE day >= ? AND device_type <> 'bot' AND environment IN ('production','legacy')
    `).bind(since.slice(0, 10)).first()
  ]);
  const totals = Object.fromEntries((events.results || []).map((row) => [row.event_type, Number(row.count || 0)]));
  const quoteJourneys = await env.DB.prepare(`
    SELECT COUNT(DISTINCT journey_id) AS count FROM website_events
    WHERE occurred_at >= ? AND event_type = 'quote_opened' AND environment IN ('production','legacy')
  `).bind(since).first();

  const sinceDay = since.slice(0, 10);
  const [dailyEvents, dailyStat, consentDaily, topPages, statTopPages, deviceSplit, topCtas, formFields, products] = await Promise.all([
    env.DB.prepare(`
      SELECT substr(occurred_at, 1, 10) AS day,
        SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) AS page_views,
        SUM(CASE WHEN event_type = 'quote_opened' THEN 1 ELSE 0 END) AS quote_starts,
        SUM(CASE WHEN event_type IN ('quote_completed', 'form_submitted') THEN 1 ELSE 0 END) AS leads
      FROM website_events WHERE occurred_at >= ? AND environment IN ('production','legacy') GROUP BY day ORDER BY day ASC
    `).bind(since).all(),
    env.DB.prepare(`
      SELECT day,
        SUM(CASE WHEN event_type = 'page_view' THEN count ELSE 0 END) AS page_views,
        SUM(CASE WHEN event_type = 'quote_completed' THEN count ELSE 0 END) AS quote_completions
      FROM (SELECT environment, day, hour_utc, event_type, page_path, referrer_host, device_type, count FROM website_statistical_aggregate_v2 UNION ALL SELECT 'production' AS environment, day, hour_utc, event_type, page_path, referrer_host, device_type, count FROM website_statistical_aggregate) AS agg WHERE day >= ? AND device_type <> 'bot' AND environment IN ('production','legacy') GROUP BY day ORDER BY day ASC
    `).bind(sinceDay).all(),
    env.DB.prepare("SELECT day, necessary_only, analytics_only, marketing_only, all_optional FROM (SELECT environment, day, banner_shown, necessary_only, analytics_only, marketing_only, all_optional FROM website_consent_daily_v2 UNION ALL SELECT 'production' AS environment, day, banner_shown, rejected AS necessary_only, 0 AS analytics_only, 0 AS marketing_only, accepted AS all_optional FROM website_consent_daily) AS con WHERE day >= ? AND environment IN ('production','legacy') ORDER BY day ASC").bind(sinceDay).all(),
    env.DB.prepare(`
      SELECT page_path,
        SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) AS views,
        CAST(ROUND(AVG(CASE WHEN event_type = 'page_engaged' AND page_duration_seconds > 0 THEN page_duration_seconds END)) AS INTEGER) AS avg_seconds
      FROM website_events
      WHERE occurred_at >= ? AND environment IN ('production','legacy') AND event_type IN ('page_view', 'page_engaged') AND page_path <> ''
      GROUP BY page_path HAVING views > 0 ORDER BY views DESC LIMIT 12
    `).bind(since).all(),
    env.DB.prepare(`
      SELECT page_path, SUM(count) AS views FROM (SELECT environment, day, hour_utc, event_type, page_path, referrer_host, device_type, count FROM website_statistical_aggregate_v2 UNION ALL SELECT 'production' AS environment, day, hour_utc, event_type, page_path, referrer_host, device_type, count FROM website_statistical_aggregate) AS agg
      WHERE day >= ? AND environment IN ('production','legacy') AND event_type = 'page_view' AND device_type NOT IN ('bot', 'server')
      GROUP BY page_path ORDER BY views DESC LIMIT 12
    `).bind(sinceDay).all(),
    env.DB.prepare(`
      SELECT device_type, SUM(count) AS views FROM (SELECT environment, day, hour_utc, event_type, page_path, referrer_host, device_type, count FROM website_statistical_aggregate_v2 UNION ALL SELECT 'production' AS environment, day, hour_utc, event_type, page_path, referrer_host, device_type, count FROM website_statistical_aggregate) AS agg
      WHERE day >= ? AND environment IN ('production','legacy') AND event_type = 'page_view' GROUP BY device_type ORDER BY views DESC
    `).bind(sinceDay).all(),
    env.DB.prepare(`
      SELECT cta, COUNT(*) AS clicks FROM website_events
      WHERE occurred_at >= ? AND environment IN ('production','legacy') AND event_type = 'cta_click' AND cta <> ''
      GROUP BY cta ORDER BY clicks DESC LIMIT 10
    `).bind(since).all(),
    env.DB.prepare(`
      SELECT cta AS field, COUNT(*) AS warnings FROM website_events
      WHERE occurred_at >= ? AND environment IN ('production','legacy') AND event_type = 'form_validation_error' AND cta <> ''
      GROUP BY cta ORDER BY warnings DESC LIMIT 8
    `).bind(since).all(),
    env.DB.prepare(`
      SELECT product_collection,
        SUM(CASE WHEN event_type = 'quote_opened' THEN 1 ELSE 0 END) AS opens,
        SUM(CASE WHEN event_type = 'quote_completed' THEN 1 ELSE 0 END) AS completions
      FROM website_events
      WHERE occurred_at >= ? AND environment IN ('production','legacy') AND product_collection <> ''
      GROUP BY product_collection ORDER BY completions DESC, opens DESC LIMIT 10
    `).bind(since).all()
  ]);

  return json({
    periodDays: 30,
    journeys: Number(journeys?.count || 0),
    uniqueVisitors: Number(uniqueVisitors?.count || 0),
    quoteJourneys: Number(quoteJourneys?.count || 0),
    forms: totals.form_submitted || 0,
    formStarts: totals.form_started || 0,
    formErrors: totals.form_validation_error || 0,
    ctaClicks: totals.cta_click || 0,
    scrollDepths: totals.scroll_depth || 0,
    quotes: totals.quote_completed || 0,
    calls: (totals.phone_click || 0) + (totals.email_click || 0),
    legendChats: Number(chatCount?.count || 0),
    chats: chats.results || [],
    recent: recent.results || [],
    visitors: visitors.results || [],
    acquisition: acquisition.results || [],
    statistical: {
      pageViews: Number(statistical?.page_views || 0),
      quoteStarts: Number(statistical?.quote_starts || 0),
      formStarts: Number(statistical?.form_starts || 0),
      forms: Number(statistical?.forms || 0),
      contactClicks: Number(statistical?.contact_clicks || 0),
      quoteCompletions: Number(statistical?.quote_completions || 0)
    },
    consent: {
      shown: Number(consent?.shown || 0),
      necessaryOnly: Number(consent?.necessary_only || 0),
      analyticsOnly: Number(consent?.analytics_only || 0),
      marketingOnly: Number(consent?.marketing_only || 0),
      allOptional: Number(consent?.all_optional || 0)
    },
    outcomes: Object.fromEntries((outcomes.results || []).map((row) => [row.status, Number(row.count || 0)])),
    series: {
      events: dailyEvents.results || [],
      statistical: dailyStat.results || [],
      consent: consentDaily.results || []
    },
    topPages: topPages.results || [],
    statTopPages: statTopPages.results || [],
    deviceSplit: deviceSplit.results || [],
    topCtas: topCtas.results || [],
    formFields: formFields.results || [],
    products: products.results || []
  });
}

function humanHandoffDecision(conversation) {
  if (conversation?.decision_action !== "FLAG_HUMAN") return null;
  return flagHuman(conversation.internal_note || "Conversation is already assigned to a human. Do not auto-reply.");
}

function noReply(reason) {
  return { action: "NO_REPLY", reply: "", internal_note: reason };
}

function reasonForAction(action) {
  return action === "NO_REPLY" ? "Message does not need a reply." : "Needs human review.";
}

function statusForDecision(decision) {
  if (decision.action === "FLAG_HUMAN") return "human-review";
  if (decision.action === "NO_REPLY") return "no-reply";
  return "new";
}

function draftStatusForDecision(decision) {
  if (decision.action === "FLAG_HUMAN") return "flag-human";
  if (decision.action === "NO_REPLY") return "no-reply";
  return "draft";
}

function localDecision(conversation) {
  const latest = latestInboundMessage(conversation);
  const text = String(latest?.text || "").trim();
  const normal = text.toLowerCase().replace(/[.!?,\s]+$/g, "");
  if (!text) return noReply("Empty inbound message.");
  if (/^(thanks|thank you|thx|ta|cheers|okay|ok|k|sounds good|nice one|great thanks|perfect thanks|👍|👌|🙏)$/i.test(normal)) {
    return noReply("Short acknowledgement; no reply needed.");
  }
  if (text.length <= 14 && /^(yes|no|ok|okay|thanks|cheers|done|great|perfect|cool|fine|alright|👍|👌)/i.test(normal)) {
    return noReply("Short acknowledgement; no reply needed.");
  }
  if (hasCallbackDetails(text)) {
    return flagHuman("Customer supplied callback/contact details. Forward to the office team and let a human confirm.");
  }
  if (/\b(complaint|complain|angry|unhappy|disappointed|terrible|awful|poor service|not happy|warranty|guarantee|repair|broken|leaking|leak|fault|faulty|existing job|job number|invoice|payment|refund|cancel|cancellation|contract|legal|solicitor|planning permission)\b/i.test(text)) {
    return flagHuman("Complaint, warranty, existing job, payment, legal, planning, or repair issue.");
  }
  if (/\b(nick|perry|adam|jayk|manager|director|boss|owner|salesperson|installer|surveyor)\b/i.test(text)) {
    return flagHuman("Message asks for a named staff member or senior person.");
  }
  return null;
}

async function notifyLeadIfNeeded(env, conversation, decision) {
  if (decision.action !== "FLAG_HUMAN") return;
  if (conversation.lead_notified_at) return;

  try {
    await sendLeadEmail(env, conversation, decision);
  } catch {
    // The event log records the failure; automatic draft processing should continue.
  }
}

async function sendLeadEmail(env, conversation, decision, options = {}) {
  if (!env.LEAD_EMAIL_WEBHOOK_URL || !env.LEAD_EMAIL_WEBHOOK_SECRET) {
    await fensterEvent(env, "lead.email_missing", {
      conversationId: conversation.id,
      by: options.by || "",
      internal_note: "Lead detected, but lead email Worker secrets are not configured."
    });
    throw new Error("Lead email Worker secrets are not configured.");
  }

  try {
    const subject = options.subjectPrefix
      ? `${options.subjectPrefix} - ${leadEmailSubject(conversation)}`
      : leadEmailSubject(conversation);
    const body = leadEmailBody(conversation, decision, options.by);
    const html = leadEmailHtml(conversation, decision, options.by);
    const response = await fetch(env.LEAD_EMAIL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.LEAD_EMAIL_WEBHOOK_SECRET}`
      },
      body: JSON.stringify({ subject, body, html })
    });
    if (!response.ok) throw new Error(`Lead email Worker returned ${response.status}: ${await response.text()}`);
    await env.DB.prepare(
      "UPDATE fenster_conversations SET lead_notified_at = CURRENT_TIMESTAMP, internal_note = ? WHERE id = ?"
    ).bind("Lead email sent to info@fensterglazing.com.", conversation.id).run();
    await fensterEvent(env, options.eventPrefix || "lead.email_sent", {
      conversationId: conversation.id,
      subject,
      by: options.by || "",
      forced: Boolean(options.force)
    });
    return { subject };
  } catch (error) {
    await fensterEvent(env, options.eventPrefix ? `${options.eventPrefix}_failed` : "lead.email_failed", {
      conversationId: conversation.id,
      message: error.message,
      by: options.by || "",
      forced: Boolean(options.force)
    });
    throw error;
  }
}

async function queueBotDecisionIfActive(env, conversation, decision, messageId = "") {
  if (!(await isBotActive(env))) return;
  const latest = latestInboundMessage(conversation);
  const latestMessageId = messageId || latest?.external_id || latest?.id || "";
  if (!latest || !latestMessageId) return;

  if (decision.action === "REPLY" && decision.reply) {
    const existing = await env.DB.prepare(
      "SELECT id FROM fenster_bot_queue WHERE conversation_id = ? AND message_id = ? AND action = ? AND status IN ('pending', 'processing', 'sent')"
    ).bind(conversation.id, latestMessageId, "SEND_REPLY").first();
    if (existing) return;
    const id = crypto.randomUUID();
    const notBefore = sqlDate(Date.now() + 60 * 1000);
    await env.DB.prepare(
      "INSERT INTO fenster_bot_queue (id, conversation_id, message_id, action, status, reply, decision_action, internal_note, not_before) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, conversation.id, latestMessageId, "SEND_REPLY", "pending", decision.reply, decision.action, decision.internal_note || "", notBefore).run();
    await fensterEvent(env, "bot.reply_queued", { conversationId: conversation.id, queueId: id, notBefore });
    return;
  }

  if (decision.action === "FLAG_HUMAN") {
    await fensterEvent(env, "bot.human_required", { conversationId: conversation.id, messageId: latestMessageId, reason: decision.internal_note || "" });
    return;
  }

  if (decision.action === "NO_REPLY") {
    await fensterEvent(env, "bot.no_reply", { conversationId: conversation.id, messageId: latestMessageId, reason: decision.internal_note || "" });
  }
}

async function enqueuePendingBotActions(env) {
  const conversations = await fensterConversations(env);
  let queued = 0;
  for (const conversation of conversations) {
    if (!latestInboundMessage(conversation) || isFensterConversationSent(conversation)) continue;
    const decision = conversation.decision_action
      ? { action: conversation.decision_action, reply: conversation.draft || "", internal_note: conversation.internal_note || "" }
      : await safeGenerateDecision(env, conversation);
    await notifyLeadIfNeeded(env, conversation, decision);
    await queueBotDecisionIfActive(env, conversation, decision);
    queued += 1;
  }
  await fensterEvent(env, "bot.scan_completed", { scanned: queued });
  return { scanned: queued };
}

function isFensterConversationSent(conversation) {
  return conversation.draft_status === "sent" || conversation.status === "replied";
}

async function processBotQueue(env, by = "system") {
  if (!(await isBotActive(env))) return { processed: 0, sent: 0, skipped: 0, failed: 0 };
  const due = await env.DB.prepare(
    "SELECT * FROM fenster_bot_queue WHERE status = 'pending' AND not_before <= CURRENT_TIMESTAMP ORDER BY created_at ASC LIMIT 10"
  ).all();
  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of due.results || []) {
    processed += 1;
    await env.DB.prepare("UPDATE fenster_bot_queue SET status = 'processing', attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(item.id).run();
    try {
      const conversation = await fensterConversation(env, item.conversation_id);
      const latest = conversation ? latestInboundMessage(conversation) : null;
      const latestMessageId = latest?.external_id || latest?.id || "";
      if (!conversation || !latest || latestMessageId !== item.message_id) {
        await env.DB.prepare("UPDATE fenster_bot_queue SET status = 'skipped', error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .bind("Skipped because the conversation has a newer customer message.", item.id).run();
        await fensterEvent(env, "bot.reply_skipped", { conversationId: item.conversation_id, queueId: item.id, by });
        skipped += 1;
        continue;
      }
      if (item.action !== "SEND_REPLY") {
        await env.DB.prepare("UPDATE fenster_bot_queue SET status = 'skipped', error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .bind(`Unsupported queue action: ${item.action}`, item.id).run();
        skipped += 1;
        continue;
      }
      const result = await sendMetaMessage(env, conversation, item.reply);
      await addFensterMessage(env, conversation.id, "outbound", item.reply, result.message_id || "", new Date().toISOString(), result);
      await env.DB.prepare(
        "UPDATE fenster_conversations SET draft = '', draft_status = ?, status = ?, internal_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind("sent", "replied", "Bot auto-reply sent after 60 second delay.", conversation.id).run();
      await env.DB.prepare("UPDATE fenster_bot_queue SET status = 'sent', error = '', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(item.id).run();
      await fensterEvent(env, "bot.reply_sent", { conversationId: conversation.id, queueId: item.id, by });
      sent += 1;
    } catch (error) {
      await env.DB.prepare("UPDATE fenster_bot_queue SET status = 'failed', error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(error.message || "Queue processing failed", item.id).run();
      await fensterEvent(env, "bot.reply_failed", { conversationId: item.conversation_id, queueId: item.id, message: error.message || "", by });
      failed += 1;
    }
  }

  return { processed, sent, skipped, failed };
}

function hasCallbackDetails(text) {
  const hasPhone = /(?:\+44\s?7\d{3}|\b07\d{3})\s?\d{3}\s?\d{3}\b/.test(text);
  const hasTime = /\b(?:[01]?\d|2[0-3])(?::[0-5]\d)?\s?(?:am|pm)?\b/i.test(text) && /\b(call|callback|ring|phone|tomorrow|today|morning|afternoon|evening)\b/i.test(text);
  const asksCall = /\b(call me|call back|callback|phone me|ring me|give me a call|schedule a call|book a call)\b/i.test(text);
  return hasPhone || asksCall || hasTime;
}

function leadEmailSubject(conversation) {
  const channel = conversation.channel === "instagram" ? "Instagram" : "Facebook";
  return `${channel} message lead - ${conversation.display_name || conversation.external_user_id || "new customer"}`;
}

function leadEmailBody(conversation, decision, requestedBy = "") {
  const lines = [
    requestedBy ? "Social message forwarded manually from the dashboard." : "New social message lead detected.",
    "",
    `Channel: ${conversation.channel}`,
    `Customer: ${conversation.display_name || ""}`,
    `Conversation ID: ${conversation.id}`,
    `Dashboard: https://marketing-dashboard-1d0.pages.dev/`,
    requestedBy ? `Requested by: ${requestedBy}` : "",
    "",
    "Office action:",
    "Please review this lead in the Marketing Dashboard and contact the customer directly. Once handled, reply/confirm in the dashboard rather than sending an automatic bot reply.",
    "",
    "Bot decision:",
    decision.action,
    "",
    "Internal note:",
    decision.internal_note || "(none)",
    "",
    "Exact conversation:"
  ];

  for (const message of conversation.messages || []) {
    const who = message.direction === "outbound" ? "Fenster" : conversation.display_name || "Customer";
    lines.push(`[${message.created_at || ""}] ${who}: ${message.text}`);
  }

  return lines.join("\n");
}

function leadEmailHtml(conversation, decision, requestedBy = "") {
  const latest = latestInboundMessage(conversation);
  const dashboardUrl = "https://marketing-dashboard-1d0.pages.dev/";
  const messengerUrl = "https://business.facebook.com/latest/inbox/all";
  const title = requestedBy ? "Chat forwarded to the office" : "New social lead needs attention";
  const intro = requestedBy
    ? `${escapeHtml(requestedBy)} forwarded this conversation from the Marketing Dashboard.`
    : "The bot flagged this conversation for the office instead of sending an automatic reply.";
  const bubbles = (conversation.messages || []).map((message) => {
    const outbound = message.direction === "outbound";
    return `
      <tr>
        <td align="${outbound ? "right" : "left"}" style="padding:6px 0;">
          <table role="presentation" style="max-width:78%;border-collapse:collapse;${outbound ? "margin-left:auto;" : ""}">
            <tr>
              <td style="background:${outbound ? "#d9fdd3" : "#f1f3f4"};color:#102027;border-radius:14px;padding:10px 12px;font:15px/1.45 Arial,sans-serif;">
                <div style="font-weight:700;font-size:12px;color:#52616b;margin-bottom:4px;">${escapeHtml(outbound ? "Fenster" : conversation.display_name || "Customer")}</div>
                <div>${escapeHtml(message.text)}</div>
                <div style="font-size:11px;color:#6b7780;margin-top:6px;">${escapeHtml(message.created_at || "")}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join("");

  return `<!doctype html>
<html>
  <body style="margin:0;background:#eef2f5;padding:24px;font-family:Arial,sans-serif;color:#102027;">
    <table role="presentation" width="100%" style="border-collapse:collapse;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:720px;border-collapse:collapse;background:#ffffff;border:1px solid #d9e1e7;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#0f5f7a;color:#ffffff;padding:22px 24px;">
                <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;">Fenster Meta Bot</div>
                <h1 style="margin:8px 0 0;font-size:24px;line-height:1.2;">${escapeHtml(title)}</h1>
                <p style="margin:8px 0 0;color:#d8edf4;font-size:15px;line-height:1.45;">${intro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px;">
                <div style="border-left:4px solid #f4a62a;background:#fff8ea;border-radius:8px;padding:14px 16px;margin-bottom:18px;">
                  <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:#7a4a00;">Message that triggered this</div>
                  <p style="margin:8px 0 0;font-size:18px;line-height:1.45;">${escapeHtml(latest?.text || "No trigger message found.")}</p>
                </div>
                <table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:18px;">
                  <tr>
                    <td style="width:50%;padding:8px 10px 8px 0;color:#52616b;font-size:13px;">Customer<br><strong style="color:#102027;font-size:15px;">${escapeHtml(conversation.display_name || "")}</strong></td>
                    <td style="width:50%;padding:8px 0 8px 10px;color:#52616b;font-size:13px;">Channel<br><strong style="color:#102027;font-size:15px;">${escapeHtml(conversation.channel || "")}</strong></td>
                  </tr>
                </table>
                <div style="background:#f6f9fb;border:1px solid #dfe7ec;border-radius:10px;padding:14px 16px;margin-bottom:18px;">
                  <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:#52616b;">AI summary / reason</div>
                  <p style="margin:8px 0 0;font-size:15px;line-height:1.5;">${escapeHtml(decision.internal_note || "The bot decided this should be handled by the office.")}</p>
                  <p style="margin:8px 0 0;font-size:13px;color:#52616b;">Decision: <strong>${escapeHtml(decision.action || "")}</strong></p>
                </div>
                <table role="presentation" style="border-collapse:collapse;margin:0 0 20px;">
                  <tr>
                    <td style="padding-right:10px;">
                      <a href="${dashboardUrl}" style="display:inline-block;background:#0f5f7a;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;padding:12px 16px;">Reply via dashboard</a>
                    </td>
                    <td>
                      <a href="${messengerUrl}" style="display:inline-block;background:#ffffff;color:#0f5f7a;text-decoration:none;font-weight:700;border:1px solid #b8ccd6;border-radius:8px;padding:11px 16px;">Open Messenger inbox</a>
                    </td>
                  </tr>
                </table>
                <h2 style="font-size:16px;margin:0 0 10px;">Conversation</h2>
                <table role="presentation" width="100%" style="border-collapse:collapse;background:#ffffff;">
                  ${bubbles || `<tr><td style="color:#52616b;">No messages found.</td></tr>`}
                </table>
                <p style="margin:20px 0 0;color:#6b7780;font-size:12px;">Conversation ID: ${escapeHtml(conversation.id)}. Reply either via the Marketing Dashboard or the normal Messenger inbox.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function sqlDate(value = Date.now()) {
  return new Date(value).toISOString().replace("T", " ").slice(0, 19);
}

async function graphGet(env, pathAndQuery, token = env.META_PAGE_ACCESS_TOKEN) {
  const version = env.META_GRAPH_VERSION || "v24.0";
  const response = await fetch(`https://graph.facebook.com/${version}/${pathAndQuery}`, {
    headers: { authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Meta Graph error ${response.status}: ${await response.text()}`);
  return response.json();
}

async function sendMetaMessage(env, conversation, text) {
  if (conversation.channel !== "facebook") throw new Error("Only Facebook Messenger sending is enabled.");
  const token = env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("META_PAGE_ACCESS_TOKEN is not configured; message was not sent.");
  if (!conversation.external_user_id || conversation.external_user_id.startsWith("demo-")) {
    throw new Error("This conversation does not have a real Facebook recipient id; message was not sent.");
  }
  const pageId = env.META_PAGE_ID || "me";
  const response = await fetch(`https://graph.facebook.com/${env.META_GRAPH_VERSION || "v24.0"}/${pageId}/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      recipient: { id: conversation.external_user_id },
      message: { text },
      messaging_type: "RESPONSE"
    })
  });
  if (!response.ok) throw new Error(`Meta send error ${response.status}: ${await response.text()}`);
  return response.json();
}

async function getUser(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.match(/(?:^|;\s*)md_session=([^;]+)/)?.[1];
  if (!token) return null;

  const payload = await verifySession(token, env);
  if (!payload || payload.exp < Date.now()) return null;
  return payload.user;
}

async function signSession(user, env) {
  const payload = { user, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  const body = base64Url(JSON.stringify(payload));
  const sig = await hmac(body, env.SESSION_SECRET || "change-this-session-secret");
  return `${body}.${sig}`;
}

async function verifySession(token, env) {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await hmac(body, env.SESSION_SECRET || "change-this-session-secret");
  if (sig !== expected) return null;
  const padded = body.padEnd(body.length + (4 - body.length % 4) % 4, "=");
  return JSON.parse(atob(padded.replace(/-/g, "+").replace(/_/g, "/")));
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64Url(String.fromCharCode(...new Uint8Array(signature)));
}

function base64Url(value) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}
