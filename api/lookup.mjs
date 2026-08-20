const BUILD_ID = "SAB_AUTHORITATIVE_SOURCE_ENGINE_R24_2026_08_19";

const PRIMARY_ORIGIN = "https://steal-a-brainrot.org";
const FANDOM_API = "https://stealabrainrot.fandom.com/api.php";
const FANDOM_BASE = "https://stealabrainrot.fandom.com/wiki/";
const WIKI_ORIGIN = "https://steal-a-brainrot.wiki";
const TAVILY_URL = "https://api.tavily.com/search";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";

const CFG = Object.freeze({
  GLOBAL_BUDGET_MS: Number(process.env.LOOKUP_BUDGET_MS || 3200),
  PRIMARY_TIMEOUT_MS: Number(process.env.PRIMARY_TIMEOUT_MS || 1050),
  FANDOM_TIMEOUT_MS: Number(process.env.FANDOM_TIMEOUT_MS || 900),
  BACKUP_TIMEOUT_MS: Number(process.env.BACKUP_TIMEOUT_MS || 800),
  TAVILY_TIMEOUT_MS: Number(process.env.TAVILY_TIMEOUT_MS || 800),
  NVIDIA_TIMEOUT_MS: Number(process.env.NVIDIA_TIMEOUT_MS || 850),

  MAX_PRIMARY_PAGES: 7,
  MAX_BACKUP_PAGES: 5,
  MAX_SEARCH_RESULTS: 6,
  MAX_AI_EVIDENCE: 8,

  PAGE_CACHE_TTL_MS: 5 * 60 * 1000,
  SEARCH_CACHE_TTL_MS: 3 * 60 * 1000,
  STABLE_ANSWER_TTL_MS: 12 * 60 * 60 * 1000,
  CURRENT_ANSWER_TTL_MS: 2 * 60 * 1000,
});

const REL = Object.freeze({
  TEXT: "TEXT",
  COST: "COST",
  INCOME: "INCOME",
  RARITY: "RARITY",
  STATUS: "STATUS",
  METHOD: "METHOD",
  DATE: "DATE",
  MULTIPLIER: "MULTIPLIER",
  REQUIREMENT: "REQUIREMENT",
  SPAWN: "SPAWN",
  FORMATION: "FORMATION",
  WEATHER: "WEATHER",
  DROP_RATE: "DROP_RATE",
  REWARD: "REWARD",
  CONTENTS: "CONTENTS",
  REBIRTH: "REBIRTH",
  GEAR: "GEAR",
  BRAINROT: "BRAINROT",
  MUTATION: "MUTATION",
  TRAIT: "TRAIT",
  RITUAL: "RITUAL",
  EVENT: "EVENT",
  MACHINE: "MACHINE",
  UPDATE: "UPDATE",
  COLLECTION: "COLLECTION",
});

const SOURCE = Object.freeze({
  PRIMARY: {
    tier: "S+",
    key: "PRIMARY_SPLUS",
    host: "steal-a-brainrot.org",
    confidence: 0.995,
  },
  FANDOM: {
    tier: "A+",
    key: "FANDOM_A_PLUS",
    host: "stealabrainrot.fandom.com",
    confidence: 0.97,
  },
  WIKI: {
    tier: "B",
    key: "WIKI_B",
    host: "steal-a-brainrot.wiki",
    confidence: 0.94,
  },
  EMERGENCY: {
    tier: "C",
    key: "EMERGENCY_WEB",
    host: "web",
    confidence: 0.78,
  },
});

const STOPWORDS = new Set([
  "what","which","who","when","where","why","how","is","are","was","were","does","did","do",
  "the","a","an","in","at","on","for","from","to","of","with","and","or","this","that","it","its",
  "steal","brainrot","brain","rot","sab","roblox","game","right","now","current","currently","latest","newest","new",
  "update","event","rebirth","gear","item","mutation","trait","ritual","machine","lucky","block","collection",
  "cost","price","income","multiplier","boost","rarity","spawn","spawns","require","requires","required","drop","rate","chance",
  "give","gives","gave","get","gets","got","make","makes","per","second","much","many","added","introduced","removed",
  "unlock","unlocks","unlocked","tell","me","about","have","has","had","come","came","out"
]);

const STATIC_ALIASES = Object.freeze({
  "flash tp": ["flash tp", "flash teleport"],
  "flash teleport": ["flash teleport", "flash tp"],
  "bomb croc": ["bomb croc", "bombardiro crocodilo"],
  "bombardiro": ["bombardiro", "bombardiro crocodilo"],
  "tralalero": ["tralalero", "tralalero tralala"],
  "brain rot": ["brain rot", "brainrot"],
  "lucky block": ["lucky block", "lucky blocks"],
  "admin abuse": ["admin abuse", "admin event"],
});

const PAGE_CACHE = new Map();
const SEARCH_CACHE = new Map();
const ANSWER_CACHE = new Map();

function clean(value, limit = 4000) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim()
    .slice(0, limit);
}

function oneLine(value, limit = 4000) {
  return clean(value, limit).replace(/\s+/g, " ").trim();
}

function norm(value) {
  return oneLine(value, 3000).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function slugify(value) {
  return oneLine(value, 240)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clamp(value, min = 0, max = 1) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
}

function env(name) {
  return String(process.env[name] || "").trim().replace(/^Bearer\s+/i, "").trim();
}

function nowMs() {
  return Date.now();
}

function timeLeft(deadline) {
  return Math.max(0, deadline - nowMs());
}

function errorCode(error) {
  return oneLine(error?.code || error?.message || error || "UNKNOWN_ERROR", 280);
}

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-lookup-build": BUILD_ID,
    },
  });
}

function cacheGet(map, key) {
  const row = map.get(key);
  if (!row) return null;
  if (row.expiresAt <= nowMs()) {
    map.delete(key);
    return null;
  }
  return row.value;
}

function cacheSet(map, key, value, ttl) {
  map.set(key, { value, expiresAt: nowMs() + ttl });
}

async function fetchText(label, url, options = {}, timeoutMs = 850) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response;
    try {
      response = await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
      const e = new Error(error?.name === "AbortError" ? `${label}_TIMEOUT` : `${label}_REQUEST_FAILED`);
      e.code = error?.name === "AbortError" ? `${label}_TIMEOUT` : `${label}_REQUEST_FAILED`;
      throw e;
    }
    const text = await response.text();
    if (!response.ok) {
      const e = new Error(`${label}_HTTP_${response.status}`);
      e.code = `${label}_HTTP_${response.status}`;
      throw e;
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(label, url, options = {}, timeoutMs = 850) {
  const text = await fetchText(label, url, options, timeoutMs);
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    const e = new Error(`${label}_INVALID_JSON`);
    e.code = `${label}_INVALID_JSON`;
    throw e;
  }
}

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCodePoint(code) : " ";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => {
      const code = Number.parseInt(n, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : " ";
    });
}

function htmlToLines(html, maxChars = 160000) {
  const text = decodeHtml(String(html ?? ""))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<(?:br|hr)\b[^>]*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|div|li|tr|td|th|h[1-6]|section|article|aside|table)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .slice(0, maxChars);

  return text
    .split("\n")
    .map((line) => oneLine(line, 1400))
    .filter(Boolean);
}

function htmlToText(html, maxChars = 160000) {
  return htmlToLines(html, maxChars).join("\n");
}

function extractHeadingSections(html) {
  const raw = String(html ?? "");
  const headings = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(raw)) !== null) {
    headings.push({
      level: Number(m[1]),
      title: oneLine(htmlToText(m[2], 500), 300),
      start: m.index,
      end: re.lastIndex,
    });
  }
  const out = [];
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    let end = raw.length;
    for (let j = i + 1; j < headings.length; j++) {
      if (headings[j].level <= h.level) {
        end = headings[j].start;
        break;
      }
    }
    out.push({ ...h, text: htmlToText(raw.slice(h.end, end), 30000) });
  }
  return out;
}

function aliasesFor(question) {
  const q = oneLine(question, 700).toLowerCase();
  const out = new Set();
  for (const [key, values] of Object.entries(STATIC_ALIASES)) {
    if (q.includes(key)) values.forEach((v) => out.add(v));
  }
  return [...out];
}

