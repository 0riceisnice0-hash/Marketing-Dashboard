const tabs = [
  { id: "dashboard", label: "Dashboard", icon: "D" },
  { id: "projects", label: "Projects", icon: "P" },
  { id: "tickets", label: "Tickets", icon: "T" },
  { id: "plan", label: "Plan", icon: "N" },
  { id: "completed", label: "Completed", icon: "C" },
  { id: "social", label: "Social Media", icon: "S" }
];

const viewCopy = {
  dashboard: "What matters now, what is blocked, and what has recently shipped.",
  projects: "Choose a work area, then link tickets, ideas, plans, and updates into it.",
  tickets: "Requests stay separate, with each one linked to a project area.",
  plan: "Today, this week, and the wider marketing action plan in one focused place.",
  completed: "Completed projects, shipped work, and end-of-day reports.",
  social: "Social planning, guidelines, and content movement without mixing it into ideas."
};

const projectAreas = [
  { key: "website", name: "Website", text: "Pages, SEO, website fixes, product pages, tracking, forms, and launches." },
  { key: "brochure", name: "Brochure", text: "Brochures, leaflets, sales sheets, showroom print, plaques, and sales material." },
  { key: "social-media", name: "Social Media", text: "Posts, stories, reels, content guidelines, review highlights, and social ideas." },
  { key: "tools", name: "Tools", text: "Meta Bot, automations, dashboard work, AI helpers, and operational software." },
  { key: "application-development", name: "Application Development", text: "Dashboard, bot, Cloudflare, internal apps, and technical systems." },
  { key: "misc", name: "Misc", text: "Useful work that does not fit a named project yet." },
  { key: "unsorted-tickets", name: "Unsorted Tickets", text: "Older requests that still need a proper project link." }
];

const priorityOptions = ["Low", "Normal", "Urgent", "Boss panic mode"];

