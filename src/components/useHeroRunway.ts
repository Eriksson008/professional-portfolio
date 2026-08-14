import { type MutableRefObject, type RefObject, useEffect, useRef, useState } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import { useVideoMediaTier } from './useDesktopViewport';
import {
  GLIDE_SPRING,
  HERO_SPRING_DESKTOP,
  clamp01,
  createFrameScheduler,
  debugGlide,
} from './scrollGlide';

/**
 * The hero's scroll pipeline, extracted so every experimental implementation is
 * driven by exactly the same progress signal as the shipped MP4 hero.
 *
 * That equivalence is what makes the benchmark mean anything: if the candidates
 * differed in both their assets *and* their scroll maths, a difference in
 * smoothness could not be attributed to either. Scroll writes a raw target; the
 * spring (tighter on desktop, where a mouse wheel arrives in notches) is what
 * every visual reads; the sprung value is published as `--p` for hero.css and
 * handed to the implementation's own renderer.
 *
 * No React state is written per frame — `onRender` receives the progress and
 * paints imperatively.
 */
export interface HeroRunway {
  runwayRef: RefObject<HTMLElement>;
  heroRef: RefObject<HTMLDivElement>;
  /** Latest sprung progress, readable from inside an animation loop. */
  progress: MutableRefObject<number>;
  settled: boolean;
  desktop: boolean;
}

/** Scroll progress past which the scroll cue has done its job. */
const SETTLE_AT = 0.5;

export function useHeroRunway(
  active: boolean,
  onRender: (progress: number) => void,
  label = 'hero'
): HeroRunway {
  const mediaTier = useVideoMediaTier();
  const desktop = mediaTier !== 'small';
  const [settled, setSettled] = useState(false);

  const runwayRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);

  const raw = useMotionValue(0);
  const smooth = useSpring(raw, desktop ? HERO_SPRING_DESKTOP : GLIDE_SPRING);

  // Keep the latest callback without making it an effect dependency: the
  // renderer closes over frame data that changes as assets load, and
  // re-subscribing to scroll on every one of those would restart the spring.
  const render = useRef(onRender);
  render.current = onRender;

  useEffect(() => {
    if (!active) {
      setSettled(true);
      return;
    }
    const runway = runwayRef.current;
    const hero = heroRef.current;
    if (!runway || !hero) return;

    let lastP = '';

    const measure = () => {
      const rect = runway.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      raw.set(range > 0 ? clamp01(-rect.top / range) : 1);
    };

    const paint = () => {
      const shown = clamp01(smooth.get());
      progress.current = shown;
      // Skip the style write (and its recalc) when the change is invisible.
      const p = shown.toFixed(3);
      if (p !== lastP) {
        lastP = p;
        hero.style.setProperty('--p', p);
      }
      render.current(shown);
      if (shown >= SETTLE_AT) setSettled(true);
      debugGlide(label, raw.get(), shown);
    };

    // A reload mid-page restores the scroll position — start settled there
    // instead of springing through the whole film from frame one.
    measure();
    smooth.jump(raw.get());
    paint();

    const measureScheduler = createFrameScheduler(measure);
    const paintScheduler = createFrameScheduler(paint);
    const unsubscribe = smooth.on('change', paintScheduler.schedule);
    const onScroll = measureScheduler.schedule;

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      unsubscribe();
      measureScheduler.cancel();
      paintScheduler.cancel();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [active, label, raw, smooth]);

  return { runwayRef, heroRef, progress, settled, desktop };
}
