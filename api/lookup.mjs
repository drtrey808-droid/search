const BUILD_ID = "SAB_TRUSTED_LOOKUP_R13_2026_08_17";
const TAVILY_URL = "https://api.tavily.com/search";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";

const TIERS = {
  1: ["roblox.com", "create.roblox.com"],
  2: [
    "stealabrainrot.fandom.com",
    "steal-a-brainrot.wiki",
    "progameguides.com",
    "sportskeeda.com",
    "beebom.com",
    "game8.co",
    "destructoid.com",
  ],
  3: [
    "reddit.com",
    "youtube.com",
    "x.com",
    "tiktok.com",
    "instagram.com",
    "eldorado.gg",
    "robloxgame.jp",
  ],
};

function clean(value, limit = 2000) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function norm(value) {
  return clean(value, 500).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function clamp(value, min = 0, max = 1) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
}

function env(name) {
  return String(process.env[name] || "").trim().replace(/^Bearer\s+/i, "").trim();
}

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function tierOf(url) {
  const host = hostOf(url);

  for (const tier of [1, 2, 3]) {
    if (
      TIERS[tier].some(
        (d) => host === d || host.endsWith(`.${d}`)
      )
    ) {
      return tier;
    }
  }

  return 4;
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

async function fetchJson(label, url, options = {}, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    const text = await response.text();

    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    if (!response.ok) {
      const detail = clean(
        data?.detail ||
          data?.message ||
          data?.error ||
          text,
        300
      );

      throw new Error(
        `${label}_HTTP_${response.status}${
          detail ? `:${detail}` : ""
        }`
      );
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`${label}_TIMEOUT`);
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function explicitDate(question) {
  const q = clean(question, 600).toLowerCase();

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
        new RegExp(`\\b${m}\\b`, "i").test(q)
    ) || null;

  const year =
    q.match(/\b(20\d{2})\b/)?.[1] || null;

  const numeric =
    /\b(?:20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]20\d{2})\b/.test(
      q
    );

  return {
    has: Boolean((month && year) || numeric),
    month,
    year: year ? Number(year) : null,
  };
}

function isCurrent(question) {
  const q = clean(question, 600).toLowerCase();

  return [
    "newest",
    "latest",
    "most recent",
    "recent",
    "recently",
    "current",
    "currently",
    "right now",
    "today",
    "yesterday",
    "this week",
    "this month",
    "latest update",
    "new update",
    "recent update",
    "just added",
    "newly added",
  ].some((x) => q.includes(x));
}

function isSab(question) {
  const q = clean(question, 600).toLowerCase();

  return (
    /\bsab\b/.test(q) ||
    [
      "steal a brainrot",
      "steal a brain rot",
      "brainrot",
      "rebirth",
      "admin abuse",
      "flash tp",
      "spyder",
      "sammy",
      "gear",
      "rng machine",
      "limited brainrot",
      "slap",
      "base slot",
    ].some((x) => q.includes(x))
  );
}

function answerType(question) {
  const q = clean(question, 600).toLowerCase();

  if (/\brebirth\b/.test(q)) return "rebirth";
  if (/\b(?:brainrot|brain rot)\b/.test(q)) return "brainrot";
  if (/\bgear\b/.test(q)) return "gear";
  if (/\bnpc\b/.test(q)) return "npc";
  if (/\bmachine\b/.test(q)) return "machine";
  if (/\b(?:when|date|year|month|day)\b/.test(q)) return "date";
  if (/\b(?:how many|number|count)\b/.test(q)) return "number";

  return "generic";
}

function typeInstruction(question) {
  const type = answerType(question);

  if (type === "rebirth") {
    return "Return only Rebirth<number>, such as Rebirth18. Never return a bare number.";
  }

  if (type === "brainrot") {
    return "Return only the brainrot proper name.";
  }

  if (type === "gear") {
    return "Return only the gear/item name.";
  }

  if (type === "npc") {
    return "Return only the NPC name.";
  }

  if (type === "machine") {
    return "Return only the machine name.";
  }

  if (type === "date") {
    return "Return only the requested date/year.";
  }

  if (type === "number") {
    return "Return only the requested number.";
  }

  return "Return only the shortest exact value requested.";
}

