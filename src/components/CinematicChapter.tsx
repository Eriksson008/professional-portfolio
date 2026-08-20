import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { framePositionForProgress, frameWindow } from './heroFrames';
import { drawBlendedFrame } from './frameCanvas';
import { useDecodeWindow, useHeroFrames } from './useHeroFrames';
import { useHeroRunway } from './useHeroRunway';
import { useNearViewport } from './useNearViewport';

/** Uncapped DPR would render 9x the pixels on a 3x phone for no visible gain. */
const MAX_DPR = 2;

export interface CinematicChapterProps {
  id: string;
  eyebrow: string;
  title: ReactNode;
  body?: ReactNode;
  /** Generated sequence name, matching a tracked `manifest.json`. */
  sequence: string;
  /** Shown under the canvas, and instead of it under reduced motion. */
  poster: string;
  /** Painted while the sequence streams, so the first screen is never empty. */
  start?: string;
  /** Where the film finishes; the rest of the runway holds on the last frame. */
  filmEnd?: number;
  label: string;
  /** Extra content below the copy — editorial metrics, for instance. */
  children?: ReactNode;
  /** Slightly warms the scrim for the ignition beats. Off by default. */
  tone?: 'cool' | 'ignition';
  /**
   * Fractional sub-range of the sequence to play, e.g. `[0, 0.68]`.
   * Used to split the person-reveal between this chapter and the contact
   * scene so one plate can carry two beats without reading as a repeat.
   */
  range?: readonly [number, number];
}

/**
 * A scroll-scrubbed chapter of the launch narrative.
 *
 * Structurally this is the frame-sequence hero generalised: the same runway
 * (`useHeroRunway`), the same loader (`useHeroFrames`), the same renderer
 * (`drawBlendedFrame`). Chapters 02, 03 and 04 differ only in which sequence
 * they read and what copy sits beside it — which is the point, because a
 * second scroll system driving a second set of media on the same page is how
 * these things start fighting each other.
 *
 * Two things it does that the hero does not, both because it is *not* first on
 * the page:
 *
 * - **Frames load on approach**, not on mount (`useNearViewport`). Three more
 *   sequences fetching immediately would put ~10 MB in flight while the reader
 *   is still on the hero.
 * - **The poster is a real still**, not a first frame. A chapter can be scrolled
 *   into before its frames arrive, so what sits under the canvas has to be a
 *   composition rather than a black plate.
 */
export function CinematicChapter({
  id,
  eyebrow,
  title,
  body,
  sequence,
  poster,
  start,
  filmEnd = 0.8,
  label,
  children,
  tone = 'cool',
  range,
}: CinematicChapterProps) {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastDrawn = useRef<string | null>(null);
  const decodeAround = useDecodeWindow();

  const sectionRef = useRef<HTMLElement>(null);
  const near = useNearViewport(sectionRef);

  const frames = useHeroFrames(sequence, !reduced && near);
  const scrub = !reduced && !frames.failed;

  const framesRef = useRef(frames);
  framesRef.current = frames;

  const draw = useCallback(
    (progress: number) => {
      const canvas = canvasRef.current;
      const { images, tier, ready } = framesRef.current;
      if (!canvas || !ready || !tier || images.length === 0) return;

      const { from, to } = frameWindow(images.length, range);
      const local = framePositionForProgress(progress, filmEnd, to - from + 1);
      const position = { index: local.index + from, next: local.next + from, blend: local.blend };
      lastDrawn.current = drawBlendedFrame(canvas, images, position, lastDrawn.current);
      decodeAround(images, position.index);
    },
    [decodeAround, filmEnd, range]
  );

  const { runwayRef, heroRef, progress, settled } = useHeroRunway(scrub, draw, `chapter:${id}`);

  // One node cannot carry two refs; the runway is also what the observer wants
  // to watch, so mirror it rather than wrapping the section in another element.
  useEffect(() => {
    (sectionRef as { current: HTMLElement | null }).current = runwayRef.current;
  }, [runwayRef]);

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
        lastDrawn.current = null;
      }
      draw(progress.current);
    };

    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [scrub, draw, progress]);

  useEffect(() => {
    if (frames.ready) {
      lastDrawn.current = null;
      draw(progress.current);
    }
  }, [frames.ready, frames.complete, draw, progress]);

  // Matches the hero: while scrubbing, the plate underneath is the film's own
  // first frame, so the canvas fading in over it is continuous. Without scrub
  // it is the settled still, which is the whole composition.
  const backdrop = scrub ? (start ?? poster) : poster;

  return (
    <section
      className={`chapter-runway ${scrub ? 'is-scrub' : ''}`}
      id={id}
      aria-label={label}
      ref={runwayRef}
    >
      <div className={`chapter tone-${tone} ${settled ? 'is-settled' : ''}`} ref={heroRef}>
        <div
          className="chapter-media"
          aria-hidden="true"
          style={{ backgroundImage: `url(${backdrop})` }}
        >
          {scrub && (
            <canvas
              ref={canvasRef}
              className="chapter-canvas"
              style={{ opacity: frames.ready ? 1 : 0 }}
            />
          )}
          <div className="chapter-scrim" />
        </div>

        <div className="wrap chapter-content">
          <div className="chapter-panel">
            {/* No sheet number, deliberately. The numbered sheet marks below
                belong to the document sections — these are film beats, and
                interleaving the two numbering systems would imply the chapters
                and the sections are the same kind of thing. */}
            <p className="sheet-mark">
              <span className="sheet-rule" aria-hidden="true" />
              <span className="sheet-eyebrow">{eyebrow}</span>
            </p>
            <h2 className="chapter-title">{title}</h2>
            {body && <p className="chapter-body">{body}</p>}
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
