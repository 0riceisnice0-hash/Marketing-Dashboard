/*
 * AI Receptionist API. Mounted by functions/api/[[path]].js under
 * /api/reception/* and only reachable with a valid dashboard session.
 *
 *   GET    state                       calls list, config and counts
 *   POST   calls                       create a call record (browser_test)
 *   GET    calls/:id                   call, transcript, notifications, events
 *   DELETE calls/:id                   delete a browser test call
 *   POST   calls/:id/session           mint an OpenAI Realtime client secret
 *   POST   calls/:id/tool              run a receptionist tool for the live model
 *   POST   calls/:id/finalise          store the transcript, summarise, notify
 *   POST   calls/:id/summarise         re-run summary and notification
 *   POST   calls/:id/event             client-side technical log entry
 *
 * The browser only ever receives a short-lived Realtime client secret. The
 * OPENAI_API_KEY secret is used here, server-side, and never returned.
 */

import { json } from "../_lib/http.js";
import { buildReceptionistInstructions, RECEPTION_TOOLS, RECEPTIONIST_GREETING } from "./prompt.js";
import { searchFensterKnowledge } from "./knowledge.js";
import { summariseReceptionCall, DEFAULT_SUMMARY_MODEL, openAiErrorMessage } from "./summary.js";
import { sendReceptionNotification, DEFAULT_NOTIFICATION_TO } from "./notifications.js";

export const DEFAULT_REALTIME_MODEL = "gpt-realtime-2.1";
export const DEFAULT_TRANSCRIBE_MODEL = "gpt-4o-transcribe";
export const DEFAULT_VOICE = "marin";
const CLIENT_SECRET_TTL_SECONDS = 300;
const MAX_TRANSCRIPT_ENTRIES = 600;
const MAX_MESSAGE_LENGTH = 4000;

const CALL_COLUMNS = new Set([
  "status", "ended_at", "duration_seconds", "end_reason", "caller_number", "called_number", "caller_name",
  "callback_number", "caller_email", "postcode", "requested_person", "topic", "summary", "message",
  "action_required", "urgency", "resolved_during_call", "summary_status", "summary_error", "summary_model",
  "notification_status", "realtime_model", "metadata_json"
]);

export async function reception(context, route, user) {
  const { request, env } = context;
  const method = request.method;

  if (method === "GET" && route === "state") return receptionState(env);
  if (method === "POST" && route === "calls") return createCall(env, request, user);

  const match = route.match(/^calls\/([A-Za-z0-9-]{8,64})(?:\/([a-z]+))?$/);
  if (match) {
    const [, id, action = ""] = match;
    if (method === "GET" && !action) return callDetail(env, id);
    if (method === "DELETE" && !action) return deleteCall(env, id, user);
    if (method === "POST" && action === "session") return createSession(env, id, user);
    if (method === "POST" && action === "tool") return runTool(env, request, id);
    if (method === "POST" && (action === "finalise" || action === "finalize")) return finaliseCall(env, request, id, user);
    if (method === "POST" && action === "summarise") return resummarise(env, id, user);
    if (method === "POST" && action === "event") return clientEvent(env, request, id);
  }

  return json({ error: "Not found" }, 404);
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export function receptionConfig(env) {
  return {
    openAi: Boolean(env.OPENAI_API_KEY),
    realtimeModel: text(env.OPENAI_REALTIME_MODEL, 80) || DEFAULT_REALTIME_MODEL,
    summaryModel: text(env.OPENAI_SUMMARY_MODEL, 80) || DEFAULT_SUMMARY_MODEL,
    transcribeModel: text(env.OPENAI_TRANSCRIBE_MODEL, 80) || DEFAULT_TRANSCRIBE_MODEL,
    voice: text(env.OPENAI_REALTIME_VOICE, 40) || DEFAULT_VOICE,
    turnDetection: turnDetectionConfig(env).type,
    notificationTo: text(env.RECEPTION_NOTIFICATION_TO, 160) || DEFAULT_NOTIFICATION_TO,
    notificationProvider: "simulated",
    greeting: RECEPTIONIST_GREETING
  };
}

function turnDetectionConfig(env) {
  const requested = text(env.OPENAI_REALTIME_VAD, 30).toLowerCase();
  if (requested === "server_vad") {
    return {
      type: "server_vad",
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 650,
      create_response: true,
      interrupt_response: true
    };
  }
  return {
    type: "semantic_vad",
    eagerness: "medium",
    create_response: true,
    interrupt_response: true
  };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

async function receptionState(env) {
  const rows = (await env.DB.prepare("SELECT * FROM reception_calls ORDER BY started_at DESC LIMIT 200").all()).results || [];
  const notifications = (await env.DB.prepare(
    "SELECT id, call_id, status, provider, recipient, subject, created_at FROM reception_notifications ORDER BY created_at DESC"
  ).all()).results || [];
  const latest = new Map();
  for (const notification of notifications) {
    if (!latest.has(notification.call_id)) latest.set(notification.call_id, notification);
  }
  const calls = rows
    .map((row) => presentCall(row, latest.get(row.id)))
    .sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)));

  const today = new Date().toISOString().slice(0, 10);
  const completed = calls.filter((call) => call.status === "completed");
  const stats = {
    total: calls.length,
    today: calls.filter((call) => String(call.started_at).slice(0, 10) === today).length,
    needsAction: completed.filter((call) => call.summary_status === "completed" && !call.resolved_during_call && !/^no action required/i.test(call.action_required || "")).length,
    simulatedNotifications: calls.filter((call) => call.notification_status === "simulated").length,
    failedSummaries: calls.filter((call) => call.summary_status === "failed").length
  };

  return json({ calls, stats, config: receptionConfig(env) });
}

