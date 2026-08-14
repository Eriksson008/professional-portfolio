import {
  ENCODE_KEYS,
  type EncodeKey,
  HERO_VARIANTS,
  type HeroVariant,
  heroVariantHref,
  heroVariantLabel,
} from './heroVariant';
import { ENCODE_DETAIL } from './heroVideoSources';

/**
 * Dev-only control for flipping between hero implementations.
 *
 * Gated on `import.meta.env.DEV`, so it is dead code the bundler drops from
 * production — the experiment must never put debug chrome in front of a
 * visitor. The `?hero=` and `?enc=` parameters still work in a production
 * build, which is what the benchmarks drive; they just get no visible switcher.
 */
export function HeroDevSwitcher({
  variant,
  encode,
}: {
  variant: HeroVariant;
  encode: EncodeKey;
}) {
  if (!import.meta.env.DEV) return null;

  return (
    <div className="hero-dev-switcher" aria-label="Hero implementation (dev only)">
      <div className="hero-dev-row" role="group" aria-label="Implementation">
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
      {variant === 'video-optimized' && (
        <div className="hero-dev-row" role="group" aria-label="Encode">
          {ENCODE_KEYS.map((key) => (
            <a
              key={key}
              href={`?hero=video-optimized&enc=${key}`}
              className={key === encode ? 'is-active' : ''}
              aria-current={key === encode ? 'true' : undefined}
              title={ENCODE_DETAIL[key]}
            >
              {key}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
