# Constellation of Impact — Hero Redesign

**Date:** 2026-07-01
**Branch:** `redesign-scroll-hero`
**Status:** Approved design → implementation

## Problem

The current hero (`ScrollHero` + `VaultScene`) leaned into a box/vault/orb "opening"
metaphor with buzzword-only text stages. It reads as a generic AI landing page, not a
senior software engineer's evidence-driven portfolio. We are pivoting the hero concept
while keeping all existing portfolio content, project sections, résumé credibility, and
deployment setup intact.

## Goal

A premium, scroll-driven **"Constellation of Impact"** hero that represents the
professional story as a connected constellation of measurable impact, real projects,
technical skills, and career progression.

Core message: **I build connected systems — AI-enabled tools, enterprise platforms, and
production-ready software with measurable impact.**

The hero must communicate: connected systems, measurable impact, technical depth, and
senior-engineer credibility — using real facts and numbers, never vague buzzwords.

## Palette

Black / white / red / silver. Gold removed from the primary theme.

- **Graphite/black** background (base `--ink`, near-black).
- **White / off-white** primary text (`--text`).
- **Silver / gray** inactive nodes, borders, edges, supporting text (new `--silver*` tokens).
- **Red** active nodes, pulses, connector highlights, focus, key emphasis (`--red*`).
- No cyberpunk / neon / gaming / flashy-luxury styling. Premium, technical, clean, readable.

## Scope

**In scope**
- Remove the vault/box/orb hero concept from the render path entirely.
- New reusable `ConstellationHero` component driven by data arrays.
- Accumulate-into-one-map scroll animation (see below).
- Responsive (desktop full constellation, tablet readable, mobile vertical timeline).
- `prefers-reduced-motion` / no-JS static resolved constellation.
- Keyboard-accessible CTAs, semantic HTML, visible focus.
- Light "recolor + polish" of the lower page for palette cohesion.
- Docs: README, PROJECT_CONTEXT, second-brain note. Lint/build. Commit + push.

**Out of scope**
- Rewriting portfolio content, project sections, résumé, or deployment.
- New animation libraries or other dependencies (clean React + CSS + SVG only).
- Backend/database/auth/external services.

## Architecture

### Files

**New**
- `src/components/ConstellationHero.tsx` — the hero component. Replaces `ScrollHero`
  in `App.tsx`.
- `src/data/constellation.ts` — single source of truth for hero data:
  `stages`, `metricNodes`, `projectNodes`, `skillClusters`, `careerNodes`, a normalized
  `layout` (0–1 x/y per node id), and `connections` (edges between node ids). Content is
  derived from the existing real data (`highlights.ts`, `projects.ts`, `skills.ts`,
  `profile.ts`, `experience.ts`); values are centralized here so they are easy to update.
- `src/styles/constellation-hero.css` — hero styles.

**Reused**
- `src/hooks/useScrollProgress.ts` — unchanged. Pinned tall section, rAF-throttled passive
  listeners, reports `interactive:false` under `prefers-reduced-motion`.

**Deleted (vault concept fully removed)**
- `src/components/ScrollHero.tsx`
- `src/components/VaultScene.tsx`
- `src/data/heroStages.ts`
- `src/data/heroSystems.ts`
- `src/styles/scroll-hero.css`

### Data shapes (`src/data/constellation.ts`)

```ts
type NodeKind = 'metric' | 'project' | 'skill' | 'career';

interface Pt { x: number; y: number }              // normalized 0..1 within the stage

interface MetricNode  { id; value; label; note?; revealAt }
interface ProjectNode { id; title; tags: string[]; revealAt }
interface SkillCluster{ id; name; items: string[]; revealAt }
interface CareerNode  { id; period; title; revealAt }

interface Connection  { from: string; to: string; revealAt } // node ids

const layout: Record<string, Pt>                    // id -> position (desktop/tablet)
const connections: Connection[]
```

- `revealAt` is a scroll-progress threshold (0..1). A node/edge animates in once
  `progress >= revealAt` and then **stays** (accumulate model).
- A moving **focus window** around the current progress lights nodes/edges red; nodes
  behind the window settle to silver but remain visible.

### Content (real facts only)

- **metricNodes** (from `highlights.ts` + `profile.ts`): `3 yrs Exceptional Impact`,
  `750+ commits`, `120+ Jira stories`, `6 repositories`, `#1 contributor`,
  `~16K lines / <5 wks`.
- **projectNodes** (from `projects.ts`): AI Client-Assist, Enterprise Salesforce Platform,
  Secure Client Onboarding Portal, This Portfolio, Homebase, AFR, Self-Hosting/Tailscale
  Lab — each with 2–3 real tech tags.
- **skillClusters** (from `skills.ts` / former `heroSystems`): Frontend, Backend, Cloud,
  Enterprise/Salesforce, DevOps, Leadership.
