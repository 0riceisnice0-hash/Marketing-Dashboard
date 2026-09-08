/*
 * Twilio side of the telephone transport.
 *
 * Twilio requests /twilio/voice when the Fenster number is called. The reply
 * is TwiML that dials OpenAI's SIP endpoint over TLS, passing the caller's
 * number and the Twilio call id as custom SIP headers so the OpenAI webhook
 * can hand them to the receptionist. No audio touches this Worker.
 */

import { json } from "../../../functions/_lib/http.js";

export const DEFAULT_OPENAI_SIP_HOST = "sip.api.openai.com";

// Twilio signs every request: HMAC-SHA1 over the full URL plus the POST
// parameters sorted by name, base64 encoded, in X-Twilio-Signature.
export async function twilioSignature(authToken, url, params = {}) {
  const data = url + Object.keys(params).sort().map((key) => key + params[key]).join("");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(authToken), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return bytesToBase64(new Uint8Array(signature));
}

export async function validateTwilioRequest(authToken, url, params, signature) {
  if (!authToken || !signature) return false;
  const expected = await twilioSignature(authToken, url, params);
  return timingSafeEqual(expected, String(signature));
}

export function escapeXml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"
  })[char]);
}

// sip:proj_x@sip.api.openai.com;transport=tls?x-fenster-caller=...&x-fenster-called=...
export function buildOpenAiSipUri({ projectId, host = DEFAULT_OPENAI_SIP_HOST, headers = {} }) {
  const query = Object.entries(headers)
    .filter(([name, value]) => /^x-[a-z0-9-]+$/i.test(name) && String(value ?? "").trim())
    .map(([name, value]) => `${name.toLowerCase()}=${encodeURIComponent(String(value).trim()).slice(0, 120)}`)
    .join("&");
  return `sip:${projectId}@${host};transport=tls${query ? `?${query}` : ""}`;
}

export function dialTwiml({ sipUri, callerId = "", timeout = 25, actionUrl = "" }) {
  const callerAttribute = /^[+0-9A-Za-z_.-]{3,32}$/.test(callerId) ? ` callerId="${escapeXml(callerId)}"` : "";
  const actionAttribute = actionUrl ? ` action="${escapeXml(actionUrl)}" method="POST"` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial answerOnBridge="true" timeout="${Number(timeout) || 25}"${callerAttribute}${actionAttribute}>
    <Sip>${escapeXml(sipUri)}</Sip>
  </Dial>
</Response>`;
}

export function sayTwiml(message, { hangup = true } = {}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="en-GB">${escapeXml(message)}</Say>${hangup ? "\n  <Hangup/>" : ""}
</Response>`;
}

export function twimlResponse(xml, status = 200) {
  return new Response(xml, { status, headers: { "Content-Type": "text/xml; charset=utf-8", "Cache-Control": "no-store" } });
}

const UNAVAILABLE_MESSAGE = "Sorry, the Fenster Glazing assistant isn't available right now. Please call back during office hours, Monday to Friday, eight thirty to five.";

async function readTwilioParams(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/x-www-form-urlencoded")) return {};
  const form = await request.formData();
  const params = {};
  for (const [key, value] of form.entries()) params[key] = typeof value === "string" ? value : "";
  return params;
}

/*
 * POST /twilio/voice: the Twilio number was called.
 */
export async function handleTwilioVoice(request, env) {
  const params = await readTwilioParams(request);
  const signature = request.headers.get("X-Twilio-Signature") || "";
  if (!env.TWILIO_AUTH_TOKEN) {
    console.error("TWILIO_AUTH_TOKEN is not configured; refusing to bridge the call");
    return twimlResponse(sayTwiml(UNAVAILABLE_MESSAGE), 200);
  }
  if (!(await validateTwilioRequest(env.TWILIO_AUTH_TOKEN, request.url, params, signature))) {
    return json({ error: "Invalid Twilio signature" }, 403);
  }
  if (!env.OPENAI_PROJECT_ID || !env.OPENAI_API_KEY || !env.OPENAI_WEBHOOK_SECRET) {
    console.error("Telephony is not fully configured (OPENAI_PROJECT_ID, OPENAI_API_KEY, OPENAI_WEBHOOK_SECRET)");
    return twimlResponse(sayTwiml(UNAVAILABLE_MESSAGE), 200);
  }

  const from = String(params.From || "").trim();
  const to = String(params.To || "").trim();
  const sipUri = buildOpenAiSipUri({
    projectId: env.OPENAI_PROJECT_ID,
    host: String(env.OPENAI_SIP_HOST || DEFAULT_OPENAI_SIP_HOST).trim() || DEFAULT_OPENAI_SIP_HOST,
    headers: {
      "x-fenster-caller": from,
      "x-fenster-called": to,
      "x-fenster-twilio-call": params.CallSid || ""
    }
  });
  const actionUrl = new URL("/twilio/after", request.url).toString();
  return twimlResponse(dialTwiml({ sipUri, callerId: from, timeout: 25, actionUrl }));
}

/*
 * POST /twilio/after: the SIP leg has ended (or never connected). If OpenAI
 * never answered, apologise instead of leaving the caller in silence.
 */
export async function handleTwilioAfter(request, env) {
  const params = await readTwilioParams(request);
  const signature = request.headers.get("X-Twilio-Signature") || "";
  if (env.TWILIO_AUTH_TOKEN && !(await validateTwilioRequest(env.TWILIO_AUTH_TOKEN, request.url, params, signature))) {
    return json({ error: "Invalid Twilio signature" }, 403);
  }
  const status = String(params.DialCallStatus || "").toLowerCase();
  if (["completed", "answered"].includes(status) || !status) {
    return twimlResponse(`<?xml version="1.0" encoding="UTF-8"?>\n<Response><Hangup/></Response>`);
  }
  console.warn(`SIP leg ended with status ${status} for ${params.CallSid || "unknown call"}`);
  return twimlResponse(sayTwiml(UNAVAILABLE_MESSAGE));
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
