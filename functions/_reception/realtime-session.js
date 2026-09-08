/*
 * Transport-agnostic tracking of one live Realtime session.
 *
 * Feed it every server event from the session (WebSocket for telephony, data
 * channel for the browser) and it keeps the structured transcript, runs the
 * receptionist's tools, and decides when the call should be hung up. It knows
 * nothing about audio, SIP or WebRTC: the transport supplies `send` (a client
 * event to the session), `runTool` and `onHangup`.
 *
 * public/reception-call.js carries the same logic for the browser, where it
 * also drives the UI. Keep the two in step when changing call behaviour.
 */

// What counts as the receptionist having said goodbye.
export const GOODBYE_PATTERN = /\b(bye|goodbye|take care|thanks for calling|cheers|have a (good|nice|lovely) (day|evening|night|one))\b/i;
export const FORCED_GOODBYE = "Thanks for calling, bye.";

// Realtime "error" events that are expected side effects of interruption.
export const IGNORED_ERROR_PATTERNS = [
  /no active response/i,
  /cancellation failed/i,
  /already has an active response/i,
  /conversation already has an active response/i
];

const noop = () => {};

export class RealtimeSessionTracker {
  constructor(options = {}) {
    this.send = options.send || noop;
    this.runTool = options.runTool || (async () => ({ found: false, results: [], note: "No tools available." }));
    this.onHangup = options.onHangup || (async () => {});
    this.onNotice = options.onNotice || noop;
    this.onTranscript = options.onTranscript || noop;
    this.hangupDelayMs = Number.isFinite(options.hangupDelayMs) ? options.hangupDelayMs : 500;
    this.goodbyeTimeoutMs = Number.isFinite(options.goodbyeTimeoutMs) ? options.goodbyeTimeoutMs : 10000;
    this.speakingFailsafeMs = Number.isFinite(options.speakingFailsafeMs) ? options.speakingFailsafeMs : 12000;

    this.ai = "idle";              // idle | listening | thinking | speaking
    this.entries = [];             // structured transcript, in conversation order
    this.entriesById = new Map();
    this.pendingTools = new Set();
    this.hangup = null;            // { reason, awaitingGoodbye, done }
    this.timers = new Set();
    this.stats = { user_turns: 0, assistant_turns: 0, tool_calls: 0, interruptions: 0, realtime_errors: 0 };
    this.errors = [];
  }

  get transcript() {
    return this.entries
      .filter((entry) => entry.body.trim())
      .map((entry) => ({ role: entry.role, body: entry.body.trim(), at: entry.at, partial: Boolean(entry.partial) }));
  }

  get hangupReason() {
    return this.hangup?.reason || "";
  }

  // The session's instructions carry the greeting; asking for a response is
  // what makes the receptionist speak first.
  requestGreeting() {
    this.send({ type: "response.create" });
  }