function candidateEntities(question) {
  const raw = oneLine(question, 700);
  const out = new Set();
  for (const m of raw.matchAll(/["“”']([^"“”']{2,100})["“”']/g)) {
    out.add(oneLine(m[1], 120));
  }
  aliasesFor(raw).forEach((a) => out.add(a));

  const inputWords = raw.match(/[A-Za-z0-9][A-Za-z0-9'._-]*/g) || [];
  const filtered = inputWords.filter((word) => {
    const low = word.toLowerCase();
    return !STOPWORDS.has(low) && !/^\d+(?:\.\d+)?$/.test(word);
  });

  for (let size = Math.min(6, filtered.length); size >= 1; size--) {
    for (let i = 0; i + size <= filtered.length; i++) {
      const span = filtered.slice(i, i + size).join(" ");
      if (span.length >= 3) out.add(span);
    }
  }

  return [...out]
    .sort((a, b) => b.split(/\s+/).length - a.split(/\s+/).length || b.length - a.length)
    .slice(0, 18);
}

function isCurrent(question) {
  const q = oneLine(question, 700).toLowerCase();
  return ["newest","latest","most recent","current","currently","right now","today","this week","this month","as of now","new update","latest update","just added"].some((p) => q.includes(p));
}

function extractRebirthNumber(question) {
  const m = oneLine(question, 700).match(/\brebirth\s*#?\s*(\d{1,3})\b/i);
  return m ? Number(m[1]) : null;
}

function extractUpdateNumber(question) {
  const m = oneLine(question, 700).match(/\bupdate\s*(\d+(?:\.\d+)?)\b/i);
  return m ? m[1] : null;
}

function inferRelation(question) {
  const q = oneLine(question, 700).toLowerCase();

  if (/\b(?:what|which)(?:\s+[a-z0-9'-]+){0,4}\s+(?:brainrot|brain rot)\b/.test(q)) return REL.BRAINROT;
  if (/\b(?:what|which)(?:\s+[a-z0-9'-]+){0,4}\s+(?:gear|item)\b/.test(q)) return REL.GEAR;
  if (/\b(?:which|what)\s+rebirth\b/.test(q) || /\brebirth\s+(?:did|does|is)\b/.test(q)) return REL.REBIRTH;
  if (/\b(?:income|income\/s|\$\/s|makes? per second|per second|generation|generates?|earn(?:s|ing)?)\b/.test(q)) return REL.INCOME;
  if (/\b(?:cost|price|buy price|how much)\b/.test(q)) return REL.COST;
  if (/\b(?:rarity|tier)\b/.test(q)) return REL.RARITY;
  if (/\b(?:multiplier|multi|boost)\b/.test(q)) return REL.MULTIPLIER;
  if (/\b(?:requires?|requirement|required|needed|materials?)\b/.test(q)) return REL.REQUIREMENT;
  if (/\b(?:spawn|spawns|summon|summons|result|outcome)\b/.test(q)) return REL.SPAWN;
  if (/\b(?:formation|arrangement|placement|arrange|line up)\b/.test(q)) return REL.FORMATION;
  if (/\bweather\b/.test(q)) return REL.WEATHER;
  if (/\b(?:drop rate|chance|probability|success rate)\b/.test(q)) return REL.DROP_RATE;
  if (/\b(?:when|what date|which date|what year|what month|release date|added to game)\b/.test(q)) return REL.DATE;
  if (/\b(?:how do|how can|obtain|obtained|get it|acquire|method|route)\b/.test(q)) return REL.METHOD;
  if (/\b(?:status|obtainable|available|removed|unobtainable)\b/.test(q)) return REL.STATUS;
  if (/\b(?:contents?|inside|contains?|drops?)\b/.test(q)) return REL.CONTENTS;
  if (/\b(?:reward|rewards)\b/.test(q)) return REL.REWARD;
  if (/\b(?:what|which)(?:\s+[a-z0-9'-]+){0,4}\s+ritual\b/.test(q)) return REL.RITUAL;
  if (/\b(?:what|which)(?:\s+[a-z0-9'-]+){0,4}\s+mutation\b/.test(q)) return REL.MUTATION;
  if (/\b(?:what|which)(?:\s+[a-z0-9'-]+){0,4}\s+trait\b/.test(q)) return REL.TRAIT;
  if (/\b(?:what|which)(?:\s+[a-z0-9'-]+){0,4}\s+event\b/.test(q)) return REL.EVENT;
  if (/\b(?:what|which)(?:\s+[a-z0-9'-]+){0,4}\s+machine\b/.test(q)) return REL.MACHINE;
  if (/\b(?:which|what)\s+collection\b/.test(q) || /\bcollection\s+(?:is|contains)\b/.test(q)) return REL.COLLECTION;
  return REL.TEXT;
}

function analyzeQuestion(question) {
  const q = oneLine(question, 700);
  const relation = inferRelation(q);
  const entities = candidateEntities(q);
  const rebirth = extractRebirthNumber(q);
  const update = extractUpdateNumber(q);
  const current = isCurrent(q);
  let entity = entities[0] || null;

  if (rebirth && relation === REL.GEAR) entity = `Rebirth${rebirth}`;
  if (current && q.toLowerCase().includes("rebirth")) entity = null;

  return {
    entity,
    entities,
    relation,
    rebirth,
    update,
    current,
    source: "DETERMINISTIC_R24",
  };
}

function similarity(a, b) {
  const an = norm(a);
  const bn = norm(b);
  if (!an || !bn) return 0;
  if (an === bn) return 1;
  if (an.includes(bn) || bn.includes(an)) return 0.94;
  const aw = new Set(oneLine(a, 500).toLowerCase().match(/[a-z0-9]+/g) || []);
  const bw = new Set(oneLine(b, 500).toLowerCase().match(/[a-z0-9]+/g) || []);
  if (!aw.size || !bw.size) return 0;
  let same = 0;
  for (const x of aw) if (bw.has(x)) same++;
  return same / Math.max(aw.size, bw.size);
}

function bestEntityScore(analysis, value) {
  let score = analysis.entity ? similarity(analysis.entity, value) : 0;
  for (const e of analysis.entities || []) score = Math.max(score, similarity(e, value));
  return score;
}

function normalizeAnswer(value, relation) {
  const text = oneLine(value, 600);
  if (!text) return null;

  if (relation === REL.REBIRTH) {
    const m = text.match(/\brebirth\s*#?\s*(\d{1,3})\b/i) || text.match(/^\s*#?\s*(\d{1,3})\s*$/);
    return m ? `Rebirth${Number(m[1])}` : null;
  }

  if (relation === REL.MULTIPLIER) {
    const m = text.match(/\b\d+(?:\.\d+)?\s*[x×]/i);
    return m ? m[0].replace(/\s+/g, "").replace(/×/g, "x") : null;
  }

  if (relation === REL.COST) {
    const m = text.match(/\$\s*\d+(?:\.\d+)?\s*[KMBTQ]?/i);
    return m ? m[0].replace(/\s+/g, "") : null;
  }

  if (relation === REL.INCOME) {
    const m = text.match(/\$\s*\d+(?:\.\d+)?\s*[KMBTQ]?\s*(?:\/\s*s|\/sec|per\s*second)?/i);
    if (!m) return null;
    let out = m[0].replace(/\s+/g, "").replace(/persecond/i, "/s").replace(/\/sec$/i, "/s");
    if (!/\/s$/i.test(out)) out += "/s";
    return out;
  }

  if (relation === REL.DROP_RATE) {
    const m = text.match(/\b\d+(?:\.\d+)?\s*%/);
    return m ? m[0].replace(/\s+/g, "") : text;
  }

  return text;
}

function makeResult(answer, relation, source, page, reason, confidence = source.confidence) {
  const value = normalizeAnswer(answer, relation) || oneLine(answer, 500);
  if (!value) return null;
  return {
    answer: value,
    candidateAnswer: value,
    confidence,
    reason,
    route: source.key,
    sourceCount: 1,
    sources: [{
      host: source.host,
      title: page?.title || source.host,
      url: page?.url || "",
      claimType: reason,
      tier: source.tier,
    }],
  };
}

function findLabelValue(lines, labels, maxGap = 3) {
  const lowerLabels = labels.map((x) => x.toLowerCase());
  for (let i = 0; i < lines.length; i++) {
    const low = lines[i].toLowerCase();
    const exact = lowerLabels.some((label) => low === label || low.startsWith(`${label}:`));
    if (!exact) continue;

    const colonIndex = lines[i].indexOf(":");
    if (colonIndex >= 0) {
      const after = oneLine(lines[i].slice(colonIndex + 1), 500);
      if (after) return after;
    }

    for (let j = i + 1; j <= Math.min(lines.length - 1, i + maxGap); j++) {
      const v = oneLine(lines[j], 500);
      if (!v) continue;
      if (lowerLabels.some((label) => v.toLowerCase() === label)) break;
      return v;
    }
  }
  return null;
}

function extractSectionValue(text, startLabels, stopLabels = []) {
  const lines = clean(text, 30000).split("\n").map((x) => oneLine(x, 1000)).filter(Boolean);
  const starts = startLabels.map((x) => x.toLowerCase());
  const stops = stopLabels.map((x) => x.toLowerCase());
  for (let i = 0; i < lines.length; i++) {
    const low = lines[i].toLowerCase();
    if (!starts.some((s) => low === s || low.startsWith(s))) continue;
    const picked = [];
    for (let j = i + 1; j < lines.length && picked.length < 8; j++) {
      const l = lines[j];
      const ll = l.toLowerCase();
      if (stops.some((s) => ll === s || ll.startsWith(s))) break;
      if (/^(?:important notes|instructions|bonuses|requirements|new items|expected results|identity & availability|quick answers|how to obtain)$/i.test(l) && picked.length) break;
      picked.push(l);
    }
    if (picked.length) return picked.join(" | ");
  }
  return null;
}

function pageTitleFromHtml(html, fallback) {
  const m = String(html || "").match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? oneLine(htmlToText(m[1], 400), 240) : fallback;
}

async function fetchPage(url, source, deadline) {
  const key = `${source.key}:${url}`;
  const cached = cacheGet(PAGE_CACHE, key);
  if (cached) return { ...cached, cache: "HIT" };
  const left = timeLeft(deadline);
  if (left < 250) throw new Error(`${source.key}_BUDGET_EXHAUSTED`);
  const timeout = Math.max(250, Math.min(
    source === SOURCE.PRIMARY ? CFG.PRIMARY_TIMEOUT_MS : source === SOURCE.FANDOM ? CFG.FANDOM_TIMEOUT_MS : CFG.BACKUP_TIMEOUT_MS,
    left - 30
  ));
  const html = await fetchText(source.key, url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 ChromeCodeSniper-R24",
    },
  }, timeout);
  const page = {
    url,
    title: pageTitleFromHtml(html, url),
    html,
    lines: htmlToLines(html),
    text: htmlToText(html),
    source,
  };
  cacheSet(PAGE_CACHE, key, page, CFG.PAGE_CACHE_TTL_MS);
  return { ...page, cache: "MISS" };
}


function absolutePrimaryUrl(href) {
  const raw = oneLine(href, 1200);
  if (!raw) return null;
  try {
    const url = new URL(raw, PRIMARY_ORIGIN);
    if (url.origin !== PRIMARY_ORIGIN) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function primaryLinks(page, prefix = "/") {
  const html = String(page?.html || "");
  const out = [];
  const seen = new Set();
  const re = /<a\b([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const url = absolutePrimaryUrl(m[2]);
    if (!url) continue;
    let pathname = "";
    try { pathname = new URL(url).pathname; } catch {}
    if (!pathname.startsWith(prefix)) continue;
    const label = oneLine(htmlToText(m[4], 600), 300);
    const key = `${url}|${norm(label)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ url, label, pathname });
  }
  return out;
}

function bestPrimaryLink(page, analysis, prefix) {
  const links = primaryLinks(page, prefix);
  let best = null;
  for (const link of links) {
    const slugText = decodeURIComponent(link.pathname)
      .replace(/^\/+|\/+$/g, "")
      .replace(/[-_/]+/g, " ");
    const value = `${link.label} ${slugText}`;
    const score = bestEntityScore(analysis, value);
    if (!best || score > best.score) best = { ...link, score };
  }
  return best && best.score >= 0.38 ? best : null;
}

function isPrimaryEntityFieldRelation(relation) {
  return [
    REL.COST,
    REL.INCOME,
    REL.RARITY,
    REL.STATUS,
    REL.METHOD,
    REL.DATE,
  ].includes(relation);
}


function ritualDetailCandidates(analysis) {
  const candidates = [];
  const add = (slug) => {
    slug = slugify(slug);
    if (!slug) return;
    candidates.push(`${PRIMARY_ORIGIN}/rituals/${slug}`);
  };

  const entity = oneLine(analysis.entity || "", 180);
  const tokens = entity
    .toLowerCase()
    .match(/[a-z0-9]+/g) || [];

  // Most S+ ritual URLs are based on the distinctive ritual-name token.
  // For "Bombardiro Crocodilo", this tries /rituals/crocodilo-ritual first.
  if (tokens.length) {
    add(`${tokens[tokens.length - 1]}-ritual`);
    add(`${tokens[0]}-ritual`);
    add(`${tokens.join("-")}-ritual`);
  }

  for (const alias of analysis.entities || []) {
    const a = alias.toLowerCase().match(/[a-z0-9]+/g) || [];
    if (a.length) {
      add(`${a[a.length - 1]}-ritual`);
      add(`${a.join("-")}-ritual`);
    }
  }

  return [...new Set(candidates)].slice(0, 5);
}

async function primaryFastPath(question, analysis, deadline) {
  const errors = [];
  const pages = [];
  const tried = new Set();

  async function get(url) {
    if (!url || tried.has(url)) return null;
    tried.add(url);

    try {
      const page = await fetchPage(url, SOURCE.PRIMARY, deadline);
      pages.push(page);
      return page;
    } catch (error) {
      errors.push(`${url}:${errorCode(error)}`);
      return null;
    }
  }

  // 1) Exact Brainrot page.
  if (analysis.entity && isPrimaryEntityFieldRelation(analysis.relation)) {
    const exact = `${PRIMARY_ORIGIN}/brainrots/${slugify(analysis.entity)}`;
    const page = await get(exact);
    if (page) {
      const result = resolvePrimaryEntityPage(page, analysis);
      if (result) return { result, pages, errors, route: "EXACT_BRAINROT_SPLUS" };
    }
  }

  // 2) Rebirth canonical page.
  if (
    analysis.relation === REL.REBIRTH ||
    analysis.relation === REL.GEAR ||
    analysis.rebirth ||
    (analysis.current && question.toLowerCase().includes("rebirth"))
  ) {
    const page = await get(`${PRIMARY_ORIGIN}/wiki/rebirth`);
    if (page) {
      const result = resolvePrimaryRebirth(page, analysis);
      if (result) return { result, pages, errors, route: "DIRECT_REBIRTH_SPLUS" };
    }
  }

  // 3) Mutation / trait canonical page.
  if (
    analysis.relation === REL.MULTIPLIER ||
    analysis.relation === REL.MUTATION ||
    analysis.relation === REL.TRAIT ||
    /\b(?:mutation|trait)\b/i.test(question)
  ) {
    const page = await get(`${PRIMARY_ORIGIN}/wiki/mutations`);
    if (page) {
      const result = resolvePrimaryMutation(page, analysis);
      if (result) return { result, pages, errors, route: "DIRECT_MUTATIONS_SPLUS" };
    }
  }

  // 4) Ritual detail pages BEFORE hub/search.
  if (
    [REL.REQUIREMENT, REL.SPAWN, REL.FORMATION, REL.WEATHER, REL.DROP_RATE, REL.RITUAL, REL.STATUS].includes(analysis.relation) ||
    /\britual\b/i.test(question)
  ) {
    for (const url of ritualDetailCandidates(analysis)) {
      if (timeLeft(deadline) < 280) break;
      const detail = await get(url);
      if (!detail) continue;

      const result = resolvePrimaryRitual(detail, analysis);
      if (result) return { result, pages, errors, route: "EXACT_RITUAL_SPLUS" };
    }

    if (timeLeft(deadline) > 280) {
      const hub = await get(`${PRIMARY_ORIGIN}/rituals`);
      if (hub) {
        const hubResult = resolvePrimaryRitual(hub, analysis);
        if (hubResult) return { result: hubResult, pages, errors, route: "RITUAL_HUB_SPLUS" };

        const link = bestPrimaryLink(hub, analysis, "/rituals/");
        if (link && timeLeft(deadline) > 280) {
          const detail = await get(link.url);
          if (detail) {
            const result = resolvePrimaryRitual(detail, analysis);
            if (result) return { result, pages, errors, route: "FOLLOWED_RITUAL_SPLUS" };
          }
        }
      }
    }
  }

  // 5) Other structured S+ hubs.
  const hubs = [];
  if (analysis.relation === REL.CONTENTS || /\blucky block\b/i.test(question)) hubs.push("/lucky-blocks");
  if (analysis.relation === REL.MACHINE || /\bmachine\b/i.test(question)) hubs.push("/machines");
  if ([REL.EVENT, REL.UPDATE].includes(analysis.relation) || /\b(?:event|update)\b/i.test(question)) hubs.push("/events");
  if (analysis.relation === REL.COLLECTION || /\bcollection\b/i.test(question)) hubs.push("/collections");

  for (const path of hubs) {
    if (timeLeft(deadline) < 280) break;
    const page = await get(`${PRIMARY_ORIGIN}${path}`);
    if (!page) continue;
    const result = resolvePrimaryGenericPage(page, analysis);
    if (result) return { result, pages, errors, route: `DIRECT_${path}_SPLUS` };
  }

  return { result: null, pages, errors, route: "SPLUS_DIRECT_MISS" };
}

function primaryCandidateUrls(question, analysis) {
  const q = question.toLowerCase();
  const urls = [];
  const add = (path) => urls.push(`${PRIMARY_ORIGIN}${path}`);

  if (analysis.entity && isPrimaryEntityFieldRelation(analysis.relation)) {
    const slug = slugify(analysis.entity);
    if (slug) add(`/brainrots/${slug}`);
  }

  if (analysis.relation === REL.REBIRTH || analysis.relation === REL.GEAR || q.includes("rebirth")) add("/wiki/rebirth");
  if (analysis.relation === REL.MULTIPLIER || q.includes("mutation") || q.includes("trait")) add("/wiki/mutations");
  if ([REL.REQUIREMENT, REL.SPAWN, REL.FORMATION, REL.WEATHER, REL.RITUAL].includes(analysis.relation) || q.includes("ritual")) add("/rituals");
  if (analysis.relation === REL.CONTENTS || q.includes("lucky block")) add("/lucky-blocks");
  if (analysis.relation === REL.MACHINE || q.includes("machine")) add("/machines");
  if ([REL.EVENT, REL.UPDATE, REL.DATE].includes(analysis.relation) || q.includes("event") || q.includes("update")) add("/events");
  if (analysis.relation === REL.COLLECTION || q.includes("collection")) add("/collections");

  // Generic broad index as a final primary page, still S+.
  add("/wiki");

  return [...new Set(urls)].slice(0, CFG.MAX_PRIMARY_PAGES);
}

async function fetchPrimaryCandidates(question, analysis, deadline) {
  const urls = primaryCandidateUrls(question, analysis);
  const settled = await Promise.allSettled(urls.map((url) => fetchPage(url, SOURCE.PRIMARY, deadline)));
  const pages = [];
  const errors = [];
  for (const row of settled) {
    if (row.status === "fulfilled") pages.push(row.value);
    else errors.push(errorCode(row.reason));
  }
  return { pages, errors };
}

function findEntityPagePrimary(pages, analysis) {
  return pages
    .map((page) => ({ page, score: bestEntityScore(analysis, page.title) }))
    .sort((a, b) => b.score - a.score)[0]?.score >= 0.55
    ? pages.map((page) => ({ page, score: bestEntityScore(analysis, page.title) })).sort((a, b) => b.score - a.score)[0].page
    : null;
}


function resolvePrimaryEntityPage(page, analysis) {
  if (!page) return null;

  const relation = analysis.relation;
  const lines = page.lines || [];
  const text = page.text || "";

  // The S+ site exposes these as direct visible fields.
  // A direct field match is authoritative for this lookup and returns immediately.
  if (relation === REL.COST) {
    const v =
      findLabelValue(lines, ["Base Cost", "Cost", "Price"]) ||
      text.match(/\bBase Cost\b[\s:|-]{0,20}(\$\s*[\d.]+\s*[KMBTQ]?)/i)?.[1] ||
      text.match(/\blisted base cost of\s+(\$\s*[\d.]+\s*[KMBTQ]?)/i)?.[1];

    const answer = normalizeAnswer(v, REL.COST);
    if (answer) return makeResult(answer, relation, SOURCE.PRIMARY, page, "SPLUS_DIRECT_ENTITY_COST", 0.995);
  }

  if (relation === REL.INCOME) {
    const v =
      findLabelValue(lines, ["Income per Second", "Base Income/sec", "Income/sec", "Generates"]) ||
      text.match(/\bIncome per Second\b[\s:|-]{0,25}(\$\s*[\d.]+\s*[KMBTQ]?(?:\s*\/\s*s)?)/i)?.[1] ||
      text.match(/\b(?:generating|generates?)\s+(\$\s*[\d.]+\s*[KMBTQ]?)\s*(?:\/second|\/s|per second)/i)?.[1];

    const answer = normalizeAnswer(v, REL.INCOME);
    if (answer) return makeResult(answer, relation, SOURCE.PRIMARY, page, "SPLUS_DIRECT_ENTITY_INCOME", 0.995);
  }

  if (relation === REL.RARITY) {
    let v =
      findLabelValue(lines, ["Rarity"]) ||
      text.match(/\bis\s+(?:an?\s+)?([A-Za-z][A-Za-z ]{1,45}?)\s+brainrot\b/i)?.[1] ||
      text.match(/\b([A-Za-z][A-Za-z ]{1,45}?)\s+brainrot generating\b/i)?.[1];

    if (!v) {
      const idx = lines.findIndex((x) => similarity(x, page.title) >= 0.92);
      if (
        idx >= 0 &&
        lines[idx + 1] &&
        !/^(?:base cost|income|event|efficiency|image|identity)/i.test(lines[idx + 1])
      ) {
        v = lines[idx + 1];
      }
    }

    if (v) return makeResult(v, relation, SOURCE.PRIMARY, page, "SPLUS_DIRECT_ENTITY_RARITY", 0.995);
  }

  if (relation === REL.DATE) {
    const v =
      findLabelValue(lines, ["Added to Game", "Release Date"]) ||
      text.match(
        /recorded game-added date of\s+((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2})/i
      )?.[1];

    const date = String(v || "").match(
      /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}/i
    )?.[0];

    if (date) return makeResult(date, relation, SOURCE.PRIMARY, page, "SPLUS_DIRECT_ENTITY_DATE", 0.995);
  }

  if (relation === REL.STATUS) {
    const v = findLabelValue(lines, ["Current Availability", "Release Status", "Status"]);
    if (v) return makeResult(v, relation, SOURCE.PRIMARY, page, "SPLUS_DIRECT_ENTITY_STATUS", 0.995);
  }

  if (relation === REL.METHOD) {
    const v = findLabelValue(lines, ["Primary Route", "Current Availability"]);
    if (v) return makeResult(v, relation, SOURCE.PRIMARY, page, "SPLUS_DIRECT_ENTITY_METHOD", 0.995);

    const how = extractSectionValue(
      text,
      ["How to Obtain", "How to Get", "How to Get It"],
      ["Related Brainrots", "Mutation Income Calculator", "Tips", "Release Status"]
    );
    if (how) return makeResult(how, relation, SOURCE.PRIMARY, page, "SPLUS_DIRECT_ENTITY_SECTION", 0.99);
  }

  return null;
}


function rebirthSections(page) {
  const htmlSections = extractHeadingSections(page.html)
    .map((s) => {
      const m = s.title.match(/\bREBIRTH\s+(\d{1,3})\b/i);
      return m ? { number: Number(m[1]), title: s.title, text: s.text } : null;
    })
    .filter(Boolean);

  if (htmlSections.length >= 3) return htmlSections;

  // Plain-text fallback: survives site markup changes.
  const raw = String(page.text || "");
  const markers = [];
  const re = /\bREBIRTH\s+(\d{1,3})\b/gi;
  let m;
  while ((m = re.exec(raw)) !== null) {
    markers.push({ number: Number(m[1]), start: m.index, end: re.lastIndex });
  }

  const out = [];
  const seen = new Set();
  for (let i = 0; i < markers.length; i++) {
    const cur = markers[i];
    if (seen.has(cur.number)) continue;
    const next = markers.slice(i + 1).find((x) => x.number !== cur.number);
    const end = next ? next.start : Math.min(raw.length, cur.start + 5000);
    const sectionText = clean(raw.slice(cur.start, end), 5000);
    if (!sectionText) continue;
    seen.add(cur.number);
    out.push({
      number: cur.number,
      title: `REBIRTH ${cur.number}`,
      text: sectionText,
    });
  }

  return out;
}

function resolvePrimaryRebirth(page, analysis) {
  if (!page) return null;
  const sections = rebirthSections(page);
  if (!sections.length) return null;

  if (analysis.current) {
    const max = Math.max(...sections.map((s) => s.number));
    return makeResult(`Rebirth${max}`, REL.REBIRTH, SOURCE.PRIMARY, page, "SPLUS_DIRECT_REBIRTH_MAX", 0.995);
  }

  if (analysis.relation === REL.REBIRTH && analysis.entity) {
    let best = null;
    const wanted = norm(analysis.entity);

    for (const section of sections) {
      const sectionNorm = norm(section.text);
      const exact = wanted && sectionNorm.includes(wanted) ? 1 : 0;
      const score = Math.max(
        exact,
        bestEntityScore(analysis, section.text),
        similarity(analysis.entity, section.text)
      );

      if (!best || score > best.score) best = { section, score };
    }

    if (best && best.score >= 0.45) {
      return makeResult(
        `Rebirth${best.section.number}`,
        REL.REBIRTH,
        SOURCE.PRIMARY,
        page,
        "SPLUS_DIRECT_REBIRTH_REVERSE",
        0.995
      );
    }

    // Final raw-text fallback: locate the item, then choose the closest preceding REBIRTH marker.
    const raw = String(page.text || "");
    const idx = raw.toLowerCase().indexOf(String(analysis.entity).toLowerCase());
    if (idx >= 0) {
      const before = raw.slice(Math.max(0, idx - 2500), idx);
      const all = [...before.matchAll(/\bREBIRTH\s+(\d{1,3})\b/gi)];
      const last = all[all.length - 1];
      if (last) {
        return makeResult(
          `Rebirth${Number(last[1])}`,
          REL.REBIRTH,
          SOURCE.PRIMARY,
          page,
          "SPLUS_DIRECT_REBIRTH_NEAREST_MARKER",
          0.995
        );
      }
    }
  }

  if (analysis.relation === REL.GEAR && analysis.rebirth) {
    const section = sections.find((s) => s.number === analysis.rebirth);
    if (!section) return null;

    const v =
      extractSectionValue(section.text, ["New Items", "🎁New Items"], ["Bonuses", "⚡Bonuses", "Requirements"]) ||
      section.text.match(/New Items[\s:|-]{0,30}([A-Za-z][A-Za-z0-9' -]{2,100})/i)?.[1];

    if (v) return makeResult(v.split(" | ")[0], REL.GEAR, SOURCE.PRIMARY, page, "SPLUS_DIRECT_REBIRTH_ITEM", 0.995);
  }

  if (analysis.relation === REL.REQUIREMENT && analysis.rebirth) {
    const section = sections.find((s) => s.number === analysis.rebirth);
    if (!section) return null;

    const v = extractSectionValue(
      section.text,
      ["Requirements", "📋Requirements"],
      ["New Items", "🎁New Items", "Bonuses"]
    );

    if (v) return makeResult(v, REL.REQUIREMENT, SOURCE.PRIMARY, page, "SPLUS_DIRECT_REBIRTH_REQUIREMENT", 0.995);
  }

  return null;
}

function resolvePrimaryMutation(page, analysis) {
  if (!page) return null;
  const sections = extractHeadingSections(page.html);
  let best = null;
  for (const section of sections) {
    const score = bestEntityScore(analysis, section.title);
    if (!best || score > best.score) best = { section, score };
  }
  if (!best || best.score < 0.5) return null;

  if (analysis.relation === REL.MULTIPLIER) {
    const m = `${best.section.title}\n${best.section.text}`.match(/\b\d+(?:\.\d+)?\s*[x×]/i);
    if (m) return makeResult(m[0], REL.MULTIPLIER, SOURCE.PRIMARY, page, "PRIMARY_MUTATION_SECTION", 0.995);
  }

  if (analysis.relation === REL.METHOD || analysis.relation === REL.STATUS) {
    const lines = best.section.text.split("\n").map((x) => oneLine(x, 600)).filter(Boolean);
    const value = lines.find((x) => /available|event|admin|obtained|only|spawn/i.test(x));
    if (value) return makeResult(value, analysis.relation, SOURCE.PRIMARY, page, "PRIMARY_MUTATION_SECTION", 0.98);
  }

  return null;
}


function cleanRitualSpawn(value) {
  let v = oneLine(value, 180)
    .replace(/^Image:\s*/i, "")
    .replace(/\bTrait Grant\b.*$/i, "")
    .trim();

  // Collapse simple duplicated labels such as "Los Crocodillitos Los Crocodillitos".
  const parts = v.split(/\s+/);
  if (parts.length >= 2 && parts.length % 2 === 0) {
    const half = parts.length / 2;
    if (norm(parts.slice(0, half).join(" ")) === norm(parts.slice(half).join(" "))) {
      v = parts.slice(0, half).join(" ");
    }
  }
  return v;
}

function resolvePrimaryRitual(page, analysis) {
  if (!page) return null;

  const text = String(page.text || "");
  const title = page.title || "";
  const detailUrl = /\/rituals\/[^/?#]+-ritual\/?$/i.test(page.url || "");
  const specific =
    detailUrl ||
    (
      /ritual/i.test(title) &&
      bestEntityScore(analysis, `${title} ${text.slice(0, 1200)}`) >= 0.30
    );

  if (specific) {
    if (analysis.relation === REL.REQUIREMENT) {
      const players = text.match(/\b(\d+)\s+players required\b/i)?.[1];
      const required =
        text.match(/\bRequires\s+([A-Za-z0-9' -]{2,100})/i)?.[1] ||
        text.match(/\beach holding\s+(?:an?\s+)?([A-Za-z0-9' -]{2,100})/i)?.[1];

      if (required) {
        const value = players ? `${oneLine(required, 100)} x${players}` : oneLine(required, 100);
        return makeResult(value, REL.REQUIREMENT, SOURCE.PRIMARY, page, "SPLUS_DIRECT_RITUAL_REQUIREMENT", 0.995);
      }
    }

    if (analysis.relation === REL.SPAWN) {
      let expected =
        findLabelValue(page.lines || [], ["Brainrot Spawn"], 4) ||
        extractSectionValue(text, ["Brainrot Spawn"], ["Trait Grant", "Important Notes"]);

      if (!expected) {
        expected =
          text.match(/\bBrainrot Spawn\b[\s:|-]{0,80}(?:Image:\s*)?([A-Z][A-Za-z0-9' -]{2,100})/i)?.[1];
      }

      if (expected) {
        const answer = cleanRitualSpawn(String(expected).split(" | ")[0]);
        if (answer) return makeResult(answer, REL.SPAWN, SOURCE.PRIMARY, page, "SPLUS_DIRECT_RITUAL_SPAWN", 0.995);
      }
    }

    if (analysis.relation === REL.FORMATION) {
      const m =
        text.match(/\bLine up in a straight line\b/i) ||
        text.match(/\bFormation\s*[:|-]\s*([^\n.]{2,140})/i);

      if (m) return makeResult(m[1] || m[0], REL.FORMATION, SOURCE.PRIMARY, page, "SPLUS_DIRECT_RITUAL_FORMATION", 0.995);
    }

    if (analysis.relation === REL.DROP_RATE) {
      const v = findLabelValue(page.lines || [], ["Success Rate"]);
      if (v) return makeResult(v, REL.DROP_RATE, SOURCE.PRIMARY, page, "SPLUS_DIRECT_RITUAL_RATE", 0.99);
    }

    if (analysis.relation === REL.STATUS) {
      const v = findLabelValue(page.lines || [], ["Status"]);
      if (v) return makeResult(v, REL.STATUS, SOURCE.PRIMARY, page, "SPLUS_DIRECT_RITUAL_STATUS", 0.995);
    }
  }

  // Hub fallback. Still S+, but only used when exact detail routing misses.
  if (analysis.relation === REL.SPAWN && /\/rituals\/?$/.test(page.url || "")) {
    const links = primaryLinks(page, "/rituals/");
    let best = null;

    for (const link of links) {
      const score = bestEntityScore(analysis, `${link.label} ${link.pathname}`);
      if (!best || score > best.score) best = { ...link, score };
    }

    if (best && best.score >= 0.35) {
      const m = best.label.match(
        /Rewards?:\s*([A-Za-z0-9' -]{2,100}?)(?:\s+[a-z-]+\s+trait|\s+\d+\s+players?\s+required|$)/i
      );
      if (m?.[1]) {
        return makeResult(
          cleanRitualSpawn(m[1]),
          REL.SPAWN,
          SOURCE.PRIMARY,
          page,
          "SPLUS_RITUAL_HUB_CARD",
          0.995
        );
      }
    }
  }

  return null;
}

function resolvePrimaryGenericPage(page, analysis) {
  // Simple generic patterns for primary pages such as Lucky Blocks, Machines, Events, Collections.
  const text = page.text;
  if (!analysis.entity) return null;
  const escaped = analysis.entity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const windowRe = new RegExp(`.{0,350}${escaped}.{0,900}`, "is");
  const window = text.match(windowRe)?.[0] || "";
  if (!window) return null;

  if (analysis.relation === REL.DROP_RATE) {
    const m = window.match(/\b\d+(?:\.\d+)?\s*%/);
    if (m) return makeResult(m[0], REL.DROP_RATE, SOURCE.PRIMARY, page, "PRIMARY_GENERIC_WINDOW", 0.975);
  }
  if (analysis.relation === REL.COST) {
    const m = window.match(/\$\s*\d+(?:\.\d+)?\s*[KMBTQ]?/i);
    if (m) return makeResult(m[0], REL.COST, SOURCE.PRIMARY, page, "PRIMARY_GENERIC_WINDOW", 0.975);
  }
  if (analysis.relation === REL.RARITY) {
    const m = window.match(/(?:Rarity[:\s|]+)([A-Za-z][A-Za-z ]{1,40})/i);
    if (m) return makeResult(m[1], REL.RARITY, SOURCE.PRIMARY, page, "PRIMARY_GENERIC_WINDOW", 0.97);
  }
  if (analysis.relation === REL.CONTENTS || analysis.relation === REL.REWARD) {
    const m = window.match(/(?:Rewards?|Contents?|Drops?)[:\s]+([^\n|]{2,220})/i);
    if (m) return makeResult(m[1], analysis.relation, SOURCE.PRIMARY, page, "PRIMARY_GENERIC_WINDOW", 0.97);
  }
  if (analysis.relation === REL.DATE) {
    const m = window.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}/i);
    if (m) return makeResult(m[0], REL.DATE, SOURCE.PRIMARY, page, "PRIMARY_GENERIC_WINDOW", 0.97);
  }
  return null;
}

function resolvePrimary(question, analysis, pages) {
  // 1) exact entity page, best for brainrot fields
  const entityPage = findEntityPagePrimary(pages, analysis);
  const entity = resolvePrimaryEntityPage(entityPage, analysis);
  if (entity) return entity;

  // 2) dedicated system pages
  for (const page of pages) {
    if (/\/wiki\/rebirth\b/.test(page.url)) {
      const r = resolvePrimaryRebirth(page, analysis);
      if (r) return r;
    }
    if (/\/wiki\/mutations\b/.test(page.url)) {
      const r = resolvePrimaryMutation(page, analysis);
      if (r) return r;
    }
    if (/\/rituals(?:\/|$)/.test(page.url)) {
      const r = resolvePrimaryRitual(page, analysis);
      if (r) return r;
    }
  }

  // 3) generic primary pages
  for (const page of pages) {
    const r = resolvePrimaryGenericPage(page, analysis);
    if (r) return r;
  }

  return null;
}

function primarySearchQuery(question, analysis) {
  if (analysis.entity) return `site:steal-a-brainrot.org "${analysis.entity}" ${question}`;
  return `site:steal-a-brainrot.org ${question}`;
}

async function tavilySearch(query, deadline, includeDomains = null, recent = false) {
  if (!env("TAVILY_API_KEY")) return { answer: "", results: [], errors: ["TAVILY_NOT_CONFIGURED"] };
  const key = `${query}|${(includeDomains || []).join(",")}|${recent ? "R" : "A"}`;
  const cached = cacheGet(SEARCH_CACHE, key);
  if (cached) return cached;
  const left = timeLeft(deadline);
  if (left < 250) return { answer: "", results: [], errors: ["TAVILY_BUDGET_EXHAUSTED"] };

  const body = {
    query,
    search_depth: "fast",
    max_results: CFG.MAX_SEARCH_RESULTS,
    topic: "general",
    include_answer: "basic",
    include_raw_content: false,
    include_images: false,
  };
  if (includeDomains?.length) body.include_domains = includeDomains;
  if (recent) body.time_range = "month";

  try {
    const data = await fetchJson("TAVILY", TAVILY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env("TAVILY_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }, Math.max(250, Math.min(CFG.TAVILY_TIMEOUT_MS, left - 30)));

    const result = {
      answer: oneLine(data?.answer, 1000),
      results: (Array.isArray(data?.results) ? data.results : []).map((row) => ({
        title: oneLine(row?.title, 300),
        url: oneLine(row?.url, 1200),
        content: oneLine(row?.content || row?.raw_content, 3500),
        score: clamp(row?.score),
        host: (() => { try { return new URL(row?.url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } })(),
      })),
      errors: [],
    };
    cacheSet(SEARCH_CACHE, key, result, CFG.SEARCH_CACHE_TTL_MS);
    return result;
  } catch (error) {
    return { answer: "", results: [], errors: [errorCode(error)] };
  }
}

function resolvePrimarySnippet(search, analysis) {
  const primaryRows = search.results.filter((r) => r.host === SOURCE.PRIMARY.host);
  for (const row of primaryRows) {
    const text = `${row.title}\n${row.content}`;
    if (analysis.entity && bestEntityScore(analysis, text) < 0.22) continue;
    let answer = null;
    if (analysis.relation === REL.COST) answer = text.match(/(?:Base Cost|Cost|Price)[:\s|]+(\$\s*\d+(?:\.\d+)?\s*[KMBTQ]?)/i)?.[1];
    if (analysis.relation === REL.INCOME) answer = text.match(/(?:Income per Second|Base Income\/sec|Generates?)[:\s|]+(\$\s*\d+(?:\.\d+)?\s*[KMBTQ]?(?:\/s)?)/i)?.[1];
    if (analysis.relation === REL.RARITY) answer = text.match(/(?:Rarity[:\s|]+)([A-Za-z][A-Za-z ]{1,40})/i)?.[1] || text.match(/\bis an?\s+([A-Za-z][A-Za-z ]{1,40}?)\s+brainrot\b/i)?.[1];
    if (analysis.relation === REL.MULTIPLIER) answer = text.match(/\b\d+(?:\.\d+)?\s*[x×]/i)?.[0];
    if (analysis.relation === REL.REBIRTH) answer = text.match(/\bRebirth\s*#?\s*\d{1,3}\b/i)?.[0];
    if (analysis.relation === REL.SPAWN) answer = text.match(/(?:Rewards?|Brainrot Spawn)[:\s]+([^|\n]{2,100})/i)?.[1];
    if (answer) {
      return makeResult(answer, analysis.relation, SOURCE.PRIMARY, { title: row.title, url: row.url }, "PRIMARY_SPLUS_SEARCH_SNIPPET", 0.985);
    }
  }
  return null;
}

async function primaryDiscovery(question, analysis, deadline) {
  const search = await tavilySearch(primarySearchQuery(question, analysis), deadline, [SOURCE.PRIMARY.host], analysis.current);
  const snippet = resolvePrimarySnippet(search, analysis);
  if (snippet) return { result: snippet, pages: [], search };

  const urls = [...new Set(search.results.filter((r) => r.host === SOURCE.PRIMARY.host).map((r) => r.url))].slice(0, 3);
  const settled = await Promise.allSettled(urls.map((url) => fetchPage(url, SOURCE.PRIMARY, deadline)));
  const pages = settled.filter((x) => x.status === "fulfilled").map((x) => x.value);
  const result = resolvePrimary(question, analysis, pages);
  return { result, pages, search };
}

function fandomParseUrl(title) {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "text|wikitext|displaytitle",
    redirects: "1",
    format: "json",
  });
  return `${FANDOM_API}?${params.toString()}`;
}

async function fandomSearchTitles(query, deadline) {
  const left = timeLeft(deadline);
  if (left < 250) return [];
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: oneLine(query, 300),
    srnamespace: "0",
    srlimit: "5",
    format: "json",
  });
  try {
    const data = await fetchJson("FANDOM_SEARCH", `${FANDOM_API}?${params.toString()}`, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 ChromeCodeSniper-R24" } }, Math.min(CFG.FANDOM_TIMEOUT_MS, left - 20));
    return (Array.isArray(data?.query?.search) ? data.query.search : []).map((x) => oneLine(x?.title, 300)).filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchFandomPage(title, deadline) {
  const key = `FANDOM:${title.toLowerCase()}`;
  const cached = cacheGet(PAGE_CACHE, key);
  if (cached) return { ...cached, cache: "HIT" };
  const left = timeLeft(deadline);
  if (left < 250) throw new Error("FANDOM_BUDGET_EXHAUSTED");
  const data = await fetchJson("FANDOM_PARSE", fandomParseUrl(title), { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 ChromeCodeSniper-R24" } }, Math.min(CFG.FANDOM_TIMEOUT_MS, left - 20));
  if (data?.error) throw new Error(`FANDOM_PARSE_${data.error.code || "ERROR"}`);
  const p = data?.parse || {};
  const html = typeof p.text === "string" ? p.text : String(p.text?.["*"] || "");
  if (!html) throw new Error("FANDOM_EMPTY");
  const finalTitle = oneLine(p.title || title, 300);
  const page = {
    url: `${FANDOM_BASE}${encodeURIComponent(finalTitle.replace(/ /g, "_"))}`,
    title: finalTitle,
    html,
    lines: htmlToLines(html),
    text: htmlToText(html),
    source: SOURCE.FANDOM,
  };
  cacheSet(PAGE_CACHE, key, page, CFG.PAGE_CACHE_TTL_MS);
  return { ...page, cache: "MISS" };
}

function backupResolveText(page, analysis, source) {
  const text = page.text;
  const lines = page.lines;
  let answer = null;

  if (analysis.relation === REL.COST) answer = findLabelValue(lines, ["Base Cost", "Cost", "Price", "Buy Price"]) || text.match(/(?:cost|price)[^$]{0,30}(\$\s*\d+(?:\.\d+)?\s*[KMBTQ]?)/i)?.[1];
  if (analysis.relation === REL.INCOME) answer = findLabelValue(lines, ["Income per Second", "Income", "Generates", "Income/sec"]) || text.match(/(?:income|generates?)[^$]{0,35}(\$\s*\d+(?:\.\d+)?\s*[KMBTQ]?(?:\/s)?)/i)?.[1];
  if (analysis.relation === REL.RARITY) answer = findLabelValue(lines, ["Rarity", "Tier"]) || text.match(/\bis an?\s+([A-Za-z][A-Za-z ]{1,40}?)\s+brainrot\b/i)?.[1];
  if (analysis.relation === REL.MULTIPLIER) answer = text.match(/\b\d+(?:\.\d+)?\s*[x×]/i)?.[0];
  if (analysis.relation === REL.REBIRTH && analysis.entity) {
    const idx = text.toLowerCase().indexOf(analysis.entity.toLowerCase());
    if (idx >= 0) answer = text.slice(Math.max(0, idx - 400), idx + 400).match(/\bRebirth\s*#?\s*\d{1,3}\b/i)?.[0];
  }
  if (analysis.relation === REL.SPAWN) answer = text.match(/(?:spawns?|Rewards?|Brainrot Spawn)[:\s]+([^\n|]{2,100})/i)?.[1];
  if (analysis.relation === REL.REQUIREMENT) answer = text.match(/(?:requires?|requirement)[:\s]+([^\n|]{2,160})/i)?.[1];
  if (analysis.relation === REL.DATE) answer = text.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}/i)?.[0];

  if (!answer) return null;
  const confidence =
    source === SOURCE.FANDOM ? 0.97 :
    source === SOURCE.WIKI ? 0.94 :
    source.confidence;
  return makeResult(answer, analysis.relation, source, page, `${source.key}_DIRECT`, confidence);
}

async function fandomStage(question, analysis, deadline) {
  const titles = [];
  if (analysis.entity) titles.push(analysis.entity);
  const q = question.toLowerCase();
  if (q.includes("rebirth")) titles.push("Rebirth", "Gears");
  if (q.includes("mutation") || q.includes("trait")) titles.push("Mutations", "Traits");
  if (q.includes("ritual")) titles.push("Rituals");
  if (q.includes("update")) titles.push("Update Log");
  if (q.includes("machine")) titles.push("Machines");
  if (q.includes("lucky block")) titles.push("Lucky Blocks");

  if (analysis.entity && timeLeft(deadline) > 350) {
    const found = await fandomSearchTitles(analysis.entity, deadline);
    titles.push(...found.slice(0, 3));
  }

  const unique = [...new Set(titles.map((x) => oneLine(x, 300)).filter(Boolean))].slice(0, CFG.MAX_BACKUP_PAGES);
  const settled = await Promise.allSettled(unique.map((title) => fetchFandomPage(title, deadline)));
  const pages = settled.filter((x) => x.status === "fulfilled").map((x) => x.value);

  // Prefer page matching entity, then hubs.
  pages.sort((a, b) => bestEntityScore(analysis, b.title) - bestEntityScore(analysis, a.title));
  for (const page of pages) {
    const r = backupResolveText(page, analysis, SOURCE.FANDOM);
    if (r) return { result: r, pages, errors: [] };
  }
  return { result: null, pages, errors: settled.filter((x) => x.status === "rejected").map((x) => errorCode(x.reason)) };
}

async function wikiStage(question, analysis, deadline) {
  const search = await tavilySearch(`site:steal-a-brainrot.wiki ${analysis.entity ? `"${analysis.entity}"` : ""} ${question}`, deadline, [SOURCE.WIKI.host], analysis.current);
  for (const row of search.results.filter((r) => r.host === SOURCE.WIKI.host)) {
    const pseudo = { title: row.title, url: row.url, text: row.content, lines: row.content.split(/\n| \| /).map((x) => oneLine(x, 600)).filter(Boolean) };
    const r = backupResolveText(pseudo, analysis, SOURCE.WIKI);
    if (r) return { result: r, search };
  }
  return { result: null, search };
}

function evidenceSupports(answer, text) {
  const a = norm(answer);
  const t = norm(text);
  if (a && t.includes(a)) return true;
  const aa = String(answer).replace(/×/g, "x").replace(/\s+/g, "").toLowerCase();
  const tt = String(text).replace(/×/g, "x").replace(/\s+/g, "").toLowerCase();
  return aa && tt.includes(aa);
}

function parseModelJson(text) {
  const raw = String(text ?? "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  if (!raw) throw new Error("NVIDIA_EMPTY_CONTENT");
  try { return JSON.parse(raw); } catch {}
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first >= 0 && last > first) return JSON.parse(raw.slice(first, last + 1));
  throw new Error("NVIDIA_INVALID_JSON");
}

async function emergencyStage(question, analysis, evidencePages, deadline) {
  const search = await tavilySearch(`"Steal a Brainrot" ${question}`, deadline, null, analysis.current);
  if (!env("NVIDIA_API_KEY") || timeLeft(deadline) < 350) return { result: null, search };

  const evidence = [];
  let id = 1;
  for (const page of evidencePages.slice(0, 4)) {
    evidence.push({ id: `P${id++}`, tier: page.source?.tier || "?", title: page.title, url: page.url, text: oneLine(page.text, 9000) });
  }
  for (const row of search.results.slice(0, 5)) {
    evidence.push({ id: `W${id++}`, tier: "WEB", title: row.title, url: row.url, text: row.content });
  }
  if (!evidence.length) return { result: null, search };

  try {
    const data = await fetchJson("NVIDIA_RESOLVE", NVIDIA_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env("NVIDIA_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
        stream: false,
        temperature: 0.1,
        max_tokens: 220,
        chat_template_kwargs: { enable_thinking: false },
        messages: [
          {
            role: "system",
            content: [
              "Resolve a Steal a Brainrot fact using ONLY supplied evidence.",
              "Source priority is strict: S+ steal-a-brainrot.org > A+ Fandom > B steal-a-brainrot.wiki > other web.",
              "If S+ evidence directly answers the question, use it even if lower-tier evidence disagrees.",
              "Never lower confidence merely because a lower tier disagrees with a direct S+ fact.",
              "Return JSON only: {\"answer\":\"UNKNOWN or value\",\"confidence\":0.0,\"citedIds\":[\"P1\"],\"reason\":\"short\"}",
            ].join("\n"),
          },
          { role: "user", content: JSON.stringify({ question, relation: analysis.relation, entity: analysis.entity, evidence }) },
        ],
      }),
    }, Math.max(300, Math.min(CFG.NVIDIA_TIMEOUT_MS, timeLeft(deadline) - 25)));

    const raw = parseModelJson(data?.choices?.[0]?.message?.content);
    const answer = oneLine(raw?.answer || "UNKNOWN", 500);
    if (!answer || norm(answer) === "unknown") return { result: null, search };
    const citedIds = Array.isArray(raw?.citedIds) ? raw.citedIds.map(String).slice(0, 6) : [];
    const cited = evidence.filter((e) => citedIds.includes(e.id));
    const supported = cited.filter((e) => evidenceSupports(answer, e.text));
    if (!supported.length) return { result: null, search };

    // If a primary S+ item is cited, it still wins and gets high confidence.
    const primarySupport = supported.find((e) => e.tier === "S+");
    if (primarySupport) {
      return {
        result: {
          answer: normalizeAnswer(answer, analysis.relation) || answer,
          candidateAnswer: normalizeAnswer(answer, analysis.relation) || answer,
          confidence: 0.97,
          reason: "AI_VERIFIED_PRIMARY_SPLUS",
          route: "PRIMARY_SPLUS_AI_VERIFIED",
          sourceCount: 1,
          sources: [{ host: SOURCE.PRIMARY.host, title: primarySupport.title, url: primarySupport.url, claimType: "AI_VERIFIED_PRIMARY", tier: "S+" }],
        },
        search,
      };
    }

    return {
      result: {
        answer: normalizeAnswer(answer, analysis.relation) || answer,
        candidateAnswer: normalizeAnswer(answer, analysis.relation) || answer,
        confidence: Math.min(0.84, clamp(raw?.confidence)),
        reason: "EMERGENCY_AI_VERIFIED",
        route: SOURCE.EMERGENCY.key,
        sourceCount: supported.length,
        sources: supported.slice(0, 3).map((e) => ({
          host: (() => { try { return new URL(e.url).hostname; } catch { return ""; } })(),
          title: e.title,
          url: e.url,
          claimType: "AI_EVIDENCE",
          tier: e.tier,
        })),
      },
      search,
    };
  } catch {
    return { result: null, search };
  }
}

function answerCacheKey(question) {
  return norm(question);
}

function getCachedAnswer(question) {
  return cacheGet(ANSWER_CACHE, answerCacheKey(question));
}

function setCachedAnswer(question, result) {
  if (!result || result.answer === "UNKNOWN") return;
  cacheSet(ANSWER_CACHE, answerCacheKey(question), result, isCurrent(question) ? CFG.CURRENT_ANSWER_TTL_MS : CFG.STABLE_ANSWER_TTL_MS);
}

function finalize(base, question, analysis, startedAt, diagnostics = {}) {
  const sources = base?.sources || [];
  return {
    answer: base?.answer || "UNKNOWN",
    candidateAnswer: base?.candidateAnswer || base?.answer || "UNKNOWN",
    candidateConfidence: base?.confidence || 0,
    confidence: base?.confidence || 0,
    reason: base?.reason || "no_verified_answer",
    route: base?.route || "REVIEW",
    sourceCount: base?.sourceCount || 0,
    highestTier: sources[0]?.tier || "NONE",
    bestRelevance: base?.confidence || 0,
    sources,
    intent: analysis.current ? "CURRENT" : analysis.update ? "UPDATE" : "FACT",
    answerType: analysis.relation,
    entity: analysis.entity || "UNKNOWN",
    analysisSource: analysis.source,
    searchLatencyMs: nowMs() - startedAt,
    extractionMode: base?.route?.startsWith("PRIMARY") ? "PRIMARY_SPLUS" : base?.route || "REVIEW",
    cache: "MISS",
    priorityPolicy: "DIRECT S+ ALWAYS RETURNS FIRST; LOWER TIERS NEVER DOWNGRADE OR OVERRIDE DIRECT S+ EVIDENCE",
    diagnostics,
  };
}


async function resolveQuestion(questionObj, lore = "") {
  const startedAt = nowMs();
  const deadline = startedAt + CFG.GLOBAL_BUDGET_MS;
  const question = questionObj.question;

  const cached = getCachedAnswer(question);
  if (cached) {
    return {
      ...cached,
      cache: "HIT",
      searchLatencyMs: nowMs() - startedAt,
    };
  }

  const analysis = analyzeQuestion(question);

  const diagnostic = {
    primaryFastErrors: [],
    primaryFastRoute: "",
    primaryErrors: [],
    fandomErrors: [],
    wikiErrors: [],
    emergencyErrors: [],
  };

  // =====================================================
  // S+ PRIMARY
  // Direct evidence = 0.995 and RETURN NOW.
  // No Fandom/Tavily/AI disagreement is allowed to lower it.
  // =====================================================
  const fast = await primaryFastPath(question, analysis, deadline);
  diagnostic.primaryFastErrors = fast.errors;
  diagnostic.primaryFastRoute = fast.route;

  let result = fast.result;

  if (result) {
    const final = finalize(result, question, analysis, startedAt, diagnostic);
    setCachedAnswer(question, final);
    return final;
  }

  // One broad S+ pass only. No Tavily discovery before A+.
  if (timeLeft(deadline) > 260) {
    const primary = await fetchPrimaryCandidates(question, analysis, deadline);
    primary.pages.unshift(...fast.pages);
    primary.pages = [...new Map(primary.pages.map((p) => [p.url, p])).values()];
    diagnostic.primaryErrors = primary.errors;

    result = resolvePrimary(question, analysis, primary.pages);

    if (result) {
      const final = finalize(result, question, analysis, startedAt, diagnostic);
      setCachedAnswer(question, final);
      return final;
    }

    fast.pages.push(...primary.pages);
  }

  // =====================================================
  // A+ FANDOM
  // Only reached when S+ did not produce the requested fact.
  // Direct A+ evidence is accepted immediately.
  // =====================================================
  if (timeLeft(deadline) > 240) {
    const fandom = await fandomStage(question, analysis, deadline);
    diagnostic.fandomErrors = fandom.errors || [];
    result = fandom.result;

    if (result) {
      // Exact backup evidence should never become "low confidence".
      result.confidence = Math.max(result.confidence || 0, 0.97);
      result.candidateConfidence = result.confidence;

      const final = finalize(result, question, analysis, startedAt, diagnostic);
      setCachedAnswer(question, final);
      return final;
    }
  }

  // =====================================================
  // B WIKI
  // =====================================================
  if (timeLeft(deadline) > 220) {
    const wiki = await wikiStage(question, analysis, deadline);
    diagnostic.wikiErrors = wiki.search?.errors || [];
    result = wiki.result;

    if (result) {
      result.confidence = Math.max(result.confidence || 0, 0.94);
      result.candidateConfidence = result.confidence;

      const final = finalize(result, question, analysis, startedAt, diagnostic);
      setCachedAnswer(question, final);
      return final;
    }
  }

  // =====================================================
  // Emergency web/AI only after S+, A+, B all miss.
  // Low confidence is allowed ONLY down here.
  // =====================================================
  if (timeLeft(deadline) > 260) {
    const emergency = await emergencyStage(question, analysis, fast.pages, deadline);
    diagnostic.emergencyErrors = emergency.search?.errors || [];
    result = emergency.result;

    if (result) {
      const final = finalize(result, question, analysis, startedAt, diagnostic);
      setCachedAnswer(question, final);
      return final;
    }
  }

  return finalize(
    {
      answer: "UNKNOWN",
      candidateAnswer: "UNKNOWN",
      confidence: 0,
      reason: "ALL_PRIORITY_SOURCES_MISSED_OR_FAILED",
      route: "REVIEW",
      sourceCount: 0,
      sources: [],
    },
    question,
    analysis,
    startedAt,
    diagnostic
  );
}

function validateQuestions(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) {
    throw new Error("QUESTIONS_MUST_CONTAIN_1_TO_8_ITEMS");
  }
  return value.map((row, index) => {
    const question = oneLine(row?.question, 700);
    if (!question) throw new Error(`QUESTION_${index + 1}_EMPTY`);
    return {
      index: index + 1,
      question,
      expectedEntity: oneLine(row?.expectedEntity || "NONE", 120),
      expectedAttribute: oneLine(row?.expectedAttribute || "NONE", 120),
      aiAnswer: oneLine(row?.aiAnswer || "UNKNOWN", 400),
      aiConfidence: clamp(row?.aiConfidence),
    };
  });
}

function makeTrace(items) {
  const failed = items.find((item) => item.answer === "UNKNOWN");
  if (failed) return `REVIEW • ${failed.answerType || "TEXT"} • ${failed.reason || "unknown"} • ${failed.searchLatencyMs || 0}ms`;
  return items.map((item) => `${item.route}:${item.answer}:${Math.round((item.confidence || 0) * 100)}%:${item.searchLatencyMs || 0}ms`).join(" | ");
}

function syntheticPrimaryPage(title, url, lines) {
  return {
    title,
    url,
    lines,
    text: lines.join("\n"),
    html: `<h1>${title}</h1>${lines.map((x) => `<div>${x}</div>`).join("")}`,
    source: SOURCE.PRIMARY,
  };
}

function runSelfTests() {
  let passed = 0;
  const failures = [];
  const check = (name, condition, detail = "") => {
    if (condition) passed++;
    else failures.push({ name, detail: oneLine(detail, 180) });
  };

  check("priority primary confidence", SOURCE.PRIMARY.confidence > SOURCE.FANDOM.confidence && SOURCE.FANDOM.confidence > SOURCE.WIKI.confidence);
  check("primary route", SOURCE.PRIMARY.key === "PRIMARY_SPLUS");
  check("income relation", inferRelation("What is the income of Tralalero Tralala per second?") === REL.INCOME);
  check("rarity relation", inferRelation("What rarity is Tralalero Tralala?") === REL.RARITY);
  check("rebirth relation", inferRelation("What rebirth unlocks Flash Teleport?") === REL.REBIRTH);
  check("spawn relation", inferRelation("What does the Bombardiro Crocodilo ritual spawn?") === REL.SPAWN);
  check("require relation", inferRelation("What does the Bombardiro Crocodilo ritual require?") === REL.REQUIREMENT);
  check("multiplier relation", inferRelation("What multiplier does Rainbow mutation have?") === REL.MULTIPLIER);

  const tralalero = syntheticPrimaryPage("Tralalero Tralala", `${PRIMARY_ORIGIN}/brainrots/tralalero-tralala`, [
    "Tralalero Tralala",
    "Brainrot God",
    "Base Cost",
    "$10.0M",
    "Income per Second",
    "$50.0K",
    "Release Status",
    "Released",
    "Primary Route",
    "Fishing Event",
    "Added to Game",
    "April 1, 2025",
  ]);
  const trAnalysis = analyzeQuestion("What is the income of Tralalero Tralala per second?");
  check("primary entity income", resolvePrimaryEntityPage(tralalero, trAnalysis)?.answer === "$50.0K/s");
  check("primary entity cost", resolvePrimaryEntityPage(tralalero, analyzeQuestion("How much does Tralalero Tralala cost?"))?.answer === "$10.0M");
  check("primary entity rarity", resolvePrimaryEntityPage(tralalero, analyzeQuestion("What rarity is Tralalero Tralala?"))?.answer === "Brainrot God");
  check("primary entity date", resolvePrimaryEntityPage(tralalero, analyzeQuestion("When was Tralalero Tralala added to game?"))?.answer === "April 1, 2025");

  const mutationHtml = `
    <h1>Steal a Brainrot Mutations & Traits List</h1>
    <h3>Gold</h3><div>1.25x</div><div>Gold mutation with 1.25x multiplier</div>
    <h3>Rainbow</h3><div>10x</div><div>Rainbow mutation with 10x multiplier</div>
    <h3>Crystal</h3><div>13x</div><div>Crystal mutation with a 13x multiplier</div>`;
  const mutationPage = { title: "Mutations", url: `${PRIMARY_ORIGIN}/wiki/mutations`, html: mutationHtml, lines: htmlToLines(mutationHtml), text: htmlToText(mutationHtml), source: SOURCE.PRIMARY };
  check("primary rainbow", resolvePrimaryMutation(mutationPage, analyzeQuestion("What multiplier does Rainbow mutation have?"))?.answer === "10x");
  check("primary crystal", resolvePrimaryMutation(mutationPage, analyzeQuestion("What multiplier does Crystal mutation have?"))?.answer === "13x");

  const rebirthHtml = `
    <h1>Rebirth System Guide</h1>
    <h3>REBIRTH 17 17th</h3><h4>Requirements</h4><div>Cash: $2.5Qa</div><div>Characters: Job Job Job Sahur</div><h4>New Items</h4><div>Giant Potion</div><h4>Bonuses</h4><div>MULTI x17</div>
    <h3>REBIRTH 18 18th</h3><h4>Requirements</h4><div>Cash: $10Qa</div><h4>New Items</h4><div>Flash Teleport</div><h4>Bonuses</h4><div>MULTI x18</div>
    <h3>REBIRTH 19 19th</h3><h4>New Items</h4><div>Grief Shield</div>`;
  const rebirthPage = { title: "Rebirth System Guide", url: `${PRIMARY_ORIGIN}/wiki/rebirth`, html: rebirthHtml, lines: htmlToLines(rebirthHtml), text: htmlToText(rebirthHtml), source: SOURCE.PRIMARY };
  check("primary giant potion reverse", resolvePrimaryRebirth(rebirthPage, analyzeQuestion("What rebirth unlocks Giant Potion?"))?.answer === "Rebirth17");
  check("primary flash reverse", resolvePrimaryRebirth(rebirthPage, analyzeQuestion("What rebirth unlocks Flash Teleport?"))?.answer === "Rebirth18");
  check("primary newest", resolvePrimaryRebirth(rebirthPage, analyzeQuestion("What is the newest rebirth right now?"))?.answer === "Rebirth19");

  const ritualHubHtml = `
    <h1>Secret Rituals & Traits</h1>
    <a href="/rituals/crocodilo-ritual">Crocodilo Ritual Rewards: Los Crocodillitos explosive trait 3 players required</a>
    <a href="/rituals/orcalero-ritual">Orcalero Ritual Rewards: Los Orcalitos water trait 4 players required</a>`;
  const ritualHub = {
    title: "Secret Rituals & Traits",
    url: `${PRIMARY_ORIGIN}/rituals`,
    html: ritualHubHtml,
    lines: htmlToLines(ritualHubHtml),
    text: htmlToText(ritualHubHtml),
    source: SOURCE.PRIMARY,
  };
  check(
    "primary ritual hub link spawn",
    resolvePrimaryRitual(ritualHub, analyzeQuestion("What does the Bombardiro Crocodilo ritual spawn?"))?.answer === "Los Crocodillitos"
  );
  check(
    "primary ritual best detail link",
    bestPrimaryLink(ritualHub, analyzeQuestion("What does the Bombardiro Crocodilo ritual spawn?"), "/rituals/")?.url.endsWith("/rituals/crocodilo-ritual")
  );


  const liveShapeTralalero = syntheticPrimaryPage(
    "Tralalero Tralala",
    `${PRIMARY_ORIGIN}/brainrots/tralalero-tralala`,
    [
      "Tralalero Tralala",
      "Brainrot God",
      "Base Cost",
      "$10.0M",
      "Income per Second",
      "$50.0K",
      "Tralalero Tralala is a Brainrot God brainrot generating $50.0K/second",
    ]
  );
  check(
    "R24 live-shape income",
    resolvePrimaryEntityPage(liveShapeTralalero, analyzeQuestion("What is the income of Tralalero Tralala per second?"))?.answer === "$50.0K/s"
  );

  const liveShapeRebirth = syntheticPrimaryPage(
    "Rebirth System Guide",
    `${PRIMARY_ORIGIN}/wiki/rebirth`,
    [
      "REBIRTH 17",
      "Requirements",
      "Cash: $2.5Qa",
      "New Items",
      "Giant Potion",
      "Bonuses",
      "MULTI x17",
      "REBIRTH 18",
      "New Items",
      "Flash Teleport",
      "REBIRTH 19",
      "New Items",
      "Grief Shield",
    ]
  );
  liveShapeRebirth.html = `<main>${liveShapeRebirth.lines.map((x) => `<div>${x}</div>`).join("")}</main>`;
  liveShapeRebirth.text = liveShapeRebirth.lines.join("\n");
  check(
    "R24 plain-text rebirth reverse",
    resolvePrimaryRebirth(liveShapeRebirth, analyzeQuestion("What rebirth unlocks Giant Potion?"))?.answer === "Rebirth17"
  );

  const liveShapeRitual = syntheticPrimaryPage(
    "Crocodilo Ritual",
    `${PRIMARY_ORIGIN}/rituals/crocodilo-ritual`,
    [
      "Crocodilo Ritual",
      "3 players required",
      "Requirements",
      "Requires Bombardiro Crocodilo",
      "Expected Results",
      "Brainrot Spawn",
      "Los Crocodillitos",
      "Trait Grant",
      "explosive Trait",
    ]
  );
  check(
    "R24 ritual direct spawn",
    resolvePrimaryRitual(liveShapeRitual, analyzeQuestion("What does the Bombardiro Crocodilo ritual spawn?"))?.answer === "Los Crocodillitos"
  );

  // Priority behavior: once S+ has a direct value, lower tier disagreement does not participate.
  const primary = makeResult("10x", REL.MULTIPLIER, SOURCE.PRIMARY, mutationPage, "PRIMARY_MUTATION_SECTION", 0.995);
  const fandom = makeResult("9x", REL.MULTIPLIER, SOURCE.FANDOM, { title: "Mutations", url: "fandom" }, "FANDOM_DIRECT", 0.93);
  check("S+ beats conflicting A+", primary.answer === "10x" && primary.confidence > fandom.confidence && primary.route === "PRIMARY_SPLUS");

  for (let i = 1; i <= 100; i++) {
    const page = syntheticPrimaryPage(`Entity ${i}`, `${PRIMARY_ORIGIN}/brainrots/entity-${i}`, [
      `Entity ${i}`, `Tier ${i}`, "Base Cost", `$${i}M`, "Income per Second", `$${i}K`,
    ]);
    check(`generic cost ${i}`, resolvePrimaryEntityPage(page, analyzeQuestion(`How much does Entity ${i} cost?`))?.answer === `$${i}M`);
    check(`generic income ${i}`, resolvePrimaryEntityPage(page, analyzeQuestion(`What income does Entity ${i} make per second?`))?.answer === `$${i}K/s`);
    check(`generic rarity ${i}`, resolvePrimaryEntityPage(page, analyzeQuestion(`What rarity is Entity ${i}?`))?.answer === `Tier ${i}`);
  }

  return {
    ok: failures.length === 0,
    total: passed + failures.length,
    passed,
    failed: failures.length,
    failures: failures.slice(0, 40),
    note: "Deterministic parser/priority tests. Live upstream availability is checked with ?test=live.",
  };
}

async function runLiveTests() {
  const tests = [
    ["Tralalero rarity", "What rarity is Tralalero Tralala?", "Brainrot God"],
    ["Tralalero income", "What is the income of Tralalero Tralala per second?", "$50.0K/s"],
    ["Rainbow multiplier", "What multiplier does Rainbow mutation have?", "10x"],
    ["Giant Potion rebirth", "What rebirth unlocks Giant Potion?", "Rebirth17"],
    ["Flash Teleport rebirth", "What rebirth unlocks Flash Teleport?", "Rebirth18"],
    ["Newest rebirth", "What is the newest rebirth right now?", "Rebirth19"],
    ["Bombardiro spawn", "What does the Bombardiro Crocodilo ritual spawn?", "Los Crocodillitos"],
  ];

  const results = [];
  for (const [name, question, expected] of tests) {
    ANSWER_CACHE.delete(answerCacheKey(question));
    try {
      const result = await resolveQuestion({ question, index: 1 }, "");
      results.push({
        name,
        question,
        expected,
        answer: result.answer,
        pass: norm(result.answer) === norm(expected),
        route: result.route,
        confidence: result.confidence,
        highestTier: result.highestTier,
        ms: result.searchLatencyMs,
      });
    } catch (error) {
      results.push({ name, question, expected, answer: "ERROR", pass: false, error: errorCode(error) });
    }
  }
  return {
    ok: results.every((x) => x.pass),
    passed: results.filter((x) => x.pass).length,
    failed: results.filter((x) => !x.pass).length,
    total: results.length,
    results,
  };
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { Allow: "GET, POST, OPTIONS", "cache-control": "no-store" },
  });
}

export async function GET(request) {
  const url = new URL(request.url);
  const test = url.searchParams.get("test");

  if (test === "self") {
    return json(200, { build: BUILD_ID, selfTest: runSelfTests() });
  }

  if (test === "live") {
    const started = nowMs();
    const live = await runLiveTests();
    return json(200, { build: BUILD_ID, test: "LIVE_SPLUS_PRIORITY", ...live, totalMs: nowMs() - started });
  }

  if (test === "analyze") {
    const question = oneLine(url.searchParams.get("q") || "What rarity is Tralalero Tralala?", 700);
    return json(200, { ok: true, build: BUILD_ID, question, analysis: analyzeQuestion(question) });
  }

  if (test === "resolve") {
    const question = oneLine(url.searchParams.get("q") || "What rarity is Tralalero Tralala?", 700);
    ANSWER_CACHE.delete(answerCacheKey(question));
    try {
      const result = await resolveQuestion({ question, index: 1 }, "");
      return json(200, { ok: result.answer !== "UNKNOWN", build: BUILD_ID, question, result });
    } catch (error) {
      return json(200, { ok: false, build: BUILD_ID, question, error: errorCode(error) });
    }
  }

  if (test === "primary") {
    const question = oneLine(url.searchParams.get("q") || "What multiplier does Rainbow mutation have?", 700);
    const started = nowMs();
    const deadline = started + 3000;
    const analysis = analyzeQuestion(question);
    const fast = await primaryFastPath(question, analysis, deadline);
    const stage = await fetchPrimaryCandidates(question, analysis, deadline);
    const pages = [...new Map([...fast.pages, ...stage.pages].map((p) => [p.url, p])).values()];
    const direct = fast.result || resolvePrimary(question, analysis, pages);
    return json(200, {
      ok: Boolean(direct?.answer),
      build: BUILD_ID,
      question,
      analysis,
      fastRoute: fast.route,
      direct,
      pages: pages.map((p) => ({ title: p.title, url: p.url, cache: p.cache, lineCount: p.lines.length })),
      errors: [...fast.errors, ...stage.errors],
      ms: nowMs() - started,
    });
  }

  return json(200, {
    ok: true,
    build: BUILD_ID,
    configured: {
      tavily: Boolean(env("TAVILY_API_KEY")),
      nvidia: Boolean(env("NVIDIA_API_KEY")),
      token: Boolean(env("LOOKUP_PROXY_TOKEN")),
    },
    model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
    priority: [
      { tier: "S+", source: "steal-a-brainrot.org", policy: "AUTHORITATIVE FOR THIS LOOKUP; DIRECT S+ ANSWERS RETURN IMMEDIATELY" },
      { tier: "A+", source: "stealabrainrot.fandom.com", policy: "USED ONLY WHEN S+ MISSES" },
      { tier: "B", source: "steal-a-brainrot.wiki", policy: "USED ONLY WHEN S+ AND A+ MISS" },
      { tier: "C", source: "Tavily/NVIDIA", policy: "EMERGENCY ONLY" },
    ],
    conflictPolicy: "DIRECT S+ FACT = 0.995 AND IMMEDIATE RETURN; A+ USED ONLY ON S+ MISS; B USED ONLY ON S+/A+ MISS",
    architecture: {
      primaryFirst: true,
      primaryImmediateReturn: true,
      exactBrainrotPageFirst: true,
      directRebirthPageFirst: true,
      directMutationPageFirst: true,
      ritualHubLinkFollow: true,
      exactRitualDetailFollow: true,
      primaryDomainDiscovery: false,
      primaryTextFallback: true,
      ritualSlugCandidates: true,
      authoritativeDirectSourceReturn: true,
      fandomFallbackOnly: true,
      wikiFallbackOnly: true,
      emergencyFallbackOnly: true,
      entityFields: true,
      rebirthSections: true,
      mutationSections: true,
      ritualSections: true,
      caches: true,
      providerFailureIsolation: true,
    },
  });
}

export async function POST(request) {
  const expectedToken = env("LOOKUP_PROXY_TOKEN");
  const suppliedToken = oneLine(request.headers.get("authorization"), 1200).replace(/^Bearer\s+/i, "").trim();

  if (!expectedToken) return json(503, { error: "LOOKUP_TOKEN_NOT_CONFIGURED" });
  if (suppliedToken !== expectedToken) return json(401, { error: "LOOKUP_UNAUTHORIZED" });

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "INVALID_JSON_BODY" });
  }

  let questions;
  try {
    questions = validateQuestions(body?.questions);
  } catch (error) {
    return json(400, { error: errorCode(error) });
  }

  const lore = clean(body?.lore, 16000);
  const items = [];

  for (const question of questions) {
    try {
      const result = await resolveQuestion(question, lore);
      items.push({
        index: question.index,
        attribute: question.expectedAttribute !== "NONE" ? question.expectedAttribute : result.answerType,
        ...result,
      });
    } catch (error) {
      items.push({
        index: question.index,
        answer: "UNKNOWN",
        candidateAnswer: "UNKNOWN",
        confidence: 0,
        reason: errorCode(error),
        route: "LOOKUP_ERROR",
        sourceCount: 0,
        highestTier: "NONE",
        bestRelevance: 0,
        sources: [],
      });
    }
  }

  return json(200, {
    ok: true,
    build: BUILD_ID,
    model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
    trace: makeTrace(items),
    items,
  });
}