- **careerNodes** (from `experience.ts`): 2022 Associate SE → 2024 Senior SE → 2025 Acting
  Tech Lead → Enterprise AI / cloud systems.
- Every number is git-verifiable or directly documented. No invented/inflated figures.

## Scroll mechanic — accumulate into one map

Pinned full-viewport stage inside a **~700vh** tall section (tune 600–800vh). Progress
0→1 drives six phases; nodes accumulate and nothing disappears:

1. **Opening** — graphite field, faint CSS grid, seeded silver starfield scatter, name +
   title. No buzzword panels.
2. **Impact in numbers** — metric nodes fade/scale in (silver), red highlight rides the
   metric currently in focus.
3. **Systems I've built** — project nodes appear and their edges draw (SVG
   `stroke-dashoffset`) to related metrics/skills.
4. **Technical backbone** — skill clusters appear and wire into the larger map.
5. **Career progression** — career spine nodes appear (engineer → senior → tech lead →
   enterprise AI/cloud).
6. **Resolved state** — full map lit and settled; centered CTA card fades up:
   `Fredrik Eriksson` / "Senior Software Engineer building AI-enabled enterprise systems,
   cloud platforms, and polished digital products." / **View Projects** (`#projects`) +
   **Read Experience** (`#experience`).

**Pacing:** generous per-phase bands with hold beats so one wheel gesture cannot skip an
entire concept; gradual opacity/transform changes and crossfades, no abrupt hides. The
current hero's too-fast feel is fixed by the taller region + wider bands.

## Rendering

- **Background:** graphite (`--ink`), a faint CSS grid, and a static seeded scatter of
  small silver points. No imagery, no AI-generated background text/artifacts.
- **Nodes:** real DOM elements so text is sharp, selectable, accessible, and maintainable.
  - metric: large figure + label (+ optional note)
  - project: title + 2–3 tech tags
  - skill: cluster name + items
  - career: period + role
- **Connectors:** one `<svg>` layer behind the nodes; line endpoints computed from the
  normalized `layout` × current viewport size. Active edges red, settled edges silver.
- **Focus/pulse:** CSS transforms/opacity + small red pulse on the in-focus node; respects
  the accumulate model (no removal).
- **CTA:** real `<a>` buttons, keyboard focusable, visible focus ring, honoring existing
  button styles.

## Responsive

- **Desktop (>900px):** full 2D constellation, absolute-positioned nodes over the SVG edge
  layer, driven by normalized layout.
- **Tablet (600–900px):** same accumulate model, compressed/looser layout, fewer starfield
  points, larger readable text.
- **Mobile (<600px):** constellation flattens to a **vertical timeline/spine** — nodes
  stack top-to-bottom in phase order with a connecting vertical line + node dots, each
  revealing on scroll. No absolute positioning, no horizontal wiring.

## Reduced-motion / no-JS

`useScrollProgress` returns `interactive:false` under `prefers-reduced-motion`. In that
case render a **static resolved constellation**: the final CTA card plus all node groups
(metrics, projects, skills, career) shown fully visible as plain sections (essentially the
mobile vertical layout without scroll-driven animation). Everything is readable without
scroll; no aggressive animation.

## Lower-page cohesion (recolor + light polish)

- Add `--silver`, `--silver-2`, `--silver-line` (or similar) tokens to `tokens.css` for
  both themes.
- Shift remaining gold to red/off-white: Highlights metric figures (`app.css:566`) and any
  stray hero-final gold usages.
- Add subtle node-dot / hairline motifs to Highlights and Skills so they echo the
  constellation. Keep existing layouts and structure intact.
- Leave the rest of the token system and section markup unchanged.

## Accessibility

- Semantic HTML; hero labeled by the name heading (`aria-labelledby`).
- Decorative layers (`svg`, starfield, grid, pulses) `aria-hidden`.
- Visible keyboard focus on CTAs; both CTAs are anchor links to existing sections.
- Reduced-motion path is the accessible default described above.

## Performance (GitHub Pages)

- No new dependencies; no images. Pure DOM/CSS/SVG.
- Scroll work stays rAF-throttled via the existing hook; per-frame work is inline-style
  updates on a bounded node set (~20–25 nodes) — cheap.
- Static seeded starfield (no per-frame particle simulation).

## Verification

- `npm run lint` and `npm run build` pass.
- Manual: desktop scroll accumulate, tablet, mobile vertical, reduced-motion static,
  keyboard focus on CTAs, anchor links resolve.

## Docs & delivery

- Update `README.md` (constellation concept, where hero data lives, how to update
  metrics/projects/skills, how to test locally).
- Update `PROJECT_CONTEXT.md` (pivot decision, palette, implementation summary, next steps).
- Update `../second-brain/02-Projects/Professional-Portfolio/README.md` (pivot from
  vault → constellation, palette decision, summary, next steps).
- Commit with a clear message; push `redesign-scroll-hero`.