  // Time limit reached: one sentence, goodbye, end_call.
  requestWrapUp() {
    this.send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "system",
        content: [{
          type: "input_text",
          text: `TIME LIMIT REACHED. This call must end now. In one short sentence tell the caller the team will pick this up when the office reopens, then say "${FORCED_GOODBYE}" and call end_call.`
        }]
      }
    });
    this.send({ type: "response.create" });
  }

  dispose() {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
  }

  handle(event) {
    if (!event || typeof event !== "object") return;
    const now = new Date().toISOString();

    switch (event.type) {
      case "input_audio_buffer.speech_started":
        if (this.hangup) return;
        if (this.ai === "speaking") this.stats.interruptions += 1;
        this.ai = "listening";
        return;

      case "input_audio_buffer.speech_stopped":
        this.ai = "thinking";
        return;

      case "input_audio_buffer.committed":
        if (event.item_id) this.ensureEntry(event.item_id, "user", now);
        return;

      case "conversation.item.created":
      case "conversation.item.added": {
        const item = event.item || {};
        if (item.type === "message" && item.role === "user" && item.id) this.ensureEntry(item.id, "user", now);
        return;
      }

      case "conversation.item.input_audio_transcription.delta": {
        const entry = this.ensureEntry(event.item_id, "user", now);
        entry.body += String(event.delta || "");
        this.emitTranscript();
        return;
      }

      case "conversation.item.input_audio_transcription.completed": {
        const entry = this.ensureEntry(event.item_id, "user", now);
        entry.body = String(event.transcript || "").trim();
        entry.final = true;
        if (entry.body && !entry.counted) {
          entry.counted = true;
          this.stats.user_turns += 1;
        }
        this.emitTranscript();
        return;
      }

      case "conversation.item.input_audio_transcription.failed": {
        const entry = this.ensureEntry(event.item_id, "user", now);
        if (!entry.body) entry.body = "[inaudible]";
        entry.final = true;
        this.emitTranscript();
        return;
      }

      case "response.created":
        if (this.ai !== "speaking") this.ai = "thinking";
        return;

      case "response.output_item.added": {
        const item = event.item || {};
        if (item.type === "message" && item.id) this.ensureEntry(item.id, "assistant", now);
        return;
      }

      case "response.output_audio_transcript.delta": {
        const entry = this.ensureEntry(event.item_id, "assistant", now);
        entry.body += String(event.delta || "");
        this.emitTranscript();
        return;
      }

      case "response.output_audio_transcript.done": {
        const entry = this.ensureEntry(event.item_id, "assistant", now);
        if (event.transcript) entry.body = String(event.transcript);
        entry.final = true;
        if (entry.body.trim() && !entry.counted) {
          entry.counted = true;
          this.stats.assistant_turns += 1;
        }
        this.emitTranscript();
        if (this.hangup?.awaitingGoodbye && GOODBYE_PATTERN.test(entry.body)) {
          this.hangup.awaitingGoodbye = false;
          if (this.ai !== "speaking") this.finishHangup(this.hangupDelayMs);
        }
        return;
      }

      case "output_audio_buffer.started":
        this.ai = "speaking";
        return;

      case "output_audio_buffer.stopped":
        if (this.hangup && !this.hangup.awaitingGoodbye) {
          this.finishHangup(this.hangupDelayMs);
          return;
        }
        this.ai = "listening";
        return;

      case "output_audio_buffer.cleared":
      case "response.cancelled":
        this.markLatestAssistantPartial();
        if (this.ai !== "listening") this.ai = "listening";
        return;

      case "response.done":
        this.handleResponseDone(event.response || {});
        return;

      case "error":
        this.handleRealtimeError(event.error || event);
        return;

      default:
        return;
    }
  }

  handleResponseDone(response) {
    const calls = (response.output || []).filter((item) => item.type === "function_call");
    const hangup = calls.find((call) => call.name === "end_call");
    const others = calls.filter((call) => call.name !== "end_call");
    for (const call of others) this.runFunction(call);
    if (hangup) {
      this.requestHangup(hangup, response);
      return;
    }
    if (others.length) return;
    if (response.status === "failed") {
      const detail = response.status_details?.error?.message || "The receptionist could not produce a reply.";
      this.onNotice(`Reply failed: ${detail}`);
    }
    if (this.ai !== "speaking") this.ai = "listening";
  }

  async runFunction(call) {
    const key = call.call_id || `${call.name}-${Date.now()}`;
    if (this.pendingTools.has(key)) return;
    this.pendingTools.add(key);
    this.stats.tool_calls += 1;
    let output;
    try {
      let args = {};
      try { args = JSON.parse(call.arguments || "{}"); } catch { args = {}; }
      output = await this.runTool(call.name, args);
    } catch (error) {
      output = { found: false, results: [], note: "The lookup failed. Say you cannot check that right now and offer to take a message." };
      this.onNotice(`Tool ${call.name} failed: ${error?.message || error}`);
    } finally {
      this.pendingTools.delete(key);
    }
    if (this.hangup?.done) return;
    this.send({
      type: "conversation.item.create",
      item: { type: "function_call_output", call_id: call.call_id, output: JSON.stringify(output ?? {}) }
    });
    this.send({ type: "response.create" });
  }

  /*
   * Every call ends with a spoken goodbye. If this turn already contained
   * one, hang up once it has finished playing; otherwise make the
   * receptionist say one now and hang up after that.
   */
  requestHangup(call, response = {}) {
    if (this.hangup) return;
    let reason = "other";
    try { reason = JSON.parse(call.arguments || "{}").reason || "other"; } catch { reason = "other"; }
    const said = responseTranscript(response) || this.latestAssistantText();
    const saidGoodbye = GOODBYE_PATTERN.test(said);
    this.hangup = { reason, at: Date.now(), awaitingGoodbye: !saidGoodbye, done: false };
    this.stats.assistant_hung_up = 1;
    this.runTool("end_call", { reason }).catch(() => {});

    if (saidGoodbye) {
      this.onNotice("The receptionist is ending the call.");
      if (this.ai === "speaking") this.after(this.speakingFailsafeMs, () => this.finishHangup(0));
      else this.finishHangup(this.hangupDelayMs);
      return;
    }

    this.onNotice("The receptionist is ending the call and saying goodbye first.");
    this.send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "system",
        content: [{ type: "input_text", text: `The call is ending now. Say exactly "${FORCED_GOODBYE}" and nothing else.` }]
      }
    });
    this.send({ type: "response.create" });
    this.after(this.goodbyeTimeoutMs, () => this.finishHangup(0));
  }

  finishHangup(delayMs) {
    if (!this.hangup || this.hangup.finishing) return;
    this.hangup.finishing = true;
    this.after(delayMs, () => {
      if (this.hangup.done) return;
      this.hangup.done = true;
      Promise.resolve(this.onHangup(this.hangup.reason)).catch((error) => {
        this.onNotice(`Hang-up failed: ${error?.message || error}`);
      });
    });
  }

  handleRealtimeError(error) {
    const message = String(error?.message || "Unknown realtime error");
    if (IGNORED_ERROR_PATTERNS.some((pattern) => pattern.test(message))) return;
    this.stats.realtime_errors += 1;
    this.errors.push({ at: new Date().toISOString(), code: error?.code || "", message: message.slice(0, 300) });
    this.onNotice(`Realtime: ${message.slice(0, 200)}`);
  }

  // -------------------------------------------------------------------------

  after(ms, fn) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      fn();
    }, Math.max(0, ms));
    this.timers.add(timer);
    return timer;
  }

  ensureEntry(itemId, role, at) {
    const key = itemId || `${role}-${this.entries.length + 1}`;
    let entry = this.entriesById.get(key);
    if (!entry) {
      entry = { key, role, body: "", at, final: false, partial: false, counted: false };
      this.entriesById.set(key, entry);
      this.entries.push(entry);
    }
    return entry;
  }

  latestAssistantText() {
    for (let index = this.entries.length - 1; index >= 0; index -= 1) {
      if (this.entries[index].role === "assistant" && this.entries[index].body.trim()) return this.entries[index].body;
    }
    return "";
  }

  markLatestAssistantPartial() {
    for (let index = this.entries.length - 1; index >= 0; index -= 1) {
      const entry = this.entries[index];
      if (entry.role !== "assistant") continue;
      if (!entry.final) {
        entry.partial = true;
        entry.final = true;
        this.emitTranscript();
      }
      return;
    }
  }

  emitTranscript() {
    this.onTranscript(this.transcript);
  }
}

// The spoken words of one response, from the response payload itself.
export function responseTranscript(response) {
  const parts = [];
  for (const item of response?.output || []) {
    if (item.type !== "message") continue;
    for (const content of item.content || []) {
      if (typeof content.transcript === "string") parts.push(content.transcript);
      else if (typeof content.text === "string") parts.push(content.text);
    }
  }
  return parts.join(" ").trim();
}
