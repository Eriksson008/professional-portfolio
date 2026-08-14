import { useEffect, useState } from 'react';

/** Below this, a shrunken visual viewport is browser chrome, not a keyboard. */
const KEYBOARD_MIN = 120;

/**
 * The assistant's shell breakpoint, written once.
 *
 * It must stay character-identical to the `@media` query in ask-fredrik.css.
 * Two spellings of the same boundary is not the same boundary: `(max-width:
 * 719px)` here against `(min-width: 720px)` there agree only at whole-pixel
 * widths, and browsers report fractional viewport widths under zoom and on
 * fractional device pixel ratios. At 719.2px *neither* matched, which handed
 * the desktop card the phone sheet's modal focus trap.
 */
const SHEET_QUERY = '(max-width: 719px)';

/** True when the phone sheet shell is the one CSS is rendering. */
export function useAskSheet(): boolean {
  const [sheet, setSheet] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(SHEET_QUERY).matches
  );
  useEffect(() => {
    const query = window.matchMedia(SHEET_QUERY);
    const sync = () => setSheet(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  return sheet;
}

/**
 * Publishes the *visible* viewport box while the assistant sheet is open, and
 * pins the page behind it.
 *
 *   --af-vh  visualViewport.height     the sheet's height
 *   --af-vt  visualViewport.offsetTop  the sheet's top
 *   .af-open on <html>                 page scroll lock (CSS scopes it to ≤719px)
 *   .af-kb   on <html>                 a keyboard is covering the layout viewport
 *
 * Sizing the sheet to the visible box is what keeps the composer above the
 * keyboard: nothing here guesses a keyboard height or subtracts a constant —
 * iOS reports how much room is actually left and the flex column re-solves.
 * The page lock is CSS-only (overflow:hidden) rather than the position:fixed
 * body trick on purpose: that trick zeroes window.scrollY, and this page
 * scrubs two videos off scrollY, so it would seek both films on open and
 * again on close. The sheet covers the whole visible viewport and contains
 * its own overscroll, so no page-scrolling gesture has anywhere to start.
 *
 * Only mounted while the sheet is open. Publishing these on every
 * visualViewport scroll all the time would invalidate document styles each
 * time the URL bar collapses — on a scroll-scrubbed page that is not free.
 */
export function useSheetViewport(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const root = document.documentElement;
    root.classList.add('af-open');

    const vv = window.visualViewport;
    if (!vv) return () => root.classList.remove('af-open');

    let frame = 0;
    const sync = () => {
      frame = 0;
      root.style.setProperty('--af-vh', `${Math.round(vv.height)}px`);
      root.style.setProperty('--af-vt', `${Math.round(vv.offsetTop)}px`);
      const covered = window.innerHeight - vv.height - vv.offsetTop;
      root.classList.toggle('af-kb', covered > KEYBOARD_MIN);
    };
    // Coalesce: iOS fires resize and scroll together as the keyboard animates.
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(sync);
    };

    sync();
    vv.addEventListener('resize', schedule);
    vv.addEventListener('scroll', schedule);
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      vv.removeEventListener('resize', schedule);
      vv.removeEventListener('scroll', schedule);
      root.classList.remove('af-open', 'af-kb');
      root.style.removeProperty('--af-vh');
      root.style.removeProperty('--af-vt');
    };
  }, [active]);
}
