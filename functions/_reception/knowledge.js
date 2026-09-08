/*
 * Curated, owner-confirmed Fenster knowledge for the AI receptionist.
 *
 * Every fact here is taken from the verified sources in the Fenster website
 * repository (LIVECHAT.md "Verified Fenster Facts", the Legend backend's
 * VERIFIED_BUSINESS_FACTS block, inc/site-data.php brand data, the published
 * Meet the Team page and AI.md owner rulings). Nothing is invented. If a fact
 * is not here, the receptionist is told to say it does not have that
 * information and offer to take a message.
 *
 * `searchFensterKnowledge(query)` is the retrieval boundary. V1 scores this
 * in-memory list; a later version can search a wider index (site pages, price
 * guides, CRM) behind the same function without changing the receptionist.
 */

export const FENSTER_CONTACT = {
  name: "Fenster Glazing",
  phone: "01908 429200",
  email: "info@fensterglazing.com",
  commercialEmail: "commercial@fensterglazing.com",
  address: "98 Alston Drive, Bradwell Abbey, Milton Keynes, Buckinghamshire MK13 9HF",
  website: "fensterglazing.com",
  instantPricingUrl: "https://fensterglazing.com/instant-pricing/",
  officeHours: "Monday to Friday, 8.30am to 5pm",
  closedDays: "Saturday and Sunday"
};

// Published team roster (Meet the Team page and About page, September 2026).
// Names and roles only. No direct numbers or emails exist for individuals in
// the verified sources, so the receptionist never offers to transfer or share
// a direct line.
export const FENSTER_TEAM = [
  { name: "Adam Butcher", role: "Commercial Director", note: "Co-founder. Runs the commercial side: schools, care homes, curtain walling and larger projects.", aliases: ["adam"] },
  { name: "Nick Baker", role: "Sales Director", note: "Co-founder. Runs sales and the Milton Keynes showroom.", aliases: ["nick", "nick baker"] },
  { name: "Perry Giffin", role: "Office Manager", note: "Keeps enquiries, customer service and day-to-day project communication moving.", aliases: ["perry"] },
  { name: "Kerry Lince", role: "Administrator", note: "Supports day-to-day office operations.", aliases: ["kerry"] },
  { name: "Zac Bartley", role: "Marketing Executive", note: "Website, digital advertising, social media, content and brand.", aliases: ["zac", "zach", "zack"] },
  { name: "David Foord", role: "Installation Manager", note: "Oversees installations.", aliases: ["david", "dave"] },
  { name: "Paul Taylor", role: "Project Manager", note: "Project management across residential and commercial work.", aliases: ["paul"] },
  { name: "Gintare Vanagaite", role: "Estimator", note: "Pricing and quotations from early pricing through to the quotation stage.", aliases: ["gintare"] },
  { name: "Steve Freezer", role: "Technical Advisor", note: "Commercial team. Client specifications and technical requirements.", aliases: ["steve", "steve freezer"] },
  { name: "Tom Carter", role: "Installer", note: "", aliases: ["tom"] },
  { name: "Johnnie Greenwell", role: "Installer", note: "", aliases: ["johnnie", "johnny"] },
  { name: "Zac Rugman", role: "Installer", note: "", aliases: ["zac rugman"] },
  { name: "Shane Gowing", role: "Installer", note: "", aliases: ["shane"] },
  { name: "Aaron Isaacs", role: "Installer", note: "", aliases: ["aaron"] },
  { name: "Andy McCullagh", role: "Service Engineer", note: "Repairs, adjustments and ongoing maintenance.", aliases: ["andy"] },
  { name: "Steven Welch", role: "Service Engineer", note: "Repairs, maintenance and aftercare.", aliases: ["steven", "steven welch"] }
];

