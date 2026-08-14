import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

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
 *
 * It also marks every sibling of the sheet `inert`, which is what actually
 * makes the sheet modal. Moving focus back inside whenever a control unmounts
 * itself works, but it is a rule each future control has to remember: forget
 * it once and focus lands on <body>, outside the keydown-scoped Tab trap, and
 * the next Tab walks into the page behind an opaque sheet. `inert` is
 * structural instead of preventive — the background cannot take focus, a
 * pointer, or a screen-reader cursor no matter where focus ends up.
 *
 * @param sheetRoot the assistant's own root; everything beside it goes inert.
 */
export function useSheetViewport(active: boolean, sheetRoot: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active) return;

    const root = document.documentElement;
    root.classList.add('af-open');

    // Ordering note: AskFredrik parks focus inside the panel in a *layout*
    // effect, and React runs every layout effect before any passive one — so
    // focus is already inside the sheet before this runs. Were it the other
    // way round, inerting an ancestor of the focused element would drop focus
    // to <body> at exactly the moment we are trying to contain it.
    const inerted: HTMLElement[] = [];
    const siblings = sheetRoot.current?.parentElement?.children;
    for (const node of Array.from(siblings ?? [])) {
      // Skip anything already inert for its own reasons — restoring on cleanup
      // must put the page back exactly as it was found, not as we assume.
      if (node === sheetRoot.current || !(node instanceof HTMLElement)) continue;
      if (node.hasAttribute('inert')) continue;
      node.setAttribute('inert', '');
      inerted.push(node);
    }
    const restore = () => {
      for (const node of inerted) node.removeAttribute('inert');
      root.classList.remove('af-open', 'af-kb');
      root.style.removeProperty('--af-vh');
      root.style.removeProperty('--af-vt');
    };

    const vv = window.visualViewport;
    if (!vv) return restore;

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
      restore();
    };
  }, [active, sheetRoot]);
}

/**
 * Back-gesture dismissal for the phone sheet.
 *
 * Before this, the site created no history entries at all — useAnchorGlide
 * only ever calls replaceState — so pressing Back with the sheet open left the
 * site entirely. On a full-screen surface that is the gesture people reach for
 * first, and the × was the only way out (the backdrop is unreachable: the
 * sheet covers the whole visible viewport).
 *
 * Opening pushes one entry, so Back — and the iOS edge-swipe that maps to it —
 * closes the sheet. Closing any other way takes that entry back out, so Back
 * never has to be pressed twice to leave the page.
 */
export function useSheetHistory(active: boolean, close: () => void) {
  // The panel's own `close` is recreated per render; keep the listener stable
  // so it is bound once per open rather than re-bound on every keystroke.
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!active) return;
    let ours = true;
    history.pushState({ askFredrik: true }, '', '#ask');

    const onPop = () => {
      // The browser has already popped our entry; don't try to pop it again.
      ours = false;
      closeRef.current();
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
      // Closed by the × , Escape, or a resize to the desktop shell — the entry
      // is still on the stack, so retire it. The popstate this triggers has no
      // listener left, which is what stops it looping back into close().
      if (ours) history.back();
    };
  }, [active]);
}
