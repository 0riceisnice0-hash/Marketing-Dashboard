const tabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "tickets", label: "Tickets" },
  { id: "ideas", label: "Ideas" },
  { id: "roadmap", label: "Roadmap" },
  { id: "website", label: "Website" },
  { id: "content", label: "Content" },
  { id: "tools", label: "Tools" },
  { id: "changelog", label: "Changelog" }
];

const config = {
  tickets: {
    table: "tickets",
    title: "Ticket",
    fields: [
      ["title", "Title", "text"],
      ["requester", "Requester", "text"],
      ["category", "Category", "select", ["Marketing", "Website", "Content", "Reporting", "Showroom", "Other"]],
      ["priority", "Priority", "select", ["Low", "Normal", "Urgent", "Boss panic mode"]],
      ["status", "Status", "select", ["New", "In Progress", "Waiting on Someone", "Done"]],
      ["owner", "Owner", "select", ["Zac", "Adam", "Nick"]],
      ["detail", "Detail", "textarea"]
    ]
  },
  ideas: {
    table: "ideas",
    title: "Idea",
    fields: [
      ["title", "Title", "text"],
      ["author", "Author", "text"],
      ["impact", "Impact", "select", ["Low", "Medium", "High"]],
      ["status", "Status", "select", ["Inbox", "Considering", "Approved", "Parked", "Done"]],
      ["detail", "Detail", "textarea"]
    ]
  },
  tasks: {
    table: "tasks",
    title: "Task",
    fields: [
      ["title", "Title", "text"],
      ["lane", "Lane", "select", ["Today", "This Week", "Later"]],
      ["owner", "Owner", "select", ["Zac", "Adam", "Nick"]],
      ["due_date", "Due date", "date"]
    ]
  },
  content_requests: {
    table: "content_requests",
    title: "Content request",
    fields: [
      ["title", "Title", "text"],
      ["requester", "Requester", "text"],
      ["asset_type", "Asset type", "select", ["Photo", "Video", "Review", "Case study", "Showroom", "Product info"]],
      ["deadline", "Deadline", "date"],
      ["status", "Status", "select", ["Needed", "Requested", "Received", "Used"]],
      ["detail", "Detail", "textarea"]
    ]
  },
  website_updates: {
    table: "website_updates",
    title: "Website update",
    fields: [
      ["title", "Title", "text"],
      ["area", "Area", "select", ["Homepage", "Product page", "Gallery", "SEO", "Forms", "Tracking", "Changelog"]],
      ["status", "Status", "select", ["Planned", "In Progress", "Live", "Blocked"]],
      ["release_date", "Release date", "date"],
      ["detail", "Detail", "textarea"]
    ]
  },
  changelog: {
    table: "changelog",
    title: "Changelog entry",
    fields: [
      ["title", "Title", "text"],
      ["shipped_at", "Shipped at", "date"],
      ["area", "Area", "select", ["Marketing", "Website", "Content", "Tools", "Operations"]],
      ["detail", "Detail", "textarea"]
    ]
  }
};

let state = {};
let current = "dashboard";
let user = null;

const $ = (selector) => document.querySelector(selector);
const view = $("#view");
const modal = $("#modal");

boot();

async function boot() {
  wireLogin();
  wireChrome();
  const me = await api("/api/me", { allowFail: true });
  if (me?.user) {
    user = me.user;
    await loadApp();
  }
}

function wireLogin() {
  $("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    $("#login-error").textContent = "";
    const form = new FormData(event.currentTarget);
    const result = await api("/api/login", {
      method: "POST",
      body: Object.fromEntries(form),
      allowFail: true
    });
    if (result?.error) {
      $("#login-error").textContent = result.error;
      return;
    }
    user = result.user;
    await loadApp();
  });
}

function wireChrome() {
  $("#tabs").innerHTML = tabs.map((tab) => `<button data-tab="${tab.id}" aria-selected="false"><span>${tab.label}</span></button>`).join("");
  $("#tabs").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tab]");
    if (!button) return;
    current = button.dataset.tab;
    render();
  });
  $("#quick-add").addEventListener("click", () => openModal("tickets"));
  $("#logout").addEventListener("click", async () => {
    await api("/api/logout");
    location.reload();
  });
  $("#modal-submit").addEventListener("click", saveModal);
}

async function loadApp() {
  $("#login").hidden = true;
  $("#app").hidden = false;
  $("#active-user").textContent = `${user.name} · ${user.role}`;
  state = await api("/api/bootstrap");
  render();
}

