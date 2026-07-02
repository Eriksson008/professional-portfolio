import { useEffect, useRef, useState } from 'react';

/**
 * Scroll progress (0..1) through a tall pinned section, lerp-smoothed each frame so
 * motion feels eased rather than step-wise (igloo-style "super-smooth scroll").
 *
 * Attach `ref` to the tall outer element. A rAF loop runs only while the smoothed
 * value is catching up to the scroll target, then stops. `interactive` is false under
 * prefers-reduced-motion — callers render a static fallback.
 */
export function useSmoothProgress<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);
  const [interactive, setInteractive] = useState(true);

  useEffect(() => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setInteractive(false);
      return;
    }

    const node = ref.current;
    if (!node) return;

    let target = 0;
    let current = 0;
    let raf = 0;
    let running = false;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      target = distance <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / distance));
    };

    const tick = () => {
      current += (target - current) * 0.12;
      if (Math.abs(target - current) < 0.0002) {
        current = target;
        running = false;
        setProgress(current);
        return;
      }
      setProgress(current);
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const onScroll = () => {
      measure();
      start();
    };

    measure();
    current = target;
    setProgress(current);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return { ref, progress, interactive };
}
