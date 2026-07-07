# Ask Fredrik Worker

Cloudflare Worker backend for the portfolio's "Ask Fredrik" assistant. Runs entirely on the
**Workers Free + D1 Free + Workers AI Free** plans — no API keys in code, no paid services,
no OpenAI/Anthropic/Gemini keys. Every valid question is answered by the first stage that
matches, in this order:

| # | Stage | `source` | When |
|---|-------|----------|------|
| 1 | Rate limiter | `rate_limited` | Client exceeded the per-window request budget |
| 2 | Sensitive filter | `blocked` | Salary/private/confidential/credentials topics |
| 3 | Curated matcher | `static` | Curated Q&A, the skill/project knowledge base, and the conservative not-confirmed answer |
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
- `src/data/fredrik-skills.ts` — approved public-safe **skills**: typed entries with
  aliases, an explicit confidence level (`professional` / `project` / `personal` /
  `learning`), and the exact `allowedAnswer` the assistant may give.
- `src/data/fredrik-projects.ts` — approved public-safe **project summaries**: status,
  technologies, highlights, explicit `boundaries` for private projects, and the exact
  `allowedAnswer`.
- `src/data/fredrik-qa.ts` — **curated Q&A** for common recruiter intents.
- `src/fredrik-context.ts` — aggregates the data modules: base public facts, the
  sensitive-keyword list, canned blocked/rate-limited/not-confirmed/fallback answers, and
  `buildFredrikSystemPrompt()` — the only source of what the AI may speak from. Same rules
  as the résumé: public facts only, no internal codenames, git-verifiable metrics only.
- `src/matcher.ts` — normalization + matching: the sensitive filter, curated exact/keyword
  matching, `findSkillKnowledge` / `findProjectKnowledge` alias matching, the
  not-confirmed detector, and `resolveLocalAnswer()` (the whole pre-AI pipeline in one
  call, shared with the tests). Deliberately simple substring scoring, no NLP.
- `src/tests/knowledge.test.ts` — zero-dependency test script (`npm test`).

### Local resolution order (inside stage 3)

1. **Curated exact match** — the canonical recruiter questions keep their curated answers.
2. **Knowledge base** — skill/project aliases (longest match wins), logged as
   `skill:<name>` / `project:<name>` (e.g. `skill:tailscale`, `project:homebase`).
3. **Curated keyword scoring** — broad recruiter phrasings (`strengths`, `role_fit`,
   `strongest_projects`, `technical_stack`, `why_interview`, `leadership`,
   `ai_experience`, `cloud_experience`, `salesforce_experience`, `production_support`,
   `contact_resume`).
4. **Not-confirmed detector** — "experience with X?"-shaped questions about a technology
   that is *not* in the knowledge base get a deterministic conservative answer
   (`skill_not_confirmed`): the bot never claims or invents unlisted experience.

The widget's suggested questions all land in 1–3 — instant, free, deterministic, and
logged with a real `matched_intent`. This is also why enabling AI is cheap: the most
common questions never reach the model.

### Sensitive questions

Questions touching salary/compensation, confidential employer details, private
personal/family/household/home information, secrets/credentials, or internal proprietary
systems are answered with a fixed polite refusal (`source: "blocked"`,
`matched_intent: "sensitive"`) and **never reach the model**. The AI system prompt repeats
the same restrictions as a second layer.

## Maintaining the knowledge base

> **⚠️ Never connect the private second brain (or any private notes, files, or internal
> employer material) to this public chatbot.** The knowledge base is a *curated* public
> layer: every entry must be something you would happily publish directly on the portfolio
> website. There is no RAG, no D1/Vectorize knowledge store, and none should be added
> without an explicit decision — static typed TypeScript is the design.

### Adding a public-safe skill

Add a `SkillKnowledge` entry to `src/data/fredrik-skills.ts`:

- `confidence` must be honest: `professional` (enterprise production work), `project`
  (real shipped personal/side-project use), `personal` (hands-on personal infrastructure),
  `learning` (exploring — the answer must say so). Never present personal/project
  experience as enterprise experience.
- `aliases` are lowercase, normalized phrases (run them through `normalize()` mentally:
  no punctuation beyond `/+#.-`). Words of ≤4 chars are matched as whole words
  automatically. Avoid generic words (`ai`, `cloud`, `experience`) that would hijack the
  curated recruiter intents.
- `allowedAnswer` is the exact answer users see — concise, recruiter-friendly,
  conservative. Don't overstate; name the confidence level in prose when it isn't
  enterprise experience (see the Tailscale entry as the template).

### Adding a project summary

Add a `ProjectKnowledge` entry to `src/data/fredrik-projects.ts`. For `private` projects,
`boundaries` is required (the tests enforce it) — list exactly what must never be
revealed, and write the `allowedAnswer` at concept level only. Enterprise projects stay
generic: no internal codenames, client names, URLs, or confidential architecture.

### Adding curated Q&A

Add a `CuratedAnswer` to `src/data/fredrik-qa.ts`. The `question` string is matched
exactly (it wins over everything except the sensitive filter); `keywords` are scored one
point per matched phrase, ties keep the earliest entry, so order entries by recruiter
relevance.

### What NOT to include — ever

Raw second-brain content; private project notes; employer-confidential implementation
details; internal system/project codenames; client names; internal URLs or private
endpoints; credentials, tokens, or secrets; architecture diagrams; personal logistics,
finances, bills, vendors, household or family details; home address or exact location;
invented, inferred, or inflated experience; metrics without a documented baseline.

### Testing chatbot answers locally

```bash
npm test        # zero-dependency knowledge/pipeline tests (plain Node ≥22.18)
npm run check   # TypeScript
```

`npm test` runs `src/tests/knowledge.test.ts` against `resolveLocalAnswer()` — the exact
function production runs — covering: approved skills return their approved answers
(Tailscale, Cloudflare Workers, AWS…), projects stay concept-level (Homebase, Second
Brain), unknown skills get the deterministic not-confirmed answer instead of a
hallucination, sensitive topics stay blocked, and the data files keep their public-safety
invariants (everything `publicSafe`, private projects declare `boundaries`, aliases
normalized). Add a test when you add an entry. For end-to-end checks, use
`npm run dev:noai` + the curl examples below.

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
  "ASK_FREDRIK_MODEL": "@cf/meta/llama-3.1-8b-instruct-fp8",
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
ASK_FREDRIK_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8"
ASK_FREDRIK_AI_TIMEOUT_MS = "6000"
ASK_FREDRIK_MAX_OUTPUT_TOKENS = "250"
ASK_FREDRIK_RATE_LIMIT_WINDOW_SECONDS = "60"
ASK_FREDRIK_RATE_LIMIT_MAX_REQUESTS = "10"
```

All vars are optional — the Worker applies the same defaults in code when one is unset or
unparseable. `ASK_FREDRIK_AI_ENABLED` defaults to **off**; only the literal string `"true"`
enables AI. If `@cf/meta/llama-3.1-8b-instruct-fp8` is ever retired, set `ASK_FREDRIK_MODEL` to
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
