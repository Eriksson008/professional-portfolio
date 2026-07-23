# AGENTS.md

Canonical, cross-tool operating guide for **Professional Portfolio**. Both Claude Code (via `CLAUDE.md`, which imports this file with `@AGENTS.md`) and Codex (which reads `AGENTS.md` natively) follow it. **Edit this file only** — do not copy it back into `CLAUDE.md`.

<!-- ai-workflow:default-start (managed by ai-workflows/update-repo-workflow; edit the template, not here) -->
## Default agent workflow

This is the standing process for both Claude Code and Codex in this repo — it applies to every task
**without needing to be restated in the prompt**. Scale effort to the task (see the tiers below).

1. Understand the requested **outcome** first, then inspect the **relevant** implementation.
2. Read the repo docs and any active `tasks/` context relevant to the request.
3. Do **not** scan the whole repository when targeted inspection is enough.
4. Delegate substantial or cross-cutting investigation to a **read-only explorer** agent; skip subagents for trivial changes.
5. For broad or high-risk changes, write a **brief plan** before editing.
6. **One implementation owner** per feature/branch; never let two agents edit overlapping files; use an isolated **worktree** only for genuinely independent work.
7. Make the **smallest defensible change** that satisfies the request; preserve unrelated user work.
8. Run focused checks while implementing; run the repo's **supported verification** (`scripts/verify.ps1` / `.sh`) before claiming done.
9. Have an **independent reviewer** (the `reviewer` agent, or Codex `codex review`) check meaningful changes; use **browser validation** for meaningful UI behavior changes.
10. Compare the result to the requested outcome and acceptance criteria. Report failed/skipped/unavailable checks honestly — **never claim a check passed unless it actually ran**.
11. Do **not** commit, push, deploy, migrate, or mutate external systems unless explicitly authorized. Protect secrets and private data.

### Effort tiers

- **Trivial** (typo, tiny text/style fix, one obvious test): inspect the file, make the change, run a targeted check. No subagents.
- **Normal** (contained feature, bug fix, focused refactor): focused exploration → one implementation owner → repo verification → independent review.
- **Complex / high-risk** (architecture, auth, migrations, infra, cross-app or sensitive-data changes): parallel read-only investigation where useful → written plan → one owner per isolated workstream → targeted + full verification → specialist review → browser/integration evidence where applicable → explicit rollback/risk consideration.
<!-- ai-workflow:default-end -->

## What this is

**Professional Portfolio** — a production-oriented personal portfolio for Fredrik Eriksson
(Senior Software Engineer / acting Tech Lead). It is a **Vite + React + TypeScript** single-page
app, styled with a hand-written CSS design-token system and shipped as a **Dockerized static
site served by nginx on port 8790** (localhost-only by default). It supports the résumé (same
person, same facts, same confidentiality rules).

This is its own standalone top-level repo (moved out of `resume-project` on 2026-06-29). The
sibling [`../resume-project/CLAUDE.md`](../resume-project/CLAUDE.md) holds the canonical personal
details, verifiable-metrics rules, and confidentiality mapping — **those still govern this site
too**; keep the two in sync when a shared fact changes.

> History: this started as a no-build static HTML/CSS/JS site. On 2026-06-30 it was rebuilt as a
> Vite + React + TS app and Dockerized, so the repo itself demonstrates the stack it describes.

## Working agreement (read first)

- **Read `PROJECT_CONTEXT.md` first**, then the sibling
  [`../resume-project/CLAUDE.md`](../resume-project/CLAUDE.md) for canonical facts and the
  confidentiality rules.
- **Check `README.md`** for stack, dev commands, Docker usage, and deployment notes.
- Keep changes simple — avoid over-engineering. No CSS-in-JS, no UI kit, no stock images, no
  gimmicky animations. Approved visual library (2026-07-03): **framer-motion** (via `LazyMotion`
  + `m.*`) only — the three + @react-three/fiber WebGL layer was removed with the astronaut-video
  hero. **No WebGL/WebGPU.** Don't add other frameworks.
