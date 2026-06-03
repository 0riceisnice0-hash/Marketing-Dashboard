export async function onRequest(context) {
  const { request, env } = context;

  try {
    if (request.method === "GET") return verifyMetaWebhook(request, env);
    if (request.method === "POST") return receiveMetaWebhook(request, env);
    return json({ error: "Method not allowed" }, 405);
  } catch (error) {
    await recordEvent(env, "webhook.error", { message: error.message });
    return json({ error: error.message || "Webhook failed" }, 500);
  }
}

function verifyMetaWebhook(request, env) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.META_VERIFY_TOKEN) {
    return new Response(challenge || "", {
      headers: { "Content-Type": "text/plain" }
    });
  }

  return json({ error: "Webhook verification failed" }, 403);
}

async function receiveMetaWebhook(request, env) {
  const payload = await request.json();
  const messages = extractMetaMessages(payload);
  let received = 0;

  for (const incoming of messages) {
    const conversation = await findOrCreateConversation(env, incoming);
    const duplicate = incoming.externalId
      ? await env.DB.prepare("SELECT id FROM fenster_messages WHERE external_id = ?").bind(incoming.externalId).first()
      : null;
    if (duplicate) continue;

    await addMessage(env, conversation.id, "inbound", incoming.text, incoming.externalId, incoming.createdAt, incoming.raw);
    const updated = await conversationWithMessages(env, conversation.id);
    const decision = await safeGenerateDecision(env, updated);
    await env.DB.prepare(
      "UPDATE fenster_conversations SET status = ?, draft = ?, draft_status = ?, decision_action = ?, internal_note = ?, hidden_until_message_id = '', hidden_at = '', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(statusForDecision(decision), decision.reply, draftStatusForDecision(decision), decision.action, decision.internal_note, conversation.id).run();
    received += 1;
  }

  await recordEvent(env, "webhook.received", { received });
  return json({ ok: true, received });
}

function extractMetaMessages(payload) {
  const extracted = [];
  for (const entry of payload.entry || []) {
    for (const item of entry.messaging || []) {
      const text = item.message?.text;
      const senderId = item.sender?.id;
      if (!text || !senderId || item.message?.is_echo) continue;
      extracted.push({
        channel: payload.object === "instagram" ? "instagram" : "facebook",
        externalUserId: String(senderId),
        displayName: String(senderId),
        text,
        externalId: item.message?.mid || "",
        createdAt: item.timestamp ? new Date(Number(item.timestamp)).toISOString() : new Date().toISOString(),
        raw: item
      });
    }

    for (const change of entry.changes || []) {
      const value = change.value || {};
      const text = value.message || value.text;
      const senderId = value.from?.id || value.sender?.id || value.user_id;
      if (!text || !senderId) continue;
      extracted.push({
        channel: payload.object === "instagram" ? "instagram" : "facebook",
        externalUserId: String(senderId),
        displayName: String(senderId),
        text,
        externalId: value.message_id || value.mid || "",
        createdAt: value.created_time || new Date().toISOString(),
        raw: change
      });
    }
  }
  return extracted;
}

async function findOrCreateConversation(env, incoming) {
  const existing = await env.DB.prepare(
    "SELECT * FROM fenster_conversations WHERE channel = ? AND external_user_id = ?"
  ).bind(incoming.channel, incoming.externalUserId).first();
  if (existing) return existing;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO fenster_conversations (id, channel, external_user_id, display_name, status, draft, draft_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, incoming.channel, incoming.externalUserId, incoming.displayName, "new", "", "none", now, now).run();
  return env.DB.prepare("SELECT * FROM fenster_conversations WHERE id = ?").bind(id).first();
}

async function addMessage(env, conversationId, direction, text, externalId = "", createdAt = "", raw = {}) {
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

async function conversationWithMessages(env, id) {
  const conversation = await env.DB.prepare("SELECT * FROM fenster_conversations WHERE id = ?").bind(id).first();
  const rows = await env.DB.prepare("SELECT * FROM fenster_messages WHERE conversation_id = ? ORDER BY created_at ASC").bind(id).all();
  return { ...conversation, messages: rows.results || [] };
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
      instructions: fensterInstructions(),
      input: [
        ...(conversation.messages || []).slice(-12).map((message) => ({
          role: message.direction === "outbound" ? "assistant" : "user",
          content: message.text
        })),
        {
          role: "user",
          content: "Return the JSON decision object for the latest inbound customer message. Return valid JSON only."
        }
      ],
      text: { verbosity: "low" }
    })
  });
  if (!response.ok) throw new Error(`OpenAI error ${response.status}`);
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

