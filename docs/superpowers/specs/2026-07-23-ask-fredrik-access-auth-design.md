# Ask Fredrik admin: Cloudflare Access authentication — design (2026-07-23)

User-directed brief: replace the manually pasted `ADMIN_TOKEN` bearer with Cloudflare Access,
add `/admin/me`, evolve the admin panel toward an observability console, keep `/ask` public.

## Decisions

1. **The admin UI moves to the Worker's own origin** (Workers static assets, served at
   `https://ask-fredrik-worker.<account>.workers.dev/admin/ask-fredrik/`), and out of the
   GitHub Pages artifact. Rationale:
   - GitHub Pages is not on a Cloudflare zone, so Access can never protect the page there —
     the brief requires the *deployed admin page* to be protected.
   - A cross-origin SPA calling an Access-protected API is the pattern Cloudflare's own docs
     warn against (pre-login fetches die as CORS errors; `CF_Authorization` becomes a
     third-party cookie, blocked in incognito/Safari). Same-origin removes the whole class:
     no admin CORS in production, first-party cookie, no CSRF regression.
   - Cloudflare Access supports `workers.dev` directly (one-click "Enable Cloudflare Access"
     on the Worker's Domains & Routes, Oct 2025 feature) — no custom domain needed.
2. **The Access application must be path-scoped to `/admin`** so `POST /ask` and `GET /`
   (health) stay public. This is dashboard-side configuration; the checklist in the dashboard
   doc includes a verification step (`curl /ask` unauthenticated after enabling).
3. **The Worker validates the Access JWT itself** (`Cf-Access-Jwt-Assertion`) — edge Access
   alone is not trusted. Zero-dependency WebCrypto validation (`src/access.ts`): RS256
   signature against the team JWKS (`<team>/cdn-cgi/access/certs`, cached per isolate,
   refetched on unknown `kid`), `iss` = team domain, `aud` contains the app AUD, `exp`/`nbf`
   with 60 s leeway — then the `email` claim must be in an allowlist. 401 for missing/invalid
   assertion, 403 for a valid assertion whose email is not allowlisted, 503 when Access config
   is absent (fail closed). The assertion is never logged.
4. **Config:** `ACCESS_TEAM_DOMAIN` + `ACCESS_APP_AUD` are non-secret `vars` in
   `wrangler.jsonc` (filled in after the Access app is created); `ADMIN_ALLOWED_EMAILS` is a
   Worker **secret** (comma-separated, case-insensitive). `ADMIN_TOKEN` is removed entirely —
   CLI access goes through `cloudflared access curl` (same identity, same allowlist).
5. **Local dev mode:** `ASK_FREDRIK_DEV_AUTH=allow` in `.dev.vars` (gitignored, never in
   `wrangler.jsonc`) **and** the request hostname must be `localhost`/`127.0.0.1` — both
   conditions, so a leaked var cannot open production (production requests can't route to the
   Worker with a localhost host). Dev identity email defaults to `dev-admin@localhost`
   (`ASK_FREDRIK_DEV_AUTH_EMAIL` overrides).
6. **`GET /admin/me`** returns `{ email, authMode: 'access' | 'dev' }` only. All three admin
   routes (`/admin/me`, `/admin/logs`, `/admin/stats`) share one middleware call; `/ask` and
   `GET /` are untouched. Admin CORS shrinks to localhost-only (production is same-origin).
7. **Frontend:** delete `TokenGate` + `sessionStorage` logic. Boot = `GET /admin/me` →
   states: checking / ready / unauthorized (reload to trigger the Access login) / forbidden /
   error. Identity shown unobtrusively in the header; Sign out = Access's own
   `/cdn-cgi/access/logout` (hidden in dev mode). Existing logs/stats UI preserved.
8. **Overview honesty:** `/admin/stats` gains `avgLatencyMs` + `avgLatencyMs7d` (from the
   stored `latency_ms`). "Success/failure" is represented as what the pipeline actually
   records — the source breakdown (answered ai/static vs fallback vs blocked vs
   rate_limited); no invented error metric. Missing values render as "not recorded".
9. **Build/deploy:** `npm run build:admin` (root) = Vite `--mode admin-worker` → admin entry
   only, base `/`, `outDir cloudflare/ask-fredrik-worker/public` (gitignored), `publicDir`
   off + copy of `admin-icons`/`admin.webmanifest`. The Pages build no longer includes the
   admin entry (`ENABLE_ASK_DASHBOARD` flag removed). Worker `dev`/`deploy` scripts ensure
   the assets dir exists.

## Non-goals

No custom auth, no password reset, no auth library, no service-token machinery (documented
as follow-up), no redesign of the public site or the `/ask` pipeline, no deploys from this
change itself.

## Test plan

Worker (zero-dep harness, new `src/tests/admin-auth.test.ts`, run via `npm test`): real
`fetch` handler with stub Env/D1/ExecutionContext and a locally-generated RSA keypair whose
JWKS is served by a stubbed global `fetch` — authorized access, missing/garbage/expired/
wrong-aud/wrong-issuer/alg-none/unknown-kid assertions, non-allowlisted email (403),
`/admin/me` shape, logs/stats gating, `/ask` + preflight still public, dev-mode hostname
gating (localhost yes, workers.dev no, unset var no). Frontend: pure error-classification
helper covered by `node:test`; React states verified in-browser.
