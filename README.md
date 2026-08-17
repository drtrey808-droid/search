# SAB Trusted Lookup Proxy R3

Owner-controlled live search for the Corrupt Redeemer. The endpoint searches trusted domains first, uses community/random results only as fallback evidence, asks Nemotron to extract a candidate, and then applies deterministic source-verification rules before returning an answer.

Stable questions use backend Nemotron first and do not spend a search request when its answer is accepted. Freshness-sensitive or uncertain questions enter the trusted-source search ladder.

## What it enforces

- One official source can verify an answer.
- Two independent trusted domains can verify an answer.
- One trusted domain plus one independent community domain can verify an answer.
- One fresh Tier-2 SAB source can verify a recent answer when the client-side Nemotron answer independently agrees at >= 0.85 and the source extraction is >= 0.90.
- Community-only, random-only, stale, conflicting, or AI-disagreeing single-source evidence returns `UNKNOWN`.
- Web page text is treated as untrusted data and cannot change the resolver instructions.
- Current-day questions use the backend's UTC clock.
- Successful answers are cached for 45 minutes by default.
- Requests require a bearer token and are rate-limited.

## Deploy on Vercel

1. Create a new Vercel project containing this folder.
2. Add these Environment Variables in the Vercel project settings:

   - `TAVILY_API_KEY`: key created at Tavily.
   - `NVIDIA_API_KEY`: fresh NVIDIA Build API key beginning with `nvapi-`.
   - `LOOKUP_PROXY_TOKEN`: a long random value used only to limit proxy access.
   - `NVIDIA_MODEL`: optional; defaults to `nvidia/nemotron-3.5-lightning-30b-a3b`.
   - `OWNER_FEED_URL`: optional owner-maintained Tier 1 lore feed.
   - `OWNER_FEED_TOKEN`: optional bearer token for that feed.

3. Deploy the project.
4. Open `https://YOUR-PROJECT.vercel.app/api/lookup`. The health response should show all three configuration values as `true` without displaying the secrets.
5. Configure the Lua script:

```lua
lookupProxyUrl = "https://YOUR-PROJECT.vercel.app/api/lookup",
lookupProxyToken = "THE_SAME_LOOKUP_PROXY_TOKEN",
```

The proxy token is present client-side and should be treated as a limited access token, not a permanent secret. Keep rate limits enabled and rotate it if the Lua file is redistributed.

## Test locally

```bash
npm test
```

The tests do not call Tavily or NVIDIA. They verify source tiers, freshness classification, server dates, independent-domain requirements, conflict rejection, and the acceptance thresholds.

Official references: [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js) and [Tavily Search API](https://docs.tavily.com/documentation/api-reference/endpoint/search).

## Quick endpoint test

After deployment, send one test request without exposing your token in screenshots or logs:

```bash
curl -X POST "https://YOUR-PROJECT.vercel.app/api/lookup" \
  -H "Authorization: Bearer YOUR_LOOKUP_PROXY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"questions":[{"index":1,"question":"day of the month today","expectedEntity":"serverClock","expectedAttribute":"utcDayOfMonth"}]}'
```

The response should use route `SERVER_UTC` and should not spend a Tavily search request.

## Endpoint contract

Request:

```json
{
  "questions": [{
    "index": 1,
    "question": "What new 95M/s brainrot was added to the RNG Machine?",
    "expectedEntity": "newBrainrot",
    "expectedAttribute": "name"
  }],
  "lore": "optional owner lore"
}
```

Response:

```json
{
  "build": "SAB_TRUSTED_LOOKUP_2026_08_16",
  "trace": "TRUSTED 2 SOURCES • 94%",
  "items": [{
    "index": 1,
    "answer": "Los Admins",
    "entity": "newBrainrot",
    "attribute": "name",
    "confidence": 0.94,
    "reason": "accepted",
    "route": "TRUSTED_2_PLUS",
    "sourceCount": 2,
    "highestTier": 2,
    "sources": [
      {"tier": 2, "title": "RNG Machine wiki", "url": "https://example.invalid"}
    ],
    "asOf": "2026-08-16T00:00:00.000Z"
  }]
}
```

Do not commit `.env` files or paste live Tavily, NVIDIA, or Discord credentials into the repository.


## Default source tiers in R3

- Tier 1: `roblox.com`, `create.roblox.com`, plus the optional owner feed.
- Tier 2: `stealabrainrot.fandom.com`, `steal-a-brainrot.wiki`, `progameguides.com`, `sportskeeda.com`.
- Tier 3: `robloxgame.jp`, Reddit, YouTube, X, TikTok, Instagram, Eldorado.
- Everything else is Tier 4 and can only provide clues.

For recent questions the Lua request may include `aiAnswer` and `aiConfidence`. The proxy only uses that pair to strengthen a single Tier-2 source when the normalized answer matches exactly. It never allows AI agreement to override conflicting sources.
