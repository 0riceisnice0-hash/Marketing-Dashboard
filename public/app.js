const tabs = [
  { id: "dashboard", label: "Dashboard", icon: "D" },
  { id: "tickets", label: "Tickets", icon: "T" },
  { id: "ideas", label: "Ideas", icon: "I" },
  { id: "roadmap", label: "Roadmap", icon: "R" },
  { id: "website", label: "Website", icon: "W" },
  { id: "content", label: "Content", icon: "C" },
  { id: "tools", label: "Tools", icon: "A" },
  { id: "changelog", label: "Changelog", icon: "L" }
];

const viewCopy = {
  dashboard: "What needs attention, what is waiting, and what shipped recently.",
  tickets: "Requests from the team, moved through a clear status board.",
  ideas: "A holding area for good ideas before they interrupt the actual work.",
  roadmap: "Today, this week, and later, without the noise.",
  website: "Website changes, launch notes, and visible progress for the team.",
  content: "Photos, reviews, videos, showroom assets, and case study requests.",
  tools: "The future tool drawer for automations, Meta work, reports, and templates.",
  changelog: "A clean history of what has been shipped."
};

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
  $("#tabs").innerHTML = tabs.map((tab) => `
    <button data-tab="${tab.id}" aria-selected="false">
      <span class="nav-icon">${tab.icon}</span>
      <span>${tab.label}</span>
    </button>
  `).join("");
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
  window.scrollTo({ top: 0, behavior: "instant" });
  $("#active-user").textContent = `${user.name} - ${user.role}`;
  state = await api("/api/bootstrap");
  render();
}

function render() {
  $("#view-title").textContent = tabs.find((tab) => tab.id === current)?.label || "Dashboard";
  document.querySelector(".topbar .eyebrow").textContent = viewCopy[current] || "Live marketing command desk";
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
  const waiting = openTickets.filter((ticket) => ticket.status === "Waiting on Someone");
  const today = (state.tasks || []).filter((task) => task.lane === "Today" && !Number(task.done));

  view.innerHTML = `
    <div class="grid stats">
      ${stat("Open tickets", openTickets.length, "Requests not done yet", "#215ed3")}
      ${stat("Urgent", urgent.length, "Needs eyes first", "#c23a34")}
      ${stat("Content asks", contentNeeded.length, "Assets to chase", "#a35e00")}
      ${stat("Website live", websiteLive.length, "Visible updates shipped", "#12825a")}
    </div>
    <div class="grid two" style="margin-top:16px">
      <section class="panel">
        ${panelHeader("Current focus", "The short list Zac can work from today.", today.length)}
        <div class="card-list">${cards(today, "tasks")}</div>
      </section>
      <section class="panel">
        ${panelHeader("Recent shipped", "The wins people can see without asking.", (state.changelog || []).length)}
        <div class="card-list">${cards((state.changelog || []).slice(0, 5), "changelog")}</div>
      </section>
    </div>
    <div class="grid two" style="margin-top:16px">
      <section class="panel">
        ${panelHeader("Waiting on someone", "Chase these before they quietly stall.", waiting.length)}
        <div class="card-list">${cards(waiting, "tickets")}</div>
      </section>
      <section class="panel">
        ${panelHeader("Website queue", "Planned site changes and live work.", (state.website_updates || []).filter((item) => item.status !== "Live").length)}
        <div class="card-list">${cards((state.website_updates || []).filter((item) => item.status !== "Live").slice(0, 5), "website_updates")}</div>
      </section>
    </div>
  `;
}

function renderBoard(table, groupKey, groups) {
  const allItems = state[table] || [];
  view.innerHTML = `
    <div class="board-tools">
      <p><strong>${config[table].title}s</strong><br>${boardHint(table)}</p>
      <button class="primary-button" onclick="window.dashboardOpen('${table}')">New ${config[table].title.toLowerCase()}</button>
    </div>
    <div class="grid columns">
      ${groups.map((group) => `
        <section class="column">
          ${columnHeader(group, allItems.filter((item) => item[groupKey] === group).length)}
          <div class="card-list">${cards(allItems.filter((item) => item[groupKey] === group), table)}</div>
        </section>
      `).join("")}
    </div>
  `;
}

