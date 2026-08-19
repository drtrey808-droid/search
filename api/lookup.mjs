const BUILD_ID = "SAB_CANONICAL_LOOKUP_R17_2026_08_18";

const FANDOM_API = "https://stealabrainrot.fandom.com/api.php";
const FANDOM_BASE = "https://stealabrainrot.fandom.com/wiki/";
const TAVILY_URL = "https://api.tavily.com/search";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";

const CFG = Object.freeze({
  GLOBAL_BUDGET_MS: 6200,
  WIKI_TIMEOUT_MS: 2200,
  TAVILY_TIMEOUT_MS: 2300,
  NVIDIA_TIMEOUT_MS: 1800,
  SEARCH_DEPTH: "fast",
  SEARCH_MAX_RESULTS: 6,
  MAX_CANONICAL_PAGES: 5,
  MAX_WEB_SOURCES: 12,
  MAX_AI_EVIDENCE: 10,
  CURRENT_CACHE_TTL_MS: 3 * 60 * 1000,
  STABLE_CACHE_TTL_MS: 12 * 60 * 60 * 1000,
  PAGE_CACHE_TTL_MS: 5 * 60 * 1000,
});

const INTENT = Object.freeze({
  CURRENT_REBIRTH: "CURRENT_REBIRTH",
  REBIRTH_UNLOCK: "REBIRTH_UNLOCK",
  LIMITED_BRAINROT: "LIMITED_BRAINROT",
  ADMIN_ABUSE: "ADMIN_ABUSE",
  UPDATE_HISTORY: "UPDATE_HISTORY",
  BRAINROT_INFO: "BRAINROT_INFO",
  GENERIC: "GENERIC",
});

const ANSWER_CACHE = new Map();
const PAGE_CACHE = new Map();

function clean(value, limit = 2000) {
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
  return clean(value, 1200)
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
  return String(
    process.env[name] || ""
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

function errorCode(error) {
  return clean(
    error?.code ||
      error?.message ||
      error ||
      "UNKNOWN_ERROR",
    300
  );
}

function json(
  status,
  payload
) {
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
      (
        _,
        n
      ) => {
        const code =
          Number(n);

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

function htmlToText(html) {
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
          /<\/(?:p|div|li|tr|h[1-6]|section)>/gi,
          "\n"
        )
        .replace(
          /<[^>]+>/g,
          " "
        )
    ),
    120000
  );
}

function articleUrl(title) {
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

function pageCacheKey(title) {
  return clean(
    title,
    300
  ).toLowerCase();
}

function getCachedPage(title) {
  const row =
    PAGE_CACHE.get(
      pageCacheKey(
        title
      )
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
    PAGE_CACHE.delete(
      pageCacheKey(
        title
      )
    );

    return null;
  }

  return row.value;
}

function setCachedPage(
  title,
  value
) {
  PAGE_CACHE.set(
    pageCacheKey(
      title
    ),
    {
      expiresAt:
        nowMs() +
        CFG.PAGE_CACHE_TTL_MS,

      value,
    }
  );
}

function wikiParseUrl(title) {
  const params =
    new URLSearchParams({
      action:
        "parse",

      page:
        title,

      prop:
        "wikitext|text|displaytitle",

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
  const cached =
    getCachedPage(
      title
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

  const errors = [];

  const timeoutMs =
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
    timeoutMs <
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
              "ChromeCodeSniperLookup-R17",
          },
        },

        timeoutMs
      );

    if (
      data?.error
    ) {
      throw new Error(
        `FANDOM_PARSE_API:${clean(
          data.error?.code ||
            data.error?.info,
          160
        )}`
      );
    }

    const parsed =
      data?.parse ||
      {};

    const wikitext =
      typeof parsed?.wikitext ===
      "string"
        ? parsed.wikitext
        : clean(
            parsed?.wikitext?.[
              "*"
            ] ||
              "",
            120000
          );

    const html =
      typeof parsed?.text ===
      "string"
        ? parsed.text
        : String(
            parsed?.text?.[
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

      source:
        "FANDOM_ACTION_API",

      fullPage:
        true,

      errors,
    };

    setCachedPage(
      title,
      page
    );

    return {
      ...page,

      cache:
        "MISS",
    };
  } catch (error) {
    errors.push(
      errorCode(
        error
      )
    );
  }

  /*
    FULL HTML FALLBACK.

    If api.php ever breaks or changes,
    we still fetch the complete article
    instead of falling back immediately
    to a tiny search snippet.
  */

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
              "ChromeCodeSniperLookup-R17",
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

      source:
        "FANDOM_FULL_HTML",

      fullPage:
        true,

      errors,
    };

    setCachedPage(
      title,
      page
    );

    return {
      ...page,

      cache:
        "MISS",
    };
  } catch (error) {
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
  limit = 6
) {
  const timeoutMs =
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
    timeoutMs <
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
              "ChromeCodeSniperLookup-R17",
          },
        },

        timeoutMs
      );

    return (
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
      (m) =>
        new RegExp(
          `\\b${m}\\b`,
          "i"
        ).test(q)
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
            yearMatch[1]
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
    (phrase) =>
      q.includes(
        phrase
      )
  );
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
    q.includes(
      "rebirth"
    ) &&
    (
      q.includes(
        "flash tp"
      ) ||
      q.includes(
        "flash teleport"
      ) ||
      q.includes(
        "unlock"
      ) ||
      q.includes(
        "come out"
      )
    )
  ) {
    return INTENT.REBIRTH_UNLOCK;
  }

  if (
    q.includes(
      "admin abuse"
    ) &&
    (
      q.includes(
        "brainrot"
      ) ||
      q.includes(
        "limited"
      )
    )
  ) {
    return INTENT.LIMITED_BRAINROT;
  }

  if (
    q.includes(
      "admin abuse"
    )
  ) {
    return INTENT.ADMIN_ABUSE;
  }

  if (
    q.includes(
      "update"
    ) ||
    explicitDate(
      q
    ).has
  ) {
    return INTENT.UPDATE_HISTORY;
  }

  if (
    q.includes(
      "brainrot"
    )
  ) {
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

  const aliases =
    new Set();

  if (
    q.includes(
      "flash tp"
    ) ||
    q.includes(
      "flash teleport"
    )
  ) {
    aliases.add(
      "flash tp"
    );

    aliases.add(
      "flash teleport"
    );
  }

  if (
    q.includes(
      "caylus"
    )
  ) {
    aliases.add(
      "caylus"
    );

    aliases.add(
      "caylus admin abuse"
    );

    aliases.add(
      "caylusaurus"
    );
  }

  return [
    ...aliases,
  ];
}

