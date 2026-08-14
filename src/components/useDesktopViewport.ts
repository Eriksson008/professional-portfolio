import { useEffect, useState } from 'react';

export type VideoMediaTier = 'small' | 'medium' | 'large';

export function videoMediaTierForWidth(width: number): VideoMediaTier {
  if (width >= 1200) return 'large';
  if (width >= 720) return 'medium';
  return 'small';
}

/** Responsive delivery tier: 720p phone, 1080p tablet/laptop, 1440p large desktop. */
export function useVideoMediaTier(): VideoMediaTier {
  const [tier, setTier] = useState<VideoMediaTier>(() =>
    typeof window === 'undefined' ? 'small' : videoMediaTierForWidth(window.innerWidth)
  );
  useEffect(() => {
    const medium = window.matchMedia('(min-width: 720px)');
    const large = window.matchMedia('(min-width: 1200px)');
    const onChange = () => setTier(large.matches ? 'large' : medium.matches ? 'medium' : 'small');
    medium.addEventListener('change', onChange);
    large.addEventListener('change', onChange);
    onChange();
    return () => {
      medium.removeEventListener('change', onChange);
      large.removeEventListener('change', onChange);
    };
  }, []);
  return tier;
}

// useDesktopViewport() lived here as a `useVideoMediaTier() !== 'small'`
// wrapper. Ask Fredrik was its only caller and now reads its shell from the
// same `(max-width: 719px)` query the stylesheet uses (useSheetViewport), so
// the wrapper is gone rather than left as a second, differently-spelled
// version of the same breakpoint for the next caller to reach for.
