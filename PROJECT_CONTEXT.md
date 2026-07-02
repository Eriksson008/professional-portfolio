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

- **2026-07-01 — Pivot to "Constellation of Impact" hero (branch `redesign-scroll-hero`,
  supersedes the scroll-vault hero below).** The box/vault/orb "opening" metaphor read as a
  generic AI-landing-page trope rather than an evidence-driven senior-engineer portfolio, so it
  was replaced with a scroll-driven, award-style interactive **system map**: real metric,
  project, skill, and career nodes accumulate into one connected constellation over a ~700vh
  pinned section — revealed nodes stay (silver), the current focus window highlights red, and
  SVG connector lines draw between related nodes via `stroke-dashoffset`. The centered identity
  fades out mid-scroll so the constellation owns the screen, then returns with the CTA
  (`View Projects` / `Read Experience`). Inspired by igloo.inc's (Awwwards SOTD) award-style
  *feel* — lerp-smoothed scroll, cursor-reactive 2.5D parallax, monospace decode-scramble on
  metric values and the name, a subtle chromatic-aberration accent, hover-to-highlight connector
  edges — reproduced in **pure React/CSS/SVG, no WebGL/GSAP, no new dependencies** (the restraint
  is itself an engineering-taste signal on GitHub Pages). No autoplay sound (deliberate).
  **Palette unified to black/white/red/silver**: gold retired from the primary theme (`--brass*`
  tokens remain defined in `tokens.css` but are no longer used by the hero; new `--silver*`
  tokens added for both themes); the lower page (Highlights/Skills) was lightly recolored for
  cohesion. **Data-driven**: all hero content lives in `src/data/constellation.ts`
  (`metricNodes`/`projectNodes`/`skillClusters`/`careerNodes`, `layout` positions,
  `connections` edges, `revealAt` reveal order) — sourced from the existing `highlights.ts` /
  `projects.ts` / `skills.ts` / `experience.ts` data, so every figure stays git-verifiable.
  **Component:** `src/components/ConstellationHero.tsx`; **styles:**
  `src/styles/constellation-hero.css`; **new hooks:** `src/hooks/useSmoothProgress.ts`
  (lerp-smoothed rAF scroll progress) and `src/hooks/usePointer.ts` (normalized cursor position
  for parallax) — both reduced-motion/touch-aware, replacing the earlier `useScrollProgress.ts`.
  **Reduced-motion / mobile:** collapses to a static, fully resolved vertical spine (all node
  groups + CTA, no scroll-jacking, no parallax/scramble). **Removed:** `ScrollHero.tsx`,
  `VaultScene.tsx`, `heroStages.ts`, `heroSystems.ts`, `scroll-hero.css`, `useScrollProgress.ts`
  — the vault concept is fully out of the render path. Verified in-browser at 1440/768/375 and
  under `prefers-reduced-motion`; `npm run lint` + `npm run build` green. Design spec:
  `docs/superpowers/specs/2026-07-01-constellation-hero-design.md`.
