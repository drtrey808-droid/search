const BUILD_ID = "SAB_KNOWLEDGE_LOOKUP_R18_2026_08_18";

const FANDOM_API = "https://stealabrainrot.fandom.com/api.php";
const FANDOM_BASE = "https://stealabrainrot.fandom.com/wiki/";
const TAVILY_URL = "https://api.tavily.com/search";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";

const CFG = Object.freeze({
  GLOBAL_BUDGET_MS: 6500,
  WIKI_TIMEOUT_MS: 2200,
  TAVILY_TIMEOUT_MS: 2200,
  NVIDIA_TIMEOUT_MS: 1700,
  SEARCH_DEPTH: "fast",
  SEARCH_MAX_RESULTS: 7,
  MAX_CANONICAL_PAGES: 6,
  MAX_WEB_SOURCES: 12,
  MAX_AI_EVIDENCE: 10,
  CURRENT_CACHE_TTL_MS: 3 * 60 * 1000,
  STABLE_CACHE_TTL_MS: 12 * 60 * 60 * 1000,
  PAGE_CACHE_TTL_MS: 5 * 60 * 1000,
});

const INTENT = Object.freeze({
  CURRENT_REBIRTH: "CURRENT_REBIRTH",
  REBIRTH_UNLOCK: "REBIRTH_UNLOCK",
  REBIRTH_REWARD: "REBIRTH_REWARD",

  GEAR_INFO: "GEAR_INFO",
  GEAR_UNLOCK: "GEAR_UNLOCK",
  GEAR_COST: "GEAR_COST",

  SLAP_INFO: "SLAP_INFO",
  SLAP_REBIRTH: "SLAP_REBIRTH",
  SLAP_COST: "SLAP_COST",

  MUTATION_INFO: "MUTATION_INFO",
  MUTATION_MULTIPLIER: "MUTATION_MULTIPLIER",
  MUTATION_OBTAIN: "MUTATION_OBTAIN",

  TRAIT_INFO: "TRAIT_INFO",
  TRAIT_MULTIPLIER: "TRAIT_MULTIPLIER",
  TRAIT_EVENT: "TRAIT_EVENT",

  EVENT_INFO: "EVENT_INFO",
  EVENT_DATE: "EVENT_DATE",
  EVENT_REWARD: "EVENT_REWARD",

  ADMIN_ABUSE: "ADMIN_ABUSE",

  UPDATE_INFO: "UPDATE_INFO",
  UPDATE_DATE: "UPDATE_DATE",
  UPDATE_ADDED: "UPDATE_ADDED",
  UPDATE_REMOVED: "UPDATE_REMOVED",

  MACHINE_INFO: "MACHINE_INFO",
  MACHINE_CONTENTS: "MACHINE_CONTENTS",
  MACHINE_REPLACED_BY: "MACHINE_REPLACED_BY",

  LUCKY_BLOCK_INFO: "LUCKY_BLOCK_INFO",
  LUCKY_BLOCK_CONTENTS: "LUCKY_BLOCK_CONTENTS",
  LUCKY_BLOCK_DROP_RATE: "LUCKY_BLOCK_DROP_RATE",

  RITUAL_INFO: "RITUAL_INFO",
  RITUAL_REQUIREMENT: "RITUAL_REQUIREMENT",
  RITUAL_SPAWN: "RITUAL_SPAWN",
  RITUAL_FORMATION: "RITUAL_FORMATION",

  RARITY_INFO: "RARITY_INFO",

  BASE_INFO: "BASE_INFO",
  BASE_SLOTS: "BASE_SLOTS",
  BASE_FLOORS: "BASE_FLOORS",

  BRAINROT_INFO: "BRAINROT_INFO",
  BRAINROT_RARITY: "BRAINROT_RARITY",
  BRAINROT_COST: "BRAINROT_COST",
  BRAINROT_INCOME: "BRAINROT_INCOME",
  BRAINROT_OBTAIN: "BRAINROT_OBTAIN",
  BRAINROT_STATUS: "BRAINROT_STATUS",

  GENERIC: "GENERIC",
});

