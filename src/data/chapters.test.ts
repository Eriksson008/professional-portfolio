import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { highlights } from './highlights.ts';

/**
 * `chapters.ts` is asserted as source text rather than imported.
 *
 * It reads `import.meta.env.BASE_URL` and imports `./highlights` without a file
 * extension — both fine under Vite, neither resolvable by the node test runner.
 * `appearance.test.ts` already reads `tokens.css` this way for the same reason,
 * so this follows the pattern the repo already has rather than adding a bundler
 * to the test path or bending the source to suit the runner. `profile.ts` is
 * read the same way and for the same reason; `highlights.ts` imports cleanly
 * because it has no relative imports and touches no Vite globals.
 */
const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');
const source = read('./chapters.ts');
const profileSource = read('./profile.ts');

const labelsInSource = () => {
  const block = source.match(/liftoffFigureLabels\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(block, 'liftoffFigureLabels is no longer a literal array — update this test');
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
};

// The chapter references highlights by label instead of copying their values,
// so there is exactly one place a figure can be edited. That only holds while
// the labels resolve: a renamed highlight would otherwise drop silently out of
// the chapter, and the page would quietly show three figures instead of four.
test('every liftoff figure label resolves to a real highlight', () => {
  const labels = labelsInSource();
  assert.ok(labels.length > 0, 'no labels found');
  for (const label of labels) {
    const found = highlights.find((h) => h.label === label);
    assert.ok(found, `no highlight has the label "${label}"`);
    assert.ok(found.value.length > 0, `highlight "${label}" has no value to display`);
  }
});

test('the liftoff figures are distinct, so the chapter cannot show a duplicate', () => {
  const labels = labelsInSource();
  assert.equal(new Set(labels).size, labels.length);
});

// Chapter copy is compressed from profile.about rather than written fresh.
// This pins the compression to its source: if that paragraph is rewritten, the
// chapter claiming to summarise it should fail here rather than quietly start
// saying something the résumé no longer says.
test('the engineer chapter still summarises the paragraph it came from', () => {
  for (const phrase of ['mechanical engineering', 'technical drawings', 'buildable specifications']) {
    assert.ok(profileSource.includes(phrase), `profile.ts no longer contains "${phrase}"`);
    assert.ok(source.includes(phrase), `the engineer chapter no longer carries "${phrase}"`);
  }
});

test('every chapter names a sequence, an anchor id and an accessible label', () => {
  const ids = [...source.matchAll(/^\s{2}id: '([^']+)'/gm)].map((m) => m[1]);
  assert.equal(ids.length, 3, `expected 3 chapters, found ${ids.length}`);
  assert.equal(new Set(ids).size, ids.length, 'two chapters share an anchor id');
  for (const field of ['sequence', 'label', 'title', 'eyebrow']) {
    // The trailing quote matters: without it this also matches the `Chapter`
    // interface's own `field: string;` declarations and every count is 4.
    const n = [...source.matchAll(new RegExp(`^\\s{2}${field}: '`, 'gm'))].length;
    assert.equal(n, 3, `${field} is set on ${n} chapters, expected 3`);
  }
  // poster and start are built by the media() helper rather than written as
  // literals, so they are counted by their call rather than by a quote.
  for (const field of ['poster', 'start']) {
    const n = [...source.matchAll(new RegExp(`^\\s{2}${field}: media\\(`, 'gm'))].length;
    assert.equal(n, 3, `${field} is set on ${n} chapters, expected 3`);
  }
});

// Chapter copy is public-facing text in a public repo, and the repo's rule is
// that only git-verifiable or directly documented figures may appear. Copy is
// the easiest place to break that by accident, so any number written into a
// chapter title or body has to already exist in highlights.ts.
test('chapter copy introduces no figure that is not already a highlight', () => {
  const known = new Set(
    highlights.map((h) => h.value.replace(/[^0-9]/g, '')).filter(Boolean)
  );
  const copy = [...source.matchAll(/^\s{2}(?:title|body): '([^']*)'/gm)].map((m) => m[1]);
  assert.ok(copy.length >= 6, `expected title+body for 3 chapters, found ${copy.length}`);
  for (const line of copy) {
    for (const figure of line.match(/\d[\d,.]*/g) ?? []) {
      const bare = figure.replace(/[^0-9]/g, '');
      assert.ok(known.has(bare), `chapter copy states "${figure}", which is not in highlights.ts`);
    }
  }
});
