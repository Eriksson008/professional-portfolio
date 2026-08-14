import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

/**
 * Text-contrast floor for the token palette.
 *
 * This exists because the failure it guards was invisible: --faint measured
 * 4.24-4.48:1 in the light appearance — under AA, but by so little that
 * nothing looked wrong on screen. It was found by computing the ratio, and
 * only a computed check can keep it found.
 *
 * Dark-appearance values are checked too, because the same tokens carry the
 * disclaimer text that failed at 2.62:1 there when it was dimmed with opacity.
 */

const AA_NORMAL = 4.5;

const css = readFileSync('src/styles/tokens.css', 'utf8');

/** Pull a token's value out of a block of :root declarations. */
function tokensIn(block: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const [, name, value] of block.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
    if (!found.has(name)) found.set(name, value.trim());
  }
  return found;
}

// The dark block re-declares a subset; everything else falls back to :root.
const darkStart = css.indexOf('@media (prefers-color-scheme: dark)');
assert.ok(darkStart > 0, 'tokens.css has a dark-appearance block');
const light = tokensIn(css.slice(0, darkStart));
const dark = new Map([...light, ...tokensIn(css.slice(darkStart))]);

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  assert.ok(match, `${hex} is a 6-digit hex colour`);
  const int = Number.parseInt(match[1], 16);
  const [r, g, b] = [(int >> 16) & 255, (int >> 8) & 255, int & 255];
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(fg: string, bg: string): number {
  const [a, b] = [luminance(fg), luminance(bg)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const resolve = (palette: Map<string, string>, name: string) => {
  const value = palette.get(name);
  assert.ok(value, `${name} is defined`);
  return value;
};

/**
 * Tokens that carry small text, against every opaque surface they can land on.
 * --ink-2 is the tightest of the light surfaces: it backs `.section-alt`, and
 * `.sheet-no` (--faint) and `.sheet-eyebrow` (--silver-2) both sit inside it.
 */
const TEXT_TOKENS = ['--text', '--muted', '--faint', '--silver', '--silver-2'];
const SURFACES = ['--black', '--ink', '--ink-2'];

for (const [appearance, palette] of [
  ['light', light],
  ['dark', dark],
] as const) {
  test(`${appearance} appearance: every text token clears AA on every surface`, () => {
    for (const token of TEXT_TOKENS) {
      for (const surface of SURFACES) {
        const ratio = contrast(resolve(palette, token), resolve(palette, surface));
        assert.ok(
          ratio >= AA_NORMAL,
          `${token} on ${surface} (${appearance}) is ${ratio.toFixed(2)}:1, needs ${AA_NORMAL}:1`
        );
      }
    }
  });
}

test('the quiet greys stay ordered: muted is never lighter than faint', () => {
  // Guards the hierarchy while fixing contrast — darkening --faint far enough
  // to pass could otherwise quietly invert the scale it belongs to.
  for (const [appearance, palette] of [
    ['light', light],
    ['dark', dark],
  ] as const) {
    const surface = luminance(resolve(palette, '--ink'));
    const distance = (token: string) =>
      Math.abs(luminance(resolve(palette, token)) - surface);
    assert.ok(
      distance('--muted') >= distance('--faint'),
      `${appearance}: --muted should sit at least as far from the surface as --faint`
    );
    assert.ok(
      distance('--text') > distance('--muted'),
      `${appearance}: --text should be the strongest of the three`
    );
  }
});