const ANSWER_TYPE = Object.freeze({
  REBIRTH: "REBIRTH",
  GEAR: "GEAR",
  BRAINROT: "BRAINROT",
  MUTATION: "MUTATION",
  TRAIT: "TRAIT",
  EVENT: "EVENT",
  MACHINE: "MACHINE",
  LUCKY_BLOCK: "LUCKY_BLOCK",
  RITUAL: "RITUAL",
  RARITY: "RARITY",
  DATE: "DATE",
  COST: "COST",
  INCOME: "INCOME",
  MULTIPLIER: "MULTIPLIER",
  DROP_RATE: "DROP_RATE",
  COUNT: "COUNT",
  METHOD: "METHOD",
  ENTITY: "ENTITY",
  TEXT: "TEXT",
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

  "admin abuse": [
    "admin abuse",
    "admin event",
  ],

  "lucky block": [
    "lucky block",
    "lucky blocks",
  ],

  "brain rot": [
    "brain rot",
    "brainrot",
  ],

  "brainrot": [
    "brainrot",
    "brain rot",
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
  "much",
  "does",
  "did",
  "do",
  "is",
  "are",
  "was",
  "were",

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
  "that",
  "this",

  "steal",
  "brainrot",
  "brain",
  "rot",
  "sab",
  "roblox",
  "game",
  "right",
  "now",
  "current",
  "currently",
  "latest",

  "newest",
  "new",
  "added",
  "introduced",
  "unlock",
  "unlocks",
  "unlocked",
  "get",
  "gets",
  "got",
  "give",
  "gives",
  "gave",
  "come",
  "came",

  "out",
  "during",
  "update",
  "event",
  "rebirth",
  "gear",
  "mutation",
  "trait",
  "machine",
  "ritual",
  "rarity",
  "base",

  "slap",
  "lucky",
  "block",
  "cost",
  "income",
  "multiplier",
  "rate",
  "drop",
  "requires",
  "require",
  "spawn",
  "spawns",
]);

const ANSWER_CACHE = new Map();
const PAGE_CACHE = new Map();
const TITLE_SEARCH_CACHE = new Map();

function clean(value, limit = 2000) {
  return String(value ?? "")
    .replace(
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .slice(
      0,
      limit
    );
}

function norm(value) {
  return clean(
    value,
    2000
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      ""
    );
}

function clamp(
  value,
  min = 0,
  max = 1
) {
  const n =
    Number(
      value
    );

  return Number.isFinite(
    n
  )
    ? Math.max(
        min,
        Math.min(
          max,
          n
        )
      )
    : min;
}

function env(name) {
  return String(
    process.env[
      name
    ] ||
      ""
  )
    .trim()
    .replace(
      /^Bearer\s+/i,
      ""
    )
    .trim();
}

function nowMs() {
  return Date.now();
}

function timeLeft(
  deadline
) {
  return Math.max(
    0,
    deadline -
      nowMs()
  );
}

function errorCode(
  error
) {
  return clean(
    error?.code ||
      error?.message ||
      error ||
      "UNKNOWN_ERROR",
    320
  );
}

function json(
  status,
  payload
) {
  return new Response(
    JSON.stringify(
      payload
    ),
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

async function fetchText(
  label,
  url,
  options = {},
  timeoutMs = 2200
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
      const e =
        new Error(
          error?.name ===
          "AbortError"
            ? `${label}_TIMEOUT`
            : `${label}_REQUEST_FAILED:${clean(
                error?.message,
                180
              )}`
        );

      e.code =
        error?.name ===
        "AbortError"
          ? `${label}_TIMEOUT`
          : `${label}_REQUEST_FAILED`;

      throw e;
    }

    const text =
      await response.text();

    if (
      !response.ok
    ) {
      const e =
        new Error(
          `${label}_HTTP_${response.status}:${clean(
            text,
            260
          )}`
        );

      e.code =
        `${label}_HTTP_${response.status}`;

      e.status =
        response.status;

      throw e;
    }

    return text;
  } finally {
    clearTimeout(
      timer
    );
  }
}

async function fetchJson(
  label,
  url,
  options = {},
  timeoutMs = 2200
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
      ? JSON.parse(
          text
        )
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

function decodeHtmlEntities(
  value
) {
  return String(
    value ??
      ""
  )
    .replace(
      /&nbsp;/gi,
      " "
    )
    .replace(
      /&amp;/gi,
      "&"
    )
    .replace(
      /&quot;/gi,
      '"'
    )
    .replace(
      /&#39;|&apos;/gi,
      "'"
    )
    .replace(
      /&lt;/gi,
      "<"
    )
    .replace(
      /&gt;/gi,
      ">"
    )
    .replace(
      /&#(\d+);/g,
      (
        _,
        n
      ) => {
        const code =
          Number(
            n
          );

        return Number.isFinite(
          code
        )
          ? String.fromCodePoint(
              code
            )
          : " ";
      }
    )
    .replace(
      /&#x([0-9a-f]+);/gi,
      (
        _,
        n
      ) => {
        const code =
          Number.parseInt(
            n,
            16
          );

        return Number.isFinite(
          code
        )
          ? String.fromCodePoint(
              code
            )
          : " ";
      }
    );
}

function htmlToText(
  html
) {
  return clean(
    decodeHtmlEntities(
      String(
        html ??
          ""
      )
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
          /<\/(?:p|div|li|tr|h[1-6]|section|table)>/gi,
          "\n"
        )
        .replace(
          /<[^>]+>/g,
          " "
        )
    ),
    140000
  );
}

function articleUrl(
  title
) {
  return (
    `${FANDOM_BASE}` +
    encodeURIComponent(
      String(
        title
      ).replace(
        / /g,
        "_"
      )
    )
  );
}

function cacheGet(
  map,
  key
) {
  const row =
    map.get(
      key
    );

  if (
    !row
  ) {
    return null;
  }

  if (
    row.expiresAt <=
    nowMs()
  ) {
    map.delete(
      key
    );

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
        nowMs() +
        ttl,
    }
  );
}

function wikiParseUrl(
  title
) {
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

  if (
    cached
  ) {
    return {
      ...cached,

      cache:
        "HIT",
    };
  }

  const errors =
    [];

  const timeout =
    Math.max(
      700,

      Math.min(
        CFG.WIKI_TIMEOUT_MS,

        timeLeft(
          deadline
        ) -
          100
      )
    );

  if (
    timeout <
    700
  ) {
    throw new Error(
      "WIKI_BUDGET_EXHAUSTED"
    );
  }

  try {
    const data =
      await fetchJson(
        "FANDOM_PARSE",

        wikiParseUrl(
          title
        ),

        {
          headers: {
            Accept:
              "application/json",

            "User-Agent":
              "ChromeCodeSniperLookup-R18",
          },
        },

        timeout
      );

    if (
      data?.error
    ) {
      throw new Error(
        `FANDOM_PARSE_API:${clean(
          data.error
            ?.code ||
            data.error
              ?.info,
          180
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
              ?.wikitext
              ?.[
                "*"
              ] ||
              ""
          );

    const html =
      typeof parsed
        ?.text ===
      "string"
        ? parsed.text
        : String(
            parsed
              ?.text
              ?.[
                "*"
              ] ||
              ""
          );

    if (
      !wikitext &&
      !html
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
            title
        ),

      url:
        articleUrl(
          parsed?.title ||
            title
        ),

      wikitext,

      html,

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
  } catch (
    error
  ) {
    errors.push(
      errorCode(
        error
      )
    );
  }

  try {
    const html =
      await fetchText(
        "FANDOM_HTML",

        articleUrl(
          title
        ),

        {
          headers: {
            Accept:
              "text/html,application/xhtml+xml",

            "User-Agent":
              "ChromeCodeSniperLookup-R18",
          },
        },

        Math.max(
          700,

          Math.min(
            CFG.WIKI_TIMEOUT_MS,

            timeLeft(
              deadline
            ) -
              80
          )
        )
      );

    const text =
      htmlToText(
        html
      );

    if (
      !text ||
      text.length <
        80
    ) {
      throw new Error(
        "FANDOM_HTML_EMPTY"
      );
    }

    const page = {
      requestedTitle:
        title,

      title,

      displayTitle:
        title,

      url:
        articleUrl(
          title
        ),

      wikitext:
        "",

      html,

      text,

      sections:
        [],

      source:
        "FANDOM_FULL_HTML",

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
  } catch (
    error
  ) {
    errors.push(
      errorCode(
        error
      )
    );
  }

  const e =
    new Error(
      `CANONICAL_PAGE_FAILED:${title}:${errors.join(
        "|"
      )}`
    );

  e.code =
    "CANONICAL_PAGE_FAILED";

  throw e;
}

async function wikiSearchTitles(
  query,
  deadline,
  limit = 8
) {
  const cacheKey =
    clean(
      query,
      500
    ).toLowerCase();

  const cached =
    cacheGet(
      TITLE_SEARCH_CACHE,
      cacheKey
    );

  if (
    cached
  ) {
    return cached;
  }

  const timeout =
    Math.max(
      650,

      Math.min(
        CFG.WIKI_TIMEOUT_MS,

        timeLeft(
          deadline
        ) -
          80
      )
    );

  if (
    timeout <
    650
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
          500
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
              "ChromeCodeSniperLookup-R18",
          },
        },

        timeout
      );

    const titles =
      (
        Array.isArray(
          data?.query
            ?.search
        )
          ? data
              .query
              .search
          : []
      )
        .map(
          (
            row
          ) =>
            clean(
              row?.title,
              300
            )
        )
        .filter(
          Boolean
        );

    cacheSet(
      TITLE_SEARCH_CACHE,
      cacheKey,
      titles,
      CFG.PAGE_CACHE_TTL_MS
    );

    return titles;
  } catch {
    return [];
  }
}

function explicitDate(
  question
) {
  const q =
    clean(
      question,
      700
    ).toLowerCase();

  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  const month =
    months.find(
      (
        m
      ) =>
        new RegExp(
          `\\b${m}\\b`,
          "i"
        ).test(
          q
        )
    ) ||
    null;

  const yearMatch =
    q.match(
      /\b(20\d{2})\b/
    );

  const numeric =
    /\b(?:20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]20\d{2})\b/.test(
      q
    );

  return {
    has:
      Boolean(
        (
          month &&
          yearMatch
        ) ||
        numeric
      ),

    month,

    year:
      yearMatch
        ? Number(
            yearMatch[
              1
            ]
          )
        : null,
  };
}

function isCurrent(
  question
) {
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
    "latest update",
    "new update",
    "newly added",
    "just added",
  ].some(
    (
      phrase
    ) =>
      q.includes(
        phrase
      )
  );
}

function inferAnswerType(
  question
) {
  const q =
    clean(
      question,
      700
    ).toLowerCase();

  if (
    /\b(?:when|what date|which date|what year|what month)\b/.test(
      q
    )
  ) {
    return ANSWER_TYPE.DATE;
  }

  if (
    /\b(?:cost|price|how much)\b/.test(
      q
    )
  ) {
    return ANSWER_TYPE.COST;
  }

  if (
    /\b(?:income|makes? per second|per second|earn)\b/.test(
      q
    )
  ) {
    return ANSWER_TYPE.INCOME;
  }

  if (
    /\bmultiplier\b|\b\d+(?:\.\d+)?x\b/.test(
      q
    )
  ) {
    return ANSWER_TYPE.MULTIPLIER;
  }

  if (
    /\b(?:drop rate|chance|probability)\b/.test(
      q
    )
  ) {
    return ANSWER_TYPE.DROP_RATE;
  }

  if (
    /\b(?:how many|number of|count)\b/.test(
      q
    )
  ) {
    return ANSWER_TYPE.COUNT;
  }

  if (
    /\b(?:how do|how can|obtain|obtained|get|get it|acquire|method)\b/.test(
      q
    )
  ) {
    return ANSWER_TYPE.METHOD;
  }

  if (
    /\b(?:which|what)\s+rebirth\b/.test(
      q
    ) ||
    /\brebirth\s+(?:did|does|is)\b/.test(
      q
    )
  ) {
    return ANSWER_TYPE.REBIRTH;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z-]+){0,2}\s+(?:gear|item)\b/.test(
      q
    )
  ) {
    return ANSWER_TYPE.GEAR;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z-]+){0,2}\s+(?:brainrot|brain rot)\b/.test(
      q
    )
  ) {
    return ANSWER_TYPE.BRAINROT;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z-]+){0,2}\s+mutation\b/.test(
      q
    )
  ) {
    return ANSWER_TYPE.MUTATION;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z-]+){0,2}\s+trait\b/.test(
      q
    )
  ) {
    return ANSWER_TYPE.TRAIT;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z-]+){0,2}\s+event\b/.test(
      q
    )
  ) {
    return ANSWER_TYPE.EVENT;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z-]+){0,2}\s+machine\b/.test(
      q
    )
  ) {
    return ANSWER_TYPE.MACHINE;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z-]+){0,2}\s+(?:lucky block|lucky blocks)\b/.test(
      q
    )
  ) {
    return ANSWER_TYPE.LUCKY_BLOCK;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z-]+){0,2}\s+ritual\b/.test(
      q
    )
  ) {
    return ANSWER_TYPE.RITUAL;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z-]+){0,2}\s+rarity\b/.test(
      q
    )
  ) {
    return ANSWER_TYPE.RARITY;
  }

  return ANSWER_TYPE.TEXT;
}

function inferIntent(
  question
) {
  const q =
    clean(
      question,
      700
    ).toLowerCase();

  const answerType =
    inferAnswerType(
      q
    );

  if (
    /\b(?:newest|latest|current|highest)\s+rebirth\b/.test(
      q
    ) ||
    (
      q.includes(
        "rebirth"
      ) &&
      isCurrent(
        q
      )
    )
  ) {
    return INTENT.CURRENT_REBIRTH;
  }

  if (
    q.includes(
      "rebirth"
    ) &&
    answerType ===
      ANSWER_TYPE.GEAR
  ) {
    return INTENT.REBIRTH_REWARD;
  }

  if (
    (
      q.includes(
        "rebirth"
      ) ||
      q.includes(
        "unlock"
      )
    ) &&
    answerType ===
      ANSWER_TYPE.REBIRTH
  ) {
    return INTENT.REBIRTH_UNLOCK;
  }

  if (
    q.includes(
      "slap"
    )
  ) {
    if (
      answerType ===
      ANSWER_TYPE.COST
    ) {
      return INTENT.SLAP_COST;
    }

    if (
      answerType ===
      ANSWER_TYPE.REBIRTH
    ) {
      return INTENT.SLAP_REBIRTH;
    }

    return INTENT.SLAP_INFO;
  }

  if (
    q.includes(
      "mutation"
    )
  ) {
    if (
      answerType ===
      ANSWER_TYPE.MULTIPLIER
    ) {
      return INTENT.MUTATION_MULTIPLIER;
    }

    if (
      answerType ===
      ANSWER_TYPE.METHOD
    ) {
      return INTENT.MUTATION_OBTAIN;
    }

    return INTENT.MUTATION_INFO;
  }

  if (
    q.includes(
      "trait"
    )
  ) {
    if (
      answerType ===
      ANSWER_TYPE.MULTIPLIER
    ) {
      return INTENT.TRAIT_MULTIPLIER;
    }

    if (
      answerType ===
      ANSWER_TYPE.EVENT
    ) {
      return INTENT.TRAIT_EVENT;
    }

    return INTENT.TRAIT_INFO;
  }

  if (
    q.includes(
      "lucky block"
    )
  ) {
    if (
      answerType ===
      ANSWER_TYPE.DROP_RATE
    ) {
      return INTENT.LUCKY_BLOCK_DROP_RATE;
    }

    if (
      /\b(?:inside|contains?|contents?|drops?|from)\b/.test(
        q
      )
    ) {
      return INTENT.LUCKY_BLOCK_CONTENTS;
    }

    return INTENT.LUCKY_BLOCK_INFO;
  }

  if (
    q.includes(
      "ritual"
    )
  ) {
    if (
      /\b(?:require|requires|needed|need)\b/.test(
        q
      )
    ) {
      return INTENT.RITUAL_REQUIREMENT;
    }

    if (
      /\b(?:spawn|spawns|gives|reward)\b/.test(
        q
      )
    ) {
      return INTENT.RITUAL_SPAWN;
    }

    if (
      /\b(?:formation|form|arrange|placement)\b/.test(
        q
      )
    ) {
      return INTENT.RITUAL_FORMATION;
    }

    return INTENT.RITUAL_INFO;
  }

  if (
    q.includes(
      "machine"
    )
  ) {
    if (
      /\b(?:inside|contains?|contents?|drops?|rewards?)\b/.test(
        q
      )
    ) {
      return INTENT.MACHINE_CONTENTS;
    }

    if (
      /\b(?:replaced by|replace|replacement)\b/.test(
        q
      )
    ) {
      return INTENT.MACHINE_REPLACED_BY;
    }

    return INTENT.MACHINE_INFO;
  }

  if (
    q.includes(
      "base"
    )
  ) {
    if (
      /\bslots?\b/.test(
        q
      )
    ) {
      return INTENT.BASE_SLOTS;
    }

    if (
      /\bfloors?\b/.test(
        q
      )
    ) {
      return INTENT.BASE_FLOORS;
    }

    return INTENT.BASE_INFO;
  }

  if (
    q.includes(
      "admin abuse"
    )
  ) {
    return INTENT.ADMIN_ABUSE;
  }

  if (
    /\bupdate\s*\d+(?:\.\d+)?\b/.test(
      q
    ) ||
    q.includes(
      "update"
    )
  ) {
    if (
      answerType ===
      ANSWER_TYPE.DATE
    ) {
      return INTENT.UPDATE_DATE;
    }

    if (
      /\b(?:added|introduced|new)\b/.test(
        q
      )
    ) {
      return INTENT.UPDATE_ADDED;
    }

    if (
      /\b(?:removed|deleted)\b/.test(
        q
      )
    ) {
      return INTENT.UPDATE_REMOVED;
    }

    return INTENT.UPDATE_INFO;
  }

  if (
    q.includes(
      "event"
    )
  ) {
    if (
      answerType ===
      ANSWER_TYPE.DATE
    ) {
      return INTENT.EVENT_DATE;
    }

    if (
      /\b(?:reward|gives|gave|added)\b/.test(
        q
      )
    ) {
      return INTENT.EVENT_REWARD;
    }

    return INTENT.EVENT_INFO;
  }

  if (
    q.includes(
      "gear"
    )
  ) {
    if (
      answerType ===
      ANSWER_TYPE.COST
    ) {
      return INTENT.GEAR_COST;
    }

    if (
      answerType ===
      ANSWER_TYPE.REBIRTH
    ) {
      return INTENT.GEAR_UNLOCK;
    }

    return INTENT.GEAR_INFO;
  }

  if (
    q.includes(
      "rarity"
    )
  ) {
    return INTENT.RARITY_INFO;
  }

  if (
    q.includes(
      "brainrot"
    ) ||
    q.includes(
      "brain rot"
    )
  ) {
    if (
      answerType ===
      ANSWER_TYPE.RARITY
    ) {
      return INTENT.BRAINROT_RARITY;
    }

    if (
      answerType ===
      ANSWER_TYPE.COST
    ) {
      return INTENT.BRAINROT_COST;
    }

    if (
      answerType ===
      ANSWER_TYPE.INCOME
    ) {
      return INTENT.BRAINROT_INCOME;
    }

    if (
      answerType ===
      ANSWER_TYPE.METHOD
    ) {
      return INTENT.BRAINROT_OBTAIN;
    }

    if (
      /\b(?:obtainable|limited|removed|status|available)\b/.test(
        q
      )
    ) {
      return INTENT.BRAINROT_STATUS;
    }

    return INTENT.BRAINROT_INFO;
  }

  return INTENT.GENERIC;
}

function aliasesFor(
  question
) {
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
      q.includes(
        key
      )
    ) {
      values.forEach(
        (
          v
        ) =>
          out.add(
            v
          )
      );
    }
  }

  return [
    ...out,
  ];
}

function extractUpdateNumber(
  question
) {
  const match =
    clean(
      question,
      700
    ).match(
      /\bupdate\s*(\d+(?:\.\d+)?)\b/i
    );

  return match
    ? match[
        1
      ]
    : null;
}

function extractRebirthNumberFromQuestion(
  question
) {
  const match =
    clean(
      question,
      700
    ).match(
      /\brebirth\s*#?\s*(\d{1,3})\b/i
    );

  return match
    ? Number(
        match[
          1
        ]
      )
    : null;
}

function candidateEntities(
  question
) {
  const raw =
    clean(
      question,
      700
    );

  const quoted = [
    ...raw.matchAll(
      /["“”']([^"“”']{2,80})["“”']/g
    ),
  ].map(
    (
      m
    ) =>
      clean(
        m[
          1
        ],
        100
      )
  );

  const aliases =
    aliasesFor(
      raw
    );

  const words =
    raw.match(
      /[A-Za-z0-9][A-Za-z0-9'._-]*/g
    ) ||
    [];

  const filtered =
    words.filter(
      (
        w
      ) =>
        !STOPWORDS.has(
          w.toLowerCase()
        ) &&
        !/^\d+(?:\.\d+)?$/.test(
          w
        )
    );

  const spans =
    [];

  for (
    let size =
      Math.min(
        5,
        filtered.length
      );
    size >=
      1;
    size--
  ) {
    for (
      let i =
        0;
      i +
        size <=
      filtered.length;
      i++
    ) {
      const span =
        filtered
          .slice(
            i,
            i +
              size
          )
          .join(
            " "
          );

      if (
        span.length >=
        3
      ) {
        spans.push(
          span
        );
      }
    }
  }

  return [
    ...new Set([
      ...quoted,
      ...aliases,
      ...spans,
    ]),
  ].slice(
    0,
    10
  );
}

function extractTableRowsFromHtml(
  html
) {
  const rows =
    [];

  const rowMatches =
    String(
      html ??
        ""
    ).match(
      /<tr\b[^>]*>[\s\S]*?<\/tr>/gi
    ) ||
    [];

  for (
    const rowHtml
    of rowMatches
  ) {
    const cellMatches =
      rowHtml.match(
        /<t[dh]\b[^>]*>[\s\S]*?<\/t[dh]>/gi
      ) ||
      [];

    const cells =
      cellMatches
        .map(
          (
            cell
          ) =>
            htmlToText(
              cell
            )
        )
        .filter(
          Boolean
        );

    if (
      cells.length
    ) {
      rows.push(
        cells
      );
    }
  }

  return rows;
}

function parseInfobox(
  page
) {
  const html =
    String(
      page?.html ||
        ""
    );

  const result =
    {};

  const infobox =
    html.match(
      /<(?:aside|table)\b[^>]*(?:portable-infobox|infobox)[^>]*>[\s\S]*?<\/(?:aside|table)>/i
    )?.[
      0
    ] ||
    "";

  const source =
    infobox ||
    html;

  const dataRows = [
    ...source.matchAll(
      /<(?:div|tr)\b[^>]*>([\s\S]*?)<\/(?:div|tr)>/gi
    ),
  ].slice(
    0,
    400
  );

  for (
    const match
    of dataRows
  ) {
    const rowHtml =
      match[
        1
      ];

    const labelMatch =
      rowHtml.match(
        /(?:data-source=["']([^"']+)["']|class=["'][^"']*(?:pi-data-label|infobox-label)[^"']*["'][^>]*>([\s\S]*?)<\/)/i
      );

    const valueMatch =
      rowHtml.match(
        /class=["'][^"']*(?:pi-data-value|infobox-data)[^"']*["'][^>]*>([\s\S]*?)<\//i
      );

    if (
      !labelMatch ||
      !valueMatch
    ) {
      continue;
    }

    const label =
      clean(
        htmlToText(
          labelMatch[
            1
          ] ||
          labelMatch[
            2
          ]
        ),
        100
      ).toLowerCase();

    const value =
      clean(
        htmlToText(
          valueMatch[
            1
          ]
        ),
        500
      );

    if (
      label &&
      value
    ) {
      result[
        label
      ] =
        value;
    }
  }

  if (
    !Object.keys(
      result
    ).length &&
    page?.wikitext
  ) {
    const template =
      String(
        page.wikitext
      ).match(
        /\{\{[\s\S]{0,12000}?\n\}\}/
      )?.[
        0
      ] ||
      "";

    for (
      const line
      of template.split(
        /\n/
      )
    ) {
      const m =
        line.match(
          /^\s*\|\s*([^=|]+?)\s*=\s*(.*?)\s*$/
        );

      if (
        !m
      ) {
        continue;
      }

      const key =
        clean(
          m[
            1
          ],
          100
        ).toLowerCase();

      const value =
        clean(
          m[
            2
          ].replace(
            /\[\[|\]\]/g,
            ""
          ),
          500
        );

      if (
        key &&
        value
      ) {
        result[
          key
        ] =
          value;
      }
    }
  }

  return result;
}

function getInfoboxValue(
  info,
  keys
) {
  for (
    const key
    of keys
  ) {
    const exact =
      Object.entries(
        info
      ).find(
        ([
          k,
        ]) =>
          k ===
          key.toLowerCase()
      );

    if (
      exact?.[
        1
      ]
    ) {
      return exact[
        1
      ];
    }
  }

  for (
    const key
    of keys
  ) {
    const partial =
      Object.entries(
        info
      ).find(
        ([
          k,
        ]) =>
          k.includes(
            key.toLowerCase()
          )
      );

    if (
      partial?.[
        1
      ]
    ) {
      return partial[
        1
      ];
    }
  }

  return null;
}

function extractRebirthRows(
  page
) {
  const out =
    [];

  for (
    const cells
    of extractTableRowsFromHtml(
      page?.html ||
        ""
    )
  ) {
    const text =
      clean(
        cells.join(
          " | "
        ),
        3000
      );

    const match =
      text.match(
        /\brebirth\s*#?\s*(\d{1,3})\b/i
      ) ||
      clean(
        cells[
          0
        ],
        120
      ).match(
        /^#?\s*(\d{1,3})$/
      );

    if (
      !match
    ) {
      continue;
    }

    const number =
      Number(
        match[
          1
        ]
      );

    if (
      !(
        number >=
          1 &&
        number <=
          999
      )
    ) {
      continue;
    }

    out.push({
      number,

      rebirth:
        `Rebirth${number}`,

      cells,

      text,
    });
  }

  if (
    !out.length
  ) {
    const text =
      page?.text ||
      "";

    for (
      const match
      of text.matchAll(
        /\brebirth\s*#?\s*(\d{1,3})\b/gi
      )
    ) {
      const number =
        Number(
          match[
            1
          ]
        );

      if (
        !(
          number >=
            1 &&
          number <=
            999
        )
      ) {
        continue;
      }

      out.push({
        number,

        rebirth:
          `Rebirth${number}`,

        cells:
          [],

        text:
          clean(
            text.slice(
              Math.max(
                0,
                match.index -
                  180
              ),

              match.index +
                480
            ),
            800
          ),

        fallback:
          true,
      });
    }
  }

  const best =
    new Map();

  for (
    const row
    of out
  ) {
    const old =
      best.get(
        row.number
      );

    if (
      !old ||
      (
        old.fallback &&
        !row.fallback
      )
    ) {
      best.set(
        row.number,
        row
      );
    }
  }

  return [
    ...best.values(),
  ].sort(
    (
      a,
      b
    ) =>
      a.number -
      b.number
  );
}

function findRowContaining(
  page,
  phrases
) {
  const lows =
    phrases.map(
      (
        p
      ) =>
        p.toLowerCase()
    );

  for (
    const cells
    of extractTableRowsFromHtml(
      page?.html ||
        ""
    )
  ) {
    const text =
      clean(
        cells.join(
          " | "
        ),
        3000
      );

    const low =
      text.toLowerCase();

    if (
      lows.some(
        (
          p
        ) =>
          low.includes(
            p
          )
      )
    ) {
      return {
        cells,
        text,
      };
    }
  }

  return null;
}

function findRebirthForEntity(
  page,
  entityPhrases
) {
  const phrases =
    entityPhrases.map(
      (
        p
      ) =>
        p.toLowerCase()
    );

  const rows =
    extractRebirthRows(
      page
    );

  for (
    const row
    of rows
  ) {
    const low =
      row.text
        .toLowerCase();

    if (
      phrases.some(
        (
          p
        ) =>
          low.includes(
            p
          )
      )
    ) {
      return row.rebirth;
    }
  }

  return null;
}

function findRewardForRebirth(
  page,
  number
) {
  const tableRows =
    extractTableRowsFromHtml(
      page?.html ||
        ""
    );

  if (
    tableRows.length >=
    2
  ) {
    const headers =
      tableRows[
        0
      ].map(
        (
          v
        ) =>
          clean(
            v,
            120
          ).toLowerCase()
      );

    const rebirthColumn =
      headers.findIndex(
        (
          h
        ) =>
          /rebirth|level|requirement/.test(
            h
          )
      );

    const preferredColumns =
      headers
        .map(
          (
            h,
            i
          ) => ({
            h,
            i,
          })
        )
        .filter(
          ({
            h,
          }) =>
            /gear|item|reward|unlock|ability|tool/.test(
              h
            )
        )
        .map(
          ({
            i,
          }) =>
            i
        );

    for (
      const cells
      of tableRows.slice(
        1
      )
    ) {
      const text =
        clean(
          cells.join(
            " | "
          ),
          3000
        );

      const explicit =
        text.match(
          /\brebirth\s*#?\s*(\d{1,3})\b/i
        );

      const firstNumber =
        clean(
          cells[
            rebirthColumn >=
            0
              ? rebirthColumn
              : 0
          ],
          120
        ).match(
          /(?:rebirth\s*)?#?\s*(\d{1,3})/i
        );

      const rowNumber =
        Number(
          explicit?.[
            1
          ] ||
          firstNumber?.[
            1
          ] ||
          0
        );

      if (
        rowNumber !==
        number
      ) {
        continue;
      }

      for (
        const idx
        of preferredColumns
      ) {
        const value =
          clean(
            cells[
              idx
            ],
            300
          );

        if (
          value &&
          /[A-Za-z]/.test(
            value
          ) &&
          !/^rebirth\b/i.test(
            value
          )
        ) {
          return value;
        }
      }

      const candidates =
        cells
          .map(
            (
              v,
              i
            ) => ({
              value:
                clean(
                  v,
                  300
                ),

              i,
            })
          )
          .filter(
            ({
              value,
              i,
            }) => {
              if (
                !value ||
                i ===
                  rebirthColumn
              ) {
                return false;
              }

              if (
                /^rebirth\b/i.test(
                  value
                )
              ) {
                return false;
              }

              if (
                /^\$?[\d.,]+[KMBT]?$/i.test(
                  value
                )
              ) {
                return false;
              }

              if (
                /^\d+(?:\.\d+)?x$/i.test(
                  value
                )
              ) {
                return false;
              }

              if (
                /^\d+(?:\.\d+)?%$/.test(
                  value
                )
              ) {
                return false;
              }

              return /[A-Za-z]/.test(
                value
              );
            }
          );

      if (
        candidates[
          0
        ]
      ) {
        return candidates[
          0
        ].value;
      }
    }
  }

  const rows =
    extractRebirthRows(
      page
    );

  const row =
    rows.find(
      (
        r
      ) =>
        r.number ===
        number
    );

  if (
    !row
  ) {
    return null;
  }

  if (
    row.cells.length >=
    2
  ) {
    const candidates =
      row.cells
        .slice(
          1
        )
        .map(
          (
            v
          ) =>
            clean(
              v,
              300
            )
        )
        .filter(
          (
            v
          ) =>
            v &&
            /[A-Za-z]/.test(
              v
            ) &&
            !/^rebirth\b/i.test(
              v
            )
        );

    return candidates[
      0
    ] ||
    null;
  }

  const text =
    row.text.replace(
      new RegExp(
        `rebirth\\s*#?\\s*${number}`,
        "i"
      ),
      " "
    );

  const named =
    text.match(
      /\b[A-Z][A-Za-z0-9' -]{2,80}\b/
    );

  return named
    ? clean(
        named[
          0
        ],
        160
      )
    : null;
}

function parseGenericTableRelations(
  page
) {
  const relations =
    [];

  const rows =
    extractTableRowsFromHtml(
      page?.html ||
        ""
    );

  if (
    rows.length <
    2
  ) {
    return relations;
  }

  let headers =
    rows[
      0
    ].map(
      (
        x
      ) =>
        clean(
          x,
          120
        ).toLowerCase()
    );

  const headerLike =
    headers.some(
      (
        h
      ) =>
        /name|cost|price|income|multiplier|rebirth|rarity|chance|rate|reward|require|spawn|trait|mutation|gear|item/.test(
          h
        )
    );

  const dataRows =
    headerLike
      ? rows.slice(
          1
        )
      : rows;

  if (
    !headerLike
  ) {
    headers =
      [];
  }

  for (
    const cells
    of dataRows
  ) {
    const values =
      cells.map(
        (
          v
        ) =>
          clean(
            v,
            500
          )
      );

    if (
      !values.filter(
        Boolean
      ).length
    ) {
      continue;
    }

    if (
      headers.length ===
      values.length
    ) {
      const obj =
        {};

      for (
        let i =
          0;
        i <
        headers.length;
        i++
      ) {
        obj[
          headers[
            i
          ]
        ] =
          values[
            i
          ];
      }

      relations.push({
        cells:
          values,

        obj,

        text:
          clean(
            values.join(
              " | "
            ),
            2500
          ),
      });
    } else {
      relations.push({
        cells:
          values,

        obj:
          {},

        text:
          clean(
            values.join(
              " | "
            ),
            2500
          ),
      });
    }
  }

  return relations;
}

function sectionText(
  page,
  headingNeedles
) {
  const html =
    String(
      page?.html ||
        ""
    );

  const needles =
    headingNeedles.map(
      (
        x
      ) =>
        x.toLowerCase()
    );

  const hRegex =
    /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;

  const headings =
    [];

  let m;

  while (
    (
      m =
        hRegex.exec(
          html
        )
    ) !==
    null
  ) {
    headings.push({
      index:
        m.index,

      end:
        hRegex.lastIndex,

      level:
        Number(
          m[
            1
          ]
        ),

      title:
        htmlToText(
          m[
            2
          ]
        ),
    });
  }

  for (
    let i =
      0;
    i <
    headings.length;
    i++
  ) {
    const h =
      headings[
        i
      ];

    if (
      !needles.some(
        (
          n
        ) =>
          h.title
            .toLowerCase()
            .includes(
              n
            )
      )
    ) {
      continue;
    }

    let end =
      html.length;

    for (
      let j =
        i +
        1;
      j <
      headings.length;
      j++
    ) {
      if (
        headings[
          j
        ].level <=
        h.level
      ) {
        end =
          headings[
            j
          ].index;

        break;
      }
    }

    return htmlToText(
      html.slice(
        h.end,
        end
      )
    );
  }

  return "";
}

function formatValue(
  value,
  answerType
) {
  const text =
    clean(
      value,
      400
    );

  if (
    !text
  ) {
    return null;
  }

  if (
    answerType ===
    ANSWER_TYPE.REBIRTH
  ) {
    const m =
      text.match(
        /\brebirth\s*#?\s*(\d{1,3})\b/i
      ) ||
      text.match(
        /^\s*(\d{1,3})\s*$/
      );

    return m
      ? `Rebirth${Number(
          m[
            1
          ]
        )}`
      : null;
  }

  if (
    answerType ===
    ANSWER_TYPE.MULTIPLIER
  ) {
    const m =
      text.match(
        /\b\d+(?:\.\d+)?\s*x\b/i
      );

    return m
      ? m[
          0
        ].replace(
          /\s+/g,
          ""
        )
      : text;
  }

  if (
    answerType ===
    ANSWER_TYPE.DROP_RATE
  ) {
    const m =
      text.match(
        /\b\d+(?:\.\d+)?\s*%\b/
      );

    return m
      ? m[
          0
        ].replace(
          /\s+/g,
          ""
        )
      : text;
  }

  return text;
}

function entityFromQuestion(
  question
) {
  const aliases =
    aliasesFor(
      question
    );

  if (
    aliases.includes(
      "flash teleport"
    )
  ) {
    return "Flash Teleport";
  }

  const candidates =
    candidateEntities(
      question
    );

  return candidates[
    0
  ] ||
  null;
}

function knownPageTitles(
  intent
) {
  switch (
    intent
  ) {
    case INTENT.CURRENT_REBIRTH:
    case INTENT.REBIRTH_UNLOCK:
    case INTENT.REBIRTH_REWARD:
    case INTENT.GEAR_UNLOCK:
      return [
        "Rebirth",
        "Gears",
      ];

    case INTENT.GEAR_INFO:
    case INTENT.GEAR_COST:
      return [
        "Gears",
        "Rebirth",
      ];

    case INTENT.SLAP_INFO:
    case INTENT.SLAP_REBIRTH:
    case INTENT.SLAP_COST:
      return [
        "Slap",
        "Rebirth",
      ];

    case INTENT.MUTATION_INFO:
    case INTENT.MUTATION_MULTIPLIER:
    case INTENT.MUTATION_OBTAIN:
      return [
        "Mutations",
      ];

    case INTENT.TRAIT_INFO:
    case INTENT.TRAIT_MULTIPLIER:
    case INTENT.TRAIT_EVENT:
      return [
        "Traits",
        "Events",
      ];

    case INTENT.EVENT_INFO:
    case INTENT.EVENT_DATE:
    case INTENT.EVENT_REWARD:
    case INTENT.ADMIN_ABUSE:
      return [
        "Events",
        "Admin Abuse",
        "Update Log",
      ];

    case INTENT.UPDATE_INFO:
    case INTENT.UPDATE_DATE:
    case INTENT.UPDATE_ADDED:
    case INTENT.UPDATE_REMOVED:
      return [
        "Update Log",
      ];

    case INTENT.MACHINE_INFO:
    case INTENT.MACHINE_CONTENTS:
    case INTENT.MACHINE_REPLACED_BY:
      return [
        "Machines",
        "Update Log",
      ];

    case INTENT.LUCKY_BLOCK_INFO:
    case INTENT.LUCKY_BLOCK_CONTENTS:
    case INTENT.LUCKY_BLOCK_DROP_RATE:
      return [
        "Lucky Blocks",
      ];

    case INTENT.RITUAL_INFO:
    case INTENT.RITUAL_REQUIREMENT:
    case INTENT.RITUAL_SPAWN:
    case INTENT.RITUAL_FORMATION:
      return [
        "Rituals",
      ];

    case INTENT.RARITY_INFO:
    case INTENT.BRAINROT_RARITY:
      return [
        "Rarities",
        "Category:Brainrots",
      ];

    case INTENT.BASE_INFO:
    case INTENT.BASE_SLOTS:
    case INTENT.BASE_FLOORS:
      return [
        "Base",
      ];

    default:
      return [];
  }
}

function wikiQueryForQuestion(
  question,
  intent
) {
  const entity =
    entityFromQuestion(
      question
    );

  const update =
    extractUpdateNumber(
      question
    );

  if (
    update
  ) {
    return (
      `Update ${update}`
    );
  }

  if (
    entity
  ) {
    return entity;
  }

  switch (
    intent
  ) {
    case INTENT.CURRENT_REBIRTH:
      return "Rebirth current";

    case INTENT.MUTATION_INFO:
    case INTENT.MUTATION_MULTIPLIER:
    case INTENT.MUTATION_OBTAIN:
      return "Mutations";

    case INTENT.TRAIT_INFO:
    case INTENT.TRAIT_MULTIPLIER:
    case INTENT.TRAIT_EVENT:
      return "Traits";

    case INTENT.RITUAL_INFO:
    case INTENT.RITUAL_REQUIREMENT:
    case INTENT.RITUAL_SPAWN:
    case INTENT.RITUAL_FORMATION:
      return "Rituals";

    case INTENT.LUCKY_BLOCK_INFO:
    case INTENT.LUCKY_BLOCK_CONTENTS:
    case INTENT.LUCKY_BLOCK_DROP_RATE:
      return "Lucky Blocks";

    case INTENT.MACHINE_INFO:
    case INTENT.MACHINE_CONTENTS:
    case INTENT.MACHINE_REPLACED_BY:
      return "Machines";

    default:
      return clean(
        question,
        450
      );
  }
}

async function canonicalPagesForQuestion(
  question,
  deadline
) {
  const intent =
    inferIntent(
      question
    );

  const titles = [
    ...knownPageTitles(
      intent
    ),
  ];

  const entity =
    entityFromQuestion(
      question
    );

  const updateNumber =
    extractUpdateNumber(
      question
    );

  if (
    updateNumber
  ) {
    const major =
      updateNumber.split(
        "."
      )[
        0
      ];

    titles.unshift(
      `Update Log/Update ${major}`,
      `Update ${updateNumber}`
    );
  }

  if (
    entity &&
    entity.length >=
      3
  ) {
    titles.unshift(
      entity
    );
  }

  const searched =
    await wikiSearchTitles(
      wikiQueryForQuestion(
        question,
        intent
      ),

      deadline,

      8
    );

  for (
    const title
    of searched
  ) {
    if (
      !titles.some(
        (
          x
        ) =>
          x.toLowerCase() ===
          title.toLowerCase()
      )
    ) {
      titles.push(
        title
      );
    }
  }

  const unique = [
    ...new Set(
      titles
        .map(
          (
            x
          ) =>
            clean(
              x,
              300
            )
        )
        .filter(
          Boolean
        )
    ),
  ].slice(
    0,
    CFG.MAX_CANONICAL_PAGES
  );

  const settled =
    await Promise.allSettled(
      unique.map(
        (
          title
        ) =>
          fetchCanonicalPage(
            title,
            deadline
          )
      )
    );

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

  return {
    intent,
    pages,
    errors,
    titles:
      unique,
  };
}

function directCurrentRebirth(
  pages
) {
  const claims =
    [];

  for (
    const page
    of pages
  ) {
    if (
      clean(
        page.title,
        300
      ).toLowerCase() ===
      "rebirth"
    ) {
      const rows =
        extractRebirthRows(
          page
        );

      if (
        rows.length >=
        2
      ) {
        const max =
          Math.max(
            ...rows.map(
              (
                r
              ) =>
                r.number
            )
          );

        claims.push({
          answer:
            `Rebirth${max}`,

          route:
            "CANONICAL_REBIRTH_TABLE",

          page,
        });
      }
    }

    const explicit =
      page.text.match(
        /\b(?:there\s+(?:are|is)\s+currently|currently\s+(?:has|have|there are)|latest\s+rebirth\s+(?:is|:)?|current\s+rebirth\s+(?:is|:)?)\s*(?:rebirth\s*)?#?\s*(\d{1,3})\b/i
      );

    if (
      explicit
    ) {
      claims.push({
        answer:
          `Rebirth${Number(
            explicit[
              1
            ]
          )}`,

        route:
          "CANONICAL_CURRENT_TEXT",

        page,
      });
    }
  }

  if (
    !claims.length
  ) {
    return null;
  }

  const groups =
    new Map();

  for (
    const claim
    of claims
  ) {
    const key =
      norm(
        claim.answer
      );

    if (
      !groups.has(
        key
      )
    ) {
      groups.set(
        key,
        []
      );
    }

    groups
      .get(
        key
      )
      .push(
        claim
      );
  }

  const list = [
    ...groups.entries(),
  ]
    .map(
      ([
        key,
        rows,
      ]) => ({
        key,

        answer:
          rows[
            0
          ].answer,

        rows,
      })
    )
    .sort(
      (
        a,
        b
      ) =>
        b.rows.length -
        a.rows.length
    );

  if (
    list.length >
      1 &&
    list[
      1
    ].rows.length >=
      list[
        0
      ].rows.length
  ) {
    return {
      answer:
        "UNKNOWN",

      candidateAnswer:
        list[
          0
        ].answer,

      confidence:
        0.49,

      reason:
        "canonical_current_conflict",

      route:
        "CANONICAL_CURRENT_CONFLICT",

      sourceCount:
        list[
          0
        ].rows.length,

      sources:
        list[
          0
        ].rows.map(
          (
            r
          ) => ({
            host:
              "stealabrainrot.fandom.com",

            title:
              r.page.title,

            url:
              r.page.url,

            claimType:
              r.route,
          })
        ),
    };
  }

  return {
    answer:
      list[
        0
      ].answer,

    candidateAnswer:
      list[
        0
      ].answer,

    confidence:
      list[
        0
      ].rows.length >=
        2
        ? 0.995
        : 0.985,

    reason:
      list[
        0
      ].rows.length >=
        2
        ? "accepted_full_current_agreement"
        : "accepted_full_rebirth_table",

    route:
      list[
        0
      ].rows.length >=
        2
        ? "CANONICAL_CURRENT_AGREEMENT"
        : "CANONICAL_FULL_TABLE",

    sourceCount:
      list[
        0
      ].rows.length,

    sources:
      list[
        0
      ].rows.map(
        (
          r
        ) => ({
          host:
            "stealabrainrot.fandom.com",

          title:
            r.page.title,

          url:
            r.page.url,

          claimType:
            r.route,
        })
      ),
  };
}

function directRebirthLookup(
  question,
  pages
) {
  const answerType =
    inferAnswerType(
      question
    );

  const entityAliases =
    aliasesFor(
      question
    );

  const candidates =
    candidateEntities(
      question
    );

  const entityPhrases = [
    ...new Set([
      ...entityAliases,
      ...candidates,
    ]),
  ].filter(
    (
      x
    ) =>
      x.length >=
      3
  );

  const number =
    extractRebirthNumberFromQuestion(
      question
    );

  for (
    const page
    of pages
  ) {
    if (
      answerType ===
      ANSWER_TYPE.REBIRTH
    ) {
      const found =
        findRebirthForEntity(
          page,
          entityPhrases
        );

      if (
        found
      ) {
        return {
          answer:
            found,

          candidateAnswer:
            found,

          confidence:
            0.99,

          reason:
            "accepted_full_table_relation",

          route:
            "CANONICAL_RELATION",

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
                "TABLE_RELATION",
            },
          ],
        };
      }
    }

    if (
      answerType ===
        ANSWER_TYPE.GEAR &&
      number
    ) {
      const reward =
        findRewardForRebirth(
          page,
          number
        );

      if (
        reward
      ) {
        const cleanReward =
          reward
            .replace(
              /\$[\d.,]+[KMBT]?/gi,
              " "
            )
            .replace(
              /\b\d+(?:\.\d+)?x\b/gi,
              " "
            )
            .replace(
              /\b(?:cash|cost|requirement|rebirth|rewards?)\b/gi,
              " "
            );

        const segments =
          cleanReward
            .split(
              /[|,;/]/
            )
            .map(
              (
                x
              ) =>
                clean(
                  x,
                  160
                )
            )
            .filter(
              (
                x
              ) =>
                x &&
                !/^\d+$/.test(
                  x
                )
            );

        const answer =
          segments.find(
            (
              x
            ) =>
              /[A-Za-z]/.test(
                x
              )
          ) ||
          clean(
            reward,
            160
          );

        if (
          answer
        ) {
          return {
            answer,

            candidateAnswer:
              answer,

            confidence:
              0.98,

            reason:
              "accepted_reverse_rebirth_relation",

            route:
              "CANONICAL_REVERSE_RELATION",

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
                  "REVERSE_TABLE_RELATION",
              },
            ],
          };
        }
      }
    }
  }

  return null;
}

