# Ask-Fredrik Admin Dashboard

A private, internal analytics panel for the **Ask Fredrik** feature — see what visitors are
prompting on the portfolio, with metrics, filtering, and a recent-prompts table. It is **not**
linked from the public site. In production the panel is served by the Ask-Fredrik **Worker
itself** and protected by **Cloudflare Access**: the page and every admin API sit behind an
Access sign-in, and the Worker re-validates the Access identity on every request.

- **Route (production):** `https://ask-fredrik-worker.<account>.workers.dev/admin/ask-fredrik/`
  — served from the Worker's static assets, behind Cloudflare Access. The panel is **no longer
  part of the GitHub Pages build** (Pages can't be Access-protected; nothing admin-related ships
  in the public artifact anymore).
- **Frontend:** a separate Vite entry (`admin/ask-fredrik/index.html` + `src/admin/**`), built
  by `npm run build:admin` into `cloudflare/ask-fredrik-worker/public/` (gitignored). None of
  this code is bundled into the public site.
- **Backend:** the same Worker (`cloudflare/ask-fredrik-worker`), via three Access-protected
  endpoints — `GET /admin/me`, `GET /admin/stats`, `GET /admin/logs`.

## How auth works

There are **no secrets in the frontend bundle, no login form, and nothing stored by the app**
(no localStorage/sessionStorage/JS cookies). The flow:

1. The admin opens the dashboard URL. Cloudflare Access intercepts at the edge and runs its
   sign-in (email one-time PIN or whatever IdP the Access policy allows). Access sets its own
   `CF_Authorization` cookie for the Worker's origin.
2. The page loads and calls `GET /admin/me` (same origin, so the Access cookie rides along).
   Cloudflare injects the signed identity JWT into the request as the
   `Cf-Access-Jwt-Assertion` header.
3. The Worker **re-validates the JWT itself** (`src/access.ts`): RS256 signature against the
   team's public keys (`<team>.cloudflareaccess.com/cdn-cgi/access/certs`), issuer, the
   application's AUD tag, and expiry — then checks the verified `email` claim against the
   `ADMIN_ALLOWED_EMAILS` secret. Missing/invalid assertion → `401`; valid identity that isn't
   allowlisted → `403`; Access config not set → `503` (fail closed).
4. The dashboard shows the verified administrator email in the header. Sign out is Access's own
   `/cdn-cgi/access/logout`.

Client-supplied values are never trusted for identity: the only accepted proof is the signed
assertion, verified in the Worker. The edge gate alone is deliberately not trusted either —
defense in depth, and the email allowlist can be narrower than the Access policy.

### Threat model (brief)

- **Stolen/forged assertion:** rejected — signature is verified against Cloudflare's published
  keys; `alg` is pinned to RS256, audience and issuer are pinned to this app and team, expiry
  is enforced. The assertion is never logged.
- **CSRF / cross-site reads:** all admin routes are read-only `GET`s; the Access cookie is not
  sent cross-site under default SameSite handling, admin CORS answers only localhost dev
  origins, and responses are unreadable cross-origin in production. There are no state-changing
  admin endpoints today — if one is added, add CSRF protection (e.g. a custom header
  requirement) at that point.
- **Leaked dev bypass:** `ASK_FREDRIK_DEV_AUTH` only works for loopback hostnames, which never
  route to the deployed Worker; it also lives only in `.dev.vars` (gitignored), never in
  committed config. Covered by tests.
- **Public surface:** `POST /ask` and `GET /` (health) are intentionally public and unchanged;
  the Access app must be path-scoped so it doesn't gate them (see checklist).
- **What the logs hold:** visitor questions (public-safe by policy, but treat as
  user-generated), answer, source/intent/model/latency, referrer, user-agent, salted IP hash —
  no raw IPs, no auth material. The dashboard redacts obvious PII on display.

## Cloudflare dashboard configuration (one-time, outside the repo)

