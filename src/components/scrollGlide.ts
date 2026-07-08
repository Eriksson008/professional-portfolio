import type { SpringOptions } from 'framer-motion';

/**
 * The shared spring behind every scroll-scrubbed scene (hero + finale).
 *
 * Raw scroll progress is only ever the spring's *target*; the sprung value
 * is what the CSS choreography vars and the film seeks actually read. That
 * gives the scrub real momentum: while scrolling the visuals trail the
 * finger by a beat, and when scrolling stops they keep gliding into place
 * for a few hundred milliseconds instead of freezing on the spot.
 *
 * Deliberately overdamped (damping ratio ≈ 1.3) — a scrubbed film must
 * never overshoot the scroll position and play backwards to correct.
 *
 * Tuning: feels laggy → stiffness 50–70, damping 18–22. Still too abrupt →
 * lower stiffness, nudge mass up. Keep it overdamped: damping ≥ 2·√(stiffness·mass).
 */
export const GLIDE_SPRING: SpringOptions = {
  stiffness: 26,
  damping: 14,
  mass: 1.1,
  restDelta: 0.0008,
};

/**
 * Desktop hero spring — tighter than the shared glide. On a mouse wheel the
 * raw target arrives in chunky notches; the very soft GLIDE_SPRING trails them
 * by ~1.5–2s and keeps gliding after the wheel stops, which reads as a
 * disconnected/stuttery scrub on desktop (a trackpad's continuous deltas hide
 * it — hence mobile feels fine). This firms the response to a ~0.7s settle so
 * the film tracks the wheel, while staying overdamped (ζ ≈ 1.29) so a scrubbed
 * film never overshoots and plays backwards. Used only on ≥720px in the hero;
 * mobile and the finale keep GLIDE_SPRING.
 */
export const HERO_SPRING_DESKTOP: SpringOptions = {
  stiffness: 60,
  damping: 20,
  mass: 1.0,
  restDelta: 0.0008,
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const lastLog: Record<string, number> = {};

/**
 * Dev-only glide telemetry (stripped from production builds). Watch the
 * console while scrolling: raw jumps with the wheel, smooth trails it and
 * keeps ticking briefly after raw stops.
 */
export function debugGlide(label: string, raw: number, smooth: number) {
  if (!import.meta.env.DEV) return;
  const now = performance.now();
  if (now - (lastLog[label] ?? 0) < 200) return;
  lastLog[label] = now;
  console.debug(`[glide:${label}] raw=${raw.toFixed(3)} smooth=${smooth.toFixed(3)}`);
}
