import { useEffect, useState } from 'react';

/**
 * True once an element has come within `margin` of the viewport, and true
 * forever after.
 *
 * The hero can afford to fetch its frames on mount because it is the thing the
 * reader is looking at. The chapters below it cannot: four sequences starting
 * at once would put ~14 MB and ~440 requests in flight while the reader is
 * still on the first screen, and the hero's own frames would be competing for
 * bandwidth with frames nobody has scrolled to.
 *
 * Gating on approach rather than on intersection is what keeps that invisible —
 * a chapter a viewport-and-a-half away has started loading by the time it
 * arrives. `AstronautFinale` already used this shape (`rootMargin: '200% 0px'`)
 * for its video; this is the same idea, reusable and unit-free at the call site.
 *
 * Latching is deliberate: a chapter scrolled past must not unload, or scrolling
 * back up would re-fetch a sequence the browser has already cached decodes for.
 *
 * Takes the **element**, not a ref. That is not a style preference: a ref
 * handed to a hook is still `null` on the first commit, and an effect keyed on
 * the ref object never re-runs to notice it was filled in afterwards. Under
 * StrictMode the effect is invoked twice and the second pass finds the element,
 * so the bug is invisible in development and the observer is simply never
 * created in production. Taking the element means the caller has to hold it in
 * state, which re-renders when it arrives — and that is the point.
 */
export function useNearViewport(element: Element | null, margin = '150% 0px'): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (near || !element) return;

    // No IntersectionObserver (or a test environment) — load rather than never
    // showing the chapter at all.
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, margin, near]);

  return near;
}
