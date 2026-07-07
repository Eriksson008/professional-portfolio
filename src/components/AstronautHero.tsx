import { useEffect, useRef, useState } from 'react';
import { useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { profile } from '../data/profile';
import { useDesktopViewport } from './useDesktopViewport';
import { GLIDE_SPRING, clamp01, debugGlide } from './scrollGlide';

// The scrub encodes are all-intra (a keyframe every frame) so seeking is
// instant at any scroll position; the original GOP encode stutters.
// Phones get a 720p variant (~3 MB vs ~6 MB).
const VIDEO_SRC = `${import.meta.env.BASE_URL}media/astronaut-hero-scrub.mp4`;
const VIDEO_SRC_SM = `${import.meta.env.BASE_URL}media/astronaut-hero-scrub-sm.mp4`;
/** Final frame — the settled helmet; what mobile / reduced-motion / failure show. */
const POSTER_SRC = `${import.meta.env.BASE_URL}media/astronaut-hero-poster.jpg`;
/** First frame — the distant approach; what the scrubbed film opens on. */
const START_SRC = `${import.meta.env.BASE_URL}media/astronaut-hero-start.jpg`;

/**
 * The film completes at this fraction of the runway; the remainder is a hold
 * where the settled frame stays put and the visor telemetry assembles.
 */
const FILM_END = 0.78;

/** Scroll progress past which the scroll cue has done its job. */
const SETTLE_AT = 0.5;

/** One frame of the 24fps film — seeking finer than this is wasted decode. */
const FRAME = 1 / 24;

/** Mission data mirrored on the visor — all figures verifiable elsewhere on the page. */
const hudLabels = [
  { pos: 'tl', text: 'Impact · Exceptional ×3' },
  { pos: 'tr', text: 'Commits · 750+' },
  { pos: 'bl', text: 'Stories · 120+' },
  { pos: 'br', text: 'Role · Tech Lead' },
] as const;

/**
 * Cinematic hero: the film is scrubbed by scroll. The hero pins under the
 * nav while a 360vh runway maps scroll progress onto the video timeline —
 * the astronaut drifts in from the left and settles filling the frame as
 * you scroll.
 *
 * Scroll only moves a spring's target; the sprung progress (GLIDE_SPRING —
 * overdamped, settling a few hundred ms after scroll stops) is what every
 * visual reads, so the film and choreography glide into place instead of
 * freezing the instant scrolling stops. The sprung progress is published as
 * a CSS custom property (--p) on the
 * hero, and hero.css choreographs every segment from it: the identity
 * (eyebrow → name → sub → CTAs) eases into frame while the astronaut moves,
 * then the visor telemetry assembles piece by piece once the film has ended.
 *
 * The video is purely decorative and scrubs on every viewport — phones get
 * a lighter 720p encode and a progress-linked object-position pan that keeps
 * the astronaut in frame under the portrait crop. Reduced-motion gets the
 * settled poster still (no pinning, no scrub, everything resolved); if the
 * video errors, the poster is already painted underneath.
 */
export function AstronautHero() {
  const reduced = useReducedMotion();
  const desktop = useDesktopViewport();
  const [failed, setFailed] = useState(false);
  const [settled, setSettled] = useState(false);
  const scrub = !reduced && !failed;

  const runwayRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Scroll writes raw progress here; the spring's change stream (one tick
  // per animation frame, kept alive by framer-motion until it rests) is
  // what paints — no hand-rolled rAF loop needed.
  const raw = useMotionValue(0);
  const smooth = useSpring(raw, GLIDE_SPRING);

  // Without a film to scrub, the poster already shows the settled frame.
  useEffect(() => {
    if (!scrub) setSettled(true);
  }, [scrub]);

  useEffect(() => {
    if (!scrub) return;
    const runway = runwayRef.current;
    const hero = heroRef.current;
    const video = videoRef.current;
    if (!runway || !hero || !video) return;

    let lastP = '';

    const measure = () => {
      const rect = runway.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      raw.set(range > 0 ? clamp01(-rect.top / range) : 1);
    };

    // Seek only on whole-frame deltas, and never while a seek is in
    // flight — queueing sub-frame seeks just thrashes the decoder.
    const syncVideo = () => {
      const dur = video.duration;
      if (!Number.isFinite(dur) || dur <= 0 || video.seeking) return;
      const t = Math.min(1, clamp01(smooth.get()) / FILM_END) * (dur - 0.05);
      if (Math.abs(t - video.currentTime) > FRAME) video.currentTime = t;
    };

    const render = (v: number) => {
      const shown = clamp01(v);
      // Skip the style write (and its recalc) when the change is invisible.
      const p = shown.toFixed(3);
      if (p !== lastP) {
        lastP = p;
        hero.style.setProperty('--p', p);
      }
      syncVideo();
      if (shown >= SETTLE_AT) setSettled(true);
      debugGlide('hero', raw.get(), shown);
    };

    // A reload mid-page restores the scroll position — start settled there
    // instead of springing through the whole film from frame one.
    measure();
    smooth.jump(raw.get());
    render(smooth.get());

    const unsubscribe = smooth.on('change', render);
    const onScroll = measure;
    const onMetadata = () => {
      measure();
      syncVideo();
    };

    // Mobile browsers don't paint seeks on a never-played video — prime the
    // decode pipeline with one muted play → pause (allowed without a gesture
    // because the video is muted + playsInline).
    let primed = false;
    const prime = () => {
      if (primed) return;
      primed = true;
      const p = video.play();
      if (p) {
        p.then(() => video.pause()).catch(() => {
          primed = false;
        });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    video.addEventListener('loadedmetadata', onMetadata);
    video.addEventListener('loadedmetadata', prime);
    // A skipped-while-seeking frame could leave the film a step behind at
    // rest — re-check once each seek lands.
    video.addEventListener('seeked', syncVideo);
    prime();
    return () => {
      unsubscribe();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('loadedmetadata', prime);
      video.removeEventListener('seeked', syncVideo);
    };
  }, [scrub, raw, smooth]);

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
          style={{ backgroundImage: `url(${scrub ? START_SRC : POSTER_SRC})` }}
        >
          {scrub && (
            <video
              ref={videoRef}
              src={desktop ? VIDEO_SRC : VIDEO_SRC_SM}
              poster={START_SRC}
              muted
              playsInline
              preload="auto"
              tabIndex={-1}
              onError={() => setFailed(true)}
            />
          )}
          <div className="hero-scrim" />
        </div>

        <div className="hero-glow" aria-hidden="true" />

        <div className="hero-hud" aria-hidden="true">
          <span className="hud-corner hud-tl" />
          <span className="hud-corner hud-tr" />
          <span className="hud-corner hud-bl" />
          <span className="hud-corner hud-br" />
          <span className="hud-tick hud-tick-l" />
          <span className="hud-tick hud-tick-r" />
          {hudLabels.map((l) => (
            <span key={l.pos} className={`hud-label hud-label-${l.pos}`}>
              {l.text}
            </span>
          ))}
        </div>

        <div className="wrap hero-content">
          <div className="hero-panel">
            <p className="hero-eyebrow">Mission Portfolio</p>
            <h1 className="hero-name">{profile.name}</h1>
            <p className="hero-sub">
              Senior Software Engineer building AI, cloud, Salesforce, and enterprise systems —
              acting Tech Lead on an enterprise platform team.
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
