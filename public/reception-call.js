/*
 * Browser test-call transport for the AI Receptionist.
 *
 * One BrowserTestCall = one microphone conversation with the receptionist via
 * the OpenAI Realtime API over WebRTC. The browser never sees the OpenAI API
 * key: it asks the dashboard backend for a short-lived client secret, uses it
 * once to negotiate the WebRTC session, and talks to OpenAI directly from then
 * on. Transcripts are kept in a structured in-memory list from the Realtime
 * events themselves (never scraped from the DOM) and submitted to the backend
 * when the call ends.
 *
 * This is deliberately the only file that knows about microphones, audio
 * elements and RTCPeerConnection. The receptionist's behaviour lives on the
 * server so a telephone transport can reuse it unchanged.
 */

const OPENAI_CALLS_URL = "https://api.openai.com/v1/realtime/calls";

// Realtime "error" events that are expected side effects of interruption and
// should not be surfaced to the operator.
const IGNORED_ERROR_PATTERNS = [
  /no active response/i,
  /cancellation failed/i,
  /already has an active response/i,
  /conversation already has an active response/i
];

export class BrowserTestCall {
  constructor(options = {}) {
    this.callerNumber = String(options.callerNumber || "").trim();
    this.voice = String(options.voice || "").trim().toLowerCase();
    this.api = options.api;
    this.handlers = {
      state: options.onState || (() => {}),
      transcript: options.onTranscript || (() => {}),
      error: options.onError || (() => {}),
      level: options.onLevel || (() => {}),
      notice: options.onNotice || (() => {}),
      ended: options.onEnded || (() => {})
    };

    this.callId = null;
    this.model = "";
    this.greeting = "";
    this.phase = "idle";          // idle | requesting_mic | creating | connecting | live | ending | processing | ended | error
    this.ai = "idle";             // idle | listening | thinking | speaking
    this.muted = false;
    this.connectedAt = null;
    this.endedAt = null;
    this.endPromise = null;
    this.result = null;
    this.errorMessage = "";

    this.stream = null;
    this.pc = null;
    this.dc = null;
    this.audioElement = null;
    this.audioContext = null;
    this.analyser = null;
    this.levelFrame = 0;

    this.maxCallSeconds = 180;
    this.wrapUpSeconds = 20;
    this.limitTimers = [];
    this.hangup = null;            // set once the receptionist calls end_call

    this.entries = [];             // structured transcript, in conversation order
    this.entriesById = new Map();
    this.pendingTools = new Set();
    this.stats = { user_turns: 0, assistant_turns: 0, tool_calls: 0, interruptions: 0, realtime_errors: 0 };
    this.notices = [];
  }

  // -------------------------------------------------------------------------
  // Public surface
  // -------------------------------------------------------------------------

  get isActive() {
    return ["requesting_mic", "creating", "connecting", "live", "ending", "processing"].includes(this.phase);
  }

  get transcript() {
    return this.entries
      .filter((entry) => entry.body.trim())
      .map((entry) => ({ role: entry.role, body: entry.body.trim(), at: entry.at, partial: Boolean(entry.partial) }));
  }

