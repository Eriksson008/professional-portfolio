import type { CSSProperties } from 'react';
import { ScrambleText } from './ScrambleText';
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
  type NodeId,
  type Pt,
} from '../data/constellation';

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function isActive(revealAt: number, p: number): boolean {
  return p >= revealAt && p < revealAt + FOCUS;
}

/** Inline CSS vars for a node: position (--x/--y), reveal amount (--o) driving
    the bloom (opacity + rise + scale + de-blur in CSS). */
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

const lerp = (a: Pt, b: Pt, t: number): Pt => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/** Cubic-Bezier control points bowing gently to alternating sides, so edges
    read as light veins rather than org-chart connectors. Deterministic per edge. */
function veinControls(a: Pt, b: Pt, i: number): [Pt, Pt] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const side = i % 2 === 0 ? 1 : -1;
  const bow = (0.14 + ((i * 7919) % 5) * 0.025) * len * side;
  const px = (-dy / len) * bow;
  const py = (dx / len) * bow;
  return [
    { x: a.x + dx * 0.3 + px, y: a.y + dy * 0.3 + py },
    { x: a.x + dx * 0.7 + px, y: a.y + dy * 0.7 + py },
  ];
}

/** First segment of the cubic split at t (De Casteljau) — draws the curve
    progressively without stroke-dashoffset, which misrenders in Chrome when
    combined with non-scaling-stroke (dashes computed in screen space). */
function partialCubic(a: Pt, c1: Pt, c2: Pt, b: Pt, t: number): [Pt, Pt, Pt] {
  const p01 = lerp(a, c1, t);
  const p12 = lerp(c1, c2, t);
  const p23 = lerp(c2, b, t);
  const p012 = lerp(p01, p12, t);
  const p123 = lerp(p12, p23, t);
  return [p01, p012, lerp(p012, p123, t)];
}

const pathD = (a: Pt, c1: Pt, c2: Pt, b: Pt): string =>
  `M ${(a.x * 100).toFixed(2)} ${(a.y * 100).toFixed(2)} C ${(c1.x * 100).toFixed(2)} ${(c1.y * 100).toFixed(2)}, ${(c2.x * 100).toFixed(2)} ${(c2.y * 100).toFixed(2)}, ${(b.x * 100).toFixed(2)} ${(b.y * 100).toFixed(2)}`;

/** Light-vein layer: curved paths draw in with the scroll, a soft glow breathes
    under each crisp line, and once a vein is complete a small light pulse
    travels it. Coordinates are percentages of the field (viewBox 0..100). */
function LightPaths({ p, hovered }: { p: number; hovered: NodeId | null }) {
  return (
    <svg className="c-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {connections.map((c, i) => {
        const a = layout[c.from];
        const b = layout[c.to];
        const reveal = clamp01((p - c.revealAt) / FADE);
        if (reveal === 0) return null;
        const [c1, c2] = veinControls(a, b, i);
        const [pc1, pc2, end] = partialCubic(a, c1, c2, b, reveal);
        const d = pathD(a, pc1, pc2, end);
        const hot = hovered != null && (c.from === hovered || c.to === hovered);
        return (
          <g key={`${c.from}-${c.to}`}>
            <path
              className="c-vein c-vein--glow"
              d={d}
              vectorEffect="non-scaling-stroke"
              style={{ animationDelay: `${((i % 5) * 1.4).toFixed(1)}s` }}
            />
            <path
              className={`c-vein ${isActive(c.revealAt, p) ? 'is-active' : ''} ${hot ? 'is-hover' : ''}`}
              d={d}
              vectorEffect="non-scaling-stroke"
            />
            {reveal === 1 && i % 2 === 0 && (
              <circle className="c-pulse" r="0.4">
                <animateMotion
                  dur={`${5 + (i % 4) * 1.5}s`}
                  begin={`${((i * 1.3) % 6).toFixed(1)}s`}
                  repeatCount="indefinite"
                  path={pathD(a, c1, c2, b)}
                />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}

interface ConstellationMapProps {
  /** Reveal progress 0..1 (1 in the static / reduced-motion path). */
  p: number;
  interactive: boolean;
  hovered: NodeId | null;
  onHover: (id: NodeId | null) => void;
  /** True while the WebGL field is live — the flat SVG stars step back. */
  starsQuiet?: boolean;
}

/**
 * The node field of the hero: SVG starfield + connector edges + the four
 * data-driven node groups (metrics, projects, skills, career). Pure DOM/SVG —
 * this is the information layer and the guaranteed fallback under the
 * optional WebGL backdrop.
 */
export function ConstellationMap({
  p,
  interactive,
  hovered,
  onHover,
  starsQuiet,
}: ConstellationMapProps) {
  const nodeHandlers = (id: NodeId) =>
    interactive ? { onMouseEnter: () => onHover(id), onMouseLeave: () => onHover(null) } : {};

  return (
    <>
      {interactive && (
        <svg
          className={`c-stars ${starsQuiet ? 'is-quiet' : ''}`}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {starfield.map((s, i) => (
            <circle key={i} cx={s.x * 100} cy={s.y * 100} r={s.r} />
          ))}
        </svg>
      )}

      {interactive && <LightPaths p={p} hovered={hovered} />}

      <ul className="c-group c-group--metric" aria-label="Impact in numbers">
        {metricNodes.map((n) => {
          const active = isActive(n.revealAt, p);
          return (
            <li
              key={n.id}
              className={`c-node c-node--metric ${active ? 'is-active' : ''}`}
              style={nodeStyle(n.id, n.revealAt, p)}
              {...nodeHandlers(n.id)}
            >
              <span className="c-metric__value">
                <ScrambleText text={n.value} play={interactive && active} />
              </span>
              <span className="c-metric__label">{n.label}</span>
            </li>
          );
        })}
      </ul>

      <ul className="c-group c-group--project" aria-label="Systems I’ve built">
        {projectNodes.map((n) => (
          <li
            key={n.id}
            className={`c-node c-node--project ${isActive(n.revealAt, p) ? 'is-active' : ''}`}
            style={nodeStyle(n.id, n.revealAt, p)}
            {...nodeHandlers(n.id)}
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
            {...nodeHandlers(n.id)}
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
            {...nodeHandlers(n.id)}
          >
            <span className="c-career__period">{n.period}</span>
            <span className="c-node__title">{n.title}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
