import { useEffect } from 'react';

/** Height of the sticky nav — anchor targets land just below it. */
const NAV_OFFSET = 68;

/**
 * Landing progress inside a pinned-reveal runway: past the last phase
 * ramp (0.88) so the scene arrives fully played, short of 1 so the
 * section hasn't started unpinning toward what follows it.
 */
const RUNWAY_SETTLE = 0.92;

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
      const rect = el.getBoundingClientRect();
      // Sections that pin under a scroll runway (data-pinned-reveal — the
      // finale) play their reveal across the runway, so landing at the top
      // would show the scene un-revealed. Land where it has fully played
      // instead. The runway check mirrors the component's measure(): when
      // the section is in-flow (phones, short windows) it doesn't trigger
      // and the anchor lands at the top as usual.
      const runway = 'pinnedReveal' in el.dataset ? rect.height - window.innerHeight : 0;
      const top =
        runway > window.innerHeight * 0.5
          ? rect.top + window.scrollY + runway * RUNWAY_SETTLE
          : Math.max(0, rect.top + window.scrollY - NAV_OFFSET);
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
