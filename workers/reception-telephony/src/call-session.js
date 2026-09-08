/*
 * One Durable Object per telephone call.
 *
 * Started by the OpenAI webhook. It creates the call row, accepts the SIP
 * call with the receptionist's session config, then holds the Realtime event
 * WebSocket for the length of the call: transcript, tool calls, the
 * receptionist hanging up, and the time limit (driven by a Durable Object
 * alarm every few seconds). When the call ends it finalises through the same
 * pipeline as a browser test call: transcript to D1, summary, simulated
 * notification.
 *
 * An active outbound WebSocket keeps the object alive for up to 15 minutes,
 * well beyond the call cap, and the alarm keeps it honest if the socket goes
 * quiet.
 */

import { json } from "../../../functions/_lib/http.js";
import {
  createCallRecord,
  buildRealtimeSessionConfig,
  finaliseCallRecord,
  runReceptionTool,
  receptionConfig,
  formatUkNumber,
  logEvent,
  failCall,
  loadCall,
  WRAP_UP_SECONDS
} from "../../../functions/_reception/api.js";
import { RealtimeSessionTracker } from "../../../functions/_reception/realtime-session.js";
import { sipHeaderMap, sipUser } from "./openai-webhook.js";

const OPENAI_CALLS = "https://api.openai.com/v1/realtime/calls";
const ALARM_INTERVAL_MS = 5000;

