import type { CSSProperties } from 'react';
import { heroStages, heroRoles, type HeroStage } from '../data/heroStages';
import { heroSystems } from '../data/heroSystems';
import { profile } from '../data/profile';
import { useScrollProgress } from '../hooks/useScrollProgress';

const BASE = import.meta.env.BASE_URL;
const N = heroStages.length;
const finalStage = heroStages[N - 1];

const frameUrl = (frame: string) => `${BASE}hero-sequence/${frame}`;

/** Render a headline with one accent word/phrase highlighted in red. */
function Headline({ text, accent }: { text: string; accent?: string }) {
  if (!accent) return <>{text}</>;
  const at = text.indexOf(accent);
  if (at === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="sh-accent">{accent}</span>
      {text.slice(at + accent.length)}
    </>
  );
}

/** The six professional-area cards that rise out of the vault. */
function SystemCluster() {
  return (
    <ul className="sh-systems">
      {heroSystems.map((sys) => (
        <li className="sh-system" key={sys.area}>
          <span className="sh-system__area">{sys.area}</span>
          <span className="sh-system__tools">{sys.tools.join(' · ')}</span>
        </li>
      ))}
    </ul>
  );
}

/** The name / tagline / CTA card that closes the narrative. */
function FinalCard({ headingId }: { headingId: string }) {
  return (
    <div className="sh-final">
      <p className="sh-kicker">
        <span className="sh-kicker__no">{finalStage.no}</span>
        <span className="sh-kicker__rule" aria-hidden="true" />
        {finalStage.label}
      </p>
      <h1 className="sh-name" id={headingId}>
        {profile.name}
      </h1>
      <p className="sh-role">{profile.role}</p>
      <p className="sh-tagline">
        Building AI-enabled enterprise systems, cloud platforms, and polished digital products.
      </p>
      <div className="sh-actions">
        <a className="sh-btn sh-btn--primary" href="#projects">
          View Projects
        </a>
        <a className="sh-btn sh-btn--gold" href="#experience">
          Read Experience
        </a>
      </div>
      <ul className="sh-roles" aria-label="Focus areas">
        {heroRoles.map((role) => (
          <li key={role}>{role}</li>
        ))}
      </ul>
    </div>
  );
}

/** The text content for one narrative stage. */
function StageContent({ stage, headingId }: { stage: HeroStage; headingId: string }) {
  if (stage.kind === 'final') return <FinalCard headingId={headingId} />;
  return (
    <div className="sh-statement">
      <p className="sh-kicker">
        <span className="sh-kicker__no">{stage.no}</span>
        <span className="sh-kicker__rule" aria-hidden="true" />
        {stage.label}
      </p>
      <p className="sh-headline">
        <Headline text={stage.headline} accent={stage.accent} />
      </p>
      {stage.sub && <p className="sh-sub">{stage.sub}</p>}
      {stage.kind === 'systems' && <SystemCluster />}
    </div>
  );
}

/**
 * Static, non-animated hero for reduced-motion / no-JS. Presents the destination
 * directly: final identity + CTAs, then the system cards as a real grid.
 */
function StaticHero({ headingId }: { headingId: string }) {
  return (
    <section className="scroll-hero scroll-hero--static" id="top" aria-labelledby={headingId}>
      <div
        className="sh-frames"
        aria-hidden="true"
        style={{ backgroundImage: `url(${frameUrl(finalStage.frame)})` }}
      >
        <div className="sh-scrim" />
      </div>
      <div className="wrap sh-static-inner">
        <FinalCard headingId={headingId} />
        <SystemCluster />
      </div>
    </section>
  );
}

/**
 * Scroll-driven cinematic hero. A tall section pins a full-screen viewport while
 * scroll progress cross-fades nine cinematic frames and their synchronized HTML
 * text stages, closing on the identity card.
 */
export function ScrollHero() {
  const { ref, progress, interactive } = useScrollProgress<HTMLElement>();
  const headingId = 'hero-name';

  if (!interactive) return <StaticHero headingId={headingId} />;

  // Position along the narrative: 0 → N-1. A hold band at each end keeps the
  // opening ("Ideas become systems") and the closing identity card fully visible
  // for a beat, instead of only at a single instant.
  const HOLD = 0.07;
  const eff = Math.min(1, Math.max(0, (progress - HOLD) / (1 - 2 * HOLD)));
  const pos = eff * (N - 1);
  const sectionStyle = { '--sh-count': String(N) } as CSSProperties;

  return (
    <section
      ref={ref}
      className="scroll-hero"
      id="top"
      aria-labelledby={headingId}
      style={sectionStyle}
    >
      <div className="scroll-hero__pin">
        {/* Cinematic frame layers — decorative background only. */}
        <div className="sh-frames" aria-hidden="true">
          {heroStages.map((stage, i) => (
            <div
              key={stage.frame}
              className="sh-frame"
              style={{
                backgroundImage: `url(${frameUrl(stage.frame)})`,
                opacity: Math.max(0, 1 - Math.abs(pos - i)),
              }}
            />
          ))}
          <div className="sh-scrim" />
        </div>

        {/* Synchronized HTML text stages — the real content. */}
        <div className="sh-stage-layer">
          <div className="wrap sh-stage-wrap">
            {heroStages.map((stage, i) => {
              const d = pos - i;
              const opacity = Math.max(0, 1 - Math.abs(d) * 1.7);
              const hidden = opacity <= 0.02;
              const stageStyle: CSSProperties = {
                opacity,
                transform: `translateY(${(d * -26).toFixed(1)}px)`,
                visibility: hidden ? 'hidden' : 'visible',
              };
              return (
                <div
                  className={`sh-stage sh-stage--${stage.kind}`}
                  key={stage.no}
                  style={stageStyle}
                  aria-hidden={hidden}
                >
                  <StageContent stage={stage} headingId={headingId} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress rail + scroll cue. */}
        <div className="sh-rail" aria-hidden="true">
          {heroStages.map((stage, i) => (
            <span
              key={stage.no}
              className={`sh-rail__tick ${Math.round(pos) === i ? 'is-active' : ''}`}
            />
          ))}
        </div>
        <div className={`sh-cue ${progress > 0.02 ? 'is-hidden' : ''}`} aria-hidden="true">
          <span className="sh-cue__label">Scroll</span>
          <span className="sh-cue__line" />
        </div>
      </div>
    </section>
  );
}
