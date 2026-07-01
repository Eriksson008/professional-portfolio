# Project Context — Professional Portfolio

## Purpose

A production-oriented personal portfolio for Fredrik Eriksson (Senior Software Engineer / acting
Tech Lead) that showcases work, skills, and experience and *supports* the résumé. Conservative,
credible enterprise tone (no hype words). The repo is intentionally built with the same stack it
advertises, so it doubles as a work sample.

## Current Status

Active. As of 2026-06-30 the site was **rebuilt from a no-build static site into a Vite + React +
TypeScript app** and **Dockerized** (multi-stage build → nginx, port 8790). Content is migrated
into typed data modules and reflects the same git-verifiable metrics and sanitized case studies
as the résumé. Standalone Git repo `Eriksson008/professional-portfolio` (branch `main`).

**2026-06-30 — Publishing via GitHub Pages (decided).** A GitHub Actions workflow
(`.github/workflows/deploy.yml`) builds and deploys to Pages on every push to `main`. Going
**public** to enable free Pages (user approved exposing the git-verifiable metrics, which were
already sanitized/public-safe by design). Live at
https://eriksson008.github.io/professional-portfolio/ once the repo is public and Pages source
is set to "GitHub Actions".

## Tech Stack

- React 18 + TypeScript, built with Vite 5
- Hand-written CSS with a design-token system (`src/styles/tokens.css` + `app.css`)
- Typed content modules in `src/data/` as the single source of truth
- Docker: multi-stage node build → nginx (Alpine), serves on port 8790; host exposure
  configurable via `BIND_ADDR` (default `127.0.0.1`, localhost-only) and `PORT` (see `.env.example`)
- ESLint (flat config) + Prettier; no tests (static content site)

## Local Development

```bash
npm install && npm run dev      # http://localhost:8790 (HMR)
npm run build                   # type-check + build to dist/
docker compose up --build       # production container at http://localhost:8790 (localhost-only)
```

## Deployment / Access

- **GitHub Pages (primary):** GitHub Actions builds with `VITE_BASE=/professional-portfolio/`
  and publishes `dist/` on push to `main`. Live at
  https://eriksson008.github.io/professional-portfolio/. One-time repo setup: make public +
  Settings → Pages → Source = "GitHub Actions".
- Base path is env-driven: Pages uses `/professional-portfolio/`; local/dev/Docker default to
  `/`. Runtime asset paths use `import.meta.env.BASE_URL`. Anchor-only nav → no 404 fallback
  needed.
- Also runs as the Docker container anywhere (LAN / Tailscale reachable); `dist/` deploys to any
  static host (Netlify, S3/CloudFront, nginx). `public/.nojekyll` included.

## Important Decisions

- **2026-06-30 — Standardized to the app-family port + safe-by-default binding.** Host/dev/preview
  and the container now all use **port 8790** (this app's family port; was 8789, which collided
  with `our-story`). `docker-compose.yml` now publishes via `${BIND_ADDR:-127.0.0.1}:${PORT:-8790}:8790`,
  so it defaults to **localhost-only** (previously it published on `0.0.0.0`/all interfaces). Set
  `BIND_ADDR=0.0.0.0` in `.env` for deliberate LAN/Tailscale access. Added `.env.example`.
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

- **Finish going live:** make the GitHub repo public and set Settings → Pages → Source =
  "GitHub Actions" (the workflow handles the rest on push to `main`).
- After first deploy, verify the live site: asset paths, résumé download, and the OG preview
  (paste the URL into LinkedIn Post Inspector / X card validator).
- Keep the site coherent with the résumé whenever a shared fact changes.
- Keep tone conservative and enterprise-friendly; metrics git-verifiable only.

## Second Brain Sync

Matching note: `../second-brain/02-Projects/Professional-Portfolio/README.md`

Related: `../second-brain/02-Projects/Repository System.md` and the sibling `resume-project` repo
(canonical facts).
