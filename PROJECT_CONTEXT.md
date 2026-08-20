# Project Context — Professional Portfolio

## Purpose

A production-oriented personal portfolio for Fredrik Eriksson (Senior Software Engineer / acting
Tech Lead) that showcases work, skills, and experience and _supports_ the résumé. Conservative,
credible enterprise tone (no hype words). The repo is intentionally built with the same stack it
advertises, so it doubles as a work sample.

## Current Status

**2026-08-19 (latest) — the site became an eight-chapter launch narrative, and the frame renderer
learned to draw between frames.** Three scroll-scrubbed chapters now sit between the opening hero
and the document sections — the helmeted explorer becomes a person, that person's work ignites, and
the career figures arrive on the ascent — followed by a new, deliberately quiet **Systems in flight**
section that draws one real production pipeline. Page intensity runs 5·4·5·4·2·2·1·1: it peaks
twice and then stays down.

- **Sub-frame blending.** The frame renderer rounded to the nearest frame and skipped the repaint
  when it had not changed, so slow scroll walked a staircase of held stills — a *temporal*
  resolution problem that benchmark 2 could not see, because it measured paint cost (already
  stall-free). The renderer now cross-dissolves adjacent frames. Measured: **12 distinct rendered
  images across 11 px of scroll**, one full frame interval, where the old renderer produced 1.
- **One renderer, not two.** The chapters are the frame-sequence hero generalised — same runway,
  same loader, same draw path (`CinematicChapter` → `useHeroRunway` + `useHeroFrames` +
  `drawBlendedFrame`). No second scroll system was introduced.
- **The person-reveal is split, not moved.** Chapter 02 plays it from black to the point the face
  begins to read; the contact scene picks the same move up at 0.55 of the clip and resolves it to
  the lit frame. One plate, two beats, and contact keeps the face beside its call to action.
- **Two new media masters**, generated with fal.ai for **$0.94 of the allocation** and graded down
  to the site's palette. Ledger: `docs/media-budget-ledger.md`.
- **Measured (production build):** all three chapters stall-free — 0 frames over 16.7 ms in slow,
  fast and reverse scrub. LCP 124 ms, CLS 0.0066. The chapters add **0 bytes and 0 requests to
  initial load**; frames are fetched on approach. Bundle 98.05 kB gz (+1.5 kB). Under reduced
  motion: 0 frames, 0 manifests, 0 videos, and all three chapters still fully composed.
- **A production-only bug was found and fixed by measuring the production build.** The chapters
  fetched no frames at all outside `vite dev`: `useNearViewport` read `ref.current` in an effect
  keyed on the ref object, which is null on first commit and never re-ran. StrictMode's
  double-invoke hid it in development entirely. The hook now takes the element.

Full detail and the measurement tables: `tasks/2026-08-19-cinematic-launch-narrative.md`.

**2026-08-14 — the cinematic hero was measured against four alternatives; the default did
not change, but two candidates now ship alongside it for real-device comparison.** Two experiments
compared the shipped MP4 scrub against a Three.js/R3F scene, 193- and 97-frame canvas sequences, and
an optimized re-encode. **Three.js lost decisively** — 222 kB gzipped, the worst LCP of every
candidate, and *less* smooth than a plain 2D canvas drawing the same frames — so `three` and
`@react-three/fiber` are removed from `main` again and the no-WebGL rule is re-confirmed, this time
on evidence rather than on the 2026-07-03 design-direction change that first produced it.

The desktop jitter turned out to be **decode area, not keyframe spacing**: the shipped encodes were
*already* all-intra (193 keyframes for 193 frames) at every tier, so the obvious fix had already
been applied. Three controls settled it — a matched-quality resolution ladder improved smoothness
monotonically, a same-resolution encode at ~2 % fewer bytes changed nothing, and the repo's own
720p phone tier has never stalled on identical code. Every seek was decoding a full 2560×1440 intra
frame.

Measured on desktop across slow, fast, reverse and oscillating scroll: the current MP4 produces 3–4
frames over 50 ms per pass and a 146 ms stall on reverse; a 1920×1080 all-intra re-encode roughly
halves that; **both frame sequences are stall-free — not one frame over 16.7 ms in any pattern.**
97 frames matches 193 exactly at half the bytes and half the requests, and beats the current MP4 on
constrained-network readiness (usable at 2.6 s vs 8.75 s, 4.4 MB vs 8.9 MB). Mobile has **no**
smoothness problem in any representation, so the mobile decision is bytes.

`?hero=` now selects `video-current` (default, unchanged), `video-optimized`, or `frames-97` on the
live site, with the dev-only switcher stripped from production. **Confirmed good on a real iPhone
and on desktop after deploy (2026-08-14)** — a qualitative check, not an on-device trace, but it
closes the emulation blind spot the benchmarks were produced through, retina softness included.
**The production default is still `video-current`:** switching it is a deliberate, separate call
that has not been made. Derived media is regenerated in CI
(`scripts/generate-hero-media.mjs`, run by the Pages workflow) rather than committed, so ~17 MB of
binaries stay out of a public repo. Reports: `docs/cinematic-hero-benchmark.md`,
`docs/cinematic-hero-benchmark-2.md`. Full R3F and 193-frame implementations are preserved on
`experiment/cinematic-media-converter` and `experiment/cinematic-media-followup`.

**2026-08-14 (later) — the light appearance's quiet greys were under the accessibility floor, and
now aren't.** `--faint` and `--silver-2` were **the same colour** in the light palette (`#69717c`),
so they failed identically: **3.98**–4.48:1 depending on surface, against WCAG AA's 4.5:1 for normal
text. It was invisible on screen and was found only by computing the ratio while fixing the
assistant's disclaimer. (The first figures quoted for this were 4.24–4.48 — measured before the
`.section-alt` band was identified as a text surface. Re-measuring on the live site against
alpha-composited backgrounds put the true worst case at 3.98:1, so the gap was wider than first
reported, not narrower.) Both are now `#5f6772`: same hue, same
R+8/R+19 channel offsets, only darker. The binding surface turned out to be `--ink-2` (`#e7e7e2`,
the `.section-alt` band) rather than the page background, because `.sheet-no` and `.sheet-eyebrow`
both sit on it; it measures 4.61:1 there and 4.92–5.72:1 on lighter surfaces. **The dark palette is
untouched** — it was already passing at 5.34:1 — and the forced-dark scenes (`.hero`, `.finale`,
`.nav`, `.dock`) were never affected in either appearance. Verified across all 80 small-text
elements on the page with alpha-composited backgrounds: worst case 4.61:1 light, 5.10:1 dark.
`src/styles/contrast.test.ts` makes it permanent — it computes every text token against every
opaque surface token and was confirmed to **fail on the old value** before being kept, plus a
second test guarding the grey scale's ordering so a future contrast fix can't invert the hierarchy.
Not a redesign: the tokens stay separate (they diverge in dark) and only the value moved.

**2026-08-14 — Ask Fredrik became a real mobile concierge instead of a floating widget.** Driven by
real-device iPhone testing: with the keyboard up, the welcome text, the suggestion chips and the
composer all fought for the same height, and the suggestions lost. Diagnosis before editing found
four compounding causes, not one: `.af-chip { max-width: 78vw }` meant ~1.2 chips fit; every scroll
affordance was suppressed (`scrollbar-width: none`, hidden `::-webkit-scrollbar`, no snap, no edge
fade) so nothing said more existed; a 34px-tall horizontal scroller nested inside a vertical one
loses iOS's axis arbitration on most thumb arcs; and `.af-log { min-height: 180px }` refused to
shrink, pushing the composer and tray past the sheet's bottom edge. Separately the dock was
`z-index: 130` against the panel's `120`, so the portfolio's own navigation painted **over** the
assistant, and nothing locked the page behind it. **Below 720px the panel is now a full-viewport
sheet** sized from `window.visualViewport` (`--af-vh` / `--af-vt`), so the composer sits on the
keyboard by construction rather than by subtracting a guessed height; the dock stands down while it
is open and the page is pinned. The carousel is gone: four starter prompts in a 2-column
`auto-fit` grid **inside the scroll region**, which means they cost nothing once the conversation
starts — after an answer, 2–3 contextual follow-ups (driven by a new `followUps` list per curated
topic) appear under it, with `More questions` expanding the rest in place. Phones no longer autofocus
the input, so the first screen is readable before the keyboard arrives. Assistant turns drop their
card on mobile and run full-width at full contrast; auto-scroll only follows when the reader is
already at the bottom, and a `↓` button is offered instead when they are not. **Desktop keeps its
shell and inherits the new content model** — the floating card, launcher pill, `Send` word,
non-modal behaviour and page scrolling are untouched, but because the brief asked for the message
components, prompt definitions and API integration to be *shared* rather than forked, desktop also
gets the welcome state, the starter grid, contextual follow-ups, the auto-growing textarea and the
new scroll policy. Only the shell is breakpoint-specific. (An earlier draft of this entry claimed
desktop was "unchanged"; independent review caught that as false and it was corrected before
merge.) Measurement in Chrome found four defects that inspection would have missed and all four are fixed: a
2px textarea scrollbar from border-box height math, a disabled send button that still read as
active, a WCAG failure on the disclaimer (2.62:1 dark / 4.24:1 light → 5.38:1 in both), and a
JS/CSS breakpoint mismatch at fractional viewport widths that handed the **desktop** card the phone
sheet's modal focus trap — the shell is now read from the one `(max-width: 719px)` query the
stylesheet uses. Independent review then found a real accessibility defect the measurements missed:
**every prompt control unmounts itself when used**, so activating one dropped focus to `<body>`,
outside the panel, where the Tab trap could no longer see it and the next Tab walked into the page
behind the opaque sheet. Focus is parked on a stable element before the state change, and — because
that is a rule every future control would have to remember — **the sheet is now modal by `inert` on
every sibling of `.af-root`**, which makes the background unable to take focus regardless of where
it lands. Verified by calling `.focus()` directly on a background link with the sheet open: refused.
In the same pass, **opening the sheet pushes one history entry (`#ask`) so Back and the iOS
edge-swipe dismiss it** — the site previously created no history entries at all, so Back left the
site entirely and the × was the only way out (the backdrop is unreachable behind a full-viewport
sheet). `/#ask` is now a deep link, handled on load and on `hashchange`, and is shareable. A full
`#ask` page and native `<dialog showModal()>` were both weighed and rejected, with reasons, in the
spec. Review
also caught that a free-text question was permanently retiring curated topics on a bare keyword
match (`'why'` → `why-interview`) even when the *Worker* had answered something unrelated, so a
topic is now retired only when its curated answer is what was actually shown. The follow-the-
conversation rule was extracted to a pure `askScroll.ts` with 13 tests, which is what turned two
further defects into provable ones: the jump-to-latest button flashed during every auto-scrolled
turn, and reopening the panel after scrolling up landed the reader on their oldest message. Lint,
57 tests and the production build are green; measured at 320×568, 390×844,
393×852, 412×915, 430×932, 700×390 landscape, 719×900, 768×1024 and 1534×822, light and dark, with a
simulated keyboard, then **confirmed by the user on a real iPhone** — the device and the
keyboard-open scenario that produced the original report. Backend untouched. Spec:
`docs/superpowers/specs/2026-08-14-ask-fredrik-mobile-concierge-design.md`; task packet:
`tasks/2026-08-14-ask-fredrik-mobile-concierge.md`.

