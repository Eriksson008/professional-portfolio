# Ask Fredrik v3 — D1 question logging + admin endpoint (2026-07-06)

User-directed 10-point brief (prompt 3): log every valid `/ask` question to Cloudflare D1
so recruiter questions can be reviewed, add a Bearer-protected `GET /admin/logs`, never
store raw IPs, never let logging break an answer, stay on Cloudflare Free, no AI yet.
This doc records the decisions made inside the brief's degrees of freedom.

## Decisions

### Logging is off the response path

The insert runs via `ctx.waitUntil(logQuestion(...))` *after* the answer is returned — a
recruiter never waits on D1. `logQuestion` guards on the binding (`ASK_FREDRIK_DB?` is
optional in `Env`) and wraps everything in try/catch with a `console.warn`; a dropped
table, missing binding, or D1 outage costs the log row, never the answer (probed live).

### What gets logged

All brief-listed columns. In v1 `matched_intent` and `model` are logged as NULL — the
Worker has no intent matching or AI yet; the columns exist so the Workers-AI upgrade needs
no schema migration. `session_id`/`page` come from the request body (string-checked and
length-capped at 100/300 chars); `referrer`/`user_agent` from headers; `latency_ms` is
Worker processing time (≈0 for the constant answer — becomes meaningful with AI).

### IP privacy

Raw IPs are never stored. `ip_hash` = hex SHA-256 of `"{IP_HASH_SALT}:{CF-Connecting-IP}"`
via WebCrypto; if the `IP_HASH_SALT` secret or the header is absent the column is NULL.
Verified deterministic (same IP → same 64-char hash) by injecting `CF-Connecting-IP`
locally — in production Cloudflare's edge sets that header itself and overwrites
client-supplied values, so the injection is a local-only test path.

### Admin endpoint

`GET /admin/logs`: 503 `Admin endpoint is not configured.` when `ADMIN_TOKEN` secret is
unset (fails closed, doesn't reveal whether logs exist); exact `Bearer <token>` match else
401 + `WWW-Authenticate`; 503 when the D1 binding is missing; `?limit` must be an integer
1–100 (default 100) else 400; rows ordered `created_at DESC`; D1 query failure → safe 500
JSON. **No CORS headers on any admin response** — browser pages on other origins can never
read it (and the `/ask` preflight was scoped into the `/ask` route, so `Authorization` is
never an allowed CORS header anywhere). Secrets never appear in responses, config, code,
or the frontend bundle; local dev values live in `.dev.vars` (gitignored).

### Config

`wrangler.jsonc` declares the `ASK_FREDRIK_DB` binding with database_name
`ask-fredrik-db` and a `REPLACE_WITH_YOUR_DATABASE_ID` placeholder — local dev (miniflare
SQLite under `.wrangler/state`) works with the placeholder; deploy requires
`npx wrangler d1 create ask-fredrik-db` + pasting the real id (README steps). Schema is
applied with `wrangler d1 execute … --local|--remote --file=./schema.sql`.

### Unchanged

Frontend untouched this prompt (it already sends `question`/`sessionId`/`page`); bundle
byte-identical. `/ask` contract, validation, CORS allowlist, deterministic fallback answer,
and the hold-off-on-`VITE_ASK_FREDRIK_API_URL` guidance all carry over. No AI, no paid
services — Workers Free + D1 Free.

## Verification (curl + wrangler d1 against wrangler dev)

- Questions logged with sessionId/page/referrer/UA; `/admin/logs` returns them newest-first.
- Auth: no token → 401, wrong token → 401, correct → 200; POST → 405; no-secrets run →
  503 even with a previously-valid token.
- `?limit=25` honored; 0 / `abc` / 1000 → 400.
- Admin response carries no `Access-Control-Allow-Origin` even for the allowlisted Pages
  origin; `/ask` CORS unchanged.
- IP hashing: salt+IP → stable 64-hex hash; salt removed → row logged with NULL ip_hash.
- Resilience: table dropped → `/ask` still 200 with the answer, `console.warn` captured in
  wrangler output (`D1_ERROR: no such table`), `/admin/logs` → safe 500.
- Worker `tsc --noEmit` clean; root `npm run lint` + `npm run build` green.
