# Dark-only art direction — "light veins in glass" (2026-07-02)

User-directed art-direction pass (detailed 12-point brief supplied verbatim; this spec records
the decisions made inside that brief's degrees of freedom). Content, sections, facts, nav,
responsiveness, and GitHub Pages/static deployment are preserved exactly.

## Goals

Premium, artistic, futuristic engineering showcase: a career constellation sculpted out of
light, glass, and data. Less hacker terminal / warning dashboard; more Apple / Linear /
igloo-inspired, but original. Dark-first and dark-only.

## 1. Theme system — removed

- One intentional dark theme. `useTheme.ts`, the nav sun/moon toggle, the `index.html` boot
  script, `:root[data-theme='light']` tokens, `.theme-toggle` CSS, and the theme-swap
  transitions are all deleted.
- `color-scheme: dark`, `<meta name="color-scheme" content="dark">`,
  `theme-color #0a0c12` fixed.

## 2. Palette (tokens.css)

| Role | Token | Value |
| --- | --- | --- |
| Obsidian base | `--ink` | `#0a0c12` |
| Charcoal step (alt sections) | `--ink-2` | `#0d1017` |
| Panel foundation (brief-mandated) | `--slate` | `#383e4e` |
| Glass panel | `--panel` | `rgba(56, 62, 78, 0.38)` (+ `--panel-2` at 0.55) |
| Text | `--text` | `#eceef4` |
| Muted / silver highlight (brief-mandated) | `--muted`, `--silver` | `#b6bac5` |
| Faint | `--faint` | `#7c8494` |
| Primary accent — soft violet | `--accent` | `#8f8af4` (bright `#a9a2ff`, deep `#6f66d6`) |
| Secondary glow — icy cyan | `--ice` | `#8fd9f2` |

- **Red is retired entirely** (the brief allows a tiny signature red "if truly useful" — it
  isn't; a single leftover red would read as an accident against the violet/cyan system).
- Brass/gold tokens deleted (already unused by the hero; favicon recolored).
- Old `--red*` names are replaced by `--accent*` across all stylesheets; `--silver` now equals
  `#b6bac5` per the brief.

## 3. Constellation — "light veins forming inside glass" (signature element)

- **Curved paths**: straight `<line>` edges become cubic Beziers with a deterministic
  perpendicular bow per edge (seeded by index, alternating side) — flowing veins, not an org
  chart. Draw-in uses **De Casteljau subdivision** (a partial-curve `d` for progress `t`),
  keeping the existing fix for Chrome's screen-space dash bug under `non-scaling-stroke`.
- **Two-layer stroke**: a wide, low-opacity violet glow path under a crisp 1px silver-violet
  line — glow without SVG filters (cheap).
- **Light pulses**: once an edge is fully drawn, a small additive dot travels it via SMIL
  `<animateMotion path=…>` with staggered `begin`/`dur` so only a few move at once.
- **Node bloom**: reveal now animates opacity + rise + `scale(0.9→1)` + `blur(6px→0)` and a
  soft violet halo — bloom, not pop.
- **Breathing**: when the map settles (CTA live), edges get a very slow opacity oscillation.
- Active/hover states: violet focus, icy-cyan hover. Labels keep current sizes/contrast.
- Mobile (<600px) stays the vertical spine; reduced-motion stays the static resolved map
  (no pulses, no bloom, everything visible) — unchanged behaviour, recolored.

## 4. Hero atmosphere / WebGL

- Existing lazy three + R3F particle shell is kept (architecture unchanged: `useVisualTier`
  gate, separate chunk, `SafeVisual` + context-loss fallback, WebGL-first / **no WebGPU**).
- Recolor: silver-lavender particles with a sparse violet fraction (was red); core glow
  becomes a violet breathing aura. `redFraction` prop renamed `tintFraction`.

## 5. Depth & polish

- Site-wide atmosphere on `body`: two ultra-faint radial fog fields (violet upper, cyan lower)
  plus the existing hero vignette; a fixed film-grain overlay (inline SVG turbulence, ~3%).
- Panels: slate glass (`--panel` alpha + `backdrop-filter: blur`), gradient hairline warming
  to violet at center.

## 6. Typography & hierarchy

- Families unchanged (Sora / IBM Plex Sans / IBM Plex Mono) — the brief asks for refinement,
  not replacement.
- Section titles: larger clamp, silver→white gradient sheen, tighter tracking. Eyebrows: wider
  tracking, faint silver. Metric figures: violet. Small labels bumped ≥0.75rem where they were
  0.68–0.72rem and low-contrast.

## 7. Out of scope / unchanged

- Content data modules, section order, nav, résumé/OG assets (og-image.png regenerated later
  if desired — content unchanged), Docker/nginx, Pages workflow, bundle strategy.
- Dead CSS from the retired title-block hero (`.hero*`, `.title-block`, `.tb-*`,
  `.status-dot`) is removed while re-theming app.css.