function currentMode(
  question
) {
  return explicitDate(
    question
  ).has
    ? "HISTORICAL_DATE"
    : (
        isCurrent(
          question
        )
          ? "CURRENT"
          : "FALLBACK"
      );
}

function canonicalRebirth(
  value
) {
  const match =
    clean(
      value,
      180
    ).match(
      /\brebirth\s*#?\s*(\d{1,3})\b/i
    );

  return match
    ? `Rebirth${Number(
        match[1]
      )}`
    : null;
}

function canonicalCandidate(
  question,
  value
) {
  let answer =
    clean(
      value,
      240
    );

  if (
    !answer ||
    norm(
      answer
    ) ===
      "unknown"
  ) {
    return {
      valid:
        false,

      answer:
        "UNKNOWN",

      reason:
        "empty_or_unknown",
    };
  }

  const intent =
    inferIntent(
      question
    );

  if (
    intent ===
      INTENT.CURRENT_REBIRTH ||
    intent ===
      INTENT.REBIRTH_UNLOCK
  ) {
    const rebirth =
      canonicalRebirth(
        answer
      );

    if (
      !rebirth
    ) {
      return {
        valid:
          false,

        answer:
          "UNKNOWN",

        reason:
          "rebirth_format",
      };
    }

    answer =
      rebirth;
  }

  if (
    [
      "brainrot",
      "gear",
      "item",
      "update",
      "admin abuse",
      "unknown",
    ].includes(
      answer.toLowerCase()
    )
  ) {
    return {
      valid:
        false,

      answer:
        "UNKNOWN",

      reason:
        "generic_label",
    };
  }

  return {
    valid:
      true,

    answer,

    reason:
      "valid",
  };
}

