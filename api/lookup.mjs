const BUILD_ID = "SAB_KNOWLEDGE_LOOKUP_R19_2026_08_19";

const FANDOM_API = "https://stealabrainrot.fandom.com/api.php";
const FANDOM_BASE = "https://stealabrainrot.fandom.com/wiki/";
const TAVILY_URL = "https://api.tavily.com/search";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";

const CFG = Object.freeze({
  GLOBAL_BUDGET_MS: 7000,
  WIKI_TIMEOUT_MS: 2300,
  TAVILY_TIMEOUT_MS: 2200,
  NVIDIA_TIMEOUT_MS: 1800,
  SEARCH_DEPTH: "fast",
  SEARCH_MAX_RESULTS: 7,
  MAX_CANONICAL_PAGES: 7,
  MAX_WEB_SOURCES: 14,
  MAX_AI_EVIDENCE: 10,
  CURRENT_CACHE_TTL_MS: 3 * 60 * 1000,
  STABLE_CACHE_TTL_MS: 12 * 60 * 60 * 1000,
  PAGE_CACHE_TTL_MS: 5 * 60 * 1000,
  TITLE_CACHE_TTL_MS: 5 * 60 * 1000,
});

const INTENT = Object.freeze({
  CURRENT_REBIRTH: "CURRENT_REBIRTH",
  UPDATE: "UPDATE",
  ENTITY_PROPERTY: "ENTITY_PROPERTY",
  GENERIC: "GENERIC",
});

const ATTR = Object.freeze({
  NAME: "NAME",
  TEXT: "TEXT",
  REBIRTH: "REBIRTH",
  GEAR: "GEAR",
  BRAINROT: "BRAINROT",
  MUTATION: "MUTATION",
  TRAIT: "TRAIT",
  EVENT: "EVENT",
  MACHINE: "MACHINE",
  RITUAL: "RITUAL",
  RARITY: "RARITY",
  COST: "COST",
  INCOME: "INCOME",
  STATUS: "STATUS",
  MULTIPLIER: "MULTIPLIER",
  REQUIREMENT: "REQUIREMENT",
  SPAWN: "SPAWN",
  FORMATION: "FORMATION",
  WEATHER: "WEATHER",
  DROP_RATE: "DROP_RATE",
  REWARD: "REWARD",
  CONTENTS: "CONTENTS",
  DATE: "DATE",
  METHOD: "METHOD",
  SLOTS: "SLOTS",
  FLOORS: "FLOORS",
  REPLACED_BY: "REPLACED_BY",
});

const HUBS = Object.freeze({
  REBIRTH: ["Rebirth", "Gears"],
  GEAR: ["Gears", "Rebirth"],
  SLAP: ["Slap", "Rebirth"],
  MUTATION: ["Mutations"],
  TRAIT: ["Traits", "Events"],
  RITUAL: ["Rituals"],
  MACHINE: ["Machines", "Update Log"],
  LUCKY_BLOCK: ["Lucky Blocks"],
  UPDATE: ["Update Log"],
  EVENT: ["Events", "Admin Abuse", "Update Log"],
  BASE: ["Base"],
  RARITY: ["Rarities", "Category:Brainrots"],
});

const STATIC_ALIASES = Object.freeze({
  "flash tp": ["flash tp", "flash teleport"],
  "flash teleport": ["flash teleport", "flash tp"],
  "brain rot": ["brain rot", "brainrot"],
  "brainrot": ["brainrot", "brain rot"],
  "admin abuse": ["admin abuse", "admin event"],
  "lucky block": ["lucky block", "lucky blocks"],
});

const STOPWORDS = new Set([
  "what","which","who","when","where","why","how","much","many","does","did","do","is","are","was","were",
  "the","a","an","in","at","on","for","from","to","of","with","and","or","that","this","it","its",
  "steal","brainrot","brain","rot","sab","roblox","game","right","now","current","currently","latest","newest","new",
  "added","introduced","unlock","unlocks","unlocked","get","gets","got","give","gives","gave","make","makes","per","second",
  "come","came","out","during","update","event","rebirth","gear","item","mutation","trait","machine","ritual","rarity","base",
  "slap","lucky","block","cost","price","income","multiplier","rate","drop","requires","require","required","spawn","spawns","reward",
  "available","obtain","obtained","obtainable","method","status","chance","what's","whats","tell","me","about","thing","stuff"
]);

const ANSWER_CACHE = new Map();
const PAGE_CACHE = new Map();
const TITLE_SEARCH_CACHE = new Map();

