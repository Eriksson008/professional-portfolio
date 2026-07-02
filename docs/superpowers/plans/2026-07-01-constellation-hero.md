# Constellation of Impact Hero — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the box/vault scroll hero with a premium, scroll-driven "Constellation of Impact" hero that accumulates real metric/project/skill/career nodes into one connected system map.

**Architecture:** A pinned full-viewport stage inside a ~700vh section. `useScrollProgress` yields 0→1; each node/edge has a `revealAt` threshold and animates in (silver) once passed, then **stays**. A moving focus window lights the current nodes/edges red. SVG connectors draw via `stroke-dashoffset`. Reduced-motion / mobile collapse to a static vertical layout via CSS custom properties (no JS branching on width).

**Tech Stack:** Vite + React 18 + TypeScript (strict), hand-written CSS with design tokens, SVG. No new dependencies.

## Global Constraints

- **No new dependencies.** Pure React + CSS + SVG. (Copied from spec.)
- **No test runner exists** in this repo. Per-task verification = `npm run lint` (clean) + `npm run build` (type-checks + builds, exit 0) + the manual browser check named in the task. Never claim a step passed without the command output.
- **Palette:** graphite/black bg, off-white text, silver inactive nodes/edges/supporting text, red active nodes/pulses/emphasis. Gold removed from primary theme. Use existing `--red*` tokens + new `--silver*` tokens.
- **Contrast:** off-white body ≥4.5:1; silver supporting ≥3:1; red never the *only* signal for active state (also scale + weight/pulse).
- **Real facts only** — every number git-verifiable/documented; no invented figures.
- **Content is data-driven.** All hero content lives in `src/data/constellation.ts`; components only map over it.
- **Accessibility:** semantic HTML, `aria-labelledby` on the hero, decorative layers `aria-hidden`, CTAs keyboard-focusable with visible focus, `prefers-reduced-motion` respected.
- **Base-url aware:** any asset URL uses `import.meta.env.BASE_URL` (not relevant here — no images — but keep the rule).
- Run commands from repo root `C:\Users\eriks\Repositories\professional-portfolio`.

---

### Task 1: Constellation data module

**Files:**
- Create: `src/data/constellation.ts`

**Interfaces:**
- Produces:
  - `type NodeId = string`
  - `interface Pt { x: number; y: number }`
  - `interface MetricNode { id: NodeId; value: string; label: string; revealAt: number }`
  - `interface ProjectNode { id: NodeId; title: string; tags: string[]; revealAt: number }`
  - `interface SkillCluster { id: NodeId; name: string; items: string[]; revealAt: number }`
  - `interface CareerNode { id: NodeId; period: string; title: string; revealAt: number }`
  - `interface Connection { from: NodeId; to: NodeId; revealAt: number }`
  - `interface Star { x: number; y: number; r: number }`
  - `const metricNodes: MetricNode[]`, `projectNodes: ProjectNode[]`, `skillClusters: SkillCluster[]`, `careerNodes: CareerNode[]`
  - `const connections: Connection[]`
  - `const layout: Record<NodeId, Pt>`
  - `const starfield: Star[]`
  - `const FADE = 0.05`, `FOCUS = 0.1`, `CTA_AT = 0.88`

- [ ] **Step 1: Create the data module**