function tokens(value) {
  return (
    clean(value, 1000)
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Za-z])(\d)/g, "$1 $2")
      .replace(/(\d)([A-Za-z])/g, "$1 $2")
      .toLowerCase()
      .match(/[a-z0-9]+/g) || []
  );
}

function canonical(question, value) {
  let answer = clean(value, 240);

  if (!answer || norm(answer) === "unknown") {
    return {
      valid: false,
      answer: "UNKNOWN",
      reason: "empty",
    };
  }

  const type = answerType(question);

  if (type === "rebirth") {
    /*
      IMPORTANT R13 FIX:

      We REQUIRE the actual word "Rebirth" next to the number.

      Good:
      Rebirth18
      Rebirth 18
      Rebirth #18

      Rejected:
      1
      18
      "there is 1 new feature"
    */

    const match =
      answer.match(
        /\brebirth\s*#?\s*(\d{1,3})\b/i
      );

    if (!match) {
      return {
        valid: false,
        answer: "UNKNOWN",
        reason: "rebirth_format",
      };
    }

    answer =
      `Rebirth${Number(match[1])}`;
  }

  const aTokens = tokens(answer);
  const qTokens = new Set(tokens(question));

  if (aTokens.length >= 2) {
    const overlap =
      aTokens.filter((t) =>
        qTokens.has(t)
      ).length / aTokens.length;

    if (overlap >= 0.8) {
      return {
        valid: false,
        answer: "UNKNOWN",
        reason: "question_echo",
      };
    }
  }

  const low =
    answer.toLowerCase();

  if (
    [
      "brainrot",
      "gear",
      "npc",
      "machine",
      "item",
      "update",
      "admin abuse",
    ].includes(low)
  ) {
    return {
      valid: false,
      answer: "UNKNOWN",
      reason: "generic_label",
    };
  }

  if (
    [
      "brainrot",
      "gear",
      "npc",
      "machine",
    ].includes(type)
  ) {
    if (
      !aTokens.length ||
      aTokens.length > 7 ||
      answer.length > 90
    ) {
      return {
        valid: false,
        answer: "UNKNOWN",
        reason: `shape_${type}`,
      };
    }
  }

  return {
    valid: true,
    answer,
    reason: "valid",
  };
}

function searchQueries(question) {
  const q = clean(question, 600);
  const low = q.toLowerCase();

  const d =
    explicitDate(q);

  const datePart =
    [d.month, d.year]
      .filter(Boolean)
      .join(" ");

  const out = [];

  if (low.includes("flash tp")) {
    out.push(
      '"Steal a Brainrot" "Flash TP" rebirth'
    );

    out.push(
      '"Flash TP" "Rebirth" "Steal a Brainrot"'
    );

    out.push(
      "Steal a Brainrot Roblox Flash TP gear rebirth"
    );
  } else if (
    low.includes("caylus") &&
    low.includes("admin abuse")
  ) {
    out.push(
      `"Steal a Brainrot" "Caylus Admin Abuse" "${datePart}"`
    );

    out.push(
      `"Steal a Brainrot" Caylus "limited brainrot" ${datePart}`
    );

    out.push(
      `Caylus Admin Abuse ${datePart} brainrot`
    );
  } else if (
    low.includes("newest rebirth") ||
    low.includes("latest rebirth")
  ) {
    out.push(
      '"Steal a Brainrot" "latest rebirth"'
    );

    out.push(
      '"Steal a Brainrot" "newest rebirth"'
    );

    out.push(
      `"Steal a Brainrot" rebirth ${new Date().getUTCFullYear()}`
    );
  } else if (isSab(q)) {
    const dPart =
      [d.month, d.year]
        .filter(Boolean)
        .join(" ");

    out.push(
      `"Steal a Brainrot" ${dPart} ${answerType(q)}`
        .replace(/\s+/g, " ")
        .trim()
    );

    out.push(
      `Steal a Brainrot Roblox ${q}`
    );

    out.push(
      `"Steal a Brainrot" ${q}`
    );
  } else {
    out.push(q, q, q);
  }

  return [
    ...new Set(
      out
        .map((x) => clean(x, 600))
        .filter(Boolean)
    ),
  ].slice(0, 3);
}