function fensterInstructions() {
  return `You are the customer enquiry assistant for Fenster Glazing.

Your job is to decide whether an incoming Facebook or Instagram message should receive an automatic reply, be ignored, or be flagged for a human.

Return valid JSON only with exactly these keys: action, reply, internal_note.

Allowed actions:
REPLY: normal customer enquiry, quote request, product question, appointment request, showroom question, pricing question, or general sales conversation.
NO_REPLY: thanks, thank you, okay, cheers, sounds good, thumbs-up style messages, short acknowledgements ending the conversation, duplicate messages, or automated spam with no useful enquiry.
FLAG_HUMAN: complaint, angry customer, warranty issue, existing job issue, supplier/trade message, message asking for a specific person/director/boss/manager/Nick/Perry/Adam/Jayk/named staff member, legal/planning/payment/invoice/refund/cancellation/contract issue, anything unclear or risky, internal/boss/team messages, sensitive personal situations, or anything outside Fenster Glazing's normal products and services.

For REPLY, set reply to the customer-facing reply and internal_note to an empty string unless there is something useful for the team.
For NO_REPLY, set reply to an empty string and internal_note to the reason.
For FLAG_HUMAN, set reply to an empty string and internal_note to what the team should check.

Fenster Glazing supplies and installs high-quality windows and doors for residential and commercial customers. The company is based at 97-98 Alston Drive, Bradwell Abbey, Milton Keynes, Buckinghamshire, MK13 9HF. Phone: 01908 429200. Email: info@fensterglazing.com.

Fenster Glazing works mainly across Milton Keynes, Northampton, Bedfordshire, Buckinghamshire, Ampthill, Toddington, Leighton Buzzard and surrounding areas. Commercial projects may be handled more widely across the UK.

Help customers quickly and politely, then guide them towards either the Instant Pricing Tool, a consultation, or giving enough details for the team to follow up.

Use British English. Sound friendly, helpful, human, and concise. Do not invent prices, lead times, survey dates, guarantees, discounts, or technical specs. If unsure, say the team can confirm.

For new enquiries, collect name, phone, email, postcode or town, product wanted, residential or commercial, rough measurements, supply and install requirement, photos, and whether they want Instant Pricing or a team callback.

If asked for a price, say: "The quickest way to get an accurate starting price is to use our Instant Pricing Tool, or I can take a few details and ask the team to come back to you."

Never offer legal planning advice as fact. Never promise an exact fitting date. Never diagnose repair issues from a message alone. Never mention being an AI unless asked. Never handle complaints, warranty issues, invoices, refunds, cancellations, existing job problems, or messages for named staff automatically.

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

function latestInboundMessage(conversation) {
  return [...(conversation.messages || [])].reverse().find((message) => message.direction === "inbound");
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
  if (/\b(complaint|complain|angry|unhappy|disappointed|terrible|awful|poor service|not happy|warranty|guarantee|repair|broken|leaking|leak|fault|faulty|existing job|job number|invoice|payment|refund|cancel|cancellation|contract|legal|solicitor|planning permission)\b/i.test(text)) {
    return flagHuman("Complaint, warranty, existing job, payment, legal, planning, or repair issue.");
  }
  if (/\b(nick|perry|adam|jayk|manager|director|boss|owner|salesperson|installer|surveyor)\b/i.test(text)) {
    return flagHuman("Message asks for a named staff member or senior person.");
  }
  return null;
}

async function recordEvent(env, type, detail = {}) {
  await env.DB.prepare("INSERT INTO fenster_events (id, type, detail_json) VALUES (?, ?, ?)")
    .bind(crypto.randomUUID(), type, JSON.stringify(detail)).run();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
