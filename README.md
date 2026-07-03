# Professional Portfolio — Fredrik Eriksson

A production-oriented personal portfolio for **Fredrik Eriksson**, Senior Software Engineer
and acting Tech Lead. Built as a real React/TypeScript application — the repo itself is meant
to demonstrate the engineering it describes — and shipped as a lightweight, Dockerized static
site.

It presents the same person, same facts, and same confidentiality rules as the résumé:
git-verifiable metrics only, and enterprise work sanitized of internal system names, data, and
business logic.

## Tech stack

| Layer        | Choice                                                                |
| ------------ | --------------------------------------------------------------------- |
| Framework    | React 18 + TypeScript                                                 |
| Build tool   | Vite 5                                                                 |
| Styling      | Hand-written CSS with a design-token system                            |
| Motion       | framer-motion (LazyMotion) for section transitions; no WebGL/WebGPU    |
| Content      | Typed data modules (`src/data/`) as source of truth                    |
| Container    | Multi-stage Docker build → nginx (Alpine)                              |
| Tooling      | ESLint (flat config) + Prettier                                        |

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

## Astronaut hero

The landing page opens on a **black-and-white astronaut film scrubbed by scroll**: the hero pins
under the nav while a 300vh runway maps scroll progress onto the video timeline — the astronaut
drifts in from the left and settles centered, dark visor to camera, at the reader's own pace.
The direction is luxury minimalism — Apple + NASA + high-end command interface, not a space
theme.

How it works (`src/components/AstronautHero.tsx` + `src/styles/hero.css`):

- **Scroll drives the film.** A scroll listener measures progress through the runway and a
  rAF-lerped seek sets `video.currentTime` (never `play()`), so fast flicks stay smooth and the
  frame always settles exactly where the scroll position says. The film occupies the first 78%
  of the runway; the rest is a hold on the settled frame. The served files are **all-intra
  re-encodes** (a keyframe every frame, `ffmpeg -g 1`) — seeking a normal-GOP encode stutters
  because every scrub position decodes from the last keyframe: `astronaut-video-scrub.mp4`
  (1080p, ~6 MB) on ≥720 px viewports, `astronaut-video-scrub-sm.mp4` (720p, ~3 MB) on phones.
  The original `astronaut-video.mp4` is kept as the source asset.
- **Everything is choreographed from one variable.** The component publishes the smoothed
  progress as a CSS custom property (`--p`) on the hero; `hero.css` derives a per-segment eased
  window (`--t`) from it and drives opacity + `translate` + blur — so every segment moves
  frame-locked with the astronaut, forward and backward.
- **The video is decorative only** — `aria-hidden`, muted, `playsInline`, no controls.
- **Poster-under-video fallback.** Two stills extracted from the film: the **start frame**
  (`astronaut-video-start.jpg`) is the video poster and scrub-mode background, so scroll
  position 0 matches what loads; the **final frame** (`astronaut-video-poster.jpg`) backs
  `prefers-reduced-motion` and video load failure — both degrade to the settled still,
  resolved, with no pinning. No real content depends on the video.
- **Mobile scrubs too.** Phones get the 720p encode and a progress-linked `object-position`
  pan (30% → 50%) that keeps the astronaut in frame under the portrait crop as he crosses the
  16:9 frame; the HUD stays desktop-only, so on phones the film + identity carry the sequence.
- **Opening sequence.** The page opens on the astronaut alone against black with only a scroll
  cue. As the astronaut moves, the identity segments ease into frame bottom-right one at a time
  (eyebrow → name → subheadline → CTAs across progress 0.06–0.46), each rising from below and
  sharpening from blur over the bottom + corner scrims. Once the film ends (~0.78), a restrained
  **visor HUD** assembles in the hold: corner brackets drift inward, then the four monospace
  telemetry labels (all figures verifiable elsewhere on the page) slide in one segment at a
  time; the scroll cue retires mid-film. Scrolling back up reverses everything except the cue.
- **Palette.** Pure black (`#000`–`#07080c`) with warm-white text (`#f7f7f5`), silver secondary
  (`#b6bac5`), and white-alpha glass surfaces (bg `rgba(255,255,255,0.045)`, 1 px border
  `rgba(255,255,255,0.12)`, `backdrop-filter: blur(18px)`, radius 22 px). No colorful gradients,
  no neon; a cool `#8ec5ff` accent exists in tokens for sparing use.
- **Sections** follow a mission frame: 01 Mission Summary → 02 Impact Telemetry (glass metric
  cards) → 03 Project Modules (cards settle from a subtle rotateX) → 04 Systems & Skills →
  05 Career Trajectory → 06 Contact Transmission (black glass panel).
- **Reduced motion:** the global kill rule plus explicit `animation: none` overrides in
  `hero.css` (needed because near-zero `animation-duration` does not cancel `animation-delay`) —
  the hero renders fully resolved and static on the poster.
- **Testing locally:** `npm run dev` (the printed port may shift to 8791/8792 etc. if 8790 is
  busy) — check ~1440 px, ~768 px, and ~375 px widths, and again with
  `prefers-reduced-motion: reduce` enabled in devtools.

There is deliberately **no WebGL/WebGPU** — the earlier three + React Three Fiber constellation
hero was removed with this redesign, returning the site to a single small JS bundle. framer-motion
(LazyMotion) still drives the section/card reveals, and `useReducedMotion` renders them static.

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
│   ├── hooks/              # useSmoothProgress.ts, usePointer.ts, useVisualTier.ts (reduced-motion-aware)
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