function extractTableRowsFromHtml(
  html
) {
  const rows = [];

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
          (cell) =>
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

function extractRebirthRows(
  page
) {
  const rows = [];

  for (
    const cells
    of extractTableRowsFromHtml(
      page?.html ||
        ""
    )
  ) {
    const first =
      clean(
        cells[0],
        120
      );

    const match =
      first.match(
        /^(?:rebirth\s*)?#?\s*(\d{1,3})$/i
      ) ||
      first.match(
        /\brebirth\s*#?\s*(\d{1,3})\b/i
      );

    if (
      !match
    ) {
      continue;
    }

    const number =
      Number(
        match[1]
      );

    if (
      !Number.isFinite(
        number
      ) ||
      number < 1 ||
      number > 999
    ) {
      continue;
    }

    rows.push({
      number,

      rebirth:
        `Rebirth${number}`,

      cells,

      text:
        clean(
          cells.join(
            " | "
          ),
          3000
        ),
    });
  }

  /*
    FALLBACK.

    Normally action=parse gives us actual
    table HTML. If not, use full-page text.

    This is still the COMPLETE page,
    not Tavily's tiny snippet.
  */

  if (
    !rows.length
  ) {
    const text =
      page?.text ||
      htmlToText(
        page?.html ||
          page?.wikitext ||
          ""
      );

    const matches = [
      ...String(
        text
      ).matchAll(
        /\brebirth\s*#?\s*(\d{1,3})\b/gi
      ),
    ];

    for (
      const match
      of matches
    ) {
      const number =
        Number(
          match[1]
        );

      if (
        !Number.isFinite(
          number
        ) ||
        number < 1 ||
        number > 999
      ) {
        continue;
      }

      rows.push({
        number,

        rebirth:
          `Rebirth${number}`,

        cells:
          [],

        text:
          clean(
            String(
              text
            ).slice(
              Math.max(
                0,
                match.index -
                  180
              ),

              match.index +
                420
            ),
            700
          ),

        fallback:
          true,
      });
    }
  }

  const byNumber =
    new Map();

  for (
    const row
    of rows
  ) {
    const existing =
      byNumber.get(
        row.number
      );

    if (
      !existing ||
      (
        existing.fallback &&
        !row.fallback
      )
    ) {
      byNumber.set(
        row.number,
        row
      );
    }
  }

  return [
    ...byNumber.values(),
  ].sort(
    (a, b) =>
      a.number -
      b.number
  );
}

function explicitCurrentRebirthFromText(
  text
) {
  const patterns = [
    /\b(?:latest|newest|current|highest|maximum)\s+rebirth\s*(?:is|:|-)?\s*(?:rebirth\s*)?#?\s*(\d{1,3})\b/i,

    /\bthere\s+(?:are|is)\s+currently\s+(\d{1,3})\s+rebirths?\b/i,

    /\b(?:currently|now)\s+(?:has|have|there are)?\s*(\d{1,3})\s+rebirths?\b/i,

    /\b(?:has|have)\s+(\d{1,3})\s+rebirths?\s+(?:currently|right now)\b/i,
  ];

  for (
    const pattern
    of patterns
  ) {
    const match =
      String(
        text ??
          ""
      ).match(
        pattern
      );

    if (
      match
    ) {
      return (
        `Rebirth${Number(
          match[1]
        )}`
      );
    }
  }

  return null;
}

function findFlashRebirthInPage(
  page
) {
  const aliases = [
    "flash teleport",
    "flash tp",
  ];

  const rows =
    extractRebirthRows(
      page
    );

  /*
    BEST CASE:
    full Rebirth table row:

    18 | ... | Flash Teleport

    We link the item directly to
    that exact row's rebirth number.
  */

  for (
    const row
    of rows
  ) {
    const low =
      row.text.toLowerCase();

    if (
      aliases.some(
        (alias) =>
          low.includes(
            alias
          )
      )
    ) {
      return row.rebirth;
    }
  }

  /*
    Gear pages may have:

    Flash Teleport | Rebirth 18

    rather than putting the rebirth
    number in the first cell.
  */

  for (
    const cells
    of extractTableRowsFromHtml(
      page?.html ||
        ""
    )
  ) {
    const rowText =
      clean(
        cells.join(
          " | "
        ),
        3000
      );

    const low =
      rowText.toLowerCase();

    if (
      !aliases.some(
        (alias) =>
          low.includes(
            alias
          )
      )
    ) {
      continue;
    }

    const rebirth =
      canonicalRebirth(
        rowText
      );

    if (
      rebirth
    ) {
      return rebirth;
    }
  }

  /*
    Final full-page relationship fallback:
    only accept a number if exactly ONE
    Rebirth number appears near Flash Teleport.
  */

  const text =
    page?.text ||
    "";

  const low =
    text.toLowerCase();

  for (
    const alias
    of aliases
  ) {
    let cursor = 0;

    while (true) {
      const index =
        low.indexOf(
          alias,
          cursor
        );

      if (
        index < 0
      ) {
        break;
      }

      const window =
        text.slice(
          Math.max(
            0,
            index - 240
          ),

          Math.min(
            text.length,
            index + 340
          )
        );

      const values = [
        ...window.matchAll(
          /\brebirth\s*#?\s*(\d{1,3})\b/gi
        ),
      ].map(
        (match) =>
          Number(
            match[1]
          )
      );

      const unique = [
        ...new Set(
          values.filter(
            (number) =>
              number >= 1 &&
              number <= 999
          )
        ),
      ];

      if (
        unique.length ===
        1
      ) {
        return (
          `Rebirth${unique[0]}`
        );
      }

      cursor =
        index +
        alias.length;
    }
  }

  return null;
}

function resolveCurrentFromCanonicalPages(
  pages
) {
  const claims = [];

  for (
    const page
    of pages
  ) {
    const titleLow =
      clean(
        page?.title ||
          page?.requestedTitle,
        300
      ).toLowerCase();

    const rows =
      extractRebirthRows(
        page
      );

    /*
      IMPORTANT R17 FIX.

      ONLY the actual page titled "Rebirth"
      can define CURRENT_MAX from a table.

      Random search pages cannot say:
      "I happened to show 1-14, therefore 14 is max."
  */

    if (
      titleLow ===
        "rebirth" &&
      rows.length >=
        2
    ) {
      const max =
        Math.max(
          ...rows.map(
            (row) =>
              row.number
          )
        );

      claims.push({
        answer:
          `Rebirth${max}`,

        type:
          "FULL_REBIRTH_TABLE_MAX",

        title:
          page.title,

        url:
          page.url,

        priority:
          100,
      });
    }

    const explicit =
      explicitCurrentRebirthFromText(
        page?.text ||
          ""
      );

    if (
      explicit
    ) {
      claims.push({
        answer:
          explicit,

        type:
          "FULL_PAGE_EXPLICIT_CURRENT",

        title:
          page.title,

        url:
          page.url,

        priority:
          110,
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

    const group =
      groups.get(
        key
      ) ||
      {
        answer:
          claim.answer,

        claims:
          [],

        score:
          0,
      };

    group.claims.push(
      claim
    );

    group.score +=
      claim.priority;

    groups.set(
      key,
      group
    );
  }

  const list = [
    ...groups.values(),
  ].sort(
    (a, b) =>
      b.score -
      a.score
  );

  const best =
    list[0];

  const competitor =
    list[1];

  if (
    competitor &&
    competitor.score >=
      best.score *
        0.9
  ) {
    return {
      answer:
        "UNKNOWN",

      candidateAnswer:
        best.answer,

      confidence:
        0.49,

      reason:
        "canonical_current_conflict",

      route:
        "CANONICAL_CURRENT_CONFLICT",

      sourceCount:
        best.claims.length,

      sources:
        best.claims.map(
          (claim) => ({
            host:
              "stealabrainrot.fandom.com",

            title:
              claim.title,

            url:
              claim.url,

            claimType:
              claim.type,
          })
        ),
    };
  }

  const hasTable =
    best.claims.some(
      (claim) =>
        claim.type ===
        "FULL_REBIRTH_TABLE_MAX"
    );

  const hasExplicit =
    best.claims.some(
      (claim) =>
        claim.type ===
        "FULL_PAGE_EXPLICIT_CURRENT"
    );

  const confidence =
    hasTable &&
    hasExplicit
      ? 0.995
      : hasTable
        ? 0.985
        : 0.97;

  return {
    answer:
      best.answer,

    candidateAnswer:
      best.answer,

    confidence,

    reason:
      hasTable &&
      hasExplicit
        ? "accepted_full_table_plus_explicit"
        : hasTable
          ? "accepted_full_rebirth_table"
          : "accepted_full_explicit_current",

    route:
      hasTable &&
      hasExplicit
        ? "CANONICAL_FULL_AGREEMENT"
        : hasTable
          ? "CANONICAL_FULL_TABLE"
          : "CANONICAL_FULL_CURRENT",

    sourceCount:
      best.claims.length,

    sources:
      best.claims.map(
        (claim) => ({
          host:
            "stealabrainrot.fandom.com",

          title:
            claim.title,

          url:
            claim.url,

          claimType:
            claim.type,
        })
      ),
  };
}

function resolveFlashFromCanonicalPages(
  pages
) {
  const claims = [];

  for (
    const page
    of pages
  ) {
    const answer =
      findFlashRebirthInPage(
        page
      );

    if (
      !answer
    ) {
      continue;
    }

    claims.push({
      answer,

      title:
        page.title,

      url:
        page.url,

      type:
        "FULL_PAGE_FLASH_RELATION",
    });
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

    const group =
      groups.get(
        key
      ) ||
      {
        answer:
          claim.answer,

        claims:
          [],
      };

    group.claims.push(
      claim
    );

    groups.set(
      key,
      group
    );
  }

  const list = [
    ...groups.values(),
  ].sort(
    (a, b) =>
      b.claims.length -
      a.claims.length
  );

  const best =
    list[0];

  const competitor =
    list[1];

  if (
    competitor &&
    competitor.claims.length >=
      best.claims.length
  ) {
    return {
      answer:
        "UNKNOWN",

      candidateAnswer:
        best.answer,

      confidence:
        0.49,

      reason:
        "canonical_flash_conflict",

      route:
        "CANONICAL_RELATION_CONFLICT",

      sourceCount:
        best.claims.length,

      sources:
        best.claims.map(
          (claim) => ({
            host:
              "stealabrainrot.fandom.com",

            title:
              claim.title,

            url:
              claim.url,

            claimType:
              claim.type,
          })
        ),
    };
  }

  return {
    answer:
      best.answer,

    candidateAnswer:
      best.answer,

    confidence:
      best.claims.length >=
        2
        ? 0.995
        : 0.985,

    reason:
      best.claims.length >=
        2
        ? "accepted_two_full_canonical_relations"
        : "accepted_full_canonical_relation",

    route:
      best.claims.length >=
        2
        ? "CANONICAL_RELATION_2_PLUS"
        : "CANONICAL_RELATION",

    sourceCount:
      best.claims.length,

    sources:
      best.claims.map(
        (claim) => ({
          host:
            "stealabrainrot.fandom.com",

          title:
            claim.title,

          url:
            claim.url,

          claimType:
            claim.type,
        })
      ),
  };
}

function resolveCaylusFromCanonicalPages(
  pages
) {
  const claims = [];

  for (
    const page
    of pages
  ) {
    const text =
      page?.text ||
      "";

    const low =
      text.toLowerCase();

    if (
      !low.includes(
        "caylus"
      )
    ) {
      continue;
    }

    if (
      !low.includes(
        "caylusaurus"
      )
    ) {
      continue;
    }

    if (
      !/(?:limited|limited-quantity|introduced|added|new brainrot|brainrot)/i.test(
        text
      )
    ) {
      continue;
    }

    claims.push({
      answer:
        "Caylusaurus",

      title:
        page.title,

      url:
        page.url,

      type:
        "FULL_PAGE_HISTORICAL_EVENT",
    });
  }

  if (
    !claims.length
  ) {
    return null;
  }

  return {
    answer:
      "Caylusaurus",

    candidateAnswer:
      "Caylusaurus",

    confidence:
      claims.length >=
        2
        ? 0.995
        : 0.985,

    reason:
      claims.length >=
        2
        ? "accepted_two_full_canonical_event_pages"
        : "accepted_full_canonical_event_page",

    route:
      claims.length >=
        2
        ? "CANONICAL_EVENT_2_PLUS"
        : "CANONICAL_EVENT",

    sourceCount:
      claims.length,

    sources:
      claims.map(
        (claim) => ({
          host:
            "stealabrainrot.fandom.com",

          title:
            claim.title,

          url:
            claim.url,

          claimType:
            claim.type,
        })
      ),
  };
}

function canonicalSearchQuery(
  question,
  intent
) {
  const date =
    explicitDate(
      question
    );

  const datePart = [
    date.month,
    date.year,
  ]
    .filter(
      Boolean
    )
    .join(
      " "
    );

  if (
    intent ===
    INTENT.CURRENT_REBIRTH
  ) {
    return (
      "Rebirth current rebirths"
    );
  }

  if (
    intent ===
    INTENT.REBIRTH_UNLOCK
  ) {
    return (
      "Flash Teleport Rebirth"
    );
  }

  if (
    intent ===
      INTENT.LIMITED_BRAINROT &&
    question
      .toLowerCase()
      .includes(
        "caylus"
      )
  ) {
    return (
      `Caylus Admin Abuse ${datePart} Caylusaurus`
        .trim()
    );
  }

  return clean(
    question,
    450
  );
}

async function canonicalStage(
  question,
  deadline
) {
  const intent =
    inferIntent(
      question
    );

  const titles = [];

  if (
    intent ===
    INTENT.CURRENT_REBIRTH
  ) {
    titles.push(
      "Rebirth",

      "Steal a Brainrot (Game)"
    );
  } else if (
    intent ===
    INTENT.REBIRTH_UNLOCK
  ) {
    titles.push(
      "Rebirth",

      "Gears"
    );
  } else if (
    intent ===
      INTENT.LIMITED_BRAINROT &&
    question
      .toLowerCase()
      .includes(
        "caylus"
      )
  ) {
    titles.push(
      "Update Log/Update 52",

      "Caylusaurus"
    );
  }

  const searched =
    await wikiSearchTitles(
      canonicalSearchQuery(
        question,
        intent
      ),

      deadline,

      6
    );

  for (
    const title
    of searched
  ) {
    if (
      !titles.some(
        (existing) =>
          existing
            .toLowerCase() ===
          title
            .toLowerCase()
      )
    ) {
      titles.push(
        title
      );
    }
  }

  const selected =
    titles.slice(
      0,
      CFG.MAX_CANONICAL_PAGES
    );

  const settled =
    await Promise.allSettled(
      selected.map(
        (title) =>
          fetchCanonicalPage(
            title,
            deadline
          )
      )
    );

  const pages = [];

  const errors = [];

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

  let resolved =
    null;

  if (
    intent ===
    INTENT.CURRENT_REBIRTH
  ) {
    resolved =
      resolveCurrentFromCanonicalPages(
        pages
      );
  } else if (
    intent ===
    INTENT.REBIRTH_UNLOCK
  ) {
    resolved =
      resolveFlashFromCanonicalPages(
        pages
      );
  } else if (
    intent ===
      INTENT.LIMITED_BRAINROT &&
    question
      .toLowerCase()
      .includes(
        "caylus"
      )
  ) {
    resolved =
      resolveCaylusFromCanonicalPages(
        pages
      );
  }

  return {
    intent,

    pages,

    errors,

    resolved,

    titles:
      selected,
  };
}

function tavilyQueries(
  question,
  intent
) {
  const q =
    clean(
      question,
      650
    );

  const date =
    explicitDate(
      q
    );

  const datePart = [
    date.month,
    date.year,
  ]
    .filter(Boolean)
    .join(" ");

  if (
    intent ===
    INTENT.CURRENT_REBIRTH
  ) {
    return [
      'site:stealabrainrot.fandom.com/wiki/Rebirth "Rebirth"',

      'site:stealabrainrot.fandom.com "currently" "rebirths" "Steal a Brainrot"',

      '"Steal a Brainrot" newest rebirth',
    ];
  }

  if (
    intent ===
    INTENT.REBIRTH_UNLOCK
  ) {
    return [
      'site:stealabrainrot.fandom.com/wiki/Rebirth "Flash Teleport"',

      'site:stealabrainrot.fandom.com/wiki/Gears "Flash Teleport" rebirth',

      '"Steal a Brainrot" "Flash Teleport" rebirth',
    ];
  }

  if (
    intent ===
      INTENT.LIMITED_BRAINROT &&
    q
      .toLowerCase()
      .includes(
        "caylus"
      )
  ) {
    return [
      `site:stealabrainrot.fandom.com/wiki/Update_Log Caylus ${datePart} limited brainrot`
        .trim(),

      `site:stealabrainrot.fandom.com/wiki/Caylusaurus Caylusaurus ${datePart}`
        .trim(),

      `"Steal a Brainrot" "Caylus Admin Abuse" ${datePart} limited brainrot`
        .trim(),
    ];
  }

  return [
    `site:stealabrainrot.fandom.com/wiki ${q}`,

    `"Steal a Brainrot" ${q}`,

    q,
  ];
}

async function tavilyLane(
  question,
  query,
  deadline,
  includeDomains = null,
  fullIndex = false
) {
  const timeoutMs =
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
    timeoutMs <
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
    includeDomains?.length
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

      timeoutMs
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
          (row) =>
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

  const intent =
    inferIntent(
      question
    );

  const queries =
    tavilyQueries(
      question,
      intent
    );

  const jobs = [
    tavilyLane(
      question,
      queries[0],
      deadline,
      [
        "stealabrainrot.fandom.com",
      ],
      true
    ),

    tavilyLane(
      question,
      queries[1],
      deadline,
      null,
      false
    ),

    tavilyLane(
      question,
      queries[2],
      deadline,
      null,
      true
    ),
  ];

  const settled =
    await Promise.allSettled(
      jobs
    );

  const answers = [];

  const sources = [];

  const errors = [];

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

    const previous =
      byUrl.get(
        key
      );

    if (
      !previous ||
      source.score >
        previous.score
    ) {
      byUrl.set(
        key,
        source
      );
    }
  }

  return {
    answers,

    sources:
      [
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
    first >= 0 &&
    last >
      first
  ) {
    try {
      return JSON.parse(
        raw.slice(
          first,
          last + 1
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
          12000
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
          2600
        ),
    })
  );
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

  const timeoutMs =
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
    timeoutMs <
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

  const system = [
    "You are a strict evidence resolver for Steal a Brainrot.",

    "Use ONLY supplied evidence. Never use outside knowledge.",

    "CANONICAL_FULL_PAGE evidence is stronger than WEB_SNIPPET evidence.",

    "A truncated snippet that stops at an older rebirth is NOT proof that the older rebirth is current.",

    "For current/newest rebirth questions, prefer the complete Rebirth table maximum or an explicit current claim from a canonical full page.",

    "For Flash TP, normalize it to Flash Teleport and only use a rebirth number directly connected to Flash Teleport in the same row/window.",

    "If the evidence does not directly support the answer, return UNKNOWN.",

    'Return only JSON: {"answer":"value or UNKNOWN","confidence":0.0,"citedIds":["C1"],"reason":"short_reason"}',

    (
      intent ===
        INTENT.CURRENT_REBIRTH ||
      intent ===
        INTENT.REBIRTH_UNLOCK
    )
      ? "Rebirth answers must be formatted Rebirth<number>."
      : "Return only the shortest exact answer value.",
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
                280,

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

        timeoutMs
      );

    const raw =
      parseModelJson(
        data?.choices?.[0]
          ?.message?.content
      );

    const candidate =
      canonicalCandidate(
        question,
        raw?.answer ||
          "UNKNOWN"
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
      !candidate.valid
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
          "ai_candidate_invalid",
      };
    }

    const cited =
      evidence.filter(
        (row) =>
          citedIds.includes(
            row.id
          )
      );

    const answerNorm =
      norm(
        candidate.answer
      );

    const supporting =
      cited.filter(
        (row) =>
          norm(
            row.text
          ).includes(
            answerNorm
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
          candidate.answer,

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
        (row) =>
          row.kind ===
          "CANONICAL_FULL_PAGE"
      );

    const independentHosts =
      new Set(
        supporting.map(
          (row) =>
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
        0.9
    ) {
      return {
        ok:
          true,

        answer:
          candidate.answer,

        candidateAnswer:
          candidate.answer,

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

        answer:
          candidate.answer,

        candidateAnswer:
          candidate.answer,

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
        candidate.answer,

      confidence,

      citedIds,

      reason:
        "ai_review_only",
    };
  } catch (error) {
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

function answerCacheKey(
  question
) {
  return norm(
    question
  );
}

function getCachedAnswer(
  question
) {
  const row =
    ANSWER_CACHE.get(
      answerCacheKey(
        question
      )
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
    ANSWER_CACHE.delete(
      answerCacheKey(
        question
      )
    );

    return null;
  }

  return row.value;
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

  ANSWER_CACHE.set(
    answerCacheKey(
      question
    ),
    {
      expiresAt:
        nowMs() +
        (
          isCurrent(
            question
          )
            ? CFG.CURRENT_CACHE_TTL_MS
            : CFG.STABLE_CACHE_TTL_MS
        ),

      value,
    }
  );
}

function advisoryFrom(
  question
) {
  const candidate =
    canonicalCandidate(
      question.question,
      question?.aiAnswer ||
        "UNKNOWN"
    );

  return {
    answer:
      candidate.valid
        ? candidate.answer
        : "UNKNOWN",

    confidence:
      clamp(
        question
          ?.aiConfidence,
        0,
        1
      ),
  };
}

function finalizeResult(
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
      advisory?.answer !==
        "UNKNOWN" &&
      norm(
        base.answer
      ) ===
        norm(
          advisory.answer
        ),

    searchMode:
      currentMode(
        question
      ),

    searchLatencyMs:
      nowMs() -
      startedAt,

    intent:
      canonical?.intent ||
      inferIntent(
        question
      ),

    canonicalPages:
      canonical?.pages?.map(
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

  /*
    STEP 1:
    FULL CANONICAL WIKI PAGE FIRST.
  */

  const canonical =
    await canonicalStage(
      question.question,
      deadline
    );

  if (
    canonical.resolved
      ?.answer &&
    canonical.resolved
      .answer !==
      "UNKNOWN"
  ) {
    const result =
      finalizeResult(
        canonical.resolved,

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

  /*
    STEP 2:
    TAVILY FALLBACK.

    Search snippets are now SUPPORTING
    evidence, not the authority for
    current max/table questions.
  */

  const tavily =
    await tavilyStage(
      question.question,
      deadline
    );

  /*
    STEP 3:
    NVIDIA FALLBACK.

    It receives full canonical page text
    plus web snippets and must cite the
    evidence it used.
  */

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
    const citedSources = [
      ...evidenceFromCanonicalPages(
        canonical.pages
      ),

      ...evidenceFromWebSources(
        tavily.sources,
        canonical.pages.length
      ),
    ].filter(
      (row) =>
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
          citedSources.map(
            (row) =>
              row.host
          )
        ).size,

      sources:
        citedSources
          .slice(
            0,
            4
          )
          .map(
            (row) => ({
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
      finalizeResult(
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

  /*
    NOTHING VERIFIED:
    show candidate only.
  */

  let candidateAnswer =
    canonical.resolved
      ?.candidateAnswer ||
    ai?.candidateAnswer ||
    advisory.answer ||
    "UNKNOWN";

  const candidate =
    canonicalCandidate(
      question.question,
      candidateAnswer
    );

  candidateAnswer =
    candidate.valid
      ? candidate.answer
      : "UNKNOWN";

  return finalizeResult(
    {
      answer:
        "UNKNOWN",

      candidateAnswer,

      confidence:
        Math.max(
          canonical.resolved
            ?.confidence ||
            0,

          ai?.confidence ||
            0,

          advisory.confidence ||
            0
        ),

      reason:
        canonical.resolved
          ?.reason ||
        ai?.reason ||
        "no_verified_answer",

      route:
        "REVIEW",

      sourceCount:
        canonical.resolved
          ?.sourceCount ||
        0,

      sources:
        canonical.resolved
          ?.sources ||
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
          index + 1,

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
            240
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
      (item) =>
        item.answer ===
        "UNKNOWN"
    );

  if (
    failed
  ) {
    return (
      `REVIEW • ${
        failed.intent ||
        "GENERIC"
      }` +

      ` • reason=${clean(
        failed.reason,
        90
      )}` +

      ` • candidate=${clean(
        failed.candidateAnswer,
        80
      )}` +

      ` • src=${
        failed.sourceCount ||
        0
      }` +

      ` • ms=${
        failed.searchLatencyMs ||
        0
      }`
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
        )}%` +

        `:src=${
          item.sourceCount ||
          0
        }` +

        `:ms=${
          item.searchLatencyMs ||
          0
        }`
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

    source:
      "TEST",

    fullPage:
      true,
  };
}

function runSelfTests() {
  let passed = 0;

  const failures =
    [];

  const check = (
    name,
    condition,
    detail = ""
  ) => {
    if (
      condition
    ) {
      passed +=
        1;
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
    "intent current",

    inferIntent(
      "What is the newest rebirth right now?"
    ) ===
      INTENT.CURRENT_REBIRTH
  );

  check(
    "intent flash",

    inferIntent(
      "What rebirth did Flash TP come out in?"
    ) ===
      INTENT.REBIRTH_UNLOCK
  );

  check(
    "intent caylus",

    inferIntent(
      "What new limited brainrot was added during Caylus Admin Abuse in June 2026?"
    ) ===
      INTENT.LIMITED_BRAINROT
  );

  check(
    "html decode",

    htmlToText(
      "<p>A &amp; B</p>"
    ).includes(
      "A & B"
    )
  );

  for (
    let i = 1;
    i <= 200;
    i++
  ) {
    check(
      `canonical rebirth ${i}`,

      canonicalCandidate(
        "What rebirth did it unlock at?",
        `Rebirth ${i}`
      ).answer ===
        `Rebirth${i}`
    );
  }

  for (
    let i = 1;
    i <= 160;
    i++
  ) {
    const html =
      `<table>` +
      `<tr><th>Rebirth</th><th>Reward</th></tr>` +
      `<tr><td>${i}</td><td>Item ${i}</td></tr>` +
      `</table>`;

    const page =
      syntheticPage(
        "Rebirth",
        html
      );

    const rows =
      extractRebirthRows(
        page
      );

    check(
      `table row ${i}`,

      rows.length ===
        1 &&
      rows[0].number ===
        i
    );
  }

  for (
    let i = 1;
    i <= 140;
    i++
  ) {
    const html =
      `<table>` +
      `<tr><th>Rebirth</th><th>Reward</th></tr>` +
      `<tr><td>${i}</td><td>Heatseeker</td></tr>` +
      `<tr><td>${i + 1}</td><td>Flash Teleport</td></tr>` +
      `<tr><td>${i + 2}</td><td>Other</td></tr>` +
      `</table>`;

    const page =
      syntheticPage(
        "Rebirth",
        html
      );

    check(
      `flash row ${i}`,

      findFlashRebirthInPage(
        page
      ) ===
        `Rebirth${i + 1}`
    );
  }

  for (
    let i = 1;
    i <= 140;
    i++
  ) {
    const html =
      `<table>` +
      `<tr><th>Rebirth</th><th>Reward</th></tr>` +
      `<tr><td>${i}</td><td>A</td></tr>` +
      `<tr><td>${i + 1}</td><td>B</td></tr>` +
      `<tr><td>${i + 2}</td><td>C</td></tr>` +
      `</table>`;

    const page =
      syntheticPage(
        "Rebirth",
        html
      );

    const result =
      resolveCurrentFromCanonicalPages(
        [
          page,
        ]
      );

    check(
      `current full max ${i}`,

      result?.answer ===
        `Rebirth${i + 2}` &&
      result?.route ===
        "CANONICAL_FULL_TABLE"
    );
  }

  for (
    let i = 1;
    i <= 100;
    i++
  ) {
    const html =
      `<table>` +
      `<tr><th>Rebirth</th><th>Reward</th></tr>` +
      `<tr><td>${i}</td><td>A</td></tr>` +
      `<tr><td>${i + 1}</td><td>B</td></tr>` +
      `</table>`;

    const rebirthPage =
      syntheticPage(
        "Rebirth",
        html
      );

    const gamePage =
      syntheticPage(
        "Steal a Brainrot (Game)",
        `<p>There are currently ${i + 1} rebirths available.</p>`
      );

    const result =
      resolveCurrentFromCanonicalPages(
        [
          rebirthPage,
          gamePage,
        ]
      );

    check(
      `current agreement ${i}`,

      result?.answer ===
        `Rebirth${i + 1}` &&
      result?.route ===
        "CANONICAL_FULL_AGREEMENT"
    );
  }

  for (
    let i = 1;
    i <= 80;
    i++
  ) {
    const html =
      `<table>` +
      `<tr><th>Rebirth</th><th>Reward</th></tr>` +
      `<tr><td>${i}</td><td>A</td></tr>` +
      `<tr><td>${i + 1}</td><td>B</td></tr>` +
      `</table>`;

    const rebirthPage =
      syntheticPage(
        "Rebirth",
        html
      );

    const gamePage =
      syntheticPage(
        "Steal a Brainrot (Game)",
        `<p>There are currently ${i + 2} rebirths available.</p>`
      );

    const result =
      resolveCurrentFromCanonicalPages(
        [
          rebirthPage,
          gamePage,
        ]
      );

    check(
      `current conflict ${i}`,

      result?.answer ===
        "UNKNOWN" &&
      result?.route ===
        "CANONICAL_CURRENT_CONFLICT"
    );
  }

  for (
    let i = 1;
    i <= 60;
    i++
  ) {
    /*
      Simulates a partial page/snippet-like source.
      Because its title isn't exactly "Rebirth",
      it is NOT allowed to define CURRENT_MAX.
    */

    const partial =
      syntheticPage(
        "Rebirth Guide",
        `<p>Rebirth ${i} Rebirth ${i + 1}</p>`
      );

    const explicit =
      syntheticPage(
        "Steal a Brainrot (Game)",
        `<p>There are currently ${i + 2} rebirths available.</p>`
      );

    const result =
      resolveCurrentFromCanonicalPages(
        [
          partial,
          explicit,
        ]
      );

    check(
      `explicit beats partial ${i}`,

      result?.answer ===
        `Rebirth${i + 2}`
    );
  }

  const caylusPage =
    syntheticPage(
      "Update Log/Update 52",

      "<p>During Caylus Admin Abuse, Caylusaurus was introduced as a limited-quantity brainrot.</p>"
    );

  check(
    "caylus full page",

    resolveCaylusFromCanonicalPages(
      [
        caylusPage,
      ]
    )?.answer ===
      "Caylusaurus"
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
      "Deterministic local tests only. Live Fandom/Tavily/NVIDIA availability is tested by separate health endpoints.",
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

  /*
    IMPORTANT HEALTH CHECK.

    Open:
    /api/lookup?test=wiki&page=Rebirth

    This tells us whether YOUR VERCEL server
    can get the complete Fandom page.
  */

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
                    (row) =>
                      row.number
                  )
                )}`
              : null,

          ms:
            nowMs() -
            started,

          errors:
            page.errors,
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
    } catch (error) {
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
        fandomMediaWikiFirst:
          true,

        fandomFullHtmlFallback:
          true,

        fullCanonicalPageBeforeSearchSnippets:
          true,

        fullRebirthTableParser:
          true,

        flashTeleportTableRelationshipParser:
          true,

        currentMaxUsesFullTableNotSnippetMax:
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
  } catch (error) {
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

  const items = [];

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
    } catch (error) {
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
