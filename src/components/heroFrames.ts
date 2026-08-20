/**
 * Frame-sequence contract for the cinematic-media-converter experiment.
 *
 * The frames themselves are generated (and git-ignored); `manifest.json` beside
 * them is tracked, so the runtime reads what was actually produced rather than
 * hard-coding a frame count that silently rots when the source is re-converted.
 *
 * Pure and DOM-free so the index maths — the part that decides whether the film
 * lands on its true first and last frame — is unit-testable.
 */

export interface FrameTier {
  width: number;
  height: number | null;
  dir: string;
  pattern: string;
  count: number;
  bytes: number;
}

export interface FrameManifest {
  name: string;
  frameCount: number;
  format: string;
  every: number;
  alpha: string | null;
  totalBytes: number;
  source: { width: number; height: number; fps: number; duration: number; frames: number };
  tiers: FrameTier[];
}

/** Where the converter writes, relative to the site base URL. */
export const FRAMES_ROOT = 'media/generated';

export const manifestUrl = (base: string, name: string) =>
  `${base}${FRAMES_ROOT}/${name}/manifest.json`;

/**
 * Map runway progress onto a frame.
 *
 * The film completes at `filmEnd` of the runway and holds on its last frame for
 * the remainder — the same choreography the MP4 hero uses, so the two are
 * comparable frame for frame. Clamped at both ends: progress 0 must show the
 * true first frame and progress >= filmEnd the true last one.
 *
 * **No longer called by the renderer** — `framePositionForProgress` replaced it
 * when the draw path learned to blend between frames. It is kept deliberately,
 * as the reference the blended mapping is checked against: a test asserts the
 * two agree on which frame is *nearest* at every progress, which is what pins
 * the dissolve to the same timeline the snapped version had. Delete it only
 * together with that test.
 */
export function frameIndexForProgress(progress: number, filmEnd: number, count: number): number {
  if (count <= 0) return 0;
  if (!(filmEnd > 0)) return count - 1;
  const t = Math.min(1, Math.max(0, progress) / filmEnd);
  return Math.min(count - 1, Math.max(0, Math.round(t * (count - 1))));
}

/**
 * `object-fit: cover` for a canvas, which has no such property.
 *
 * Was inlined in the hero's draw loop; lifted out because the ignition chapter
 * draws the same way and because the maths is worth asserting rather than
 * eyeballing against a letterboxed canvas.
 */
export function coverRect(
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number,
  /**
   * The point of the *image* to hold at the centre of the canvas, in 0..1.
   * Defaults to dead centre, which is what `object-fit: cover` does.
   *
   * It exists because every plate on this page composes its subject right of
   * centre against an empty left half — which is what makes room for the
   * typography, and what makes a portrait crop throw the subject off the right
   * edge. `object-position` solves this for the CSS poster underneath; the
   * canvas has no such property, so the focal point has to be explicit or the
   * two disagree at exactly the width where it matters.
   */
  focusX = 0.5,
  focusY = 0.5
): { x: number; y: number; width: number; height: number } {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
  }
  const scale = Math.max(canvasWidth / imageWidth, canvasHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  // Place the focal point at the canvas centre, then clamp so the image can
  // never be pulled far enough to expose an empty edge.
  const place = (canvasSpan: number, imageSpan: number, focus: number) =>
    Math.min(0, Math.max(canvasSpan - imageSpan, canvasSpan / 2 - focus * imageSpan));
  return {
    x: place(canvasWidth, width, focusX),
    y: place(canvasHeight, height, focusY),
    width,
    height,
  };
}

/** A playhead that lies between two frames, for sub-frame cross-dissolve. */
export interface FramePosition {
  /** The frame at or before the playhead. */
  index: number;
  /** The frame after it, clamped — equal to `index` on the last frame. */
  next: number;
  /** Fraction of the way from `index` to `next`, in [0, 1). */
  blend: number;
}