> **Status: completed 2026-07-23.** Access is enabled on the production `workers.dev` URL,
> the app is scoped to `.../admin`, the PIN policy allows the admin email, both vars are in
> `wrangler.jsonc`, the `ADMIN_ALLOWED_EMAILS` secret is set, `ADMIN_TOKEN` is deleted, and
> the live flow is verified. Kept below as the reference for re-setup. Gotcha:
> `ACCESS_TEAM_DOMAIN` needs the `https://` scheme — the bare hostname fails closed (401).

The repo can't do these; they're Cloudflare-dashboard-side:

1. **Create the Access application.** Workers & Pages → `ask-fredrik-worker` → Settings →
   Domains & Routes → `workers.dev` → **Enable Cloudflare Access** (one-click), then **Manage
   Cloudflare Access** to open the app in Zero Trust.
2. **Scope it to `/admin`.** In Zero Trust → Access → Applications, edit the application so it
   covers only the admin paths (path `admin` / `admin*` on the Worker's hostname) — **`/ask`
   and `/` must stay public** or the portfolio widget and uptime checks break.
3. **Set the policy** to Allow → Include → Emails → the administrator email(s). (The Worker
   enforces its own allowlist too; keep them in sync.)
4. **Copy the app's AUD tag** (application overview) and the **team domain**
   (`https://<team>.cloudflareaccess.com`) into `wrangler.jsonc` →
   `ACCESS_APP_AUD` / `ACCESS_TEAM_DOMAIN`.
5. **Set the Worker secret allowlist:**
   `npx wrangler secret put ADMIN_ALLOWED_EMAILS` (comma-separated, case-insensitive).
6. **Deploy:** from the repo root `npm run build:admin`, then
   `cd cloudflare/ask-fredrik-worker && npm run deploy`.
7. **Verify:** `curl -X POST <worker>/ask -H 'Content-Type: application/json' -d
   '{"question":"Does Fredrik know React?"}'` still answers **without** auth;
   `curl <worker>/admin/me` returns a redirect/deny from Access; the dashboard URL runs the
   Access sign-in and then loads.

Until steps 1–5 are done, every admin endpoint answers `503` (fail closed) and the public
`/ask` keeps working.

### CLI access (replaces the old curl-with-token workflow)

`cloudflared` can mint an Access token for the same identity:

```bash
cloudflared access login https://<worker>/admin/me
curl -H "cf-access-token: $(cloudflared access token -app=https://<worker>/admin/me)" \
  "https://<worker>/admin/logs?limit=5"
```

(Access **service tokens** for non-interactive automation are a possible follow-up; the Worker
middleware currently validates user identities only.)

## Local development

No Access involved locally. The Worker has an explicit dev auth mode that only works on
loopback hosts:

```bash
# 1. Worker with a seeded local D1. .dev.vars (gitignored) carries:
#      ASK_FREDRIK_DEV_AUTH=allow          ← the dev auth mode
#      ASK_FREDRIK_DEV_AUTH_EMAIL=dev-admin@localhost   (optional)
cd cloudflare/ask-fredrik-worker
npx wrangler d1 execute ask-fredrik-db --local --file=./schema.sql
npm run dev:noai        # http://127.0.0.1:8787

# 2. Site dev server pointed at that Worker
cd ../..
VITE_ASK_FREDRIK_ADMIN_URL=http://127.0.0.1:8787 npm run dev
# → http://localhost:8790/admin/ask-fredrik/  (signed in as dev-admin@localhost, "dev session" badge)
```

Why this can't leak into production: the bypass requires **both** the `ASK_FREDRIK_DEV_AUTH`
var (never in `wrangler.jsonc`, only `.dev.vars`) **and** a loopback request hostname —
requests to the deployed `workers.dev` hostname can never satisfy the second condition. Both
protections are covered by `src/tests/admin-auth.test.ts`.

`localhost`/`127.0.0.1` origins are in the Worker's admin CORS allowlist, so the Vite dev
server can read the admin endpoints; in production the dashboard is same-origin and no admin
CORS is emitted at all.

## What the D1 schema provides

The dashboard reads the existing `ask_fredrik_logs` table (`cloudflare/ask-fredrik-worker/schema.sql`).
**No migration is required** — every field the dashboard shows already exists:

| Column | Used for |
| --- | --- |
| `created_at` (ISO8601) | timestamps, date filtering, daily sparkline |
| `question`, `answer` | prompt text (redacted on display) |
| `source` | result-type badge + filter + source breakdown (`ai`/`static`/`fallback`/`blocked`/`rate_limited`) |
| `matched_intent` | intent column + filter + "top intents" |
| `latency_ms`, `model` | latency + model columns, avg-answer-time cards |
| `session_id`, `page` | CSV export context |
| `ip_hash` | never displayed; raw IPs are never stored |

The table is FIFO-capped (~1000 rows, `ASK_FREDRIK_LOG_MAX_ROWS`), so "all time" means the most
recent ~1000 prompts. Metrics the data can't support (per-request error/success beyond the
source breakdown, token counts, cost) are **not shown or invented**; the avg-answer-time cards
render "not recorded" when no row carries a latency.