async function createCall(env, request, user) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "A JSON body is required" }, 400);

  const source = text(body.source, 30) || "browser_test";
  if (source !== "browser_test") return json({ error: "Only browser_test calls can be started from the dashboard" }, 400);

  const rawNumber = text(body.caller_number, 40);
  const callerNumber = cleanPhone(rawNumber);
  if (rawNumber && !callerNumber) {
    return json({ error: "The simulated caller number should look like a phone number (digits, spaces, + and brackets only)" }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const metadata = {
    simulated_caller_number: Boolean(callerNumber),
    started_from: "dashboard",
    client: text(body.client, 160)
  };

  await env.DB.prepare(
    "INSERT INTO reception_calls (id, source, external_call_id, status, started_at, caller_number, called_number, started_by, realtime_model, metadata_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, source, "", "in_progress", now, callerNumber, "", user?.name || "", receptionConfig(env).realtimeModel, JSON.stringify(metadata), now, now).run();

  await logEvent(env, id, "call.created", { by: user?.name || "", source, simulated_caller_number: Boolean(callerNumber) });
  return json({ call: presentCall(await loadCall(env, id)) }, 201);
}

async function createSession(env, id, user) {
  const call = await loadCall(env, id);
  if (!call) return json({ error: "Call not found" }, 404);
  if (call.status !== "in_progress") return json({ error: "This call has already ended" }, 409);
  if (!env.OPENAI_API_KEY) {
    await logEvent(env, id, "session.failed", { message: "OPENAI_API_KEY not configured" });
    await failCall(env, id, "openai_not_configured");
    return json({ error: "OPENAI_API_KEY is not configured for this Cloudflare project, so a live call cannot start.", code: "openai_not_configured" }, 503);
  }

  const config = receptionConfig(env);
  const instructions = buildReceptionistInstructions({ callerNumber: call.caller_number, source: call.source, now: new Date() });
  const noiseReduction = text(env.OPENAI_REALTIME_NOISE_REDUCTION, 20) || "far_field";
  const payload = {
    expires_after: { anchor: "created_at", seconds: CLIENT_SECRET_TTL_SECONDS },
    session: {
      type: "realtime",
      model: config.realtimeModel,
      instructions,
      output_modalities: ["audio"],
      audio: {
        input: {
          transcription: { model: config.transcribeModel, language: "en" },
          noise_reduction: { type: noiseReduction },
          turn_detection: turnDetectionConfig(env)
        },
        output: { voice: config.voice }
      },
      tools: RECEPTION_TOOLS,
      tool_choice: "auto"
    }
  };

  let response;
  try {
    response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const message = `Could not reach OpenAI to start the call: ${String(error?.message || error).slice(0, 120)}`;
    await logEvent(env, id, "session.failed", { message });
    await failCall(env, id, "openai_unreachable");
    return json({ error: message }, 502);
  }

  if (!response.ok) {
    const message = openAiErrorMessage(response.status, await response.text().catch(() => ""));
    await logEvent(env, id, "session.failed", { status: response.status, message });
    await failCall(env, id, "session_rejected");
    return json({ error: message, code: response.status === 401 ? "openai_auth_failed" : "openai_session_failed" }, 502);
  }

  const data = await response.json().catch(() => ({}));
  if (!data?.value) {
    await logEvent(env, id, "session.failed", { message: "No client secret in OpenAI response" });
    await failCall(env, id, "session_rejected");
    return json({ error: "OpenAI did not return a client secret for the call." }, 502);
  }

  await updateCall(env, id, { realtime_model: config.realtimeModel });
  await logEvent(env, id, "session.created", {
    by: user?.name || "",
    model: config.realtimeModel,
    voice: config.voice,
    transcribe_model: config.transcribeModel,
    turn_detection: payload.session.audio.input.turn_detection.type,
    expires_at: data.expires_at || null
  });

  // The client secret is the only credential the browser ever sees. It is
  // scoped to this one session and expires within minutes.
  return json({
    client_secret: data.value,
    expires_at: data.expires_at || null,
    model: config.realtimeModel,
    voice: config.voice,
    greeting: RECEPTIONIST_GREETING
  });
}

/*
 * Tool execution for the live voice model. The model has no database access;
 * it can only call the small allowlist below, and the browser relays the call
 * here. A telephone transport would call runReceptionTool directly.
 */
export async function runReceptionTool(env, name, args = {}) {
  if (name === "search_fenster_knowledge") {
    const query = text(args?.query, 300);
    if (!query) return { found: false, results: [], note: "No question was supplied." };
    const results = searchFensterKnowledge(query, { limit: 3 });
    return {
      found: results.length > 0,
      results: results.map((result) => ({ topic: result.topic, answer: result.answer })),
      note: results.length
        ? "Verified Fenster facts. Answer from these only, briefly."
        : "No verified Fenster information matches this question. Say you do not have that information to hand and offer to take a message for the team."
    };
  }
  const error = new Error(`Unknown tool: ${name || "(none)"}`);
  error.status = 400;
  throw error;
}

async function runTool(env, request, id) {
  const call = await loadCall(env, id);
  if (!call) return json({ error: "Call not found" }, 404);
  if (call.status !== "in_progress") return json({ error: "This call has already ended" }, 409);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ error: "A JSON body is required" }, 400);
  const name = text(body.name, 80);
  const args = body.arguments && typeof body.arguments === "object" && !Array.isArray(body.arguments) ? body.arguments : {};
  try {
    const output = await runReceptionTool(env, name, args);
    await logEvent(env, id, "tool.called", { name, query: text(args.query, 200), results: output.results?.length || 0 });
    return json({ output });
  } catch (error) {
    await logEvent(env, id, "tool.failed", { name, message: String(error?.message || error).slice(0, 200) });
    return json({ error: String(error?.message || "Tool failed") }, error.status || 500);
  }
}

