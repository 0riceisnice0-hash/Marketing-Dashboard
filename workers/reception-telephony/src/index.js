/*
 * Fenster AI Receptionist: telephone transport Worker.
 *
 *   POST /twilio/voice     TwiML for an incoming call on the Twilio number
 *   POST /twilio/after     TwiML once the SIP leg ends
 *   POST /openai/webhook   OpenAI realtime.call.incoming -> Durable Object
 *   GET  /health           configuration check (no secrets revealed)
 *
 * See workers/reception-telephony/wrangler.toml for the secrets it needs.
 */

import { json } from "../../../functions/_lib/http.js";
import { handleTwilioVoice, handleTwilioAfter } from "./twilio.js";
import { handleOpenAiWebhook } from "./openai-webhook.js";
import { ReceptionCallSession } from "./call-session.js";

export { ReceptionCallSession };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
        return json({
          ok: true,
          service: "fenster-reception-telephony",
          configured: {
            openai_api_key: Boolean(env.OPENAI_API_KEY),
            openai_webhook_secret: Boolean(env.OPENAI_WEBHOOK_SECRET),
            openai_project_id: Boolean(env.OPENAI_PROJECT_ID),
            twilio_auth_token: Boolean(env.TWILIO_AUTH_TOKEN),
            database: Boolean(env.DB),
            call_sessions: Boolean(env.CALL_SESSIONS)
          },
          endpoints: {
            twilio_voice: new URL("/twilio/voice", request.url).toString(),
            openai_webhook: new URL("/openai/webhook", request.url).toString()
          }
        });
      }
      if (request.method === "POST" && url.pathname === "/twilio/voice") return await handleTwilioVoice(request, env);
      if (request.method === "POST" && url.pathname === "/twilio/after") return await handleTwilioAfter(request, env);
      if (request.method === "POST" && url.pathname === "/openai/webhook") return await handleOpenAiWebhook(request, env);
      return json({ error: "Not found" }, 404);
    } catch (error) {
      console.error("reception-telephony error", error);
      return json({ error: "Something went wrong" }, 500);
    }
  }
};
