const tabs = [
  { id: "dashboard", label: "Dashboard", icon: "D" },
  { id: "tickets", label: "Tickets", icon: "T" },
  { id: "action-plan", label: "Action Plan", icon: "P" },
  { id: "ideas", label: "Ideas", icon: "I" },
  { id: "roadmap", label: "Roadmap", icon: "R" },
  { id: "website", label: "Website", icon: "W" },
  { id: "content", label: "Content", icon: "C" },
  { id: "tools", label: "Tools", icon: "A" }
];

const viewCopy = {
  dashboard: "What needs attention, what is waiting, and what shipped recently.",
  tickets: "Requests from the team, moved through a clear status board.",
  "action-plan": "The extracted Fenster marketing plan, grouped by effort and progress.",
  ideas: "A holding area for good ideas before they interrupt the actual work.",
  roadmap: "Today, this week, and later, without the noise.",
  website: "Website changes, launch notes, and visible progress for the team.",
  content: "Photos, reviews, videos, showroom assets, and case study requests.",
  tools: "The future tool drawer for automations, Meta work, reports, and templates."
};

const actionPlan = [
  {
    section: "Immediate Actions",
    effort: "easy",
    items: [
      ["Take over Instagram messaging", "Sort the new Instagram messaging process now that Fenster is responsible for it. Aim for fast, friendly replies and make sure no enquiries are left sitting."],
      ["Reply to reviews", "Track down outstanding Google, Trustpilot or platform reviews and reply to them professionally. This keeps social proof looking active and cared for."],
      ["Call every lead within the hour", "Every new lead should be called within 1 hour, ideally straight away. Speed to lead should become a basic team rule."],
      ["Update email signatures", "Create cleaner signatures that point people towards the website, showroom, reviews, social pages or Instant Pricing tool."]
    ]
  },
  {
    section: "Website, Residential Foundation & SEO",
    effort: "medium",
    items: [
      ["Build a stronger residential website foundation", "Make the residential side of the website clearer, stronger and more conversion focused. Product pages, trust signals, calls to action and customer journey should all feel joined up."],
      ["Create QR codes for vans", "Add QR codes to vans that point people to a useful page, ideally the residential website section or Instant Pricing tool. Make the landing page clear before printing anything."],
      ["Explore AI SEO", "Look at how AI can support content expansion, internal linking, FAQs, schema ideas, content refreshes and local SEO. Keep human review in place so it does not become generic rubbish.", "complex"],
      ["Explore wider AI opportunities", "Put proper emphasis on AI as a wider opportunity: lead handling, customer messaging, quote follow-ups, content ideas, admin support and reporting.", "complex"]
    ]
  },
  {
    section: "Social Media",
    effort: "easy",
    items: [
      ["Be better than Crown", "Use Crown as the benchmark and make Fenster look more active, more premium, more trustworthy and more helpful online.", "medium"],
      ["Create a quality showreel", "Make a short, polished showreel showing product quality, showroom details, installs, close-ups and finished results.", "medium"],
      ["Set up 3 pinned posts for new customers", "Post 1: why choose Fenster. Post 2: recent work and product quality. Post 3: reviews, showroom and how to get a quote."],
      ["Run regular polls from Stories", "Use polls to make the account feel alive and to get engagement. Keep them simple, visual and relevant to windows, doors, colours, showroom choices or home improvement decisions."],
      ["Post more Stories", "Keep Fenster appearing on people's phones. Daily showroom clips, installs, staff moments, product close-ups and quick updates are enough."]
    ]
  },
  {
    section: "Print, Sales & Showroom",
    effort: "medium",
    items: [
      ["Create showroom plaques", "Make small professional plaques for showroom displays. These should explain product benefits clearly without overwhelming visitors."],
      ["Create salesperson slides", "Give salespeople a simple slide deck for consultations covering products, quality, reviews, guarantees, process and why Fenster is better."],
      ["Plan Wolverton clickbait leaflet campaign", "Use curiosity-led wording around conservation rules, then explain that some window changes need planning permission and Fenster can help with the process."],
      ["Add Instagram follower counter in showroom", "Create a small screen or counter showing Instagram followers, adding engagement and encouraging showroom visitors to follow while they are there."]
    ]
  },
  {
    section: "AdminBase, Messaging & Long-Term Touchpoints",
    effort: "complex",
    items: [
      ["Audit AdminBase messaging", "Check what is being sent, when it is being sent, and whether it sounds helpful, human and on-brand.", "medium"],
      ["Review HTML vs plain text messages", "Decide which messages should look polished and which should feel more personal.", "medium"],
      ["Separate personal vs generic messaging", "Create a better mix between automated generic messages and messages that feel like a real person has written them.", "medium"],
      ["Expand long-term customer touchpoints", "Stop leads disappearing after a month. Add 1 month, 6 month, 1 year and 2 year check-ins.", "complex"],
      ["Integrate WhatsApp into AdminBase", "Investigate whether WhatsApp can be connected to AdminBase so messages can be sent and managed from there.", "complex"],
      ["Explore unused AdminBase features", "Identify useful AdminBase features Fenster is not currently using, especially around follow-ups, reporting, automation and customer communication.", "complex"]
    ]
  }
];

