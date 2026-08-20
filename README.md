# Professional Portfolio — Fredrik Eriksson

A production-oriented personal portfolio for **Fredrik Eriksson**, Senior Software Engineer
with acting Technical Lead experience. Built as a real React/TypeScript application — the repo itself is meant
to demonstrate the engineering it describes — and shipped as a lightweight, Dockerized static
site.

It presents the same person, same facts, and same confidentiality rules as the résumé:
git-verifiable metrics only, and enterprise work sanitized of internal system names, data, and
business logic.

## Tech stack

| Layer      | Choice                                                              |
| ---------- | ------------------------------------------------------------------- |
| Framework  | React 18 + TypeScript                                               |
| Build tool | Vite 5                                                              |
| Styling    | Hand-written CSS with a design-token system                         |
| Motion     | framer-motion (LazyMotion) for section transitions; no WebGL/WebGPU |
| Content    | Typed data modules (`src/data/`) as source of truth                 |
| Container  | Multi-stage Docker build → nginx (Alpine)                           |
| Tooling    | ESLint (flat config) + Prettier                                     |

No backend, no database, no auth — it is a static site by design.

## Local development

Requires Node 20+.

```bash
npm install          # install dependencies
npm run dev          # dev server with HMR at http://localhost:8790
npm run build        # type-check + production build to dist/
npm run preview      # serve the built dist/ at http://localhost:8790
npm run lint         # ESLint
npm test             # Node test runner (component helpers, media scheduling, static fallback)
npm run format       # Prettier
```

## Appearance and PWA assets

The portfolio, its public Ask Fredrik share page, and the private Ask Fredrik dashboard follow
`prefers-color-scheme` automatically. There is no saved preference or manual toggle. The shared
semantic palettes live in `src/styles/tokens.css`; admin states are completed in
`src/styles/admin.css`, and the standalone share page has its own small token set in
`public/share.css`. The astronaut hero, navigation and finale remain black cinematic anchors in
both appearances, so switching to Light Mode never flattens or recolors their film imagery.

Test Light and Dark Mode by changing the operating-system setting or emulating
`prefers-color-scheme` in browser developer tools. Check the portfolio, the Ask Fredrik launcher,
`/share`, and `/admin/ask-fredrik/` at desktop, tablet and phone widths.

The portfolio and Ask Fredrik intentionally use separate icon families so they remain
distinguishable. Transparent browser favicons live at `public/favicon-*.png` and
`public/admin-icons/favicon-*.png`; opaque 180px Home Screen compositions live at the corresponding
`apple-touch-icon.png` paths. Each manifest declares separate 192px/512px standard icons and
192px/512px padded maskable icons. Manifest colors stay black as stable install/startup fallbacks
for the branded astronaut plates; live browser chrome is selected by media-aware `theme-color`
metadata. There is no service worker or offline promise. Existing iPhone Home Screen entries may
need to be removed and added again to refresh cached icons or manifest metadata.

## Astronaut hero

The landing page opens on a **black-and-white astronaut film scrubbed by scroll**: the hero pins
under the nav while a tall runway (320vh on desktop, 360vh on phones) maps scroll progress onto the video timeline — the astronaut
drifts in from the left and settles filling the frame, dark visor to camera, at the reader's own
pace.
The direction is luxury minimalism — Apple + NASA + high-end command interface, not a space
theme.

How it works (`src/components/AstronautHero.tsx` + `src/styles/hero.css`):

- **Scroll drives the film.** A passive scroll listener schedules at most one geometry read per
  display frame, which only moves the target of an overdamped
  framer-motion spring (`GLIDE_SPRING` in `src/components/scrollGlide.ts`); the sprung progress
  schedules at most one paint/seek per display frame and is what seeks `video.currentTime`, so the film trails the finger with real
  momentum and keeps gliding into place after scrolling stops — without ever overshooting and
  playing backwards. The film occupies the first 78% of the runway; the rest is a hold on the
  settled frame. The served files are **all-intra re-encodes** (a keyframe every frame,
  `ffmpeg -g 1`) — seeking a normal-GOP encode stutters because every scrub position decodes
  from the last keyframe: `astronaut-hero-scrub.mp4` (1440p, ~9.1 MB) on ≥1200 px viewports,
  `astronaut-hero-scrub-md.mp4` (1080p, ~5.8 MB) from 720–1199 px, and
  `astronaut-hero-scrub-sm.mp4` (720p, ~3.3 MB) below 720 px. The 4K production master is kept out
  of the served bundle as `media-src/astronaut-hero-source.mp4`.
