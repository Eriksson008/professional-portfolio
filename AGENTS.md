# AGENTS.md

Canonical, cross-tool operating guide for **Professional Portfolio**. Both Claude Code (via `CLAUDE.md`, which imports this file with `@AGENTS.md`) and Codex (which reads `AGENTS.md` natively) follow it. **Edit this file only** — do not copy it back into `CLAUDE.md`.

<!-- ai-workflow:default-start level=Standard novault=false vaultnote="Professional-Portfolio/README" (managed by ai-workflows/update-repo-workflow; edit the template, not here) -->
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

### Committing mechanical refreshes

A **mechanical refresh** - the output of a generator or of a marker-scoped template applier, with no
hand-authored content in it - may be committed locally **without asking**, as its own commit, touching
only the files the tool wrote. Never push it, and never fold unrelated work into it. Everything else
still needs explicit authorization.

Uncommitted work is not safe work here: several sessions run against this workspace at once, and one
of them committing everything will absorb whatever another left sitting in the tree.

### If you explained it twice, write it down

The second time a session has to re-derive the same constraint, gotcha, or domain fact, capture it
before moving on - the repo docs if it is implementation, the vault note's **Important Decisions** if
it is direction, a skill if it is a procedure. The re-explanation is the signal, and capture always
costs less than the third explanation.

### The Second Brain vault — read before, write after

The vault at `../second-brain` holds this project's **direction**: why decisions were made, what is
deliberately not being done, and what comes next. This repo's `PROJECT_CONTEXT.md` holds
**implementation**: how it is built, run, and verified. They answer different questions, so neither
substitutes for the other.

**Read it before planning.** For any non-trivial change, read
`../second-brain/02-Projects/Professional-Portfolio/README.md` first — its **Important Decisions** table above
all. That table is where settled calls and their rationale live, and re-deciding something already
decided is the failure this rule exists to prevent. Where the note and the code disagree, the code is
what runs: say so plainly, and correct the note in the same session.

**Write it after.** When a task changes this project's real state, update that note per the vault's
own rules in `second-brain/AGENTS.md`. In particular: **`## Recent Changes` is capped at ~25 lines** —
trim the oldest entries as you add one, and promote anything durable (an architectural choice, a
security posture, a constraint someone would otherwise rediscover) into **Important Decisions** first.
Git already holds the history; the note holds what lasts.

**Meaningful changes only** — not typo fixes, formatting, styling tweaks, routine dependency bumps, or
trivial refactors. What counts as meaningful for *this* repo is listed under `## Second Brain Sync
Rule` below; the mechanics are here so all repos share one copy of them.

Before finishing a meaningful session: update `PROJECT_CONTEXT.md`, update the vault note, run the
repo's checks, then show `git status` for this repo **and** for `../second-brain`.
<!-- ai-workflow:default-end -->

## What this is

**Professional Portfolio** — a production-oriented personal portfolio for Fredrik Eriksson
(Senior Software Engineer / acting Technical Lead). It is a **Vite + React + TypeScript** single-page
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
  + `m.*`). Don't add other frameworks.
- **No WebGL/WebGPU — re-confirmed on measurement, 2026-08-14.** The rule dated from `aa3511a`,
  where three + @react-three/fiber was removed with the Career Nebula backdrop — a design-direction
  change, not a measured verdict. So the exception was reopened on `experiment/*` branches to
  actually test a 3D hero. **The evidence came back against it and the exception is now closed.**
  Measured against the MP4 scrub and canvas frame sequences on the same scroll pipeline: R3F cost
  **222 kB gzipped**, produced the **worst LCP of every candidate**, and was **less smooth than a
  plain 2D canvas drawing the same frames**. Nothing supported the premise that WebGL makes a
  scroll hero faster. `three`/`@react-three/fiber` are removed from `main` again.
  - Reach for WebGL only when the *scene* needs it: real 3D geometry, camera freedom, meaningful
    lighting or material interaction, scene-changing interaction, or depth that video and canvas
    cannot express. "It will feel more premium" is not on that list.
  - The R3F implementation is preserved for reference on `experiment/cinematic-media-converter`
    and `experiment/cinematic-media-followup`; it is not deleted, just not shipped.
  - GSAP was evaluated and **not** added: framer-motion springs already drive hero progress via
    `scrollGlide.ts`, and a second scroll system driving one runway fights the first.
  Benchmarks: `docs/cinematic-hero-benchmark.md` (experiment 1),
  `docs/cinematic-hero-benchmark-2.md` (experiment 2).
- **Hero rendering candidates on `main`.** `?hero=` selects between the shipped MP4 scrub
  (`video-current`, the default and unchanged), an optimized 1920×1080 all-intra re-encode
  (`video-optimized`), and a 97-frame deterministic canvas sequence (`frames-97`). The dev-only
  switcher is stripped from production builds; the query parameter works on the live site so the
  candidates can be compared on real devices. **The default is not changed by this** — adopting a
  new default is a separate decision.
