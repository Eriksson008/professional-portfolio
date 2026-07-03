# Hero formation sequence — "Career Nebula / Marble Constellation" (2026-07-02)

User-directed hero pass (detailed 14-point brief supplied verbatim; this spec records the
decisions made inside that brief's degrees of freedom). Builds directly on the same-day
dark-only art direction (`2026-07-02-dark-only-art-direction-design.md`). Content, facts,
sections, nav, responsiveness, and GitHub Pages/static deployment are preserved exactly.

## Problem

The hero opens quiet: at scroll progress 0 the viewport shows only the name, role, starfield,
and (eventually) the WebGL particle shell. Nothing *happens* until the user scrolls, the CTAs
are invisible until ~88% of a 700vh scroll, and the constellation feels like a separate act
rather than something the hero's energy creates.

## Architecture decision

**Keep the pinned scroll-constellation** (700vh, `useSmoothProgress`) — it already delivers
the "particles gather → paths draw → nodes bloom → labels resolve → pulses → breathing"
sequence the brief asks for, in the approved palette. What's new is a **time-based formation
overture** layered on top of progress 0, plus a visual seam between the hero core and the
first constellation nodes. No new dependencies; WebGL-first via the existing lazy three/R3F
chunk; **WebGPU stays deliberately unused** (progressive-enhancement value ≈ 0 at this scene
complexity, and it would complicate the static Pages build).

## 1. Formation overture (~3s, runs once on mount)

Pure CSS animation timeline (fixed delays, `both` fill) — no JS orchestration beyond one
state flip that starts the name scramble in sync with its de-blur:

- 0.0–1.0s — atmosphere deepens in (backdrop fog + grid fade up from black-ish).
- 0.3–2.8s — three shooting-star trails cross the field, staggered (construction agents).
- 0.0–3.0s — WebGL dust gathers: the particle shell + orb ease from expanded/faint to
  settled (scale 1.35→1, opacity ramp inside the canvas; CSS orb fallback blooms in parallel).
- 1.0–2.1s — the name etches in: blur 10px→0, letter-spacing relaxes, opacity up, with the
  existing monospace decode-scramble firing inside that window ("etched into glass/light").
- 1.6–2.6s — role, tagline, CTAs resolve upward in cascade.

Reduced-motion and mobile (<600px) never run the overture (the static/spine paths bypass it).

## 2. ShootingStarField (new component — SVG + CSS, no library)

Four hand-authored curved cubic-Bezier trails (sparse, deliberate — no meteor spam). Each
trail = three stacked strokes on the same path, all driven by the same
`stroke-dashoffset` sweep (`pathLength="1"` normalization keeps the math unitless, and a
shared timeline keeps head and tail perfectly synced — no SMIL needed):

- wide, blurred, low-opacity **violet glow tail** (long dash),
- crisp 1px **silver-violet line** (medium dash),
- short bright **icy head** (tiny dash at the leading edge — the "light pulse").

Three trails play once during the overture; afterwards one long-period trail recurs every
~19s (mostly-idle keyframes) so the sky stays alive without becoming decoration. Hidden on
mobile and under reduced motion. Two trails hidden at tablet widths.

## 3. Hero core (central visual)

- **WebGL (tier full/lite):** new `CoreOrb` in the existing lazy chunk — a faint
  silver-violet **wireframe icosahedron** (glass/neural orb, slow twin-axis rotation) wrapped
  by a **tilted orbital dust ring** (Points on a torus band, counter-rotating), both behind
  the identity at low opacity, over the existing breathing violet CoreGlow. Formation ease-in
  over the first ~3s (scale + opacity), matching the overture. Lite tier halves ring count.
- **CSS fallback (`HeroCoreFallback`):** layered radial gradients + two 1px elliptical
  border "orbit rings" rotating very slowly, behind the identity. Always mounted; drops to a
  whisper (`is-quiet`) while the GL context is live — same pattern as the SVG starfield —
  so a lost context can never leave an empty center.
- It must never fight the text: everything sits behind `.c-identity`, opacity ≤ ~0.5.

## 4. Identity / CTA restructure (recruiter-first)

The tagline and both CTAs are now part of the opening identity — visible within ~2.6s of
load, not gated on 88% of a 700vh scroll. The scroll bookend is kept: the whole identity
(now including CTAs) fades out ~8–16% so the constellation owns the middle, and returns with
the settled map at the end. Buttons restyled premium: primary = violet fill with soft glow
shadow and brighter hover; ghost = slate glass + hairline + backdrop blur.

## 5. Hero → constellation seam

- New `core` layout point at the identity's center plus three **seed connections**
  (`core → m-commits / m-impact / m-green`) with `revealAt` 0.09–0.13 — as the identity
  fades, light veins grow *out of where the orb was* into the first metric nodes, then the
  existing graph takes over. Seed veins participate in the existing traveling-pulse system.
- `FOCUS` highlighting, pulses, bloom, and breathing stay as shipped in the art-direction
  pass (they already meet the brief's constellation requirements).

## 6. Small polish

- Nodes get a faint top-light linear-gradient sheen over the slate glass (marble surface).
- Mobile identity gets a soft static violet radial glow behind it (simplified hero core).
- Scroll cue unchanged.

## 7. Fallback matrix (unchanged guarantees, new layers slot in)

| Condition | Result |
| --- | --- |
| WebGL unavailable / crashes / context lost | CSS orb + SVG stars at full strength; overture + trails still play (pure CSS) |
| prefers-reduced-motion | Static resolved hero, no overture, no trails, no pulses (existing path) |
| <600px | Vertical spine + static orb glow behind identity; no trails |
| No JS | Static resolved hero (existing behavior) |

## 8. Out of scope / unchanged

Content data values, section order, nav, lower sections, Docker/nginx, Pages workflow,
bundle strategy (three stays in its own lazy chunk), fonts (Sora / IBM Plex).

## Files

New: `src/components/ShootingStarField.tsx`, `src/components/HeroCoreFallback.tsx`,
`src/webgl/CoreOrb.tsx`. Modified: `ConstellationHero.tsx`, `constellation.ts`,
`constellation-hero.css`, `WebGLBackdrop.tsx`, `ParticleField.tsx`.
