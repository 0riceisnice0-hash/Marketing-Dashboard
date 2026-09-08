/*
 * Post-call notifications.
 *
 * `sendReceptionNotification(env, call, messages)` is the service boundary the
 * rest of the pipeline calls. It builds the email from the stored structured
 * call data, hands it to a provider, and records the outcome in
 * reception_notifications.
 *
 * V1 ships one provider, SimulatedNotificationProvider, which delivers nothing
 * and records the message with status 'simulated'. A real provider (Brevo)
 * implements the same `deliver()` contract and is selected by
 * RECEPTION_NOTIFICATION_PROVIDER, so nothing else in the pipeline changes when
 * real sending is switched on.
 */

import { escapeHtml } from "../_lib/http.js";

export const DEFAULT_NOTIFICATION_TO = "info@fensterglazing.com";
export const DASHBOARD_URL = "https://marketing-dashboard-1d0.pages.dev";

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

/*
 * Provider contract:
 *   name: string
 *   deliver({ to, subject, text, html, call }) -> Promise<{ status, providerReference }>
 *     status is 'simulated' | 'sent'. Throw on failure.
 */
export class SimulatedNotificationProvider {
  constructor() {
    this.name = "simulated";
  }

  async deliver() {
    // Nothing leaves the building. The record in D1 is the whole outcome.
    return { status: "simulated", providerReference: "" };
  }
}

export function getNotificationProvider(env) {
  const requested = String(env.RECEPTION_NOTIFICATION_PROVIDER || "simulated").trim().toLowerCase();
  // Only the simulated provider exists in V1. Any other value is refused
  // loudly rather than silently simulating, so a misconfigured "brevo" cannot
  // look like it is working.
  if (requested !== "simulated") {
    throw new Error(`Notification provider "${requested}" is not available in this version. Only "simulated" is implemented.`);
  }
  return new SimulatedNotificationProvider();
}

// ---------------------------------------------------------------------------
// Email content
// ---------------------------------------------------------------------------

export function formatDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (!minutes) return `${rest}s`;
  return `${minutes}m ${String(rest).padStart(2, "0")}s`;
}

export function formatLondonTime(iso, { withDate = false } = {}) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    ...(withDate ? { weekday: "short", day: "numeric", month: "short" } : {}),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function firstName(fullName) {
  return String(fullName || "").trim().split(/\s+/)[0] || "";
}

function titleCase(value) {
  const text = String(value || "").trim();
  return text ? text[0].toUpperCase() + text.slice(1) : "";
}

export function buildReceptionEmailSubject(call) {
  const caller = call.caller_name || call.callback_number || call.caller_number || "unknown caller";
  const wantsCallback = /\b(call|ring|phone)\b.*\bback\b|\bcallback\b|\bcall\b/i.test(call.action_required || "");
  let focus;
  if (call.requested_person && wantsCallback) {
    focus = `${firstName(call.requested_person)} callback requested`;
  } else if (call.requested_person) {
    focus = `message for ${firstName(call.requested_person)}`;
  } else if (call.topic) {
    focus = call.topic;
  } else {
    focus = "message taken";
  }
  return `Out-of-hours call: ${focus} – ${caller}`;
}

/*
 * Builds the email from the same stored structured data a real provider will
 * eventually receive. Returns { subject, text, html }.
 */
