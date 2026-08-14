import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { frameIndexForProgress, nearestLoaded } from './heroFrames.ts';

/** Minimal stand-in for HTMLImageElement's loaded-ness contract. */
const img = (loaded: boolean) =>
  ({ complete: loaded, naturalWidth: loaded ? 1440 : 0 }) as unknown as HTMLImageElement;

test('an exact loaded frame is used as-is', () => {
  const images = [img(true), img(true), img(true)];
  assert.equal(nearestLoaded(images, 1), images[1]);
});

// The whole point of the streaming loader: scrolling past the loaded tail
// shows a slightly stale frame rather than a blank canvas or a frozen scrub.
test('an unloaded frame falls back to the nearest loaded neighbour', () => {
  const images = [img(true), img(true), img(false), img(false)];
  assert.equal(nearestLoaded(images, 3), images[1]);
});

test('the nearer neighbour wins, and ties prefer the earlier frame', () => {
  const images = [img(true), img(false), img(false), img(false), img(true)];
  assert.equal(nearestLoaded(images, 2), images[0]);
  assert.equal(nearestLoaded(images, 3), images[4]);
});

test('a fully loaded sequence always returns the exact frame', () => {
  const images = Array.from({ length: 97 }, () => img(true));
  for (let i = 0; i < images.length; i += 1) {
    assert.equal(nearestLoaded(images, i), images[i]);
  }
});

test('nothing loaded yields null instead of throwing', () => {
  assert.equal(nearestLoaded([img(false), img(false)], 0), null);
  assert.equal(nearestLoaded([], 0), null);
});

// ---------------------------------------------------------------------------
// Generated-manifest integrity. These read the real manifests, so a
// regeneration that changed frame counts or dropped a tier fails the suite
// rather than silently breaking a candidate at runtime.
// ---------------------------------------------------------------------------

const manifest = (name: string) =>
  JSON.parse(readFileSync(`public/media/generated/${name}/manifest.json`, 'utf8'));

test('both sequences describe the same source film', () => {
  const a = manifest('astronaut-hero');
  const b = manifest('astronaut-hero-97');
  assert.equal(a.source.frames, 193);
  assert.equal(b.source.frames, 193);
  assert.equal(a.source.fps, b.source.fps);
  assert.equal(a.source.duration, b.source.duration);
});

test('the sequences differ in density and nothing else', () => {
  const a = manifest('astronaut-hero');
  const b = manifest('astronaut-hero-97');
  assert.equal(a.every, 1);
  assert.equal(b.every, 2);
  assert.equal(a.frameCount, 193);
  assert.equal(b.frameCount, 97);
  assert.equal(a.format, b.format);
  assert.equal(a.quality, b.quality);
  assert.deepEqual(
    a.tiers.map((t: { width: number }) => t.width),
    b.tiers.map((t: { width: number }) => t.width)
  );
});

// 193 = 2*96 + 1, so decimating by 2 lands exactly on frame 0 and frame 192.
// Even sampling and "every other frame" are the same operation here — which is
// why naive decimation is the correct choice rather than merely a cheap one.
test('decimation preserves both endpoints of the film', () => {
  const b = manifest('astronaut-hero-97');
  assert.equal((b.source.frames - 1) % b.every, 0);
  assert.equal((b.source.frames - 1) / b.every + 1, b.frameCount);
});

test('every tier reports the full frame count it claims', () => {
  for (const name of ['astronaut-hero', 'astronaut-hero-97']) {
    const m = manifest(name);
    for (const tier of m.tiers) {
      assert.equal(tier.count, m.frameCount, `${name} ${tier.dir}`);
      assert.ok(tier.bytes > 0, `${name} ${tier.dir} has bytes`);
    }
  }
});

// Both candidates must land on the same first and last frame at the same
// progress, or they are not showing the same film.
test('both sequences resolve identical endpoints from progress', () => {
  const a = manifest('astronaut-hero').frameCount;
  const b = manifest('astronaut-hero-97').frameCount;
  assert.equal(frameIndexForProgress(0, 0.78, a), 0);
  assert.equal(frameIndexForProgress(0, 0.78, b), 0);
  assert.equal(frameIndexForProgress(0.78, 0.78, a), a - 1);
  assert.equal(frameIndexForProgress(0.78, 0.78, b), b - 1);
});

test('the 97-frame sequence is materially lighter at every tier', () => {
  const a = manifest('astronaut-hero');
  const b = manifest('astronaut-hero-97');
  for (let i = 0; i < a.tiers.length; i += 1) {
    assert.ok(
      b.tiers[i].bytes < a.tiers[i].bytes * 0.6,
      `tier ${a.tiers[i].dir}: ${b.tiers[i].bytes} should be well under 60% of ${a.tiers[i].bytes}`
    );
  }
});
