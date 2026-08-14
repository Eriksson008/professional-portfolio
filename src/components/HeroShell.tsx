import type { ReactNode, RefObject } from 'react';
import { profile } from '../data/profile';

/**
 * The hero's DOM around its media layer, shared by the two experimental
 * implementations.
 *
 * This deliberately duplicates the markup inside `AstronautHero.tsx` rather
 * than being extracted out of it: the experiment's whole premise is that the
 * shipped hero stays untouched and instantly restorable. Extracting a shared
 * shell would have edited the baseline being measured. When one implementation
 * wins, that is the moment to collapse the duplication — not before.
 *
 * Everything meaningful stays in the DOM: the heading, copy, links and the
 * telemetry readout are real elements, never painted into the canvas. Only the
 * film is a canvas.
 */

/** Mission telemetry — matches AstronautHero's readout so candidates compare like for like. */
const telemetry = [
  { value: 'Exceptional ×3', label: 'Reviews' },
  { value: '750+', label: 'Commits' },
  { value: '120+', label: 'Stories' },
  { value: 'Acting Technical Lead', label: 'Senior Software Engineer' },
] as const;

interface HeroShellProps {
  runwayRef: RefObject<HTMLElement>;
  heroRef: RefObject<HTMLDivElement>;
  /** Poster painted under the media layer, so a failure still reads as a frame. */
  posterSrc: string;
  scrub: boolean;
  settled: boolean;
  /**
   * Render the DOM ambient glow. The 3D candidate turns this off because it
   * draws the same glow inside the canvas at a real depth, where it parallaxes
   * against the film instead of sitting flat on top of it.
   */
  glow?: boolean;
  /** The film surface — a canvas, or nothing when the poster alone is showing. */
  children?: ReactNode;
}

export function HeroShell({
  runwayRef,
  heroRef,
  posterSrc,
  scrub,
  settled,
  glow = true,
  children,
}: HeroShellProps) {
  return (
    <section
      className={`hero-runway ${scrub ? 'is-scrub' : ''}`}
      id="top"
      aria-label="Introduction"
      ref={runwayRef}
    >
      <div className={`hero ${settled ? 'is-settled' : ''}`} ref={heroRef}>
        <div
          className="hero-media"
          aria-hidden="true"
          style={{ backgroundImage: `url(${posterSrc})` }}
        >
          {children}
          <div className="hero-scrim" />
        </div>

        {glow && <div className="hero-glow" aria-hidden="true" />}

        <div className="hero-hud" role="group" aria-label="Career telemetry">
          {telemetry.map((t) => (
            <div className="hud-cell" key={t.label}>
              <span className="hud-cell-value">{t.value}</span>
              <span className="hud-cell-label">{t.label}</span>
            </div>
          ))}
        </div>

        <div className="wrap hero-content">
          <div className="hero-panel">
            <p className="hero-eyebrow">Mission Portfolio</p>
            <h1 className="hero-name">{profile.name}</h1>
            <p className="hero-sub">
              Senior Software Engineer building AI, cloud, Salesforce, and enterprise systems —
              acting Technical Lead experience on an enterprise platform team.
            </p>
            <div className="hero-ctas">
              <a className="btn btn-primary" href="#projects">
                View Work
              </a>
              <a className="btn" href={profile.links.resume} target="_blank" rel="noopener">
                Download Résumé
              </a>
              <a className="btn btn-ghost" href="#contact">
                Contact
              </a>
            </div>
          </div>
        </div>

        <p className="hero-scroll" aria-hidden="true">
          Scroll
        </p>
      </div>
    </section>
  );
}