function render() {
  $("#view-title").textContent = tabs.find((tab) => tab.id === current)?.label || "Dashboard";
  document.querySelectorAll("#tabs button").forEach((button) => {
    button.setAttribute("aria-selected", String(button.dataset.tab === current));
  });

  const renderers = {
    dashboard: renderDashboard,
    tickets: () => renderBoard("tickets", "status", ["New", "In Progress", "Waiting on Someone", "Done"]),
    ideas: () => renderBoard("ideas", "status", ["Inbox", "Considering", "Approved", "Parked", "Done"]),
    roadmap: renderRoadmap,
    website: renderWebsite,
    content: () => renderBoard("content_requests", "status", ["Needed", "Requested", "Received", "Used"]),
    tools: renderTools,
    changelog: renderChangelog
  };

  renderers[current]();
}

function renderDashboard() {
  const openTickets = (state.tickets || []).filter((item) => item.status !== "Done");
  const urgent = openTickets.filter((item) => ["Urgent", "Boss panic mode"].includes(item.priority));
  const contentNeeded = (state.content_requests || []).filter((item) => item.status !== "Used");
  const websiteLive = (state.website_updates || []).filter((item) => item.status === "Live");

  view.innerHTML = `
    <div class="grid stats">
      ${stat("Open tickets", openTickets.length, "Needs movement")}
      ${stat("Urgent", urgent.length, "Priority queue")}
      ${stat("Content asks", contentNeeded.length, "Assets to chase")}
      ${stat("Website updates", websiteLive.length, "Live updates")}
    </div>
    <div class="grid two" style="margin-top:16px">
      <section class="panel">
        <h3>Current focus</h3>
        <div class="card-list">${cards((state.tasks || []).filter((task) => task.lane === "Today" && !Number(task.done)), "tasks")}</div>
      </section>
      <section class="panel">
        <h3>Recent shipped</h3>
        <div class="card-list">${cards((state.changelog || []).slice(0, 5), "changelog")}</div>
      </section>
    </div>
    <div class="grid two" style="margin-top:16px">
      <section class="panel">
        <h3>Waiting on someone</h3>
        <div class="card-list">${cards(openTickets.filter((ticket) => ticket.status === "Waiting on Someone"), "tickets")}</div>
      </section>
      <section class="panel">
        <h3>Website queue</h3>
        <div class="card-list">${cards((state.website_updates || []).filter((item) => item.status !== "Live").slice(0, 5), "website_updates")}</div>
      </section>
    </div>
  `;
}

function renderBoard(table, groupKey, groups) {
  view.innerHTML = `
    <div class="actions" style="margin-bottom:14px">
      <button onclick="window.dashboardOpen('${table}')">New ${config[table].title.toLowerCase()}</button>
    </div>
    <div class="grid columns">
      ${groups.map((group) => `
        <section class="column">
          <h3>${group}</h3>
          <div class="card-list">${cards((state[table] || []).filter((item) => item[groupKey] === group), table)}</div>
        </section>
      `).join("")}
    </div>
  `;
}

function renderRoadmap() {
  const tasks = state.tasks || [];
  view.innerHTML = `
    <div class="actions" style="margin-bottom:14px">
      <button onclick="window.dashboardOpen('tasks')">New task</button>
    </div>
    <div class="grid columns">
      ${["Today", "This Week", "Later"].map((lane) => `
        <section class="column">
          <h3>${lane}</h3>
          <div class="card-list">${cards(tasks.filter((task) => task.lane === lane && !Number(task.done)), "tasks")}</div>
        </section>
      `).join("")}
    </div>
  `;
}

function renderWebsite() {
  view.innerHTML = `
    <div class="actions" style="margin-bottom:14px">
      <button onclick="window.dashboardOpen('website_updates')">New website update</button>
      <button onclick="window.dashboardOpen('changelog')">Log shipped change</button>
    </div>
    <div class="grid two">
      <section class="panel">
        <h3>Website work</h3>
        <div class="card-list">${cards(state.website_updates || [], "website_updates")}</div>
      </section>
      <section class="panel">
        <h3>Latest updates</h3>
        <div class="card-list">${cards((state.changelog || []).filter((item) => ["Website", "Tools"].includes(item.area)).slice(0, 8), "changelog")}</div>
      </section>
    </div>
  `;
}

