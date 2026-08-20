import { useEffect, useRef, useState } from 'react';
import {
  type FrameManifest,
  type FrameTier,
  frameSrc,
  frameWindow,
  manifestUrl,
  tierForWidth,
} from './heroFrames';

export { nearestLoaded } from './heroFrames';

export interface HeroFrames {
  /** Decoded-on-demand frame images, index-aligned with the manifest's count. */
  images: HTMLImageElement[];
  tier: FrameTier | null;
  manifest: FrameManifest | null;
  /** Enough of the sequence has arrived to reveal the canvas and start scrubbing. */
  ready: boolean;
  /** Every frame has arrived; the scrub is fully deterministic from here. */
  complete: boolean;
  /** 0..1 — how much of the sequence has loaded. */
  progress: number;
  failed: boolean;
}

const EMPTY: HeroFrames = {
  images: [],
  tier: null,
  manifest: null,
  ready: false,
  complete: false,
  progress: 0,
  failed: false,
};

/**
 * How many frames must land before the hero reveals.
 *
 * Experiment 1's loader fetched all 193 frames and revealed only when the last
 * one arrived, which cost 8-14 s over Fast 4G before the hero was usable at
 * all. It waited because a partially loaded sequence would skip over missing
 * frames — but the renderer can simply draw the nearest loaded frame instead,
 * which degrades to a slightly stale image for a moment rather than a stall.
 *
 * A first window sized to the opening of the film gets the hero live quickly;
 * the rest streams in behind it, and the reader has to scroll a long way before
 * they can outrun it.
 */
const REVEAL_WINDOW = 24;

/**
 * Concurrent image requests once the first window is in flight.
 *
 * Issuing all 193 at once lets the browser interleave them, so the frames the
 * reader needs first are not reliably the ones that arrive first. A modest cap
 * keeps the queue in index order, which is also scroll order.
 */
const CONCURRENCY = 8;

/**
 * Load a generated frame sequence.
 *
 * Frames are held as `HTMLImageElement`, not `ImageBitmap`, deliberately: 193
 * bitmaps at 1440x810 would pin roughly 900 MB of decoded RGBA and the browser
 * could not evict any of it. With `<img>` the browser owns the decode cache.
 * `decode()` is then called over a sliding window around the playhead so the
 * frames about to be drawn are already decoded and `drawImage` does not stall.
 */
/**
 * `range` limits which frames are fetched, for a chapter that plays only part
 * of a sequence.
 *
 * Taken as the same 0..1 fraction the renderer uses rather than as frame
 * numbers, because the frame count is not known until the manifest has been
 * fetched — the caller cannot resolve it, and resolving it in both places would
 * be two sources of truth for the same window. `frameWindow` does the
 * resolution here, against the tier this hook itself picked.
 *
 * The `images` array stays full length and index-aligned with the manifest, so
 * every consumer still addresses frames by absolute index; entries outside the
 * window are simply never given a `src`, and `nearestLoaded` already treats an
 * unloaded entry as not usable.
 *
 * Chapter 02 plays frames 0-65 of a 97-frame sequence, so without this it
 * downloaded 31 frames — about 0.8 MB at the desktop tier — it can never draw.
 */
export function useHeroFrames(
  name: string | null,
  enabled: boolean,
  range?: readonly [number, number]
): HeroFrames {
  const [state, setState] = useState<HeroFrames>(EMPTY);
  // Depend on the numbers, not the tuple identity, so an inline literal at the
  // call site cannot restart the load on every render.
  const rangeFrom = range?.[0];
  const rangeTo = range?.[1];

  useEffect(() => {
    if (!enabled || !name) {
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

      for (let i = 0; i < count; i += 1) {
        const image = new Image();
        image.decoding = 'async';
        images.push(image);
      }

      const { from: first, to: last } = frameWindow(
        count,
        rangeFrom === undefined || rangeTo === undefined ? undefined : [rangeFrom, rangeTo]
      );
      const wanted = last - first + 1;

      let settled = 0;
      let failures = 0;
      const revealAt = Math.min(REVEAL_WINDOW, wanted);

      const publish = () => {
        if (!active) return;
        setState({
          images,
          tier,
          manifest,
          ready: settled >= revealAt,
          complete: settled === wanted,
          progress: settled / wanted,
          failed: settled === wanted && failures === wanted,
        });
      };

      const fetchOne = (index: number) =>
        new Promise<void>((resolve) => {
          const image = images[index];
          const done = (ok: boolean) => {
            if (!ok) failures += 1;
            settled += 1;
            // Publish on the reveal boundary, on completion, and sparsely in
            // between — one setState per frame would re-render the tree 193
            // times during load.
            if (settled === revealAt || settled === wanted || settled % 24 === 0) publish();
            resolve();
          };
          image.addEventListener('load', () => done(true), { once: true });
          image.addEventListener('error', () => done(false), { once: true });
          image.src = frameSrc(base, name, tier, index);
        });

      // The opening window first, in parallel, so the hero reveals as early as
      // it can. Everything after it streams in index order behind a cap.
      await Promise.all(Array.from({ length: revealAt }, (_, i) => fetchOne(first + i)));
      if (!active) return;

      let next = first + revealAt;
      const worker = async () => {
        while (active && next <= last) {
          const index = next;
          next += 1;
          await fetchOne(index);
        }
      };
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));
      publish();
    };

    void load();
    return () => {
      active = false;
      // Drop the requests and let the browser reclaim the decodes.
      for (const image of images) image.src = '';
    };
  }, [name, enabled, rangeFrom, rangeTo]);

  return state;
}

/**
 * Keep a window of frames around the playhead decoded so the next few draws do
 * not stall on one.
 *
 * Imperative on purpose. The playhead moves every animation frame, and passing
 * it through React state would re-render the tree at display rate — the cost
 * this whole hero is built to avoid. The returned function is called from
 * inside the render loop instead, where the index already lives in a ref.
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
      const image = images[i];
      if (!image?.complete || image.naturalWidth === 0) continue;
      decoded.current.add(i);
      image.decode?.().catch(() => decoded.current.delete(i));
    }
  }).current;
}