export class ReceptionCallSession {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.started = false;
    this.ended = false;
    this.finalised = false;
    this.openaiCallId = "";
    this.call = null;
    this.ws = null;
    this.tracker = null;
    this.connectedAt = null;
    this.endReason = "";
    this.wrapUpSent = false;
  }

  async fetch(request) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/start" && request.method === "POST") return await this.start(await request.json());
      if (url.pathname === "/status") {
        return json({
          started: this.started,
          ended: this.ended,
          finalised: this.finalised,
          call_id: this.call?.id || null,
          openai_call_id: this.openaiCallId,
          connected_at: this.connectedAt,
          turns: this.tracker?.transcript.length || 0
        });
      }
      return json({ error: "Not found" }, 404);
    } catch (error) {
      console.error("ReceptionCallSession error", error);
      return json({ error: String(error?.message || error) }, 500);
    }
  }

  async start(input) {
    if (this.started) return json({ ok: true, already_started: true, call_id: this.call?.id || null });
    this.started = true;
    this.openaiCallId = String(input.callId || "");
    const env = this.env;
    const headers = sipHeaderMap(input.sipHeaders);
    const callerNumber = formatUkNumber(headers["x-fenster-caller"] || sipUser(headers.from));
    const calledNumber = formatUkNumber(headers["x-fenster-called"] || sipUser(headers.to));

    this.call = await createCallRecord(env, {
      source: "twilio",
      externalCallId: this.openaiCallId,
      callerNumber,
      calledNumber,
      startedBy: "telephone",
      metadata: {
        transport: "openai_sip",
        twilio_call_sid: headers["x-fenster-twilio-call"] || "",
        sip_from: headers.from || "",
        sip_to: headers.to || "",
        sip_call_id: headers["call-id"] || "",
        webhook_event_id: input.eventId || ""
      }
    });
    const callId = this.call.id;

    // Accept the SIP call with the receptionist's session.
    const session = buildRealtimeSessionConfig(env, this.call);
    let accept;
    try {
      accept = await fetch(`${OPENAI_CALLS}/${encodeURIComponent(this.openaiCallId)}/accept`, {
        method: "POST",
        headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify(session)
      });
    } catch (error) {
      return this.abortStart(callId, "openai_unreachable", `Could not reach OpenAI to accept the call: ${String(error?.message || error).slice(0, 160)}`);
    }
    if (!accept.ok) {
      const detail = (await accept.text().catch(() => "")).slice(0, 300);
      await this.rejectCall();
      return this.abortStart(callId, "session_rejected", `OpenAI refused to accept the call (${accept.status}). ${detail}`);
    }

    // The event stream for the call.
    let socket;
    try {
      const upgrade = await fetch(`https://api.openai.com/v1/realtime?call_id=${encodeURIComponent(this.openaiCallId)}`, {
        headers: { Upgrade: "websocket", authorization: `Bearer ${env.OPENAI_API_KEY}` }
      });
      socket = upgrade.webSocket;
      if (!socket) throw new Error(`No WebSocket in response (${upgrade.status})`);
      socket.accept();
    } catch (error) {
      await this.hangupOpenAi();
      return this.abortStart(callId, "event_stream_failed", `Could not open the call's event stream: ${String(error?.message || error).slice(0, 160)}`);
    }
    this.ws = socket;

    this.tracker = new RealtimeSessionTracker({
      send: (event) => {
        try { socket.send(JSON.stringify(event)); } catch (error) { console.warn("send failed", error?.message); }
      },
      runTool: async (name, args) => {
        const output = await runReceptionTool(env, name, args);
        await logEvent(env, callId, "tool.called", { name, query: String(args?.query || "").slice(0, 200), reason: String(args?.reason || "").slice(0, 40), results: output.results?.length || 0 });
        return output;
      },
      onHangup: async (reason) => {
        this.endReason = `assistant_hung_up:${reason}`;
        await this.hangupOpenAi();
      },
      onNotice: (message) => logEvent(env, callId, "transport.notice", { message: String(message).slice(0, 300) })
    });

    socket.addEventListener("message", (event) => {
      let payload;
      try { payload = JSON.parse(event.data); } catch { return; }
      this.tracker.handle(payload);
    });
    socket.addEventListener("close", (event) => this.onStreamClosed(`stream_closed_${event.code || 0}`));
    socket.addEventListener("error", () => this.onStreamClosed("stream_error"));

    this.connectedAt = new Date().toISOString();
    await logEvent(env, callId, "session.created", {
      transport: "openai_sip",
      model: session.model,
      voice: session.audio.output.voice,
      transcribe_model: session.audio.input.transcription.model,
      turn_detection: session.audio.input.turn_detection.type,
      max_output_tokens: session.max_output_tokens,
      max_call_seconds: receptionConfig(env).maxCallSeconds,
      caller_number: callerNumber ? "supplied" : "none"
    });
    this.tracker.requestGreeting();
    await this.state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS);
    return json({ ok: true, call_id: callId });
  }

  async abortStart(callId, reason, message) {
    console.error(message);
    await logEvent(this.env, callId, "session.failed", { message: message.slice(0, 300) });
    await failCall(this.env, callId, reason);
    this.ended = true;
    this.finalised = true;
    return json({ error: message }, 502);
  }

  async rejectCall() {
    try {
      await fetch(`${OPENAI_CALLS}/${encodeURIComponent(this.openaiCallId)}/reject`, {
        method: "POST",
        headers: { authorization: `Bearer ${this.env.OPENAI_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ status_code: 503 })
      });
    } catch {
      // Nothing more to do; Twilio's Dial will time out and apologise.
    }
  }

  async hangupOpenAi() {
    try {
      const response = await fetch(`${OPENAI_CALLS}/${encodeURIComponent(this.openaiCallId)}/hangup`, {
        method: "POST",
        headers: { authorization: `Bearer ${this.env.OPENAI_API_KEY}` }
      });
      if (!response.ok) console.warn(`hangup returned ${response.status}`);
    } catch (error) {
      console.warn("hangup failed", error?.message);
    }
  }

  onStreamClosed(reason) {
    if (this.ended) return;
    this.ended = true;
    if (!this.endReason) this.endReason = "caller_ended";
    logEvent(this.env, this.call?.id, "transport.stream_closed", { reason, end_reason: this.endReason });
    // Finalise from the alarm handler, a proper invocation with its own
    // lifetime, rather than from inside the socket callback.
    this.state.storage.setAlarm(Date.now());
  }

  async alarm() {
    if (!this.call) return;
    if (this.ended) {
      await this.finalise();
      return;
    }
    const elapsed = (Date.now() - Date.parse(this.connectedAt || this.call.started_at)) / 1000;
    const max = receptionConfig(this.env).maxCallSeconds;
    if (elapsed >= max) {
      if (this.endReason !== "time_limit") {
        this.endReason = "time_limit";
        await logEvent(this.env, this.call.id, "transport.time_limit_reached", { max_call_seconds: max });
        await this.hangupOpenAi();
      }
      // The stream closes after the hang-up; if it does not, finalise anyway.
      if (elapsed >= max + 15) {
        this.ended = true;
        await this.finalise();
        return;
      }
    } else if (!this.wrapUpSent && elapsed >= max - WRAP_UP_SECONDS) {
      this.wrapUpSent = true;
      await logEvent(this.env, this.call.id, "transport.time_limit_warning", { max_call_seconds: max });
      this.tracker?.requestWrapUp();
    }
    await this.state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS);
  }

  async finalise() {
    if (this.finalised || !this.call) return;
    this.finalised = true;
    this.tracker?.dispose();
    try { this.ws?.close(); } catch { /* already closed */ }
    const current = await loadCall(this.env, this.call.id);
    if (!current || current.status !== "in_progress") return;
    try {
      await finaliseCallRecord(this.env, this.call.id, {
        transcript: this.tracker?.transcript || [],
        endedAt: new Date().toISOString(),
        connectedAt: this.connectedAt,
        reason: this.endReason || "caller_ended",
        clientStats: { ...(this.tracker?.stats || {}), transport: "openai_sip" },
        by: "telephone"
      });
    } catch (error) {
      console.error("finalise failed", error);
      await logEvent(this.env, this.call.id, "transport.finalise_failed", { message: String(error?.message || error).slice(0, 300) });
    }
  }
}