- **2026-07-01 — Scroll-driven cinematic hero (branch `redesign-scroll-hero`).** Replaced the
  static "engineering title-block" hero with a premium, scroll-driven hero built on a red/gold/black
  "system-vault" image sequence (nine frames). A tall section pins a full-screen viewport while
  scroll progress cross-fades the frames and synchronized **HTML** text stages, closing on the
  identity card (name + tagline + View Projects / Read Experience). Key choices: (1) frames are
  decorative background only — all real content is HTML overlays driven by data arrays
  (`src/data/heroStages.ts`, `heroSystems.ts`), with a left-weighted scrim hiding the frames'
  baked-in text; (2) `prefers-reduced-motion` / no-JS renders a **static** destination hero (no
  scroll-jacking); (3) frames optimized to WebP (~8.4 MB PNG → ~0.4 MB) via a dev-only
  `scripts/optimize-frames.mjs` (`npm run frames`), PNG sources kept in `assets/hero-sequence/`
  (not deployed). New files: `components/ScrollHero.tsx`, `hooks/useScrollProgress.ts`,
  `styles/scroll-hero.css`. Old `Hero.tsx` retired. Design spec:
  `docs/superpowers/specs/2026-07-01-scroll-hero-design.md`. Introduces a hero-scoped red accent
  (`--sh-red`) alongside the existing brass; the rest of the token system is unchanged.
  **Update (same day) — upgraded from editorial slides to a scroll-controlled 2.5D "system-vault"
  reveal** (`components/VaultScene.tsx`): real DOM/SVG (no 3D libraries). Scroll progress drives CSS
  `perspective`/`transform` phases — a matte vault lid opens (`rotateX`), a red glow emerges, the six
  system cards rise in 3D and settle into a connected architecture (SVG connectors draw via
  `stroke-dashoffset`), then dashboard panels assemble before the identity card resolves. The nine
  frames are now a **dimmed atmospheric backdrop** (~0.42 opacity); scrim lightened accordingly. The
  vault runs on desktop (>900px); below that it is dropped for a simplified inline system-card
  fallback in the caption. Reduced-motion still renders the static hero.
  **Update (same day) — polish pass + palette unification.** The vault is now a **matte black
  geometric platform with a lifting lid** (was a red oval/orb); glow is contained inside the well and
  reduced (depth/shadow over glow). **The AI-generated frame sequence is no longer rendered** — the
  hero backdrop is clean matte black/graphite with a faint CSS grid; the generated images are demoted
  to prototype/reference art in `assets/` (moved out of `public/`, not deployed). Removed the
  `optimize-frames.mjs` script + the `sharp` devDependency (no longer needed). **Palette unified to
  black/white/red primary** with gold as a rare premium highlight: `app.css` accents shifted from
  brass → new `--red*` tokens site-wide, with gold retained only on the standout metric figures
  (Highlights) and the hero's final moment (secondary CTA, role ticks, lid hairline). Red/gold tokens
  defined for both themes in `tokens.css`.
- **2026-06-30 — Standardized to the app-family port + safe-by-default binding.** Host/dev/preview
  and the container now all use **port 8790** (this app's family port; was 8789, which collided
  with `our-story`). `docker-compose.yml` now publishes via `${BIND_ADDR:-127.0.0.1}:${PORT:-8790}:8790`,
  so it defaults to **localhost-only** (previously it published on `0.0.0.0`/all interfaces). Set
  `BIND_ADDR=0.0.0.0` in `.env` for deliberate LAN/Tailscale access. Added `.env.example`.
- **2026-06-30 — Rebuilt as Vite + React + TypeScript and Dockerized.** Reason: the repo itself
  should demonstrate the senior full-stack/React/TS/Docker skills it claims; typed data modules
  are more maintainable than one large HTML file. Supersedes the earlier "no framework / no build
  step" rule.
- **Design direction:** tasteful "drafting / engineering title-block" aesthetic — deep ink base,
  warm brass accent, Sora + IBM Plex Sans/Mono. The hero title block (modeled on an engineering
  drawing's title block) is the signature device, nodding to the mechanical-engineering origin.
  **Dark + light themes** (2026-06-30): dark is the ink base; light is white drafting paper with
  ink linework and deepened brass. Same design system, only the palette changes via
  `:root[data-theme]`; nav toggle persists the choice (localStorage) and honors
  `prefers-color-scheme`, with an inline boot script preventing a flash on load.
- **Shares the résumé project's rules** — canonical personal details, no invented metrics, and
  the confidentiality mapping live in `../resume-project/CLAUDE.md`. Pull facts from there.
- **No internal system/project/product codenames.** Case studies stay generic.
- **Split out of `resume-project`** into its own standalone top-level repo (2026-06-29).

## Privacy

`resources/` is local-only source material (performance reviews, old résumé, RESUME-METRICS.md,
SKILLS-PROFILE.md), gitignored and never committed. Used only to shape safe public themes. The
site exposes only honest, defensible, public-safe content.

## Current Next Actions

- **Merge the Constellation of Impact hero:** `redesign-scroll-hero` is implemented,
  browser-verified, and docs are current — merge to `main` so it ships via the Pages workflow.
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
