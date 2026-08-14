import { useEffect } from 'react';

/**
 * Height of an on-screen keyboard that is covering the layout viewport,
 * published as --kb-inset on <html> (unset when there is none).
 *
 * iOS keeps fixed elements pinned to the *layout* viewport, so an open
 * keyboard slides over anything anchored to the bottom — the assistant's
 * input included. visualViewport reports the difference; anything anchored
 * low adds --kb-inset to stay above it.
 *
 * Only a clearly keyboard-sized inset counts: collapsing browser chrome
 * moves these numbers by tens of pixels on every scroll, and reacting to
 * that would make the bottom of the page twitch as you read.
 */
const KEYBOARD_MIN = 120;

export function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    let last = 0;

    const sync = () => {
      const covered = window.innerHeight - vv.height - vv.offsetTop;
      const inset = covered > KEYBOARD_MIN ? Math.round(covered) : 0;
      if (inset === last) return;
      last = inset;
      if (inset > 0) root.style.setProperty('--kb-inset', `${inset}px`);
      else root.style.removeProperty('--kb-inset');
    };

    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
      root.style.removeProperty('--kb-inset');
    };
  }, []);
}
