import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { AstronautHero } from './AstronautHero';
import { AstronautHeroFrames } from './AstronautHeroFrames';
import { AstronautHeroVideo } from './AstronautHeroVideo';
import { HeroDevSwitcher } from './HeroDevSwitcher';
import {
  effectiveHeroVariant,
  frameSequenceFor,
  parseEncodeKey,
  parseHeroVariant,
} from './heroVariant';

/**
 * Picks the hero implementation.
 *
 * The variant is read once at mount, from the query string. Switching means a
 * reload, which is deliberate: swapping renderers live would leave the previous
 * one's assets and decoded frames in play and make any measurement meaningless.
 *
 * With no query parameter this renders the shipped `AstronautHero` unchanged,
 * so production behaviour is the default and the fallback for anything
 * unrecognised. Every candidate here is a real, working alternative — none is
 * lazy-loaded, because none needs a chunk: the frame renderer is a few hundred
 * bytes of canvas code and the video renderer is a `<video>` element.
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

  // Reduced motion is resolved here rather than inside each candidate, so a
  // visitor who prefers less motion never pays for an alternative hero's
  // assets. Experiment 1 measured the failure mode this prevents: React.lazy
  // began fetching a 217 kB chunk before the component could read the
  // preference and decline. `AstronautHero` with no scrub is the cheapest
  // polished fallback there is — the settled poster, no media request of any
  // kind, all content resolved. Any future expensive candidate must be gated
  // here for the same reason; `EXPENSIVE_VARIANTS` is asserted in the tests.
  const variant = effectiveHeroVariant(requested, Boolean(reduced));
  const sequence = frameSequenceFor(variant);

  return (
    <>
      {variant === 'video-current' && <AstronautHero />}
      {variant === 'video-optimized' && <AstronautHeroVideo encode={encode} />}
      {variant === 'frames-97' && sequence && <AstronautHeroFrames sequence={sequence} />}
      {/* The switcher shows what was asked for, so a reduced-motion override is
          visible as such rather than looking like a broken toggle. */}
      <HeroDevSwitcher variant={requested} encode={encode} />
    </>
  );
}