**2026-08-13 (second pass) — the phone hero composition was reversed, the closing film moved above
the closing text on phones, a latent desktop collision was fixed, and the header brand became the
name alone.** Four user-reported items, in the order they matter. (1) **Desktop: the visor telemetry
readout collided with the "Mission Portfolio" eyebrow.** Not a regression from the dock work
(desktop CSS was untouched, verified value by value) but a latent flaw: the readout is anchored at
41% of the hero and the identity is anchored to the bottom, so the two converge as the window
shortens — measured **−5px at 1534×822**, overlapping below that, and invisible on the 900px+
windows it was designed on. `.hero-hud` now caps its anchor against the room the identity needs
(`top: clamp(calc(var(--hud-half) + 8px), calc(100% - var(--hud-floor)), 41%)`), so ≥860px-tall
windows are pixel-identical and shorter ones lift the readout instead of colliding. **Below 600px
of viewport height the readout is hidden outright** — independent review found that a laptop at
200% browser zoom (1536×864 → 768×432 CSS px) has no anchor that fits both, and the first version
of the fix clipped the readout and dropped it on the eyebrow there (−84px, reproduced). (2) **The phone hero is overlaid again, not
stacked** — the film fills the frame at load and the identity rises out of it on scroll, exactly as
desktop does; the 200svh runway, the 0.94 film end and the portrait pan stay. (3) **On phones the
closing film band now sits above the "06 Open to meaningful…" text and no longer pins**, scrubbing
on its own travel through the viewport (one screen of scroll instead of two); tablets and short
desktop windows are unchanged. Where the band is ordered first, the staged closing text ramps off
the panel's travel rather than the section's, and `#contact` lands on the panel rather than on a
viewport of film (`[data-anchor-landing]`, phones only) — both caught by review, the second because
tapping Contact otherwise arrived with the contact copy still un-revealed. (4) **The header's boxed `FE`
lettering is gone and the name itself is the home link** — a monogram image was tried first and
removed at the user's direction, so no emblem file exists in the repo; the dock's Home glyph stays
a line icon. Lint, 33 tests and the production build are green; measured in Chrome via
Playwright at 1920×1080 / 1534×822 / 1366×768 / 1280×600 / 760×640 / 760×900 / 712×390 / 390×844 /
360×640. Spec amendment: `docs/superpowers/specs/2026-08-13-mobile-dock-and-hero-design.md`.

**2026-08-13 — phones got their own navigation and their own hero composition.** _(The hero half of
this entry was reversed later the same day — see the entry above; the dock, the shared navigation
config, and the single assistant state remain current.)_ Two mobile-only
changes, both because the phone had been inheriting the desktop layout rather than being designed
for. (1) **The top header is replaced below 720px by a fixed bottom dock** — a rounded near-black
slab in the home-indicator safe area with seven icon-only destinations (Home, Impact, Projects,
Skills, Career, Contact, Ask Fredrik), an IntersectionObserver-driven active capsule, and the
assistant folded in as a dock citizen instead of a second floating pill. Desktop and tablet
(≥720px) keep the header, the floating pill, and every hero timing unchanged. (2) **The phone hero
is stacked instead of overlaid**: the film is a band across the top of the frame with the identity
directly beneath it, the identity arrives on load rather than on scroll, and the runway drops from
360svh to 200svh with the film running to 0.94 of it (previously 0.78, whose remaining hold
assembled telemetry that phones hide). That removes ~1.6 viewports of scrolling through a mostly
black frame; the film now completes exactly as the scene unpins into the summary. Verified in
Chrome with real video decode at 320/375/390/430px, landscape, tablet and desktop, plus
reduced-motion, keyboard-inset and scroll-spy checks; lint, 33 tests, and the production build are
green. Spec: `docs/superpowers/specs/2026-08-13-mobile-dock-and-hero-design.md`.

**2026-08-13 — finale pacing correction released and live-verified.** The closing
eight-second film no longer races through 540 px on desktop or one ~211 px phone band: its physical
scrub travel now matches the opening hero (1,544.4 px each at 1440×900; within 0.5% at phone/tablet
measurements). Phones/tablets hold the 16:9 film band in a memory-safe sticky runway after the
contact content, while reduced-motion and failed-video fallbacks skip the extended runway entirely.
The old raw-progress endpoint shortcut was also removed; only the last source-frame interval rounds
to the exact 7.991667 s scrub endpoint, so no multi-second jump bypasses the spring. Browser checks
covered forward/reverse/end seeking, desktop/tablet/phone/short-window layouts, reduced motion,
overflow, and console errors. Canvas remains unnecessary: at this true 24 fps/193-frame cadence it
could make selection deterministic and recover at most the 32 frames missed in the controlled
Option A sweep, but cannot make motion smoother than the source cadence and materially increases
network, memory, request count, and maintenance cost. Released in commit `f1a8ca9`; Pages run
`31742959209` passed. A cache-busted live Chromium check measured exactly 1,544.4 px for both films,
3.96 s at the finale midpoint, and the 7.991667 s endpoint while paused with no console errors.

**2026-08-13 — scroll-video Option A released and live-verified.** The astronaut hero and
finale retain Framer Motion plus all-intra H.264, but raw geometry and sprung render/seek work are
now coalesced to one animation-frame callback; the finale's two springs can no longer double-render
within a paint and ≥720 px uses the established tighter overdamped response. A new 1080p middle
tier serves 720–1199 px (hero ~5.8 MB, finale ~4.0 MB), while phones keep 720p and ≥1200 px keeps
1440p. Controlled Chromium sweeps with the same 1440p assets improved the finale from 136 to 161
distinct presented frames (~18%) and the hero from 137 to 143; no long tasks or runtime errors were
observed. Development builds now expose `requestVideoFrameCallback` telemetry. Released in commit
`89a7d83`: Pages run `31740234369`, Worker deploy run `31740234210`, and Worker test run
`31740234416` all passed. The live bundle names both medium-tier assets and both live MP4s are
byte-for-byte SHA-256 matches to the committed files. Real iPhone Safari remains the post-release
check, and canvas/frame sequences remain Option B only if optimized MP4 is still visibly
insufficient.

**2026-08-13 — Ask Fredrik consistency and iPhone cinematic controls released.** The
assistant now deterministically maps the ~16K highlight to the greenfield three-service client
onboarding platform (not this portfolio) and truthfully explains that it receives only the current
question: the visible transcript is page-session UI state, while `sessionId` and D1 analytics are
not conversational memory. Worker and static-fallback matchers have parity and exact-prompt
regressions. The iPhone media path keeps the WebKit seek-paint primer but hides and immediately
self-pauses it, the in-flow finale reaches its final scrub-visible frame within normal document
scroll, and the mobile launcher now has a 44 px target with 20 px plus safe-area edge spacing.
Verified locally at phone, tablet, desktop, and reduced-motion settings; a real iPhone Safari/Home
Screen check remains. Released with `89a7d83` through the successful Worker workflow above; live
requests returned `highlight_16k` and `conversation_memory` with the intended deterministic answers.

**2026-08-13 — cinematic media refreshed from true 4K masters.** The hero and finale keep their
existing eight-second scroll choreography but now derive from 3840×2160 production masters. The
served desktop encodes are 2560×1440 all-intra H.264; phones retain 1280×720 derivatives. Exact
scrub-visible-frame posters and both social cards were regenerated from high-resolution masters.
The release also refreshes the Worker's public Ask Fredrik social card through the existing
`deploy-worker.yml` path. Live-verified after commit `c2fc7e4`: Pages and Worker workflows passed,
the Worker passed its `/ask` smoke test, and sampled media/social assets from both live origins were
byte-for-byte SHA-256 matches for the new outputs.

**2026-07-29 — employment status updated across the whole surface.** A verified legal-employer
report reset the résumé's employment facts, and this repo was brought into line in the same pass:
the Prudential role **ended June 2026**, so nothing on the site may read as current employment. The
timeline in `src/data/experience.ts` was restructured into the real sequence (Genesis Corp
consultant February 2022 – June 2023 → direct employment June 2023 → Senior Software Engineer 2024 →
acting Technical Lead 2025 – June 2026) and **no entry is marked `current`**. All copy is past tense,
"acting Tech Lead" is now "**Acting Technical Lead**" everywhere, and the AI Client-Assist case study
gained the real architecture: Salesforce → Logstash → Elasticsearch, answered over by Spring AI with
Claude Sonnet 4.5 on Amazon Bedrock, so business users reached client detail without consuming a
Salesforce read-only license. The internal project name is deliberately **not** used. `public/resume.pdf`
was republished (1 page). The Ask Fredrik knowledge base (frontend + Worker) was updated in the same
pass so the live assistant cannot contradict the PDF a recruiter just downloaded. Pushes to `main`
that touch the Worker surface deploy it through `deploy-worker.yml`. Verified: lint
clean, 21 site tests, 457 + 54 Worker checks, `npm run build` clean, cross-repo coherence check
coherent. Canonical facts and the job-board action list live in the sibling repo
(`../resume-project/AGENTS.md`, `../resume-project/EMPLOYMENT-HISTORY-UPDATE.md`).

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
  `premium.css` + `hero.css` + `finale.css` + `ask-fredrik.css`) — system-aware warm-paper Light
  Mode and black/silver Dark Mode, with the hero, navigation and finale held as dark cinematic
  anchors and no manual theme toggle
- framer-motion (LazyMotion/domAnimation, `m.*`) for section transitions; **no WebGL/WebGPU**
  (the three + R3F layer was removed 2026-07-03 with the astronaut-video hero — single ~80 KB gz
  bundle again)
- Typed content modules in `src/data/` as the single source of truth
- Docker: multi-stage node build → nginx (Alpine), serves on port 8790; host exposure
  configurable via `BIND_ADDR` (default `127.0.0.1`, localhost-only) and `PORT` (see `.env.example`)
- ESLint (flat config) + Prettier; Node's built-in test runner covers component helpers, responsive
  media boundaries/scheduling, admin utilities, browser metadata, and Ask Fredrik fallback routing

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

