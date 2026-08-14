import { useEffect, useRef, useState } from 'react';
import {
  type FrameManifest,
  type FrameTier,
  frameSrc,
  manifestUrl,
  tierForWidth,
} from './heroFrames';

export interface HeroFrames {
  /** Decoded-on-demand frame images, index-aligned with the manifest's count. */
  images: HTMLImageElement[];
  tier: FrameTier | null;
  manifest: FrameManifest | null;
  /** Every frame has arrived; the sequence can be revealed. */
  ready: boolean;
  /** 0..1 — how much of the sequence has loaded, for the loading state. */
  progress: number;
  failed: boolean;
}

const EMPTY: HeroFrames = {
  images: [],
  tier: null,
  manifest: null,
  ready: false,
  progress: 0,
  failed: false,
};

/**
 * Load a generated frame sequence.
 *
 * Frames are held as `HTMLImageElement`, not `ImageBitmap`, deliberately: 193
 * bitmaps at 1440x810 would pin roughly 900 MB of decoded RGBA, and the browser
 * cannot evict any of it. With `<img>` the browser owns the decode cache and
 * can drop what is off-screen. `decode()` is then called over a sliding window
 * around the playhead so the frames about to be drawn are already decoded and
 * `drawImage` does not stall on one.
 *
 * The whole sequence must arrive before the hero reveals — a partially loaded
 * scrub would jump over missing frames, which is worse than waiting on the
 * poster that is already painted underneath.
 */
export function useHeroFrames(name: string, enabled: boolean): HeroFrames {
  const [state, setState] = useState<HeroFrames>(EMPTY);

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY);
      return;
    }
    let active = true;
    const base = import.meta.env.BASE_URL;
    const images: HTMLImageElement[] = [];

    const load = async () => {
      let manifest: FrameManifest;
      try {
        const response = await fetch(manifestUrl(base, name));
        if (!response.ok) throw new Error(`manifest ${response.status}`);
        manifest = (await response.json()) as FrameManifest;
      } catch {
        if (active) setState({ ...EMPTY, failed: true });
        return;
      }
      if (!active) return;

      const tier = tierForWidth(manifest.tiers, window.innerWidth);
      const count = tier?.count ?? 0;
      if (!tier || count === 0) {
        setState({ ...EMPTY, manifest, failed: true });
        return;
      }

      let loaded = 0;
      let settled = 0;
      const onSettled = (ok: boolean) => {
        if (!active) return;
        settled += 1;
        if (ok) loaded += 1;
        // Re-render on a coarse cadence only: one setState per frame arrival
        // would be 193 renders of the tree during load.
        if (settled === count || settled % 12 === 0) {
          setState({
            images,
            tier,
            manifest,
            ready: settled === count && loaded === count,
            progress: settled / count,
            failed: settled === count && loaded !== count,
          });
        }
      };

      for (let index = 0; index < count; index += 1) {
        const image = new Image();
        image.decoding = 'async';
        image.addEventListener('load', () => onSettled(true), { once: true });
        image.addEventListener('error', () => onSettled(false), { once: true });
        image.src = frameSrc(base, name, tier, index);
        images.push(image);
      }
    };

    void load();
    return () => {
      active = false;
      // Drop the requests and let the browser reclaim the decodes.
      for (const image of images) image.src = '';
    };
  }, [name, enabled]);

  return state;
}

/**
 * Keep a window of frames around the playhead decoded so the next few draws do
 * not stall on one.
 *
 * Imperative on purpose. The playhead moves every animation frame, and passing
 * it through React state would re-render the tree at 60 Hz — the cost this
 * whole hero is built to avoid. The returned function is called from inside the
 * render loop instead, where the index already lives in a ref.
 *
 * Fire-and-forget: a rejected decode just means that frame draws a beat later.
 */
export function useDecodeWindow(radius = 8) {
  const decoded = useRef(new Set<number>());
  const source = useRef<HTMLImageElement[]>([]);

  return useRef((images: HTMLImageElement[], index: number) => {
    if (images !== source.current) {
      source.current = images;
      decoded.current.clear();
    }
    if (images.length === 0) return;
    const from = Math.max(0, index - radius);
    const to = Math.min(images.length - 1, index + radius);
    for (let i = from; i <= to; i += 1) {
      if (decoded.current.has(i)) continue;
      decoded.current.add(i);
      images[i]?.decode?.().catch(() => decoded.current.delete(i));
    }
  }).current;
}