- **Generated cinematic media is regenerated in CI, never committed.** `.github/workflows/deploy.yml`
  runs `scripts/generate-hero-media.mjs` against `media-src/` before the Vite build. Adding ~30 MB of
  WebP frames and ~7 MB of MP4 to a public repo would be permanent (a force-push does not
  un-publish), and the sources they derive from are already tracked. **This step is now
  load-bearing, not optional:** the launch chapters (2026-08-19) render frame sequences by default,
  so skipping it ships a page whose chapters 02–04 silently fall back to posters.
  - Four sequences are generated: `astronaut-hero-97` and `astronaut-reveal-97` (every other frame
    of a 193-frame master) and `ignition` and `liftoff` (every frame of a 121-frame master — the
    launch beats are the page's highest-intensity moment and get the frame density).
  - Each sequence's `manifest.json` is **tracked** and is read as the specification; the script
    fails the build rather than shipping a short sequence. Adding a sequence means adding it to
    `SEQUENCES` *and* committing its manifest.
- **The launch narrative is one component over four sequences.** `CinematicChapter` composes
  `useHeroRunway` + `useHeroFrames` + `drawBlendedFrame`. Add a chapter by adding data to
  `src/data/chapters.ts`, not by writing a second scroll system — a second one driving the same page
  fights the first.
- **`useNearViewport` takes an element, not a ref, and that is deliberate.** A ref is null on first
  commit and an effect keyed on the ref object never re-runs; StrictMode's double-invoke hides this
  in dev and the observer is simply never created in production. Do not "simplify" it back.
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

- **There is no `resources/` directory in this repo any more — do not recreate one.** It used to
  hold a byte-identical duplicate of the private career material (three Year End Review PDFs, the
  pre-2024 résumé, raw metrics, skills profile). **Removed 2026-07-27.** This repository is
  **public**, and the only thing that had ever kept those files out of it was a single `.gitignore`
  line; a duplicate in a public working tree is exposure surface for no benefit. The canonical copy
  lives in the sibling **private** repo at `../resume-project/resources/` — read it there when you
  need to shape a public-safe theme, and never copy a file back into this repo.
  *(History is clean: nothing under `resources/` was ever committed here — verified before removal.)*
- Do not publish raw performance reviews or the old résumé PDF (the latter unless explicitly
  approved). The served résumé is `public/resume.pdf` (the public-safe one-pager).
- **No internal system/project/product codenames.** Enterprise work stays generic (Enterprise
  Salesforce Platform, AI Client-Assist Assistant, Secure Client Onboarding Portal, etc.).
- Only use **git-verifiable or directly documented** metrics. No invented or inflated numbers,
  no efficiency percentages without a baseline.
- Do not expose home address, secrets, or credentials.
- **Phone number — accepted exception, `public/resume.pdf` only (user decision, 2026-07-27).** The
  served résumé carries a phone number in its contact header deliberately: that PDF is what gets
  uploaded to job boards and job-hunting sites, where a missing phone number costs callbacks. The
  exception is **scoped to that one artifact**. The number must never appear in the site source
  (`src/**`), the Ask Fredrik knowledge base (`cloudflare/ask-fredrik-worker/src/**`), page copy, OG
  metadata, any answer the assistant can produce, **or in this repository's own documentation** — and
  it is absent from all of them. Do not "helpfully" add it to `profile.ts` links or
  `APPROVED_CONTEXT.contact`.
  - **This paragraph used to print the number while explaining the rule** (fixed 2026-07-29). This
    repo is public, so plaintext in a tracked Markdown file is more harvestable than the same digits
    inside a compressed PDF text layer — `grep` finds the Markdown and cannot find the PDF. The
    canonical value lives in the **private** `../resume-project/AGENTS.md`; refer to it, never
    restate it. The sibling's `scripts/check-coherence.mjs` now scans this repo's Markdown for it,
    not just `src/**` and the knowledge base.

## Automation (added 2026-07-27)

Two mechanisms keep this repo from drifting away from the résumé it advertises. Both exist because
the drift really happened: the résumé was repositioned and republished while this repo's typed data
and knowledge base stayed a version behind, and separately a committed knowledge-base fix sat
undeployed while the live assistant kept contradicting it.

- **`.github/workflows/deploy-worker.yml` — the Worker deploys itself.** Any push to `main` that
  touches `cloudflare/ask-fredrik-worker/**`, `src/admin/**`, or `vite.config.ts` type-checks the
  Worker, runs its tests, builds the admin dashboard into its assets, verifies those assets landed,
  deploys, and smoke-tests live `/ask`. **Supersedes the old "deploying the Worker stays manual"
  posture**; `npm run deploy` still works by hand. Needs `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID` repo secrets — without them the job reports a clear skip instead of
  failing. The admin build step is not optional: `wrangler.jsonc` serves `./public` and the
  Worker's own `predeploy` only creates the directory, so deploying without `npm run build:admin`
  publishes an empty folder and 404s `/admin`.
- **A `PostToolUse` hook in `.claude/settings.json`** runs
  `../resume-project/scripts/coherence-hook.mjs` after any `Write`/`Edit`. When the edited file is
  under `src/data/`, `cloudflare/ask-fredrik-worker/src/`, or the sibling's
  `resume-building/output/`, it runs the cross-repo coherence check and speaks up only on a real
  contradiction. It **detects**; it never deploys. Silent otherwise, and a no-op if the private
  sibling repo is not checked out.

The same check runs in the sibling's CI weekly, so portfolio-side drift is caught even when nothing
here changes.

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

## Where the details live

Moved to `PROJECT_CONTEXT.md` so they are read when the task needs them rather than on every prompt:

- TODO / open decisions

Read `PROJECT_CONTEXT.md` before working in those areas.
