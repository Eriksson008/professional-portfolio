import { Suspense, lazy, useMemo, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { AstronautHero } from './AstronautHero';
import { AstronautHeroFrames } from './AstronautHeroFrames';
import { AstronautHeroVideo } from './AstronautHeroVideo';
import { HeroDevSwitcher } from './HeroDevSwitcher';
import { HeroShell } from './HeroShell';
import {
  effectiveHeroVariant,
  frameSequenceFor,
  parseEncodeKey,
  parseHeroVariant,
} from './heroVariant';

const POSTER_SRC = `${import.meta.env.BASE_URL}media/astronaut-hero-poster.jpg`;

/**
 * The 3D candidate is its own chunk. three + R3F is by far the largest cost in
 * these experiments (222 kB gzipped), and no visitor on any other variant may
 * pay it.
 */
const AstronautHeroInteractive = lazy(() => import('./AstronautHeroInteractive'));

/**
 * Shown while the 3D chunk loads: the settled poster, fully composed, holding
 * the runway's height so nothing shifts when the canvas arrives.
 *
 * Explicitly *not* the video hero — using that as the fallback would fetch an
 * MP4 on every 3D page load and make the comparison meaningless.
 */
function HeroPosterFallback() {
  const runwayRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  return (
    <HeroShell runwayRef={runwayRef} heroRef={heroRef} posterSrc={POSTER_SRC} scrub={false} settled />
  );
}

/**
 * Picks the hero implementation for the cinematic-media experiments.
 *
 * The variant is read once at mount, from the query string. Switching means a
 * reload, which is deliberate: swapping renderers live would leave the previous
 * one's assets and decoded frames in play and make any measurement meaningless.
 *
 * With no query parameter this renders the shipped `AstronautHero` unchanged,
 * so production behaviour is the default and the fallback for anything
 * unrecognised.
 */
export function HeroSwitch() {
  const reduced = useReducedMotion();
  const requested = useMemo(
    () => parseHeroVariant(typeof window === 'undefined' ? '' : window.location.search),
    []
  );
  const encode = useMemo(
    () => parseEncodeKey(typeof window === 'undefined' ? '' : window.location.search),
    []
  );

  // Reduced motion is decided here rather than inside each candidate, because
  // React.lazy starts fetching the chunk the moment the component renders —
  // before it can look at the preference and decline. Measured in experiment 1:
  // a reduced-motion visitor on ?hero=interactive was downloading 217 kB of
  // three for a scene that never mounted. AstronautHero with no scrub is the
  // cheapest polished fallback there is: the settled poster, no media request
  // of any kind, all content resolved. Any future expensive candidate must be
  // gated here for the same reason.
  const variant = effectiveHeroVariant(requested, Boolean(reduced));
  const sequence = frameSequenceFor(variant);

  return (
    <>
      {variant === 'video-current' && <AstronautHero />}
      {variant === 'video-optimized' && <AstronautHeroVideo encode={encode} />}
      {(variant === 'frames-97' || variant === 'frames-193') && sequence && (
        <AstronautHeroFrames sequence={sequence} />
      )}
      {variant === 'interactive' && (
        <Suspense fallback={<HeroPosterFallback />}>
          <AstronautHeroInteractive />
        </Suspense>
      )}
      {/* The switcher shows what was asked for, so a reduced-motion override is
          visible as such rather than looking like a broken toggle. */}
      <HeroDevSwitcher variant={requested} encode={encode} />
    </>
  );
}
