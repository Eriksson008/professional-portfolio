import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import { profile } from '../data/profile';
import { useSmoothProgress } from '../hooks/useSmoothProgress';
import { usePointer } from '../hooks/usePointer';
import { useVisualTier } from '../hooks/useVisualTier';
import { ConstellationMap } from './ConstellationMap';
import { ScrambleText } from './ScrambleText';
import { SafeVisual } from './SafeVisual';
import { CTA_AT, type NodeId } from '../data/constellation';
import type { HeroMotion } from '../webgl/types';

// three + R3F live in their own chunk, requested only when the tier allows it.
const WebGLBackdrop = lazy(() => import('../webgl/WebGLBackdrop'));

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function ConstellationHero() {
  const { ref, progress, interactive } = useSmoothProgress<HTMLElement>();
  const pointer = usePointer();
  const tier = useVisualTier();
  const [hovered, setHovered] = useState<NodeId | null>(null);
  const [glReady, setGlReady] = useState(false);
  const [glFailed, setGlFailed] = useState(false);
  const headingId = 'hero-name';

  // The WebGL scene reads motion through a ref — no state crosses into the
  // canvas per frame.
  const motionRef = useRef<HeroMotion>({ progress: 0, px: 0, py: 0 });
  useEffect(() => {
    motionRef.current = { progress, px: pointer.x, py: pointer.y };
  }, [progress, pointer]);

  const webgl = interactive && tier !== 'off' && !glFailed;

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

        {webgl && (
          <SafeVisual>
            <Suspense fallback={null}>
              <WebGLBackdrop
                motionRef={motionRef}
                tier={tier === 'lite' ? 'lite' : 'full'}
                onReady={() => setGlReady(true)}
                onFail={() => setGlFailed(true)}
              />
            </Suspense>
          </SafeVisual>
        )}

        <div className="c-field">
          <ConstellationMap
            p={p}
            interactive={interactive}
            hovered={hovered}
            onHover={setHovered}
            starsQuiet={webgl && glReady}
          />

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