- Content lives in `src/data/` (typed modules) — it is the single source of truth. Update data
  there, not inline in components.
- Do **not** add a backend, database, auth, or external services unless explicitly requested.
- Update `PROJECT_CONTEXT.md` when important project decisions change.
- Update the Second Brain project note
  (`../second-brain/02-Projects/Professional-Portfolio/README.md`) on major decisions.

## Coding standards

- React function components + hooks; TypeScript `strict`. Keep components small and presentational.
- Style with the existing CSS tokens (`src/styles/tokens.css`); don't introduce new color/spacing
  values ad hoc. Watch selector specificity in `src/styles/app.css`.
- Accessibility floor: semantic HTML, visible keyboard focus, `prefers-reduced-motion` respected.
- Run `npm run lint` and `npm run build` before claiming code or build-affecting work is done.

## Verification

Run checks when the task touches code, content, build config, or assets (dependencies already
installed — do **not** reinstall):

| Check | Command | Notes |
| --- | --- | --- |
| lint | `npm run lint` | `eslint .` |
| test | `npm test` | `node --test "src/**/*.test.ts"` |
| build | `npm run build` | `tsc -b && vite build` (build also typechecks) |
| format | `npm run format` | prettier (optional) |

Or run the supported gates at once: `pwsh scripts/verify.ps1` / `bash scripts/verify.sh`. The
companion Cloudflare Worker in `cloudflare/ask-fredrik-worker/` has its own checks (`npm run check`,
`npm test`) — run those when the Worker changes. The verify script **never deploys**.

## Agent workflow & coordination

- **Task packets:** copy `tasks/TEMPLATE.md` for any non-trivial change.
- **Shared playbooks:** `../.agents/skills/` (workspace-shared) — `implement-feature`,
  `investigate-bug`, `verify-change`, `review-change`, `update-project-status`.
- **Claude Code subagents:** `.claude/agents/explorer.md` (read-only recon) and
  `.claude/agents/reviewer.md` (independent pre-merge review). **Codex** uses `codex review`.
- **Coordination rules:** one implementation owner per feature/branch; parallelize read-only
  investigation *before* writing; the reviewer must not be the author; show real command output
  before claiming a check passed; report skipped/unavailable checks explicitly.

## Privacy & public-safe content rules

- **Never commit `resources/`** (gitignored) — it holds private performance reviews, an older
  résumé, raw metrics, and a skills profile. Use them only to shape safe, public themes.
- Do not publish raw performance reviews or the old résumé PDF (the latter unless explicitly
  approved). The served résumé is `public/resume.pdf` (the public-safe one-pager).
- **No internal system/project/product codenames.** Enterprise work stays generic (Enterprise
  Salesforce Platform, AI Client-Assist Assistant, Secure Client Onboarding Portal, etc.).
- Only use **git-verifiable or directly documented** metrics. No invented or inflated numbers,
  no efficiency percentages without a baseline.
- Do not expose personal phone number, home address, secrets, or credentials.

## Docker commands

```bash
docker compose up --build         # build + run at http://localhost:8790 (localhost-only)
PORT=9000 docker compose up        # publish on a different host port
BIND_ADDR=0.0.0.0 docker compose up # expose to LAN / Tailscale (off by default)
docker build -t professional-portfolio .
docker run -p 8790:8790 professional-portfolio
```

Host binding/port are configured via `.env` (copy `.env.example`). `BIND_ADDR` defaults to
`127.0.0.1` (localhost-only); the container always serves on 8790 internally.

## TODO / open decisions

- [ ] **Validate the OG social preview** on the live site (LinkedIn Post Inspector / X card
  validator) and confirm the résumé download link.
- [ ] **Add the free Cloudflare WAF rate rule for `/ask`** (dashboard: zone → Security → WAF →
  Rate limiting rules) — hard quota protection; the Worker's in-memory limiter is per-isolate
  best-effort only.