- **2026-08-13 (second pass) — the phone gets the same *composition* as desktop; only the pacing
  and the chrome differ. And an absolutely-positioned overlay must reserve room for whatever is
  anchored opposite it.**

  The stacked phone hero shipped that morning (film band on top, identity beneath, identity on
  load) was reversed the same day at the user's direction: on a phone the opening shot is the film
  and nothing else, and the identity rises out of it on scroll, exactly as on desktop. What phones
  legitimately change is **pacing** (200svh runway, film to 0.94), **crop** (portrait
  `object-position` pan), and **chrome** (no telemetry, no scroll cue, `--dock-space` clearance,
  blur-free reveal for mobile GPUs) — not the composition itself. The same principle moved the
  closing film **above** the closing text on phones and unpinned it: one screen of scroll to the
  contact actions, not two, while tablets and short desktop windows keep the pinned runway below
  the text.

  The desktop bug found in the same pass is the durable lesson: **`.hero-hud` is anchored to a
  percentage of the hero and `.hero-content` is anchored to its bottom edge, so nothing in the CSS
  knew they were on a collision course.** They converged as the window shortened and overlapped
  below ~830px of viewport height — a real defect that had shipped unnoticed because it is
  invisible on the 900px+ windows the scene was composed on. The fix caps the readout's anchor
  against the space the identity needs (`--hud-floor` = the identity's own bottom-padding clamp +
  the panel's measured 288px + a 24px gap + `--hud-half`), floored at half the readout + 8px so the
  frame can never clip it. **Both numbers are measured, so both need re-measuring when what they
  describe changes**: 288px is the identity panel (the name, the sub copy, a single-row CTA wrap),
  and `--hud-half` is half the readout, which is why it rises to 70px below 900px wide where
  `.hud-cell` gains padding — a review round caught that the flat 52px under-reserved there.
  **Below 600px of viewport the readout is hidden entirely**: at 768×432 (a 1536×864 laptop at 200%
  browser zoom, which still matches every desktop width rule) the identity alone takes ~330px of a
  364px frame, so no anchor fits both and clamping only clipped the list. Verified 1920×1080
  (unchanged at 41%) through 720×800, with 768×432 / 900×560 / 820×560 hidden.

- **2026-08-13 — Phones (≤719px) get a bottom dock and a stacked hero; ≥720px is untouched.**
  _(The stacked-hero half is superseded by the entry above; the dock, the token-driven chrome
  geometry, the shared `navigation.ts` and the single assistant state all stand.)_
  The phone breakpoint is the project's existing one (`useVideoMediaTier`, hero, finale) — no new
  breakpoint was invented, so 720–879px tablets keep the desktop header. `--nav-h` (68px, 0 on
  phones) and `--dock-space` in `tokens.css` are now the single source for chrome geometry:
  sticky tops, anchor landings (`useAnchorGlide` reads `--nav-h`), the hero's bottom padding, the
  assistant sheet, and the footer all derive from them instead of hard-coding 68px. Navigation
  destinations live once in `src/components/navigation.ts`; `Nav` and `MobileDock` render the same
  list, and the scroll-spy is the shared `useActiveSection` hook. **Home replaces Summary** on the
  dock (the opening film and the summary are one landing) — that is what keeps seven thumb targets
  usable at 320px, and the boxed `FE` mark is not part of the phone dock. Ask Fredrik has one
  state and one panel with two triggers (`useAskFredrik`); the floating pill is hidden on phones.
  Icons are hand-drawn on a single 24×24 grid in `NavIcons.tsx` — do not add an icon package for
  seven paths.

  On the hero: the phone runway is **200svh with the film ending at 0.94** (desktop stays 320vh /
  0.78). **Amended the same day — the stacked phone composition was reversed** (see the decision
  below): the film fills the phone frame again and the identity rises on scroll, so the band, its
  `clip-path` seam fix and the landscape un-pin block are gone. The runway and film end survive the
  reversal. The film-travel coupling is now **two** places, both ≥720px — the `.finale-media-runway`
  height in `finale.css` and the travel constant passed to `stickyMediaProgress` in
  `AstronautFinale.tsx` — because phones no longer give the closing film a runway at all.

- **2026-08-13 — Ask Fredrik is intentionally stateless, and capability/meta questions are
  deterministic.** The answering pipeline receives only the current question. The browser's visible
  transcript is ephemeral page-session state; `sessionId` supports grouping/rate limiting and D1 is
  a best-effort analytics log, neither is queried as conversational memory. Questions about prior
  prompts and public headline metrics such as ~16K therefore stay in curated Worker and frontend
  fallback intents instead of being left to generative inference. This avoids false memory claims,
  metric misattribution, and API/fallback drift without increasing prompt-injection or retention
  surface.

- **2026-08-13 — Astronaut media now has a 4K-master → optimized-derivative pipeline.** Both
  eight-second films were replaced with true 3840×2160, 24 fps, 193-frame BT.709 masters while
  preserving the existing scroll timelines. **Amended by Option A on 2026-08-13:** viewports ≥1200 px
  receive 2560×1440 all-intra H.264 encodes (hero ~9.1 MB, finale ~6.1 MB), 720–1199 px receive
  1920×1080 derivatives (~5.8/~4.0 MB), and phones retain 1280×720 derivatives (~3.3/~2.3 MB) to
  protect transfer and decode cost. Scroll geometry and seek painting are animation-frame-coalesced;
  keep Framer Motion rather than adding GSAP. The three 2560×1440 posters are extracted from
  the exact first or final scrub-visible frame (frame 191, because seeking caps at
  `duration - 0.05`), preventing a fallback/video flash. The two 1200×630 social cards now derive
  from tracked 4800×2520 masters with unused alpha stripped. Production masters live only under
  `media-src/`; `public/` holds optimized delivery assets. All seven files in `public/media/` remain
  referenced, so none were removed. The closing film's physical scroll distance mirrors the opening
  film; do not shorten its progress ramp merely to reach the page-end frame. Canvas/image sequences
  remain a precision fallback, not a cadence upgrade: the 24 fps masters still contain 193 frames.

- **2026-08-04 — Cloudflare Web Analytics enabled (closes the AGENTS.md TODO).** A Web
  Analytics site was registered in the Cloudflare account for hostname
  `eriksson008.github.io` (free, cookieless RUM beacon) and the snippet is injected from
  `src/main.tsx` rather than `index.html`, gated on `import.meta.env.PROD` so `npm run dev`
  sessions never count as visitors. The Docker/`preview` builds _do_ report (host
  `localhost`, filterable in the dashboard) — a hostname guard was considered and rejected
  because it would silently kill analytics on any future custom-domain move. The beacon
  token in the bundle is a public site identifier (like a GA measurement ID), not a
  credential. Independent review verified against the live `beacon.min.js` source that
  dynamic module injection is safe: `document.currentScript` is null for module scripts,
  but the beacon falls back to `document.querySelector('script[data-cf-beacon]')`, the CDN
  serves `Access-Control-Allow-Origin: *` for the CORS-mode module fetch, and
  `window.__cfBeacon` guards double-load. Note for wrangler work: the wrangler OAuth token
  has no RUM scope, so Web Analytics sites must be created in the dashboard (or with a
  purpose-made API token), not via wrangler's stored auth.

- **2026-07-28 — Apple touch icons are full-bleed on purpose, and `public/` no longer ships dead
  art.** Both Apple touch icons (`public/apple-touch-icon.png` for the portfolio,
  `public/admin-icons/apple-touch-icon.png` for the Ask Fredrik dashboard) were regenerated at
  180×180 RGB from new edge-to-edge source art. The previous versions had a rounded-square mask
  baked into the image, which iOS then masked _again_ — a squircle inside a squircle with dark
  corners. iOS applies its own mask, so the artwork underneath must reach the edges. Do not
  "helpfully" re-add rounded corners to these two files. The remaining favicons and PWA icons keep
  the earlier framing, which is correct for their contexts (they are never OS-masked).

  The same pass deleted ~4 MB of assets nothing referenced: the two 1.6 MB icon masters
  (`portfolio-icon.png`, `admin-icons/portfolio-admin-icon.png`), the superseded `favicon.svg`
  "FE" monogram, and eighteen undeclared icon sizes (48/72/96/128/152/167/180/256/384 in both
  families). Nothing in any manifest, HTML head or component referenced them, and `public/` is
  copied wholesale into the deploy, so every byte was shipped and never fetched. **The only icon
  files that may exist are the ones a manifest or a `<link>` actually names** — `git log` holds the
  masters if the family ever needs regenerating.

- **2026-07-28 — `deploy-worker.yml` watches the `public/` files that `build:admin` copies.** The
  Worker's trigger list covered `cloudflare/ask-fredrik-worker/**`, `src/admin/**` and
  `vite.config.ts`, but `build:admin` runs with `publicDir: false` and hand-copies
  `public/admin-icons/**`, `public/admin.webmanifest`, `public/og-ask-fredrik.png` and
  `public/share.{html,css,js}` into the Worker's assets. Those paths were unwatched, so changing the
  dashboard icon or the share card would commit, go green in CI, deploy to Pages — and leave the
  Worker serving the old file, since Pages does not publish them either. Found while shipping the
  new dashboard icon, which would have silently never gone live. `admin/ask-fredrik/**` was missing
  for the same reason. **Keep the trigger list in step with the `copy-admin-icons` plugin in
  `vite.config.ts`** — the two lists have no automated link.

- **2026-07-28 — System appearance now governs every web surface without changing the astronaut
  identity.** The public portfolio, Ask Fredrik launcher/dashboard and public `/share` wrapper use
  intentional semantic Light and Dark Mode palettes selected by `prefers-color-scheme`; there is no
  stored override or hydration script. Root, overscroll, form controls, panels, dashboard states and
  media-aware browser chrome now follow the same selection. The hero, navigation and finale retain
  their original black mission-control palette in both modes, and no film or astronaut asset is
  filtered or recolored. The old 2026-07-02 dark-only decision remains useful history but is
  superseded for document surfaces.

  Portfolio and Ask Fredrik retain separate icon families. Transparent 16px/32px favicons serve tabs
  and bookmarks; opaque Apple touch icons and branded standard PWA icons serve installed contexts;
  separately padded 192px/512px maskable files remain declared only as `purpose: maskable`. Both
  manifests now have stable IDs and retain black install/startup fallback colors. Runtime metadata
  publishes light and dark theme colors. No service worker exists, so neither surface advertises
  offline use. iOS may require removing and re-adding an existing Home Screen entry to refresh its
  cached icon or manifest.

- **2026-07-27 — Ask Fredrik got a share wrapper at `/share`, and it needed no Access change.**
  `public/share.html` (+ `share.css`, `share.js`) is a public page carrying the tags and the
  astronaut card; it bounces an admin to `/admin/ask-fredrik/`. **Share `/share`, not the
  dashboard URL.** All four files are copied to the Worker root by `npm run build:admin` — that
  build sets `publicDir: false`, so they are listed explicitly in `vite.config.ts` beside the
  admin icons, and a typo in one of those paths is the only way they can go missing.

  **Unique among the four apps: nothing was exempted.** Access here is scoped to the `/admin`
  paths only, so `/` and `/share` were already public and the wrapper works as shipped — no
  Bypass policy, no new application. Card Pilot, AFR and Homebase each needed one; this did not.
  Live-verified 2026-07-27: `/share` and `/og-ask-fredrik.png` return `200` with no Access change,
  while `/admin/ask-fredrik/` still `302`s. That is also why the wrapper points _at_ the dashboard
  rather than trying to make the dashboard previewable: the gate on `/admin/ask-fredrik/` **is**
  the admin gate, and `/admin*` must never appear in a Bypass policy. The redirect is JavaScript
  because several unfurlers follow a `<meta refresh>` or a 302 to the login page, and no crawler
  runs a script. Supersedes the entry below, which concluded the situation was unfixable —
  it was unfixable _at the dashboard's own URL_, which is not the same thing.

- **2026-07-27 — The Ask Fredrik dashboard got a share card, and it will stay inert.**
  _(Superseded by the entry above — the tags on the dashboard page are still inert, but `/share`
  now gives Ask Fredrik a working preview.)_
  `admin/ask-fredrik/index.html` now carries `og:*`/`twitter:*` tags, and `npm run build:admin`
  copies `public/og-ask-fredrik.png` (1200×630, the astronaut against a mission-control wall) to
  the Worker's root via the existing `copy-admin-icons` plugin — `publicDir` is `false` for that
  build, so nothing from `public/` arrives on its own.

  **The two halves land differently, and that is the whole point.** Access here is scoped to the
  **`/admin` paths only**, so `/og-ask-fredrik.png` is already publicly fetchable and needs no
  bypass. But Open Graph tags live _inside_ the HTML, so a preview would require an unfurler to
  read `/admin/ask-fredrik/` — and the gate on that path _is_ the admin gate. There is no version
  of exempting it that is not "publish the admin dashboard". So unlike Homebase and AFR, this is
  not a pending decision: **it is the correct permanent state**, and `/admin*` must never appear
  in a Bypass policy. The tags cost nothing and are correct if the page is ever opened up.

  The URLs are absolute rather than `%BASE_URL%`-relative (which resolves to `/` for this build)
  because an unfurler holds only the tag's string. `noindex, nofollow` stays and does not
  conflict — it is a directive to search indexers, which the unfurlers reading these tags do not
  consult. **The public portfolio's own `og-image-v2.png` was left untouched**; it already
  previews correctly, and the new astronaut is a richer variant of the same figure rather than a
  replacement. If a real preview for "Ask Fredrik" is ever wanted, the target is the public root
  (`GET /` could content-negotiate HTML against its JSON API index) — see the Worker README.

- **2026-07-27 — The Worker was renamed `ask-fredrik-worker` → `ask-fredrik`, and three things did
  not follow it.** The `-worker` suffix was noise in a hostname that already ends `.workers.dev`.

  **Cloudflare has no rename operation.** The name is the Worker's identity _and_ its `workers.dev`
  hostname, so this was a deploy under the new name followed by a delete of the old Worker. What did
  not move by itself, in descending order of how quietly it fails:

  1. **The `ADMIN_ALLOWED_EMAILS` secret.** Secrets are stored per script name. The new Worker starts
     with none, and `src/access.ts` fails closed — every admin endpoint returns 503 and it reads
     exactly like a code regression. Re-set with `wrangler secret put`.
  2. **The Cloudflare Access application's destination**, because Access protects a _hostname_. The
     `Ask Fredrik` application was given the new destination alongside the old one _before_ the
     deploy, so `/admin` was never briefly unprotected. It was **edited, not recreated** — a new
     application would have issued a new AUD and invalidated `ACCESS_APP_AUD` in `wrangler.jsonc`.
  3. **The `VITE_ASK_FREDRIK_API_URL` GitHub Actions repository variable**, which is not in this
     repository at all. It bakes the Worker's `/ask` URL into the portfolio bundle at build time, so
     until it is updated _and the Pages build re-runs_, the published widget still calls the old
     hostname. This is the one that survives a green CI run on both repos.

  The D1 database moved for free: it is bound by id, and the id belongs to the database rather than
  to whichever Worker binds it. Workers AI likewise.

  **The directory stays `cloudflare/ask-fredrik-worker/`**, as does the npm package name. They
  describe "the Worker for Ask Fredrik" rather than the deployed Worker, and renaming them would
  have churned every workflow path, the Vite `outDir`, and the sibling `resume-project` coherence
  checks for no gain.

- **2026-07-27 — The phone number on `public/resume.pdf` is an accepted exception to the privacy
  rule (user decision).** An independent review flagged that the served résumé carries a phone
  number on a crawlable URL while `AGENTS.md` said "do not expose personal phone number".
  Resolved in favor of keeping it: that PDF is the artifact uploaded to job boards and job-hunting
  sites, where omitting a phone number costs callbacks. **The exception is scoped to that one
  file.** The number must never enter `src/**`, `cloudflare/ask-fredrik-worker/src/**`, page copy,
  or OG metadata — it is absent from all of them (verified 2026-07-27), and
  `APPROVED_CONTEXT.contact` deliberately lists only email, LinkedIn, and GitHub, so the assistant
  cannot hand it out. `AGENTS.md` now states the rule and its carve-out together. **Amended
  2026-07-29:** this file and `AGENTS.md` had both been printing the number verbatim while
  documenting the rule about it. Redacted — the canonical value lives only in the private sibling
  repo, and `check-coherence.mjs` now scans this repo's Markdown for it as well, not just `src/**`
  and the knowledge base.

- **2026-07-27 — Public `resume.pdf` regenerated from a repositioned résumé (source of change:
  the sibling `../resume-project` repo).** The maintained résumé package was rewritten to present
  a senior engineer and technical lead with deep Salesforce expertise rather than a Salesforce
  engineer — a headline line, "(Acting Tech Lead)" in the job title, bullets reordered so
  leadership / the greenfield three-service platform / the passwordless auth design / the
  Bedrock + Spring AI assistant come first, ATS-categorized skills, and a new **Selected Projects**
  section. Two of those projects are this repo's own work: **Ask Fredrik** and **Homebase**.
  `public/resume.pdf` was regenerated — still exactly one page, now built by
  `../resume-project/resume-building/build-pdf.ps1` instead of a manual browser print. Two ATS
  defects in the old PDF were fixed at the source: **CSS list markers never reached the PDF text
  layer**, so the résumé extracted with zero bullets (verified: old 0, new 8), and Chrome was
  writing `ﬁ`/`ﬂ` ligature glyphs into the text layer. On the ligatures, be precise — the old file
  really does contain U+FB01 ×3 and U+FB02 ×1, and `pypdf` extracts `ﬁnancial` / `greenﬁeld` /
  `workﬂows`, but `pdftotext` resolves them via the font's ToUnicode map and yields the plain
  words. So it broke keyword matching **for parsers that don't resolve the mapping**, not for all
  of them; `font-variant-ligatures: none` removes the extractor dependence entirely. Rationale,
  evidence, and the keyword audit: `../resume-project/RESUME_OPTIMIZATION_REPORT.md`.

- **2026-07-27 — Site content and the Ask Fredrik knowledge base repositioned to match the résumé;
  Homebase's description corrected; AFR Gateway renamed to App Dashboard.** Regenerating the PDF
  left the site one version behind it, so `src/data/` and the Worker knowledge base were brought
  in line. (1) **`src/data/`**: `profile.ts` tagline and title-block no longer lead with
  Salesforce; `skills.ts` gains an _Edge & Platform_ group (Workers, D1, Access, Wrangler,
  migrations, cron, CSP, PWA) and splits the AI group into production AI, LLM application design,
  and AI-assisted tooling; `highlights.ts` replaces the "6 repos / AI-assisted delivery" tile with
  the contributor-share metric; `projects.ts` adds **App Dashboard** and expands the portfolio
  entry to cover the assistant. (2) **`src/data/projects.ts` Homebase was badly stale** — it still
  described the _retired_ Express/SQLite/Argon2id encrypted-vault app that was archived to
  `legacy/` in the July Cloudflare rebuild. Rewritten to the real architecture (Workers + D1 +
  Access + cron + PWA, metadata-only, no credentials stored). The same staleness existed in the
  Worker KB. (3) **Worker KB** (`fredrik-{context,skills,projects,qa}.ts`): six new skills
  (Cloudflare Access, Model Context Protocol, Rust, Tauri, SQLite, automated testing), all at
  `project` confidence with answers that explicitly disclaim enterprise experience; **"AFR Gateway"
  renamed to "App Dashboard"** with the old name kept as an alias so existing questions still
  resolve; curated recruiter answers rewritten. (4) **A skill entry named `API gateways (Kong)`
  was genericized** to `API gateway integration` — "Kong" is on the confidentiality never-list in
  `../resume-project/AGENTS.md` and should never have been in a public knowledge base.
  (5) **Independent review caught two real defects** before this landed: "63% of the codebase"
  overstated a documented **63%-of-commits** figure (corrected everywhere, including the résumé),
  and a bare `'testing'` alias made the assistant answer "Yes —" to _"Does he do penetration
  testing?"_, hijacking questions that belong on the conservative not-confirmed path. Both fixed,
  with routing tests added for all six new skills, a `relatedProjects` referential-integrity
  invariant, and negative tests for the alias. Worker suite 424 + 54 = **478 checks**.
  (6) **`SYSTEM_PROMPT` is 7,564 chars against a hard 8,000-char test cap** — every skill/project
  `summary` is serialized into it on every AI call, so keep new summaries terse.

- **2026-07-23 — Admin auth replaced with Cloudflare Access; admin dashboard now served by the
  Worker (user-directed brief; supersedes the 2026-07-07 token-gate design).** The manually
  pasted `ADMIN_TOKEN` bearer (sessionStorage + `Authorization` header) is fully retired.
  New architecture: (1) **the admin UI moved out of the GitHub Pages artifact** — GitHub Pages
  can never sit behind Cloudflare Access, and a cross-origin SPA against an Access-protected
  API is the third-party-cookie/CORS failure mode Cloudflare's own docs warn about — and is
  instead **built by `npm run build:admin`** (Vite `--mode admin-worker`: admin entry only,
  base `/`, `publicDir` off + admin-icon copy) **into the Worker's gitignored `./public`
  assets dir**, which `wrangler deploy` serves at `/admin/ask-fredrik/` same-origin with the
  admin API (Access supports `workers.dev` one-click since Oct 2025; the app must be
  path-scoped to `/admin` so public `/ask` + `GET /` stay open). (2) **The Worker re-validates
  the Access assertion itself** (`src/access.ts`, zero-dep WebCrypto): RS256 against the team
  JWKS (per-isolate cache, refetch on unknown kid), issuer + AUD + expiry (60 s leeway), then
  the verified email must be in the `ADMIN_ALLOWED_EMAILS` **secret** — 401 invalid / 403
  not-allowlisted / 503 fail-closed when `ACCESS_TEAM_DOMAIN`/`ACCESS_APP_AUD` vars or the
  secret are unset; assertions are never logged. One `requireAdmin` middleware guards all
  admin routes incl. the new **`GET /admin/me`** (`{email, authMode}`) the dashboard boots
  from. Admin CORS shrank to localhost-only (production is same-origin; all admin routes are
  read-only GETs, so no CSRF surface returned with the cookie). (3) **Local dev**:
  `ASK_FREDRIK_DEV_AUTH=allow` in `.dev.vars` only, honored **only for loopback hostnames** —
  a leaked var cannot open production (tested). (4) **Frontend**: TokenGate + sessionStorage
  deleted; boot = `/admin/me` → checking / sign-in-required (reload triggers Access) /
  forbidden / error states; identity shown in the header (Access logout link, "dev session"
  badge); stats gained honest `avgLatencyMs`/`avgLatencyMs7d` cards ("not recorded" when
  null) from the stored `latency_ms` — no invented metrics. (5) **Tests**: new zero-dep
  `admin-auth.test.ts` (49 checks) drives the real fetch handler with a locally generated RSA
  key + stubbed JWKS/D1: forged/expired/wrong-aud/wrong-issuer/alg-none/tampered assertions,
  allowlist 403s, `/admin/me` shape, dev-mode hostname gating, `/ask` untouched. Verified:
  worker `tsc` + 381 checks, root lint + 11 tests + both builds green. **Dashboard-side setup
  completed and live-verified the same day** (Access on the production `workers.dev` URL, app
  scoped to `/admin`, PIN policy for the admin email, vars + `ADMIN_ALLOWED_EMAILS` secret set,
  `ADMIN_TOKEN` deleted, deployed): `/ask` answers publicly with correct CORS, all `/admin/*`
  paths 302 to Access, and the dashboard renders signed-in against production D1. One gotcha
  hit and fixed: `ACCESS_TEAM_DOMAIN` must include the `https://` scheme (compared verbatim to
  the JWT `iss`, and used to build the JWKS URL) — the bare hostname fails closed as 401.
  Spec: `docs/superpowers/specs/2026-07-23-ask-fredrik-access-auth-design.md`.

- **2026-07-09 — Dashboard time-filter correctness pass (local-timezone anchoring) + first
  frontend test harness (repo review, branch `prompts-dashboard`).** Review of the admin
  dashboard surfaced one real bug class: the table renders `created_at` in the **viewer's local
  timezone** (`toLocaleString`), but the **Today** and **Custom** range filters were computing
  day boundaries in **UTC** (`setUTCHours`, `…T00:00:00Z`). For the user (UTC+2) that shifted
  ranges by the offset — a prompt shown as "today" locally could fall outside the "Today" filter
  (off-by-one near midnight). Fix: `src/admin/dateRanges.ts` refactored into a documented pure
  utility (`getDateRangeForFilter(query, now?)`, `normalizeDateRange`, `startOfLocalDayIso`,
  `formatDashboardDate`) that anchors `today`/`custom` to the **local calendar day** and
  serializes to UTC for the query (storage/query stay UTC; rolling 7d/30d unchanged —
  timezone-independent). Custom `to` is inclusive of the whole local day; inverted custom ranges
  are swapped; garbage date input is dropped instead of throwing. The **Today summary card** now
  matches the Today filter — the dashboard passes its local start-of-day to
  `GET /admin/stats?today=<iso>`; the Worker (`handleAdminStats`) reads it additively and falls
  back to the UTC day when absent/malformed (backward-compatible with curl/older callers, no
  redeploy required for the rest to work). Table time cells gained a `title="<iso> (UTC)"` for
  unambiguous reference. Added the repo's **first frontend test** (`src/admin/dateRanges.test.ts`,
  `npm test` via `node --test`, zero-dependency, timezone-independent assertions) — 11 checks;
  test files excluded from the app `tsc` build. No public-portfolio changes; admin bundle stays
  code-split (~5 KB gz). Verified: 11 date tests + lint + worker `tsc` + 332 worker tests + full
  build all green. **Open:** the Worker must be redeployed (`wrangler deploy`) for the stats
  `today` param to take effect; the 14-day sparkline still buckets by UTC day (cosmetic, noted in
  `docs/ask-fredrik-dashboard.md`).