function clean(value, limit = 2000) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function norm(value) {
  return clean(value, 2000)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function clamp(value, min = 0, max = 1) {
  const n = Number(value);
  return Number.isFinite(n)
    ? Math.max(min, Math.min(max, n))
    : min;
}

function env(name) {
  return String(process.env[name] || "")
    .trim()
    .replace(/^Bearer\s+/i, "")
    .trim();
}

function nowMs() {
  return Date.now();
}

function timeLeft(deadline) {
  return Math.max(0, deadline - nowMs());
}

function errorCode(error) {
  return clean(
    error?.code ||
    error?.message ||
    error ||
    "UNKNOWN_ERROR",
    320
  );
}

function json(status, payload) {
  return new Response(
    JSON.stringify(payload),
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
  html,
  limit = 140000
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
    limit
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
              "ChromeCodeSniperLookup-R19",
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
        ? parsed
            .wikitext
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
          title,
          300
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
              "ChromeCodeSniperLookup-R19",
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
              "ChromeCodeSniperLookup-R19",
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
          ? data.query.search
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
      CFG.TITLE_CACHE_TTL_MS
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

function inferAttribute(
  question
) {
  const q =
    clean(
      question,
      700
    ).toLowerCase();

  if (
    /\b(?:when|what date|which date|what year|what month|release date)\b/.test(
      q
    )
  ) {
    return ATTR.DATE;
  }

  if (
    /\b(?:income|makes? per second|per second|earn(?:s|ing)?)\b/.test(
      q
    )
  ) {
    return ATTR.INCOME;
  }

  if (
    /\b(?:cost|price|how much)\b/.test(
      q
    )
  ) {
    return ATTR.COST;
  }

  if (
    /\bmultiplier\b|\bboost\b/.test(
      q
    )
  ) {
    return ATTR.MULTIPLIER;
  }

  if (
    /\b(?:drop rate|chance|probability)\b/.test(
      q
    )
  ) {
    return ATTR.DROP_RATE;
  }

  if (
    /\b(?:rarity|tier)\b/.test(
      q
    )
  ) {
    return ATTR.RARITY;
  }

  if (
    /\b(?:status|obtainable|limited|removed|available)\b/.test(
      q
    )
  ) {
    return ATTR.STATUS;
  }

  if (
    /\b(?:how do|how can|obtain|obtained|get it|acquire|method)\b/.test(
      q
    )
  ) {
    return ATTR.METHOD;
  }

  if (
    /\b(?:requires?|requirement|needed|need to)\b/.test(
      q
    )
  ) {
    return ATTR.REQUIREMENT;
  }

  if (
    /\b(?:spawn|spawns|summon|summons)\b/.test(
      q
    )
  ) {
    return ATTR.SPAWN;
  }

  if (
    /\b(?:formation|arrange|arrangement|placement)\b/.test(
      q
    )
  ) {
    return ATTR.FORMATION;
  }

  if (
    /\bweather\b/.test(
      q
    )
  ) {
    return ATTR.WEATHER;
  }

  if (
    /\b(?:replaced by|replacement|replace it)\b/.test(
      q
    )
  ) {
    return ATTR.REPLACED_BY;
  }

  if (
    /\b(?:slots?|slot count)\b/.test(
      q
    )
  ) {
    return ATTR.SLOTS;
  }

  if (
    /\b(?:floors?|floor count)\b/.test(
      q
    )
  ) {
    return ATTR.FLOORS;
  }

  if (
    /\b(?:contents?|inside|contains?|drops?)\b/.test(
      q
    )
  ) {
    return ATTR.CONTENTS;
  }

  if (
    /\b(?:reward|rewards|gives|gave)\b/.test(
      q
    )
  ) {
    return ATTR.REWARD;
  }

  if (
    /\b(?:which|what)\s+rebirth\b/.test(
      q
    ) ||
    /\brebirth\s+(?:did|does|is)\b/.test(
      q
    )
  ) {
    return ATTR.REBIRTH;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z0-9'-]+){0,3}\s+(?:gear|item)\b/.test(
      q
    )
  ) {
    return ATTR.GEAR;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z0-9'-]+){0,3}\s+(?:brainrot|brain rot)\b/.test(
      q
    )
  ) {
    return ATTR.BRAINROT;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z0-9'-]+){0,3}\s+mutation\b/.test(
      q
    )
  ) {
    return ATTR.MUTATION;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z0-9'-]+){0,3}\s+trait\b/.test(
      q
    )
  ) {
    return ATTR.TRAIT;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z0-9'-]+){0,3}\s+event\b/.test(
      q
    )
  ) {
    return ATTR.EVENT;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z0-9'-]+){0,3}\s+machine\b/.test(
      q
    )
  ) {
    return ATTR.MACHINE;
  }

  if (
    /\b(?:what|which)(?:\s+[a-z0-9'-]+){0,3}\s+ritual\b/.test(
      q
    )
  ) {
    return ATTR.RITUAL;
  }

  return ATTR.TEXT;
}

function inferIntent(
  question
) {
  const q =
    clean(
      question,
      700
    ).toLowerCase();

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
    /\bupdate\s*\d+(?:\.\d+)?\b/.test(
      q
    ) ||
    q.includes(
      "update "
    )
  ) {
    return INTENT.UPDATE;
  }

  if (
    inferAttribute(
      q
    ) !==
      ATTR.TEXT ||
    candidateEntities(
      q
    ).length
  ) {
    return INTENT.ENTITY_PROPERTY;
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

function extractRebirthNumber(
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
      /["“”']([^"“”']{2,90})["“”']/g
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

  const aliasValues =
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

  const out = [
    ...new Set([
      ...quoted,
      ...aliasValues,
      ...spans,
    ]),
  ];

  return out
    .sort(
      (
        a,
        b
      ) => {
        const ac =
          a.split(
            /\s+/
          ).length;

        const bc =
          b.split(
            /\s+/
          ).length;

        return (
          bc -
            ac ||
          b.length -
            a.length
        );
      }
    )
    .slice(
      0,
      16
    );
}

function titleSimilarity(
  a,
  b
) {
  const an =
    norm(
      a
    );

  const bn =
    norm(
      b
    );

  if (
    !an ||
    !bn
  ) {
    return 0;
  }

  if (
    an ===
    bn
  ) {
    return 1;
  }

  if (
    an.includes(
      bn
    ) ||
    bn.includes(
      an
    )
  ) {
    return 0.9;
  }

  const aw =
    new Set(
      clean(
        a,
        300
      )
        .toLowerCase()
        .match(
          /[a-z0-9]+/g
        ) ||
        []
    );

  const bw =
    new Set(
      clean(
        b,
        300
      )
        .toLowerCase()
        .match(
          /[a-z0-9]+/g
        ) ||
        []
    );

  if (
    !aw.size ||
    !bw.size
  ) {
    return 0;
  }

  const overlap = [
    ...aw,
  ].filter(
    (
      x
    ) =>
      bw.has(
        x
      )
  ).length;

  return (
    overlap /
    Math.max(
      aw.size,
      bw.size
    )
  );
}

function bestEntitySearchQuery(
  question
) {
  return (
    candidateEntities(
      question
    )[
      0
    ] ||
    clean(
      question,
      450
    )
  );
}

function hubTitlesForQuestion(
  question
) {
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
      ...HUBS.REBIRTH
    );
  }

  if (
    q.includes(
      "mutation"
    )
  ) {
    out.push(
      ...HUBS.MUTATION
    );
  }

  if (
    q.includes(
      "trait"
    )
  ) {
    out.push(
      ...HUBS.TRAIT
    );
  }

  if (
    q.includes(
      "ritual"
    )
  ) {
    out.push(
      ...HUBS.RITUAL
    );
  }

  if (
    q.includes(
      "machine"
    )
  ) {
    out.push(
      ...HUBS.MACHINE
    );
  }

  if (
    q.includes(
      "lucky block"
    )
  ) {
    out.push(
      ...HUBS.LUCKY_BLOCK
    );
  }

  if (
    q.includes(
      "update"
    )
  ) {
    out.push(
      ...HUBS.UPDATE
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
      ...HUBS.EVENT
    );
  }

  if (
    q.includes(
      "base"
    )
  ) {
    out.push(
      ...HUBS.BASE
    );
  }

  if (
    q.includes(
      "rarity"
    )
  ) {
    out.push(
      ...HUBS.RARITY
    );
  }

  if (
    q.includes(
      "gear"
    )
  ) {
    out.push(
      ...HUBS.GEAR
    );
  }

  if (
    q.includes(
      "slap"
    )
  ) {
    out.push(
      ...HUBS.SLAP
    );
  }

  return [
    ...new Set(
      out
    ),
  ];
}

