# Cloudflare Access auth for the Ask Fredrik admin app

## Outcome

The private admin dashboard (`/admin/ask-fredrik/`) no longer asks the administrator to paste a
bearer token. The deployed admin APIs (and, where the platform allows, the admin page) are
protected by **Cloudflare Access**: the browser authenticates via Access, the Worker validates
the Access identity assertion (JWT) against the team's public keys and an allowlisted admin
email, and the UI shows who is signed in. The admin area starts evolving into an AI
observability/eval console with an operations overview built from the data D1 already stores.

## Problem

Auth today is a manually copied `ADMIN_TOKEN` pasted into a login field, held in tab
`sessionStorage`, and sent as `Authorization: Bearer`. That is awkward (manual secret handling),
leaves a secret transiting the clipboard/browser, and doesn't scale into a real admin console.

## Scope

- `cloudflare/ask-fredrik-worker/` — Access-JWT validation middleware, admin route authorization,
  `GET /admin/me`, stats additions if cheap, tests, wrangler config vars, README.
- `src/admin/**` + `admin/ask-fredrik/index.html` — remove token entry/storage, add
  auth states (loading / unauthorized / forbidden / error), show the signed-in admin,
  overview panel from existing `/admin/stats` data.
- Docs: `docs/ask-fredrik-dashboard.md`, Worker README, `PROJECT_CONTEXT.md`, AGENTS/CLAUDE TODO,
  second-brain note.

## Non-goals

- No custom username/password or password reset.
- No large auth library (validate the Access JWT with WebCrypto if feasible).
- No redesign of the public portfolio or the public `/ask` pipeline.
- No invented metrics — the overview may only surface what D1/stats actually store; absent
  metrics are shown as unavailable.
- No commit/push/deploy without explicit authorization.

## Acceptance criteria

- Admin frontend has no token input, no token storage (localStorage/sessionStorage/JS cookies),
  and no secret in the bundle.
- Worker validates the Cloudflare Access assertion (signature, aud, exp, issuer) and enforces an
  admin email allowlist from environment config; client-supplied emails/headers are never trusted.
- All admin routes (`/admin/logs`, `/admin/stats`, new `/admin/me`) go through one shared
  authorization middleware; public `/ask` + health remain public.
- `GET /admin/me` returns safe identity data on success, 401/403 correctly otherwise.
- Local development has a documented, explicit dev-only auth mode that cannot be enabled
  accidentally in production.
- Overview page shows totals / today / success vs failure / latency / recent activity / intents /
  fallback usage from existing data, with unavailable metrics clearly marked.
- Tests cover: authorized access, missing auth, invalid auth, unauthorized email, /admin/me,
  protected logs/stats, public /ask unaffected, dev-mode protections.
- Docs updated: dashboard guide, Worker README (Access setup checklist + env/secrets, no values),
  threat-model note, local-dev instructions.

## Relevant context

- `PROJECT_CONTEXT.md` 2026-07-07 "Private Ask-Fredrik admin dashboard" + 2026-07-09 decisions.
- `docs/ask-fredrik-dashboard.md`, `cloudflare/ask-fredrik-worker/` (own README, wrangler.jsonc,
  schema.sql, tests), `src/admin/**`.
- Cloudflare Access: JWT on `Cf-Access-Jwt-Assertion`, JWKS at
  `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`, app AUD tag.

## Verification

- `npm run lint` · `npm test` · `npm run build` (root)
- `npm run check` + `npm test` in `cloudflare/ask-fredrik-worker/`
- or `pwsh scripts/verify.ps1`
- No deploys as part of verification.

## Risks

- Cross-origin cookie/Access flow between the GitHub Pages admin page and the Worker domain
  (CORS with credentials, SameSite) — must be designed deliberately.
- Breaking the existing curl/CI/uptime consumers of the admin endpoints or the public `/ask`.
- Accidentally enabling the dev bypass in production — must fail closed.
- Leaking assertion contents into logs.

## Completion evidence

All checks run 2026-07-23 on the implementation session:

