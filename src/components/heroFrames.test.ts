import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  type FrameTier,
  containRect,
  coverRect,
  frameIndexForProgress,
  framePositionForProgress,
  frameSrc,
  frameWindow,
  manifestUrl,
  tierForWidth,
} from './heroFrames.ts';

const tier = (width: number, over: Partial<FrameTier> = {}): FrameTier => ({
  width,
  height: Math.round((width * 9) / 16),
  dir: `w${width}`,
  pattern: 'frame-%04d.webp',
  count: 193,
  bytes: 0,
  ...over,
});

const FILM_END = 0.78;

test('progress zero shows the true first frame', () => {
  assert.equal(frameIndexForProgress(0, FILM_END, 193), 0);
});

// The settled helmet is the frame every fallback shows, so the film must
// actually reach it rather than stopping one short.
test('the film reaches its true last frame at the film end, and holds', () => {
  assert.equal(frameIndexForProgress(FILM_END, FILM_END, 193), 192);
  assert.equal(frameIndexForProgress(0.9, FILM_END, 193), 192);
  assert.equal(frameIndexForProgress(1, FILM_END, 193), 192);
});

test('the midpoint of the film lands mid-sequence', () => {
  assert.equal(frameIndexForProgress(FILM_END / 2, FILM_END, 193), 96);
});

test('progress is clamped, so overscroll and rubber-banding cannot go out of range', () => {
  assert.equal(frameIndexForProgress(-0.5, FILM_END, 193), 0);
  assert.equal(frameIndexForProgress(12, FILM_END, 193), 192);
});

test('degenerate manifests do not produce a negative or NaN index', () => {
  assert.equal(frameIndexForProgress(0.5, FILM_END, 0), 0);
  assert.equal(frameIndexForProgress(0.5, 0, 193), 192);
});

test('frame URLs are one-based and zero-padded to the manifest pattern', () => {
  assert.equal(frameSrc('/', 'astronaut-hero', tier(720), 0), '/media/generated/astronaut-hero/w720/frame-0001.webp');
  assert.equal(frameSrc('/', 'astronaut-hero', tier(720), 192), '/media/generated/astronaut-hero/w720/frame-0193.webp');
});

test('frame URLs respect a sub-path base, as GitHub Pages serves', () => {
  assert.equal(
    frameSrc('/professional-portfolio/', 'astronaut-hero', tier(1440), 0),
    '/professional-portfolio/media/generated/astronaut-hero/w1440/frame-0001.webp'
  );
  assert.equal(
    manifestUrl('/professional-portfolio/', 'astronaut-hero'),
    '/professional-portfolio/media/generated/astronaut-hero/manifest.json'
  );
});

test('a viewport takes the smallest tier that still covers it', () => {
  const tiers = [tier(1440), tier(720), tier(1080)];
  assert.equal(tierForWidth(tiers, 390)?.width, 720);
  assert.equal(tierForWidth(tiers, 720)?.width, 720);
  assert.equal(tierForWidth(tiers, 900)?.width, 1080);
  assert.equal(tierForWidth(tiers, 1280)?.width, 1440);
});

test('a viewport wider than every tier takes the largest rather than none', () => {
  assert.equal(tierForWidth([tier(1440), tier(720)], 3840)?.width, 1440);
});

test('an empty manifest yields no tier instead of throwing', () => {
  assert.equal(tierForWidth([], 1200), null);
});

// --- Sub-frame blending -----------------------------------------------------
//
// `frameIndexForProgress` rounds to the nearest frame, so between two frames
// the canvas shows a snapped still and the renderer skips the repaint entirely.
// At 97 frames over a multi-thousand-pixel runway that is ~30 px of scroll per
// step, which is exactly the stepping visible on slow scroll. `framePosition-
// ForProgress` keeps the fractional part so the renderer can cross-dissolve.

// `next` still points at the following frame here — `blend: 0` is what keeps it
// off the canvas. Only the final frame collapses `next` onto `index`, because
// there is nothing after it to dissolve toward.
test('a frame position on an exact frame boundary carries no blend', () => {
  const at = framePositionForProgress(0, FILM_END, 97);
  assert.equal(at.index, 0);
  assert.equal(at.blend, 0);
  assert.equal(at.next, 1);
});

test('a frame position between two frames carries the fraction toward the next', () => {
  // Half a frame step into a 97-frame sequence.
  const half = FILM_END * (0.5 / 96);
  const at = framePositionForProgress(half, FILM_END, 97);
  assert.equal(at.index, 0);
  assert.equal(at.next, 1);
  assert.ok(Math.abs(at.blend - 0.5) < 1e-9, `expected ~0.5, got ${at.blend}`);
});

test('the last frame is reached exactly and never blends past the end', () => {
  const at = framePositionForProgress(FILM_END, FILM_END, 97);
  assert.equal(at.index, 96);
  assert.equal(at.next, 96);
  assert.equal(at.blend, 0);
  const held = framePositionForProgress(1, FILM_END, 97);
  assert.equal(held.index, 96);
  assert.equal(held.blend, 0);
});

