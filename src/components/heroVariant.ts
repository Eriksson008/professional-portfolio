/**
 * Hero implementation selector for the cinematic-media-converter experiment.
 *
 * Three implementations of the same hero are built side by side so they can be
 * measured against each other on identical scroll input:
 *
 *   video       the shipped MP4 scrub (AstronautHero) — the baseline, untouched
 *   frames      a deterministic WebP frame sequence drawn to a 2D canvas
 *   interactive a three/R3F scene with the same frames on a plane, plus real
 *               camera depth and cursor parallax
 *
 * Selected with `?hero=frames` / `?hero=interactive`. The default is always the
 * shipped implementation, so a visitor who passes nothing sees production.
 *
 * Pure and parameterised on the search string rather than reading `location`
 * directly, so it is testable without a DOM — the same reason `scrollGlide.ts`
 * and `askScroll.ts` are shaped this way.
 */

export const HERO_VARIANTS = ['video', 'frames', 'interactive'] as const;

export type HeroVariant = (typeof HERO_VARIANTS)[number];

/** The shipped implementation. Anything unrecognised falls back to it. */
export const DEFAULT_HERO_VARIANT: HeroVariant = 'video';

const LABELS: Record<HeroVariant, string> = {
  video: 'MP4 scrub (current)',
  frames: 'Frame sequence',
  interactive: '3D / R3F',
};

export function heroVariantLabel(variant: HeroVariant): string {
  return LABELS[variant];
}

function isHeroVariant(value: string): value is HeroVariant {
  return (HERO_VARIANTS as readonly string[]).includes(value);
}

/**
 * Read the requested variant out of a `location.search` string.
 *
 * Unknown, empty, and malformed values all resolve to the shipped hero: an
 * experiment toggle must never be able to leave a visitor with no hero at all.
 */
export function parseHeroVariant(search: string | null | undefined): HeroVariant {
  if (!search) return DEFAULT_HERO_VARIANT;
  let requested: string | null = null;
  try {
    requested = new URLSearchParams(search).get('hero');
  } catch {
    return DEFAULT_HERO_VARIANT;
  }
  if (requested === null) return DEFAULT_HERO_VARIANT;
  const normalised = requested.trim().toLowerCase();
  return isHeroVariant(normalised) ? normalised : DEFAULT_HERO_VARIANT;
}

/** The search string that selects a variant, for the dev-only switcher's links. */
export function heroVariantHref(variant: HeroVariant): string {
  return variant === DEFAULT_HERO_VARIANT ? '?' : `?hero=${variant}`;
}