- [ ] **Consider Cloudflare Web Analytics** on the live site (free, cookieless, one script tag)
  for visitor-level insight to complement the D1 question log.

### Done
- [x] **Cloudflare Access setup completed + admin live on the Worker — 2026-07-23.** Access
  enabled on the production `workers.dev` URL (Domains → Restricted), app path-scoped to
  `/admin` (destination `ask-fredrik-worker.eriksson-fredrik08.workers.dev/admin`), Allow
  policy = admin email via one-time PIN; `ACCESS_TEAM_DOMAIN`/`ACCESS_APP_AUD` filled,
  `ADMIN_ALLOWED_EMAILS` secret set, `ADMIN_TOKEN` deleted, `build:admin` + deploy done.
  Live-verified: `/ask` public with correct CORS, `/admin/*` 302s to Access, dashboard loads
  signed-in end-to-end. Gotcha for the future: `ACCESS_TEAM_DOMAIN` must include the
  `https://` scheme (it is compared to the JWT `iss` and used to build the JWKS URL) — the
  bare hostname fails closed with 401.
- [x] **Admin auth moved to Cloudflare Access — 2026-07-23.** Manual `ADMIN_TOKEN` paste
  retired: the Worker validates the Access JWT in-Worker (`src/access.ts`, WebCrypto, zero
  deps) against an email-allowlist secret, `GET /admin/me` added, and the admin dashboard now
  deploys as Worker static assets (`npm run build:admin`) instead of shipping in the Pages
  artifact. Loopback-only dev auth mode; 49 new worker tests. See
  `docs/ask-fredrik-dashboard.md` + the TODO above for the remaining dashboard-side config.
- [x] **Live on GitHub Pages — 2026-07-06.** Repo public, Pages source = GitHub Actions,
  `deploy.yml` publishes on every push to `main`; live-site verified (asset hashes, finale
  media range requests, Ask Fredrik Worker URL in the bundle). Live at
  https://eriksson008.github.io/professional-portfolio/.
- [x] **Ask Fredrik assistant live end-to-end — 2026-07-06/07.** Cloudflare Worker
  (`cloudflare/ask-fredrik-worker`) with curated public-safe knowledge base, sensitive filter,
  rate limiting, D1 FIFO logging, Workers AI + prompt-leak guard; CI (`worker-tests.yml`) and
  uptime checks (`uptime.yml`) in place.
- [x] **GitHub Pages deployment configured (user approved going public) — 2026-06-30.** Actions
  workflow `deploy.yml`; env-driven Vite base (`/professional-portfolio/` on Pages, `/`
  elsewhere); SEO/OpenGraph/JSON-LD metadata + `public/og-image.png`; typography/spacing polish.
- [x] Rebuilt as Vite + React + TypeScript and Dockerized (nginx, port 8790) — 2026-06-30.
- [x] Standardized to family port 8790 (was 8789, collided with our-story); added `BIND_ADDR`
  localhost-only default + `.env.example` — 2026-06-30.
- [x] GitHub handle `Eriksson008` in the header; `public/resume.pdf` in place — 2026-06-30.

## Before finishing any meaningful session

1. Update this repo's `PROJECT_CONTEXT.md`.
2. Update the matching second-brain note (`../second-brain/02-Projects/Professional-Portfolio/README.md`).
3. Run `npm run lint` and `npm run build` if code, content, build config, or assets changed.
4. Show git status for both this repo and `../second-brain`.
5. If explicitly asked to commit/push, commit and push both repos with clear messages.

## Second Brain Sync Rule

Update `../second-brain/02-Projects/Professional-Portfolio/README.md` on meaningful changes
(new architecture/feature, Docker/deploy change, networking/security change, env/port change,
major UI/design direction, important bug fix, new setup command, major decision, changed next
actions). Skip it for typos, tiny styling/formatting, routine dep bumps, or trivial refactors.
