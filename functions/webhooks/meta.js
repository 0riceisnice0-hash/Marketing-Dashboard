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
    await notifyLeadIfNeeded(env, updated, decision);
    await queueBotDecisionIfActive(env, updated, decision, incoming.externalId);
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
        ...(conversation.messages || []).map((message) => ({
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

async function getSetting(env, key, fallback = "") {
  const row = await env.DB.prepare("SELECT value FROM fenster_settings WHERE key = ?").bind(key).first();
  return row?.value || fallback;
}

function defaultPromptContext() {
  return `Extra AI context and rules:
- Never say warranties or guarantees are transferable.
- If asked about warranty or guarantee transfer, say the office team can confirm the exact position for that product/order.`;
}

async function getPromptContext(env) {
  return getSetting(env, "ai_prompt_context", defaultPromptContext());
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

  if (!env.LEAD_EMAIL_WEBHOOK_URL || !env.LEAD_EMAIL_WEBHOOK_SECRET) {
    await recordEvent(env, "lead.email_missing", {
      conversationId: conversation.id,
      internal_note: "Human handoff detected, but lead email Worker secrets are not configured."
    });
    return;
  }

  try {
    const subject = leadEmailSubject(conversation);
    const body = leadEmailBody(conversation, decision);
    const html = leadEmailHtml(conversation, decision);
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
    await recordEvent(env, "lead.email_sent", { conversationId: conversation.id, subject });
  } catch (error) {
    await recordEvent(env, "lead.email_failed", { conversationId: conversation.id, message: error.message });
  }
}

async function isBotActive(env) {
  const row = await env.DB.prepare("SELECT value FROM fenster_settings WHERE key = ?").bind("bot_active").first();
  return row?.value === "true";
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
    await recordEvent(env, "bot.reply_queued", { conversationId: conversation.id, queueId: id, notBefore });
    return;
  }

  if (decision.action === "FLAG_HUMAN") {
    await recordEvent(env, "bot.human_required", { conversationId: conversation.id, messageId: latestMessageId, reason: decision.internal_note || "" });
    return;
  }

  if (decision.action === "NO_REPLY") {
    await recordEvent(env, "bot.no_reply", { conversationId: conversation.id, messageId: latestMessageId, reason: decision.internal_note || "" });
  }
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

function leadEmailBody(conversation, decision) {
  const lines = [
    "New social message lead detected.",
    "",
    `Channel: ${conversation.channel}`,
    `Customer: ${conversation.display_name || ""}`,
    `Conversation ID: ${conversation.id}`,
    `Dashboard: https://marketing-dashboard-1d0.pages.dev/`,
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

function leadEmailHtml(conversation, decision) {
  const latest = latestInboundMessage(conversation);
  const dashboardUrl = "https://marketing-dashboard-1d0.pages.dev/";
  const messengerUrl = "https://business.facebook.com/latest/inbox/all";
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
<html><body style="margin:0;background:#eef2f5;padding:24px;font-family:Arial,sans-serif;color:#102027;">
  <table role="presentation" width="100%" style="border-collapse:collapse;"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:720px;border-collapse:collapse;background:#ffffff;border:1px solid #d9e1e7;border-radius:12px;overflow:hidden;">
      <tr><td style="background:#0f5f7a;color:#ffffff;padding:22px 24px;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;">Fenster Meta Bot</div>
        <h1 style="margin:8px 0 0;font-size:24px;line-height:1.2;">New social lead needs attention</h1>
        <p style="margin:8px 0 0;color:#d8edf4;font-size:15px;line-height:1.45;">The bot flagged this conversation for the office instead of sending an automatic reply.</p>
      </td></tr>
      <tr><td style="padding:22px 24px;">
        <div style="border-left:4px solid #f4a62a;background:#fff8ea;border-radius:8px;padding:14px 16px;margin-bottom:18px;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:#7a4a00;">Message that triggered this</div>
          <p style="margin:8px 0 0;font-size:18px;line-height:1.45;">${escapeHtml(latest?.text || "No trigger message found.")}</p>
        </div>
        <div style="background:#f6f9fb;border:1px solid #dfe7ec;border-radius:10px;padding:14px 16px;margin-bottom:18px;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:#52616b;">AI summary / reason</div>
          <p style="margin:8px 0 0;font-size:15px;line-height:1.5;">${escapeHtml(decision.internal_note || "The bot decided this should be handled by the office.")}</p>
          <p style="margin:8px 0 0;font-size:13px;color:#52616b;">Decision: <strong>${escapeHtml(decision.action || "")}</strong></p>
        </div>
        <table role="presentation" style="border-collapse:collapse;margin:0 0 20px;"><tr>
          <td style="padding-right:10px;"><a href="${dashboardUrl}" style="display:inline-block;background:#0f5f7a;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;padding:12px 16px;">Reply via dashboard</a></td>
          <td><a href="${messengerUrl}" style="display:inline-block;background:#ffffff;color:#0f5f7a;text-decoration:none;font-weight:700;border:1px solid #b8ccd6;border-radius:8px;padding:11px 16px;">Open Messenger inbox</a></td>
        </tr></table>
        <h2 style="font-size:16px;margin:0 0 10px;">Conversation</h2>
        <table role="presentation" width="100%" style="border-collapse:collapse;background:#ffffff;">${bubbles || `<tr><td style="color:#52616b;">No messages found.</td></tr>`}</table>
        <p style="margin:20px 0 0;color:#6b7780;font-size:12px;">Conversation ID: ${escapeHtml(conversation.id)}. Reply either via the Marketing Dashboard or the normal Messenger inbox.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
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