function answerFromEntityInfobox(
  question,
  page
) {
  const intent =
    inferIntent(
      question
    );

  const answerType =
    inferAnswerType(
      question
    );

  const info =
    parseInfobox(
      page
    );

  const q =
    question.toLowerCase();

  const map = [
    {
      intents: [
        INTENT.BRAINROT_RARITY,
        INTENT.RARITY_INFO,
      ],

      keys: [
        "rarity",
        "tier",
      ],

      type:
        ANSWER_TYPE.RARITY,
    },

    {
      intents: [
        INTENT.BRAINROT_COST,
        INTENT.GEAR_COST,
        INTENT.SLAP_COST,
      ],

      keys: [
        "cost",
        "price",
        "buy price",
      ],

      type:
        ANSWER_TYPE.COST,
    },

    {
      intents: [
        INTENT.BRAINROT_INCOME,
      ],

      keys: [
        "income",
        "income/s",
        "money per second",
        "earnings",
      ],

      type:
        ANSWER_TYPE.INCOME,
    },

    {
      intents: [
        INTENT.MUTATION_MULTIPLIER,
        INTENT.TRAIT_MULTIPLIER,
      ],

      keys: [
        "multiplier",
        "boost",
        "income multiplier",
      ],

      type:
        ANSWER_TYPE.MULTIPLIER,
    },

    {
      intents: [
        INTENT.BRAINROT_OBTAIN,
        INTENT.MUTATION_OBTAIN,
      ],

      keys: [
        "obtainment",
        "obtain",
        "obtaining",
        "how to obtain",
        "method",
      ],

      type:
        ANSWER_TYPE.METHOD,
    },

    {
      intents: [
        INTENT.EVENT_DATE,
        INTENT.UPDATE_DATE,
      ],

      keys: [
        "date",
        "release date",
        "released",
        "start date",
      ],

      type:
        ANSWER_TYPE.DATE,
    },
  ];

  for (
    const row
    of map
  ) {
    if (
      !row.intents.includes(
        intent
      )
    ) {
      continue;
    }

    const value =
      getInfoboxValue(
        info,
        row.keys
      );

    if (
      value
    ) {
      const answer =
        formatValue(
          value,
          row.type ||
            answerType
        ) ||
        value;

      return {
        answer,

        candidateAnswer:
          answer,

        confidence:
          0.97,

        reason:
          "accepted_infobox_field",

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
              `INFOBOX_${row.keys[0]}`,
          },
        ],
      };
    }
  }

  if (
    intent ===
    INTENT.BRAINROT_STATUS
  ) {
    const text =
      page.text.toLowerCase();

    const status =
      text.includes(
        "limited"
      )
        ? "Limited"
        : text.includes(
            "obtainable"
          )
          ? "Obtainable"
          : text.includes(
              "removed"
            )
            ? "Removed"
            : null;

    if (
      status
    ) {
      return {
        answer:
          status,

        candidateAnswer:
          status,

        confidence:
          0.94,

        reason:
          "accepted_full_page_status",

        route:
          "CANONICAL_STATUS",

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
              "STATUS",
          },
        ],
      };
    }
  }

  if (
    [
      INTENT.BRAINROT_INFO,
      INTENT.GEAR_INFO,
      INTENT.MUTATION_INFO,
      INTENT.TRAIT_INFO,
      INTENT.MACHINE_INFO,
      INTENT.LUCKY_BLOCK_INFO,
      INTENT.RITUAL_INFO,
      INTENT.BASE_INFO,
      INTENT.SLAP_INFO,
    ].includes(
      intent
    )
  ) {
    const description =
      getInfoboxValue(
        info,
        [
          "description",
          "info",
          "information",
        ]
      );

    if (
      description
    ) {
      return {
        answer:
          clean(
            description,
            220
          ),

        candidateAnswer:
          clean(
            description,
            220
          ),

        confidence:
          0.9,

        reason:
          "accepted_infobox_description",

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
              "INFOBOX_DESCRIPTION",
          },
        ],
      };
    }
  }

  if (
    /what\s+rarity/i.test(
      q
    )
  ) {
    const value =
      getInfoboxValue(
        info,
        [
          "rarity",
        ]
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
          0.97,

        reason:
          "accepted_infobox_rarity",

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
              "INFOBOX_RARITY",
          },
        ],
      };
    }
  }

  return null;
}

