import { useEffect, useRef, useState } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { profile } from '../data/profile';
import { headerStagger, headerItem, VIEWPORT } from './motion';
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
 * Pinned mode: the film completes at this fraction of the runway; the
 * remainder is a hold where the lit scene stays put before unpinning.
 */
const FILM_END = 0.8;

/**
 * In-flow mode: the reveal completes when the section top has risen to
 * this fraction of the viewport.
 */
const REVEAL_END = 0.18;

/**
 * Closing scene: the contact section (sheet 06) staged as a cinematic
 * ending that mirrors the hero's mechanic — the light-reveal film is
 * scrubbed by scroll. On desktop the scene **pins** (sticky under a
 * 230vh runway, like the hero): the CTA column and film hold still on
 * screen while scrolling lights the astronaut out of black, holds the
 * lit frame for the last stretch of the runway, then unpins toward the
 * footer. Scrolling back re-darkens it. The pin is CSS-gated to
 * viewports tall enough to fit the scene (see finale.css); everywhere
 * else — phones, short windows — the section stays in-flow and progress
 * maps onto its travel through the viewport instead. measure() detects
 * which mode is active from the section's own height, so JS and CSS
 * can't disagree.
 *
 * The subject drifts across the frame during the reveal, so the film is
 * shown whole (16:9, never cover-cropped) as its own object: CTA column
 * on the left, film bleeding to the right viewport edge on desktop; a
 * full-width 16:9 band above the stacked content on phones.
 *
 * The video is decorative (aria-hidden, muted, no controls, never
 * play()ed for playback — only primed once so mobile browsers paint
 * seeks) and lazy: preload="metadata" until an IntersectionObserver
 * sees the section approaching, then the decode pipeline warms up.
 * Reduced-motion and load failure both get the lit poster still.
 */
export function AstronautFinale() {
  const reduced = useReducedMotion();
  const desktop = useDesktopViewport();
  const [failed, setFailed] = useState(false);
  const scrub = !reduced && !failed;

  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!scrub) return;
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    let raf = 0;
    let shown = 0;
    let target = 0;

    const measure = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const runway = rect.height - vh;
      if (runway > vh * 0.5) {
        // Pinned: progress through the runway, film done by FILM_END.
        const p = Math.min(1, Math.max(0, -rect.top / runway));
        target = Math.min(1, p / FILM_END);
      } else {
        // In-flow: progress = the section's travel into the viewport.
        const range = vh * (1 - REVEAL_END);
        target = range > 0 ? Math.min(1, Math.max(0, (vh - rect.top) / range)) : 1;
      }
    };

    const apply = () => {
      raf = 0;
      const delta = target - shown;
      shown = Math.abs(delta) < 0.001 ? target : shown + delta * 0.2;
      // Seek only on whole-frame deltas, and never while a seek is in
      // flight — queueing sub-frame seeks just thrashes the decoder.
      const dur = video.duration;
      if (Number.isFinite(dur) && dur > 0 && !video.seeking) {
        const t = shown * (dur - 0.05);
        if (Math.abs(t - video.currentTime) > FRAME) video.currentTime = t;
      }
      if (shown !== target && !raf) raf = requestAnimationFrame(apply);
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
    };
  }, [scrub]);

  return (
    <section id="contact" className="finale" ref={sectionRef} aria-label="Contact">
      <div className="finale-sticky">
        <div className="wrap finale-inner">
          <div className="finale-media" aria-hidden="true">
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

          <m.div
            className="finale-panel"
            variants={headerStagger}
            initial={reduced ? false : 'hidden'}
            whileInView="show"
            viewport={VIEWPORT}
          >
            <m.p className="sheet-mark" variants={headerItem}>
              <span className="sheet-no">06</span>
              <span className="sheet-rule" aria-hidden="true" />
              <span className="sheet-eyebrow">Open to meaningful engineering work</span>
            </m.p>
            <m.h2 className="finale-title" variants={headerItem}>
              Let&rsquo;s build something precise, intelligent, and polished.
            </m.h2>
            <m.p className="finale-body" variants={headerItem}>
              I bring product sense, full-stack engineering, AI systems experience, and production
              discipline to teams building tools that need to feel effortless.
            </m.p>
            <m.p className="finale-roles" variants={headerItem}>
              Open to Senior Software Engineer, Salesforce Engineer, Backend, Full-Stack, Cloud /
              Application Engineer, and Tech Lead-track opportunities.
            </m.p>
            <m.div className="finale-actions" variants={headerItem}>
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
            </m.div>
            <m.p className="finale-note" variants={headerItem}>
              {profile.links.email} &middot; The r&eacute;sum&eacute; is a one-page PDF that mirrors
              this site: same facts, same numbers.
            </m.p>
            <m.p className="finale-repo" variants={headerItem}>
              Source:{' '}
              <a href={profile.links.portfolioGithub} target="_blank" rel="noopener">
                Professional Portfolio on GitHub
              </a>
            </m.p>
          </m.div>
        </div>
      </div>
    </section>
  );
}
