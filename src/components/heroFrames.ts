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
 */
export function frameIndexForProgress(progress: number, filmEnd: number, count: number): number {
  if (count <= 0) return 0;
  if (!(filmEnd > 0)) return count - 1;
  const t = Math.min(1, Math.max(0, progress) / filmEnd);
  return Math.min(count - 1, Math.max(0, Math.round(t * (count - 1))));
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
