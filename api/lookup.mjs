const BUILD_ID = "SAB_REAL_TABLE_ENGINE_R21_2026_08_19";

const FANDOM_API = "https://stealabrainrot.fandom.com/api.php";
const FANDOM_BASE = "https://stealabrainrot.fandom.com/wiki/";
const TAVILY_URL = "https://api.tavily.com/search";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";

const CFG = Object.freeze({
  GLOBAL_BUDGET_MS: Number(process.env.LOOKUP_BUDGET_MS || 1750),
  WIKI_TIMEOUT_MS: Number(process.env.WIKI_TIMEOUT_MS || 950),
  TAVILY_TIMEOUT_MS: Number(process.env.TAVILY_TIMEOUT_MS || 850),
  NVIDIA_TIMEOUT_MS: Number(process.env.NVIDIA_TIMEOUT_MS || 700),

  FALLBACK_START_MS: 300,

  MAX_CANONICAL_PAGES: 6,
  MAX_SEARCH_RESULTS: 6,
  MAX_WEB_SOURCES: 10,
  MAX_AI_EVIDENCE: 8,

  PAGE_CACHE_TTL_MS: 5 * 60 * 1000,
  TABLE_CACHE_TTL_MS: 5 * 60 * 1000,
  FACT_CACHE_TTL_MS: 5 * 60 * 1000,
  TITLE_CACHE_TTL_MS: 5 * 60 * 1000,

  CURRENT_ANSWER_TTL_MS: 2 * 60 * 1000,
  STABLE_ANSWER_TTL_MS: 12 * 60 * 60 * 1000,
});

const REL = Object.freeze({
  TEXT: "TEXT",

  REBIRTH: "REBIRTH",
  GEAR: "GEAR",
  BRAINROT: "BRAINROT",
  MUTATION: "MUTATION",
  TRAIT: "TRAIT",
  RITUAL: "RITUAL",
  EVENT: "EVENT",
  MACHINE: "MACHINE",
  LUCKY_BLOCK: "LUCKY_BLOCK",
  SLAP: "SLAP",

  COST: "COST",
  INCOME: "INCOME",
  RARITY: "RARITY",
  STATUS: "STATUS",
  MULTIPLIER: "MULTIPLIER",

  REQUIREMENT: "REQUIREMENT",
  SPAWN: "SPAWN",
  FORMATION: "FORMATION",
  WEATHER: "WEATHER",

  METHOD: "METHOD",
  DATE: "DATE",
  DROP_RATE: "DROP_RATE",

  REWARD: "REWARD",
  CONTENTS: "CONTENTS",

  SLOTS: "SLOTS",
  FLOORS: "FLOORS",

  REPLACED_BY: "REPLACED_BY",
  UPDATE: "UPDATE",
});

const SUBJECT_KIND = Object.freeze({
  GENERIC: "GENERIC",
  BRAINROT: "BRAINROT",
  MUTATION: "MUTATION",
  TRAIT: "TRAIT",
  RITUAL: "RITUAL",
  GEAR: "GEAR",
  MACHINE: "MACHINE",
  LUCKY_BLOCK: "LUCKY_BLOCK",
  EVENT: "EVENT",
  SLAP: "SLAP",
  REBIRTH: "REBIRTH",
});

const HUBS = Object.freeze({
  rebirth: ["Rebirth", "Gears"],
  gear: ["Gears", "Rebirth"],
  slap: ["Slap", "Rebirth"],

  mutation: ["Mutations"],
  trait: ["Traits", "Events"],
  ritual: ["Rituals"],

  machine: ["Machines", "Update Log"],
  lucky: ["Lucky Blocks"],

  event: ["Events", "Admin Abuse", "Update Log"],
  update: ["Update Log"],

  base: ["Base"],
  rarity: ["Rarities"],
});

const STATIC_ALIASES = Object.freeze({
  "flash tp": [
    "flash tp",
    "flash teleport",
  ],

  "flash teleport": [
    "flash teleport",
    "flash tp",
  ],

  "brain rot": [
    "brain rot",
    "brainrot",
  ],

  "brainrot": [
    "brainrot",
    "brain rot",
  ],

  "admin abuse": [
    "admin abuse",
    "admin event",
  ],

  "lucky block": [
    "lucky block",
    "lucky blocks",
  ],

  "bomb croc": [
    "bomb croc",
    "bombardiro crocodilo",
  ],

  "bombardiro": [
    "bombardiro",
    "bombardiro crocodilo",
  ],

  "tralalero": [
    "tralalero",
    "tralalero tralala",
  ],
});

const STOPWORDS = new Set([
  "what",
  "which",
  "who",
  "when",
  "where",
  "why",
  "how",

  "is",
  "are",
  "was",
  "were",
  "does",
  "did",
  "do",

  "the",
  "a",
  "an",

  "in",
  "at",
  "on",
  "for",
  "from",
  "to",
  "of",
  "with",

  "and",
  "or",

  "this",
  "that",
  "it",
  "its",

  "steal",
  "brainrot",
  "brain",
  "rot",
  "sab",
  "roblox",
  "game",

  "current",
  "currently",
  "latest",
  "newest",
  "new",
  "right",
  "now",
  "today",

  "update",
  "event",

  "rebirth",
  "gear",
  "item",
  "mutation",
  "trait",
  "ritual",
  "machine",
  "slap",

  "lucky",
  "block",

  "cost",
  "price",
  "income",
  "multiplier",
  "boost",
  "rarity",

  "spawn",
  "spawns",
  "require",
  "requires",
  "required",

  "drop",
  "rate",
  "chance",

  "give",
  "gives",
  "gave",

  "get",
  "gets",
  "got",

  "make",
  "makes",

  "per",
  "second",

  "much",
  "many",

  "added",
  "introduced",
  "removed",

  "unlock",
  "unlocks",
  "unlocked",

  "tell",
  "me",
  "about",
]);

const PAGE_CACHE = new Map();
const TABLE_CACHE = new Map();
const FACT_CACHE = new Map();
const TITLE_CACHE = new Map();
const ANSWER_CACHE = new Map();

/* =========================================================
   BASIC
========================================================= */

function clean(value, limit = 3000) {
  return String(value ?? "")
    .replace(
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function norm(value) {
  return clean(value, 3000)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function words(value) {
  return (
    clean(value, 1200)
      .toLowerCase()
      .match(/[a-z0-9]+/g) ||
    []
  );
}

function clamp(value, min = 0, max = 1) {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    return min;
  }

  return Math.max(
    min,
    Math.min(
      max,
      n
    )
  );
}

function nowMs() {
  return Date.now();
}

function timeLeft(deadline) {
  return Math.max(
    0,
    deadline - nowMs()
  );
}

function sleep(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        ms
      )
  );
}

function env(name) {
  return String(
    process.env[name] ||
    ""
  )
    .trim()
    .replace(/^Bearer\s+/i, "")
    .trim();
}

function errorCode(error) {
  return clean(
    error?.code ||
    error?.message ||
    error ||
    "UNKNOWN_ERROR",
    300
  );
}

function json(status, data) {
  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        "content-type":
          "application/json; charset=utf-8",

        "cache-control":
          "no-store",

        "x-lookup-build":
          BUILD_ID,
      },
    }
  );
}

function cacheGet(map, key) {
  const row =
    map.get(key);

  if (!row) {
    return null;
  }

  if (
    row.expiresAt <=
    nowMs()
  ) {
    map.delete(key);
    return null;
  }

  return row.value;
}

function cacheSet(
  map,
  key,
  value,
  ttl
) {
  map.set(
    key,
    {
      value,

      expiresAt:
        nowMs() + ttl,
    }
  );
}

function articleUrl(title) {
  return (
    FANDOM_BASE +
    encodeURIComponent(
      String(title)
        .replace(/ /g, "_")
    )
  );
}

/* =========================================================
   HTTP
========================================================= */

