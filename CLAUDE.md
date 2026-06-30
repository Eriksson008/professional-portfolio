# CLAUDE.md

Guidance for Claude Code working in this repo.

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
- Keep changes simple — avoid over-engineering. No additional frameworks, no CSS-in-JS, no UI
  kit, no stock images, no gimmicky animations.
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
- Run `npm run lint` and `npm run build` before claiming work is done.

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

- [ ] **Publish via GitHub Pages — decision pending (user, 2026-06-30: "not yet").** Repo is
  **private**; Pages on a private repo needs GitHub Pro, otherwise make it public. Decide
  public-vs-private before enabling Pages. (Static `dist/` also deploys to any static host.)
- [ ] **Before publishing publicly, confirm the raw git-verifiable metrics are OK to expose** —
  a public site is more exposed than a one-recruiter résumé.

### Done
- [x] Rebuilt as Vite + React + TypeScript and Dockerized (nginx, port 8790) — 2026-06-30.
- [x] Standardized to family port 8790 (was 8789, collided with our-story); added `BIND_ADDR`
  localhost-only default + `.env.example` — 2026-06-30.
- [x] GitHub handle `Eriksson008` in the header; `public/resume.pdf` in place — 2026-06-30.

## Before finishing any meaningful session

1. Update this repo's `PROJECT_CONTEXT.md`.
2. Update the matching second-brain note (`../second-brain/02-Projects/Professional-Portfolio/README.md`).
3. Run `npm run lint` and `npm run build`.
4. Show git status for both this repo and `../second-brain`.
5. If explicitly asked to commit/push, commit and push both repos with clear messages.

## Second Brain Sync Rule

Update `../second-brain/02-Projects/Professional-Portfolio/README.md` on meaningful changes
(new architecture/feature, Docker/deploy change, networking/security change, env/port change,
major UI/design direction, important bug fix, new setup command, major decision, changed next
actions). Skip it for typos, tiny styling/formatting, routine dep bumps, or trivial refactors.