/**
 * The same mapping as `frameIndexForProgress`, but keeping the fractional part.
 *
 * Rounding to the nearest frame is correct for *which* frame is closest, and it
 * is what the renderer used to draw. The cost is temporal: a sequence spread
 * over a multi-thousand-pixel runway advances one frame per ~10-15 px of scroll
 * at the densities this page ships, so scrolling slowly walks a staircase of
 * held stills. That is a
 * resolution problem, not a frame-time problem — the benchmark measured paint
 * cost (already stall-free) and could not see it.
 *
 * Returning the fraction lets the renderer dissolve between two adjacent frames
 * instead of snapping. Adjacent frames of a 24 fps camera move differ very
 * little, so the dissolve reads as continuous motion at slow speeds, and at
 * speeds where it would read as a double image the eye cannot resolve it anyway.
 * It costs one extra `drawImage` and no additional bytes or requests.
 */
export function framePositionForProgress(
  progress: number,
  filmEnd: number,
  count: number
): FramePosition {
  const held = (index: number): FramePosition => ({ index, next: index, blend: 0 });
  if (count <= 0) return held(0);
  const last = count - 1;
  if (!(filmEnd > 0)) return held(last);

  const t = Math.min(1, Math.max(0, progress) / filmEnd);
  const exact = t * last;
  const index = Math.min(last, Math.max(0, Math.floor(exact)));
  if (index >= last) return held(last);
  return { index, next: index + 1, blend: exact - index };
}

/**
 * Resolve a fractional sub-range of a sequence to inclusive frame indices.
 *
 * The person-reveal plate is used twice on the page and must not read as a
 * repeat: chapter 02 plays the subject emerging from shadow, and the contact
 * scene plays the same move resolving to a lit face. Two windows onto one
 * continuous camera move, rather than the same clip run twice.
 *
 * Fractions rather than frame numbers so the split survives regenerating the
 * sequence at a different density — a hard-coded frame 131 would silently mean
 * something else the moment `--every` changed.
 */
export function frameWindow(
  count: number,
  range?: readonly [number, number]
): { from: number; to: number } {
  const last = Math.max(0, count - 1);
  if (!range) return { from: 0, to: last };
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const from = Math.round(clamp(range[0]) * last);
  const to = Math.round(clamp(range[1]) * last);
  // A reversed or collapsed range would otherwise produce a negative length and
  // a sequence that draws nothing.
  return from <= to ? { from, to } : { from: to, to: from };
}

/**
 * Build a frame URL. `pattern` comes from the manifest (`frame-%04d.webp`) and
 * is 1-based on disk, so index 0 is `frame-0001`.
 */
export function frameSrc(base: string, name: string, tier: FrameTier, index: number): string {
  const file = tier.pattern.replace(/%0(\d+)d/, (_m, width: string) =>
    String(index + 1).padStart(Number(width), '0')
  );
  return `${base}${FRAMES_ROOT}/${name}/${tier.dir}/${file}`;
}

/**
 * Pick a tier for a viewport width. Deliberately viewport-based rather than
 * device-pixel-based, matching how the MP4 tiers are chosen — a 3x phone that
 * pulled the 1440 sequence would triple its transfer for pixels the crop throws
 * away.
 */
/**
 * The frame to actually draw for a requested index.
 *
 * While the tail of the sequence is still streaming, the exact frame may not
 * have arrived. Walking outward for the nearest loaded neighbour shows a
 * slightly stale image for a moment instead of leaving the canvas blank or
 * freezing the scrub. Once loading completes this always returns the exact
 * frame, so the finished scrub is fully deterministic.
 *
 * Lives here rather than beside the loader because it is pure: no DOM, no
 * React, and therefore directly testable.
 */
export function nearestLoaded(
  images: readonly HTMLImageElement[],
  index: number
): HTMLImageElement | null {
  const usable = (i: number) => {
    const image = images[i];
    return image?.complete && image.naturalWidth > 0 ? image : null;
  };
  const exact = usable(index);
  if (exact) return exact;
  for (let offset = 1; offset < images.length; offset += 1) {
    const before = index - offset;
    const after = index + offset;
    if (before < 0 && after >= images.length) break;
    const candidate = usable(before) ?? usable(after);
    if (candidate) return candidate;
  }
  return null;
}

export function tierForWidth(tiers: readonly FrameTier[], viewportWidth: number): FrameTier | null {
  if (tiers.length === 0) return null;
  const ascending = [...tiers].sort((a, b) => a.width - b.width);
  return ascending.find((tier) => tier.width >= viewportWidth) ?? ascending[ascending.length - 1];
}