## Time zones

Timestamps are stored and queried in **UTC** (`created_at` is an ISO8601 instant) — that never
changes. Everything user-facing is anchored to the **viewer's local timezone**, so the filters
line up with the times shown in the table:

- The table renders each `created_at` in local time (`formatDashboardDate`); hover a row's time to
  see the exact raw UTC instant.
- **Today** and **Custom** ranges are computed from the local calendar day and then serialized to
  UTC for the query (`getDateRangeForFilter` in `src/admin/dateRanges.ts`). A custom `to = <day>`
  is inclusive of that whole local day. This avoids the off-by-one where a prompt shown as "today"
  in local time fell outside a UTC-day filter.
- **Last 7 / 30 days** are rolling `N×24h` windows (timezone-independent).
- The **Today** summary card matches the Today filter: the dashboard passes its local start-of-day
  to `GET /admin/stats?today=<iso>` (older Workers ignore the param and fall back to the UTC day).
- Known minor limitation: the 14-day volume sparkline still buckets by UTC calendar day, so a bar
  boundary can be off by the UTC offset near midnight. It's a trend indicator only.

The range logic is covered by `src/admin/dateRanges.test.ts` (`npm test`).

## Privacy

- **Display redaction:** the dashboard masks obvious emails → `[email]`, phone-like runs →
  `[phone]`, and long numeric IDs → `[id]` before rendering (`src/admin/redact.ts`). The raw D1
  data is **never** modified — redaction is display-only, and the CSV export uses the same
  redacted values so it never widens exposure beyond the screen.
- No raw IPs are shown or stored (only a salted hash exists in D1, and it isn't surfaced).
- No auth material is stored by the app or logged by the Worker: the Access assertion is
  validated and discarded, and error responses carry only generic messages.

## Features

- Summary metric cards: total / today / last 7d / last 30d / blocked / fallback / avg answer
  time (overall + 7d, from the stored `latency_ms`; "not recorded" when absent).
- Result-source breakdown (the honest success/failure picture — every request is answered;
  blocked and rate-limited are refusals), top intents, and a dependency-free 14-day volume
  sparkline.
- Time-range selector (Today / 7d / 30d / All / Custom), prompt search, and source/intent
  filters, with pagination.
- Responsive recent-prompts table that collapses into cards on mobile; per-row copy button.
- CSV export of the current filtered result set.
- Auth-aware states: checking / sign-in required / not authorized (allowlist) / error, plus
  loading / empty / error states for data, and the signed-in identity in the header.

## Deploying safely

- The panel is unlinked and `noindex, nofollow`; discovery is not the security boundary — the
  **Cloudflare Access policy + the Worker's assertion validation and email allowlist** are.
- The admin UI deploys **with the Worker** (`npm run build:admin`, then `npm run deploy` in
  `cloudflare/ask-fredrik-worker/`); the Pages workflow never publishes it.
- Rotating access = editing the Access policy and/or `wrangler secret put ADMIN_ALLOWED_EMAILS`;
  no token to rotate, nothing for a leaked laptop clipboard to hold.
