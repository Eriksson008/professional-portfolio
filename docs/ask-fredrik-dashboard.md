# Ask-Fredrik Admin Dashboard

A private, internal analytics panel for the **Ask Fredrik** feature — see what visitors are
prompting on the portfolio, with metrics, filtering, and a recent-prompts table. It is **not**
linked from the public site and is safe to publish: access is gated server-side by the Worker's
`ADMIN_TOKEN`, and the page only shows a token prompt to anyone without it.

- **Route:** `/admin/ask-fredrik/` (on GitHub Pages: `https://eriksson008.github.io/professional-portfolio/admin/ask-fredrik/`)
- **Frontend:** a separate Vite entry (`admin/ask-fredrik/index.html` + `src/admin/**`). None of
  this code is bundled into the public site.
- **Backend:** the existing Ask-Fredrik Cloudflare Worker (`cloudflare/ask-fredrik-worker`), via
  two token-protected endpoints — `GET /admin/stats` and `GET /admin/logs`.

## How auth works

There are **no secrets in the frontend bundle.** The flow:

1. The admin opens the dashboard and enters the `ADMIN_TOKEN` into the login field.
2. The token is held only in that browser tab's `sessionStorage` (cleared when the tab closes)
   and sent as an `Authorization: Bearer <token>` header on each API call.
3. The Worker validates the bearer against its `ADMIN_TOKEN` secret. No token / wrong token →
   `401`, and the dashboard drops back to the login screen.

This is the simplest secure option for a statically-hosted panel against a token-protected API.
Because auth is a header (not a cookie), there is no CSRF surface. Cloudflare Access was **not**
used — the project doesn't have it wired, and the token gate already existed server-side.

> The token is a Worker secret. Never commit it, never bake it into a build, never paste it into
> a URL. Rotate with `npx wrangler secret put ADMIN_TOKEN` (see the Worker README).

## Enabling the dashboard

### 1. Point the build at the Worker

The dashboard derives its admin API origin from the public Ask-Fredrik API URL, so the single
existing variable is enough:

| Variable | Purpose |
| --- | --- |
| `VITE_ASK_FREDRIK_API_URL` | The Worker's `/ask` URL. The dashboard uses its **origin** for `/admin/*`. Required for the panel to reach the API. |
| `VITE_ASK_FREDRIK_ADMIN_URL` | *(optional)* Override the admin API origin explicitly. Rarely needed. |
| `ENABLE_ASK_DASHBOARD` | *(optional, build-time)* Set to `false` to exclude the admin entry from the build entirely. Default: included. |

On **GitHub Pages**, `VITE_ASK_FREDRIK_API_URL` is already wired as a repo Actions *variable*
(see `.github/workflows/deploy.yml`); the dashboard reuses it automatically.

> **Production is gated OFF by default.** `.github/workflows/deploy.yml` currently sets
> `ENABLE_ASK_DASHBOARD: 'false'` so a push to `main` will **not** publish the panel — this
> prevents shipping it before the Worker that carries `GET /admin/stats` + admin CORS is
> deployed. **To publish the dashboard:** (1) `cd cloudflare/ask-fredrik-worker && npx wrangler
> deploy`, then (2) in `deploy.yml` change `ENABLE_ASK_DASHBOARD` to `'true'` (or delete the line
> — the build defaults to enabled) and push to `main`. Local dev/preview are unaffected and stay
> enabled regardless.

### 2. Configure the Worker (one-time)

Already done in production, but for a fresh setup:

```bash
cd cloudflare/ask-fredrik-worker
npx wrangler secret put ADMIN_TOKEN     # long random string
npx wrangler d1 execute ask-fredrik-db --remote --file=./schema.sql
npx wrangler deploy
```

## Local development

```bash
# 1. Worker with a seeded local D1 (dev token lives in .dev.vars: ADMIN_TOKEN=dev-admin-token)
cd cloudflare/ask-fredrik-worker
npx wrangler d1 execute ask-fredrik-db --local --file=./schema.sql
npx wrangler dev --local --port 8799

# 2. Site wired to that Worker
cd ../..
VITE_ASK_FREDRIK_API_URL=http://127.0.0.1:8799/ask npm run build
npm run preview          # http://localhost:8790/admin/ask-fredrik/
```

Enter `dev-admin-token` at the login screen. `localhost`/`127.0.0.1` are in the Worker's CORS
allowlist, so the browser panel can read the admin endpoints in dev.

## What the D1 schema provides

The dashboard reads the existing `ask_fredrik_logs` table (`cloudflare/ask-fredrik-worker/schema.sql`).
**No migration is required** — every field the dashboard shows already exists:

| Column | Used for |
| --- | --- |
| `created_at` (ISO8601) | timestamps, date filtering, daily sparkline |
| `question`, `answer` | prompt text (redacted on display) |
| `source` | result-type badge + filter + source breakdown (`ai`/`static`/`fallback`/`blocked`/`rate_limited`) |
| `matched_intent` | intent column + filter + "top intents" |
| `latency_ms`, `model` | latency + model columns |
| `session_id`, `page` | CSV export context |
| `ip_hash` | never displayed; raw IPs are never stored |

The table is FIFO-capped (~1000 rows, `ASK_FREDRIK_LOG_MAX_ROWS`), so "all time" means the most
recent ~1000 prompts.

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
- The admin token is never logged and never leaves the browser tab except as a bearer header.

## Features

- Summary metric cards: total / today / last 7d / last 30d / blocked / fallback.
- Result-source breakdown, top intents, and a dependency-free 14-day volume sparkline.
- Time-range selector (Today / 7d / 30d / All / Custom), prompt search, and source/intent
  filters, with pagination.
- Responsive recent-prompts table that collapses into cards on mobile; per-row copy button.
- CSV export of the current filtered result set.
- Loading / empty / error / unauthorized states.

## Deploying safely

- The panel is unlinked and `noindex, nofollow`; discovery is not the security boundary — the
  `ADMIN_TOKEN` is.
- To keep it out of a build entirely, set `ENABLE_ASK_DASHBOARD=false`.
- Keep `ADMIN_TOKEN` strong and rotate it if it may have leaked; the dashboard immediately loses
  access on rotation.