async function tavilyLane(
  question,
  query,
  domains,
  lane
) {
  const d =
    explicitDate(question);

  const body = {
    query,

    search_depth:
      "fast",

    max_results:
      6,

    topic:
      "general",

    include_answer:
      "basic",

    include_raw_content:
      false,

    include_images:
      false,
  };

  /*
    Current/latest question:
    search recent pages.

    Explicit historical date:
    DO NOT apply a recent-only window.
  */

  if (
    isCurrent(question) &&
    !d.has
  ) {
    body.time_range =
      "month";
  }

  if (domains?.length) {
    body.include_domains =
      domains;
  }

  const data =
    await fetchJson(
      `TAVILY_${lane}`,
      TAVILY_URL,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${env("TAVILY_API_KEY")}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(body),
      },
      2200
    );

  const sources =
    (
      Array.isArray(data?.results)
        ? data.results
        : []
    )
      .map((r) => {
        const url =
          clean(
            r?.url,
            1000
          );

        return {
          title:
            clean(
              r?.title,
              250
            ),

          url,

          host:
            hostOf(url),

          snippet:
            clean(
              r?.content ??
                r?.raw_content,
              1800
            ),

          publishedDate:
            clean(
              r?.published_date ??
                r?.publishedDate,
              100
            ),

          score:
            clamp(
              r?.score
            ),

          tier:
            tierOf(url),

          queryUsed:
            query,

          lane,
        };
      })
      .filter(
        (r) =>
          r.url.startsWith("https://")
      );

  return {
    lane,
    query,

    answer:
      clean(
        data?.answer,
        700
      ),

    sources,
  };
}

async function searchBundle(question) {
  const q =
    searchQueries(question);

  const trusted = [
    ...TIERS[1],
    ...TIERS[2],
  ];

  /*
    R13:
    THREE searches run at once.

    No sequential waiting.
  */

  const settled =
    await Promise.allSettled([
      tavilyLane(
        question,
        q[0] || question,
        trusted,
        "TRUSTED_PRIMARY"
      ),

      tavilyLane(
        question,
        q[1] ||
          q[0] ||
          question,
        null,
        "BROAD_ALT"
      ),

      tavilyLane(
        question,
        q[2] ||
          q[1] ||
          q[0] ||
          question,
        trusted,
        "TRUSTED_SECONDARY"
      ),
    ]);

  const lanes = [];
  const errors = [];

  for (const r of settled) {
    if (
      r.status ===
      "fulfilled"
    ) {
      lanes.push(
        r.value
      );
    } else {
      errors.push(
        clean(
          r.reason?.message ||
            r.reason,
          220
        )
      );
    }
  }

  if (!lanes.length) {
    throw new Error(
      errors[0] ||
        "TAVILY_ALL_LANES_FAILED"
    );
  }

  return {
    queries:
      q,

    errors,

    answers:
      lanes
        .map((x) => ({
          lane:
            x.lane,

          answer:
            x.answer,

          query:
            x.query,
        }))
        .filter(
          (x) =>
            x.answer
        ),

    sources:
      lanes.flatMap(
        (x) =>
          x.sources
      ),
  };
}

function dedupeSources(sources) {
  const seen =
    new Set();

  const out = [];

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

    if (
      !key ||
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);

    out.push({
      ...source,

      id:
        `S${out.length + 1}`,
    });
  }

  return out.slice(
    0,
    14
  );
}

