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
- Hand-written CSS with a design-token system (`src/styles/tokens.css` + `app.css` +
  `premium.css` + `hero.css`) — **dark-only** (no theme toggle) as of 2026-07-02, **pure
  black/white/glass** as of 2026-07-03
- framer-motion (LazyMotion/domAnimation, `m.*`) for section transitions; **no WebGL/WebGPU**
  (the three + R3F layer was removed 2026-07-03 with the astronaut-video hero — single ~80 KB gz
  bundle again)
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

- **2026-07-06 — "Ask Fredrik" recruiter concierge v1 (branch `ask-fredrik-v1`, user-directed
  10-point brief; frontend-only, free, no keys).** A floating black-glass chat widget
  (bottom-right pill → non-modal dialog) that answers recruiter questions from a **curated
  static knowledge base** — no LLM, no backend, GitHub Pages-safe. Architecture:
  `src/data/fredrikContext.ts` (greeting, disclosure, unknown-question fallback, and curated
  answers — five suggested-question chips plus keyword-only topics for leadership/AI/experience/
  security/contact; résumé rules apply: public facts and git-verifiable metrics only),
  `src/lib/askFredrik.ts` (`askFredrik(question)`: keyword-scored static matcher by default;
  if `VITE_ASK_FREDRIK_API_URL` is set at build time it tries POST `{question}` → `{answer}`
  first and falls back to static on any failure — the future Cloudflare/LLM upgrade path with
  zero component changes; env var typed in `vite-env.d.ts`, documented commented-out in
  `.env.example`), and `src/components/AskFredrik.tsx` + `src/styles/ask-fredrik.css`. Key UX
  decisions: the launcher stays hidden until ~0.55 viewport of scroll so the astronaut opening
  frame stays clean (re-hides at top unless open); asked chips are removed; a 550 ms
  "considered pause" + typing dots pace the static answers; permanent disclosure line
  ("Questions may be logged… do not submit sensitive information" — v1 logs nothing);
  Escape closes and returns focus to the launcher, `role="log"` + `aria-live` conversation,
  non-modal so the page stays usable; ≤560px it becomes a bottom sheet capped at
  `100dvh − 10.5rem` so it never rides over the nav. The panel is the one deliberate
  `backdrop-filter` user (fixed overlay over live content). Verified end-to-end with headless
  Chrome (puppeteer-core) at desktop + mobile widths: reveal gating, chips, curated/fallback/
  keyword answers, whitespace-submit inert, focus management, zero console errors. Lint +
  build green; bundle unchanged (~84 KB gz). Design spec:
  `docs/superpowers/specs/2026-07-06-ask-fredrik-v1-design.md`.