- **2026-07-07 — Private Ask-Fredrik admin dashboard (branch `prompts-dashboard`, user-directed
  brief).** Internal "mission control" analytics panel to see what visitors prompt the Ask Fredrik
  widget. Shipped as a **separate Vite entry** (`admin/ask-fredrik/index.html` + `src/admin/**`) at
  route `/admin/ask-fredrik/`, code-split so **none of it lands in the public bundle** and it is
  never linked from the public nav (`noindex, nofollow`). Gated build-time by
  `ENABLE_ASK_DASHBOARD` (default on). **Auth = server-side token** (brief's option b; Cloudflare
  Access isn't wired and isn't "easy"): the admin types the `ADMIN_TOKEN` into a login field, held
  only in tab `sessionStorage` and sent as `Authorization: Bearer` — **no secret in the bundle**.
  Worker (`cloudflare/ask-fredrik-worker`) extended additively: `/admin/logs` gained
  `from/to/source/intent/q/limit/offset` + `total` (backward-compatible with the original curl
  contract), and a new `GET /admin/stats` returns aggregates. Both admin endpoints now answer CORS
  **only** for the dashboard origins (Pages + localhost) and still require the bearer — Bearer auth
  means no CSRF surface, so this doesn't weaken the prior "no-CORS curl-only" posture. **No D1
  migration** — the existing `ask_fredrik_logs` schema already had every field. Privacy: display-only
  redaction of emails/phones/long-ids (`src/admin/redact.ts`); raw D1 unchanged; CSV export uses the
  same redacted values. Verified end-to-end against a local Worker (seeded D1): auth 401s, filters,
  pagination, CORS allow/deny, `/ask` untouched, and the browser panel rendering + redacting live
  rows. Full guide: [`docs/ask-fredrik-dashboard.md`](docs/ask-fredrik-dashboard.md). Open follow-up:
  the CLAUDE.md TODO to add a Cloudflare WAF rate rule on `/ask` still applies; `/admin/*` is not
  rate-limited (token-gated).