function sourceSupports(
  source,
  answer
) {
  const hay =
    `${source.title} ${source.snippet}`;

  const a =
    norm(answer);

  /*
    This also handles:
    Rebirth18
    vs
    Rebirth 18
  */

  if (
    a &&
    norm(hay).includes(a)
  ) {
    return true;
  }

  const words =
    tokens(answer)
      .filter(
        (w) =>
          w.length >= 2
      );

  return (
    words.length > 0 &&
    words.every(
      (w) =>
        hay
          .toLowerCase()
          .includes(w)
    )
  );
}

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

  try {
    return JSON.parse(raw);
  } catch {}

  const a =
    raw.indexOf("{");

  const b =
    raw.lastIndexOf("}");

  if (
    a >= 0 &&
    b > a
  ) {
    return JSON.parse(
      raw.slice(
        a,
        b + 1
      )
    );
  }

  throw new Error(
    "NVIDIA_INVALID_JSON_OUTPUT"
  );
}

async function extractEvidence(
  question,
  sources,
  lore
) {
  const model =
    clean(
      process.env.NVIDIA_MODEL ||
        DEFAULT_MODEL,
      200
    );

  const evidence =
    sources.map((s) => ({
      id:
        s.id,

      tier:
        s.tier,

      relevance:
        s.score,

      host:
        s.host,

      title:
        s.title,

      publishedDate:
        s.publishedDate,

      snippet:
        s.snippet,
    }));

  const payload = {
    model,

    stream:
      false,

    max_tokens:
      300,

    temperature:
      0.2,

    messages: [
      {
        role:
          "system",

        content:
          [
            "You are a strict evidence extractor.",

            "Use ONLY the supplied snippets. Never use outside knowledge.",

            "Extract what each source directly states. Omit sources that do not directly state the answer.",

            "If supporting sources disagree, set conflict=true.",

            "Return only JSON:",

            '{"answer":"value or UNKNOWN","confidence":0.0,"citedIds":["S1"],"sourceAnswers":[{"id":"S1","answer":"value"}],"conflict":false}',

            typeInstruction(
              question
            ),

            "For rebirth questions, the source itself must explicitly contain the word Rebirth next to the number.",

            "Never manufacture an answer from words copied out of the question.",
          ].join(
            "\n"
          ),
      },

      {
        role:
          "user",

        content:
          JSON.stringify({
            question,

            lore:
              clean(
                lore,
                12000
              ),

            evidence,
          }),
      },
    ],
  };

  const data =
    await fetchJson(
      "NVIDIA",
      NVIDIA_URL,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${env("NVIDIA_API_KEY")}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body:
          JSON.stringify(
            payload
          ),
      },
      1500
    );

  const raw =
    parseModelJson(
      data?.choices?.[0]
        ?.message?.content
    );

  return {
    answer:
      clean(
        raw?.answer ||
          "UNKNOWN",
        240
      ),

    confidence:
      clamp(
        raw?.confidence
      ),

    citedIds:
      Array.isArray(
        raw?.citedIds
      )
        ? raw.citedIds
            .map(String)
            .slice(0, 12)
        : [],

    sourceAnswers:
      Array.isArray(
        raw?.sourceAnswers
      )
        ? raw.sourceAnswers
            .slice(0, 12)
            .map((x) => ({
              id:
                clean(
                  x?.id,
                  20
                ),

              answer:
                clean(
                  x?.answer,
                  240
                ),
            }))
        : [],

    conflict:
      raw?.conflict ===
      true,
  };
}

function sourceTime(source) {
  const ms =
    Date.parse(
      clean(
        source?.publishedDate,
        100
      )
    );

  return Number.isFinite(ms)
    ? ms
    : 0;
}

