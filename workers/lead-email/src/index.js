export default {
  async fetch(request, env) {
    try {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

      const expected = env.LEAD_EMAIL_WEBHOOK_SECRET;
      const actual = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!expected || actual !== expected) return json({ error: "Unauthorized" }, 401);

      const body = await request.json().catch(() => ({}));
      const subject = cleanSubject(body.subject || "Facebook message lead");
      const content = String(body.body || "").trim();
      if (!content) return json({ error: "Missing email body" }, 400);
      if (!env.RESEND_API_KEY) return json({ error: "Missing Resend API key" }, 500);

      const from = cleanAddress(env.LEAD_EMAIL_FROM || "fenster-leads@hydronapplications.co.uk");
      const to = cleanAddress(env.LEAD_EMAIL_TO || "info@fensterglazing.com");
      const result = await sendWithResend(
        env.RESEND_API_KEY,
        from,
        to,
        subject,
        content
      );
      return json({ ok: true, id: result.id || null });
    } catch (error) {
      console.error("Lead email failed", error);
      return json({ error: "Email send failed", detail: error?.message || String(error) }, 500);
    }
  }
};

function cleanSubject(value) {
  return String(value).replace(/[\r\n]+/g, " ").trim().slice(0, 140) || "Facebook message lead";
}

function cleanAddress(value) {
  return String(value).replace(/[\r\n<>]+/g, "").trim();
}

async function sendWithResend(apiKey, from, to, subject, text) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;line-height:1.5">${escapeHtml(text)}</pre>`
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Resend returned ${response.status}`);
  }
  return data;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
