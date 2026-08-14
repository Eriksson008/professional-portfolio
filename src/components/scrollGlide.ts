import type { SpringOptions } from 'framer-motion';

/**
 * The shared spring behind every scroll-scrubbed scene (hero + finale).
 *
 * Raw scroll progress is only ever the spring's *target*; the sprung value
 * is what the CSS choreography vars and the film seeks actually read. That
 * gives the scrub real momentum: while scrolling the visuals trail the
 * finger by a beat, and when scrolling stops they keep gliding into place
 * for a few hundred milliseconds instead of freezing on the spot.
 *
 * Deliberately overdamped (damping ratio ≈ 1.3) — a scrubbed film must
 * never overshoot the scroll position and play backwards to correct.
 *
 * Tuning: feels laggy → stiffness 50–70, damping 18–22. Still too abrupt →
 * lower stiffness, nudge mass up. Keep it overdamped: damping ≥ 2·√(stiffness·mass).
 */
export const GLIDE_SPRING: SpringOptions = {
  stiffness: 26,
  damping: 14,
  mass: 1.1,
  restDelta: 0.0008,
};

/**
 * Desktop hero spring — tighter than the shared glide. On a mouse wheel the
 * raw target arrives in chunky notches; the very soft GLIDE_SPRING trails them
 * by ~1.5–2s and keeps gliding after the wheel stops, which reads as a
 * disconnected/stuttery scrub on desktop (a trackpad's continuous deltas hide
 * it — hence mobile feels fine). This firms the response to a ~0.7s settle so
 * the film tracks the wheel, while staying overdamped (ζ ≈ 1.29) so a scrubbed
 * film never overshoots and plays backwards. Used on ≥720px for the hero and
 * finale; phones keep the softer GLIDE_SPRING for touch input.
 */
export const HERO_SPRING_DESKTOP: SpringOptions = {
  stiffness: 60,
  damping: 20,
  mass: 1.0,
  restDelta: 0.0008,
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Source-frame duration; keep seek thresholds tied to verified asset cadence. */
export const mediaFrameDuration = (fps: number) => (fps > 0 ? 1 / fps : 0);

export interface FrameScheduler {
  schedule: () => void;
  cancel: () => void;
}

/** Coalesce any number of callers into one callback on the next display frame. */
export function createFrameScheduler(
  callback: () => void,
  requestFrame: (callback: FrameRequestCallback) => number = requestAnimationFrame,
  cancelFrame: (handle: number) => void = cancelAnimationFrame
): FrameScheduler {
  let handle = 0;
  return {
    schedule() {
      if (handle !== 0) return;
      handle = requestFrame(() => {
        handle = 0;
        callback();
      });
    },
    cancel() {
      if (handle === 0) return;
      cancelFrame(handle);
      handle = 0;
    },
  };
}

/**
 * In-flow reveal progress: an element's travel up the viewport, starting when
 * its top crosses the bottom edge and complete once that top has risen to
 * `endFraction` of the viewport height. Drives the finale's staged text, and
 * on phones — where the closing film has no sticky runway — the film band
 * itself, which is why the ramp is one viewport of scroll rather than the
 * band's own (much shorter) height.
 */
export const viewportTravelProgress = (
  top: number,
  viewportHeight: number,
  endFraction: number
) => {
  const range = viewportHeight * (1 - endFraction);
  return range > 0 ? clamp01((viewportHeight - top) / range) : 1;
};

/**
 * Progress through a sticky media runway. The media reaches the viewport's
 * bottom edge at progress zero, remains visible while the runway travels,
 * and releases only after progress one.
 */
export const stickyMediaProgress = (
  runwayTop: number,
  runwayHeight: number,
  mediaHeight: number,
  viewportHeight: number,
  targetTravel = runwayHeight - mediaHeight
) => {
  const travel = Math.min(runwayHeight - mediaHeight, targetTravel);
  const stickyTop = viewportHeight - mediaHeight;
  return travel > 0 ? clamp01((stickyTop - runwayTop) / travel) : 1;
};

const lastLog: Record<string, number> = {};

/**
 * Dev-only glide telemetry (stripped from production builds). Watch the
 * console while scrolling: raw jumps with the wheel, smooth trails it and
 * keeps ticking briefly after raw stops.
 */
export function debugGlide(label: string, raw: number, smooth: number) {
  if (!import.meta.env.DEV) return;
  const now = performance.now();
  if (now - (lastLog[label] ?? 0) < 200) return;
  lastLog[label] = now;
  console.debug(`[glide:${label}] raw=${raw.toFixed(3)} smooth=${smooth.toFixed(3)}`);
}

/** Dev-only evidence of what paused seeking actually presents; no production callback is started. */
export function startVideoFrameDebug(label: string, video: HTMLVideoElement): () => void {
  if (!import.meta.env.DEV || typeof video.requestVideoFrameCallback !== 'function')
    return () => {};

  let callbackId = 0;
  let windowStarted = performance.now();
  let previousNow = 0;
  let presented = 0;
  let gapsOver50Ms = 0;
  let intervalTotal = 0;
  let intervalCount = 0;

  const inspect: VideoFrameRequestCallback = (now) => {
    if (previousNow > 0) {
      const interval = now - previousNow;
      intervalTotal += interval;
      intervalCount += 1;
      if (interval > 50) gapsOver50Ms += 1;
    }
    previousNow = now;
    presented += 1;

    if (now - windowStarted >= 2000) {
      const quality = video.getVideoPlaybackQuality?.();
      const average = intervalCount > 0 ? intervalTotal / intervalCount : 0;
      console.debug(
        `[video:${label}] presented=${presented} avg=${average.toFixed(1)}ms gaps>50=${gapsOver50Ms}` +
          (quality ? ` dropped=${quality.droppedVideoFrames}` : '')
      );
      windowStarted = now;
      presented = 0;
      gapsOver50Ms = 0;
      intervalTotal = 0;
      intervalCount = 0;
    }
    callbackId = video.requestVideoFrameCallback(inspect);
  };

  callbackId = video.requestVideoFrameCallback(inspect);
  return () => video.cancelVideoFrameCallback(callbackId);
}
