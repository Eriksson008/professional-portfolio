# Professional Portfolio — Fredrik Eriksson

A production-oriented personal portfolio for **Fredrik Eriksson**, Senior Software Engineer
and acting Tech Lead. Built as a real React/TypeScript application — the repo itself is meant
to demonstrate the engineering it describes — and shipped as a lightweight, Dockerized static
site.

It presents the same person, same facts, and same confidentiality rules as the résumé:
git-verifiable metrics only, and enterprise work sanitized of internal system names, data, and
business logic.

## Tech stack

| Layer        | Choice                                              |
| ------------ | --------------------------------------------------- |
| Framework    | React 18 + TypeScript                               |
| Build tool   | Vite 5                                              |
| Styling      | Hand-written CSS with a design-token system         |
| Content      | Typed data modules (`src/data/`) as source of truth |
| Container    | Multi-stage Docker build → nginx (Alpine)           |
| Tooling      | ESLint (flat config) + Prettier                     |

No backend, no database, no auth — it is a static site by design.

## Local development

Requires Node 20+.

```bash
npm install          # install dependencies
npm run dev          # dev server with HMR at http://localhost:8790
npm run build        # type-check + production build to dist/
npm run preview      # serve the built dist/ at http://localhost:8790
npm run lint         # ESLint
npm run format       # Prettier
```

## "Constellation of Impact" hero

The landing page opens with a scroll-driven **"Constellation of Impact"** hero
(`ConstellationHero`) — an award-style interactive system map, built entirely from **real DOM /
CSS / SVG, no WebGL, no GSAP, no new dependencies**. A tall pinned section (~700vh) accumulates
real metric, project, skill, and career nodes into one connected constellation as you scroll:
revealed nodes stay on screen (silver), the node(s) currently in focus light up red, and SVG
connector lines draw between related nodes via `stroke-dashoffset`. The centered identity fades
out as the constellation takes over the middle of the screen, then returns at the end with the
CTA card (name + tagline + **View Projects** / **Read Experience**).

The feel is inspired by igloo.inc's award-winning scroll experience, reproduced without its
WebGL/GSAP stack: lerp-smoothed scroll progress, cursor-reactive 2.5D parallax on the node
groups, a brief monospace decode-scramble on metric values and the name, a subtle chromatic-
aberration accent, and hover-to-highlight connector edges. There is no autoplay sound
(deliberate — accessibility and tone).

How it works:

- **Hero data (`src/data/constellation.ts`) is the single source of truth.** Edit `metricNodes`,
  `projectNodes`, `skillClusters`, and `careerNodes` to change content; `layout` (normalized 0..1
  positions) to reposition nodes; `connections` to rewire which nodes are linked. Each node/edge
  has a `revealAt` (0..1) scroll-progress threshold that controls when it appears — once revealed
  it stays (the map only ever accumulates, nothing disappears).
- **The component (`src/components/ConstellationHero.tsx`)** maps that data onto absolute-
  positioned DOM nodes plus one SVG connector layer, driven by two small hooks:
  `src/hooks/useSmoothProgress.ts` (rAF-throttled scroll progress, lerp-smoothed toward the
  target) and `src/hooks/usePointer.ts` (normalized cursor position for the parallax depth
  layers). Both gate themselves off under `prefers-reduced-motion` and on touch/coarse-pointer
  devices.
- **Real text, always.** Every value (metric figures, project titles/tags, skill items, career
  entries) is rendered as real HTML from `constellation.ts`, sourced from the existing
  `highlights.ts` / `projects.ts` / `skills.ts` / `experience.ts` data — nothing readable is baked
  into an image.
- **Palette.** Black / white / red / silver: graphite background, white primary text, silver for
  settled/inactive nodes and edges, red for the current focus window and connector highlights. No
  imagery, no neon/gaming styling.
- **Accessibility / fallback.** Under `prefers-reduced-motion` (or no JS), the hero renders a
  **static, fully resolved constellation** — all node groups plus the CTA shown as a plain
  vertical layout, no scroll-jacking, no parallax/scramble. The name is a real `<h1>`; CTAs are
  keyboard-focusable links with visible focus.
- **Responsive.** Desktop keeps the full 2D constellation; mobile and narrow viewports collapse to
  a static vertical spine (nodes stacked top-to-bottom with a connecting line), matching the
  reduced-motion fallback.
- **Testing locally:** `npm run dev` (the printed port may shift to 8791/8792 etc. if 8790 is
  busy) — check the hero at ~1440px, ~768px, and ~375px widths, and again with
  `prefers-reduced-motion: reduce` enabled in devtools.