async function finaliseCall(env, request, id, user) {
  const call = await loadCall(env, id);
  if (!call) return json({ error: "Call not found" }, 404);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "A JSON body is required" }, 400);

  // Idempotent: a second End Call (double click, page unload after a manual
  // end, a retry after a slow network) returns the stored result untouched.
  if (call.status !== "in_progress") {
    return json({ call: presentCall(call, await latestNotification(env, id)), already_finalised: true });
  }
  if (!Array.isArray(body.transcript)) return json({ error: "transcript must be an array of { role, body, at } entries" }, 400);

  const nowMs = Date.now();
  const startedMs = Date.parse(call.started_at) || nowMs;
  const requestedEnd = Date.parse(text(body.ended_at, 40));
  const endedMs = Number.isFinite(requestedEnd) && requestedEnd >= startedMs && requestedEnd <= nowMs + 60000 ? requestedEnd : nowMs;
  const requestedConnected = Date.parse(text(body.connected_at, 40));
  const connectedMs = Number.isFinite(requestedConnected) && requestedConnected >= startedMs - 5000 && requestedConnected <= endedMs ? requestedConnected : null;
  const durationSeconds = Math.max(0, Math.round((endedMs - (connectedMs ?? startedMs)) / 1000));
  const endedAt = new Date(endedMs).toISOString();

  const messages = normaliseTranscript(body.transcript, id);
  await env.DB.prepare("DELETE FROM reception_call_messages WHERE call_id = ?").bind(id).run();
  for (const message of messages) {
    await env.DB.prepare(
      "INSERT INTO reception_call_messages (id, call_id, sequence, role, body, spoken_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(message.id, id, message.sequence, message.role, message.body, message.spoken_at, message.created_at).run();
  }

  const metadata = {
    ...parseJson(call.metadata_json),
    connected_at: connectedMs ? new Date(connectedMs).toISOString() : null,
    ended_by: user?.name || "",
    client_stats: compactStats(body.client_stats),
    dropped_transcript_entries: Math.max(0, body.transcript.length - messages.length)
  };
  const hasCallerSpeech = messages.some((message) => message.role === "user");

  await updateCall(env, id, {
    status: "completed",
    ended_at: endedAt,
    duration_seconds: durationSeconds,
    end_reason: text(body.reason, 60) || "caller_ended",
    metadata_json: JSON.stringify(metadata),
    summary_status: hasCallerSpeech ? "pending" : "skipped",
    notification_status: hasCallerSpeech ? "pending" : "skipped"
  });
  await logEvent(env, id, "call.finalised", {
    by: user?.name || "",
    messages: messages.length,
    duration_seconds: durationSeconds,
    reason: text(body.reason, 60) || "caller_ended"
  });

  if (!hasCallerSpeech) {
    await updateCall(env, id, {
      topic: "No conversation",
      summary: messages.length ? "The call ended before the caller said anything." : "The call ended before any conversation took place.",
      action_required: "No action required.",
      urgency: "low",
      resolved_during_call: 1
    });
    await logEvent(env, id, "summary.skipped", { reason: "empty_call" });
    return json({ call: presentCall(await loadCall(env, id)), empty: true });
  }

  await processCall(env, id);
  return json({ call: presentCall(await loadCall(env, id), await latestNotification(env, id)) });
}

