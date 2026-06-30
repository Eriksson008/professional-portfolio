# Project Context — Professional Portfolio

## Purpose

A production-oriented personal portfolio for Fredrik Eriksson (Senior Software Engineer / acting
Tech Lead) that showcases work, skills, and experience and *supports* the résumé. Conservative,
credible enterprise tone (no hype words). The repo is intentionally built with the same stack it
advertises, so it doubles as a work sample.

## Current Status

Active. As of 2026-06-30 the site was **rebuilt from a no-build static site into a Vite + React +
TypeScript app** and **Dockerized** (multi-stage build → nginx, port 8789). Content is migrated
into typed data modules and reflects the same git-verifiable metrics and sanitized case studies
as the résumé. Standalone Git repo on the **private** GitHub repo
`Eriksson008/professional-portfolio` (branch `main`). Publishing via GitHub Pages is not yet
decided.

## Tech Stack

- React 18 + TypeScript, built with Vite 5
- Hand-written CSS with a design-token system (`src/styles/tokens.css` + `app.css`)
- Typed content modules in `src/data/` as the single source of truth
- Docker: multi-stage node build → nginx (Alpine), serves on port 8789 (host port configurable
  via `PORT`)
- ESLint (flat config) + Prettier; no tests (static content site)

## Local Development

```bash
npm install && npm run dev      # http://localhost:8789 (HMR)
npm run build                   # type-check + build to dist/
docker compose up --build       # production container at http://localhost:8789
```

## Deployment / Access

- Static `dist/` deploys to any static host (GitHub Pages, Netlify, S3/CloudFront, nginx);
  `public/.nojekyll` included. Or run the Docker container anywhere (LAN / Tailscale reachable).
- GitHub repo `Eriksson008/professional-portfolio` is currently **private**; Pages needs GitHub
  Pro or making the repo public — decision pending.
- A public site is more exposed than a one-recruiter résumé — confirm before publishing the raw
  git-verifiable metrics.

## Important Decisions

- **2026-06-30 — Rebuilt as Vite + React + TypeScript and Dockerized.** Reason: the repo itself
  should demonstrate the senior full-stack/React/TS/Docker skills it claims; typed data modules
  are more maintainable than one large HTML file. Supersedes the earlier "no framework / no build
  step" rule.
- **Design direction:** tasteful single-theme dark "drafting / engineering title-block"
  aesthetic — deep ink base, warm brass accent, Sora + IBM Plex Sans/Mono. The hero title block
  (modeled on an engineering drawing's title block) is the signature device, nodding to the
  mechanical-engineering origin.
- **Shares the résumé project's rules** — canonical personal details, no invented metrics, and
  the confidentiality mapping live in `../resume-project/CLAUDE.md`. Pull facts from there.
- **No internal system/project/product codenames.** Case studies stay generic.
- **Split out of `resume-project`** into its own standalone top-level repo (2026-06-29).

## Privacy

`resources/` is local-only source material (performance reviews, old résumé, RESUME-METRICS.md,
SKILLS-PROFILE.md), gitignored and never committed. Used only to shape safe public themes. The
site exposes only honest, defensible, public-safe content.

## Current Next Actions

- Keep the site coherent with the résumé whenever a shared fact changes.
- Keep tone conservative and enterprise-friendly; metrics git-verifiable only.
- **Decide GitHub Pages publishing** (private + Pro, or make public). Tracked in `CLAUDE.md`.
- Confirm the raw git-verifiable metrics are OK to expose publicly *before* publishing.

## Second Brain Sync

Matching note: `../second-brain/02-Projects/Professional-Portfolio/README.md`

Related: `../second-brain/02-Projects/Repository System.md` and the sibling `resume-project` repo
(canonical facts).
