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

GET /admin/me                            Cloudflare Access identity (no D1 needed)

→ 200 { "email": "...", "authMode": "access" | "dev" }
→ 401 { "error": "Unauthorized." }       missing/invalid Access assertion
→ 403 { "error": "Forbidden." }          valid identity, not on the admin allowlist
→ 503 { "error": "..." }                 Access env config missing (fail closed)

GET /admin/logs[?limit=&offset=&from=&to=&source=&intent=&q=]   (limit default 100, max 100)
Cloudflare Access (validated in-Worker)

→ 200 { "count": n, "total": N, "limit": l, "offset": o, "logs": [...] }
→ 400 { "error": "..." }                 bad filter/limit/offset
→ 401 / 403 / 503                        as for /admin/me (503 also when D1 is missing)

GET /admin/stats                         aggregate overview metrics
Cloudflare Access (validated in-Worker)

→ 200 { total, today, last7d, last30d, bySource, blocked, fallback,
        avgLatencyMs, avgLatencyMs7d,    // mean stored latency_ms; null when unrecorded
        topIntents:[{intent,count}], daily:[{day,count}] }
```

The `/admin/*` endpoints back the private [Ask-Fredrik dashboard](../../docs/ask-fredrik-dashboard.md),
which this Worker also **serves** as static assets at `/admin/ask-fredrik/` (built into
`./public` by the portfolio root's `npm run build:admin` — see Deploy below).
`/admin/logs` filters: `from`/`to` (ISO date/datetime bounds on `created_at`), `source`
(one of the five sources), `intent` (exact `matched_intent`), `q` (LIKE search on the
question), plus `limit`/`offset` pagination. All values are bound parameters. With no
params, `/admin/logs` is backward-compatible with the original curl contract (the new
`total`/`limit`/`offset` keys are additive).

Rate-limited and blocked questions still return HTTP 200 with a polite canned answer — the
widget renders it like any other reply. Responses never contain prompts, the approved
context object, secrets, stack traces, or internal error details.

`GET /` is a health check. CORS on `/ask` is allowlisted to local development
(`http://localhost:*`, `http://127.0.0.1:*`) and the GitHub Pages origin
(`https://eriksson008.github.io`) — edit the allowlist at the top of `src/index.ts`.

**Admin auth** is Cloudflare Access: the edge gate signs the user in, and the Worker
*re-validates* the forwarded `Cf-Access-Jwt-Assertion` JWT itself (`src/access.ts` — RS256
signature against the team JWKS, issuer, AUD tag, expiry) and then checks the verified email
against the `ADMIN_ALLOWED_EMAILS` secret. Client-supplied headers are never trusted as
identity, assertions are never logged, and all admin routes are read-only GETs. In production
the dashboard is same-origin with the Worker, so `/admin/*` answers CORS **only** for
localhost dev origins; no other origin can read it.

## Architecture

- `src/index.ts` — routing, validation, CORS, the answer pipeline, rate limiting, the
  guarded Workers AI call, D1 logging, and the admin endpoints.
- `src/access.ts` — Cloudflare Access authentication: zero-dependency WebCrypto validation
  of the Access JWT, the admin email allowlist, and the loopback-only local dev mode.
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
- `src/tests/knowledge.test.ts` + `src/tests/admin-auth.test.ts` — zero-dependency test
  scripts (`npm test`): knowledge/pipeline invariants, and the full admin auth path
  (signed/forged/expired assertions, allowlist, dev-mode gating) against the real fetch
  handler.

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
rule (free tier includes one) in front of the Worker. `/admin/*` is not rate-limited
(Access-gated instead).

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
"assets": { "directory": "./public" },   // admin dashboard (built by `npm run build:admin`)
"vars": {
  "ACCESS_TEAM_DOMAIN": "",              // https://<team>.cloudflareaccess.com — admin auth
  "ACCESS_APP_AUD": "",                  // Access app AUD tag — admin auth
  "ASK_FREDRIK_AI_ENABLED": "false",                      // flip to "true" to enable AI
  "ASK_FREDRIK_MODEL": "@cf/meta/llama-3.1-8b-instruct-fp8",
  "ASK_FREDRIK_AI_TIMEOUT_MS": "6000",
  "ASK_FREDRIK_MAX_OUTPUT_TOKENS": "250",
  "ASK_FREDRIK_RATE_LIMIT_WINDOW_SECONDS": "60",
  "ASK_FREDRIK_RATE_LIMIT_MAX_REQUESTS": "10",
  "ASK_FREDRIK_LOG_MAX_ROWS": "1000"          // FIFO log retention; "0" = keep forever
}
```

```toml
# wrangler.toml equivalent
[ai]
binding = "AI"

[vars]
ACCESS_TEAM_DOMAIN = ""
ACCESS_APP_AUD = ""
ASK_FREDRIK_AI_ENABLED = "true"
ASK_FREDRIK_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8"
ASK_FREDRIK_AI_TIMEOUT_MS = "6000"
ASK_FREDRIK_MAX_OUTPUT_TOKENS = "250"
ASK_FREDRIK_RATE_LIMIT_WINDOW_SECONDS = "60"
ASK_FREDRIK_RATE_LIMIT_MAX_REQUESTS = "10"
```

All tuning vars are optional — the Worker applies the same defaults in code when one is
unset or unparseable. The two `ACCESS_*` vars are required **for the admin endpoints only**
(empty → `/admin/*` fails closed with 503; `/ask` is unaffected).
`ASK_FREDRIK_AI_ENABLED` defaults to **off**; only the literal string `"true"`
enables AI. If `@cf/meta/llama-3.1-8b-instruct-fp8` is ever retired, set `ASK_FREDRIK_MODEL` to
any currently available small **instruct/text-generation** model from the
[Workers AI model catalog](https://developers.cloudflare.com/workers-ai/models/) (pick one
whose page shows the `messages` chat input) — no code change needed.

### Cloudflare Access setup (admin auth)

Admin authentication needs three pieces of configuration (no values belong in the repo
beyond the two non-secret vars):

| Config | Where | What |
| --- | --- | --- |
| Access application | Cloudflare dashboard | Workers & Pages → this Worker → Settings → Domains & Routes → `workers.dev` → **Enable Cloudflare Access**, then in Zero Trust scope the app to the **`/admin` paths only** (never `/ask` or `/`) and set its Allow policy to the admin email(s). |
| `ACCESS_TEAM_DOMAIN` | `wrangler.jsonc` var | `https://<team>.cloudflareaccess.com` (Zero Trust team domain). |
| `ACCESS_APP_AUD` | `wrangler.jsonc` var | The Access application's AUD tag (app overview page). |
| `ADMIN_ALLOWED_EMAILS` | Worker **secret** | Comma-separated admin email allowlist (case-insensitive). |

While any of the three env pieces is missing, every `/admin/*` request answers `503` — the
endpoints fail closed, and `/ask` is unaffected. The full checklist with verification steps
lives in [docs/ask-fredrik-dashboard.md](../../docs/ask-fredrik-dashboard.md).

### Secrets (production)

```bash
npx wrangler secret put ADMIN_ALLOWED_EMAILS   # comma-separated admin email allowlist
npx wrangler secret put IP_HASH_SALT           # long random string — salts the IP hash
```

If `IP_HASH_SALT` is unset, `ip_hash` is not stored (the rate limiter then uses a
per-isolate random salt instead). Secrets never appear in code, config, responses, or the
frontend bundle. The old `ADMIN_TOKEN` bearer secret is retired — delete it with
`npx wrangler secret delete ADMIN_TOKEN` once the Access setup is live. For `wrangler dev`,
put local-only values in `.dev.vars` (gitignored):

```
ASK_FREDRIK_DEV_AUTH=allow                  # loopback-only dev auth (see src/access.ts)
ASK_FREDRIK_DEV_AUTH_EMAIL=dev-admin@localhost
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

**Retention (FIFO):** the log is a rolling window, not an archive. After each insert the
Worker trims the table to the newest `ASK_FREDRIK_LOG_MAX_ROWS` rows (default **1000**;
set `"0"` to keep everything). The insert and trim run in one transactional D1 batch, off
the response path. Dashboard-side Workers Logs (observability) are separate and
short-lived — roughly 3 days on the Free plan; D1 is the durable record.

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

Read the logs back (the `.dev.vars` dev auth mode covers loopback requests — no header
needed) and verify the `source` values:

```bash
curl -s "http://127.0.0.1:8787/admin/me"              # → { "email": "...", "authMode": "dev" }
curl -s "http://127.0.0.1:8787/admin/logs?limit=25"

npx wrangler d1 execute ask-fredrik-db --local --command \
  "SELECT source, matched_intent, model, latency_ms, question FROM ask_fredrik_logs ORDER BY created_at DESC LIMIT 10"
```

Type-check with `npm run check`.

## Deploy (Workers Free)

```bash
# from the repo root: build the admin dashboard into ./public (Worker assets)
npm run build:admin

cd cloudflare/ask-fredrik-worker
npm run deploy
```

Wrangler prints the public URL, e.g. `https://ask-fredrik-worker.<your-subdomain>.workers.dev`.
The deploy uploads the Worker **and** the `./public` assets (the admin dashboard at
`/admin/ask-fredrik/`); skipping `build:admin` deploys with whatever assets were last built.

> **Order matters on first setup:** static assets are served at the edge *before* the Worker
> runs, so the dashboard **shell** (HTML/JS — it contains no data or secrets) is only gated by
> the Access app, not by the in-Worker JWT check. Create and path-scope the Access application
> **before** the first deploy that includes assets; the admin APIs themselves fail closed (503)
> either way.
To enable AI in production, set `ASK_FREDRIK_AI_ENABLED` to `"true"` in `wrangler.jsonc`
and redeploy. Verify production admin access through Cloudflare Access — in a browser via
the dashboard URL, or from a terminal:

```bash
cloudflared access login https://ask-fredrik-worker.<your-subdomain>.workers.dev/admin/me
curl -s "https://ask-fredrik-worker.<your-subdomain>.workers.dev/admin/logs?limit=50" \
  -H "cf-access-token: $(cloudflared access token -app=https://ask-fredrik-worker.<your-subdomain>.workers.dev/admin/me)"
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
