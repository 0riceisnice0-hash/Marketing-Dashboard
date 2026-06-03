import { onRequest } from "../functions/api/[[path]].js";

const tables = {
  tickets: [],
  ideas: [],
  tasks: [],
  todays_plan: [],
  content_requests: [],
  website_updates: [],
  changelog: [],
  notes: [],
  fenster_conversations: [],
  fenster_messages: [],
  fenster_reviews: [],
  fenster_events: []
};

let nextId = 1;

const env = {
  SESSION_SECRET: "test-secret",
  PASSWORD_ZAC: "test-password",
  PASSWORD_ADAM: "test-password",
  PASSWORD_NICK: "test-password",
  DB: {
    prepare(sql) {
      const statement = { sql, values: [] };
      statement.bind = (...values) => {
        statement.values = values;
        return statement;
      };
      statement.all = async () => queryAll(statement);
      statement.first = async () => queryFirst(statement);
      statement.run = async () => run(statement);
      return statement;
    }
  }
};

const base = "http://local.test";

const login = await call("/api/login", {
  method: "POST",
  body: JSON.stringify({ username: "zac", password: "test-password" })
});

assert(login.status === 200, "login should work");
const cookie = login.headers.get("Set-Cookie");

const me = await call("/api/me", { headers: { Cookie: cookie } });
assert(me.status === 200, "session should verify");

const ticket = await call("/api/records/tickets", {
  method: "POST",
  headers: { Cookie: cookie },
  body: JSON.stringify({
    title: "Smoke test ticket",
    requester: "Zac",
    category: "Marketing",
    priority: "Normal",
    status: "New",
    owner: "Zac",
    detail: "Created by smoke test."
  })
});

assert(ticket.status === 201, "ticket create should work");

const bootstrap = await call("/api/bootstrap", { headers: { Cookie: cookie } });
const data = await bootstrap.json();
assert(data.tickets.some((item) => item.title === "Smoke test ticket"), "bootstrap should include new ticket");

const plan = await call("/api/records/todays_plan", {
  method: "POST",
  headers: { Cookie: cookie },
  body: JSON.stringify({
    title: "Smoke test plan",
    owner: "Zac",
    status: "Planned",
    notes: "Created by smoke test.",
    updated_by: "Zac"
  })
});

assert(plan.status === 201, "today's plan create should work");

const seed = await call("/api/fenster/demo/seed", {
  method: "POST",
  headers: { Cookie: cookie },
  body: "{}"
});

assert(seed.status === 200, "Fenster demo seed should work");
const seeded = await seed.json();
assert(seeded.conversations.length >= 2, "Fenster state should include seeded conversations");

console.log("Smoke test passed");

async function call(path, init = {}) {
  const request = new Request(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
  return onRequest({ request, env });
}

function queryAll({ sql, values }) {
  const table = tableFrom(sql);
  if (sql.includes("WHERE parent_type")) {
    const [parentType, parentId] = values;
    return { results: tables.notes.filter((note) => note.parent_type === parentType && note.parent_id === parentId) };
  }
  return { results: [...tables[table]].sort((a, b) => b.id - a.id) };
}

function queryFirst({ sql, values }) {
  const table = tableFrom(sql);
  if (!sql.includes("WHERE")) return tables[table][0] || null;
  return tables[table].find((item) => item.id === values[0]) || null;
}

function run({ sql, values }) {
  const table = tableFrom(sql);
  if (sql.startsWith("INSERT")) {
    const columns = sql.match(/\(([^)]+)\)/)[1].split(",").map((value) => value.trim());
    const item = { id: nextId++ };
    columns.forEach((column, index) => {
      item[column] = values[index];
    });
    tables[table].push(item);
    return { meta: { last_row_id: item.id } };
  }
  if (sql.startsWith("UPDATE")) {
    const item = tables[table].find((row) => row.id === values.at(-1));
    const columns = sql.match(/SET (.+), updated_at/)[1].split(",").map((part) => part.split("=")[0].trim());
    columns.forEach((column, index) => {
      item[column] = values[index];
    });
  }
  return { meta: {} };
}

function tableFrom(sql) {
  const match = sql.match(/(?:FROM|INTO|UPDATE)\s+([a-z_]+)/);
  if (!match) throw new Error(`Could not detect table from SQL: ${sql}`);
  return match[1];
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
