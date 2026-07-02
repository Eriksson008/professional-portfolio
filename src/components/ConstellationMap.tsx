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
} from '../data/constellation';

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function isActive(revealAt: number, p: number): boolean {
  return p >= revealAt && p < revealAt + FOCUS;
}

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

/** SVG connector layer. Coordinates are percentages of the field (viewBox 0..100). */
function Edges({ p, hovered }: { p: number; hovered: NodeId | null }) {
  return (
    <svg className="c-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {connections.map((c) => {
        const a = layout[c.from];
        const b = layout[c.to];
        const reveal = clamp01((p - c.revealAt) / FADE);
        const hot = hovered != null && (c.from === hovered || c.to === hovered);
        return (
          <line
            key={`${c.from}-${c.to}`}
            x1={a.x * 100}
            y1={a.y * 100}
            x2={b.x * 100}
            y2={b.y * 100}
            className={`c-edge ${isActive(c.revealAt, p) ? 'is-active' : ''} ${hot ? 'is-hover' : ''}`}
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
export function ConstellationMap({ p, interactive, hovered, onHover, starsQuiet }: ConstellationMapProps) {
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

      {interactive && <Edges p={p} hovered={hovered} />}

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
