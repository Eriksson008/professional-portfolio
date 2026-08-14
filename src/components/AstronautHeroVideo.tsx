import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useVideoMediaTier } from './useDesktopViewport';
import { clamp01, mediaFrameDuration } from './scrollGlide';
import { useHeroRunway } from './useHeroRunway';
import { HeroShell } from './HeroShell';
import { type EncodeKey } from './heroVariant';
import { optimizedSource } from './heroVideoSources';

const POSTER_SRC = `${import.meta.env.BASE_URL}media/astronaut-hero-poster.jpg`;
const START_SRC = `${import.meta.env.BASE_URL}media/astronaut-hero-start.jpg`;

const FILM_END_DESKTOP = 0.78;
const FILM_END_PHONE = 0.94;

const VIDEO_FPS = 24;
/** One verified source frame — seeking finer than this is wasted decode. */
const FRAME = mediaFrameDuration(VIDEO_FPS);

/**
 * The optimized-encode video hero.
 *
 * This deliberately duplicates the seeking and priming behaviour of
 * `AstronautHero.tsx` rather than being extracted from it — the shipped hero is
 * the measurement baseline and has to stay untouched and instantly restorable.
 * The duplication is the price of a clean control, and it collapses if an
 * optimized encode is ever adopted.
 *
 * Because it is the *same* logic driven by the *same* runway, pointing this
 * component at the shipped file (`?enc=shipped`) isolates the encode as the
 * only variable between A1 and A2. Without that control, a difference between
 * the two could be the encode or could be the component.
 */
export function AstronautHeroVideo({ encode }: { encode: EncodeKey }) {
  const reduced = useReducedMotion();
  const mediaTier = useVideoMediaTier();
  const [failed, setFailed] = useState(false);
  const scrub = !reduced && !failed;

  const videoRef = useRef<HTMLVideoElement>(null);
  // The playhead lives in a ref, not a DOM attribute or React state: this is
  // read and written on every animation frame.
  const playhead = useRef(0);
  const videoSrc = optimizedSource(mediaTier, encode);
  const filmEnd = mediaTier !== 'small' ? FILM_END_DESKTOP : FILM_END_PHONE;

  // Seek only on whole-frame deltas, and never while a seek is in flight —
  // queueing sub-frame seeks just thrashes the decoder.
  const syncVideo = useCallback(
    (force = false) => {
      const video = videoRef.current;
      if (!video) return;
      const dur = video.duration;
      if (!Number.isFinite(dur) || dur <= 0 || video.seeking) return;
      const t = Math.min(1, clamp01(playhead.current) / filmEnd) * (dur - 0.05);
      if (force || Math.abs(t - video.currentTime) > FRAME) video.currentTime = t;
    },
    [filmEnd]
  );

  const onRender = useCallback(
    (p: number) => {
      playhead.current = p;
      syncVideo();
    },
    [syncVideo]
  );

  const { runwayRef, heroRef, settled } = useHeroRunway(scrub, onRender, `video:${encode}`);

  useEffect(() => {
    if (!scrub) return;
    const video = videoRef.current;
    if (!video) return;

    // WebKit has historically needed one muted inline playback start before
    // currentTime seeks repaint. Keep that warm-up, but hide it and stop on the
    // first `playing` event so no autonomous frames are ever presented.
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
      video.play()?.then(haltPlayback).catch(() => {
        if (!active) return;
        primed = false;
        haltPlayback();
      });
    };
    const pauseWhenHidden = () => {
      if (document.hidden) haltPlayback();
    };
    const onMetadata = () => syncVideo(true);

    video.addEventListener('loadedmetadata', onMetadata);
    video.addEventListener('loadedmetadata', prime);
    video.addEventListener('playing', haltPlayback);
    window.addEventListener('pagehide', haltPlayback);
    document.addEventListener('visibilitychange', pauseWhenHidden);
    prime();

    return () => {
      active = false;
      video.pause();
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('loadedmetadata', prime);
      video.removeEventListener('playing', haltPlayback);
      window.removeEventListener('pagehide', haltPlayback);
      document.removeEventListener('visibilitychange', pauseWhenHidden);
      video.removeEventListener('seeked', revealAtTarget);
      if (revealTimer !== undefined) window.clearTimeout(revealTimer);
      video.style.visibility = 'hidden';
    };
  }, [scrub, encode, mediaTier, syncVideo]);

  return (
    <HeroShell
      runwayRef={runwayRef}
      heroRef={heroRef}
      posterSrc={scrub ? START_SRC : POSTER_SRC}
      scrub={scrub}
      settled={settled}
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
    </HeroShell>
  );
}
