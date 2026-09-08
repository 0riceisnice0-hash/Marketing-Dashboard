/*
 * OpenAI webhook for incoming SIP calls.
 *
 * OpenAI signs webhooks the Standard Webhooks way: HMAC-SHA256 over
 * "<webhook-id>.<webhook-timestamp>.<raw body>" with the base64 secret
 * (after the "whsec_" prefix), sent as "v1,<base64>" in webhook-signature.
 * Every accepted realtime.call.incoming event is handed to the Durable
 * Object for that call id, which accepts the call and runs it.
 */

import { json } from "../../../functions/_lib/http.js";

const TOLERANCE_SECONDS = 300;

export async function verifyOpenAiWebhook(secret, rawBody, headers, nowSeconds = Math.floor(Date.now() / 1000)) {
  const id = headers.get("webhook-id") || "";
  const timestamp = headers.get("webhook-timestamp") || "";
  const signatureHeader = headers.get("webhook-signature") || "";
  if (!secret || !id || !timestamp || !signatureHeader) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > TOLERANCE_SECONDS) return false;

  const keyBytes = base64ToBytes(String(secret).replace(/^whsec_/, ""));
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`));
  const expected = bytesToBase64(new Uint8Array(signed));

  return signatureHeader.split(/\s+/).some((part) => {
    const [version, value] = part.split(",");
    return version === "v1" && value && timingSafeEqual(value, expected);
  });
}

export async function signOpenAiWebhook(secret, id, timestamp, rawBody) {
  const keyBytes = base64ToBytes(String(secret).replace(/^whsec_/, ""));
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`));
  return `v1,${bytesToBase64(new Uint8Array(signed))}`;
}

export function sipHeaderMap(headers = []) {
  const map = {};
  for (const header of Array.isArray(headers) ? headers : []) {
    const name = String(header?.name || "").toLowerCase();
    if (name) map[name] = String(header?.value ?? "");
  }
  return map;
}

// "sip:+447700900123@sip.twilio.com;user=phone" -> "+447700900123"
export function sipUser(value) {
  const match = String(value || "").match(/(?:sips?:)?(?:"[^"]*"\s*<)?(?:sips?:)?([^@<>;]+)@/i);
  return match ? decodeURIComponent(match[1]).trim() : "";
}

export async function handleOpenAiWebhook(request, env) {
  const rawBody = await request.text();
  if (!env.OPENAI_WEBHOOK_SECRET) return json({ error: "OPENAI_WEBHOOK_SECRET is not configured" }, 503);
  if (!(await verifyOpenAiWebhook(env.OPENAI_WEBHOOK_SECRET, rawBody, request.headers))) {
    return json({ error: "Invalid webhook signature" }, 400);
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (event?.type !== "realtime.call.incoming") return json({ ok: true, ignored: event?.type || "unknown" });

  const callId = String(event.data?.call_id || "").trim();
  if (!callId) return json({ error: "Missing call_id" }, 400);
  if (!env.OPENAI_API_KEY) return json({ error: "OPENAI_API_KEY is not configured" }, 503);

  const stub = env.CALL_SESSIONS.get(env.CALL_SESSIONS.idFromName(callId));
  const response = await stub.fetch("https://reception-call-session/start", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      callId,
      sipHeaders: Array.isArray(event.data?.sip_headers) ? event.data.sip_headers : [],
      eventId: event.id || "",
      receivedAt: new Date().toISOString()
    })
  });
  return new Response(await response.text(), { status: response.status, headers: { "Content-Type": "application/json" } });
}

function base64ToBytes(value) {
  const binary = atob(String(value).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}