/*
 * Summary then notification, each failure recorded without losing the call.
 * Safe to run again: a completed notification is not duplicated.
 */
async function processCall(env, id) {
  const call = await loadCall(env, id);
  const messages = await loadMessages(env, id);

  try {
    const { summary, model } = await summariseReceptionCall(env, call, messages);
    await updateCall(env, id, {
      caller_name: summary.caller_name || "",
      callback_number: summary.callback_number || "",
      caller_email: summary.email || "",
      postcode: summary.postcode || "",
      requested_person: summary.requested_person || "",
      topic: summary.topic,
      summary: summary.summary,
      message: summary.message || "",
      action_required: summary.action_required,
      urgency: summary.urgency,
      resolved_during_call: summary.resolved_during_call ? 1 : 0,
      summary_status: "completed",
      summary_error: "",
      summary_model: model
    });
    await logEvent(env, id, "summary.completed", { model, urgency: summary.urgency, requested_person: summary.requested_person || "" });
  } catch (error) {
    const message = String(error?.message || error || "Summarisation failed").slice(0, 300);
    await updateCall(env, id, {
      summary_status: "failed",
      summary_error: message,
      notification_status: "skipped"
    });
    await logEvent(env, id, "summary.failed", { message });
    return;
  }

  const existing = await latestNotification(env, id);
  if (existing && ["simulated", "sent"].includes(existing.status)) {
    await updateCall(env, id, { notification_status: existing.status });
    return;
  }
  const notification = await sendReceptionNotification(env, await loadCall(env, id), messages);
  await updateCall(env, id, { notification_status: notification.status });
  await logEvent(env, id, `notification.${notification.status}`, {
    provider: notification.provider,
    recipient: notification.recipient,
    subject: notification.subject,
    error: notification.error || ""
  });
}

async function resummarise(env, id, user) {
  const call = await loadCall(env, id);
  if (!call) return json({ error: "Call not found" }, 404);
  if (call.status !== "completed") return json({ error: "Only a completed call can be summarised" }, 409);
  const messages = await loadMessages(env, id);
  if (!messages.some((message) => message.role === "user")) return json({ error: "There is no caller speech to summarise" }, 400);
  await logEvent(env, id, "summary.retry", { by: user?.name || "" });
  await processCall(env, id);
  return callDetail(env, id);
}

async function callDetail(env, id) {
  const call = await loadCall(env, id);
  if (!call) return json({ error: "Call not found" }, 404);
  const [messages, notifications, events] = await Promise.all([
    loadMessages(env, id),
    env.DB.prepare("SELECT * FROM reception_notifications WHERE call_id = ? ORDER BY created_at DESC").bind(id).all().then((rows) => rows.results || []),
    env.DB.prepare("SELECT * FROM reception_call_events WHERE call_id = ? ORDER BY id ASC").bind(id).all().then((rows) => rows.results || [])
  ]);
  const sortedNotifications = [...notifications].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return json({
    call: presentCall(call, sortedNotifications[0]),
    messages,
    notifications: sortedNotifications,
    events: events.map((event) => ({ ...event, detail: parseJson(event.detail_json) }))
  });
}

async function deleteCall(env, id, user) {
  const call = await loadCall(env, id);
  if (!call) return json({ error: "Call not found" }, 404);
  if (call.source !== "browser_test") {
    return json({ error: "Only browser test calls can be deleted from the dashboard" }, 403);
  }
  // Children first so the delete is complete even where foreign keys are not
  // enforced (the smoke-test mock, for one).
  await env.DB.prepare("DELETE FROM reception_call_messages WHERE call_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM reception_notifications WHERE call_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM reception_call_events WHERE call_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM reception_calls WHERE id = ?").bind(id).run();
  return json({ ok: true, id, deleted_by: user?.name || "" });
}

