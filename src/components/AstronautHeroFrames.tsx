import { useCallback, useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { frameIndexForProgress } from './heroFrames';
import { nearestLoaded, useDecodeWindow, useHeroFrames } from './useHeroFrames';
import { useHeroRunway } from './useHeroRunway';
import { HeroShell } from './HeroShell';

const POSTER_SRC = `${import.meta.env.BASE_URL}media/astronaut-hero-poster.jpg`;
const START_SRC = `${import.meta.env.BASE_URL}media/astronaut-hero-start.jpg`;

/** Matches AstronautHero: the film ends here and the remainder is a hold. */
const FILM_END_DESKTOP = 0.78;
const FILM_END_PHONE = 0.94;

/** Uncapped DPR would render 9x the pixels on a 3x phone for no visible gain. */
const MAX_DPR = 2;

/**
 * Deterministic frame-sequence hero.
 *
 * The MP4 hero asks a video decoder to land on a frame via `currentTime`, which
 * is why it needs an all-intra encode, a seek-in-flight guard and a WebKit
 * playback prime. Drawing a pre-decoded still has none of those failure modes:
 * frame N is frame N, forward and backward, on every browser.
 *
 * `sequence` selects which generated sequence to read — the 97-frame and
 * 193-frame candidates are the *same component* with a different manifest, so
 * they differ in frame density and nothing else. That is what makes their
 * comparison meaningful.
 */
export function AstronautHeroFrames({ sequence }: { sequence: string }) {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastDrawn = useRef<HTMLImageElement | null>(null);
  const decodeAround = useDecodeWindow();

  const frames = useHeroFrames(sequence, !reduced);
  const scrub = !reduced && !frames.failed;

  // Held in a ref and read inside the paint callback: the sequence finishes
  // loading mid-scroll, and re-subscribing the scroll listener at that moment
  // would restart the spring under the reader.
  const framesRef = useRef(frames);
  framesRef.current = frames;

  const draw = useCallback(
    (progress: number) => {
      const canvas = canvasRef.current;
      const { images, tier, ready } = framesRef.current;
      if (!canvas || !ready || !tier || images.length === 0) return;

      const filmEnd = window.innerWidth >= 720 ? FILM_END_DESKTOP : FILM_END_PHONE;
      const index = frameIndexForProgress(progress, filmEnd, images.length);
      const image = nearestLoaded(images, index);
      if (!image || image === lastDrawn.current) return;
      lastDrawn.current = image;

      const context = canvas.getContext('2d');
      if (!context) return;

      // object-fit: cover, computed here because a canvas has no such property.
      const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);

      decodeAround(images, index);
    },
    [decodeAround]
  );

  const { runwayRef, heroRef, progress, settled } = useHeroRunway(scrub, draw, `frames:${sequence}`);

  // Size the backing store to the element, capped, and redraw after any resize.
  useEffect(() => {
    if (!scrub) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const width = Math.round(canvas.clientWidth * dpr);
      const height = Math.round(canvas.clientHeight * dpr);
      if (width === 0 || height === 0) return;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        lastDrawn.current = null; // resizing clears the surface; force a repaint
      }
      draw(progress.current);
    };

    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [scrub, draw, progress]);

  // Paint as soon as the opening window is in, and again once the tail has
  // landed so any frame drawn from a neighbour is replaced by the exact one.
  useEffect(() => {
    if (frames.ready) {
      lastDrawn.current = null;
      draw(progress.current);
    }
  }, [frames.ready, frames.complete, draw, progress]);

  return (
    <HeroShell
      runwayRef={runwayRef}
      heroRef={heroRef}
      posterSrc={scrub ? START_SRC : POSTER_SRC}
      scrub={scrub}
      settled={settled}
    >
      {scrub && (
        <canvas
          ref={canvasRef}
          className="hero-canvas"
          style={{ opacity: frames.ready ? 1 : 0 }}
        />
      )}
    </HeroShell>
  );
}