- **2026-07-03 — Astronaut-video hero + "mission" reskin (branch `astronaught-idea`,
  user-directed brief; supersedes the constellation/WebGL hero line below).** The homepage now
  opens on a **premium black-and-white astronaut video** (`public/media/astronaut-video.mp4`,
  8 s / 1080p h264: the astronaut drifts in from the left and settles centered,
  visor to camera). Direction: luxury minimalism — Apple + NASA + high-end command interface,
  not a space theme. Key choices: (1) **the film is scrubbed by scroll** (same-day user
  revision; replaces the initial autoplay-once cut): the hero pins under the nav across a 360vh
  runway and a rAF-lerped seek maps scroll progress onto `video.currentTime` (film occupies
  0–0.78 of the runway, the rest holds the settled frame) — the served file is a ~6 MB
  **all-intra re-encode** (`ffmpeg -g 1`, crf 26; normal-GOP seeking stutters), the
  original 3.4 MB mp4 kept as source; **mobile scrubs too** (third same-day revision): phones
  get a 720p all-intra variant (~3 MB) plus a progress-linked `object-position` pan (30%→50%)
  that keeps the astronaut in frame under the portrait crop (HUD stays desktop-only); the video
  stays **decorative only** (`aria-hidden`, muted, `playsInline`, never `play()`ed); (2) two
  poster stills: the start frame is the video poster + scrub background (scroll 0 matches what
  loads), the final settled frame backs `prefers-reduced-motion` and video failure — content
  never depends on the video; (3) **full scroll choreography from one variable** (second same-day
  revision): the component publishes smoothed progress as `--p` on the hero and hero.css derives
  per-segment eased windows (`--t`) driving opacity + `translate` + blur — the page opens on the
  astronaut alone with only a scroll cue, the identity segments ease in one at a time while the
  astronaut moves (eyebrow → name → sub → CTAs, 0.06–0.46), and after the film ends the **visor
  HUD assembles in the hold** (brackets drift inward 0.76–0.93, then the four mono telemetry
  labels — Exceptional ×3, 750+ commits, 120+ stories, Tech Lead — slide in 0.80–0.98); the cue
  retires mid-film; everything reverses when scrolling back up (`translate` is used so the HUD's
  mirroring `transform`s stay intact; non-scrub paths keep the load-time animations and render
  resolved). Two mobile fixes (same day): the video is **primed with one muted play → pause**
  (mobile browsers don't paint seeks on a never-played video — it sat on the start frame), and
  in-page anchors (View Work, nav) use a **JS rAF glide** (`useAnchorGlide`, replaces CSS
  `scroll-behavior: smooth`) because native hash jumps don't fire IntersectionObserver on
  mobile WebKit, leaving every `whileInView` section invisible until a manual scroll; the glide
  produces real scroll frames so reveals fire along the way, offsets for the 68px nav, focuses
  the target for AT, and is cancelled by wheel/touch input (reduced motion jumps instantly);
  (4) **OG social preview regenerated** from the settled astronaut end-frame PNG
  (`public/media/astronaut-video-end.png`): `public/og-image.png` now uses the
  black/white/silver astronaut art direction with restrained command-interface copy, replacing
  the older drafting-frame social card; (5) **palette reduced to pure
  black/white/silver glass** — violet/ice accents retired, token names kept so the whole CSS
  system reskinned in place; glass cards standardized (rgba-white 0.045 bg, 1px rgba-white 0.12
  border, blur(18px), radius 22px); (6) sections renamed to the mission frame — 01 Mission
  Summary, 02 Impact Telemetry (glass metric cards), 03 Project Modules (cards settle from a
  subtle rotateX), 04 Systems & Skills (regrouped to 6 groups incl. AI/LLM Systems and merged
  Cloud/DevOps/Security), 05 Career Trajectory, 06 Contact Transmission (black glass panel; the
  standalone Résumé section folded into hero + contact CTAs); (6) **the entire WebGL stack was
  deleted** (three, @react-three/fiber, @types/three, `src/webgl/`, ConstellationHero/Map,
  ShootingStarField, HeroCoreFallback, SafeVisual, ScrambleText, useVisualTier,
  useSmoothProgress, usePointer, constellation.ts, constellation-hero.css) — one 241 KB
  (~80 KB gz) bundle, no lazy chunks. Reduced-motion needs explicit `animation: none` overrides
  in hero.css because the global near-zero-duration rule doesn't cancel `animation-delay`.
  Verified in Chrome at desktop width (pinning, settle latch, HUD/glow/cue gating, all
  sections, no console errors); the actual frame-by-frame scrub and mobile/reduced-motion paths
  are code-reviewed but not visually verified (session browser window was hidden — Chrome
  suspends media loading — and refused viewport resize). Lint + build green.
- **2026-07-02 — Hero formation sequence: "Career Nebula / Marble Constellation"
  (user-directed 14-point brief; builds on the same-day dark-only art direction).** The hero now
  opens with a ~3s **formation overture** instead of a quiet frame: atmosphere deepens in, three
  staggered **shooting-star trails** sketch across the field (`ShootingStarField` — hand-authored
  curved Beziers; each trail = glow tail + crisp line + icy head strokes sharing one
  `pathLength`-normalized dash sweep, so head and tail stay synced in pure CSS; one long-period
  trail recurs every ~19s), dust gathers into a **hero core orb** behind the name, and the
  identity **etches in blur-to-sharp** (10px→0) while the decode-scramble resolves (scramble
  start is delayed 1s to sync with the CSS timeline; skipped on the mobile spine where there is
  no blur to mask it). **Tagline + CTAs are now part of the opening identity** — visible within
  ~2.6s, no longer gated behind 88% of the 700vh scroll; the identity bookend still fades them
  out mid-scroll (now completing by ~0.13 so light never crosses readable text; `visibility:
  hidden` while faded so invisible CTAs can't be clicked) and returns them with the settled map.
  **Hero core:** WebGL `CoreOrb` (faint wireframe icosahedron + tilted counter-rotating orbital
  dust ring, forming over ~3s; the particle shell also settles inward on load) in the existing
  lazy chunk, over a **CSS-only fallback orb** (`HeroCoreFallback`: halo, glass core, two
  precessing 1px orbit rings) that is always mounted and drops to a whisper while GL is live —
  the hero center can never be empty (verified: with WebGL disabled browser-wide the CSS orb +
  trails + overture carry the design alone). **Hero→constellation seam:** a `core` layout point
  plus three seed connections (`core → m-impact/m-commits/m-green`, revealAt 0.13–0.17) grow out
  of where the orb was as the identity fades. Buttons restyled premium (violet gradient + glow /
  slate glass ghost); nodes got a faint top-light sheen (marble); `m-commits` nudged below the
  sticky nav. Mobile (<600px): no trails/orb, immediate text, soft static glow behind the
  identity; reduced-motion: static resolved hero, no overture (new layers explicitly hidden).
  No new dependencies; WebGPU still deliberately unused; bundles unchanged (main ~84 KB gz,
  lazy WebGL ~236 KB gz). Design spec:
  `docs/superpowers/specs/2026-07-02-hero-formation-sequence-design.md`.
- **2026-07-02 — Dark-only art direction: "light veins in glass" (user-directed; removes the
  dual theme of 2026-06-30 and retires red).** The site is now intentionally **dark-first and
  dark-only**: the light theme, nav sun/moon toggle, `useTheme.ts`, the `index.html` boot
  script, and all theme-swap transitions were deleted (`color-scheme: dark`, fixed
  `theme-color #0a0c12`). **New palette** (tokens renamed `--red*` → `--accent*`): obsidian
  `#0a0c12` base, slate-glass panels built on `--slate: #383e4e` with transparency +
  `backdrop-filter`, silver `#b6bac5` text (`--muted`/`--silver`), soft-violet `#8f8af4`
  primary accent, icy-cyan `#8fd9f2` secondary glow; **red and brass are fully retired**
  (favicon recolored; the brief allowed a tiny signature red — declined as it would read as a
  leftover). **Constellation reworked into flowing light veins:** straight `<line>` edges
  became cubic Beziers bowing to alternating sides (deterministic per edge), drawn
  progressively by **De Casteljau subdivision** (keeps the fix for Chrome's screen-space dash
  bug under `non-scaling-stroke`); each vein is a wide low-opacity violet glow stroke under a
  crisp 1px line (no SVG filters); completed veins carry a traveling icy-cyan **light pulse**
  (SMIL `animateMotion`, staggered, every other edge only); nodes **bloom** (opacity + rise +
  scale 0.92→1 + blur 5px→0) with a violet halo when focused; the glow layer **breathes** on a
  7s cycle. WebGL backdrop recolored (silver-lavender particles, sparse violet fraction —
  `redFraction` prop renamed `tintFraction` — violet core glow). Site-wide atmosphere: fixed
  violet/cyan fog fields + ~3% film grain on `body`; section titles got a silver→white
  gradient sheen; small low-contrast labels bumped ≥0.75rem. Dead CSS from the retired
  title-block hero (`.hero*`, `.title-block`, `.tb-*`, `.status-dot`, `.theme-toggle`)
  removed. Verified in Chrome on desktop (construction sequence, pulses, CTA end state, lower
  sections, no console errors); mobile/reduced-motion paths are structurally unchanged from
  the previously verified implementation (colors only). `npm run lint` + `npm run build`
  green; bundle sizes unchanged (main ~84 KB gz, WebGL chunk lazy ~235 KB gz). Design spec:
  `docs/superpowers/specs/2026-07-02-dark-only-art-direction-design.md`.
- **2026-07-02 — WebGL visual layer added (user-directed; supersedes the "no WebGL / no new
  dependencies" restraint of 2026-07-01).** The constellation hero now has an optional 3D
  backdrop — a slowly rotating flattened particle shell (silver + sparse red, additive) with a
  breathing red core glow, camera dolly on scroll and lerped pointer parallax — built with
  **three + React Three Fiber v8** (R3F v9 needs React 19; we're on 18). **Stance: WebGL-first,
  WebGPU deliberately not used** (would complicate the build for no visible gain at this scene
  complexity). Key architecture: (1) `src/hooks/useVisualTier.ts` gates the whole layer —
  `full` / `lite` (few cores/low memory → fewer particles, dpr 1) / `off` (reduced motion,
  <900px, no WebGL, data-saver) — and only upgrades after first idle; (2) the 3D code
  (`src/webgl/`: `WebGLBackdrop`, `ParticleField`, runtime-generated canvas textures, no image
  assets) is a **separate lazy Vite chunk (~235 KB gz)** never in the main bundle (~84 KB gz);
  (3) the DOM/SVG constellation stays mounted as the information layer and guaranteed floor —
  `SafeVisual` error boundary + context-lost/restored handling mean the hero can never blank
  (verified: with WebGL disabled browser-wide the production build renders the previous design
  with an empty console). **Framer-motion (LazyMotion/domAnimation, `m.*`)** replaced the
  `useReveal` CSS reveal: sections fade+rise once in view, `SectionHeader` cascades (rule line
  draws), grids stagger; `useReducedMotion` renders everything static. **New premium surface
  components** (`GlowPanel` glass panel with gradient hairline + inline-SVG film grain;
  `SystemCard` project cards with corner node dot; `MetricNode` highlight tiles with one-shot
  reveal ring) in `src/styles/premium.css`, tokens only. Also fixed a **pre-existing edge
  artifact**: connector lines now draw by endpoint interpolation because Chrome computes
  dash patterns in screen space under `non-scaling-stroke`, leaking fragments from hidden
  edges. `ConstellationMap`/`ScrambleText` extracted from `ConstellationHero`. Design spec:
  `docs/superpowers/specs/2026-07-02-webgl-visual-layer-design.md`.
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
- **Design direction (superseded 2026-07-02, kept for history):** originally a "drafting /
  engineering title-block" aesthetic with dark + light themes toggled via `:root[data-theme]`.
  Both the title-block hero and the dual-theme system are gone — see the 2026-07-02 dark-only
  art-direction decision above (obsidian / slate glass / silver / violet, single dark theme).
- **Shares the résumé project's rules** — canonical personal details, no invented metrics, and
  the confidentiality mapping live in `../resume-project/CLAUDE.md`. Pull facts from there.
- **No internal system/project/product codenames.** Case studies stay generic.
- **Split out of `resume-project`** into its own standalone top-level repo (2026-06-29).

## Privacy

`resources/` is local-only source material (performance reviews, old résumé, RESUME-METRICS.md,
SKILLS-PROFILE.md), gitignored and never committed. Used only to shape safe public themes. The
site exposes only honest, defensible, public-safe content.

## Current Next Actions

- **Manually spot-check the astronaut hero:** test on a real phone and with OS reduced-motion on
  (desktop is verified; mobile/reduced-motion were code-reviewed in the session that built the
  hero).
- **Media follow-ups:** add a webm encode next to the mp4 for better compression
  (`ffmpeg -i astronaut-video.mp4 -c:v libvpx-vp9 -crf 38 -b:v 0 -an astronaut-video.webm`).
- **Finish going live:** make the GitHub repo public and set Settings → Pages → Source =
  "GitHub Actions" (the workflow handles the rest on push to `main`).
- After first deploy, verify the live site: asset paths, résumé download, and the OG preview
  (paste the URL into LinkedIn Post Inspector / X card validator).
- **Ask Fredrik v2 (optional, later):** stand up a free-tier answer API (e.g. Cloudflare
  Worker + LLM over the same curated context), then set `VITE_ASK_FREDRIK_API_URL` in the
  Pages build — the widget upgrades itself, static answers remain the fallback.
- Keep the site coherent with the résumé whenever a shared fact changes.
- Keep tone conservative and enterprise-friendly; metrics git-verifiable only.

## Second Brain Sync

Matching note: `../second-brain/02-Projects/Professional-Portfolio/README.md`

Related: `../second-brain/02-Projects/Repository System.md` and the sibling `resume-project` repo
(canonical facts).