  async start() {
    if (this.phase !== "idle") throw new Error("This call has already been started.");
    try {
      await this.requestMicrophone();
      await this.createCallRecord();
      const session = await this.requestSession();
      await this.connect(session);
    } catch (error) {
      const message = friendlyStartError(error);
      this.errorMessage = message;
      await this.teardownMedia();
      if (this.callId && this.phase !== "live") {
        this.reportEvent("start_failed", { message, phase: this.phase });
      }
      this.setPhase("error", "idle", message);
      this.handlers.error(message);
      throw new Error(message);
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    for (const track of this.stream?.getAudioTracks?.() || []) track.enabled = !this.muted;
    this.emitState();
  }

  /*
   * Ends the call and finalises it on the server. Idempotent: repeated calls
   * (double click, page unload, connection loss racing a click) share the same
   * promise and never re-run teardown or finalisation.
   */
  end(reason = "caller_ended") {
    if (this.endPromise) return this.endPromise;
    this.endPromise = this.performEnd(reason);
    return this.endPromise;
  }

  // Re-attempt the server save after a failed finalisation, keeping the
  // in-memory transcript. Media is already released at this point.
  async retrySave() {
    if (!this.callId || this.phase !== "error" || !this.endedAt) throw new Error("There is nothing to retry.");
    this.setPhase("processing", "idle", "Saving the call...");
    return this.finalise(this.lastEndReason || "caller_ended");
  }

  // -------------------------------------------------------------------------
  // Start sequence
  // -------------------------------------------------------------------------

  async requestMicrophone() {
    this.setPhase("requesting_mic", "idle", "Waiting for microphone permission...");
    if (!navigator.mediaDevices?.getUserMedia) {
      throw Object.assign(new Error("This browser does not support microphone access."), { code: "unsupported" });
    }
    if (typeof RTCPeerConnection === "undefined") {
      throw Object.assign(new Error("This browser does not support WebRTC, which the live call needs."), { code: "unsupported" });
    }
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });
    this.startLevelMeter();
  }

  async createCallRecord() {
    this.setPhase("creating", "idle", "Creating the call record...");
    const data = await this.api("/api/reception/calls", {
      method: "POST",
      body: { source: "browser_test", caller_number: this.callerNumber, voice: this.voice, client: navigator.userAgent.slice(0, 160) }
    });
    this.callId = data?.call?.id;
    if (!this.callId) throw new Error("The dashboard did not return a call id.");
  }

  async requestSession() {
    this.setPhase("connecting", "idle", "Requesting a secure session...");
    const session = await this.api(`/api/reception/calls/${this.callId}/session`, { method: "POST", body: {} });
    if (!session?.client_secret) throw new Error(session?.error || "No session credentials were returned.");
    this.model = session.model || "";
    this.greeting = session.greeting || "";
    if (Number(session.max_call_seconds) >= 60) this.maxCallSeconds = Number(session.max_call_seconds);
    if (Number(session.wrap_up_seconds) >= 5) this.wrapUpSeconds = Number(session.wrap_up_seconds);
    return session;
  }

  async connect(session) {
    this.setPhase("connecting", "idle", "Connecting to the receptionist...");
    const pc = new RTCPeerConnection();
    this.pc = pc;

    this.audioElement = document.createElement("audio");
    this.audioElement.autoplay = true;
    this.audioElement.setAttribute("playsinline", "");
    pc.ontrack = (event) => {
      this.audioElement.srcObject = event.streams[0];
      const playing = this.audioElement.play?.();
      if (playing?.catch) playing.catch(() => this.notice("The browser blocked audio playback. Click anywhere on the page and the receptionist's voice should start."));
    };

    const [track] = this.stream.getAudioTracks();
    pc.addTrack(track, this.stream);

    const dc = pc.createDataChannel("oai-events");
    this.dc = dc;
    const channelOpen = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timed out waiting for the receptionist to connect.")), 20000);
      dc.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
      dc.addEventListener("error", () => { clearTimeout(timer); reject(new Error("The realtime data channel failed.")); }, { once: true });
    });
    dc.addEventListener("message", (event) => this.handleServerEvent(event.data));
    dc.addEventListener("close", () => this.handleChannelClosed());

    pc.onconnectionstatechange = () => this.handleConnectionState(pc.connectionState);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    let sdpResponse;
    try {
      sdpResponse = await fetch(OPENAI_CALLS_URL, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${session.client_secret}`,
          "Content-Type": "application/sdp"
        }
      });
    } catch (error) {
      throw new Error("Could not reach OpenAI's realtime service from this browser. Check the network connection.");
    }
    if (!sdpResponse.ok) {
      const status = sdpResponse.status;
      throw new Error(status === 401
        ? "OpenAI rejected the session credentials (401). The dashboard's OpenAI key may be invalid."
        : `OpenAI refused the realtime connection (HTTP ${status}).`);
    }
    await pc.setRemoteDescription({ type: "answer", sdp: await sdpResponse.text() });
    await channelOpen;

    this.connectedAt = new Date().toISOString();
    this.startCallLimit();
    this.setPhase("live", "thinking", "Connected. The receptionist is answering...");
    // The session's instructions carry the exact greeting; asking for a
    // response is what makes the receptionist speak first.
    this.send({ type: "response.create" });
  }

  // -------------------------------------------------------------------------
  // Realtime events
  // -------------------------------------------------------------------------

  handleServerEvent(raw) {
    let event;
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }
    const now = new Date().toISOString();

    switch (event.type) {
      case "session.created":
      case "session.updated":
        return;

      case "input_audio_buffer.speech_started":
        if (this.hangup) return;
        if (this.ai === "speaking") this.stats.interruptions += 1;
        this.setAi("listening");
        return;

      case "input_audio_buffer.speech_stopped":
        this.setAi("thinking");
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
        if (this.ai !== "speaking") this.setAi("thinking");
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
        return;
      }

      case "output_audio_buffer.started":
        this.setAi("speaking");
        return;

      case "output_audio_buffer.stopped":
        if (this.hangup) {
          this.finishHangup(500);
          return;
        }
        this.setAi("listening");
        return;

      case "output_audio_buffer.cleared":
        // The caller interrupted; whatever was said so far stays in the transcript.
        this.markLatestAssistantPartial();
        this.setAi("listening");
        return;

      case "response.cancelled":
        this.markLatestAssistantPartial();
        if (this.ai !== "listening") this.setAi("listening");
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
    for (const call of others) this.runTool(call);
    if (hangup) {
      this.requestHangup(hangup);
      return;
    }
    if (others.length) return;
    if (response.status === "failed") {
      const detail = response.status_details?.error?.message || "The receptionist could not produce a reply.";
      this.notice(`Reply failed: ${detail}`);
    }
    if (this.ai !== "speaking") this.setAi("listening");
  }

  async runTool(call) {
    const key = call.call_id || `${call.name}-${Date.now()}`;
    if (this.pendingTools.has(key)) return;
    this.pendingTools.add(key);
    this.stats.tool_calls += 1;
    let output;
    try {
      let args = {};
      try { args = JSON.parse(call.arguments || "{}"); } catch { args = {}; }
      const result = await this.api(`/api/reception/calls/${this.callId}/tool`, {
        method: "POST",
        body: { name: call.name, arguments: args }
      });
      output = result?.output ?? { found: false, results: [], note: "Lookup returned nothing." };
    } catch (error) {
      output = { found: false, results: [], note: "The lookup failed. Say you cannot check that right now and offer to take a message." };
      this.notice(`Knowledge lookup failed: ${error.message}`);
    } finally {
      this.pendingTools.delete(key);
    }
    if (this.phase !== "live") return;
    this.send({
      type: "conversation.item.create",
      item: { type: "function_call_output", call_id: call.call_id, output: JSON.stringify(output) }
    });
    this.send({ type: "response.create" });
  }

  /*
   * The receptionist asked to hang up. Let whatever it is saying finish
   * playing, then end the call. A failsafe ends it anyway if no
   * output_audio_buffer.stopped ever arrives.
   */
  requestHangup(call) {
    if (this.hangup || this.phase !== "live") return;
    let reason = "other";
    try { reason = JSON.parse(call.arguments || "{}").reason || "other"; } catch { reason = "other"; }
    this.hangup = { reason, at: Date.now() };
    this.api(`/api/reception/calls/${this.callId}/tool`, { method: "POST", body: { name: "end_call", arguments: { reason } } }).catch(() => {});
    this.notice("The receptionist is ending the call.");
    this.stats.assistant_hung_up = 1;
    if (this.ai === "speaking") {
      this.hangup.failsafe = setTimeout(() => this.finishHangup(0), 12000);
    } else {
      this.finishHangup(700);
    }
  }

  finishHangup(delayMs) {
    if (!this.hangup || this.hangup.finishing) return;
    this.hangup.finishing = true;
    if (this.hangup.failsafe) clearTimeout(this.hangup.failsafe);
    setTimeout(() => this.end(`assistant_hung_up:${this.hangup.reason}`), delayMs);
  }

  /*
   * Hard time limit. Shortly before it the receptionist is told to wrap up
   * (a system message plus a nudge to respond); at the limit the call ends
   * whatever is happening.
   */
  startCallLimit() {
    const wrapUpAt = Math.max(5, this.maxCallSeconds - this.wrapUpSeconds) * 1000;
    this.limitTimers.push(setTimeout(() => {
      if (this.phase !== "live" || this.hangup) return;
      this.notice(`Time limit approaching: the receptionist has been asked to wrap up (${this.maxCallSeconds}s limit).`);
      this.reportEvent("time_limit_warning", { max_call_seconds: this.maxCallSeconds });
      this.send({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "system",
          content: [{
            type: "input_text",
            text: "TIME LIMIT REACHED. This call must end now. In one short sentence tell the caller the team will pick this up when the office reopens, say goodbye, and call end_call."
          }]
        }
      });
      this.send({ type: "response.create" });
    }, wrapUpAt));
    this.limitTimers.push(setTimeout(() => {
      if (this.phase !== "live") return;
      this.notice("Time limit reached. Ending the call.");
      this.reportEvent("time_limit_reached", { max_call_seconds: this.maxCallSeconds });
      this.end("time_limit");
    }, this.maxCallSeconds * 1000));
  }

  clearCallLimit() {
    for (const timer of this.limitTimers) clearTimeout(timer);
    this.limitTimers = [];
    if (this.hangup?.failsafe) clearTimeout(this.hangup.failsafe);
  }

  handleRealtimeError(error) {
    const message = String(error?.message || "Unknown realtime error");
    if (IGNORED_ERROR_PATTERNS.some((pattern) => pattern.test(message))) return;
    this.stats.realtime_errors += 1;
    this.notice(`Realtime: ${message.slice(0, 200)}`);
    this.reportEvent("realtime_error", { code: error?.code || "", message: message.slice(0, 300) });
  }

  handleConnectionState(state) {
    if (this.phase !== "live" && this.phase !== "connecting") return;
    if (state === "disconnected") {
      this.notice("The connection dropped. Trying to recover...");
      this.reportEvent("webrtc_disconnected", {});
      return;
    }
    if (state === "failed" || state === "closed") {
      this.reportEvent("webrtc_lost", { state });
      if (this.phase === "live") {
        this.handlers.error("The live connection was lost. The call has been ended and saved.");
        this.end("connection_lost");
      }
    }
  }

  handleChannelClosed() {
    if (this.phase === "live" && !this.endPromise) {
      this.reportEvent("datachannel_closed", {});
      this.handlers.error("The receptionist disconnected. The call has been ended and saved.");
      this.end("connection_lost");
    }
  }

  // -------------------------------------------------------------------------
  // End sequence
  // -------------------------------------------------------------------------

  async performEnd(reason) {
    this.lastEndReason = reason;
    this.clearCallLimit();
    const wasLive = this.phase === "live" || this.phase === "connecting";
    const endingMessage = reason.startsWith("assistant_hung_up")
      ? "The receptionist ended the call."
      : reason === "time_limit"
        ? "Time limit reached. Ending the call."
        : "Ending the call...";
    this.setPhase("ending", "idle", endingMessage);
    this.endedAt = new Date().toISOString();
    this.markLatestAssistantPartial();
    await this.teardownMedia();

    if (!this.callId) {
      this.setPhase("ended", "idle", "Call ended before it was recorded.");
      return null;
    }
    if (!wasLive && !this.connectedAt) {
      // Never connected: record the abandonment so the row is not left open.
      this.setPhase("processing", "idle", "Saving...");
      return this.finalise(reason === "caller_ended" ? "abandoned_before_connect" : reason);
    }
    this.setPhase("processing", "idle", "Call ended. Summarising and saving...");
    return this.finalise(reason);
  }

  async finalise(reason) {
    const payload = {
      ended_at: this.endedAt,
      connected_at: this.connectedAt,
      reason,
      transcript: this.transcript,
      client_stats: { ...this.stats, model: this.model, muted_at_end: this.muted ? 1 : 0 }
    };
    try {
      const response = await fetch(`/api/reception/calls/${this.callId}/finalise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Saving the call failed (HTTP ${response.status}).`);
      this.result = data;
      this.setPhase("ended", "idle", "Call saved.");
      this.handlers.ended(data);
      return data;
    } catch (error) {
      const message = `The call ended but could not be saved: ${error.message}`;
      this.errorMessage = message;
      this.setPhase("error", "idle", message);
      this.handlers.error(message);
      throw new Error(message);
    }
  }

  async teardownMedia() {
    this.stopLevelMeter();
    this.clearCallLimit();
    try { this.dc?.close(); } catch { /* already closed */ }
    try { this.pc?.close(); } catch { /* already closed */ }
    for (const track of this.stream?.getTracks?.() || []) {
      try { track.stop(); } catch { /* already stopped */ }
    }
    if (this.audioElement) {
      try { this.audioElement.pause(); } catch { /* not playing */ }
      this.audioElement.srcObject = null;
      this.audioElement.remove?.();
    }
    if (this.audioContext) {
      try { await this.audioContext.close(); } catch { /* already closed */ }
    }
    this.dc = null;
    this.pc = null;
    this.stream = null;
    this.audioElement = null;
    this.audioContext = null;
    this.analyser = null;
  }

  // -------------------------------------------------------------------------
  // Level meter (local microphone only; no audio is recorded)
  // -------------------------------------------------------------------------

  startLevelMeter() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context || !this.stream) return;
    try {
      this.audioContext = new Context();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      source.connect(this.analyser);
      const buffer = new Uint8Array(this.analyser.fftSize);
      const tick = () => {
        if (!this.analyser) return;
        this.analyser.getByteTimeDomainData(buffer);
        let sum = 0;
        for (const sample of buffer) {
          const centred = (sample - 128) / 128;
          sum += centred * centred;
        }
        const rms = Math.sqrt(sum / buffer.length);
        this.handlers.level(this.muted ? 0 : Math.min(1, rms * 4));
        this.levelFrame = requestAnimationFrame(tick);
      };
      this.levelFrame = requestAnimationFrame(tick);
    } catch {
      // The meter is cosmetic; the call works without it.
    }
  }

  stopLevelMeter() {
    if (this.levelFrame) cancelAnimationFrame(this.levelFrame);
    this.levelFrame = 0;
    this.handlers.level(0);
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  send(event) {
    if (this.dc?.readyState !== "open") return false;
    this.dc.send(JSON.stringify(event));
    return true;
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
    this.handlers.transcript(this.entries.map((entry) => ({ ...entry })));
  }

  setAi(state) {
    if (this.ai === state) return;
    this.ai = state;
    this.emitState();
  }

  setPhase(phase, ai, message = "") {
    this.phase = phase;
    this.ai = ai;
    this.statusMessage = message;
    this.emitState();
  }

  emitState() {
    this.handlers.state({
      phase: this.phase,
      ai: this.ai,
      muted: this.muted,
      message: this.statusMessage || "",
      callId: this.callId,
      connectedAt: this.connectedAt,
      model: this.model
    });
  }

  notice(message) {
    this.notices.push({ at: new Date().toISOString(), message });
    this.handlers.notice(message);
  }

  reportEvent(type, detail) {
    if (!this.callId) return;
    fetch(`/api/reception/calls/${this.callId}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, detail }),
      keepalive: true
    }).catch(() => {});
  }
}

export function friendlyStartError(error) {
  const name = error?.name || "";
  const message = String(error?.message || error || "");
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
    return "Microphone permission was denied. Allow the microphone for this site in the browser's address bar, then start the call again.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") {
    return "No microphone was found. Plug one in or check the browser's sound settings, then try again.";
  }
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") {
    return "The microphone is in use by another application or could not be started. Close other apps using it and try again.";
  }
  return message || "The call could not be started.";
}