function directTableLookup(
  question,
  page
) {
  const intent =
    inferIntent(
      question
    );

  const answerType =
    inferAnswerType(
      question
    );

  const entityCandidates =
    candidateEntities(
      question
    ).map(
      (
        x
      ) =>
        x.toLowerCase()
    );

  const relations =
    parseGenericTableRelations(
      page
    );

  for (
    const row
    of relations
  ) {
    const low =
      row.text.toLowerCase();

    const entityMatch =
      entityCandidates.length ===
        0 ||
      entityCandidates.some(
        (
          e
        ) =>
          low.includes(
            e
          )
      );

    if (
      !entityMatch
    ) {
      continue;
    }

    const entries =
      Object.entries(
        row.obj
      );

    const field =
      (
        patterns
      ) => {
        for (
          const [
            k,
            v,
          ] of entries
        ) {
          if (
            patterns.some(
              (
                p
              ) =>
                k.includes(
                  p
                )
            )
          ) {
            return v;
          }
        }

        return null;
      };

    let value =
      null;

    if (
      intent ===
        INTENT.SLAP_COST ||
      intent ===
        INTENT.GEAR_COST ||
      intent ===
        INTENT.BRAINROT_COST
    ) {
      value =
        field([
          "cost",
          "price",
        ]);
    } else if (
      intent ===
        INTENT.SLAP_REBIRTH ||
      intent ===
        INTENT.GEAR_UNLOCK
    ) {
      value =
        field([
          "rebirth",
          "requirement",
        ]);
    } else if (
      intent ===
        INTENT.MUTATION_MULTIPLIER ||
      intent ===
        INTENT.TRAIT_MULTIPLIER
    ) {
      value =
        field([
          "multiplier",
          "boost",
        ]);
    } else if (
      intent ===
      INTENT.LUCKY_BLOCK_DROP_RATE
    ) {
      value =
        field([
          "chance",
          "rate",
          "probability",
        ]);
    } else if (
      intent ===
      INTENT.RITUAL_REQUIREMENT
    ) {
      value =
        field([
          "require",
          "needed",
          "requirement",
        ]);
    } else if (
      intent ===
      INTENT.RITUAL_SPAWN
    ) {
      value =
        field([
          "spawn",
          "reward",
          "result",
        ]);
    } else if (
      intent ===
        INTENT.MACHINE_CONTENTS ||
      intent ===
        INTENT.LUCKY_BLOCK_CONTENTS
    ) {
      value =
        field([
          "reward",
          "contents",
          "item",
          "brainrot",
        ]);
    } else if (
      intent ===
      INTENT.BASE_SLOTS
    ) {
      value =
        field([
          "slot",
          "slots",
        ]);
    } else if (
      intent ===
      INTENT.BASE_FLOORS
    ) {
      value =
        field([
          "floor",
          "floors",
        ]);
    }

    if (
      !value &&
      answerType ===
        ANSWER_TYPE.REBIRTH
    ) {
      const rebirth =
        row.text.match(
          /\brebirth\s*#?\s*(\d{1,3})\b/i
        );

      if (
        rebirth
      ) {
        value =
          `Rebirth${Number(
            rebirth[
              1
            ]
          )}`;
      }
    }

    if (
      !value &&
      answerType ===
        ANSWER_TYPE.MULTIPLIER
    ) {
      value =
        row.text.match(
          /\b\d+(?:\.\d+)?\s*x\b/i
        )?.[
          0
        ] ||
        null;
    }

    if (
      !value &&
      answerType ===
        ANSWER_TYPE.DROP_RATE
    ) {
      value =
        row.text.match(
          /\b\d+(?:\.\d+)?\s*%\b/
        )?.[
          0
        ] ||
        null;
    }

    if (
      value
    ) {
      const answer =
        formatValue(
          value,
          answerType
        ) ||
        clean(
          value,
          300
        );

      if (
        !answer
      ) {
        continue;
      }

      return {
        answer,

        candidateAnswer:
          answer,

        confidence:
          0.96,

        reason:
          "accepted_generic_table_relation",

        route:
          "CANONICAL_TABLE",

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
              "GENERIC_TABLE_RELATION",
          },
        ],
      };
    }
  }

  return null;
}