function buildVotes(
  question,
  extracted,
  sources
) {
  const byId =
    new Map(
      sources.map(
        (s) => [
          s.id,
          s,
        ]
      )
    );

  /*
    Only one vote per independent host.
  */

  const perHost =
    new Map();

  const rows = [
    ...(extracted.sourceAnswers ||
      []),
  ];

  const final =
    canonical(
      question,
      extracted.answer
    );

  if (final.valid) {
    for (
      const id
      of extracted.citedIds ||
        []
    ) {
      rows.push({
        id,
        answer:
          final.answer,
      });
    }
  }

  for (const row of rows) {
    const source =
      byId.get(
        row.id
      );

    if (!source) {
      continue;
    }

    const c =
      canonical(
        question,
        row.answer
      );

    if (
      !c.valid ||
      !sourceSupports(
        source,
        c.answer
      )
    ) {
      continue;
    }

    const old =
      perHost.get(
        source.host
      );

    if (
      !old ||
      source.tier <
        old.source.tier ||
      source.score >
        old.source.score
    ) {
      perHost.set(
        source.host,
        {
          source,
          answer:
            c.answer,
        }
      );
    }
  }

  const groups =
    new Map();

  for (
    const {
      source,
      answer,
    }
    of perHost.values()
  ) {
    const key =
      norm(answer);

    if (
      !groups.has(key)
    ) {
      groups.set(
        key,
        {
          answer,

          sources:
            [],

          official:
            0,

          trusted:
            0,

          community:
            0,

          bestTier:
            4,

          bestRelevance:
            0,

          newest:
            0,
        }
      );
    }

    const g =
      groups.get(key);

    g.sources.push(
      source
    );

    if (
      source.tier === 1
    ) {
      g.official++;
    }

    if (
      source.tier === 2
    ) {
      g.trusted++;
    }

    if (
      source.tier === 3
    ) {
      g.community++;
    }

    g.bestTier =
      Math.min(
        g.bestTier,
        source.tier
      );

    g.bestRelevance =
      Math.max(
        g.bestRelevance,
        source.score
      );

    g.newest =
      Math.max(
        g.newest,
        sourceTime(source)
      );
  }

  const votes = [
    ...groups.values(),
  ];

  votes.sort(
    (a, b) => {
      const qa =
        a.official * 100 +
        a.trusted * 20 +
        a.community * 5 +
        a.sources.length;

      const qb =
        b.official * 100 +
        b.trusted * 20 +
        b.community * 5 +
        b.sources.length;

      if (
        qb !== qa
      ) {
        return qb - qa;
      }

      if (
        isCurrent(question) &&
        b.newest !==
          a.newest
      ) {
        return (
          b.newest -
          a.newest
        );
      }

      return (
        b.bestRelevance -
        a.bestRelevance
      );
    }
  );

  return votes;
}