- **Everything is choreographed from one variable.** The component publishes the smoothed
  progress as a CSS custom property (`--p`) on the hero; `hero.css` derives a per-segment eased
  window (`--t`) from it and drives opacity + `translate` + blur — so every segment moves
  frame-locked with the astronaut, forward and backward.
- **The video is decorative only** — `aria-hidden`, muted, `playsInline`, no controls.
- **Poster-under-video fallback.** Two stills extracted from the film: the **start frame**
  (`astronaut-hero-start.jpg`) is the video poster and scrub-mode background, so scroll
  position 0 matches what loads; the **final frame** (`astronaut-hero-poster.jpg`) backs
  `prefers-reduced-motion` and video load failure — both degrade to the settled still,
  resolved, with no pinning. No real content depends on the video.
- **Mobile scrubs too.** Phones get the 720p encode and a progress-linked `object-position`
  pan (24% → 58%) that keeps the astronaut in frame under the portrait crop as he crosses the
  16:9 frame; the HUD stays desktop-only, so on phones the film + identity carry the sequence.
- **Opening sequence.** The page opens on the astronaut alone against black with only a scroll
  cue. As the astronaut moves, the identity segments ease into frame bottom-right one at a time
  (eyebrow → name → subheadline → CTAs across progress 0.06–0.46), each rising from below and
  sharpening from blur over the bottom + corner scrims. Once the film ends (~0.78), a restrained
  **visor HUD** assembles in the hold: corner brackets drift inward, then the four monospace
  telemetry labels (all figures verifiable elsewhere on the page) slide in one segment at a
  time; the scroll cue retires mid-film. Scrolling back up reverses everything except the cue.
- **Cinematic palette.** The hero, navigation and finale remain pure black (`#000`–`#07080c`)
  with warm-white text (`#f7f7f5`), silver secondary
  (`#b6bac5`), and white-alpha glass surfaces (bg `rgba(255,255,255,0.045)`, 1 px border
  `rgba(255,255,255,0.12)`, `backdrop-filter: blur(18px)`, radius 22 px). No colorful gradients,
  no neon; a cool `#8ec5ff` accent exists in tokens for sparing use.
- **Structure** is a launch narrative followed by a document. Five unnumbered, scroll-scrubbed
  film chapters sit under the opening hero — *The engineer* (an exploded assembly) → *Ignition* →
  *Liftoff* → *In flight* → *Endurance* (the orbiter receding to a sunrise) — and then the
  numbered sheets resume: 01 Mission Summary → 02 Impact Telemetry (glass metric cards) →
  03 Systems in flight (one real production pipeline, drawn as a rail) → 04 Selected work
  (grouped by kind; enterprise entries run full width) → 05 Systems & Skills → 06 Career
  Trajectory → 07 Contact Transmission (black glass panel). A full-bleed **media band** sits between
  sheets 04 and 05 as a breath in the longest run of reading — one still, one slow drift, no canvas. The chapters carry no sheet number
  on purpose: the numbered marks belong to the document, and interleaving the two numbering
  systems would imply the film beats and the sections are the same kind of thing.
- **Reduced motion:** the global kill rule plus explicit `animation: none` overrides in
  `hero.css` (needed because near-zero `animation-duration` does not cancel `animation-delay`) —
  the hero renders fully resolved and static on the poster.