function updateSectionLookup(
  question,
  page
) {
  const update =
    extractUpdateNumber(
      question
    );

  if (
    !update
  ) {
    return null;
  }

  const answerType =
    inferAnswerType(
      question
    );

  const intent =
    inferIntent(
      question
    );

  const section =
    sectionText(
      page,
      [
        `Update ${update}`,
        update,
      ]
    );

  const text =
    section ||
    page.text;

  if (
    !text
  ) {
    return null;
  }

  if (
    intent ===
    INTENT.UPDATE_DATE
  ) {
    const date =
      text.match(
        /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}\b/i
      )?.[
        0
      ];

    if (
      date
    ) {
      return directValueResult(
        date,
        page,
        "UPDATE_DATE"
      );
    }
  }

  if (
    intent ===
    INTENT.UPDATE_ADDED
  ) {
    if (
      answerType ===
      ANSWER_TYPE.BRAINROT
    ) {
      const candidates = [
        ...text.matchAll(
          /(?:added|introduced|new(?: limited)? brainrot(?:s)?[:\s-]+)([A-Z][A-Za-z0-9' .-]{2,60})/gi
        ),
      ].map(
        (
          m
        ) =>
          clean(
            m[
              1
            ],
            100
          )
      );

      if (
        candidates[
          0
        ]
      ) {
        return directValueResult(
          candidates[
            0
          ],
          page,
          "UPDATE_ADDED_BRAINROT"
        );
      }
    }

    const bullets =
      text
        .split(
          /\n|•|\*/
        )
        .map(
          (
            x
          ) =>
            clean(
              x,
              180
            )
        )
        .filter(
          (
            x
          ) =>
            /added|introduced|new/i.test(
              x
            )
        );

    if (
      bullets[
        0
      ]
    ) {
      return directValueResult(
        bullets[
          0
        ],
        page,
        "UPDATE_ADDED"
      );
    }
  }

  if (
    intent ===
    INTENT.UPDATE_REMOVED
  ) {
    const bullets =
      text
        .split(
          /\n|•|\*/
        )
        .map(
          (
            x
          ) =>
            clean(
              x,
              180
            )
        )
        .filter(
          (
            x
          ) =>
            /removed|deleted/i.test(
              x
            )
        );

    if (
      bullets[
        0
      ]
    ) {
      return directValueResult(
        bullets[
          0
        ],
        page,
        "UPDATE_REMOVED"
      );
    }
  }

  if (
    answerType ===
      ANSWER_TYPE.BRAINROT &&
    /caylusaurus/i.test(
      text
    )
  ) {
    return directValueResult(
      "Caylusaurus",
      page,
      "UPDATE_BRAINROT"
    );
  }

  return null;
}

function directValueResult(
  value,
  page,
  claimType,
  confidence = 0.97
) {
  const answer =
    clean(
      value,
      300
    );

  if (
    !answer
  ) {
    return null;
  }

  return {
    answer,

    candidateAnswer:
      answer,

    confidence,

    reason:
      "accepted_full_canonical_value",

    route:
      "CANONICAL_FULL_PAGE",

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

function canonicalDirectResolve(
  question,
  canonical
) {
  const intent =
    canonical.intent;

  const pages =
    canonical.pages;

  if (
    intent ===
    INTENT.CURRENT_REBIRTH
  ) {
    const result =
      directCurrentRebirth(
        pages
      );

    if (
      result
    ) {
      return result;
    }
  }

  if (
    [
      INTENT.REBIRTH_UNLOCK,
      INTENT.REBIRTH_REWARD,
      INTENT.GEAR_UNLOCK,
    ].includes(
      intent
    )
  ) {
    const result =
      directRebirthLookup(
        question,
        pages
      );

    if (
      result
    ) {
      return result;
    }
  }

  for (
    const page
    of pages
  ) {
    const update =
      updateSectionLookup(
        question,
        page
      );

    if (
      update
    ) {
      return update;
    }

    const infobox =
      answerFromEntityInfobox(
        question,
        page
      );

    if (
      infobox
    ) {
      return infobox;
    }

    const table =
      directTableLookup(
        question,
        page
      );

    if (
      table
    ) {
      return table;
    }
  }

  return null;
}

function tavilyQueries(
  question
) {
  const intent =
    inferIntent(
      question
    );

  const entity =
    entityFromQuestion(
      question
    );

  const update =
    extractUpdateNumber(
      question
    );

  const q =
    clean(
      question,
      650
    );

  const queries =
    [];

  if (
    update
  ) {
    queries.push(
      `site:stealabrainrot.fandom.com/wiki/Update_Log "Update ${update}"`
    );
  }

  if (
    entity
  ) {
    queries.push(
      `site:stealabrainrot.fandom.com/wiki "${entity}"`
    );
  }

  const hubs =
    knownPageTitles(
      intent
    );

  for (
    const hub
    of hubs.slice(
      0,
      2
    )
  ) {
    queries.push(
      `site:stealabrainrot.fandom.com/wiki/${hub.replace(
        / /g,
        "_"
      )} ${q}`
    );
  }

  queries.push(
    `site:stealabrainrot.fandom.com/wiki ${q}`
  );

  queries.push(
    `"Steal a Brainrot" ${q}`
  );

  return [
    ...new Set(
      queries
        .map(
          (
            x
          ) =>
            clean(
              x,
              520
            )
        )
        .filter(
          Boolean
        )
    ),
  ].slice(
    0,
    4
  );
}

async function tavilyLane(
  question,
  query,
  deadline,
  includeDomains = null,
  fullIndex = false
) {
  const timeout =
    Math.max(
      650,

      Math.min(
        CFG.TAVILY_TIMEOUT_MS,

        timeLeft(
          deadline
        ) -
          80
      )
    );

  if (
    timeout <
    650
  ) {
    throw new Error(
      "TAVILY_BUDGET_EXHAUSTED"
    );
  }

  const body = {
    query,

    search_depth:
      CFG.SEARCH_DEPTH,

    max_results:
      CFG.SEARCH_MAX_RESULTS,

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
    isCurrent(
      question
    ) &&
    !explicitDate(
      question
    ).has &&
    !fullIndex
  ) {
    body.time_range =
      "month";
  }

  if (
    includeDomains
      ?.length
  ) {
    body.include_domains =
      includeDomains;
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

      timeout
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
      )
        .map(
          (
            row
          ) => ({
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
                    row?.url
                  )
                    .hostname
                    .toLowerCase()
                    .replace(
                      /^www\./,
                      ""
                    );
                } catch {
                  return "";
                }
              })(),

            snippet:
              clean(
                row?.content ??
                  row?.raw_content,
                2800
              ),

            publishedDate:
              clean(
                row?.published_date ??
                  row?.publishedDate,
                120
              ),

            score:
              clamp(
                row?.score,
                0,
                1
              ),

            queryUsed:
              query,
          })
        )
        .filter(
          (
            row
          ) =>
            row.url.startsWith(
              "https://"
            )
        ),
  };
}