Design spec: `docs/superpowers/specs/2026-07-01-constellation-hero-design.md`.

## Docker

The container serves the production build via nginx on **port 8790** by default, published to
**localhost only** (`127.0.0.1`) unless you opt into LAN/Tailscale access.

```bash
docker compose up --build       # build + run at http://localhost:8790
# or, plain Docker:
docker build -t professional-portfolio .
docker run -p 8790:8790 professional-portfolio
```

Host binding and port are configurable via a `.env` file (copy `.env.example` to `.env`); the
container always serves on 8790 internally:

```bash
PORT=9000 docker compose up --build   # → http://localhost:9000
```

### LAN / Tailscale

By default the container is published to `127.0.0.1` only (localhost). To reach it from your
phone or another device, set `BIND_ADDR=0.0.0.0` in `.env`, then it is reachable at:

- LAN:       `http://<host-ip>:8790`
- Tailscale: `http://<tailscale-ip>:8790`

This stays on your private LAN / tailnet — it is **not** exposed to the public internet. Notes:

- **Windows Firewall** (or Docker Desktop's own block rule) may need an inbound allow rule for
  port 8790, ideally scoped to your local subnet and the Tailscale range (`100.64.0.0/10`).
- **Tailscale ACLs** must permit your user/device to reach this host and port.
- Leave `BIND_ADDR=127.0.0.1` (the default) whenever you don't need remote access.

## Deployment

### GitHub Pages (primary)

The site deploys to GitHub Pages automatically via GitHub Actions
(`.github/workflows/deploy.yml`) on every push to `main`.

**Live URL:** https://eriksson008.github.io/professional-portfolio/

One-time setup in the GitHub repo:

1. **Settings → Pages → Build and deployment → Source: `GitHub Actions`.**
2. The repo must be **public** (or on a plan that allows Pages for private repos).
3. Push to `main` — the workflow builds and publishes `dist/` automatically.

How the base path works: the project site is served under `/professional-portfolio/`, so the
workflow builds with `VITE_BASE=/professional-portfolio/`. Locally and in Docker, `VITE_BASE`
is unset, so the base defaults to `/`. Runtime asset references (e.g. the résumé PDF) use
`import.meta.env.BASE_URL`, so they resolve correctly in both cases. The app uses in-page
anchor navigation (no client-side router), so refreshes and deep links work without a 404
fallback.

### Other static hosts

The `dist/` output can be served by any static host (Netlify, S3/CloudFront, nginx). For a
host that serves at the domain root, build with the default base (`npm run build`).
`public/.nojekyll` is included so GitHub Pages serves files/paths beginning with `_` verbatim.

## Project structure

```
professional-portfolio/
├── index.html              # Vite entry + SEO / OpenGraph / JSON-LD metadata
├── .github/workflows/      # deploy.yml — build + publish to GitHub Pages on push to main
├── src/
│   ├── main.tsx, App.tsx
│   ├── data/               # profile, experience, skills, projects, highlights + constellation.ts
│   ├── components/         # Nav, ConstellationHero, About, Experience, Projects, Skills, …
│   ├── hooks/              # useReveal.ts, useSmoothProgress.ts, usePointer.ts (reduced-motion-aware)
│   └── styles/             # tokens.css + app.css + constellation-hero.css (design system)
├── public/                 # resume.pdf, favicon.svg, og-image.png, .nojekyll
├── assets/                 # prototype/REFERENCE art only (earlier hero concepts); not deployed
├── Dockerfile              # multi-stage node build → nginx
├── nginx.conf              # listens on ${PORT}; SPA fallback; gzip; security headers
├── docker-compose.yml      # BIND_ADDR + PORT configurable host mapping (see .env.example)
├── CLAUDE.md, PROJECT_CONTEXT.md
└── resources/              # PRIVATE, gitignored — never committed (see below)
```

## Privacy note

`resources/` is **local-only source material** and is gitignored — it is never committed or
published. It holds private career inputs (performance reviews, an older résumé, raw metrics,
and a skills profile) used only to shape safe, public-facing themes. The published site exposes
only honest, defensible, public-safe content:

- No raw performance reviews or internal documents.
- No internal system, project, or product codenames — enterprise work is described generically.
- No personal phone number or home address.
- Only git-verifiable or directly documented metrics.

The canonical personal details and confidentiality mapping live in the sibling
`../resume-project` repo and govern this site too.
