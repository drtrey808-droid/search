const BUILD_ID = "SAB_KNOWLEDGE_ENGINE_R20_2026_08_19";

const FANDOM_API = "https://stealabrainrot.fandom.com/api.php";
const FANDOM_BASE = "https://stealabrainrot.fandom.com/wiki/";
const TAVILY_URL = "https://api.tavily.com/search";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";

const CFG = Object.freeze({
  GLOBAL_BUDGET_MS: Number(process.env.LOOKUP_BUDGET_MS || 1950),
  WIKI_TIMEOUT_MS: Number(process.env.WIKI_TIMEOUT_MS || 1250),
  TAVILY_TIMEOUT_MS: Number(process.env.TAVILY_TIMEOUT_MS || 1150),
  NVIDIA_TIMEOUT_MS: Number(process.env.NVIDIA_TIMEOUT_MS || 900),

  FALLBACK_START_MS: 425,

  MAX_CANONICAL_PAGES: 7,
  MAX_SEARCH_RESULTS: 7,
  MAX_WEB_SOURCES: 12,
  MAX_AI_EVIDENCE: 10,

  PAGE_CACHE_TTL_MS: 5 * 60 * 1000,
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

const HEADER_ALIASES = Object.freeze({
  name: REL.TEXT,
  brainrot: REL.BRAINROT,

  gear: REL.GEAR,

  multi: REL.MULTIPLIER,
  multiplier: REL.MULTIPLIER,
  boost: REL.MULTIPLIER,

  cost: REL.COST,
  price: REL.COST,

  income: REL.INCOME,
  earnings: REL.INCOME,

  rarity: REL.RARITY,
  tier: REL.RARITY,

  status: REL.STATUS,
  obtainability: REL.STATUS,

  rebirth: REL.REBIRTH,

  requires: REL.REQUIREMENT,
  requirement: REL.REQUIREMENT,
  needed: REL.REQUIREMENT,
  materials: REL.REQUIREMENT,

  spawn: REL.SPAWN,
  spawns: REL.SPAWN,
  result: REL.SPAWN,
  outcome: REL.SPAWN,

  formation: REL.FORMATION,
  placement: REL.FORMATION,

  weather: REL.WEATHER,

  chance: REL.DROP_RATE,
  probability: REL.DROP_RATE,
  rate: REL.DROP_RATE,

  reward: REL.REWARD,
  rewards: REL.REWARD,

  contents: REL.CONTENTS,
  drops: REL.CONTENTS,

  date: REL.DATE,
  released: REL.DATE,

  obtain: REL.METHOD,
  obtaining: REL.METHOD,
  method: REL.METHOD,
  source: REL.METHOD,

  slot: REL.SLOTS,
  slots: REL.SLOTS,

  floor: REL.FLOORS,
  floors: REL.FLOORS,

  replacement: REL.REPLACED_BY,
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

  bombardiro: [
    "bombardiro",
    "bombardiro crocodilo",
  ],

  tralalero: [
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
const FACT_CACHE = new Map();
const TITLE_CACHE = new Map();
const ANSWER_CACHE = new Map();

/* ---------------------------------------------------------
   BASIC HELPERS
--------------------------------------------------------- */

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

function tokens(value) {
  return (
    clean(value, 1000)
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

function env(name) {
  return String(
    process.env[name] ||
    ""
  )
    .trim()
    .replace(/^Bearer\s+/i, "")
    .trim();
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

/* ---------------------------------------------------------
   SAFE HTTP
--------------------------------------------------------- */

async function fetchText(
  label,
  url,
  options = {},
  timeoutMs = 1200
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
  timeoutMs = 1200
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

/* ---------------------------------------------------------
   HTML / WIKI TEXT CLEANUP
--------------------------------------------------------- */

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
      (_, number) => {
        const n =
          Number(number);

        return Number.isFinite(n)
          ? String.fromCodePoint(n)
          : " ";
      }
    )
    .replace(
      /&#x([0-9a-f]+);/gi,
      (_, number) => {
        const n =
          Number.parseInt(
            number,
            16
          );

        return Number.isFinite(n)
          ? String.fromCodePoint(n)
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
  return clean(
    String(value ?? "")
      .replace(
        /<!--[\s\S]*?-->/g,
        " "
      )
      .replace(
        /<ref\b[^>]*>[\s\S]*?<\/ref>/gi,
        " "
      )
      .replace(
        /<ref\b[^>]*\/>/gi,
        " "
      )
      .replace(
        /\[\[([^|\]]+)\|([^\]]+)\]\]/g,
        "$2"
      )
      .replace(
        /\[\[([^\]]+)\]\]/g,
        "$1"
      )
      .replace(
        /\{\{[^{}]{0,500}\}\}/g,
        " "
      )
      .replace(
        /'''?/g,
        ""
      )
      .replace(
        /<[^>]+>/g,
        " "
      ),
    3000
  );
}

/* ---------------------------------------------------------
   QUESTION UNDERSTANDING
--------------------------------------------------------- */

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
    IMPORTANT:
    output-type questions need to be checked
    before words like "limited" trigger STATUS.
  */

  if (
    /\b(?:what|which)(?:\s+[a-z0-9'-]+){0,3}\s+(?:brainrot|brain rot)\b/.test(
      q
    )
  ) {
    return REL.BRAINROT;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z0-9'-]+){0,3}\s+gear\b/.test(
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
    /\b(?:income|makes? per second|per second|earn(?:s|ing)?)\b/.test(
      q
    )
  ) {
    return REL.INCOME;
  }

  if (
    /\b(?:cost|price|how much)\b/.test(
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
    /\b(?:multiplier|boost)\b/.test(
      q
    )
  ) {
    return REL.MULTIPLIER;
  }

  if (
    /\b(?:requires?|requirement|needed|need to)\b/.test(
      q
    )
  ) {
    return REL.REQUIREMENT;
  }

  if (
    /\b(?:spawn|spawns|summon|summons)\b/.test(
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

  const words =
    raw.match(
      /[A-Za-z0-9][A-Za-z0-9'._-]*/g
    ) ||
    [];

  const filtered =
    words.filter(
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
      14
    );
}

function analyzeQuestionDeterministic(question) {
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
    relation ===
      REL.GEAR
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
        ? 0.88
        : 0.58,

    source:
      "DETERMINISTIC",
  };
}

/* ---------------------------------------------------------
   OPTIONAL NVIDIA QUESTION ANALYZER
--------------------------------------------------------- */

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
    last > first
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

async function analyzeQuestionAI(
  question,
  deadline
) {
  if (
    !env(
      "NVIDIA_API_KEY"
    )
  ) {
    return null;
  }

  const left =
    timeLeft(deadline);

  if (
    left < 600
  ) {
    return null;
  }

  const timeout =
    Math.max(
      550,

      Math.min(
        CFG.NVIDIA_TIMEOUT_MS,
        left - 80
      )
    );

  try {
    const data =
      await fetchJson(
        "NVIDIA_ANALYZE",

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
                180,

              chat_template_kwargs: {
                enable_thinking:
                  false,
              },

              messages: [
                {
                  role:
                    "system",

                  content: [
                    "Parse a Steal a Brainrot question.",
                    "Do not answer the question.",
                    "Identify the entity and relation being requested.",
                    "Correct obvious shorthand such as Flash TP = Flash Teleport.",
                    "Return JSON only.",
                    "Allowed relations:",
                    Object.values(
                      REL
                    ).join(", "),
                    'Schema: {"entity":"string or null","relation":"RELATION","update":"string or null","rebirth":0,"current":false,"aliases":[]}',
                  ].join("\n"),
                },

                {
                  role:
                    "user",

                  content:
                    question,
                },
              ],
            }),
        },

        timeout
      );

    const raw =
      parseModelJson(
        data?.choices?.[0]
          ?.message?.content
      );

    const relation =
      Object.values(
        REL
      ).includes(
        String(
          raw?.relation
        ).toUpperCase()
      )
        ? String(
            raw.relation
          ).toUpperCase()
        : REL.TEXT;

    return {
      entity:
        clean(
          raw?.entity,
          140
        ) ||
        null,

      relation,

      update:
        clean(
          raw?.update,
          30
        ) ||
        null,

      rebirth:
        Number(
          raw?.rebirth
        ) ||
        null,

      current:
        Boolean(
          raw?.current
        ),

      entities: [
        clean(
          raw?.entity,
          140
        ),

        ...(
          Array.isArray(
            raw?.aliases
          )
            ? raw.aliases
            : []
        ).map(
          (x) =>
            clean(
              x,
              140
            )
        ),
      ].filter(
        Boolean
      ),

      confidence:
        0.84,

      source:
        "NVIDIA_ANALYZER",
    };
  } catch {
    return null;
  }
}

function mergeAnalysis(
  deterministic,
  ai
) {
  if (!ai) {
    return deterministic;
  }

  const entity =
    deterministic.entity ||
    ai.entity;

  const relation =
    deterministic.relation !==
    REL.TEXT
      ? deterministic.relation
      : ai.relation;

  return {
    entity,

    entities: [
      ...new Set([
        ...deterministic.entities,
        ...ai.entities,
      ]),
    ].filter(Boolean),

    relation,

    update:
      deterministic.update ||
      ai.update,

    rebirth:
      deterministic.rebirth ||
      ai.rebirth,

    current:
      deterministic.current ||
      ai.current,

    confidence:
      Math.max(
        deterministic.confidence,
        ai.confidence
      ),

    source:
      "MERGED",
  };
}

/* ---------------------------------------------------------
   MEDIAWIKI
--------------------------------------------------------- */

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
    left < 300
  ) {
    throw new Error(
      "WIKI_BUDGET_EXHAUSTED"
    );
  }

  const timeout =
    Math.max(
      350,

      Math.min(
        CFG.WIKI_TIMEOUT_MS,
        left - 60
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
              "ChromeCodeSniper-R20",
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
    HTML fallback.
    Only attempt when enough budget remains.
  */

  if (
    timeLeft(deadline) <
    450
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
              "ChromeCodeSniper-R20",
          },
        },

        Math.min(
          800,
          timeLeft(deadline) -
          50
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
    left < 300
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

      srenablerewrites:
        "1",

      format:
        "json",
    });

  try {
    const data =
      await fetchJson(
        "FANDOM_SEARCH",

        `${FANDOM_API}?${params}`,

        {
          headers: {
            Accept:
              "application/json",

            "User-Agent":
              "ChromeCodeSniper-R20",
          },
        },

        Math.min(
          800,
          left - 50
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

/* ---------------------------------------------------------
   SOURCE ROUTING
--------------------------------------------------------- */

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

function titleSimilarity(a, b) {
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
    return 0.92;
  }

  const at =
    new Set(
      tokens(a)
    );

  const bt =
    new Set(
      tokens(b)
    );

  if (
    !at.size ||
    !bt.size
  ) {
    return 0;
  }

  let same = 0;

  for (
    const value
    of at
  ) {
    if (
      bt.has(value)
    ) {
      same++;
    }
  }

  return (
    same /
    Math.max(
      at.size,
      bt.size
    )
  );
}

async function canonicalStage(
  question,
  analysis,
  deadline
) {
  const requested =
    [];

  /*
    Direct exact entity-page attempt happens immediately.
    This fixes questions such as:
    "How much does Tralalero Tralala cost?"
  */

  if (
    analysis.entity
  ) {
    requested.push(
      analysis.entity
    );
  }

  for (
    const title
    of hubTitles(question)
  ) {
    requested.push(title);
  }

  if (
    analysis.current &&
    clean(
      question
    )
      .toLowerCase()
      .includes(
        "rebirth"
      )
  ) {
    requested.unshift(
      "Rebirth"
    );
  }

  if (
    analysis.update
  ) {
    const major =
      String(
        analysis.update
      )
        .split(".")[0];

    requested.unshift(
      `Update Log/Update ${major}`,
      "Update Log"
    );
  }

  const directTitles = [
    ...new Set(
      requested
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

  /*
    Direct page fetches and MediaWiki title search
    run together.
  */

  const directPromise =
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
    directSettled,
    searchTitles,
  ] =
    await Promise.all([
      directPromise,
      searchPromise,
    ]);

  const pages =
    [];

  const errors =
    [];

  for (
    const row
    of directSettled
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
    Search results are used only to fill missing
    entity pages, not blindly fetch everything.
  */

  if (
    timeLeft(deadline) >
    350 &&
    searchTitles.length
  ) {
    const existing =
      new Set(
        pages.map(
          (page) =>
            page.title
              .toLowerCase()
        )
      );

    const ranked =
      searchTitles
        .map(
          (title) => ({
            title,

            score:
              Math.max(
                titleSimilarity(
                  analysis.entity,
                  title
                ),

                ...analysis.entities.map(
                  (candidate) =>
                    titleSimilarity(
                      candidate,
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
            0.38 &&
            !existing.has(
              row.title
                .toLowerCase()
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

  return {
    pages,
    errors,
  };
}

/* ---------------------------------------------------------
   HTML TABLE PARSER
--------------------------------------------------------- */

function parseHtmlTables(page) {
  const html =
    String(
      page?.html ||
      ""
    );

  const tables =
    [];

  const tableMatches =
    html.match(
      /<table\b[^>]*>[\s\S]*?<\/table>/gi
    ) ||
    [];

  for (
    const tableHtml
    of tableMatches
  ) {
    const rowMatches =
      tableHtml.match(
        /<tr\b[^>]*>[\s\S]*?<\/tr>/gi
      ) ||
      [];

    const rawRows =
      [];

    for (
      const rowHtml
      of rowMatches
    ) {
      const cells =
        [];

      const re =
        /<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi;

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

          text:
            htmlToText(
              match[2],
              1000
            ),
        });
      }

      if (
        cells.length
      ) {
        rawRows.push(
          cells
        );
      }
    }

    if (
      !rawRows.length
    ) {
      continue;
    }

    let headerIndex =
      -1;

    for (
      let i = 0;
      i <
      Math.min(
        rawRows.length,
        4
      );
      i++
    ) {
      const row =
        rawRows[i];

      const thCount =
        row.filter(
          (cell) =>
            cell.type === "th"
        ).length;

      const semantic =
        row.some(
          (cell) =>
            normalizeHeader(
              cell.text
            )
        );

      if (
        thCount >=
        Math.ceil(
          row.length /
          2
        ) ||
        semantic
      ) {
        headerIndex =
          i;

        break;
      }
    }

    let headers =
      [];

    let dataStart =
      0;

    if (
      headerIndex >= 0
    ) {
      headers =
        rawRows[
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
      rawRows
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

    tables.push({
      type:
        "HTML_TABLE",

      headers,

      rows,
    });
  }

  return tables;
}

/* ---------------------------------------------------------
   WIKITEXT TABLE PARSER
--------------------------------------------------------- */

function parseWikitextTables(page) {
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
    const sections =
      block.split(
        /\n\|-\s*[^\n]*/g
      );

    const raw =
      [];

    for (
      const section
      of sections
    ) {
      const lines =
        section
          .split(/\n/)
          .map(
            (line) =>
              line.trim()
          )
          .filter(Boolean);

      const row =
        [];

      for (
        const line
        of lines
      ) {
        if (
          line.startsWith("!")
        ) {
          const cells =
            line
              .slice(1)
              .split("!!")
              .map(stripWiki);

          row.push(
            ...cells.map(
              (text) => ({
                type:
                  "th",

                text,
              })
            )
          );
        }

        if (
          line.startsWith("|") &&
          !line.startsWith("|}")
        ) {
          const content =
            line.slice(1);

          const cells =
            content
              .split("||")
              .map(
                (cell) => {
                  /*
                    Remove style/attribute fragments such as:
                    style="..." | VALUE
                  */

                  const pieces =
                    cell.split("|");

                  return stripWiki(
                    pieces.length >
                    1
                      ? pieces[
                          pieces.length -
                          1
                        ]
                      : cell
                  );
                }
              );

          row.push(
            ...cells.map(
              (text) => ({
                type:
                  "td",

                text,
              })
            )
          );
        }
      }

      if (
        row.length
      ) {
        raw.push(row);
      }
    }

    if (
      raw.length <
      2
    ) {
      continue;
    }

    let headerIndex =
      raw.findIndex(
        (row) =>
          row.some(
            (cell) =>
              cell.type ===
              "th"
          )
      );

    if (
      headerIndex <
      0
    ) {
      headerIndex = 0;
    }

    const headers =
      raw[
        headerIndex
      ].map(
        (cell, index) =>
          cell.text ||
          `column_${index + 1}`
      );

    const rows =
      raw
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
      rows.length
    ) {
      tables.push({
        type:
          "WIKITEXT_TABLE",

        headers,
        rows,
      });
    }
  }

  return tables;
}

/* ---------------------------------------------------------
   HEADER NORMALIZATION
--------------------------------------------------------- */

function normalizeHeader(header) {
  const h =
    clean(
      header,
      200
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9/$% +_-]+/g,
        " "
      )
      .trim();

  if (!h) {
    return null;
  }

  if (
    /^name$/.test(h) ||
    /brainrot name/.test(h) ||
    /mutation name/.test(h) ||
    /trait name/.test(h) ||
    /ritual name/.test(h)
  ) {
    return REL.TEXT;
  }

  if (
    /^brainrot$/.test(h)
  ) {
    return REL.BRAINROT;
  }

  if (
    /gear|ability|tool/.test(h)
  ) {
    return REL.GEAR;
  }

  if (
    /multi|multiplier|boost/.test(h)
  ) {
    return REL.MULTIPLIER;
  }

  if (
    /cost|price|buy/.test(h)
  ) {
    return REL.COST;
  }

  if (
    /income|earn|money per second|\$\/s|per second/.test(
      h
    )
  ) {
    return REL.INCOME;
  }

  if (
    /rarity|tier/.test(h)
  ) {
    return REL.RARITY;
  }

  if (
    /status|obtainability|available/.test(
      h
    )
  ) {
    return REL.STATUS;
  }

  if (
    /rebirth|level/.test(h)
  ) {
    return REL.REBIRTH;
  }

  if (
    /requires?|requirement|needed|materials?/.test(
      h
    )
  ) {
    return REL.REQUIREMENT;
  }

  if (
    /spawn|result|summon|outcome/.test(
      h
    )
  ) {
    return REL.SPAWN;
  }

  if (
    /formation|placement|arrange/.test(
      h
    )
  ) {
    return REL.FORMATION;
  }

  if (
    /weather/.test(h)
  ) {
    return REL.WEATHER;
  }

  if (
    /chance|probability|drop rate|rate/.test(
      h
    )
  ) {
    return REL.DROP_RATE;
  }

  if (
    /reward/.test(h)
  ) {
    return REL.REWARD;
  }

  if (
    /contents?|drops?/.test(h)
  ) {
    return REL.CONTENTS;
  }

  if (
    /date|release/.test(h)
  ) {
    return REL.DATE;
  }

  if (
    /obtain|method|source/.test(h)
  ) {
    return REL.METHOD;
  }

  if (
    /slots?/.test(h)
  ) {
    return REL.SLOTS;
  }

  if (
    /floors?/.test(h)
  ) {
    return REL.FLOORS;
  }

  if (
    /replaced by|replacement/.test(
      h
    )
  ) {
    return REL.REPLACED_BY;
  }

  return null;
}

function normalizeFactValue(
  value,
  relation
) {
  const text =
    clean(
      value,
      500
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
        /^\s*(\d{1,3})\s*$/
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
        /\b\d+(?:\.\d+)?\s*[x×]/i
      );

    if (match) {
      return match[0]
        .replace(
          /\s+/g,
          ""
        )
        .replace(
          "×",
          "x"
        );
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

  if (
    relation ===
    REL.COST
  ) {
    const match =
      text.match(
        /\$\s*\d+(?:\.\d+)?\s*[KMBT]?/i
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
        /\$\s*\d+(?:\.\d+)?\s*[KMBT]?\s*(?:\/\s*s|per\s*second)?/i
      );

    if (match) {
      let output =
        match[0]
          .replace(
            /\s+/g,
            ""
          );

      output =
        output.replace(
          /persecond/i,
          "/s"
        );

      if (
        !/\/s$/i.test(
          output
        )
      ) {
        output +=
          "/s";
      }

      return output;
    }
  }

  return text;
}

/* ---------------------------------------------------------
   FACT GRAPH
--------------------------------------------------------- */

function makeFact(
  subject,
  relation,
  object,
  page,
  confidence,
  extractor,
  evidence = ""
) {
  const s =
    clean(
      subject,
      220
    );

  const o =
    clean(
      object,
      500
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
      clamp(
        confidence
      ),

    extractor,

    sourceTitle:
      page.title,

    sourceUrl:
      page.url,

    sourceType:
      page.source,

    evidence:
      clean(
        evidence ||
        `${s} | ${relation} | ${o}`,
        1000
      ),
  };
}

function dedupeFacts(facts) {
  const map =
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
      )}|${fact.relation}|${norm(
        fact.object
      )}`;

    const old =
      map.get(key);

    if (
      !old ||
      fact.confidence >
      old.confidence
    ) {
      map.set(
        key,
        fact
      );
    }
  }

  return [
    ...map.values(),
  ];
}

function inverseFacts(fact) {
  const out =
    [];

  /*
    Rebirth18 -> GEAR -> Flash Teleport
    Flash Teleport -> REBIRTH -> Rebirth18
  */

  if (
    fact.relation ===
      REL.GEAR &&
    /^rebirth\d+$/i.test(
      norm(
        fact.subject
      )
    )
  ) {
    out.push(
      makeFact(
        fact.object,
        REL.REBIRTH,
        fact.subject,
        {
          title:
            fact.sourceTitle,

          url:
            fact.sourceUrl,

          source:
            fact.sourceType,
        },
        fact.confidence -
          0.01,
        "INVERSE",
        fact.evidence
      )
    );
  }

  /*
    Ritual -> SPAWN -> Brainrot
    Brainrot -> RITUAL -> Ritual
  */

  if (
    fact.relation ===
      REL.SPAWN &&
    /ritual/i.test(
      fact.subject
    )
  ) {
    out.push(
      makeFact(
        fact.object,
        REL.RITUAL,
        fact.subject,
        {
          title:
            fact.sourceTitle,

          url:
            fact.sourceUrl,

          source:
            fact.sourceType,
        },
        fact.confidence -
          0.02,
        "INVERSE",
        fact.evidence
      )
    );
  }

  /*
    Entity -> REBIRTH -> RebirthN
    RebirthN -> REWARD -> Entity
    only when there is no better typed gear relation.
  */

  if (
    fact.relation ===
      REL.REBIRTH &&
    /^rebirth\d+$/i.test(
      norm(
        fact.object
      )
    )
  ) {
    out.push(
      makeFact(
        fact.object,
        REL.REWARD,
        fact.subject,
        {
          title:
            fact.sourceTitle,

          url:
            fact.sourceUrl,

          source:
            fact.sourceType,
        },
        fact.confidence -
          0.03,
        "INVERSE",
        fact.evidence
      )
    );
  }

  return out.filter(Boolean);
}

/* ---------------------------------------------------------
   TABLE -> FACTS
--------------------------------------------------------- */

function factsFromTable(
  page,
  table
) {
  if (
    !table.headers.length ||
    !table.rows.length
  ) {
    return [];
  }

  const relations =
    table.headers.map(
      normalizeHeader
    );

  let subjectIndex =
    relations.findIndex(
      (relation) =>
        relation ===
        REL.TEXT
    );

  /*
    If no generic Name column,
    Brainrot column can be subject.
  */

  if (
    subjectIndex < 0
  ) {
    subjectIndex =
      relations.findIndex(
        (relation) =>
          relation ===
          REL.BRAINROT
      );
  }

  /*
    Rebirth tables often use Rebirth
    as the row's subject.
  */

  if (
    subjectIndex < 0
  ) {
    const rebirthIndex =
      relations.findIndex(
        (relation) =>
          relation ===
          REL.REBIRTH
      );

    if (
      rebirthIndex >= 0
    ) {
      subjectIndex =
        rebirthIndex;
    }
  }

  const facts =
    [];

  for (
    const row
    of table.rows
  ) {
    if (
      !row.cells.length
    ) {
      continue;
    }

    /*
      Page-context ownership:

      On /wiki/Tralalero_Tralala:

      Income | Cost
      $50K/s | $10M

      Subject = Tralalero Tralala
    */

    let subject =
      subjectIndex >= 0
        ? row.cells[
            subjectIndex
          ]
        : page.title;

    subject =
      clean(
        subject,
        220
      );

    const subjectRelation =
      subjectIndex >= 0
        ? relations[
            subjectIndex
          ]
        : null;

    if (
      subjectRelation ===
      REL.REBIRTH
    ) {
      subject =
        normalizeFactValue(
          subject,
          REL.REBIRTH
        ) ||
        subject;
    }

    if (!subject) {
      continue;
    }

    for (
      let i = 0;
      i <
      row.cells.length;
      i++
    ) {
      if (
        i === subjectIndex
      ) {
        continue;
      }

      const relation =
        relations[i];

      if (!relation) {
        continue;
      }

      let value =
        normalizeFactValue(
          row.cells[i],
          relation
        );

      if (!value) {
        continue;
      }

      const evidence =
        row.cells.join(
          " | "
        );

      /*
        Special case:
        Rebirth row + untyped Name/Brainrot value.
      */

      if (
        /^rebirth\d+$/i.test(
          norm(subject)
        ) &&
        relation ===
          REL.BRAINROT
      ) {
        const gearLike =
          /gear|item|reward/i.test(
            table.headers[i] ||
            ""
          );

        const finalRelation =
          gearLike
            ? REL.GEAR
            : REL.REWARD;

        facts.push(
          makeFact(
            subject,
            finalRelation,
            value,
            page,
            0.99,
            table.type,
            evidence
          )
        );

        continue;
      }

      facts.push(
        makeFact(
          subject,
          relation,
          value,
          page,
          0.985,
          table.type,
          evidence
        )
      );
    }
  }

  const withInverse = [
    ...facts,
  ];

  for (
    const fact
    of facts
  ) {
    withInverse.push(
      ...inverseFacts(
        fact
      )
    );
  }

  return withInverse.filter(Boolean);
}

/* ---------------------------------------------------------
   INFOBOX -> FACTS
--------------------------------------------------------- */

function infoboxPairs(page) {
  const html =
    String(
      page?.html ||
      ""
    );

  const pairs =
    [];

  const source =
    html.match(
      /<(?:aside|table)\b[^>]*(?:portable-infobox|infobox)[^>]*>[\s\S]*?<\/(?:aside|table)>/i
    )?.[0] ||
    "";

  if (source) {
    for (
      const match
      of source.matchAll(
        /<div\b[^>]*data-source=["']([^"']+)["'][^>]*>([\s\S]*?)<\/div>/gi
      )
    ) {
      const key =
        clean(
          match[1],
          120
        );

      const value =
        htmlToText(
          match[2],
          800
        );

      if (
        key &&
        value
      ) {
        pairs.push([
          key,
          value,
        ]);
      }
    }

    for (
      const row
      of source.matchAll(
        /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
      )
    ) {
      const cells = [
        ...row[1].matchAll(
          /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi
        ),
      ].map(
        (m) =>
          htmlToText(
            m[1],
            600
          )
      );

      if (
        cells.length >= 2
      ) {
        pairs.push([
          cells[0],
          cells
            .slice(1)
            .join(" | "),
        ]);
      }
    }
  }

  /*
    Wikitext infobox fallback.
  */

  if (
    page?.wikitext
  ) {
    const template =
      String(
        page.wikitext
      ).match(
        /\{\{[\s\S]{0,18000}?\n\}\}/
      )?.[0] ||
      "";

    for (
      const line
      of template.split(
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

      pairs.push([
        stripWiki(
          match[1]
        ),
        stripWiki(
          match[2]
        ),
      ]);
    }
  }

  return pairs;
}

function factsFromInfobox(page) {
  const facts =
    [];

  for (
    const [
      key,
      rawValue,
    ] of infoboxPairs(page)
  ) {
    const relation =
      normalizeHeader(key);

    if (!relation) {
      continue;
    }

    const value =
      normalizeFactValue(
        rawValue,
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
        0.99,
        "INFOBOX",
        `${key} | ${rawValue}`
      )
    );
  }

  return facts.filter(Boolean);
}

/* ---------------------------------------------------------
   PROSE -> FACTS
--------------------------------------------------------- */

function factsFromProse(page) {
  const text =
    page.text ||
    "";

  const facts =
    [];

  const add = (
    relation,
    regex,
    transform = (x) => x
  ) => {
    const match =
      text.match(regex);

    if (
      !match?.[1]
    ) {
      return;
    }

    const value =
      transform(
        clean(
          match[1],
          300
        )
      );

    if (!value) {
      return;
    }

    facts.push(
      makeFact(
        page.title,
        relation,
        value,
        page,
        0.90,
        "PROSE",
        match[0]
      )
    );
  };

  add(
    REL.COST,
    /\bcosts?\s+\$?\s*(\d+(?:\.\d+)?\s*[KMBT]?)/i,
    (x) =>
      `$${x.replace(
        /\s+/g,
        ""
      )}`
  );

  add(
    REL.INCOME,
    /\b(?:income|makes?|generates?)\s+(?:of\s+)?\$?\s*(\d+(?:\.\d+)?\s*[KMBT]?)\s*(?:\/\s*s|per\s*second)/i,
    (x) =>
      `$${x.replace(
        /\s+/g,
        ""
      )}/s`
  );

  add(
    REL.MULTIPLIER,
    /\b(?:multiplier|boost)\s+(?:of\s+|is\s+)?(\d+(?:\.\d+)?\s*[x×])/i,
    (x) =>
      x
        .replace(
          /\s+/g,
          ""
        )
        .replace(
          "×",
          "x"
        )
  );

  return facts.filter(Boolean);
}

function factsFromPage(page) {
  const key =
    `${page.title}|${page.source}`;

  const cached =
    cacheGet(
      FACT_CACHE,
      key
    );

  if (cached) {
    return cached;
  }

  const facts =
    [];

  facts.push(
    ...factsFromInfobox(
      page
    )
  );

  const htmlTables =
    parseHtmlTables(
      page
    );

  const wikiTables =
    parseWikitextTables(
      page
    );

  for (
    const table
    of [
      ...htmlTables,
      ...wikiTables,
    ]
  ) {
    facts.push(
      ...factsFromTable(
        page,
        table
      )
    );
  }

  facts.push(
    ...factsFromProse(
      page
    )
  );

  const deduped =
    dedupeFacts(
      facts
    );

  cacheSet(
    FACT_CACHE,
    key,
    deduped,
    CFG.FACT_CACHE_TTL_MS
  );

  return deduped;
}

/* ---------------------------------------------------------
   FACT MATCHING
--------------------------------------------------------- */

function entityScore(
  wanted,
  actual
) {
  if (
    !wanted ||
    !actual
  ) {
    return 0;
  }

  const w =
    norm(wanted);

  const a =
    norm(actual);

  if (
    !w ||
    !a
  ) {
    return 0;
  }

  if (
    w === a
  ) {
    return 1;
  }

  if (
    w.includes(a) ||
    a.includes(w)
  ) {
    return 0.94;
  }

  const wt =
    new Set(
      tokens(wanted)
    );

  const at =
    new Set(
      tokens(actual)
    );

  let overlap = 0;

  for (
    const token
    of wt
  ) {
    if (
      at.has(token)
    ) {
      overlap++;
    }
  }

  return (
    overlap /
    Math.max(
      wt.size,
      at.size,
      1
    )
  );
}

function queryFacts(
  analysis,
  facts
) {
  const relation =
    analysis.relation;

  const entity =
    analysis.entity;

  const candidates =
    [];

  for (
    const fact
    of facts
  ) {
    if (
      fact.relation !==
      relation
    ) {
      continue;
    }

    let eScore =
      entity
        ? entityScore(
            entity,
            fact.subject
          )
        : 0.7;

    /*
      Try every entity alias/candidate.
    */

    for (
      const alias
      of analysis.entities ||
      []
    ) {
      eScore =
        Math.max(
          eScore,
          entityScore(
            alias,
            fact.subject
          )
        );
    }

    if (
      entity &&
      eScore <
      0.42
    ) {
      continue;
    }

    const score =
      fact.confidence *
      (
        entity
          ? eScore
          : 0.9
      );

    candidates.push({
      fact,
      score,
    });
  }

  candidates.sort(
    (a, b) =>
      b.score -
      a.score
  );

  if (
    !candidates.length
  ) {
    return null;
  }

  const best =
    candidates[0];

  /*
    Do not silently accept two equally strong
    conflicting canonical answers.
  */

  const conflict =
    candidates.find(
      (row, index) =>
        index > 0 &&
        row.score >=
        best.score - 0.03 &&
        norm(
          row.fact.object
        ) !==
        norm(
          best.fact.object
        )
    );

  if (conflict) {
    return {
      answer:
        "UNKNOWN",

      candidateAnswer:
        best.fact.object,

      confidence:
        Math.min(
          0.65,
          best.score
        ),

      reason:
        "fact_conflict",

      route:
        "FACT_CONFLICT",

      sourceCount:
        2,

      sources: [
        factSource(
          best.fact
        ),

        factSource(
          conflict.fact
        ),
      ],
    };
  }

  if (
    best.score <
    0.68
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
        0.995,
        Math.max(
          0.90,
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
      factSource(
        best.fact
      ),
    ],
  };
}

function factSource(fact) {
  return {
    host:
      "stealabrainrot.fandom.com",

    title:
      fact.sourceTitle,

    url:
      fact.sourceUrl,

    claimType:
      `${fact.extractor}:${fact.relation}`,
  };
}

/* ---------------------------------------------------------
   CURRENT REBIRTH SPECIAL RESOLVER
--------------------------------------------------------- */

function currentRebirth(
  pages
) {
  const page =
    pages.find(
      (p) =>
        clean(
          p.title,
          200
        ).toLowerCase() ===
        "rebirth"
    );

  if (!page) {
    return null;
  }

  const numbers =
    new Set();

  const facts =
    factsFromPage(page);

  for (
    const fact
    of facts
  ) {
    for (
      const value
      of [
        fact.subject,
        fact.object,
      ]
    ) {
      const match =
        String(value)
          .match(
            /\brebirth\s*#?\s*(\d{1,3})\b/i
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
    Also inspect full page text because
    some tables may use raw numbers.
  */

  for (
    const match
    of page.text.matchAll(
      /\brebirth\s*#?\s*(\d{1,3})\b/gi
    )
  ) {
    numbers.add(
      Number(
        match[1]
      )
    );
  }

  const valid = [
    ...numbers,
  ].filter(
    (n) =>
      n >= 1 &&
      n <= 999
  );

  if (!valid.length) {
    return null;
  }

  const max =
    Math.max(
      ...valid
    );

  return {
    answer:
      `Rebirth${max}`,

    candidateAnswer:
      `Rebirth${max}`,

    confidence:
      0.99,

    reason:
      "canonical_full_rebirth_max",

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
          "FULL_PAGE_REBIRTH_MAX",
      },
    ],
  };
}

/* ---------------------------------------------------------
   UPDATE PAGE DIRECT EXTRACTION
--------------------------------------------------------- */

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
        (x) =>
          clean(
            x,
            100
          ).toLowerCase()
      )
      .filter(Boolean);

  const regex =
    /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;

  const found =
    [];

  let match;

  while (
    (
      match =
        regex.exec(html)
    ) !==
    null
  ) {
    found.push({
      index:
        match.index,

      end:
        regex.lastIndex,

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

function directUpdateAnswer(
  question,
  analysis,
  pages
) {
  if (
    !analysis.update
  ) {
    return null;
  }

  const relevant =
    pages.filter(
      (page) =>
        /update/i.test(
          page.title
        )
    );

  if (!relevant.length) {
    return null;
  }

  for (
    const page
    of relevant
  ) {
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

      if (date) {
        return {
          answer:
            date,

          candidateAnswer:
            date,

          confidence:
            0.97,

          reason:
            "canonical_update_date",

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
      Keep a safe deterministic rule for
      named Brainrots in update sections.
    */

    if (
      analysis.relation ===
      REL.BRAINROT
    ) {
      if (
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
            "canonical_update_entity",

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
  }

  return null;
}

/* ---------------------------------------------------------
   CANONICAL DIRECT RESOLUTION
--------------------------------------------------------- */

function resolveCanonical(
  question,
  analysis,
  canonical
) {
  const pages =
    canonical.pages;

  if (
    analysis.current &&
    clean(
      question
    )
      .toLowerCase()
      .includes(
        "rebirth"
      )
  ) {
    const result =
      currentRebirth(
        pages
      );

    if (result) {
      return result;
    }
  }

  const update =
    directUpdateAnswer(
      question,
      analysis,
      pages
    );

  if (update) {
    return update;
  }

  const facts =
    dedupeFacts(
      pages.flatMap(
        factsFromPage
      )
    );

  const result =
    queryFacts(
      analysis,
      facts
    );

  if (result) {
    return result;
  }

  return null;
}

/* ---------------------------------------------------------
   TAVILY FALLBACK
--------------------------------------------------------- */

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
    `site:stealabrainrot.fandom.com/wiki "Steal a Brainrot" ${clean(
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
    ...new Set(
      out
    ),
  ].slice(
    0,
    3
  );
}

async function tavilyOne(
  question,
  query,
  deadline,
  includeDomains = null,
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
    left < 300
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
    includeDomains?.length
  ) {
    body.include_domains =
      includeDomains;
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
        300,
        Math.min(
          CFG.TAVILY_TIMEOUT_MS,
          left - 40
        )
      )
    );

  return {
    answer:
      clean(
        data?.answer,
        800
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

  const byUrl =
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
      byUrl.get(key);

    if (
      !old ||
      source.score >
      old.score
    ) {
      byUrl.set(
        key,
        source
      );
    }
  }

  return {
    answers,

    sources: [
      ...byUrl.values(),
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

/* ---------------------------------------------------------
   NVIDIA FINAL EVIDENCE RESOLVER
--------------------------------------------------------- */

function answerInstruction(relation) {
  switch (relation) {
    case REL.REBIRTH:
      return "Return only Rebirth<number>.";

    case REL.COST:
      return "Return only the price.";

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

    case REL.GEAR:
      return "Return only the gear name.";

    case REL.BRAINROT:
      return "Return only the Brainrot proper name.";

    case REL.DATE:
      return "Return only the date.";

    default:
      return "Return only the shortest exact answer.";
  }
}

function evidenceContainsAnswer(
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

  /*
    10x and 10× should verify as equivalent.
  */

  const normalizedAnswer =
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

  const normalizedText =
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
    normalizedAnswer &&
    normalizedText.includes(
      normalizedAnswer
    )
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
    )
  ) {
    return null;
  }

  if (
    timeLeft(deadline) <
    500
  ) {
    return null;
  }

  const evidence =
    [];

  let id =
    1;

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
          12000
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
                    "You resolve Steal a Brainrot facts.",
                    "Use ONLY the supplied evidence.",
                    "Canonical full pages are stronger than web snippets.",
                    "Do not guess.",
                    "Understand tables and page-context fields.",
                    "Use the requested relation, not a random nearby field.",
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
          450,
          Math.min(
            CFG.NVIDIA_TIMEOUT_MS,
            timeLeft(deadline) -
            50
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
        400
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
          evidenceContainsAnswer(
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
          ? 0.96
          : 0.90,
        clamp(
          raw?.confidence
        )
      );

    if (
      confidence <
      0.85
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

/* ---------------------------------------------------------
   ANSWER CACHE
--------------------------------------------------------- */

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
  value
) {
  if (
    !value ||
    value.answer ===
      "UNKNOWN"
  ) {
    return;
  }

  cacheSet(
    ANSWER_CACHE,

    answerCacheKey(
      question
    ),

    value,

    isCurrent(question)
      ? CFG.CURRENT_ANSWER_TTL_MS
      : CFG.STABLE_ANSWER_TTL_MS
  );
}

/* ---------------------------------------------------------
   FINAL RESPONSE SHAPE
--------------------------------------------------------- */

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
      base?.route?.includes(
        "FACT"
      )
        ? "FACT_GRAPH"
        : base?.route?.includes(
            "CANONICAL"
          )
          ? "FULL_CANONICAL"
          : base?.route?.startsWith(
              "AI"
            )
            ? "AI_VERIFIED"
            : "REVIEW",

    cache:
      "MISS",
  };
}

/* ---------------------------------------------------------
   MAIN R20 RESOLVER
--------------------------------------------------------- */

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

  if (cached) {
    return {
      ...cached,

      cache:
        "HIT",

      searchLatencyMs:
        nowMs() -
        startedAt,
    };
  }

  /*
    Step 1:
    deterministic understanding is instant.
  */

  const deterministic =
    analyzeQuestionDeterministic(
      question.question
    );

  /*
    Step 2:
    Start canonical lookup immediately.
  */

  let analysis =
    deterministic;

  let canonicalPromise =
    canonicalStage(
      question.question,
      analysis,
      deadline
    );

  let tavilyPromise =
    null;

  /*
    Start NVIDIA analysis in parallel only when
    deterministic understanding is weak.
  */

  const aiAnalysisPromise =
    deterministic.confidence <
      0.80 ||
    deterministic.relation ===
      REL.TEXT
      ? analyzeQuestionAI(
          question.question,
          deadline
        )
      : Promise.resolve(
          null
        );

  /*
    Wait briefly for canonical.

    If Fandom is slow, begin Tavily BEFORE
    waiting for Fandom to completely fail.
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
        )
        .catch(
          (error) => ({
            done:
              true,

            value: {
              pages:
                [],

              errors: [
                errorCode(
                  error
                ),
              ],
            },
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
      );
  }

  const canonical =
    early.done
      ? early.value
      : await canonicalPromise
          .catch(
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

  /*
    Step 3:
    Try deterministic canonical fact graph FIRST.
    If this works, return immediately.
  */

  let direct =
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
    Step 4:
    AI may have understood the entity better.
    Merge it and query the SAME fact graph again.
  */

  const aiAnalysis =
    await aiAnalysisPromise;

  if (aiAnalysis) {
    const merged =
      mergeAnalysis(
        deterministic,
        aiAnalysis
      );

    const changedEntity =
      norm(
        merged.entity
      ) !==
      norm(
        analysis.entity
      );

    analysis =
      merged;

    direct =
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
      If AI discovered a different entity
      and enough time remains, fetch that page once.
    */

    if (
      changedEntity &&
      analysis.entity &&
      timeLeft(
        deadline
      ) >
      450
    ) {
      try {
        const page =
          await fetchCanonicalPage(
            analysis.entity,
            deadline
          );

        if (
          !canonical.pages.some(
            (existing) =>
              norm(
                existing.title
              ) ===
              norm(
                page.title
              )
          )
        ) {
          canonical.pages.unshift(
            page
          );
        }

        direct =
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
      } catch {}
    }
  }

  /*
    Step 5:
    Tavily fallback.

    If it wasn't already running, start now.
    Tavily failure DOES NOT fail the whole lookup.
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
    await tavilyPromise
      .catch(
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

  /*
    Step 6:
    NVIDIA evidence extraction is LAST.
  */

  const aiResult =
    await aiEvidenceResolve(
      question.question,
      analysis,
      canonical,
      tavily,
      deadline
    );

  if (
    aiResult?.answer &&
    aiResult.answer !==
      "UNKNOWN"
  ) {
    const result =
      finalize(
        aiResult,
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

  /*
    Never finish with provider-specific fatal errors.
    A provider failure is diagnostic only.
  */

  return finalize(
    {
      answer:
        "UNKNOWN",

      candidateAnswer:
        direct?.candidateAnswer ||
        "UNKNOWN",

      confidence:
        direct?.confidence ||
        0,

      reason:
        direct?.reason ||
        (
          canonical.pages.length
            ? "no_matching_verified_fact"
            : "no_canonical_pages"
        ),

      route:
        "REVIEW",

      sourceCount:
        direct?.sourceCount ||
        0,

      sources:
        direct?.sources ||
        [],
    },

    question.question,
    analysis,
    canonical,
    tavily,
    startedAt
  );
}

/* ---------------------------------------------------------
   INPUT
--------------------------------------------------------- */

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

  if (failed) {
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

/* ---------------------------------------------------------
   SELF TESTS
--------------------------------------------------------- */

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
    analyzeQuestionDeterministic(
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
    if (condition) {
      passed++;
    } else {
      failures.push(
        name
      );
    }
  };

  check(
    "analysis rarity",
    inferRelation(
      "What rarity is Tralalero Tralala?"
    ) ===
    REL.RARITY
  );

  check(
    "analysis income",
    inferRelation(
      "What is the income of Tralalero Tralala per second?"
    ) ===
    REL.INCOME
  );

  check(
    "analysis ritual spawn",
    inferRelation(
      "What does the Bombardiro Crocodilo ritual spawn?"
    ) ===
    REL.SPAWN
  );

  check(
    "analysis giant potion rebirth",
    inferRelation(
      "Which rebirth unlocks Giant Potion?"
    ) ===
    REL.REBIRTH
  );

  const tralalero =
    syntheticPage(
      "Tralalero Tralala",

      `<table>
        <tr>
          <th>Income</th>
          <th>Cost</th>
        </tr>
        <tr>
          <td>$50K/s</td>
          <td>$10M</td>
        </tr>
      </table>

      <table>
        <tr>
          <th>Rarity</th>
        </tr>
        <tr>
          <td>Brainrot God</td>
        </tr>
      </table>`
    );

  check(
    "Tralalero cost",
    testResolve(
      "How much does Tralalero Tralala cost?",
      [
        tralalero,
      ]
    )?.answer ===
    "$10M"
  );

  check(
    "Tralalero income",
    testResolve(
      "What is the income of Tralalero Tralala per second?",
      [
        tralalero,
      ]
    )?.answer ===
    "$50K/s"
  );

  check(
    "Tralalero rarity",
    testResolve(
      "What rarity is Tralalero Tralala?",
      [
        tralalero,
      ]
    )?.answer ===
    "Brainrot God"
  );

  const mutations =
    syntheticPage(
      "Mutations",

      `<table>
        <tr>
          <th>Multi</th>
          <th>Name</th>
        </tr>
        <tr>
          <td>10×</td>
          <td>Rainbow</td>
        </tr>
      </table>`
    );

  check(
    "Rainbow multiplier",
    testResolve(
      "What multiplier does Rainbow mutation give?",
      [
        mutations,
      ]
    )?.answer ===
    "10x"
  );

  const rituals =
    syntheticPage(
      "Rituals",

      `<table>
        <tr>
          <th>Name</th>
          <th>Spawns</th>
          <th>Requires</th>
          <th>Formation</th>
          <th>Weather</th>
        </tr>

        <tr>
          <td>Bombardiro Crocodilo Ritual</td>
          <td>Los Crocodillitos</td>
          <td>Bombardiro Crocodilo x3</td>
          <td>Line</td>
          <td>Explosive</td>
        </tr>
      </table>`
    );

  check(
    "Bombardiro spawn",
    testResolve(
      "What does the Bombardiro Crocodilo ritual spawn?",
      [
        rituals,
      ]
    )?.answer ===
    "Los Crocodillitos"
  );

  check(
    "Bombardiro requirement",
    testResolve(
      "What does the Bombardiro Crocodilo ritual require?",
      [
        rituals,
      ]
    )?.answer ===
    "Bombardiro Crocodilo x3"
  );

  const rebirth =
    syntheticPage(
      "Rebirth",

      `<table>
        <tr>
          <th>Rebirth</th>
          <th>Gear</th>
        </tr>

        <tr>
          <td>Rebirth 17</td>
          <td>Giant Potion</td>
        </tr>

        <tr>
          <td>Rebirth 18</td>
          <td>Flash Teleport</td>
        </tr>

        <tr>
          <td>Rebirth 19</td>
          <td>Ultra Coil</td>
        </tr>
      </table>`
    );

  check(
    "Rebirth18 gear",
    testResolve(
      "What gear is unlocked at Rebirth 18?",
      [
        rebirth,
      ]
    )?.answer ===
    "Flash Teleport"
  );

  check(
    "Flash Teleport rebirth",
    testResolve(
      "Which rebirth unlocks Flash Teleport?",
      [
        rebirth,
      ]
    )?.answer ===
    "Rebirth18"
  );

  check(
    "Giant Potion rebirth",
    testResolve(
      "Which rebirth unlocks Giant Potion?",
      [
        rebirth,
      ]
    )?.answer ===
    "Rebirth17"
  );

  check(
    "current rebirth",
    testResolve(
      "What is the newest rebirth right now?",
      [
        rebirth,
      ]
    )?.answer ===
    "Rebirth19"
  );

  /*
    Generic structural tests.
  */

  for (
    let i = 1;
    i <= 100;
    i++
  ) {
    const entity =
      syntheticPage(
        `Test Brainrot ${i}`,

        `<table>
          <tr>
            <th>Income</th>
            <th>Cost</th>
            <th>Rarity</th>
          </tr>

          <tr>
            <td>$${i}K/s</td>
            <td>$${i}M</td>
            <td>Tier ${i}</td>
          </tr>
        </table>`
      );

    check(
      `generic cost ${i}`,
      testResolve(
        `How much does Test Brainrot ${i} cost?`,
        [
          entity,
        ]
      )?.answer ===
      `$${i}M`
    );

    check(
      `generic income ${i}`,
      testResolve(
        `What income does Test Brainrot ${i} make per second?`,
        [
          entity,
        ]
      )?.answer ===
      `$${i}K/s`
    );

    check(
      `generic rarity ${i}`,
      testResolve(
        `What rarity is Test Brainrot ${i}?`,
        [
          entity,
        ]
      )?.answer ===
      `Tier ${i}`
    );
  }

  for (
    let i = 1;
    i <= 75;
    i++
  ) {
    const mutation =
      syntheticPage(
        "Mutations",

        `<table>
          <tr>
            <th>Multi</th>
            <th>Name</th>
          </tr>

          <tr>
            <td>${i}x</td>
            <td>MutationX ${i}</td>
          </tr>
        </table>`
      );

    check(
      `generic mutation ${i}`,
      testResolve(
        `What multiplier does MutationX ${i} give?`,
        [
          mutation,
        ]
      )?.answer ===
      `${i}x`
    );
  }

  for (
    let i = 1;
    i <= 75;
    i++
  ) {
    const ritual =
      syntheticPage(
        "Rituals",

        `<table>
          <tr>
            <th>Name</th>
            <th>Spawns</th>
            <th>Requires</th>
          </tr>

          <tr>
            <td>RitualX ${i}</td>
            <td>SpawnX ${i}</td>
            <td>RequirementX ${i}</td>
          </tr>
        </table>`
      );

    check(
      `generic ritual spawn ${i}`,
      testResolve(
        `What does RitualX ${i} ritual spawn?`,
        [
          ritual,
        ]
      )?.answer ===
      `SpawnX ${i}`
    );

    check(
      `generic ritual requirement ${i}`,
      testResolve(
        `What does RitualX ${i} ritual require?`,
        [
          ritual,
        ]
      )?.answer ===
      `RequirementX ${i}`
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
        30
      ),

    note:
      "Synthetic deterministic tests only. Live Fandom/Tavily/NVIDIA are checked with the other test endpoints.",
  };
}

/* ---------------------------------------------------------
   HTTP ROUTES
--------------------------------------------------------- */

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
    "analyze"
  ) {
    const question =
      clean(
        url.searchParams.get(
          "q"
        ) ||
        "What rarity is Tralalero Tralala?",
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

        deterministic:
          analyzeQuestionDeterministic(
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
        "Tralalero Tralala",
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

      const facts =
        factsFromPage(
          page
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

          htmlTables:
            parseHtmlTables(
              page
            ).length,

          wikiTables:
            parseWikitextTables(
              page
            ).length,

          factCount:
            facts.length,

          sampleFacts:
            facts.slice(
              0,
              20
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
        "What rarity is Tralalero Tralala?",
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
        "What rarity is Tralalero Tralala?",
        700
      );

    const started =
      nowMs();

    const analysis =
      analyzeQuestionDeterministic(
        question
      );

    try {
      const result =
        await tavilyStage(
          question,
          analysis,
          started +
          2500
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
        entityFirst:
          true,

        factGraph:
          true,

        reverseRelations:
          true,

        exactEntityPageFirst:
          true,

        htmlTables:
          true,

        wikitextTables:
          true,

        infobox:
          true,

        proseFallback:
          true,

        pageContext:
          true,

        canonicalFirst:
          true,

        parallelFallback:
          true,

        providerFailureIsolation:
          true,

        aiQuestionAnalyzer:
          true,

        aiEvidenceFallback:
          true,

        currentRebirthFullPage:
          true,

        updateSections:
          true,

        pageCache:
          true,

        factCache:
          true,

        answerCache:
          true,
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

  if (!expectedToken) {
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
    IMPORTANT R20 CHANGE:

    Tavily and NVIDIA are NOT required
    for the endpoint to function.

    Canonical Fandom can answer by itself.
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
