const tabs = [
  { id: "dashboard", label: "Dashboard", icon: "D" },
  { id: "tickets", label: "Tickets", icon: "T" },
  { id: "todays-plan", label: "Today's Plan", icon: "N" },
  { id: "action-plan", label: "Action Plan", icon: "P" },
  { id: "social", label: "Social Media", icon: "S" },
  { id: "ideas", label: "Ideas", icon: "I" },
  { id: "roadmap", label: "Roadmap", icon: "R" },
  { id: "website", label: "Website", icon: "W" },
  { id: "tools", label: "Tools", icon: "A" }
];

const viewCopy = {
  dashboard: "What needs attention, what is waiting, and what shipped recently.",
  tickets: "Requests from the team, moved through a clear status board.",
  "todays-plan": "A shared plan for the day, with updates, done states, and carry-forward notes.",
  "action-plan": "The extracted Fenster marketing plan, grouped by effort and progress.",
  social: "Content ideas, scheduled posts, Stories, Reels, and social follow-up in one place.",
  ideas: "A holding area for good ideas before they interrupt the actual work.",
  roadmap: "Today, this week, and later, without the noise.",
  website: "Website changes, launch notes, and visible progress for the team.",
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
  todays_plan: {
    table: "todays_plan",
    title: "Plan item",
    fields: [
      ["title", "Plan item", "text"],
      ["owner", "Owner", "hidden", "currentUser"],
      ["status", "Status", "select", ["Planned", "Doing", "Parked", "Done", "Carry on tomorrow"]],
      ["notes", "Notes / updates", "textarea"],
      ["updated_by", "Updated by", "hidden", "currentUser"]
    ]
  },
  social_posts: {
    table: "social_posts",
    title: "Social post",
    fields: [
      ["title", "Content idea", "text"],
      ["platform", "Platform", "select", ["Instagram", "Facebook", "TikTok", "LinkedIn", "Google Business Profile", "All channels"]],
      ["content_type", "Content type", "select", ["Post", "Story", "Reel", "Poll", "Review", "Case study", "Showroom update", "Offer"]],
      ["status", "Status", "select", ["Idea", "Planned", "Scheduled", "Posted", "Parked"]],
      ["scheduled_for", "Scheduled for", "date"],
      ["owner", "Owner", "hidden", "currentUser"],
      ["notes", "Notes / caption draft", "textarea"]
    ]
  },
  social_guidelines: {
    table: "social_guidelines",
    title: "Guideline",
    fields: [
      ["title", "Guideline title", "text"],
      ["category", "Category", "select", ["Brand voice", "Visual style", "Posting rules", "Lead handling", "Template", "Do not say", "General"]],
      ["body", "Guideline / template notes", "textarea"]
    ]
  },
  action_plan_items: {
    table: "action_plan_items",
    title: "Action plan item",
    fields: [
      ["title", "Title", "text"],
      ["section", "Section", "select", ["Immediate Actions", "Website, Residential Foundation & SEO", "Social Media", "Print, Sales & Showroom", "AdminBase, Messaging & Long-Term Touchpoints", "Custom"]],
      ["effort", "Effort", "select", ["easy", "medium", "complex"]],
      ["detail", "Detail", "textarea"],
      ["status", "Status", "select", ["Active", "Parked", "Done"]]
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
      ["status", "Status", "select", ["Plan", "Active", "Parked", "Done"]],
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
let fensterState = null;
let fensterTab = "awaiting";
let selectedFensterConversationId = null;
let current = "dashboard";
let user = null;
let ticketSearch = "";
let refreshTimer = null;
let notificationReady = false;
let seenTaskIds = new Set();
let seenPlanIds = new Set();
let seenTicketIds = new Set();
let seenSocialIds = new Set();

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
  state = normalizeState(await api("/api/bootstrap"));
  captureSeenItems();
  await enableNotifications();
  startAutoRefresh();
  render();
}

function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(refreshDashboard, 60000);
}

async function refreshDashboard() {
  if ($("#modal")?.open || $("#notes-modal")?.open) return;
  try {
    const next = normalizeState(await api("/api/bootstrap"));
    notifyNewItems(next);
    state = next;
    if (current === "tools") {
      await api("/api/fenster/meta/sync", { method: "POST", body: {} });
      await loadFenster();
    }
    else render();
  } catch (error) {
    console.warn("Dashboard refresh failed", error);
  }
}

async function enableNotifications() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    notificationReady = true;
    return;
  }
  if (Notification.permission === "default") {
    try {
      notificationReady = await Notification.requestPermission() === "granted";
    } catch {
      notificationReady = false;
    }
  }
}

function captureSeenItems() {
  seenTaskIds = new Set((state.tasks || []).map((item) => item.id));
  seenPlanIds = new Set((state.todays_plan || []).map((item) => item.id));
  seenTicketIds = new Set((state.tickets || []).map((item) => item.id));
  seenSocialIds = new Set((state.social_posts || []).map((item) => item.id));
}

function notifyNewItems(next) {
  const newTasks = (next.tasks || []).filter((item) => !seenTaskIds.has(item.id));
  const newPlans = (next.todays_plan || []).filter((item) => !seenPlanIds.has(item.id));
  const newTickets = (next.tickets || []).filter((item) => !seenTicketIds.has(item.id));
  const newSocial = (next.social_posts || []).filter((item) => !seenSocialIds.has(item.id));
  [...newTasks, ...newPlans, ...newTickets, ...newSocial].forEach((item) => {
    const type = newTasks.includes(item)
      ? "New task"
      : newPlans.includes(item)
        ? "New plan item"
        : newSocial.includes(item)
          ? "New social idea"
          : "New ticket";
    sendBrowserNotification(type, item.title || "Untitled");
  });
  captureSeenFrom(next);
}