- **Worker** (`cloudflare/ask-fredrik-worker`): `npm run check` (tsc --noEmit) clean;
  `npm test` → `332 checks passed, 0 failed.` + `admin-auth: all 49 checks passed.`
  (new `src/tests/admin-auth.test.ts`: real fetch handler + locally-signed RSA JWTs +
  stubbed JWKS/D1 — forged/expired/wrong-aud/wrong-issuer/alg-none/tampered → 401,
  non-allowlisted email → 403, missing config → 503, /admin/me shape, logs/stats gating,
  /ask + preflight public, dev-mode loopback-only gating).
- **Root** `scripts/verify.ps1` → lint OK, `node --test` 11/11 pass, build OK
  (`dist/` contains **no** admin entry: main-*.js/css only).
- `npm run build:admin` → `cloudflare/ask-fredrik-worker/public/admin/ask-fredrik/index.html`
  + hashed assets + admin-icons (19 files) + admin.webmanifest; `Test-Path dist\admin` → False.
- **Local end-to-end** (wrangler dev:noai on 127.0.0.1:8788, real local D1):
  `GET /admin/me` → `{"email":"dev-admin@localhost","authMode":"dev"}`; `POST /ask` → 200
  `source: static, matchedIntent: skill:react` with no auth; `GET /admin/stats` → includes
  `"avgLatencyMs":175,"avgLatencyMs7d":347`; browser at `/admin/ask-fredrik/` (Worker-served,
  same-origin) renders the dashboard signed in with the dev badge, new latency cards, table
  rows — zero console errors/messages on a tracked fresh load.
- **Not verifiable from the repo** (documented as TODO): the Cloudflare-dashboard-side Access
  app creation/path-scoping and the production deploy — until then `/admin/*` fails closed
  (503) by design.

## Production rollout (2026-07-23, same day)

Dashboard-side setup done interactively (browser driven by Claude, sign-ins by Fredrik):
Access enabled on the production `workers.dev` URL (Public → Restricted), app auto-created
and path-scoped to `ask-fredrik-worker.eriksson-fredrik08.workers.dev/admin`, Allow policy =
`eriksson.fredrik08@gmail.com` (one-time PIN IdP). `ACCESS_TEAM_DOMAIN` + `ACCESS_APP_AUD`
filled in `wrangler.jsonc`, `wrangler secret put ADMIN_ALLOWED_EMAILS`, `npm run build:admin`,
`npm run deploy`, `wrangler secret delete ADMIN_TOKEN`.

**Fix during rollout:** first deploy used a schemeless `ACCESS_TEAM_DOMAIN`
(`fredrikeriksson.cloudflareaccess.com`); the Worker compares that value verbatim to the JWT
`iss` and builds the JWKS URL from it, so `/admin/me` failed closed with 401 and the UI showed
"Sign-in required" after a successful edge login. Corrected to
`https://fredrikeriksson.cloudflareaccess.com` + redeploy → working. (README already
documented the `https://` format; the checklist now calls out the gotcha.)

Live verification: `GET /` 200; `POST /ask` 200 (`source: static, matchedIntent: skill:react`)
with `Access-Control-Allow-Origin: https://eriksson008.github.io` on preflight; `/admin/me`,
`/admin/logs`, `/admin/ask-fredrik/` all 302 to the Access login with the expected AUD;
browser end-to-end: PIN login → dashboard renders signed in as the admin email with Sign out
link, production D1 stats (94 prompts, avg 567 ms) and the verification prompt in the table.

**Independent review (reviewer subagent): approve-with-nits.** Confirmed no auth bypasses
(alg pinning, no cache poisoning, fail-closed env, dev-mode gating, no leakage), privacy rules
clean, uptime/health unaffected. All actionable nits fixed in a follow-up pass:
`--mode admin-worker` now `define`-forces both `VITE_ASK_FREDRIK_*` vars empty (no localhost
URL can bake into the deployed bundle); JWKS cache no longer overwritten by an empty/failed
refetch (stale-fallback) with rotation-recovery + outage tests (worker admin-auth now **54**
checks, all green, `check` clean); auth-failure mapping extracted to
`src/admin/authErrors.ts` and covered by `node --test` (root now **17** tests green); worker
README warns that assets deploy before the Worker runs, so the Access app must exist before
the first assets deploy. Final re-run after fixes: worker check + 332 + 54 green; root
lint + 17 tests + build + build:admin green.