// Each entry is one answerable topic. `keywords` drive retrieval; `answer` is
// the verified fact in plain English suitable for reading aloud.
export const FENSTER_KNOWLEDGE = [
  {
    id: "hours",
    topic: "Opening hours",
    keywords: ["open", "opening", "hours", "close", "closed", "closing", "time", "tomorrow", "weekend", "saturday", "sunday", "monday", "office", "showroom", "when"],
    answer: "The office and showroom are open Monday to Friday, 8.30am to 5pm, and closed on Saturday and Sunday. Phone lines are answered 24/7, which is why this automated assistant is taking calls out of hours."
  },
  {
    id: "location",
    topic: "Showroom and office address",
    keywords: ["address", "where", "located", "location", "showroom", "visit", "find", "directions", "postcode", "milton keynes", "bradwell"],
    answer: "Fenster's showroom and office are at 98 Alston Drive, Bradwell Abbey, Milton Keynes, MK13 9HF. Full product samples are at the showroom; visiting hours are Monday to Friday, 8.30am to 5pm."
  },
  {
    id: "contact",
    topic: "Contact details",
    keywords: ["email", "phone", "number", "contact", "website", "commercial email"],
    answer: "The office number is 01908 429200 and the general email is info@fensterglazing.com. Commercial enquiries can also use commercial@fensterglazing.com. The website is fensterglazing.com."
  },
  {
    id: "coverage-residential",
    topic: "Areas covered for homes",
    keywords: ["area", "areas", "cover", "coverage", "work in", "come to", "travel", "bedford", "bedfordshire", "buckinghamshire", "bucks", "northampton", "northamptonshire", "hertfordshire", "herts", "milton keynes", "luton", "aylesbury", "leighton buzzard", "ampthill", "toddington", "dunstable", "newport pagnell", "bletchley", "wolverton", "olney", "towcester", "buckingham", "stevenage", "hitchin", "st albans", "hemel"],
    answer: "For homes, Fenster covers Milton Keynes, Buckinghamshire, Bedfordshire, Northamptonshire and Hertfordshire. Bedford, Northampton, Aylesbury, Leighton Buzzard and Luton all sit inside that area."
  },
  {
    id: "coverage-commercial",
    topic: "Areas covered for commercial work",
    keywords: ["commercial", "nationwide", "business", "school", "care home", "office building", "shop", "curtain walling", "england", "wales", "contract"],
    answer: "Commercial projects are covered nationwide across England and Wales. Commercial work includes commercial glazing, curtain walling, louvre vents and automation, handled by Adam Butcher's commercial team."
  },
  {
    id: "products",
    topic: "Products Fenster supplies and installs",
    // Catch-all. Low priority so a specific product entry wins when it matches.
    priority: 0.4,
    keywords: ["product", "products", "fit", "sell", "supply", "install", "range", "windows", "doors", "casement", "flush casement", "sash", "sliding sash", "french casement", "tilt and turn", "tilt turn", "bow", "bay", "aluminium", "heritage", "composite", "upvc", "bifold", "bi-fold", "bi fold", "slide and fold", "patio", "sliding door", "french doors", "roof lantern", "lantern", "roofline", "fascia", "soffit", "guttering", "integral blinds", "blinds", "replacement glass", "secondary glazing", "cat flap", "dog flap", "pet flap", "repair", "repairs", "conservatory", "porch", "skylight", "rooflight"],
    answer: "Windows: casement, flush casement, sliding sash, French casement, tilt and turn, bow and bay, aluminium and aluminium flush windows, and heritage windows. Doors: composite doors, uPVC doors, aluminium entrance doors, aluminium bifold doors, slide and fold doors, patio and sliding doors, French doors and heritage aluminium doors. Also roof lanterns, roofline (fascias and soffits), integral blinds, replacement double glazing, secondary glazing, cat and dog flaps, and window and door repairs. Commercial: commercial glazing, curtain walling, louvre vents and automation."
  },
  {
    id: "bifold",
    topic: "Aluminium bifold doors",
    keywords: ["bifold", "bi-fold", "bi fold", "bifolds", "folding doors", "slide and fold"],
    answer: "Yes. Fenster supplies and installs aluminium bifold doors, as well as slide and fold doors and aluminium sliding doors. Exact sizes, configurations and prices come from the instant pricing tool on the website or a free home consultation."
  },
  {
    id: "composite-doors",
    topic: "Composite doors",
    keywords: ["composite", "front door", "entrance door", "back door", "distinction", "security guarantee", "5000", "5,000"],
    answer: "Yes. Fenster currently offers Distinction composite doors, and every composite door currently offered includes the published five thousand pound security guarantee. A price for a specific door comes from the instant pricing tool on the website or a consultation, not from this call."
  },
  {
    id: "guarantee",
    topic: "Guarantee and insurance backing",
    keywords: ["guarantee", "guarantees", "warranty", "warranties", "warrantee", "insurance", "insurance backed", "cpa", "consumer protection", "ten year", "10 year", "how long", "transfer", "transferable", "new owner", "sold house", "moving"],
    answer: "Every new window and door installation comes with a ten year insurance-backed guarantee through the Consumer Protection Association. Fenster handles covered issues while trading, and the CPA insurance backs the guarantee if Fenster ever permanently stopped trading, subject to the policy terms. Repairs, replacement glass, roofline, integral blinds and pet flaps are not automatically included in that insurance-backed guarantee. Guarantees are not transferable to a new homeowner. Whether a specific issue is covered is decided by the office, not by this assistant."
  },
  {
    id: "fensa",
    topic: "FENSA registration",
    keywords: ["fensa", "certificate", "building regulations", "registration", "compliance"],
    answer: "For eligible domestic replacement windows and doors, Fenster applies for FENSA registration after installation and FENSA sends the certificate directly to the customer."
  },
  {
    id: "glazing",
    topic: "Double and triple glazing",
    keywords: ["double glazing", "triple glazing", "triple", "double", "glazed", "glass", "u-value", "u value", "energy", "thermal", "noise", "acoustic"],
    answer: "Double glazing is standard. Triple glazing is a specification option on most new windows and doors, except uPVC flush casement windows, slide and fold doors and sash windows. Heritage windows and heritage aluminium doors are double glazed as standard; triple is possible on request with a different sash, which is something to raise with the team rather than a normal option. Exact energy ratings and U-values depend on the product, size and configuration, so the office confirms those."
  },
  {
    id: "consultation",
    topic: "Free home consultation",
    keywords: ["consultation", "consult", "appointment", "visit", "survey", "surveyor", "come out", "come round", "measure", "measure up", "quote visit", "home visit", "book", "booking", "free", "obligation", "salesperson", "sales visit"],
    answer: "Consultations are free and low pressure, and usually take an hour at most. A window and door expert visits, goes through the options, and prices the job on an iPad using the same price list as the online quote tool, so the figure matches. Any sizes taken are rough, just enough to price the job; the proper measurements are the technical survey later. Fenster does not negotiate on price. This assistant cannot book a date itself, but it can take a consultation request as a message and the team will confirm a date and time by phone or email when the office reopens."
  },
  {
    id: "after-consultation",
    topic: "What happens after a consultation",
    keywords: ["deposit", "contract", "quote valid", "hold", "30 days", "how long is the quote", "next step", "after", "order", "go ahead", "lead time", "installation date", "when can you fit"],
    answer: "If the customer does not decide on the day, Fenster sends the quote over and it normally holds for 30 days. If they go ahead, Fenster sends a contract and a deposit request, typically fifty percent, and a full technical survey follows before anything is made. Installation dates and lead times are confirmed by the office, not by this assistant."
  },
  {
    id: "pricing",
    topic: "Prices and quotes",
    keywords: ["price", "prices", "pricing", "cost", "costs", "how much", "quote", "quotation", "estimate", "ballpark", "rough idea", "cheap", "expensive", "instant pricing", "instant quote", "online quote", "finance", "payment", "pay"],
    answer: "This assistant cannot give prices or estimates. Customers can get an instant price online using the Instant Pricing tool at fensterglazing.com, or book a free home consultation where the job is priced on the day. The price is the price: Fenster does not negotiate."
  },
  {
    id: "pet-flaps",
    topic: "Cat and dog flaps",
    keywords: ["cat flap", "dog flap", "pet flap", "microchip", "sureflap", "flap"],
    answer: "Yes. Fenster fits cat and dog flaps, either a standard flap that locks by hand or a microchip flap that opens only for a registered pet. The flap goes into a new sealed glass unit made to order with the aperture in it, or into a door panel that Fenster cuts. Both work on existing doors and windows as well as new ones. Fenster is an approved SureFlap installer and fits other makes too. Glass takes roughly a week or two from survey; a panel is quicker."
  },
  {
    id: "integral-blinds",
    topic: "Integral blinds",
    keywords: ["integral blinds", "blinds", "blinds inside glass", "integrated blinds", "magnetic", "electric blinds"],
    answer: "Integral blinds are available with magnetic or electric controls and have a ten year guarantee."
  },
  {
    id: "colours",
    topic: "Colours and finishes",
    keywords: ["colour", "colours", "color", "foil", "foiled", "woodgrain", "anthracite", "grey", "black", "white", "dual colour", "inside", "outside", "finish", "ral", "powder coat"],
    answer: "uPVC frames are foiled on each face separately, so the inside does not have to match the outside, and a house can be specified differently room by room. White internally is the cheaper option and a foiled internal face costs more; colour choices are never free. Aluminium products are powder coated. Colour swatches come to a consultation and full samples are at the showroom."
  },
  {
    id: "repairs",
    topic: "Repairs and aftercare",
    keywords: ["repair", "repairs", "broken", "misted", "misty", "condensation", "handle", "hinge", "lock", "locked out", "won't close", "wont close", "won't open", "draught", "draughty", "leak", "leaking", "service", "aftercare", "engineer", "existing"],
    answer: "Fenster has service engineers who handle repairs, adjustments and maintenance on windows and doors, including for customers whose windows were fitted by someone else. A repair or fault cannot be diagnosed over this call; the best next step is to leave the details so the office can arrange a service visit. Whether a fault is covered by a guarantee is decided by the office."
  },
  {
    id: "trust",
    topic: "Why Fenster",
    keywords: ["reviews", "trust", "reputation", "how long trading", "established", "founded", "2018", "who are you", "company", "installers", "subcontract", "in-house", "accredited", "trustpilot", "google"],
    answer: "Fenster started in 2018 and is based in Milton Keynes. Everyone who surveys, fits and answers the phone works for Fenster; installers are in-house rather than subcontracted. Fenster is FENSA approved, has completed over a thousand installations and has hundreds of five-star reviews. Adam Butcher and Nick Baker founded the company and are still there every day."
  },
  {
    id: "team",
    topic: "The Fenster team",
    priority: 0.7,
    keywords: ["team", "staff", "who works", "speak to", "talk to", "manager", "director", "owner", "boss", "salesman", "sales", "office manager", "installer", "fitter", "engineer", ...FENSTER_TEAM.flatMap((person) => person.aliases)],
    answer: FENSTER_TEAM.map((person) => `${person.name}, ${person.role}${person.note ? ` (${person.note})` : ""}`).join("; ") + ". Legend is the office cat."
  },
  {
    id: "planning",
    topic: "Planning permission and conservation areas",
    keywords: ["planning", "planning permission", "conservation", "conservation area", "listed", "listed building", "article 4", "council"],
    answer: "Some window and door changes, particularly in conservation areas or on listed buildings, can need planning permission. Fenster can help with that process as part of a job, but whether permission is needed for a specific property is not something this assistant can decide. It is a good question to leave for the team."
  }
];

