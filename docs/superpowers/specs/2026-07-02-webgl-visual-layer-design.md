# WebGL Visual Layer — Design Spec (2026-07-02)

## Goal

Elevate the existing "Constellation of Impact" portfolio into a cinematic, premium engineering
showcase by adding a restrained WebGL visual layer, polished scroll-based section transitions,
and reusable premium graphic components — **without changing career content, facts, or the
recruiter-friendly reading experience**, and without breaking GitHub Pages / Docker deployment.

## Stance: WebGL first, WebGPU not used

- **Primary advanced visual layer: WebGL via Three.js + React Three Fiber (R3F).**
- **WebGPU is deliberately not used.** Three's WebGPURenderer would complicate the build
  (separate entry, async init, larger chunk) for no visible gain at this scene complexity.
  This is recorded as a decision, not an omission. Revisit only if a future scene needs compute.
- The site must remain fully functional with **no WebGL, no JS-driven motion
  (prefers-reduced-motion), and on small/low-power devices** — the WebGL layer is purely
  additive atmosphere; every piece of information lives in DOM/SVG.

> Note: this supersedes the 2026-07-01 decision to keep the hero "pure React/CSS/SVG, no
> WebGL". That restraint was itself the design statement then; the user has explicitly
> redirected toward a WebGL-backed premium layer (2026-07-02). The DOM/SVG constellation
> remains the information layer and the fallback.

## Architecture

### 1. Capability tiers — `src/hooks/useVisualTier.ts`

One hook decides how much atmosphere a device gets. Returns `'full' | 'lite' | 'off'`:

- `off` when: `prefers-reduced-motion`, viewport `< 900px` (mobile/tablet keep the existing
  SVG starfield / vertical spine), WebGL context probe fails, or `navigator.connection.saveData`.
- `lite` when WebGL works but the device looks weak (`hardwareConcurrency < 4` or
  `deviceMemory < 4`): fewer particles, dpr capped at 1.
- `full` otherwise: full particle count, dpr capped at 1.75.
- The tier only becomes non-`off` **after first idle** (`requestIdleCallback`, `setTimeout`
  fallback) so the content paints before any 3D code is even requested.

### 2. WebGL layer — `src/webgl/`

- **`WebGLBackdrop.tsx`** (default export, loaded via `React.lazy` + dynamic import → its own
  Vite chunk with three/R3F; never in the main bundle). An R3F `<Canvas>` absolutely
  positioned behind the hero field: transparent, `antialias: false`, dpr from tier,
  `frameloop` switched to `never` when the hero is off-screen (IntersectionObserver).
- **`ParticleField.tsx`** — reusable 3D points cloud: ~1600 (full) / ~700 (lite) particles in a
  flattened spherical shell; silver-white with a sparse red fraction; additive blending; slow
  constant rotation; scroll progress drives a gentle camera drift; pointer drives a lerped
  parallax tilt. Round-sprite texture generated on a canvas at runtime (no image assets).
- **Core glow** — one large, soft radial red sprite at depth behind the identity block
  (canvas-generated radial gradient), breathing very slowly. Restrained: low opacity, reads as
  atmosphere, never competes with text.
- **Motion input**: `ConstellationHero` writes `{ progress, px, py }` into a mutable ref each
  frame; the scene reads it in `useFrame`. No React state crosses into the canvas per frame.
- **Safety**: wrapped in `<Suspense fallback={null}>` **and** a small error boundary
  (`SafeVisual`) — any load/context failure silently leaves the existing CSS grid backdrop +
  SVG starfield, which stay in the DOM as the guaranteed floor. The hero can never blank.

### 3. Hero integration

- Backdrop mounts inside `.c-pin`, behind `.c-field`, only when tier ≠ `off`.
- When the WebGL field is live, the flat SVG starfield hides (avoid double stars); it remains
  for `off` tier, mobile, reduced-motion, no-WebGL, and load-failure paths — i.e., current look.
- The DOM node map (metrics/projects/skills/career), edges, scramble, identity, CTA are
  unchanged — content and pacing stay as shipped.
- Code organization: extract the node-field rendering (stars/edges/groups) from
  `ConstellationHero.tsx` into `ConstellationMap.tsx` so the hero file stays an orchestrator.

### 4. Section transitions — Framer Motion (lazy features)

- `framer-motion` used through `LazyMotion` + `domAnimation` + `m.*` so only the small runtime
  lands in the main chunk.
- `Section.tsx`: `m.section` with `whileInView` (once): fade + 24px rise + subtle blur→sharp,
  custom ease matching `--ease`. Replaces the `useReveal` IntersectionObserver/CSS pair.
- `SectionHeader.tsx`: staggered children — sheet number fades, the rule line **draws**
  (scaleX 0→1), eyebrow/title/intro rise in sequence. Glow-activation on the sheet number dot.
- `useReducedMotion()` → everything renders visible immediately, no transforms (matches the
  existing `prefers-reduced-motion` CSS kill-switch).

### 5. Premium components + `src/styles/premium.css`

- **`GlowPanel`** — glass surface: token-mixed translucent panel, gradient hairline border,
  ultra-low-opacity SVG `feTurbulence` grain overlay (data URI, no assets), optional red edge
  glow on hover. Base for cards.
- **`SystemCard`** — the project card, rebuilt on GlowPanel with constellation corner-node
  motif and status header; same content/data as today (`projects.ts` untouched).
- **`MetricNode`** — highlight tile with node dot + pulse ring on first reveal, mono tabular
  value; same data (`highlights.ts` untouched).
- All colors/spacing come from existing tokens (`tokens.css`); both themes keep working.

## Fallback matrix

| Condition | Experience |
|---|---|
| Modern desktop, WebGL OK | Full: 3D particle field + core glow + DOM constellation + cinematic section reveals |
| Weak device (few cores / low memory) | Lite: fewer particles, dpr 1 |
| Viewport < 900px | No WebGL. Existing tablet map / mobile vertical spine, SVG stars |
| `prefers-reduced-motion` | Static resolved hero (existing path), no canvas, sections render visible, no scroll-dependent readability |
| WebGL unavailable / init throws / chunk fails to load | Error boundary swallows it; CSS grid + SVG starfield backdrop (current shipped look) |
| Data-saver connection | Treated as `off` — 3D chunk never requested |

## Performance budget

- Main JS chunk: no three/R3F; framer-motion via LazyMotion (~+20 KB gz). Target main chunk
  ≤ ~90 KB gz.
- three+R3F: separate lazy chunk (~170 KB gz), requested only on `full`/`lite` tier after idle.
- No postprocessing, no shadows, antialias off, dpr capped, rendering paused off-screen.
- No new image/font assets; all textures generated at runtime.

## Deployment

- Pure static output; no headers, no SSR, no secrets — GitHub Pages workflow and Docker/nginx
  unchanged. `VITE_BASE` behavior untouched (dynamic imports respect Vite base).

## Out of scope

- WebGPU renderer, postprocessing stacks (bloom etc.), physics, GSAP/Lenis, content changes,
  light-theme redesign (tokens already adapt), tests (static content site — unchanged policy).

## Verification plan

- `npm run format` / `lint` / `build` green; inspect `dist/` chunk split and sizes.
- In-browser at 1440 / 768 / 375: WebGL renders behind hero, text contrast intact, scroll
  pacing unchanged, no console errors; kill WebGL (devtools) → fallback identical to current
  site; reduced-motion → static hero, no canvas.