function scoreVotes(
  question,
  votes,
  extracted,
  advisory
) {
  if (!votes.length) {
    return null;
  }

  const best =
    votes[0];

  const second =
    votes[1] ||
    null;

  const rawConflict =
    Boolean(
      second &&
      norm(second.answer) !==
        norm(best.answer)
    );

  /*
    Current question:
    a clearly newer source may legitimately
    supersede an older answer.
  */

  const freshWinner =
    Boolean(
      rawConflict &&
      isCurrent(question) &&
      best.newest > 0 &&
      second?.newest > 0 &&
      best.newest >=
        second.newest +
          3 *
            24 *
            60 *
            60 *
            1000
    );

  const qualityWinner =
    Boolean(
      rawConflict &&
      best.trusted >= 2 &&
      (
        second?.trusted ||
        0
      ) === 0 &&
      (
        second?.official ||
        0
      ) === 0
    );

  const conflict =
    rawConflict &&
    !freshWinner &&
    !qualityWinner;

  let accepted =
    false;

  let confidence =
    Math.min(
      extracted.confidence ||
        0.72,
      0.84
    );

  let reason =
    "source_vote_review";

  let route =
    "SOURCE_VOTE_REVIEW";

  if (
    conflict ||
    (
      extracted.conflict &&
      !freshWinner &&
      !qualityWinner
    )
  ) {
    confidence =
      0.49;

    reason =
      "source_conflict";

    route =
      "SOURCE_CONFLICT";
  } else if (
    best.official >= 1
  ) {
    accepted =
      true;

    confidence =
      0.98;

    reason =
      "accepted_official_vote";

    route =
      "OFFICIAL_VOTE";
  } else if (
    best.trusted >= 2
  ) {
    accepted =
      true;

    confidence =
      0.95;

    reason =
      "accepted_two_trusted_votes";

    route =
      "TRUSTED_VOTE_2_PLUS";
  } else if (
    best.trusted >= 1 &&
    best.community >= 1
  ) {
    accepted =
      true;

    confidence =
      0.90;

    reason =
      "accepted_trusted_plus_community_vote";

    route =
      "TRUSTED_COMMUNITY_VOTE";
  } else if (
    best.trusted >= 1 &&
    extracted.confidence >=
      0.92
  ) {
    accepted =
      true;

    confidence =
      0.90;

    reason =
      "accepted_single_trusted_direct_vote";

    route =
      "TRUSTED_SINGLE_DIRECT_VOTE";
  }

  if (
    accepted &&
    freshWinner
  ) {
    confidence =
      Math.max(
        confidence,
        0.91
      );

    reason =
      "accepted_current_freshest_vote";

    route =
      "CURRENT_FRESH_VOTE";
  } else if (
    accepted &&
    qualityWinner
  ) {
    reason =
      "accepted_higher_quality_vote";

    route =
      "QUALITY_VOTE_WINNER";
  }

  const advisoryCanonical =
    canonical(
      question,
      advisory.answer
    );

  return {
    answer:
      accepted
        ? best.answer
        : "UNKNOWN",

    candidateAnswer:
      best.answer,

    candidateConfidence:
      extracted.confidence,

    advisoryAnswer:
      advisoryCanonical.valid
        ? advisoryCanonical.answer
        : "UNKNOWN",

    advisoryConfidence:
      advisory.confidence,

    agreement:
      advisoryCanonical.valid &&
      norm(
        advisoryCanonical.answer
      ) ===
        norm(best.answer),

    bestRelevance:
      best.bestRelevance,

    confidence,

    reason,

    route,

    sourceCount:
      best.sources.length,

    highestTier:
      best.bestTier,

    sources:
      best.sources
        .slice(0, 4)
        .map((s) => ({
          tier:
            s.tier,

          relevance:
            s.score,

          host:
            s.host,

          title:
            s.title,

          url:
            s.url,

          queryUsed:
            s.queryUsed,

          publishedDate:
            s.publishedDate,
        })),

    voteSummary:
      votes
        .slice(0, 4)
        .map((v) => ({
          answer:
            v.answer,

          sources:
            v.sources.length,

          official:
            v.official,

          trusted:
            v.trusted,

          community:
            v.community,

          newest:
            v.newest,
        })),
  };
}

function advisoryFrom(question) {
  return {
    answer:
      clean(
        question?.aiAnswer ||
          "UNKNOWN",
        240
      ),

    confidence:
      clamp(
        question?.aiConfidence
      ),
  };
}

function reviewCandidate(
  question,
  extracted,
  advisory
) {
  const source =
    canonical(
      question,
      extracted?.answer ||
        ""
    );

  if (source.valid) {
    return source.answer;
  }

  const ai =
    canonical(
      question,
      advisory.answer ||
        ""
    );

  if (ai.valid) {
    return ai.answer;
  }

  return "UNKNOWN";
}

