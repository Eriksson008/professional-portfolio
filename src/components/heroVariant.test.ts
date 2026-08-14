import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_ENCODE,
  DEFAULT_HERO_VARIANT,
  ENCODE_KEYS,
  EXPENSIVE_VARIANTS,
  HERO_VARIANTS,
  effectiveHeroVariant,
  frameSequenceFor,
  heroVariantHref,
  heroVariantLabel,
  parseEncodeKey,
  parseHeroVariant,
} from './heroVariant.ts';

test('no query string yields the shipped hero', () => {
  assert.equal(parseHeroVariant(''), 'video-current');
  assert.equal(parseHeroVariant(undefined), 'video-current');
  assert.equal(parseHeroVariant(null), 'video-current');
  assert.equal(DEFAULT_HERO_VARIANT, 'video-current');
});

test('each variant is selectable by name', () => {
  for (const variant of HERO_VARIANTS) {
    assert.equal(parseHeroVariant(`?hero=${variant}`), variant);
  }
});

// Experiment 1's report, notes and benchmark scripts all reference these two
// names. Breaking them would make the first experiment unreproducible.
test('experiment names still resolve, including candidates not on main', () => {
  assert.equal(parseHeroVariant('?hero=video'), 'video-current');
  // frames-193 and interactive lost and live only on the experiment branches.
  // An old link should still land on the closest surviving candidate rather
  // than silently falling back to video.
  assert.equal(parseHeroVariant('?hero=frames'), 'frames-97');
  assert.equal(parseHeroVariant('?hero=frames-193'), 'frames-97');
  assert.equal(parseHeroVariant('?hero=interactive'), 'video-current');
});

test('the parameter is found alongside others, in any position', () => {
  assert.equal(parseHeroVariant('?utm=x&hero=frames-97'), 'frames-97');
  assert.equal(parseHeroVariant('?hero=video-optimized&utm=x'), 'video-optimized');
});

test('casing and stray whitespace still resolve', () => {
  assert.equal(parseHeroVariant('?hero=FRAMES-97'), 'frames-97');
  assert.equal(parseHeroVariant('?hero=%20Video-Optimized%20'), 'video-optimized');
});

// The toggle must never be able to leave a visitor with no hero at all, so
// every unrecognised value resolves to the shipped implementation.
test('unknown and empty values fall back rather than failing', () => {
  assert.equal(parseHeroVariant('?hero=threejs'), 'video-current');
  assert.equal(parseHeroVariant('?hero=frames-500'), 'video-current');
  assert.equal(parseHeroVariant('?hero='), 'video-current');
  assert.equal(parseHeroVariant('?hero'), 'video-current');
  assert.equal(parseHeroVariant('?hero=<script>'), 'video-current');
});

test('hrefs round-trip back to the variant they name', () => {
  for (const variant of HERO_VARIANTS) {
    assert.equal(parseHeroVariant(heroVariantHref(variant)), variant);
  }
});

test('the default variant gets a bare href, not a redundant parameter', () => {
  assert.equal(heroVariantHref('video-current'), '?');
});

test('every variant has a label for the dev switcher', () => {
  for (const variant of HERO_VARIANTS) {
    assert.ok(heroVariantLabel(variant).length > 0);
  }
});

// The two frame candidates must differ ONLY in which manifest they read; if
// they ever pointed at the same sequence the comparison would be vacuous.
test('the frame variant maps to its sequence, video variants to none', () => {
  assert.equal(frameSequenceFor('frames-97'), 'astronaut-hero-97');
  assert.equal(frameSequenceFor('video-current'), null);
  assert.equal(frameSequenceFor('video-optimized'), null);
});

// Every variant main offers must resolve to an asset that actually exists on
// the deployed site — a variant pointing at a sequence CI does not regenerate
// would 404 and silently fall back to the poster.
test('the only frame sequence referenced is the one CI regenerates', () => {
  const sequences = HERO_VARIANTS.map(frameSequenceFor).filter(Boolean);
  assert.deepEqual([...new Set(sequences)], ['astronaut-hero-97']);
});

test('encode override defaults, resolves, and rejects junk', () => {
  assert.equal(parseEncodeKey(''), DEFAULT_ENCODE);
  assert.equal(parseEncodeKey('?hero=video-optimized'), DEFAULT_ENCODE);
  assert.equal(parseEncodeKey('?enc=nonsense'), DEFAULT_ENCODE);
  for (const key of ENCODE_KEYS) {
    assert.equal(parseEncodeKey(`?hero=video-optimized&enc=${key}`), key);
  }
});

// enc=shipped is what makes A1-vs-A2 a controlled test: it renders the current
// file through the optimized component, so the encode is the only variable.
test('the shipped encode is addressable as a control', () => {
  assert.ok((ENCODE_KEYS as readonly string[]).includes('shipped'));
  assert.equal(parseEncodeKey('?enc=shipped'), 'shipped');
});

// ---------------------------------------------------------------------------
// Reduced motion. React.lazy fetches the chunk the moment its component
// renders, so the preference has to be resolved above the lazy boundary. These
// assert the guarantee for every variant, including ones added after this was
// written — a new expensive candidate wired past this gate fails here.
// ---------------------------------------------------------------------------

test('reduced motion collapses every variant to the cheap default', () => {
  for (const variant of HERO_VARIANTS) {
    assert.equal(effectiveHeroVariant(variant, true), DEFAULT_HERO_VARIANT);
  }
});

test('reduced motion never resolves to an expensive variant', () => {
  for (const variant of HERO_VARIANTS) {
    assert.ok(
      !EXPENSIVE_VARIANTS.includes(effectiveHeroVariant(variant, true)),
      `${variant} must not survive reduced motion`
    );
  }
});

test('the default variant is itself cheap — it is what reduced motion falls back to', () => {
  assert.ok(!EXPENSIVE_VARIANTS.includes(DEFAULT_HERO_VARIANT));
});

test('every non-default variant is classed expensive, so none survives reduced motion', () => {
  for (const variant of HERO_VARIANTS) {
    if (variant === DEFAULT_HERO_VARIANT) continue;
    assert.ok(EXPENSIVE_VARIANTS.includes(variant), `${variant} should be gated`);
    assert.notEqual(effectiveHeroVariant(variant, true), variant);
  }
});

test('without reduced motion the requested variant is honoured unchanged', () => {
  for (const variant of HERO_VARIANTS) {
    assert.equal(effectiveHeroVariant(variant, false), variant);
  }
});

// Reduced motion resolves to a variant with no frame sequence at all, which is
// what makes "zero frames fetched" structural rather than incidental.
test('the reduced-motion path reads no generated frame sequence', () => {
  assert.equal(frameSequenceFor(effectiveHeroVariant('frames-193', true)), null);
  assert.equal(frameSequenceFor(effectiveHeroVariant('interactive', true)), null);
});