```ts
// src/data/constellation.ts
//
// Single source of truth for the "Constellation of Impact" hero.
// All hero content + geometry lives here; ConstellationHero.tsx only maps over it.
// Every metric is git-verifiable or directly documented (see highlights.ts / profile.ts).
// Positions are normalized 0..1 within the stage field; the component maps them to %.

export type NodeId = string;

export interface Pt {
  x: number;
  y: number;
}

export interface MetricNode {
  id: NodeId;
  value: string;
  label: string;
  /** Scroll-progress threshold (0..1) at which this node reveals and then stays. */
  revealAt: number;
}

export interface ProjectNode {
  id: NodeId;
  title: string;
  tags: string[];
  revealAt: number;
}

export interface SkillCluster {
  id: NodeId;
  name: string;
  items: string[];
  revealAt: number;
}

export interface CareerNode {
  id: NodeId;
  period: string;
  title: string;
  revealAt: number;
}

export interface Connection {
  from: NodeId;
  to: NodeId;
  revealAt: number;
}

export interface Star {
  x: number;
  y: number;
  r: number;
}

/** Fade-in window (in progress units) for nodes and edges. */
export const FADE = 0.05;
/** How long a node/edge stays "active" (red) after it reveals. */
export const FOCUS = 0.1;
/** Progress at which the final identity/CTA resolves. */
export const CTA_AT = 0.88;

// Phase bands: metrics 0.14–0.26 · projects 0.30–0.46 · skills 0.50–0.66 · career 0.70–0.86.

export const metricNodes: MetricNode[] = [
  { id: 'm-impact', value: '3 yrs', label: 'Exceptional Impact', revealAt: 0.14 },
  { id: 'm-commits', value: '750+', label: 'Commits authored', revealAt: 0.17 },
  { id: 'm-jira', value: '120+', label: 'Jira stories delivered', revealAt: 0.2 },
  { id: 'm-repos', value: '6', label: 'Production repositories', revealAt: 0.23 },
  { id: 'm-top', value: '#1', label: 'Contributor on core systems', revealAt: 0.25 },
  { id: 'm-green', value: '~16K', label: 'Lines · greenfield · <5 wks', revealAt: 0.27 },
];

export const projectNodes: ProjectNode[] = [
  { id: 'p-onboard', title: 'Secure Onboarding Portal', tags: ['Java 21', 'React', 'Aurora'], revealAt: 0.31 },
  { id: 'p-ai', title: 'AI Client-Assist', tags: ['Spring AI', 'Bedrock', 'ECS'], revealAt: 0.34 },
  { id: 'p-sf', title: 'Enterprise Salesforce Platform', tags: ['Apex', 'LWC', 'Copado'], revealAt: 0.37 },
  { id: 'p-homebase', title: 'Homebase', tags: ['Docker', 'AES-256-GCM', 'SQLite'], revealAt: 0.4 },
  { id: 'p-afr', title: 'AFR — Members’ Hub', tags: ['Next.js', 'TypeScript', 'Tailwind'], revealAt: 0.42 },
  { id: 'p-portfolio', title: 'This Portfolio', tags: ['Vite', 'React', 'nginx'], revealAt: 0.44 },
  { id: 'p-lab', title: 'Self-Hosting / Tailscale Lab', tags: ['Docker', 'Tailscale', 'Linux'], revealAt: 0.46 },
];

export const skillClusters: SkillCluster[] = [
  { id: 's-frontend', name: 'Frontend', items: ['React', 'TypeScript', 'Next.js'], revealAt: 0.5 },
  { id: 's-backend', name: 'Backend', items: ['Java', 'Spring Boot', 'Spring AI'], revealAt: 0.53 },
  { id: 's-cloud', name: 'Cloud', items: ['AWS ECS', 'ALB', 'Bedrock', 'Aurora'], revealAt: 0.56 },
  { id: 's-enterprise', name: 'Enterprise', items: ['Salesforce', 'Apex', 'LWC', 'Copado'], revealAt: 0.59 },
  { id: 's-devops', name: 'DevOps', items: ['Jenkins', 'GitHub Actions', 'Docker'], revealAt: 0.62 },
  { id: 's-leadership', name: 'Leadership', items: ['Tech Lead', 'Mentorship', 'Delivery'], revealAt: 0.65 },
];

export const careerNodes: CareerNode[] = [
  { id: 'c-2022', period: '2022', title: 'Associate Software Engineer', revealAt: 0.7 },
  { id: 'c-2024', period: '2024', title: 'Senior Software Engineer', revealAt: 0.74 },
  { id: 'c-2025', period: '2025', title: 'Acting Tech Lead', revealAt: 0.78 },
  { id: 'c-ai', period: 'Now', title: 'Enterprise AI / cloud systems', revealAt: 0.82 },
];

// Normalized positions. Center band (y ~0.46–0.56) is kept clear for the identity/CTA.
export const layout: Record<NodeId, Pt> = {
  // metrics — top band
  'm-impact': { x: 0.16, y: 0.12 },
  'm-commits': { x: 0.38, y: 0.09 },
  'm-jira': { x: 0.62, y: 0.11 },
  'm-repos': { x: 0.84, y: 0.14 },
  'm-top': { x: 0.26, y: 0.24 },
  'm-green': { x: 0.74, y: 0.24 },
  // projects — upper-mid band
  'p-onboard': { x: 0.5, y: 0.31 },
  'p-ai': { x: 0.3, y: 0.36 },
  'p-sf': { x: 0.7, y: 0.36 },
  'p-homebase': { x: 0.14, y: 0.42 },
  'p-afr': { x: 0.86, y: 0.42 },
  'p-portfolio': { x: 0.38, y: 0.45 },
  'p-lab': { x: 0.62, y: 0.45 },
  // skills — lower-mid band
  's-devops': { x: 0.5, y: 0.58 },
  's-backend': { x: 0.3, y: 0.6 },
  's-cloud': { x: 0.7, y: 0.6 },
  's-frontend': { x: 0.14, y: 0.64 },
  's-enterprise': { x: 0.86, y: 0.64 },
  's-leadership': { x: 0.46, y: 0.66 },
  // career — bottom band, left→right progression
  'c-2022': { x: 0.18, y: 0.84 },
  'c-2024': { x: 0.4, y: 0.86 },
  'c-2025': { x: 0.62, y: 0.84 },
  'c-ai': { x: 0.84, y: 0.86 },
};

export const connections: Connection[] = [
  // metrics → projects
  { from: 'm-commits', to: 'p-ai', revealAt: 0.34 },
  { from: 'm-commits', to: 'p-sf', revealAt: 0.37 },
  { from: 'm-top', to: 'p-sf', revealAt: 0.38 },
  { from: 'm-green', to: 'p-onboard', revealAt: 0.32 },
  { from: 'm-repos', to: 'p-portfolio', revealAt: 0.44 },
  { from: 'm-impact', to: 'p-homebase', revealAt: 0.4 },
  // projects → skills
  { from: 'p-ai', to: 's-frontend', revealAt: 0.5 },
  { from: 'p-ai', to: 's-backend', revealAt: 0.53 },
  { from: 'p-ai', to: 's-cloud', revealAt: 0.56 },
  { from: 'p-sf', to: 's-enterprise', revealAt: 0.59 },
  { from: 'p-onboard', to: 's-backend', revealAt: 0.53 },
  { from: 'p-onboard', to: 's-cloud', revealAt: 0.56 },
  { from: 'p-homebase', to: 's-devops', revealAt: 0.62 },
  { from: 'p-afr', to: 's-frontend', revealAt: 0.5 },
  { from: 'p-lab', to: 's-devops', revealAt: 0.62 },
  // skills → career
  { from: 's-enterprise', to: 'c-2025', revealAt: 0.78 },
  { from: 's-leadership', to: 'c-2025', revealAt: 0.78 },
  { from: 's-backend', to: 'c-2024', revealAt: 0.74 },
  { from: 's-cloud', to: 'c-ai', revealAt: 0.82 },
  { from: 's-frontend', to: 'c-2022', revealAt: 0.7 },
  // career spine
  { from: 'c-2022', to: 'c-2024', revealAt: 0.74 },
  { from: 'c-2024', to: 'c-2025', revealAt: 0.78 },
  { from: 'c-2025', to: 'c-ai', revealAt: 0.82 },
];

// Deterministic starfield (seeded LCG) so it never shifts between renders.
function seededStars(count: number, seed: number): Star[] {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const out: Star[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push({ x: rand(), y: rand(), r: 0.6 + rand() * 1.1 });
  }
  return out;
}

export const starfield: Star[] = seededStars(52, 20260701);
```