export function buildReceptionEmail(call, messages = [], options = {}) {
  const dashboardUrl = options.dashboardUrl || DASHBOARD_URL;
  const callLink = `${dashboardUrl}/#reception/call/${encodeURIComponent(call.id)}`;
  const subject = buildReceptionEmailSubject(call);
  const time = formatLondonTime(call.started_at, { withDate: true }) || call.started_at || "";
  const duration = formatDuration(call.duration_seconds);
  const sourceLabel = call.source === "browser_test" ? "AI Receptionist (browser test call)" : "AI Receptionist";
  const telephone = call.callback_number || call.caller_number || "Not given";
  const transcript = (messages || []).filter((message) => ["user", "assistant"].includes(message.role));

  const lines = [
    "Out-of-hours call received",
    "",
    `Caller: ${call.caller_name || "Not given"}`,
    `Telephone: ${telephone}`,
    ...(call.caller_email ? [`Email: ${call.caller_email}`] : []),
    ...(call.postcode ? [`Postcode / area: ${call.postcode}`] : []),
    `Requested: ${call.requested_person || "No one in particular"}`,
    `Regarding: ${call.topic || "General call"}`,
    `Time: ${time}`,
    `Duration: ${duration}`,
    "",
    "Summary:",
    call.summary || "No summary available.",
    "",
    ...(call.message ? ["Message:", call.message, ""] : []),
    "Action required:",
    call.action_required || "No action required.",
    "",
    "Urgency:",
    titleCase(call.urgency || "normal"),
    "",
    "Source:",
    sourceLabel,
    "",
    `Dashboard record: ${callLink}`,
    "",
    "Transcript:",
    ...(transcript.length
      ? transcript.map((message) => `${message.spoken_at ? `[${formatLondonTime(message.spoken_at)}] ` : ""}${message.role === "assistant" ? "Receptionist" : "Caller"}: ${message.body}`)
      : ["(no transcript)"])
  ];
  const text = lines.join("\n");

  const row = (label, value) => `
    <tr>
      <td style="padding:6px 12px 6px 0;color:#52616b;font-size:13px;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;color:#102027;font-size:15px;vertical-align:top;">${escapeHtml(value)}</td>
    </tr>`;
  const block = (label, value) => `
    <div style="margin:0 0 16px;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:#52616b;">${escapeHtml(label)}</div>
      <p style="margin:6px 0 0;font-size:15px;line-height:1.5;color:#102027;">${escapeHtml(value)}</p>
    </div>`;
  const urgencyColour = { high: "#c23a34", normal: "#1e6f92", low: "#61717a" }[call.urgency] || "#1e6f92";

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#eef2f5;padding:24px;font-family:Arial,sans-serif;color:#102027;">
    <table role="presentation" width="100%" style="border-collapse:collapse;">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:680px;border-collapse:collapse;background:#ffffff;border:1px solid #d9e1e7;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#0f5f7a;color:#ffffff;padding:20px 24px;">
              <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;">Fenster AI Receptionist</div>
              <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25;">Out-of-hours call received</h1>
              <p style="margin:8px 0 0;color:#d8edf4;font-size:14px;">${escapeHtml(time)} · ${escapeHtml(duration)} · <span style="color:#fff;font-weight:700;">${escapeHtml(titleCase(call.urgency || "normal"))} urgency</span></p>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 24px;">
              <table role="presentation" style="border-collapse:collapse;margin-bottom:18px;">
                ${row("Caller", call.caller_name || "Not given")}
                ${row("Telephone", telephone)}
                ${call.caller_email ? row("Email", call.caller_email) : ""}
                ${call.postcode ? row("Postcode / area", call.postcode) : ""}
                ${row("Requested", call.requested_person || "No one in particular")}
                ${row("Regarding", call.topic || "General call")}
              </table>
              ${block("Summary", call.summary || "No summary available.")}
              ${call.message ? block("Message", call.message) : ""}
              <div style="border-left:4px solid ${urgencyColour};background:#f6f9fb;border-radius:8px;padding:12px 16px;margin:0 0 18px;">
                <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:#52616b;">Action required</div>
                <p style="margin:6px 0 0;font-size:16px;line-height:1.45;color:#102027;font-weight:700;">${escapeHtml(call.action_required || "No action required.")}</p>
              </div>
              <p style="margin:0 0 18px;font-size:13px;color:#52616b;">Source: ${escapeHtml(sourceLabel)}</p>
              <a href="${escapeHtml(callLink)}" style="display:inline-block;background:#0f5f7a;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;padding:11px 16px;">Open call in the dashboard</a>
              <h2 style="font-size:15px;margin:24px 0 8px;">Transcript</h2>
              <table role="presentation" width="100%" style="border-collapse:collapse;">
                ${transcript.length ? transcript.map((message) => `
                <tr>
                  <td style="padding:5px 0;font-size:14px;line-height:1.45;">
                    <strong style="color:${message.role === "assistant" ? "#0f5f7a" : "#102027"};">${message.role === "assistant" ? "Receptionist" : "Caller"}</strong>
                    ${message.spoken_at ? `<span style="color:#8a99a3;font-size:12px;"> ${escapeHtml(formatLondonTime(message.spoken_at))}</span>` : ""}
                    <br>${escapeHtml(message.body)}
                  </td>
                </tr>`).join("") : `<tr><td style="color:#52616b;font-size:14px;">No transcript.</td></tr>`}
              </table>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

// ---------------------------------------------------------------------------
// The pipeline entry point
// ---------------------------------------------------------------------------

/*
 * Generates the notification for a finished, summarised call and records it.
 * Never throws: a notification problem must not lose the call. Returns the
 * stored notification row (status 'simulated', 'sent' or 'failed').
 */
export async function sendReceptionNotification(env, call, messages, options = {}) {
  const to = String(env.RECEPTION_NOTIFICATION_TO || DEFAULT_NOTIFICATION_TO).trim() || DEFAULT_NOTIFICATION_TO;
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  let email = { subject: "", text: "", html: "" };
  let providerName = "simulated";
  let status = "failed";
  let providerReference = "";
  let error = "";

  try {
    email = buildReceptionEmail(call, messages, options);
    const provider = getNotificationProvider(env);
    providerName = provider.name;
    const result = await provider.deliver({ to, subject: email.subject, text: email.text, html: email.html, call });
    status = result?.status === "sent" ? "sent" : "simulated";
    providerReference = String(result?.providerReference || "");
  } catch (problem) {
    error = String(problem?.message || problem || "Notification failed").slice(0, 300);
  }

  const row = {
    id,
    call_id: call.id,
    channel: "email",
    provider: providerName,
    status,
    recipient: to,
    subject: email.subject,
    body_text: email.text,
    body_html: email.html,
    provider_reference: providerReference,
    error,
    created_at: createdAt
  };

  try {
    await env.DB.prepare(
      "INSERT INTO reception_notifications (id, call_id, channel, provider, status, recipient, subject, body_text, body_html, provider_reference, error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(row.id, row.call_id, row.channel, row.provider, row.status, row.recipient, row.subject, row.body_text, row.body_html, row.provider_reference, row.error, row.created_at).run();
  } catch (problem) {
    // The call itself is already saved; report the write failure on the row
    // we hand back so the API can still mark the call honestly.
    row.status = "failed";
    row.error = `Notification could not be recorded: ${String(problem?.message || problem).slice(0, 200)}`;
  }

  return row;
}
