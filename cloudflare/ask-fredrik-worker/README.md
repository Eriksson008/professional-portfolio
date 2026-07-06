# Ask Fredrik Worker

Cloudflare Worker backend for the portfolio's "Ask Fredrik" assistant. Runs entirely on the
**Workers Free + D1 Free + Workers AI Free** plans — no API keys in code, no paid services,
no OpenAI/Anthropic/Gemini keys. Every valid question is answered by the first stage that
matches, in this order:

| # | Stage | `source` | When |
|---|-------|----------|------|
| 1 | Rate limiter | `rate_limited` | Client exceeded the per-window request budget |
| 2 | Sensitive filter | `blocked` | Salary/private/confidential/credentials topics |
| 3 | Curated matcher | `static` | Common recruiter questions (keyword-matched) |
| 4 | Workers AI | `ai` | Enabled + bound, and nothing above matched |
| 5 | Curated fallback | `fallback` | AI disabled, missing, timed out, or failed |

Valid questions are logged to **D1** (best-effort, off the response path) with the `source`,
`matched_intent`, `model`, and `latency_ms` that produced the answer. The Worker runs fine
with **no** AI binding, **no** D1 binding, and **no** secrets — each feature degrades
gracefully and the recruiter always gets an answer.

The frontend (`src/lib/askFredrik.ts`) already speaks this contract: when
`VITE_ASK_FREDRIK_API_URL` is set at build time it POSTs here first and silently falls back
to its own static answers on any failure — the widget can never error out.

## API

```
POST /ask
Content-Type: application/json

{ "question": "string (required, 1–500 chars after trim)",
  "sessionId": "string (optional)",
  "page": "string (optional)" }

→ 200 { "answer": string,
        "source": "ai" | "fallback" | "static" | "blocked" | "rate_limited",
        "matchedIntent"?: string }        // e.g. "strengths", or "sensitive" when blocked
→ 400 { "error": "..." }   invalid JSON, missing/empty/too-long question
→ 405 { "error": "..." }   non-POST on /ask

GET /admin/logs[?limit=25|50|100]        (default 100, max 100)
Authorization: Bearer <ADMIN_TOKEN>

→ 200 { "count": n, "logs": [...] }
→ 401 { "error": "Unauthorized." }       missing/wrong token
→ 503 { "error": "..." }                 ADMIN_TOKEN or D1 not configured
```

Rate-limited and blocked questions still return HTTP 200 with a polite canned answer — the
widget renders it like any other reply. Responses never contain prompts, the approved
context object, secrets, stack traces, or internal error details.

`GET /` is a health check. CORS on `/ask` is allowlisted to local development
(`http://localhost:*`, `http://127.0.0.1:*`) and the GitHub Pages origin
(`https://eriksson008.github.io`) — edit the allowlist at the top of `src/index.ts`.
`/admin/logs` sends **no** CORS headers at all: it's a curl/CLI endpoint and can never be
read by a browser page on another origin.

## Architecture

- `src/index.ts` — routing, validation, CORS, the answer pipeline, rate limiting, the
  guarded Workers AI call, D1 logging, and the admin endpoint.
- `src/fredrik-context.ts` — the **entire knowledge base**: approved public context (the
  only facts AI may speak from), curated intent answers, sensitive-keyword list, canned
  blocked/rate-limited/fallback answers, and the AI system prompt. Same rules as the résumé:
  public facts only, no internal codenames, git-verifiable metrics only.
- `src/matcher.ts` — normalization + keyword matching for the sensitive filter and the
  curated intents. Deliberately simple substring scoring, no NLP.

### Curated intents (answered without AI)

`strengths`, `role_fit`, `strongest_projects`, `technical_stack`, `why_interview`,
`leadership`, `ai_experience`, `cloud_experience`, `salesforce_experience`,
`contact_resume`. The widget's suggested questions all land here — instant, free,
deterministic, and logged with a real `matched_intent`. This is also why enabling AI is
cheap: the most common questions never reach the model.

### Sensitive questions

Questions touching salary/compensation, confidential employer details, private
personal/family/household/home information, secrets/credentials, or internal proprietary
systems are answered with a fixed polite refusal (`source: "blocked"`,
`matched_intent: "sensitive"`) and **never reach the model**. The AI system prompt repeats
the same restrictions as a second layer.

### Rate limiting