- [ ] **Step 2: Type-check the module**

Run: `npm run build`
Expected: exit 0, no TypeScript errors. (The module isn't imported yet; this only confirms it compiles.)

- [ ] **Step 3: Commit**

```bash
git add src/data/constellation.ts
git commit -m "feat(hero): add constellation data module (metrics, projects, skills, career, layout)"
```

---

### Task 2: Silver palette tokens

**Files:**
- Modify: `src/styles/tokens.css` (add to `:root` block after the red tokens ~line 21, and to `:root[data-theme='light']` after its red tokens ~line 77)

**Interfaces:**
- Produces CSS custom properties: `--silver`, `--silver-2`, `--silver-line`, `--silver-wash` for both themes.

- [ ] **Step 1: Add silver tokens to the dark `:root`**

In `src/styles/tokens.css`, immediately after the `--on-red: #ffffff;` line inside `:root` (the dark block), add:

```css
  /* Silver — inactive nodes, edges, hairlines, supporting labels. */
  --silver: #b8c0cc;
  --silver-2: #8b95a3;
  --silver-line: rgba(184, 192, 204, 0.28);
  --silver-wash: rgba(184, 192, 204, 0.08);
```

- [ ] **Step 2: Add silver tokens to the light `:root[data-theme='light']`**

In the light block, immediately after its `--on-red: #ffffff;` line, add:

```css
  /* Silver — deepened for legibility on paper. */
  --silver: #6b7280;
  --silver-2: #8a929f;
  --silver-line: rgba(84, 92, 104, 0.26);
  --silver-wash: rgba(84, 92, 104, 0.06);
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/styles/tokens.css
git commit -m "feat(tokens): add silver palette tokens for both themes"
```

---

### Task 3: ConstellationHero component + styles; retire the vault hero

**Files:**
- Create: `src/components/ConstellationHero.tsx`
- Create: `src/styles/constellation-hero.css`
- Modify: `src/main.tsx` (swap the hero stylesheet import) — verify current import first
- Modify: `src/App.tsx` (swap `ScrollHero` → `ConstellationHero`)
- Delete: `src/components/ScrollHero.tsx`, `src/components/VaultScene.tsx`, `src/data/heroStages.ts`, `src/data/heroSystems.ts`, `src/styles/scroll-hero.css`

**Interfaces:**
- Consumes: everything exported from `src/data/constellation.ts` (Task 1); `profile` from `src/data/profile.ts`; `useScrollProgress` from `src/hooks/useScrollProgress.ts`.
- Produces: `export function ConstellationHero(): JSX.Element`.

- [ ] **Step 1: Confirm where the retired stylesheet is imported**

Run: `grep -rn "scroll-hero.css\|ScrollHero\|VaultScene\|heroStages\|heroSystems" src`
Expected: shows the import site of `scroll-hero.css` (likely `src/main.tsx`) and the `ScrollHero` usage in `src/App.tsx`. Note the exact line for `scroll-hero.css` — Step 5 replaces it.

- [ ] **Step 2: Write `src/components/ConstellationHero.tsx`**

```tsx
import { useState, type CSSProperties } from 'react';
import { profile } from '../data/profile';
import { useScrollProgress } from '../hooks/useScrollProgress';
import {
  metricNodes,
  projectNodes,
  skillClusters,
  careerNodes,
  connections,
  layout,
  starfield,
  FADE,
  FOCUS,
  CTA_AT,
  type NodeId,
} from '../data/constellation';

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Inline CSS vars for a node: position (--x/--y), reveal opacity (--o), lift (--ty). */
function nodeStyle(id: NodeId, revealAt: number, p: number): CSSProperties {
  const pt = layout[id];
  const reveal = clamp01((p - revealAt) / FADE);
  return {
    '--x': pt.x,
    '--y': pt.y,
    '--o': reveal,
    '--ty': `${((1 - reveal) * 14).toFixed(1)}px`,
  } as CSSProperties;
}

function isActive(revealAt: number, p: number): boolean {
  return p >= revealAt && p < revealAt + FOCUS;
}

/** SVG connector layer. Coordinates are percentages of the field (viewBox 0..100). */
function Edges({ p }: { p: number }) {
  return (
    <svg className="c-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {connections.map((c) => {
        const a = layout[c.from];
        const b = layout[c.to];
        const reveal = clamp01((p - c.revealAt) / FADE);
        return (
          <line
            key={`${c.from}-${c.to}`}
            x1={a.x * 100}
            y1={a.y * 100}
            x2={b.x * 100}
            y2={b.y * 100}
            className={`c-edge ${isActive(c.revealAt, p) ? 'is-active' : ''}`}
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100 * (1 - reveal)}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

export function ConstellationHero() {
  const { ref, progress, interactive } = useScrollProgress<HTMLElement>();
  const headingId = 'hero-name';

  // Static mode (reduced-motion / no-JS): render the resolved map, everything visible.
  const p = interactive ? progress : 1;
  const ctaReveal = interactive ? clamp01((progress - CTA_AT) / (1 - CTA_AT)) : 1;
  const ctaLive = ctaReveal > 0.4;

  const [cueGone] = useState(false);

  const sectionStyle = { '--scrim': ctaReveal, '--cta': ctaReveal } as CSSProperties;

  return (
    <section
      ref={ref}
      className={`c-hero ${interactive ? '' : 'c-hero--static'}`}
      id="top"
      aria-labelledby={headingId}
      style={sectionStyle}
    >
      <div className="c-pin">
        <div className="c-backdrop" aria-hidden="true" />
        <div className="c-field">
          {interactive && (
            <svg className="c-stars" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {starfield.map((s, i) => (
                <circle key={i} cx={s.x * 100} cy={s.y * 100} r={s.r} />
              ))}
            </svg>
          )}

          {interactive && <Edges p={progress} />}

          <ul className="c-group c-group--metric" aria-label="Impact in numbers">
            {metricNodes.map((n) => (
              <li
                key={n.id}
                className={`c-node c-node--metric ${isActive(n.revealAt, p) ? 'is-active' : ''}`}
                style={nodeStyle(n.id, n.revealAt, p)}
              >
                <span className="c-metric__value">{n.value}</span>
                <span className="c-metric__label">{n.label}</span>
              </li>
            ))}
          </ul>

          <ul className="c-group c-group--project" aria-label="Systems I’ve built">
            {projectNodes.map((n) => (
              <li
                key={n.id}
                className={`c-node c-node--project ${isActive(n.revealAt, p) ? 'is-active' : ''}`}
                style={nodeStyle(n.id, n.revealAt, p)}
              >
                <span className="c-node__title">{n.title}</span>
                <span className="c-node__tags">{n.tags.join(' · ')}</span>
              </li>
            ))}
          </ul>

          <ul className="c-group c-group--skill" aria-label="Technical backbone">
            {skillClusters.map((n) => (
              <li
                key={n.id}
                className={`c-node c-node--skill ${isActive(n.revealAt, p) ? 'is-active' : ''}`}
                style={nodeStyle(n.id, n.revealAt, p)}
              >
                <span className="c-node__title">{n.name}</span>
                <span className="c-node__tags">{n.items.join(' · ')}</span>
              </li>
            ))}
          </ul>

          <ul className="c-group c-group--career" aria-label="Career progression">
            {careerNodes.map((n) => (
              <li
                key={n.id}
                className={`c-node c-node--career ${isActive(n.revealAt, p) ? 'is-active' : ''}`}
                style={nodeStyle(n.id, n.revealAt, p)}
              >
                <span className="c-career__period">{n.period}</span>
                <span className="c-node__title">{n.title}</span>
              </li>
            ))}
          </ul>

          <div className={`c-identity ${ctaLive ? 'is-live' : ''}`}>
            <p className="c-eyebrow">Constellation of Impact</p>
            <h1 className="c-name" id={headingId}>
              {profile.name}
            </h1>
            <p className="c-role">Senior Software Engineer · Acting Tech Lead</p>
            <div className="c-cta">
              <p className="c-tagline">
                Building AI-enabled enterprise systems, cloud platforms, and polished digital products.
              </p>
              <div className="c-actions">
                <a className="c-btn c-btn--primary" href="#projects">
                  View Projects
                </a>
                <a className="c-btn c-btn--ghost" href="#experience">
                  Read Experience
                </a>
              </div>
            </div>
          </div>

          <div className="c-scrim" aria-hidden="true" />
        </div>

        {interactive && (
          <div className={`c-cue ${progress > 0.02 || cueGone ? 'is-hidden' : ''}`} aria-hidden="true">
            <span className="c-cue__label">Scroll</span>
            <span className="c-cue__line" />
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Write `src/styles/constellation-hero.css`**

```css
/* ============================================================
   Constellation of Impact hero.
   Desktop: pinned full-viewport field, absolutely-positioned
   nodes over an SVG edge layer, revealed by scroll progress.
   Mobile / reduced-motion: static vertical stack (Task 4 refines
   the small-screen layout; the static path is defined here).
   ============================================================ */

.c-hero {
  position: relative;
  height: 700vh; /* tall scroll region → slow, readable pacing */
  background: var(--ink);
}

.c-pin {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}

.c-backdrop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 90% at 50% 40%, rgba(255, 255, 255, 0.03), transparent 60%),
    var(--ink);
}
/* Faint technical grid. */
.c-backdrop::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--silver-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--silver-line) 1px, transparent 1px);
  background-size: 64px 64px;
  opacity: 0.1;
  mask-image: radial-gradient(120% 100% at 50% 50%, #000 40%, transparent 85%);
}

