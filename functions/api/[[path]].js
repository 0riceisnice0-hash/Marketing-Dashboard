import { USERS } from "../_data/users.js";

const TABLES = {
  tickets: ["title", "requester", "category", "priority", "status", "owner", "detail"],
  ideas: ["title", "author", "impact", "status", "detail"],
  tasks: ["title", "lane", "owner", "due_date", "done"],
  todays_plan: ["title", "owner", "status", "notes", "updated_by"],
  social_posts: ["title", "platform", "content_type", "status", "scheduled_for", "owner", "notes"],
  social_guidelines: ["title", "category", "body"],
  action_plan_items: ["title", "section", "effort", "detail", "status"],
  content_requests: ["title", "requester", "asset_type", "deadline", "status", "detail"],
  website_updates: ["title", "area", "status", "release_date", "detail"],
  changelog: ["title", "shipped_at", "area", "detail"]
};

const ALLOWED_TABLES = new Set(Object.keys(TABLES));

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const route = url.pathname.replace(/^\/api\/?/, "");

  try {
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
    await env.DB.prepare(
      "UPDATE fenster_conversations SET draft = ?, draft_status = ?, decision_action = ?, internal_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(String(body.draft || ""), "draft", "REPLY", "Manual reply edit saved for approval.", id).run();
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
    if (conversation.decision_action !== "REPLY") return json({ error: "This conversation is not approved for an automatic reply." }, 400);
    if (!text) return json({ error: "No reply text provided" }, 400);
    if (text.includes("[Draft unavailable:")) return json({ error: "Draft is unavailable; generate or write a valid reply first." }, 400);
    const result = await sendMetaMessage(env, conversation, text);
    await addFensterMessage(env, id, "outbound", text, result.message_id || "", new Date().toISOString(), result);
    await env.DB.prepare(
      "UPDATE fenster_conversations SET draft = '', draft_status = ?, status = ?, internal_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind("sent", "replied", "Reply approved and sent.", id).run();
    await fensterEvent(env, "message.sent", { conversationId: id, by: user.name });
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
  if (!isLeadConversation(conversation, decision)) return;

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

function isLeadConversation(conversation, decision) {
  const latest = latestInboundMessage(conversation);
  const text = `${latest?.text || ""}\n${decision.reply || ""}`.toLowerCase();
  return /\b(quote|quotation|price|pricing|cost|estimate|call me|call back|callback|phone me|ring me|book|survey|appointment|measure|visit|come out|windows?|doors?|bifold|composite|patio|french door|roof lantern|replacement)\b/i.test(text);
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
