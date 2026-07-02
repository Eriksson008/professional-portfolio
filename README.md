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

## Scroll-driven system-vault hero

The landing page opens with a **scroll-driven, 2.5D "system-vault" hero** (`ScrollHero` +
`VaultScene`), built entirely from **real DOM / CSS / SVG — no imagery and no 3D libraries**. A tall
section pins a full-screen viewport; as you scroll, a matte black vault **lid opens**, a **controlled
red light** leaks out, the six **system cards rise in perspective** and settle into a **connected
architecture**, **SVG connectors draw** between them, **dashboard panels assemble**, and the scene
recedes for the **identity card** (name + tagline + **View Projects** / **Read Experience**).

How it works:

- **Progress → narrative.** `src/hooks/useScrollProgress.ts` reports scroll progress `0..1` for the
  pinned section (rAF-throttled, passive listeners). `ScrollHero` derives an eased position with a
  "hold" band at each end (opening + closing stay readable), then renders a clean matte backdrop, the
  vault scene, and the caption stages.
- **The vault (`src/components/VaultScene.tsx`).** The animated protagonist. Scroll progress drives
  CSS `perspective`/`transform` phases: a matte platform's lid `rotateX`-opens, a contained red glow
  rises from the well, system cards interpolate from the vault to architecture positions
  (`translateZ` depth), SVG connectors draw (`stroke-dashoffset`), then dashboard panels assemble as
  the cards recede. All phase timings + the node/link/card data live at the top of the component.
- **Clean backdrop, no imagery.** The background is matte black / graphite with a faint engineering
  grid and vignette (`.sh-backdrop`, pure CSS). The earlier AI-generated frame sequence is **not
  rendered** — it is kept only as prototype/reference art in `assets/` (see below).
- **Real text, always.** All copy is HTML from data arrays: `src/data/heroStages.ts` (caption
  stages) and `src/data/heroSystems.ts` (the six professional areas, rendered as the vault's cards).
  Nothing readable depends on text embedded in an image.
- **Palette.** Black / white / red is primary — red is controlled system energy. **Gold is rare**:
  only the final identity moment (secondary CTA outline, role ticks, a lid hairline).
- **Accessibility / fallback.** Under `prefers-reduced-motion` (or no JS), a **static hero** renders
  the destination directly — identity + CTAs + the system cards as a real grid, no scroll-jacking or
  vault animation. The name is a real `<h1>`; CTAs are keyboard-focusable links.
- **Responsive.** Desktop (>900px) gets the full vault; below that the vault is dropped and the
  caption shows the system cards inline as a simplified fallback, over the same clean backdrop.

### Reference art

The `assets/` directory holds **prototype/reference images only** — a red/gold/black storyboard
(`assets/references/`) and an early cinematic frame sequence (`assets/hero-sequence/`). These shaped
the concept but are **not used at runtime**; the shipped hero is real DOM/CSS/SVG. They are kept out
of `public/`, so they never deploy.

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
│   ├── data/               # profile, experience, skills, projects, highlights + heroStages, heroSystems
│   ├── components/         # Nav, ScrollHero, VaultScene, About, Experience, Projects, Skills, …
│   ├── hooks/              # useReveal.ts, useScrollProgress.ts (both reduced-motion-aware)
│   └── styles/             # tokens.css + app.css + scroll-hero.css (design system)
├── public/                 # resume.pdf, favicon.svg, og-image.png, .nojekyll
├── assets/                 # prototype/REFERENCE art only (storyboard + early frames); not deployed
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