.c-field {
  position: absolute;
  inset: 0;
  margin: 0 auto;
  max-width: 1240px;
  width: 100%;
}

.c-stars circle {
  fill: var(--silver);
  opacity: 0.25;
}

/* ---- edges ---- */
.c-edges {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.c-edge {
  stroke: var(--silver-line);
  stroke-width: 1;
  transition: stroke 0.3s var(--ease);
}
.c-edge.is-active {
  stroke: var(--red);
  stroke-width: 1.5;
}

/* ---- node groups reset ---- */
.c-group {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* ---- nodes (desktop absolute layout) ---- */
.c-node {
  position: absolute;
  left: calc(var(--x) * 100%);
  top: calc(var(--y) * 100%);
  opacity: var(--o, 0);
  transform: translate(-50%, -50%) translateY(var(--ty, 0));
  transition:
    opacity 0.5s var(--ease),
    transform 0.5s var(--ease),
    border-color 0.3s var(--ease),
    color 0.3s var(--ease);
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.55rem 0.8rem;
  border: 1px solid var(--silver-line);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--panel) 82%, transparent);
  backdrop-filter: blur(2px);
  color: var(--silver);
  text-align: center;
  min-width: max-content;
  max-width: 220px;
  will-change: opacity, transform;
}
.c-node.is-active {
  border-color: var(--red);
  color: var(--text);
  box-shadow: 0 0 0 3px var(--red-wash);
}
.c-node.is-active::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  border: 1px solid var(--red);
  animation: c-pulse 1.6s var(--ease) infinite;
}
@keyframes c-pulse {
  0% { opacity: 0.7; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.15); }
}