function captureSeenFrom(next) {
  seenTaskIds = new Set((next.tasks || []).map((item) => item.id));
  seenPlanIds = new Set((next.todays_plan || []).map((item) => item.id));
  seenTicketIds = new Set((next.tickets || []).map((item) => item.id));
  seenSocialIds = new Set((next.social_posts || []).map((item) => item.id));
}

function sendBrowserNotification(title, body) {
  if (!notificationReady || !("Notification" in window)) return;
  new Notification(title, {
    body,
    icon: "/fenster-logo.png",
    tag: `${title}:${body}`
  });
}

function render() {
  $("#view-title").textContent = tabs.find((tab) => tab.id === current)?.label || "Dashboard";
  document.querySelector(".topbar .eyebrow").textContent = viewCopy[current] || "Live marketing command desk";
  document.querySelectorAll("#tabs button").forEach((button) => {
    button.setAttribute("aria-selected", String(button.dataset.tab === current));
  });

  const renderers = {
    dashboard: renderDashboard,
    tickets: () => renderBoard("tickets", "status", ["New", "In Progress", "Waiting on Someone", "Parked", "Done"]),
    "todays-plan": renderTodaysPlan,
    "action-plan": renderActionPlan,
    social: renderSocial,
    ideas: () => renderBoard("ideas", "status", ["Inbox", "Considering", "Approved", "Parked", "Done"]),
    roadmap: renderRoadmap,
    website: renderWebsite,
    tools: renderTools
  };

  renderers[current]();
  wireBoardDragDrop();
}

function normalizeState(next) {
  return {
    ...next,
    website_updates: (next.website_updates || []).map((item) => ({
      ...item,
      status: {
        Planned: "Plan",
        "In Progress": "Active",
        Blocked: "Parked",
        Live: "Done"
      }[item.status] || item.status
    }))
  };
}

function renderTodaysPlan() {
  renderBoard("todays_plan", "status", ["Planned", "Doing", "Done", "Parked", "Carry on tomorrow"]);
}

function renderSocial() {
  const guidelines = state.social_guidelines || [];
  view.innerHTML = `
    <div class="board-tools">
      <p><strong>Social media planner</strong><br>Drag posts through the workflow. Keep guidelines underneath as reference notes, not mixed into ideas.</p>
      <div class="board-actions">
        <button class="primary-button" onclick="window.dashboardOpen('social_posts')">New social post</button>
      </div>
    </div>
    <div class="grid columns">
      ${["Idea", "Planned", "Scheduled", "Posted", "Parked"].map((group) => `
        <section class="column" data-table="social_posts" data-field="status" data-value="${escapeHtml(group)}">
          ${columnHeader(group, (state.social_posts || []).filter((item) => item.status === group).length)}
          <div class="card-list">${cards((state.social_posts || []).filter((item) => item.status === group), "social_posts")}</div>
        </section>
      `).join("")}
    </div>
    <div class="section-tools">
      <h3>Social guidelines</h3>
      <button onclick="window.dashboardOpen('social_guidelines')">New guideline</button>
    </div>
    <section class="guidelines-panel">
      ${guidelines.length ? guidelines.map(renderGuideline).join("") : `<p class="empty">No guidelines yet. Add brand voice notes, caption templates, or posting rules here.</p>`}
    </section>
  `;
}

function renderGuideline(item) {
  return `
    <article class="guideline">
      <header>
        <div>
          <h4>${escapeHtml(item.title)}</h4>
          <span class="pill">${escapeHtml(item.category || "General")}</span>
        </div>
        <button class="note-button" onclick="window.dashboardOpenNotes('social_guidelines', ${item.id})">${noteBadge("social_guidelines", item.id)}</button>
        <button class="danger-action" onclick="window.dashboardDeleteRecord('social_guidelines', ${item.id})">Delete</button>
      </header>
      <p>${escapeHtml(item.body || "")}</p>
    </article>
  `;
}

function renderActionPlan() {
  const allItems = flattenedActionPlan();
  const visible = actionPlanFilter === "all" ? allItems : allItems.filter((item) => item.effort === actionPlanFilter);
  const done = allItems.filter((item) => item.status === "Done").length;
  const percent = allItems.length ? Math.round((done / allItems.length) * 100) : 0;

  view.innerHTML = `
    <div class="action-hero">
      <div>
        <p class="eyebrow">Fenster marketing action plan</p>
        <h3>Version 2 - ${percent}% complete</h3>
        <p>Drag work between active, parked, and done. Changes are saved to the shared Cloudflare database.</p>
      </div>
      <div class="progress-card">
        <div class="bar"><span style="width:${percent}%"></span></div>
        <strong>${done} of ${allItems.length} done</strong>
      </div>
    </div>
    <div class="plan-filters board-actions">
      ${["all", "easy", "medium", "complex"].map((filter) => `<button class="${actionPlanFilter === filter ? "active" : ""}" onclick="window.dashboardFilterPlan('${filter}')">${effortLabel(filter)}</button>`).join("")}
      <button class="primary-button" onclick="window.dashboardOpen('action_plan_items')">Add action</button>
    </div>
    <div class="plan-summary grid stats">
      ${stat("Easy wins", allItems.filter((item) => item.effort === "easy").length, "Fast trust and visibility", "#12825a")}
      ${stat("Medium jobs", allItems.filter((item) => item.effort === "medium").length, "Needs a little planning", "#a35e00")}
      ${stat("Bigger projects", allItems.filter((item) => item.effort === "complex").length, "Systems or rollout work", "#c23a34")}
      ${stat("Visible now", visible.length, "Current filtered list", "#215ed3")}
    </div>
    <div class="grid columns action-columns">
      ${["Active", "Parked", "Done"].map((status) => `
        <section class="column" data-table="action_plan_items" data-field="status" data-value="${status}">
          ${columnHeader(status, visible.filter((item) => item.status === status).length)}
          <div class="card-list">${visible.filter((item) => item.status === status).map(renderPlanItem).join("") || `<p class="empty">Nothing here.</p>`}</div>
        </section>
      `).join("")}
    </div>
  `;
}