async function canonicalPagesForQuestion(
  question,
  deadline
) {
  const intent =
    inferIntent(
      question
    );

  const titles =
    [];

  const entityCandidates =
    candidateEntities(
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

    titles.push(
      `Update Log/Update ${major}`,
      `Update ${updateNumber}`
    );
  }

  titles.push(
    ...hubTitlesForQuestion(
      question
    )
  );

  const searchQueries =
    [];

  if (
    entityCandidates[
      0
    ]
  ) {
    searchQueries.push(
      entityCandidates[
        0
      ]
    );
  }

  if (
    entityCandidates[
      1
    ]
  ) {
    searchQueries.push(
      entityCandidates[
        1
      ]
    );
  }

  if (
    !searchQueries.length
  ) {
    searchQueries.push(
      bestEntitySearchQuery(
        question
      )
    );
  }

  for (
    const sq
    of searchQueries.slice(
      0,
      2
    )
  ) {
    const found =
      await wikiSearchTitles(
        sq,
        deadline,
        8
      );

    const scored =
      found
        .map(
          (
            title
          ) => ({
            title,

            score:
              Math.max(
                ...entityCandidates.map(
                  (
                    e
                  ) =>
                    titleSimilarity(
                      e,
                      title
                    )
                ),

                titleSimilarity(
                  sq,
                  title
                )
              ),
          })
        )
        .sort(
          (
            a,
            b
          ) =>
            b.score -
            a.score
        );

    for (
      const row
      of scored
    ) {
      if (
        row.score >=
          0.34 &&
        !titles.some(
          (
            x
          ) =>
            x.toLowerCase() ===
            row.title.toLowerCase()
        )
      ) {
        titles.unshift(
          row.title
        );
      }
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

    entityCandidates,
  };
}

function extractTables(
  page
) {
  const html =
    String(
      page?.html ||
        ""
    );

  const tableHtmls =
    html.match(
      /<table\b[^>]*>[\s\S]*?<\/table>/gi
    ) ||
    [];

  const tables =
    [];

  for (
    const tableHtml
    of tableHtmls
  ) {
    const rowHtmls =
      tableHtml.match(
        /<tr\b[^>]*>[\s\S]*?<\/tr>/gi
      ) ||
      [];

    const rawRows =
      [];

    for (
      const rowHtml
      of rowHtmls
    ) {
      const cells =
        [];

      const re =
        /<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi;

      let m;

      while (
        (
          m =
            re.exec(
              rowHtml
            )
        ) !==
        null
      ) {
        cells.push({
          tag:
            m[
              1
            ].toLowerCase(),

          text:
            htmlToText(
              m[
                2
              ],
              1200
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
      let i =
        0;
      i <
      Math.min(
        rawRows.length,
        4
      );
      i++
    ) {
      const row =
        rawRows[
          i
        ];

      const thCount =
        row.filter(
          (
            c
          ) =>
            c.tag ===
            "th"
        ).length;

      const texts =
        row.map(
          (
            c
          ) =>
            c.text
              .toLowerCase()
        );

      const headerish =
        texts.some(
          (
            t
          ) =>
            /name|multi|multiplier|cost|price|income|rarity|status|rebirth|gear|reward|requires?|requirement|spawn|formation|weather|chance|rate|item|brainrot|trait|mutation|floor|slot|date|obtain/.test(
              t
            )
        );

      if (
        thCount >=
          Math.ceil(
            row.length /
              2
          ) ||
        headerish
      ) {
        headerIndex =
          i;

        break;
      }
    }

    let headers =
      [];

    let start =
      0;

    if (
      headerIndex >=
      0
    ) {
      headers =
        rawRows[
          headerIndex
        ].map(
          (
            c,
            i
          ) =>
            c.text ||
            `column_${i + 1}`
        );

      start =
        headerIndex +
        1;
    }

    const rows =
      rawRows
        .slice(
          start
        )
        .map(
          (
            row
          ) => {
            const cells =
              row.map(
                (
                  c
                ) =>
                  c.text
              );

            const obj =
              {};

            if (
              headers.length
            ) {
              for (
                let i =
                  0;
                i <
                Math.max(
                  headers.length,
                  cells.length
                );
                i++
              ) {
                const h =
                  headers[
                    i
                  ] ||
                  `column_${i + 1}`;

                obj[
                  h
                ] =
                  cells[
                    i
                  ] ||
                  "";
              }
            }

            return {
              cells,

              obj,

              text:
                clean(
                  cells.join(
                    " | "
                  ),
                  5000
                ),
            };
          }
        )
        .filter(
          (
            row
          ) =>
            row.cells.some(
              Boolean
            )
        );

    tables.push({
      headers,

      rows,

      rawRows:
        rawRows.map(
          (
            r
          ) =>
            r.map(
              (
                c
              ) =>
                c.text
            )
        ),

      text:
        htmlToText(
          tableHtml,
          40000
        ),
    });
  }

  return tables;
}

function normalizeHeader(
  header
) {
  const h =
    clean(
      header,
      200
    )
      .toLowerCase()
      .replace(
        /[^\w/%$+ -]+/g,
        " "
      )
      .trim();

  if (
    /^name$|brainrot|mutation|trait|ritual|gear|item|slap/.test(
      h
    )
  ) {
    return ATTR.NAME;
  }

  if (
    /multi|multiplier|boost/.test(
      h
    )
  ) {
    return ATTR.MULTIPLIER;
  }

  if (
    /cost|price|buy/.test(
      h
    )
  ) {
    return ATTR.COST;
  }

  if (
    /income|money per second|\$\/s|per second/.test(
      h
    )
  ) {
    return ATTR.INCOME;
  }

  if (
    /rarity|tier/.test(
      h
    )
  ) {
    return ATTR.RARITY;
  }

  if (
    /status|obtainability|available/.test(
      h
    )
  ) {
    return ATTR.STATUS;
  }

  if (
    /rebirth|level/.test(
      h
    )
  ) {
    return ATTR.REBIRTH;
  }

  if (
    /requires?|requirement|needed/.test(
      h
    )
  ) {
    return ATTR.REQUIREMENT;
  }

  if (
    /spawn|result|summon/.test(
      h
    )
  ) {
    return ATTR.SPAWN;
  }

  if (
    /formation|placement|arrange/.test(
      h
    )
  ) {
    return ATTR.FORMATION;
  }

  if (
    /weather/.test(
      h
    )
  ) {
    return ATTR.WEATHER;
  }

  if (
    /chance|probability|drop rate|rate/.test(
      h
    )
  ) {
    return ATTR.DROP_RATE;
  }

  if (
    /reward/.test(
      h
    )
  ) {
    return ATTR.REWARD;
  }

  if (
    /contents?|drops?/.test(
      h
    )
  ) {
    return ATTR.CONTENTS;
  }

  if (
    /date|release/.test(
      h
    )
  ) {
    return ATTR.DATE;
  }

  if (
    /obtain|method|source/.test(
      h
    )
  ) {
    return ATTR.METHOD;
  }

  if (
    /slots?/.test(
      h
    )
  ) {
    return ATTR.SLOTS;
  }

  if (
    /floors?/.test(
      h
    )
  ) {
    return ATTR.FLOORS;
  }

  if (
    /replaced by|replacement/.test(
      h
    )
  ) {
    return ATTR.REPLACED_BY;
  }

  return null;
}

function normalizeValue(
  value,
  attr
) {
  let text =
    clean(
      value,
      500
    );

  if (
    !text
  ) {
    return null;
  }

  if (
    attr ===
    ATTR.REBIRTH
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
    attr ===
    ATTR.MULTIPLIER
  ) {
    const m =
      text.match(
        /\b\d+(?:\.\d+)?\s*[x×]/i
      );

    return m
      ? m[
          0
        ]
          .replace(
            /\s+/g,
            ""
          )
          .replace(
            "×",
            "x"
          )
      : text;
  }

  if (
    attr ===
    ATTR.DROP_RATE
  ) {
    const m =
      text.match(
        /\b\d+(?:\.\d+)?\s*%/
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

function parseInfobox(
  page
) {
  const out =
    {};

  const html =
    String(
      page?.html ||
        ""
    );

  const source =
    html.match(
      /<(?:aside|table)\b[^>]*(?:portable-infobox|infobox)[^>]*>[\s\S]*?<\/(?:aside|table)>/i
    )?.[
      0
    ] ||
    "";

  if (
    source
  ) {
    for (
      const m
      of source.matchAll(
        /<div\b[^>]*class=["'][^"']*pi-item[^"']*["'][^>]*data-source=["']([^"']+)["'][^>]*>([\s\S]*?)<\/div>/gi
      )
    ) {
      const key =
        clean(
          m[
            1
          ],
          120
        ).toLowerCase();

      const value =
        htmlToText(
          m[
            2
          ],
          800
        );

      if (
        key &&
        value
      ) {
        out[
          key
        ] =
          value;
      }
    }

    for (
      const m
      of source.matchAll(
        /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
      )
    ) {
      const row =
        m[
          1
        ];

      const cells = [
        ...row.matchAll(
          /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi
        ),
      ].map(
        (
          x
        ) =>
          htmlToText(
            x[
              1
            ],
            700
          )
      );

      if (
        cells.length >=
        2
      ) {
        const key =
          clean(
            cells[
              0
            ],
            120
          ).toLowerCase();

        const value =
          clean(
            cells
              .slice(
                1
              )
              .join(
                " | "
              ),
            800
          );

        if (
          key &&
          value &&
          /cost|price|income|rarity|status|multiplier|obtain|date|release|rebirth|require/.test(
            key
          )
        ) {
          out[
            key
          ] =
            value;
        }
      }
    }
  }

  if (
    !Object.keys(
      out
    ).length &&
    page?.wikitext
  ) {
    const template =
      String(
        page.wikitext
      ).match(
        /\{\{[\s\S]{0,16000}?\n\}\}/
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
          120
        ).toLowerCase();

      const value =
        clean(
          m[
            2
          ].replace(
            /\[\[|\]\]/g,
            ""
          ),
          800
        );

      if (
        key &&
        value
      ) {
        out[
          key
        ] =
          value;
      }
    }
  }

  return out;
}

function infoboxValue(
  info,
  attr
) {
  const patterns = {
    [ATTR.COST]: [
      /^cost$/,
      /^price$/,
      /buy price/,
      /cost/,
    ],

    [ATTR.INCOME]: [
      /^income$/,
      /income\/s/,
      /money per second/,
      /earn/,
    ],

    [ATTR.RARITY]: [
      /^rarity$/,
      /^tier$/,
    ],

    [ATTR.STATUS]: [
      /^status$/,
      /obtainability/,
      /available/,
    ],

    [ATTR.MULTIPLIER]: [
      /^multiplier$/,
      /boost/,
    ],

    [ATTR.METHOD]: [
      /obtain/,
      /method/,
      /source/,
    ],

    [ATTR.DATE]: [
      /release date/,
      /^date$/,
      /released/,
    ],

    [ATTR.REBIRTH]: [
      /rebirth/,
      /requirement/,
    ],

    [ATTR.REQUIREMENT]: [
      /requirement/,
      /requires?/,
      /needed/,
    ],
  }[
    attr
  ] ||
  [];

  for (
    const [
      key,
      value,
    ] of Object.entries(
      info
    )
  ) {
    if (
      patterns.some(
        (
          p
        ) =>
          p.test(
            key
          )
      )
    ) {
      const normalized =
        normalizeValue(
          value,
          attr
        );

      if (
        normalized
      ) {
        return normalized;
      }
    }
  }

  return null;
}

function sectionText(
  page,
  headings
) {
  const html =
    String(
      page?.html ||
        ""
    );

  const needles =
    headings.map(
      (
        x
      ) =>
        x.toLowerCase()
    );

  const re =
    /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;

  const found =
    [];

  let m;

  while (
    (
      m =
        re.exec(
          html
        )
    ) !==
    null
  ) {
    found.push({
      index:
        m.index,

      end:
        re.lastIndex,

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
          ],
          300
        ),
    });
  }

  for (
    let i =
      0;
    i <
    found.length;
    i++
  ) {
    const h =
      found[
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
      found.length;
      j++
    ) {
      if (
        found[
          j
        ].level <=
        h.level
      ) {
        end =
          found[
            j
          ].index;

        break;
      }
    }

    return htmlToText(
      html.slice(
        h.end,
        end
      ),
      30000
    );
  }

  return "";
}

function entityAliases(
  question
) {
  const out =
    new Set(
      candidateEntities(
        question
      ).map(
        (
          x
        ) =>
          x.toLowerCase()
      )
    );

  for (
    const a
    of aliasesFor(
      question
    )
  ) {
    out.add(
      a.toLowerCase()
    );
  }

  return [
    ...out,
  ].filter(
    (
      x
    ) =>
      x.length >=
      3
  );
}

function pageMatchesEntity(
  page,
  entities
) {
  const titleNorm =
    norm(
      page?.title
    );

  return entities.some(
    (
      entity
    ) => {
      const eNorm =
        norm(
          entity
        );

      return (
        eNorm &&
        (
          titleNorm ===
            eNorm ||
          titleNorm.includes(
            eNorm
          ) ||
          eNorm.includes(
            titleNorm
          )
        )
      );
    }
  );
}

function chooseTableValue(
  row,
  table,
  attr
) {
  if (
    table.headers.length &&
    row.cells.length
  ) {
    for (
      let i =
        0;
      i <
      table.headers.length;
      i++
    ) {
      if (
        normalizeHeader(
          table.headers[
            i
          ]
        ) ===
        attr
      ) {
        const val =
          normalizeValue(
            row.cells[
              i
            ] ||
            "",
            attr
          );

        if (
          val
        ) {
          return val;
        }
      }
    }
  }

  const text =
    row.text;

  if (
    attr ===
    ATTR.REBIRTH
  ) {
    const m =
      text.match(
        /\brebirth\s*#?\s*(\d{1,3})\b/i
      );

    if (
      m
    ) {
      return (
        `Rebirth${Number(
          m[
            1
          ]
        )}`
      );
    }
  }

  if (
    attr ===
    ATTR.MULTIPLIER
  ) {
    const m =
      text.match(
        /\b\d+(?:\.\d+)?\s*[x×]/i
      );

    if (
      m
    ) {
      return m[
        0
      ]
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
    attr ===
    ATTR.DROP_RATE
  ) {
    const m =
      text.match(
        /\b\d+(?:\.\d+)?\s*%/
      );

    if (
      m
    ) {
      return m[
        0
      ].replace(
        /\s+/g,
        ""
      );
    }
  }

  if (
    attr ===
    ATTR.COST
  ) {
    const m =
      text.match(
        /\$\s*\d+(?:\.\d+)?\s*[KMBT]?/i
      );

    if (
      m
    ) {
      return m[
        0
      ].replace(
        /\s+/g,
        ""
      );
    }
  }

  if (
    attr ===
    ATTR.INCOME
  ) {
    const m =
      text.match(
        /\$\s*\d+(?:\.\d+)?\s*[KMBT]?\s*\/\s*s/i
      );

    if (
      m
    ) {
      return m[
        0
      ].replace(
        /\s+/g,
        ""
      );
    }
  }

  return null;
}

function rowMatchesEntities(
  row,
  entities
) {
  const low =
    row.text.toLowerCase();

  return entities.some(
    (
      entity
    ) =>
      low.includes(
        entity
      )
  );
}

function findEntityPropertyInTables(
  question,
  page,
  attr
) {
  const entities =
    entityAliases(
      question
    );

  const exactPage =
    pageMatchesEntity(
      page,
      entities
    );

  const tables =
    extractTables(
      page
    );

  for (
    const table
    of tables
  ) {
    for (
      const row
      of table.rows
    ) {
      const entityMatch =
        rowMatchesEntities(
          row,
          entities
        );

      const contextOwned =
        exactPage &&
        (
          table.rows.length <=
            4 ||
          table.headers.some(
            (
              h
            ) =>
              [
                ATTR.COST,
                ATTR.INCOME,
                ATTR.RARITY,
                ATTR.STATUS,
                ATTR.MULTIPLIER,
              ].includes(
                normalizeHeader(
                  h
                )
              )
          )
        );

      if (
        !entityMatch &&
        !contextOwned
      ) {
        continue;
      }

      const value =
        chooseTableValue(
          row,
          table,
          attr
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
            entityMatch
              ? 0.985
              : 0.975,

          reason:
            entityMatch
              ? "accepted_table_entity_relation"
              : "accepted_entity_page_information_table",

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
                "TABLE_PROPERTY",
            },
          ],
        };
      }
    }
  }

  return null;
}

function findReverseTableRelation(
  question,
  page,
  attr
) {
  const rebirth =
    extractRebirthNumber(
      question
    );

  if (
    !rebirth
  ) {
    return null;
  }

  const tables =
    extractTables(
      page
    );

  for (
    const table
    of tables
  ) {
    for (
      const row
      of table.rows
    ) {
      const rowRebirth =
        row.text.match(
          /\brebirth\s*#?\s*(\d{1,3})\b/i
        ) ||
        row.cells[
          0
        ]?.match(
          /^\s*(\d{1,3})\s*$/
        );

      if (
        !rowRebirth ||
        Number(
          rowRebirth[
            1
          ]
        ) !==
          rebirth
      ) {
        continue;
      }

      if (
        attr ===
          ATTR.GEAR ||
        attr ===
          ATTR.REWARD ||
        attr ===
          ATTR.NAME
      ) {
        if (
          table.headers.length
        ) {
          const preferred = [
            "gear",
            "item",
            "reward",
            "unlock",
            "ability",
            "tool",
            "name",
          ];

          for (
            let i =
              0;
            i <
            table.headers.length;
            i++
          ) {
            const h =
              clean(
                table.headers[
                  i
                ],
                120
              ).toLowerCase();

            if (
              !preferred.some(
                (
                  p
                ) =>
                  h.includes(
                    p
                  )
              )
            ) {
              continue;
            }

            const v =
              clean(
                row.cells[
                  i
                ] ||
                "",
                300
              );

            if (
              v &&
              /[A-Za-z]/.test(
                v
              ) &&
              !/^rebirth\b/i.test(
                v
              )
            ) {
              return directResult(
                v,
                page,
                "REVERSE_TABLE_RELATION",
                0.99
              );
            }
          }
        }

        for (
          const cell
          of row.cells.slice(
            1
          )
        ) {
          const v =
            clean(
              cell,
              300
            );

          if (
            v &&
            /[A-Za-z]/.test(
              v
            ) &&
            !/^rebirth\b/i.test(
              v
            ) &&
            !/^\$/.test(
              v
            ) &&
            !/^\d+(?:\.\d+)?[x×%]?$/i.test(
              v
            )
          ) {
            return directResult(
              v,
              page,
              "REVERSE_TABLE_RELATION",
              0.98
            );
          }
        }
      }
    }
  }

  return null;
}

function currentRebirthFromFullPage(
  page
) {
  if (
    clean(
      page?.title,
      300
    ).toLowerCase() !==
    "rebirth"
  ) {
    return null;
  }

  const numbers =
    new Set();

  for (
    const table
    of extractTables(
      page
    )
  ) {
    for (
      const row
      of table.rows
    ) {
      const m =
        row.text.match(
          /\brebirth\s*#?\s*(\d{1,3})\b/i
        ) ||
        row.cells[
          0
        ]?.match(
          /^\s*(\d{1,3})\s*$/
        );

      if (
        m
      ) {
        const n =
          Number(
            m[
              1
            ]
          );

        if (
          n >=
            1 &&
          n <=
            999
        ) {
          numbers.add(
            n
          );
        }
      }
    }
  }

  if (
    !numbers.size
  ) {
    for (
      const m
      of page.text.matchAll(
        /\brebirth\s*#?\s*(\d{1,3})\b/gi
      )
    ) {
      const n =
        Number(
          m[
            1
          ]
        );

      if (
        n >=
          1 &&
        n <=
          999
      ) {
        numbers.add(
          n
        );
      }
    }
  }

  if (
    !numbers.size
  ) {
    return null;
  }

  return directResult(
    `Rebirth${Math.max(
      ...numbers
    )}`,
    page,
    "FULL_REBIRTH_TABLE_MAX",
    0.985
  );
}

function directResult(
  value,
  page,
  claimType,
  confidence = 0.97
) {
  const answer =
    clean(
      value,
      400
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

function updateDirectResolve(
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

  const attr =
    inferAttribute(
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
    attr ===
    ATTR.DATE
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
      return directResult(
        date,
        page,
        "UPDATE_DATE"
      );
    }
  }

  if (
    attr ===
    ATTR.BRAINROT
  ) {
    if (
      /caylusaurus/i.test(
        text
      ) &&
      /caylus/i.test(
        text
      )
    ) {
      return directResult(
        "Caylusaurus",
        page,
        "UPDATE_BRAINROT",
        0.985
      );
    }

    const patterns = [
      /(?:limited(?:-quantity)? brainrot(?:s)?|new brainrot(?:s)?)[^A-Z]{0,40}([A-Z][A-Za-z0-9' .-]{2,70})/i,

      /(?:added|introduced)[^A-Z]{0,40}([A-Z][A-Za-z0-9' .-]{2,70})[^.]{0,90}\bbrainrot\b/i,
    ];

    for (
      const p
      of patterns
    ) {
      const m =
        text.match(
          p
        );

      if (
        m
      ) {
        return directResult(
          clean(
            m[
              1
            ],
            120
          ),
          page,
          "UPDATE_BRAINROT",
          0.97
        );
      }
    }
  }

  return null;
}

function canonicalDirectResolve(
  question,
  canonical
) {
  const attr =
    inferAttribute(
      question
    );

  const intent =
    canonical.intent;

  if (
    intent ===
    INTENT.CURRENT_REBIRTH
  ) {
    for (
      const page
      of canonical.pages
    ) {
      const r =
        currentRebirthFromFullPage(
          page
        );

      if (
        r
      ) {
        return r;
      }
    }
  }

  if (
    (
      attr ===
        ATTR.GEAR ||
      attr ===
        ATTR.REWARD
    ) &&
    extractRebirthNumber(
      question
    )
  ) {
    for (
      const page
      of canonical.pages
    ) {
      const r =
        findReverseTableRelation(
          question,
          page,
          attr
        );

      if (
        r
      ) {
        return r;
      }
    }
  }

  for (
    const page
    of canonical.pages
  ) {
    const update =
      updateDirectResolve(
        question,
        page
      );

    if (
      update
    ) {
      return update;
    }

    const info =
      parseInfobox(
        page
      );

    const infoVal =
      infoboxValue(
        info,
        attr
      );

    if (
      infoVal &&
      pageMatchesEntity(
        page,
        canonical.entityCandidates
      )
    ) {
      return directResult(
        infoVal,
        page,
        `INFOBOX_${attr}`,
        0.98
      );
    }

    const table =
      findEntityPropertyInTables(
        question,
        page,
        attr
      );

    if (
      table
    ) {
      return table;
    }
  }

  for (
    const page
    of canonical.pages
  ) {
    if (
      !pageMatchesEntity(
        page,
        canonical.entityCandidates
      )
    ) {
      continue;
    }

    const text =
      page.text;

    if (
      attr ===
      ATTR.COST
    ) {
      const m =
        text.match(
          /\bcosts?\s+\$?\s*(\d+(?:\.\d+)?\s*[KMBT]?)/i
        ) ||
        text.match(
          /\bcost\s+of\s+\$?\s*(\d+(?:\.\d+)?\s*[KMBT]?)/i
        );

      if (
        m
      ) {
        return directResult(
          `$${m[
            1
          ].replace(
            /\s+/g,
            ""
          )}`,
          page,
          "PROSE_COST",
          0.95
        );
      }
    }

    if (
      attr ===
      ATTR.INCOME
    ) {
      const m =
        text.match(
          /\b(?:income|makes?)\s+(?:of\s+)?\$?\s*(\d+(?:\.\d+)?\s*[KMBT]?)\s*\/\s*s/i
        );

      if (
        m
      ) {
        return directResult(
          `$${m[
            1
          ].replace(
            /\s+/g,
            ""
          )}/s`,
          page,
          "PROSE_INCOME",
          0.95
        );
      }
    }

    if (
      attr ===
      ATTR.RARITY
    ) {
      const m =
        text.match(
          /\bis\s+(?:an?|the)?\s*([A-Z][A-Za-z ]{2,40})\s+Brainrot\b/
        );

      if (
        m
      ) {
        return directResult(
          clean(
            m[
              1
            ],
            80
          ),
          page,
          "PROSE_RARITY",
          0.94
        );
      }
    }
  }

  return null;
}

function tavilyQueries(
  question
) {
  const entity =
    bestEntitySearchQuery(
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

  const out =
    [];

  if (
    update
  ) {
    out.push(
      `site:stealabrainrot.fandom.com/wiki/Update_Log "Update ${update}"`
    );
  }

  if (
    entity
  ) {
    out.push(
      `site:stealabrainrot.fandom.com/wiki "${entity}"`
    );
  }

  for (
    const hub
    of hubTitlesForQuestion(
      question
    ).slice(
      0,
      2
    )
  ) {
    out.push(
      `site:stealabrainrot.fandom.com/wiki/${hub.replace(
        / /g,
        "_"
      )} ${q}`
    );
  }

  out.push(
    `site:stealabrainrot.fandom.com/wiki ${q}`
  );

  out.push(
    `"Steal a Brainrot" ${q}`
  );

  return [
    ...new Set(
      out
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
                3000
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

  const settled =
    await Promise.allSettled([
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
    ]);

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
          16000
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
          3000
        ),
    })
  );
}

function answerInstruction(
  attr
) {
  switch (
    attr
  ) {
    case ATTR.REBIRTH:
      return "Return only Rebirth<number>.";

    case ATTR.GEAR:
      return "Return only the gear/item name.";

    case ATTR.BRAINROT:
      return "Return only the Brainrot proper name.";

    case ATTR.COST:
      return "Return only the cost such as $10M.";

    case ATTR.INCOME:
      return "Return only the income such as $50K/s.";

    case ATTR.RARITY:
      return "Return only the rarity.";

    case ATTR.STATUS:
      return "Return only the status.";

    case ATTR.MULTIPLIER:
      return "Return only the multiplier such as 10x.";

    case ATTR.DATE:
      return "Return only the date/year.";

    case ATTR.DROP_RATE:
      return "Return only the chance/percentage.";

    case ATTR.REQUIREMENT:
      return "Return only the requirement.";

    case ATTR.SPAWN:
      return "Return only what it spawns.";

    case ATTR.FORMATION:
      return "Return only the formation.";

    case ATTR.WEATHER:
      return "Return only the weather.";

    case ATTR.REWARD:
      return "Return only the reward.";

    case ATTR.CONTENTS:
      return "Return only the requested contents.";

    case ATTR.SLOTS:
      return "Return only the slot count.";

    case ATTR.FLOORS:
      return "Return only the floor count.";

    default:
      return "Return only the shortest exact answer.";
  }
}

function evidenceSupportsAnswer(
  question,
  answer,
  evidenceRow
) {
  const attr =
    inferAttribute(
      question
    );

  const text =
    evidenceRow.text;

  if (
    norm(
      answer
    ) &&
    norm(
      text
    ).includes(
      norm(
        answer
      )
    )
  ) {
    return true;
  }

  if (
    attr ===
    ATTR.REBIRTH
  ) {
    const m =
      answer.match(
        /\brebirth\s*#?\s*(\d{1,3})\b/i
      );

    return Boolean(
      m &&
      new RegExp(
        `rebirth\\s*#?\\s*${Number(
          m[
            1
          ]
        )}`,
        "i"
      ).test(
        text
      )
    );
  }

  if (
    attr ===
    ATTR.COST
  ) {
    return text
      .replace(
        /\s+/g,
        ""
      )
      .includes(
        answer.replace(
          /\s+/g,
          ""
        )
      );
  }

  if (
    attr ===
    ATTR.MULTIPLIER
  ) {
    const m =
      answer.match(
        /\d+(?:\.\d+)?\s*[x×]/i
      );

    if (
      !m
    ) {
      return false;
    }

    const num =
      m[
        0
      ].replace(
        /[x×\s]/gi,
        ""
      );

    return new RegExp(
      `\\b${num}\\s*[x×]`,
      "i"
    ).test(
      text
    );
  }

  return false;
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

  const attr =
    inferAttribute(
      question
    );

  const system = [
    "You are a strict Steal a Brainrot evidence resolver.",

    "Use ONLY supplied evidence. Never use outside knowledge.",

    "CANONICAL_FULL_PAGE evidence is stronger than WEB_SNIPPET evidence.",

    "Understand tables in both directions.",

    "If an entity page contains a small information table, those fields belong to that entity even if its name is not repeated in the row.",

    "Do not mistake a table's first column for the requested answer. Use the question's requested attribute.",

    "A truncated web snippet is not proof of a current maximum.",

    "If evidence does not directly support the answer, return UNKNOWN.",

    answerInstruction(
      attr
    ),

    '{"answer":"value or UNKNOWN","confidence":0.0,"citedIds":["C1"],"reason":"short_reason"}',
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

                      attribute:
                        attr,

                      entities:
                        candidateEntities(
                          question
                        ),

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
        400
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

    const supporting =
      cited.filter(
        (
          row
        ) =>
          evidenceSupportsAnswer(
            question,
            answer,
            row
          )
      );

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

function getCachedAnswer(
  question
) {
  return cacheGet(
    ANSWER_CACHE,
    norm(
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

    norm(
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
  return {
    answer:
      clean(
        question?.aiAnswer ||
          "UNKNOWN",
        400
      ),

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
      inferAttribute(
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

  const candidateAnswer =
    direct?.candidateAnswer ||
    ai?.candidateAnswer ||
    advisory.answer ||
    "UNKNOWN";

  return finalize(
    {
      answer:
        "UNKNOWN",

      candidateAnswer:
        clean(
          candidateAnswer,
          400
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
            400
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
        90
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

function directWithPages(
  question,
  pages
) {
  return canonicalDirectResolve(
    question,
    {
      intent:
        inferIntent(
          question
        ),

      pages,

      errors:
        [],

      titles:
        pages.map(
          (
            p
          ) =>
            p.title
        ),

      entityCandidates:
        candidateEntities(
          question
        ),
    }
  );
}

function runSelfTests() {
  let passed = 0;
  const failures = [];

  const check = (
    name,
    condition,
    detail = ""
  ) => {
    if (condition) {
      passed++;
    } else {
      failures.push({
        name,

        detail:
          clean(
            detail,
            200
          ),
      });
    }
  };

  check(
    "attr rainbow multiplier",
    inferAttribute(
      "What multiplier does the Rainbow mutation give?"
    ) ===
      ATTR.MULTIPLIER
  );

  check(
    "attr ritual requirement",
    inferAttribute(
      "What does the Bombardiro Crocodilo ritual require?"
    ) ===
      ATTR.REQUIREMENT
  );

  check(
    "attr tralalero cost",
    inferAttribute(
      "How much does Tralalero Tralala cost?"
    ) ===
      ATTR.COST
  );

  check(
    "categoryless intent",
    inferIntent(
      "How much does Tralalero Tralala cost?"
    ) ===
      INTENT.ENTITY_PROPERTY
  );

  check(
    "entity tralalero",
    candidateEntities(
      "How much does Tralalero Tralala cost?"
    ).some(
      (
        x
      ) =>
        x
          .toLowerCase()
          .includes(
            "tralalero tralala"
          )
    )
  );

  check(
    "update decimal",
    extractUpdateNumber(
      "What limited brainrot was introduced in Update 52.75?"
    ) ===
      "52.75"
  );

  check(
    "rebirth number",
    extractRebirthNumber(
      "What gear is unlocked at Rebirth 18?"
    ) ===
      18
  );

  const mutationPage =
    syntheticPage(
      "Mutations",

      `<table>
         <tr>
           <th>Multi</th>
           <th>Name</th>
           <th>Notes</th>
         </tr>
         <tr>
           <td>1.25×</td>
           <td>Gold</td>
           <td>Gold.</td>
         </tr>
         <tr>
           <td>10×</td>
           <td>Rainbow</td>
           <td>Rainbow mutation.</td>
         </tr>
       </table>`
    );

  check(
    "rainbow multiplier exact",

    directWithPages(
      "What multiplier does the Rainbow mutation give?",
      [
        mutationPage,
      ]
    )?.answer ===
      "10x"
  );

  const ritualPage =
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
           <td>Bombardiro Crocodilo ritual</td>
           <td>Los Crocodillitos</td>
           <td>Bombardiro Crocodilo x3</td>
           <td>Line formation</td>
           <td>Explosive</td>
         </tr>
       </table>`
    );

  check(
    "bombardiro requirement exact",

    directWithPages(
      "What does the Bombardiro Crocodilo ritual require?",
      [
        ritualPage,
      ]
    )?.answer ===
      "Bombardiro Crocodilo x3"
  );

  check(
    "bombardiro spawn reverse",

    directWithPages(
      "What does the Bombardiro Crocodilo ritual spawn?",
      [
        ritualPage,
      ]
    )?.answer ===
      "Los Crocodillitos"
  );

  const tralaleroPage =
    syntheticPage(
      "Tralalero Tralala",

      `<h2>Information</h2>
       <table>
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
    "tralalero cost exact page context",

    directWithPages(
      "How much does Tralalero Tralala cost?",
      [
        tralaleroPage,
      ]
    )?.answer ===
      "$10M"
  );

  check(
    "tralalero income exact page context",

    directWithPages(
      "What income does Tralalero Tralala make per second?",
      [
        tralaleroPage,
      ]
    )?.answer ===
      "$50K/s"
  );

  const rebirthPage =
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
       </table>`
    );

  check(
    "giant potion rebirth",

    directWithPages(
      "Which rebirth unlocks the Giant Potion?",
      [
        rebirthPage,
      ]
    )?.answer ===
      "Rebirth17"
  );

  check(
    "rebirth 18 reverse gear",

    directWithPages(
      "What gear is unlocked at Rebirth 18?",
      [
        rebirthPage,
      ]
    )?.answer ===
      "Flash Teleport"
  );

  check(
    "current rebirth max",

    directWithPages(
      "What is the newest rebirth right now?",
      [
        rebirthPage,
      ]
    )?.answer ===
      "Rebirth18"
  );

  for (
    let i =
      1;
    i <=
    180;
    i++
  ) {
    const page =
      syntheticPage(
        "Mutations",

        `<table>
           <tr>
             <th>Multi</th>
             <th>Name</th>
           </tr>
           <tr>
             <td>${i}x</td>
             <td>AlphaMut ${i}</td>
           </tr>
         </table>`
      );

    check(
      `mutation multiplier ${i}`,

      directWithPages(
        `What multiplier does AlphaMut ${i} give?`,
        [
          page,
        ]
      )?.answer ===
        `${i}x`
    );
  }

  for (
    let i =
      1;
    i <=
    160;
    i++
  ) {
    const page =
      syntheticPage(
        `Entity ${i}`,

        `<table>
           <tr>
             <th>Income</th>
             <th>Cost</th>
           </tr>
           <tr>
             <td>$${i}K/s</td>
             <td>$${i}M</td>
           </tr>
         </table>`
      );

    check(
      `entity cost context ${i}`,

      directWithPages(
        `How much does Entity ${i} cost?`,
        [
          page,
        ]
      )?.answer ===
        `$${i}M`
    );

    check(
      `entity income context ${i}`,

      directWithPages(
        `What income does Entity ${i} make per second?`,
        [
          page,
        ]
      )?.answer ===
        `$${i}K/s`
    );
  }

  for (
    let i =
      1;
    i <=
    120;
    i++
  ) {
    const page =
      syntheticPage(
        "Rituals",

        `<table>
           <tr>
             <th>Name</th>
             <th>Spawns</th>
             <th>Requires</th>
           </tr>
           <tr>
             <td>AlphaRit ${i}</td>
             <td>AlphaSpawn ${i}</td>
             <td>AlphaThing ${i} x3</td>
           </tr>
         </table>`
      );

    check(
      `ritual req ${i}`,

      directWithPages(
        `What does AlphaRit ${i} ritual require?`,
        [
          page,
        ]
      )?.answer ===
        `AlphaThing ${i} x3`
    );

    check(
      `ritual spawn ${i}`,

      directWithPages(
        `What does AlphaRit ${i} ritual spawn?`,
        [
          page,
        ]
      )?.answer ===
        `AlphaSpawn ${i}`
    );
  }

  for (
    let i =
      1;
    i <=
    100;
    i++
  ) {
    const page =
      syntheticPage(
        "Rebirth",

        `<table>
           <tr>
             <th>Rebirth</th>
             <th>Gear</th>
           </tr>
           <tr>
             <td>Rebirth ${i}</td>
             <td>AlphaGear ${i}</td>
           </tr>
           <tr>
             <td>Rebirth ${i + 1}</td>
             <td>AlphaGear ${i + 1}</td>
           </tr>
         </table>`
      );

    check(
      `rebirth forward ${i}`,

      directWithPages(
        `Which rebirth unlocks AlphaGear ${i}?`,
        [
          page,
        ]
      )?.answer ===
        `Rebirth${i}`
    );

    check(
      `rebirth reverse ${i}`,

      directWithPages(
        `What gear is unlocked at Rebirth ${i}?`,
        [
          page,
        ]
      )?.answer ===
        `AlphaGear ${i}`
    );
  }

  for (
    let i =
      1;
    i <=
    80;
    i++
  ) {
    const page =
      syntheticPage(
        "Lucky Blocks",

        `<table>
           <tr>
             <th>Name</th>
             <th>Chance</th>
           </tr>
           <tr>
             <td>AlphaDrop ${i}</td>
             <td>${i}%</td>
           </tr>
         </table>`
      );

    check(
      `drop rate ${i}`,

      directWithPages(
        `What is the drop rate of AlphaDrop ${i}?`,
        [
          page,
        ]
      )?.answer ===
        `${i}%`
    );
  }

  for (
    let i =
      1;
    i <=
    15;
    i++
  ) {
    check(
      `header cost ${i}`,
      normalizeHeader(
        i %
        2
          ? "Price"
          : "Cost"
      ) ===
        ATTR.COST
    );

    check(
      `header income ${i}`,
      normalizeHeader(
        i %
        2
          ? "Income"
          : "Money per second"
      ) ===
        ATTR.INCOME
    );

    check(
      `header req ${i}`,
      normalizeHeader(
        i %
        2
          ? "Requires"
          : "Requirement"
      ) ===
        ATTR.REQUIREMENT
    );

    check(
      `header chance ${i}`,
      normalizeHeader(
        i %
        2
          ? "Chance"
          : "Drop Rate"
      ) ===
        ATTR.DROP_RATE
    );

    check(
      `format rebirth ${i}`,
      normalizeValue(
        `Rebirth ${i}`,
        ATTR.REBIRTH
      ) ===
        `Rebirth${i}`
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
      "Deterministic parser/routing tests only. Live upstream checks use ?test=wiki, ?test=resolve, and ?test=search.",
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
            4800
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

          tableCount:
            extractTables(
              page
            ).length,

          infoboxKeys:
            Object.keys(
              parseInfobox(
                page
              )
            ).slice(
              0,
              25
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
          "What multiplier does the Rainbow mutation give?",
        700
      );

    const started =
      nowMs();

    try {
      const canonical =
        await canonicalPagesForQuestion(
          q,
          started +
            5200
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
            inferAttribute(
              q
            ),

          entities:
            canonical.entityCandidates,

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

                tableCount:
                  extractTables(
                    p
                  ).length,
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
          "What multiplier does the Rainbow mutation give?",

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
        entityFirstResolution:
          true,

        categorylessEntityQuestions:
          true,

        fullFandomPageFirst:
          true,

        everyTableParsedIndependently:
          true,

        normalizedColumnSemantics:
          true,

        exactEntityPageContextTables:
          true,

        bidirectionalTableRelations:
          true,

        updateSectionRouting:
          true,

        fullPageCurrentRebirth:
          true,

        infoboxAndInformationTables:
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
