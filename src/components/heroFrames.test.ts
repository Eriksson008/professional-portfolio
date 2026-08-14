import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  type FrameTier,
  frameIndexForProgress,
  frameSrc,
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