A sliding-window limiter allows **10 valid `/ask` requests per 60 seconds** per client
(both configurable), keyed by `sessionId` and by a salted IP hash (`IP_HASH_SALT` when set,
otherwise a random per-isolate salt — raw IPs are never stored, in memory or in D1). State
is **in-memory per Worker isolate**: zero latency, zero cost, resets on isolate recycle.
This is basic abuse protection to stop one client burning the Workers AI daily allocation —
**not** enterprise-grade bot protection. For hard guarantees, add a Cloudflare WAF rate
rule (free tier includes one) in front of the Worker. `/admin/logs` is not rate-limited.

### Cost & quota safety

- Questions are capped at 500 chars; AI output at `ASK_FREDRIK_MAX_OUTPUT_TOKENS` (default 250).
- The AI call is raced against `ASK_FREDRIK_AI_TIMEOUT_MS` (default 6000 ms); timeout,
  thrown errors, quota exhaustion, and empty/invalid responses all fall back to the curated
  answer. **No retries, no streaming.**
- AI runs only for valid, unmatched, non-sensitive, non-rate-limited questions — with
  `ASK_FREDRIK_AI_ENABLED` anything but `"true"`, it never runs at all.
- Workers AI free allocation (10k neurons/day) comfortably covers a portfolio's traffic;
  when it's exhausted the call fails → curated fallback, never an error.

## Configuration

### Bindings & vars (`wrangler.jsonc`)

This repo uses `wrangler.jsonc`; the TOML equivalents are shown for reference.

```jsonc
"ai": { "binding": "AI" },
"vars": {
  "ASK_FREDRIK_AI_ENABLED": "false",                      // flip to "true" to enable AI
  "ASK_FREDRIK_MODEL": "@cf/meta/llama-3.1-8b-instruct",
  "ASK_FREDRIK_AI_TIMEOUT_MS": "6000",
  "ASK_FREDRIK_MAX_OUTPUT_TOKENS": "250",
  "ASK_FREDRIK_RATE_LIMIT_WINDOW_SECONDS": "60",
  "ASK_FREDRIK_RATE_LIMIT_MAX_REQUESTS": "10"
}
```

```toml
# wrangler.toml equivalent
[ai]
binding = "AI"

[vars]
ASK_FREDRIK_AI_ENABLED = "true"
ASK_FREDRIK_MODEL = "@cf/meta/llama-3.1-8b-instruct"
ASK_FREDRIK_AI_TIMEOUT_MS = "6000"
ASK_FREDRIK_MAX_OUTPUT_TOKENS = "250"
ASK_FREDRIK_RATE_LIMIT_WINDOW_SECONDS = "60"
ASK_FREDRIK_RATE_LIMIT_MAX_REQUESTS = "10"
```

All vars are optional — the Worker applies the same defaults in code when one is unset or
unparseable. `ASK_FREDRIK_AI_ENABLED` defaults to **off**; only the literal string `"true"`
enables AI. If `@cf/meta/llama-3.1-8b-instruct` is ever retired, set `ASK_FREDRIK_MODEL` to
any currently available small **instruct/text-generation** model from the
[Workers AI model catalog](https://developers.cloudflare.com/workers-ai/models/) (pick one
whose page shows the `messages` chat input) — no code change needed.

### Secrets (production)

```bash
npx wrangler secret put ADMIN_TOKEN     # long random string — protects GET /admin/logs
npx wrangler secret put IP_HASH_SALT    # long random string — salts the IP hash
```

Both set 2026-07-06. If `ADMIN_TOKEN` is unset, `/admin/logs` returns 503; if
`IP_HASH_SALT` is unset, `ip_hash` is not stored (the rate limiter then uses a per-isolate
random salt instead). Secrets never appear in code, config, responses, or the frontend
bundle. For `wrangler dev`, put local-only values in `.dev.vars` (gitignored):

```
ADMIN_TOKEN=dev-admin-token
IP_HASH_SALT=dev-salt
ASK_FREDRIK_AI_ENABLED=true     # optional local override of the wrangler.jsonc var
```

## D1 logging

Every valid `/ask` question is logged (id, timestamp, question, answer, source,
matched_intent, session id, page, referrer, user agent, salted IP hash, model, latency).
Logging is **best-effort and off the response path** (`ctx.waitUntil`); any insert failure
is a `console.warn`, never a user-facing error.

