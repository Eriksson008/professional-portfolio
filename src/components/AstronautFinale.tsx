import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { profile } from '../data/profile';
import { useDesktopViewport } from './useDesktopViewport';

// All-intra re-encodes (a keyframe every frame, ffmpeg -g 1) like the hero's —
// scroll-seeking a normal-GOP encode stutters. Phones get the 720p variant.
const VIDEO_SRC = `${import.meta.env.BASE_URL}media/astronaut-finale-scrub.mp4`;
const VIDEO_SRC_SM = `${import.meta.env.BASE_URL}media/astronaut-finale-scrub-sm.mp4`;
/** Lit final frame — what reduced-motion and load failure show. */
const POSTER_SRC = `${import.meta.env.BASE_URL}media/astronaut-finale-poster.jpg`;

/** One frame of the 24fps film — seeking finer than this is wasted decode. */
const FRAME = 1 / 24;

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
 * Per-frame approach factor for the smoothed progress. Scroll input
 * moves the target; the shown value glides toward it and keeps easing
 * for a few frames after the scroll stops — gentle momentum, not lag.
 */
const GLIDE = 0.14;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Closing scene: the contact section (sheet 06) staged as a cinematic
 * ending that mirrors the hero's mechanic — the light-reveal film is
 * scrubbed by scroll. On desktop the scene **pins** (sticky under a
 * 200vh runway): the composition holds still while scroll plays it out
 * in phases — eyebrow, then headline and body, then the astronaut
 * lighting out of black on the right, then the CTAs, then a held beat
 * before the section unpins toward the footer. Scrolling back rewinds
 * it. One smoothed progress value drives everything: the scroll
 * handler only updates targets, and a rAF loop eases the shown value
 * toward them (and keeps easing briefly after scroll stops), writing
 * it to the `--fp` custom property that the phase ramps in finale.css
 * read, plus the film seek time. The pin is CSS-gated to viewports
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
 * The video is decorative (aria-hidden, muted, no controls, never
 * play()ed for playback — only primed once so mobile browsers paint
 * seeks) and lazy: preload="metadata" until an IntersectionObserver
 * sees the section approaching, then the decode pipeline warms up.
 * Reduced-motion and load failure both get the lit poster still and
 * the fully-settled composition (`--fp` unset defaults every ramp
 * to 1), with no scroll animation at all.
 */
export function AstronautFinale() {
  const reduced = useReducedMotion();
  const desktop = useDesktopViewport();
  const [failed, setFailed] = useState(false);
  const scrub = !reduced && !failed;

  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!scrub) return;
    const section = sectionRef.current;
    const media = mediaRef.current;
    const video = videoRef.current;
    if (!section || !media || !video) return;

    let raf = 0;
    let shown = 0;
    let filmShown = 0;
    let target = 0;
    let filmTarget = 0;

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
        target = clamp01(-rect.top / runway);
        filmTarget = clamp01((target - FILM_START) / (FILM_END - FILM_START));
      } else {
        // In-flow: text phases follow the section's travel into the
        // viewport; the film follows its own band's travel, because on
        // phones it now sits below the content.
        target = travel(rect.top, vh);
        filmTarget = travel(media.getBoundingClientRect().top, vh);
      }
    };

    const approach = (cur: number, tgt: number) => {
      const delta = tgt - cur;
      return Math.abs(delta) < 0.001 ? tgt : cur + delta * GLIDE;
    };

    const apply = () => {
      raf = 0;
      shown = approach(shown, target);
      filmShown = approach(filmShown, filmTarget);
      section.style.setProperty('--fp', shown.toFixed(4));
      // Seek only on whole-frame deltas, and never while a seek is in
      // flight — queueing sub-frame seeks just thrashes the decoder.
      const dur = video.duration;
      if (Number.isFinite(dur) && dur > 0 && !video.seeking) {
        const t = filmShown * (dur - 0.05);
        if (Math.abs(t - video.currentTime) > FRAME) video.currentTime = t;
      }
      if ((shown !== target || filmShown !== filmTarget) && !raf) {
        raf = requestAnimationFrame(apply);
      }
    };

    const onScroll = () => {
      measure();
      if (!raf) raf = requestAnimationFrame(apply);
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

    // The film sits at the page's end — don't pull megabytes with the
    // initial load. When the reader is within two viewports, warm it up.
    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          video.preload = 'auto';
          prime();
          observer?.disconnect();
          observer = undefined;
        },
        { rootMargin: '200% 0px' }
      );
      observer.observe(section);
    } else {
      prime();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    video.addEventListener('loadedmetadata', onScroll);
    // A skipped-while-seeking frame could leave the film a step behind at
    // rest — re-check once each seek lands.
    video.addEventListener('seeked', onScroll);
    onScroll();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      video.removeEventListener('loadedmetadata', onScroll);
      video.removeEventListener('seeked', onScroll);
      section.style.removeProperty('--fp');
    };
  }, [scrub]);

  return (
    <section id="contact" className="finale" ref={sectionRef} aria-label="Contact">
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
              Application Engineer, and Tech Lead-track opportunities.
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
                src={desktop ? VIDEO_SRC : VIDEO_SRC_SM}
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
