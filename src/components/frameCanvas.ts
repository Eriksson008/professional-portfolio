import { type FramePosition, coverRect, nearestLoaded } from './heroFrames';

/**
 * The canvas half of the frame-sequence renderer, shared by every scrubbed
 * chapter so there is one draw path rather than one per section.
 *
 * Kept separate from the React components because it is the part that actually
 * touches pixels: the components own scroll, loading and layout, this owns what
 * lands on the surface.
 */

/**
 * Blend is quantised before it reaches the canvas.
 *
 * The spring publishes a new value on nearly every frame, and repainting for a
 * blend change of 0.001 costs two `drawImage` calls to produce an image nobody
 * can distinguish. 24 steps per frame interval is finer than the eye resolves
 * across a ~30 px scroll step and turns most spring settles into a no-op.
 */
const BLEND_STEPS = 24;

export const quantiseBlend = (blend: number) => Math.round(blend * BLEND_STEPS) / BLEND_STEPS;

/**
 * Draw a (possibly blended) frame, returning a key identifying what was drawn.
 *
 * Pass the previous key back in as `lastKey` and the call becomes a no-op when
 * the surface would not change — the same repaint-skipping the hero already
 * did, but keyed on the blended playhead rather than on image identity, so a
 * sub-frame move still repaints.
 *
 * Returns `lastKey` unchanged when nothing was drawn, so the caller can assign
 * unconditionally.
 */
export function drawBlendedFrame(
  canvas: HTMLCanvasElement,
  images: readonly HTMLImageElement[],
  position: FramePosition,
  lastKey: string | null
): string | null {
  const base = nearestLoaded(images, position.index);
  if (!base) return lastKey;

  const blend = quantiseBlend(position.blend);
  // Only dissolve toward a frame that has actually arrived. While the tail is
  // still streaming, `nearestLoaded` would hand back a distant neighbour, and
  // cross-fading to that is a visible ghost rather than a smoother step.
  const exactNext = images[position.next];
  const overlay =
    blend > 0 && position.next !== position.index && exactNext?.complete && exactNext.naturalWidth > 0
      ? exactNext
      : null;

  const key = `${position.index}:${overlay ? blend : 0}:${base.src}`;
  if (key === lastKey) return lastKey;

  const context = canvas.getContext('2d');
  if (!context) return lastKey;

  const paint = (image: HTMLImageElement) => {
    const { x, y, width, height } = coverRect(
      canvas.width,
      canvas.height,
      image.naturalWidth,
      image.naturalHeight
    );
    context.drawImage(image, x, y, width, height);
  };

  context.globalAlpha = 1;
  paint(base);
  if (overlay) {
    // source-over at alpha b composites to (1 - b)·base + b·overlay, which is
    // the linear interpolation we want.
    context.globalAlpha = blend;
    paint(overlay);
    context.globalAlpha = 1;
  }

  return key;
}
