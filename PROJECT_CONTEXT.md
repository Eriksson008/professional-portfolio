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
  `premium.css` + `hero.css` + `finale.css` + `ask-fredrik.css`) — **dark-only** (no theme
  toggle) as of 2026-07-02, **pure black/white/glass** as of 2026-07-03
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
  + CSS removed. Lint + build green.
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
- **Ask Fredrik — go live:** (1) ~~create the production D1~~ **done 2026-07-06**
  (`ask-fredrik-db`, id `20967ca0-…`, region ENAM, schema applied `--remote` and
  verified); (2) ~~verify the Cloudflare account email~~ **done 2026-07-06**;
  (3) ~~set secrets~~ **done 2026-07-06** — `ADMIN_TOKEN` + `IP_HASH_SALT` uploaded to
  the (draft, not yet deployed) `ask-fredrik-worker`; the admin token value is with the
  user, only its hash lives at Cloudflare (rotate anytime with `wrangler secret put`);
  (4) ~~implement Workers AI + matcher + rate limiting~~ **done 2026-07-06 (v4)** —
  code-complete and runtime-verified except the live AI call itself;
  (5) ~~register the workers.dev subdomain~~ **done 2026-07-06** (user, Cloudflare dash);
  (6) ~~enable AI + deploy~~ **done 2026-07-06** — live at
  `https://ask-fredrik-worker.eriksson-fredrik08.workers.dev` with
  `ASK_FREDRIK_AI_ENABLED="true"`. First deploy surfaced two production-only fixes:
  the original default model was **deprecated by Cloudflare** (error 5028) → switched to
  `@cf/meta/llama-3.1-8b-instruct-fp8` (config var, no code change), and cold-start AI
  calls exceeded 6 s → `ASK_FREDRIK_AI_TIMEOUT_MS` raised to `"10000"` (warm calls run
  1.4–4 s). Verified in production: static/blocked/ai/fallback sources + model +
  latency all logged to D1, non-null `ip_hash` at the edge, admin auth, CORS preflight
  for the Pages origin, spoof origins rejected;
  (7) ~~set the repo Actions variable~~ **done 2026-07-06** — `VITE_ASK_FREDRIK_API_URL`
  = the Worker's `/ask` URL (via `gh variable set`); (8) ~~merge `ask-fredrik-v1` →
  `main`~~ **done 2026-07-06** — merged (one PROJECT_CONTEXT conflict, resolved by
  dropping main's duplicate entries) and deployed via the Pages workflow (run green).
  Live-site verified: new CSS hash served, all three finale media files answer range
  requests (206), and the deployed bundle contains both the finale scrub sources and
  the Worker URL — **Ask Fredrik and the astronaut finale are now live** at
  https://eriksson008.github.io/professional-portfolio/.
- Keep the site coherent with the résumé whenever a shared fact changes.
- Keep tone conservative and enterprise-friendly; metrics git-verifiable only.

## Second Brain Sync

Matching note: `../second-brain/02-Projects/Professional-Portfolio/README.md`

Related: `../second-brain/02-Projects/Repository System.md` and the sibling `resume-project` repo
(canonical facts).
