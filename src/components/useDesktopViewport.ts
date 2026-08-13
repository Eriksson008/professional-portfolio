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

/** True on ≥720px viewports; retained for non-media responsive behavior. */
export function useDesktopViewport() {
  return useVideoMediaTier() !== 'small';
}