.c-metric__value {
  font-family: var(--font-mono);
  font-feature-settings: 'tnum' 1; /* tabular figures — no shift */
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1;
}
.c-metric__label,
.c-node__tags,
.c-career__period {
  font-size: 0.72rem;
  color: var(--silver-2);
}
.c-node__title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text);
}
.c-node__tags {
  font-family: var(--font-mono);
  letter-spacing: 0.01em;
}
.c-career__period {
  font-family: var(--font-mono);
  color: var(--red);
}

/* ---- identity / CTA (center) ---- */
.c-identity {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  text-align: center;
  width: min(90%, 640px);
}
.c-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--red);
  margin: 0 0 0.6rem;
}
.c-name {
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 6vw, 3.6rem);
  font-weight: 700;
  line-height: 1.02;
  margin: 0;
  color: var(--text);
}
.c-role {
  font-size: 0.95rem;
  color: var(--silver);
  margin: 0.5rem 0 0;
}
.c-cta {
  opacity: var(--cta, 0);
  visibility: hidden;
  transition: opacity 0.5s var(--ease);
  margin-top: 1rem;
}
.c-identity.is-live .c-cta {
  visibility: visible;
}
.c-tagline {
  color: var(--muted);
  max-width: 46ch;
  margin: 0 auto 1.2rem;
  line-height: 1.5;
}
.c-actions {
  display: flex;
  gap: 0.8rem;
  justify-content: center;
  flex-wrap: wrap;
}
.c-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.7rem 1.4rem;
  border-radius: var(--radius);
  font-weight: 600;
  text-decoration: none;
  border: 1px solid transparent;
  transition: background 0.2s var(--ease), border-color 0.2s var(--ease), color 0.2s var(--ease);
}
.c-btn--primary {
  background: var(--red);
  color: var(--on-red);
  border-color: var(--red);
}
.c-btn--primary:hover {
  background: var(--red-bright);
  border-color: var(--red-bright);
}
.c-btn--ghost {
  color: var(--text);
  border-color: var(--silver-line);
}
.c-btn--ghost:hover {
  border-color: var(--silver);
}
.c-btn:focus-visible {
  outline: 2px solid var(--red-bright);
  outline-offset: 3px;
}

