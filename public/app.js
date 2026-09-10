import { BrowserTestCall } from "./reception-call.js";

// The tracker is the reason this dashboard gets opened, so it is the landing
// view and owns the primary nav on its own. The marketing workspace is still a
// click away, but it no longer sits between the user and the numbers.
const primaryTabs = [
  { id: "tracker", label: "Website Tracker", icon: "W" },
  { id: "reception", label: "AI Receptionist", icon: "R" },
  { id: "windowcad", label: "WindowCAD", icon: "Q" }
];

const workspaceTabs = [
  { id: "dashboard", label: "Dashboard", icon: "D" },
  { id: "projects", label: "Projects", icon: "P" },
  { id: "tickets", label: "Tickets", icon: "T" },
  { id: "plan", label: "Plan", icon: "N" },
  { id: "completed", label: "Completed", icon: "C" },
  { id: "social", label: "Social Media", icon: "S" }
];

const tabs = [...primaryTabs, ...workspaceTabs];

const viewCopy = {
  tracker: "Consent-led attribution. Customer details stay in WordPress and AdminBase.",
  reception: "Out-of-hours call handling. Browser test calls, transcripts, summaries and simulated email notifications.",
  windowcad: "Inside the quote tool: what they pick, how far they get, where they stop.",
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
let websitePeriodDays = 30;
let websiteVisitorJourney = null;
let websiteChatTranscript = null;
let fensterTab = "awaiting";
let toolsTab = "hub";
let selectedFensterConversationId = null;
let current = "tracker";
let workspaceOpen = false;
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

function navButton(tab) {
  return `
    <button data-tab="${tab.id}" aria-selected="false">
      <span class="nav-icon">${tab.icon}</span>
      <span>${tab.label}</span>
    </button>
  `;
}

function paintNav() {
  // Workspace stays expanded whenever one of its views is active, so the user
  // never has to re-open the menu to see where they are.
  const expanded = workspaceOpen || workspaceTabs.some((tab) => tab.id === current);
  $("#tabs").innerHTML = `
    <div class="nav-group nav-group--primary">
      ${primaryTabs.map(navButton).join("")}
    </div>
    <div class="nav-group nav-group--workspace">
      <button type="button" class="nav-group__toggle" data-workspace-toggle aria-expanded="${expanded}">
        <span class="nav-icon">M</span>
        <span>Marketing workspace</span>
        <b class="nav-group__chevron" aria-hidden="true">${expanded ? "–" : "+"}</b>
      </button>
      <div class="nav-group__items" ${expanded ? "" : "hidden"}>
        ${workspaceTabs.map(navButton).join("")}
      </div>
    </div>
  `;
  document.querySelectorAll("#tabs button[data-tab]").forEach((button) => {
    button.setAttribute("aria-selected", String(button.dataset.tab === current));
  });
}

function wireChrome() {
  paintNav();
  $("#tabs").addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-workspace-toggle]");
    if (toggle) {
      workspaceOpen = toggle.getAttribute("aria-expanded") !== "true";
      paintNav();
      return;
    }
    const button = event.target.closest("button[data-tab]");
    if (!button) return;
    if (!receptionCanLeave(button.dataset.tab)) return;
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
  applyReceptionHash();
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
    if (current === "tracker" || current === "windowcad") {
      await loadWebsite(true);
    } else if (current === "reception") {
      await loadReception(true);
    } else if (current === "projects" && selectedProjectKey === "tools") {
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
  $("#view-title").textContent = tabs.find((tab) => tab.id === current)?.label || "Website Tracker";
  document.querySelector(".topbar .eyebrow").textContent = viewCopy[current] || "Live marketing command desk";
  paintNav();

  const renderers = {
    tracker: renderTrackerArea,
    reception: renderReceptionArea,
    windowcad: renderWindowcadArea,
    dashboard: renderDashboard,
    projects: renderProjects,
    tickets: renderTickets,
    plan: renderPlan,
    completed: renderCompleted,
    social: renderSocial
  };

  (renderers[current] || renderTrackerArea)();
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

// Top-level tracker: the same tool, but landed on directly rather than reached
// through Projects > Tools, so it carries no "back to Tools" affordance.
function renderTrackerArea() {
  // The topbar above already prints "Website Tracker" and the same subtitle, so
  // this header carries the controls only rather than saying it a second time.
  const periods = [7, 30, 90, 365];
  view.innerHTML = `
    <div class="wt-shell">
      <div class="wt-shell__head">
        <div class="fw-periods" role="group" aria-label="Reporting period">
          ${periods.map((days) => `
            <button class="fw-period ${websitePeriodDays === days ? "is-active" : ""}"
              onclick="window.dashboardWebsitePeriod(${days})">
              ${days === 365 ? "1 year" : `${days} days`}
            </button>
          `).join("")}
        </div>
        <div class="wt-shell__actions">
          <button class="tool-action" onclick="window.dashboardWebsiteRefresh()">Refresh</button>
        </div>
      </div>
      <p id="website-status" class="result-note">Loading website reporting...</p>
      <div id="website-dead"></div>
      <div id="website-app" class="website-app"></div>
    </div>
  `;
  loadWebsite(true);
}

function renderWindowcadArea() {
  const periods = [7, 30, 90, 365];
  view.innerHTML = `
    <div class="wt-shell">
      <div class="wt-shell__head">
        <div class="fw-periods" role="group" aria-label="Reporting period">
          ${periods.map((days) => `
            <button class="fw-period ${websitePeriodDays === days ? "is-active" : ""}"
              onclick="window.dashboardWebsitePeriod(${days})">
              ${days === 365 ? "1 year" : `${days} days`}
            </button>
          `).join("")}
        </div>
        <div class="wt-shell__actions">
          <button class="tool-action" onclick="window.dashboardWebsiteRefresh()">Refresh</button>
        </div>
      </div>
      <p id="website-status" class="result-note">Loading quote tool reporting...</p>
      <div id="website-app" class="website-app"></div>
    </div>
  `;
  loadWebsite(true);
}

function renderWindowcadTool() {
  const mount = $("#website-app");
  if (!mount || !websiteState) return;
  const s = websiteState;

  const t = s.quoteTotals || {};
  const st = s.statistical || {};
  const seen = Number(t.seen || 0);
  const opened = Number(t.opened || 0);
  /* A visitor who refuses cookies still finishes a quote, and it still becomes a
     lead. Those arrive with Tracking "rejected-cookies", so there is no journey
     to hang them on and they are only ever counted in the aggregate. Showing the
     consented figure alone made a real lead look like it had vanished. */
  const attributed = Number(t.completed || 0);
  const unattributed = Math.max(0, Number(st.quoteCompletions || 0));
  const completed = attributed + unattributed;
  const daily = Array.isArray(s.quoteDaily) ? s.quoteDaily : [];

  const engaged = Number(s.toolEngaged || 0);
  const finished = Number(s.toolCompletedAfterEngaging || 0);
  const untouched = Number(s.toolUntouched || 0);
  const choices = Array.isArray(s.toolChoices) ? s.toolChoices : [];
  const leaves = Array.isArray(s.toolLeaveSteps) ? s.toolLeaveSteps : [];
  const depth = Array.isArray(s.toolDepth) ? s.toolDepth : [];
  const rows = Array.isArray(s.toolTrailRows) ? s.toolTrailRows : [];

  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  mount.innerHTML = `
    <div class="wt-kpis">
      <article class="wt-kpi wt-kpi--lead"><strong>${wtFmt(completed)}</strong><span>Quotes completed</span><small>${wtFmt(attributed)} traceable${unattributed ? ` &middot; ${wtFmt(unattributed)} refused cookies` : ""}</small></article>
      <article class="wt-kpi"><strong>${wtFmt(opened)}</strong><span>Opened the tool</span><small>${pct(opened, seen)}% of those who saw it</small></article>
      <article class="wt-kpi"><strong>${wtFmt(seen)}</strong><span>Saw the tool</span><small>frame loaded on a page</small></article>
      <article class="wt-kpi"><strong>${pct(completed, seen)}%</strong><span>Seen to quote</span><small>the whole funnel, end to end</small></article>
    </div>

    ${wcFunnel([
      { label: "Saw the tool", value: seen, hue: "var(--soft-2)", ink: "var(--ink)" },
      { label: "Opened it", value: opened, hue: "var(--blue)", ink: "#fff" },
      { label: "Completed a quote", value: completed, hue: "var(--green)", ink: "#fff" }
    ])}

    ${unattributed ? `<p class="wc-scope">${wtFmt(unattributed)} of these quotes came from visitors who <strong>refused cookies</strong>. They are real leads and they are in WordPress and AdminBase, but they arrive with no journey reference, so they cannot appear in the chart, the pages or the sources below &mdash; only in the totals above.</p>` : ""}
    ${wcDailyChart(daily)}

    <div class="wt-grid wt-grid--two">
      ${wcBarPanelFull("Where quotes are started", "The page the tool was opened from. This is the number that showed the homepage had stopped feeding /online-quote/.",
        (Array.isArray(s.quotePages) ? s.quotePages : []).map((r) => ({ label: r.page, count: Number(r.opened || 0) })), "var(--blue)")}
      ${wcBarPanelFull("What brings the people who finish one", "Source of the journeys that completed a quote.",
        (Array.isArray(s.quoteSources) ? s.quoteSources : []).map((r) => ({ label: r.src, count: Number(r.quotes || 0) })), "var(--green)")}
    </div>

    <section class="wt-panel wc-inside">
      <header class="wt-panel__head">
        <div><h4>Inside the designer</h4><p>What people pick and where they stop, reported by the tool itself.</p></div>
        ${engaged ? `<strong class="wt-panel__figure">${wtFmt(engaged)}<small>used it</small></strong>` : ""}
      </header>
      ${engaged || rows.length ? `
        <div class="wc-inside__stats">
          <span><b>${wtFmt(engaged)}</b> used it</span>
          <span><b>${wtFmt(finished)}</b> got a quote</span>
          <span><b>${wtFmt(Math.max(0, engaged - finished))}</b> gave up inside</span>
          <span class="wc-muted"><b>${wtFmt(untouched)}</b> loaded without touching it &mdash; excluded</span>
          ${Number(s.toolUnseen || 0) ? `<span class="wc-warn"><b>${wtFmt(Number(s.toolUnseen))}</b> completed a quote with no in-tool session recorded</span>` : ""}
        </div>
        <div class="wc-inside__grid">
          ${wcBars("What they pick", choices.map((c) => ({ label: c.choice, count: Number(c.count || 0) })), "var(--green)")}
          ${wcBars("How far they get", depth.map((d) => ({ label: Number(d.depth) === 1 ? "1 screen" : d.depth + " screens", count: Number(d.journeys || 0) })), "var(--blue)")}
          ${wcBars("Where they give up", leaves.map((l) => ({ label: l.step, count: Number(l.count || 0) })), "var(--amber)")}
        </div>
        ${wcTrails(rows)}
      ` : `
        <p class="wc-empty-note">No step detail yet. The designer reports its own screens through WindowCAD&rsquo;s Analytics JavaScript and the site relays them; a visitor has to actually touch the tool for a row to appear. ${untouched ? `<b>${wtFmt(untouched)}</b> loaded it without interacting in this period &mdash; those are excluded on purpose.` : ""}</p>
      `}
    </section>
  `;
}

/* An ordered funnel: three stages of one journey, so the width IS the number
   and each stage carries its own drop-off. Not a pie, not three tiles. */
function wcFunnel(stages) {
  const max = Math.max(1, ...stages.map((x) => x.value));
  return `
    <section class="wt-panel">
      <header class="wt-panel__head"><div><h4>The quote funnel</h4><p>Every stage from seeing the tool to a finished quote.</p></div></header>
      <div class="wc-funnel">
        ${stages.map((st, i) => {
          const prev = i ? stages[i - 1].value : null;
          const drop = prev && prev > st.value ? prev - st.value : 0;
          return `
            <div class="wc-funnel__row">
              <span class="wc-funnel__name">${escapeHtml(st.label)}</span>
              <span class="wc-funnel__bar">
                <i style="width:${Math.max(4, Math.round((st.value / max) * 100))}%;background:${st.hue};color:${st.ink}">${wtFmt(st.value)}</i>
              </span>
              <span class="wc-funnel__drop">${drop ? "&minus;" + wtFmt(drop) : ""}</span>
            </div>`;
        }).join("")}
      </div>
    </section>`;
}

/* Three stages of one funnel, same unit, one axis. Legend present because
   there is more than one series; stages read light to dark. */
function wcDailyChart(daily) {
  if (!daily.length) return "";
  const max = Math.max(1, ...daily.map((d) => Number(d.seen || 0)));
  const n = daily.length;
  const w = Math.max(360, n * 30);
  const h = 170;
  const base = h - 26;
  const slot = w / n;
  const bw = Math.max(6, Math.min(18, slot - 10));
  return `
    <section class="wt-panel">
      <header class="wt-panel__head">
        <div><h4>Quote activity by day</h4><p>Seen, opened and completed across the period.</p></div>
        <span class="wc-legend">
          <b class="wc-key" style="background:var(--soft-2)"></b>Seen
          <b class="wc-key" style="background:var(--blue)"></b>Opened
          <b class="wc-key" style="background:var(--green)"></b>Completed
        </span>
      </header>
      <div class="wc-chart">
        <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Quote activity by day">
          <line x1="0" y1="${base}" x2="${w}" y2="${base}" stroke="var(--line)" stroke-width="1"/>
          ${daily.map((d, i) => {
            const sv = Number(d.seen || 0), ov = Number(d.opened || 0), cv = Number(d.completed || 0);
            const x = Math.round(i * slot + (slot - bw) / 2);
            const bar = (v, fill, z) => {
              const bh = Math.round((v / max) * (base - 14));
              return bh > 0 ? `<rect x="${x}" y="${base - bh}" width="${bw}" height="${bh}" rx="3" fill="${fill}" opacity="${z}"/>` : "";
            };
            return `<g><title>${escapeHtml(d.day)} — ${sv} seen, ${ov} opened, ${cv} completed</title>
              ${bar(sv, "var(--soft-2)", 1)}${bar(ov, "var(--blue)", 1)}${bar(cv, "var(--green)", 1)}
              ${i % Math.ceil(n / 12) === 0 ? `<text x="${x + bw / 2}" y="${h - 9}" text-anchor="middle" class="wc-chart__tick">${escapeHtml(String(d.day).slice(5).replace("-", "/"))}</text>` : ""}
            </g>`;
          }).join("")}
        </svg>
      </div>
    </section>`;
}

function wcBarPanelFull(title, hint, items, hue) {
  return `
    <section class="wt-panel">
      <header class="wt-panel__head"><div><h4>${escapeHtml(title)}</h4><p>${escapeHtml(hint)}</p></div></header>
      ${items.length ? wcBars("", items, hue) : `<p class="wc-empty-note">Nothing recorded in this period.</p>`}
    </section>`;
}

function wcBars(title, items, hue) {
  if (!items.length) return `<div class="wc-block"><h5>${escapeHtml(title)}</h5><p class="wc-muted">Nothing yet.</p></div>`;
  const max = Math.max(1, ...items.map((i) => i.count));
  return `
    <div class="wc-block">
      ${title ? `<h5>${escapeHtml(title)}</h5>` : ""}
      <div class="wc-bars">
        ${items.slice(0, 10).map((i) => `
          <div class="wc-bar" title="${escapeHtml(String(i.label || "unnamed"))}: ${wtFmt(i.count)}">
            <span class="wc-bar__label">${escapeHtml(String(i.label || "unnamed"))}</span>
            <span class="wc-bar__track"><i style="width:${Math.max(3, Math.round((i.count / max) * 100))}%;background:${hue}"></i></span>
            <span class="wc-bar__value">${wtFmt(i.count)}</span>
          </div>`).join("")}
      </div>
    </div>`;
}

function wcTrails(rows) {
  const trails = new Map();
  rows.slice().reverse().forEach((r) => {
    if (!trails.has(r.journey_id)) trails.set(r.journey_id, []);
    trails.get(r.journey_id).push(r);
  });
  const recent = [...trails.entries()].slice(-12).reverse();
  if (!recent.length) return "";
  return `
    <h5 class="wc-block__head">Recent journeys</h5>
    <div class="wc-trails">
      ${recent.map(([id, evts]) => {
        const done = evts.some((e) => e.event_type === "quote_completed");
        const mins = Math.max(0, Math.round((Date.parse(evts[evts.length - 1].occurred_at) - Date.parse(evts[0].occurred_at)) / 60000));
        const steps = evts.filter((e) => e.event_type !== "quote_tool_left" && e.cta);
        return `
          <article class="wc-trail ${done ? "wc-trail--won" : ""}">
            <header><code>${escapeHtml(String(id).slice(4, 12))}</code><time>${escapeHtml(String(evts[0].occurred_at || "").slice(11, 16))} · ${mins}m</time></header>
            <ol>${steps.map((e) => `<li>${escapeHtml(e.cta)}</li>`).join("")}</ol>
            <footer>${done ? "Got a quote" : "Stopped here"}</footer>
          </article>`;
      }).join("")}
    </div>`;
}

function setWebsitePeriod(days) {
  websitePeriodDays = days;
  if (current === "windowcad") renderWindowcadArea(); else renderTrackerArea();
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
  if (!["overview", "leads", "channels", "behaviour", "visitors", "chats"].includes(nextView)) return;
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
  if (!mount || (!force && current !== "tracker" && current !== "windowcad" && current !== "tools" && selectedProjectKey !== "tools")) return;
  const isRepaint = !!mount.innerHTML;
  if (!isRepaint && status) status.textContent = "Loading...";
  try {
    websiteState = await api(`/api/fenster/website/state?days=${websitePeriodDays}`);
    if (status) status.textContent = "";
    if (current === "windowcad") renderWindowcadTool(); else renderWebsiteTool();
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
  const deadNote = $("#website-dead");
  if (deadNote) {
    const dead = Number(websiteState.deadJourneys || 0);
    deadNote.innerHTML = dead
      ? `<p class="wc-scope">${wtFmt(dead)} journeys opened a page and did nothing else &mdash; no scroll, no click, no form, and a quote frame loading by itself does not count. They are excluded from every figure below. Nothing a person actually did is removed: quotes, forms and clicks are all still counted in full.</p>`
      : "";
  }
  /*
   * Tabs are named for the question each answers, not for the table behind it.
   * "Leads" did not exist before: the completed quotes and sent forms were only
   * visible as a 16-row strip at the bottom of Overview, which is the wrong
   * place for the one thing the business is measured on.
   */
  const views = [
    ["overview", "Overview", 0],
    ["leads", "Leads", (websiteState.recent || []).length],
    ["channels", "Channels", (websiteState.acquisition || []).length],
    ["behaviour", "Behaviour", 0],
    ["visitors", "Visitors", (websiteState.visitors || []).length],
    ["chats", "Legend", (websiteState.chats || []).length]
  ];
  const body = ({
    overview: wtOverview,
    leads: wtLeads,
    channels: wtAcquisition,
    behaviour: wtPages,
    visitors: wtCustomers,
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
  /*
   * The headline is every lead the site produced, consented or not, because
   * that is the number the business is actually judged on. The consented-only
   * counts sit behind it as the attributable subset -- the part that can be
   * traced to a source. Showing only the consented figure understated leads by
   * whatever share never answered the banner, which is most of them.
   */
  const stat = s.statistical || {};
  const totalQuotes = Number(s.quotes || 0) + Number(stat.quoteCompletions || 0);
  const totalForms = Number(s.forms || 0) + Number(stat.forms || 0);
  const totalLeads = totalQuotes + totalForms;
  const attributable = Number(s.quotes || 0) + Number(s.forms || 0);

  const kpis = [
    [totalLeads, "Leads", `${wtFmt(attributable)} traceable to a source`],
    [totalQuotes, "WindowCAD quotes", `${wtFmt(s.quotes || 0)} consented`],
    [totalForms, "Forms sent", `${wtFmt(totalForms ? (s.formStarts || 0) + (stat.formStarts || 0) : 0)} started`],
    [Number(s.quoteJourneys || 0) + Number(stat.quoteStarts || 0), "Quote starts", "deliberate opens"],
    [Number(s.calls || 0) + Number(stat.contactClicks || 0), "Phone / email clicks", "intent only, not answered calls"],
    [Number(s.ctaClicks || 0) + Number(stat.ctaClicks || 0), "CTA clicks", "commercial buttons pressed"],
    [s.legendChats, "Legend chats", "saved for 30-day QA"],
    [s.outcomes?.won || 0, "Won leads", "marked by the office"]
  ];
  return `
    ${wtCoverage()}
    ${wtTrackingAlert()}
    <div class="wt-kpis">${kpis.map(([value, label, hint], index) => `
      <article class="wt-kpi ${index === 0 ? "wt-kpi--lead" : ""}"><strong>${wtFmt(value)}</strong><span>${label}</span><small>${hint}</small></article>
    `).join("")}</div>
    ${wtCampaigns()}
    ${wtTrend()}
    <div class="wt-grid wt-grid--two">
      ${wtFunnel()}
      ${wtQuoteTool()}
    </div>
    <div class="wt-grid wt-grid--two">
      ${wtConsent()}
    </div>
    ${wtDecision()}
  `;
}

/*
 * Paid performance, and the only panel here that is complete for ads.
 *
 * The click is read from the landing URL, so it needs no consent and does not
 * depend on the visitor answering the banner. If every campaign reads
 * "Not tagged", the Final URL suffix is missing in the Google Ads account --
 * nothing here can recover a campaign name that was never sent.
 */
function wtCampaigns() {
  const rows = (websiteState.adClicks || []).filter((row) => Number(row.clicks || 0) > 0);
  if (!rows.length) {
    return `
      <section class="wt-panel">
        <h3>Paid campaigns</h3>
        <div class="fw-empty">
          <strong>No ad clicks recorded in this period</strong>
          <span>Clicks appear here automatically. If paid traffic is running and this stays empty, check the Final URL suffix in Google Ads.</span>
        </div>
      </section>
    `;
  }

  const untagged = rows.filter((row) => !row.campaign).length;
  return `
    <section class="wt-panel">
      <h3>Paid campaigns <small class="fw-tag">no consent needed</small></h3>
      <table class="wt-table">
        <thead><tr><th>Campaign</th><th>Clicks</th><th>Leads</th><th>Quotes</th><th>Forms</th><th>Per lead</th></tr></thead>
        <tbody>
          ${rows.map((row) => {
            const clicks = Number(row.clicks || 0);
            const leads = Number(row.leads || 0);
            return `
              <tr>
                <td>${row.campaign ? escapeHtml(row.campaign) : '<em class="fw-muted">Not tagged</em>'}</td>
                <td>${wtFmt(clicks)}</td>
                <td><b>${wtFmt(leads)}</b></td>
                <td>${wtFmt(row.quotes || 0)}</td>
                <td>${wtFmt(row.forms || 0)}</td>
                <td>${leads ? `${(clicks / leads).toFixed(1)} clicks` : "&mdash;"}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
      ${untagged ? `<p class="fw-coverage__note">${untagged} campaign row${untagged === 1 ? " has" : "s have"} no name, which means the Google Ads Final URL suffix is not set on that campaign. The clicks are still counted; only the campaign name is missing.</p>` : ""}
    </section>
  `;
}

/*
 * Every other number on this screen is a subset of the traffic, so the screen
 * has to say so before it says anything else. Visitors who never answer the
 * cookie banner never get a visitor ID, a journey, a source or a timeline --
 * they exist only as anonymous hourly counts. Measured on 2 August 2026 that
 * was the large majority of traffic, which makes an unqualified "unique
 * visitors" figure actively misleading. This panel states the split in the
 * reader's first glance rather than burying it in a Consent Health tab.
 *
 * The headline is deliberately the PAGE VIEW split, not "% who answered the
 * banner". banner_shown is documented as unreliable (pre-consent crawler and
 * session traffic inflate or miss it), and reading production it undercounts
 * against the choices actually recorded -- 562 choices against 499 impressions,
 * which rendered as "113% of visitors answered". A ratio that can exceed 100%
 * is not a measurement. The choice COUNT is sound, so it is shown as a count.
 */
function wtCoverage() {
  const consent = websiteState.consent || {};
  const shown = Number(consent.shown || 0);
  // The API serialises these camelCase; reading them snake_case silently summed
  // to zero and the panel confidently reported "0% answered the banner".
  const decisions = Number(consent.necessaryOnly || 0)
    + Number(consent.analyticsOnly || 0)
    + Number(consent.marketingOnly || 0)
    + Number(consent.allOptional || 0);

  const consentedViews = (websiteState.series?.events || [])
    .reduce((total, row) => total + Number(row.page_views || 0), 0);
  const anonymousViews = Number(websiteState.statistical?.pageViews || 0);
  const totalViews = consentedViews + anonymousViews;

  const consentedShare = totalViews ? Math.round((consentedViews / totalViews) * 100) : 0;

  if (!shown && !totalViews) {
    return `
      <div class="fw-empty">
        <strong>No traffic recorded yet for this period</strong>
        <span>Once the website reports its first consented visit, coverage appears here.</span>
      </div>
    `;
  }

  const integrity = websiteState.integrity || {};
  const unresolved = Number(integrity.unclassified || 0) + Number(integrity.no_signal || 0);

  return `
    <section class="fw-coverage">
      <div class="fw-coverage__head">
        <strong>${consentedShare}% of page views are attributable</strong>
        <span>${wtFmt(decisions)} cookie choices recorded over ${websiteState.periodDays || 30} days</span>
      </div>
      <div class="fw-coverage__bar" role="img"
        aria-label="${wtFmt(consentedViews)} visits with a timeline and ${wtFmt(anonymousViews)} counted anonymously">
        <i style="width:${consentedShare}%"></i><i style="width:${100 - consentedShare}%"></i>
      </div>
      <p class="fw-coverage__note">
        <b>${wtFmt(consentedViews)}</b> page views came from visitors who accepted analytics
        (${consentedShare}%), and <b>${wtFmt(anonymousViews)}</b> from visitors who did not.
        Only the consented share has a visitor ID, a journey, a traffic source or a timeline &mdash;
        everything below headed &ldquo;consented&rdquo; is drawn from that share alone,
        not from all of your traffic.
      </p>
      ${unresolved ? `<p class="fw-coverage__note fw-muted">${wtFmt(unresolved)} journeys in this period predate automated-traffic filtering and cannot be resolved retrospectively, because the user agent was never stored. Do not read them as human.</p>` : ""}
    </section>
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
  // Follow the selected period instead of always drawing 30 columns, which used
  // to pad the chart with weeks of empty bars whenever history was shorter.
  const span = Number(websiteState.periodDays || 30);
  const days = [];
  for (let i = span - 1; i >= 0; i--) {
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
  const engaged = Number(websiteState.toolEngaged || 0);
  const steps = [
    ["Consented visitors", Number(websiteState.uniqueVisitors || 0), "accepted optional cookies"],
    ["CTA clicks", Number(websiteState.ctaClicks || 0), "chose a commercial action"],
    ["Quote starts", Number(websiteState.quoteJourneys || 0), "deliberately opened"],
    /* ADDED ONLY ONCE IT HAS DATA. A step that is permanently zero because its
       source is not deployed yet reads as a funnel where everybody dies, which
       is worse than not showing it. It appears by itself when the bridge is
       live. */
    ...(engaged ? [["Tool engaged", engaged, "actually used the designer"]] : []),
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

/*
 * INSIDE THE QUOTE TOOL.
 *
 * Everything else on this page stops at the edge of the WindowCAD iframe: the
 * funnel could show a quote being opened and a quote coming back, and NOTHING
 * about the minutes in between. A funnel that lost people inside the designer
 * was indistinguishable from one nobody opened, which is why the September 2026
 * lead drop had to be diagnosed from raw access logs.
 *
 * The figures are journeys, not events -- the designer redraws constantly, so
 * counting `quote_step` rows would measure rendering, not people.
 */
function wtQuoteTool() {
  const opened = Number(websiteState.quoteJourneys || 0);
  const engaged = Number(websiteState.toolEngaged || 0);
  const finished = Number(websiteState.toolCompletedAfterEngaging || 0);
  const leaveSteps = Array.isArray(websiteState.toolLeaveSteps) ? websiteState.toolLeaveSteps : [];
  const choices = Array.isArray(websiteState.toolChoices) ? websiteState.toolChoices : [];
  const finishRate = engaged ? Math.round((finished / engaged) * 100) : 0;
  const abandoned = Math.max(0, engaged - finished);

  if (!engaged && !leaveSteps.length && !choices.length) {
    return `
      <section class="wt-panel wt-quotetool">
        <header class="wt-panel__head">
          <div><h4>Inside the quote tool</h4><p>The product, style and colour chosen on each screen, and how far people get.</p></div>
        </header>
        <p class="wt-empty">Nothing recorded yet. The tool reports its own steps through WindowCAD&rsquo;s Analytics JavaScript and the site relays them &mdash; both halves have to be live before anything appears here.</p>
      </section>
    `;
  }

  const maxLeave = Math.max(1, ...leaveSteps.map((row) => Number(row.count || 0)));
  return `
    <section class="wt-panel wt-quotetool">
      <header class="wt-panel__head">
        <div><h4>Inside the quote tool</h4><p>The product, style and colour chosen on each screen, and how far people get.</p></div>
        <strong class="wt-panel__figure">${finishRate}%<small>engaged to quote</small></strong>
      </header>
      <div class="wt-consent__figures">
        <article><strong>${wtFmt(opened)}</strong><span>Opened</span></article>
        <article><strong>${wtFmt(engaged)}</strong><span>Actually used it</span></article>
        <article><strong>${wtFmt(finished)}</strong><span>Got a quote</span></article>
        <article><strong>${wtFmt(abandoned)}</strong><span>Gave up inside</span></article>
      </div>
      ${choices.length ? `
        <h5 class="wt-quotetool__head">What they choose</h5>
        <div class="wt-funnel__steps">
          ${choices.map((row) => `
            <div class="wt-funnel__step">
              <span class="wt-funnel__label">${escapeHtml(String(row.choice || ""))}</span>
              <span class="wt-funnel__bar"><i style="width:${Math.max(3, Math.round((Number(row.count || 0) / Math.max(1, ...choices.map((c) => Number(c.count || 0)))) * 100))}%"></i></span>
              <span class="wt-funnel__value">${wtFmt(Number(row.count || 0))}</span>
            </div>
          `).join("")}
        </div>
      ` : ""}
      ${leaveSteps.length ? `
        <h5 class="wt-quotetool__head">Where they gave up</h5>
        <div class="wt-funnel__steps">
          ${leaveSteps.map((row) => `
            <div class="wt-funnel__step">
              <span class="wt-funnel__label">${escapeHtml(String(row.step || "unnamed screen"))}</span>
              <span class="wt-funnel__bar"><i style="width:${Math.max(3, Math.round((Number(row.count || 0) / maxLeave) * 100))}%"></i></span>
              <span class="wt-funnel__value">${wtFmt(Number(row.count || 0))}</span>
            </div>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function wtConsent() {
  const consent = websiteState.consent || {};
  const necessaryOnly = Number(consent.necessaryOnly || 0);
  const analyticsOnly = Number(consent.analyticsOnly || 0);
  const marketingOnly = Number(consent.marketingOnly || 0);
  const allOptional = Number(consent.allOptional || 0);
  const answered = necessaryOnly + analyticsOnly + marketingOnly + allOptional;
  const analyticsAccepted = analyticsOnly + allOptional;
  const marketingAccepted = marketingOnly + allOptional;
  const rate = answered ? Math.round((analyticsAccepted / answered) * 100) : 0;
  return `
    <section class="wt-panel wt-consent">
      <header class="wt-panel__head">
        <div><h4>Consent health</h4><p>Aggregate choices only, never tied to a visitor. This decides how representative the journey data is.</p></div>
        <strong class="wt-panel__figure">${rate}%<small>analytics consent</small></strong>
      </header>
      <div class="wt-consent__meter"><i style="width:${rate}%"></i></div>
      <div class="wt-consent__figures">
        <article><strong>${wtFmt(answered)}</strong><span>Choices recorded</span></article>
        <article><strong>${wtFmt(allOptional)}</strong><span>Accept all</span></article>
        <article><strong>${wtFmt(analyticsOnly)}</strong><span>Analytics only</span></article>
        <article><strong>${wtFmt(marketingOnly)}</strong><span>Marketing only</span></article>
        <article><strong>${wtFmt(necessaryOnly)}</strong><span>Necessary only</span></article>
        <article><strong>${wtFmt(marketingAccepted)}</strong><span>Ads addressable</span></article>
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

/*
 * Leads earn their own tab. Previously the only place a completed quote or sent
 * form appeared individually was a 16-row strip at the foot of Overview, under
 * four other panels -- the one thing the business is judged on, placed last.
 */
function wtLeads() {
  const rows = websiteState.recent || [];
  const stat = websiteState.statistical || {};
  const untraceable = Number(stat.quoteCompletions || 0) + Number(stat.forms || 0);

  if (!rows.length) {
    return `
      <div class="fw-empty">
        <strong>No attributed leads in this period</strong>
        <span>A lead appears here when a visitor who accepted analytics completes a WindowCAD quote or sends a form.</span>
      </div>
    `;
  }

  const byStatus = rows.reduce((acc, row) => {
    const key = row.outcome_status || "new";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const chips = ["new", "contacted", "qualified", "appointment", "won", "lost"]
    .filter((status) => byStatus[status])
    .map((status) => `<span class="fw-chip fw-chip--${status}">${wtFmt(byStatus[status])} ${status}</span>`)
    .join("");

  return `
    ${untraceable ? `
      <div class="wt-alert">
        <strong>${wtFmt(untraceable)} more lead${untraceable === 1 ? "" : "s"} arrived without attribution</strong>
        <span>They reached the office normally and are in WordPress and AdminBase, but the visitor never accepted
        analytics cookies, so there is no source, landing page or journey to show for them here.</span>
      </div>
    ` : ""}
    <section class="wt-panel">
      <header class="wt-panel__head">
        <div>
          <h4>Attributed leads</h4>
          <p>Completed WindowCAD quotes and sent forms with the first-touch source that earned them.
          Set the outcome once you have checked the real lead in AdminBase.</p>
        </div>
        <div class="fw-chips">${chips}</div>
      </header>
      <div class="wt-table-wrap">
        <table class="wt-table">
          <thead>
            <tr>
              <th>When</th><th>Lead</th><th>Outcome</th><th>Source</th><th>Landing page</th><th>Product / value</th>
            </tr>
          </thead>
          <tbody>${rows.map(renderWebsiteEvent).join("")}</tbody>
        </table>
      </div>
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
  return ({ visitor_seen: "Visitor returned", page_view: "Viewed page", page_engaged: "Time on page", link_click: "Clicked link", cta_click: "Clicked call to action", scroll_depth: "Reached page depth", quote_opened: "Opened quote tool", quote_iframe_loaded: "Quote tool exposure", quote_completed: "Completed WindowCAD quote", form_started: "Started form", form_validation_error: "Form validation warning", form_submitted: "Sent form", phone_click: "Tapped phone number", email_click: "Tapped email", chat_opened: "Opened Legend chat", chat_acknowledged: "Accepted chat terms", chat_message_sent: "Sent Legend message", chat_reply_received: "Received Legend reply" })[event] || event;
}

function renderWebsiteJourney() {
  const journey = websiteVisitorJourney;
  const events = journey.events || [];
  const journeys = journey.journeys || [];
  const references = journeys.map((item) => `<code>${escapeHtml(item.journey_id)}</code>`).join("");
  const chats = journey.chats || [];
  return `<section class="website-journey-detail"><div class="website-journey-detail__head"><div><span>Visitor journey</span><h3><code>${escapeHtml(journey.visitor.visitor_id)}</code></h3><p>${escapeHtml(String(journeys.length || 0))} tracked journey${journeys.length === 1 ? "" : "s"} · pseudonymous and consented</p><div class="website-journey-refs"><span>WindowCAD tracking reference${journeys.length === 1 ? "" : "s"}</span>${references || "<em>No WindowCAD journey yet</em>"}</div></div><button onclick="window.dashboardWebsiteCloseVisitor()">Close <b>×</b></button></div>${chats.length ? `<div class="website-note"><strong>Legend chats</strong><span>${chats.map((chat) => `<button onclick="window.dashboardWebsiteChat('${escapeHtml(chat.conversation_id)}')">Read ${escapeHtml(String(chat.messages))}-message chat</button>`).join(' ')}</span></div>` : ''}${events.length ? `<div class="website-timeline">${events.map(renderWebsiteJourneyEvent).join("")}</div>` : `<p class="empty">No detailed events yet.</p>`}</section>`;
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
      <td><select class="website-outcome-select" aria-label="Lead status" onchange="window.dashboardWebsiteOutcome('${escapeHtml(item.journey_id)}', this.value)">${["new", "contacted", "qualified", "appointment", "won", "lost"].map((status) => `<option value="${status}" ${status === (item.outcome_status || "new") ? "selected" : ""}>${status[0].toUpperCase() + status.slice(1)}</option>`).join("")}</select></td>
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

// ---------------------------------------------------------------------------
// AI Receptionist: calls list, call detail, and the browser test-call console.
//
// The voice transport lives in reception-call.js. This section only renders
// state and relays clicks; it never touches the microphone or WebRTC itself.
// ---------------------------------------------------------------------------

let receptionState = null;
let receptionView = "calls";
let receptionDetail = null;
let receptionEmailMode = "text";
let receptionPendingOpenId = "";
let receptionLiveCall = null;
let receptionLive = freshReceptionLive();
let receptionTimer = null;
let receptionSetup = { callerNumber: "", voice: "" };

function freshReceptionLive() {
  return { state: null, transcript: [], notices: [], level: 0, result: null, error: "" };
}

const RC_ICONS = {
  mic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>`,
  end: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12c5-5 13-5 18 0l-2.5 2.5-3-1.5v-2c-2.2-.7-4.8-.7-7 0v2l-3 1.5Z"/></svg>`
};

function renderReceptionArea() {
  view.innerHTML = `
    <div class="wt-shell">
      <p id="reception-status" class="result-note" aria-live="polite"></p>
      <div id="reception-app" class="reception-app"></div>
    </div>
  `;
  renderReception();
  loadReception(true);
}

function setReceptionStatus(text) {
  const node = $("#reception-status");
  if (node) node.textContent = text || "";
}

async function loadReception(silent = false) {
  const mount = $("#reception-app");
  if (!mount || current !== "reception") return;
  try {
    receptionState = await api("/api/reception/state");
    if (!silent) setReceptionStatus("");
    // Never rebuild the console mid-call; the live nodes are updated in place.
    if (receptionView === "calls" || !receptionLiveCall?.isActive) renderReception();
    if (receptionPendingOpenId) {
      const id = receptionPendingOpenId;
      receptionPendingOpenId = "";
      await openReceptionCall(id);
    }
  } catch (error) {
    setReceptionStatus(error.message);
  }
}

function renderReception() {
  const mount = $("#reception-app");
  if (!mount) return;
  rememberDashboardDrafts(mount);
  const calls = receptionState?.calls || [];
  const live = Boolean(receptionLiveCall?.isActive);
  mount.innerHTML = `
    <nav class="wt-nav" aria-label="AI Receptionist views">
      <button class="wt-nav__item ${receptionView === "calls" ? "is-active" : ""}" onclick="window.dashboardReceptionView('calls')">
        <span>Calls</span>${calls.length ? `<b>${wtFmt(calls.length)}</b>` : ""}
      </button>
      <button class="wt-nav__item ${receptionView === "test" ? "is-active" : ""}" onclick="window.dashboardReceptionView('test')">
        <span>Test Call</span>${live ? `<b class="rc-nav-live">Live</b>` : ""}
      </button>
    </nav>
    <div class="wt-body">${receptionView === "test" ? rcConsole() : rcCalls()}</div>
  `;
  restoreDashboardDrafts(mount);
  if (receptionView === "test") rcSyncConsole();
}

function setReceptionView(nextView) {
  if (!["calls", "test"].includes(nextView)) return;
  if (nextView === "calls" && receptionLiveCall?.isActive) {
    setReceptionStatus("A test call is in progress. End it before leaving the Test Call view.");
    return;
  }
  receptionView = nextView;
  setReceptionStatus("");
  renderReception();
}

// Called from the sidebar before navigating away. Ends a live call rather
// than leaving the microphone open in a view the user cannot see.
function receptionCanLeave(nextTab) {
  if (nextTab === "reception" || !receptionLiveCall?.isActive) return true;
  if (!confirm("A test call is in progress. Leaving this section will end the call and save it. Continue?")) return false;
  receptionEnd("navigated_away");
  return true;
}

function applyReceptionHash() {
  const match = String(location.hash || "").match(/^#reception(?:\/call\/([A-Za-z0-9-]{8,64}))?$/);
  if (!match) return;
  current = "reception";
  receptionView = "calls";
  receptionPendingOpenId = match[1] || "";
}

// ---------------------------------------------------------------------------
// Calls view
// ---------------------------------------------------------------------------

function rcCalls() {
  const s = receptionState;
  const calls = s?.calls || [];
  const stats = s?.stats || {};
  const config = s?.config || {};
  return `
    ${config.openAi === false ? `
      <div class="wt-alert">
        <strong>OpenAI is not configured for this dashboard.</strong>
        <span>Test calls cannot start until the <code>OPENAI_API_KEY</code> secret is added to the Cloudflare Pages project. Saved calls below are still readable.</span>
      </div>` : ""}
    <div class="wt-kpis">
      <article class="wt-kpi"><strong>${wtFmt(stats.total || 0)}</strong><span>Saved calls</span><small>${wtFmt(stats.today || 0)} today · ${wtFmt(stats.telephone || 0)} by telephone</small></article>
      <article class="wt-kpi"><strong>${wtFmt(stats.needsAction || 0)}</strong><span>Need follow-up</span><small>Action required by the team</small></article>
      <article class="wt-kpi"><strong>${wtFmt(stats.simulatedNotifications || 0)}</strong><span>Simulated emails</span><small>Recorded, none actually sent</small></article>
      <article class="wt-kpi wt-kpi--text"><strong>${escapeHtml(config.realtimeModel || "—")}</strong><span>Voice model</span><small>Summary: ${escapeHtml(config.summaryModel || "—")}</small></article>
    </div>
    ${receptionDetail ? rcDetail() : ""}
    <section class="wt-panel">
      <header class="wt-panel__head">
        <div><h4>Receptionist calls</h4><p>Newest first. Browser tests and real telephone calls sit in the same list; the source column says which. Click a row for the transcript and the email that would have gone to ${escapeHtml(config.notificationTo || "info@fensterglazing.com")}.</p></div>
        <div class="tools-head__actions"><button class="tool-action" onclick="window.dashboardReceptionRefresh()">Refresh</button></div>
      </header>
      ${calls.length ? `
        <div class="table-wrap"><table class="table wt-table rc-table">
          <thead><tr><th>When</th><th>Caller</th><th>For</th><th>Reason</th><th>Action required</th><th>Urgency</th><th>Length</th><th>Source</th><th>Email</th></tr></thead>
          <tbody>${calls.map(rcCallRow).join("")}</tbody>
        </table></div>
      ` : `<p class="empty">No receptionist calls saved yet. Open <strong>Test Call</strong> to make the first one.</p>`}
    </section>
  `;
}

function rcCallRow(call) {
  const active = receptionDetail?.call?.id === call.id;
  const caller = call.caller_name || (call.status === "completed" && call.summary_status === "completed" ? "Name not given" : "");
  const number = call.callback_number || call.caller_number || "";
  return `
    <tr class="rc-row ${active ? "is-active" : ""} ${call.status !== "completed" ? "rc-row--" + escapeHtml(call.status) : ""}" onclick="window.dashboardReceptionOpen('${escapeHtml(call.id)}')">
      <td><strong>${escapeHtml(formatDateTime(call.started_at))}</strong>${call.status !== "completed" ? `<br><small>${escapeHtml(rcStatusLabel(call))}</small>` : ""}</td>
      <td>${caller ? `<strong>${escapeHtml(caller)}</strong>` : `<span class="rc-muted">—</span>`}${number ? `<br><small>${escapeHtml(number)}</small>` : ""}</td>
      <td>${call.requested_person ? escapeHtml(call.requested_person) : `<span class="rc-muted">—</span>`}</td>
      <td>${call.topic ? `<strong>${escapeHtml(call.topic)}</strong>` : `<span class="rc-muted">—</span>`}${call.summary ? `<br><small>${escapeHtml(rcTruncate(call.summary, 110))}</small>` : ""}</td>
      <td>${call.action_required ? escapeHtml(rcTruncate(call.action_required, 90)) : `<span class="rc-muted">—</span>`}</td>
      <td>${rcUrgencyPill(call)}</td>
      <td>${escapeHtml(rcDuration(call.duration_seconds))}</td>
      <td>${rcSourcePill(call.source)}</td>
      <td>${rcNotificationPill(call)}</td>
    </tr>
  `;
}

function rcStatusLabel(call) {
  return { in_progress: "In progress or not ended", failed: `Failed to start${call.end_reason ? ` (${call.end_reason.replace(/_/g, " ")})` : ""}`, abandoned: "Abandoned" }[call.status] || call.status;
}

function rcTruncate(text, limit) {
  const value = String(text || "");
  return value.length > limit ? `${value.slice(0, limit - 1).trimEnd()}…` : value;
}

function rcDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  if (!total) return "—";
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return minutes ? `${minutes}m ${String(rest).padStart(2, "0")}s` : `${rest}s`;
}

function rcUrgencyPill(call) {
  if (call.summary_status === "failed") return `<span class="pill rc-pill rc-pill--failed">Summary failed</span>`;
  if (!call.urgency) return `<span class="rc-muted">—</span>`;
  const label = call.urgency[0].toUpperCase() + call.urgency.slice(1);
  return `<span class="pill rc-pill rc-pill--${escapeHtml(call.urgency)}">${escapeHtml(label)}</span>`;
}

function rcSourcePill(source) {
  const labels = { browser_test: "Browser test", twilio: "Telephone (Twilio)", focus: "Telephone (Focus)", sip: "Telephone (SIP)" };
  return `<span class="pill rc-pill rc-pill--source-${escapeHtml(source || "unknown")}">${escapeHtml(labels[source] || source || "Unknown")}</span>`;
}

function rcNotificationPill(call) {
  const status = call.notification_status || "pending";
  const labels = { simulated: "Simulated", sent: "Sent", failed: "Failed", skipped: "Not needed", pending: "Pending" };
  return `<span class="pill rc-pill rc-pill--note-${escapeHtml(status)}">${escapeHtml(labels[status] || status)}</span>`;
}

async function openReceptionCall(id) {
  try {
    setReceptionStatus("");
    receptionDetail = await api(`/api/reception/calls/${encodeURIComponent(id)}`);
    receptionEmailMode = "text";
    receptionView = "calls";
    renderReception();
    document.querySelector(".rc-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    setReceptionStatus(error.message);
  }
}

function closeReceptionCall() {
  receptionDetail = null;
  renderReception();
}

function setReceptionEmailMode(mode) {
  receptionEmailMode = mode === "html" ? "html" : "text";
  renderReception();
}

async function deleteReceptionCall(id) {
  const call = receptionDetail?.call?.id === id ? receptionDetail.call : (receptionState?.calls || []).find((item) => item.id === id);
  const label = call?.caller_name || call?.topic || formatDateTime(call?.started_at) || id;
  if (!confirm(`Delete this test call (${label})? The transcript and simulated email are removed too.`)) return;
  try {
    await api(`/api/reception/calls/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (receptionDetail?.call?.id === id) receptionDetail = null;
    await loadReception();
    setReceptionStatus("Test call deleted.");
  } catch (error) {
    setReceptionStatus(error.message);
  }
}

async function resummariseReceptionCall(id) {
  try {
    setReceptionStatus("Re-running the summary...");
    receptionDetail = await api(`/api/reception/calls/${encodeURIComponent(id)}/summarise`, { method: "POST", body: {} });
    receptionState = await api("/api/reception/state");
    setReceptionStatus(receptionDetail?.call?.summary_status === "completed" ? "Summary updated." : "The summary still failed. See the call's technical log.");
    renderReception();
  } catch (error) {
    setReceptionStatus(error.message);
  }
}

function rcDetail() {
  const { call, messages = [], notifications = [], events = [] } = receptionDetail;
  const notification = notifications[0] || null;
  const facts = [
    ["Caller", call.caller_name],
    ["Callback number", call.callback_number || (call.caller_number ? `${call.caller_number} (caller ID)` : "")],
    ["Email", call.caller_email],
    ["Postcode / area", call.postcode],
    ["Requested", call.requested_person],
    ["Topic", call.topic],
    ["Urgency", call.urgency ? call.urgency[0].toUpperCase() + call.urgency.slice(1) : ""],
    ["Resolved on the call", call.summary_status === "completed" ? (call.resolved_during_call ? "Yes" : "No, follow-up needed") : ""],
    ["Started", formatDateTime(call.started_at)],
    ["Ended", call.ended_at ? formatDateTime(call.ended_at) : "—"],
    ["Duration", rcDuration(call.duration_seconds)],
    ["Source", ({ browser_test: "browser_test (dashboard microphone test)", twilio: "twilio (telephone call via Twilio and OpenAI SIP)" })[call.source] || call.source],
    ["Called number", call.called_number],
    ["Caller number supplied", call.caller_number ? `${call.caller_number}${call.metadata?.simulated_caller_number ? " (simulated)" : ""}` : "None"],
    ["Voice model", `${call.realtime_model || ""}${call.metadata?.voice ? ` · voice ${call.metadata.voice}` : ""}`],
    ["Summary", ({ completed: `Completed (${call.summary_model || "model"})`, failed: "Failed", skipped: "Skipped (nothing to summarise)", pending: "Pending" })[call.summary_status] || call.summary_status],
    ["Email notification", ({ simulated: `Simulated to ${notification?.recipient || ""} (not sent)`, sent: "Sent", failed: "Failed", skipped: "Not generated", pending: "Pending" })[call.notification_status] || call.notification_status],
    ["Started by", call.started_by]
  ].filter(([, value]) => value);

  return `
    <section class="rc-detail website-journey-detail">
      <div class="website-journey-detail__head">
        <div>
          <span>Call record · ${rcSourcePill(call.source)} ${rcNotificationPill(call)}</span>
          <h3>${escapeHtml(call.topic || (call.status === "completed" ? "Untitled call" : rcStatusLabel(call)))}${call.caller_name ? ` · ${escapeHtml(call.caller_name)}` : ""}</h3>
          <p>${escapeHtml(formatDateTime(call.started_at))} · ${escapeHtml(rcDuration(call.duration_seconds))} · <code>${escapeHtml(call.id)}</code></p>
        </div>
        <button onclick="window.dashboardReceptionClose()">Close <b>×</b></button>
      </div>

      ${call.summary_status === "failed" ? `
        <div class="wt-alert rc-detail__alert">
          <strong>The post-call summary failed, so the transcript is shown raw.</strong>
          <span>${escapeHtml(call.summary_error || "Unknown error")}. No email notification was generated. You can retry once the cause is fixed.</span>
        </div>` : ""}

      <div class="rc-detail__grid">
        <div class="rc-detail__facts">
          <h4>Structured summary</h4>
          <dl class="rc-facts">${facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>
          ${call.summary ? `<h4>Summary</h4><p class="rc-prose">${escapeHtml(call.summary)}</p>` : ""}
          ${call.message ? `<h4>Message for the team</h4><p class="rc-prose">${escapeHtml(call.message)}</p>` : ""}
          ${call.action_required ? `<h4>Action required</h4><p class="rc-prose rc-prose--action rc-prose--${escapeHtml(call.urgency || "normal")}">${escapeHtml(call.action_required)}</p>` : ""}
          <div class="actions">
            ${call.status === "completed" && messages.some((message) => message.role === "user") ? `<button onclick="window.dashboardReceptionResummarise('${escapeHtml(call.id)}')">${call.summary_status === "failed" ? "Retry summary" : "Re-run summary"}</button>` : ""}
            ${call.source === "browser_test" ? `<button class="danger-action" onclick="window.dashboardReceptionDelete('${escapeHtml(call.id)}')">Delete test call</button>` : ""}
          </div>
        </div>
        <div class="rc-detail__transcript">
          <h4>Transcript <small>${wtFmt(messages.length)} turn${messages.length === 1 ? "" : "s"}</small></h4>
          ${messages.length ? `<div class="rc-stream">${messages.map(rcMessage).join("")}</div>` : `<p class="empty">No transcript was captured for this call.</p>`}
        </div>
      </div>

      <div class="rc-email">
        <div class="rc-email__head">
          <div>
            <h4>Email notification preview</h4>
            <p>${notification
              ? `This is exactly what <strong>${escapeHtml(notification.recipient)}</strong> would have received. Status: <strong>${escapeHtml(notification.status)}</strong> via the ${escapeHtml(notification.provider)} provider${notification.status === "simulated" ? " · <strong>no email was actually sent</strong>" : ""}.`
              : "No email was generated for this call."}</p>
          </div>
          ${notification ? `
            <div class="fenster-tabs rc-email__modes">
              <button class="${receptionEmailMode === "text" ? "active" : ""}" onclick="window.dashboardReceptionEmailMode('text')">Plain text</button>
              <button class="${receptionEmailMode === "html" ? "active" : ""}" onclick="window.dashboardReceptionEmailMode('html')">HTML</button>
            </div>` : ""}
        </div>
        ${notification ? `
          <div class="rc-email__meta"><span>To</span><code>${escapeHtml(notification.recipient)}</code><span>Subject</span><strong>${escapeHtml(notification.subject)}</strong><span>Generated</span><code>${escapeHtml(formatDateTime(notification.created_at))}</code></div>
          ${receptionEmailMode === "html"
            ? `<iframe class="rc-email__frame" title="HTML email preview" sandbox="" srcdoc="${escapeHtml(notification.body_html || "")}"></iframe>`
            : `<pre class="rc-email__text">${escapeHtml(notification.body_text || "")}</pre>`}
        ` : ""}
      </div>

      <details class="rc-log">
        <summary>Technical log <small>${wtFmt(events.length)} event${events.length === 1 ? "" : "s"}</small></summary>
        <div class="rc-log__list">${events.length ? events.map((event) => `<div><time>${escapeHtml(formatDateTime(event.created_at))}</time><code>${escapeHtml(event.type)}</code><span>${escapeHtml(rcEventDetail(event.detail))}</span></div>`).join("") : `<p class="empty">Nothing logged.</p>`}</div>
      </details>
    </section>
  `;
}

function rcEventDetail(detail) {
  if (!detail || typeof detail !== "object") return "";
  return Object.entries(detail).filter(([, value]) => value !== "" && value !== null && value !== undefined).map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`).join(" · ");
}

function rcMessage(message) {
  const assistant = message.role === "assistant";
  return `<article class="rc-turn rc-turn--${assistant ? "assistant" : "caller"}"><span class="rc-turn__who">${assistant ? "Receptionist" : "Caller"}</span><p>${escapeHtml(message.body)}</p>${message.spoken_at ? `<time>${escapeHtml(formatDateTime(message.spoken_at))}</time>` : ""}</article>`;
}

// ---------------------------------------------------------------------------
// Test Call console
// ---------------------------------------------------------------------------

function rcConsole() {
  const config = receptionState?.config || {};
  const live = receptionLive;
  const active = Boolean(receptionLiveCall?.isActive);
  const phase = live.state?.phase || "idle";
  const finished = phase === "ended" || (phase === "error" && live.result);
  return `
    <section class="rc-console">
      <div class="rc-console__banner">
        <span class="rc-console__tag">Prototype / Browser Test</span>
        <div>
          <strong>No real telephone call takes place.</strong>
          <span>Your laptop microphone is connected live to the AI receptionist so you can rehearse an after-hours call. The call is transcribed, summarised and saved; the email notification is simulated and recorded, never sent.</span>
        </div>
      </div>
      ${config.openAi === false ? `
        <div class="wt-alert"><strong>OpenAI is not configured.</strong><span>Add the <code>OPENAI_API_KEY</code> secret to the Cloudflare Pages project before starting a test call.</span></div>` : ""}
      <div class="rc-console__grid">
        <div class="rc-stage" id="rc-stage" data-ai="${escapeHtml(live.state?.ai || "idle")}" data-phase="${escapeHtml(phase)}">
          <div class="rc-avatar" id="rc-avatar"><span class="rc-avatar__ring"></span><span class="rc-avatar__ring rc-avatar__ring--outer"></span><i>${RC_ICONS.phone}</i></div>
          <div class="rc-stage__state" id="rc-state-label">${escapeHtml(rcStateLabel())}</div>
          <div class="rc-timer" id="rc-timer" aria-label="Call timer">${escapeHtml(rcElapsed())}</div>
          <div class="rc-chips" id="rc-chips">${rcChips()}</div>
          <div class="rc-meter" id="rc-meter" aria-hidden="true">${Array.from({ length: 14 }, () => "<i></i>").join("")}</div>
          <div class="rc-controls" id="rc-controls">${rcControls()}</div>
          <p class="rc-stage__status" id="rc-status">${escapeHtml(live.state?.message || (config.openAi === false ? "Waiting for OpenAI configuration." : "Ready when you are."))}</p>
          <div class="rc-error" id="rc-error" ${live.error ? "" : "hidden"}>${escapeHtml(live.error)}</div>
        </div>
        <div class="rc-transcript">
          <div class="rc-transcript__head">
            <h4>Live transcript</h4>
            <p>${active ? "Both sides of the conversation appear here as they are spoken." : "The conversation will appear here once the call connects."}</p>
          </div>
          <div class="rc-stream rc-stream--live" id="rc-transcript-stream">${rcLiveTranscript()}</div>
          <div class="rc-notices" id="rc-notices">${rcNotices()}</div>
        </div>
      </div>
      ${finished ? rcResult() : ""}
      ${!active ? `
        <div class="rc-setup">
          <div class="rc-setup__fields">
            <label>
              <span>Simulated caller number <span class="rc-optional">optional</span></span>
              <input id="rc-caller-number" type="tel" inputmode="tel" placeholder="07700 900123" maxlength="32" autocomplete="off" data-dashboard-draft="reception-caller-number">
            </label>
            <label>
              <span>Voice</span>
              <select id="rc-voice" data-dashboard-draft="reception-voice">
                ${(config.voices || [config.voice || "ballad"]).map((voice) => `<option value="${escapeHtml(voice)}" ${voice === (receptionSetup.voice || config.voice || "ballad") ? "selected" : ""}>${escapeHtml(voice)}${voice === (config.voice || "ballad") ? " (default)" : ""}</option>`).join("")}
              </select>
            </label>
          </div>
          <p>A real phone line supplies the caller's number automatically. Enter one here to rehearse that: the receptionist will offer a callback "on this number" instead of asking for it. Leave it blank and the receptionist asks for a number when one is needed.</p>
          <p>Every voice is instructed to speak British English; ballad is the one most often described as British-sounding, so it is the default. Change it here before each call. The receptionist hangs up itself after its goodbye. Calls are limited to ${escapeHtml(String(Math.round((config.maxCallSeconds || 180) / 60)))} minutes; it is asked to wrap up shortly before, then cut off. Use headphones if you can: the laptop speakers can leak the receptionist's voice back into the microphone and confuse the transcript.</p>
          <p class="rc-setup__greeting"><strong>Greeting:</strong> “${escapeHtml(config.greeting || "Thanks for calling Fenster Glazing. Our office is currently closed…")}”</p>
        </div>` : ""}
    </section>
  `;
}

function rcStateLabel() {
  const state = receptionLive.state;
  if (!state) return "Ready";
  const labels = {
    idle: "Ready",
    requesting_mic: "Microphone",
    creating: "Setting up",
    connecting: "Connecting",
    ending: "Ending",
    processing: "Saving",
    ended: "Call ended",
    error: "Problem"
  };
  if (state.phase === "live") {
    return { listening: "Listening", thinking: "Thinking", speaking: "Speaking", idle: "Connected" }[state.ai] || "Connected";
  }
  return labels[state.phase] || state.phase;
}

function rcElapsed() {
  const connectedAt = receptionLiveCall?.connectedAt;
  if (!connectedAt) return "00:00";
  const end = receptionLiveCall?.endedAt ? new Date(receptionLiveCall.endedAt).getTime() : Date.now();
  const seconds = Math.max(0, Math.floor((end - new Date(connectedAt).getTime()) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function rcChips() {
  const state = receptionLive.state;
  const phase = state?.phase || "idle";
  const micLabel = phase === "requesting_mic" ? "Asking permission" : !state || ["idle", "ended", "error", "processing", "ending"].includes(phase) ? "Off" : state.muted ? "Muted" : "Live";
  const micClass = micLabel === "Live" ? "is-on" : micLabel === "Muted" ? "is-warn" : "";
  const connLabel = { idle: "Idle", requesting_mic: "Idle", creating: "Preparing", connecting: "Connecting", live: "Connected", ending: "Closing", processing: "Closed", ended: "Closed", error: "Error" }[phase] || phase;
  const connClass = phase === "live" ? "is-on" : phase === "error" ? "is-error" : ["connecting", "creating"].includes(phase) ? "is-warn" : "";
  const aiLabel = phase === "live" ? ({ listening: "Listening", thinking: "Thinking", speaking: "Speaking", idle: "Ready" }[state.ai] || "Ready") : "Idle";
  const aiClass = phase === "live" ? (state.ai === "speaking" ? "is-speaking" : state.ai === "listening" ? "is-on" : "is-warn") : "";
  return `
    <span class="rc-chip ${micClass}">${RC_ICONS.mic}<b>Microphone</b>${escapeHtml(micLabel)}</span>
    <span class="rc-chip ${connClass}"><b>Connection</b>${escapeHtml(connLabel)}</span>
    <span class="rc-chip ${aiClass}"><b>Receptionist</b>${escapeHtml(aiLabel)}</span>
    ${receptionLiveCall?.voice ? `<span class="rc-chip"><b>Voice</b>${escapeHtml(receptionLiveCall.voice)}</span>` : ""}
    ${receptionLiveCall?.callerNumber ? `<span class="rc-chip"><b>Caller ID</b>${escapeHtml(receptionLiveCall.callerNumber)}</span>` : ""}
  `;
}

function rcControls() {
  const state = receptionLive.state;
  const phase = state?.phase || "idle";
  const openAi = receptionState?.config?.openAi !== false;
  if (phase === "idle" || phase === "ended" || (phase === "error" && !receptionLiveCall?.isActive && !rcCanRetrySave())) {
    return `<button class="rc-button rc-button--start" onclick="window.dashboardReceptionStart()" ${openAi ? "" : "disabled"}>${RC_ICONS.phone}<span>${phase === "idle" ? "Start Test Call" : "Start another test call"}</span></button>`;
  }
  if (phase === "error" && rcCanRetrySave()) {
    return `
      <button class="rc-button rc-button--start" onclick="window.dashboardReceptionRetrySave()">Retry saving the call</button>
      <button class="rc-button rc-button--ghost" onclick="window.dashboardReceptionDiscard()">Discard</button>
    `;
  }
  if (phase === "processing" || phase === "ending") {
    return `<button class="rc-button rc-button--ghost" disabled><span class="rc-spinner"></span><span>${phase === "ending" ? "Ending…" : "Summarising and saving…"}</span></button>`;
  }
  if (phase === "live") {
    return `
      <button class="rc-button rc-button--ghost" onclick="window.dashboardReceptionMute()" aria-pressed="${state.muted ? "true" : "false"}">${RC_ICONS.mic}<span>${state.muted ? "Unmute" : "Mute"}</span></button>
      <button class="rc-button rc-button--end" onclick="window.dashboardReceptionEnd()">${RC_ICONS.end}<span>End Call</span></button>
    `;
  }
  // requesting_mic / creating / connecting
  return `<button class="rc-button rc-button--end" onclick="window.dashboardReceptionEnd()">${RC_ICONS.end}<span>Cancel</span></button>`;
}

function rcCanRetrySave() {
  return Boolean(receptionLiveCall && receptionLiveCall.phase === "error" && receptionLiveCall.endedAt && receptionLiveCall.callId);
}

function rcLiveTranscript() {
  // Caller turns are transcribed a moment after they are spoken; an empty
  // placeholder bubble in the meantime reads as a glitch, so a turn only
  // appears once it has words. Order is still the order the turns happened.
  const entries = receptionLive.transcript.filter((entry) => entry.body.trim());
  if (!entries.length) {
    return `<p class="empty rc-stream__empty">${receptionLiveCall?.isActive ? "Waiting for the first words…" : "Nothing yet."}</p>`;
  }
  return entries.map((entry) => `
    <article class="rc-turn rc-turn--${entry.role === "assistant" ? "assistant" : "caller"} ${entry.final ? "" : "is-streaming"} ${entry.partial ? "is-partial" : ""}">
      <span class="rc-turn__who">${entry.role === "assistant" ? "Receptionist" : "Caller"}${entry.partial ? " · interrupted" : ""}</span>
      <p>${escapeHtml(entry.body)}</p>
    </article>
  `).join("");
}

function rcNotices() {
  const notices = receptionLive.notices.slice(-4);
  return notices.map((notice) => `<div class="rc-notice">${escapeHtml(notice)}</div>`).join("");
}

function rcResult() {
  const result = receptionLive.result;
  const call = result?.call;
  if (!call) return "";
  const summaryOk = call.summary_status === "completed";
  return `
    <section class="rc-result">
      <div class="rc-result__head">
        <div>
          <span>${rcEndReasonLabel(call.end_reason)}</span>
          <h4>${escapeHtml(call.topic || (result.empty ? "No conversation" : "Call recorded"))}${call.caller_name ? ` · ${escapeHtml(call.caller_name)}` : ""}</h4>
          <p>${result.empty
            ? "The call ended before the caller said anything, so no summary or email was generated."
            : summaryOk
              ? `${escapeHtml(call.summary || "")} ${call.notification_status === "simulated" ? "A simulated email to the office has been recorded (nothing was sent)." : ""}`
              : `The transcript was saved, but the summary failed: ${escapeHtml(call.summary_error || "unknown error")}.`}</p>
        </div>
        <div class="rc-result__pills">${rcUrgencyPill(call)} ${rcNotificationPill(call)}</div>
      </div>
      ${summaryOk ? `
        <dl class="rc-facts rc-facts--inline">
          ${call.callback_number ? `<div><dt>Callback</dt><dd>${escapeHtml(call.callback_number)}</dd></div>` : ""}
          ${call.requested_person ? `<div><dt>For</dt><dd>${escapeHtml(call.requested_person)}</dd></div>` : ""}
          <div><dt>Action</dt><dd>${escapeHtml(call.action_required || "")}</dd></div>
          <div><dt>Duration</dt><dd>${escapeHtml(rcDuration(call.duration_seconds))}</dd></div>
        </dl>` : ""}
      <div class="actions">
        <button class="primary-button" onclick="window.dashboardReceptionOpenSaved('${escapeHtml(call.id)}')">Open call record and email preview</button>
      </div>
    </section>
  `;
}

function rcEndReasonLabel(reason = "") {
  if (reason.startsWith("assistant_hung_up")) return "Call saved · the receptionist hung up";
  if (reason === "time_limit") return "Call saved · time limit reached";
  if (reason === "connection_lost") return "Call saved · connection lost";
  return "Call saved";
}

// Pushes the current live state into the console without rebuilding it, so
// the transcript keeps scrolling and the input keeps its value.
function rcSyncConsole() {
  const stage = $("#rc-stage");
  if (!stage) return;
  const state = receptionLive.state;
  stage.dataset.ai = state?.ai || "idle";
  stage.dataset.phase = state?.phase || "idle";
  const label = $("#rc-state-label");
  if (label) label.textContent = rcStateLabel();
  const chips = $("#rc-chips");
  if (chips) chips.innerHTML = rcChips();
  const controls = $("#rc-controls");
  if (controls) controls.innerHTML = rcControls();
  const status = $("#rc-status");
  if (status && state?.message) status.textContent = state.message;
  const error = $("#rc-error");
  if (error) {
    error.textContent = receptionLive.error;
    error.hidden = !receptionLive.error;
  }
  const timer = $("#rc-timer");
  if (timer) timer.textContent = rcElapsed();
  rcSyncTranscript();
  const notices = $("#rc-notices");
  if (notices) notices.innerHTML = rcNotices();
  rcManageTimer();
}

function rcSyncTranscript() {
  const stream = $("#rc-transcript-stream");
  if (!stream) return;
  const pinned = stream.scrollHeight - stream.scrollTop - stream.clientHeight < 48;
  stream.innerHTML = rcLiveTranscript();
  if (pinned) stream.scrollTop = stream.scrollHeight;
}

function rcManageTimer() {
  const live = receptionLiveCall?.phase === "live";
  if (live && !receptionTimer) {
    receptionTimer = setInterval(() => {
      const timer = $("#rc-timer");
      if (timer) timer.textContent = rcElapsed();
    }, 500);
  }
  if (!live && receptionTimer) {
    clearInterval(receptionTimer);
    receptionTimer = null;
  }
}

function rcOnLevel(level) {
  const meter = $("#rc-meter");
  if (!meter) return;
  const bars = meter.children;
  const lit = Math.round(Math.min(1, level) * bars.length);
  for (let index = 0; index < bars.length; index += 1) {
    bars[index].classList.toggle("is-lit", index < lit);
  }
}

async function receptionStart() {
  if (receptionLiveCall?.isActive) {
    setReceptionStatus("A test call is already in progress in this tab.");
    return;
  }
  if (receptionState?.config?.openAi === false) {
    setReceptionStatus("OpenAI is not configured for this dashboard, so a test call cannot start.");
    return;
  }
  const callerNumber = ($("#rc-caller-number")?.value ?? receptionSetup.callerNumber).trim();
  const voice = $("#rc-voice")?.value || receptionSetup.voice || "";
  receptionSetup = { callerNumber, voice };
  receptionLive = freshReceptionLive();
  receptionDetail = null;
  const call = new BrowserTestCall({
    callerNumber,
    voice,
    api,
    onState: (state) => {
      receptionLive.state = state;
      rcSyncConsole();
    },
    onTranscript: (entries) => {
      receptionLive.transcript = entries;
      rcSyncTranscript();
    },
    onError: (message) => {
      receptionLive.error = message;
      rcSyncConsole();
    },
    onLevel: rcOnLevel,
    onNotice: (message) => {
      receptionLive.notices.push(message);
      const notices = $("#rc-notices");
      if (notices) notices.innerHTML = rcNotices();
    },
    // Fires for every way a call can end: the End Call button, the
    // receptionist hanging up, the time limit, a lost connection.
    onEnded: (result) => {
      receptionLive.result = result;
      renderReception();
      loadReception(true);
    }
  });
  receptionLiveCall = call;
  renderReception();
  try {
    await call.start();
  } catch {
    // The transport already reported the failure into receptionLive.error.
    rcSyncConsole();
  }
}

async function receptionEnd(reason = "caller_ended") {
  const call = receptionLiveCall;
  if (!call || !call.isActive) return;
  try {
    await call.end(reason);
  } catch {
    // onError and onEnded keep the console in step.
  }
}

function receptionMute() {
  const call = receptionLiveCall;
  if (!call || call.phase !== "live") return;
  call.setMuted(!call.muted);
}

async function receptionRetrySave() {
  const call = receptionLiveCall;
  if (!call) return;
  receptionLive.error = "";
  try {
    receptionLive.result = await call.retrySave();
  } catch {
    // onError has already updated the console.
  }
  renderReception();
  loadReception(true);
}

function receptionDiscard() {
  receptionLiveCall = null;
  receptionLive = freshReceptionLive();
  renderReception();
}

async function receptionOpenSaved(id) {
  receptionLiveCall = null;
  receptionLive = freshReceptionLive();
  receptionView = "calls";
  await loadReception(true);
  await openReceptionCall(id);
}

// A closed tab must not leave a call row open forever; the transport uses a
// keepalive request so the finalisation survives the page going away.
window.addEventListener("pagehide", () => {
  if (receptionLiveCall?.isActive) receptionLiveCall.end("page_closed");
});

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
window.dashboardWebsitePeriod = setWebsitePeriod;
window.dashboardToolsTab = setToolsTab;
window.dashboardWebsiteView = setWebsiteView;
window.dashboardWebsiteVisitor = openWebsiteVisitor;
window.dashboardWebsiteCloseVisitor = closeWebsiteVisitor;
window.dashboardWebsiteChat = openWebsiteChat;
window.dashboardWebsiteOutcome = setWebsiteOutcome;
window.dashboardReceptionView = setReceptionView;
window.dashboardReceptionRefresh = () => loadReception();
window.dashboardReceptionOpen = openReceptionCall;
window.dashboardReceptionClose = closeReceptionCall;
window.dashboardReceptionEmailMode = setReceptionEmailMode;
window.dashboardReceptionDelete = deleteReceptionCall;
window.dashboardReceptionResummarise = resummariseReceptionCall;
window.dashboardReceptionStart = receptionStart;
window.dashboardReceptionEnd = () => receptionEnd("caller_ended");
window.dashboardReceptionMute = receptionMute;
window.dashboardReceptionRetrySave = receptionRetrySave;
window.dashboardReceptionDiscard = receptionDiscard;
window.dashboardReceptionOpenSaved = receptionOpenSaved;