**Privacy:** questions may be logged — the widget tells users not to submit sensitive
information. Raw IP addresses are **never** stored; only a salted SHA-256 hash, and only
when `IP_HASH_SALT` is set.

Database `ask-fredrik-db` was created 2026-07-06 and the schema applied (`schema.sql`).
For a fresh setup: `npx wrangler d1 create ask-fredrik-db`, paste the id into
`wrangler.jsonc`, then:

```bash
npx wrangler d1 execute ask-fredrik-db --local  --file=./schema.sql   # local dev database
npx wrangler d1 execute ask-fredrik-db --remote --file=./schema.sql   # production database
```

## Local development

```bash
npm install
npx wrangler d1 execute ask-fredrik-db --local --file=./schema.sql   # once
npm run dev          # wrangler dev → http://localhost:8787
```

> **workers.dev subdomain required for `npm run dev` and deploy:** the AI binding makes
> `wrangler dev` open a remote proxy session (Workers AI never runs on your machine), which
> needs a one-time registered workers.dev subdomain — register it in the Cloudflare dash
> under Workers & Pages. Until then, use **`npm run dev:noai`** (same Worker, AI binding
> omitted): everything except live AI answers works, and unmatched questions take the
> fallback path. Note that with `npm run dev` and AI enabled, local AI calls consume the
> real free-tier allocation.

Test the pipeline (expected `source` in comments):

```bash
# static + matchedIntent
curl -s -X POST http://localhost:8787/ask -H "Content-Type: application/json" \
  -d '{"question":"What does Fredrik do well?","sessionId":"demo","page":"/"}'
# → { "answer": "...", "source": "static", "matchedIntent": "strengths" }

# blocked (never reaches AI)
curl -s -X POST http://localhost:8787/ask -H "Content-Type: application/json" \
  -d '{"question":"What is his salary?","sessionId":"demo"}'
# → { "answer": "...", "source": "blocked", "matchedIntent": "sensitive" }

# ai (AI enabled + bound) or fallback (AI off/unavailable)
curl -s -X POST http://localhost:8787/ask -H "Content-Type: application/json" \
  -d '{"question":"How does Fredrik approach code reviews?","sessionId":"demo"}'

# rate_limited (11th+ request with the same sessionId inside 60s)
for i in $(seq 1 11); do curl -s -X POST http://localhost:8787/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"test '$i'","sessionId":"same-session"}' | head -c 120; echo; done
```

Read the logs back (token from `.dev.vars`) and verify the `source` values:

```bash
curl -s "http://localhost:8787/admin/logs?limit=25" -H "Authorization: Bearer dev-admin-token"

npx wrangler d1 execute ask-fredrik-db --local --command \
  "SELECT source, matched_intent, model, latency_ms, question FROM ask_fredrik_logs ORDER BY created_at DESC LIMIT 10"
```

Type-check with `npm run check`.

## Deploy (Workers Free)

```bash
npm run deploy
```

Wrangler prints the public URL, e.g. `https://ask-fredrik-worker.<your-subdomain>.workers.dev`.
To enable AI in production, set `ASK_FREDRIK_AI_ENABLED` to `"true"` in `wrangler.jsonc`
and redeploy. Verify against production the same way as locally (the admin call with your
real `ADMIN_TOKEN`):

```bash
curl -s "https://ask-fredrik-worker.<your-subdomain>.workers.dev/admin/logs?limit=50" \
  -H "Authorization: Bearer <your ADMIN_TOKEN>"
```

## Pointing the frontend at the Worker

`VITE_ASK_FREDRIK_API_URL` is the **full endpoint URL including `/ask`**. It is a public
build-time URL — never a key or secret.

- **Local:** create `.env.local` in the repo root (gitignored) with
  `VITE_ASK_FREDRIK_API_URL=http://localhost:8787/ask` and restart `npm run dev`.
- **GitHub Pages:** set a repository **Actions variable** (Settings → Secrets and variables →
  Actions → Variables) named `VITE_ASK_FREDRIK_API_URL` to
  `https://ask-fredrik-worker.<your-subdomain>.workers.dev/ask`. The deploy workflow passes it
  into the build; leave it unset and the site keeps using its own static answers.

Since the Worker now carries the same curated static answers as the frontend (plus AI), it
is safe to point the Pages build here once the Worker is deployed — suggested questions get
identical answers either way, and only genuinely novel questions cost AI usage.