async function tavilyStage(
  question,
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
      question
    );

  while (
    queries.length <
    3
  ) {
    queries.push(
      queries[
        queries.length -
          1
      ] ||
      question
    );
  }

  const jobs = [
    tavilyLane(
      question,
      queries[
        0
      ],
      deadline,
      [
        "stealabrainrot.fandom.com",
      ],
      true
    ),

    tavilyLane(
      question,
      queries[
        1
      ],
      deadline,
      null,
      false
    ),

    tavilyLane(
      question,
      queries[
        2
      ],
      deadline,
      null,
      true
    ),
  ];

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
        row.value
          .answer
      ) {
        answers.push(
          row.value
            .answer
        );
      }

      sources.push(
        ...row.value
          .results
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
      byUrl.get(
        key
      );

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
        (
          a,
          b
        ) =>
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

function parseModelJson(
  text
) {
  const raw =
    String(
      text ??
        ""
    )
      .replace(
        /^```(?:json)?\s*/i,
        ""
      )
      .replace(
        /\s*```$/,
        ""
      )
      .trim();

  if (
    !raw
  ) {
    throw new Error(
      "NVIDIA_EMPTY_CONTENT"
    );
  }

  try {
    return JSON.parse(
      raw
    );
  } catch {}

  const first =
    raw.indexOf(
      "{"
    );

  const last =
    raw.lastIndexOf(
      "}"
    );

  if (
    first >=
      0 &&
    last >
      first
  ) {
    try {
      return JSON.parse(
        raw.slice(
          first,
          last +
            1
        )
      );
    } catch {}
  }

  throw new Error(
    "NVIDIA_INVALID_JSON"
  );
}

function evidenceFromCanonicalPages(
  pages
) {
  return pages.map(
    (
      page,
      index
    ) => ({
      id:
        `C${index + 1}`,

      kind:
        "CANONICAL_FULL_PAGE",

      host:
        "stealabrainrot.fandom.com",

      title:
        page.title,

      url:
        page.url,

      text:
        clean(
          page.text,
          14000
        ),
    })
  );
}

function evidenceFromWebSources(
  sources,
  offset = 0
) {
  return sources.map(
    (
      source,
      index
    ) => ({
      id:
        `W${offset + index + 1}`,

      kind:
        "WEB_SNIPPET",

      host:
        source.host,

      title:
        source.title,

      url:
        source.url,

      text:
        clean(
          source.snippet,
          2800
        ),
    })
  );
}

function answerTypeInstruction(
  type
) {
  switch (
    type
  ) {
    case ANSWER_TYPE.REBIRTH:
      return "Return only Rebirth<number>.";

    case ANSWER_TYPE.GEAR:
      return "Return only the gear/item name.";

    case ANSWER_TYPE.BRAINROT:
      return "Return only the Brainrot proper name.";

    case ANSWER_TYPE.MUTATION:
      return "Return only the mutation name.";

    case ANSWER_TYPE.TRAIT:
      return "Return only the trait name.";

    case ANSWER_TYPE.EVENT:
      return "Return only the event name.";

    case ANSWER_TYPE.MACHINE:
      return "Return only the machine name.";

    case ANSWER_TYPE.LUCKY_BLOCK:
      return "Return only the Lucky Block name.";

    case ANSWER_TYPE.RITUAL:
      return "Return only the ritual name.";

    case ANSWER_TYPE.RARITY:
      return "Return only the rarity name.";

    case ANSWER_TYPE.DATE:
      return "Return only the requested date/year.";

    case ANSWER_TYPE.COST:
      return "Return only the cost/price value.";

    case ANSWER_TYPE.INCOME:
      return "Return only the income value.";

    case ANSWER_TYPE.MULTIPLIER:
      return "Return only the multiplier such as 10x.";

    case ANSWER_TYPE.DROP_RATE:
      return "Return only the percentage/chance.";

    case ANSWER_TYPE.COUNT:
      return "Return only the count.";

    case ANSWER_TYPE.METHOD:
      return "Return only the shortest obtaining method.";

    default:
      return "Return only the shortest exact answer.";
  }
}

async function nvidiaFallback(
  question,
  canonicalPages,
  webSources,
  lore,
  deadline
) {
  if (
    !env(
      "NVIDIA_API_KEY"
    )
  ) {
    return {
      ok:
        false,

      error:
        "NVIDIA_NOT_CONFIGURED",

      answer:
        "UNKNOWN",

      confidence:
        0,

      citedIds:
        [],
    };
  }

  const timeout =
    Math.max(
      650,

      Math.min(
        CFG.NVIDIA_TIMEOUT_MS,

        timeLeft(
          deadline
        ) -
          100
      )
    );

  if (
    timeout <
    650
  ) {
    return {
      ok:
        false,

      error:
        "NVIDIA_SKIPPED_BUDGET",

      answer:
        "UNKNOWN",

      confidence:
        0,

      citedIds:
        [],
    };
  }

  const evidence = [
    ...evidenceFromCanonicalPages(
      canonicalPages
    ),

    ...evidenceFromWebSources(
      webSources,
      canonicalPages.length
    ),
  ].slice(
    0,
    CFG.MAX_AI_EVIDENCE
  );

  const intent =
    inferIntent(
      question
    );

  const answerType =
    inferAnswerType(
      question
    );

  const system = [
    "You are a strict Steal a Brainrot evidence resolver.",

    "Use ONLY supplied evidence. Never use outside knowledge.",

    "CANONICAL_FULL_PAGE evidence is stronger than WEB_SNIPPET evidence.",

    "Understand table relationships in both directions: entity->attribute and attribute->entity.",

    "Do not answer a gear question with a rebirth number, or a rebirth question with a gear name.",

    "For current/latest facts, a truncated snippet is not proof of a maximum/current value.",

    "For updates, use the exact update/section when available.",

    "If evidence does not directly support the answer, return UNKNOWN.",

    answerTypeInstruction(
      answerType
    ),

    'Return only JSON: {"answer":"value or UNKNOWN","confidence":0.0,"citedIds":["C1"],"reason":"short_reason"}',
  ].join(
    "\n"
  );

  try {
    const data =
      await fetchJson(
        "NVIDIA",

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
                clean(
                  process.env
                    .NVIDIA_MODEL ||
                    DEFAULT_MODEL,
                  220
                ),

              stream:
                false,

              max_tokens:
                320,

              temperature:
                1.0,

              top_p:
                0.95,

              chat_template_kwargs: {
                enable_thinking:
                  false,
              },

              messages: [
                {
                  role:
                    "system",

                  content:
                    system,
                },

                {
                  role:
                    "user",

                  content:
                    JSON.stringify({
                      question,

                      intent,

                      answerType,

                      aliases:
                        aliasesFor(
                          question
                        ),

                      lore:
                        clean(
                          lore,
                          10000
                        ),

                      evidence,
                    }),
                },
              ],
            }),
        },

        timeout
      );

    const raw =
      parseModelJson(
        data?.choices?.[
          0
        ]?.message
          ?.content
      );

    const answer =
      clean(
        raw?.answer ||
          "UNKNOWN",
        300
      );

    const citedIds =
      Array.isArray(
        raw?.citedIds
      )
        ? raw.citedIds
            .map(
              String
            )
            .slice(
              0,
              8
            )
        : [];

    if (
      !answer ||
      norm(
        answer
      ) ===
        "unknown"
    ) {
      return {
        ok:
          true,

        answer:
          "UNKNOWN",

        confidence:
          0,

        citedIds,

        reason:
          "ai_unknown",
      };
    }

    const cited =
      evidence.filter(
        (
          row
        ) =>
          citedIds.includes(
            row.id
          )
      );

    if (
      !cited.length
    ) {
      return {
        ok:
          true,

        answer:
          "UNKNOWN",

        candidateAnswer:
          answer,

        confidence:
          clamp(
            raw?.confidence
          ),

        citedIds,

        reason:
          "ai_no_citations",
      };
    }

    let supporting =
      cited.filter(
        (
          row
        ) =>
          norm(
            row.text
          ).includes(
            norm(
              answer
            )
          )
      );

    if (
      answerType ===
      ANSWER_TYPE.REBIRTH
    ) {
      const rb =
        answer.match(
          /\brebirth\s*#?\s*(\d{1,3})\b/i
        );

      if (
        !rb
      ) {
        return {
          ok:
            true,

          answer:
            "UNKNOWN",

          candidateAnswer:
            answer,

          confidence:
            clamp(
              raw?.confidence
            ),

          citedIds,

          reason:
            "ai_wrong_answer_type",
        };
      }

      const canonical =
        `Rebirth${Number(
          rb[
            1
          ]
        )}`;

      supporting =
        cited.filter(
          (
            row
          ) =>
            norm(
              row.text
            ).includes(
              norm(
                canonical
              )
            ) ||
            new RegExp(
              `rebirth\\s*#?\\s*${Number(
                rb[
                  1
                ]
              )}`,
              "i"
            ).test(
              row.text
            )
        );
    }

    if (
      !supporting.length
    ) {
      return {
        ok:
          true,

        answer:
          "UNKNOWN",

        candidateAnswer:
          answer,

        confidence:
          clamp(
            raw?.confidence
          ),

        citedIds,

        reason:
          "ai_answer_not_in_cited_evidence",
      };
    }

    const canonicalSupport =
      supporting.some(
        (
          row
        ) =>
          row.kind ===
          "CANONICAL_FULL_PAGE"
      );

    const independentHosts =
      new Set(
        supporting.map(
          (
            row
          ) =>
            row.host
        )
      ).size;

    const confidence =
      clamp(
        raw?.confidence,
        0,
        canonicalSupport
          ? 0.97
          : 0.9
      );

    if (
      canonicalSupport &&
      confidence >=
        0.88
    ) {
      return {
        ok:
          true,

        answer,

        candidateAnswer:
          answer,

        confidence,

        citedIds,

        reason:
          "ai_verified_by_canonical_full_page",
      };
    }

    if (
      independentHosts >=
        2 &&
      confidence >=
        0.9
    ) {
      return {
        ok:
          true,

        answer,

        candidateAnswer:
          answer,

        confidence,

        citedIds,

        reason:
          "ai_verified_by_two_sources",
      };
    }

    return {
      ok:
        true,

      answer:
        "UNKNOWN",

      candidateAnswer:
        answer,

      confidence,

      citedIds,

      reason:
        "ai_review_only",
    };
  } catch (
    error
  ) {
    return {
      ok:
        false,

      error:
        errorCode(
          error
        ),

      answer:
        "UNKNOWN",

      confidence:
        0,

      citedIds:
        [],
    };
  }
}

