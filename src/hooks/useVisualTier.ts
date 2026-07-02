import { useEffect, useState } from 'react';

export type VisualTier = 'full' | 'lite' | 'off';

/** Narrowed view of non-standard navigator fields used for the capability probe. */
interface NavigatorProbe extends Navigator {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
}

function probeWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function decideTier(): VisualTier {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'off';
  // Small screens keep the lighter SVG/CSS treatment (mobile spine / tablet map).
  if (window.innerWidth < 900) return 'off';
  const nav = navigator as NavigatorProbe;
  if (nav.connection?.saveData) return 'off';
  if (!probeWebGL()) return 'off';
  const weak = (nav.hardwareConcurrency ?? 8) < 4 || (nav.deviceMemory ?? 8) < 4;
  return weak ? 'lite' : 'full';
}

/**
 * How much WebGL atmosphere this device should get: 'full', 'lite' (fewer
 * particles, dpr 1), or 'off' (reduced motion, small screens, no WebGL,
 * data-saver). Starts 'off' and only upgrades after first idle, so content
 * always paints before any 3D code is requested. Re-evaluates on resize.
 */
export function useVisualTier(): VisualTier {
  const [tier, setTier] = useState<VisualTier>('off');

  useEffect(() => {
    let idleId = 0;
    let timeoutId = 0;
    let resizeId = 0;

    const apply = () => setTier(decideTier());

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(apply, { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(apply, 350);
    }

    const onResize = () => {
      window.clearTimeout(resizeId);
      resizeId = window.setTimeout(apply, 250);
    };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      if (idleId) window.cancelIdleCallback(idleId);
      window.clearTimeout(timeoutId);
      window.clearTimeout(resizeId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return tier;
}