async function clientEvent(env, request, id) {
  const call = await loadCall(env, id);
  if (!call) return json({ error: "Call not found" }, 404);
  const body = await request.json().catch(() => null);
  const type = text(body?.type, 60);
  if (!body || !/^[a-z0-9_.-]{2,60}$/i.test(type)) return json({ error: "A valid event type is required" }, 400);
  const detail = body.detail && typeof body.detail === "object" ? body.detail : {};
  const serialised = JSON.stringify(detail);
  await logEvent(env, id, `client.${type}`, serialised.length > 2000 ? { truncated: true } : detail);
  return json({ ok: true });
}

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

async function loadCall(env, id) {
  return env.DB.prepare("SELECT * FROM reception_calls WHERE id = ?").bind(id).first();
}

async function loadMessages(env, id) {
  const rows = await env.DB.prepare("SELECT * FROM reception_call_messages WHERE call_id = ? ORDER BY sequence ASC").bind(id).all();
  return [...(rows.results || [])].sort((a, b) => Number(a.sequence) - Number(b.sequence));
}

async function latestNotification(env, id) {
  const rows = await env.DB.prepare("SELECT * FROM reception_notifications WHERE call_id = ? ORDER BY created_at DESC").bind(id).all();
  const list = [...(rows.results || [])].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return list[0] || null;
}

async function updateCall(env, id, fields) {
  const keys = Object.keys(fields).filter((key) => CALL_COLUMNS.has(key));
  if (!keys.length) return;
  await env.DB.prepare(
    `UPDATE reception_calls SET ${keys.map((key) => `${key} = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(...keys.map((key) => fields[key]), id).run();
}

async function failCall(env, id, reason) {
  await updateCall(env, id, {
    status: "failed",
    ended_at: new Date().toISOString(),
    end_reason: reason,
    summary_status: "skipped",
    notification_status: "skipped"
  });
}

async function logEvent(env, callId, type, detail = {}) {
  try {
    await env.DB.prepare("INSERT INTO reception_call_events (call_id, type, detail_json) VALUES (?, ?, ?)")
      .bind(callId, type, JSON.stringify(detail || {})).run();
  } catch {
    // The audit log must never break the call pipeline.
  }
}

function presentCall(row, notification = null) {
  if (!row) return null;
  const { metadata_json, ...call } = row;
  return {
    ...call,
    duration_seconds: Number(call.duration_seconds || 0),
    resolved_during_call: Boolean(Number(call.resolved_during_call || 0)),
    metadata: parseJson(metadata_json),
    notification: notification
      ? {
          id: notification.id,
          status: notification.status,
          provider: notification.provider,
          recipient: notification.recipient,
          subject: notification.subject,
          created_at: notification.created_at
        }
      : null
  };
}

function normaliseTranscript(entries, callId) {
  const roleMap = { user: "user", caller: "user", assistant: "assistant", receptionist: "assistant" };
  const messages = [];
  const createdAt = new Date().toISOString();
  for (const entry of entries.slice(0, MAX_TRANSCRIPT_ENTRIES)) {
    if (!entry || typeof entry !== "object") continue;
    const role = roleMap[String(entry.role || "").toLowerCase()];
    const body = String(entry.body ?? entry.text ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!role || !body) continue;
    const at = Date.parse(String(entry.at || entry.spoken_at || ""));
    messages.push({
      id: crypto.randomUUID(),
      call_id: callId,
      sequence: messages.length + 1,
      role,
      body,
      spoken_at: Number.isFinite(at) ? new Date(at).toISOString() : "",
      created_at: createdAt
    });
  }
  return messages;
}

function compactStats(value) {
  if (!value || typeof value !== "object") return {};
  const stats = {};
  for (const [key, raw] of Object.entries(value).slice(0, 20)) {
    if (!/^[a-z0-9_]{1,40}$/i.test(key)) continue;
    stats[key] = typeof raw === "number" && Number.isFinite(raw) ? raw : text(raw, 120);
  }
  return stats;
}

function cleanPhone(value) {
  const cleaned = String(value || "").replace(/[^0-9+()\s-]/g, "").replace(/\s+/g, " ").trim().slice(0, 32);
  const digits = cleaned.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 15 ? cleaned : "";
}

function text(value, limit = 200) {
  return String(value ?? "").trim().slice(0, limit);
}

function parseJson(value) {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