const actionPlan = [
  {
    section: "Immediate Actions",
    effort: "easy",
    items: [
      ["Take over Instagram messaging", "Sort the new Instagram messaging process now that Fenster is responsible for it. Aim for fast, friendly replies and make sure no enquiries are left sitting."],
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

const dailyChecklist = [
  {
    title: "Reply to reviews",
    detail: "Check Google, Trustpilot, social comments, and review platforms. Reply properly where needed.",
    project_key: "social-media"
  }
];

const socialGuidelineDefaults = [
  {
    id: "default-crown",
    title: "Benchmark: better than Crown",
    category: "Brand voice",
    body: "Fenster should look more active, premium, trustworthy, and helpful than Crown across social media."
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
      ["priority", "Priority", "select", priorityOptions],
      ["project_key", "Project", "select", projectOptions()],
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
      ["priority", "Priority", "select", priorityOptions],
      ["project_key", "Project", "select", projectOptions()],
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
      ["priority", "Priority", "select", priorityOptions],
      ["project_key", "Project", "select", projectOptions()],
      ["due_date", "Due date", "date"]
    ]
  },
  todays_plan: {
    table: "todays_plan",
    title: "Plan item",
    fields: [
      ["title", "Plan item", "text"],
      ["owner", "Owner", "hidden", "currentUser"],
      ["priority", "Priority", "select", priorityOptions],
      ["status", "Status", "select", ["Planned", "Doing", "Parked", "Done", "Carry on tomorrow"]],
      ["project_key", "Project", "select", projectOptions()],
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
      ["priority", "Priority", "select", priorityOptions],
      ["status", "Status", "select", ["Idea", "Planned", "Scheduled", "Posted", "Parked"]],
      ["project_key", "Project", "select", projectOptions()],
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
      ["priority", "Priority", "select", priorityOptions],
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
      ["priority", "Priority", "select", priorityOptions],
      ["project_key", "Project", "select", projectOptions()],
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
      ["priority", "Priority", "select", priorityOptions],
      ["deadline", "Deadline", "date"],
      ["status", "Status", "select", ["Needed", "Requested", "Received", "Used"]],
      ["project_key", "Project", "select", projectOptions()],
      ["detail", "Detail", "textarea"]
    ]
  },
  website_updates: {
    table: "website_updates",
    title: "Website update",
    fields: [
      ["title", "Title", "text"],
      ["area", "Area", "select", ["Homepage", "Product page", "Gallery", "SEO", "Forms", "Tracking", "Changelog"]],
      ["priority", "Priority", "select", priorityOptions],
      ["status", "Status", "select", ["Plan", "Active", "Parked", "Done"]],
      ["project_key", "Project", "select", projectOptions()],
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
      ["priority", "Priority", "select", priorityOptions],
      ["project_key", "Project", "select", projectOptions()],
      ["detail", "Detail", "textarea"]
    ]
  },
  daily_reports: {
    table: "daily_reports",
    title: "Daily report",
    fields: [
      ["title", "Title", "hidden", "dailyReportTitle"],
      ["report_date", "Date", "date"],
      ["body", "What happened today and what did you do?", "textarea"],
      ["updated_by", "Updated by", "hidden", "currentUser"]
    ]
  }
};

let state = {};
let fensterState = null;
let websiteState = null;
let websiteView = "overview";
let websiteVisitorJourney = null;
let websiteChatTranscript = null;
let fensterTab = "awaiting";
let toolsTab = "hub";
let selectedFensterConversationId = null;
let current = "dashboard";
let selectedProjectKey = "";
let selectedReportDate = new Date().toISOString().slice(0, 10);
let selectedTicketFilter = "";
let selectedSocialFilter = "";
let showPlanDone = false;
let user = null;
let ticketSearch = "";
let refreshTimer = null;
let notificationReady = false;
let seenTaskIds = new Set();
let seenPlanIds = new Set();
let seenTicketIds = new Set();
let seenSocialIds = new Set();

const dashboardDraftPrefix = "marketing-dashboard:draft:";

function dashboardDraftKey(field) {
  return field?.dataset?.dashboardDraft || "";
}

function rememberDashboardDrafts(scope = document) {
  scope.querySelectorAll?.("[data-dashboard-draft]").forEach((field) => {
    const key = dashboardDraftKey(field);
    if (!key) return;
    try { sessionStorage.setItem(dashboardDraftPrefix + key, field.value || ""); } catch (_error) {}
  });
}

function restoreDashboardDrafts(scope = document) {
  scope.querySelectorAll?.("[data-dashboard-draft]").forEach((field) => {
    const key = dashboardDraftKey(field);
    if (!key) return;
    try {
      const saved = sessionStorage.getItem(dashboardDraftPrefix + key);
      if (saved !== null) field.value = saved;
    } catch (_error) {}
  });
}

function clearDashboardDraft(key) {
  try { sessionStorage.removeItem(dashboardDraftPrefix + key); } catch (_error) {}
}

document.addEventListener("input", (event) => {
  const field = event.target.closest?.("[data-dashboard-draft]");
  const key = dashboardDraftKey(field);
  if (!key) return;
  try { sessionStorage.setItem(dashboardDraftPrefix + key, field.value || ""); } catch (_error) {}
});

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
    if (current === "projects" && selectedProjectKey === "tools") {
      if (toolsTab === "meta") {
        await api("/api/fenster/meta/sync", { method: "POST", body: {} });
        await loadFenster(true);
      } else if (toolsTab === "website") {
        await loadWebsite(true);
      }
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
  rememberDashboardDrafts(view);
  $("#view-title").textContent = tabs.find((tab) => tab.id === current)?.label || "Dashboard";
  document.querySelector(".topbar .eyebrow").textContent = viewCopy[current] || "Live marketing command desk";
  document.querySelectorAll("#tabs button").forEach((button) => {
    button.setAttribute("aria-selected", String(button.dataset.tab === current));
  });

  const renderers = {
    dashboard: renderDashboard,
    projects: renderProjects,
    tickets: renderTickets,
    plan: renderPlan,
    completed: renderCompleted,
    social: renderSocial
  };

  (renderers[current] || renderDashboard)();
  restoreDashboardDrafts(view);
  wireBoardDragDrop();
}

function normalizeState(next) {
  const priorityTables = ["tickets", "ideas", "tasks", "todays_plan", "social_posts", "social_guidelines", "action_plan_items", "content_requests", "website_updates", "changelog"];
  const normalized = { ...next };
  for (const table of priorityTables) {
    normalized[table] = (normalized[table] || []).map((item) => ({ priority: "Normal", ...item }));
  }
  return {
    ...normalized,
    website_updates: (normalized.website_updates || []).map((item) => ({
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
  const guidelines = [...socialGuidelineDefaults, ...(state.social_guidelines || [])];
  const groups = ["Idea", "Planned", "Scheduled", "Posted", "Parked"];
  const posts = state.social_posts || [];
  const visible = selectedSocialFilter ? posts.filter((item) => item.status === selectedSocialFilter) : [];
  view.innerHTML = `
    <div class="ticket-toolbar">
      <button class="primary-button" onclick="window.dashboardOpen('social_posts')">New social post</button>
    </div>
    <div class="summary-grid">
      ${groups.map((group) => `
        <button class="summary-box ${selectedSocialFilter === group ? "active" : ""}" onclick="window.dashboardSelectSocial('${group}')">
          <span>${group}</span>
          <strong>${posts.filter((item) => item.status === group).length}</strong>
          <small>${socialSummary(group)}</small>
        </button>
      `).join("")}
    </div>
    ${selectedSocialFilter ? `
      <section class="panel selected-list">
        ${panelHeader(selectedSocialFilter, "Click a post to view notes or use the menu to move/link it.", visible.length)}
        <div class="brief-list">${briefCards(visible.map((item) => projectFromRecord("social_posts", item, {
          type: item.content_type || "Social",
          owner: item.owner || "Zac",
          detail: item.notes || "",
          stage: stageFromSocial(item.status)
        })))}</div>
      </section>
    ` : ""}
    <div class="section-tools">
      <h3>Social guidelines</h3>
      <button onclick="window.dashboardOpen('social_guidelines')">New guideline</button>
    </div>
    <section class="guidelines-panel">
      ${guidelines.length ? guidelines.map(renderGuideline).join("") : `<p class="empty">No guidelines yet. Add brand voice notes, caption templates, or posting rules here.</p>`}
    </section>
  `;
}

function socialSummary(group) {
  return {
    Idea: "Unshaped content thoughts.",
    Planned: "Chosen posts to make.",
    Scheduled: "Ready and waiting.",
    Posted: "Published history.",
    Parked: "Kept out of the way."
  }[group] || "";
}

function renderGuideline(item) {
  const isSaved = Number.isFinite(Number(item.id));
  return `
    <article class="guideline">
      <header>
        <div>
          <h4>${escapeHtml(item.title)}</h4>
          <span class="pill">${escapeHtml(item.category || "General")}</span>
          ${priorityPill(item.priority || "Normal")}
        </div>
        ${isSaved ? `
          <details class="card-menu brief-menu">
            <summary aria-label="More actions">...</summary>
            <div class="menu-popover">
              ${prioritySelect({ table: "social_guidelines", recordId: item.id, priority: item.priority || "Normal" })}
              <button onclick="window.dashboardOpenNotes('social_guidelines', ${item.id})">Notes</button>
              <button class="danger-action" onclick="window.dashboardDeleteRecord('social_guidelines', ${item.id})">Delete</button>
            </div>
          </details>
        ` : ""}
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
    project_key: defaultProjectKeyForAction(section.section, entry[0], entry[1]),
    priority: entry[2] === "complex" ? "Urgent" : "Normal",
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
      project_key: item.project_key || defaultProjectKeyForAction(item.section, item.title, item.detail),
      priority: item.priority || "Normal",
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

function defaultProjectKeyForAction(section = "", title = "", detail = "") {
  const text = `${section} ${title} ${detail}`.toLowerCase();
  if (text.includes("social") || text.includes("instagram") || text.includes("story") || text.includes("reel") || text.includes("post")) return "social-media";
  if (text.includes("website") || text.includes("seo") || text.includes("residential") || text.includes("qr code")) return "website";
  if (text.includes("plaque") || text.includes("slides") || text.includes("leaflet") || text.includes("showroom")) return "brochure";
  if (text.includes("adminbase") || text.includes("whatsapp") || text.includes("ai") || text.includes("automation")) return "application-development";
  return "misc";
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
    body: { title: item.title, lane: "Today", owner: user.name, priority: item.priority || "Normal", project_key: item.project_key || defaultProjectKeyForAction(item.section, item.title, item.detail), due_date: "" }
  });
  state.tasks = [created, ...(state.tasks || [])];
  alert("Added to Plan as a task.");
}

async function addChecklistItem(title) {
  const item = dailyChecklist.find((entry) => entry.title === title);
  if (!item) return;
  const created = await api("/api/records/todays_plan", {
    method: "POST",
    body: {
      title: item.title,
      owner: user.name,
      status: "Planned",
      priority: "Normal",
      project_key: item.project_key || "misc",
      notes: item.detail,
      updated_by: user.name
    }
  });
  state.todays_plan = [created, ...(state.todays_plan || [])];
  render();
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
        status: patch.status || item.status || "Active",
        priority: patch.priority || item.priority || "Normal",
        project_key: patch.project_key || item.project_key || defaultProjectKeyForAction(item.section, item.title, item.detail)
      }
    });
    state.action_plan_items = [saved, ...(state.action_plan_items || [])];
  }
  if (!options.silent) render();
  return saved;
}

function allProjects() {
  return [
    ...(state.tickets || []).map((item) => projectFromRecord("tickets", item, {
      type: item.category || "Request",
      owner: item.owner || "Zac",
      requester: item.requester || "",
      detail: item.detail || "",
      priority: item.priority || "Normal",
      urgent: isHighPriority(item.priority),
      stage: stageFromTicket(item.status)
    })),
    ...(state.website_updates || []).map((item) => projectFromRecord("website_updates", item, {
      type: "Website",
      owner: "Zac",
      detail: item.detail || "",
      priority: item.priority || "Normal",
      urgent: isHighPriority(item.priority),
      stage: stageFromWebsite(item.status)
    })),
    ...(state.social_posts || []).map((item) => projectFromRecord("social_posts", item, {
      type: item.content_type || "Social",
      owner: item.owner || "Zac",
      detail: item.notes || "",
      priority: item.priority || "Normal",
      urgent: isHighPriority(item.priority),
      stage: stageFromSocial(item.status)
    })),
    ...(state.content_requests || []).map((item) => projectFromRecord("content_requests", item, {
      type: item.asset_type || "Content",
      owner: item.requester || "Team",
      requester: item.requester || "",
      detail: item.detail || "",
      priority: item.priority || "Normal",
      urgent: isHighPriority(item.priority),
      stage: stageFromContent(item.status)
    })),
    ...flattenedActionPlan().map((item) => ({
      id: item.customId || actionPlanKey(item),
      table: "action_plan_items",
      recordId: item.customId || "",
      title: item.title,
      detail: item.detail || "",
      type: item.section || "Action plan",
      owner: "Zac",
      requester: "",
      source: "Action plan",
      projectKey: projectKeyFor(item, "action_plan_items"),
      status: item.status || "Active",
      stage: item.status === "Done" ? "Done" : item.status === "Parked" ? "Parked" : "Active",
      priority: item.priority || (item.effort === "complex" ? "Urgent" : "Normal"),
      urgent: isHighPriority(item.priority || (item.effort === "complex" ? "Urgent" : "Normal")),
      updated: "",
      actionKey: actionPlanKey(item),
      raw: item
    })),
    ...(state.ideas || []).map((item) => projectFromRecord("ideas", item, {
      type: "Idea",
      owner: item.author || "Team",
      requester: item.author || "",
      detail: item.detail || "",
      priority: item.priority || "Normal",
      urgent: isHighPriority(item.priority) || item.impact === "High",
      stage: stageFromIdea(item.status)
    })),
    ...(state.tasks || []).filter((item) => !Number(item.done)).map((item) => projectFromRecord("tasks", item, {
      type: "Task",
      owner: item.owner || "Zac",
      detail: item.due_date ? `Due ${item.due_date}` : "",
      priority: item.priority || "Normal",
      urgent: isHighPriority(item.priority),
      stage: item.lane === "Later" ? "Inbox" : "Active"
    }))
  ].sort((a, b) => projectSort(a) - projectSort(b));
}

function projectFromRecord(table, item, extras = {}) {
  return {
    id: `${table}:${item.id}`,
    table,
    recordId: item.id,
    title: item.title || "Untitled",
    detail: extras.detail || item.detail || "",
    type: extras.type || config[table]?.title || "Project",
    owner: extras.owner || item.owner || "Zac",
    requester: extras.requester || "",
    source: config[table]?.title || table,
    projectKey: projectKeyFor(item, table),
    priority: extras.priority || item.priority || "Normal",
    status: item.status || item.lane || "",
    stage: extras.stage || "Active",
    urgent: Boolean(extras.urgent),
    updated: item.updated_at || item.created_at || item.release_date || item.scheduled_for || "",
    raw: item
  };
}

function projectOptions() {
  return projectAreas.map((project) => project.key);
}

function projectName(key) {
  return projectAreas.find((project) => project.key === key)?.name || "Misc";
}

function projectItems(key) {
  return allProjects().filter((project) => project.projectKey === key);
}

function projectKeyFor(item, table) {
  return item.project_key || inferProjectKey(item, table);
}

function inferProjectKey(item, table) {
  if (table === "website_updates") return "website";
  if (table === "social_posts" || table === "social_guidelines") return "social-media";
  if (table === "tasks") return "misc";
  const text = [item.title, item.detail, item.notes, item.category, item.asset_type, item.area, item.section].join(" ").toLowerCase();
  if (/\b(meta bot|bot|cloudflare|dashboard|app|application|automation|worker|ai)\b/.test(text)) return "application-development";
  if (/\b(website|webpage|homepage|seo|form|tracking|page|gallery)\b/.test(text)) return "website";
  if (/\b(brochure|leaflet|print|sales sheet|slides|plaque|showroom|van|qr)\b/.test(text)) return "brochure";
  if (/\b(social|instagram|facebook|tiktok|linkedin|post|story|reel|review)\b/.test(text)) return "social-media";
  if (table === "tickets") return "unsorted-tickets";
  return "misc";
}

function briefCards(items) {
  if (!items.length) return `<p class="empty">Nothing here.</p>`;
  return items.map(briefCard).join("");
}

function briefCard(project) {
  return `
    <article class="brief-card" draggable="true" data-table="${project.table}" data-id="${project.recordId}" data-action-key="${escapeHtml(project.actionKey || "")}">
      <button class="brief-main" onclick="window.dashboardOpenNotes('${project.table}', ${Number(project.recordId) || 0}, '${project.actionKey ? encodeActionItem(project.raw) : ""}')">
        <span>${escapeHtml(project.source)}</span>
        <strong>${escapeHtml(project.title || "Untitled")}</strong>
        ${project.detail ? `<small>${escapeHtml(project.detail)}</small>` : ""}
      </button>
      <div class="brief-side">
        <span class="pill status-${slug(project.stage)}">${escapeHtml(project.stage)}</span>
        ${priorityPill(project.priority)}
        ${briefMenu(project)}
      </div>
    </article>
  `;
}

function briefMenu(project) {
  if (!project.recordId && project.table !== "action_plan_items") return "";
  return `
    <details class="card-menu brief-menu">
      <summary aria-label="More actions">...</summary>
      <div class="menu-popover">
        ${project.table === "action_plan_items" ? actionLinkSelect(project.raw) : linkSelect(project)}
        ${prioritySelect(project)}
        ${project.table === "action_plan_items" ? actionStatusButtons(project.raw) : statusButtons(project)}
      </div>
    </details>
  `;
}

function linkSelect(project) {
  if (!project.recordId) return "";
  return `
    <label class="link-select">
      <span>Link this to</span>
      <select onchange="window.dashboardLinkProject('${project.table}', ${project.recordId}, this.value)" onclick="event.stopPropagation()">
        ${projectAreas.map((area) => `<option value="${area.key}" ${project.projectKey === area.key ? "selected" : ""}>${escapeHtml(area.name)}</option>`).join("")}
      </select>
    </label>
  `;
}

function actionLinkSelect(item) {
  if (!item) return "";
  const selected = item.project_key || defaultProjectKeyForAction(item.section, item.title, item.detail);
  const encoded = encodeActionItem(item);
  return `
    <label class="link-select">
      <span>Link this to</span>
      <select onchange="window.dashboardLinkActionItem('${encoded}', this.value)" onclick="event.stopPropagation()">
        ${projectAreas.map((area) => `<option value="${area.key}" ${selected === area.key ? "selected" : ""}>${escapeHtml(area.name)}</option>`).join("")}
      </select>
    </label>
  `;
}

function priorityPill(priority = "Normal") {
  return `<span class="pill priority-${slug(priority)}">${escapeHtml(priority || "Normal")}</span>`;
}

function prioritySelect(project) {
  if (!project) return "";
  const selected = project.priority || "Normal";
  if (project.table === "action_plan_items") {
    const encoded = encodeActionItem(project.raw);
    return `
      <label class="link-select">
        <span>Priority</span>
        <select onchange="window.dashboardSetActionPriority('${encoded}', this.value)" onclick="event.stopPropagation()">
          ${priorityOptions.map((option) => `<option value="${escapeHtml(option)}" ${selected === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
        </select>
      </label>
    `;
  }
  if (!project.recordId) return "";
  return `
    <label class="link-select">
      <span>Priority</span>
      <select onchange="window.dashboardPatch('${project.table}', ${project.recordId}, {priority: this.value})" onclick="event.stopPropagation()">
        ${priorityOptions.map((option) => `<option value="${escapeHtml(option)}" ${selected === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function statusButtons(project) {
  if (!project.recordId) return "";
  const stages = ["Inbox", "Active", "Waiting", "Parked", "Done"].filter((stage) => stage !== project.stage);
  return `<div class="menu-actions">${stages.map((stage) => `<button onclick="window.dashboardMoveProject('${project.table}', ${project.recordId}, '${stage}')">Move to ${stage}</button>`).join("")}</div>`;
}

function actionStatusButtons(item) {
  if (!item) return "";
  const encoded = encodeActionItem(item);
  return `<div class="menu-actions">${["Active", "Parked", "Done"].filter((status) => status !== item.status).map((status) => `<button onclick="window.dashboardMoveActionItem('${encoded}', '${status}')">${status}</button>`).join("")}</div>`;
}

function projectSort(project) {
  const stageWeight = { Inbox: 0, Waiting: 1, Active: 2, Parked: 3, Done: 4 };
  return (stageWeight[project.stage] || 5) - (project.urgent ? 0.5 : 0);
}

function isHighPriority(priority) {
  return ["Urgent", "Boss panic mode"].includes(priority);
}

function stageFromTicket(status) {
  return {
    New: "Inbox",
    "In Progress": "Active",
    "Waiting on Someone": "Waiting",
    Parked: "Parked",
    Done: "Done"
  }[status] || "Active";
}

function stageFromWebsite(status) {
  return {
    Plan: "Inbox",
    Planned: "Inbox",
    Active: "Active",
    "In Progress": "Active",
    Blocked: "Waiting",
    Parked: "Parked",
    Done: "Done",
    Live: "Done"
  }[status] || "Active";
}

function stageFromSocial(status) {
  return {
    Idea: "Inbox",
    Planned: "Active",
    Scheduled: "Active",
    Posted: "Done",
    Parked: "Parked"
  }[status] || "Active";
}

function stageFromIdea(status) {
  return {
    Inbox: "Inbox",
    Considering: "Active",
    Approved: "Active",
    Parked: "Parked",
    Done: "Done"
  }[status] || "Inbox";
}

function stageFromContent(status) {
  return {
    Needed: "Inbox",
    Requested: "Waiting",
    Received: "Active",
    Used: "Done"
  }[status] || "Inbox";
}

function statusForProjectStage(table, stage) {
  const maps = {
    tickets: { Inbox: "New", Active: "In Progress", Waiting: "Waiting on Someone", Parked: "Parked", Done: "Done" },
    website_updates: { Inbox: "Plan", Active: "Active", Waiting: "Parked", Parked: "Parked", Done: "Done" },
    social_posts: { Inbox: "Idea", Active: "Planned", Waiting: "Scheduled", Parked: "Parked", Done: "Posted" },
    ideas: { Inbox: "Inbox", Active: "Considering", Waiting: "Considering", Parked: "Parked", Done: "Done" },
    content_requests: { Inbox: "Needed", Active: "Received", Waiting: "Requested", Parked: "Requested", Done: "Used" },
    action_plan_items: { Inbox: "Active", Active: "Active", Waiting: "Parked", Parked: "Parked", Done: "Done" }
  };
  return maps[table]?.[stage] || stage;
}

function projectCards(projects) {
  if (!projects.length) return `<p class="empty">Nothing here.</p>`;
  return projects.map(projectCard).join("");
}

function projectCard(project) {
  const detail = project.detail ? `<p>${escapeHtml(project.detail)}</p>` : "";
  return `
    <article class="project-card card" draggable="true" data-table="${project.table}" data-id="${project.recordId}" data-action-key="${escapeHtml(project.actionKey || "")}">
      <header>
        <div>
          <span class="project-source">${escapeHtml(project.source)}</span>
          <h4>${escapeHtml(project.title)}</h4>
        </div>
        <span class="pill status-${slug(project.stage)}">${escapeHtml(project.stage)}</span>
      </header>
      ${detail}
      <div class="meta">
        <span class="pill"><span class="meta-label">Type</span>${escapeHtml(project.type)}</span>
        ${priorityPill(project.priority)}
        ${project.owner ? `<span class="pill"><span class="meta-label">Owner</span>${escapeHtml(project.owner)}</span>` : ""}
        ${project.requester ? `<span class="pill"><span class="meta-label">From</span>${escapeHtml(project.requester)}</span>` : ""}
      </div>
      <div class="actions">
        ${project.recordId ? noteAction(project.table, { id: project.recordId }) : ""}
        ${project.table === "action_plan_items" ? `<button onclick="window.dashboardActionToTask('${encodeActionItem(project.raw)}')">Set as task</button>` : ""}
        ${briefMenu(project)}
      </div>
    </article>
  `;
}

function planItems() {
  const today = (state.todays_plan || []).map((item) => ({
    table: "todays_plan",
    id: item.id,
    title: item.title,
    detail: item.notes || "",
    status: item.status || "Planned",
    priority: item.priority || "Normal",
    owner: item.owner || "Zac",
    when: item.status === "Carry on tomorrow" ? "This week" : "Today"
  }));
  const tasks = (state.tasks || []).map((item) => ({
    table: "tasks",
    id: item.id,
    title: item.title,
    detail: item.due_date ? `Due ${item.due_date}` : "",
    status: Number(item.done) ? "Done" : item.lane || "Today",
    priority: item.priority || "Normal",
    owner: item.owner || "Zac",
    when: item.lane === "Today" ? "Today" : "This week"
  }));
  return [...today, ...tasks];
}

function renderPlanRow(item) {
  return `
    <article class="compact-row">
      <div>
        <strong>${escapeHtml(item.title || "Untitled")}</strong>
        <span>${escapeHtml(item.detail || item.owner || "")}</span>
      </div>
      <div class="brief-side">
        <span class="pill status-${slug(item.status)}">${escapeHtml(item.status)}</span>
        ${priorityPill(item.priority)}
        <details class="card-menu brief-menu">
          <summary aria-label="More actions">...</summary>
          <div class="menu-popover">
            ${planPrioritySelect(item)}
            ${planRowActions(item)}
          </div>
        </details>
      </div>
    </article>
  `;
}

function planRowActions(item) {
  if (item.table === "tasks") {
    if (item.status === "Done") {
      return `
        <button onclick="window.dashboardPatch('tasks', ${item.id}, {done: 0, lane: 'Today'})">Restore today</button>
        <button class="danger-action" onclick="window.dashboardDeleteRecord('tasks', ${item.id})">Delete</button>
      `;
    }
    return `
      <button onclick="window.dashboardPatch('tasks', ${item.id}, {done: 1})">Done</button>
      <button onclick="window.dashboardPatch('tasks', ${item.id}, {lane: 'Later'})">Park</button>
      <button class="danger-action" onclick="window.dashboardDeleteRecord('tasks', ${item.id})">Delete</button>
    `;
  }
  return `
    ${["Doing", "Parked", "Done", "Carry on tomorrow", "Planned"].filter((status) => status !== item.status).map((status) => `<button onclick="window.dashboardPatch('todays_plan', ${item.id}, {status: '${status}'})">${status}</button>`).join("")}
    <button class="danger-action" onclick="window.dashboardDeleteRecord('todays_plan', ${item.id})">Delete</button>
  `;
}

function planPrioritySelect(item) {
  return `
    <label class="link-select">
      <span>Priority</span>
      <select onchange="window.dashboardPatch('${item.table}', ${item.id}, {priority: this.value})" onclick="event.stopPropagation()">
        ${priorityOptions.map((option) => `<option value="${escapeHtml(option)}" ${item.priority === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderActionRow(item) {
  return `
    <article class="action-row">
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.detail || "")}</p>
      </div>
      <div class="meta">
        <span class="pill status-${slug(item.effort)}">${effortLabel(item.effort)}</span>
        ${priorityPill(item.priority || "Normal")}
        <span class="pill status-${slug(item.status)}">${escapeHtml(item.status || "Active")}</span>
      </div>
      <div class="actions">
        <button onclick="window.dashboardActionToTask('${encodeActionItem(item)}')">Set as task</button>
        <button class="note-button" onclick="window.dashboardOpenNotes('action_plan_items', ${item.customId || 0}, '${encodeActionItem(item)}')">${noteBadge("action_plan_items", item.customId)}</button>
        <details class="card-menu brief-menu">
          <summary aria-label="More actions">...</summary>
          <div class="menu-popover">
            ${actionLinkSelect(item)}
            ${prioritySelect({ table: "action_plan_items", raw: item, priority: item.priority || "Normal" })}
            ${actionStatusButtons(item)}
            <button class="danger-action" onclick="window.dashboardDeleteActionItem('${encodeActionItem(item)}')">Delete</button>
          </div>
        </details>
      </div>
    </article>
  `;
}

function renderSourceRow(kind, title, person, category) {
  return `
    <article class="compact-row">
      <div>
        <strong>${escapeHtml(title || "Untitled")}</strong>
        <span>${escapeHtml(kind)} from ${escapeHtml(person || "team")}</span>
      </div>
      <span class="pill">${escapeHtml(category || kind)}</span>
    </article>
  `;
}

function achievementFeed() {
  const shipped = (state.changelog || []).map((item) => ({
    title: item.title,
    detail: item.detail || "",
    area: item.area || "Marketing",
    projectKey: projectKeyFor(item, "changelog"),
    table: "changelog",
    recordId: item.id,
    priority: item.priority || "Normal",
    date: item.shipped_at || "",
    kind: "Logged"
  }));
  const completedProjects = allProjects()
    .filter((project) => project.stage === "Done")
    .map((project) => ({
      title: project.title,
      detail: project.detail || `Completed ${project.type.toLowerCase()} project.`,
      area: project.type || "Project",
      projectKey: project.projectKey,
      table: project.table,
      recordId: project.recordId,
      actionKey: project.actionKey,
      raw: project.raw,
      priority: project.priority || "Normal",
      date: project.updated || "",
      kind: "Completed"
    }));
  return [...shipped, ...completedProjects].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function renderAchievement(item) {
  return `
    <article class="achievement">
      <time>${escapeHtml(formatShortDate(item.date))}</time>
      <div>
        <strong>${escapeHtml(item.title || "Untitled achievement")}</strong>
        <p>${escapeHtml(item.detail || "")}</p>
        <span class="pill">${escapeHtml(item.area || item.kind || "Outcome")}</span>
        ${priorityPill(item.priority || "Normal")}
        ${achievementPriorityMenu(item)}
      </div>
    </article>
  `;
}

function achievementPriorityMenu(item) {
  if (!item?.recordId && item?.table !== "action_plan_items") return "";
  return `
    <details class="card-menu brief-menu">
      <summary aria-label="More actions">...</summary>
      <div class="menu-popover">
        ${prioritySelect(item.table === "action_plan_items" ? { table: "action_plan_items", raw: item.raw, priority: item.priority || "Normal" } : { table: item.table, recordId: item.recordId, priority: item.priority || "Normal" })}
      </div>
    </details>
  `;
}

function renderReviewSummary(feed) {
  const top = feed.slice(0, 4);
  return `
    <div class="review-summary">
      <p>The useful story is outcomes delivered, not task volume. Use this page to keep a plain-English record of projects shipped, improvements made, and systems created.</p>
      ${top.length ? `<ul>${top.map((item) => `<li>${escapeHtml(item.title)}</li>`).join("")}</ul>` : `<p class="empty">Log the first achievement to start building review evidence.</p>`}
    </div>
  `;
}

function daysAgo(value) {
  if (!value) return 9999;
  return Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
}

function formatShortDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function renderDashboard() {
  const projects = allProjects();
  const active = projects.filter((project) => project.stage === "Active");
  const waiting = projects.filter((project) => project.stage === "Waiting");
  const urgent = projects.filter((project) => project.urgent && project.stage !== "Done");
  const completed = projects.filter((project) => project.stage === "Done");
  const today = planItems().filter((item) => item.when === "Today" && item.status !== "Done");
  const recentWins = achievementFeed().slice(0, 5);

  view.innerHTML = `
    <section class="command-hero">
      <div>
        <p class="eyebrow">Fenster Marketing OS</p>
        <p>Active work, blockers, urgent requests, today, and completed outcomes in one calm view.</p>
      </div>
    </section>
    <div class="grid stats command-stats">
      ${stat("Active projects", active.length, "Work currently moving", "#1e6f92")}
      ${stat("Waiting or blocked", waiting.length, "Needs another person or decision", "#a35e00")}
      ${stat("Urgent", urgent.length, "Needs eyes first", "#c23a34")}
      ${stat("Delivered", completed.length, "Completed project evidence", "#12825a")}
    </div>
    <div class="grid command-layout">
      <section class="panel focus-panel">
        ${panelHeader("Focus now", "The smallest useful view of what needs attention.", urgent.length + waiting.length + active.length)}
        <div class="focus-stack">
          ${briefCards([...urgent, ...waiting, ...active].slice(0, 8))}
        </div>
      </section>
      <section class="panel">
        ${panelHeader("Today", "A clear day list, not another database view.", today.length)}
        <div class="compact-list">${today.length ? today.slice(0, 8).map(renderPlanRow).join("") : `<p class="empty">Nothing planned for today.</p>`}</div>
      </section>
      <section class="panel evidence-panel">
        ${panelHeader("Recent evidence", "Useful proof for reviews and weekly check-ins.", recentWins.length)}
        <div class="timeline">${recentWins.length ? recentWins.map(renderAchievement).join("") : `<p class="empty">No achievements logged yet. Start with one meaningful outcome.</p>`}</div>
      </section>
    </div>
  `;
}

function renderProjects() {
  if (selectedProjectKey) return renderProjectDetail(selectedProjectKey);
  view.innerHTML = `
    <div class="project-menu">
      ${projectAreas.map((project) => {
        const activeCount = projectItems(project.key).filter((item) => item.stage !== "Done").length;
        const doneCount = projectItems(project.key).filter((item) => item.stage === "Done").length;
        return `
          <button class="project-tile" onclick="window.dashboardOpenProject('${project.key}')">
            <span>${escapeHtml(project.name)}</span>
            <strong>${activeCount}</strong>
            <small>${escapeHtml(project.text)}</small>
            <em>${doneCount} completed</em>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderProjectDetail(key) {
  const project = projectAreas.find((item) => item.key === key) || projectAreas.at(-1);
  if (key === "tools") {
    renderToolsArea();
    return;
  }
  const items = projectItems(key);
  const active = items.filter((item) => !["Done", "Parked"].includes(item.stage));
  const parked = items.filter((item) => item.stage === "Parked");
  const done = items.filter((item) => item.stage === "Done");
  view.innerHTML = `
    <div class="project-detail-head">
      <button onclick="window.dashboardBackToProjects()">Back to projects</button>
      <div>
        <span class="project-source">Project</span>
        <h3>${escapeHtml(project.name)}</h3>
        <p>${escapeHtml(project.text)}</p>
      </div>
    </div>
    <div class="grid stats project-detail-stats">
      ${stat("Active", active.length, "Visible work", "#1e6f92")}
      ${stat("Parked", parked.length, "Paused", "#6c7785")}
      ${stat("Done", done.length, "Completed", "#12825a")}
      ${stat("Evidence", achievementFeed().filter((item) => item.projectKey === key).length, "Logged outcomes", "#7057c8")}
    </div>
    <div class="grid two">
      <section class="panel">
        ${panelHeader("Current work", "", active.length)}
        <div class="brief-list">${briefCards(active)}</div>
      </section>
      <section class="panel">
        ${panelHeader("Parked", "", parked.length)}
        <div class="brief-list">${briefCards(parked)}</div>
      </section>
      <section class="panel">
        ${panelHeader("Done", "", done.length)}
        <div class="brief-list">${briefCards(done)}</div>
      </section>
    </div>
  `;
}

function renderTickets() {
  const tickets = filteredTickets();
  const statuses = ["New", "In Progress", "Waiting on Someone", "Parked", "Done"];
  const filtered = selectedTicketFilter ? tickets.filter((item) => item.status === selectedTicketFilter) : [];
  view.innerHTML = `
    <div class="ticket-toolbar">
      <input class="search-input" type="search" placeholder="Search tickets..." value="${escapeHtml(ticketSearch)}" oninput="window.dashboardSearchTickets(this.value)">
      <button class="primary-button" onclick="window.dashboardOpen('tickets')">New ticket</button>
    </div>
    <div class="summary-grid">
      ${statuses.map((status) => `
        <button class="summary-box ${selectedTicketFilter === status ? "active" : ""}" onclick="window.dashboardSelectTickets('${status}')">
          <span>${status}</span>
          <strong>${tickets.filter((ticket) => ticket.status === status).length}</strong>
          <small>${ticketSummary(status)}</small>
        </button>
      `).join("")}
    </div>
    ${selectedTicketFilter ? `
      <div class="ticket-project-groups">
        ${projectAreas.map((project) => {
          const list = filtered.filter((ticket) => projectKeyFor(ticket, "tickets") === project.key);
          if (!list.length && project.key !== "unsorted-tickets") return "";
          return `
            <section class="panel ticket-group">
              ${panelHeader(project.name, project.text, list.length)}
              <div class="brief-list">${briefCards(list.map((ticket) => projectFromRecord("tickets", ticket, {
              type: ticket.category || "Ticket",
              owner: ticket.owner || "Zac",
              requester: ticket.requester || "",
              detail: ticket.detail || "",
              priority: ticket.priority || "Normal",
              urgent: isHighPriority(ticket.priority),
              stage: stageFromTicket(ticket.status)
              })))}</div>
            </section>
          `;
        }).join("")}
      </div>
    ` : ""}
  `;
}

function ticketSummary(status) {
  return {
    New: "Waiting to be triaged.",
    "In Progress": "Being worked on.",
    "Waiting on Someone": "Needs someone else.",
    Parked: "Paused for now.",
    Done: "Completed ticket history."
  }[status] || "";
}

function renderPlan() {
  const items = planItems();
  const visibleItems = showPlanDone ? items.filter((item) => item.status === "Done") : items.filter((item) => item.status !== "Done");
  const actionItems = flattenedActionPlan().filter((item) => item.status !== "Deleted" && (showPlanDone || item.status !== "Done"));
  const todayItems = visibleItems.filter((item) => item.when === "Today");
  const weekItems = visibleItems.filter((item) => item.when !== "Today");
  view.innerHTML = `
    <div class="ticket-toolbar">
      <button onclick="window.dashboardOpen('action_plan_items')">Add action</button>
      <button class="primary-button" onclick="window.dashboardOpen('todays_plan')">Add today</button>
      <button onclick="window.dashboardTogglePlanDone()">${showPlanDone ? "Hide done" : "Show done"}</button>
    </div>
    ${showPlanDone ? `
      <section class="panel">
        ${panelHeader("Done", "", visibleItems.length)}
        <div class="compact-list">${visibleItems.map(renderPlanRow).join("") || `<p class="empty">Nothing done yet.</p>`}</div>
      </section>
    ` : `
      <div class="grid two plan-v2">
        <section class="panel">
          ${panelHeader("Today", "", todayItems.length)}
          <div class="compact-list">${todayItems.map(renderPlanRow).join("") || `<p class="empty">No plan items for today.</p>`}</div>
        </section>
        <section class="panel">
          ${panelHeader("This week", "", weekItems.length)}
          <div class="compact-list">${weekItems.slice(0, 12).map(renderPlanRow).join("") || `<p class="empty">No weekly work queued.</p>`}</div>
        </section>
      </div>
      <section class="panel daily-checklist">
        ${panelHeader("Daily checklist", "", dailyChecklist.length)}
        <div class="compact-list">${dailyChecklist.map(renderDailyChecklistRow).join("")}</div>
      </section>
    `}
    <section class="panel action-library">
      ${panelHeader("Action ideas to place", "", actionItems.length)}
      <div class="action-list">${actionItems.map(renderActionRow).join("")}</div>
    </section>
  `;
}

function renderDailyChecklistRow(item) {
  return `
    <article class="compact-row">
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.detail)}</span>
      </div>
      <button onclick="window.dashboardAddChecklistItem('${escapeHtml(item.title)}')">Add today</button>
    </article>
  `;
}

function renderCompleted() {
  const feed = achievementFeed();
  const reports = [...(state.daily_reports || [])].sort((a, b) => new Date(b.report_date || 0) - new Date(a.report_date || 0));
  const selected = reportForDate(selectedReportDate);
  view.innerHTML = `
    <div class="ticket-toolbar">
      <button onclick="window.dashboardOpen('changelog')">Log completed project</button>
      <button class="primary-button" onclick="window.dashboardSaveDailyReport()">Save end-of-day report</button>
    </div>
    <div class="grid two completed-layout">
      <section class="panel">
        ${panelHeader("End-of-day report", "", reports.length)}
        <div class="daily-report-editor">
          <label>Date<input id="daily-report-date" type="date" value="${escapeHtml(selectedReportDate)}" onchange="window.dashboardSelectReportDate(this.value)"></label>
          <label>What happened today and what did you do?<textarea id="daily-report-body" data-dashboard-draft="daily-report:${escapeHtml(selectedReportDate)}" placeholder="One useful sentence is enough.">${escapeHtml(selected?.body || selected?.wins || "")}</textarea></label>
        </div>
        <div class="report-list">
          ${reports.length ? reports.map(renderReportRow).join("") : `<p class="empty">No daily reports yet.</p>`}
        </div>
      </section>
      <section class="panel">
        ${panelHeader("Completed projects", "", feed.length)}
        <div class="timeline">${feed.length ? feed.map(renderAchievement).join("") : `<p class="empty">No achievements yet.</p>`}</div>
      </section>
    </div>
  `;
}

function renderReportRow(report) {
  return `
    <button class="report-row ${selectedReportDate === report.report_date ? "active" : ""}" onclick="window.dashboardSelectReportDate('${escapeHtml(report.report_date)}')">
      <strong>${escapeHtml(formatShortDate(report.report_date))}</strong>
      <span>${escapeHtml(report.body || report.wins || "No report text")}</span>
    </button>
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

  view.querySelectorAll(".column[data-table], .project-lane[data-project-stage]").forEach((column) => {
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
      if (column.dataset.projectStage) {
        await patchProjectStage(payload, column.dataset.projectStage);
        return;
      }
      if (payload.table !== column.dataset.table) return;
      await patchBoardItem(payload, column.dataset.field, column.dataset.value);
    });
  });
}

async function patchProjectStage(payload, stage) {
  if (payload.table === "action_plan_items") {
    const item = flattenedActionPlan().find((entry) => actionPlanKey(entry) === payload.actionKey);
    if (!item || item.status === statusForProjectStage(payload.table, stage)) return;
    await patchActionPlanItem(item, { status: statusForProjectStage(payload.table, stage) });
    return;
  }
  const id = Number(payload.id);
  if (!id) return;
  if (payload.table === "tasks") {
    const patch = stage === "Done"
      ? { done: 1 }
      : { done: 0, lane: stage === "Parked" ? "Later" : stage === "Waiting" ? "This Week" : "Today" };
    await patchRecord(payload.table, id, patch);
    return;
  }
  const status = statusForProjectStage(payload.table, stage);
  if (!status) return;
  await patchRecord(payload.table, id, { status });
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

const TOOL_ICONS = {
  meta: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.3 8.9 8.9 0 0 1-3.7-.8L3 20l1.1-5.2a8 8 0 0 1-.6-3.3A8.4 8.4 0 0 1 12 3.2a8.4 8.4 0 0 1 9 8.3Z"/><path d="M8 10.5h8M8 13.5h5"/></svg>`,
  website: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V9M10 19V5M16 19v-8M21 19H3"/><circle cx="16" cy="6.5" r="2.3"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>`
};

function setToolsChrome(title, eyebrow) {
  $("#view-title").textContent = title;
  const node = document.querySelector(".topbar .eyebrow");
  if (node) node.textContent = eyebrow;
}

function renderToolsArea() {
  if (toolsTab === "meta") {
    setToolsChrome("Fenster Meta Bot", "Tools");
    return renderMetaToolShell();
  }
  if (toolsTab === "website") {
    setToolsChrome("Website Tracker", "Tools");
    return renderWebsiteToolShell();
  }
  setToolsChrome("Tools", "Live operational tools");
  renderToolsHub();
}

function renderToolsHub() {
  view.innerHTML = `
    <div class="tools-head">
      <button class="tools-back" onclick="window.dashboardBackToProjects()">${TOOL_ICONS.back}<span>Projects</span></button>
      <div>
        <span class="project-source">Project</span>
        <h3>Tools</h3>
        <p>Live operational tools. Pick one to open it full screen.</p>
      </div>
    </div>
    <div class="tools-hub">
      <button class="tool-card tool-card--meta" onclick="window.dashboardToolsTab('meta')">
        <span class="tool-card__icon">${TOOL_ICONS.meta}</span>
        <span class="tool-card__body">
          <strong>Fenster Meta Bot</strong>
          <span>Facebook inbox, AI draft replies, office forwarding and approval-only sending.</span>
        </span>
        <span class="tool-card__go">Open<b>›</b></span>
      </button>
      <button class="tool-card tool-card--website" onclick="window.dashboardToolsTab('website')">
        <span class="tool-card__icon">${TOOL_ICONS.website}</span>
        <span class="tool-card__body">
          <strong>Website Tracker</strong>
          <span>Consented visitor journeys, WindowCAD quote outcomes, forms, calls and Legend chats.</span>
        </span>
        <span class="tool-card__go">Open<b>›</b></span>
      </button>
    </div>
  `;
}

function renderMetaToolShell() {
  view.innerHTML = `
    <div class="tools-head">
      <button class="tools-back" onclick="window.dashboardToolsTab('hub')">${TOOL_ICONS.back}<span>Tools</span></button>
      <div>
        <span class="project-source">Tools</span>
        <h3>Fenster Meta Bot</h3>
        <p>Facebook inbox, draft replies, office forwarding, and approval-only sending.</p>
      </div>
      <div class="tools-head__actions">
        <button class="tool-action" onclick="window.dashboardFensterSync()">Sync Facebook</button>
        <button class="tool-action" onclick="window.dashboardFensterRefresh()">Refresh</button>
      </div>
    </div>
    <p id="fenster-status" class="result-note">Loading Fenster Meta Bot...</p>
    <div id="fenster-app" class="fenster-app"></div>
  `;
  loadCurrentTool(true);
}

function renderWebsiteToolShell() {
  view.innerHTML = `
    <div class="tools-head">
      <button class="tools-back" onclick="window.dashboardToolsTab('hub')">${TOOL_ICONS.back}<span>Tools</span></button>
      <div>
        <span class="project-source">Tools</span>
        <h3>Website Tracker</h3>
        <p>Consent-led attribution. Customer details stay in WordPress and AdminBase.</p>
      </div>
      <div class="tools-head__actions">
        <button class="tool-action" onclick="window.dashboardWebsiteRefresh()">Refresh</button>
      </div>
    </div>
    <p id="website-status" class="result-note">Loading website reporting...</p>
    <div id="website-app" class="website-app"></div>
  `;
  loadCurrentTool(true);
}

function setToolsTab(tab) {
  if (!["hub", "meta", "website"].includes(tab)) return;
  toolsTab = tab;
  websiteVisitorJourney = null;
  websiteChatTranscript = null;
  render();
}

function setWebsiteView(nextView) {
  if (!["overview", "acquisition", "pages", "customers", "chats"].includes(nextView)) return;
  websiteView = nextView;
  websiteChatTranscript = null;
  websiteVisitorJourney = null;
  renderWebsiteTool();
}

async function openWebsiteChat(conversationId) {
  try {
    websiteChatTranscript = await api(`/api/fenster/website/chat/${encodeURIComponent(conversationId)}`);
    websiteView = 'chats';
    renderWebsiteTool();
  } catch (error) {
    const status = $("#website-status");
    if (status) status.textContent = error.message;
  }
}

async function openWebsiteVisitor(visitorId) {
  try {
    websiteVisitorJourney = await api(`/api/fenster/website/visitor/${encodeURIComponent(visitorId)}`);
    renderWebsiteTool();
  } catch (error) {
    const status = $("#website-status");
    if (status) status.textContent = error.message;
  }
}

function closeWebsiteVisitor() {
  websiteVisitorJourney = null;
  renderWebsiteTool();
}

async function loadCurrentTool(force = false) {
  if (toolsTab === "website") return loadWebsite(force);
  if (toolsTab === "meta") return loadFenster(force);
}

async function loadWebsite(force = false) {
  const mount = $("#website-app");
  const status = $("#website-status");
  if (!mount || (!force && current !== "tools" && selectedProjectKey !== "tools")) return;
  try {
    websiteState = await api("/api/fenster/website/state");
    status.textContent = "";
    renderWebsiteTool();
  } catch (error) {
    status.textContent = error.message;
    mount.innerHTML = "";
  }
}

function wtFmt(value) {
  return Number(value || 0).toLocaleString("en-GB");
}

function wtSeconds(value) {
  const seconds = Number(value || 0);
  if (!seconds) return "—";
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
}

function renderWebsiteTool() {
  const mount = $("#website-app");
  if (!mount || !websiteState) return;
  const views = [
    ["overview", "Overview", 0],
    ["acquisition", "Acquisition", 0],
    ["pages", "Pages", 0],
    ["customers", "Customers", (websiteState.visitors || []).length],
    ["chats", "Legend chats", (websiteState.chats || []).length]
  ];
  const body = ({
    overview: wtOverview,
    acquisition: wtAcquisition,
    pages: wtPages,
    customers: wtCustomers,
    chats: wtChats
  })[websiteView] || wtOverview;
  mount.innerHTML = `
    <nav class="wt-nav" aria-label="Website tracker views">
      ${views.map(([id, label, count]) => `
        <button class="wt-nav__item ${websiteView === id ? "is-active" : ""}" onclick="window.dashboardWebsiteView('${id}')">
          <span>${label}</span>${count ? `<b>${wtFmt(count)}</b>` : ""}
        </button>
      `).join("")}
    </nav>
    <div class="wt-body">${body()}</div>
  `;
}

function wtOverview() {
  const s = websiteState;
  const kpis = [
    [s.uniqueVisitors, "Consented visitors", "last 30 days"],
    [s.journeys, "Journeys", "visits recorded"],
    [s.quoteJourneys, "Quote starts", "tool opened or loaded"],
    [s.quotes, "WindowCAD quotes", "consented completions"],
    [s.forms, "Forms sent", `${wtFmt(s.formStarts)} started`],
    [s.calls, "Phone / email clicks", "contact intent only"],
    [s.legendChats, "Legend chats", "saved for 30-day QA"],
    [s.outcomes?.won || 0, "Won leads", "marked by the office"]
  ];
  return `
    ${wtTrackingAlert()}
    <div class="wt-kpis">${kpis.map(([value, label, hint]) => `
      <article class="wt-kpi"><strong>${wtFmt(value)}</strong><span>${label}</span><small>${hint}</small></article>
    `).join("")}</div>
    ${wtTrend()}
    <div class="wt-grid wt-grid--two">
      ${wtFunnel()}
      ${wtConsent()}
    </div>
    ${wtDecision()}
    ${wtRecentLeads()}
  `;
}

function wtTrackingAlert() {
  const missed = Number(websiteState.statistical?.quoteCompletions || 0);
  if (!missed) return "";
  return `
    <div class="wt-alert">
      <strong>${wtFmt(missed)} WindowCAD quote${missed === 1 ? "" : "s"} completed without a tracking reference</strong>
      <span>Counted as aggregate totals only. Some are expected from rejected/no-choice visitors or office-entered quotes, but if consented WindowCAD quotes sit at zero while this rises, check that the WindowCAD website form still includes the Tracking field.</span>
    </div>
  `;
}

function wtTrend() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    days.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  }
  const events = Object.fromEntries((websiteState.series?.events || []).map((row) => [row.day, row]));
  const stats = Object.fromEntries((websiteState.series?.statistical || []).map((row) => [row.day, row]));
  const rows = days.map((day) => ({
    day,
    consented: Number(events[day]?.page_views || 0),
    anonymous: Number(stats[day]?.page_views || 0),
    leads: Number(events[day]?.leads || 0)
  }));
  const max = Math.max(1, ...rows.map((row) => row.consented + row.anonymous));
  const slot = 22;
  const width = rows.length * slot;
  const bars = rows.map((row, index) => {
    const x = index * slot + 3;
    const consentedHeight = Math.round((row.consented / max) * 118);
    const anonymousHeight = Math.round((row.anonymous / max) * 118);
    const stackTop = 130 - consentedHeight - anonymousHeight;
    return `
      <g>
        <title>${row.day}: ${row.consented} consented + ${row.anonymous} anonymous page views${row.leads ? ` · ${row.leads} lead${row.leads === 1 ? "" : "s"}` : ""}</title>
        <rect x="${x}" y="128" width="${slot - 6}" height="2" rx="1" class="wt-bar wt-bar--base"></rect>
        ${anonymousHeight ? `<rect x="${x}" y="${stackTop}" width="${slot - 6}" height="${anonymousHeight}" rx="2" class="wt-bar wt-bar--anon"></rect>` : ""}
        ${consentedHeight ? `<rect x="${x}" y="${130 - consentedHeight}" width="${slot - 6}" height="${consentedHeight}" rx="2" class="wt-bar wt-bar--consented"></rect>` : ""}
        ${row.leads ? `<circle cx="${x + (slot - 6) / 2}" cy="${Math.max(8, stackTop - 8)}" r="4" class="wt-lead-dot"></circle>` : ""}
      </g>`;
  }).join("");
  const labels = [0, 10, 20, 29].map((index) => `
    <text x="${index * slot + 3}" y="146" class="wt-axis-label">${rows[index].day.slice(5)}</text>
  `).join("");
  return `
    <section class="wt-panel wt-trend">
      <header class="wt-panel__head">
        <div><h4>Daily traffic and leads</h4><p>Page views for the last 30 days. Dots mark days with a completed quote or sent form.</p></div>
        <div class="wt-legend">
          <span><i class="wt-swatch wt-swatch--consented"></i>Consented</span>
          <span><i class="wt-swatch wt-swatch--anon"></i>Anonymous</span>
          <span><i class="wt-swatch wt-swatch--lead"></i>Lead day</span>
        </div>
      </header>
      <div class="wt-trend__scroll"><svg viewBox="0 0 ${width} 150" class="wt-trend__chart" role="img" aria-label="Daily page views for the last 30 days">${bars}${labels}</svg></div>
    </section>
  `;
}

function wtFunnel() {
  const steps = [
    ["Consented visitors", Number(websiteState.uniqueVisitors || 0), "accepted optional cookies"],
    ["CTA clicks", Number(websiteState.ctaClicks || 0), "chose a commercial action"],
    ["Quote starts", Number(websiteState.quoteJourneys || 0), "quote tool loaded or opened"],
    ["Leads", Number(websiteState.quotes || 0) + Number(websiteState.forms || 0), "quote completed or form sent"]
  ];
  const max = Math.max(1, ...steps.map(([, value]) => value));
  const leadRate = steps[0][1] ? Math.round((steps[3][1] / steps[0][1]) * 100) : 0;
  return `
    <section class="wt-panel wt-funnel">
      <header class="wt-panel__head">
        <div><h4>Conversion funnel</h4><p>Where consented visitors fall away.</p></div>
        <strong class="wt-panel__figure">${leadRate}%<small>visitor to lead</small></strong>
      </header>
      <div class="wt-funnel__steps">
        ${steps.map(([label, value, hint], index) => `
          <div class="wt-funnel__step">
            <span class="wt-funnel__label"><b>${index + 1}</b>${label}</span>
            <span class="wt-funnel__bar"><i style="width:${Math.max(3, Math.round((value / max) * 100))}%"></i></span>
            <span class="wt-funnel__value">${wtFmt(value)}</span>
            <small>${hint}</small>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function wtConsent() {
  const consent = websiteState.consent || {};
  const accepted = Number(consent.accepted || 0);
  const rejected = Number(consent.rejected || 0);
  const answered = accepted + rejected;
  const rate = answered ? Math.round((accepted / answered) * 100) : 0;
  return `
    <section class="wt-panel wt-consent">
      <header class="wt-panel__head">
        <div><h4>Consent health</h4><p>Aggregate choices only, never tied to a visitor. This decides how representative the journey data is.</p></div>
        <strong class="wt-panel__figure">${rate}%<small>acceptance</small></strong>
      </header>
      <div class="wt-consent__meter"><i style="width:${rate}%"></i></div>
      <div class="wt-consent__figures">
        <article><strong>${wtFmt(answered)}</strong><span>Choices recorded</span></article>
        <article><strong>${wtFmt(accepted)}</strong><span>Accepted</span></article>
        <article><strong>${wtFmt(rejected)}</strong><span>Rejected</span></article>
      </div>
    </section>
  `;
}

function wtDecision() {
  const visitors = Number(websiteState.uniqueVisitors || 0);
  const quoteStarts = Number(websiteState.quoteJourneys || 0);
  const quotes = Number(websiteState.quotes || 0);
  const forms = Number(websiteState.forms || 0);
  const formStarts = Number(websiteState.formStarts || 0);
  const formErrors = Number(websiteState.formErrors || 0);
  const contactClicks = Number(websiteState.calls || 0);
  const enquiryRate = visitors ? Math.round(((quotes + forms) / visitors) * 100) : 0;
  const nextStep = visitors < 20
    ? "This is still early data. Let it run until there are at least 20 consented visitors before judging a channel or page."
    : quoteStarts === 0
      ? "Visitors are arriving but not opening the quote tool. Review the first-screen call to action and the routes sending traffic here."
      : formStarts > 0 && forms === 0
        ? "People are beginning the enquiry form but not sending it. Check the form fields and validation warnings before spending more on traffic."
        : quotes === 0 && forms === 0
          ? "Visitors are showing intent but not becoming leads. Check the quote journey, call button and form friction before spending more on traffic."
          : "Compare channels in Acquisition. Put budget behind sources that create completed WindowCAD quotes or forms, not just visits.";
  const facts = [
    visitors ? `Lead rate ${enquiryRate}%` : "",
    quoteStarts ? `Quote completion ${Math.round((quotes / quoteStarts) * 100)}%` : "",
    formStarts ? `Form completion ${Math.round((forms / formStarts) * 100)}%` : "",
    formErrors ? `${wtFmt(formErrors)} validation warnings` : "",
    contactClicks ? `${wtFmt(contactClicks)} contact taps` : ""
  ].filter(Boolean);
  return `
    <section class="wt-panel wt-decision">
      <h4>What this helps you decide</h4>
      <p>${escapeHtml(nextStep)}</p>
      ${facts.length ? `<div class="wt-chips">${facts.map((fact) => `<span class="wt-chip">${escapeHtml(fact)}</span>`).join("")}</div>` : ""}
    </section>
  `;
}

function wtRecentLeads() {
  const recent = websiteState.recent || [];
  return `
    <section class="wt-panel">
      <header class="wt-panel__head">
        <div><h4>Recent lead outcomes</h4><p>Completed WindowCAD quotes and sent forms, with the first-touch source that earned them. Set the office outcome once the real lead is checked in AdminBase.</p></div>
      </header>
      ${recent.length ? `
        <div class="table-wrap"><table class="table wt-table">
          <thead><tr><th>When</th><th>Lead</th><th>Outcome</th><th>Source</th><th>Landing page</th><th>Product / value</th></tr></thead>
          <tbody>${recent.map(renderWebsiteEvent).join("")}</tbody>
        </table></div>
      ` : `<p class="empty">No completed quotes or sent forms have been attributed yet. They appear here as soon as a consented visitor finishes a quote or form.</p>`}
    </section>
  `;
}

function wtAcquisition() {
  const rows = websiteState.acquisition || [];
  const products = websiteState.products || [];
  const ctas = websiteState.topCtas || [];
  return `
    <section class="wt-panel">
      <header class="wt-panel__head">
        <div><h4>Channels</h4><p>First-touch source for consented journeys in the last 30 days. Tag ad URLs with UTM parameters or they appear as direct.</p></div>
      </header>
      ${rows.length ? `
        <div class="table-wrap"><table class="table wt-table">
          <thead><tr><th>Channel</th><th>Visitors</th><th>Quote starts</th><th>Quotes</th><th>Forms</th><th>Contact taps</th></tr></thead>
          <tbody>${rows.map((row) => `
            <tr>
              <td><strong>${escapeHtml(row.channel || "Direct or unknown")}</strong></td>
              <td>${wtFmt(row.visitors)}</td><td>${wtFmt(row.quote_starts)}</td>
              <td>${wtFmt(row.quotes)}</td><td>${wtFmt(row.forms)}</td><td>${wtFmt(row.contact_clicks)}</td>
            </tr>
          `).join("")}</tbody>
        </table></div>
      ` : `<p class="empty">No consented journeys recorded yet.</p>`}
    </section>
    <div class="wt-grid wt-grid--two">
      <section class="wt-panel">
        <header class="wt-panel__head"><div><h4>Quote products</h4><p>Which product collections people open and complete.</p></div></header>
        ${products.length ? `
          <div class="table-wrap"><table class="table wt-table">
            <thead><tr><th>Product collection</th><th>Opens</th><th>Completions</th></tr></thead>
            <tbody>${products.map((row) => `<tr><td><strong>${escapeHtml(row.product_collection)}</strong></td><td>${wtFmt(row.opens)}</td><td>${wtFmt(row.completions)}</td></tr>`).join("")}</tbody>
          </table></div>
        ` : `<p class="empty">No product-level quote activity yet.</p>`}
      </section>
      <section class="wt-panel">
        <header class="wt-panel__head"><div><h4>Top calls to action</h4><p>The buttons and commercial links consented visitors actually use.</p></div></header>
        ${ctas.length ? `
          <ul class="wt-ranked">${ctas.map((row) => `<li><span>${escapeHtml(row.cta)}</span><b>${wtFmt(row.clicks)}</b></li>`).join("")}</ul>
        ` : `<p class="empty">No CTA clicks recorded yet.</p>`}
      </section>
    </div>
  `;
}

function wtPages() {
  const consented = websiteState.topPages || [];
  const anonymous = websiteState.statTopPages || [];
  const devices = (websiteState.deviceSplit || []).filter((row) => row.device_type !== "server");
  const deviceTotal = Math.max(1, devices.reduce((sum, row) => sum + Number(row.views || 0), 0));
  return `
    <div class="wt-grid wt-grid--two">
      <section class="wt-panel">
        <header class="wt-panel__head"><div><h4>Top pages, consented</h4><p>Views and average engaged time from consented journeys.</p></div></header>
        ${consented.length ? `
          <div class="table-wrap"><table class="table wt-table">
            <thead><tr><th>Page</th><th>Views</th><th>Avg time</th></tr></thead>
            <tbody>${consented.map((row) => `<tr><td><code>${escapeHtml(row.page_path)}</code></td><td>${wtFmt(row.views)}</td><td>${wtSeconds(row.avg_seconds)}</td></tr>`).join("")}</tbody>
          </table></div>
        ` : `<p class="empty">No consented page views yet.</p>`}
      </section>
      <section class="wt-panel">
        <header class="wt-panel__head"><div><h4>Top pages, anonymous</h4><p>Aggregate-only totals from visitors who did not accept optional cookies.</p></div></header>
        ${anonymous.length ? `
          <div class="table-wrap"><table class="table wt-table">
            <thead><tr><th>Page</th><th>Views</th></tr></thead>
            <tbody>${anonymous.map((row) => `<tr><td><code>${escapeHtml(row.page_path)}</code></td><td>${wtFmt(row.views)}</td></tr>`).join("")}</tbody>
          </table></div>
        ` : `<p class="empty">No anonymous statistics yet.</p>`}
      </section>
    </div>
    <section class="wt-panel">
      <header class="wt-panel__head"><div><h4>Devices, anonymous traffic</h4><p>Broad device class from the aggregate statistics. Bot traffic is kept out of the other numbers.</p></div></header>
      ${devices.length ? `
        <div class="wt-devices">${devices.map((row) => `
          <div class="wt-device">
            <span>${escapeHtml(row.device_type)}</span>
            <span class="wt-device__bar"><i style="width:${Math.max(2, Math.round((Number(row.views || 0) / deviceTotal) * 100))}%"></i></span>
            <b>${wtFmt(row.views)}</b>
          </div>
        `).join("")}</div>
      ` : `<p class="empty">No device data yet.</p>`}
    </section>
  `;
}

function wtCustomers() {
  const visitors = websiteState.visitors || [];
  return `
    ${websiteVisitorJourney ? renderWebsiteJourney() : ""}
    <section class="wt-panel">
      <header class="wt-panel__head">
        <div><h4>Customer database</h4><p>Anonymous, consented browser visitors. Open one to read its full journey timeline; personal details stay in AdminBase.</p></div>
      </header>
      ${visitors.length ? `
        <div class="table-wrap"><table class="table wt-table wt-table--visitors">
          <thead><tr><th>Visitor</th><th>First touch</th><th>Last seen</th><th>Landing page</th><th>Journeys</th><th>Intent</th></tr></thead>
          <tbody>${visitors.map(renderWebsiteVisitor).join("")}</tbody>
        </table></div>
      ` : `<p class="empty">No consented visitors recorded yet.</p>`}
    </section>
  `;
}

function wtChats() {
  const chats = websiteState.chats || [];
  return `
    ${websiteChatTranscript ? renderWebsiteChatTranscript() : ""}
    <section class="wt-panel">
      <header class="wt-panel__head">
        <div><h4>Legend chat quality assurance</h4><p>Transcripts are kept for 30 days. Accepted optional cookies link a chat to its anonymous journey; otherwise it is chat-only.</p></div>
      </header>
      ${chats.length ? `
        <div class="table-wrap"><table class="table wt-table">
          <thead><tr><th>When</th><th>Visitor</th><th>Started on</th><th>Messages</th><th></th></tr></thead>
          <tbody>${chats.map((chat) => `
            <tr>
              <td>${escapeHtml(formatDateTime(chat.last_message_at))}</td>
              <td>${chat.visitor_id ? `<code>${escapeHtml(chat.visitor_id)}</code>` : '<span class="website-intent">Chat-only</span>'}</td>
              <td><code>${escapeHtml(chat.page_path || "—")}</code></td>
              <td>${wtFmt(chat.messages)}</td>
              <td><button class="wt-open-button" onclick="window.dashboardWebsiteChat('${escapeHtml(chat.conversation_id)}')">Read chat</button></td>
            </tr>
          `).join("")}</tbody>
        </table></div>
      ` : `<p class="empty">No Legend chats have been saved yet.</p>`}
    </section>
  `;
}

function renderWebsiteChatTranscript() {
  const chat = websiteChatTranscript;
  const messages = chat?.messages || [];
  return `<section class="website-journey-detail"><div class="website-journey-detail__head"><div><span>Legend transcript</span><h3><code>${escapeHtml(chat.conversation_id || '')}</code></h3><p>Quality assurance copy. It expires 30 days after each message.</p></div><button onclick="window.dashboardWebsiteView('chats')">Close <b>×</b></button></div><div class="legend-qa-stream">${messages.map((message) => `<article class="legend-qa-message legend-qa-message--${message.role === 'assistant' ? 'assistant' : 'user'}"><span class="legend-qa-message__author">${message.role === 'assistant' ? 'Legend' : 'Visitor'}</span><p>${escapeHtml(message.body)}</p><time>${escapeHtml(formatDateTime(message.created_at))} · ${escapeHtml(message.page_path || '—')}</time></article>`).join('')}</div></section>`;
}

function renderWebsiteVisitor(item) {
  const source = [item.first_source, item.first_medium, item.first_campaign].filter(Boolean).join(" / ") || "Direct or unknown";
  const intent = [
    Number(item.quote_starts || 0) ? `${item.quote_starts} quote starts` : "",
    Number(item.quotes || 0) ? `${item.quotes} WindowCAD quotes` : "",
    Number(item.legend_chats || 0) ? `${item.legend_chats} Legend chats` : "",
    Number(item.forms || 0) ? `${item.forms} forms` : "",
    Number(item.contact_clicks || 0) ? `${item.contact_clicks} contact clicks` : ""
  ].filter(Boolean).join(" · ") || "Browsing";
  return `<tr class="website-visitor-row" onclick="window.dashboardWebsiteVisitor('${escapeHtml(item.visitor_id)}')"><td><button class="website-visitor-trigger" onclick="event.stopPropagation();window.dashboardWebsiteVisitor('${escapeHtml(item.visitor_id)}')"><i>${escapeHtml(item.visitor_id.slice(-2))}</i><span><code>${escapeHtml(item.visitor_id)}</code><small>Open journey</small></span><b>›</b></button></td><td>${escapeHtml(source)}<br><small>${escapeHtml(formatDateTime(item.first_seen_at))}</small></td><td>${escapeHtml(formatDateTime(item.last_seen_at))}</td><td><code>${escapeHtml(item.first_landing_path || "—")}</code></td><td>${escapeHtml(String(item.journeys || 0))}</td><td><span class="website-intent">${escapeHtml(intent)}</span></td></tr>`;
}

function websiteEventLabel(event) {
  return ({ visitor_seen: "Visitor returned", page_view: "Viewed page", page_engaged: "Time on page", link_click: "Clicked link", cta_click: "Clicked call to action", scroll_depth: "Reached page depth", quote_opened: "Opened quote tool", quote_iframe_loaded: "Loaded quote tool", quote_completed: "Completed WindowCAD quote", form_started: "Started form", form_validation_error: "Form validation warning", form_submitted: "Sent form", phone_click: "Tapped phone number", email_click: "Tapped email", chat_opened: "Opened Legend chat", chat_acknowledged: "Accepted chat terms", chat_message_sent: "Sent Legend message", chat_reply_received: "Received Legend reply" })[event] || event;
}

function renderWebsiteJourney() {
  const journey = websiteVisitorJourney;
  const events = journey.events || [];
  const journeys = journey.journeys || [];
  const references = journeys.map((item) => `<code>${escapeHtml(item.journey_id)}</code>`).join("");
  const chats = journey.chats || [];
  return `<section class="website-journey-detail"><div class="website-journey-detail__head"><div><span>Visitor journey</span><h3><code>${escapeHtml(journey.visitor.visitor_id)}</code></h3><p>${escapeHtml(String(journeys.length || 0))} tracked journey${journeys.length === 1 ? "" : "s"} · anonymous and consented</p><div class="website-journey-refs"><span>WindowCAD tracking reference${journeys.length === 1 ? "" : "s"}</span>${references || "<em>No WindowCAD journey yet</em>"}</div></div><button onclick="window.dashboardWebsiteCloseVisitor()">Close <b>×</b></button></div>${chats.length ? `<div class="website-note"><strong>Legend chats</strong><span>${chats.map((chat) => `<button onclick="window.dashboardWebsiteChat('${escapeHtml(chat.conversation_id)}')">Read ${escapeHtml(String(chat.messages))}-message chat</button>`).join(' ')}</span></div>` : ''}${events.length ? `<div class="website-timeline">${events.map(renderWebsiteJourneyEvent).join("")}</div>` : `<p class="empty">No detailed events yet.</p>`}</section>`;
}

function renderWebsiteJourneyEvent(event) {
  const duration = Number(event.page_duration_seconds || 0) ? `${event.page_duration_seconds}s on page` : "";
  const value = Number(event.price_amount || 0) > 0 ? `£${Number(event.price_amount).toLocaleString("en-GB", { maximumFractionDigits: 2 })}` : "";
  const eventValue = Number(event.event_value || 0) ? `${event.event_value}%` : "";
  const trackingReference = event.event_type === "quote_completed" ? `Tracking: ${event.journey_id}` : "";
  const detail = [event.cta, event.link_target, event.product_collection, duration, value, eventValue, trackingReference].filter(Boolean).join(" · ") || "—";
  return `<article class="website-timeline__event website-timeline__event--${escapeHtml(event.event_type)}"><time>${escapeHtml(formatDateTime(event.occurred_at))}</time><i></i><div><strong>${escapeHtml(websiteEventLabel(event.event_type))}</strong><code>${escapeHtml(event.page_path || "—")}</code><span>${escapeHtml(detail)}</span></div></article>`;
}

function renderWebsiteEvent(item) {
  const source = [item.source, item.medium, item.campaign].filter(Boolean).join(" / ") || "Direct or unknown";
  const product = item.product_collection || "—";
  const value = Number(item.price_amount || 0) > 0 ? `£${Number(item.price_amount).toLocaleString("en-GB", { maximumFractionDigits: 2 })}` : "";
  return `
    <tr>
      <td>${escapeHtml(formatDateTime(item.occurred_at))}</td>
      <td><strong>${escapeHtml(item.event_type === "quote_completed" ? "WindowCAD quote" : "Website form")}</strong></td>
      <td><select class="website-outcome-select" aria-label="Lead status" onchange="window.dashboardWebsiteOutcome('${escapeHtml(item.journey_id)}', this.value)">${["new", "contacted", "appointment", "won", "lost"].map((status) => `<option value="${status}" ${status === (item.outcome_status || "new") ? "selected" : ""}>${status[0].toUpperCase() + status.slice(1)}</option>`).join("")}</select></td>
      <td>${escapeHtml(source)}</td>
      <td>${escapeHtml(item.landing_path || item.page_path || "—")}</td>
      <td>${escapeHtml([product, value].filter(Boolean).join(" · "))}</td>
    </tr>
  `;
}

async function setWebsiteOutcome(journeyId, status) {
  try {
    await api("/api/fenster/website/outcome", { method: "POST", body: { journey_id: journeyId, status } });
    await loadWebsite(true);
  } catch (error) {
    const statusNode = $("#website-status");
    if (statusNode) statusNode.textContent = error.message;
  }
}

async function loadFenster(force = false) {
  const mount = $("#fenster-app");
  const status = $("#fenster-status");
  if (!mount || (!force && current !== "tools")) return;
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
  rememberDashboardDrafts(mount);
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
        <textarea id="fenster-prompt-context" data-dashboard-draft="fenster-prompt">${escapeHtml(bot.promptContext || "")}</textarea>
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
  restoreDashboardDrafts(mount);
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
  const hasDraftText = Boolean((conversation.draft || "").trim());
  const canManualSend = conversation.decision_action !== "REPLY";
  const canSend = canGenerate && !draftUnavailable && (hasDraftText || canManualSend);
  const canHide = canGenerate && fensterTab !== "all";
  const decision = conversation.decision_action || "PENDING";
  const decisionClass = decision === "FLAG_HUMAN" ? "danger" : decision === "NO_REPLY" ? "quiet" : "ready";
  const replyLabel = decision === "REPLY" ? "Suggested reply" : "Manual reply";
  const sendLabel = decision === "REPLY" ? "Approve and send" : "Send manual reply";

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
        ${replyLabel}
        <textarea id="fenster-draft" data-dashboard-draft="fenster:${escapeHtml(conversation.id)}">${escapeHtml(conversation.draft || "")}</textarea>
      </label>
      <div class="draft-actions">
        <button onclick="window.dashboardFensterGenerate()" ${canGenerate ? "" : "disabled"}>Generate draft</button>
        <button onclick="window.dashboardFensterSaveDraft()">Save edit</button>
        <button class="primary-button" onclick="window.dashboardFensterSend()" ${canSend ? "" : "disabled"}>${sendLabel}</button>
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
    return true;
  } catch (error) {
    setFensterStatus(error.message);
    alert(error.message);
    return false;
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
  const saved = await fensterAction("/api/fenster/bot/prompt", {
    method: "POST",
    body: { promptContext: $("#fenster-prompt-context")?.value || "" }
  }, "Saving AI context...");
  if (saved) clearDashboardDraft("fenster-prompt");
}

async function fensterGenerate() {
  if (!selectedFensterConversationId) return;
  const key = `fenster:${selectedFensterConversationId}`;
  const draft = $("#fenster-draft");
  const previousDraft = draft?.value || "";
  draft?.removeAttribute("data-dashboard-draft");
  clearDashboardDraft(key);
  const generated = await fensterAction(`/api/fenster/conversations/${selectedFensterConversationId}/generate-draft`, { method: "POST", body: {} }, "Generating draft...");
  if (!generated && draft) {
    draft.dataset.dashboardDraft = key;
    try { sessionStorage.setItem(dashboardDraftPrefix + key, previousDraft); } catch (_error) {}
  }
}

async function fensterSaveDraft() {
  if (!selectedFensterConversationId) return;
  const saved = await fensterAction(`/api/fenster/conversations/${selectedFensterConversationId}/draft`, {
    method: "POST",
    body: { draft: $("#fenster-draft")?.value || "" }
  }, "Saving draft...");
  if (saved) clearDashboardDraft(`fenster:${selectedFensterConversationId}`);
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
  const manual = conversation?.decision_action !== "REPLY";
  if (!confirm(`Send this reply to ${conversation?.display_name || "this selected user"}?`)) return;
  const sent = await fensterAction(`/api/fenster/conversations/${selectedFensterConversationId}/send`, {
    method: "POST",
    body: {
      text: $("#fenster-draft")?.value || "",
      manual,
      confirm: `SEND:${selectedFensterConversationId}`
    }
  }, "Sending reply...");
  if (sent) clearDashboardDraft(`fenster:${selectedFensterConversationId}`);
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
      ["Priority", item.priority || "Normal", "priority"],
      ["From", item.requester, "requester"],
      ["Type", item.category, "category"]
    ],
    ideas: [
      ["Status", item.status, "status"],
      ["Priority", item.priority || "Normal", "priority"],
      ["Impact", item.impact, "impact"],
      ["From", item.author, "author"]
    ],
    tasks: [
      ["Owner", item.owner, "owner"],
      ["Priority", item.priority || "Normal", "priority"],
      ["Lane", item.lane, "status"],
      ["Due", item.due_date, "due_date"]
    ],
    todays_plan: [
      ["Owner", item.owner, "owner"],
      ["Priority", item.priority || "Normal", "priority"],
      ["Status", item.status, "status"],
      ["Updated by", item.updated_by, "author"]
    ],
    social_posts: [
      ["Status", item.status, "status"],
      ["Priority", item.priority || "Normal", "priority"],
      ["Platform", item.platform, "platform"],
      ["Type", item.content_type, "asset_type"],
      ["Scheduled", item.scheduled_for, "deadline"]
    ],
    content_requests: [
      ["Status", item.status, "status"],
      ["Priority", item.priority || "Normal", "priority"],
      ["Asset", item.asset_type, "asset_type"],
      ["From", item.requester, "requester"],
      ["Deadline", item.deadline, "deadline"]
    ],
    website_updates: [
      ["Area", item.area, "area"],
      ["Priority", item.priority || "Normal", "priority"],
      ["Status", item.status, "status"],
      ["Release", item.release_date, "release_date"]
    ],
    changelog: [
      ["Area", item.area, "area"],
      ["Priority", item.priority || "Normal", "priority"],
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
  const options = (config[table]?.fields || []).find(([name]) => name === field)?.[3];
  return Array.isArray(options) ? options : [];
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
  return `<span class="note-mark ${count ? "has-notes" : ""}" aria-hidden="true">N</span><span>${count ? `${count} note${count === 1 ? "" : "s"}` : "Notes"}</span>`;
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
    const value = options === "currentUser" ? user.name : options === "dailyReportTitle" ? `End of day - ${selectedReportDate}` : options;
    return `<input name="${name}" type="hidden" value="${escapeHtml(value)}">`;
  }
  if (type === "textarea") return `<label>${label}<textarea name="${name}"></textarea></label>`;
  if (type === "select") {
    if (name === "project_key") {
      const selected = selectedProjectKey && selectedProjectKey !== "tools" ? selectedProjectKey : "unsorted-tickets";
      return `<label>${label}<select name="${name}">${projectAreas.map((project) => `<option value="${project.key}" ${project.key === selected ? "selected" : ""}>${escapeHtml(project.name)}</option>`).join("")}</select></label>`;
    }
    const selected = name === "priority" ? "Normal" : options[0];
    return `<label>${label}<select name="${name}">${options.map((option) => `<option value="${escapeHtml(option)}" ${option === selected ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></label>`;
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
      priority: "Normal",
      project_key: selectedProjectKey && selectedProjectKey !== "tools" ? selectedProjectKey : "unsorted-tickets",
      ...body
    };
  }
  if (table === "todays_plan") {
    return {
      owner: user.name,
      updated_by: user.name,
      status: "Planned",
      priority: "Normal",
      project_key: selectedProjectKey || "misc",
      ...body
    };
  }
  if (table === "social_posts") {
    return {
      owner: user.name,
      status: "Idea",
      priority: "Normal",
      project_key: selectedProjectKey || "social-media",
      ...body
    };
  }
  if (table === "ideas") {
    return {
      author: user.name,
      status: "Inbox",
      priority: "Normal",
      project_key: selectedProjectKey || "misc",
      ...body
    };
  }
  if (table === "action_plan_items") {
    return {
      section: "Custom",
      effort: "medium",
      status: "Active",
      priority: "Normal",
      project_key: selectedProjectKey || "misc",
      ...body
    };
  }
  if (table === "content_requests") {
    return {
      requester: user.name,
      status: "Needed",
      priority: "Normal",
      project_key: selectedProjectKey || "misc",
      ...body
    };
  }
  if (table === "website_updates") {
    return {
      status: "Plan",
      priority: "Normal",
      project_key: selectedProjectKey || "website",
      ...body
    };
  }
  if (table === "changelog") {
    return {
      shipped_at: body.shipped_at || new Date().toISOString().slice(0, 10),
      priority: "Normal",
      project_key: selectedProjectKey || "misc",
      ...body
    };
  }
  if (table === "daily_reports") {
    return {
      title: `End of day - ${body.report_date || selectedReportDate}`,
      updated_by: user.name,
      ...body
    };
  }
  if (table === "social_guidelines") {
    return {
      category: "General",
      priority: "Normal",
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

async function linkProject(table, id, projectKey) {
  if (!id || !projectKey) return;
  await patchRecord(table, id, { project_key: projectKey });
}

async function moveProject(table, id, stage) {
  if (!table || !id || !stage) return;
  await patchProjectStage({ table, id: String(id), actionKey: "" }, stage);
}

async function moveActionItem(encodedAction, status) {
  if (!encodedAction || !status) return;
  await patchActionPlanItem(decodeActionItem(encodedAction), { status });
}

async function linkActionItem(encodedAction, projectKey) {
  if (!encodedAction || !projectKey) return;
  await patchActionPlanItem(decodeActionItem(encodedAction), { project_key: projectKey });
}

async function setActionPriority(encodedAction, priority) {
  if (!encodedAction || !priority) return;
  await patchActionPlanItem(decodeActionItem(encodedAction), { priority });
}

function selectTickets(status) {
  selectedTicketFilter = selectedTicketFilter === status ? "" : status;
  render();
}

function selectSocial(status) {
  selectedSocialFilter = selectedSocialFilter === status ? "" : status;
  render();
}

function togglePlanDone() {
  showPlanDone = !showPlanDone;
  render();
}

function openProject(key) {
  selectedProjectKey = key;
  current = "projects";
  render();
}

function backToProjects() {
  selectedProjectKey = "";
  current = "projects";
  render();
}

function selectReportDate(value) {
  selectedReportDate = value || new Date().toISOString().slice(0, 10);
  render();
}

function reportForDate(date) {
  return (state.daily_reports || []).find((report) => report.report_date === date);
}

async function saveDailyReport() {
  const reportDate = $("#daily-report-date")?.value || selectedReportDate;
  const body = {
    title: `End of day - ${reportDate}`,
    report_date: reportDate,
    body: $("#daily-report-body")?.value || "",
    wins: "",
    blockers: "",
    updated_by: user.name
  };
  const existing = reportForDate(reportDate);
  if (existing) {
    const updated = await api("/api/records/daily_reports", { method: "PATCH", body: { id: existing.id, ...body } });
    state.daily_reports = (state.daily_reports || []).map((report) => report.id === existing.id ? updated : report);
  } else {
    const created = await api("/api/records/daily_reports", { method: "POST", body });
    state.daily_reports = [created, ...(state.daily_reports || [])];
  }
  selectedReportDate = reportDate;
  clearDashboardDraft(`daily-report:${reportDate}`);
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
window.dashboardLinkProject = linkProject;
window.dashboardMoveProject = moveProject;
window.dashboardMoveActionItem = moveActionItem;
window.dashboardLinkActionItem = linkActionItem;
window.dashboardSetActionPriority = setActionPriority;
window.dashboardOpenProject = openProject;
window.dashboardBackToProjects = backToProjects;
window.dashboardSelectTickets = selectTickets;
window.dashboardSelectSocial = selectSocial;
window.dashboardSelectReportDate = selectReportDate;
window.dashboardSaveDailyReport = saveDailyReport;
window.dashboardTogglePlanDone = togglePlanDone;
window.dashboardFilterPlan = filterPlan;
window.dashboardTogglePlan = togglePlan;
window.dashboardDeleteActionItem = deleteActionItem;
window.dashboardActionToTask = actionItemToTask;
window.dashboardAddChecklistItem = addChecklistItem;
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
window.dashboardWebsiteRefresh = loadWebsite;
window.dashboardToolsTab = setToolsTab;
window.dashboardWebsiteView = setWebsiteView;
window.dashboardWebsiteVisitor = openWebsiteVisitor;
window.dashboardWebsiteCloseVisitor = closeWebsiteVisitor;
window.dashboardWebsiteChat = openWebsiteChat;
window.dashboardWebsiteOutcome = setWebsiteOutcome;
