import { useEffect, useRef, useState } from 'react';
import { useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { profile } from '../data/profile';
import { useVideoMediaTier } from './useDesktopViewport';
import {
  GLIDE_SPRING,
  HERO_SPRING_DESKTOP,
  clamp01,
  createFrameScheduler,
  debugGlide,
  mediaFrameDuration,
  startVideoFrameDebug,
} from './scrollGlide';

// The scrub encodes are all-intra (a keyframe every frame) so seeking is
// instant at any scroll position; the original GOP encode stutters.
// Large desktops get 1440p, medium viewports 1080p, and phones 720p so
// transfer/decode pressure scales without giving up the GOP-1 seek behavior.
const VIDEO_SRC = `${import.meta.env.BASE_URL}media/astronaut-hero-scrub.mp4`;
const VIDEO_SRC_MD = `${import.meta.env.BASE_URL}media/astronaut-hero-scrub-md.mp4`;
const VIDEO_SRC_SM = `${import.meta.env.BASE_URL}media/astronaut-hero-scrub-sm.mp4`;
/** Final frame — the settled helmet; what mobile / reduced-motion / failure show. */
const POSTER_SRC = `${import.meta.env.BASE_URL}media/astronaut-hero-poster.jpg`;
/** First frame — the distant approach; what the scrubbed film opens on. */
const START_SRC = `${import.meta.env.BASE_URL}media/astronaut-hero-start.jpg`;

/**
 * The film completes at this fraction of the runway; the remainder is a hold
 * where the settled frame stays put and the visor telemetry assembles.
 * Phones have no telemetry (it crowds the portrait band) and a much shorter
 * runway, so there the film runs almost to the end — a hold with nothing to
 * assemble in it is just dead scroll. Keep in step with the object-position
 * pan in hero.css and the finale's phone runway (finale.css).
 */
const FILM_END_DESKTOP = 0.78;
const FILM_END_PHONE = 0.94;

/** Scroll progress past which the scroll cue has done its job. */
const SETTLE_AT = 0.5;

const VIDEO_FPS = 24;
/** One verified source frame — seeking finer than this is wasted decode. */
const FRAME = mediaFrameDuration(VIDEO_FPS);

/** Mission telemetry — a bulleted readout on the settled visor (desktop only;
    hidden on phones where it crowds the portrait frame). All figures are
    verifiable elsewhere on the page; value carries, label anchors. */
const telemetry = [
  { value: 'Exceptional ×3', label: 'Reviews' },
  { value: '750+', label: 'Commits' },
  { value: '120+', label: 'Stories' },
  { value: 'Acting Technical Lead', label: 'Senior Software Engineer' },
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
 *
 * Phones re-compose the same scene rather than shrink it (hero.css): the
 * film is a band across the top of the frame with the identity stacked
 * directly beneath it, the identity arrives on load instead of on scroll,
 * and the runway is 200svh (100svh of travel) with the film running to 0.94
 * of it. Same mechanic, a third of the scroll, no empty stretch.
 */
export function AstronautHero() {
  const reduced = useReducedMotion();
  const mediaTier = useVideoMediaTier();
  const desktop = mediaTier !== 'small';
  const videoSrc =
    mediaTier === 'large' ? VIDEO_SRC : mediaTier === 'medium' ? VIDEO_SRC_MD : VIDEO_SRC_SM;
  const [failed, setFailed] = useState(false);
  const [settled, setSettled] = useState(false);
  const scrub = !reduced && !failed;
  const filmEnd = desktop ? FILM_END_DESKTOP : FILM_END_PHONE;

  const runwayRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Scroll writes raw progress here; the spring's change stream (one tick
  // per animation frame, kept alive by framer-motion until it rests) is
  // what paints — no hand-rolled rAF loop needed. Desktop gets a tighter
  // spring so a chunky mouse wheel tracks the film instead of trailing it;
  // phones keep the softer shared glide (which feels right under touch).
  const raw = useMotionValue(0);
  const smooth = useSpring(raw, desktop ? HERO_SPRING_DESKTOP : GLIDE_SPRING);

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
    const syncVideo = (force = false) => {
      const dur = video.duration;
      if (!Number.isFinite(dur) || dur <= 0 || video.seeking) return;
      const t = Math.min(1, clamp01(smooth.get()) / filmEnd) * (dur - 0.05);
      if (force || Math.abs(t - video.currentTime) > FRAME) video.currentTime = t;
    };

    const render = () => {
      const v = smooth.get();
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
    render();

    const measureScheduler = createFrameScheduler(measure);
    const renderScheduler = createFrameScheduler(render);
    const unsubscribe = smooth.on('change', renderScheduler.schedule);
    const onScroll = measureScheduler.schedule;
    const onMetadata = () => {
      measure();
      renderScheduler.schedule();
    };
    const stopVideoDebug = startVideoFrameDebug('hero', video);

    // WebKit has historically needed one muted inline playback start before
    // currentTime seeks repaint. Keep that warm-up, but hide it and stop on
    // the first `playing` event so no autonomous frames are ever presented.
    let active = true;
    let primed = false;
    let priming = false;
    let revealTimer: number | undefined;
    const revealAtTarget = () => {
      if (!active) return;
      if (video.seeking) {
        video.addEventListener('seeked', revealAtTarget, { once: true });
        return;
      }
      video.style.visibility = '';
    };
    const haltPlayback = () => {
      if (!active) return;
      video.pause();
      syncVideo(true);
      if (priming) {
        priming = false;
        if (revealTimer !== undefined) window.clearTimeout(revealTimer);
        revealAtTarget();
      }
    };
    const prime = () => {
      if (primed) return;
      primed = true;
      priming = true;
      video.style.visibility = 'hidden';
      revealTimer = window.setTimeout(haltPlayback, 1000);
      const promise = video.play();
      promise?.then(haltPlayback).catch(() => {
        if (!active) return;
        primed = false;
        haltPlayback();
      });
    };
    const pauseWhenHidden = () => {
      if (document.hidden) haltPlayback();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    video.addEventListener('loadedmetadata', onMetadata);
    video.addEventListener('loadedmetadata', prime);
    video.addEventListener('playing', haltPlayback);
    window.addEventListener('pagehide', haltPlayback);
    document.addEventListener('visibilitychange', pauseWhenHidden);
    // A skipped-while-seeking frame could leave the film a step behind at
    // rest — re-check once each seek lands.
    const onSeeked = renderScheduler.schedule;
    video.addEventListener('seeked', onSeeked);
    prime();
    return () => {
      active = false;
      video.pause();
      unsubscribe();
      measureScheduler.cancel();
      renderScheduler.cancel();
      stopVideoDebug();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('loadedmetadata', prime);
      video.removeEventListener('playing', haltPlayback);
      window.removeEventListener('pagehide', haltPlayback);
      document.removeEventListener('visibilitychange', pauseWhenHidden);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('seeked', revealAtTarget);
      if (revealTimer !== undefined) window.clearTimeout(revealTimer);
      video.style.visibility = 'hidden';
    };
  }, [scrub, desktop, filmEnd, mediaTier, raw, smooth]);

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
              src={videoSrc}
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
