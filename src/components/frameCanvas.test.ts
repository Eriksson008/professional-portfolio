import assert from 'node:assert/strict';
import { test } from 'node:test';
import { drawBlendedFrame, quantiseBlend } from './frameCanvas.ts';
import { framePositionForProgress } from './heroFrames.ts';

/**
 * `drawBlendedFrame` is the pixel path for every scrubbed chapter on the page,
 * and it needs no real canvas to be checked: it only reads `width`/`height` off
 * the surface and calls `drawImage` / sets `globalAlpha` on the context. Stubs
 * record what it decided to draw, which is the part worth asserting — *which*
 * images, at *what* alpha, and when it correctly does nothing.
 */
interface Drawn {
  src: string;
  alpha: number;
}

const makeCanvas = (width = 1440, height = 810) => {
  const drawn: Drawn[] = [];
  const context = {
    globalAlpha: 1,
    drawImage(image: { src: string }) {
      drawn.push({ src: image.src, alpha: context.globalAlpha });
    },
  };
  const canvas = { width, height, getContext: () => context };
  return { canvas: canvas as unknown as HTMLCanvasElement, drawn };
};

/** A loaded frame. `loaded: false` models one that has not arrived yet. */
const img = (src: string, loaded = true) =>
  ({ src, complete: loaded, naturalWidth: loaded ? 1920 : 0, naturalHeight: loaded ? 1080 : 0 }) as unknown as HTMLImageElement;

const sequence = (n: number, loaded: (i: number) => boolean = () => true) =>
  Array.from({ length: n }, (_, i) => img(`frame-${i}`, loaded(i)));

test('blend is quantised, so a spring settling by a thousandth does not repaint', () => {
  assert.equal(quantiseBlend(0), 0);
  assert.equal(quantiseBlend(1), 1);
  // 24 steps: anything inside half a step lands on the same value.
  assert.equal(quantiseBlend(0.5), quantiseBlend(0.5 + 1 / 24 / 3));
  assert.notEqual(quantiseBlend(0.5), quantiseBlend(0.5 + 1 / 24));
  for (const v of [0, 0.13, 0.5, 0.87, 1]) {
    const q = quantiseBlend(v);
    assert.ok(q >= 0 && q <= 1, `quantised ${v} out of range: ${q}`);
  }
});

test('a whole-frame playhead draws exactly one image at full alpha', () => {
  const { canvas, drawn } = makeCanvas();
  const images = sequence(97);
  drawBlendedFrame(canvas, images, { index: 10, next: 11, blend: 0 }, null);
  assert.deepEqual(drawn, [{ src: 'frame-10', alpha: 1 }]);
});

test('a sub-frame playhead draws the base opaque and the next at the blend', () => {
  const { canvas, drawn } = makeCanvas();
  const images = sequence(97);
  drawBlendedFrame(canvas, images, { index: 10, next: 11, blend: 0.5 }, null);
  assert.equal(drawn.length, 2);
  assert.deepEqual(drawn[0], { src: 'frame-10', alpha: 1 });
  assert.equal(drawn[1].src, 'frame-11');
  assert.ok(Math.abs(drawn[1].alpha - 0.5) < 1e-9);
});

// The alpha has to be left clean for the next paint, or every subsequent draw
// inherits the last blend and the canvas washes out.
test('globalAlpha is restored to 1 after a blended draw', () => {
  const { canvas } = makeCanvas();
  const context = canvas.getContext('2d') as unknown as { globalAlpha: number };
  drawBlendedFrame(canvas, sequence(97), { index: 4, next: 5, blend: 0.4 }, null);
  assert.equal(context.globalAlpha, 1);
});

// Cross-fading to a frame that has not arrived would dissolve toward whatever
// distant neighbour nearestLoaded returned — a visible ghost, not a smoother step.
test('an unloaded next frame is not blended toward', () => {
  const { canvas, drawn } = makeCanvas();
  const images = sequence(97, (i) => i !== 11);
  drawBlendedFrame(canvas, images, { index: 10, next: 11, blend: 0.5 }, null);
  assert.deepEqual(drawn, [{ src: 'frame-10', alpha: 1 }]);
});

test('nothing is drawn when no frame near the playhead has arrived', () => {
  const { canvas, drawn } = makeCanvas();
  const images = sequence(97, () => false);
  const key = drawBlendedFrame(canvas, images, { index: 40, next: 41, blend: 0.3 }, 'previous');
  assert.equal(drawn.length, 0);
  assert.equal(key, 'previous', 'the cache key must survive a no-op draw');
});

test('drawing the same state twice is a no-op', () => {
  const { canvas, drawn } = makeCanvas();
  const images = sequence(97);
  const position = { index: 10, next: 11, blend: 0.25 };
  const key = drawBlendedFrame(canvas, images, position, null);
  const again = drawBlendedFrame(canvas, images, position, key);
  assert.equal(again, key);
  assert.equal(drawn.length, 2, 'the second call repainted');
});

// Regression: keying on the requested index repainted an identical bitmap for
// every index in a run that all resolved to the same neighbour while streaming.
test('a run of indices resolving to the same loaded frame repaints once', () => {
  const { canvas, drawn } = makeCanvas();
  // Only frame 0 has arrived, so every index falls back to it.
  const images = sequence(97, (i) => i === 0);
  let key: string | null = null;
  for (let i = 1; i < 8; i += 1) {
    key = drawBlendedFrame(canvas, images, { index: i, next: i + 1, blend: 0 }, key);
  }
  assert.equal(drawn.length, 1, `expected one paint, got ${drawn.length}`);
});

// A neighbour-substituted frame must not be mistaken for the exact one: when
// the real frame lands, the surface has to update.
test('the exact frame arriving replaces a substituted neighbour', () => {
  const { canvas, drawn } = makeCanvas();
  const images = sequence(97, (i) => i === 0);
  const position = { index: 3, next: 4, blend: 0 };
  const key = drawBlendedFrame(canvas, images, position, null);
  assert.deepEqual(drawn, [{ src: 'frame-0', alpha: 1 }]);
  images[3] = img('frame-3');
  drawBlendedFrame(canvas, images, position, key);
  assert.deepEqual(drawn[1], { src: 'frame-3', alpha: 1 });
});

// Two chapters draw the same sequence at different focal points on a phone;
// the key has to tell those apart or the second one keeps the first one's crop.
test('a change of focal point repaints', () => {
  const { canvas, drawn } = makeCanvas(390, 780);
  const images = sequence(97);
  const position = { index: 10, next: 11, blend: 0 };
  const key = drawBlendedFrame(canvas, images, position, null, { x: 0.5, y: 0.5 });
  const next = drawBlendedFrame(canvas, images, position, key, { x: 0.68, y: 0.58 });
  assert.notEqual(next, key);
  assert.equal(drawn.length, 2);
});

// End to end with the real mapping: the last frame must be drawn alone, with
// no attempt to dissolve past the end of the sequence.
test('the end of the film draws the true last frame and nothing after it', () => {
  const { canvas, drawn } = makeCanvas();
  const images = sequence(97);
  const position = framePositionForProgress(1, 0.8, images.length);
  drawBlendedFrame(canvas, images, position, null);
  assert.deepEqual(drawn, [{ src: 'frame-96', alpha: 1 }]);
});
