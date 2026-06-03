import { EmailMessage } from "cloudflare:email";

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const expected = env.LEAD_EMAIL_WEBHOOK_SECRET;
    const actual = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!expected || actual !== expected) return json({ error: "Unauthorized" }, 401);

    const body = await request.json().catch(() => ({}));
    const subject = cleanSubject(body.subject || "Facebook message lead");
    const content = String(body.body || "").trim();
    if (!content) return json({ error: "Missing email body" }, 400);

    const message = new EmailMessage(
      "noreply@fensterglazing.com",
      "info@fensterglazing.com",
      createPlainTextEmail(subject, content)
    );
    await env.LEAD_EMAIL.send(message);
    return json({ ok: true });
  }
};

function cleanSubject(value) {
  return String(value).replace(/[\r\n]+/g, " ").trim().slice(0, 140) || "Facebook message lead";
}

function createPlainTextEmail(subject, body) {
  const headers = [
    "From: Fenster Meta Bot <noreply@fensterglazing.com>",
    "To: info@fensterglazing.com",
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit"
  ];
  return `${headers.join("\r\n")}\r\n\r\n${body}`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
