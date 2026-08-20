const BUILD_ID = "SAB_FACT_SLOT_BINDING_R33_2026_08_19";

const PRIMARY_ORIGIN = "https://steal-a-brainrot.org";
const FANDOM_API = "https://stealabrainrot.fandom.com/api.php";
const FANDOM_BASE = "https://stealabrainrot.fandom.com/wiki/";
const WIKI_ORIGIN = "https://steal-a-brainrot.wiki";
const TAVILY_URL = "https://api.tavily.com/search";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";

const CFG = Object.freeze({
  GLOBAL_BUDGET_MS: Number(process.env.LOOKUP_BUDGET_MS || 5400),
  PRIMARY_TIMEOUT_MS: Number(process.env.PRIMARY_TIMEOUT_MS || 1050),
  FANDOM_TIMEOUT_MS: Number(process.env.FANDOM_TIMEOUT_MS || 900),
  BACKUP_TIMEOUT_MS: Number(process.env.BACKUP_TIMEOUT_MS || 800),
  TAVILY_TIMEOUT_MS: Number(process.env.TAVILY_TIMEOUT_MS || 950),
  NVIDIA_TIMEOUT_MS: Number(process.env.NVIDIA_TIMEOUT_MS || 950),
  NVIDIA_ANALYZE_TIMEOUT_MS: Number(process.env.NVIDIA_ANALYZE_TIMEOUT_MS || 650),

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
  OUTCOME: "OUTCOME",
  FREQUENCY: "FREQUENCY",
  ACTIVE_RANGE: "ACTIVE_RANGE",
  REPLACED_BY: "REPLACED_BY",
  REPLACED_IN: "REPLACED_IN",
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


function extractAllUpdateNumbers(question) {
  const q = oneLine(question, 700);
  return [...new Set(
    [...q.matchAll(/\bupdate\s*(\d+(?:\.\d+)?)\b/gi)]
      .map((m) => Number(m[1]))
      .filter((n) => Number.isFinite(n) && n > 0)
  )];
}

function extractLifecycleHints(question) {
  const q = oneLine(question, 700);
  const fromTo = q.match(/\bfrom\s+update\s*(\d+(?:\.\d+)?)\s+(?:through|to|until|thru)\s+update\s*(\d+(?:\.\d+)?)/i);
  const replacedIn = q.match(/\breplaced\s+(?:in|during|by\s+update)\s*update?\s*(\d+(?:\.\d+)?)/i)
    || q.match(/\breplaced\s+in\s+update\s*(\d+(?:\.\d+)?)/i);

  return {
    activeFrom: fromTo ? Number(fromTo[1]) : null,
    activeTo: fromTo ? Number(fromTo[2]) : null,
    replacedIn: replacedIn ? Number(replacedIn[1]) : null,
  };
}

function inferRelation(question) {
  const q = oneLine(question, 700).toLowerCase();

  if (/\b(?:how often|how frequently|what interval|what cadence|frequency|recurr?ence|every how many)\b/.test(q)) return REL.FREQUENCY;
  if (/\bwhat\s+(?:replaced|replaces)\b|\breplaced by what\b/.test(q)) return REL.REPLACED_BY;
  if (/\b(?:which|what)\s+update\b[^?]{0,80}\breplaced\b|\breplaced in which update\b/.test(q)) return REL.REPLACED_IN;
  if (/\b(?:active|ran|available)\s+from\s+update\b|\bactive range\b/.test(q) && !/\b(?:what|which)\s+machine\b/.test(q)) return REL.ACTIVE_RANGE;
  if (/\b(?:result|outcome)\b/.test(q) && /\britual\b/.test(q)) return REL.OUTCOME;

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


function extractExplicitDate(question) {
  const q = oneLine(question, 700);
  const m = q.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(20\d{2})\b/i
  );
  if (!m) return null;

  const months = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  };

  const month = months[m[1].toLowerCase()];
  return `${m[3]}-${String(month).padStart(2, "0")}-${String(Number(m[2])).padStart(2, "0")}`;
}

function inferIntent(question, relation, update, date) {
  const q = oneLine(question, 700).toLowerCase();

  if (update && /\bwhat did\b|\bwhat was added\b|\bwhat got added\b|\bwhat changed\b/.test(q)) {
    return "UPDATE_SUMMARY";
  }

  if (update || date) {
    return "UPDATE_FACT";
  }

  if (/\bcurrent\b|\bnewest\b|\blatest\b|\bright now\b|\btoday\b/.test(q)) {
    return "CURRENT_FACT";
  }

  return "ENTITY_FACT";
}


function analyzeQuestion(question) {
  const q = oneLine(question, 700);
  let relation = inferRelation(q);
  const entities = candidateEntities(q);
  const rebirth = extractRebirthNumber(q);
  const updateRaw = extractUpdateNumber(q);
  const update = updateRaw ? Number(updateRaw) : null;
  const updateNumbers = extractAllUpdateNumbers(q);
  const lifecycle = extractLifecycleHints(q);
  const date = extractExplicitDate(q);
  const current = isCurrent(q);

  if (
    date &&
    /\b(?:what|which)\s+update\b|\bupdate\s+(?:happened|occurred|released|came out)\b/i.test(q)
  ) {
    relation = REL.UPDATE;
  }

  let entity = entities[0] || null;

  if (rebirth && relation === REL.GEAR) entity = `Rebirth${rebirth}`;
  if (current && q.toLowerCase().includes("rebirth")) entity = null;

  return {
    entity,
    entities,
    relation,
    rebirth,
    update,
    updateNumbers,
    activeFrom: lifecycle.activeFrom,
    activeTo: lifecycle.activeTo,
    replacedIn: lifecycle.replacedIn,
    date,
    current,
    intent: inferIntent(q, relation, update, date),
    rawQuestion: q,
    wantedRelations: detectWantedRelations(q, relation),
    source: "DETERMINISTIC_R33",
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
      "User-Agent": "Mozilla/5.0 ChromeCodeSniper-R33",
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


function updateNeedleScore(text, analysis) {
  const t = oneLine(text, 4000).toLowerCase();
  let score = 0;

  if (analysis.update && new RegExp(`\\bupdate\\s*${analysis.update}\\b`, "i").test(t)) score += 8;

  if (analysis.date) {
    const [y, m, d] = analysis.date.split("-").map(Number);
    const names = [
      "", "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const dateRe = new RegExp(`${names[m]}\\s+0?${d},?\\s+${y}`, "i");
    if (dateRe.test(t)) score += 8;
  }

  if (analysis.relation === REL.MACHINE && /\bmachine\b/i.test(t)) score += 2;
  if (analysis.relation === REL.REBIRTH && /\brebirth\b/i.test(t)) score += 2;
  if (analysis.relation === REL.BRAINROT && /\bbrainrot\b/i.test(t)) score += 2;
  if (analysis.relation === REL.GEAR && /\b(?:gear|item|shield|teleport|potion)\b/i.test(t)) score += 2;

  return score;
}

function contextAroundUpdate(text, analysis, radius = 1500) {
  const raw = String(text || "");
  let indices = [];

  if (analysis.update) {
    const re = new RegExp(`\\bUpdate\\s*${analysis.update}\\b`, "ig");
    let m;
    while ((m = re.exec(raw)) !== null) indices.push(m.index);
  }

  if (analysis.date) {
    const [y, mo, d] = analysis.date.split("-").map(Number);
    const names = [
      "", "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const re = new RegExp(`${names[mo]}\\s+0?${d},?\\s+${y}`, "ig");
    let m;
    while ((m = re.exec(raw)) !== null) indices.push(m.index);
  }

  if (!indices.length) return "";
  const i = indices[0];
  return clean(raw.slice(Math.max(0, i - radius), Math.min(raw.length, i + radius)), radius * 2);
}

function extractUpdateTypedAnswer(context, analysis) {
  const text = oneLine(context, 5000);
  if (!text) return null;

  if (analysis.relation === REL.REBIRTH) {
    const matches = [...text.matchAll(/\bRebirth\s*#?\s*(\d{1,3})\b/gi)];
    if (matches.length) {
      const nums = matches.map((m) => Number(m[1])).filter(Number.isFinite);
      if (nums.length) return `Rebirth${Math.max(...nums)}`;
    }
  }

  if (analysis.relation === REL.MACHINE) {
    const matches = [
      ...text.matchAll(
        /\b((?:[A-Z0-9]{2,}|[A-Z][a-z]+)(?:\s+(?:[A-Z0-9]{2,}|[A-Z][a-z]+)){0,3}\s+Machine)\b/g
      ),
    ]
      .map((m) => oneLine(m[1], 100))
      .filter(Boolean);

    if (matches.length) {
      const ranked = [...new Set(matches)].sort((a, b) => {
        const as = /\b(?:RNG|Fuse|Craft|Mutation|Trait|Lucky|Brainrot)\b/i.test(a) ? 1 : 0;
        const bs = /\b(?:RNG|Fuse|Craft|Mutation|Trait|Lucky|Brainrot)\b/i.test(b) ? 1 : 0;
        return bs - as || a.length - b.length;
      });
      return ranked[0];
    }
  }

  if (analysis.relation === REL.GEAR) {
    const labels = [
      "New Items", "New Item", "Gear", "Item Unlock", "Unlock",
    ];
    const lines = context.split(/\n| \| /).map((x) => oneLine(x, 300)).filter(Boolean);
    const v = findLabelValue(lines, labels, 5);
    if (v) return oneLine(v, 120);
  }

  if (analysis.relation === REL.DATE) {
    const m = text.match(
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}\b/i
    );
    if (m) return m[0];
  }

  return null;
}

function primaryEventContextLinks(page) {
  const html = String(page?.html || "");
  const out = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;

  while ((m = re.exec(html)) !== null) {
    const url = absolutePrimaryUrl(m[1]);
    if (!url) continue;

    let pathname = "";
    try { pathname = new URL(url).pathname; } catch {}
    if (!pathname.startsWith("/events/")) continue;

    const start = Math.max(0, m.index - 900);
    const end = Math.min(html.length, re.lastIndex + 900);
    const context = htmlToText(html.slice(start, end), 2500);
    const label = htmlToText(m[2], 400);

    out.push({ url, pathname, label, context });
  }

  return out;
}


function extractUpdateNumberFromText(value) {
  const text = oneLine(value, 6000);
  if (!text) return null;

  const matches = [
    ...text.matchAll(/\bUpdate\s*#?\s*(\d{1,3}(?:\.\d+)?)\b/gi),
  ];

  if (!matches.length) return null;

  for (const match of matches) {
    const n = Number(match[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }

  return null;
}

function dateTextVariants(date) {
  if (!date) return [];

  const [y, m, d] = String(date).split("-").map(Number);
  if (!y || !m || !d) return [];

  const names = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return [
    `${names[m]} ${d}, ${y}`,
    `${names[m]} ${d} ${y}`,
    `${names[m]} ${String(d).padStart(2, "0")}, ${y}`,
  ];
}

function resolveUpdateNumberFromEventHub(eventsPage, analysis) {
  if (!eventsPage || !analysis?.date) {
    return { update: null, link: null, evidence: "" };
  }

  // First try exact date context from the visible events page.
  const dateContext = contextAroundUpdate(eventsPage.text, { date: analysis.date }, 2600);
  const direct = extractUpdateNumberFromText(dateContext);

  if (direct) {
    return {
      update: direct,
      link: null,
      evidence: dateContext,
    };
  }

  // Stronger fallback: identify the exact event card/link containing the date,
  // then read the Update number from that same card.
  const links = primaryEventContextLinks(eventsPage)
    .map((link) => ({
      ...link,
      score: updateNeedleScore(
        `${link.label} ${link.context} ${link.pathname}`,
        { ...analysis, update: null }
      ),
    }))
    .sort((a, b) => b.score - a.score);

  const best = links[0];

  if (best && best.score >= 6) {
    const update = extractUpdateNumberFromText(
      `${best.label} ${best.context} ${best.pathname}`
    );

    return {
      update,
      link: best,
      evidence: `${best.label} ${best.context}`,
    };
  }

  return {
    update: null,
    link: best || null,
    evidence: "",
  };
}

function withBridgedUpdate(analysis, update) {
  if (!update) return analysis;

  return {
    ...analysis,
    update: Number(update),
    intent:
      analysis.intent === "UPDATE_SUMMARY"
        ? "UPDATE_SUMMARY"
        : "UPDATE_FACT",
    source:
      analysis.source === "NVIDIA_QUESTION_ROUTER"
        ? "NVIDIA_QUESTION_ROUTER+DATE_BRIDGE"
        : "DETERMINISTIC_R33+DATE_BRIDGE",
  };
}


async function primaryUpdateHistoryPath(question, analysis, deadline) {
  if (!(analysis.update || analysis.date || /^UPDATE_/.test(analysis.intent || ""))) {
    return {
      result: null,
      pages: [],
      errors: [],
      route: "NOT_UPDATE_MODE",
      analysis,
    };
  }

  const pages = [];
  const errors = [];
  const tried = new Set();
  let working = { ...analysis };
  let bridgedUpdate = null;

  async function get(url) {
    if (!url || tried.has(url) || timeLeft(deadline) < 220) return null;
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

  // If we already know the update number, machine lookup can be solved immediately.
  if (working.relation === REL.MACHINE && working.update) {
    const machines = await get(`${PRIMARY_ORIGIN}/machines`);

    if (machines) {
      const context = contextAroundUpdate(machines.text, working, 2200);
      const answer = extractUpdateTypedAnswer(context, working);

      if (answer) {
        return {
          result: makeResult(
            answer,
            working.relation,
            SOURCE.PRIMARY,
            machines,
            "SPLUS_UPDATE_MACHINE_CONTEXT",
            0.995
          ),
          pages,
          errors,
          route: "UPDATE_MACHINE_SPLUS",
          analysis: working,
          bridgedUpdate,
        };
      }
    }
  }

  const events = await get(`${PRIMARY_ORIGIN}/events`);

  if (!events) {
    return {
      result: null,
      pages,
      errors,
      route: "UPDATE_EVENTS_FETCH_FAILED",
      analysis: working,
      bridgedUpdate,
    };
  }

  // =====================================================
  // NEW R26 BRIDGE:
  // Date -> exact S+ event card/detail -> Update N -> typed fact.
  // =====================================================
  let bridgedLink = null;

  if (working.date && !working.update) {
    const bridge = resolveUpdateNumberFromEventHub(events, working);
    bridgedLink = bridge.link;

    if (bridge.update) {
      bridgedUpdate = bridge.update;
      working = withBridgedUpdate(working, bridge.update);
    } else if (bridge.link && timeLeft(deadline) > 260) {
      // Sometimes the hub card has the date but the Update number is only
      // on the event detail page.
      const detail = await get(bridge.link.url);

      if (detail) {
        const updateFromDetail =
          extractUpdateNumberFromText(detail.text) ||
          extractUpdateNumberFromText(detail.title);

        if (updateFromDetail) {
          bridgedUpdate = updateFromDetail;
          working = withBridgedUpdate(working, updateFromDetail);
        }

        // Even without an explicit update number, the exact dated event detail
        // can directly contain the requested typed answer.
        const detailAnswer = extractUpdateTypedAnswer(detail.text, working);

        if (detailAnswer) {
          return {
            result: makeResult(
              detailAnswer,
              working.relation,
              SOURCE.PRIMARY,
              detail,
              "SPLUS_DATE_EVENT_DETAIL",
              0.995
            ),
            pages,
            errors,
            route: "DATE_EVENT_DETAIL_SPLUS",
            analysis: working,
            bridgedUpdate,
          };
        }
      }
    }
  }

  // If the user directly asks "What update happened on DATE?",
  // the bridge itself is the final fact.
  if (working.relation === REL.UPDATE && working.update) {
    return {
      result: makeResult(
        `Update${working.update}`,
        REL.UPDATE,
        SOURCE.PRIMARY,
        events,
        "SPLUS_DATE_TO_UPDATE",
        0.995
      ),
      pages,
      errors,
      route: "DATE_TO_UPDATE_SPLUS",
      analysis: working,
      bridgedUpdate,
    };
  }

  // After date -> update resolution, retry a typed machine lookup using
  // the canonical /machines page. This fixes e.g. Aug 8 2026 -> Update61 -> RNG Machine.
  if (working.relation === REL.MACHINE && working.update && timeLeft(deadline) > 240) {
    const machines = await get(`${PRIMARY_ORIGIN}/machines`);

    if (machines) {
      const context = contextAroundUpdate(machines.text, working, 2200);
      const answer = extractUpdateTypedAnswer(context, working);

      if (answer) {
        return {
          result: makeResult(
            answer,
            working.relation,
            SOURCE.PRIMARY,
            machines,
            "SPLUS_DATE_BRIDGED_MACHINE",
            0.995
          ),
          pages,
          errors,
          route: "DATE_UPDATE_MACHINE_SPLUS",
          analysis: working,
          bridgedUpdate,
        };
      }
    }
  }

  // Try the exact hub context around Update N or the date.
  const hubContext = contextAroundUpdate(events.text, working, 2400);
  const hubAnswer = extractUpdateTypedAnswer(hubContext, working);

  if (hubAnswer) {
    return {
      result: makeResult(
        hubAnswer,
        working.relation,
        SOURCE.PRIMARY,
        events,
        working.date && bridgedUpdate
          ? "SPLUS_DATE_BRIDGED_HUB_CONTEXT"
          : "SPLUS_UPDATE_HUB_CONTEXT",
        0.995
      ),
      pages,
      errors,
      route:
        working.date && bridgedUpdate
          ? "DATE_UPDATE_HUB_SPLUS"
          : "UPDATE_HUB_SPLUS",
      analysis: working,
      bridgedUpdate,
    };
  }

  // Find/follow the exact event card after bridging.
  const links = primaryEventContextLinks(events)
    .map((link) => ({
      ...link,
      score: updateNeedleScore(
        `${link.label} ${link.context} ${link.pathname}`,
        working
      ),
    }))
    .sort((a, b) => b.score - a.score);

  const best =
    (bridgedLink && links.find((x) => x.url === bridgedLink.url)) ||
    links[0];

  if (best && best.score >= 6 && timeLeft(deadline) > 220) {
    const detail = await get(best.url);

    if (detail) {
      const context =
        contextAroundUpdate(detail.text, working, 4200) ||
        detail.text;

      // If bridge was still missing, detail page gets one final chance.
      if (working.date && !working.update) {
        const updateFromDetail =
          extractUpdateNumberFromText(detail.text) ||
          extractUpdateNumberFromText(detail.title);

        if (updateFromDetail) {
          bridgedUpdate = updateFromDetail;
          working = withBridgedUpdate(working, updateFromDetail);

          if (working.relation === REL.UPDATE) {
            return {
              result: makeResult(
                `Update${working.update}`,
                REL.UPDATE,
                SOURCE.PRIMARY,
                detail,
                "SPLUS_DATE_TO_UPDATE_DETAIL",
                0.995
              ),
              pages,
              errors,
              route: "DATE_TO_UPDATE_DETAIL_SPLUS",
              analysis: working,
              bridgedUpdate,
            };
          }
        }
      }

      const answer = extractUpdateTypedAnswer(context, working);

      if (answer) {
        return {
          result: makeResult(
            answer,
            working.relation,
            SOURCE.PRIMARY,
            detail,
            working.date && bridgedUpdate
              ? "SPLUS_DATE_BRIDGED_DETAIL_CONTEXT"
              : "SPLUS_UPDATE_DETAIL_CONTEXT",
            0.995
          ),
          pages,
          errors,
          route:
            working.date && bridgedUpdate
              ? "DATE_UPDATE_DETAIL_SPLUS"
              : "UPDATE_DETAIL_SPLUS",
          analysis: working,
          bridgedUpdate,
        };
      }

      // Broad "What did Update N add?" uses AI ONLY to extract from S+ evidence.
      if (
        working.relation === REL.UPDATE &&
        env("NVIDIA_API_KEY") &&
        timeLeft(deadline) > 320
      ) {
        try {
          const data = await fetchJson(
            "NVIDIA_UPDATE_EXTRACT",
            NVIDIA_URL,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${env("NVIDIA_API_KEY")}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
                stream: false,
                temperature: 0,
                max_tokens: 120,
                chat_template_kwargs: { enable_thinking: false },
                messages: [
                  {
                    role: "system",
                    content: [
                      "Extract the answer ONLY from the supplied Steal-a-Brainrot.org evidence.",
                      "Do not use outside knowledge.",
                      "The user asks what the specified update added.",
                      "Return a short comma-separated list of the major additions explicitly present in the evidence.",
                      'Return JSON only: {"answer":"UNKNOWN or concise list"}',
                    ].join("\n"),
                  },
                  {
                    role: "user",
                    content: JSON.stringify({
                      question,
                      update: working.update,
                      date: working.date,
                      evidence: oneLine(detail.text, 10000),
                    }),
                  },
                ],
              }),
            },
            Math.max(
              250,
              Math.min(
                CFG.NVIDIA_TIMEOUT_MS,
                timeLeft(deadline) - 30
              )
            )
          );

          const raw = parseModelJson(
            data?.choices?.[0]?.message?.content
          );

          const summary = oneLine(raw?.answer, 300);

          if (summary && norm(summary) !== "unknown") {
            return {
              result: makeResult(
                summary,
                REL.UPDATE,
                SOURCE.PRIMARY,
                detail,
                "SPLUS_UPDATE_AI_EXTRACTED_FROM_PRIMARY",
                0.995
              ),
              pages,
              errors,
              route: "UPDATE_SUMMARY_SPLUS",
              analysis: working,
              bridgedUpdate,
            };
          }
        } catch (error) {
          errors.push(`UPDATE_EXTRACT:${errorCode(error)}`);
        }
      }
    }
  }

  return {
    result: null,
    pages,
    errors,
    route:
      working.date && !working.update
        ? "DATE_BRIDGE_MISS"
        : "UPDATE_SPLUS_MISS",
    analysis: working,
    bridgedUpdate,
  };
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
    const data = await fetchJson("FANDOM_SEARCH", `${FANDOM_API}?${params.toString()}`, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 ChromeCodeSniper-R33" } }, Math.min(CFG.FANDOM_TIMEOUT_MS, left - 20));
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
  const data = await fetchJson("FANDOM_PARSE", fandomParseUrl(title), { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 ChromeCodeSniper-R33" } }, Math.min(CFG.FANDOM_TIMEOUT_MS, left - 20));
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


const ALLOWED_RELATIONS = new Set(Object.values(REL));

function normalizeAiDate(value) {
  const raw = oneLine(value, 80);
  if (!raw) return null;

  if (/^20\d{2}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parsed = extractExplicitDate(raw);
  return parsed || null;
}

function mergeAnalysis(ai, fallback) {
  if (!ai) return fallback;

  const relation = ALLOWED_RELATIONS.has(String(ai.relation || "").toUpperCase())
    ? String(ai.relation).toUpperCase()
    : fallback.relation;

  const entity = oneLine(ai.entity, 180) || fallback.entity || null;
  const aliases = Array.isArray(ai.aliases)
    ? ai.aliases.map((x) => oneLine(x, 180)).filter(Boolean).slice(0, 8)
    : [];

  const entities = [...new Set([
    entity,
    ...aliases,
    ...(fallback.entities || []),
  ].filter(Boolean))].slice(0, 16);

  const updateNum = Number(ai.update);
  const rebirthNum = Number(ai.rebirth);
  const activeFromNum = Number(ai.activeFrom);
  const activeToNum = Number(ai.activeTo);
  const replacedInNum = Number(ai.replacedIn);
  const updateNumbers = Array.isArray(ai.updateNumbers)
    ? ai.updateNumbers.map(Number).filter((n) => Number.isFinite(n) && n > 0).slice(0, 8)
    : (fallback.updateNumbers || []);

  return {
    entity,
    entities,
    relation,
    rebirth: Number.isFinite(rebirthNum) && rebirthNum > 0 ? rebirthNum : fallback.rebirth,
    update: Number.isFinite(updateNum) && updateNum > 0 ? updateNum : fallback.update,
    updateNumbers,
    activeFrom: Number.isFinite(activeFromNum) && activeFromNum > 0 ? activeFromNum : fallback.activeFrom,
    activeTo: Number.isFinite(activeToNum) && activeToNum > 0 ? activeToNum : fallback.activeTo,
    replacedIn: Number.isFinite(replacedInNum) && replacedInNum > 0 ? replacedInNum : fallback.replacedIn,
    date: normalizeAiDate(ai.date) || fallback.date || null,
    current: typeof ai.current === "boolean" ? ai.current : fallback.current,
    intent: oneLine(ai.intent, 80) || fallback.intent,
    wanted: oneLine(ai.wanted, 80) || relation,
    wantedRelations: normalizedWantedRelations(ai.wantedRelations, relation),
    rawQuestion: fallback.rawQuestion || "",
    source: "NVIDIA_QUESTION_ROUTER",
  };
}



function detectWantedRelations(question, primaryRelation) {
  const q = oneLine(question, 700).toLowerCase();
  const wanted = [];

  const add = (relation) => {
    if (relation && ALLOWED_RELATIONS.has(relation) && !wanted.includes(relation)) {
      wanted.push(relation);
    }
  };

  add(primaryRelation);

  // Explicit multi-part: frequency + update.
  if (
    /\b(?:how often|how frequently|frequency|interval|recurr?ence)\b/.test(q) &&
    /\b(?:what|which)\s+update\b|\bupdate\s+(?:was|is|did|it)\b|\btied to\b|\bassociated with\b/.test(q)
  ) {
    add(REL.FREQUENCY);
    add(REL.UPDATE);
  }

  // Other obvious two-part shapes we can support without hurting singles.
  if (
    /\b(?:what|which)\s+update\b/.test(q) &&
    /\b(?:machine|rebirth|ritual|mutation|brainrot|item|gear)\b/.test(q)
  ) {
    if (/\bmachine\b/.test(q)) add(REL.MACHINE);
    if (/\brebirth\b/.test(q)) add(REL.REBIRTH);
    if (/\britual\b/.test(q) && /\b(?:result|outcome|spawn|reward)\b/.test(q)) add(REL.OUTCOME);
    if (/\bmutation\b/.test(q)) add(REL.MUTATION);
    if (/\bbrainrot\b|\bbrain rot\b/.test(q)) add(REL.BRAINROT);
    if (/\b(?:item|gear)\b/.test(q)) add(REL.GEAR);
    add(REL.UPDATE);
  }

  return wanted;
}

function normalizedWantedRelations(value, fallbackRelation) {
  const out = [];
  const add = (relation) => {
    relation = String(relation || "").toUpperCase();
    if (ALLOWED_RELATIONS.has(relation) && !out.includes(relation)) out.push(relation);
  };

  if (Array.isArray(value)) {
    for (const relation of value) add(relation);
  }

  add(fallbackRelation);
  return out;
}

function isMultipartAnalysis(analysis) {
  return Array.isArray(analysis?.wantedRelations) && analysis.wantedRelations.length > 1;
}

function enforceQuestionSemantics(question, analysis) {
  const q = oneLine(question, 700).toLowerCase();
  const next = { ...analysis, rawQuestion: oneLine(question, 700) };

  // Ritual result wording is an OUTCOME family, not a percentage property.
  if (
    /\b(?:result|outcome)\b/.test(q) &&
    /\britual\b/.test(q)
  ) {
    next.relation = REL.OUTCOME;
    next.wanted = REL.OUTCOME;
  }

  if (/\b(?:how often|how frequently|what interval|frequency|recurr?ence)\b/.test(q)) {
    next.relation = REL.FREQUENCY;
    next.wanted = REL.FREQUENCY;
  }

  // A range/lifecycle question that asks WHICH MACHINE still wants the machine name.
  // Because the machine is the unknown answer, do not quote a guessed entity.
  if (/\b(?:what|which)\s+machine\b/.test(q)) {
    next.relation = REL.MACHINE;
    next.wanted = REL.MACHINE;
    next.entity = null;
    next.entities = [];
  }

  // Stable named anchors improve deterministic fallback if NVIDIA routing is unavailable.
  if (q.includes("queen bee")) {
    next.entity = "Queen Bee";
    next.entities = ["Queen Bee", ...(next.entities || []).filter((x) => norm(x) !== norm("Queen Bee"))];
  }
  if (q.includes("job job job sahur")) {
    next.entity = "Job Job Job Sahur";
    next.entities = ["Job Job Job Sahur", ...(next.entities || []).filter((x) => norm(x) !== norm("Job Job Job Sahur"))];
  }

  // Reverse identification: "Which Secret brainrot ... costs $27.5B?"
  // The requested answer is the brainrot/entity, not the COST value.
  if (
    /\b(?:what|which)\b/.test(q) &&
    /\bbrain\s*rot\b|\bbrainrot\b/.test(q) &&
    /\b(?:cost|price|income|machine|event|update|rarity|secret)\b/.test(q)
  ) {
    next.relation = REL.BRAINROT;
    next.wanted = REL.BRAINROT;
  }

  // Same idea for mutation reverse-identification questions.
  if (
    /\b(?:what|which)\b/.test(q) &&
    /\bmutation\b/.test(q) &&
    /\b\d+(?:\.\d+)?\s*[x×]\b/.test(q)
  ) {
    next.relation = REL.MUTATION;
    next.wanted = REL.MUTATION;
  }

  next.wantedRelations = detectWantedRelations(question, next.relation);
  return next;
}

async function analyzeQuestionAI(question, deadline) {
  const fallback = analyzeQuestion(question);

  if (!env("NVIDIA_API_KEY") || timeLeft(deadline) < 250) {
    return { analysis: applyFactSlots(question, enforceQuestionSemantics(question, fallback)), aiError: "NVIDIA_ANALYZER_UNAVAILABLE" };
  }

  try {
    const timeout = Math.max(
      250,
      Math.min(
        CFG.NVIDIA_ANALYZE_TIMEOUT_MS,
        timeLeft(deadline) - 40
      )
    );

    const data = await fetchJson(
      "NVIDIA_ANALYZE",
      NVIDIA_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env("NVIDIA_API_KEY")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
          stream: false,
          temperature: 0,
          max_tokens: 180,
          chat_template_kwargs: { enable_thinking: false },
          messages: [
            {
              role: "system",
              content: [
                "You are ONLY a question router for the Roblox game Steal a Brainrot.",
                "Do NOT answer the trivia question.",
                "Convert the user's question into structured lookup intent.",
                `relation MUST be one of: ${[...ALLOWED_RELATIONS].join(", ")}.`,
                "intent should usually be ENTITY_FACT, UPDATE_FACT, UPDATE_SUMMARY, CURRENT_FACT, or DATE_UPDATE_FACT.",
                "wanted is the primary fact requested.",
                "wantedRelations is an array of every distinct fact type explicitly requested. For a normal single-part question it has one entry.",
                "slots is optional structured semantics. Use unique slot ids when the question asks multiple facts or repeated facts with different qualifiers.",
                "A slot may contain id, relation, answerType, subject, predicate, qualifier, anchorUpdate.",
                "Example: 'How often did the Queen Bee event occur, and what update was it tied to?' => relation=FREQUENCY, wantedRelations=[FREQUENCY,UPDATE].",
                "For questions like 'What machine was added in Update 61?', set update=61, relation=MACHINE, wanted=MACHINE.",
                "For questions like 'What rebirth was added in the August 15, 2026 update?', set date=2026-08-15, relation=REBIRTH, wanted=REBIRTH.",
                "For 'What did Update 62 add?', set update=62, relation=UPDATE, wanted=UPDATE, intent=UPDATE_SUMMARY.",
                "Use canonical entity names when obvious, but never invent facts.",
                'Return JSON only: {"intent":"...","entity":null,"aliases":[],"relation":"...","wanted":"...","wantedRelations":["..."],"slots":[],"update":null,"updateNumbers":[],"activeFrom":null,"activeTo":null,"replacedIn":null,"rebirth":null,"date":null,"current":false}',
              ].join("\n"),
            },
            {
              role: "user",
              content: question,
            },
          ],
        }),
      },
      timeout
    );

    const raw = parseModelJson(data?.choices?.[0]?.message?.content);
    return {
      analysis: applyFactSlots(question, enforceQuestionSemantics(question, mergeAnalysis(raw, fallback))),
      aiError: null,
    };
  } catch (error) {
    return {
      analysis: applyFactSlots(question, enforceQuestionSemantics(question, fallback)),
      aiError: errorCode(error),
    };
  }
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



function searchCluesFromQuestion(question) {
  const q = oneLine(question, 700);
  const clues = [];

  for (const m of q.matchAll(/\$\s*\d+(?:\.\d+)?\s*[KMBTQ]?/gi)) {
    clues.push(m[0].replace(/\s+/g, ""));
  }

  for (const m of q.matchAll(/\b\d+(?:\.\d+)?\s*%/g)) {
    clues.push(m[0].replace(/\s+/g, ""));
  }

  for (const phrase of [
    "RNG Machine",
    "Job Job Job Sahur",
    "Secret",
    "Crystal",
    "Rainbow",
    "ritual",
  ]) {
    if (q.toLowerCase().includes(phrase.toLowerCase())) clues.push(phrase);
  }

  return [...new Set(clues)].slice(0, 10);
}

function normalizedClue(value) {
  return oneLine(value, 200)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/,/g, "");
}

function pageHasClue(text, clue) {
  const hay = normalizedClue(text);
  const needle = normalizedClue(clue);
  return Boolean(needle && hay.includes(needle));
}

function clueCoverage(question, text) {
  const clues = searchCluesFromQuestion(question);
  if (!clues.length) return { matched: 0, total: 0, ratio: 1, clues: [] };

  let matched = 0;
  for (const clue of clues) {
    if (pageHasClue(text, clue)) matched++;
  }

  return {
    matched,
    total: clues.length,
    ratio: clues.length ? matched / clues.length : 1,
    clues,
  };
}

function trimChanceCandidate(value) {
  let v = oneLine(value, 160)
    .replace(/^Image:\s*/i, "")
    .replace(/^(?:or|and)\s+/i, "")
    .replace(/\bwith\s+(?:an?\s+)?\d+(?:\.\d+)?\s*%\s*(?:outcome\s+)?chance.*$/i, "")
    .replace(/\b(?:outcome|chance|result)\b.*$/i, "")
    .trim();

  // Remove common heading noise if it leaked in.
  v = v.replace(/^(?:Brainrot Spawn|Expected Results|Outcome Odds)\s*/i, "").trim();
  return v;
}

function extractChanceResultFromPage(question, page) {
  const q = oneLine(question, 700);
  const chance = q.match(/\b(\d+(?:\.\d+)?)\s*%/);
  if (!chance) return null;

  const pct = chance[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const raw = String(page?.text || "");

  const patterns = [
    new RegExp(`(?:Image:\\s*)?([A-Z][A-Za-z0-9' -]{2,90}?)\\s+with\\s+(?:an?\\s+)?${pct}\\s*%\\s*(?:outcome\\s+)?chance`, "i"),
    new RegExp(`([A-Z][A-Za-z0-9' -]{2,90}?)\\s+${pct}\\s*%`, "i"),
    new RegExp(`${pct}\\s*%[^A-Za-z0-9]{0,30}([A-Z][A-Za-z0-9' -]{2,90})`, "i"),
  ];

  for (const pattern of patterns) {
    const m = raw.match(pattern);
    if (!m?.[1]) continue;

    const candidate = trimChanceCandidate(m[1]);
    if (
      candidate &&
      candidate.length >= 2 &&
      !/^(?:Variable|Success Rate|Potential Rewards)$/i.test(candidate)
    ) {
      return candidate;
    }
  }

  return null;
}

function deterministicHighValueExactPage(question, analysis, page, source) {
  if (!page || !page.text) return null;

  const coverage = clueCoverage(question, page.text);

  // Reverse identify a brainrot from its properties.
  if (
    analysis.relation === REL.BRAINROT &&
    /\/brainrots\/[^/?#]+/i.test(page.url || "") &&
    coverage.ratio >= 0.60
  ) {
    const title = oneLine(page.title, 160)
      .replace(/\s*[-|]\s*(?:Secret Brainrot Character.*|Steal a Brainrot.*)$/i, "")
      .trim();

    if (title) {
      return makeResult(
        title,
        REL.BRAINROT,
        source,
        page,
        `${source.key}_REVERSE_ENTITY_EXACT_PAGE`,
        source.confidence
      );
    }
  }

  // Chance-based ritual result: "rare 1% result" -> exact brainrot name.
  if (
    [REL.SPAWN, REL.OUTCOME, REL.REWARD, REL.BRAINROT].includes(analysis.relation) &&
    /\b\d+(?:\.\d+)?\s*%/.test(question) &&
    /\britual\b/i.test(question)
  ) {
    const candidate = extractChanceResultFromPage(question, page);
    if (candidate) {
      return makeResult(
        candidate,
        analysis.relation === REL.BRAINROT ? REL.BRAINROT : (analysis.relation === REL.OUTCOME ? REL.OUTCOME : REL.SPAWN),
        source,
        page,
        `${source.key}_CHANCE_RESULT_EXACT_PAGE`,
        source.confidence
      );
    }
  }

  return null;
}

function parseLooseAiExtraction(content) {
  const rawText = String(content ?? "").trim();
  if (!rawText) throw new Error("NVIDIA_EMPTY_CONTENT");

  try {
    const parsed = parseModelJson(rawText);
    if (parsed && typeof parsed === "object") {
      return {
        answer:
          parsed.answer ??
          parsed.result ??
          parsed.value ??
          parsed.name ??
          "UNKNOWN",
        evidence:
          parsed.evidence ??
          parsed.quote ??
          parsed.support ??
          "",
        reason: parsed.reason ?? "json",
      };
    }
  } catch {}

  // NVIDIA occasionally returns only the raw value even when asked for JSON.
  // That is okay only because the answer still has to be verified against the
  // ONE opened source page below.
  const stripped = rawText
    .replace(/^```(?:json|text)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/^(?:answer|output|result)\s*:\s*/i, "")
    .trim();

  if (
    stripped &&
    stripped.length <= 220 &&
    !/^[\[{]/.test(stripped) &&
    !/\b(?:because|therefore|i think|i cannot|not enough information)\b/i.test(stripped)
  ) {
    return {
      answer: stripped,
      evidence: "",
      reason: "raw_single_value",
    };
  }

  throw new Error("NVIDIA_INVALID_AI_OUTPUT");
}


function expectedPrimaryFamilies(question, analysis) {
  const q = oneLine(question, 700).toLowerCase();
  const rel = analysis.relation;
  const out = [];

  const add = (...items) => {
    for (const item of items) {
      if (item && !out.includes(item)) out.push(item);
    }
  };

  if ([REL.COST, REL.INCOME, REL.RARITY, REL.BRAINROT, REL.METHOD, REL.STATUS].includes(rel)) {
    add("/brainrots/");
  }

  if ([REL.SPAWN, REL.OUTCOME, REL.REQUIREMENT, REL.FORMATION, REL.RITUAL, REL.REWARD].includes(rel) || /\britual\b/.test(q)) {
    add("/rituals/");
    if (analysis.update || analysis.date) add("/events/");
  }

  if ([REL.MUTATION, REL.MULTIPLIER, REL.TRAIT].includes(rel) || /\bmutation\b|\btrait\b/.test(q)) {
    add("/wiki/mutations");
    add("/events/");
  }

  if ([REL.REBIRTH, REL.GEAR].includes(rel) || /\brebirth\b/.test(q)) {
    add("/wiki/rebirth");
    add("/events/");
  }

  if ([REL.MACHINE, REL.ACTIVE_RANGE, REL.REPLACED_BY, REL.REPLACED_IN].includes(rel) || /\bmachine\b/.test(q)) {
    add("/machines");
    add("/events/");
  }

  if (rel === REL.FREQUENCY) {
    add("/events/");
    add("/machines");
  }

  if ([REL.UPDATE, REL.EVENT, REL.DATE].includes(rel) || analysis.update || analysis.date) {
    add("/events/");
  }

  if (rel === REL.CONTENTS || /\blucky block\b/.test(q)) {
    add("/lucky-blocks");
  }

  if (rel === REL.COLLECTION) add("/collections");

  return out;
}

function resultPathname(row) {
  try {
    return new URL(row?.url || "").pathname.toLowerCase();
  } catch {
    return "";
  }
}

function primaryFamilyScore(row, question, analysis) {
  const path = resultPathname(row);
  const families = expectedPrimaryFamilies(question, analysis);

  if (!families.length) return { allowed: true, score: 0, family: "ANY" };

  for (let i = 0; i < families.length; i++) {
    const family = families[i].toLowerCase();
    if (path.startsWith(family) || path === family.replace(/\/$/, "")) {
      return {
        allowed: true,
        score: Math.max(1, 4 - i),
        family,
      };
    }
  }

  return {
    allowed: false,
    score: -12,
    family: "WRONG_FAMILY",
  };
}

function importantQuestionClues(question, analysis) {
  const q = oneLine(question, 700);
  const clues = [];

  // Structured values are hard clues.
  for (const m of q.matchAll(/\$\s*\d+(?:\.\d+)?\s*[KMBTQ]?/gi)) {
    clues.push({ value: m[0].replace(/\s+/g, ""), weight: 4, kind: "money" });
  }
  for (const m of q.matchAll(/\b\d+(?:\.\d+)?\s*%/g)) {
    clues.push({ value: m[0].replace(/\s+/g, ""), weight: 5, kind: "percent" });
  }
  for (const m of q.matchAll(/\b\d+(?:\.\d+)?\s*[x×]\b/gi)) {
    clues.push({ value: m[0].replace(/\s+/g, ""), weight: 4, kind: "multiplier" });
  }

  if (analysis.update) clues.push({ value: `Update ${analysis.update}`, weight: 5, kind: "update" });
  if (analysis.activeFrom) clues.push({ value: `Update ${analysis.activeFrom}`, weight: 3, kind: "lifecycle" });
  if (analysis.activeTo) clues.push({ value: `Update ${analysis.activeTo}`, weight: 2, kind: "lifecycle" });
  if (analysis.replacedIn) clues.push({ value: `Update ${analysis.replacedIn}`, weight: 5, kind: "lifecycle" });
  if (analysis.date) clues.push({ value: humanDateFromIso(analysis.date), weight: 5, kind: "date" });

  // Named relation anchors.
  const anchors = [
    ["Job Job Job Sahur", 5],
    ["RNG Machine", 4],
    ["Queen Bee", 5],
    ["Rainbow", 3],
    ["Crystal", 3],
    ["ritual", 2],
    ["mutation", 2],
    ["rebirth", 2],
    ["machine", 2],
    ["Secret", 2],
  ];

  for (const [value, weight] of anchors) {
    if (q.toLowerCase().includes(value.toLowerCase())) {
      clues.push({ value, weight, kind: "anchor" });
    }
  }

  // Preserve AI/deterministic entity if it looks useful.
  if (analysis.entity && String(analysis.entity).length >= 4) {
    clues.push({ value: oneLine(analysis.entity, 180), weight: 5, kind: "entity" });
  }

  const dedup = new Map();
  for (const clue of clues) {
    const key = normalizedClue(clue.value);
    if (!key) continue;
    const existing = dedup.get(key);
    if (!existing || existing.weight < clue.weight) dedup.set(key, clue);
  }

  return [...dedup.values()].slice(0, 14);
}

function weightedClueCoverage(question, analysis, text) {
  const clues = importantQuestionClues(question, analysis);
  if (!clues.length) {
    return { matchedWeight: 0, totalWeight: 0, ratio: 1, matched: [], missing: [] };
  }

  let matchedWeight = 0;
  let totalWeight = 0;
  const matched = [];
  const missing = [];

  for (const clue of clues) {
    totalWeight += clue.weight;
    if (pageHasClue(text, clue.value)) {
      matchedWeight += clue.weight;
      matched.push(clue.value);
    } else {
      missing.push(clue.value);
    }
  }

  return {
    matchedWeight,
    totalWeight,
    ratio: totalWeight ? matchedWeight / totalWeight : 1,
    matched,
    missing,
  };
}

function snippetEligibility(row, question, analysis, source) {
  if (!row || row.host !== source.host) {
    return { eligible: false, reason: "WRONG_HOST", score: -999 };
  }

  let score = scoreExactSearchResult(row, analysis, source);
  const combined = `${row.title}\n${row.url}\n${row.content}`;

  if (source === SOURCE.PRIMARY) {
    const family = primaryFamilyScore(row, question, analysis);
    if (!family.allowed) {
      return {
        eligible: false,
        reason: "WRONG_PAGE_FAMILY",
        score: score + family.score,
      };
    }
    score += family.score;
  }

  const coverage = weightedClueCoverage(question, analysis, combined);
  score += coverage.ratio * 5;

  // Numeric/date/update clues should not be ignored if present in the question.
  const hardClues = importantQuestionClues(question, analysis)
    .filter((x) => ["money", "percent", "multiplier", "update", "date", "lifecycle"].includes(x.kind));

  if (hardClues.length) {
    const hardMatched = hardClues.filter((x) => pageHasClue(combined, x.value));
    if (!hardMatched.length) {
      score -= 5;
    }
  }

  return {
    eligible: score >= 2,
    reason: score >= 2 ? "ELIGIBLE" : "WEAK_SNIPPET_MATCH",
    score,
    coverage,
  };
}

function rankEligibleResults(search, question, analysis, source, limit = 2) {
  return (search?.results || [])
    .filter((row) => row.host === source.host)
    .map((row) => ({
      ...row,
      eligibility: snippetEligibility(row, question, analysis, source),
    }))
    .filter((row) => row.eligibility.eligible)
    .sort((a, b) => b.eligibility.score - a.eligibility.score)
    .slice(0, Math.max(1, limit));
}

function pageEligibility(question, analysis, page, source) {
  if (!page?.text) {
    return { eligible: false, reason: "EMPTY_PAGE", coverage: null };
  }

  if (source === SOURCE.PRIMARY) {
    const fakeRow = { url: page.url, host: source.host };
    const family = primaryFamilyScore(fakeRow, question, analysis);
    if (!family.allowed) {
      return {
        eligible: false,
        reason: "WRONG_PAGE_FAMILY",
        coverage: null,
      };
    }
  }

  const coverage = weightedClueCoverage(question, analysis, page.text);

  const hardClues = importantQuestionClues(question, analysis)
    .filter((x) => ["money", "percent", "multiplier", "update", "date", "lifecycle"].includes(x.kind));

  const hardMatched = hardClues.filter((x) => pageHasClue(page.text, x.value));

  // If the question supplied a concrete numeric/date/update clue, the opened
  // page must contain at least one of those hard clues.
  if (hardClues.length && !hardMatched.length) {
    return {
      eligible: false,
      reason: "HARD_CLUE_MISSING",
      coverage,
    };
  }

  // Entity / named-anchor questions need meaningful clue overlap.
  if (coverage.totalWeight >= 7 && coverage.ratio < 0.30) {
    return {
      eligible: false,
      reason: "QUESTION_CLUES_MISSING",
      coverage,
    };
  }

  return {
    eligible: true,
    reason: "PAGE_ELIGIBLE",
    coverage,
  };
}

function contextsAroundClues(question, analysis, text, radius = 420) {
  const raw = String(text || "");
  const clues = importantQuestionClues(question, analysis);
  const windows = [];
  const seen = new Set();

  for (const clue of clues) {
    const needle = oneLine(clue.value, 180);
    if (!needle) continue;

    const lowerRaw = raw.toLowerCase();
    const lowerNeedle = needle.toLowerCase();
    let from = 0;

    while (from < raw.length) {
      const idx = lowerRaw.indexOf(lowerNeedle, from);
      if (idx < 0) break;

      const start = Math.max(0, idx - radius);
      const end = Math.min(raw.length, idx + needle.length + radius);
      const chunk = clean(raw.slice(start, end), radius * 2 + needle.length);

      const key = norm(chunk);
      if (chunk && key && !seen.has(key)) {
        seen.add(key);
        windows.push({
          clue: needle,
          weight: clue.weight,
          text: chunk,
        });
      }

      from = idx + Math.max(1, needle.length);
      if (windows.length >= 12) break;
    }
    if (windows.length >= 12) break;
  }

  return windows.sort((a, b) => b.weight - a.weight);
}

function answerLooksLikeMetadata(answer) {
  const a = oneLine(answer, 500);
  if (!a) return true;

  if (/^https?:\/\//i.test(a)) return true;
  if (/^[0-9a-f]{32,64}$/i.test(a)) return true;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(a)) return true;
  if (/^[\[{]/.test(a)) return true;
  if (/\b(?:request[_ -]?id|trace[_ -]?id|cache[_ -]?key|source[_ -]?id)\b/i.test(a)) return true;

  return false;
}

function genericRolePhrase(answer) {
  const a = oneLine(answer, 300).toLowerCase();

  return /\b(?:developer|producer|creator|administrator|moderator|game owner|roblox user|content creator|person|people)\b/.test(a);
}

function answerTypeValid(question, analysis, answer, page) {
  const value = oneLine(answer, 500);
  if (!value || norm(value) === "unknown" || answerLooksLikeMetadata(value)) {
    return { valid: false, reason: "UNSAFE_OR_EMPTY_ANSWER" };
  }

  const rel = analysis.relation;

  if (rel === REL.REBIRTH && !/^Rebirth\s*\d+$/i.test(value.replace(/\s+/g, ""))) {
    return { valid: false, reason: "EXPECTED_REBIRTH" };
  }

  if (rel === REL.MULTIPLIER && !/\b\d+(?:\.\d+)?\s*[x×]\b/i.test(value)) {
    return { valid: false, reason: "EXPECTED_MULTIPLIER" };
  }

  if (rel === REL.DROP_RATE && !/\b\d+(?:\.\d+)?\s*%/.test(value)) {
    return { valid: false, reason: "EXPECTED_PERCENTAGE" };
  }

  if (rel === REL.FREQUENCY && !/\b(?:every\s+\w+|every\s+\d+|hour|hours|minute|minutes|daily|weekly|once|twice)\b/i.test(value)) {
    return { valid: false, reason: "EXPECTED_FREQUENCY" };
  }

  if (rel === REL.REPLACED_IN && !/\bUpdate\s*\d+(?:\.\d+)?\b/i.test(value)) {
    return { valid: false, reason: "EXPECTED_UPDATE" };
  }

  if (rel === REL.ACTIVE_RANGE && !/\bUpdate\s*\d+/i.test(value)) {
    return { valid: false, reason: "EXPECTED_UPDATE_RANGE" };
  }

  if ([REL.BRAINROT, REL.SPAWN, REL.OUTCOME, REL.REWARD, REL.MUTATION, REL.TRAIT, REL.GEAR, REL.MACHINE, REL.REPLACED_BY].includes(rel)) {
    if (genericRolePhrase(value)) {
      return { valid: false, reason: "GENERIC_ROLE_PHRASE" };
    }

    if (value.length > 140 || value.split(/\s+/).length > 12) {
      return { valid: false, reason: "ENTITY_ANSWER_TOO_LONG" };
    }
  }

  // The answer must appear somewhere on the one opened page.
  if (!evidenceSupports(value, page?.text || "")) {
    // Page title is allowed for reverse entity identification.
    if (!(rel === REL.BRAINROT && similarity(value, page?.title || "") >= 0.82)) {
      return { valid: false, reason: "ANSWER_NOT_ON_PAGE" };
    }
  }

  return { valid: true, reason: "TYPE_OK" };
}

function answerNearRelevantClue(question, analysis, answer, page) {
  const value = oneLine(answer, 500);
  const windows = contextsAroundClues(question, analysis, page?.text || "", 520);

  // Direct entity-page title is strong support for reverse identification.
  if (
    analysis.relation === REL.BRAINROT &&
    similarity(value, page?.title || "") >= 0.82
  ) {
    return true;
  }

  if (!windows.length) {
    return evidenceSupports(value, page?.text || "");
  }

  return windows.some((w) => evidenceSupports(value, w.text));
}

function validateFinalPageAnswer(question, analysis, answer, page) {
  const type = answerTypeValid(question, analysis, answer, page);
  if (!type.valid) return type;

  if (!answerNearRelevantClue(question, analysis, answer, page)) {
    return {
      valid: false,
      reason: "ANSWER_NOT_NEAR_RELEVANT_CLUE",
    };
  }

  return {
    valid: true,
    reason: "PAGE_AND_TYPE_VERIFIED",
  };
}

function relationSearchWord(relation) {
  switch (relation) {
    case REL.COST: return "cost price";
    case REL.INCOME: return "income per second";
    case REL.RARITY: return "rarity";
    case REL.STATUS: return "status availability";
    case REL.METHOD: return "obtain get";
    case REL.DATE: return "date added";
    case REL.MULTIPLIER: return "multiplier";
    case REL.REQUIREMENT: return "requirement requires";
    case REL.SPAWN: return "spawn reward";
    case REL.FORMATION: return "formation";
    case REL.WEATHER: return "weather";
    case REL.DROP_RATE: return "drop rate chance";
    case REL.REWARD: return "reward";
    case REL.CONTENTS: return "contents drops";
    case REL.REBIRTH: return "rebirth";
    case REL.GEAR: return "gear item unlock";
    case REL.BRAINROT: return "brainrot";
    case REL.MUTATION: return "mutation";
    case REL.TRAIT: return "trait";
    case REL.RITUAL: return "ritual";
    case REL.EVENT: return "event";
    case REL.MACHINE: return "machine";
    case REL.UPDATE: return "update";
    case REL.COLLECTION: return "collection";
    case REL.OUTCOME: return "outcome result reward spawn";
    case REL.FREQUENCY: return "frequency every interval returns occurs";
    case REL.ACTIVE_RANGE: return "active from through update available range";
    case REL.REPLACED_BY: return "replaced by replacement";
    case REL.REPLACED_IN: return "replaced in update";
    default: return "";
  }
}

function humanDateFromIso(date) {
  if (!date || !/^20\d{2}-\d{2}-\d{2}$/.test(String(date))) return "";
  const [y, m, d] = String(date).split("-").map(Number);
  const names = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${names[m]} ${d}, ${y}`;
}



function exactSearchQuery(question, analysis, source) {
  const parts = [];

  if (analysis.entity) parts.push(`"${oneLine(analysis.entity, 180)}"`);
  if (analysis.date) parts.push(`"${humanDateFromIso(analysis.date)}"`);

  const relation = relationSearchWord(analysis.relation);
  if (relation) parts.push(relation);

  // Lifecycle/range questions are intentionally searched with a FEW strong
  // anchors instead of every update number in the sentence.
  if (analysis.activeFrom || analysis.activeTo || analysis.replacedIn) {
    if (analysis.replacedIn) parts.push(`"Update ${analysis.replacedIn}"`, "replaced");
    if (analysis.activeFrom) parts.push(`"Update ${analysis.activeFrom}"`);
    if (!analysis.activeFrom && analysis.update) parts.push(`"Update ${analysis.update}"`);
  } else if (analysis.update) {
    parts.push(`"Update ${analysis.update}"`);
  }

  for (const clue of searchCluesFromQuestion(question)) {
    // Update numbers are handled structurally above; don't force every one.
    if (/^Update\s*\d/i.test(clue)) continue;
    if (/\s/.test(clue)) parts.push(`"${clue}"`);
    else parts.push(clue);
  }

  // For normal questions preserve wording. For multi-update lifecycle questions,
  // preserving the whole sentence over-constrains search, so keep only useful words.
  const updateCount = (analysis.updateNumbers || []).length;
  if (updateCount <= 1 && !analysis.activeFrom && !analysis.replacedIn) {
    const original = oneLine(question, 500).replace(/[?!.]+$/g, "").trim();
    if (original) parts.push(original);
  }

  return `site:${source.host} ${parts.join(" ")}`.trim();
}

function relationEvidenceScore(text, relation) {
  const t = oneLine(text, 3000).toLowerCase();

  const checks = {
    [REL.COST]: /\b(?:cost|price)\b/,
    [REL.INCOME]: /\b(?:income|per second|generat)\b/,
    [REL.RARITY]: /\brarity\b/,
    [REL.STATUS]: /\b(?:status|available|obtainable)\b/,
    [REL.METHOD]: /\b(?:obtain|get|method)\b/,
    [REL.DATE]: /\b(?:date|added|released)\b/,
    [REL.MULTIPLIER]: /\b(?:multiplier|multi|boost|\d+(?:\.\d+)?x)\b/,
    [REL.REQUIREMENT]: /\b(?:requires?|requirement|needed)\b/,
    [REL.SPAWN]: /\b(?:spawn|reward|result)\b/,
    [REL.FORMATION]: /\bformation\b/,
    [REL.WEATHER]: /\bweather\b/,
    [REL.DROP_RATE]: /\b(?:drop rate|chance|probability)\b/,
    [REL.REWARD]: /\breward\b/,
    [REL.CONTENTS]: /\b(?:contents|drops)\b/,
    [REL.REBIRTH]: /\brebirth\b/,
    [REL.GEAR]: /\b(?:gear|item|unlock|potion|shield|teleport)\b/,
    [REL.BRAINROT]: /\bbrainrot\b/,
    [REL.MUTATION]: /\bmutation\b/,
    [REL.TRAIT]: /\btrait\b/,
    [REL.RITUAL]: /\britual\b/,
    [REL.EVENT]: /\bevent\b/,
    [REL.MACHINE]: /\bmachine\b/,
    [REL.UPDATE]: /\bupdate\b/,
    [REL.COLLECTION]: /\bcollection\b/,
    [REL.OUTCOME]: /\b(?:outcome|result|reward|spawn)\b/,
    [REL.FREQUENCY]: /\b(?:every|hour|hours|minute|minutes|daily|weekly|frequency|interval|returns?|occurs?)\b/,
    [REL.ACTIVE_RANGE]: /\b(?:active|available|from|through|until|update)\b/,
    [REL.REPLACED_BY]: /\b(?:replaced by|replacement|replaced)\b/,
    [REL.REPLACED_IN]: /\b(?:replaced in|update)\b/,
  };

  return checks[relation]?.test(t) ? 1 : 0;
}

function scoreExactSearchResult(row, analysis, source) {
  if (!row || row.host !== source.host) return -999;

  const combined = `${row.title}\n${row.url}\n${row.content}`;
  let score = clamp(row.score) * 4;

  if (analysis.entity) {
    score += bestEntityScore(analysis, combined) * 5;
  }

  if (
    analysis.update &&
    new RegExp(`\\bUpdate\\s*${analysis.update}\\b`, "i").test(combined)
  ) {
    score += 6;
  }

  if (analysis.date) {
    const date = humanDateFromIso(analysis.date);
    if (date && combined.toLowerCase().includes(date.toLowerCase())) score += 6;
  }

  score += relationEvidenceScore(combined, analysis.relation) * 2;

  const clueInfo = clueCoverage(analysis.rawQuestion || "", combined);
  score += clueInfo.matched * 1.5;
  if (clueInfo.total >= 2 && clueInfo.ratio >= 0.75) score += 2;

  try {
    const url = new URL(row.url);
    const path = url.pathname.toLowerCase();

    // Prefer specific content pages over home/search/calculator pages.
    if (path.split("/").filter(Boolean).length >= 2) score += 1.5;
    if (/\/(?:calculator|search)(?:\/|$)/.test(path)) score -= 4;
  } catch {}

  return score;
}


function pickExactSearchResult(search, analysis, source, question = "") {
  const ranked = rankEligibleResults(
    search,
    question || analysis.rawQuestion || "",
    analysis,
    source,
    2
  );

  return ranked[0] || null;
}

function fandomTitleFromResultUrl(url) {
  try {
    const u = new URL(url);
    const marker = "/wiki/";
    const i = u.pathname.indexOf(marker);
    if (i < 0) return null;

    return decodeURIComponent(
      u.pathname
        .slice(i + marker.length)
        .replace(/_/g, " ")
    );
  } catch {
    return null;
  }
}

async function openExactResult(row, source, deadline) {
  if (!row?.url) throw new Error(`${source.key}_NO_RESULT_URL`);

  if (source === SOURCE.FANDOM) {
    const title = fandomTitleFromResultUrl(row.url) || row.title;
    if (!title) throw new Error("FANDOM_RESULT_NO_TITLE");
    return fetchFandomPage(title, deadline);
  }

  return fetchPage(row.url, source, deadline);
}

function pageEvidenceSupported(raw, page) {
  const evidence = oneLine(raw?.evidence, 300);
  const answer = oneLine(raw?.answer, 500);

  if (!answer || norm(answer) === "unknown") return false;

  // Strongest validation: model must quote a short supporting fragment
  // that actually exists on the single opened page.
  if (evidence && norm(page?.text || "").includes(norm(evidence))) return true;

  // Exact/normalized answer itself appearing on page is also enough.
  if (evidenceSupports(answer, page?.text || "")) return true;

  // For list answers, every comma-separated item must independently exist.
  const items = answer
    .split(/[,;]+/)
    .map((x) => oneLine(x, 140))
    .filter(Boolean);

  return (
    items.length > 1 &&
    items.every((item) => evidenceSupports(item, page?.text || ""))
  );
}

async function aiExtractSinglePage(question, analysis, page, source, deadline) {
  if (!env("NVIDIA_API_KEY") || timeLeft(deadline) < 260) {
    return {
      result: null,
      error: "NVIDIA_EXTRACTOR_UNAVAILABLE",
    };
  }

  try {
    const data = await fetchJson(
      `${source.key}_AI_EXTRACT`,
      NVIDIA_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env("NVIDIA_API_KEY")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
          stream: false,
          temperature: 0,
          max_tokens: 180,
          chat_template_kwargs: { enable_thinking: false },
          messages: [
            {
              role: "system",
              content: [
                "You extract one Steal a Brainrot answer from ONE supplied page.",
                "Use ONLY the supplied page text. Never use memory or outside knowledge.",
                "If the page does not explicitly support the requested answer, return UNKNOWN.",
                `Requested relation: ${analysis.relation}.`,
                analysis.update ? `Requested update: ${analysis.update}.` : "",
                analysis.date ? `Requested date: ${analysis.date}.` : "",
                analysis.entity ? `Requested entity: ${analysis.entity}.` : "",
                "For REBIRTH return Rebirth<number>.",
                "For MACHINE return only the machine name.",
                "For GEAR return only the item/gear name.",
                "For MULTIPLIER return only the multiplier.",
                "For INCOME return only income per second.",
                "For SPAWN/OUTCOME/REWARD/BRAINROT questions return ONLY the brainrot/entity name, never the percentage or an explanatory sentence.",
                "For FREQUENCY return only the recurrence phrase, e.g. Every two hours.",
                "For ACTIVE_RANGE return only the update range.",
                "For REPLACED_IN return only Update<number>.",
                "For REPLACED_BY return only the replacement entity name.",
                "For reverse identification questions like 'Which Secret brainrot ... has a base cost of $27.5B?', return ONLY the matching page/entity name.",
                "For chance questions like 'rare 1% result', return ONLY the entity attached to that exact chance.",
                "For broad UPDATE questions return a short comma-separated list of major additions explicitly stated on this page.",
                "Also provide a SHORT verbatim evidence fragment copied from the page that supports the answer.",
                'Return JSON only: {"answer":"UNKNOWN or value","evidence":"short exact page fragment","reason":"short"}',
              ].filter(Boolean).join("\n"),
            },
            {
              role: "user",
              content: JSON.stringify({
                question,
                analysis: {
                  entity: analysis.entity,
                  relation: analysis.relation,
                  update: analysis.update,
                  updateNumbers: analysis.updateNumbers,
                  activeFrom: analysis.activeFrom,
                  activeTo: analysis.activeTo,
                  replacedIn: analysis.replacedIn,
                  date: analysis.date,
                  intent: analysis.intent,
                },
                page: {
                  title: page.title,
                  url: page.url,
                  text: (() => {
                    const windows = contextsAroundClues(question, analysis, page.text, 700);
                    if (windows.length) {
                      return windows.slice(0, 7).map((w) => `[CLUE ${w.clue}] ${w.text}`).join("\n---\n");
                    }
                    return oneLine(page.text, 12000);
                  })(),
                },
              }),
            },
          ],
        }),
      },
      Math.max(
        260,
        Math.min(
          CFG.NVIDIA_TIMEOUT_MS,
          timeLeft(deadline) - 30
        )
      )
    );

    const raw = parseLooseAiExtraction(data?.choices?.[0]?.message?.content);
    const answer = oneLine(raw?.answer, 500);

    if (!answer || norm(answer) === "unknown") {
      return {
        result: null,
        error: "AI_PAGE_UNKNOWN",
      };
    }

    if (!pageEvidenceSupported(raw, page)) {
      return {
        result: null,
        error: "AI_PAGE_EVIDENCE_NOT_VERIFIED",
      };
    }

    const finalCheck = validateFinalPageAnswer(
      question,
      analysis,
      answer,
      page
    );

    if (!finalCheck.valid) {
      return {
        result: null,
        error: `AI_ANSWER_REJECTED_${finalCheck.reason}`,
      };
    }

    return {
      result: makeResult(
        answer,
        analysis.relation,
        source,
        page,
        `${source.key}_EXACT_PAGE_AI`,
        source.confidence
      ),
      error: null,
    };
  } catch (error) {
    return {
      result: null,
      error: errorCode(error),
    };
  }
}

function deterministicExactPageFallback(question, analysis, page, source) {
  // Same-page deterministic extraction only. This is a reliability fallback
  // if NVIDIA extraction times out; it does not search another source.
  if (source === SOURCE.PRIMARY) {
    const primary = resolvePrimary(question, analysis, [page]);
    if (primary) {
      primary.confidence = source.confidence;
      return primary;
    }
  }

  const backup = backupResolveText(page, analysis, source);
  if (backup) {
    backup.confidence = source.confidence;
    return backup;
  }

  return null;
}




function aggressiveSearchQueries(question, analysis, source) {
  const host = source.host;
  const q = oneLine(question, 700);
  const queries = [];

  const add = (value) => {
    value = oneLine(value, 900);
    if (!value) return;
    if (!value.toLowerCase().startsWith(`site:${host}`)) {
      value = `site:${host} ${value}`;
    }
    if (!queries.includes(value)) queries.push(value);
  };

  // 1) Existing structured query.
  add(exactSearchQuery(question, analysis, source));

  const rel = relationSearchWord(analysis.relation);
  const entity = analysis.entity ? `"${oneLine(analysis.entity, 180)}"` : "";
  const update = analysis.update ? `"Update ${analysis.update}"` : "";
  const date = analysis.date ? `"${humanDateFromIso(analysis.date)}"` : "";

  // 2) Relaxed relation query. Avoid forcing every clue.
  add([
    entity,
    update,
    date,
    rel,
    analysis.relation === REL.FREQUENCY ? "event every hours returns" : "",
    analysis.relation === REL.OUTCOME ? "ritual outcome reward spawn" : "",
    analysis.relation === REL.MACHINE && analysis.replacedIn ? `"Update ${analysis.replacedIn}" replaced machine` : "",
  ].filter(Boolean).join(" "));

  // 3) Clue-led query. Keep the strongest concrete clue(s), not all of them.
  const clues = importantQuestionClues(question, analysis)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((x) => /\s/.test(x.value) ? `"${x.value}"` : x.value);

  let extra = "";
  if (analysis.relation === REL.FREQUENCY) extra = "frequency every interval";
  else if (analysis.relation === REL.OUTCOME) extra = "outcome result";
  else if (analysis.relation === REL.MACHINE && (analysis.activeFrom || analysis.activeTo || analysis.replacedIn)) {
    extra = "machine replaced active";
  } else {
    extra = rel;
  }

  add([...clues, extra].filter(Boolean).join(" "));

  // If one query collapsed to something too generic, use original wording as a last variant.
  if (queries.length < 3) {
    add(q.replace(/[?!.]+$/g, ""));
  }

  const locked = (analysis.lockedSubjects || [])
    .map((subject) => `"${oneLine(subject, 160)}"`)
    .join(" ");

  const finalQueries = queries.map((query) => {
    if (!locked) return query;
    const missing = (analysis.lockedSubjects || []).some(
      (subject) => !query.toLowerCase().includes(String(subject).toLowerCase())
    );
    return missing ? `${query} ${locked}` : query;
  });

  return finalQueries.slice(0, 3);
}

function mergeSearches(searches) {
  const merged = {
    answer: "",
    results: [],
    errors: [],
    queries: [],
  };

  const byUrl = new Map();

  for (const item of searches || []) {
    if (!item) continue;
    if (item.query) merged.queries.push(item.query);
    if (item.search?.answer && !merged.answer) merged.answer = item.search.answer;
    for (const error of item.search?.errors || []) merged.errors.push(error);

    for (const row of item.search?.results || []) {
      const key = row.url || `${row.host}|${row.title}`;
      const existing = byUrl.get(key);

      if (!existing) {
        byUrl.set(key, {
          ...row,
          queryHits: 1,
          queryIndexes: [item.index],
        });
      } else {
        existing.queryHits += 1;
        existing.queryIndexes.push(item.index);
        if ((row.score || 0) > (existing.score || 0)) existing.score = row.score;
        if ((row.content || "").length > (existing.content || "").length) existing.content = row.content;
      }
    }
  }

  merged.results = [...byUrl.values()];
  return merged;
}

function obviousBadPage(row, source) {
  let path = "";
  try { path = new URL(row?.url || "").pathname.toLowerCase(); } catch {}

  if (!path) return true;
  if (source === SOURCE.PRIMARY) {
    if (path === "/" || path === "") return true;
    if (/\/(?:calculator|search)(?:\/|$)/.test(path)) return true;
    if (/\/wiki\/(?:creator|developers?|owners?)(?:\/|$)/.test(path)) return true;
  }

  return false;
}

function softFamilyPreference(row, question, analysis, source) {
  if (source !== SOURCE.PRIMARY) return 0;

  const family = primaryFamilyScore(row, question, analysis);
  if (family.allowed) return Math.max(1, family.score);

  // Wrong family is now a penalty, NOT an automatic rejection.
  // This lets /events/ or /brainrots/ still answer a ritual/update question
  // when the evidence is strong.
  return -2.5;
}

function aggressiveResultScore(row, question, analysis, source) {
  if (!row || row.host !== source.host) return -999;
  if (obviousBadPage(row, source)) return -999;

  const combined = `${row.title}\n${row.url}\n${row.content}`;
  let score = clamp(row.score) * 4;

  score += softFamilyPreference(row, question, analysis, source);

  if ((analysis.lockedSubjects || []).length) {
    const lockedOk = allLockedSubjectsSupported(combined, analysis);
    score += lockedOk ? 8 : -14;
  }

  if (analysis.entity) score += bestEntityScore(analysis, combined) * 4.5;

  if (
    analysis.update &&
    new RegExp(`\\bUpdate\\s*${analysis.update}\\b`, "i").test(combined)
  ) score += 4;

  if (analysis.date) {
    const date = humanDateFromIso(analysis.date);
    if (date && combined.toLowerCase().includes(date.toLowerCase())) score += 4;
  }

  score += relationEvidenceScore(combined, analysis.relation) * 2;

  const coverage = weightedClueCoverage(question, analysis, combined);
  score += coverage.ratio * 4;

  // Repeated discovery across independent search variants is strong.
  score += Math.min(3, Number(row.queryHits || 1) - 1) * 2;

  // Concrete clue matches help, but we do NOT require every clue.
  const hard = importantQuestionClues(question, analysis)
    .filter((x) => ["money", "percent", "multiplier", "update", "date", "lifecycle"].includes(x.kind));
  const hardMatched = hard.filter((x) => pageHasClue(combined, x.value));
  score += hardMatched.length * 1.2;

  return score;
}

function rankAggressiveResults(search, question, analysis, source, limit = 3) {
  return (search?.results || [])
    .filter((row) => row.host === source.host)
    .map((row) => ({
      ...row,
      aggressiveScore: aggressiveResultScore(row, question, analysis, source),
    }))
    .filter((row) => row.aggressiveScore > -50)
    .sort((a, b) => b.aggressiveScore - a.aggressiveScore)
    .slice(0, Math.max(1, limit));
}

function aggressivePageUsable(question, analysis, page, source) {
  if (!page?.text || oneLine(page.text, 100).length < 20) {
    return { usable: false, reason: "EMPTY_PAGE" };
  }

  if (obviousBadPage({ url: page.url }, source)) {
    return { usable: false, reason: "OBVIOUS_BAD_PAGE" };
  }

  const text = page.text;

  const subjectText = `${page.title}
${page.text}`;
  if (
    (analysis.lockedSubjects || []).length &&
    !allLockedSubjectsSupported(subjectText, analysis)
  ) {
    return {
      usable: false,
      reason: "LOCKED_SUBJECT_MISSING",
    };
  }

  const relationHit = relationEvidenceScore(text, analysis.relation) > 0;
  const slotRelationHit = Array.isArray(analysis.factSlots) && analysis.factSlots.length
    ? analysis.factSlots.some((slot) => relationEvidenceScore(text, slot.relation) > 0)
    : relationHit;
  const entityHit = analysis.entity ? bestEntityScore(analysis, `${page.title}\n${text}`) >= 0.25 : false;

  // R33 subject lock is semantic, not just a name mention. A page that merely
  // says the subject name but contains none of the requested relation types
  // cannot enter the evidence pool.
  if (
    (analysis.lockedSubjects || []).length &&
    Array.isArray(analysis.factSlots) &&
    analysis.factSlots.length &&
    !slotRelationHit
  ) {
    return {
      usable: false,
      reason: "LOCKED_SUBJECT_WITHOUT_REQUESTED_RELATION",
    };
  }
  const coverage = weightedClueCoverage(question, analysis, text);

  // Soft page-family preference: if the page is outside the expected family,
  // strong entity/clue/relation evidence can still keep it.
  const familyPenalty = softFamilyPreference(
    { url: page.url, host: source.host, title: page.title, content: text, score: 0 },
    question,
    analysis,
    source
  );

  if (
    familyPenalty < 0 &&
    !entityHit &&
    !relationHit &&
    coverage.ratio < 0.25
  ) {
    return { usable: false, reason: "WEAK_WRONG_FAMILY", coverage };
  }

  // Concrete clues no longer have to ALL appear. One hard clue + relation/entity
  // is enough to keep a page in the evidence pool.
  const hard = importantQuestionClues(question, analysis)
    .filter((x) => ["money", "percent", "multiplier", "update", "date", "lifecycle"].includes(x.kind));
  const hardMatched = hard.filter((x) => pageHasClue(text, x.value));

  if (
    hard.length &&
    hardMatched.length === 0 &&
    !entityHit &&
    !relationHit
  ) {
    return { usable: false, reason: "NO_HARD_OR_RELATION_EVIDENCE", coverage };
  }

  return {
    usable: true,
    reason: "AGGRESSIVE_PAGE_USABLE",
    coverage,
    entityHit,
    relationHit,
    hardMatched: hardMatched.map((x) => x.value),
  };
}

function evidenceChunksForPage(question, analysis, page, pageIndex) {
  const windows = contextsAroundClues(question, analysis, page.text, 620);
  const chunks = [];

  for (const window of windows.slice(0, 4)) {
    chunks.push({
      pageIndex,
      title: page.title,
      url: page.url,
      clue: window.clue,
      text: oneLine(window.text, 1800),
    });
  }

  if (!chunks.length) {
    // No exact clue window? Keep a compact beginning + relation neighborhood.
    const relationWords = relationSearchWord(analysis.relation)
      .split(/\s+/)
      .filter((x) => x.length >= 4);

    let relationChunk = "";
    for (const word of relationWords) {
      const idx = String(page.text || "").toLowerCase().indexOf(word.toLowerCase());
      if (idx >= 0) {
        relationChunk = clean(
          String(page.text || "").slice(Math.max(0, idx - 900), idx + 1400),
          2400
        );
        break;
      }
    }

    chunks.push({
      pageIndex,
      title: page.title,
      url: page.url,
      clue: relationChunk ? "relation" : "page",
      text: oneLine(relationChunk || page.text, 2600),
    });
  }

  return chunks;
}

function buildEvidenceBundle(question, analysis, pages) {
  const chunks = [];
  pages.forEach((page, index) => {
    chunks.push(...evidenceChunksForPage(question, analysis, page, index + 1));
  });
  return chunks.slice(0, 10);
}

function supportingPageForAnswer(answer, pages, chunks) {
  const a = oneLine(answer, 500);

  for (const chunk of chunks || []) {
    if (evidenceSupports(a, chunk.text)) {
      const page = pages[(chunk.pageIndex || 1) - 1];
      if (page) return { page, chunk };
    }
  }

  for (const page of pages || []) {
    if (evidenceSupports(a, page.text)) return { page, chunk: null };
  }

  return null;
}

function validateBundleAnswer(question, analysis, answer, pages, chunks) {
  const support = supportingPageForAnswer(answer, pages, chunks);
  if (!support) {
    return { valid: false, reason: "ANSWER_NOT_IN_TRUSTED_EVIDENCE" };
  }

  const type = answerTypeValid(question, analysis, answer, support.page);
  if (!type.valid) return type;

  // Because chunks are built around the question's clues, an answer appearing
  // in one of them is enough. If no chunk hit, require same-page relation evidence.
  if (support.chunk) {
    return {
      valid: true,
      reason: "ANSWER_IN_CLUE_EVIDENCE",
      page: support.page,
      chunk: support.chunk,
    };
  }

  if (relationEvidenceScore(support.page.text, analysis.relation) > 0) {
    return {
      valid: true,
      reason: "ANSWER_IN_RELATION_PAGE",
      page: support.page,
      chunk: null,
    };
  }

  return { valid: false, reason: "ANSWER_NOT_CONNECTED_TO_QUESTION" };
}

async function aiExtractEvidenceBundle(question, analysis, pages, source, deadline) {
  if (!env("NVIDIA_API_KEY") || timeLeft(deadline) < 300 || !pages.length) {
    return { result: null, error: "NVIDIA_BUNDLE_UNAVAILABLE" };
  }

  const chunks = buildEvidenceBundle(question, analysis, pages);
  if (!chunks.length) return { result: null, error: "NO_EVIDENCE_CHUNKS" };

  try {
    const data = await fetchJson(
      `${source.key}_AI_BUNDLE_EXTRACT`,
      NVIDIA_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env("NVIDIA_API_KEY")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
          stream: false,
          temperature: 0,
          max_tokens: 190,
          chat_template_kwargs: { enable_thinking: false },
          messages: [
            {
              role: "system",
              content: [
                "You extract ONE Steal a Brainrot answer from trusted evidence chunks.",
                "Use ONLY the supplied chunks. Never use memory or outside knowledge.",
                "The chunks all come from the SAME source tier and may come from up to 3 pages.",
                "You do NOT need every clue to repeat in one snippet. Connect facts only when the supplied evidence clearly supports the requested relationship.",
                "If unsupported, answer UNKNOWN.",
                `Requested relation: ${analysis.relation}.`,
                analysis.entity ? `Requested entity: ${analysis.entity}.` : "",
                analysis.update ? `Requested update: ${analysis.update}.` : "",
                analysis.activeFrom ? `Active from Update ${analysis.activeFrom}.` : "",
                analysis.activeTo ? `Active through Update ${analysis.activeTo}.` : "",
                analysis.replacedIn ? `Replaced in Update ${analysis.replacedIn}.` : "",
                analysis.date ? `Requested date: ${analysis.date}.` : "",
                "For FREQUENCY return only the recurrence phrase, e.g. Every two hours.",
                "For OUTCOME/SPAWN/REWARD return only the resulting entity name.",
                "For MACHINE questions return only the machine name.",
                "For REBIRTH return Rebirth<number>.",
                "For GEAR return only the item name.",
                "For MULTIPLIER return only the multiplier.",
                "Return a short exact evidence quote copied from one supplied chunk.",
                'Return JSON only: {"answer":"UNKNOWN or value","evidence":"short exact quote","reason":"short"}',
              ].filter(Boolean).join("\n"),
            },
            {
              role: "user",
              content: JSON.stringify({
                question,
                analysis: {
                  relation: analysis.relation,
                  entity: analysis.entity,
                  update: analysis.update,
                  updateNumbers: analysis.updateNumbers,
                  activeFrom: analysis.activeFrom,
                  activeTo: analysis.activeTo,
                  replacedIn: analysis.replacedIn,
                  date: analysis.date,
                },
                evidence: chunks.map((chunk, i) => ({
                  id: i + 1,
                  pageIndex: chunk.pageIndex,
                  title: chunk.title,
                  url: chunk.url,
                  clue: chunk.clue,
                  text: chunk.text,
                })),
              }),
            },
          ],
        }),
      },
      Math.max(
        300,
        Math.min(
          CFG.NVIDIA_TIMEOUT_MS,
          timeLeft(deadline) - 30
        )
      )
    );

    const raw = parseLooseAiExtraction(data?.choices?.[0]?.message?.content);
    const answer = oneLine(raw?.answer, 500);

    if (!answer || norm(answer) === "unknown") {
      return { result: null, error: "AI_BUNDLE_UNKNOWN" };
    }

    const check = validateBundleAnswer(
      question,
      analysis,
      answer,
      pages,
      chunks
    );

    if (!check.valid) {
      return {
        result: null,
        error: `AI_BUNDLE_REJECTED_${check.reason}`,
      };
    }

    // If model supplied an evidence quote, make sure the quote itself exists
    // somewhere in the trusted bundle. Do not fail solely because the model
    // omitted the quote if the answer itself is already verified.
    const evidence = oneLine(raw?.evidence, 300);
    if (
      evidence &&
      !chunks.some((chunk) => norm(chunk.text).includes(norm(evidence)))
    ) {
      return {
        result: null,
        error: "AI_BUNDLE_EVIDENCE_QUOTE_NOT_FOUND",
      };
    }

    return {
      result: makeResult(
        answer,
        analysis.relation,
        source,
        check.page,
        `${source.key}_AGGRESSIVE_BUNDLE_AI`,
        source.confidence
      ),
      error: null,
      chunks,
      supportingPage: check.page,
    };
  } catch (error) {
    return {
      result: null,
      error: errorCode(error),
    };
  }
}


async function safeSearchVariant(query, index, analysis, source, deadline) {
  try {
    const search = await tavilySearch(
      query,
      deadline,
      [source.host],
      analysis.current
    );

    const fatal =
      !search ||
      (!Array.isArray(search.results) && !Array.isArray(search.errors));

    return {
      index,
      query,
      search: search || { answer: "", results: [], errors: ["EMPTY_SEARCH_RESULT"] },
      ok: !fatal,
      error: fatal ? "INVALID_SEARCH_RESULT" : null,
    };
  } catch (error) {
    return {
      index,
      query,
      search: {
        answer: "",
        results: [],
        errors: [errorCode(error)],
      },
      ok: false,
      error: errorCode(error),
    };
  }
}

async function safeOpenCandidate(row, source, deadline) {
  try {
    const page = await openExactResult(row, source, deadline);
    return { ok: true, row, page, error: null };
  } catch (error) {
    return {
      ok: false,
      row,
      page: null,
      error: errorCode(error),
    };
  }
}

function relationAnalysis(analysis, relation) {
  return {
    ...analysis,
    relation,
    wanted: relation,
    wantedRelations: [relation],
  };
}

function normalizeFrequencyAnswer(value) {
  const text = oneLine(value, 200);
  if (!text) return null;

  const patterns = [
    /\b(every\s+(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:minutes?|hours?|days?|weeks?))\b/i,
    /\b(once\s+(?:every\s+)?(?:\d+\s+)?(?:minutes?|hours?|days?|weeks?))\b/i,
    /\b(twice\s+(?:every\s+)?(?:\d+\s+)?(?:minutes?|hours?|days?|weeks?))\b/i,
    /\b(hourly|daily|weekly)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1]
        .replace(/^every/i, "Every")
        .replace(/^once/i, "Once")
        .replace(/^twice/i, "Twice");
    }
  }

  return null;
}

function extractSimpleRelationFromText(text, relation) {
  const raw = oneLine(text, 8000);
  if (!raw) return null;

  if (relation === REL.FREQUENCY) {
    return normalizeFrequencyAnswer(raw);
  }

  if (relation === REL.UPDATE) {
    const m = raw.match(/\bUpdate\s*#?\s*(\d{1,3}(?:\.\d+)?)\b/i);
    return m ? `Update${m[1]}` : null;
  }

  if (relation === REL.REBIRTH) {
    const m = raw.match(/\bRebirth\s*#?\s*(\d{1,3})\b/i);
    return m ? `Rebirth${Number(m[1])}` : null;
  }

  if (relation === REL.MULTIPLIER) {
    return raw.match(/\b\d+(?:\.\d+)?\s*[x×]\b/i)?.[0]?.replace("×", "x") || null;
  }

  if (relation === REL.DROP_RATE) {
    return raw.match(/\b\d+(?:\.\d+)?\s*%/)?.[0] || null;
  }

  return null;
}

function uniqueRelationAnswerFromChunks(chunks, relation) {
  const answers = [];

  for (const chunk of chunks || []) {
    const answer = extractSimpleRelationFromText(chunk.text, relation);
    if (!answer) continue;

    if (!answers.some((x) => norm(x.answer) === norm(answer))) {
      answers.push({
        answer,
        chunk,
      });
    }
  }

  // One unique value is ideal. Multiple different values are ambiguous.
  return answers.length === 1 ? answers[0] : null;
}

function formatMultipartAnswer(parts, relations) {
  return relations
    .map((relation) => parts[relation]?.answer)
    .filter(Boolean)
    .join(", ");
}

function deterministicMultipartFromBundle(question, analysis, pages, chunks) {
  if (!isMultipartAnalysis(analysis)) return null;

  const parts = {};

  for (const relation of analysis.wantedRelations) {
    const subAnalysis = relationAnalysis(analysis, relation);

    // Simple typed extraction from clue-local chunks first.
    const simple = uniqueRelationAnswerFromChunks(chunks, relation);
    if (simple) {
      const page = pages[(simple.chunk.pageIndex || 1) - 1] || pages[0];
      const type = answerTypeValid(question, subAnalysis, simple.answer, page);

      if (type.valid) {
        parts[relation] = {
          answer: simple.answer,
          page,
          evidence: simple.chunk.text,
        };
        continue;
      }
    }

    // Existing deterministic page resolvers can supply non-simple relation types.
    for (const page of pages) {
      const direct =
        deterministicHighValueExactPage(question, subAnalysis, page, page.source || SOURCE.PRIMARY) ||
        deterministicExactPageFallback(question, subAnalysis, page, page.source || SOURCE.PRIMARY);

      if (!direct?.answer) continue;

      const check = validateBundleAnswer(
        question,
        subAnalysis,
        direct.answer,
        pages,
        chunks
      );

      if (check.valid) {
        parts[relation] = {
          answer: direct.answer,
          page: check.page || page,
          evidence: check.chunk?.text || page.text,
        };
        break;
      }
    }

    if (!parts[relation]) return null;
  }

  const answer = formatMultipartAnswer(parts, analysis.wantedRelations);
  if (!answer) return null;

  return {
    answer,
    parts,
    page: parts[analysis.wantedRelations[0]]?.page || pages[0],
  };
}

function parseMultipartAi(content) {
  const parsed = parseModelJson(content);
  const rows = Array.isArray(parsed?.parts)
    ? parsed.parts
    : Array.isArray(parsed?.answers)
      ? parsed.answers
      : null;

  if (!rows) throw new Error("MULTIPART_AI_NO_PARTS");

  return rows.map((row) => ({
    relation: String(row?.relation || row?.type || "").toUpperCase(),
    answer: oneLine(row?.answer ?? row?.value, 300),
    evidence: oneLine(row?.evidence ?? row?.quote, 350),
  }));
}

async function aiExtractMultipartBundle(question, analysis, pages, source, deadline) {
  if (!isMultipartAnalysis(analysis)) return { result: null, error: "NOT_MULTIPART" };
  if (!env("NVIDIA_API_KEY") || timeLeft(deadline) < 320 || !pages.length) {
    return { result: null, error: "NVIDIA_MULTIPART_UNAVAILABLE" };
  }

  const chunks = buildEvidenceBundle(question, analysis, pages);
  if (!chunks.length) return { result: null, error: "NO_MULTIPART_EVIDENCE" };

  try {
    const data = await fetchJson(
      `${source.key}_AI_MULTIPART`,
      NVIDIA_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env("NVIDIA_API_KEY")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
          stream: false,
          temperature: 0,
          max_tokens: 230,
          chat_template_kwargs: { enable_thinking: false },
          messages: [
            {
              role: "system",
              content: [
                "Extract ALL requested Steal a Brainrot facts from ONLY the supplied trusted evidence chunks.",
                "Do not use outside knowledge.",
                `Requested relations: ${analysis.wantedRelations.join(", ")}.`,
                "Return exactly one part for each requested relation.",
                "For FREQUENCY return only recurrence wording such as Every two hours.",
                "For UPDATE return Update<number>.",
                "If ANY requested relation is unsupported, use UNKNOWN for that part.",
                "Each non-UNKNOWN part needs a short exact evidence quote copied from the supplied chunks.",
                'Return JSON only: {"parts":[{"relation":"FREQUENCY","answer":"Every two hours","evidence":"..."},{"relation":"UPDATE","answer":"Update61","evidence":"..."}]}',
              ].join("\n"),
            },
            {
              role: "user",
              content: JSON.stringify({
                question,
                analysis: {
                  entity: analysis.entity,
                  wantedRelations: analysis.wantedRelations,
                  update: analysis.update,
                  date: analysis.date,
                },
                evidence: chunks.map((chunk, i) => ({
                  id: i + 1,
                  pageIndex: chunk.pageIndex,
                  title: chunk.title,
                  url: chunk.url,
                  clue: chunk.clue,
                  text: chunk.text,
                })),
              }),
            },
          ],
        }),
      },
      Math.max(
        320,
        Math.min(CFG.NVIDIA_TIMEOUT_MS, timeLeft(deadline) - 30)
      )
    );

    const rows = parseMultipartAi(data?.choices?.[0]?.message?.content);
    const parts = {};

    for (const relation of analysis.wantedRelations) {
      const row = rows.find((x) => x.relation === relation);
      if (!row || !row.answer || norm(row.answer) === "unknown") {
        return { result: null, error: `MULTIPART_MISSING_${relation}` };
      }

      const support = supportingPageForAnswer(row.answer, pages, chunks);
      if (!support) {
        return { result: null, error: `MULTIPART_UNSUPPORTED_${relation}` };
      }

      const subAnalysis = relationAnalysis(analysis, relation);
      const type = answerTypeValid(question, subAnalysis, row.answer, support.page);
      if (!type.valid) {
        return { result: null, error: `MULTIPART_TYPE_${relation}_${type.reason}` };
      }

      if (
        row.evidence &&
        !chunks.some((chunk) => norm(chunk.text).includes(norm(row.evidence)))
      ) {
        return { result: null, error: `MULTIPART_EVIDENCE_${relation}_NOT_FOUND` };
      }

      parts[relation] = {
        answer: row.answer,
        page: support.page,
        evidence: row.evidence || support.chunk?.text || "",
      };
    }

    const answer = formatMultipartAnswer(parts, analysis.wantedRelations);
    if (!answer) return { result: null, error: "MULTIPART_EMPTY_COMBINED" };

    const page = parts[analysis.wantedRelations[0]]?.page || pages[0];

    return {
      result: makeResult(
        answer,
        analysis.relation,
        source,
        page,
        `${source.key}_MULTIPART_AI`,
        source.confidence
      ),
      error: null,
      parts,
      supportingPage: page,
    };
  } catch (error) {
    return {
      result: null,
      error: errorCode(error),
    };
  }
}



function cleanSubject(value) {
  const v = oneLine(value, 180);
  if (!v || /^(?:none|unknown|null)$/i.test(v)) return null;
  return v;
}

function makeSlot(id, relation, options = {}) {
  return {
    id,
    relation,
    answerType: options.answerType || relation,
    subject: cleanSubject(options.subject),
    qualifier: oneLine(options.qualifier, 80) || null,
    predicate: oneLine(options.predicate, 80) || relation,
    anchorUpdate: Number.isFinite(Number(options.anchorUpdate)) && Number(options.anchorUpdate) > 0
      ? Number(options.anchorUpdate)
      : null,
  };
}

function detectFactSlots(question, analysis) {
  const q = oneLine(question, 700);
  const lower = q.toLowerCase();
  const slots = [];

  const add = (slot) => {
    if (!slot?.id || !slot?.relation) return;
    if (!slots.some((x) => x.id === slot.id)) slots.push(slot);
  };

  // ----------------------------------------------------------------
  // Same-relation duplicate slots: "99% and 1% outcomes"
  // ----------------------------------------------------------------
  const percents = [...q.matchAll(/\b(\d+(?:\.\d+)?)\s*%/g)]
    .map((m) => `${m[1]}%`);

  if (
    percents.length >= 2 &&
    /\b(?:outcome|outcomes|result|results)\b/i.test(q) &&
    /\britual\b/i.test(q)
  ) {
    const subject = lower.includes("job job job sahur")
      ? "Job Job Job Sahur"
      : analysis.entity;

    for (let i = 0; i < percents.length; i++) {
      add(makeSlot(
        `outcome_${percents[i].replace(".", "_")}_${i + 1}`,
        REL.OUTCOME,
        {
          subject,
          qualifier: percents[i],
          predicate: "OUTCOME_AT_CHANCE",
          answerType: REL.BRAINROT,
        }
      ));
    }

    return slots;
  }

  // ----------------------------------------------------------------
  // Queen Bee: frequency + machine/update tied to the SAME event/update.
  // ----------------------------------------------------------------
  if (lower.includes("queen bee")) {
    const subject = "Queen Bee";

    if (/\b(?:how often|how frequently|frequency|interval|recurr?ence)\b/.test(lower)) {
      add(makeSlot("queen_bee_frequency", REL.FREQUENCY, {
        subject,
        predicate: "EVENT_FREQUENCY",
      }));
    }

    if (
      /\b(?:which|what)\s+machine\b/.test(lower) ||
      /\bmachine\s+(?:was|is)\s+(?:introduced|added)\b/.test(lower)
    ) {
      add(makeSlot("queen_bee_same_update_machine", REL.MACHINE, {
        subject,
        predicate: "MACHINE_IN_SAME_UPDATE",
        answerType: REL.MACHINE,
        anchorUpdate: analysis.update,
      }));
    }

    if (
      /\b(?:what|which)\s+update\b/.test(lower) ||
      /\bupdate\s+(?:was|is)\s+(?:it\s+)?(?:tied|associated)\b/.test(lower) ||
      /\btied to\b/.test(lower)
    ) {
      add(makeSlot("queen_bee_update", REL.UPDATE, {
        subject,
        predicate: "SUBJECT_UPDATE",
        answerType: REL.UPDATE,
      }));
    }

    if (slots.length) return slots;
  }

  // ----------------------------------------------------------------
  // Los Traders replacement binding.
  // ----------------------------------------------------------------
  if (lower.includes("los traders") && /\breplac/.test(lower)) {
    if (/\b(?:which|what)\s+machine\b/.test(lower)) {
      add(makeSlot("los_traders_replaced_by", REL.MACHINE, {
        subject: "Los Traders",
        predicate: "REPLACED_BY",
        answerType: REL.MACHINE,
      }));
    }

    if (
      /\bwhat\s+update\b/.test(lower) ||
      /\bwhich\s+update\b/.test(lower) ||
      /\bwhat update did that happen\b/.test(lower)
    ) {
      add(makeSlot("los_traders_replaced_in", REL.UPDATE, {
        subject: "Los Traders",
        predicate: "REPLACED_IN",
        answerType: REL.UPDATE,
      }));
    }

    if (slots.length) return slots;
  }

  // ----------------------------------------------------------------
  // Generic multipart fallback: one slot per requested relation.
  // ----------------------------------------------------------------
  const wanted = analysis.wantedRelations || [analysis.relation];
  for (let i = 0; i < wanted.length; i++) {
    add(makeSlot(
      `relation_${wanted[i]}_${i + 1}`,
      wanted[i],
      {
        subject: analysis.entity,
        predicate: wanted[i],
        answerType: wanted[i],
      }
    ));
  }

  return slots;
}

function normalizeAiSlots(aiSlots, fallbackSlots) {
  if (!Array.isArray(aiSlots) || !aiSlots.length) return fallbackSlots;

  const byId = new Map(
    fallbackSlots.map((slot) => [slot.id, slot])
  );

  for (const row of aiSlots) {
    const id = oneLine(row?.id, 100);
    const relation = String(row?.relation || "").toUpperCase();

    if (!id || !ALLOWED_RELATIONS.has(relation)) continue;

    const fallback = byId.get(id);

    byId.set(id, makeSlot(id, relation, {
      answerType: String(row?.answerType || fallback?.answerType || relation).toUpperCase(),
      subject: cleanSubject(row?.subject) || fallback?.subject,
      qualifier: oneLine(row?.qualifier, 80) || fallback?.qualifier,
      predicate: oneLine(row?.predicate, 80) || fallback?.predicate || relation,
      anchorUpdate: Number(row?.anchorUpdate) || fallback?.anchorUpdate,
    }));
  }

  return [...byId.values()];
}

function applyFactSlots(question, analysis) {
  const slots = detectFactSlots(question, analysis);

  const lockedSubjects = [...new Set(
    slots.map((slot) => cleanSubject(slot.subject)).filter(Boolean)
  )];

  return {
    ...analysis,
    factSlots: slots,
    lockedSubjects,
    wantedRelations: [...new Set(slots.map((slot) => slot.relation))],
  };
}

function isFactSlotQuestion(analysis) {
  return Array.isArray(analysis?.factSlots) && analysis.factSlots.length > 1;
}

function subjectAppears(value, subject) {
  if (!subject) return true;
  return pageHasClue(value, subject) || similarity(subject, value) >= 0.72;
}

function allLockedSubjectsSupported(value, analysis) {
  const subjects = analysis?.lockedSubjects || [];
  if (!subjects.length) return true;
  return subjects.every((subject) => subjectAppears(value, subject));
}

function contextAroundSubject(text, subject, radius = 1000) {
  const raw = String(text || "");
  if (!subject) return raw;

  const index = raw.toLowerCase().indexOf(String(subject).toLowerCase());
  if (index < 0) return "";

  return clean(
    raw.slice(
      Math.max(0, index - radius),
      Math.min(raw.length, index + String(subject).length + radius)
    ),
    radius * 2 + String(subject).length
  );
}

function machineNamesFromText(text) {
  const raw = oneLine(text, 6000);
  const values = [];

  for (const m of raw.matchAll(
    /\b((?:RNG|Los|Craft|Fuse|Summer|Cyber|Mutation|Trait|Lucky|Brainrot|Cash|Admin)(?:\s+[A-Z][A-Za-z0-9'-]+){0,3}\s+Machine)\b/g
  )) {
    const value = oneLine(m[1], 120);
    if (value && !values.includes(value)) values.push(value);
  }

  // Important known shape: "RNG Machine"
  for (const m of raw.matchAll(/\b(RNG Machine|Craft Machine|Fuse Machine)\b/gi)) {
    const value = oneLine(m[1], 120);
    if (value && !values.some((x) => norm(x) === norm(value))) values.push(value);
  }

  return values;
}

function extractReplacedByMachine(text, subject) {
  const ctx = contextAroundSubject(text, subject, 1800);
  if (!ctx) return null;

  const patterns = [
    /\bUpdate\s*\d+(?:\.\d+)?\s+replaced\s+(?:the\s+)?(?:active\s+)?Los Traders[^.]{0,160}?\bwith\s+(?:the\s+)?([A-Z][A-Za-z0-9' -]{1,80}\s+Machine)\b/i,
    /\bLos Traders[^.]{0,180}?\breplaced\b[^.]{0,100}?\bwith\s+(?:the\s+)?([A-Z][A-Za-z0-9' -]{1,80}\s+Machine)\b/i,
    /\breplaced\s+(?:it|them|Los Traders)[^.]{0,100}?\bwith\s+(?:the\s+)?([A-Z][A-Za-z0-9' -]{1,80}\s+Machine)\b/i,
  ];

  for (const pattern of patterns) {
    const match = ctx.match(pattern);
    if (match?.[1]) return oneLine(match[1], 120);
  }

  // If the context explicitly says replacement and only one plausible machine
  // name occurs, the binding is unambiguous.
  if (/\breplac/i.test(ctx)) {
    const names = machineNamesFromText(ctx)
      .filter((name) => !/Los Traders/i.test(name));

    const unique = [...new Set(names.map((x) => oneLine(x, 120)))];
    if (unique.length === 1) return unique[0];
  }

  return null;
}

function extractReplacedInUpdate(text, subject) {
  const ctx = contextAroundSubject(text, subject, 1800);
  if (!ctx || !/\breplac/i.test(ctx)) return null;

  const patterns = [
    /\bUpdate\s*#?\s*(\d{1,3}(?:\.\d+)?)\s+replaced\b/i,
    /\breplaced\b[^.]{0,160}?\bin\s+Update\s*#?\s*(\d{1,3}(?:\.\d+)?)/i,
    /\bUpdate\s*#?\s*(\d{1,3}(?:\.\d+)?)[^.]{0,200}\bLos Traders\b[^.]{0,200}\breplac/i,
  ];

  for (const pattern of patterns) {
    const match = ctx.match(pattern);
    if (match?.[1]) return `Update${match[1]}`;
  }

  return null;
}

function extractSubjectUpdate(text, subject) {
  const ctx = contextAroundSubject(text, subject, 1500);
  if (!ctx) return null;

  const matches = [...ctx.matchAll(/\bUpdate\s*#?\s*(\d{1,3}(?:\.\d+)?)\b/gi)]
    .map((m) => `Update${m[1]}`);

  const unique = [...new Set(matches)];
  return unique.length === 1 ? unique[0] : null;
}

function extractMachineSameUpdate(text, subject) {
  const ctx = contextAroundSubject(text, subject, 1800);
  if (!ctx) return null;

  const names = machineNamesFromText(ctx);
  const unique = [...new Set(names)];

  if (unique.length === 1) return unique[0];

  // Prefer RNG Machine in the Queen Bee event context if explicitly present.
  if (
    /Queen Bee/i.test(ctx) &&
    /\bRNG Machine\b/i.test(ctx)
  ) {
    return "RNG Machine";
  }

  return null;
}

function slotSpecificQuestion(slot) {
  if (slot.relation === REL.OUTCOME && slot.qualifier) {
    return `What is the ${slot.qualifier} outcome from the ${slot.subject || ""} ritual?`;
  }

  if (slot.predicate === "REPLACED_BY") {
    return `What machine replaced ${slot.subject || "the subject"}?`;
  }

  if (slot.predicate === "REPLACED_IN") {
    return `In what update was ${slot.subject || "the subject"} replaced?`;
  }

  if (slot.predicate === "EVENT_FREQUENCY") {
    return `How often does ${slot.subject || "the event"} happen?`;
  }

  if (slot.predicate === "MACHINE_IN_SAME_UPDATE") {
    return `Which machine was introduced in the same update as ${slot.subject || "the subject"}?`;
  }

  if (slot.predicate === "SUBJECT_UPDATE") {
    return `What update was ${slot.subject || "the subject"} tied to?`;
  }

  return `${slot.relation} for ${slot.subject || "the question"}`;
}

function relationAnalysisForSlot(analysis, slot) {
  return {
    ...analysis,
    relation: slot.relation,
    wanted: slot.relation,
    wantedRelations: [slot.relation],
    entity: slot.subject || analysis.entity,
    entities: slot.subject
      ? [slot.subject, ...(analysis.entities || []).filter((x) => norm(x) !== norm(slot.subject))]
      : analysis.entities,
    factSlots: [slot],
    lockedSubjects: slot.subject ? [slot.subject] : [],
  };
}

function extractSlotDeterministic(slot, question, analysis, pages) {
  const slotQuestion = slotSpecificQuestion(slot);
  const subAnalysis = relationAnalysisForSlot(analysis, slot);

  for (const page of pages) {
    const pageText = `${page.title}\n${page.text}`;

    if (slot.subject && !subjectAppears(pageText, slot.subject)) continue;

    let answer = null;

    if (slot.relation === REL.OUTCOME && slot.qualifier) {
      answer = extractChanceResultFromPage(slotQuestion, page);
    } else if (slot.predicate === "REPLACED_BY") {
      answer = extractReplacedByMachine(page.text, slot.subject);
    } else if (slot.predicate === "REPLACED_IN") {
      answer = extractReplacedInUpdate(page.text, slot.subject);
    } else if (slot.predicate === "EVENT_FREQUENCY") {
      answer = normalizeFrequencyAnswer(
        contextAroundSubject(page.text, slot.subject, 1600)
      );
    } else if (slot.predicate === "SUBJECT_UPDATE") {
      answer = extractSubjectUpdate(page.text, slot.subject);
    } else if (slot.predicate === "MACHINE_IN_SAME_UPDATE") {
      answer = extractMachineSameUpdate(page.text, slot.subject);
    }

    if (!answer) {
      const direct =
        deterministicHighValueExactPage(
          slotQuestion,
          subAnalysis,
          page,
          page.source || SOURCE.PRIMARY
        ) ||
        deterministicExactPageFallback(
          slotQuestion,
          subAnalysis,
          page,
          page.source || SOURCE.PRIMARY
        );

      answer = direct?.answer || null;
    }

    if (!answer) continue;

    const type = answerTypeValid(
      slotQuestion,
      subAnalysis,
      answer,
      page
    );

    if (!type.valid) continue;

    // Strong binding: subject + answer must be present on the same page.
    if (slot.subject && !subjectAppears(pageText, slot.subject)) continue;
    if (!evidenceSupports(answer, page.text) && similarity(answer, page.title) < 0.82) continue;

    return {
      id: slot.id,
      relation: slot.relation,
      answer,
      subject: slot.subject,
      qualifier: slot.qualifier,
      predicate: slot.predicate,
      page,
      evidence: contextAroundSubject(page.text, slot.subject, 1800) || page.text,
    };
  }

  return null;
}

function deterministicFactSlots(question, analysis, pages) {
  if (!Array.isArray(analysis.factSlots) || !analysis.factSlots.length) return null;

  const answers = [];

  for (const slot of analysis.factSlots) {
    const resolved = extractSlotDeterministic(
      slot,
      question,
      analysis,
      pages
    );

    if (!resolved) return null;
    answers.push(resolved);
  }

  return {
    answer: answers.map((x) => x.answer).join(", "),
    slots: answers,
    page: answers[0]?.page || pages[0],
  };
}

function parseAiFactSlots(content) {
  const parsed = parseModelJson(content);
  const rows = Array.isArray(parsed?.slots)
    ? parsed.slots
    : Array.isArray(parsed?.parts)
      ? parsed.parts
      : null;

  if (!rows) throw new Error("FACT_SLOT_AI_NO_SLOTS");

  return rows.map((row) => ({
    id: oneLine(row?.id, 120),
    relation: String(row?.relation || row?.type || "").toUpperCase(),
    answer: oneLine(row?.answer ?? row?.value, 300),
    evidence: oneLine(row?.evidence ?? row?.quote, 350),
    subject: cleanSubject(row?.subject),
    qualifier: oneLine(row?.qualifier, 80) || null,
    predicate: oneLine(row?.predicate, 80) || null,
  }));
}

async function aiExtractFactSlots(question, analysis, pages, source, deadline) {
  if (!isFactSlotQuestion(analysis)) return { result: null, error: "NOT_FACT_SLOT_QUESTION" };
  if (!env("NVIDIA_API_KEY") || timeLeft(deadline) < 340 || !pages.length) {
    return { result: null, error: "NVIDIA_FACT_SLOT_UNAVAILABLE" };
  }

  const chunks = buildEvidenceBundle(question, analysis, pages);
  if (!chunks.length) return { result: null, error: "NO_FACT_SLOT_EVIDENCE" };

  try {
    const data = await fetchJson(
      `${source.key}_AI_FACT_SLOTS`,
      NVIDIA_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env("NVIDIA_API_KEY")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
          stream: false,
          temperature: 0,
          max_tokens: 320,
          chat_template_kwargs: { enable_thinking: false },
          messages: [
            {
              role: "system",
              content: [
                "You fill exact fact slots for Steal a Brainrot using ONLY supplied trusted evidence.",
                "Each slot has a subject, predicate/relation, and sometimes a qualifier.",
                "Keep every answer bound to that exact subject and qualifier.",
                "Do NOT answer from another entity or another update just because the same relation appears.",
                "For duplicate OUTCOME slots, the qualifier (for example 99% vs 1%) must select the matching outcome.",
                "For REPLACED_BY, answer the machine/entity that the subject was explicitly replaced by.",
                "For REPLACED_IN, answer the update where that same replacement occurred.",
                "For MACHINE_IN_SAME_UPDATE, answer a machine explicitly tied to the same update/event as the subject.",
                "For EVENT_FREQUENCY, answer only the recurrence phrase.",
                "If ANY slot is not explicitly supported, answer UNKNOWN for that slot.",
                "Return a short exact evidence quote for each non-UNKNOWN slot.",
                'Return JSON only: {"slots":[{"id":"...","relation":"...","answer":"...","evidence":"..."}]}',
              ].join("\n"),
            },
            {
              role: "user",
              content: JSON.stringify({
                question,
                slots: analysis.factSlots,
                evidence: chunks.map((chunk, i) => ({
                  id: i + 1,
                  pageIndex: chunk.pageIndex,
                  title: chunk.title,
                  url: chunk.url,
                  clue: chunk.clue,
                  text: chunk.text,
                })),
              }),
            },
          ],
        }),
      },
      Math.max(
        340,
        Math.min(CFG.NVIDIA_TIMEOUT_MS, timeLeft(deadline) - 30)
      )
    );

    const rows = parseAiFactSlots(data?.choices?.[0]?.message?.content);
    const resolved = [];

    for (const slot of analysis.factSlots) {
      const row = rows.find((x) => x.id === slot.id);

      if (!row || !row.answer || norm(row.answer) === "unknown") {
        return { result: null, error: `FACT_SLOT_MISSING_${slot.id}` };
      }

      const subAnalysis = relationAnalysisForSlot(analysis, slot);

      // Strong subject binding: the supporting evidence chunk must contain
      // the locked subject, not just the answer.
      const supportCandidates = chunks.filter((chunk) =>
        (!slot.subject || subjectAppears(chunk.text, slot.subject)) &&
        evidenceSupports(row.answer, chunk.text)
      );

      if (slot.qualifier) {
        const qualified = supportCandidates.filter((chunk) =>
          pageHasClue(chunk.text, slot.qualifier)
        );
        if (qualified.length) {
          supportCandidates.splice(0, supportCandidates.length, ...qualified);
        }
      }

      const supportChunk = supportCandidates[0];
      if (!supportChunk) {
        return { result: null, error: `FACT_SLOT_UNBOUND_${slot.id}` };
      }

      const page = pages[(supportChunk.pageIndex || 1) - 1] || pages[0];
      const type = answerTypeValid(
        slotSpecificQuestion(slot),
        subAnalysis,
        row.answer,
        page
      );

      if (!type.valid) {
        return { result: null, error: `FACT_SLOT_TYPE_${slot.id}_${type.reason}` };
      }

      if (
        row.evidence &&
        !norm(supportChunk.text).includes(norm(row.evidence))
      ) {
        return { result: null, error: `FACT_SLOT_EVIDENCE_${slot.id}_NOT_FOUND` };
      }

      resolved.push({
        id: slot.id,
        relation: slot.relation,
        answer: row.answer,
        subject: slot.subject,
        qualifier: slot.qualifier,
        predicate: slot.predicate,
        page,
        evidence: row.evidence || supportChunk.text,
      });
    }

    const answer = resolved.map((x) => x.answer).join(", ");
    const page = resolved[0]?.page || pages[0];

    return {
      result: makeResult(
        answer,
        analysis.relation,
        source,
        page,
        `${source.key}_FACT_SLOT_AI`,
        source.confidence
      ),
      slots: resolved,
      supportingPage: page,
      error: null,
    };
  } catch (error) {
    return {
      result: null,
      error: errorCode(error),
    };
  }
}

async function exactTierLookup(question, analysis, source, deadline) {
  const queries = aggressiveSearchQueries(question, analysis, source);

  // Each search variant catches its OWN error. One timeout can never reject
  // the entire tier if another variant succeeds.
  const settledSearches = await Promise.all(
    queries.map((query, index) =>
      safeSearchVariant(query, index, analysis, source, deadline)
    )
  );

  const searchVariantErrors = settledSearches
    .filter((x) => !x.ok || (x.search?.errors || []).length)
    .map((x) => ({
      index: x.index,
      query: x.query,
      error: x.error || (x.search?.errors || []).join(",") || "SEARCH_VARIANT_ERROR",
    }));

  const usableSearches = settledSearches.filter(
    (x) => x.ok || (x.search?.results || []).length > 0
  );

  if (!usableSearches.length) {
    return {
      result: null,
      search: { answer: "", results: [], errors: searchVariantErrors.map((x) => x.error) },
      page: null,
      pages: [],
      pagesTried: [],
      query: queries.join(" || "),
      queries,
      searchVariantErrors,
      error: "ALL_SEARCH_VARIANTS_FAILED",
    };
  }

  const search = mergeSearches(usableSearches);
  // Preserve failed-variant diagnostics without making them fatal.
  search.errors.push(...searchVariantErrors.map((x) => x.error));

  const candidates = rankAggressiveResults(
    search,
    question,
    analysis,
    source,
    3
  );

  if (!candidates.length) {
    return {
      result: null,
      search,
      page: null,
      pages: [],
      pagesTried: [],
      query: queries.join(" || "),
      queries,
      searchVariantErrors,
      error: "NO_AGGRESSIVE_SEARCH_RESULT",
    };
  }

  // Page fetches are independently isolated too. Two bad pages + one good
  // page still proceeds with the good page.
  const pageResults = await Promise.all(
    candidates.map((row) => safeOpenCandidate(row, source, deadline))
  );

  const pages = [];
  const pagesTried = [];
  const errors = [];

  for (const opened of pageResults) {
    const row = opened.row;

    if (!opened.ok) {
      pagesTried.push({
        title: row.title,
        url: row.url,
        searchScore: row.aggressiveScore,
        usable: false,
        reason: `FETCH_FAILED_${opened.error}`,
      });
      errors.push(`${row.url}:${opened.error}`);
      continue;
    }

    const page = opened.page;
    const usable = aggressivePageUsable(
      question,
      analysis,
      page,
      source
    );

    pagesTried.push({
      title: page.title,
      url: page.url,
      searchScore: row.aggressiveScore,
      usable: usable.usable,
      reason: usable.reason,
    });

    if (!usable.usable) {
      errors.push(`${page.url}:PAGE_SKIPPED_${usable.reason}`);
      continue;
    }

    pages.push(page);
  }

  if (!pages.length) {
    return {
      result: null,
      search,
      page: null,
      pages,
      pagesTried,
      query: queries.join(" || "),
      queries,
      searchVariantErrors,
      selected: candidates[0] || null,
      error: errors.join("|") || "NO_USABLE_PAGES",
    };
  }

  const chunks = buildEvidenceBundle(question, analysis, pages);

  // =====================================================
  // R33 FACT SLOTS: subject + predicate + qualifier are bound together.
  // This runs BEFORE relation-only multipart logic.
  // =====================================================
  if (isFactSlotQuestion(analysis)) {
    const deterministicSlots = deterministicFactSlots(
      question,
      analysis,
      pages
    );

    if (deterministicSlots) {
      return {
        result: makeResult(
          deterministicSlots.answer,
          analysis.relation,
          source,
          deterministicSlots.page,
          `${source.key}_FACT_SLOT_DETERMINISTIC`,
          source.confidence
        ),
        search,
        page: deterministicSlots.page,
        pages,
        pagesTried,
        query: queries.join(" || "),
        queries,
        searchVariantErrors,
        selected: candidates.find((x) => x.url === deterministicSlots.page?.url) || candidates[0],
        error: null,
        factSlots: deterministicSlots.slots,
      };
    }

    const slotAI = await aiExtractFactSlots(
      question,
      analysis,
      pages,
      source,
      deadline
    );

    if (slotAI.result) {
      return {
        result: slotAI.result,
        search,
        page: slotAI.supportingPage || pages[0],
        pages,
        pagesTried,
        query: queries.join(" || "),
        queries,
        searchVariantErrors,
        selected: candidates.find((x) => x.url === slotAI.supportingPage?.url) || candidates[0],
        error: null,
        factSlots: slotAI.slots,
      };
    }

    if (slotAI.error) errors.push(slotAI.error);

    // Never degrade a slot-bound question into relation-only guessing.
    return {
      result: null,
      search,
      page: null,
      pages,
      pagesTried,
      query: queries.join(" || "),
      queries,
      searchVariantErrors,
      selected: candidates[0] || null,
      error: errors.join("|") || "FACT_SLOTS_NOT_FULLY_VERIFIED",
    };
  }

  // =====================================================
  // MULTI-PART: require EVERY requested fact before returning.
  // =====================================================
  if (isMultipartAnalysis(analysis)) {
    const deterministicMulti = deterministicMultipartFromBundle(
      question,
      analysis,
      pages,
      chunks
    );

    if (deterministicMulti) {
      return {
        result: makeResult(
          deterministicMulti.answer,
          analysis.relation,
          source,
          deterministicMulti.page,
          `${source.key}_MULTIPART_DETERMINISTIC`,
          source.confidence
        ),
        search,
        page: deterministicMulti.page,
        pages,
        pagesTried,
        query: queries.join(" || "),
        queries,
        searchVariantErrors,
        selected: candidates.find((x) => x.url === deterministicMulti.page?.url) || candidates[0],
        error: null,
        multipart: deterministicMulti.parts,
      };
    }

    const multiAI = await aiExtractMultipartBundle(
      question,
      analysis,
      pages,
      source,
      deadline
    );

    if (multiAI.result) {
      return {
        result: multiAI.result,
        search,
        page: multiAI.supportingPage || pages[0],
        pages,
        pagesTried,
        query: queries.join(" || "),
        queries,
        searchVariantErrors,
        selected: candidates.find((x) => x.url === multiAI.supportingPage?.url) || candidates[0],
        error: null,
        multipart: multiAI.parts,
      };
    }

    if (multiAI.error) errors.push(multiAI.error);

    // IMPORTANT: never return a partial single-relation answer for a question
    // that explicitly requested multiple facts.
    return {
      result: null,
      search,
      page: null,
      pages,
      pagesTried,
      query: queries.join(" || "),
      queries,
      searchVariantErrors,
      selected: candidates[0] || null,
      error: errors.join("|") || "MULTIPART_NOT_FULLY_VERIFIED",
    };
  }

  // =====================================================
  // SINGLE-PART: R31 behavior.
  // =====================================================
  for (const page of pages) {
    const direct = deterministicHighValueExactPage(
      question,
      analysis,
      page,
      source
    );

    if (direct) {
      const check = validateBundleAnswer(
        question,
        analysis,
        direct.answer,
        pages,
        chunks
      );

      if (check.valid) {
        return {
          result: direct,
          search,
          page: check.page || page,
          pages,
          pagesTried,
          query: queries.join(" || "),
          queries,
          searchVariantErrors,
          selected: candidates.find((x) => x.url === page.url) || candidates[0],
          error: null,
        };
      }

      errors.push(`${page.url}:DIRECT_REJECTED_${check.reason}`);
    }
  }

  for (const page of pages) {
    const deterministic = deterministicExactPageFallback(
      question,
      analysis,
      page,
      source
    );

    if (!deterministic) continue;

    const check = validateBundleAnswer(
      question,
      analysis,
      deterministic.answer,
      pages,
      chunks
    );

    if (check.valid) {
      deterministic.reason = `${source.key}_AGGRESSIVE_DETERMINISTIC`;
      deterministic.confidence = source.confidence;

      return {
        result: deterministic,
        search,
        page: check.page || page,
        pages,
        pagesTried,
        query: queries.join(" || "),
        queries,
        searchVariantErrors,
        selected: candidates.find((x) => x.url === page.url) || candidates[0],
        error: null,
      };
    }

    errors.push(`${page.url}:DETERMINISTIC_REJECTED_${check.reason}`);
  }

  const ai = await aiExtractEvidenceBundle(
    question,
    analysis,
    pages,
    source,
    deadline
  );

  if (ai.result) {
    return {
      result: ai.result,
      search,
      page: ai.supportingPage || pages[0],
      pages,
      pagesTried,
      query: queries.join(" || "),
      queries,
      searchVariantErrors,
      selected: candidates.find((x) => x.url === (ai.supportingPage?.url || "")) || candidates[0],
      error: null,
    };
  }

  if (ai.error) errors.push(ai.error);

  return {
    result: null,
    search,
    page: null,
    pages,
    pagesTried,
    query: queries.join(" || "),
    queries,
    searchVariantErrors,
    selected: candidates[0] || null,
    error: errors.join("|") || "NO_VERIFIED_ANSWER_AFTER_AGGRESSIVE_SEARCH",
  };
}

function trustLogForTier(source, answer) {
  if (source === SOURCE.PRIMARY) {
    return [
      `S+ VERIFIED • ${answer} • 99.5%`,
    ];
  }

  if (source === SOURCE.FANDOM) {
    return [
      "BEST SOURCE MISS • Checking trusted backup",
      `A+ VERIFIED • ${answer} • 97%`,
    ];
  }

  if (source === SOURCE.WIKI) {
    return [
      "BEST SOURCE MISS",
      "TRUSTED BACKUP MISS • Checking secondary source",
      `B VERIFIED • ${answer} • 94%`,
    ];
  }

  return [
    "NO TRUSTED SOURCE FOUND • Using emergency evidence",
    `EMERGENCY • ${answer}`,
  ];
}

function attachTrustLog(result, source) {
  if (!result) return result;

  return {
    ...result,
    trustLog: trustLogForTier(source, result.answer),
    trustedTier: source.tier,
  };
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
    answerTypes: analysis.wantedRelations || [analysis.relation],
    factSlots: analysis.factSlots || [],
    lockedSubjects: analysis.lockedSubjects || [],
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

  // AI understands the question first. It never supplies the trivia answer.
  const routed = await analyzeQuestionAI(question, deadline);
  const analysis = routed.analysis;

  const diagnostic = {
    aiQuestionRouter: analysis.source,
    aiQuestionRouterError: routed.aiError,

    primaryQuery: "",
    primaryQueries: [],
    primarySelectedPage: "",
    primaryPagesTried: [],
    primarySearchVariantErrors: [],
    primaryMultipart: null,
    primaryFactSlots: null,
    primaryError: "",

    fandomQuery: "",
    fandomQueries: [],
    fandomSelectedPage: "",
    fandomPagesTried: [],
    fandomSearchVariantErrors: [],
    fandomMultipart: null,
    fandomFactSlots: null,
    fandomError: "",

    wikiQuery: "",
    wikiQueries: [],
    wikiSelectedPage: "",
    wikiPagesTried: [],
    wikiError: "",

    emergencyErrors: [],
  };

  // =====================================================
  // 1) S+ ONLY.
  // Run 3 S+ searches in parallel -> open top 3 useful S+ pages ->
  // deterministic extraction first -> AI over small verified S+ evidence chunks.
  // If any S+ evidence supports the answer, 0.995 and STOP.
  // =====================================================
  const primary = await exactTierLookup(
    question,
    analysis,
    SOURCE.PRIMARY,
    deadline
  );

  diagnostic.primaryQuery = primary.query;
  diagnostic.primaryQueries = primary.queries || [];
  diagnostic.primarySelectedPage = primary.page?.url || primary.selected?.url || "";
  diagnostic.primaryPagesTried = primary.pagesTried || [];
  diagnostic.primarySearchVariantErrors = primary.searchVariantErrors || [];
  diagnostic.primaryMultipart = primary.multipart || null;
  diagnostic.primaryFactSlots = primary.factSlots || null;
  diagnostic.primaryError = primary.error || "";

  if (primary.result) {
    const result = attachTrustLog(primary.result, SOURCE.PRIMARY);
    const final = finalize(
      result,
      question,
      analysis,
      startedAt,
      diagnostic
    );

    final.trustLog = result.trustLog;
    final.trustedTier = "S+";

    setCachedAnswer(question, final);
    return final;
  }

  // =====================================================
  // 2) A+ FANDOM.
  // This is the FIRST point where the result/log says best source missed.
  // =====================================================
  if (timeLeft(deadline) > 500) {
    const fandom = await exactTierLookup(
      question,
      analysis,
      SOURCE.FANDOM,
      deadline
    );

    diagnostic.fandomQuery = fandom.query;
    diagnostic.fandomQueries = fandom.queries || [];
    diagnostic.fandomSelectedPage = fandom.page?.url || fandom.selected?.url || "";
    diagnostic.fandomPagesTried = fandom.pagesTried || [];
    diagnostic.fandomSearchVariantErrors = fandom.searchVariantErrors || [];
    diagnostic.fandomMultipart = fandom.multipart || null;
    diagnostic.fandomFactSlots = fandom.factSlots || null;
    diagnostic.fandomError = fandom.error || "";

    if (fandom.result) {
      const result = attachTrustLog(fandom.result, SOURCE.FANDOM);
      const final = finalize(
        result,
        question,
        analysis,
        startedAt,
        diagnostic
      );

      final.trustLog = result.trustLog;
      final.trustedTier = "A+";

      setCachedAnswer(question, final);
      return final;
    }
  } else {
    diagnostic.fandomError = "BUDGET_EXHAUSTED_BEFORE_A_PLUS";
  }

  // =====================================================
  // 3) B SECONDARY WIKI.
  // =====================================================
  if (timeLeft(deadline) > 450) {
    const wiki = await exactTierLookup(
      question,
      analysis,
      SOURCE.WIKI,
      deadline
    );

    diagnostic.wikiQuery = wiki.query;
    diagnostic.wikiQueries = wiki.queries || [];
    diagnostic.wikiSelectedPage = wiki.page?.url || wiki.selected?.url || "";
    diagnostic.wikiPagesTried = wiki.pagesTried || [];
    diagnostic.wikiError = wiki.error || "";

    if (wiki.result) {
      const result = attachTrustLog(wiki.result, SOURCE.WIKI);
      const final = finalize(
        result,
        question,
        analysis,
        startedAt,
        diagnostic
      );

      final.trustLog = result.trustLog;
      final.trustedTier = "B";

      setCachedAnswer(question, final);
      return final;
    }
  } else {
    diagnostic.wikiError = "BUDGET_EXHAUSTED_BEFORE_B";
  }

  // =====================================================
  // 4) EMERGENCY only after the trusted chain misses.
  // =====================================================
  if (timeLeft(deadline) > 350) {
    const emergency = await emergencyStage(
      question,
      analysis,
      (primary.pages && primary.pages.length) ? primary.pages : (primary.page ? [primary.page] : []),
      deadline
    );

    diagnostic.emergencyErrors = emergency.search?.errors || [];

    if (emergency.result) {
      const result = attachTrustLog(
        emergency.result,
        SOURCE.EMERGENCY
      );

      const final = finalize(
        result,
        question,
        analysis,
        startedAt,
        diagnostic
      );

      final.trustLog = result.trustLog;
      final.trustedTier = "C";

      setCachedAnswer(question, final);
      return final;
    }
  }

  const failed = finalize(
    {
      answer: "UNKNOWN",
      candidateAnswer: "UNKNOWN",
      confidence: 0,
      reason: "NO_TRUSTED_SOURCE_FOUND",
      route: "REVIEW",
      sourceCount: 0,
      sources: [],
    },
    question,
    analysis,
    startedAt,
    diagnostic
  );

  failed.trustLog = [
    "BEST SOURCE MISS",
    "TRUSTED BACKUP MISS",
    "SECONDARY SOURCE MISS",
    "NO TRUSTED SOURCE FOUND • REVIEW",
  ];

  failed.trustedTier = "NONE";

  return failed;
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
  return items.map((item) => {
    if (item.answer === "UNKNOWN") {
      return "NO TRUSTED SOURCE FOUND • REVIEW";
    }

    if (item.trustedTier === "S+") {
      return `S+ VERIFIED • ${item.answer} • 99.5%`;
    }

    if (item.trustedTier === "A+") {
      return `BEST SOURCE MISS → A+ VERIFIED • ${item.answer} • 97%`;
    }

    if (item.trustedTier === "B") {
      return `S+ + A+ MISS → B VERIFIED • ${item.answer} • 94%`;
    }

    if (item.trustedTier === "C") {
      return `TRUSTED SOURCES MISS → EMERGENCY • ${item.answer}`;
    }

    return `${item.route}:${item.answer}:${Math.round((item.confidence || 0) * 100)}%`;
  }).join(" | ");
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


  const q61 = analyzeQuestion("What machine was added in Update 61?");
  check("R25 update61 relation", q61.relation === REL.MACHINE);
  check("R25 update61 number", q61.update === 61);
  check("R25 update61 intent", q61.intent === "UPDATE_FACT");

  const qDate = analyzeQuestion("What rebirth was added in the August 15, 2026 update?");
  check("R25 date update relation", qDate.relation === REL.REBIRTH);
  check("R25 date parse", qDate.date === "2026-08-15");

  const q62 = analyzeQuestion("What did Update 62 add?");
  check("R25 update summary intent", q62.intent === "UPDATE_SUMMARY");

  const machineContext = "Update 61 adds the RNG Machine and Queen Bee event.";
  check("R25 machine context extraction", extractUpdateTypedAnswer(machineContext, { relation: REL.MACHINE }) === "RNG Machine");

  const rebirthContext = "August 15, 2026 Update 62 introduced Rebirth 19 and new items.";
  check("R25 rebirth context extraction", extractUpdateTypedAnswer(rebirthContext, { relation: REL.REBIRTH }) === "Rebirth19");


  check(
    "R26 date query relation update",
    analyzeQuestion("What update happened on August 15, 2026?").relation === REL.UPDATE
  );

  check(
    "R26 extract update62 from dated card",
    extractUpdateNumberFromText("The Return - August 15, 2026 - Update 62 - Rebirth 19") === 62
  );

  check(
    "R26 bridge analysis update62",
    withBridgedUpdate(
      analyzeQuestion("What rebirth was added in the August 15, 2026 update?"),
      62
    ).update === 62
  );

  check(
    "R26 bridged rebirth extraction",
    extractUpdateTypedAnswer(
      "Update 62 introduced Rebirth 19 and Grief Shield.",
      withBridgedUpdate(
        analyzeQuestion("What rebirth was added in the August 15, 2026 update?"),
        62
      )
    ) === "Rebirth19"
  );

  check(
    "R26 bridged machine extraction",
    extractUpdateTypedAnswer(
      "Update 61 introduced the RNG Machine and Queen Bee event.",
      withBridgedUpdate(
        analyzeQuestion("What machine was added on August 8, 2026?"),
        61
      )
    ) === "RNG Machine"
  );

  check(
    "R26 date to update answer formatting",
    `Update${withBridgedUpdate(
      analyzeQuestion("What update happened on August 15, 2026?"),
      62
    ).update}` === "Update62"
  );


  const r27UpdateAnalysis = analyzeQuestion("Which machine made its debut in Update 61?");
  check(
    "R27 primary query update61",
    exactSearchQuery(
      "Which machine made its debut in Update 61?",
      r27UpdateAnalysis,
      SOURCE.PRIMARY
    ).includes('"Update 61"')
  );

  const r27DateAnalysis = analyzeQuestion("What rebirth was introduced on August 15, 2026?");
  check(
    "R27 primary query date",
    exactSearchQuery(
      "What rebirth was introduced on August 15, 2026?",
      r27DateAnalysis,
      SOURCE.PRIMARY
    ).includes('"August 15, 2026"')
  );

  const r27Rows = {
    results: [
      {
        title: "Calculator",
        url: "https://steal-a-brainrot.org/calculator",
        content: "Steal a Brainrot calculator",
        score: 0.9,
        host: "steal-a-brainrot.org",
      },
      {
        title: "RNG Machine + Queen Bee Event",
        url: "https://steal-a-brainrot.org/events/rng-machine-queen-bee-event-2026-08-08",
        content: "Update 61 added the RNG Machine.",
        score: 0.7,
        host: "steal-a-brainrot.org",
      },
    ],
  };

  check(
    "R27 exact page ranking",
    pickExactSearchResult(
      r27Rows,
      r27UpdateAnalysis,
      SOURCE.PRIMARY
    )?.url.includes("rng-machine")
  );

  check(
    "R27 S+ log",
    trustLogForTier(SOURCE.PRIMARY, "RNG Machine")[0] ===
      "S+ VERIFIED • RNG Machine • 99.5%"
  );

  check(
    "R27 A+ miss log",
    trustLogForTier(SOURCE.FANDOM, "Example")[0].startsWith("BEST SOURCE MISS")
  );


  const r28Rare = enforceQuestionSemantics(
    "What is the rare 1% result from the Job Job Job Sahur ritual?",
    analyzeQuestion("What is the rare 1% result from the Job Job Job Sahur ritual?")
  );
  check("R28/R30 rare ritual relation outcome", r28Rare.relation === REL.OUTCOME);

  const r28Reverse = enforceQuestionSemantics(
    "Which Secret brainrot from the RNG Machine in Update 61 has a base cost of $27.5B?",
    analyzeQuestion("Which Secret brainrot from the RNG Machine in Update 61 has a base cost of $27.5B?")
  );
  check("R28 reverse brainrot relation", r28Reverse.relation === REL.BRAINROT);

  check(
    "R28 reverse query keeps money clue",
    exactSearchQuery(
      "Which Secret brainrot from the RNG Machine in Update 61 has a base cost of $27.5B?",
      r28Reverse,
      SOURCE.PRIMARY
    ).includes("$27.5B")
  );

  check(
    "R28 ritual query keeps 1pct clue",
    exactSearchQuery(
      "What is the rare 1% result from the Job Job Job Sahur ritual?",
      r28Rare,
      SOURCE.PRIMARY
    ).includes("1%")
  );

  const r28RitualPage = syntheticPrimaryPage(
    "Job Job Job Sahur Ritual",
    `${PRIMARY_ORIGIN}/rituals/job-job-job-sahur-ritual`,
    [
      "Job Job Job Sahur Ritual",
      "Expected Results",
      "Brainrot Spawn",
      "Yess my Resume with a 99% outcome chance",
      "Noo my Resume with a 1% outcome chance",
      "Job Application Trait",
    ]
  );

  check(
    "R28 deterministic rare 1pct result",
    deterministicHighValueExactPage(
      "What is the rare 1% result from the Job Job Job Sahur ritual?",
      r28Rare,
      r28RitualPage,
      SOURCE.PRIMARY
    )?.answer === "Noo my Resume"
  );

  const r28YetimaticPage = syntheticPrimaryPage(
    "Yetimatic",
    `${PRIMARY_ORIGIN}/brainrots/yetimatic`,
    [
      "Yetimatic",
      "Secret",
      "RNG MACHINE",
      "Base Cost",
      "$27.5B",
      "Available from the RNG Machine during Update 61.",
    ]
  );

  check(
    "R28 reverse exact page Yetimatic",
    deterministicHighValueExactPage(
      "Which Secret brainrot from the RNG Machine in Update 61 has a base cost of $27.5B?",
      r28Reverse,
      r28YetimaticPage,
      SOURCE.PRIMARY
    )?.answer === "Yetimatic"
  );

  check(
    "R28 raw AI single value",
    parseLooseAiExtraction("Noo my Resume").answer === "Noo my Resume"
  );

  check(
    "R28 alternate AI json key",
    parseLooseAiExtraction('{"result":"Yetimatic","evidence":"Base Cost $27.5B"}').answer === "Yetimatic"
  );


  const r29RitualAnalysis = enforceQuestionSemantics(
    "What is the 1% outcome from the four-player Job Job Job Sahur ritual?",
    analyzeQuestion("What is the 1% outcome from the four-player Job Job Job Sahur ritual?")
  );

  check(
    "R29 ritual family accepts ritual URL",
    primaryFamilyScore(
      { url: `${PRIMARY_ORIGIN}/rituals/job-job-job-sahur-ritual` },
      "What is the 1% outcome from the four-player Job Job Job Sahur ritual?",
      r29RitualAnalysis
    ).allowed === true
  );

  check(
    "R29 ritual family rejects creator page",
    primaryFamilyScore(
      { url: `${PRIMARY_ORIGIN}/wiki/creator` },
      "What is the 1% outcome from the four-player Job Job Job Sahur ritual?",
      r29RitualAnalysis
    ).allowed === false
  );

  const r29WrongPage = syntheticPrimaryPage(
    "SpyderSammy",
    `${PRIMARY_ORIGIN}/wiki/creator`,
    [
      "Roblox developer and game producer",
      "Steal a Brainrot creator",
      "August 2026",
    ]
  );

  check(
    "R29 opened wrong ritual page rejected",
    pageEligibility(
      "What is the 1% outcome from the four-player Job Job Job Sahur ritual?",
      r29RitualAnalysis,
      r29WrongPage,
      SOURCE.PRIMARY
    ).eligible === false
  );

  check(
    "R29 generic role phrase rejected",
    validateFinalPageAnswer(
      "What is the 1% outcome from the four-player Job Job Job Sahur ritual?",
      r29RitualAnalysis,
      "Roblox developer and game producer",
      r29WrongPage
    ).valid === false
  );

  const r29GoodRitual = syntheticPrimaryPage(
    "Job Job Job Sahur Ritual",
    `${PRIMARY_ORIGIN}/rituals/job-job-job-sahur-ritual`,
    [
      "Job Job Job Sahur Ritual",
      "4 players",
      "Expected Results",
      "Yess my Resume with a 99% outcome chance",
      "Noo my Resume with a 1% outcome chance",
    ]
  );

  check(
    "R29 ritual page eligible",
    pageEligibility(
      "What is the 1% outcome from the four-player Job Job Job Sahur ritual?",
      r29RitualAnalysis,
      r29GoodRitual,
      SOURCE.PRIMARY
    ).eligible === true
  );

  check(
    "R29 Noo my Resume clue-local valid",
    validateFinalPageAnswer(
      "What is the 1% outcome from the four-player Job Job Job Sahur ritual?",
      r29RitualAnalysis,
      "Noo my Resume",
      r29GoodRitual
    ).valid === true
  );

  const r29MutationAnalysis = enforceQuestionSemantics(
    "Which mutation from Update 59 has a 13x multiplier and came with the Spain event?",
    analyzeQuestion("Which mutation from Update 59 has a 13x multiplier and came with the Spain event?")
  );

  check(
    "R29 mutation family accepts mutations wiki",
    primaryFamilyScore(
      { url: `${PRIMARY_ORIGIN}/wiki/mutations` },
      "Which mutation from Update 59 has a 13x multiplier and came with the Spain event?",
      r29MutationAnalysis
    ).allowed === true
  );

  const r29Rows = {
    results: [
      {
        title: "Creator",
        url: `${PRIMARY_ORIGIN}/wiki/creator`,
        content: "Roblox developer and game producer Update 59",
        score: 0.95,
        host: SOURCE.PRIMARY.host,
      },
      {
        title: "Mutations",
        url: `${PRIMARY_ORIGIN}/wiki/mutations`,
        content: "Update 59 Crystal mutation 13x Spain event",
        score: 0.60,
        host: SOURCE.PRIMARY.host,
      },
    ],
  };

  check(
    "R29 family guard ranks mutation page",
    pickExactSearchResult(
      r29Rows,
      r29MutationAnalysis,
      SOURCE.PRIMARY,
      "Which mutation from Update 59 has a 13x multiplier and came with the Spain event?"
    )?.url.endsWith("/wiki/mutations")
  );


  const r30MachineQ = "Which machine ran from Update 57 through Update 60 before being replaced in Update 61?";
  const r30Machine = enforceQuestionSemantics(r30MachineQ, analyzeQuestion(r30MachineQ));
  check("R30 machine lifecycle relation", r30Machine.relation === REL.MACHINE);
  check("R30 activeFrom", r30Machine.activeFrom === 57);
  check("R30 activeTo", r30Machine.activeTo === 60);
  check("R30 replacedIn", r30Machine.replacedIn === 61);
  check("R30 all update numbers", (r30Machine.updateNumbers || []).join(",") === "57,60,61");

  const r30Query = exactSearchQuery(r30MachineQ, r30Machine, SOURCE.PRIMARY);
  check("R30 lifecycle query uses replacement update", r30Query.includes('"Update 61"'));
  check("R30 lifecycle query not full sentence", !r30Query.includes("ran from Update 57 through Update 60 before being replaced"));

  const r30FreqQ = "How often does the Queen Bee event return during Update 61?";
  const r30Freq = enforceQuestionSemantics(r30FreqQ, analyzeQuestion(r30FreqQ));
  check("R30 frequency relation", r30Freq.relation === REL.FREQUENCY);

  const r30FreqPage = syntheticPrimaryPage(
    "RNG Machine + Queen Bee Event",
    `${PRIMARY_ORIGIN}/events/rng-machine-queen-bee-event-2026-08-08`,
    ["Queen Bee event", "Update 61", "The Queen Bee event returns every two hours."]
  );
  check("R30 frequency answer valid", answerTypeValid(r30FreqQ, r30Freq, "Every two hours", r30FreqPage).valid === true);

  const r30OutcomeQ = "What is the common 99% outcome of the Job Job Job Sahur ritual?";
  const r30Outcome = enforceQuestionSemantics(r30OutcomeQ, analyzeQuestion(r30OutcomeQ));
  check("R30 outcome relation", r30Outcome.relation === REL.OUTCOME);

  const r30OutcomePage = syntheticPrimaryPage(
    "Job Job Job Sahur Ritual",
    `${PRIMARY_ORIGIN}/rituals/job-job-job-sahur-ritual`,
    ["Job Job Job Sahur Ritual", "Yess my Resume with a 99% outcome chance", "Noo my Resume with a 1% outcome chance"]
  );
  check("R30 outcome deterministic", deterministicHighValueExactPage(r30OutcomeQ, r30Outcome, r30OutcomePage, SOURCE.PRIMARY)?.answer === "Yess my Resume");


  const r31FreqQ = "How often does the Queen Bee event happen during Update 61?";
  const r31Freq = enforceQuestionSemantics(r31FreqQ, analyzeQuestion(r31FreqQ));
  const r31FreqQueries = aggressiveSearchQueries(r31FreqQ, r31Freq, SOURCE.PRIMARY);

  check("R31 three search variants", r31FreqQueries.length === 3);
  check("R31 frequency query entity", r31FreqQueries.some((q) => q.includes("Queen Bee")));
  check("R31 frequency query relation", r31FreqQueries.some((q) => /frequency|every|interval/i.test(q)));

  const r31OutcomeQ = "What is the 99% outcome from the Job Job Job Sahur ritual?";
  const r31Outcome = enforceQuestionSemantics(r31OutcomeQ, analyzeQuestion(r31OutcomeQ));
  const r31OutcomeQueries = aggressiveSearchQueries(r31OutcomeQ, r31Outcome, SOURCE.PRIMARY);
  check("R31 outcome query percent", r31OutcomeQueries.some((q) => q.includes("99%")));
  check("R31 outcome query ritual", r31OutcomeQueries.some((q) => q.includes("Job Job Job Sahur")));

  const r31LifeQ = "Which machine was active from Update 57 through Update 60 and got replaced in Update 61?";
  const r31Life = enforceQuestionSemantics(r31LifeQ, analyzeQuestion(r31LifeQ));
  const r31LifeQueries = aggressiveSearchQueries(r31LifeQ, r31Life, SOURCE.PRIMARY);
  check("R31 lifecycle three variants", r31LifeQueries.length === 3);
  check("R31 lifecycle replacement variant", r31LifeQueries.some((q) => /replaced/i.test(q)));

  const r31SoftFamilyRow = {
    title: "Queen Bee Event",
    url: `${PRIMARY_ORIGIN}/brainrots/queen-bee-event-info`,
    content: "Queen Bee event Update 61 returns every two hours.",
    score: 0.7,
    host: SOURCE.PRIMARY.host,
    queryHits: 2,
  };
  check(
    "R31 wrong family can still score",
    aggressiveResultScore(r31SoftFamilyRow, r31FreqQ, r31Freq, SOURCE.PRIMARY) > 0
  );

  const r31BadCreatorRow = {
    title: "Creator",
    url: `${PRIMARY_ORIGIN}/wiki/creator`,
    content: "Roblox developer and game producer",
    score: 0.99,
    host: SOURCE.PRIMARY.host,
    queryHits: 3,
  };
  check(
    "R31 creator still blocked",
    aggressiveResultScore(r31BadCreatorRow, r31FreqQ, r31Freq, SOURCE.PRIMARY) < -50
  );

  const r31PageA = syntheticPrimaryPage(
    "Queen Bee Event",
    `${PRIMARY_ORIGIN}/events/queen-bee`,
    ["Queen Bee event", "Update 61", "The Queen Bee event returns every two hours."]
  );
  const r31Chunks = buildEvidenceBundle(r31FreqQ, r31Freq, [r31PageA]);
  check("R31 evidence bundle created", r31Chunks.length >= 1);
  check(
    "R31 bundle validates frequency",
    validateBundleAnswer(r31FreqQ, r31Freq, "Every two hours", [r31PageA], r31Chunks).valid === true
  );

  const r31RitualPage = syntheticPrimaryPage(
    "Job Job Job Sahur Ritual",
    `${PRIMARY_ORIGIN}/rituals/job-job-job-sahur-ritual`,
    [
      "Job Job Job Sahur Ritual",
      "Yess my Resume with a 99% outcome chance",
      "Noo my Resume with a 1% outcome chance",
    ]
  );
  const r31RitualChunks = buildEvidenceBundle(r31OutcomeQ, r31Outcome, [r31RitualPage]);
  check(
    "R31 bundle validates outcome",
    validateBundleAnswer(r31OutcomeQ, r31Outcome, "Yess my Resume", [r31RitualPage], r31RitualChunks).valid === true
  );


  const r32MultiQ = "How often did the Queen Bee event occur, and what update was it tied to?";
  const r32Multi = enforceQuestionSemantics(r32MultiQ, analyzeQuestion(r32MultiQ));

  check("R32 multipart detected", isMultipartAnalysis(r32Multi) === true);
  check(
    "R32 multipart relations",
    r32Multi.wantedRelations.includes(REL.FREQUENCY) &&
    r32Multi.wantedRelations.includes(REL.UPDATE)
  );

  const r32QueenPage = syntheticPrimaryPage(
    "RNG Machine + Queen Bee Event",
    `${PRIMARY_ORIGIN}/events/rng-machine-queen-bee-event-2026-08-08`,
    [
      "Queen Bee event",
      "Update 61",
      "The Queen Bee event returns every two hours.",
    ]
  );

  const r32QueenChunks = buildEvidenceBundle(r32MultiQ, r32Multi, [r32QueenPage]);
  const r32MultiDet = deterministicMultipartFromBundle(
    r32MultiQ,
    r32Multi,
    [r32QueenPage],
    r32QueenChunks
  );

  check(
    "R32 Queen Bee multipart answer",
    r32MultiDet?.answer === "Every two hours, Update61",
    r32MultiDet?.answer || "nil"
  );

  const r32Merged = mergeSearches([
    {
      index: 0,
      query: "q0",
      ok: false,
      search: { answer: "", results: [], errors: ["TAVILY_TIMEOUT"] },
    },
    {
      index: 1,
      query: "q1",
      ok: true,
      search: {
        answer: "",
        errors: [],
        results: [{
          title: "Queen Bee Event",
          url: `${PRIMARY_ORIGIN}/events/queen-bee`,
          content: "Update 61 Queen Bee every two hours",
          score: 0.8,
          host: SOURCE.PRIMARY.host,
        }],
      },
    },
    {
      index: 2,
      query: "q2",
      ok: true,
      search: {
        answer: "",
        errors: [],
        results: [{
          title: "Queen Bee Event",
          url: `${PRIMARY_ORIGIN}/events/queen-bee`,
          content: "Queen Bee event returns every two hours",
          score: 0.7,
          host: SOURCE.PRIMARY.host,
        }],
      },
    },
  ]);

  check("R32 failed search does not erase results", r32Merged.results.length === 1);
  check("R32 two successful query hits merged", r32Merged.results[0]?.queryHits === 2);

  const r32OutcomeQ = "Which ritual outcome has a 1% chance in the Job Job Job Sahur ritual?";
  const r32Outcome = enforceQuestionSemantics(r32OutcomeQ, analyzeQuestion(r32OutcomeQ));
  const r32OutcomePage = syntheticPrimaryPage(
    "Job Job Job Sahur Ritual",
    `${PRIMARY_ORIGIN}/rituals/job-job-job-sahur-ritual`,
    [
      "Job Job Job Sahur Ritual",
      "Yess my Resume with a 99% outcome chance",
      "Noo my Resume with a 1% outcome chance",
    ]
  );
  check(
    "R32 existing 1pct outcome preserved",
    deterministicHighValueExactPage(
      r32OutcomeQ,
      r32Outcome,
      r32OutcomePage,
      SOURCE.PRIMARY
    )?.answer === "Noo my Resume"
  );

  check(
    "R32 page open failure shape isolated",
    typeof safeOpenCandidate === "function"
  );


  // =====================================================
  // R33 source-grounded regression tests.
  // These page excerpts mirror live steal-a-brainrot.org facts checked on
  // 2026-08-19, then run through the deterministic slot resolver.
  // =====================================================

  const r33QueenQ =
    "How often did the Queen Bee event happen, and which machine was introduced in the same update?";
  const r33QueenBase = applyFactSlots(
    r33QueenQ,
    enforceQuestionSemantics(r33QueenQ, analyzeQuestion(r33QueenQ))
  );

  check("R33 Queen Bee slots detected", r33QueenBase.factSlots.length === 2);
  check(
    "R33 Queen Bee subject locked",
    r33QueenBase.lockedSubjects.includes("Queen Bee")
  );

  const r33QueenPage = syntheticPrimaryPage(
    "RNG MACHINE + QUEEN BEE",
    `${PRIMARY_ORIGIN}/events/rng-machine-queen-bee-event-2026-08-08`,
    [
      "Update 61 adds a cash-powered RNG Machine and a Queen Bee event that returns every two hours.",
      "The RNG Machine has 42 obtainable results in its first live version.",
      "Update 61 replaces the active Los Traders and Summer Fuse cycle with RNG and Honey routes.",
    ]
  );

  const r33QueenResolved = deterministicFactSlots(
    r33QueenQ,
    r33QueenBase,
    [r33QueenPage]
  );

  check(
    "R33 Queen Bee actual answer",
    r33QueenResolved?.answer === "Every two hours, RNG Machine",
    r33QueenResolved?.answer || "nil"
  );

  const r33ReplaceQ =
    "Which machine replaced Los Traders, and what update did that happen in?";
  const r33ReplaceBase = applyFactSlots(
    r33ReplaceQ,
    enforceQuestionSemantics(r33ReplaceQ, analyzeQuestion(r33ReplaceQ))
  );

  check("R33 Los Traders slots detected", r33ReplaceBase.factSlots.length === 2);
  check(
    "R33 Los Traders subject locked",
    r33ReplaceBase.lockedSubjects.includes("Los Traders")
  );

  const r33MachinesPage = syntheticPrimaryPage(
    "All Machines",
    `${PRIMARY_ORIGIN}/machines`,
    [
      "Los Traders",
      "Removed Brainrot Trader variant that ran from Update 57 through Update 60 with rotating 30-minute offers.",
      "Update 61 replaced it with the RNG Machine and Queen Bee event.",
    ]
  );

  const r33ReplaceResolved = deterministicFactSlots(
    r33ReplaceQ,
    r33ReplaceBase,
    [r33MachinesPage]
  );

  check(
    "R33 Los Traders actual answer",
    r33ReplaceResolved?.answer === "RNG Machine, Update61",
    r33ReplaceResolved?.answer || "nil"
  );

  const r33OutcomesQ =
    "What are the 99% and 1% outcomes of the Job Job Job Sahur ritual?";
  const r33OutcomesBase = applyFactSlots(
    r33OutcomesQ,
    enforceQuestionSemantics(r33OutcomesQ, analyzeQuestion(r33OutcomesQ))
  );

  check("R33 duplicate OUTCOME slots detected", r33OutcomesBase.factSlots.length === 2);
  check(
    "R33 duplicate relation preserved",
    r33OutcomesBase.factSlots.every((slot) => slot.relation === REL.OUTCOME)
  );
  check(
    "R33 percent qualifiers preserved",
    r33OutcomesBase.factSlots[0]?.qualifier === "99%" &&
    r33OutcomesBase.factSlots[1]?.qualifier === "1%"
  );

  const r33RitualPage = syntheticPrimaryPage(
    "Job Job Job Sahur Ritual",
    `${PRIMARY_ORIGIN}/rituals/job-job-job-sahur-ritual`,
    [
      "4 players required",
      "Job Job Job Sahur Ritual",
      "Brainrot Spawn",
      "Yess my Resume with a 99% outcome chance",
      "Noo my Resume with a 1% outcome chance",
    ]
  );

  const r33OutcomesResolved = deterministicFactSlots(
    r33OutcomesQ,
    r33OutcomesBase,
    [r33RitualPage]
  );

  check(
    "R33 two outcomes actual answer",
    r33OutcomesResolved?.answer === "Yess my Resume, Noo my Resume",
    r33OutcomesResolved?.answer || "nil"
  );

  const r33WrongCraft = syntheticPrimaryPage(
    "Craft Machine",
    `${PRIMARY_ORIGIN}/machines/craft-machine`,
    [
      "Craft Machine",
      "Update 13",
      "A crafting machine from an older update.",
    ]
  );

  check(
    "R33 wrong replacement page subject blocked",
    aggressivePageUsable(
      r33ReplaceQ,
      r33ReplaceBase,
      r33WrongCraft,
      SOURCE.PRIMARY
    ).usable === false
  );

  const r33WrongFandomLike = {
    title: "Tung Tung Tung Sahur",
    url: "https://stealabrainrot.fandom.com/wiki/Tung_Tung_Tung_Sahur",
    text: "Tung Tung Tung Sahur is a brainrot unrelated to Queen Bee.",
    lines: ["Tung Tung Tung Sahur is a brainrot unrelated to Queen Bee."],
    source: SOURCE.FANDOM,
  };

  check(
    "R33 unrelated subject page blocked",
    aggressivePageUsable(
      r33QueenQ,
      r33QueenBase,
      r33WrongFandomLike,
      SOURCE.FANDOM
    ).usable === false
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
    const question = oneLine(url.searchParams.get("q") || "What machine was added in Update 61?", 700);
    const started = nowMs();
    const deterministic = analyzeQuestion(question);
    const routed = await analyzeQuestionAI(question, started + 1800);
    return json(200, {
      ok: true,
      build: BUILD_ID,
      question,
      deterministic,
      analysis: routed.analysis,
      aiError: routed.aiError,
      ms: nowMs() - started,
    });
  }

  if (test === "exact") {
    const question = oneLine(
      url.searchParams.get("q") || "How often does the Queen Bee event happen during Update 61?",
      700
    );

    const started = nowMs();
    const deadline = started + 3600;
    const routed = await analyzeQuestionAI(question, deadline);
    const analysis = routed.analysis;

    const queries = aggressiveSearchQueries(question, analysis, SOURCE.PRIMARY);
    const searches = await Promise.all(
      queries.map(async (query, index) => ({
        index,
        query,
        search: await tavilySearch(
          query,
          deadline,
          [SOURCE.PRIMARY.host],
          analysis.current
        ),
      }))
    );

    const merged = mergeSearches(searches);
    const candidates = rankAggressiveResults(
      merged,
      question,
      analysis,
      SOURCE.PRIMARY,
      6
    );

    return json(200, {
      ok: candidates.length > 0,
      build: BUILD_ID,
      question,
      analysis,
      queries,
      candidates: candidates.map((row) => ({
        title: row.title,
        url: row.url,
        score: row.aggressiveScore,
        queryHits: row.queryHits,
      })),
      errors: merged.errors,
      ms: nowMs() - started,
    });
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
    const routed = await analyzeQuestionAI(question, deadline);
    const analysis = routed.analysis;
    const updateStage = await primaryUpdateHistoryPath(question, analysis, deadline);
    const resolvedAnalysis = updateStage.analysis || analysis;
    const fast = await primaryFastPath(question, resolvedAnalysis, deadline);
    const stage = await fetchPrimaryCandidates(question, resolvedAnalysis, deadline);
    const pages = [...new Map([...updateStage.pages, ...fast.pages, ...stage.pages].map((p) => [p.url, p])).values()];
    const direct = updateStage.result || fast.result || resolvePrimary(question, analysis, pages);
    return json(200, {
      ok: Boolean(direct?.answer),
      build: BUILD_ID,
      question,
      analysis: resolvedAnalysis,
      aiRouter: resolvedAnalysis.source,
      bridgedUpdate: updateStage.bridgedUpdate || null,
      updateRoute: updateStage.route,
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
    conflictPolicy: "AI ROUTES INTO RICH RELATION SCHEMA; MULTI-UPDATE QUESTIONS USE LIFECYCLE HINTS WITHOUT OVER-CONSTRAINING SEARCH; URL FAMILY + HARD CLUES VALIDATE PAGE; ANSWER TYPE + CLUE-LOCAL EVIDENCE MUST PASS; S+ VERIFIED = 0.995 + STOP; A+ ONLY ON S+ MISS; B ONLY ON S+/A+ MISS",
    architecture: {
      aiQuestionRouterFirst: true,
      exactPageSearchFirst: true,
      cluePreservingSearch: true,
      threeParallelSearchVariants: true,
      searchVariantFailureIsolation: true,
      pageFetchFailureIsolation: true,
      trueMultipartAnswers: true,
      factSlotSemanticBinding: true,
      duplicateRelationSlots: true,
      subjectLockAcrossTiers: true,
      predicateBoundExtraction: true,
      qualifierBoundExtraction: true,
      allMultipartPartsRequired: true,
      softPageFamilyPreference: true,
      topThreePagePool: true,
      parallelPageFetch: true,
      deterministicBeforeAI: true,
      multiPageEvidenceBundle: true,
      trustedEvidenceAnswerVerification: true,
      urlFamilyRouting: true,
      richRelationSchema: true,
      frequencyRelation: true,
      outcomeRelation: true,
      lifecycleRelations: true,
      multiUpdateDeconstraint: true,
      snippetEligibilityGuard: false,
      openedPageEligibilityGuard: false,
      maxTwoPagesPerTier: false,
      clueLocalAiEvidence: true,
      answerTypeValidation: true,
      genericRoleAnswerBlock: true,
      reverseEntityExactPage: true,
      chanceResultExactPage: true,
      looseAiOutputRecovery: true,
      onePageEvidencePerTier: true,
      aiSinglePageExtraction: true,
      strictEvidenceVerification: true,
      primaryStopsAllFallbacks: true,
      cleanTrustTierLogs: true,
      aiDoesNotAnswerQuestion: true,
      deterministicRouterFallback: true,
      dedicatedUpdateHistoryMode: true,
      updateDateRouting: true,
      dateToUpdateBridge: true,
      bridgedAnalysisFeedsFallbacks: true,
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
        attribute: result.answerType,
        expectedAttribute: question.expectedAttribute,
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
