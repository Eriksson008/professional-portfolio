import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { profile } from '../data/profile';
import { useSmoothProgress } from '../hooks/useSmoothProgress';
import { usePointer } from '../hooks/usePointer';
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

/** Monospace decode-scramble: on `play`, glyphs settle into `text` once. */
const GLYPHS = '0123456789+#~<>/\\{}[]%';
function ScrambleText({ text, play }: { text: string; play: boolean }) {
  const [out, setOut] = useState(text);
  const done = useRef(false);
  useEffect(() => {
    if (!play) {
      // Always land on the final text when not playing — this also resolves a
      // scramble that was interrupted mid-flight (fast scroll past the focus window).
      setOut(text);
      return;
    }
    if (done.current) return;
    done.current = true;
    let frame = 0;
    const total = 16;
    const id = window.setInterval(() => {
      frame += 1;
      const revealCount = Math.floor((frame / total) * text.length);
      setOut(
        text
          .split('')
          .map((ch, i) =>
            i < revealCount || ch === ' ' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          )
          .join(''),
      );
      if (frame >= total) {
        window.clearInterval(id);
        setOut(text);
      }
    }, 28);
    return () => window.clearInterval(id);
  }, [play, text]);
  return <>{out}</>;
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

export function ConstellationHero() {
  const { ref, progress, interactive } = useSmoothProgress<HTMLElement>();
  const pointer = usePointer();
  const [hovered, setHovered] = useState<NodeId | null>(null);
  const headingId = 'hero-name';

  // Static mode (reduced-motion / no-JS): render the resolved map, everything visible.
  const p = interactive ? progress : 1;
  // Resolve the CTA (and the field-dimming scrim) a touch before the very end so the
  // final state — settled map + identity + CTA — holds for a beat instead of flashing
  // by only at the pin-release point.
  const ctaReveal = interactive ? clamp01((progress - CTA_AT) / (0.96 - CTA_AT)) : 1;
  const ctaLive = ctaReveal > 0.4;

  // The centred identity is the opening + closing bookend: full at the start, it
  // fades out so the constellation owns the middle, then returns with the CTA.
  const identityOpacity = interactive
    ? Math.max(1 - clamp01((progress - 0.08) / 0.08), ctaReveal)
    : 1;

  const sectionStyle = {
    '--scrim': ctaReveal,
    '--cta': ctaReveal,
    '--px': pointer.x,
    '--py': pointer.y,
  } as CSSProperties;

  const nodeHandlers = (id: NodeId) =>
    interactive
      ? { onMouseEnter: () => setHovered(id), onMouseLeave: () => setHovered(null) }
      : {};

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

          {interactive && <Edges p={progress} hovered={hovered} />}

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

          <div
            className={`c-identity ${ctaLive ? 'is-live' : ''}`}
            style={{ '--ido': identityOpacity } as CSSProperties}
          >
            <p className="c-eyebrow">Constellation of Impact</p>
            <h1 className="c-name" id={headingId}>
              <ScrambleText text={profile.name} play={interactive} />
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
          <div className={`c-cue ${progress > 0.02 ? 'is-hidden' : ''}`} aria-hidden="true">
            <span className="c-cue__label">Scroll</span>
            <span className="c-cue__line" />
          </div>
        )}
      </div>
    </section>
  );
}
