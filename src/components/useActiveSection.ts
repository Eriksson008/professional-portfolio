import { useEffect, useState } from 'react';

/**
 * Scroll-spy shared by the desktop header and the phone dock: reports the id
 * of the section currently holding the middle band of the viewport, or ''
 * before the first one gets there.
 *
 * IntersectionObserver only — no scroll handler, so navigation state costs
 * nothing per frame while the hero film is being scrubbed.
 *
 * `clearWhenNone` decides what happens when the reader is somewhere no
 * observed section covers — the opening film, above everything. The dock
 * wants '' there so its Home destination lights up; the desktop header keeps
 * its long-standing behaviour of holding the last section it saw.
 */
export function useActiveSection(ids: readonly string[], clearWhenNone = false): string {
  const [active, setActive] = useState('');
  // Module-level id lists are stable, but keying the effect on the joined
  // value keeps it honest if a caller ever passes a literal.
  const key = ids.join(',');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const targets = key
      .split(',')
      .filter(Boolean)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    // Ratios of everything currently in the band, so the winner can be
    // recomputed from entries that only report what changed.
    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) ratios.set(entry.target.id, entry.intersectionRatio);
          else ratios.delete(entry.target.id);
        }
        let best = '';
        let bestRatio = -1;
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            best = id;
            bestRatio = ratio;
          }
        }
        if (best !== '' || clearWhenNone) setActive(best);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [key, clearWhenNone]);

  return active;
}
