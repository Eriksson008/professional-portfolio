import { useEffect, useRef, useState } from 'react';

/**
 * Track scroll progress (0..1) through a tall, pinned section.
 *
 * Attach the returned `ref` to the tall outer element. Progress is 0 while the
 * element's top is at/under the viewport top, and reaches 1 once it has scrolled
 * up by (its height − one viewport). rAF-throttled, passive listeners.
 *
 * `interactive` is false when the user prefers reduced motion (or matchMedia is
 * unavailable) — callers should render a static fallback instead of scroll effects.
 */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>() {
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

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      if (distance <= 0) {
        setProgress(0);
        return;
      }
      const p = Math.min(1, Math.max(0, -rect.top / distance));
      setProgress(p);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return { ref, progress, interactive };
}
