import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_HERO_VARIANT,
  HERO_VARIANTS,
  heroVariantHref,
  heroVariantLabel,
  parseHeroVariant,
} from './heroVariant.ts';

test('no query string yields the shipped hero', () => {
  assert.equal(parseHeroVariant(''), 'video');
  assert.equal(parseHeroVariant(undefined), 'video');
  assert.equal(parseHeroVariant(null), 'video');
  assert.equal(DEFAULT_HERO_VARIANT, 'video');
});

test('each variant is selectable by name', () => {
  for (const variant of HERO_VARIANTS) {
    assert.equal(parseHeroVariant(`?hero=${variant}`), variant);
  }
});

test('the parameter is found alongside others, in any position', () => {
  assert.equal(parseHeroVariant('?utm=x&hero=frames'), 'frames');
  assert.equal(parseHeroVariant('?hero=interactive&utm=x'), 'interactive');
});

test('casing and stray whitespace still resolve', () => {
  assert.equal(parseHeroVariant('?hero=FRAMES'), 'frames');
  assert.equal(parseHeroVariant('?hero=%20Interactive%20'), 'interactive');
});

// The toggle must never be able to leave a visitor with no hero at all, so
// every unrecognised value resolves to the shipped implementation.
test('unknown and empty values fall back rather than failing', () => {
  assert.equal(parseHeroVariant('?hero=threejs'), 'video');
  assert.equal(parseHeroVariant('?hero='), 'video');
  assert.equal(parseHeroVariant('?hero'), 'video');
  assert.equal(parseHeroVariant('?hero=<script>'), 'video');
});

test('a search string without the parameter is left alone', () => {
  assert.equal(parseHeroVariant('?ref=linkedin'), 'video');
});

test('hrefs round-trip back to the variant they name', () => {
  for (const variant of HERO_VARIANTS) {
    assert.equal(parseHeroVariant(heroVariantHref(variant)), variant);
  }
});

test('the default variant gets a bare href, not a redundant parameter', () => {
  assert.equal(heroVariantHref('video'), '?');
});

test('every variant has a label for the dev switcher', () => {
  for (const variant of HERO_VARIANTS) {
    assert.ok(heroVariantLabel(variant).length > 0);
  }
});