function renderRoadmap() {
  const tasks = state.tasks || [];
  view.innerHTML = `
    <div class="board-tools">
      <p><strong>Marketing roadmap</strong><br>Keep the day calm: today is action, this week is commitment, later is parking.</p>
      <button class="primary-button" onclick="window.dashboardOpen('tasks')">New task</button>
    </div>
    <div class="grid columns three">
      ${["Today", "This Week", "Later"].map((lane) => `
        <section class="column">
          ${columnHeader(lane, tasks.filter((task) => task.lane === lane && !Number(task.done)).length)}
          <div class="card-list">${cards(tasks.filter((task) => task.lane === lane && !Number(task.done)), "tasks")}</div>
        </section>
      `).join("")}
    </div>
  `;
}

function renderWebsite() {
  const live = (state.website_updates || []).filter((item) => item.status === "Live");
  const active = (state.website_updates || []).filter((item) => item.status !== "Live");
  view.innerHTML = `
    <div class="board-tools">
      <p><strong>Website workbench</strong><br>Track the actual website work here: copy, SEO, products, forms, launches, and fixes.</p>
      <div class="actions" style="margin-top:0">
        <button onclick="window.dashboardOpen('website_updates')">New website update</button>
        <button onclick="window.dashboardOpen('changelog')">Log shipped change</button>
      </div>
    </div>
    <div class="grid two">
      <section class="panel">
        ${panelHeader("Active site work", "Work that is planned, blocked, or being built.", active.length)}
        <div class="card-list">${cards(active, "website_updates")}</div>
      </section>
      <section class="panel">
        ${panelHeader("Live and shipped", "What Adam and Nick can already point at.", live.length)}
        <div class="card-list">
          ${cards(live, "website_updates")}
          ${cards((state.changelog || []).filter((item) => ["Website", "Tools"].includes(item.area)).slice(0, 8), "changelog")}
        </div>
      </section>
    </div>
  `;
}

function renderTools() {
  const tools = [
    ["Coming soon", "Facebook messaging app", "Reserved for the Meta API module when you are ready to add it."],
    ["Operations", "Lead scrapers", "A place to launch or document lead collection tools."],
    ["Copy", "Prompt templates", "Reusable marketing, SEO, review reply, and product copy prompts."],
    ["Reporting", "Reporting links", "Ads, Search Console, analytics, call tracking, and ranking dashboards."],
    ["Assets", "Asset library", "Future home for R2-backed photos, videos, screenshots, and brand files."],
    ["Automation", "Automation notes", "Campaign routines, weekly jobs, and checks that should become Workers later."]
  ];
  view.innerHTML = `<div class="tool-grid">${tools.map(([badge, name, text]) => `<article class="tool"><span class="tool-badge">${badge}</span><h3>${name}</h3><p>${text}</p></article>`).join("")}</div>`;
}

function renderChangelog() {
  view.innerHTML = `
    <div class="board-tools">
      <p><strong>Shipped history</strong><br>Use this as the weekly update feed: what changed, where it changed, and why it matters.</p>
      <button class="primary-button" onclick="window.dashboardOpen('changelog')">New changelog entry</button>
    </div>
    <table class="table">
      <thead><tr><th>Shipped</th><th>Area</th><th>Update</th><th>Detail</th></tr></thead>
      <tbody>${(state.changelog || []).map((item) => `
        <tr><td>${escapeHtml(item.shipped_at || "")}</td><td>${escapeHtml(item.area || "")}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.detail || "")}</td></tr>
      `).join("")}</tbody>
    </table>
  `;
}