const STOP_WORDS = new Set([
  "a", "about", "also", "am", "an", "and", "any", "are", "as", "at", "be", "can", "could", "did", "do", "does", "for",
  "from", "get", "got", "had", "has", "have", "hi", "hello", "how", "i", "if", "in", "is", "it", "its", "just", "me", "my",
  "of", "on", "or", "our", "please", "so", "some", "tell", "that", "the", "their", "them", "there", "they", "this", "to",
  "us", "want", "was", "we", "what", "when", "where", "which", "who", "why", "will", "with", "would", "you", "your", "yours"
]);

export function normaliseQuery(query) {
  return String(query || "")
    .toLowerCase()
    .replace(/warrent(y|ies)|warrant(y|ies|ee)|guarant(y|ies|ee)/g, " guarantee warranty ")
    .replace(/bi-?\s?fold/g, " bifold ")
    .replace(/[^a-z0-9£&' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function queryTerms(query) {
  return [...new Set(normaliseQuery(query).split(" ").filter((token) => token.length >= 2 && !STOP_WORDS.has(token)))];
}

/*
 * Retrieval boundary for the receptionist. Returns the best matching verified
 * entries, highest score first. Empty when nothing is relevant, in which case
 * the receptionist is expected to say so and offer to take a message.
 */
export function searchFensterKnowledge(query, { limit = 3 } = {}) {
  const text = normaliseQuery(query);
  if (!text) return [];
  const padded = ` ${text} `;
  const terms = queryTerms(text);

  const scored = FENSTER_KNOWLEDGE.map((entry) => {
    let score = 0;
    for (const keyword of entry.keywords) {
      const key = normaliseQuery(keyword);
      if (!key) continue;
      if (padded.includes(` ${key} `)) {
        // Multi-word keywords are more specific, so they outrank single tokens.
        score += 6 + key.split(" ").length * 4;
      } else if (key.split(" ").length === 1 && terms.some((term) => term.length >= 4 && (term.startsWith(key) || key.startsWith(term)))) {
        score += 2;
      }
    }
    const topic = normaliseQuery(entry.topic);
    for (const term of terms) {
      if (topic.includes(term)) score += 3;
    }
    score *= entry.priority ?? 1;
    return { entry, score };
  }).filter((item) => item.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.max(1, limit)).map(({ entry, score }) => ({
    id: entry.id,
    topic: entry.topic,
    answer: entry.answer,
    score
  }));
}

export function findTeamMember(name) {
  const wanted = normaliseQuery(name);
  if (!wanted) return null;
  return FENSTER_TEAM.find((person) =>
    normaliseQuery(person.name) === wanted || person.aliases.some((alias) => normaliseQuery(alias) === wanted)
  ) || null;
}

/*
 * The compact fact block embedded in the receptionist's instructions. It is the
 * same verified material as the searchable entries, just condensed so the voice
 * model can answer the common questions without a tool round-trip.
 */
export function knowledgeForPrompt() {
  return FENSTER_KNOWLEDGE.map((entry) => `- ${entry.topic}: ${entry.answer}`).join("\n");
}

export function teamForPrompt() {
  return FENSTER_TEAM.map((person) => `- ${person.name}, ${person.role}${person.note ? `. ${person.note}` : ""}`).join("\n");
}