- **2026-07-07 — Hero HUD reworked from four-corner brackets to a bulleted telemetry readout on
  the visor (user-directed brief, two passes).** The scattered corner-bracket / edge-tick /
  four-label overlay read too "gaming HUD". First pass tried a centered glass strip at the top of
  the frame; user redirected: put it **on the astronaut helmet, in the Mission-Portfolio font/
  style, as a bulleted HUD list**. Final: a **panel-less floating readout** anchored to the same
  visor point as the ambient glow (`left: 56%`, `top: 41%`, centered via `translate(-50%,-50%)`),
  styled in the `.hero-eyebrow` idiom — mono, uppercase, letter-spaced, silver. Four lines, each a
  hairline dash bullet (echoing the eyebrow's lead rule) + value (`--silver`) + label
  (`--silver-2`): **Exceptional ×3 · Reviews**, **750+ · Commits**, **120+ · Stories**, **Acting
  Tech Lead · Senior Software Engineer** (role line; no "hybrid"). Real text
  (`role="group"` + `aria-label`, no longer `aria-hidden`); no background/blur/border (reads as
  data on the glass). **Choreography preserved**: resolves in the post-film hold — the list fades/
  drifts up on `--p` 0.76→0.88, lines clear left-to-right (0.78/0.81/0.84/0.87), blur-in on
  desktop only. **Desktop-only** — hidden (`display:none`) at ≤719px, where on the portrait crop
  it crowded the visor and the stacked identity below (an interim mobile-fit pass with a shortened
  "Sr. Software Engineer" label was tried, then dropped once the readout was made desktop-only).
  Reduced-motion/static heroes fade it in on `.is-settled`. Video, scrub springs,
  runway, and mobile scroll behavior untouched. All old `.hud-corner/.hud-tick/.hud-label` markup
  - CSS removed. Lint + build green.
- **2026-07-07 — Desktop hero scrub smoothness (mouse-wheel), mobile untouched (user-directed
  brief).** The soft shared `GLIDE_SPRING` (26/14/1.1, ~1.5–2 s tail) feels great under a
  trackpad's continuous deltas but disconnected/stuttery under a mouse wheel's chunky notches
  (the film trails and keeps gliding after the wheel stops). Three scoped desktop-only fixes,
  all gated to ≥720px so the well-liked mobile scrub and the finale are byte-for-byte unchanged:
  (1) a **tighter desktop hero spring** — new `HERO_SPRING_DESKTOP` (stiffness 60 / damping 20 /
  mass 1.0, still overdamped ζ ≈ 1.29 so it never plays backwards, ~0.7 s settle); the hero uses
  `desktop ? HERO_SPRING_DESKTOP : GLIDE_SPRING`, mobile + finale keep `GLIDE_SPRING`. (2)
  **Runway 360vh → 320vh on desktop only** (`@media (min-width: 720px)`; mobile stays 360vh) so
  each wheel notch moves the film enough to feel connected. (3) **Compositor isolation** on
  desktop: `translateZ(0)`/`will-change` on the scrubbed `<video>` and `will-change: transform,
filter` on the four blurred identity lines, so the per-frame seek repaint and the animated
  `blur()` reveal rasterize on their own GPU layers instead of thrashing the hero. Video encoding
  was already scrub-optimal (all-intra, 193/193 keyframes — every seek decodes independently);
  the whole-frame seek throttle (`> 1/24 s`, skip while `seeking`) is unchanged. Lint + build
  green; verified computed runway = 320vh and layer hints applied at 1586px, no console errors.
  Note: `<video>` scrub repaint is inherently not rAF-locked, so a trace of decode-cadence
  softness remains — these changes tighten and isolate it without a canvas/WebGL rewrite.

- **2026-07-07 — Floatier glide, hero recomposed for the new film, media renamed + repo
  cleanup (user-directed brief).** Follow-up pass on the same day's spring work: (1)
  `GLIDE_SPRING` retuned from stiffness 50 / damping 18 / mass 0.9 to **stiffness 26 /
  damping 14 / mass 1.1** (still overdamped, ζ ≈ 1.31) — the scrub now trails scroll with a
  clearly visible momentum tail (~1.5–2 s settle) on both the hero mp4 and the finale film.
  (2) **Hero composition adjusted to the new film's framing**: the regenerated film settles on
  a frame-filling helmet with the visor centered at ≈(56%, 41%) of the 16:9 image (the old one
  settled smaller and centered), so the visor HUD moved/resized (`left: 56%`, `width:
min(44vw, 58vh)`, `aspect-ratio: 1.35` — inset on the glass, labels no longer float
  off-visor), the ambient glow re-anchored to (56%, 41%) at `min(50vw, 76vh)`, the bottom
  scrim deepened (0.82 → 0.88) under the identity panel (the new settled frame has a bright
  suit at the bottom), and the phone `object-position` pan widened 30→50% ⇒ **24→58%** so the
  settled visor actually centers under the portrait crop. Verified via DOM-geometry probe at
  1586×1307 (HUD center within ~3% of the cover-cropped visor center; label confirmed on the
  glass in a screenshot — this session's Chrome tab was background-throttled, so full-motion
  verification stays on the post-deploy checklist). (3) **Media renamed for consistency** with
  the finale set: `astronaut-video-*` → `astronaut-hero-{scrub,scrub-sm,poster,start}`, and
  the two unreferenced source encodes moved out of the served bundle to
  `media-src/astronaut-{hero,finale}-source.mp4` (~5.7 MB less in every Pages artifact);
  `astronaut-video-end.png` (1.4 MB, referenced nowhere) deleted. (4) **Stale design docs of
  the removed WebGL/constellation hero deleted** (constellation-hero plan+spec, WebGL visual
  layer, hero formation sequence); the scroll-hero and dark-only art-direction specs remain —
  they still describe the live mechanic and direction.

- **2026-07-07 — Scroll-scrub smoothing moved to real springs + new hero film (user-directed
  brief).** Both scroll-scrubbed scenes (hero + finale) replaced their hand-rolled rAF lerp
  loops (`delta × 0.2` / `× 0.14` per frame — frame-rate dependent, so the glide tail nearly
  vanished on 120 Hz displays, and no velocity state, so motion froze the instant scroll
  stopped) with **framer-motion springs**: scroll handlers now only set raw targets on
  `useMotionValue`s, and `useSpring` (shared `GLIDE_SPRING` in `src/components/scrollGlide.ts`:
  stiffness 50, damping 18, mass 0.9, restDelta 0.0008 — deliberately overdamped, ζ ≈ 1.3, so
  the scrubbed film never overshoots and plays backwards) drives the CSS vars (`--p`/`--fp`)
  and film seeks; visuals keep gliding a few hundred ms after scroll stops. The whole-frame
  seek throttle (`FRAME = 1/24`, skip while `video.seeking`) and the finale's dual
  pinned/in-flow measure logic are unchanged; springs `jump()` to the restored scroll position
  on mount so a mid-page reload doesn't replay the film. Dev-only `debugGlide` telemetry
  (`[glide:hero|finale] raw= smooth=`, tree-shaken from prod via `import.meta.env.DEV`) remains
  for tuning. Verified in-browser at full frame rate: after an instant scroll jump, raw froze
  while `--p` eased 0 → 0.53 over ~1.2 s and hero film `currentTime` tracked it (0 → 5.4 s);
  finale verified in both pinned (settled at 0.2003 target, glided 0.20 → 0.91 after jump) and
  in-flow modes. Same session: **hero film replaced** with the user's
  `astronaut-video-clean-zoomcrop.mp4` (1080p/24fps/8.04 s, same shape as before) — all four
  assets regenerated per the README recipe (all-intra `-g 1` scrub 5.5 MB, 720p sm 2.9 MB,
  start/poster stills; source kept as `astronaut-video.mp4`); the new film ends on a centered
  frame-filling helmet, which the visor-HUD brackets and right-side identity panel frame
  cleanly (screenshot-verified). Lint + build green.

- **2026-07-07 — Ask Fredrik chat console polish + Contact anchor lands on the played-out
  finale (user-directed brief, branch `ask-fredrik-guard-uptime`).** The chat widget was
  refined into one coherent dark-glass console (styling + small state only; API/data
  untouched): loose suggestion bubbles became a labelled **"Suggested prompts" tray**
  (hairline-topped, 2-column grid on desktop, one horizontal swipe row ≤560px so the input
  stays in thumb reach), the user message bubble went from bright white to **charcoal glass**
  (`--accent-wash` + `--line`, 14px/5px radii matching the assistant bubble), the transcript
  got scroll-aware **top/bottom gradient fades** (classes toggled from real scroll state, so
  nothing fades when there's nothing beyond an edge), the typing indicator now reads
  **"Thinking ···"** in mono, panel widened 400→420px, input gained a soft focus ring, and
  the disclosure shrank to 0.62rem. Separately, **anchors into pinned-reveal sections land
  settled**: `useAnchorGlide` now checks `data-pinned-reveal` (set on the finale section) and,
  when the pin runway is active (same `runway > 0.5·vh` test as the component's `measure()`),
  glides to `runway × 0.92` — past the last phase ramp (0.88) but short of unpinning — instead
  of the runway top, where `--fp ≈ 0.07` showed the un-revealed scene ("Contact showed the
  section before the second hero loaded"). In-flow mode and all other anchors are unaffected
  (regression-probed: Career lands at nav offset 68px). Verified in-browser at 1111×1107
  (this session's Chrome loaded video fine and allowed resize — the earlier session's
  browser limits were environmental, not permanent): landing `--fp` measured 0.9197 with the
  lit settled composition, chat verified at desktop + 520px widths, Enter-send/Escape-close/
  fade toggling exercised. Lint + build green.

- **2026-07-07 — Finale phase choreography: staged cinematic ending driven by one smoothed
  progress variable (user-directed brief).** The finale's text no longer uses framer-motion
  `whileInView` — the component's rAF lerp loop (glide factor 0.14; scroll moves the target,
  the shown value keeps easing after scroll stops) now publishes smoothed progress as `--fp`
  on `.finale`, and `finale.css` derives per-element phase windows from it (the hero's
  `--p`/`--t` convention): eyebrow 0.02–0.16 → headline 0.10–0.30 → body 0.18–0.38 → roles
  0.26–0.44 → film scrub 0.18–0.78 (media fades in 0.06–0.30 while its frames are still
  black, so text lands before the visual brightens) → CTAs 0.60–0.75 → note/repo → held lit
  composition 0.88–1.0. Runway trimmed 230vh → 200vh (the brief's 120–160vh ignored sticky
  mechanics — it would leave only 60vh of animated runway). DOM order flipped to
  panel-then-media: phones now get **content first, film band beneath** (film progress there
  is measured from the media band's own viewport travel, separate smoothed track from the
  text's section travel); desktop columns rebalanced (1fr/0.95fr), film hung slightly low +
  left-edge scrim toward the text column. `--fp` unset defaults every ramp to 1, so
  reduced-motion / video-failure / no-JS all render the settled scene; new
  `.finale-panel:focus-within` snap makes keyboard focus force the panel visible (links are
  focusable while faded). Verified in-browser at the automation window's locked 500×750
  (in-flow phases, glide settling, focus snap, settled default); the film itself and pinned
  desktop mode were **not** visually verifiable there — this Chrome never loads `<video>`
  (confirmed identical on the unchanged live site → environmental) and refuses resize; the
  scrub math is the unchanged previously-verified path. Lint + build green. Spec:
  `docs/superpowers/specs/2026-07-07-finale-phase-choreography-design.md`.

- **2026-07-07 — Prompt-leak guard, uptime checks, TODO cleanup (branch
  `ask-fredrik-guard-uptime`).** The guarded Workers AI call now discards any answer that
  echoes the system prompt / serialized KB (`containsPromptLeak` markers: section headers,
  bracketed confidence tags, rule sentences) and serves the curated fallback instead — a
  data-invariant test also forces every curated `allowedAnswer` to pass the guard (it
  immediately caught "system prompt" inside the Workers AI skill answer; reworded).
  `uptime.yml` pings the live site + Worker health endpoint every 6 h (workflow failure =
  GitHub email). CLAUDE.md/AGENTS.md stale go-live TODOs replaced with the real open items
  (OG preview validation, WAF rate rule, Web Analytics — the latter two are dashboard-side).
  332 tests green.

- **2026-07-06 — Ask Fredrik hardening (branch `ask-fredrik-hardening`).** CI workflow
  `worker-tests.yml` runs `npm run check` + `npm test` on any change under
  `cloudflare/ask-fredrik-worker/` (deploys stay manual); sensitive filter extended with
  personal-attribute/beliefs/health keywords after a real logged question ("whats
  fredrik's height?") reached the model — phrased to avoid false positives (no bare
  "weight"/"health"/"race"), with tests asserting "lightweight frameworks", "healthcare
  industry", and "race conditions" questions stay unblocked (289 checks).

- **2026-07-06 — Ask Fredrik v5: curated public-safe knowledge base (branch
  `ask-fredrik-knowledge-v5`, user-directed brief).** The Worker can now answer
  confidently about approved skills/projects (e.g. Tailscale) instead of deflecting to
  the résumé. New typed data modules in `cloudflare/ask-fredrik-worker/src/data/`:
  `fredrik-skills.ts` (~24 skills with aliases + honest confidence levels
  professional/project/personal/learning + exact `allowedAnswer`), `fredrik-projects.ts`
  (public + private-at-concept-level projects with explicit `boundaries`;
  Homebase/AFR Gateway/Second Brain never expose private data), `fredrik-qa.ts` (curated
  intents, + `production_support`). Pipeline unchanged (rate limit → sensitive → curated
  → AI → fallback); stage 3 is now `resolveLocalAnswer()`: curated exact → skill/project
  alias match (longest wins, logged as `skill:tailscale` / `project:homebase`) → curated
  keywords → **deterministic not-confirmed answer** for "experience with X?" questions
  about unlisted tech (never model-guessed, never hallucinated). AI system prompt is now
  `buildFredrikSystemPrompt()`: rules (only approved context, never infer/invent/reveal
  private info, confidence semantics) + compact line-based KB serialization. **Hard
  boundary: no second-brain/private-notes/RAG connection — static TypeScript only.**
  Zero-dependency tests (`npm test`, 281 checks, plain Node ≥22.18 type stripping — this
  required explicit `.ts` import extensions + `allowImportingTsExtensions`) exercise the
  exact production `resolveLocalAnswer()` + public-safety data invariants. Verified
  end-to-end via `dev:noai` curl. Frontend static fallback deliberately untouched (drift
  risk accepted since v4). Spec:
  `docs/superpowers/specs/2026-07-06-ask-fredrik-knowledge-base-design.md`.
  Same-branch follow-ups: Workers Logs observability enabled in `wrangler.jsonc`
  (dashboard invocation logs, ~3-day retention on Free), and **FIFO retention for the D1
  question log** — insert + trim in one transactional batch keeps the newest
  `ASK_FREDRIK_LOG_MAX_ROWS` rows (default 1000, "0" = keep forever); verified locally
  (cap 3, 6 inserts → newest 3 survive). D1 is the durable "what are users asking" record.

- **2026-07-06 — Finale now pins while scroll drives the reveal (same day, user feedback
  with screen recording).** The first scrub cut revealed the astronaut "in passing" — the
  section kept scrolling while the film lit, so the lit scene was only fully visible at the
  footer. Fix: on desktop viewports that fit the scene (`min-width: 880px` + `min-height:
720px`) the section is now a **230vh runway with a sticky inner** (the hero's pattern): text
  and film hold still on screen while scroll scrubs the light up (film completes at 80% of the
  runway, then a lit hold, then it unpins toward the footer). Phones and short windows keep
  the in-flow travel-based scrub; `measure()` auto-detects the active mode from the section's
  rendered height (runway > 0.5·vh → pinned formula), so the CSS media query is the single
  switch. `overflow: hidden` moved from the section to the sticky element (an overflow-hidden
  ancestor defeats `position: sticky`); the Ask Fredrik widget is `position: fixed` and
  unaffected. Verified by injecting the pinned rules in the automation window (which refused
  to resize to desktop): stickyTop stays 0 across the whole runway, film progress maps 0 →
  0 s / 0.5 → 5.0 s / 0.8 → 8.0 s then holds, and the sticky releases at runway end.
  Follow-up hardening (same day): `.af-panel` got `overscroll-behavior: contain` so wheel
  over the open chat's header/chips/input can't fall through and scrub the page (the log
  already contained; the panel's `overflow: hidden` makes it a scroll container, so contain
  applies). Verified open-at-finale: panel + log both computed `contain`, page scroll stays
  non-modal (scene scrubs behind the fixed panel by design).

- **2026-07-06 — Astronaut finale: scroll-scrubbed cinematic contact section (branch
  `ask-fredrik-v1`, user-directed brief; replaces the Contact Transmission glass panel).**
  _(The asset recipe in this historical entry was superseded on 2026-08-13 by the 4K-master
  pipeline documented in Important Decisions and README.)_
  Section 06 is now `src/components/AstronautFinale.tsx` + `src/styles/finale.css`
  (Contact.tsx deleted, its links/notes all preserved): an 8 s black-and-white **light-reveal
  film scrubbed by scroll, bookending the hero's signature mechanic** — as the section rises
  into view the astronaut is lit out of black frame-locked to the reader's pace (rAF-lerped
  seek, whole-frame deltas only, muted play→pause priming for mobile seek painting), holding
  the lit final frame once the section top reaches 18% of the viewport; scrolling back
  re-darkens it. **Deliberately no pinning** (unlike the hero) — the contact CTAs must stay
  directly reachable, so progress maps onto the section's viewport travel, not a scroll-jacked
  runway. Design evolution in one session: loop → play-once-and-hold → scroll-scrub (the loop
  snapped back to black every 8 s, and frame-stepping showed the subject drifts left→center
  through the reveal, breaking every fixed text-over-video placement). The film is therefore
  shown **whole (16:9, never cover-cropped)**: desktop = CTA column left + film right, bled to
  the right viewport edge via negative margin (`min(0px, calc((var(--wrap) - 100vw) / 2))`);
  mobile = full-width 16:9 band above the stacked content. Copy: eyebrow "Open to meaningful
  engineering work", headline "Let's build something precise, intelligent, and polished.",
  new product-sense body line + the existing roles line, buttons Contact Me (mailto) / View
  Résumé / GitHub / LinkedIn (all aria-labeled), email + résumé-mirror note + source-repo line
  kept. Lazy: `preload="metadata"` until an IntersectionObserver sees the section within two
  viewports (rootMargin 200%), then `auto` + prime; decorative only (`aria-hidden`, muted,
  `playsInline`, no controls, never play()ed for playback). Reduced-motion and `onError` both
  render the lit poster (`astronaut-finale-poster.jpg`, 59 KB) with all content static and
  visible. **Assets:** user-provided 720p source (`astronaut-final-version.mp4`, Desktop) →
  ffmpeg-static pipeline: `delogo` removed the KlingAI watermark (user has permission),
  `gradfun` deband, lanczos upscale to 1920×1080, light `unsharp`, crf 17 → source asset
  `astronaut-finale-1080p.mp4` (~3 MB); served files are **all-intra scrub re-encodes**
  (`-g 1`, like the hero's): `astronaut-finale-scrub.mp4` (1080p ~3.8 MB, ≥720 px) and
  `astronaut-finale-scrub-sm.mp4` (720p ~2.1 MB, phones); `useDesktopViewport` extracted to
  its own module (shared with the hero) to pick the encode. Exact commands in README
  ("Astronaut finale" section). Verified in Chrome at desktop + narrow widths: progress math
  exact (section top at 40% vh → p 0.732 → t 5.85 s), all-intra seek lands in ~9 ms, mid-reveal
  frame paints, sm encode selected below 720 px; the rAF lerp loop itself is the hero's
  production-proven code path (this session's automation window was occluded — Chrome doesn't
  fire rAF on hidden pages — so the loop was verified by driving its math directly). Lint +
  build green (~84.8 KB gz).

- **2026-07-06 - Resume and portfolio now name Codex / Claude Code as AI-assisted engineering tools.**
  The public one-page `public/resume.pdf` was regenerated from the sibling
  `../resume-project/resume-building/output/resume-onepage.html` after adding a compact
  AI-assisted delivery phrase and `Codex, Claude Code, AI-assisted code review/documentation`
  to the maintained resume package. The portfolio skills data and Ask Fredrik static answers now
  name the same tools. Guardrail: no AI/Claude efficiency percentages or unsupported productivity
  metrics were added.

- **2026-07-06 - Resume PDF links directly to the live portfolio.**
  The maintained resume package and regenerated `public/resume.pdf` include
  `eriksson008.github.io/professional-portfolio/` in the contact header as a clickable
  live portfolio link for recruiters. The Contact Transmission section still includes
  `Eriksson008/professional-portfolio` as a source-repo work-sample link beneath the resume note.

- **2026-07-06 — Ask Fredrik v4: Workers AI + Worker-side matcher + rate limiting (same
  branch `ask-fredrik-v1`, user-directed 14-point brief; still Cloudflare Free, not
  deployed).** `/ask` now answers through a five-stage pipeline — rate limit → sensitive
  filter → curated matcher → Workers AI → curated fallback — returning
  `{answer, source: ai|fallback|static|blocked|rate_limited, matchedIntent?}` (always
  HTTP 200; every stage logs to D1 with real `matched_intent`/`model`/`latency_ms`).
  The frontend's keyword matcher was **ported into the Worker** (10 intents:
  strengths, role_fit, strongest_projects, technical_stack, why_interview, leadership,
  ai_experience, cloud_experience, salesforce_experience, contact_resume) so suggested
  questions never cost AI usage; sensitive topics (salary/private/confidential/
  credentials) are blocked **before** the model; a per-isolate in-memory sliding window
  (10 req/60 s, keyed by sessionId + salted IP hash, raw IPs never stored) is basic
  abuse protection (WAF rate rule named as the hard upgrade). Workers AI is
  **off-by-default** (`ASK_FREDRIK_AI_ENABLED: "false"` var; model/timeout/max-tokens
  all vars with safe in-code defaults, default model `@cf/meta/llama-3.1-8b-instruct`);
  the AI call is timeout-raced, sends only the strict system prompt (approved context
  in `src/fredrik-context.ts`) + question, and any failure falls back gracefully — the
  Worker runs with **no AI binding at all** (verified). Gotcha caught at runtime: the
  Workers runtime forbids `crypto.randomUUID()` in global scope. Local dev without the
  registered workers.dev subdomain: `npm run dev:noai` (AI binding omitted). Spec:
  `docs/superpowers/specs/2026-07-06-ask-fredrik-workers-ai-design.md`.
- **2026-07-06 — Ask Fredrik v3: D1 question logging + admin endpoint (same branch
  `ask-fredrik-v1`, user-directed 10-point brief; Workers Free + D1 Free, no AI yet).**
  Every valid `POST /ask` question is logged to D1 table `ask_fredrik_logs`
  (`cloudflare/ask-fredrik-worker/schema.sql`) **off the response path** via
  `ctx.waitUntil` with a guarded try/catch — a D1 failure costs the log row, never the
  answer (verified by dropping the table live). Columns include question/answer/source,
  session_id/page from the widget, referrer/user-agent, `latency_ms`, plus
  `matched_intent`/`model` logged NULL until Workers AI lands (no migration needed then).
  **Raw IPs are never stored** — only SHA-256(`IP_HASH_SALT` secret + CF-Connecting-IP);
  salt missing → NULL. `GET /admin/logs` requires `Bearer ADMIN_TOKEN` (secret; unset →
  503 fail-closed), supports `?limit` 1–100 (default 100), newest-first, and sends **no
  CORS headers** so browser origins can never read it. All bindings/secrets optional in
  `Env` — the Worker answers with any subset configured. Local dev: placeholder
  database_id works (miniflare SQLite); secrets in `.dev.vars` (gitignored). Deploy needs
  `wrangler d1 create` + paste id + `wrangler secret put` ×2 (README walkthrough).
  Verified with curl probes: auth (401/503), limits (400s), CORS isolation, deterministic
  ip_hash, no-secrets degradation, drop-table resilience with captured `console.warn`.
  Spec: `docs/superpowers/specs/2026-07-06-ask-fredrik-d1-logging-design.md`.
- **2026-07-06 — Ask Fredrik v2 scaffold: Cloudflare Worker backend (same branch
  `ask-fredrik-v1`, user-directed 13-point brief; Workers Free, no keys, no paid services).**
  `cloudflare/ask-fredrik-worker/` is a **self-contained npm package** (own package.json /
  tsconfig / `wrangler.jsonc`, wrangler 4) so the Pages build never touches it; root eslint
  still lints it. `POST /ask` accepts `{question, sessionId?, page?}`, validates (required
  string, trimmed, non-empty, ≤500 chars) and returns `{answer, source: 'fallback'}` — one
  **deterministic answer composed from an approved-public-facts context object** (same rules
  as `fredrikContext.ts`); no AI call yet, but the seam + README carry the exact 3-step
  Workers-AI upgrade (free daily allocation). CORS allowlist: `https://eriksson008.github.io`
  exact + anchored `localhost`/`127.0.0.1` any-port patterns (suffix-spoof origins verified
  rejected); disallowed origins get no ACAO header. Frontend: `askFredrik()` now POSTs
  `{question, sessionId (one anonymous `crypto.randomUUID()` per page load), page}`;
  `deploy.yml` passes the repo Actions variable `VITE_ASK_FREDRIK_API_URL` into the build
  (unset → static answers, safe no-op). **Deliberately not enabled in the Pages build yet** —
  the static keyword answers beat the Worker's single fallback until Workers AI lands.
  Verified with curl probes (validation, methods, CORS) + headless-Chrome end-to-end (widget →
  wrangler dev → Worker answer rendered; Worker killed → silent static fallback, zero page
  errors). Spec: `docs/superpowers/specs/2026-07-06-ask-fredrik-worker-v2-design.md`.
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
  _feel_ — lerp-smoothed scroll, cursor-reactive 2.5D parallax, monospace decode-scramble on
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

**This repo no longer carries a `resources/` directory (removed 2026-07-27).** It held a
byte-identical duplicate of the private career material — three Year End Review PDFs, the pre-2024
résumé, `RESUME-METRICS.md`, `SKILLS-PROFILE.md`. Since this repository is **public**, the only
thing keeping those out of it was one `.gitignore` line, and a second copy doubled the exposure
surface for no benefit. The canonical copy now lives solely in the sibling **private** repo at
`../resume-project/resources/`; read it there and never copy a file back. History was verified
clean before removal — nothing under `resources/` was ever committed here. The `.gitignore` entry
remains as a backstop.

The site exposes only honest, defensible, public-safe content.

## Current Next Actions

- **Media follow-ups:** add a webm encode next to the mp4 for better compression
  (`ffmpeg -i astronaut-video.mp4 -c:v libvpx-vp9 -crf 38 -b:v 0 -an astronaut-video.webm`).
- Validate the live OG social preview and confirm the public résumé download link.
- Add the planned Cloudflare WAF rate-limiting rule for `/ask`; the Worker's in-memory limiter is
  best-effort per isolate.
- Consider Cloudflare Web Analytics if visitor-level insight is useful alongside the D1 question log.
- Keep the site coherent with the résumé whenever a shared fact changes.
- Keep tone conservative and enterprise-friendly; metrics git-verifiable only.

## Second Brain Sync

Matching note: `../second-brain/02-Projects/Professional-Portfolio/README.md`

Related: `../second-brain/02-Projects/Repository System.md` and the sibling `resume-project` repo
(canonical facts).

<!-- Moved out of AGENTS.md on 2026-08-19. AGENTS.md is read on every prompt and this is detail
     only some tasks need. Content is verbatim. -->

## TODO / open decisions

- [ ] **Validate the OG social preview** on the live site (LinkedIn Post Inspector / X card
  validator) and confirm the résumé download link.
- [ ] **Add the free Cloudflare WAF rate rule for `/ask`** (dashboard: zone → Security → WAF →
  Rate limiting rules) — hard quota protection; the Worker's in-memory limiter is per-isolate
  best-effort only.
### Done
- [x] **Light-appearance text contrast brought over the AA floor — 2026-08-14.** `--faint` and
  `--silver-2` were **the same colour** in the light palette (`#69717c`) and both measured
  **3.98**–4.48:1 depending on surface — under WCAG AA's 4.5:1 everywhere small text used them, and
  invisible without computing it. Both are now `#5f6772` (same hue, same R+8/R+19 channel offsets,
  only darker). The binding surface is `--ink-2` (`#e7e7e2`, the `.section-alt` band) where
  `.sheet-no` and `.sheet-eyebrow` sit: 4.61:1 there, 4.92–5.72:1 elsewhere. The **dark palette is
  untouched** and was already passing. Measured across all 80 small-text elements on the page in
  both appearances — worst case 4.61:1 light, 5.10:1 dark. `src/styles/contrast.test.ts` now
  computes every text token against every opaque surface token and fails under 4.5:1; it was
  confirmed to fail on the old value (`--faint on --black (light) is 4.48:1`) before being kept.
  A second test guards the grey scale's ordering, so a future contrast fix can't silently invert
  the hierarchy it belongs to.
- [x] **Ask Fredrik rebuilt as a mobile concierge sheet — 2026-08-14.** Below 720px the assistant is
  a full-viewport sheet sized from `window.visualViewport` (`--af-vh`/`--af-vt` via
  `useSheetViewport`), with the dock suspended and the page pinned while it is open; the horizontal
  suggestion carousel is replaced by four starter cards in a 2-column `auto-fit` grid **inside the
  scroll region**, which collapse into 2–3 contextual follow-ups (new `followUps` per curated topic)
  once the conversation starts. Phones no longer autofocus the composer. Assistant turns lose their
  card on mobile; auto-scroll follows only when the reader is already at the bottom, with a `↓`
  button otherwise. **Desktop keeps its shell — floating non-modal card, launcher pill, `Send` word,
  page still scrolls — and inherits the shared content model** (welcome state, starter grid,
  follow-ups, textarea composer, scroll policy), because the brief asked for those to be shared
  rather than forked. Only the shell is breakpoint-specific. **The shell breakpoint is now
  one query** — JS reads the same `(max-width: 719px)` the stylesheet uses, because `(min-width:
  720px)` and `(max-width: 719px)` disagree at fractional widths and that gave the desktop card the
  sheet's modal focus trap. **What makes the sheet modal is `inert` on every sibling of `.af-root`,
  not a hand-rolled trap** — prompt controls unmount themselves when used, dropping focus to
  `<body>` where a keydown-scoped trap cannot see it, and `inert` makes that unreachable-by-
  construction instead of a rule each future control has to remember. **Opening pushes one history
  entry (`#ask`), so Back and the iOS edge-swipe dismiss the sheet**; before this the site created no
  history entries at all (`useAnchorGlide` only ever `replaceState`s) and Back left the site.
  `/#ask` is a deep link, handled on load and on `hashchange`. A free-text
  question retires a curated topic only when that topic's own answer was shown, never on a bare
  keyword match the Worker then answered differently. The follow-the-conversation rule lives in
  `src/components/askScroll.ts` as a pure, tested function for the same reason `scrollGlide.ts`
  does. Backend, `/ask` contract, logging and admin untouched. **Confirmed by the user on a real
  iPhone** after deploy, closing the emulation blind spot this change was verified through. Spec:
  `docs/superpowers/specs/2026-08-14-ask-fredrik-mobile-concierge-design.md`; task packet:
  `tasks/2026-08-14-ask-fredrik-mobile-concierge.md`.
- [x] **Phone hero composition reversed, closing film moved above the closing text, desktop
  telemetry collision fixed, header brand simplified — 2026-08-13 (second pass).** The stacked phone hero
  from the entry below was reversed: the film fills the phone frame again and the identity rises on
  scroll (the 200svh runway, the 0.94 film end, the portrait pan and the dock clearance all stay).
  On phones the closing film band now sits **above** the "06 Open to meaningful…" text and no longer
  pins — it scrubs on its own travel through the viewport, so the contact actions are one screen of
  scroll away instead of two; tablets (720–879px) and short desktop windows keep the pinned runway
  below the text. Separately, `.hero-hud` and `.hero-content` had been converging as the window
  shortened (measured −5px at 1534×822): the readout now caps its anchor against the room the
  identity needs, leaving ≥860px-tall windows pixel-identical. The header's boxed `FE` lettering is
  gone: the name **is** the home link, with no emblem file in the repo (a monogram image was tried
  and removed at the user's direction). Spec amendment:
  `docs/superpowers/specs/2026-08-13-mobile-dock-and-hero-design.md`.
- [x] **Phone navigation moved to a bottom dock and the phone hero re-composed — 2026-08-13.**
  Below 720px the sticky header is replaced by a fixed icon dock (Home · Impact · Projects ·
  Skills · Career · Contact · Ask Fredrik) in the safe area, the floating Ask pill is hidden and
  the assistant is a dock destination sharing one state/panel, and the hero is stacked (film band
  on top, identity beneath, 200svh runway instead of 360svh). ≥720px is unchanged. Chrome geometry
  now comes from `--nav-h` / `--dock-space` in `tokens.css`. Spec:
  `docs/superpowers/specs/2026-08-13-mobile-dock-and-hero-design.md`.
- [x] **Cloudflare Web Analytics live on the portfolio — 2026-08-04.** Web Analytics site
  registered in the Cloudflare account for hostname `eriksson008.github.io`; the beacon is
  injected from `src/main.tsx` gated on `import.meta.env.PROD` (dev sessions never report;
  the beacon token is public by design). Reviewer-verified: the beacon finds its config via
  the `script[data-cf-beacon]` fallback when injected as a module script.
- [x] **Cloudflare Access setup completed + admin live on the Worker — 2026-07-23.** Access
  enabled on the production `workers.dev` URL (Domains → Restricted), app path-scoped to
  `/admin` (destination `ask-fredrik.eriksson-fredrik08.workers.dev/admin`), Allow
  policy = admin email via one-time PIN; `ACCESS_TEAM_DOMAIN`/`ACCESS_APP_AUD` filled,
  `ADMIN_ALLOWED_EMAILS` secret set, `ADMIN_TOKEN` deleted, `build:admin` + deploy done.
  Live-verified: `/ask` public with correct CORS, `/admin/*` 302s to Access, dashboard loads
  signed-in end-to-end. Gotcha for the future: `ACCESS_TEAM_DOMAIN` must include the
  `https://` scheme (it is compared to the JWT `iss` and used to build the JWKS URL) — the
  bare hostname fails closed with 401.
- [x] **Admin auth moved to Cloudflare Access — 2026-07-23.** Manual `ADMIN_TOKEN` paste
  retired: the Worker validates the Access JWT in-Worker (`src/access.ts`, WebCrypto, zero
  deps) against an email-allowlist secret, `GET /admin/me` added, and the admin dashboard now
  deploys as Worker static assets (`npm run build:admin`) instead of shipping in the Pages
  artifact. Loopback-only dev auth mode; 49 new worker tests. See
  `docs/ask-fredrik-dashboard.md` + the TODO above for the remaining dashboard-side config.
- [x] **Live on GitHub Pages — 2026-07-06.** Repo public, Pages source = GitHub Actions,
  `deploy.yml` publishes on every push to `main`; live-site verified (asset hashes, finale
  media range requests, Ask Fredrik Worker URL in the bundle). Live at
  https://eriksson008.github.io/professional-portfolio/.
- [x] **Ask Fredrik assistant live end-to-end — 2026-07-06/07.** Cloudflare Worker
  (`cloudflare/ask-fredrik-worker`) with curated public-safe knowledge base, sensitive filter,
  rate limiting, D1 FIFO logging, Workers AI + prompt-leak guard; CI (`worker-tests.yml`) and
  uptime checks (`uptime.yml`) in place.
- [x] **GitHub Pages deployment configured (user approved going public) — 2026-06-30.** Actions
  workflow `deploy.yml`; env-driven Vite base (`/professional-portfolio/` on Pages, `/`
  elsewhere); SEO/OpenGraph/JSON-LD metadata + `public/og-image.png`; typography/spacing polish.
- [x] Rebuilt as Vite + React + TypeScript and Dockerized (nginx, port 8790) — 2026-06-30.
- [x] Standardized to family port 8790 (was 8789, collided with our-story); added `BIND_ADDR`
  localhost-only default + `.env.example` — 2026-06-30.
- [x] GitHub handle `Eriksson008` in the header; `public/resume.pdf` in place — 2026-06-30.