/* dim the field as the CTA resolves so identity reads clearly */
.c-scrim {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  background: radial-gradient(120% 90% at 50% 50%, rgba(11, 14, 19, 0.86), rgba(11, 14, 19, 0.5));
  opacity: var(--scrim, 0);
  transition: opacity 0.4s var(--ease);
}

/* ---- scroll cue ---- */
.c-cue {
  position: absolute;
  left: 50%;
  bottom: 2rem;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  color: var(--silver-2);
  transition: opacity 0.4s var(--ease);
}
.c-cue.is-hidden {
  opacity: 0;
}
.c-cue__label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.c-cue__line {
  width: 1px;
  height: 34px;
  background: linear-gradient(var(--silver), transparent);
}

/* ============================================================
   Static path (reduced-motion / no-JS): resolved vertical map.
   ============================================================ */
.c-hero--static {
  height: auto;
}
.c-hero--static .c-pin {
  position: static;
  height: auto;
  min-height: 100vh;
  padding: clamp(3rem, 8vh, 6rem) var(--gutter);
}
.c-hero--static .c-field {
  position: static;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.c-hero--static .c-edges,
.c-hero--static .c-stars,
.c-hero--static .c-scrim,
.c-hero--static .c-cue {
  display: none;
}
.c-hero--static .c-identity {
  position: static;
  transform: none;
  order: -1;
  margin-bottom: 1.5rem;
}
.c-hero--static .c-cta {
  opacity: 1;
  visibility: visible;
}
.c-hero--static .c-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  max-width: 900px;
}
.c-hero--static .c-node {
  position: static;
  transform: none;
  opacity: 1;
}
.c-hero--static .c-node.is-active::after {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  .c-node,
  .c-edge,
  .c-cta,
  .c-scrim {
    transition: none;
  }
  .c-node.is-active::after {
    animation: none;
  }
}
```

- [ ] **Step 4: Swap the hero in `src/App.tsx`**

Replace the import line:

```tsx
import { ScrollHero } from './components/ScrollHero';
```

with:

```tsx
import { ConstellationHero } from './components/ConstellationHero';
```

and in the JSX replace `<ScrollHero />` with `<ConstellationHero />`.

- [ ] **Step 5: Swap the stylesheet import**

At the `scroll-hero.css` import site found in Step 1 (e.g. `src/main.tsx`), replace:

```tsx
import './styles/scroll-hero.css';
```

with:

```tsx
import './styles/constellation-hero.css';
```

- [ ] **Step 6: Delete the retired vault files**

```bash
git rm src/components/ScrollHero.tsx src/components/VaultScene.tsx src/data/heroStages.ts src/data/heroSystems.ts src/styles/scroll-hero.css
```

- [ ] **Step 7: Verify no dangling references**

Run: `grep -rn "ScrollHero\|VaultScene\|heroStages\|heroSystems\|scroll-hero" src`
Expected: no matches.

- [ ] **Step 8: Lint + build**

Run: `npm run lint`
Expected: clean (no errors).
Run: `npm run build`
Expected: exit 0.

- [ ] **Step 9: Manual browser check**

Run: `npm run dev`, open http://localhost:8790.
Expected: dark field with name centered + faint grid/stars; scrolling slowly reveals metric nodes (silver), then project nodes with red connector lines drawing, then skills, then career spine; the current group highlights red; at the end the field dims and the tagline + two CTA buttons resolve centered. Tab to each CTA → visible focus ring; Enter jumps to `#projects` / `#experience`. Note any node overlaps for Step 10.

- [ ] **Step 10: Tune positions if needed**

If Step 9 shows overlapping nodes at 1440px or 1024px width, adjust the offending entries in `layout` (`src/data/constellation.ts`) only — small nudges to x/y. Re-run Step 9 until nodes are clearly separated. (Geometry is data; no component change needed.)

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(hero): replace vault hero with scroll-driven Constellation of Impact"
```

---

### Task 4: Responsive — tablet + mobile vertical constellation

**Files:**
- Modify: `src/styles/constellation-hero.css` (append media queries)

**Interfaces:**
- Consumes: the class structure from Task 3. No JS change.

- [ ] **Step 1: Append tablet + mobile rules to `constellation-hero.css`**

```css
/* ---- tablet: keep the map, compress + enlarge type ---- */
@media (max-width: 900px) {
  .c-field {
    max-width: 100%;
    padding: 0 1rem;
  }
  .c-node {
    max-width: 170px;
    padding: 0.45rem 0.6rem;
  }
  .c-metric__value {
    font-size: 1.25rem;
  }
  .c-node__title {
    font-size: 0.82rem;
  }
  .c-stars circle {
    opacity: 0.18;
  }
}

