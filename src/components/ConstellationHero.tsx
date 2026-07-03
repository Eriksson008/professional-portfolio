import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import { profile } from '../data/profile';
import { useSmoothProgress } from '../hooks/useSmoothProgress';
import { usePointer } from '../hooks/usePointer';
import { useVisualTier } from '../hooks/useVisualTier';
import { ConstellationMap } from './ConstellationMap';
import { ScrambleText } from './ScrambleText';
import { SafeVisual } from './SafeVisual';
import { ShootingStarField } from './ShootingStarField';
import { HeroCoreFallback } from './HeroCoreFallback';
import { CTA_AT, type NodeId } from '../data/constellation';
import type { HeroMotion } from '../webgl/types';

// three + R3F live in their own chunk, requested only when the tier allows it.
const WebGLBackdrop = lazy(() => import('../webgl/WebGLBackdrop'));

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** When the name's blur-to-sharp etch starts in the CSS overture timeline. */
const ETCH_DELAY_MS = 1000;

export function ConstellationHero() {
  const { ref, progress, interactive } = useSmoothProgress<HTMLElement>();
  const pointer = usePointer();
  const tier = useVisualTier();
  const [hovered, setHovered] = useState<NodeId | null>(null);
  const [glLive, setGlLive] = useState(false);
  const headingId = 'hero-name';

  // Fire the decode-scramble in sync with the CSS etch reveal, so the glyphs
  // resolve while the name sharpens — etched into glass, not typed. The mobile
  // spine has no blur reveal to mask the scramble, so it keeps the name static.
  const [etch, setEtch] = useState(false);
  useEffect(() => {
    if (!interactive || window.matchMedia('(max-width: 600px)').matches) return;
    const id = window.setTimeout(() => setEtch(true), ETCH_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [interactive]);

  // The WebGL scene reads motion through a ref — no state crosses into the
  // canvas per frame.
  const motionRef = useRef<HeroMotion>({ progress: 0, px: 0, py: 0 });
  useEffect(() => {
    motionRef.current = { progress, px: pointer.x, py: pointer.y };
  }, [progress, pointer]);

  const webgl = interactive && tier !== 'off';

  // Static mode (reduced-motion / no-JS): render the resolved map, everything visible.
  const p = interactive ? progress : 1;
  // The field-dimming scrim resolves a touch before the very end so the final
  // state — settled map + identity — holds for a beat instead of flashing by
  // only at the pin-release point.
  const ctaReveal = interactive ? clamp01((progress - CTA_AT) / (0.96 - CTA_AT)) : 1;

  // The centred identity (name, role, tagline, CTAs — all live from the
  // overture) is the opening + closing bookend: full at the start, it fades
  // out so the constellation owns the middle, then returns with the settled map.
  // Fade completes by ~0.13, just before the seed veins reach full draw —
  // light never crosses readable text.
  const identityOpacity = interactive
    ? Math.max(1 - clamp01((progress - 0.06) / 0.07), ctaReveal)
    : 1;
  // While faded out, take it out of the accessibility/hit-testing tree so the
  // invisible CTAs can't be clicked mid-constellation.
  const identityHidden = interactive && identityOpacity < 0.04;

  const sectionStyle = {
    '--scrim': ctaReveal,
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
                onLive={setGlLive}
              />
            </Suspense>
          </SafeVisual>
        )}

        {interactive && <ShootingStarField />}

        <HeroCoreFallback quiet={webgl && glLive} />

        <div className="c-field">
          <ConstellationMap
            p={p}
            interactive={interactive}
            hovered={hovered}
            onHover={setHovered}
            starsQuiet={webgl && glLive}
          />

          <div
            className={`c-identity ${identityHidden ? 'is-hidden' : ''}`}
            style={{ '--ido': identityOpacity } as CSSProperties}
          >
            <p className="c-eyebrow">Constellation of Impact</p>
            <h1 className="c-name" id={headingId}>
              <ScrambleText text={profile.name} play={interactive && etch} />
            </h1>
            <p className="c-role">Senior Software Engineer · Acting Tech Lead</p>
            <div className="c-cta">
              <p className="c-tagline">
                Building AI-enabled enterprise systems, cloud platforms, and polished digital
                products.
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
