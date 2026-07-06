# Ask Fredrik v2 — Cloudflare Worker backend scaffold (2026-07-06)

User-directed 13-point brief: add a Cloudflare Worker backend under
`cloudflare/ask-fredrik-worker/` that runs on Workers Free, validates POST `/ask`
`{question, sessionId?, page?}`, returns a deterministic fallback answer (no AI call yet),
handles CORS for local dev + the GitHub Pages origin, and never touches keys or paid
services. This doc records the decisions made inside the brief's degrees of freedom.

## Decisions

### Branch and separation

Built on `ask-fredrik-v1` (unmerged), because the frontend `askFredrik()` API switch this
brief asks for already lives there — the whole feature ships as one branch. The Worker is a
fully self-contained npm package (own `package.json`, `tsconfig.json`, `wrangler.jsonc`,
`node_modules`): root `tsc -b` and the Pages workflow never see it, so the GitHub Pages
build cannot break. Root `eslint .` *does* lint the Worker's TypeScript — free extra safety,
and it passes with the shared config.

### Config format and versions

`wrangler.jsonc` (current Wrangler default) over `wrangler.toml`; wrangler ^4 (resolved
4.107.0), `compatibility_date: 2026-06-01`, `@cloudflare/workers-types` for the `Ai` type
and `ExportedHandler`. Scripts: `dev`, `deploy`, `check` (tsc --noEmit).

### Endpoint surface

- `POST /ask` — validate → `200 {answer, source: 'fallback'}`.
- `OPTIONS *` — CORS preflight (204, Allow-Methods POST/OPTIONS, Max-Age 86400).
- `GET /` — health JSON (nice for "is it deployed?" checks).
- Anything else — 404; non-POST on `/ask` — 405 with `Allow` header.
- Errors are always JSON `{error}` with 400, matching the response Content-Type.

Validation per brief: question required string, trimmed, non-empty, ≤500 chars (checked
after trim). `sessionId`/`page` are accepted in the body shape but not stored — v1 logs
nothing; they exist so a future logged/AI version needs no contract change.

### CORS allowlist

Exact-match `https://eriksson008.github.io` plus anchored regexes for
`http://localhost:<any port>` / `http://127.0.0.1:<any port>` (Vite dev 5173, preview 4173,
Docker 8790 — and Vite's port-bumping when 8790 is busy). Anchored patterns mean
`https://eriksson008.github.io.evil.com` does **not** match (probed). Disallowed origins get
no `Access-Control-Allow-Origin` header at all; allowed ones are echoed with `Vary: Origin`.

### Deterministic fallback

One constant answer composed from an `APPROVED_CONTEXT` object holding only the brief's
approved public facts (role, focus areas, stack, track record — same rules as
`src/data/fredrikContext.ts`: git-verifiable metrics, no internal codenames). The v2 AI call
will replace the constant behind the same seam, keeping it as the failure safety net.

**Deliberate consequence, documented in the Worker README:** until Workers AI is enabled,
the frontend's static keyword-matched answers are *better* than this single fallback — so
`VITE_ASK_FREDRIK_API_URL` should stay unset in the Pages build for now.

### Workers-AI-ready without dead code

No `env` parameter, no unused `Ai` binding in v1 — the README's "Upgrading to Workers AI"
section carries the exact three-step diff (uncomment `"ai"` binding, add `Env` + `env.AI.run`
with `APPROVED_CONTEXT` as system prompt, redeploy). Keeps v1 lint-clean and honest instead
of shipping an untested guarded AI path.

### Frontend wiring (the brief's last requirement)

`askFredrik()` already had the API-first/static-fallback switch from v1; this change makes
its POST body match the Worker contract fully: `{question, sessionId, page}` where
`sessionId` is one anonymous `crypto.randomUUID()` per page load and `page` is
`location.pathname`. `deploy.yml` now passes the repo Actions **variable**
`VITE_ASK_FREDRIK_API_URL` into the build (empty → unset → static answers, a safe no-op).
`.env.example` points at the Worker README.

## Verification (headless Chrome + curl against wrangler dev)

- `wrangler dev` on :8787: valid question → 200 fallback answer; empty/missing/non-string
  question, invalid JSON → 400 with specific errors; 500 chars passes, 501 rejects,
  whitespace-padded 500 passes after trim; GET /ask → 405 + `Allow`; unknown path → 404.
- CORS: Pages origin and `localhost:5173` echoed on preflight and actual response; evil and
  suffix-spoofed origins get no ACAO.
- End-to-end (Vite dev with `VITE_ASK_FREDRIK_API_URL` set, puppeteer-core): widget POSTs
  `{question, sessionId (uuid), page}` and renders the Worker's answer verbatim. Worker
  killed, same flow → widget silently serves the static answer, zero page errors.
- Root `npm run lint` + `npm run build` green; bundle 84.07 KB gz (+0.03 for sessionId).