/* ---- mobile: flatten to a vertical spine, revealed on scroll ---- */
@media (max-width: 600px) {
  .c-hero {
    height: auto;
  }
  .c-pin {
    position: static;
    height: auto;
    min-height: 100vh;
    overflow: visible;
    padding: clamp(2.5rem, 8vh, 5rem) var(--gutter) 4rem;
  }
  .c-field {
    position: static;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.7rem;
    max-width: 460px;
    margin: 0 auto;
    padding: 0;
    border-left: 1px solid var(--silver-line);
    padding-left: 1.25rem;
  }
  .c-edges,
  .c-stars,
  .c-scrim,
  .c-cue {
    display: none;
  }
  .c-identity {
    position: static;
    transform: none;
    width: auto;
    order: -1;
    text-align: left;
    margin-bottom: 1.5rem;
    margin-left: -1.25rem;
  }
  .c-cta {
    opacity: 1;
    visibility: visible;
  }
  .c-actions {
    justify-content: flex-start;
  }
  .c-group {
    display: contents; /* children join the single vertical spine in DOM order */
  }
  .c-node {
    position: static;
    transform: translateY(var(--ty, 0));
    text-align: left;
    max-width: none;
    min-width: 0;
  }
  /* dot on the spine for each node */
  .c-node::before {
    content: '';
    position: absolute;
    left: -1.6rem;
    top: 1rem;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--silver);
    border: 1px solid var(--ink);
  }
  .c-node.is-active::before {
    background: var(--red);
  }
}
```

Note: on mobile `.c-group { display: contents }` drops the `<ul>` box so all `<li>` nodes lay out in the single flex column of `.c-field` in DOM order (metrics → projects → skills → career), each still driven by its scroll `--o`/`--ty`. The `::before` dot sits on the `.c-field` left border to form the spine. Nodes remain `position: static` so `::before`'s absolute anchor is the node itself.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 3: Manual responsive check**

With `npm run dev` running, open DevTools device toolbar. Check widths **1440**, **768**, **375**:
- 1440/768: constellation map, nodes separated, readable.
- 375: vertical spine with dots; identity + CTA at top-left; nodes reveal on scroll top→bottom; no horizontal scroll.

Also toggle **prefers-reduced-motion: reduce** (DevTools → Rendering) and reload: the hero shows the fully-resolved static stack (all nodes visible, CTA visible, no animation) at every width.

- [ ] **Step 4: Commit**

```bash
git add src/styles/constellation-hero.css
git commit -m "feat(hero): responsive tablet + mobile vertical constellation"
```

---

### Task 5: Lower-page recolor + light polish

**Files:**
- Modify: `src/styles/app.css` (the gold/`--brass` figure rule near line 565–566, plus small node/hairline touches on Highlights & Skills)

**Interfaces:**
- Consumes: `--red*` / `--silver*` tokens. No component/markup change unless a class is missing (check first).

- [ ] **Step 1: Find remaining gold usage**

Run: `grep -n "brass" src/styles/app.css`
Expected: at least the Highlights figure rule (~line 565–566: "The standout achievement figures are the one restrained gold moment…" → `color: var(--brass);`). Note every line returned.

- [ ] **Step 2: Recolor the Highlights figures to red**

Replace the Highlights figure block (the comment + `color: var(--brass);`) so the standout figures use red:

```css
  /* The standout achievement figures — red, matching the constellation accent. */
  color: var(--red);