function cacheKeyQuestion(
  question
) {
  return norm(
    question
  );
}

function getCachedAnswer(
  question
) {
  return cacheGet(
    ANSWER_CACHE,
    cacheKeyQuestion(
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

    cacheKeyQuestion(
      question
    ),

    value,

    isCurrent(
      question
    )
      ? CFG.CURRENT_CACHE_TTL_MS
      : CFG.STABLE_CACHE_TTL_MS
  );
}

function advisoryFrom(
  question
) {
  const answer =
    clean(
      question?.aiAnswer ||
        "UNKNOWN",
      300
    );

  return {
    answer,

    confidence:
      clamp(
        question?.aiConfidence,
        0,
        1
      ),
  };
}

function finalize(
  base,
  question,
  startedAt,
  canonical,
  tavily = null,
  ai = null,
  advisory = null
) {
  const sources =
    Array.isArray(
      base?.sources
    )
      ? base.sources
      : [];

  return {
    answer:
      base?.answer ||
      "UNKNOWN",

    candidateAnswer:
      base?.candidateAnswer ||
      "UNKNOWN",

    candidateConfidence:
      base?.confidence ||
      0,

    confidence:
      base?.confidence ||
      0,

    reason:
      base?.reason ||
      "unknown",

    route:
      base?.route ||
      "REVIEW",

    sourceCount:
      base?.sourceCount ||
      0,

    highestTier:
      sources.length
        ? 1
        : 4,

    bestRelevance:
      1,

    sources,

    advisoryAnswer:
      advisory?.answer ||
      "UNKNOWN",

    advisoryConfidence:
      advisory?.confidence ||
      0,

    agreement:
      base?.answer !==
        "UNKNOWN" &&
      advisory?.answer &&
      norm(
        base.answer
      ) ===
        norm(
          advisory.answer
        ),

    searchMode:
      explicitDate(
        question
      ).has
        ? "HISTORICAL_DATE"
        : isCurrent(
            question
          )
          ? "CURRENT"
          : "FALLBACK",

    searchLatencyMs:
      nowMs() -
      startedAt,

    intent:
      canonical?.intent ||
      inferIntent(
        question
      ),

    answerType:
      inferAnswerType(
        question
      ),

    canonicalPages:
      canonical?.pages?.map(
        (
          page
        ) => ({
          title:
            page.title,

          url:
            page.url,

          source:
            page.source,

          cache:
            page.cache,
        })
      ) ||
      [],

    canonicalErrors:
      canonical?.errors ||
      [],

    searchErrors:
      tavily?.errors ||
      [],

    extractorError:
      ai?.ok ===
      false
        ? ai?.error ||
          null
        : null,

    extractionMode:
      base?.route?.startsWith(
        "CANONICAL"
      )
        ? "FULL_CANONICAL_PAGE"
        : ai?.ok
          ? "CANONICAL_PLUS_TAVILY_PLUS_NVIDIA"
          : "CANONICAL_PLUS_TAVILY",

    cache:
      "MISS",
  };
}

async function resolveQuestion(
  question,
  lore
) {
  const startedAt =
    nowMs();

  const deadline =
    startedAt +
    CFG.GLOBAL_BUDGET_MS;

  const advisory =
    advisoryFrom(
      question
    );

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

  const canonical =
    await canonicalPagesForQuestion(
      question.question,
      deadline
    );

  const direct =
    canonicalDirectResolve(
      question.question,
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
        startedAt,
        canonical,
        null,
        null,
        advisory
      );

    setCachedAnswer(
      question.question,
      result
    );

    return result;
  }

  const tavily =
    await tavilyStage(
      question.question,
      deadline
    );

  const ai =
    await nvidiaFallback(
      question.question,
      canonical.pages,
      tavily.sources,
      lore,
      deadline
    );

  if (
    ai.ok &&
    ai.answer &&
    ai.answer !==
      "UNKNOWN"
  ) {
    const evidence = [
      ...evidenceFromCanonicalPages(
        canonical.pages
      ),

      ...evidenceFromWebSources(
        tavily.sources,
        canonical.pages.length
      ),
    ];

    const cited =
      evidence.filter(
        (
          row
        ) =>
          ai.citedIds.includes(
            row.id
          )
      );

    const base = {
      answer:
        ai.answer,

      candidateAnswer:
        ai.answer,

      confidence:
        ai.confidence,

      reason:
        ai.reason,

      route:
        ai.reason ===
        "ai_verified_by_canonical_full_page"
          ? "AI_CANONICAL_VERIFIED"
          : "AI_TWO_SOURCE_VERIFIED",

      sourceCount:
        new Set(
          cited.map(
            (
              row
            ) =>
              row.host
          )
        ).size,

      sources:
        cited
          .slice(
            0,
            4
          )
          .map(
            (
              row
            ) => ({
              host:
                row.host,

              title:
                row.title,

              url:
                row.url,

              claimType:
                row.kind,
            })
          ),
    };

    const result =
      finalize(
        base,
        question.question,
        startedAt,
        canonical,
        tavily,
        ai,
        advisory
      );

    setCachedAnswer(
      question.question,
      result
    );

    return result;
  }

  let candidateAnswer =
    direct?.candidateAnswer ||
    ai?.candidateAnswer ||
    advisory.answer ||
    "UNKNOWN";

  if (
    inferAnswerType(
      question.question
    ) ===
    ANSWER_TYPE.REBIRTH
  ) {
    const rb =
      candidateAnswer.match(
        /\brebirth\s*#?\s*(\d{1,3})\b/i
      );

    candidateAnswer =
      rb
        ? `Rebirth${Number(
            rb[
              1
            ]
          )}`
        : "UNKNOWN";
  }

  return finalize(
    {
      answer:
        "UNKNOWN",

      candidateAnswer:
        clean(
          candidateAnswer,
          300
        ) ||
        "UNKNOWN",

      confidence:
        Math.max(
          direct?.confidence ||
            0,

          ai?.confidence ||
            0,

          advisory.confidence ||
            0
        ),

      reason:
        direct?.reason ||
        ai?.reason ||
        "no_verified_answer",

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

    startedAt,

    canonical,

    tavily,

    ai,

    advisory
  );
}

function validateQuestions(
  value
) {
  if (
    !Array.isArray(
      value
    ) ||
    value.length <
      1 ||
    value.length >
      8
  ) {
    throw new Error(
      "QUESTIONS_MUST_CONTAIN_1_TO_8_ITEMS"
    );
  }

  return value.map(
    (
      row,
      index
    ) => {
      const question =
        clean(
          row?.question,
          700
        );

      if (
        !question
      ) {
        throw new Error(
          `QUESTION_${index + 1}_EMPTY`
        );
      }

      return {
        index:
          index +
          1,

        question,

        expectedEntity:
          clean(
            row?.expectedEntity ||
              "NONE",
            120
          ) ||
          "NONE",

        expectedAttribute:
          clean(
            row?.expectedAttribute ||
              "NONE",
            120
          ) ||
          "NONE",

        aiAnswer:
          clean(
            row?.aiAnswer ||
              "UNKNOWN",
            300
          ) ||
          "UNKNOWN",

        aiConfidence:
          clamp(
            row?.aiConfidence,
            0,
            1
          ),
      };
    }
  );
}

function makeTrace(
  items
) {
  const failed =
    items.find(
      (
        item
      ) =>
        item.answer ===
        "UNKNOWN"
    );

  if (
    failed
  ) {
    return (
      `REVIEW • ${failed.intent || "GENERIC"}` +
      ` • ${failed.answerType || "TEXT"}` +
      ` • reason=${clean(
        failed.reason,
        90
      )}` +
      ` • candidate=${clean(
        failed.candidateAnswer,
        80
      )}` +
      ` • ms=${failed.searchLatencyMs || 0}`
    );
  }

  return items
    .map(
      (
        item
      ) =>
        `${item.route}:${item.answer}:${Math.round(
          (
            item.confidence ||
            0
          ) *
            100
        )}%:${item.searchLatencyMs || 0}ms`
    )
    .join(
      " | "
    );
}

function syntheticPage(
  title,
  html,
  text = ""
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

    wikitext:
      "",

    html,

    text:
      text ||
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

function runSelfTests() {
  let passed =
    0;

  const failures =
    [];

  const check =
    (
      name,
      condition,
      detail = ""
    ) => {
      if (
        condition
      ) {
        passed++;
      } else {
        failures.push({
          name,

          detail:
            clean(
              detail,
              180
            ),
        });
      }
    };

  check(
    "intent current rebirth",

    inferIntent(
      "What is the newest rebirth right now?"
    ) ===
      INTENT.CURRENT_REBIRTH
  );

  check(
    "intent reverse rebirth",

    inferIntent(
      "What gear is unlocked at Rebirth 18?"
    ) ===
      INTENT.REBIRTH_REWARD
  );

  check(
    "answer type gear",

    inferAnswerType(
      "What gear is unlocked at Rebirth 18?"
    ) ===
      ANSWER_TYPE.GEAR
  );

  check(
    "answer type rebirth",

    inferAnswerType(
      "Which rebirth unlocks Giant Potion?"
    ) ===
      ANSWER_TYPE.REBIRTH
  );

  check(
    "answer type limited brainrot",

    inferAnswerType(
      "What limited brainrot was introduced in Update 52.75?"
    ) ===
      ANSWER_TYPE.BRAINROT
  );

  check(
    "answer type new gear",

    inferAnswerType(
      "What new gear is unlocked at Rebirth 18?"
    ) ===
      ANSWER_TYPE.GEAR
  );

  check(
    "mutation intent",

    inferIntent(
      "What multiplier does Rainbow mutation give?"
    ) ===
      INTENT.MUTATION_MULTIPLIER
  );

  check(
    "ritual intent",

    inferIntent(
      "What does the Bombardiro ritual require?"
    ) ===
      INTENT.RITUAL_REQUIREMENT
  );

  check(
    "lucky block intent",

    inferIntent(
      "What is the drop rate from the Lucky Block?"
    ) ===
      INTENT.LUCKY_BLOCK_DROP_RATE
  );

  check(
    "brainrot cost intent",

    inferIntent(
      "How much does Tralalero Tralala cost brainrot?"
    ) ===
      INTENT.BRAINROT_COST
  );

  check(
    "update extraction",

    extractUpdateNumber(
      "What was added in Update 52.75?"
    ) ===
      "52.75"
  );

  check(
    "rebirth extraction",

    extractRebirthNumberFromQuestion(
      "What gear is at Rebirth 18?"
    ) ===
      18
  );

  for (
    let i =
      1;
    i <=
    180;
    i++
  ) {
    const html =
      `<table>` +
      `<tr><th>Rebirth</th><th>Reward</th></tr>` +
      `<tr><td>Rebirth ${i}</td><td>Item ${i}</td></tr>` +
      `</table>`;

    const page =
      syntheticPage(
        "Rebirth",
        html
      );

    check(
      `rebirth row ${i}`,

      extractRebirthRows(
        page
      )[
        0
      ]?.number ===
        i
    );

    check(
      `reverse reward ${i}`,

      findRewardForRebirth(
        page,
        i
      )?.includes(
        `Item ${i}`
      )
    );
  }

  for (
    let i =
      1;
    i <=
    150;
    i++
  ) {
    const html =
      `<table>` +
      `<tr><th>Rebirth</th><th>Reward</th></tr>` +
      `<tr><td>Rebirth ${i}</td><td>Giant Potion</td></tr>` +
      `</table>`;

    const page =
      syntheticPage(
        "Rebirth",
        html
      );

    check(
      `entity to rebirth ${i}`,

      findRebirthForEntity(
        page,
        [
          "giant potion",
        ]
      ) ===
        `Rebirth${i}`
    );
  }

  for (
    let i =
      1;
    i <=
    120;
    i++
  ) {
    const html =
      `<table>` +
      `<tr><th>Name</th><th>Multiplier</th></tr>` +
      `<tr><td>Mutation ${i}</td><td>${i}x</td></tr>` +
      `</table>`;

    const page =
      syntheticPage(
        "Mutations",
        html
      );

    const question =
      `What multiplier does Mutation ${i} give?`;

    const result =
      directTableLookup(
        question,
        page
      );

    check(
      `mutation multiplier ${i}`,

      result?.answer ===
        `${i}x`
    );
  }

  for (
    let i =
      1;
    i <=
    90;
    i++
  ) {
    const html =
      `<table>` +
      `<tr><th>Name</th><th>Cost</th><th>Rebirth</th></tr>` +
      `<tr><td>Slap ${i}</td><td>$${i}K</td><td>Rebirth ${i}</td></tr>` +
      `</table>`;

    const page =
      syntheticPage(
        "Slap",
        html
      );

    const cost =
      directTableLookup(
        `How much does Slap ${i} cost?`,
        page
      );

    const rb =
      directTableLookup(
        `What rebirth unlocks Slap ${i}?`,
        page
      );

    check(
      `slap cost ${i}`,

      cost?.answer ===
        `$${i}K`
    );

    check(
      `slap rebirth ${i}`,

      rb?.answer ===
        `Rebirth${i}`
    );
  }

  for (
    let i =
      1;
    i <=
    60;
    i++
  ) {
    const html =
      `<table>` +
      `<tr><th>Name</th><th>Chance</th></tr>` +
      `<tr><td>Thing ${i}</td><td>${i}%</td></tr>` +
      `</table>`;

    const page =
      syntheticPage(
        "Lucky Blocks",
        html
      );

    const result =
      directTableLookup(
        `What is the drop rate of Thing ${i} from the Lucky Block?`,
        page
      );

    check(
      `drop rate ${i}`,

      result?.answer ===
        `${i}%`
    );
  }

  const reverseComplex =
    syntheticPage(
      "Rebirth",

      `<table>` +
        `<tr><th>Rebirth</th><th>Cash</th><th>Multiplier</th><th>Gear</th></tr>` +
        `<tr><td>Rebirth 18</td><td>$1B</td><td>18x</td><td>Flash Teleport</td></tr>` +
        `</table>`
    );

  check(
    "reverse relation chooses gear column",

    directRebirthLookup(
      "What gear is unlocked at Rebirth 18?",
      [
        reverseComplex,
      ]
    )?.answer ===
      "Flash Teleport"
  );

  const currentPage =
    syntheticPage(
      "Rebirth",

      `<table>` +
        `<tr><th>Rebirth</th><th>Reward</th></tr>` +
        `${
          Array.from(
            {
              length:
                18,
            },

            (
              _,
              i
            ) =>
              `<tr><td>Rebirth ${i + 1}</td><td>Reward ${i + 1}</td></tr>`
          ).join(
            ""
          )
        }` +
        `</table>`
    );

  check(
    "current full max",

    directCurrentRebirth(
      [
        currentPage,
      ]
    )?.answer ===
      "Rebirth18"
  );

  const total =
    passed +
    failures.length;

  return {
    ok:
      failures.length ===
      0,

    total,

    passed,

    failed:
      failures.length,

    failures:
      failures.slice(
        0,
        25
      ),

    note:
      "Deterministic parser/routing tests only. Live Fandom/Tavily/NVIDIA checks use separate endpoints.",
  };
}

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

export async function GET(
  request
) {
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
    "wiki"
  ) {
    const pageName =
      clean(
        url.searchParams.get(
          "page"
        ) ||
          "Rebirth",
        300
      );

    const started =
      nowMs();

    try {
      const page =
        await fetchCanonicalPage(
          pageName,
          started +
            4500
        );

      const rows =
        extractRebirthRows(
          page
        );

      return json(
        200,
        {
          ok:
            true,

          build:
            BUILD_ID,

          test:
            "wiki_full_page",

          page:
            page.title,

          source:
            page.source,

          cache:
            page.cache,

          textLength:
            page.text.length,

          tableRowCount:
            rows.length,

          maxRebirth:
            rows.length
              ? `Rebirth${Math.max(
                  ...rows.map(
                    (
                      r
                    ) =>
                      r.number
                  )
                )}`
              : null,

          infoboxKeys:
            Object.keys(
              parseInfobox(
                page
              )
            ).slice(
              0,
              20
            ),

          ms:
            nowMs() -
            started,

          errors:
            page.errors,
        }
      );
    } catch (
      error
    ) {
      return json(
        200,
        {
          ok:
            false,

          build:
            BUILD_ID,

          test:
            "wiki_full_page",

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
    const q =
      clean(
        url.searchParams.get(
          "q"
        ) ||
          "What is the newest rebirth in Steal a Brainrot right now?",
        700
      );

    const started =
      nowMs();

    try {
      const canonical =
        await canonicalPagesForQuestion(
          q,
          started +
            5000
        );

      const direct =
        canonicalDirectResolve(
          q,
          canonical
        );

      return json(
        200,
        {
          ok:
            Boolean(
              direct?.answer &&
              direct.answer !==
                "UNKNOWN"
            ),

          build:
            BUILD_ID,

          question:
            q,

          intent:
            inferIntent(
              q
            ),

          answerType:
            inferAnswerType(
              q
            ),

          direct,

          pages:
            canonical.pages.map(
              (
                p
              ) => ({
                title:
                  p.title,

                source:
                  p.source,

                textLength:
                  p.text.length,
              })
            ),

          errors:
            canonical.errors,

          ms:
            nowMs() -
            started,
        }
      );
    } catch (
      error
    ) {
      return json(
        200,
        {
          ok:
            false,

          build:
            BUILD_ID,

          test:
            "resolve",

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
    "search"
  ) {
    const started =
      nowMs();

    try {
      const result =
        await tavilyStage(
          "What is the newest rebirth in Steal a Brainrot right now?",

          started +
            4500
        );

      return json(
        200,
        {
          ok:
            result.sources.length >
            0,

          build:
            BUILD_ID,

          test:
            "tavily_search",

          sourceCount:
            result.sources.length,

          errors:
            result.errors,

          ms:
            nowMs() -
            started,
        }
      );
    } catch (
      error
    ) {
      return json(
        200,
        {
          ok:
            false,

          build:
            BUILD_ID,

          test:
            "tavily_search",

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
          env(
            "TAVILY_API_KEY"
          ).length >
          0,

        nvidia:
          env(
            "NVIDIA_API_KEY"
          ).length >
          0,

        token:
          env(
            "LOOKUP_PROXY_TOKEN"
          ).length >
          0,
      },

      model:
        process.env
          .NVIDIA_MODEL ||
        DEFAULT_MODEL,

      architecture: {
        generalSABIntentRouter:
          true,

        answerTypeDetection:
          true,

        dynamicEntitySearch:
          true,

        fandomMediaWikiFirst:
          true,

        fandomFullHtmlFallback:
          true,

        infoboxParser:
          true,

        genericTableParser:
          true,

        bidirectionalRelations:
          true,

        updateSectionParser:
          true,

        rebirthTableParser:
          true,

        mutationTraitMachineRitualLuckyBlockSlapBaseRouting:
          true,

        tavilyFallback:
          true,

        nvidiaEvidenceFallback:
          true,

        pageCache:
          true,

        answerCache:
          true,

        selfTestEndpoint:
          "?test=self",

        wikiHealthEndpoint:
          "?test=wiki&page=Rebirth",

        directResolveEndpoint:
          "?test=resolve&q=...",
      },
    }
  );
}

export async function POST(
  request
) {
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

  if (
    !env(
      "TAVILY_API_KEY"
    )
  ) {
    return json(
      503,
      {
        error:
          "TAVILY_KEY_NOT_CONFIGURED",
      }
    );
  }

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
  } catch (
    error
  ) {
    return json(
      400,
      {
        error:
          clean(
            error?.message,
            220
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
      const resolved =
        await resolveQuestion(
          question,
          lore
        );

      items.push({
        index:
          question.index,

        entity:
          question.expectedEntity !==
          "NONE"
            ? question.expectedEntity
            : "UNKNOWN",

        attribute:
          question.expectedAttribute !==
          "NONE"
            ? question.expectedAttribute
            : "UNKNOWN",

        ...resolved,
      });
    } catch (
      error
    ) {
      const reason =
        errorCode(
          error
        );

      items.push({
        index:
          question.index,

        answer:
          "UNKNOWN",

        candidateAnswer:
          "UNKNOWN",

        entity:
          question.expectedEntity !==
          "NONE"
            ? question.expectedEntity
            : "UNKNOWN",

        attribute:
          question.expectedAttribute !==
          "NONE"
            ? question.expectedAttribute
            : "UNKNOWN",

        confidence:
          0,

        reason,

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