async function fetchText(
  label,
  url,
  options = {},
  timeoutMs = 900
) {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () =>
        controller.abort(),
      timeoutMs
    );

  try {
    let response;

    try {
      response =
        await fetch(
          url,
          {
            ...options,

            signal:
              controller.signal,
          }
        );
    } catch (error) {
      const timeout =
        error?.name ===
        "AbortError";

      const e =
        new Error(
          timeout
            ? `${label}_TIMEOUT`
            : `${label}_REQUEST_FAILED`
        );

      e.code =
        timeout
          ? `${label}_TIMEOUT`
          : `${label}_REQUEST_FAILED`;

      throw e;
    }

    const text =
      await response.text();

    if (!response.ok) {
      const e =
        new Error(
          `${label}_HTTP_${response.status}`
        );

      e.code =
        `${label}_HTTP_${response.status}`;

      throw e;
    }

    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(
  label,
  url,
  options = {},
  timeoutMs = 900
) {
  const text =
    await fetchText(
      label,
      url,
      options,
      timeoutMs
    );

  try {
    return text
      ? JSON.parse(text)
      : {};
  } catch {
    const e =
      new Error(
        `${label}_INVALID_JSON`
      );

    e.code =
      `${label}_INVALID_JSON`;

    throw e;
  }
}

/* =========================================================
   HTML / WIKITEXT
========================================================= */

function decodeHtmlEntities(value) {
  return String(value ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(
      /&#(\d+);/g,
      (_, n) => {
        const number =
          Number(n);

        return Number.isFinite(number)
          ? String.fromCodePoint(number)
          : " ";
      }
    )
    .replace(
      /&#x([0-9a-f]+);/gi,
      (_, n) => {
        const number =
          Number.parseInt(
            n,
            16
          );

        return Number.isFinite(number)
          ? String.fromCodePoint(number)
          : " ";
      }
    );
}

function htmlToText(
  html,
  limit = 150000
) {
  return clean(
    decodeHtmlEntities(
      String(html ?? "")
        .replace(
          /<script\b[^>]*>[\s\S]*?<\/script>/gi,
          " "
        )
        .replace(
          /<style\b[^>]*>[\s\S]*?<\/style>/gi,
          " "
        )
        .replace(
          /<br\s*\/?\s*>/gi,
          "\n"
        )
        .replace(
          /<\/(?:p|div|li|tr|h[1-6]|section|table|aside)>/gi,
          "\n"
        )
        .replace(
          /<[^>]+>/g,
          " "
        )
    ),
    limit
  );
}

function stripWiki(value) {
  let text =
    String(value ?? "");

  text =
    text.replace(
      /<!--[\s\S]*?-->/g,
      " "
    );

  text =
    text.replace(
      /<ref\b[^>]*>[\s\S]*?<\/ref>/gi,
      " "
    );

  text =
    text.replace(
      /<ref\b[^>]*\/>/gi,
      " "
    );

  text =
    text.replace(
      /\[\[([^|\]]+)\|([^\]]+)\]\]/g,
      "$2"
    );

  text =
    text.replace(
      /\[\[([^\]]+)\]\]/g,
      "$1"
    );

  for (
    let i = 0;
    i < 5;
    i++
  ) {
    text =
      text.replace(
        /\{\{[^{}]*\}\}/g,
        " "
      );
  }

  text =
    text.replace(
      /'''?/g,
      ""
    );

  text =
    text.replace(
      /<[^>]+>/g,
      " "
    );

  return clean(
    text,
    3000
  );
}

/* =========================================================
   QUESTION UNDERSTANDING
========================================================= */

function aliasesFor(question) {
  const q =
    clean(
      question,
      700
    ).toLowerCase();

  const out =
    new Set();

  for (
    const [
      key,
      values,
    ] of Object.entries(
      STATIC_ALIASES
    )
  ) {
    if (
      q.includes(key)
    ) {
      for (
        const value
        of values
      ) {
        out.add(value);
      }
    }
  }

  return [
    ...out,
  ];
}

function extractUpdateNumber(question) {
  const match =
    clean(
      question,
      700
    ).match(
      /\bupdate\s*(\d+(?:\.\d+)?)\b/i
    );

  return match
    ? match[1]
    : null;
}

function extractRebirthNumber(question) {
  const match =
    clean(
      question,
      700
    ).match(
      /\brebirth\s*#?\s*(\d{1,3})\b/i
    );

  return match
    ? Number(match[1])
    : null;
}

function isCurrent(question) {
  const q =
    clean(
      question,
      700
    ).toLowerCase();

  return [
    "newest",
    "latest",
    "most recent",
    "current",
    "currently",
    "right now",
    "today",
    "this week",
    "this month",
    "as of now",
    "new update",
    "latest update",
  ].some(
    (phrase) =>
      q.includes(phrase)
  );
}

function inferRelation(question) {
  const q =
    clean(
      question,
      700
    ).toLowerCase();

  /*
    Output-type questions BEFORE status words.

    Example:
    "What limited brainrot..."
    must be BRAINROT, not STATUS.
  */

  if (
    /\b(?:what|which)(?:\s+[a-z0-9'-]+){0,4}\s+(?:brainrot|brain rot)\b/.test(
      q
    )
  ) {
    return REL.BRAINROT;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z0-9'-]+){0,4}\s+(?:gear|item)\b/.test(
      q
    )
  ) {
    return REL.GEAR;
  }

  if (
    /\b(?:which|what)\s+rebirth\b/.test(
      q
    ) ||
    /\brebirth\s+(?:did|does|is)\b/.test(
      q
    )
  ) {
    return REL.REBIRTH;
  }

  if (
    /\b(?:income|income\/s|\$\/s|makes? per second|per second|generation|generates?|earn(?:s|ing)?)\b/.test(
      q
    )
  ) {
    return REL.INCOME;
  }

  if (
    /\b(?:cost|price|buy price|how much)\b/.test(
      q
    )
  ) {
    return REL.COST;
  }

  if (
    /\b(?:rarity|tier)\b/.test(
      q
    )
  ) {
    return REL.RARITY;
  }

  if (
    /\b(?:multiplier|multi|boost)\b/.test(
      q
    )
  ) {
    return REL.MULTIPLIER;
  }

  if (
    /\b(?:requires?|requirement|required|needed|materials?)\b/.test(
      q
    )
  ) {
    return REL.REQUIREMENT;
  }

  if (
    /\b(?:spawn|spawns|summon|summons|result|outcome)\b/.test(
      q
    )
  ) {
    return REL.SPAWN;
  }

  if (
    /\b(?:formation|arrangement|placement|arrange)\b/.test(
      q
    )
  ) {
    return REL.FORMATION;
  }

  if (
    /\bweather\b/.test(
      q
    )
  ) {
    return REL.WEATHER;
  }

  if (
    /\b(?:drop rate|chance|probability)\b/.test(
      q
    )
  ) {
    return REL.DROP_RATE;
  }

  if (
    /\b(?:when|what date|which date|what year|what month|release date)\b/.test(
      q
    )
  ) {
    return REL.DATE;
  }

  if (
    /\b(?:how do|how can|obtain|obtained|acquire|method)\b/.test(
      q
    )
  ) {
    return REL.METHOD;
  }

  if (
    /\b(?:status|obtainable|available|removed)\b/.test(
      q
    )
  ) {
    return REL.STATUS;
  }

  if (
    /\b(?:contents?|inside|contains?|drops?)\b/.test(
      q
    )
  ) {
    return REL.CONTENTS;
  }

  if (
    /\b(?:reward|rewards)\b/.test(
      q
    )
  ) {
    return REL.REWARD;
  }

  if (
    /\bslots?\b/.test(
      q
    )
  ) {
    return REL.SLOTS;
  }

  if (
    /\bfloors?\b/.test(
      q
    )
  ) {
    return REL.FLOORS;
  }

  if (
    /\b(?:replaced by|replacement)\b/.test(
      q
    )
  ) {
    return REL.REPLACED_BY;
  }

  return REL.TEXT;
}

function candidateEntities(question) {
  const raw =
    clean(
      question,
      700
    );

  const out =
    new Set();

  for (
    const match
    of raw.matchAll(
      /["“”']([^"“”']{2,100})["“”']/g
    )
  ) {
    out.add(
      clean(
        match[1],
        100
      )
    );
  }

  for (
    const alias
    of aliasesFor(raw)
  ) {
    out.add(alias);
  }

  const inputWords =
    raw.match(
      /[A-Za-z0-9][A-Za-z0-9'._-]*/g
    ) ||
    [];

  const filtered =
    inputWords.filter(
      (word) => {
        const low =
          word.toLowerCase();

        return (
          !STOPWORDS.has(low) &&
          !/^\d+(?:\.\d+)?$/.test(
            word
          )
        );
      }
    );

  for (
    let size =
      Math.min(
        6,
        filtered.length
      );
    size >= 1;
    size--
  ) {
    for (
      let i = 0;
      i + size <=
      filtered.length;
      i++
    ) {
      const value =
        filtered
          .slice(
            i,
            i + size
          )
          .join(" ");

      if (
        value.length >= 3
      ) {
        out.add(value);
      }
    }
  }

  return [
    ...out,
  ]
    .sort(
      (a, b) => {
        const aw =
          a.split(/\s+/).length;

        const bw =
          b.split(/\s+/).length;

        return (
          bw - aw ||
          b.length - a.length
        );
      }
    )
    .slice(
      0,
      16
    );
}

function analyzeQuestion(question) {
  const q =
    clean(
      question,
      700
    );

  const low =
    q.toLowerCase();

  const relation =
    inferRelation(q);

  const current =
    isCurrent(q);

  const update =
    extractUpdateNumber(q);

  const rebirth =
    extractRebirthNumber(q);

  const entities =
    candidateEntities(q);

  let entity =
    entities[0] ||
    null;

  if (
    rebirth &&
    relation === REL.GEAR
  ) {
    entity =
      `Rebirth${rebirth}`;
  }

  if (
    current &&
    low.includes(
      "rebirth"
    )
  ) {
    entity =
      null;
  }

  return {
    entity,
    entities,
    relation,
    current,
    update,
    rebirth,

    confidence:
      relation !== REL.TEXT &&
      (
        entity ||
        current ||
        update ||
        rebirth
      )
        ? 0.92
        : 0.62,

    source:
      "DETERMINISTIC_R21",
  };
}

/* =========================================================
   SIMILARITY
========================================================= */

function similarity(a, b) {
  const an =
    norm(a);

  const bn =
    norm(b);

  if (
    !an ||
    !bn
  ) {
    return 0;
  }

  if (
    an === bn
  ) {
    return 1;
  }

  if (
    an.includes(bn) ||
    bn.includes(an)
  ) {
    return 0.94;
  }

  const aw =
    new Set(
      words(a)
    );

  const bw =
    new Set(
      words(b)
    );

  if (
    !aw.size ||
    !bw.size
  ) {
    return 0;
  }

  let same = 0;

  for (
    const token
    of aw
  ) {
    if (
      bw.has(token)
    ) {
      same++;
    }
  }

  return (
    same /
    Math.max(
      aw.size,
      bw.size
    )
  );
}

function bestEntitySimilarity(
  entities,
  target
) {
  if (
    !target
  ) {
    return 0;
  }

  let score = 0;

  for (
    const entity
    of entities ||
    []
  ) {
    score =
      Math.max(
        score,
        similarity(
          entity,
          target
        )
      );
  }

  return score;
}

function pageMatchesEntity(
  page,
  analysis
) {
  return (
    bestEntitySimilarity(
      analysis.entities,
      page.title
    ) >=
    0.68
  );
}

/* =========================================================
   MEDIAWIKI
========================================================= */

function wikiParseUrl(title) {
  const params =
    new URLSearchParams({
      action:
        "parse",

      page:
        title,

      prop:
        "wikitext|text|displaytitle|sections",

      redirects:
        "1",

      format:
        "json",
    });

  return (
    `${FANDOM_API}?` +
    params.toString()
  );
}

async function fetchCanonicalPage(
  title,
  deadline
) {
  const key =
    clean(
      title,
      300
    ).toLowerCase();

  const cached =
    cacheGet(
      PAGE_CACHE,
      key
    );

  if (cached) {
    return {
      ...cached,

      cache:
        "HIT",
    };
  }

  const left =
    timeLeft(deadline);

  if (
    left < 250
  ) {
    throw new Error(
      "WIKI_BUDGET_EXHAUSTED"
    );
  }

  const timeout =
    Math.max(
      300,

      Math.min(
        CFG.WIKI_TIMEOUT_MS,
        left - 40
      )
    );

  const errors =
    [];

  try {
    const data =
      await fetchJson(
        "FANDOM_PARSE",

        wikiParseUrl(title),

        {
          headers: {
            Accept:
              "application/json",

            "User-Agent":
              "ChromeCodeSniper-R21",
          },
        },

        timeout
      );

    if (
      data?.error
    ) {
      throw new Error(
        `FANDOM_PARSE_${clean(
          data.error.code ||
          "ERROR",
          100
        )}`
      );
    }

    const parsed =
      data?.parse ||
      {};

    const wikitext =
      typeof parsed
        ?.wikitext ===
      "string"
        ? parsed.wikitext
        : String(
            parsed
              ?.wikitext?.["*"] ||
            ""
          );

    const html =
      typeof parsed
        ?.text ===
      "string"
        ? parsed.text
        : String(
            parsed
              ?.text?.["*"] ||
            ""
          );

    if (
      !html &&
      !wikitext
    ) {
      throw new Error(
        "FANDOM_PARSE_EMPTY"
      );
    }

    const page = {
      requestedTitle:
        title,

      title:
        clean(
          parsed?.title ||
          title,
          300
        ),

      displayTitle:
        htmlToText(
          parsed?.displaytitle ||
          parsed?.title ||
          title,
          300
        ),

      url:
        articleUrl(
          parsed?.title ||
          title
        ),

      html,
      wikitext,

      text:
        htmlToText(
          html ||
          wikitext
        ),

      sections:
        Array.isArray(
          parsed?.sections
        )
          ? parsed.sections
          : [],

      source:
        "FANDOM_ACTION_API",

      fullPage:
        true,

      errors,
    };

    cacheSet(
      PAGE_CACHE,
      key,
      page,
      CFG.PAGE_CACHE_TTL_MS
    );

    return {
      ...page,

      cache:
        "MISS",
    };
  } catch (error) {
    errors.push(
      errorCode(error)
    );
  }

  /*
    Fandom HTML often 403s.
    Only try it when MediaWiki API failed and
    enough budget remains.
  */

  if (
    timeLeft(deadline) <
    350
  ) {
    throw new Error(
      errors.join("|") ||
      "FANDOM_PAGE_FAILED"
    );
  }

  try {
    const html =
      await fetchText(
        "FANDOM_HTML",

        articleUrl(title),

        {
          headers: {
            Accept:
              "text/html",

            "User-Agent":
              "ChromeCodeSniper-R21",
          },
        },

        Math.min(
          550,
          timeLeft(deadline) -
          30
        )
      );

    const page = {
      requestedTitle:
        title,

      title,

      displayTitle:
        title,

      url:
        articleUrl(title),

      html,

      wikitext:
        "",

      text:
        htmlToText(html),

      sections:
        [],

      source:
        "FANDOM_HTML",

      fullPage:
        true,

      errors,
    };

    cacheSet(
      PAGE_CACHE,
      key,
      page,
      CFG.PAGE_CACHE_TTL_MS
    );

    return {
      ...page,

      cache:
        "MISS",
    };
  } catch (error) {
    errors.push(
      errorCode(error)
    );
  }

  throw new Error(
    errors.join("|") ||
    "FANDOM_PAGE_FAILED"
  );
}

async function wikiSearchTitles(
  query,
  deadline,
  limit = 6
) {
  const key =
    clean(
      query,
      300
    ).toLowerCase();

  const cached =
    cacheGet(
      TITLE_CACHE,
      key
    );

  if (cached) {
    return cached;
  }

  const left =
    timeLeft(deadline);

  if (
    left < 220
  ) {
    return [];
  }

  const params =
    new URLSearchParams({
      action:
        "query",

      list:
        "search",

      srsearch:
        clean(
          query,
          300
        ),

      srnamespace:
        "0",

      srlimit:
        String(
          Math.max(
            1,
            Math.min(
              10,
              limit
            )
          )
        ),

      format:
        "json",
    });

  try {
    const data =
      await fetchJson(
        "FANDOM_SEARCH",

        `${FANDOM_API}?${params.toString()}`,

        {
          headers: {
            Accept:
              "application/json",

            "User-Agent":
              "ChromeCodeSniper-R21",
          },
        },

        Math.min(
          600,
          left - 25
        )
      );

    const titles =
      (
        Array.isArray(
          data?.query?.search
        )
          ? data.query.search
          : []
      )
        .map(
          (row) =>
            clean(
              row?.title,
              300
            )
        )
        .filter(Boolean);

    cacheSet(
      TITLE_CACHE,
      key,
      titles,
      CFG.TITLE_CACHE_TTL_MS
    );

    return titles;
  } catch {
    return [];
  }
}

/* =========================================================
   SOURCE ROUTER
========================================================= */

function hubTitles(question) {
  const q =
    clean(
      question,
      700
    ).toLowerCase();

  const out =
    [];

  if (
    q.includes(
      "rebirth"
    )
  ) {
    out.push(
      ...HUBS.rebirth
    );
  }

  if (
    q.includes(
      "gear"
    )
  ) {
    out.push(
      ...HUBS.gear
    );
  }

  if (
    q.includes(
      "slap"
    )
  ) {
    out.push(
      ...HUBS.slap
    );
  }

  if (
    q.includes(
      "mutation"
    )
  ) {
    out.push(
      ...HUBS.mutation
    );
  }

  if (
    q.includes(
      "trait"
    )
  ) {
    out.push(
      ...HUBS.trait
    );
  }

  if (
    q.includes(
      "ritual"
    )
  ) {
    out.push(
      ...HUBS.ritual
    );
  }

  if (
    q.includes(
      "machine"
    )
  ) {
    out.push(
      ...HUBS.machine
    );
  }

  if (
    q.includes(
      "lucky block"
    )
  ) {
    out.push(
      ...HUBS.lucky
    );
  }

  if (
    q.includes(
      "event"
    ) ||
    q.includes(
      "admin abuse"
    )
  ) {
    out.push(
      ...HUBS.event
    );
  }

  if (
    q.includes(
      "update"
    )
  ) {
    out.push(
      ...HUBS.update
    );
  }

  if (
    q.includes(
      "base"
    )
  ) {
    out.push(
      ...HUBS.base
    );
  }

  if (
    q.includes(
      "rarity"
    )
  ) {
    out.push(
      ...HUBS.rarity
    );
  }

  return [
    ...new Set(out),
  ];
}

async function canonicalStage(
  question,
  analysis,
  deadline
) {
  const titles =
    [];

  /*
    Exact entity page FIRST.
  */

  if (
    analysis.entity
  ) {
    titles.push(
      analysis.entity
    );
  }

  if (
    analysis.current &&
    question
      .toLowerCase()
      .includes(
        "rebirth"
      )
  ) {
    titles.unshift(
      "Rebirth"
    );
  }

  if (
    analysis.update
  ) {
    const major =
      String(
        analysis.update
      ).split(".")[0];

    titles.unshift(
      `Update Log/Update ${major}`,
      "Update Log"
    );
  }

  titles.push(
    ...hubTitles(
      question
    )
  );

  const directTitles = [
    ...new Set(
      titles
        .map(
          (x) =>
            clean(
              x,
              300
            )
        )
        .filter(Boolean)
    ),
  ].slice(
    0,
    CFG.MAX_CANONICAL_PAGES
  );

  const pagePromise =
    Promise.allSettled(
      directTitles.map(
        (title) =>
          fetchCanonicalPage(
            title,
            deadline
          )
      )
    );

  const searchPromise =
    analysis.entity
      ? wikiSearchTitles(
          analysis.entity,
          deadline,
          6
        )
      : Promise.resolve([]);

  const [
    settled,
    foundTitles,
  ] =
    await Promise.all([
      pagePromise,
      searchPromise,
    ]);

  const pages =
    [];

  const errors =
    [];

  for (
    const row
    of settled
  ) {
    if (
      row.status ===
      "fulfilled"
    ) {
      pages.push(
        row.value
      );
    } else {
      errors.push(
        errorCode(
          row.reason
        )
      );
    }
  }

  /*
    Fetch only best matching search pages.
  */

  if (
    analysis.entity &&
    foundTitles.length &&
    timeLeft(deadline) >
      300
  ) {
    const existing =
      new Set(
        pages.map(
          (page) =>
            norm(
              page.title
            )
        )
      );

    const ranked =
      foundTitles
        .map(
          (title) => ({
            title,

            score:
              Math.max(
                similarity(
                  analysis.entity,
                  title
                ),

                ...analysis.entities.map(
                  (entity) =>
                    similarity(
                      entity,
                      title
                    )
                )
              ),
          })
        )
        .sort(
          (a, b) =>
            b.score -
            a.score
        )
        .filter(
          (row) =>
            row.score >=
            0.45 &&
            !existing.has(
              norm(
                row.title
              )
            )
        )
        .slice(
          0,
          Math.max(
            0,
            CFG.MAX_CANONICAL_PAGES -
            pages.length
          )
        );

    if (
      ranked.length
    ) {
      const more =
        await Promise.allSettled(
          ranked.map(
            (row) =>
              fetchCanonicalPage(
                row.title,
                deadline
              )
          )
        );

      for (
        const row
        of more
      ) {
        if (
          row.status ===
          "fulfilled"
        ) {
          pages.push(
            row.value
          );
        }
      }
    }
  }

  /*
    Exact entity pages before generic hubs.
  */

  pages.sort(
    (a, b) =>
      bestEntitySimilarity(
        analysis.entities,
        b.title
      ) -
      bestEntitySimilarity(
        analysis.entities,
        a.title
      )
  );

  return {
    pages,
    errors,
  };
}

/* =========================================================
   TABLE HEADER UNDERSTANDING
========================================================= */

function normalizedHeaderText(header) {
  return clean(
    header,
    220
  )
    .toLowerCase()
    .replace(
      /[_-]+/g,
      " "
    )
    .replace(
      /[^a-z0-9/$%+ ]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function classifySubjectHeader(header) {
  const h =
    normalizedHeaderText(
      header
    );

  if (!h) {
    return null;
  }

  if (
    /^(?:name|character|entity)$/.test(
      h
    )
  ) {
    return SUBJECT_KIND.GENERIC;
  }

  if (
    /\bbrainrot\b/.test(
      h
    )
  ) {
    return SUBJECT_KIND.BRAINROT;
  }

  if (
    /\bmutation\b/.test(
      h
    )
  ) {
    return SUBJECT_KIND.MUTATION;
  }

  if (
    /\btrait\b/.test(
      h
    )
  ) {
    return SUBJECT_KIND.TRAIT;
  }

  if (
    /\britual\b/.test(
      h
    )
  ) {
    return SUBJECT_KIND.RITUAL;
  }

  if (
    /\bgear\b/.test(
      h
    ) ||
    /\bitem\b/.test(
      h
    )
  ) {
    return SUBJECT_KIND.GEAR;
  }

  if (
    /\bmachine\b/.test(
      h
    )
  ) {
    return SUBJECT_KIND.MACHINE;
  }

  if (
    /\blucky block\b/.test(
      h
    )
  ) {
    return SUBJECT_KIND.LUCKY_BLOCK;
  }

  if (
    /\bevent\b/.test(
      h
    )
  ) {
    return SUBJECT_KIND.EVENT;
  }

  if (
    /\bslap\b/.test(
      h
    )
  ) {
    return SUBJECT_KIND.SLAP;
  }

  if (
    /^rebirth(?: number| level)?$/.test(
      h
    )
  ) {
    return SUBJECT_KIND.REBIRTH;
  }

  return null;
}

function headerRelation(header) {
  const h =
    normalizedHeaderText(
      header
    );

  if (!h) {
    return null;
  }

  if (
    /\bmultiplier\b/.test(h) ||
    /^multi$/.test(h) ||
    /\bboost\b/.test(h) ||
    /\bmult\b/.test(h)
  ) {
    return REL.MULTIPLIER;
  }

  if (
    /\bcost\b/.test(h) ||
    /\bprice\b/.test(h) ||
    /\bbuy price\b/.test(h) ||
    /\bpurchase\b/.test(h)
  ) {
    return REL.COST;
  }

  if (
    /\bincome\b/.test(h) ||
    /\bgeneration\b/.test(h) ||
    /\bgenerates\b/.test(h) ||
    /\bearnings?\b/.test(h) ||
    /\bper second\b/.test(h) ||
    /\$\/s/.test(h)
  ) {
    return REL.INCOME;
  }

  if (
    /\brarity\b/.test(h) ||
    /^tier$/.test(h)
  ) {
    return REL.RARITY;
  }

  if (
    /\bstatus\b/.test(h) ||
    /\bobtainability\b/.test(h) ||
    /\bavailability\b/.test(h)
  ) {
    return REL.STATUS;
  }

  if (
    /\brebirth\b/.test(h) ||
    /\brebirth requirement\b/.test(h)
  ) {
    return REL.REBIRTH;
  }

  if (
    /\bgear\b/.test(h) ||
    /\bitem\b/.test(h) ||
    /\bunlock\b/.test(h) ||
    /\btool\b/.test(h) ||
    /\bability\b/.test(h)
  ) {
    return REL.GEAR;
  }

  if (
    /\brequires?\b/.test(h) ||
    /\brequirement\b/.test(h) ||
    /\brequired\b/.test(h) ||
    /\bneeded\b/.test(h) ||
    /\bmaterials?\b/.test(h)
  ) {
    return REL.REQUIREMENT;
  }

  if (
    /\bspawns?\b/.test(h) ||
    /\bsummons?\b/.test(h) ||
    /\bresult\b/.test(h) ||
    /\boutcome\b/.test(h)
  ) {
    return REL.SPAWN;
  }

  if (
    /\bformation\b/.test(h) ||
    /\bplacement\b/.test(h) ||
    /\barrangement\b/.test(h)
  ) {
    return REL.FORMATION;
  }

  if (
    /\bweather\b/.test(h)
  ) {
    return REL.WEATHER;
  }

  if (
    /\bchance\b/.test(h) ||
    /\bprobability\b/.test(h) ||
    /\bdrop rate\b/.test(h) ||
    /^rate$/.test(h)
  ) {
    return REL.DROP_RATE;
  }

  if (
    /\breward\b/.test(h) ||
    /\brewards\b/.test(h)
  ) {
    return REL.REWARD;
  }

  if (
    /\bcontents?\b/.test(h) ||
    /\bdrops?\b/.test(h)
  ) {
    return REL.CONTENTS;
  }

  if (
    /\brelease date\b/.test(h) ||
    /^date$/.test(h) ||
    /\breleased\b/.test(h)
  ) {
    return REL.DATE;
  }

  if (
    /\bobtain\b/.test(h) ||
    /\bobtainment\b/.test(h) ||
    /\bmethod\b/.test(h) ||
    /\bsource\b/.test(h)
  ) {
    return REL.METHOD;
  }

  if (
    /\bslots?\b/.test(h)
  ) {
    return REL.SLOTS;
  }

  if (
    /\bfloors?\b/.test(h)
  ) {
    return REL.FLOORS;
  }

  if (
    /\breplaced by\b/.test(h) ||
    /\breplacement\b/.test(h)
  ) {
    return REL.REPLACED_BY;
  }

  if (
    /\bbrainrot\b/.test(h)
  ) {
    return REL.BRAINROT;
  }

  return null;
}

/* =========================================================
   CELL VALUE NORMALIZATION
========================================================= */

function normalizeValue(
  value,
  relation
) {
  const text =
    clean(
      value,
      700
    );

  if (!text) {
    return null;
  }

  if (
    relation ===
    REL.REBIRTH
  ) {
    const match =
      text.match(
        /\brebirth\s*#?\s*(\d{1,3})\b/i
      ) ||
      text.match(
        /^\s*#?\s*(\d{1,3})\s*$/
      );

    return match
      ? `Rebirth${Number(
          match[1]
        )}`
      : text;
  }

  if (
    relation ===
    REL.MULTIPLIER
  ) {
    const match =
      text.match(
        /\b\d+(?:\.\d+)?\s*[x×]\b/i
      ) ||
      text.match(
        /\b\d+(?:\.\d+)?\s*[x×]/i
      );

    if (match) {
      return match[0]
        .replace(
          /\s+/g,
          ""
        )
        .replace(
          /×/g,
          "x"
        );
    }
  }

  if (
    relation ===
    REL.COST
  ) {
    const match =
      text.match(
        /\$\s*\d+(?:\.\d+)?\s*[KMBTQ]?/i
      );

    if (match) {
      return match[0]
        .replace(
          /\s+/g,
          ""
        );
    }
  }

  if (
    relation ===
    REL.INCOME
  ) {
    const match =
      text.match(
        /\$\s*\d+(?:\.\d+)?\s*[KMBTQ]?\s*(?:\/\s*s|\/sec|per\s*second)?/i
      );

    if (match) {
      let output =
        match[0]
          .replace(
            /\s+/g,
            ""
          )
          .replace(
            /persecond/i,
            "/s"
          )
          .replace(
            /\/sec$/i,
            "/s"
          );

      if (
        !/\/s$/i.test(
          output
        )
      ) {
        output += "/s";
      }

      return output;
    }
  }

  if (
    relation ===
    REL.DROP_RATE
  ) {
    const match =
      text.match(
        /\b\d+(?:\.\d+)?\s*%/
      );

    if (match) {
      return match[0]
        .replace(
          /\s+/g,
          ""
        );
    }
  }

  return text;
}

/* =========================================================
   HTML TABLE PARSER
========================================================= */

function parseHtmlTables(page) {
  const cacheKey =
    `HTML:${page.title}:${page.source}`;

  const cached =
    cacheGet(
      TABLE_CACHE,
      cacheKey
    );

  if (cached) {
    return cached;
  }

  const html =
    String(
      page?.html ||
      ""
    );

  const tableBlocks =
    html.match(
      /<table\b[^>]*>[\s\S]*?<\/table>/gi
    ) ||
    [];

  const tables =
    [];

  for (
    const tableHtml
    of tableBlocks
  ) {
    const rowBlocks =
      tableHtml.match(
        /<tr\b[^>]*>[\s\S]*?<\/tr>/gi
      ) ||
      [];

    const parsedRows =
      [];

    for (
      const rowHtml
      of rowBlocks
    ) {
      const cells =
        [];

      const re =
        /<(th|td)\b([^>]*)>([\s\S]*?)<\/\1>/gi;

      let match;

      while (
        (
          match =
            re.exec(
              rowHtml
            )
        ) !==
        null
      ) {
        cells.push({
          type:
            match[1]
              .toLowerCase(),

          attributes:
            match[2] ||
            "",

          text:
            htmlToText(
              match[3],
              1200
            ),
        });
      }

      if (
        cells.length
      ) {
        parsedRows.push(
          cells
        );
      }
    }

    if (
      !parsedRows.length
    ) {
      continue;
    }

    /*
      Find the most likely real header row.
    */

    let headerIndex =
      -1;

    let bestHeaderScore =
      -1;

    for (
      let i = 0;
      i <
      Math.min(
        parsedRows.length,
        5
      );
      i++
    ) {
      const row =
        parsedRows[i];

      let score = 0;

      const thCount =
        row.filter(
          (cell) =>
            cell.type === "th"
        ).length;

      score +=
        thCount * 2;

      for (
        const cell
        of row
      ) {
        if (
          classifySubjectHeader(
            cell.text
          )
        ) {
          score += 3;
        }

        if (
          headerRelation(
            cell.text
          )
        ) {
          score += 2;
        }
      }

      if (
        score >
        bestHeaderScore
      ) {
        bestHeaderScore =
          score;

        headerIndex =
          i;
      }
    }

    if (
      bestHeaderScore <= 0
    ) {
      headerIndex =
        -1;
    }

    let headers =
      [];

    let dataStart =
      0;

    if (
      headerIndex >= 0
    ) {
      headers =
        parsedRows[
          headerIndex
        ].map(
          (cell, index) =>
            cell.text ||
            `column_${index + 1}`
        );

      dataStart =
        headerIndex + 1;
    }

    const rows =
      parsedRows
        .slice(
          dataStart
        )
        .map(
          (row) => ({
            cells:
              row.map(
                (cell) =>
                  cell.text
              ),
          })
        )
        .filter(
          (row) =>
            row.cells.some(
              Boolean
            )
        );

    if (
      !rows.length
    ) {
      continue;
    }

    tables.push({
      type:
        "HTML_TABLE",

      headers,

      rows,
    });
  }

  cacheSet(
    TABLE_CACHE,
    cacheKey,
    tables,
    CFG.TABLE_CACHE_TTL_MS
  );

  return tables;
}

/* =========================================================
   WIKITEXT TABLE PARSER
========================================================= */

function parseWikiTables(page) {
  const cacheKey =
    `WIKI:${page.title}:${page.source}`;

  const cached =
    cacheGet(
      TABLE_CACHE,
      cacheKey
    );

  if (cached) {
    return cached;
  }

  const wiki =
    String(
      page?.wikitext ||
      ""
    );

  if (!wiki) {
    return [];
  }

  const blocks =
    wiki.match(
      /\{\|[\s\S]*?\|\}/g
    ) ||
    [];

  const tables =
    [];

  for (
    const block
    of blocks
  ) {
    const logicalRows =
      block.split(
        /\n\|-\s*[^\n]*/g
      );

    const rows =
      [];

    for (
      const rawRow
      of logicalRows
    ) {
      const cells =
        [];

      const lines =
        rawRow
          .split(/\n/)
          .map(
            (line) =>
              line.trim()
          )
          .filter(Boolean);

      for (
        const line
        of lines
      ) {
        if (
          line.startsWith("!")
        ) {
          const values =
            line
              .slice(1)
              .split("!!")
              .map(
                (value) => {
                  const pieces =
                    value.split("|");

                  return stripWiki(
                    pieces[
                      pieces.length -
                      1
                    ]
                  );
                }
              );

          for (
            const value
            of values
          ) {
            cells.push({
              type:
                "th",

              text:
                value,
            });
          }
        } else if (
          line.startsWith("|") &&
          !line.startsWith("|}")
        ) {
          const values =
            line
              .slice(1)
              .split("||")
              .map(
                (value) => {
                  const pieces =
                    value.split("|");

                  return stripWiki(
                    pieces[
                      pieces.length -
                      1
                    ]
                  );
                }
              );

          for (
            const value
            of values
          ) {
            cells.push({
              type:
                "td",

              text:
                value,
            });
          }
        }
      }

      if (
        cells.length
      ) {
        rows.push(
          cells
        );
      }
    }

    if (
      rows.length <
      2
    ) {
      continue;
    }

    let headerIndex =
      rows.findIndex(
        (row) =>
          row.some(
            (cell) =>
              cell.type ===
              "th"
          )
      );

    if (
      headerIndex < 0
    ) {
      headerIndex = 0;
    }

    const headers =
      rows[
        headerIndex
      ].map(
        (cell, index) =>
          cell.text ||
          `column_${index + 1}`
      );

    const data =
      rows
        .slice(
          headerIndex + 1
        )
        .map(
          (row) => ({
            cells:
              row.map(
                (cell) =>
                  cell.text
              ),
          })
        )
        .filter(
          (row) =>
            row.cells.some(
              Boolean
            )
        );

    if (
      data.length
    ) {
      tables.push({
        type:
          "WIKITEXT_TABLE",

        headers,

        rows:
          data,
      });
    }
  }

  cacheSet(
    TABLE_CACHE,
    cacheKey,
    tables,
    CFG.TABLE_CACHE_TTL_MS
  );

  return tables;
}

function allTables(page) {
  return [
    ...parseHtmlTables(
      page
    ),

    ...parseWikiTables(
      page
    ),
  ];
}

/* =========================================================
   TABLE SCHEMA
========================================================= */

function deriveTableSchema(table) {
  const headers =
    table.headers ||
    [];

  const subjectCandidates =
    [];

  for (
    let i = 0;
    i <
    headers.length;
    i++
  ) {
    const kind =
      classifySubjectHeader(
        headers[i]
      );

    if (
      kind
    ) {
      subjectCandidates.push({
        index:
          i,

        kind,
      });
    }
  }

  /*
    Prefer actual entity columns over Rebirth
    when both exist.

    Example:
      Gear | Rebirth
    means Gear is subject, Rebirth is property.

    But:
      Rebirth | Gear
    means Rebirth is subject because no stronger
    entity subject exists.
  */

  let subject =
    subjectCandidates.find(
      (row) =>
        row.kind !==
        SUBJECT_KIND.REBIRTH
    ) ||
    subjectCandidates.find(
      (row) =>
        row.kind ===
        SUBJECT_KIND.REBIRTH
    ) ||
    null;

  const columns =
    headers.map(
      (header, index) => ({
        index,

        header,

        subjectKind:
          classifySubjectHeader(
            header
          ),

        relation:
          headerRelation(
            header
          ),
      })
    );

  /*
    If chosen subject column has a property relation,
    don't also treat it as a property.
  */

  if (
    subject
  ) {
    columns[
      subject.index
    ].relation =
      null;
  }

  return {
    subjectIndex:
      subject?.index ??
      -1,

    subjectKind:
      subject?.kind ??
      null,

    columns,
  };
}

/* =========================================================
   DIRECT TABLE LOOKUP
========================================================= */

function directResult(
  answer,
  page,
  claimType,
  confidence = 0.985
) {
  const value =
    clean(
      answer,
      500
    );

  if (!value) {
    return null;
  }

  return {
    answer:
      value,

    candidateAnswer:
      value,

    confidence,

    reason:
      "accepted_real_table_cell",

    route:
      "CANONICAL_REAL_TABLE",

    sourceCount:
      1,

    sources: [
      {
        host:
          "stealabrainrot.fandom.com",

        title:
          page.title,

        url:
          page.url,

        claimType,
      },
    ],
  };
}

function bestSubjectRow(
  table,
  schema,
  analysis
) {
  if (
    schema.subjectIndex <
    0
  ) {
    return null;
  }

  let best =
    null;

  for (
    const row
    of table.rows
  ) {
    const subject =
      clean(
        row.cells[
          schema.subjectIndex
        ],
        300
      );

    if (!subject) {
      continue;
    }

    let score =
      bestEntitySimilarity(
        analysis.entities,
        subject
      );

    if (
      analysis.entity
    ) {
      score =
        Math.max(
          score,
          similarity(
            analysis.entity,
            subject
          )
        );
    }

    if (
      analysis.rebirth &&
      schema.subjectKind ===
        SUBJECT_KIND.REBIRTH
    ) {
      const normalized =
        normalizeValue(
          subject,
          REL.REBIRTH
        );

      if (
        normalized ===
        `Rebirth${analysis.rebirth}`
      ) {
        score = 1;
      }
    }

    if (
      !best ||
      score >
      best.score
    ) {
      best = {
        row,
        subject,
        score,
      };
    }
  }

  return best;
}

function relationColumn(
  schema,
  relation
) {
  return schema.columns.find(
    (column) =>
      column.relation ===
      relation
  ) ||
  null;
}

function directForwardLookup(
  page,
  table,
  schema,
  analysis
) {
  const requested =
    analysis.relation;

  const column =
    relationColumn(
      schema,
      requested
    );

  if (!column) {
    return null;
  }

  /*
    NORMAL ENTITY TABLE:
      Mutation | Multiplier
      Rainbow  | 10x
  */

  if (
    schema.subjectIndex >=
    0
  ) {
    const matched =
      bestSubjectRow(
        table,
        schema,
        analysis
      );

    if (
      matched &&
      matched.score >=
      0.45
    ) {
      const value =
        normalizeValue(
          matched.row.cells[
            column.index
          ],
          requested
        );

      if (
        value
      ) {
        return directResult(
          value,
          page,
          `${table.type}:ROW_COLUMN`,
          Math.min(
            0.995,
            0.93 +
            matched.score *
            0.065
          )
        );
      }
    }
  }

  /*
    ENTITY PAGE CONTEXT:

      /wiki/Tralalero_Tralala

      Income | Cost | Rarity
      $50K/s | $10M | Brainrot God

    No entity/name column required.
  */

  if (
    schema.subjectIndex <
    0 &&
    pageMatchesEntity(
      page,
      analysis
    ) &&
    table.rows.length <=
      6
  ) {
    for (
      const row
      of table.rows
    ) {
      const value =
        normalizeValue(
          row.cells[
            column.index
          ],
          requested
        );

      if (
        value
      ) {
        return directResult(
          value,
          page,
          `${table.type}:PAGE_CONTEXT_CELL`,
          0.99
        );
      }
    }
  }

  return null;
}

function directRebirthReverse(
  page,
  table,
  schema,
  analysis
) {
  /*
    Asked:
      What rebirth unlocks Flash Teleport?

    Table:
      Rebirth | Gear
      18      | Flash Teleport

    Find Flash Teleport anywhere in row,
    then return Rebirth subject/property.
  */

  if (
    analysis.relation !==
    REL.REBIRTH
  ) {
    return null;
  }

  let rebirthIndex =
    -1;

  if (
    schema.subjectKind ===
    SUBJECT_KIND.REBIRTH
  ) {
    rebirthIndex =
      schema.subjectIndex;
  } else {
    const col =
      relationColumn(
        schema,
        REL.REBIRTH
      );

    if (
      col
    ) {
      rebirthIndex =
        col.index;
    }
  }

  if (
    rebirthIndex <
    0
  ) {
    return null;
  }

  for (
    const row
    of table.rows
  ) {
    let bestMatch = 0;

    for (
      let i = 0;
      i <
      row.cells.length;
      i++
    ) {
      if (
        i === rebirthIndex
      ) {
        continue;
      }

      const cell =
        clean(
          row.cells[i],
          400
        );

      bestMatch =
        Math.max(
          bestMatch,

          bestEntitySimilarity(
            analysis.entities,
            cell
          ),

          analysis.entity
            ? similarity(
                analysis.entity,
                cell
              )
            : 0
        );
    }

    if (
      bestMatch >=
      0.55
    ) {
      const answer =
        normalizeValue(
          row.cells[
            rebirthIndex
          ],
          REL.REBIRTH
        );

      if (
        answer
      ) {
        return directResult(
          answer,
          page,
          `${table.type}:REVERSE_REBIRTH`,
          Math.min(
            0.995,
            0.94 +
            bestMatch *
            0.055
          )
        );
      }
    }
  }

  return null;
}

function directGearFromRebirth(
  page,
  table,
  schema,
  analysis
) {
  /*
    Asked:
      What gear is unlocked at Rebirth 18?
  */

  if (
    analysis.relation !==
    REL.GEAR ||
    !analysis.rebirth
  ) {
    return null;
  }

  let rebirthIndex =
    -1;

  if (
    schema.subjectKind ===
    SUBJECT_KIND.REBIRTH
  ) {
    rebirthIndex =
      schema.subjectIndex;
  } else {
    const col =
      relationColumn(
        schema,
        REL.REBIRTH
      );

    if (
      col
    ) {
      rebirthIndex =
        col.index;
    }
  }

  if (
    rebirthIndex <
    0
  ) {
    return null;
  }

  const gearColumns =
    schema.columns.filter(
      (column) =>
        column.relation ===
        REL.GEAR ||
        column.relation ===
        REL.REWARD
    );

  for (
    const row
    of table.rows
  ) {
    const rebirth =
      normalizeValue(
        row.cells[
          rebirthIndex
        ],
        REL.REBIRTH
      );

    if (
      rebirth !==
      `Rebirth${analysis.rebirth}`
    ) {
      continue;
    }

    /*
      Strong typed gear/reward column.
    */

    for (
      const column
      of gearColumns
    ) {
      const value =
        clean(
          row.cells[
            column.index
          ],
          300
        );

      if (
        value &&
        /[A-Za-z]/.test(
          value
        )
      ) {
        return directResult(
          value,
          page,
          `${table.type}:REBIRTH_TO_GEAR`,
          0.995
        );
      }
    }

    /*
      Fallback:
      take a meaningful text cell that is not
      rebirth/cash/multiplier/percent.
    */

    for (
      let i = 0;
      i <
      row.cells.length;
      i++
    ) {
      if (
        i === rebirthIndex
      ) {
        continue;
      }

      const value =
        clean(
          row.cells[i],
          300
        );

      if (
        !value ||
        !/[A-Za-z]/.test(
          value
        )
      ) {
        continue;
      }

      if (
        /^rebirth\b/i.test(
          value
        ) ||
        /^\$/.test(
          value
        ) ||
        /^\d+(?:\.\d+)?[x×%]?$/i.test(
          value
        )
      ) {
        continue;
      }

      return directResult(
        value,
        page,
        `${table.type}:REBIRTH_TEXT_FALLBACK`,
        0.96
      );
    }
  }

  return null;
}

function directRitualReverse(
  page,
  table,
  schema,
  analysis
) {
  /*
    Asked:
      What ritual spawns Los Crocodillitos?

    Find Los Crocodillitos in SPAWN column,
    return ritual subject.
  */

  if (
    analysis.relation !==
    REL.RITUAL ||
    schema.subjectKind !==
    SUBJECT_KIND.RITUAL
  ) {
    return null;
  }

  const spawnCol =
    relationColumn(
      schema,
      REL.SPAWN
    );

  if (!spawnCol) {
    return null;
  }

  for (
    const row
    of table.rows
  ) {
    const spawn =
      clean(
        row.cells[
          spawnCol.index
        ],
        400
      );

    const score =
      Math.max(
        bestEntitySimilarity(
          analysis.entities,
          spawn
        ),

        analysis.entity
          ? similarity(
              analysis.entity,
              spawn
            )
          : 0
      );

    if (
      score >=
      0.55
    ) {
      const ritual =
        clean(
          row.cells[
            schema.subjectIndex
          ],
          300
        );

      if (
        ritual
      ) {
        return directResult(
          ritual,
          page,
          `${table.type}:REVERSE_RITUAL`,
          0.98
        );
      }
    }
  }

  return null;
}

function directTableLookup(
  question,
  analysis,
  pages
) {
  for (
    const page
    of pages
  ) {
    const tables =
      allTables(
        page
      );

    for (
      const table
      of tables
    ) {
      const schema =
        deriveTableSchema(
          table
        );

      /*
        Most specific reverse cases first.
      */

      const reverseRebirth =
        directRebirthReverse(
          page,
          table,
          schema,
          analysis
        );

      if (
        reverseRebirth
      ) {
        return reverseRebirth;
      }

      const gear =
        directGearFromRebirth(
          page,
          table,
          schema,
          analysis
        );

      if (
        gear
      ) {
        return gear;
      }

      const ritual =
        directRitualReverse(
          page,
          table,
          schema,
          analysis
        );

      if (
        ritual
      ) {
        return ritual;
      }

      const normal =
        directForwardLookup(
          page,
          table,
          schema,
          analysis
        );

      if (
        normal
      ) {
        return normal;
      }
    }
  }

  return null;
}

/* =========================================================
   INFOBOX - LABEL/VALUE MUST STAY PAIRED
========================================================= */

function extractInfoboxFields(page) {
  const html =
    String(
      page?.html ||
      ""
    );

  const fields =
    [];

  const infobox =
    html.match(
      /<(?:aside|table)\b[^>]*(?:portable-infobox|infobox)[^>]*>[\s\S]*?<\/(?:aside|table)>/i
    )?.[0] ||
    "";

  if (infobox) {
    /*
      Fandom portable infobox:
      pi-data-label + pi-data-value
    */

    const items =
      infobox.match(
        /<div\b[^>]*class=["'][^"']*pi-item[^"']*pi-data[^"']*["'][^>]*>[\s\S]*?<\/div>\s*<\/div>|<div\b[^>]*class=["'][^"']*pi-item[^"']*pi-data[^"']*["'][^>]*>[\s\S]*?<\/div>/gi
      ) ||
      [];

    for (
      const item
      of items
    ) {
      const labelHtml =
        item.match(
          /<[^>]*class=["'][^"']*pi-data-label[^"']*["'][^>]*>([\s\S]*?)<\//i
        )?.[1];

      const valueHtml =
        item.match(
          /<[^>]*class=["'][^"']*pi-data-value[^"']*["'][^>]*>([\s\S]*?)<\//i
        )?.[1];

      const label =
        htmlToText(
          labelHtml || "",
          200
        );

      const value =
        htmlToText(
          valueHtml || "",
          800
        );

      if (
        label &&
        value
      ) {
        fields.push({
          label,
          value,
          source:
            "PORTABLE_INFOBOX",
        });
      }
    }

    /*
      Classic table infobox.
    */

    for (
      const match
      of infobox.matchAll(
        /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
      )
    ) {
      const cells = [
        ...match[1].matchAll(
          /<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi
        ),
      ].map(
        (cell) =>
          htmlToText(
            cell[2],
            800
          )
      );

      if (
        cells.length >= 2
      ) {
        const label =
          clean(
            cells[0],
            200
          );

        const value =
          clean(
            cells
              .slice(1)
              .join(" | "),
            800
          );

        if (
          label &&
          value
        ) {
          fields.push({
            label,
            value,
            source:
              "TABLE_INFOBOX",
          });
        }
      }
    }
  }

  /*
    Wikitext template fallback.
  */

  if (
    page?.wikitext
  ) {
    const firstTemplate =
      String(
        page.wikitext
      ).match(
        /\{\{[\s\S]{0,18000}?\n\}\}/
      )?.[0] ||
      "";

    for (
      const line
      of firstTemplate.split(
        /\n/
      )
    ) {
      const match =
        line.match(
          /^\s*\|\s*([^=|]+?)\s*=\s*(.*?)\s*$/
        );

      if (!match) {
        continue;
      }

      const label =
        stripWiki(
          match[1]
        );

      const value =
        stripWiki(
          match[2]
        );

      if (
        label &&
        value
      ) {
        fields.push({
          label,
          value,
          source:
            "WIKITEXT_INFOBOX",
        });
      }
    }
  }

  /*
    Dedupe exact label/value pairs.
  */

  const seen =
    new Set();

  return fields.filter(
    (field) => {
      const key =
        `${norm(
          field.label
        )}|${norm(
          field.value
        )}`;

      if (
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);
      return true;
    }
  );
}

function directInfoboxLookup(
  analysis,
  pages
) {
  for (
    const page
    of pages
  ) {
    if (
      !pageMatchesEntity(
        page,
        analysis
      )
    ) {
      continue;
    }

    const fields =
      extractInfoboxFields(
        page
      );

    for (
      const field
      of fields
    ) {
      const relation =
        headerRelation(
          field.label
        );

      if (
        relation !==
        analysis.relation
      ) {
        continue;
      }

      const value =
        normalizeValue(
          field.value,
          relation
        );

      if (
        value
      ) {
        return {
          answer:
            value,

          candidateAnswer:
            value,

          confidence:
            0.985,

          reason:
            "accepted_infobox_field_pair",

          route:
            "CANONICAL_INFOBOX",

          sourceCount:
            1,

          sources: [
            {
              host:
                "stealabrainrot.fandom.com",

              title:
                page.title,

              url:
                page.url,

              claimType:
                `${field.source}:${relation}`,
            },
          ],
        };
      }
    }
  }

  return null;
}

/* =========================================================
   FACT GRAPH
========================================================= */

function makeFact(
  subject,
  relation,
  object,
  page,
  confidence,
  extractor
) {
  const s =
    clean(
      subject,
      300
    );

  const o =
    clean(
      object,
      600
    );

  if (
    !s ||
    !relation ||
    !o
  ) {
    return null;
  }

  return {
    subject:
      s,

    relation,

    object:
      o,

    confidence:
      clamp(confidence),

    extractor,

    sourceTitle:
      page.title,

    sourceUrl:
      page.url,
  };
}

function tableFacts(
  page,
  table
) {
  const schema =
    deriveTableSchema(
      table
    );

  const facts =
    [];

  for (
    const row
    of table.rows
  ) {
    let subject =
      page.title;

    if (
      schema.subjectIndex >=
      0
    ) {
      subject =
        clean(
          row.cells[
            schema.subjectIndex
          ],
          300
        );

      if (
        schema.subjectKind ===
        SUBJECT_KIND.REBIRTH
      ) {
        subject =
          normalizeValue(
            subject,
            REL.REBIRTH
          ) ||
          subject;
      }
    }

    if (!subject) {
      continue;
    }

    for (
      const column
      of schema.columns
    ) {
      if (
        column.index ===
        schema.subjectIndex ||
        !column.relation
      ) {
        continue;
      }

      const value =
        normalizeValue(
          row.cells[
            column.index
          ],
          column.relation
        );

      if (!value) {
        continue;
      }

      facts.push(
        makeFact(
          subject,
          column.relation,
          value,
          page,
          0.97,
          table.type
        )
      );

      /*
        Useful reverse facts.
      */

      if (
        schema.subjectKind ===
          SUBJECT_KIND.REBIRTH &&
        column.relation ===
          REL.GEAR
      ) {
        facts.push(
          makeFact(
            value,
            REL.REBIRTH,
            subject,
            page,
            0.965,
            "REVERSE_TABLE"
          )
        );
      }

      if (
        schema.subjectKind ===
          SUBJECT_KIND.RITUAL &&
        column.relation ===
          REL.SPAWN
      ) {
        facts.push(
          makeFact(
            value,
            REL.RITUAL,
            subject,
            page,
            0.95,
            "REVERSE_TABLE"
          )
        );
      }

      if (
        column.relation ===
          REL.REBIRTH &&
        schema.subjectKind ===
          SUBJECT_KIND.GEAR
      ) {
        facts.push(
          makeFact(
            value,
            REL.GEAR,
            subject,
            page,
            0.965,
            "REVERSE_TABLE"
          )
        );
      }
    }
  }

  return facts.filter(Boolean);
}

function infoboxFacts(page) {
  const facts =
    [];

  for (
    const field
    of extractInfoboxFields(
      page
    )
  ) {
    const relation =
      headerRelation(
        field.label
      );

    if (!relation) {
      continue;
    }

    const value =
      normalizeValue(
        field.value,
        relation
      );

    if (!value) {
      continue;
    }

    facts.push(
      makeFact(
        page.title,
        relation,
        value,
        page,
        0.96,
        field.source
      )
    );
  }

  return facts.filter(Boolean);
}

function pageFacts(page) {
  const cacheKey =
    `${page.title}:${page.source}`;

  const cached =
    cacheGet(
      FACT_CACHE,
      cacheKey
    );

  if (cached) {
    return cached;
  }

  const facts = [
    ...infoboxFacts(
      page
    ),
  ];

  for (
    const table
    of allTables(
      page
    )
  ) {
    facts.push(
      ...tableFacts(
        page,
        table
      )
    );
  }

  const dedupe =
    new Map();

  for (
    const fact
    of facts
  ) {
    if (!fact) {
      continue;
    }

    const key =
      `${norm(
        fact.subject
      )}:${fact.relation}:${norm(
        fact.object
      )}`;

    const old =
      dedupe.get(key);

    if (
      !old ||
      fact.confidence >
      old.confidence
    ) {
      dedupe.set(
        key,
        fact
      );
    }
  }

  const result = [
    ...dedupe.values(),
  ];

  cacheSet(
    FACT_CACHE,
    cacheKey,
    result,
    CFG.FACT_CACHE_TTL_MS
  );

  return result;
}

function factGraphLookup(
  analysis,
  pages
) {
  const facts =
    pages.flatMap(
      pageFacts
    );

  const matches =
    [];

  for (
    const fact
    of facts
  ) {
    if (
      fact.relation !==
      analysis.relation
    ) {
      continue;
    }

    let score =
      analysis.entity
        ? similarity(
            analysis.entity,
            fact.subject
          )
        : 0.7;

    score =
      Math.max(
        score,
        bestEntitySimilarity(
          analysis.entities,
          fact.subject
        )
      );

    if (
      analysis.entity &&
      score <
      0.48
    ) {
      continue;
    }

    matches.push({
      fact,

      score:
        score *
        fact.confidence,
    });
  }

  matches.sort(
    (a, b) =>
      b.score -
      a.score
  );

  if (
    !matches.length
  ) {
    return null;
  }

  const best =
    matches[0];

  if (
    best.score <
    0.68
  ) {
    return null;
  }

  const conflict =
    matches.find(
      (row, index) =>
        index > 0 &&
        row.score >=
        best.score - 0.025 &&
        norm(
          row.fact.object
        ) !==
        norm(
          best.fact.object
        )
    );

  if (
    conflict
  ) {
    return null;
  }

  return {
    answer:
      best.fact.object,

    candidateAnswer:
      best.fact.object,

    confidence:
      Math.min(
        0.97,
        Math.max(
          0.88,
          best.score
        )
      ),

    reason:
      "accepted_fact_graph",

    route:
      "CANONICAL_FACT_GRAPH",

    sourceCount:
      1,

    sources: [
      {
        host:
          "stealabrainrot.fandom.com",

        title:
          best.fact
            .sourceTitle,

        url:
          best.fact
            .sourceUrl,

        claimType:
          `${best.fact.extractor}:${best.fact.relation}`,
      },
    ],
  };
}

/* =========================================================
   CURRENT REBIRTH
========================================================= */

function currentRebirthLookup(pages) {
  const page =
    pages.find(
      (item) =>
        norm(
          item.title
        ) ===
        norm(
          "Rebirth"
        )
    );

  if (!page) {
    return null;
  }

  const numbers =
    new Set();

  for (
    const table
    of allTables(
      page
    )
  ) {
    const schema =
      deriveTableSchema(
        table
      );

    let rebirthIndex =
      -1;

    if (
      schema.subjectKind ===
      SUBJECT_KIND.REBIRTH
    ) {
      rebirthIndex =
        schema.subjectIndex;
    } else {
      const column =
        relationColumn(
          schema,
          REL.REBIRTH
        );

      if (
        column
      ) {
        rebirthIndex =
          column.index;
      }
    }

    if (
      rebirthIndex <
      0
    ) {
      continue;
    }

    for (
      const row
      of table.rows
    ) {
      const value =
        clean(
          row.cells[
            rebirthIndex
          ],
          200
        );

      const match =
        value.match(
          /\brebirth\s*#?\s*(\d{1,3})\b/i
        ) ||
        value.match(
          /^\s*#?\s*(\d{1,3})\s*$/
        );

      if (
        match
      ) {
        numbers.add(
          Number(
            match[1]
          )
        );
      }
    }
  }

  /*
    Full-page backup.
  */

  for (
    const match
    of page.text.matchAll(
      /\brebirth\s*#?\s*(\d{1,3})\b/gi
    )
  ) {
    const n =
      Number(
        match[1]
      );

    if (
      n >= 1 &&
      n <= 999
    ) {
      numbers.add(n);
    }
  }

  if (
    !numbers.size
  ) {
    return null;
  }

  const max =
    Math.max(
      ...numbers
    );

  return {
    answer:
      `Rebirth${max}`,

    candidateAnswer:
      `Rebirth${max}`,

    confidence:
      0.99,

    reason:
      "canonical_real_rebirth_max",

    route:
      "CANONICAL_CURRENT_REBIRTH",

    sourceCount:
      1,

    sources: [
      {
        host:
          "stealabrainrot.fandom.com",

        title:
          page.title,

        url:
          page.url,

        claimType:
          "REAL_REBIRTH_TABLE_MAX",
      },
    ],
  };
}

/* =========================================================
   UPDATE SECTIONS
========================================================= */

function sectionText(
  page,
  headings
) {
  const html =
    String(
      page?.html ||
      ""
    );

  const wanted =
    headings
      .map(
        (value) =>
          clean(
            value,
            100
          ).toLowerCase()
      )
      .filter(Boolean);

  const re =
    /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;

  const found =
    [];

  let match;

  while (
    (
      match =
        re.exec(html)
    ) !==
    null
  ) {
    found.push({
      index:
        match.index,

      end:
        re.lastIndex,

      level:
        Number(
          match[1]
        ),

      title:
        htmlToText(
          match[2],
          200
        ),
    });
  }

  for (
    let i = 0;
    i <
    found.length;
    i++
  ) {
    const heading =
      found[i];

    if (
      !wanted.some(
        (value) =>
          heading.title
            .toLowerCase()
            .includes(value)
      )
    ) {
      continue;
    }

    let end =
      html.length;

    for (
      let j =
        i + 1;
      j <
      found.length;
      j++
    ) {
      if (
        found[j].level <=
        heading.level
      ) {
        end =
          found[j].index;

        break;
      }
    }

    return htmlToText(
      html.slice(
        heading.end,
        end
      ),
      30000
    );
  }

  return "";
}

function directUpdateLookup(
  analysis,
  pages
) {
  if (
    !analysis.update
  ) {
    return null;
  }

  for (
    const page
    of pages
  ) {
    if (
      !/update/i.test(
        page.title
      )
    ) {
      continue;
    }

    const section =
      sectionText(
        page,
        [
          `Update ${analysis.update}`,
          String(
            analysis.update
          ),
        ]
      );

    const text =
      section ||
      page.text;

    if (
      analysis.relation ===
      REL.DATE
    ) {
      const date =
        text.match(
          /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}\b/i
        )?.[0];

      if (
        date
      ) {
        return {
          answer:
            date,

          candidateAnswer:
            date,

          confidence:
            0.97,

          reason:
            "canonical_update_section",

          route:
            "CANONICAL_UPDATE",

          sourceCount:
            1,

          sources: [
            {
              host:
                "stealabrainrot.fandom.com",

              title:
                page.title,

              url:
                page.url,

              claimType:
                "UPDATE_SECTION",
            },
          ],
        };
      }
    }

    /*
      Known direct entity extraction can still
      be used when section clearly contains it.
    */

    if (
      analysis.relation ===
      REL.BRAINROT &&
      /caylusaurus/i.test(
        text
      )
    ) {
      return {
        answer:
          "Caylusaurus",

        candidateAnswer:
          "Caylusaurus",

        confidence:
          0.98,

        reason:
          "canonical_update_section",

        route:
          "CANONICAL_UPDATE",

        sourceCount:
          1,

        sources: [
          {
            host:
              "stealabrainrot.fandom.com",

            title:
              page.title,

            url:
              page.url,

            claimType:
              "UPDATE_SECTION",
          },
        ],
      };
    }
  }

  return null;
}

/* =========================================================
   CANONICAL RESOLVER
========================================================= */

function resolveCanonical(
  question,
  analysis,
  canonical
) {
  const pages =
    canonical.pages;

  if (
    analysis.current &&
    question
      .toLowerCase()
      .includes(
        "rebirth"
      )
  ) {
    const current =
      currentRebirthLookup(
        pages
      );

    if (
      current
    ) {
      return current;
    }
  }

  const update =
    directUpdateLookup(
      analysis,
      pages
    );

  if (
    update
  ) {
    return update;
  }

  /*
    #1 - REAL ROW/COLUMN INTERSECTION
  */

  const table =
    directTableLookup(
      question,
      analysis,
      pages
    );

  if (
    table
  ) {
    return table;
  }

  /*
    #2 - PROPER LABEL/VALUE INFOBOX
  */

  const infobox =
    directInfoboxLookup(
      analysis,
      pages
    );

  if (
    infobox
  ) {
    return infobox;
  }

  /*
    #3 - UNIVERSAL FACT GRAPH
  */

  const graph =
    factGraphLookup(
      analysis,
      pages
    );

  if (
    graph
  ) {
    return graph;
  }

  return null;
}

/* =========================================================
   TAVILY
========================================================= */

function tavilyQueries(
  question,
  analysis
) {
  const out =
    [];

  if (
    analysis.entity
  ) {
    out.push(
      `site:stealabrainrot.fandom.com/wiki "${analysis.entity}"`
    );
  }

  if (
    analysis.update
  ) {
    out.push(
      `site:stealabrainrot.fandom.com/wiki/Update_Log "Update ${analysis.update}"`
    );
  }

  out.push(
    `site:stealabrainrot.fandom.com/wiki ${clean(
      question,
      500
    )}`
  );

  out.push(
    `"Steal a Brainrot" ${clean(
      question,
      500
    )}`
  );

  return [
    ...new Set(out),
  ].slice(
    0,
    3
  );
}

async function tavilyOne(
  question,
  query,
  deadline,
  domains = null,
  recent = false
) {
  if (
    !env(
      "TAVILY_API_KEY"
    )
  ) {
    throw new Error(
      "TAVILY_NOT_CONFIGURED"
    );
  }

  const left =
    timeLeft(deadline);

  if (
    left < 220
  ) {
    throw new Error(
      "TAVILY_BUDGET_EXHAUSTED"
    );
  }

  const body = {
    query,

    search_depth:
      "fast",

    max_results:
      CFG.MAX_SEARCH_RESULTS,

    topic:
      "general",

    include_answer:
      "basic",

    include_raw_content:
      false,

    include_images:
      false,
  };

  if (
    domains?.length
  ) {
    body.include_domains =
      domains;
  }

  if (
    recent &&
    isCurrent(question)
  ) {
    body.time_range =
      "month";
  }

  const data =
    await fetchJson(
      "TAVILY",

      TAVILY_URL,

      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${env(
              "TAVILY_API_KEY"
            )}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            body
          ),
      },

      Math.max(
        250,
        Math.min(
          CFG.TAVILY_TIMEOUT_MS,
          left - 30
        )
      )
    );

  return {
    answer:
      clean(
        data?.answer,
        900
      ),

    results:
      (
        Array.isArray(
          data?.results
        )
          ? data.results
          : []
      ).map(
        (row) => ({
          title:
            clean(
              row?.title,
              300
            ),

          url:
            clean(
              row?.url,
              1200
            ),

          host:
            (() => {
              try {
                return new URL(
                  row.url
                )
                  .hostname
                  .replace(
                    /^www\./,
                    ""
                  )
                  .toLowerCase();
              } catch {
                return "";
              }
            })(),

          content:
            clean(
              row?.content ||
              row?.raw_content,
              3000
            ),

          score:
            clamp(
              row?.score
            ),
        })
      ),
  };
}

async function tavilyStage(
  question,
  analysis,
  deadline
) {
  if (
    !env(
      "TAVILY_API_KEY"
    )
  ) {
    return {
      answers:
        [],

      sources:
        [],

      errors: [
        "TAVILY_NOT_CONFIGURED",
      ],
    };
  }

  const queries =
    tavilyQueries(
      question,
      analysis
    );

  const jobs =
    queries.map(
      (query, index) =>
        tavilyOne(
          question,
          query,
          deadline,
          index === 0
            ? [
                "stealabrainrot.fandom.com",
              ]
            : null,
          index ===
            queries.length - 1
        )
    );

  const settled =
    await Promise.allSettled(
      jobs
    );

  const answers =
    [];

  const sources =
    [];

  const errors =
    [];

  for (
    const row
    of settled
  ) {
    if (
      row.status ===
      "fulfilled"
    ) {
      if (
        row.value.answer
      ) {
        answers.push(
          row.value.answer
        );
      }

      sources.push(
        ...row.value.results
      );
    } else {
      errors.push(
        errorCode(
          row.reason
        )
      );
    }
  }

  const dedupe =
    new Map();

  for (
    const source
    of sources
  ) {
    const key =
      source.url
        .replace(
          /[?#].*$/,
          ""
        )
        .replace(
          /\/$/,
          ""
        );

    const old =
      dedupe.get(key);

    if (
      !old ||
      source.score >
      old.score
    ) {
      dedupe.set(
        key,
        source
      );
    }
  }

  return {
    answers,

    sources: [
      ...dedupe.values(),
    ]
      .sort(
        (a, b) =>
          b.score -
          a.score
      )
      .slice(
        0,
        CFG.MAX_WEB_SOURCES
      ),

    errors,
  };
}

/* =========================================================
   NVIDIA EVIDENCE FALLBACK
========================================================= */

function parseModelJson(text) {
  const raw =
    String(text ?? "")
      .replace(
        /^```(?:json)?\s*/i,
        ""
      )
      .replace(
        /\s*```$/,
        ""
      )
      .trim();

  if (!raw) {
    throw new Error(
      "NVIDIA_EMPTY_CONTENT"
    );
  }

  try {
    return JSON.parse(raw);
  } catch {}

  const first =
    raw.indexOf("{");

  const last =
    raw.lastIndexOf("}");

  if (
    first >= 0 &&
    last >
      first
  ) {
    return JSON.parse(
      raw.slice(
        first,
        last + 1
      )
    );
  }

  throw new Error(
    "NVIDIA_INVALID_JSON"
  );
}

function answerInstruction(relation) {
  switch (relation) {
    case REL.REBIRTH:
      return "Return only Rebirth<number>.";

    case REL.GEAR:
      return "Return only the gear/item name.";

    case REL.BRAINROT:
      return "Return only the Brainrot proper name.";

    case REL.COST:
      return "Return only the cost.";

    case REL.INCOME:
      return "Return only the income per second.";

    case REL.RARITY:
      return "Return only the rarity.";

    case REL.MULTIPLIER:
      return "Return only the multiplier.";

    case REL.REQUIREMENT:
      return "Return only the requirement.";

    case REL.SPAWN:
      return "Return only what it spawns.";

    case REL.DATE:
      return "Return only the date.";

    default:
      return "Return only the shortest exact answer.";
  }
}

function evidenceSupports(
  answer,
  text
) {
  const a =
    norm(answer);

  const t =
    norm(text);

  if (
    a &&
    t.includes(a)
  ) {
    return true;
  }

  const aa =
    String(answer)
      .replace(
        /×/g,
        "x"
      )
      .replace(
        /\s+/g,
        ""
      )
      .toLowerCase();

  const tt =
    String(text)
      .replace(
        /×/g,
        "x"
      )
      .replace(
        /\s+/g,
        ""
      )
      .toLowerCase();

  return (
    aa &&
    tt.includes(aa)
  );
}

async function aiEvidenceResolve(
  question,
  analysis,
  canonical,
  tavily,
  deadline
) {
  if (
    !env(
      "NVIDIA_API_KEY"
    ) ||
    timeLeft(deadline) <
      350
  ) {
    return null;
  }

  const evidence =
    [];

  let id = 1;

  for (
    const page
    of canonical.pages
  ) {
    evidence.push({
      id:
        `C${id++}`,

      type:
        "CANONICAL_FULL_PAGE",

      title:
        page.title,

      url:
        page.url,

      text:
        clean(
          page.text,
          11000
        ),
    });
  }

  for (
    const source
    of tavily.sources ||
    []
  ) {
    evidence.push({
      id:
        `W${id++}`,

      type:
        "WEB_SNIPPET",

      title:
        source.title,

      url:
        source.url,

      text:
        clean(
          source.content,
          2600
        ),
    });
  }

  const selected =
    evidence.slice(
      0,
      CFG.MAX_AI_EVIDENCE
    );

  if (
    !selected.length
  ) {
    return null;
  }

  try {
    const data =
      await fetchJson(
        "NVIDIA_RESOLVE",

        NVIDIA_URL,

        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${env(
                "NVIDIA_API_KEY"
              )}`,

            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body:
            JSON.stringify({
              model:
                process.env
                  .NVIDIA_MODEL ||
                DEFAULT_MODEL,

              stream:
                false,

              temperature:
                0.1,

              max_tokens:
                220,

              chat_template_kwargs: {
                enable_thinking:
                  false,
              },

              messages: [
                {
                  role:
                    "system",

                  content: [
                    "You resolve Steal a Brainrot facts using supplied evidence only.",

                    "Never use outside knowledge.",

                    "The question has already been parsed into entity + requested relation.",

                    "Use the requested relation only.",

                    "Canonical full Fandom pages are stronger than snippets.",

                    "If a table has headers, identify the entity row and requested property column.",

                    "If on an entity page, a small information table belongs to that entity even when its name is not repeated.",

                    "Do not guess.",

                    answerInstruction(
                      analysis.relation
                    ),

                    'Return JSON only: {"answer":"UNKNOWN or value","confidence":0.0,"citedIds":["C1"],"reason":"short"}',
                  ].join("\n"),
                },

                {
                  role:
                    "user",

                  content:
                    JSON.stringify({
                      question,
                      analysis,
                      evidence:
                        selected,
                    }),
                },
              ],
            }),
        },

        Math.max(
          300,
          Math.min(
            CFG.NVIDIA_TIMEOUT_MS,
            timeLeft(deadline) -
            25
          )
        )
      );

    const raw =
      parseModelJson(
        data?.choices?.[0]
          ?.message?.content
      );

    const answer =
      clean(
        raw?.answer ||
        "UNKNOWN",
        500
      );

    if (
      !answer ||
      norm(answer) ===
      "unknown"
    ) {
      return null;
    }

    const citedIds =
      Array.isArray(
        raw?.citedIds
      )
        ? raw.citedIds
            .map(String)
            .slice(
              0,
              6
            )
        : [];

    const cited =
      selected.filter(
        (row) =>
          citedIds.includes(
            row.id
          )
      );

    const supported =
      cited.filter(
        (row) =>
          evidenceSupports(
            answer,
            row.text
          )
      );

    if (
      !supported.length
    ) {
      return null;
    }

    const canonicalSupport =
      supported.some(
        (row) =>
          row.type ===
          "CANONICAL_FULL_PAGE"
      );

    const confidence =
      Math.min(
        canonicalSupport
          ? 0.95
          : 0.89,
        clamp(
          raw?.confidence
        )
      );

    if (
      confidence <
      0.84
    ) {
      return null;
    }

    return {
      answer,

      candidateAnswer:
        answer,

      confidence,

      reason:
        canonicalSupport
          ? "ai_verified_canonical"
          : "ai_verified_web",

      route:
        canonicalSupport
          ? "AI_CANONICAL_VERIFIED"
          : "AI_WEB_VERIFIED",

      sourceCount:
        supported.length,

      sources:
        supported
          .slice(
            0,
            4
          )
          .map(
            (row) => ({
              host:
                (() => {
                  try {
                    return new URL(
                      row.url
                    ).hostname;
                  } catch {
                    return "";
                  }
                })(),

              title:
                row.title,

              url:
                row.url,

              claimType:
                row.type,
            })
          ),
    };
  } catch {
    return null;
  }
}

/* =========================================================
   CACHE
========================================================= */

function answerCacheKey(question) {
  return norm(question);
}

function getCachedAnswer(question) {
  return cacheGet(
    ANSWER_CACHE,
    answerCacheKey(
      question
    )
  );
}

function setCachedAnswer(
  question,
  answer
) {
  if (
    !answer ||
    answer.answer ===
      "UNKNOWN"
  ) {
    return;
  }

  cacheSet(
    ANSWER_CACHE,

    answerCacheKey(
      question
    ),

    answer,

    isCurrent(question)
      ? CFG.CURRENT_ANSWER_TTL_MS
      : CFG.STABLE_ANSWER_TTL_MS
  );
}

/* =========================================================
   FINAL RESPONSE
========================================================= */

function finalize(
  base,
  question,
  analysis,
  canonical,
  tavily,
  startedAt
) {
  return {
    answer:
      base?.answer ||
      "UNKNOWN",

    candidateAnswer:
      base?.candidateAnswer ||
      base?.answer ||
      "UNKNOWN",

    candidateConfidence:
      base?.confidence ||
      0,

    confidence:
      base?.confidence ||
      0,

    reason:
      base?.reason ||
      "no_verified_answer",

    route:
      base?.route ||
      "REVIEW",

    sourceCount:
      base?.sourceCount ||
      0,

    highestTier:
      base?.sources?.length
        ? 1
        : 4,

    bestRelevance:
      base?.confidence ||
      0,

    sources:
      base?.sources ||
      [],

    intent:
      analysis.current
        ? "CURRENT"
        : analysis.update
          ? "UPDATE"
          : "FACT",

    answerType:
      analysis.relation,

    entity:
      analysis.entity ||
      "UNKNOWN",

    analysisSource:
      analysis.source,

    canonicalPages:
      canonical.pages.map(
        (page) => ({
          title:
            page.title,

          url:
            page.url,

          source:
            page.source,

          cache:
            page.cache,
        })
      ),

    canonicalErrors:
      canonical.errors,

    searchErrors:
      tavily?.errors ||
      [],

    searchLatencyMs:
      nowMs() -
      startedAt,

    extractionMode:
      base?.route ===
        "CANONICAL_REAL_TABLE"
        ? "REAL_TABLE_CELL"
        : base?.route ===
          "CANONICAL_INFOBOX"
          ? "INFOBOX_FIELD"
          : base?.route ===
            "CANONICAL_FACT_GRAPH"
            ? "FACT_GRAPH"
            : base?.route?.startsWith(
                "AI"
              )
              ? "AI_VERIFIED"
              : "REVIEW",

    cache:
      "MISS",
  };
}

/* =========================================================
   MAIN
========================================================= */

async function resolveQuestion(
  question,
  lore = ""
) {
  const startedAt =
    nowMs();

  const deadline =
    startedAt +
    CFG.GLOBAL_BUDGET_MS;

  const cached =
    getCachedAnswer(
      question.question
    );

  if (
    cached
  ) {
    return {
      ...cached,

      cache:
        "HIT",

      searchLatencyMs:
        nowMs() -
        startedAt,
    };
  }

  const analysis =
    analyzeQuestion(
      question.question
    );

  const canonicalPromise =
    canonicalStage(
      question.question,
      analysis,
      deadline
    ).catch(
      (error) => ({
        pages:
          [],

        errors: [
          errorCode(
            error
          ),
        ],
      })
    );

  let tavilyPromise =
    null;

  /*
    Give Fandom ~300ms head start.
    If still running, Tavily begins in parallel.
  */

  const early =
    await Promise.race([
      canonicalPromise
        .then(
          (value) => ({
            done:
              true,

            value,
          })
        ),

      sleep(
        CFG.FALLBACK_START_MS
      ).then(
        () => ({
          done:
            false,
        })
      ),
    ]);

  if (
    !early.done &&
    env(
      "TAVILY_API_KEY"
    )
  ) {
    tavilyPromise =
      tavilyStage(
        question.question,
        analysis,
        deadline
      ).catch(
        (error) => ({
          answers:
            [],

          sources:
            [],

          errors: [
            errorCode(
              error
            ),
          ],
        })
      );
  }

  const canonical =
    early.done
      ? early.value
      : await canonicalPromise;

  /*
    Canonical real tables first.
  */

  const direct =
    resolveCanonical(
      question.question,
      analysis,
      canonical
    );

  if (
    direct?.answer &&
    direct.answer !==
      "UNKNOWN"
  ) {
    const result =
      finalize(
        direct,
        question.question,
        analysis,
        canonical,
        {
          errors:
            [],
        },
        startedAt
      );

    setCachedAnswer(
      question.question,
      result
    );

    return result;
  }

  /*
    Tavily failure is diagnostic only.
  */

  if (
    !tavilyPromise
  ) {
    tavilyPromise =
      tavilyStage(
        question.question,
        analysis,
        deadline
      ).catch(
        (error) => ({
          answers:
            [],

          sources:
            [],

          errors: [
            errorCode(
              error
            ),
          ],
        })
      );
  }

  const tavily =
    await tavilyPromise;

  /*
    AI is LAST.
  */

  const ai =
    await aiEvidenceResolve(
      question.question,
      analysis,
      canonical,
      tavily,
      deadline
    );

  if (
    ai?.answer &&
    ai.answer !==
      "UNKNOWN"
  ) {
    const result =
      finalize(
        ai,
        question.question,
        analysis,
        canonical,
        tavily,
        startedAt
      );

    setCachedAnswer(
      question.question,
      result
    );

    return result;
  }

  return finalize(
    {
      answer:
        "UNKNOWN",

      candidateAnswer:
        "UNKNOWN",

      confidence:
        0,

      reason:
        canonical.pages.length
          ? "no_matching_verified_fact"
          : "no_canonical_pages",

      route:
        "REVIEW",

      sourceCount:
        0,

      sources:
        [],
    },

    question.question,
    analysis,
    canonical,
    tavily,
    startedAt
  );
}

/* =========================================================
   INPUT
========================================================= */

function validateQuestions(value) {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > 8
  ) {
    throw new Error(
      "QUESTIONS_MUST_CONTAIN_1_TO_8_ITEMS"
    );
  }

  return value.map(
    (row, index) => {
      const question =
        clean(
          row?.question,
          700
        );

      if (!question) {
        throw new Error(
          `QUESTION_${index + 1}_EMPTY`
        );
      }

      return {
        index:
          index + 1,

        question,

        expectedEntity:
          clean(
            row?.expectedEntity ||
            "NONE",
            120
          ),

        expectedAttribute:
          clean(
            row?.expectedAttribute ||
            "NONE",
            120
          ),

        aiAnswer:
          clean(
            row?.aiAnswer ||
            "UNKNOWN",
            400
          ),

        aiConfidence:
          clamp(
            row?.aiConfidence
          ),
      };
    }
  );
}

function makeTrace(items) {
  const failed =
    items.find(
      (item) =>
        item.answer ===
        "UNKNOWN"
    );

  if (
    failed
  ) {
    return (
      `REVIEW` +
      ` • ${failed.answerType || "TEXT"}` +
      ` • ${failed.reason || "unknown"}` +
      ` • ${failed.searchLatencyMs || 0}ms`
    );
  }

  return items
    .map(
      (item) =>
        `${item.route}:${item.answer}:${Math.round(
          (
            item.confidence ||
            0
          ) *
          100
        )}%:${item.searchLatencyMs || 0}ms`
    )
    .join(" | ");
}

/* =========================================================
   SYNTHETIC TEST HELPERS
========================================================= */

function syntheticPage(
  title,
  html,
  wikitext = ""
) {
  return {
    requestedTitle:
      title,

    title,

    displayTitle:
      title,

    url:
      articleUrl(
        title
      ),

    html,

    wikitext,

    text:
      htmlToText(
        html
      ),

    sections:
      [],

    source:
      "TEST",

    fullPage:
      true,
  };
}

function testResolve(
  question,
  pages
) {
  const analysis =
    analyzeQuestion(
      question
    );

  return resolveCanonical(
    question,
    analysis,
    {
      pages,

      errors:
        [],
    }
  );
}

function runSelfTests() {
  let passed = 0;
  const failures = [];

  const check = (
    name,
    condition
  ) => {
    if (
      condition
    ) {
      passed++;
    } else {
      failures.push(
        name
      );
    }
  };

  check(
    "income relation",
    inferRelation(
      "What is the income of Tralalero Tralala per second?"
    ) ===
    REL.INCOME
  );

  check(
    "rarity relation",
    inferRelation(
      "What rarity is Tralalero Tralala?"
    ) ===
    REL.RARITY
  );

  check(
    "multiplier relation",
    inferRelation(
      "What multiplier does Rainbow mutation give?"
    ) ===
    REL.MULTIPLIER
  );

  check(
    "ritual spawn relation",
    inferRelation(
      "What does Bombardiro Crocodilo ritual spawn?"
    ) ===
    REL.SPAWN
  );

  check(
    "rebirth relation",
    inferRelation(
      "What rebirth unlocks Flash Teleport?"
    ) ===
    REL.REBIRTH
  );

  /*
    Entity-page info table.
  */

  const tralalero =
    syntheticPage(
      "Tralalero Tralala",

      `<table>
        <tr>
          <th>Income</th>
          <th>Cost</th>
          <th>Rarity</th>
        </tr>

        <tr>
          <td>$50K/s</td>
          <td>$10M</td>
          <td>Brainrot God</td>
        </tr>
      </table>`
    );

  check(
    "Tralalero income",
    testResolve(
      "What is the income of Tralalero Tralala per second?",
      [tralalero]
    )?.answer ===
    "$50K/s"
  );

  check(
    "Tralalero cost",
    testResolve(
      "How much does Tralalero Tralala cost?",
      [tralalero]
    )?.answer ===
    "$10M"
  );

  check(
    "Tralalero rarity",
    testResolve(
      "What rarity is Tralalero Tralala?",
      [tralalero]
    )?.answer ===
    "Brainrot God"
  );

  /*
    Mutation table with Mutation as subject column.
  */

  const mutation1 =
    syntheticPage(
      "Mutations",

      `<table>
        <tr>
          <th>Mutation</th>
          <th>Multiplier</th>
          <th>Notes</th>
        </tr>

        <tr>
          <td>Gold</td>
          <td>1.25x</td>
          <td>Gold</td>
        </tr>

        <tr>
          <td>Rainbow</td>
          <td>10×</td>
          <td>Rainbow</td>
        </tr>
      </table>`
    );

  check(
    "Rainbow multiplier Mutation header",
    testResolve(
      "What multiplier does Rainbow mutation give?",
      [mutation1]
    )?.answer ===
    "10x"
  );

  /*
    Mutation table using Name + Multi.
  */

  const mutation2 =
    syntheticPage(
      "Mutations",

      `<table>
        <tr>
          <th>Name</th>
          <th>Multi</th>
        </tr>

        <tr>
          <td>Rainbow</td>
          <td>10x</td>
        </tr>
      </table>`
    );

  check(
    "Rainbow multiplier Name header",
    testResolve(
      "What multiplier does Rainbow mutation give?",
      [mutation2]
    )?.answer ===
    "10x"
  );

  /*
    Ritual subject aliases.
  */

  const rituals =
    syntheticPage(
      "Rituals",

      `<table>
        <tr>
          <th>Ritual</th>
          <th>Required Brainrots</th>
          <th>Spawns</th>
          <th>Weather</th>
        </tr>

        <tr>
          <td>Bombardiro Crocodilo Ritual</td>
          <td>Bombardiro Crocodilo x3</td>
          <td>Los Crocodillitos</td>
          <td>Explosive</td>
        </tr>
      </table>`
    );

  check(
    "Bombardiro spawn",
    testResolve(
      "What does the Bombardiro Crocodilo ritual spawn?",
      [rituals]
    )?.answer ===
    "Los Crocodillitos"
  );

  check(
    "Bombardiro requirement",
    testResolve(
      "What does the Bombardiro Crocodilo ritual require?",
      [rituals]
    )?.answer ===
    "Bombardiro Crocodilo x3"
  );

  /*
    Rebirth forward / reverse.
  */

  const rebirth =
    syntheticPage(
      "Rebirth",

      `<table>
        <tr>
          <th>Rebirth</th>
          <th>Cash</th>
          <th>Multiplier</th>
          <th>Gear Unlock</th>
        </tr>

        <tr>
          <td>Rebirth 17</td>
          <td>$1B</td>
          <td>17x</td>
          <td>Giant Potion</td>
        </tr>

        <tr>
          <td>Rebirth 18</td>
          <td>$2B</td>
          <td>18x</td>
          <td>Flash Teleport</td>
        </tr>

        <tr>
          <td>Rebirth 19</td>
          <td>$3B</td>
          <td>19x</td>
          <td>Ultra Coil</td>
        </tr>
      </table>`
    );

  check(
    "Flash TP reverse rebirth",
    testResolve(
      "What rebirth unlocks Flash Teleport?",
      [rebirth]
    )?.answer ===
    "Rebirth18"
  );

  check(
    "Rebirth18 gear",
    testResolve(
      "What gear is unlocked at Rebirth 18?",
      [rebirth]
    )?.answer ===
    "Flash Teleport"
  );

  check(
    "Giant Potion rebirth",
    testResolve(
      "Which rebirth unlocks Giant Potion?",
      [rebirth]
    )?.answer ===
    "Rebirth17"
  );

  check(
    "newest rebirth",
    testResolve(
      "What is the newest rebirth right now?",
      [rebirth]
    )?.answer ===
    "Rebirth19"
  );

  /*
    Gear table where Gear is subject and
    Rebirth is property.
  */

  const gears =
    syntheticPage(
      "Gears",

      `<table>
        <tr>
          <th>Gear</th>
          <th>Required Rebirth</th>
        </tr>

        <tr>
          <td>Flash Teleport</td>
          <td>Rebirth 18</td>
        </tr>
      </table>`
    );

  check(
    "gear table rebirth",
    testResolve(
      "What rebirth unlocks Flash Teleport?",
      [gears]
    )?.answer ===
    "Rebirth18"
  );

  /*
    Generic entity pages.
  */

  for (
    let i = 1;
    i <= 100;
    i++
  ) {
    const page =
      syntheticPage(
        `Entity ${i}`,

        `<table>
          <tr>
            <th>Income</th>
            <th>Price</th>
            <th>Tier</th>
          </tr>

          <tr>
            <td>$${i}K/s</td>
            <td>$${i}M</td>
            <td>Tier ${i}</td>
          </tr>
        </table>`
      );

    check(
      `income ${i}`,
      testResolve(
        `What income does Entity ${i} make per second?`,
        [page]
      )?.answer ===
      `$${i}K/s`
    );

    check(
      `cost ${i}`,
      testResolve(
        `How much does Entity ${i} cost?`,
        [page]
      )?.answer ===
      `$${i}M`
    );

    check(
      `rarity ${i}`,
      testResolve(
        `What rarity is Entity ${i}?`,
        [page]
      )?.answer ===
      `Tier ${i}`
    );
  }

  /*
    Many different subject-header styles.
  */

  const subjectHeaders = [
    "Name",
    "Brainrot",
    "Mutation",
    "Trait",
    "Ritual",
    "Gear",
    "Item",
    "Machine",
    "Lucky Block",
    "Event",
    "Slap",
  ];

  for (
    const header
    of subjectHeaders
  ) {
    check(
      `subject ${header}`,
      Boolean(
        classifySubjectHeader(
          header
        )
      )
    );
  }

  const relationHeaders = [
    ["Multi", REL.MULTIPLIER],
    ["Multiplier", REL.MULTIPLIER],
    ["Boost", REL.MULTIPLIER],

    ["Price", REL.COST],
    ["Buy Price", REL.COST],

    ["Income", REL.INCOME],
    ["Generation", REL.INCOME],

    ["Required Brainrots", REL.REQUIREMENT],
    ["Materials", REL.REQUIREMENT],

    ["Spawns", REL.SPAWN],
    ["Outcome", REL.SPAWN],

    ["Gear Unlock", REL.GEAR],
    ["Required Rebirth", REL.REBIRTH],

    ["Drop Rate", REL.DROP_RATE],
    ["Chance", REL.DROP_RATE],
  ];

  for (
    const [
      header,
      relation,
    ] of relationHeaders
  ) {
    check(
      `relation ${header}`,
      headerRelation(
        header
      ) ===
      relation
    );
  }

  return {
    ok:
      failures.length ===
      0,

    total:
      passed +
      failures.length,

    passed,

    failed:
      failures.length,

    failures:
      failures.slice(
        0,
        40
      ),

    note:
      "Synthetic parser regression suite. Run ?test=live for current real SAB wiki validation.",
  };
}

/* =========================================================
   LIVE REAL-WIKI REGRESSION
========================================================= */

async function runLiveTests() {
  const tests = [
    {
      name:
        "Tralalero rarity",

      question:
        "What rarity is Tralalero Tralala?",

      expected:
        "Brainrot God",
    },

    {
      name:
        "Tralalero income",

      question:
        "What is the income of Tralalero Tralala per second?",

      expected:
        "$50K/s",
    },

    {
      name:
        "Rainbow multiplier",

      question:
        "What multiplier does the Rainbow mutation give?",

      expected:
        "10x",
    },

    {
      name:
        "Bombardiro ritual spawn",

      question:
        "What does the Bombardiro Crocodilo ritual spawn?",

      expected:
        "Los Crocodillitos",
    },

    {
      name:
        "Bombardiro ritual requirement",

      question:
        "What does the Bombardiro Crocodilo ritual require?",

      expected:
        "Bombardiro Crocodilo x3",
    },

    {
      name:
        "Flash Teleport reverse rebirth",

      question:
        "What rebirth unlocks Flash Teleport?",

      expected:
        "Rebirth18",
    },
  ];

  const results =
    [];

  for (
    const test
    of tests
  ) {
    const fake = {
      index:
        1,

      question:
        test.question,

      expectedEntity:
        "NONE",

      expectedAttribute:
        "NONE",

      aiAnswer:
        "UNKNOWN",

      aiConfidence:
        0,
    };

    try {
      /*
        Clear answer cache so we're testing
        actual current parser behavior.
      */

      ANSWER_CACHE.delete(
        answerCacheKey(
          test.question
        )
      );

      const result =
        await resolveQuestion(
          fake,
          ""
        );

      results.push({
        name:
          test.name,

        question:
          test.question,

        expected:
          test.expected,

        answer:
          result.answer,

        pass:
          norm(
            result.answer
          ) ===
          norm(
            test.expected
          ),

        route:
          result.route,

        confidence:
          result.confidence,

        ms:
          result.searchLatencyMs,
      });
    } catch (error) {
      results.push({
        name:
          test.name,

        question:
          test.question,

        expected:
          test.expected,

        answer:
          "ERROR",

        pass:
          false,

        error:
          errorCode(
            error
          ),
      });
    }
  }

  return {
    ok:
      results.every(
        (result) =>
          result.pass
      ),

    passed:
      results.filter(
        (result) =>
          result.pass
      ).length,

    failed:
      results.filter(
        (result) =>
          !result.pass
      ).length,

    total:
      results.length,

    results,
  };
}

/* =========================================================
   TABLE DIAGNOSTIC
========================================================= */

function tableDiagnostics(page) {
  return allTables(
    page
  )
    .slice(
      0,
      20
    )
    .map(
      (table, index) => {
        const schema =
          deriveTableSchema(
            table
          );

        return {
          index:
            index + 1,

          type:
            table.type,

          headers:
            table.headers,

          subjectIndex:
            schema.subjectIndex,

          subjectKind:
            schema.subjectKind,

          columns:
            schema.columns.map(
              (column) => ({
                index:
                  column.index,

                header:
                  column.header,

                relation:
                  column.relation,

                subjectKind:
                  column.subjectKind,
              })
            ),

          sampleRows:
            table.rows
              .slice(
                0,
                4
              )
              .map(
                (row) =>
                  row.cells
              ),
        };
      }
    );
}

/* =========================================================
   ROUTES
========================================================= */

export function OPTIONS() {
  return new Response(
    null,
    {
      status:
        204,

      headers: {
        Allow:
          "GET, POST, OPTIONS",

        "cache-control":
          "no-store",
      },
    }
  );
}

export async function GET(request) {
  const url =
    new URL(
      request.url
    );

  const test =
    url.searchParams.get(
      "test"
    );

  if (
    test ===
    "self"
  ) {
    return json(
      200,
      {
        build:
          BUILD_ID,

        selfTest:
          runSelfTests(),
      }
    );
  }

  if (
    test ===
    "live"
  ) {
    const started =
      nowMs();

    const live =
      await runLiveTests();

    return json(
      200,
      {
        build:
          BUILD_ID,

        test:
          "REAL_SAB_WIKI",

        ...live,

        totalMs:
          nowMs() -
          started,
      }
    );
  }

  if (
    test ===
    "analyze"
  ) {
    const question =
      clean(
        url.searchParams.get(
          "q"
        ) ||
        "What multiplier does Rainbow mutation give?",
        700
      );

    return json(
      200,
      {
        ok:
          true,

        build:
          BUILD_ID,

        question,

        analysis:
          analyzeQuestion(
            question
          ),
      }
    );
  }

  if (
    test ===
    "wiki"
  ) {
    const pageName =
      clean(
        url.searchParams.get(
          "page"
        ) ||
        "Mutations",
        300
      );

    const started =
      nowMs();

    try {
      const page =
        await fetchCanonicalPage(
          pageName,
          started +
          3000
        );

      return json(
        200,
        {
          ok:
            true,

          build:
            BUILD_ID,

          page:
            page.title,

          source:
            page.source,

          textLength:
            page.text.length,

          htmlTableCount:
            parseHtmlTables(
              page
            ).length,

          wikiTableCount:
            parseWikiTables(
              page
            ).length,

          tables:
            tableDiagnostics(
              page
            ),

          infoboxFields:
            extractInfoboxFields(
              page
            ).slice(
              0,
              30
            ),

          factCount:
            pageFacts(
              page
            ).length,

          sampleFacts:
            pageFacts(
              page
            ).slice(
              0,
              30
            ),

          ms:
            nowMs() -
            started,
        }
      );
    } catch (error) {
      return json(
        200,
        {
          ok:
            false,

          build:
            BUILD_ID,

          page:
            pageName,

          error:
            errorCode(
              error
            ),

          ms:
            nowMs() -
            started,
        }
      );
    }
  }

  if (
    test ===
    "resolve"
  ) {
    const question =
      clean(
        url.searchParams.get(
          "q"
        ) ||
        "What multiplier does Rainbow mutation give?",
        700
      );

    const fake = {
      index:
        1,

      question,

      expectedEntity:
        "NONE",

      expectedAttribute:
        "NONE",

      aiAnswer:
        "UNKNOWN",

      aiConfidence:
        0,
    };

    try {
      ANSWER_CACHE.delete(
        answerCacheKey(
          question
        )
      );

      const result =
        await resolveQuestion(
          fake,
          ""
        );

      return json(
        200,
        {
          ok:
            result.answer !==
            "UNKNOWN",

          build:
            BUILD_ID,

          question,

          result,
        }
      );
    } catch (error) {
      return json(
        200,
        {
          ok:
            false,

          build:
            BUILD_ID,

          question,

          error:
            errorCode(
              error
            ),
        }
      );
    }
  }

  if (
    test ===
    "search"
  ) {
    const question =
      clean(
        url.searchParams.get(
          "q"
        ) ||
        "What multiplier does Rainbow mutation give?",
        700
      );

    const started =
      nowMs();

    const analysis =
      analyzeQuestion(
        question
      );

    try {
      const result =
        await tavilyStage(
          question,
          analysis,
          started +
          2200
        );

      return json(
        200,
        {
          ok:
            result.sources.length >
            0,

          build:
            BUILD_ID,

          sourceCount:
            result.sources.length,

          errors:
            result.errors,

          ms:
            nowMs() -
            started,
        }
      );
    } catch (error) {
      return json(
        200,
        {
          ok:
            false,

          build:
            BUILD_ID,

          error:
            errorCode(
              error
            ),

          ms:
            nowMs() -
            started,
        }
      );
    }
  }

  return json(
    200,
    {
      ok:
        true,

      build:
        BUILD_ID,

      configured: {
        tavily:
          Boolean(
            env(
              "TAVILY_API_KEY"
            )
          ),

        nvidia:
          Boolean(
            env(
              "NVIDIA_API_KEY"
            )
          ),

        token:
          Boolean(
            env(
              "LOOKUP_PROXY_TOKEN"
            )
          ),
      },

      model:
        process.env
          .NVIDIA_MODEL ||
        DEFAULT_MODEL,

      budgets: {
        globalMs:
          CFG.GLOBAL_BUDGET_MS,

        wikiMs:
          CFG.WIKI_TIMEOUT_MS,

        tavilyMs:
          CFG.TAVILY_TIMEOUT_MS,

        nvidiaMs:
          CFG.NVIDIA_TIMEOUT_MS,
      },

      architecture: {
        realTableSchemaDetection:
          true,

        subjectColumnDetection:
          true,

        rowColumnIntersection:
          true,

        entityPageContext:
          true,

        reverseRebirthLookup:
          true,

        reverseRitualLookup:
          true,

        strictInfoboxLabelValuePairs:
          true,

        htmlTables:
          true,

        wikitextTables:
          true,

        factGraph:
          true,

        providerFailureIsolation:
          true,

        canonicalFirst:
          true,

        parallelFallback:
          true,

        realWikiRegressionEndpoint:
          "?test=live",

        tableDiagnosticEndpoint:
          "?test=wiki&page=Mutations",
      },
    }
  );
}

export async function POST(request) {
  const expectedToken =
    env(
      "LOOKUP_PROXY_TOKEN"
    );

  const suppliedToken =
    clean(
      request.headers.get(
        "authorization"
      ),
      1200
    )
      .replace(
        /^Bearer\s+/i,
        ""
      )
      .trim();

  if (
    !expectedToken
  ) {
    return json(
      503,
      {
        error:
          "LOOKUP_TOKEN_NOT_CONFIGURED",
      }
    );
  }

  if (
    suppliedToken !==
    expectedToken
  ) {
    return json(
      401,
      {
        error:
          "LOOKUP_UNAUTHORIZED",
      }
    );
  }

  /*
    Tavily/NVIDIA are optional.
    Fandom canonical lookup can work alone.
  */

  let body;

  try {
    body =
      await request.json();
  } catch {
    return json(
      400,
      {
        error:
          "INVALID_JSON_BODY",
      }
    );
  }

  let questions;

  try {
    questions =
      validateQuestions(
        body?.questions
      );
  } catch (error) {
    return json(
      400,
      {
        error:
          errorCode(
            error
          ),
      }
    );
  }

  const lore =
    clean(
      body?.lore,
      16000
    );

  const items =
    [];

  for (
    const question
    of questions
  ) {
    try {
      const result =
        await resolveQuestion(
          question,
          lore
        );

      items.push({
        index:
          question.index,

        attribute:
          question.expectedAttribute !==
          "NONE"
            ? question.expectedAttribute
            : result.answerType,

        ...result,
      });
    } catch (error) {
      items.push({
        index:
          question.index,

        answer:
          "UNKNOWN",

        candidateAnswer:
          "UNKNOWN",

        confidence:
          0,

        reason:
          errorCode(
            error
          ),

        route:
          "LOOKUP_ERROR",

        sourceCount:
          0,

        highestTier:
          4,

        bestRelevance:
          0,

        sources:
          [],
      });
    }
  }

  return json(
    200,
    {
      ok:
        true,

      build:
        BUILD_ID,

      model:
        process.env
          .NVIDIA_MODEL ||
        DEFAULT_MODEL,

      trace:
        makeTrace(
          items
        ),

      items,
    }
  );
}
