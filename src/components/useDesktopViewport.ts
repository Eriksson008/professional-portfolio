import { useEffect, useState } from 'react';

/** True on ≥720px viewports — the breakpoint that picks the 1080p film encodes. */
export function useDesktopViewport() {
  const [desktop, setDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 720px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 720px)');
    const onChange = (e: MediaQueryListEvent) => setDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return desktop;
}