async function resolveQuestion(
  question,
  lore
) {
  const started =
    Date.now();

  const advisory =
    advisoryFrom(question);

  const search =
    await searchBundle(
      question.question
    );

  const sources =
    dedupeSources(
      search.sources
    );

  let result = {
    answer:
      "UNKNOWN",

    candidateAnswer:
      "UNKNOWN",

    candidateConfidence:
      0,

    advisoryAnswer:
      advisory.answer,

    advisoryConfidence:
      advisory.confidence,

    confidence:
      0,

    reason:
      "no_verified_answer",

    route:
      "SEARCH_REVIEW",

    sourceCount:
      0,

    highestTier:
      4,

    bestRelevance:
      sources.length
        ? Math.max(
            ...sources.map(
              (s) =>
                s.score
            )
          )
        : 0,

    sources:
      [],
  };

  if (sources.length) {
    try {
      /*
        THIS is the important R13 change.

        Tavily finds pages.

        Nemotron reads the actual snippets.

        Then source voting decides whether
        it is safe to auto-submit.
      */

      const extracted =
        await extractEvidence(
          question.question,

          sources.slice(
            0,
            12
          ),

          lore
        );

      const votes =
        buildVotes(
          question.question,
          extracted,
          sources
        );

      const scored =
        scoreVotes(
          question.question,
          votes,
          extracted,
          advisory
        );

      if (scored) {
        result =
          scored;
      } else {
        result.candidateAnswer =
          reviewCandidate(
            question.question,
            extracted,
            advisory
          );

        result.candidateConfidence =
          extracted.confidence;

        result.reason =
          result.candidateAnswer ===
          "UNKNOWN"
            ? "search_answer_not_extractable"
            : "unverified_source_candidate";

        result.route =
          result.candidateAnswer ===
          "UNKNOWN"
            ? "SEARCH_REVIEW"
            : "SOURCE_CANDIDATE_REVIEW";
      }
    } catch (error) {
      const ai =
        canonical(
          question.question,
          advisory.answer
        );

      result.candidateAnswer =
        ai.valid
          ? ai.answer
          : "UNKNOWN";

      result.reason =
        ai.valid
          ? "extractor_failed_ai_review"
          : "extractor_failed";

      result.route =
        ai.valid
          ? "AI_CANDIDATE_REVIEW"
          : "SEARCH_REVIEW";

      result.extractorError =
        clean(
          error?.message,
          180
        );
    }
  }

  const d =
    explicitDate(
      question.question
    );

  result.searchMode =
    d.has
      ? "HISTORICAL_DATE"
      : (
          isCurrent(
            question.question
          )
            ? "CURRENT"
            : "FALLBACK"
        );

  result.searchLatencyMs =
    Date.now() -
    started;

  result.searchErrors =
    search.errors;

  result.searchQueries =
    search.queries;

  return result;
}

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
    (row, i) => {
      const question =
        clean(
          row?.question,
          600
        );

      if (!question) {
        throw new Error(
          `QUESTION_${i + 1}_EMPTY`
        );
      }

      return {
        index:
          i + 1,

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
            240
          ),

        aiConfidence:
          clamp(
            row?.aiConfidence
          ),
      };
    }
  );
}

function trace(items) {
  const failed =
    items.find(
      (x) =>
        x.answer ===
        "UNKNOWN"
    );

  if (failed) {
    return (
      `REVIEW • reason=${failed.reason}` +
      ` • candidate=${failed.candidateAnswer}` +
      ` • sources=${failed.sourceCount || 0}`
    );
  }

  return items
    .map(
      (x) =>
        `${x.route}:${x.answer}:${Math.round(
          x.confidence * 100
        )}%`
    )
    .join(" | ");
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

export async function GET() {
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
          ).length > 0,

        nvidia:
          env(
            "NVIDIA_API_KEY"
          ).length > 0,

        token:
          env(
            "LOOKUP_PROXY_TOKEN"
          ).length > 0,
      },

      nvidiaModel:
        process.env
          .NVIDIA_MODEL ||
        DEFAULT_MODEL,

      policy: {
        threeLaneSearch:
          true,

        sourceVoting:
          true,

        strictRebirthParser:
          true,

        currentFreshnessPreference:
          true,

        rejectsQuestionEcho:
          true,

        reviewCandidateOnlyWhenValid:
          true,
      },

      sourceTiers:
        TIERS,
    }
  );
}

export async function POST(request) {
  const expected =
    env(
      "LOOKUP_PROXY_TOKEN"
    );

  const supplied =
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

  if (!expected) {
    return json(
      503,
      {
        error:
          "LOOKUP_TOKEN_NOT_CONFIGURED",
      }
    );
  }

  if (
    supplied !==
    expected
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

  if (
    !env(
      "NVIDIA_API_KEY"
    )
  ) {
    return json(
      503,
      {
        error:
          "NVIDIA_KEY_NOT_CONFIGURED",
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
            200
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

        reason:
          clean(
            error?.message ||
              "LOOKUP_FAILED",
            500
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
        trace(
          items
        ),

      items,
    }
  );
}