test('frame positions are clamped, so overscroll cannot index out of range', () => {
  const under = framePositionForProgress(-3, FILM_END, 97);
  assert.equal(under.index, 0);
  assert.equal(under.blend, 0);
  const over = framePositionForProgress(9, FILM_END, 97);
  assert.equal(over.index, 96);
  assert.equal(over.next, 96);
  assert.equal(over.blend, 0);
});

test('degenerate manifests do not produce NaN blends', () => {
  const empty = framePositionForProgress(0.5, FILM_END, 0);
  assert.equal(empty.index, 0);
  assert.equal(empty.blend, 0);
  const single = framePositionForProgress(0.5, FILM_END, 1);
  assert.equal(single.index, 0);
  assert.equal(single.next, 0);
  assert.equal(single.blend, 0);
  const noFilm = framePositionForProgress(0.5, 0, 97);
  assert.equal(noFilm.index, 96);
  assert.equal(noFilm.blend, 0);
});

// The whole point: the playhead has to advance continuously, not in steps.
test('the blended playhead is monotonic and strictly advances between frames', () => {
  const playhead = (p: number) => {
    const at = framePositionForProgress(p, FILM_END, 97);
    return at.index + at.blend;
  };
  let previous = -1;
  for (let step = 0; step <= 400; step += 1) {
    const value = playhead((step / 400) * FILM_END);
    assert.ok(value >= previous, `playhead went backwards at step ${step}`);
    previous = value;
  }
  // Two progress values inside one frame step must differ — that is the fix.
  const a = playhead(FILM_END * (0.25 / 96));
  const b = playhead(FILM_END * (0.75 / 96));
  assert.ok(b > a, 'playhead did not move within a single frame step');
});

test('the rounded index and the blended index agree on which frame is nearest', () => {
  for (let step = 0; step <= 200; step += 1) {
    const p = (step / 200) * FILM_END;
    const rounded = frameIndexForProgress(p, FILM_END, 97);
    const at = framePositionForProgress(p, FILM_END, 97);
    const nearest = at.blend >= 0.5 ? at.next : at.index;
    assert.equal(nearest, rounded, `disagreement at progress ${p}`);
  }
});

// --- cover fitting ----------------------------------------------------------

test('a wider-than-canvas image is cropped left and right, never letterboxed', () => {
  // 16:9 image into a 1:1 canvas — height fills, width overhangs symmetrically.
  const fit = coverRect(1000, 1000, 1920, 1080);
  assert.equal(fit.height, 1000);
  assert.ok(fit.width > 1000);
  assert.equal(fit.y, 0);
  assert.ok(fit.x < 0);
  assert.ok(Math.abs(fit.x + (fit.width - 1000) / 2) < 1e-9, 'overhang is not centred');
});

test('a taller-than-canvas image is cropped top and bottom', () => {
  const fit = coverRect(1600, 400, 1920, 1080);
  assert.equal(fit.width, 1600);
  assert.ok(fit.height > 400);
  assert.equal(fit.x, 0);
  assert.ok(fit.y < 0);
});

test('cover always covers: no gap on either axis, at any aspect ratio', () => {
  const canvases = [[1440, 900], [390, 844], [2560, 1080], [800, 800]];
  const images = [[3840, 2160], [1920, 1080], [1080, 1920], [960, 960]];
  for (const [cw, ch] of canvases) {
    for (const [iw, ih] of images) {
      const fit = coverRect(cw, ch, iw, ih);
      assert.ok(fit.width >= cw - 1e-9, `width gap at ${cw}x${ch} / ${iw}x${ih}`);
      assert.ok(fit.height >= ch - 1e-9, `height gap at ${cw}x${ch} / ${iw}x${ih}`);
      assert.ok(fit.x <= 1e-9 && fit.y <= 1e-9, `offset leaves a gap at ${cw}x${ch}`);
    }
  }
});

// An image element that has not decoded reports 0x0. Returning the canvas rect
// keeps the caller from computing Infinity and painting nothing.
test('an undecoded image does not produce an infinite scale', () => {
  const fit = coverRect(800, 600, 0, 0);
  assert.deepEqual(fit, { x: 0, y: 0, width: 800, height: 600 });
});

// --- sub-range windows ------------------------------------------------------

test('no range means the whole sequence', () => {
  assert.deepEqual(frameWindow(97), { from: 0, to: 96 });
});

test('a fractional range resolves to inclusive frame indices', () => {
  assert.deepEqual(frameWindow(97, [0, 0.68]), { from: 0, to: 65 });
  assert.deepEqual(frameWindow(97, [0.5, 1]), { from: 48, to: 96 });
});

// The split is expressed as fractions precisely so that regenerating the
// sequence at a different density keeps pointing at the same moment.
test('a range means the same moment at any sequence density', () => {
  const at97 = frameWindow(97, [0, 0.68]);
  const at193 = frameWindow(193, [0, 0.68]);
  assert.ok(Math.abs(at97.to / 96 - at193.to / 192) < 0.01, 'window drifted with density');
});

