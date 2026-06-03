import { USERS } from "../_data/users.js";

const TABLES = {
  tickets: ["title", "requester", "category", "priority", "status", "owner", "detail"],
  ideas: ["title", "author", "impact", "status", "detail"],
  tasks: ["title", "lane", "owner", "due_date", "done"],
  todays_plan: ["title", "owner", "status", "notes", "updated_by"],
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

  const draftMatch = route.match(/^conversations\/([^/]+)\/(draft|generate-draft|send|hide)$/);
  if (draftMatch && request.method === "POST") {
    return fensterConversationAction(env, request, draftMatch[1], draftMatch[2], user);
  }

  return json({ error: "Not found" }, 404);
}

async function fensterState(env) {
  const conversations = await fensterConversations(env);
  const reviews = await fensterRows(env, "fenster_reviews");
  const events = await fensterRows(env, "fenster_events", "created_at DESC");

  return json({
    conversations,
    reviews,
    events,
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
        await env.DB.prepare(
          "UPDATE fenster_conversations SET status = ?, draft_status = ?, hidden_until_message_id = '', updated_at = ? WHERE id = ?"
        ).bind("new", "needs-draft", message.created_time || new Date().toISOString(), conversation.id).run();
      }
    }
  }

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
    if (!isGeneratedPlaceholder(conversation.draft)) continue;
    const draft = await safeGenerateDraft(env, conversation);
    await env.DB.prepare(
      "UPDATE fenster_conversations SET draft = ?, draft_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(draft, "draft", conversation.id).run();
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
      "UPDATE fenster_conversations SET draft = ?, draft_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(String(body.draft || ""), "draft", id).run();
    await fensterEvent(env, "draft.updated", { conversationId: id, by: user.name });
    return json(await fensterConversation(env, id));
  }

  if (action === "generate-draft") {
    const draft = await safeGenerateDraft(env, conversation);
    await env.DB.prepare(
      "UPDATE fenster_conversations SET draft = ?, draft_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(draft, "draft", id).run();
    await fensterEvent(env, "draft.generated", { conversationId: id, by: user.name });
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
    if (!text) return json({ error: "No reply text provided" }, 400);
    if (text.includes("[Draft unavailable:")) return json({ error: "Draft is unavailable; generate or write a valid reply first." }, 400);
    const result = await sendMetaMessage(env, conversation, text);
    await addFensterMessage(env, id, "outbound", text, "", new Date().toISOString(), result);
    await env.DB.prepare(
      "UPDATE fenster_conversations SET draft = '', draft_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind("sent", "replied", id).run();
    await fensterEvent(env, "message.sent", { conversationId: id, by: user.name });
    return json({ ok: true, result, conversation: await fensterConversation(env, id) });
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

async function fensterEvent(env, type, detail = {}) {
  await env.DB.prepare("INSERT INTO fenster_events (id, type, detail_json) VALUES (?, ?, ?)")
    .bind(crypto.randomUUID(), type, JSON.stringify(detail)).run();
}

function latestInboundMessage(conversation) {
  return [...(conversation.messages || [])].reverse().find((message) => message.direction === "inbound");
}

function compactHistory(conversation) {
  return (conversation.messages || []).slice(-12).map((message) => ({
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

async function safeGenerateDraft(env, conversation) {
  try {
    return await generateDraft(env, conversation);
  } catch (error) {
    return unavailableDraft(error.message);
  }
}

async function generateDraft(env, conversation) {
  if (!env.OPENAI_API_KEY) return unavailableDraft();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-5.1",
      instructions: fensterInstructions(),
      input: [
        ...compactHistory(conversation),
        {
          role: "user",
          content: "Draft the next Fenster Glazing reply to the latest inbound customer message. Use earlier messages only as context."
        }
      ],
      text: { verbosity: "low" }
    })
  });
  if (!response.ok) throw new Error(`OpenAI error ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return extractOpenAiText(data) || unavailableDraft("OpenAI returned no text");
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

function fensterInstructions() {
  return `You are the customer enquiry assistant for Fenster Glazing.

Fenster Glazing supplies and installs high-quality windows and doors for residential and commercial customers. The company is based at 97-98 Alston Drive, Bradwell Abbey, Milton Keynes, Buckinghamshire, MK13 9HF. Phone: 01908 429200. Email: info@fensterglazing.com.

Fenster Glazing works mainly across Milton Keynes, Northampton, Bedfordshire, Buckinghamshire, Ampthill, Toddington, Leighton Buzzard and surrounding areas. Commercial projects may be handled more widely across the UK.

Help customers quickly and politely, then guide them towards either the Instant Pricing Tool, a consultation, or giving enough details for the team to follow up.

Core products: casement windows, flush casement windows, sliding sash windows, French casement windows, tilt and turn windows, bow and bay windows, aluminium windows, heritage windows, composite doors, uPVC doors, aluminium doors, aluminium bifold doors, slide and fold doors, patio doors, French doors, heritage aluminium doors, roofline, integral blinds, replacement glazing, secondary glazing, roof lanterns, pet flaps, repairs, commercial glazing, curtain walling, louvre vents, and automation.

Main selling points: over 1000 installations, in-house installers, 10-year guarantee, 200+ five-star reviews, FENSA approved, clear technical advice, fixed-fee quotations, secure and energy-efficient products, and strong aftercare.

Use British English. Sound friendly, helpful, human, and concise. Do not invent prices, lead times, survey dates, guarantees, discounts, or technical specs. If unsure, say the team can confirm.

For new enquiries, collect name, phone, email, postcode or town, product wanted, residential or commercial, rough measurements, supply and install requirement, photos, and whether they want Instant Pricing or a team callback.

If asked for a price, say: "The quickest way to get an accurate starting price is to use our Instant Pricing Tool, or I can take a few details and ask the team to come back to you."

Never offer legal planning advice as fact. Never promise an exact fitting date. Never diagnose repair issues from a message alone. Never mention being an AI unless asked.

Return only the exact reply text to send.`;
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
