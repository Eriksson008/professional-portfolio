import type { Variants } from 'framer-motion';

/** Matches --ease in tokens.css. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Same trigger geometry as the old IntersectionObserver reveal. */
export const VIEWPORT = { once: true, amount: 0.12, margin: '0px 0px -8% 0px' } as const;

/** Whole-section entrance: fade + rise. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/** Section-header orchestration: children cascade in. */
export const headerStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.06 } },
};

/** Header child: rise + sharpen from a subtle blur. */
export const headerItem: Variants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(5px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: EASE } },
};

/** The sheet rule draws from its left edge. */
export const ruleDraw: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 0.6, ease: EASE } },
};
