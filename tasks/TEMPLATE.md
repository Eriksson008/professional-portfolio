# Task title

## Outcome

Describe the user-visible or engineering outcome.

## Problem

Describe the current limitation or failure.

## Scope

List what may change (`src/`, `src/data/`, `src/styles/`, `cloudflare/ask-fredrik-worker/`, etc.).

## Non-goals

List what must not change. (Reminders from `AGENTS.md`: **framer-motion only** — no CSS-in-JS, UI kit,
WebGL/WebGPU, or other frameworks; no backend/DB/auth unless explicitly asked; **no codenames**, only
**git-verifiable metrics**, no PII; content stays in `src/data/`.)

## Acceptance criteria

- criterion
- criterion
- criterion

## Relevant context

- files / components (`src/data/`, `src/styles/tokens.css`, `src/styles/app.css`)
- `PROJECT_CONTEXT.md`, `README.md`, sibling `../resume-project/CLAUDE.md` (canonical facts + confidentiality)
- prior decisions (`../second-brain/02-Projects/Professional-Portfolio/README.md`)

## Verification

Only commands this repo actually supports (see `AGENTS.md` > Verification):

- `npm run lint` · `npm test` · `npm run build`
- or `pwsh scripts/verify.ps1` / `bash scripts/verify.sh`
- Worker changes: `npm run check` + `npm test` in `cloudflare/ask-fredrik-worker/`.
- Do **not** deploy as part of verification.

## Risks

List likely regression risks (visual regressions, token/specificity, accessibility, OG/SEO metadata,
Worker rate-limit/knowledge-base behavior).

## Completion evidence

To be filled in after implementation (paste the actual verification output; note any skipped checks).