- **Cinematic media is generated, not committed.** `npm run dev`, `npm run build` and
  `docker compose up --build` all ship chapters 02-04 as *static posters*, because the frame
  sequences are git-ignored and only the Pages workflow runs the generator. To see them scrub
  locally, run `node scripts/generate-hero-media.mjs` once (needs ffmpeg on PATH); it is
  idempotent and skips anything already present. `--check` reports what is missing.
- **Testing locally:** `npm run dev` (the printed port may shift to 8791/8792 etc. if 8790 is
  busy) — check ~1440 px, ~768 px, and ~375 px widths, and again with
  `prefers-reduced-motion: reduce` enabled in devtools.

There is deliberately **no WebGL/WebGPU** — the earlier three + React Three Fiber constellation
hero was removed with this redesign, returning the site to a single small JS bundle. framer-motion
(LazyMotion) still drives the section/card reveals, and `useReducedMotion` renders them static.

## Astronaut finale (contact)

The site closes the way it opens: section 06 (`src/components/AstronautFinale.tsx` +
`src/styles/finale.css`) is a cinematic contact scene whose 8 s black-and-white **light-reveal
film is scrubbed by scroll**, mirroring the hero's mechanic. On desktop viewports tall enough
to fit the scene (≥880×720) it **pins like the hero**: the section is a 386vh runway whose
sticky inner holds the CTA column and film still on screen while scrolling lights the
astronaut out of black. The film occupies progress 0.18–0.78, giving it the same 171.6vh of
physical scroll travel as the opening desktop hero, with text before it and a lit hold after it;
scrolling back re-darkens it. On viewports below 880 px the contact content stays **in-flow**. Tablets
(720–879 px) keep the edge-to-edge 16:9 film band below the copy, holding in its own sticky runway
whose travel matches the opening film (171.6vh at ≥720 px); short desktop windows keep the
two-column composition but give the right-column film that same runway instead of pinning the whole
scene. **Phones put the band above the copy and give it no runway** — it scrubs on its own travel
through the viewport, so the contact actions are one screen of scroll in rather than two. `measure()` reads the finale container's computed sticky state, so JS follows
the same responsive mode as CSS. The pin doesn't touch the Ask Fredrik widget (`position: fixed`,
higher stacking context). The subject drifts across the frame during the reveal, so the film remains
a 16:9 object: CTA column on the left and film bleeding to the right viewport edge in desktop grid
layouts; an edge-to-edge band beside the stacked content below 880 px — after it on tablets, before
it on phones.

- **Scrub discipline** (same as the hero): scroll geometry and the two spring subscriptions are
  each coalesced to one animation-frame callback. Scroll only moves the targets of overdamped
  framer-motion springs (the tighter `HERO_SPRING_DESKTOP` on ≥720 px; `GLIDE_SPRING` on phones),
  whose sprung values seek `video.currentTime` (never `play()`ed for playback); seeks land only on whole-frame deltas and never while one is in
  flight; the decode pipeline is invisibly primed with one guarded muted play → pause so mobile
  browsers paint seeks without visible autonomous playback. Decorative only: `aria-hidden`, muted,
  `playsInline`, no controls.
- **Lazy.** The film sits at the page's end, so it loads `preload="metadata"` until an
  IntersectionObserver sees the section within two viewports, then flips to `auto` + primes.
- **Fallbacks.** `prefers-reduced-motion` and load failure both render the lit final-frame
  still (`astronaut-finale-poster.jpg`); the CTA content never depends on the film.
- **Encodes.** Served files are **all-intra re-encodes** (a keyframe every frame, `ffmpeg
-g 1`) like the hero's — seeking a normal-GOP encode stutters: `astronaut-finale-scrub.mp4`
  (1440p, ~6.1 MB, crf 26) on ≥1200 px viewports,
  `astronaut-finale-scrub-md.mp4` (1080p, ~4.0 MB, crf 26) from 720–1199 px, and
  `astronaut-finale-scrub-sm.mp4` (720p, ~2.3 MB, crf 27) below 720 px. Its 4K production master lives at
  `media-src/astronaut-finale-source.mp4`, outside the served bundle. Both films use the same
  pipeline: scale with Lanczos to 2560×1440, 1920×1080, or 1280×720, then
  `-c:v libx264 -g 1 -keyint_min 1 -sc_threshold 0 -crf 26|27 -preset slow -pix_fmt yuv420p
-colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart -an`.
  Extract posters from the first source frame or the final scrub-visible frame (frame 191 at
  7.958333 s; the component intentionally caps seeking at `duration - 0.05`) after scaling to
  2560×1440. Posters must match the film exactly so the fallback-to-video transition never flashes.