function renderTools() {
  const tools = [
    ["Facebook messaging app", "Reserved for the Meta API module when you are ready to add it."],
    ["Lead scrapers", "A place to launch or document lead collection tools."],
    ["Prompt templates", "Reusable marketing, SEO, review reply, and product copy prompts."],
    ["Reporting links", "Ads, Search Console, analytics, call tracking, and ranking dashboards."],
    ["Asset library", "Future home for R2-backed photos, videos, screenshots, and brand files."],
    ["Automation notes", "Campaign routines, weekly jobs, and checks that should become Workers later."]
  ];
  view.innerHTML = `<div class="tool-grid">${tools.map(([name, text]) => `<article class="tool"><h3>${name}</h3><p>${text}</p></article>`).join("")}</div>`;
}

function renderChangelog() {
  view.innerHTML = `
    <div class="actions" style="margin-bottom:14px">
      <button onclick="window.dashboardOpen('changelog')">New changelog entry</button>
    </div>
    <table class="table">
      <thead><tr><th>Shipped</th><th>Area</th><th>Update</th><th>Detail</th></tr></thead>
      <tbody>${(state.changelog || []).map((item) => `
        <tr><td>${escapeHtml(item.shipped_at || "")}</td><td>${escapeHtml(item.area || "")}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.detail || "")}</td></tr>
      `).join("")}</tbody>
    </table>
  `;
}

function stat(label, value, caption) {
  return `<article class="panel stat"><span>${label}</span><strong>${value}</strong><span>${caption}</span></article>`;
}

function cards(items, table) {
  if (!items.length) return `<p class="empty">Nothing here.</p>`;
  return items.map((item) => card(item, table)).join("");
}

function card(item, table) {
  const detail = item.detail ? `<p>${escapeHtml(item.detail)}</p>` : "";
  const chips = Object.entries(item)
    .filter(([key, value]) => value && ["status", "priority", "owner", "requester", "author", "area", "asset_type", "lane", "due_date", "deadline"].includes(key))
    .map(([key, value]) => `<span class="pill ${key}-${slug(value)}">${escapeHtml(value)}</span>`)
    .join("");
  const actions = actionButtons(item, table);
  return `
    <article class="card">
      <header><h4>${escapeHtml(item.title || "Untitled")}</h4><span class="pill">#${item.id}</span></header>
      ${detail}
      <div class="meta">${chips}</div>
      ${actions}
    </article>
  `;
}

function actionButtons(item, table) {
  if (table === "tasks") {
    return `<div class="actions"><button onclick="window.dashboardPatch('${table}', ${item.id}, {done: 1})">Done</button></div>`;
  }
  if (table === "tickets") {
    return `<div class="actions">${["In Progress", "Waiting on Someone", "Done"].map((status) => `<button onclick="window.dashboardPatch('${table}', ${item.id}, {status: '${status}'})">${status}</button>`).join("")}</div>`;
  }
  if (table === "content_requests") {
    return `<div class="actions">${["Requested", "Received", "Used"].map((status) => `<button onclick="window.dashboardPatch('${table}', ${item.id}, {status: '${status}'})">${status}</button>`).join("")}</div>`;
  }
  if (table === "website_updates") {
    return `<div class="actions">${["In Progress", "Live", "Blocked"].map((status) => `<button onclick="window.dashboardPatch('${table}', ${item.id}, {status: '${status}'})">${status}</button>`).join("")}</div>`;
  }
  return "";
}

function openModal(table) {
  const itemConfig = config[table];
  $("#modal-title").textContent = `New ${itemConfig.title.toLowerCase()}`;
  $("#modal-fields").innerHTML = itemConfig.fields.map(fieldHtml).join("");
  modal.dataset.table = table;
  modal.showModal();
}

function fieldHtml([name, label, type, options]) {
  if (type === "textarea") return `<label>${label}<textarea name="${name}"></textarea></label>`;
  if (type === "select") {
    return `<label>${label}<select name="${name}">${options.map((option) => `<option>${option}</option>`).join("")}</select></label>`;
  }
  return `<label>${label}<input name="${name}" type="${type}"></label>`;
}

async function saveModal(event) {
  event.preventDefault();
  const table = modal.dataset.table;
  const form = new FormData($("#modal form"));
  const created = await api(`/api/records/${table}`, { method: "POST", body: Object.fromEntries(form) });
  state[table] = [created, ...(state[table] || [])];
  modal.close();
  render();
}

async function patchRecord(table, id, patch) {
  const updated = await api(`/api/records/${table}`, { method: "PATCH", body: { id, ...patch } });
  state[table] = (state[table] || []).map((item) => item.id === id ? updated : item);
  render();
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: options.body ? { "Content-Type": "application/json" } : {},
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok && !options.allowFail) throw new Error(data.error || "Request failed");
  return data;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

window.dashboardOpen = openModal;
window.dashboardPatch = patchRecord;
