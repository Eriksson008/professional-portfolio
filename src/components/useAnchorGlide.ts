import { useEffect } from 'react';

/** Height of the sticky nav — anchor targets land just below it. */
const NAV_OFFSET = 68;

/**
 * JS-driven glide for same-page anchor links. Native hash navigation is an
 * unreliable IntersectionObserver trigger (mobile WebKit doesn't fire
 * observers on programmatic jumps, leaving whileInView sections invisible
 * until a real scroll), so anchors animate scrollTop through real frames —
 * every observer along the way fires. Reduced motion jumps instantly;
 * wheel or touch input cancels an in-flight glide.
 */
export function useAnchorGlide() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;

    const cancel = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
    };

    const glide = (to: number) => {
      cancel();
      const from = window.scrollY;
      const dist = to - from;
      if (Math.abs(dist) < 1) return;
      const dur = Math.min(1400, Math.max(500, Math.abs(dist) * 0.35));
      const t0 = performance.now();
      const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        window.scrollTo(0, from + dist * ease(t));
        raf = t < 1 ? requestAnimationFrame(step) : 0;
        if (!raf) cancel();
      };
      raf = requestAnimationFrame(step);
      window.addEventListener('wheel', cancel, { passive: true });
      window.addEventListener('touchstart', cancel, { passive: true });
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const link = (e.target as Element).closest?.('a[href^="#"]');
      if (!(link instanceof HTMLAnchorElement)) return;
      const id = decodeURIComponent(link.hash.slice(1));
      const el = id ? document.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();
      history.replaceState(null, '', `#${id}`);
      const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET);
      if (reduce.matches) {
        window.scrollTo(0, top);
      } else {
        glide(top);
      }
      // Keep keyboard/AT users where the page visually went.
      el.tabIndex = -1;
      el.focus({ preventScroll: true });
    };

    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      cancel();
    };
  }, []);
}