The two social-card delivery images remain 1200×630 PNGs. Their 4800×2520 production masters live
at `media-src/og-image-v2-source.png` and `media-src/og-ask-fredrik-source.png`; regenerate with a
Lanczos downscale to 1200×630 and strip the unused alpha channel (`format=rgb24`).

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

- LAN: `http://<host-ip>:8790`
- Tailscale: `http://<tailscale-ip>:8790`

This stays on your private LAN / tailnet — it is **not** exposed to the public internet. Notes:

- **Windows Firewall** (or Docker Desktop's own block rule) may need an inbound allow rule for
  port 8790, ideally scoped to your local subnet and the Tailscale range (`100.64.0.0/10`).
- **Tailscale ACLs** must permit your user/device to reach this host and port.
- Leave `BIND_ADDR=127.0.0.1` (the default) whenever you don't need remote access.

## Sharing a link

**The portfolio itself is public and previews correctly as-is:**

```
https://eriksson008.github.io/professional-portfolio/
```

It serves `og-image-v2.png` (the astronaut) from static HTML on GitHub Pages — no Access, no
wrapper, nothing to remember.

**The private Ask Fredrik dashboard needs its wrapper URL:**

```
https://ask-fredrik.eriksson-fredrik08.workers.dev/share
```

Sending the dashboard URL itself previews as nothing and always will — the gate on
`/admin/ask-fredrik/` _is_ the admin gate, so it must never be bypassed. `/share` is a public page
that carries the tags and bounces an admin to the dashboard; because Access here is scoped to
`/admin` only, it needed no Access change at all. Verified against every major crawler on
2026-07-27. See `cloudflare/ask-fredrik-worker/README.md` › "Link previews".

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
│   ├── data/               # profile, experience, skills, projects, highlights, Ask Fredrik context
│   ├── components/         # astronaut hero/finale, sections, Ask Fredrik, shared motion/media helpers
│   └── styles/             # tokens, app, premium, hero, finale, Ask Fredrik, and admin CSS
├── public/                 # resume.pdf, favicons + app icons, og-image-v2.png, share.*, .nojekyll
├── cloudflare/
│   └── ask-fredrik-worker/ # optional Workers Free backend for the Ask Fredrik widget (own README);
│                           # also serves the private admin dashboard (below) behind Cloudflare Access
├── admin/ask-fredrik/      # private admin dashboard entry (npm run build:admin → Worker assets;
│                           # NOT part of the public/Pages build — docs/ask-fredrik-dashboard.md)
├── Dockerfile              # multi-stage node build → nginx
├── nginx.conf              # listens on ${PORT}; SPA fallback; gzip; security headers
├── docker-compose.yml      # BIND_ADDR + PORT configurable host mapping (see .env.example)
└── CLAUDE.md, PROJECT_CONTEXT.md
```

## Privacy note

**This repository is public and holds no private career material.** The `resources/` directory
that once mirrored it here was removed on 2026-07-27 — the canonical copy of the private inputs
(performance reviews, an older résumé, raw metrics, a skills profile) lives only in the sibling
**private** `../resume-project/resources/`. Those inputs are read there to shape safe,
public-facing themes and are never copied back into this repo; `.gitignore` still lists
`resources/` as a backstop. The published site exposes only honest, defensible, public-safe
content:

- No raw performance reviews or internal documents.
- No internal system, project, or product codenames — enterprise work is described generically.
- No personal phone number or home address.
- Only git-verifiable or directly documented metrics.

The canonical personal details and confidentiality mapping live in the sibling
`../resume-project` repo and govern this site too.
