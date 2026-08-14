import { HERO_VARIANTS, type HeroVariant, heroVariantHref, heroVariantLabel } from './heroVariant';

/**
 * Dev-only control for flipping between hero implementations.
 *
 * Gated on `import.meta.env.DEV`, so it is dead code the bundler drops from
 * production — the experiment must never put debug chrome in front of a
 * visitor. The `?hero=` parameter still works in a production build, which is
 * what the benchmarks drive, they just get no visible switcher.
 */
export function HeroDevSwitcher({ variant }: { variant: HeroVariant }) {
  if (!import.meta.env.DEV) return null;

  return (
    <div className="hero-dev-switcher" role="group" aria-label="Hero implementation (dev only)">
      {HERO_VARIANTS.map((option) => (
        <a
          key={option}
          href={heroVariantHref(option)}
          className={option === variant ? 'is-active' : ''}
          aria-current={option === variant ? 'true' : undefined}
        >
          {heroVariantLabel(option)}
        </a>
      ))}
    </div>
  );
}
