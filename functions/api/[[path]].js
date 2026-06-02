import { USERS } from "../_data/users.js";

const TABLES = {
  tickets: ["title", "requester", "category", "priority", "status", "owner", "detail"],
  ideas: ["title", "author", "impact", "status", "detail"],
  tasks: ["title", "lane", "owner", "due_date", "done"],
  content_requests: ["title", "requester", "asset_type", "deadline", "status", "detail"],
  website_updates: ["title", "area", "status", "release_date", "detail"],
  changelog: ["title", "shipped_at", "area", "detail"]
};

const ALLOWED_TABLES = new Set(Object.keys(TABLES));

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const route = url.pathname.replace(/^\/api\/?/, "");

  try {
    if (route === "login" && context.request.method === "POST") return login(context);
    if (route === "logout") return logout(context);

    const user = await getUser(context.request, context.env);
    if (!user) return json({ error: "Not signed in" }, 401);

    if (route === "me") return json({ user });
    if (route === "bootstrap") return bootstrap(context.env);
    if (route.startsWith("records/")) return records(context, route.replace("records/", ""));
    if (route.startsWith("notes/")) return notes(context, route.replace("notes/", ""), user);

    return json({ error: "Not found" }, 404);
  } catch (error) {
    return json({ error: error.message || "Something went wrong" }, 500);
  }
}

async function login({ request, env }) {
  const body = await request.json();
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  const found = USERS.find((user) => user.username === username && env[user.passwordSecret] === password);

  if (!found) return json({ error: "Wrong username or password" }, 401);

  const publicUser = { name: found.name, username: found.username, role: found.role };
  const session = await signSession(publicUser, env);
  const cookie = cookieOptions(request);
  return json(
    { user: publicUser },
    200,
    { "Set-Cookie": `md_session=${session}; ${cookie}; Max-Age=604800` }
  );
}

function logout({ request } = {}) {
  const cookie = request ? cookieOptions(request) : "Path=/; HttpOnly; Secure; SameSite=Lax";
  return json({ ok: true }, 200, {
    "Set-Cookie": `md_session=; ${cookie}; Max-Age=0`
  });
}

function cookieOptions(request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `Path=/; HttpOnly${secure}; SameSite=Lax`;
}

async function bootstrap(env) {
  const data = {};
  for (const table of Object.keys(TABLES)) {
    data[table] = await selectAll(env, table);
  }
  return json(data);
}

async function records(context, table) {
  const { request, env } = context;
  if (!ALLOWED_TABLES.has(table)) return json({ error: "Unknown table" }, 404);

  if (request.method === "GET") return json(await selectAll(env, table));

  if (request.method === "POST") {
    const body = sanitize(await request.json(), TABLES[table]);
    const keys = Object.keys(body);
    if (!keys.length || !body.title) return json({ error: "A title is required" }, 400);

    const placeholders = keys.map(() => "?").join(", ");
    const result = await env.DB.prepare(
      `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`
    ).bind(...keys.map((key) => body[key])).run();

    return json((await selectOne(env, table, result.meta.last_row_id)) || body, 201);
  }

  if (request.method === "PATCH") {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) return json({ error: "An id is required" }, 400);

    const updates = sanitize(body, TABLES[table]);
    delete updates.id;
    const keys = Object.keys(updates);
    if (!keys.length) return json({ error: "No valid fields to update" }, 400);

    await env.DB.prepare(
      `UPDATE ${table} SET ${keys.map((key) => `${key} = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(...keys.map((key) => updates[key]), id).run();

    return json(await selectOne(env, table, id));
  }

  return json({ error: "Method not allowed" }, 405);
}

async function notes(context, target, user) {
  const { request, env } = context;
  const [parentType, parentId] = target.split("/");
  const id = Number(parentId);
  if (!ALLOWED_TABLES.has(parentType) || !id) return json({ error: "Invalid note target" }, 400);

  if (request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT * FROM notes WHERE parent_type = ? AND parent_id = ? ORDER BY created_at DESC"
    ).bind(parentType, id).all();
    return json(rows.results || []);
  }

  if (request.method === "POST") {
    const body = await request.json();
    const text = String(body.body || "").trim();
    if (!text) return json({ error: "A note body is required" }, 400);
    await env.DB.prepare(
      "INSERT INTO notes (parent_type, parent_id, author, body) VALUES (?, ?, ?, ?)"
    ).bind(parentType, id, user.name, text).run();
    return notes({ request: new Request(request.url, { method: "GET" }), env }, target, user);
  }

  return json({ error: "Method not allowed" }, 405);
}

async function selectAll(env, table) {
  const rows = await env.DB.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all();
  return rows.results || [];
}

async function selectOne(env, table, id) {
  const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
  return row || null;
}

function sanitize(body, allowed) {
  const clean = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      clean[key] = key === "done" ? Number(Boolean(body[key])) : String(body[key] ?? "").trim();
    }
  }
  return clean;
}

async function getUser(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.match(/(?:^|;\s*)md_session=([^;]+)/)?.[1];
  if (!token) return null;

  const payload = await verifySession(token, env);
  if (!payload || payload.exp < Date.now()) return null;
  return payload.user;
}

async function signSession(user, env) {
  const payload = { user, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  const body = base64Url(JSON.stringify(payload));
  const sig = await hmac(body, env.SESSION_SECRET || "change-this-session-secret");
  return `${body}.${sig}`;
}

async function verifySession(token, env) {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await hmac(body, env.SESSION_SECRET || "change-this-session-secret");
  if (sig !== expected) return null;
  const padded = body.padEnd(body.length + (4 - body.length % 4) % 4, "=");
  return JSON.parse(atob(padded.replace(/-/g, "+").replace(/_/g, "/")));
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64Url(String.fromCharCode(...new Uint8Array(signature)));
}

function base64Url(value) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}
