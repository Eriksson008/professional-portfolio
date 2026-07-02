/**
 * Per-frame motion input for the WebGL scene, written by the hero as a
 * mutable ref so no React state crosses into the canvas at 60fps.
 */
export interface HeroMotion {
  /** Smoothed scroll progress through the hero, 0..1. */
  progress: number;
  /** Normalized pointer offset from viewport center, -1..1. */
  px: number;
  py: number;
}
