/**
 * Hero implementation selector.
 *
 * Two experiments compared five representations of this hero; the branches
 * `experiment/cinematic-media-converter` and `experiment/cinematic-media-followup`
 * hold all of them, with full measurements in docs/cinematic-hero-benchmark.md
 * and docs/cinematic-hero-benchmark-2.md.
 *
 * Two lost and are **not** on main:
 *
 * - **R3F / Three.js** — 222 kB gzipped, the worst LCP of every candidate, and
 *   less smooth than a plain 2D canvas drawing the same frames. Shipping the
 *   chunk for a rejected candidate would cost every deploy for nothing.
 * - **frames-193** — identical smoothness to frames-97 at twice the bytes and
 *   twice the requests. Strictly dominated.
 *
 * What remains are the three that could plausibly ship:
 *
 *   video-current    the shipped 2560x1440 all-intra MP4 scrub — the default
 *   video-optimized  1920x1080 all-intra re-encode, same access pattern
 *   frames-97        every other source frame, drawn to a 2D canvas
 *
 * Selected with `?hero=`. The default is always the shipped implementation, so
 * a visitor who passes nothing sees production untouched.
 *
 * Pure and parameterised on the search string rather than reading `location`
 * directly, so it is testable without a DOM — the same reason `scrollGlide.ts`
 * and `askScroll.ts` are shaped this way.
 */

export const HERO_VARIANTS = ['video-current', 'video-optimized', 'frames-97'] as const;

export type HeroVariant = (typeof HERO_VARIANTS)[number];

/** The shipped implementation. Anything unrecognised falls back to it. */
export const DEFAULT_HERO_VARIANT: HeroVariant = 'video-current';

/**
 * Experiment 1's names still work. Benchmark scripts, notes and the first
 * report all reference `?hero=video` and `?hero=frames`, and silently breaking
 * those would make the earlier results unreproducible.
 */
const ALIASES: Readonly<Record<string, HeroVariant>> = {
  video: 'video-current',
  // Both experiments' reports reference ?hero=frames for the 193-frame
  // sequence. That candidate is not on main, so the alias resolves to the
  // frame renderer that is — a reader following the old link still sees a
  // frame sequence rather than a silent fallback to video.
  frames: 'frames-97',
  'frames-193': 'frames-97',
  interactive: 'video-current',
};

const LABELS: Record<HeroVariant, string> = {
  'video-current': 'MP4 (current)',
  'video-optimized': 'MP4 (optimized)',
  'frames-97': 'Frames ×97',
};

export function heroVariantLabel(variant: HeroVariant): string {
  return LABELS[variant];
}

function isHeroVariant(value: string): value is HeroVariant {
  return (HERO_VARIANTS as readonly string[]).includes(value);
}

function readParam(search: string | null | undefined, key: string): string | null {
  if (!search) return null;
  try {
    return new URLSearchParams(search).get(key);
  } catch {
    return null;
  }
}

/**
 * Read the requested variant out of a `location.search` string.
 *
 * Unknown, empty, and malformed values all resolve to the shipped hero: an
 * experiment toggle must never be able to leave a visitor with no hero at all.
 */
export function parseHeroVariant(search: string | null | undefined): HeroVariant {
  const requested = readParam(search, 'hero');
  if (requested === null) return DEFAULT_HERO_VARIANT;
  const normalised = requested.trim().toLowerCase();
  if (isHeroVariant(normalised)) return normalised;
  return ALIASES[normalised] ?? DEFAULT_HERO_VARIANT;
}

/** The search string that selects a variant, for the dev-only switcher's links. */
export function heroVariantHref(variant: HeroVariant): string {
  return variant === DEFAULT_HERO_VARIANT ? '?' : `?hero=${variant}`;
}

/**
 * Variants whose module or assets are expensive enough that a reduced-motion
 * visitor must never trigger them. `React.lazy` starts fetching the moment its
 * component renders — before the component can read the preference and decline
 * — so the decision has to happen *above* the lazy boundary.
 *
 * Measured in experiment 1: a reduced-motion visitor on `?hero=interactive`
 * downloaded 217 kB of three for a scene that never mounted.
 */
export const EXPENSIVE_VARIANTS: readonly HeroVariant[] = ['frames-97', 'video-optimized'];

/**
 * The variant actually rendered, once the motion preference is applied.
 *
 * Pure so the guarantee can be asserted in a test rather than only observed in
 * a browser: under reduced motion this must resolve to the cheap default for
 * *every* requested variant, including ones added later.
 */
export function effectiveHeroVariant(
  requested: HeroVariant,
  reducedMotion: boolean
): HeroVariant {
  return reducedMotion ? DEFAULT_HERO_VARIANT : requested;
}

/** Which generated frame sequence a variant reads, or null if it is not frame-based. */
export function frameSequenceFor(variant: HeroVariant): string | null {
  return variant === 'frames-97' ? 'astronaut-hero-97' : null;
}

// ---------------------------------------------------------------------------
// Encode override — benchmarking only.
//
// `?hero=video-optimized&enc=w1600` points the optimized-video hero at a
// specific candidate encode. `enc=shipped` renders the *current* file through
// the *optimized* component, which is what makes A1-vs-A2 a fair test: without
// it the two candidates would differ in both their encode and their component,
// and a difference could not be attributed to either.
// ---------------------------------------------------------------------------

// Only the encodes that exist on the deployed site. The 2560/1600 candidates
// were benchmarking-only and are regenerated on the experiment branches;
// offering them here would hand a visitor a 404.
export const ENCODE_KEYS = ['shipped', 'w1920'] as const;

export type EncodeKey = (typeof ENCODE_KEYS)[number];

/** Chosen by measurement in experiment 2; see docs/cinematic-hero-benchmark-2.md. */
export const DEFAULT_ENCODE: EncodeKey = 'w1920';

export function parseEncodeKey(search: string | null | undefined): EncodeKey {
  const requested = readParam(search, 'enc');
  if (requested === null) return DEFAULT_ENCODE;
  const normalised = requested.trim().toLowerCase();
  return (ENCODE_KEYS as readonly string[]).includes(normalised)
    ? (normalised as EncodeKey)
    : DEFAULT_ENCODE;
}