```

For any *other* `--brass*` occurrences returned in Step 1, replace with the red equivalent: `--brass`→`--red`, `--brass-bright`→`--red-bright`, `--brass-line`→`--red-line`, `--brass-wash`→`--red-wash`. Do **not** touch the token definitions in `tokens.css` (leave the `--brass*` tokens defined but unused).

- [ ] **Step 3: Add a silver hairline/dot motif to Highlights + Skills**

Append to `src/styles/app.css` (adjust the leading selector names only if Step 1/inspection shows different class names for the Highlights stat card and Skills group — grep `class` usage in `src/components/Highlights.tsx` and `src/components/Skills.tsx` first if unsure):

```css
/* Constellation echo — subtle node dots + silver hairlines on the data sections. */
.highlight,
.skill-group {
  border-color: var(--silver-line);
}
.highlight::before {
  content: '';
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--red);
  margin-bottom: 0.75rem;
}
```

If the actual class names differ, use the ones found; the intent is: Highlights cards get a small red node dot, and both sections use `--silver-line` borders.

- [ ] **Step 4: Verify build + visual**

Run: `npm run build`
Expected: exit 0.
With `npm run dev`: scroll to Highlights — figures are red (no gold); each card shows a small red dot; Skills/Highlights borders read as silver hairlines. Confirm no gold remains anywhere below the hero.

- [ ] **Step 5: Commit**

```bash
git add src/styles/app.css
git commit -m "style: recolor lower page to red/silver, add constellation node motifs"
```

---

### Task 6: Docs, final verification, and push

**Files:**
- Modify: `README.md`
- Modify: `PROJECT_CONTEXT.md`
- Modify: `../second-brain/02-Projects/Professional-Portfolio/README.md`

**Interfaces:** none (documentation + delivery).

- [ ] **Step 1: Update `README.md`**

Add/replace the hero section so it documents the constellation. Include:
- Concept: scroll-driven "Constellation of Impact" — metrics, projects, skills, and career accumulate into one connected system map; red = active/focus, silver = settled.
- Where hero data lives: **`src/data/constellation.ts`** — edit `metricNodes`, `projectNodes`, `skillClusters`, `careerNodes` to change content; edit `layout` to reposition nodes; edit `connections` to change wiring. `revealAt` controls when each node/edge appears (0..1 scroll progress).
- Component/styles: `src/components/ConstellationHero.tsx`, `src/styles/constellation-hero.css`.
- Reduced-motion / mobile: static vertical map; no scroll-jacking.
- Test locally: `npm run dev` → http://localhost:8790; check 1440/768/375 and prefers-reduced-motion.

Remove any lingering mention of the vault/frame sequence hero from the README.

- [ ] **Step 2: Update `PROJECT_CONTEXT.md`**

Under "Important Decisions", add a dated entry (2026-07-01) recording the pivot: box/vault → Constellation of Impact; palette unified to black/white/red/silver (gold retired from primary theme, `--silver*` tokens added); data-driven hero in `src/data/constellation.ts`; reduced-motion/mobile static path; vault files removed. Update "Current Next Actions" if affected. Design spec: `docs/superpowers/specs/2026-07-01-constellation-hero-design.md`.

- [ ] **Step 3: Update the second-brain note**

In `../second-brain/02-Projects/Professional-Portfolio/README.md`, add an entry: pivot from box/vault concept to Constellation-of-Impact; palette decision (black/white/red/silver, gold removed from primary); implementation summary (`ConstellationHero` + `constellation.ts` data, SVG connectors, accumulate-on-scroll, reduced-motion/mobile vertical); next steps (visual position tuning, then merge to `main` for Pages deploy).

- [ ] **Step 4: Full verification pass**

Run: `npm run lint`
Expected: clean.
Run: `npm run build`
Expected: exit 0.
Run: `grep -rn "ScrollHero\|VaultScene\|heroStages\|heroSystems\|scroll-hero\|brass" src`
Expected: no matches in `src` (brass may remain only as unused token defs in `tokens.css`, which is acceptable — confirm the only `brass` hits are those definitions).

- [ ] **Step 5: Commit docs**

```bash
git add README.md PROJECT_CONTEXT.md
git commit -m "docs: document constellation hero (concept, data location, testing)"
```

Commit the second-brain repo separately:

```bash
git -C ../second-brain add 02-Projects/Professional-Portfolio/README.md
git -C ../second-brain commit -m "Professional Portfolio: pivot to Constellation of Impact hero"
```

- [ ] **Step 6: Show status for both repos**

```bash
git status
git -C ../second-brain status
```

- [ ] **Step 7: Push the branch**

```bash
git push -u origin redesign-scroll-hero
```

(Push `../second-brain` too if it tracks a remote and the user wants it pushed — confirm first.)

---

## Self-Review

**Spec coverage:**
- Remove vault/box/orb → Task 3 (delete files, swap render).
- New `ConstellationHero` + data arrays → Tasks 1, 3.
- SVG connectors, DOM nodes, real text → Task 3.
- Accumulate-into-one-map, slower ~700vh, gradual transitions → Task 3 (CSS height + reveal logic).
- Six-phase flow (name → metrics → projects → skills → career → CTA) → data `revealAt` bands (Task 1) + render (Task 3).
- Palette black/white/red/silver, gold removed → Tasks 2, 5.
- Responsive desktop/tablet/mobile → Tasks 3, 4.
- Reduced-motion/no-JS static → Task 3 (`c-hero--static`) + Task 4 verification.
- Keyboard-accessible CTAs, visible focus → Task 3 (`.c-btn:focus-visible`, anchor links).
- Lower-page recolor + polish → Task 5.
- README / PROJECT_CONTEXT / second-brain → Task 6.
- Lint/build, commit, push → every task + Task 6.
- GitHub Pages performance → no deps, no images, rAF-throttled hook, static starfield (Task 1 seeded), non-scaling SVG.

**Placeholder scan:** No TBD/TODO; all code blocks complete. Task 5 Steps 3 flags that class names must be confirmed against the actual Highlights/Skills markup before applying — this is a real verification instruction, not a placeholder.

**Type consistency:** `nodeStyle(id, revealAt, p)` and `isActive(revealAt, p)` signatures match all call sites; `p` (effective progress) used consistently; `NodeId`, `layout`, `FADE`, `FOCUS`, `CTA_AT` names match Task 1 exports; `ctaReveal`/`ctaLive`/`--cta`/`--scrim` consistent between component and CSS. `pathLength={100}` normalization matches `strokeDasharray={100}`/`strokeDashoffset`.

**Known follow-up (not a gap):** node coordinates in `layout` are a reasonable first pass; Task 3 Step 10 tunes them against the running app. This is intentional — geometry is data, tuned visually.