test('a reversed or collapsed range still yields a drawable window', () => {
  assert.deepEqual(frameWindow(97, [0.8, 0.2]), { from: 19, to: 77 });
  const collapsed = frameWindow(97, [0.4, 0.4]);
  assert.equal(collapsed.from, collapsed.to);
});

test('range fractions outside 0..1 are clamped rather than indexing off the end', () => {
  assert.deepEqual(frameWindow(97, [-2, 5]), { from: 0, to: 96 });
});

test('a degenerate sequence yields a zero-length window instead of -1', () => {
  assert.deepEqual(frameWindow(0, [0.2, 0.8]), { from: 0, to: 0 });
});

// --- focal point ------------------------------------------------------------
//
// Every plate composes its subject right of centre against an empty left half.
// A portrait crop that centres therefore loses the subject off the right edge,
// which is exactly what happened on a 390px viewport before this existed.

test('the default focal point is dead centre, matching object-fit: cover', () => {
  const centred = coverRect(1000, 1000, 1920, 1080);
  const explicit = coverRect(1000, 1000, 1920, 1080, 0.5, 0.5);
  assert.deepEqual(centred, explicit);
});

test('a right-biased focus pulls the subject back into a portrait crop', () => {
  // 16:9 plate into a tall phone viewport: most of the width is cropped away.
  const centred = coverRect(390, 780, 1920, 1080);
  const biased = coverRect(390, 780, 1920, 1080, 0.68, 0.44);
  // The subject at 68% of the image should land near the middle of the canvas.
  const subjectAt = (fit) => fit.x + 0.68 * fit.width;
  assert.ok(
    Math.abs(subjectAt(biased) - 195) < Math.abs(subjectAt(centred) - 195),
    'biasing did not move the subject closer to centre'
  );
});

test('a focal point can never pull an empty edge into frame', () => {
  for (const fx of [0, 0.2, 0.5, 0.8, 1]) {
    for (const fy of [0, 0.5, 1]) {
      const fit = coverRect(390, 780, 1920, 1080, fx, fy);
      assert.ok(fit.x <= 1e-9, `left gap at focusX ${fx}`);
      assert.ok(fit.y <= 1e-9, `top gap at focusY ${fy}`);
      assert.ok(fit.x + fit.width >= 390 - 1e-9, `right gap at focusX ${fx}`);
      assert.ok(fit.y + fit.height >= 780 - 1e-9, `bottom gap at focusY ${fy}`);
    }
  }
});

// --- contain fitting --------------------------------------------------------
//
// For plates whose subject is deliberately small: the receding orbiter ends at
// a few percent of frame width, and cover-cropping a 16:9 plate into a phone
// throws away the width the subject lives in. The chapter became an empty glow.

test('a contained plate fits entirely inside the canvas', () => {
  const fit = containRect(390, 780, 1920, 1080);
  assert.ok(fit.width <= 390 + 1e-9 && fit.height <= 780 + 1e-9, 'overflows the canvas');
  assert.ok(fit.x >= -1e-9 && fit.y >= -1e-9, 'starts outside the canvas');
  // 16:9 into a tall canvas: width is the limiting axis, so it fills it exactly.
  assert.ok(Math.abs(fit.width - 390) < 1e-9);
});

test('contain preserves aspect ratio, unlike a stretch', () => {
  for (const [cw, ch] of [[390, 780], [1440, 900], [800, 800]]) {
    const fit = containRect(cw, ch, 1920, 1080);
    assert.ok(Math.abs(fit.width / fit.height - 1920 / 1080) < 1e-9, `distorted at ${cw}x${ch}`);
  }
});

test('the anchor biases the band vertically, and is clamped', () => {
  const top = containRect(390, 780, 1920, 1080, 0);
  const middle = containRect(390, 780, 1920, 1080, 0.5);
  const bottom = containRect(390, 780, 1920, 1080, 1);
  assert.equal(top.y, 0);
  assert.ok(middle.y > top.y && bottom.y > middle.y, 'anchor did not move the band');
  assert.ok(Math.abs(bottom.y + bottom.height - 780) < 1e-9, 'anchor 1 does not sit flush');
  // Out-of-range anchors clamp rather than pushing the band off the surface.
  assert.deepEqual(containRect(390, 780, 1920, 1080, -3), top);
  assert.deepEqual(containRect(390, 780, 1920, 1080, 9), bottom);
});

test('contain and cover agree when the aspect ratios match', () => {
  const c = containRect(1920, 1080, 1920, 1080, 0.5);
  const v = coverRect(1920, 1080, 1920, 1080);
  assert.ok(Math.abs(c.width - v.width) < 1e-9 && Math.abs(c.height - v.height) < 1e-9);
});

test('an undecoded image does not produce an infinite contain scale', () => {
  assert.deepEqual(containRect(800, 600, 0, 0), { x: 0, y: 0, width: 800, height: 600 });
});