function renderPlanItem(item) {
  return `
    <article class="card plan-item ${item.status === "Done" ? "is-done" : ""}" draggable="true" data-table="action_plan_items" data-id="${item.customId || ""}" data-action-key="${escapeHtml(actionPlanKey(item))}">
      <header><h4>${escapeHtml(item.title)}</h4><span class="pill status-${item.effort}">${effortLabel(item.effort)}</span></header>
      <p>${escapeHtml(item.detail)}</p>
      <div class="meta">
        ${editableChip("action_plan_items", item, "status", "Status", item.status || "Active")}
        <span class="pill"><span class="meta-label">Section</span>${escapeHtml(item.section)}</span>
      </div>
      <div class="actions">
        <button onclick="window.dashboardActionToTask('${encodeActionItem(item)}')">Set as task</button>
        <button class="note-button" onclick="window.dashboardOpenNotes('action_plan_items', ${item.customId || 0}, '${encodeActionItem(item)}')">${noteBadge("action_plan_items", item.customId)}</button>
        <details class="card-menu"><summary aria-label="More actions">...</summary><button class="danger-action" onclick="window.dashboardDeleteActionItem('${encodeActionItem(item)}')">Delete</button></details>
      </div>
    </article>
  `;
}

function flattenedActionPlan() {
  return actionPlanSections().flatMap((section) => section.items.map((entry) => Array.isArray(entry) ? {
    section: section.section,
    title: entry[0],
    detail: entry[1],
    effort: entry[2] || section.effort,
    status: "Active",
    customId: null
  } : entry)).filter((item) => item.status !== "Deleted");
}

