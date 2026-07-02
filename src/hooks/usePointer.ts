import { useEffect, useState } from 'react';

/**
 * Normalized pointer offset from viewport center, each component in -1..1.
 * Returns a steady {0,0} unless the device has a fine pointer and the user has
 * not requested reduced motion — so parallax never runs on touch or for
 * motion-sensitive users. rAF-throttled, passive listener.
 */
export function usePointer() {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fine =
      typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    let raf = 0;
    let nx = 0;
    let ny = 0;
    const onMove = (e: PointerEvent) => {
      nx = (e.clientX / window.innerWidth - 0.5) * 2;
      ny = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          setPointer({ x: nx, y: ny });
        });
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return pointer;
}
