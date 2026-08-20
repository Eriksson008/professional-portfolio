import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import type { ChapterBeat } from '../data/chapters';
import { useReducedMotion } from 'framer-motion';
import { framePositionForProgress, frameWindow } from './heroFrames';
import { drawBlendedFrame } from './frameCanvas';
import { useDecodeWindow, useHeroFrames } from './useHeroFrames';
import { useHeroRunway } from './useHeroRunway';
import { useNearViewport } from './useNearViewport';

/** Uncapped DPR would render 9x the pixels on a 3x phone for no visible gain. */
const MAX_DPR = 2;

/**
 * Where the subject sits in every plate, and where a portrait crop has to look.
 *
 * All four sequences compose their subject right of centre against an empty
 * left half. On a wide viewport the frame is barely cropped horizontally and
 * dead centre is right; on a phone, covering a 16:9 plate into a tall viewport
 * crops most of the width away, and centring throws the subject off the right
 * edge entirely. These match the `background-position` the poster underneath
 * uses in chapters.css — if one moves, move the other.
 */
const PHONE_FOCUS = { x: 0.68, y: 0.58 };
const WIDE_FOCUS = { x: 0.5, y: 0.5 };

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
  /**
   * Additional copy stanzas that fade through on their own windows of the same
   * scroll, for a chapter whose film is one continuous move but whose copy is
   * more than one thought.
   */
  beats?: readonly ChapterBeat[];
  /** Where this chapter's own copy fades out, when later beats follow it. */
  until?: number;
  /**
   * `long` doubles the runway, for a chapter carrying two films' worth of
   * frames. Without it the same scroll distance plays twice the frames.
   */
  runway?: 'standard' | 'long';
  /**
   * Which scrim treatment the plate needs. `ignition` deepens with scroll as
   * the plume brightens; `deep` holds the type column dark much further right,
   * for plates whose subject grows into it over the runway. Both live in
   * chapters.css.
   */
  tone?: 'cool' | 'ignition' | 'deep';
  /**
   * `contain` shows the whole 16:9 plate as a band on phones instead of
   * cropping to fill. Only for plates whose subject is small enough that a
   * portrait crop would lose it — see `containRect`.
   */
  phoneFit?: 'cover' | 'contain';
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
  phoneFit = 'cover',
  beats,
  until,
  runway = 'standard',
}: CinematicChapterProps) {
  // The chapter's own copy is simply the first beat. Building one list means a
  // single render path, and a one-beat chapter behaves exactly as it always has.
  const stanzas: ChapterBeat[] = [
    {
      eyebrow,
      title: typeof title === 'string' ? title : '',
      body: typeof body === 'string' ? body : '',
      from: 0,
      until,
    },
    ...(beats ?? []),
  ];
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastDrawn = useRef<string | null>(null);
  const decodeAround = useDecodeWindow();

  // Held in state rather than read off a ref: the runway element does not
  // exist on the first commit, and useNearViewport has to re-run once it does.
  const [runwayEl, setRunwayEl] = useState<HTMLElement | null>(null);
  const near = useNearViewport(runwayEl);

  // The range is handed to the loader as well as the renderer: a chapter that
  // draws only part of a sequence should not download the rest.
  const frames = useHeroFrames(sequence, !reduced && near, range);
  const scrub = !reduced && !frames.failed;

  const framesRef = useRef(frames);
  framesRef.current = frames;

  const draw = useCallback(
    (progress: number) => {
      const canvas = canvasRef.current;
      const { images, tier, ready } = framesRef.current;
      if (!canvas || !ready || !tier || images.length === 0) return;

      const phone = window.innerWidth < 720;
      const fit = phone && phoneFit === 'contain' ? 'contain' : 'cover';
      // A contained band is anchored high so the copy below it sits on black.
      const focus = fit === 'contain' ? { x: 0.5, y: 0.3 } : phone ? PHONE_FOCUS : WIDE_FOCUS;
      const { from, to } = frameWindow(images.length, range);
      const local = framePositionForProgress(progress, filmEnd, to - from + 1);
      const position = { index: local.index + from, next: local.next + from, blend: local.blend };
      lastDrawn.current = drawBlendedFrame(canvas, images, position, lastDrawn.current, focus, fit);
      decodeAround(images, position.index);
    },
    [decodeAround, filmEnd, range, phoneFit]
  );

  const { runwayRef, heroRef, progress } = useHeroRunway(scrub, draw, `chapter:${id}`);

  // The runway is also what the observer watches. Publishing it into state
  // after mount costs one extra render and is what makes the observer attach at
  // all — see useNearViewport for why reading the ref directly does not.
  useEffect(() => {
    setRunwayEl(runwayRef.current);
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
      className={`chapter-runway ${scrub ? 'is-scrub' : ''} ${
        phoneFit === 'contain' ? 'fit-band' : ''
      } ${runway === 'long' ? 'runway-long' : ''}`}
      id={id}
      aria-label={label}
      ref={runwayRef}
    >
      {/* No `is-settled` here: every `.is-settled` rule in the stylesheets is
          `.hero`-scoped, so on a chapter it was a class nobody read that kept a
          state hook live for nothing. */}
      <div className={`chapter tone-${tone}`} ref={heroRef}>
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
          {/* Beats stack in a single grid cell so they cross-fade in place
              rather than pushing one another around, and every one of them
              stays in the DOM and in the accessibility tree — a screen-reader
              user gets the whole chapter's copy in order without having to
              scrub a film to reveal it. */}
          <div className="chapter-panel">
            {stanzas.map((beat, i) => (
              <div
                className="chapter-beat"
                key={beat.eyebrow}
                style={{ '--from': beat.from, '--until': beat.until ?? 2 } as CSSProperties}
              >
                {/* No sheet number, deliberately. The numbered sheet marks
                    below belong to the document sections — these are film
                    beats, and interleaving the two numbering systems would
                    imply they are the same kind of thing. */}
                <p className="sheet-mark">
                  <span className="sheet-rule" aria-hidden="true" />
                  <span className="sheet-eyebrow">{beat.eyebrow}</span>
                </p>
                <h2 className="chapter-title">{i === 0 ? title : beat.title}</h2>
                {(i === 0 ? body : beat.body) && (
                  <p className="chapter-body">{i === 0 ? body : beat.body}</p>
                )}
                {beat.figures && beat.figures.length > 0 && (
                  <dl className="chapter-figures">
                    {beat.figures.map((figure) => (
                      // The label is the term and the figure its value, not the
                      // other way round; CSS orders the value above so the
                      // editorial reading is unchanged.
                      <div className="chapter-figure" key={figure.label}>
                        <dt>{figure.label}</dt>
                        <dd>{figure.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {i === 0 && children}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