function actionPlanSections() {
  const sections = actionPlan.map((section) => ({ ...section, items: [...section.items] }));
  for (const item of state.action_plan_items || []) {
    let target = sections.find((section) => section.section === item.section);
    if (!target) {
      target = { section: item.section || "Custom", effort: item.effort || "medium", items: [] };
      sections.push(target);
    }
    const record = {
      section: item.section || "Custom",
      title: item.title,
      detail: item.detail || "",
      effort: item.effort || "medium",
      status: item.status || "Active",
      customId: item.id
    };
    const existingIndex = target.items.findIndex((entry) => {
      const title = Array.isArray(entry) ? entry[0] : entry.title;
      return slug(title) === slug(record.title);
    });
    if (existingIndex >= 0) target.items[existingIndex] = record;
    else target.items.push(record);
  }
  return sections;
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

async function togglePlan(encoded, done) {
  const item = decodeActionItem(encoded);
  await patchActionPlanItem(item, { status: done ? "Done" : "Active" });
}

function encodeActionItem(item) {
  return encodeURIComponent(JSON.stringify(item));
}

function decodeActionItem(encoded) {
  return JSON.parse(decodeURIComponent(encoded));
}

function isActionPlanHidden(item) {
  return item.status === "Deleted";
}

async function deleteActionItem(encoded) {
  const item = decodeActionItem(encoded);
  if (!confirm(`Delete action: ${item.title}?`)) return;
  await patchActionPlanItem(item, { status: "Deleted" });
}

async function actionItemToTask(encoded) {
  const item = decodeActionItem(encoded);
  const created = await api("/api/records/tasks", {
    method: "POST",
    body: { title: item.title, lane: "Today", owner: user.name, due_date: "" }
  });
  state.tasks = [created, ...(state.tasks || [])];
  alert("Added to Roadmap as a task.");
}

async function patchActionPlanItem(item, patch, options = {}) {
  let saved;
  if (item.customId) {
    saved = await api("/api/records/action_plan_items", { method: "PATCH", body: { id: item.customId, ...patch } });
    state.action_plan_items = (state.action_plan_items || []).map((entry) => entry.id === item.customId ? saved : entry);
  } else {
    saved = await api("/api/records/action_plan_items", {
      method: "POST",
      body: {
        title: item.title,
        section: item.section || "Custom",
        effort: item.effort || "medium",
        detail: item.detail || "",
        status: patch.status || "Active"
      }
    });
    state.action_plan_items = [saved, ...(state.action_plan_items || [])];
  }
  if (!options.silent) render();
  return saved;
}

function renderDashboard() {
  const openTickets = (state.tickets || []).filter((item) => !["Done", "Parked"].includes(item.status));
  const closedTickets = (state.tickets || []).filter((item) => item.status === "Done");
  const parkedTickets = (state.tickets || []).filter((item) => item.status === "Parked");
  const urgent = openTickets.filter((item) => ["Urgent", "Boss panic mode"].includes(item.priority));
  const websiteProgress = (state.website_updates || []).length;
  const waiting = openTickets.filter((ticket) => ticket.status === "Waiting on Someone");
  const today = (state.tasks || []).filter((task) => task.lane === "Today" && !Number(task.done));

  view.innerHTML = `
    <div class="grid stats">
      ${stat("Open tickets", openTickets.length, "Requests not done yet", "#215ed3")}
      ${stat("Closed tickets", closedTickets.length, "Finished and out of the way", "#12825a")}
      ${stat("Parked tickets", parkedTickets.length, "Paused without cluttering active work", "#6c7785")}
      ${stat("Urgent", urgent.length, "Needs eyes first", "#c23a34")}
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
        <div class="card-list">${cards((state.website_updates || []).filter((item) => item.status !== "Done").slice(0, 5), "website_updates")}</div>
      </section>
      <section class="panel">
        ${panelHeader("Social queue", "Content ideas and posts that still need movement.", (state.social_posts || []).filter((item) => item.status !== "Posted").length)}
        <div class="card-list dashboard-list">${cards((state.social_posts || []).filter((item) => item.status !== "Posted").slice(0, 6), "social_posts")}</div>
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
        <section class="column" data-table="${table}" data-field="${groupKey}" data-value="${escapeHtml(group)}">
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

function wireBoardDragDrop() {
  view.querySelectorAll(".card[draggable='true']").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      if (event.target.closest("button, select, details, summary, label")) {
        event.preventDefault();
        return;
      }
      card.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("application/json", JSON.stringify({
        table: card.dataset.table,
        id: card.dataset.id,
        actionKey: card.dataset.actionKey || ""
      }));
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  });

  view.querySelectorAll(".column[data-table]").forEach((column) => {
    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      column.classList.add("drag-over");
      event.dataTransfer.dropEffect = "move";
    });
    column.addEventListener("dragleave", (event) => {
      if (!column.contains(event.relatedTarget)) column.classList.remove("drag-over");
    });
    column.addEventListener("drop", async (event) => {
      event.preventDefault();
      column.classList.remove("drag-over");
      const payload = JSON.parse(event.dataTransfer.getData("application/json") || "{}");
      if (payload.table !== column.dataset.table) return;
      await patchBoardItem(payload, column.dataset.field, column.dataset.value);
    });
  });
}

async function patchBoardItem(payload, field, value) {
  if (payload.table === "action_plan_items") {
    const item = flattenedActionPlan().find((entry) => actionPlanKey(entry) === payload.actionKey);
    if (!item || item.status === value) return;
    await patchActionPlanItem(item, { [field]: value });
    return;
  }
  const id = Number(payload.id);
  const item = (state[payload.table] || []).find((entry) => entry.id === id);
  if (!id || !item || item[field] === value) return;
  await patchRecord(payload.table, id, { [field]: value });
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
  view.innerHTML = `
    <div class="board-tools">
      <p><strong>Website workbench</strong><br>Plan changes, move active work forward, park anything blocked, then mark it done.</p>
      <div class="actions" style="margin-top:0">
        <button class="primary-button" onclick="window.dashboardOpen('website_updates')">New website update</button>
      </div>
    </div>
    <div class="grid columns">
      ${["Plan", "Active", "Parked", "Done"].map((status) => `
        <section class="column" data-table="website_updates" data-field="status" data-value="${status}">
          ${columnHeader(status, (state.website_updates || []).filter((item) => item.status === status).length)}
          <div class="card-list">${cards((state.website_updates || []).filter((item) => item.status === status), "website_updates")}</div>
        </section>
      `).join("")}
    </div>
  `;
}

function renderTools() {
  const tools = [
    ["Coming soon", "Lead scrapers", "A place to launch or document lead collection tools."],
    ["Coming soon", "Prompt templates", "Reusable marketing, SEO, review reply, and product copy prompts."],
    ["Coming soon", "Reporting links", "Ads, Search Console, analytics, call tracking, and ranking dashboards."],
    ["Coming soon", "Asset library", "Future home for R2-backed photos, videos, screenshots, and brand files."],
    ["Coming soon", "Automation notes", "Campaign routines, weekly jobs, and checks that should become Workers later."]
  ];
  view.innerHTML = `
    <section class="panel fenster-tool">
      <div class="panel-header">
        <div>
          <h3>Fenster Meta Bot</h3>
          <p class="panel-subtitle">Facebook inbox, draft replies, and approval-only sending on the same Cloudflare Pages app.</p>
        </div>
        <div class="actions tool-actions">
          <button onclick="window.dashboardFensterSeed()">Seed demo</button>
          <button onclick="window.dashboardFensterSync()">Sync Facebook</button>
          <button onclick="window.dashboardFensterRefresh()">Refresh</button>
        </div>
      </div>
      <p id="fenster-status" class="result-note">Loading Fenster Meta Bot...</p>
      <div id="fenster-app" class="fenster-app"></div>
    </section>
    <div class="tool-grid secondary-tools">${tools.map(([badge, name, text]) => `<article class="tool"><span class="tool-badge">${badge}</span><h3>${name}</h3><p>${text}</p></article>`).join("")}</div>
  `;
  loadFenster();
}

async function loadFenster() {
  const mount = $("#fenster-app");
  const status = $("#fenster-status");
  if (!mount || current !== "tools") return;
  try {
    fensterState = await api("/api/fenster/state");
    status.textContent = "";
    renderFenster();
  } catch (error) {
    status.textContent = error.message;
    mount.innerHTML = "";
  }
}

function renderFenster() {
  const mount = $("#fenster-app");
  if (!mount || !fensterState) return;
  const conversations = fensterConversations();
  const visible = visibleFensterConversations();
  const awaiting = conversations.filter((item) => latestFensterMessageIsInbound(item) && !isFensterHidden(item)).length;
  const drafts = conversations.filter((item) => item.draft_status === "draft" && latestFensterMessageIsInbound(item)).length;
  const human = conversations.filter((item) => item.decision_action === "FLAG_HUMAN" && latestFensterMessageIsInbound(item)).length;
  const hidden = conversations.filter(isFensterHidden).length;
  const bot = fensterState.bot || { active: false, queue: [], waitingToSend: 0, waitingForHuman: human };
  const queue = bot.queue || [];

  if (!selectedFensterConversationId || !visible.some((item) => item.id === selectedFensterConversationId)) {
    selectedFensterConversationId = visible[0]?.id || null;
  }

  mount.innerHTML = `
    <div class="fenster-metrics">
      ${fensterMetric(conversations.length, "Facebook threads")}
      ${fensterMetric(awaiting, "Awaiting reply")}
      ${fensterMetric(drafts, "Drafts ready")}
      ${fensterMetric(human, "Needs human")}
      ${fensterMetric(hidden, "Hidden")}
      ${fensterMetric(fensterState.config.openAi ? "Connected" : "Missing", "OpenAI")}
      ${fensterMetric(fensterState.config.meta ? "Connected" : "No token", "Meta")}
    </div>
    <div class="bot-control">
      <div>
        <p class="eyebrow">Semi automatic mode</p>
        <h3>${bot.active ? "Bot is running" : "Bot is stopped"}</h3>
        <p class="panel-subtitle">${bot.active ? "New messages are scanned on refresh/sync. Replies wait 60 seconds before sending." : "The dashboard shows what the bot would do, but it will not send replies until started."}</p>
      </div>
      <div class="bot-stats">
        ${fensterMetric(bot.waitingToSend || 0, "messages waiting to send")}
        ${fensterMetric(bot.waitingForHuman || human, "need office")}
      </div>
      <div class="actions">
        <button class="primary-button" onclick="window.dashboardFensterStartBot()" ${bot.active ? "disabled" : ""}>Start bot</button>
        <button class="danger-action" onclick="window.dashboardFensterStopBot()" ${bot.active ? "" : "disabled"}>Stop bot</button>
      </div>
    </div>
    <div class="queue-panel">
      <div class="panel-header compact">
        <div>
          <h3>Event queue</h3>
          <p class="panel-subtitle">${queue.length} recent queue item${queue.length === 1 ? "" : "s"}</p>
        </div>
      </div>
      <div class="queue-list">
        ${queue.length ? queue.slice(0, 8).map(renderQueueItem).join("") : `<p class="empty">No queued bot actions yet.</p>`}
      </div>
    </div>
    <div class="prompt-panel">
      <div class="panel-header compact">
        <div>
          <h3>AI context</h3>
          <p class="panel-subtitle">Saved rules are included with every bot decision.</p>
        </div>
      </div>
      <label>
        Extra prompt context
        <textarea id="fenster-prompt-context">${escapeHtml(bot.promptContext || "")}</textarea>
      </label>
      <div class="actions">
        <button onclick="window.dashboardFensterSavePrompt()">Save AI context</button>
      </div>
    </div>
    <div class="fenster-tabs">
      ${[
        ["awaiting", "Awaiting reply"],
        ["new", "New enquiries"],
        ["all", "All conversations"]
      ].map(([id, label]) => `<button class="${fensterTab === id ? "active" : ""}" onclick="window.dashboardFensterTab('${id}')">${label}</button>`).join("")}
    </div>
    <div class="fenster-shell">
      <aside class="fenster-list">
        <div class="panel-header compact">
          <div>
            <h3>${fensterTab === "new" ? "New enquiries" : fensterTab === "all" ? "All conversations" : "Awaiting reply"}</h3>
            <p class="panel-subtitle">${visible.length} visible thread${visible.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        <div class="fenster-threads">
          ${visible.length ? visible.map(renderFensterThread).join("") : `<p class="empty">No conversations here.</p>`}
        </div>
      </aside>
      <section class="fenster-detail">
        ${selectedFensterConversationId ? renderFensterDetail(visible.find((item) => item.id === selectedFensterConversationId)) : `<div class="detail-empty">Sync Facebook or seed demo data to begin.</div>`}
      </section>
    </div>
  `;
}

function fensterMetric(value, label) {
  return `<article class="metric"><strong>${escapeHtml(value)}</strong><span>${label}</span></article>`;
}

function renderQueueItem(item) {
  const conversation = fensterConversations().find((thread) => thread.id === item.conversation_id);
  return `
    <article class="queue-item">
      <div>
        <strong>${escapeHtml(item.action || "Action")}</strong>
        <span>${escapeHtml(conversation?.display_name || item.conversation_id || "")}</span>
      </div>
      <span class="pill status-${slug(item.status || "pending")}">${escapeHtml(item.status || "pending")}</span>
      <time>${escapeHtml(item.not_before || item.created_at || "")}</time>
    </article>
  `;
}

function fensterConversations() {
  return (fensterState?.conversations || [])
    .filter((item) => item.channel === "facebook" || item.channel === "instagram")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

function latestFensterMessageIsInbound(conversation) {
  return conversation.messages?.at(-1)?.direction === "inbound";
}

function lastFensterCustomerMessage(conversation) {
  return [...(conversation.messages || [])].reverse().find((message) => message.direction === "inbound");
}

function isFensterHidden(conversation) {
  const latestInbound = lastFensterCustomerMessage(conversation);
  return Boolean(latestInbound && conversation.hidden_until_message_id === latestInbound.id);
}

function isFensterNewEnquiry(conversation) {
  const inbound = (conversation.messages || []).filter((message) => message.direction === "inbound");
  if (!inbound.length || !latestFensterMessageIsInbound(conversation)) return false;
  const latestInbound = inbound.at(-1);
  const previous = [...(conversation.messages || [])]
    .reverse()
    .find((message) => new Date(message.created_at).getTime() < new Date(latestInbound.created_at).getTime());
  if (!previous) return true;
  return new Date(latestInbound.created_at).getTime() - new Date(previous.created_at).getTime() >= 60 * 24 * 60 * 60 * 1000;
}

function visibleFensterConversations() {
  const conversations = fensterConversations();
  if (fensterTab === "all") return conversations;
  const inbound = conversations.filter((item) => latestFensterMessageIsInbound(item) && !isFensterHidden(item));
  if (fensterTab === "new") return inbound.filter(isFensterNewEnquiry);
  return inbound.filter((item) => !isFensterNewEnquiry(item));
}

function renderFensterThread(conversation) {
  const last = conversation.messages?.at(-1);
  const active = conversation.id === selectedFensterConversationId ? "active" : "";
  const label = latestFensterMessageIsInbound(conversation)
    ? conversation.decision_action === "FLAG_HUMAN" ? "Needs human" : conversation.decision_action === "NO_REPLY" ? "No reply" : isFensterNewEnquiry(conversation) ? "New enquiry" : "Awaiting reply"
    : "Replied";
  return `
    <button class="fenster-thread ${active}" onclick="window.dashboardFensterSelect('${conversation.id}')">
      <span class="thread-top">
        <strong>${escapeHtml(conversation.display_name)}</strong>
        <time>${formatDate(conversation.updated_at)}</time>
      </span>
      <span class="thread-snippet">${escapeHtml(last?.text || "No message text")}</span>
      <span class="thread-bottom"><span>${label}</span><span>${escapeHtml(conversation.draft_status)}</span></span>
    </button>
  `;
}

function renderFensterDetail(conversation) {
  if (!conversation) return `<div class="detail-empty">Select a conversation.</div>`;
  const draftUnavailable = (conversation.draft || "").startsWith("[Draft unavailable:");
  const canGenerate = latestFensterMessageIsInbound(conversation);
  const canSend = canGenerate && conversation.decision_action === "REPLY" && conversation.draft && !draftUnavailable;
  const canHide = canGenerate && fensterTab !== "all";
  const decision = conversation.decision_action || "PENDING";
  const decisionClass = decision === "FLAG_HUMAN" ? "danger" : decision === "NO_REPLY" ? "quiet" : "ready";

  return `
    <div class="detail-head">
      <div>
        <p class="eyebrow">${escapeHtml(conversation.channel)} inbox</p>
        <h3>${escapeHtml(conversation.display_name)}</h3>
      </div>
      <span class="meta">${formatDateTime(conversation.updated_at)}</span>
    </div>
    <div class="decision-banner ${decisionClass}">
      <strong>${escapeHtml(decisionLabel(decision))}</strong>
      <span>${escapeHtml(conversation.internal_note || decisionHelp(decision))}</span>
    </div>
    <div class="message-stream">
      ${(conversation.messages || []).map((message) => `
        <div class="message ${message.direction === "outbound" ? "outbound" : "inbound"}">
          <div>${escapeHtml(message.text)}</div>
          <time>${formatDateTime(message.created_at)}</time>
        </div>
      `).join("")}
    </div>
    <div class="draft-box">
      <label>
        Suggested reply
        <textarea id="fenster-draft">${escapeHtml(conversation.draft || "")}</textarea>
      </label>
      <div class="draft-actions">
        <button onclick="window.dashboardFensterGenerate()" ${canGenerate ? "" : "disabled"}>Generate draft</button>
        <button onclick="window.dashboardFensterSaveDraft()">Save edit</button>
        <button class="primary-button" onclick="window.dashboardFensterSend()" ${canSend ? "" : "disabled"}>Approve and send</button>
        <button onclick="window.dashboardFensterEmailOffice()">Send email to info@</button>
        <button onclick="window.dashboardFensterReject()">Reject decision</button>
        <button onclick="window.dashboardFensterHide()" ${canHide ? "" : "disabled"}>Hide</button>
        <span class="meta">${escapeHtml(conversation.draft_status)}</span>
      </div>
    </div>
  `;
}

function decisionLabel(decision) {
  return {
    REPLY: "Decision: reply",
    NO_REPLY: "Decision: no reply",
    FLAG_HUMAN: "Decision: flag human",
    PENDING: "Decision pending"
  }[decision] || `Decision: ${decision}`;
}

function decisionHelp(decision) {
  return {
    REPLY: "Review the suggested reply, then approve and send if it is right.",
    NO_REPLY: "The bot thinks this should be logged without sending anything.",
    FLAG_HUMAN: "This has been offloaded to the office team. Do not auto-send a bot reply.",
    PENDING: "Generate a decision before sending."
  }[decision] || "";
}

function setFensterStatus(text) {
  const status = $("#fenster-status");
  if (status) status.textContent = text;
}

async function fensterAction(path, options = {}, progress = "Working...") {
  setFensterStatus(progress);
  try {
    await api(path, options);
    await loadFenster();
  } catch (error) {
    setFensterStatus(error.message);
    alert(error.message);
  }
}

function fensterSetTab(tab) {
  fensterTab = tab;
  selectedFensterConversationId = null;
  renderFenster();
}

function fensterSelect(id) {
  selectedFensterConversationId = id;
  renderFenster();
}

function selectedFensterConversation() {
  return fensterConversations().find((item) => item.id === selectedFensterConversationId);
}

async function fensterSeed() {
  await fensterAction("/api/fenster/demo/seed", { method: "POST", body: {} }, "Seeding demo conversations...");
}

async function fensterSync() {
  await fensterAction("/api/fenster/meta/sync", { method: "POST", body: {} }, "Syncing Facebook...");
}

async function fensterStartBot() {
  if (!confirm("Start the bot? It will scan new messages, email office leads, and send approved-style replies after a 60 second delay.")) return;
  await fensterAction("/api/fenster/bot/start", { method: "POST", body: {} }, "Starting bot...");
}

async function fensterStopBot() {
  if (!confirm("Stop the bot? Pending queued replies will stay queued but will not send while stopped.")) return;
  await fensterAction("/api/fenster/bot/stop", { method: "POST", body: {} }, "Stopping bot...");
}

async function fensterSavePrompt() {
  await fensterAction("/api/fenster/bot/prompt", {
    method: "POST",
    body: { promptContext: $("#fenster-prompt-context")?.value || "" }
  }, "Saving AI context...");
}

async function fensterGenerate() {
  if (!selectedFensterConversationId) return;
  await fensterAction(`/api/fenster/conversations/${selectedFensterConversationId}/generate-draft`, { method: "POST", body: {} }, "Generating draft...");
}

async function fensterSaveDraft() {
  if (!selectedFensterConversationId) return;
  await fensterAction(`/api/fenster/conversations/${selectedFensterConversationId}/draft`, {
    method: "POST",
    body: { draft: $("#fenster-draft")?.value || "" }
  }, "Saving draft...");
}

async function fensterHide() {
  if (!selectedFensterConversationId) return;
  const conversation = selectedFensterConversation();
  if (!confirm(`Hide ${conversation?.display_name || "this thread"} until they send another message?`)) return;
  await fensterAction(`/api/fenster/conversations/${selectedFensterConversationId}/hide`, { method: "POST", body: {} }, "Hiding conversation...");
}

async function fensterSend() {
  if (!selectedFensterConversationId) return;
  const conversation = selectedFensterConversation();
  if (!confirm(`Send this reply to ${conversation?.display_name || "this selected user"}?`)) return;
  await fensterAction(`/api/fenster/conversations/${selectedFensterConversationId}/send`, {
    method: "POST",
    body: {
      text: $("#fenster-draft")?.value || "",
      confirm: `SEND:${selectedFensterConversationId}`
    }
  }, "Sending reply...");
}

async function fensterEmailOffice() {
  if (!selectedFensterConversationId) return;
  const conversation = selectedFensterConversation();
  if (!confirm(`Forward this full chat to info@fensterglazing.com for ${conversation?.display_name || "this selected user"}?`)) return;
  await fensterAction(`/api/fenster/conversations/${selectedFensterConversationId}/email-office`, {
    method: "POST",
    body: { note: "Manual office email requested from the dashboard." }
  }, "Emailing office...");
}

async function fensterReject() {
  if (!selectedFensterConversationId) return;
  const conversation = selectedFensterConversation();
  const note = prompt(`Why reject the bot decision for ${conversation?.display_name || "this conversation"}?`, "Needs human review.");
  if (note === null) return;
  await fensterAction(`/api/fenster/conversations/${selectedFensterConversationId}/reject`, {
    method: "POST",
    body: { note }
  }, "Rejecting decision...");
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
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
    tickets: "Drag requests between columns. Click priority, owner, or type on the card to change it.",
    todays_plan: "Anyone can add the day's plan, add notes, mark it done, or carry it forward tomorrow.",
    social_posts: "Plan social ideas, draft captions, schedule content, and keep posted work visible.",
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
    .map(([label, value, key]) => editableChip(table, item, key, label, value))
    .join("");
  const actions = actionButtons(item, table);
  return `
    <article class="card" draggable="true" data-table="${table}" data-id="${item.id}">
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
      ["Status", item.status, "status"],
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
    todays_plan: [
      ["Owner", item.owner, "owner"],
      ["Status", item.status, "status"],
      ["Updated by", item.updated_by, "author"]
    ],
    social_posts: [
      ["Status", item.status, "status"],
      ["Platform", item.platform, "platform"],
      ["Type", item.content_type, "asset_type"],
      ["Scheduled", item.scheduled_for, "deadline"]
    ],
    content_requests: [
      ["Status", item.status, "status"],
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

function editableChip(table, item, key, label, value) {
  const field = fieldForMetaKey(table, key);
  const options = fieldOptions(table, field);
  const id = item.id || item.customId;
  if (!options.length || !id) {
    return `<span class="pill ${key}-${slug(value)}"><span class="meta-label">${label}</span>${escapeHtml(value)}</span>`;
  }
  return `
    <label class="pill inline-select ${key}-${slug(value)}">
      <span class="meta-label">${label}</span>
      <select onchange="window.dashboardPatch('${table}', ${id}, {${field}: this.value})" onclick="event.stopPropagation()">
        ${options.map((option) => `<option value="${escapeHtml(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function fieldForMetaKey(table, key) {
  const aliases = {
    asset_type: table === "social_posts" ? "content_type" : "asset_type",
    requester: table === "tickets" ? "requester" : "requester",
    author: table === "ideas" ? "author" : "updated_by",
    deadline: table === "social_posts" ? "scheduled_for" : "deadline"
  };
  return aliases[key] || key;
}

function fieldOptions(table, field) {
  return (config[table]?.fields || []).find(([name]) => name === field)?.[3] || [];
}

function actionButtons(item, table) {
  if (table === "tasks") {
    return `<div class="actions"><button onclick="window.dashboardPatch('${table}', ${item.id}, {done: 1})">Done</button>${noteAction(table, item)}${deleteMenu(table, item)}</div>`;
  }
  if (table === "tickets") {
    return `<div class="actions">${noteAction(table, item)}${deleteMenu(table, item, "window.dashboardDeleteTicket")}</div>`;
  }
  return `<div class="actions">${noteAction(table, item)}${deleteMenu(table, item)}</div>`;
}

function noteAction(table, item) {
  return `<button class="note-button" onclick="window.dashboardOpenNotes('${table}', ${item.id})">${noteBadge(table, item.id)}</button>`;
}

function noteBadge(table, id) {
  const count = state.note_counts?.[`${table}:${id}`] || 0;
  return `<span class="note-mark ${count ? "has-notes" : ""}" aria-hidden="true">📝</span><span>${count ? `${count} note${count === 1 ? "" : "s"}` : "Notes"}</span>`;
}

function deleteMenu(table, item, fn = "window.dashboardDeleteRecord") {
  const call = fn === "window.dashboardDeleteTicket"
    ? `${fn}(${item.id})`
    : `${fn}('${table}', ${item.id})`;
  return `<details class="card-menu"><summary aria-label="More actions">...</summary><button class="danger-action" onclick="${call}">Delete</button></details>`;
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
  if (table === "todays_plan") {
    return {
      owner: user.name,
      updated_by: user.name,
      status: "Planned",
      ...body
    };
  }
  if (table === "social_posts") {
    return {
      owner: user.name,
      status: "Idea",
      ...body
    };
  }
  if (table === "ideas") {
    return {
      author: user.name,
      status: "Inbox",
      ...body
    };
  }
  if (table === "action_plan_items") {
    return {
      section: "Custom",
      effort: "medium",
      status: "Active",
      ...body
    };
  }
  if (table === "social_guidelines") {
    return {
      category: "General",
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

async function deleteTicket(id) {
  const ticket = (state.tickets || []).find((item) => item.id === id);
  if (!ticket) return;
  if (!confirm(`Delete ticket #${id}: ${ticket.title || "Untitled"}? This also removes its notes.`)) return;
  await api("/api/records/tickets", { method: "DELETE", body: { id } });
  state.tickets = (state.tickets || []).filter((item) => item.id !== id);
  seenTicketIds.delete(id);
  render();
}

async function deleteRecord(table, id) {
  const item = (state[table] || []).find((entry) => entry.id === id);
  if (!item) return;
  if (!confirm(`Delete ${item.title || "this item"}?`)) return;
  await api(`/api/records/${table}`, { method: "DELETE", body: { id } });
  state[table] = (state[table] || []).filter((entry) => entry.id !== id);
  render();
}

async function openNotes(table, id, encodedAction = "") {
  let item = (state[table] || []).find((entry) => entry.id === id);
  if (!item && table === "action_plan_items" && encodedAction) {
    item = await patchActionPlanItem(decodeActionItem(encodedAction), { status: decodeActionItem(encodedAction).status || "Active" }, { silent: true });
    id = item.id;
  }
  if (!item) return;
  notesModal.dataset.table = table;
  notesModal.dataset.id = String(id);
  $("#notes-title").textContent = item.title || `${config[table]?.title || "Item"} notes`;
  $("#notes-subtitle").textContent = noteSubtitle(table, item);
  $("#note-body").value = "";
  await renderNotes(table, id);
  notesModal.showModal();
}

function noteSubtitle(table, item) {
  return metaFor(item, table).map(([label, value]) => `${label}: ${value}`).join(" - ");
}

async function renderNotes(table, id) {
  const notes = await api(`/api/notes/${table}/${id}`);
  state.note_counts = { ...(state.note_counts || {}), [`${table}:${id}`]: notes.length };
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
  const table = notesModal.dataset.table;
  const id = Number(notesModal.dataset.id);
  const body = $("#note-body").value.trim();
  if (!table || !id || !body) return;
  await api(`/api/notes/${table}/${id}`, { method: "POST", body: { body } });
  $("#note-body").value = "";
  await renderNotes(table, id);
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
window.dashboardDeleteTicket = deleteTicket;
window.dashboardDeleteRecord = deleteRecord;
window.dashboardSearchTickets = searchTickets;
window.dashboardOpenNotes = openNotes;
window.dashboardFilterPlan = filterPlan;
window.dashboardTogglePlan = togglePlan;
window.dashboardDeleteActionItem = deleteActionItem;
window.dashboardActionToTask = actionItemToTask;
window.dashboardFensterRefresh = loadFenster;
window.dashboardFensterSeed = fensterSeed;
window.dashboardFensterSync = fensterSync;
window.dashboardFensterStartBot = fensterStartBot;
window.dashboardFensterStopBot = fensterStopBot;
window.dashboardFensterSavePrompt = fensterSavePrompt;
window.dashboardFensterTab = fensterSetTab;
window.dashboardFensterSelect = fensterSelect;
window.dashboardFensterGenerate = fensterGenerate;
window.dashboardFensterSaveDraft = fensterSaveDraft;
window.dashboardFensterSend = fensterSend;
window.dashboardFensterEmailOffice = fensterEmailOffice;
window.dashboardFensterReject = fensterReject;
window.dashboardFensterHide = fensterHide;
