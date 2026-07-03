# Scroll-Driven Cinematic Hero — Design

**Date:** 2026-07-01
**Branch:** `redesign-scroll-hero`
**Status:** Approved-by-default (user provided a detailed 21-step build brief and stepped away;
built with the recorded defaults below, flagged for review).

## Goal

Replace the landing-page hero with a premium, scroll-driven cinematic hero built on the existing
red/gold/black "system-vault" image sequence (`public/hero-sequence/`, 9 frames). As the user
scrolls, a matte black system vault opens, intelligent components rise, architecture connects, and
a polished dashboard assembles — ending on a clear title card.

**Core message:** _"I turn complex enterprise problems into intelligent, reliable software systems."_

## Key decisions (defaults chosen while user was away)

1. **Composition — full-bleed + gradient scrim.** Frames fill the viewport; a left-weighted black
   scrim dims the frames' _baked-in_ text so crisp HTML overlays carry all real content. The baked
   text in the PNGs is treated as reference only, never as real content.
2. **Replace the hero entirely.** The scroll hero's final stage carries name + tagline + the two
   CTAs (View Projects / Read Experience). The old "engineering title-block" `Hero` is retired.
3. **Optimize images to WebP.** 9 PNGs (~8.4 MB) are converted to WebP (~1–2 MB total) via a
   committed one-off script (`scripts/optimize-frames.mjs`, `sharp` as a devDependency). Only WebP
   ships in `public/`; PNG sources move to `assets/hero-sequence/` (not deployed).

## Architecture

- **`src/data/heroStages.ts`** — the 9 narrative stages (number, label, headline, accent word,
  optional sub-line, frame filename). Single source of truth for stage text.
- **`src/data/heroSystems.ts`** — the 6 professional-area cards (Frontend, Backend, Cloud,
  Enterprise, DevOps, Leadership) with their tool lists.
- **`src/hooks/useScrollProgress.ts`** — rAF-throttled hook returning scroll progress `0..1` for a
  pinned section, plus an `interactive` flag (false under `prefers-reduced-motion` / no matchMedia).
- **`src/components/ScrollHero.tsx`** — the hero. Renders:
  - A tall outer `<section id="top">` (height ≈ `N × 100vh`, shorter on mobile) whose inner
    `.sticky` viewport pins for the duration of the scroll.
  - Nine stacked frame layers, cross-faded by scroll progress (`opacity = 1 − |progress·(N−1) − i|`).
  - A gradient scrim for text contrast.
  - Per-stage HTML text overlays (headline + accent word), fading in/out with progress.
  - A system-cards cluster that fades in during the "building blocks / connected architecture" band.
  - A final overlay: name, tagline, two CTAs, and the ENGINEER / ARCHITECT / LEADER / PROBLEM-SOLVER
    role chips.
  - A thin scroll-progress rail + a "scroll" cue.
- **`src/styles/scroll-hero.css`** — hero-scoped styles + hero-scoped `--hero-red` accent (the rest
  of the token system is untouched). Imported from `main.tsx`.

## Behavior & fallbacks

- **Interactive (default):** pinned scroll narrative as above.
- **`prefers-reduced-motion` / no-JS:** no scroll-jacking. A static hero renders the destination
  directly — final frame poster + name/tagline/CTAs + the system-cards grid + role chips. All real
  text is in the DOM regardless of mode.
- **Responsive:** desktop gets the full experience; tablet keeps it with tuned `object-position`
  and card layout; mobile uses a shorter pinned scroll and single-column overlays. Works at iPhone
  widths.

## Accessibility

- Frames are decorative (`alt=""`, `aria-hidden` on the visual layer); all meaning lives in HTML.
- Real headings/text in the DOM; CTAs are real `<a>` links, keyboard-focusable, visible focus.
- Respects `prefers-reduced-motion` via the static fallback.

## Performance

- WebP frames (~1–2 MB total vs. ~8.4 MB). Frame 1 preloaded / `fetchpriority=high`.
- Fixed-height pinned viewport → no layout shift. Scroll handler is rAF-throttled and passive.
- No new runtime dependencies (`sharp` is dev-only, used once to generate frames).

## Out of scope

- No changes to sections below the hero beyond light visual-continuity tweaks.
- No backend, router, or content changes to résumé facts.
