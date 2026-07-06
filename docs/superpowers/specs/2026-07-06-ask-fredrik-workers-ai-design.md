# Ask Fredrik v4 — Workers AI + Worker-side matcher + rate limiting (2026-07-06)

User-directed 14-point brief (prompt 4): add Workers AI as an optional, fallback-first
answer stage; fold the frontend's keyword/static matcher into the Worker so
`matched_intent` logs real data; block sensitive questions before AI; add basic free-tier
rate limiting on `/ask`; keep D1 logging, the protected `/admin/logs`, graceful
degradation, and Cloudflare Free compatibility. No deploy, no paid providers, no secrets
in frontend code. This doc records the decisions made inside the brief's degrees of freedom.

## Decisions

### Pipeline order

rate limit → sensitive filter → curated matcher → Workers AI → curated fallback.
Sensitive runs *before* the matcher so a question that hits both (e.g. "what salary for a
senior role?") is blocked, not answered. AI runs only when explicitly enabled
(`ASK_FREDRIK_AI_ENABLED === "true"`), bound, and nothing earlier matched. Every stage
answers HTTP 200 — rate-limited/blocked get polite canned answers the widget renders
normally (the frontend treats non-2xx as failure and would silently swap to its own static
answers, hiding the message).

### Module split

- `src/fredrik-context.ts` — all data: approved context (brief item 7's fact list +
  projects), the 10 curated intents, sensitive keywords, canned answers, AI system prompt.
- `src/matcher.ts` — normalization + keyword scoring (ported 1:1 from
  `src/lib/askFredrik.ts`, including the pad-short-words trick so "ai" can't match inside
  "maintain"), plus the sensitive check using the same mechanism.
- `src/index.ts` — routing, validation, CORS, rate limiter, guarded AI call, D1 logging.

The Worker's `technical_stack`/`ai_experience` answers were synced with the user's
same-day frontend edits naming Codex/Claude Code. Known drift risk: two knowledge bases
(frontend `fredrikContext.ts`, Worker `fredrik-context.ts`) must be updated together —
accepted for now; noted in the v3 review as a candidate for extraction later.

### Workers AI call

`AiBinding` is a minimal structural interface (`run(model, inputs)`) rather than the
`@cloudflare/workers-types` `Ai` type — the binding stays optional, no type gymnastics
around the model-id union, and the Worker compiles/runs with or without the binding.
The call is `Promise.race`d against the timeout, sends exactly system prompt + question
(never logs/tokens/hashes/metadata), caps `max_tokens`, accepts `{ response: string }` or
a bare string, and resolves to null on any failure → curated fallback. No retries, no
streaming. Model id is `ASK_FREDRIK_MODEL` (default `@cf/meta/llama-3.1-8b-instruct`) so a
retired model is a config change, not a code change.

### Rate limiting: in-memory, not D1

The brief allowed either. Chose an in-memory sliding window (default 10 valid requests /
60 s) keyed by `sessionId` **and** salted IP hash — a D1-based limiter would put a read on
the hot path, cost writes, and still be racy with `ctx.waitUntil` logging. Per-isolate
best-effort is documented as basic abuse protection (the goal is "one client can't burn
the AI daily allocation"), with a free WAF rate rule named as the hard-guarantee upgrade.
When `IP_HASH_SALT` is unset the limiter uses a lazily created per-isolate random salt —
raw IPs are never stored anywhere, and the ephemeral salt is created inside the handler
because the Workers runtime forbids `crypto.randomUUID()` in global scope (caught live:
module-scope init crashed workerd on startup). No new D1 table; `schema.sql` unchanged.

### Config

`wrangler.jsonc` (not .toml — README shows both): `"ai": { "binding": "AI" }` plus a
`vars` block shipping every tuning var with `ASK_FREDRIK_AI_ENABLED: "false"`. Go-live is
flip-to-"true" + `npm run deploy`. All vars optional; code falls back to the same defaults
(6000 ms timeout, 250 max tokens, 60 s / 10 req window) on unset/garbage values via a
bounded `envInt`.

### Local dev without a workers.dev subdomain

The AI binding makes `wrangler dev` open a remote proxy session, which fails on this
account until a workers.dev subdomain is registered (one-time dash action, needed for
deploy anyway). Added `wrangler.dev-noai.jsonc` + `npm run dev:noai` — identical config
minus the AI binding — so local dev keeps working; it doubles as the "binding missing"
resilience path.

### Unchanged

Frontend untouched (contract already compatible; extra `matchedIntent` field is ignored).
`/admin/logs` auth, CORS design, validation rules, D1 schema, secrets — all carried over
from v3. Not deployed — the draft Worker still only holds secrets.

## Verification (wrangler dev via dev:noai, node fetch probes)

- All 10 intents return `source: "static"` with the right `matchedIntent`; exact
  suggested-question matches and keyword paraphrases both land.
- Sensitive probes (salary, family, home address, credentials, current employer) →
  `blocked`/`sensitive`; salary+role overlap → blocked (order verified).
- False-positive guards: "What is his email?" → contact_resume (not blocked);
  "manage average workloads" doesn't trip the padded ` age ` keyword.
- Rate limit: 12 rapid requests, same sessionId → 1–10 answered, 11–12 `rate_limited`.
- AI disabled → unknown questions get `fallback`; AI **enabled but binding missing** →
  still `fallback` (guard verified at runtime).
- D1 rows show correct source/matched_intent/latency for every path; `/admin/logs` still
  401s without/with wrong token.
- Worker `tsc --noEmit` clean; root `npm run lint` green; root `npm run build` green
  (bundle delta this session comes from the user's own `src/data` edits, not the Worker).
- **Not verified:** a live `source: "ai"` answer — requires the workers.dev subdomain
  registration before `wrangler dev` can proxy the AI binding. The guard/fallback paths
  around the call are runtime-verified; the call itself follows the documented Workers AI
  `messages` API.