function stat(label, value, caption, accent = "#215ed3") {
  return `<article class="stat" style="--accent:${accent}"><span>${label}</span><strong>${value}</strong><span>${caption}</span></article>`;
}

function panelHeader(title, subtitle, count) {
  return `
    <div class="panel-header">
      <div>
        <h3>${title}</h3>
        <p class="panel-subtitle">${subtitle}</p>
      </div>
      <span class="pill">${count}</span>
    </div>
  `;
}

function columnHeader(title, count) {
  return `
    <div class="column-header">
      <div>
        <h3>${title}</h3>
        <p class="column-count">${count} item${count === 1 ? "" : "s"}</p>
      </div>
    </div>
  `;
}

function boardHint(table) {
  const hints = {
    tickets: "Move requests across the board as they progress. The action buttons are workflow moves.",
    ideas: "Capture ideas here, then decide whether they become real work.",
    content_requests: "Keep asset requests visible so photos, reviews, and videos do not get lost."
  };
  return hints[table] || "Keep everything visible, owned, and moving.";
}

function cards(items, table) {
  if (!items.length) return `<p class="empty">Nothing here.</p>`;
  return items.map((item) => card(item, table)).join("");
}

function card(item, table) {
  const detail = item.detail ? `<p>${escapeHtml(item.detail)}</p>` : "";
  const chips = metaFor(item, table)
    .map(([label, value, key]) => `<span class="pill ${key}-${slug(value)}"><span class="meta-label">${label}</span>${escapeHtml(value)}</span>`)
    .join("");
  const actions = actionButtons(item, table);
  return `
    <article class="card">
      <header><h4>${escapeHtml(item.title || "Untitled")}</h4><span class="pill id">#${item.id}</span></header>
      ${detail}
      <div class="meta">${chips}</div>
      ${actions}
    </article>
  `;
}

function metaFor(item, table) {
  const maps = {
    tickets: [
      ["Owner", item.owner, "owner"],
      ["Priority", item.priority, "priority"],
      ["From", item.requester, "requester"],
      ["Type", item.category, "category"]
    ],
    ideas: [
      ["Status", item.status, "status"],
      ["Impact", item.impact, "impact"],
      ["From", item.author, "author"]
    ],
    tasks: [
      ["Owner", item.owner, "owner"],
      ["Lane", item.lane, "status"],
      ["Due", item.due_date, "due_date"]
    ],
    content_requests: [
      ["Asset", item.asset_type, "asset_type"],
      ["From", item.requester, "requester"],
      ["Deadline", item.deadline, "deadline"]
    ],
    website_updates: [
      ["Area", item.area, "area"],
      ["Status", item.status, "status"],
      ["Release", item.release_date, "release_date"]
    ],
    changelog: [
      ["Area", item.area, "area"],
      ["Shipped", item.shipped_at, "shipped_at"]
    ]
  };
  return (maps[table] || [])
    .filter(([, value]) => value)
    .map(([label, value, key]) => [label, value, key]);
}

function actionButtons(item, table) {
  if (table === "tasks") {
    return `<div class="actions"><button onclick="window.dashboardPatch('${table}', ${item.id}, {done: 1})">Done</button></div>`;
  }
  if (table === "tickets") {
    return workflowButtons(table, item, "status", ["In Progress", "Waiting on Someone", "Done"]);
  }
  if (table === "content_requests") {
    return workflowButtons(table, item, "status", ["Requested", "Received", "Used"]);
  }
  if (table === "website_updates") {
    return workflowButtons(table, item, "status", ["In Progress", "Live", "Blocked"]);
  }
  return "";
}

function workflowButtons(table, item, field, values) {
  const buttons = values
    .filter((value) => item[field] !== value)
    .map((value) => `<button onclick="window.dashboardPatch('${table}', ${item.id}, {${field}: '${value}'})">Move to ${value}</button>`)
    .join("");
  return buttons ? `<div class="actions">${buttons}</div>` : "";
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
