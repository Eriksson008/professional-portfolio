import type { EncodeKey } from './heroVariant';
import type { VideoMediaTier } from './useDesktopViewport';

/**
 * Video sources for the hero candidates.
 *
 * The shipped ladder (2560 / 1920 / 1280, all-intra) is untouched and is what
 * `video-current` serves.
 *
 * The optimized ladder replaces **only the desktop tier**, because that is the
 * only tier with a problem. Experiment 1 measured the 1280x720 phone encode at
 * zero long frames and the 2560x1440 desktop encode at 45 — same code, same
 * GOP-1 structure, four times the pixels per seek. The bottleneck is intra-frame
 * decode cost at desktop resolution, not keyframe spacing, so the fix is fewer
 * pixels rather than a different codec or a shorter GOP (GOP is already 1).
 */

const BASE = import.meta.env.BASE_URL;

/** The shipped, production ladder. Not generated; tracked in public/media/. */
const SHIPPED: Record<VideoMediaTier, string> = {
  large: `${BASE}media/astronaut-hero-scrub.mp4`,
  medium: `${BASE}media/astronaut-hero-scrub-md.mp4`,
  small: `${BASE}media/astronaut-hero-scrub-sm.mp4`,
};

const GENERATED = `${BASE}media/generated/astronaut-hero-video`;

/**
 * Candidate desktop encodes, all H.264 High / yuv420p / GOP 1 / faststart /
 * no audio — identical in every respect except pixel count and CRF, so the
 * comparison isolates decode cost.
 */
const DESKTOP_CANDIDATES: Record<EncodeKey, string> = {
  shipped: SHIPPED.large,
  w1920: `${GENERATED}/hero_w1920_g1_crf23.mp4`,
};

/** Human-readable provenance, for the dev switcher and the benchmark report. */
export const ENCODE_DETAIL: Record<EncodeKey, string> = {
  shipped: '2560×1440 · 8.7 MB · shipped',
  w1920: '1920×1080 · 7.1 MB · crf23 · regenerated in CI',
};

export function shippedSource(tier: VideoMediaTier): string {
  return SHIPPED[tier];
}

/**
 * The optimized ladder. Phones and tablets keep the shipped encodes verbatim —
 * re-encoding a tier that already measures clean would add risk and bytes for
 * nothing, and would blur what the experiment is testing.
 */
export function optimizedSource(tier: VideoMediaTier, encode: EncodeKey): string {
  return tier === 'large' ? DESKTOP_CANDIDATES[encode] : SHIPPED[tier];
}
