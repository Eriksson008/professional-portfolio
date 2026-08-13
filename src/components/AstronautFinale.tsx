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
  inFlowMediaProgress,
  mediaFrameDuration,
  startVideoFrameDebug,
} from './scrollGlide';

// All-intra re-encodes (a keyframe every frame, ffmpeg -g 1) like the hero's —
// scroll-seeking a normal-GOP encode stutters. Responsive tiers are 1440p,
// 1080p, and 720p so tablets/laptops no longer pay large-desktop decode cost.
const VIDEO_SRC = `${import.meta.env.BASE_URL}media/astronaut-finale-scrub.mp4`;
const VIDEO_SRC_MD = `${import.meta.env.BASE_URL}media/astronaut-finale-scrub-md.mp4`;
const VIDEO_SRC_SM = `${import.meta.env.BASE_URL}media/astronaut-finale-scrub-sm.mp4`;
/** Lit final frame — what reduced-motion and load failure show. */
const POSTER_SRC = `${import.meta.env.BASE_URL}media/astronaut-finale-poster.jpg`;

const VIDEO_FPS = 24;
/** One verified source frame — seeking finer than this is wasted decode. */
const FRAME = mediaFrameDuration(VIDEO_FPS);

/**
 * Pinned mode: the film's reveal occupies the middle of the runway —
 * the text has landed before the light-play brightens, and the lit
 * frame holds while the CTAs arrive (phase ramps live in finale.css).
 */
const FILM_START = 0.18;
const FILM_END = 0.78;

/**
 * In-flow mode: a progress ramp completes when the measured element's
 * top has risen to this fraction of the viewport.
 */
const REVEAL_END = 0.18;

/**
 * Closing scene: the contact section (sheet 06) staged as a cinematic
 * ending that mirrors the hero's mechanic — the light-reveal film is
 * scrubbed by scroll. On desktop the scene **pins** (sticky under a
 * 200vh runway): the composition holds still while scroll plays it out
 * in phases — eyebrow, then headline and body, then the astronaut
 * lighting out of black on the right, then the CTAs, then a held beat
 * before the section unpins toward the footer. Scrolling back rewinds
 * it. One sprung progress value drives everything: the scroll handler
 * only moves spring targets (GLIDE_SPRING — overdamped, so the scrub
 * never overshoots and plays backwards), and the springs keep gliding
 * for a few hundred ms after scroll stops, writing the shown value to
 * the `--fp` custom property that the phase ramps in finale.css read,
 * plus the film seek time. The pin is CSS-gated to viewports
 * tall enough to fit the scene (see finale.css); everywhere else —
 * phones, short windows — the section stays in-flow: the text phases
 * map onto the section's travel through the viewport and the film onto
 * its own band's travel, so the reveal happens where the film actually
 * is. measure() detects which mode is active from the section's own
 * height, so JS and CSS can't disagree.
 *
 * The subject drifts across the frame during the reveal, so the film is
 * shown whole (16:9, never cover-cropped) as its own object: CTA column
 * on the left, film bleeding to the right viewport edge on desktop,
 * hung slightly low so the figure reads as emerging from the dark; a
 * full-width 16:9 band *below* the stacked content on phones, so the
 * contact actions never hide behind a viewport of video.
 *
 * The video is decorative (aria-hidden, muted, no controls, and never
 * allowed to free-run) and lazy: preload="metadata" until an
 * IntersectionObserver sees the section approaching, then the file is
 * loaded and invisibly primed for seeking.
 * Reduced-motion and load failure both get the lit poster still and
 * the fully-settled composition (`--fp` unset defaults every ramp
 * to 1), with no scroll animation at all.
 */