let actionPlanFilter = "all";

const config = {
  tickets: {
    table: "tickets",
    title: "Ticket",
    fields: [
      ["title", "Title", "text"],
      ["category", "Category", "select", ["Marketing", "Website", "Content", "Reporting", "Showroom", "Other"]],
      ["priority", "Priority", "select", ["Low", "Normal", "Urgent", "Boss panic mode"]],
      ["detail", "Detail", "textarea"],
      ["requester", "Requester", "hidden", "currentUser"],
      ["status", "Status", "hidden", "New"],
      ["owner", "Owner", "hidden", "Zac"]
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
let ticketSearch = "";

const $ = (selector) => document.querySelector(selector);
const view = $("#view");
const modal = $("#modal");
const notesModal = $("#notes-modal");

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
  $("#note-submit").addEventListener("click", saveNote);
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
    "action-plan": renderActionPlan,
    ideas: () => renderBoard("ideas", "status", ["Inbox", "Considering", "Approved", "Parked", "Done"]),
    roadmap: renderRoadmap,
    website: renderWebsite,
    content: () => renderBoard("content_requests", "status", ["Needed", "Requested", "Received", "Used"]),
    tools: renderTools
  };

  renderers[current]();
}

function renderActionPlan() {
  const allItems = flattenedActionPlan();
  const visible = actionPlanFilter === "all" ? allItems : allItems.filter((item) => item.effort === actionPlanFilter);
  const done = allItems.filter((item) => localStorage.getItem(actionPlanKey(item)) === "done").length;
  const percent = allItems.length ? Math.round((done / allItems.length) * 100) : 0;

  view.innerHTML = `
    <div class="action-hero">
      <div>
        <p class="eyebrow">Fenster marketing action plan</p>
        <h3>${percent}% complete</h3>
        <p>Extracted from the uploaded preview file and merged into the hub. Tick items locally as they are handled.</p>
      </div>
      <div class="progress-card">
        <div class="bar"><span style="width:${percent}%"></span></div>
        <strong>${done} of ${allItems.length} done</strong>
      </div>
    </div>
    <div class="plan-filters">
      ${["all", "easy", "medium", "complex"].map((filter) => `
        <button class="${actionPlanFilter === filter ? "active" : ""}" onclick="window.dashboardFilterPlan('${filter}')">${effortLabel(filter)}</button>
      `).join("")}
    </div>
    <div class="plan-summary grid stats">
      ${stat("Easy wins", allItems.filter((item) => item.effort === "easy").length, "Fast trust and visibility", "#12825a")}
      ${stat("Medium jobs", allItems.filter((item) => item.effort === "medium").length, "Needs a little planning", "#a35e00")}
      ${stat("Bigger projects", allItems.filter((item) => item.effort === "complex").length, "Systems or rollout work", "#c23a34")}
      ${stat("Visible now", visible.length, "Current filtered list", "#215ed3")}
    </div>
    <div class="plan-sections">
      ${actionPlan.map((section) => renderPlanSection(section)).join("")}
    </div>
  `;
}

function renderPlanSection(section) {
  const items = section.items
    .map(([title, detail, override]) => ({ section: section.section, title, detail, effort: override || section.effort }))
    .filter((item) => actionPlanFilter === "all" || item.effort === actionPlanFilter);

  if (!items.length) return "";

  return `
    <section class="plan-section">
      <div class="panel-header">
        <div>
          <h3>${section.section}</h3>
          <p class="panel-subtitle">${items.length} visible task${items.length === 1 ? "" : "s"}</p>
        </div>
        <span class="pill status-${section.effort}">${effortLabel(section.effort)}</span>
      </div>
      <div class="plan-items">
        ${items.map((item) => renderPlanItem(item)).join("")}
      </div>
    </section>
  `;
}

function renderPlanItem(item) {
  const key = actionPlanKey(item);
  const checked = localStorage.getItem(key) === "done";
  return `
    <article class="plan-item ${checked ? "is-done" : ""}">
      <label class="checkline">
        <input type="checkbox" ${checked ? "checked" : ""} onchange="window.dashboardTogglePlan('${key}', this.checked)">
        <span>
          <strong>${escapeHtml(item.title)}</strong>
          <small class="pill status-${item.effort}">${effortLabel(item.effort)}</small>
        </span>
      </label>
      <p>${escapeHtml(item.detail)}</p>
    </article>
  `;
}

function flattenedActionPlan() {
  return actionPlan.flatMap((section) => section.items.map(([title, detail, override]) => ({
    section: section.section,
    title,
    detail,
    effort: override || section.effort
  })));
}

function actionPlanKey(item) {
  return `action-plan:${slug(item.section)}:${slug(item.title)}`;
}

function effortLabel(effort) {
  return {
    all: "All",
    easy: "Easy wins",
    medium: "Medium jobs",
    complex: "Bigger projects"
  }[effort] || effort;
}

function filterPlan(filter) {
  actionPlanFilter = filter;
  render();
}

function togglePlan(key, done) {
  if (done) localStorage.setItem(key, "done");
  else localStorage.removeItem(key);
  render();
}

function renderDashboard() {
  const openTickets = (state.tickets || []).filter((item) => item.status !== "Done");
  const closedTickets = (state.tickets || []).filter((item) => item.status === "Done");
  const urgent = openTickets.filter((item) => ["Urgent", "Boss panic mode"].includes(item.priority));
  const contentNeeded = (state.content_requests || []).filter((item) => item.status !== "Used");
  const websiteProgress = (state.website_updates || []).length;
  const waiting = openTickets.filter((ticket) => ticket.status === "Waiting on Someone");
  const today = (state.tasks || []).filter((task) => task.lane === "Today" && !Number(task.done));

  view.innerHTML = `
    <div class="grid stats">
      ${stat("Open tickets", openTickets.length, "Requests not done yet", "#215ed3")}
      ${stat("Closed tickets", closedTickets.length, "Finished and out of the way", "#12825a")}
      ${stat("Urgent", urgent.length, "Needs eyes first", "#c23a34")}
      ${stat("Website progress", websiteProgress, "Updates currently tracked", "#7057c8")}
    </div>
    <div class="grid two" style="margin-top:16px">
      <section class="panel">
        ${panelHeader("Open ticket queue", "The main work pile. Keep this moving and the whole system works.", openTickets.length)}
        <div class="card-list dashboard-list">${cards(openTickets.slice(0, 8), "tickets")}</div>
      </section>
      <section class="panel">
        ${panelHeader("Closed tickets", "Completed requests, ready for tomorrow's proof-of-progress chat.", closedTickets.length)}
        <div class="card-list dashboard-list">${cards(closedTickets.slice(0, 8), "tickets")}</div>
      </section>
    </div>
    <div class="grid two" style="margin-top:16px">
      <section class="panel">
        ${panelHeader("Waiting on someone", "Chase these before they quietly stall.", waiting.length)}
        <div class="card-list dashboard-list">${cards(waiting.slice(0, 8), "tickets")}</div>
      </section>
      <section class="panel">
        ${panelHeader("Today", "Small internal work list, separate from team ticket requests.", today.length)}
        <div class="card-list dashboard-list">${cards(today.slice(0, 6), "tasks")}</div>
      </section>
    </div>
    <div class="grid two" style="margin-top:16px">
      <section class="panel">
        ${panelHeader("Website progress", "Dev site updates and current website movement.", websiteProgress)}
        <div class="card-list">${cards((state.website_updates || []).filter((item) => item.status !== "Live").slice(0, 5), "website_updates")}</div>
      </section>
      <section class="panel">
        ${panelHeader("Content asks", "Photos, reviews, videos, and assets still being chased.", contentNeeded.length)}
        <div class="card-list dashboard-list">${cards(contentNeeded.slice(0, 6), "content_requests")}</div>
      </section>
    </div>
  `;
}

function renderBoard(table, groupKey, groups) {
  const allItems = table === "tickets" ? filteredTickets() : (state[table] || []);
  const totalItems = (state[table] || []).length;
  view.innerHTML = `
    <div class="board-tools">
      <p><strong>${config[table].title}s</strong><br>${boardHint(table)}</p>
      <div class="board-actions">
        ${table === "tickets" ? `<input class="search-input" type="search" placeholder="Search tickets..." value="${escapeHtml(ticketSearch)}" oninput="window.dashboardSearchTickets(this.value)">` : ""}
        <button class="primary-button" onclick="window.dashboardOpen('${table}')">New ${config[table].title.toLowerCase()}</button>
      </div>
    </div>
    ${table === "tickets" ? `<p class="result-note">Showing ${allItems.length} of ${totalItems} tickets.</p>` : ""}
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

function filteredTickets() {
  const query = ticketSearch.trim().toLowerCase();
  const tickets = state.tickets || [];
  if (!query) return tickets;
  return tickets.filter((ticket) => [
    ticket.title,
    ticket.detail,
    ticket.requester,
    ticket.category,
    ticket.priority,
    ticket.status
  ].some((value) => String(value || "").toLowerCase().includes(query)));
}

function searchTickets(value) {
  ticketSearch = value;
  render();
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
      <p><strong>Website workbench</strong><br>Track progress on the dev site: copy, SEO, products, forms, launches, and fixes.</p>
      <div class="actions" style="margin-top:0">
        <button onclick="window.dashboardOpen('website_updates')">New website update</button>
      </div>
    </div>
    <div class="grid two">
      <section class="panel">
        ${panelHeader("Active site work", "Work that is planned, blocked, or being built.", active.length)}
        <div class="card-list">${cards(active, "website_updates")}</div>
      </section>
      <section class="panel">
        ${panelHeader("Progress made", "Website updates currently recorded.", live.length)}
        <div class="card-list">
          ${cards(live, "website_updates")}
        </div>
      </section>
    </div>
  `;
}

function renderTools() {
  const tools = [
    ["Coming soon", "Facebook messaging app", "Reserved for the Meta API module when you are ready to add it."],
    ["Coming soon", "Lead scrapers", "A place to launch or document lead collection tools."],
    ["Coming soon", "Prompt templates", "Reusable marketing, SEO, review reply, and product copy prompts."],
    ["Coming soon", "Reporting links", "Ads, Search Console, analytics, call tracking, and ranking dashboards."],
    ["Coming soon", "Asset library", "Future home for R2-backed photos, videos, screenshots, and brand files."],
    ["Coming soon", "Automation notes", "Campaign routines, weekly jobs, and checks that should become Workers later."]
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
    return `
      ${workflowButtons(table, item, "status", ["In Progress", "Waiting on Someone", "Done"])}
      <div class="actions"><button onclick="window.dashboardOpenNotes(${item.id})">Notes</button></div>
    `;
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
  $("#modal-fields").innerHTML = modalIntro(table) + itemConfig.fields.map(fieldHtml).join("");
  modal.dataset.table = table;
  modal.showModal();
}

function fieldHtml([name, label, type, options]) {
  if (type === "hidden") {
    const value = options === "currentUser" ? user.name : options;
    return `<input name="${name}" type="hidden" value="${escapeHtml(value)}">`;
  }
  if (type === "textarea") return `<label>${label}<textarea name="${name}"></textarea></label>`;
  if (type === "select") {
    return `<label>${label}<select name="${name}">${options.map((option) => `<option>${option}</option>`).join("")}</select></label>`;
  }
  return `<label>${label}<input name="${name}" type="${type}"></label>`;
}

function modalIntro(table) {
  if (table !== "tickets") return "";
  return `<p class="modal-intro">Requester is set from your login. Status starts as New. Zac owns the marketing queue.</p>`;
}

async function saveModal(event) {
  event.preventDefault();
  const table = modal.dataset.table;
  const form = new FormData($("#modal form"));
  const body = withDefaults(table, Object.fromEntries(form));
  const created = await api(`/api/records/${table}`, { method: "POST", body });
  state[table] = [created, ...(state[table] || [])];
  modal.close();
  render();
}

function withDefaults(table, body) {
  if (table === "tickets") {
    return {
      requester: user.name,
      status: "New",
      owner: "Zac",
      ...body
    };
  }
  return body;
}

async function patchRecord(table, id, patch) {
  const updated = await api(`/api/records/${table}`, { method: "PATCH", body: { id, ...patch } });
  state[table] = (state[table] || []).map((item) => item.id === id ? updated : item);
  render();
}

async function openNotes(ticketId) {
  const ticket = (state.tickets || []).find((item) => item.id === ticketId);
  if (!ticket) return;
  notesModal.dataset.ticketId = String(ticketId);
  $("#notes-title").textContent = ticket.title || "Ticket notes";
  $("#notes-subtitle").textContent = `From ${ticket.requester || "the team"} - ${ticket.status || "New"} - ${ticket.priority || "Normal"}`;
  $("#note-body").value = "";
  await renderNotes(ticketId);
  notesModal.showModal();
}

async function renderNotes(ticketId) {
  const notes = await api(`/api/notes/tickets/${ticketId}`);
  $("#notes-list").innerHTML = notes.length
    ? notes.map((note) => `
      <article class="note">
        <header><strong>${escapeHtml(note.author)}</strong><span>${escapeHtml(note.created_at)}</span></header>
        <p>${escapeHtml(note.body)}</p>
      </article>
    `).join("")
    : `<p class="empty">No notes yet. Add the first progress update.</p>`;
}

async function saveNote(event) {
  event.preventDefault();
  const ticketId = Number(notesModal.dataset.ticketId);
  const body = $("#note-body").value.trim();
  if (!ticketId || !body) return;
  await api(`/api/notes/tickets/${ticketId}`, { method: "POST", body: { body } });
  $("#note-body").value = "";
  await renderNotes(ticketId);
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
window.dashboardSearchTickets = searchTickets;
window.dashboardOpenNotes = openNotes;
window.dashboardFilterPlan = filterPlan;
window.dashboardTogglePlan = togglePlan;
