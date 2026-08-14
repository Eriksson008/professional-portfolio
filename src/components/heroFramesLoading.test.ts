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

test('the sequence describes the source film it was cut from', () => {
  const m = manifest('astronaut-hero-97');
  assert.equal(m.source.frames, 193);
  assert.equal(m.source.fps, 24);
  assert.ok(Math.abs(m.source.duration - 8.041667) < 0.001);
});

test('the shipped sequence is the half-density cut', () => {
  const m = manifest('astronaut-hero-97');
  assert.equal(m.every, 2);
  assert.equal(m.frameCount, 97);
  assert.equal(m.format, 'webp');
  assert.deepEqual(m.tiers.map((t) => t.width), [1440, 1080, 720]);
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
  const m = manifest('astronaut-hero-97');
  for (const tier of m.tiers) {
    assert.equal(tier.count, m.frameCount, tier.dir);
    assert.ok(tier.bytes > 0, tier.dir + ' has bytes');
  }
});

// Both candidates must land on the same first and last frame at the same
// progress, or they are not showing the same film.
test('progress resolves the true first and last frame', () => {
  const n = manifest('astronaut-hero-97').frameCount;
  assert.equal(frameIndexForProgress(0, 0.78, n), 0);
  assert.equal(frameIndexForProgress(0.78, 0.78, n), n - 1);
  assert.equal(frameIndexForProgress(1, 0.78, n), n - 1);
});

// The whole reason 97 frames won: roughly half the bytes of the full-density
// cut, which was 8.45 MB at w1440 and is measured in experiment 2.
test('the shipped tier stays materially lighter than the full-density cut', () => {
  const w1440 = manifest('astronaut-hero-97').tiers.find((t) => t.width === 1440);
  assert.ok(w1440.bytes < 8.45 * 1048576 * 0.6, 'w1440 should be well under 60% of 8.45 MB');
});