export function AstronautFinale() {
  const reduced = useReducedMotion();
  const mediaTier = useVideoMediaTier();
  const desktop = mediaTier !== 'small';
  const videoSrc =
    mediaTier === 'large' ? VIDEO_SRC : mediaTier === 'medium' ? VIDEO_SRC_MD : VIDEO_SRC_SM;
  const [failed, setFailed] = useState(false);
  const scrub = !reduced && !failed;

  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Scroll writes raw targets here; the springs' change streams (one tick
  // per animation frame, kept alive by framer-motion until they rest) are
  // what paint. Scene text and film band travel separately in in-flow
  // mode, so each gets its own spring.
  const raw = useMotionValue(0);
  const smooth = useSpring(raw, desktop ? HERO_SPRING_DESKTOP : GLIDE_SPRING);
  const filmRaw = useMotionValue(0);
  const filmSmooth = useSpring(filmRaw, desktop ? HERO_SPRING_DESKTOP : GLIDE_SPRING);

  useEffect(() => {
    if (!scrub) return;
    const section = sectionRef.current;
    const media = mediaRef.current;
    const video = videoRef.current;
    if (!section || !media || !video) return;

    let lastP = '';

    const travel = (top: number, vh: number) => {
      const range = vh * (1 - REVEAL_END);
      return range > 0 ? clamp01((vh - top) / range) : 1;
    };

    const measure = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const runway = rect.height - vh;
      if (runway > vh * 0.5) {
        // Pinned: one progress through the runway; the film occupies
        // its middle stretch so text lands first and the end holds.
        const target = clamp01(-rect.top / runway);
        raw.set(target);
        filmRaw.set(clamp01((target - FILM_START) / (FILM_END - FILM_START)));
      } else {
        // In-flow: text phases follow the section's travel into the
        // viewport; the film follows its own band's travel, because on
        // phones it now sits below the content.
        raw.set(travel(rect.top, vh));
        const mediaRect = media.getBoundingClientRect();
        filmRaw.set(inFlowMediaProgress(mediaRect.top, mediaRect.height, vh));
      }
    };

    // Seek only on whole-frame deltas, and never while a seek is in
    // flight — queueing sub-frame seeks just thrashes the decoder.
    const syncVideo = (force = false) => {
      const dur = video.duration;
      if (!Number.isFinite(dur) || dur <= 0 || video.seeking) return;
      // Once normal scrolling reaches the endpoint, land exactly on the
      // scrub-visible final frame instead of leaving the spring one frame shy.
      const progress = filmRaw.get() >= 1 ? 1 : clamp01(filmSmooth.get());
      const t = progress * (dur - 0.05);
      if (force || Math.abs(t - video.currentTime) > FRAME) video.currentTime = t;
    };

    const render = () => {
      const shown = clamp01(smooth.get());
      const p = shown.toFixed(4);
      if (p !== lastP) {
        lastP = p;
        section.style.setProperty('--fp', p);
      }
      syncVideo();
      debugGlide('finale', raw.get(), shown);
    };

    // A reload mid-page restores the scroll position — start settled there
    // instead of springing through the whole reveal.
    measure();
    smooth.jump(raw.get());
    filmSmooth.jump(filmRaw.get());
    render();

    const measureScheduler = createFrameScheduler(measure);
    const renderScheduler = createFrameScheduler(render);
    const unsubscribers = [
      smooth.on('change', renderScheduler.schedule),
      filmSmooth.on('change', renderScheduler.schedule),
    ];
    const onScroll = measureScheduler.schedule;
    const onMetadata = () => {
      measure();
      renderScheduler.schedule();
    };
    const stopVideoDebug = startVideoFrameDebug('finale', video);

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

    // The film sits at the page's end — don't pull megabytes with the
    // initial load. When the reader is within two viewports, warm it up.
    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!active || !entry.isIntersecting) return;
          video.preload = 'auto';
          video.load();
          prime();
          observer?.disconnect();
          observer = undefined;
        },
        { rootMargin: '200% 0px' }
      );
      observer.observe(section);
    } else {
      video.preload = 'auto';
      video.load();
      prime();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    video.addEventListener('loadedmetadata', onMetadata);
    video.addEventListener('playing', haltPlayback);
    window.addEventListener('pagehide', haltPlayback);
    document.addEventListener('visibilitychange', pauseWhenHidden);
    // A skipped-while-seeking frame could leave the film a step behind at
    // rest — re-check once each seek lands.
    const onSeeked = renderScheduler.schedule;
    video.addEventListener('seeked', onSeeked);
    return () => {
      active = false;
      video.pause();
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      measureScheduler.cancel();
      renderScheduler.cancel();
      stopVideoDebug();
      observer?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('playing', haltPlayback);
      window.removeEventListener('pagehide', haltPlayback);
      document.removeEventListener('visibilitychange', pauseWhenHidden);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('seeked', revealAtTarget);
      if (revealTimer !== undefined) window.clearTimeout(revealTimer);
      video.style.visibility = 'hidden';
      section.style.removeProperty('--fp');
    };
  }, [scrub, desktop, mediaTier, raw, smooth, filmRaw, filmSmooth]);

  return (
    <section
      id="contact"
      className="finale"
      ref={sectionRef}
      aria-label="Contact"
      data-pinned-reveal=""
    >
      <div className="finale-sticky">
        <div className="wrap finale-inner">
          <div className="finale-panel">
            <p className="sheet-mark">
              <span className="sheet-no">06</span>
              <span className="sheet-rule" aria-hidden="true" />
              <span className="sheet-eyebrow">Open to meaningful engineering work</span>
            </p>
            <h2 className="finale-title">
              Let&rsquo;s build something precise, intelligent, and polished.
            </h2>
            <p className="finale-body">
              I bring product sense, full-stack engineering, AI systems experience, and production
              discipline to teams building tools that need to feel effortless.
            </p>
            <p className="finale-roles">
              Open to Senior Software Engineer, Salesforce Engineer, Backend, Full-Stack, Cloud /
              Application Engineer, and technical-leadership-track opportunities.
            </p>
            <div className="finale-actions">
              <a
                className="btn btn-primary"
                href={`mailto:${profile.links.email}`}
                aria-label={`Email ${profile.name}`}
              >
                Contact Me
              </a>
              <a
                className="btn btn-ghost"
                href={profile.links.resume}
                target="_blank"
                rel="noopener"
                aria-label="View résumé (PDF)"
              >
                View R&eacute;sum&eacute;
              </a>
              <a
                className="btn btn-ghost"
                href={profile.links.github}
                target="_blank"
                rel="noopener"
                aria-label={`${profile.name} on GitHub`}
              >
                GitHub
              </a>
              <a
                className="btn btn-ghost"
                href={profile.links.linkedin}
                target="_blank"
                rel="noopener"
                aria-label={`${profile.name} on LinkedIn`}
              >
                LinkedIn
              </a>
            </div>
            <p className="finale-note">
              {profile.links.email} &middot; The r&eacute;sum&eacute; is a one-page PDF that mirrors
              this site: same facts, same numbers.
            </p>
            <p className="finale-repo">
              Source:{' '}
              <a href={profile.links.portfolioGithub} target="_blank" rel="noopener">
                Professional Portfolio on GitHub
              </a>
            </p>
          </div>

          <div className="finale-media" ref={mediaRef} aria-hidden="true">
            {scrub ? (
              <video
                ref={videoRef}
                src={videoSrc}
                muted
                playsInline
                preload="metadata"
                tabIndex={-1}
                onError={() => setFailed(true)}
              />
            ) : (
              <img src={POSTER_SRC} alt="" loading="lazy" />
            )}
            <div className="finale-scrim" />
          </div>
        </div>
      </div>
    </section>
  );
}
