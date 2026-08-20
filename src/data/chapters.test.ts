import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
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
  const CHAPTERS = 4;
  const ids = [...source.matchAll(/^\s{2}id: '([^']+)'/gm)].map((m) => m[1]);
  assert.equal(ids.length, CHAPTERS, `expected ${CHAPTERS} chapters, found ${ids.length}`);
  assert.equal(new Set(ids).size, ids.length, 'two chapters share an anchor id');
  for (const field of ['sequence', 'label', 'title', 'eyebrow']) {
    // The trailing quote matters: without it this also matches the `Chapter`
    // interface's own `field: string;` declarations and every count is one high.
    const n = [...source.matchAll(new RegExp(`^\\s{2}${field}: '`, 'gm'))].length;
    assert.equal(n, CHAPTERS, `${field} is set on ${n} chapters, expected ${CHAPTERS}`);
  }
  // poster and start are built by the media() helper rather than written as
  // literals, so they are counted by their call rather than by a quote.
  for (const field of ['poster', 'start']) {
    const n = [...source.matchAll(new RegExp(`^\\s{2}${field}: media\\(`, 'gm'))].length;
    assert.equal(n, CHAPTERS, `${field} is set on ${n} chapters, expected ${CHAPTERS}`);
  }
  // Every chapter must read a distinct sequence. Two chapters pointing at one
  // manifest is the duplicate-plate mistake this narrative already made once,
  // when the person-reveal ran in both chapter 02 and the contact scene.
  const seqs = [...source.matchAll(/^\s{2}sequence: '([^']+)'/gm)].map((m) => m[1]);
  assert.equal(new Set(seqs).size, seqs.length, `two chapters share a sequence: ${seqs.join(', ')}`);
});

// Chapter copy is public-facing text in a public repo, and the repo's rule is
// that only git-verifiable or directly documented figures may appear.
//
// The guard is "no digits at all" rather than "no digit that isn't a
// highlight". Checking against highlight values is far too weak: highlights
// contain 1, 3 and 7, so "took 3 weeks" or "one of 7 tools" would pass while
// being exactly the invented figure the rule exists to stop. Every real figure
// on these chapters is rendered from `liftoffFigures()`, so prose has no
// legitimate reason to carry a number, and the strict form is both simpler and
// harder to slip past.
test('chapter prose states no figures — every number goes through highlights.ts', () => {
  // Beat copy is nested one level deeper than chapter copy, so both indents are
  // matched. Missing the nested form would leave a whole beat unchecked, which
  // is exactly what happened when the ascent chapter gained one.
  //
  // Both quote styles are matched, and the count is asserted against the number
  // of declarations rather than a floor. A single-quote-only pattern with a
  // `>= 8` floor silently skips any body rewritten with an apostrophe — the
  // string drops out of `copy`, the floor still passes, and an unverifiable
  // figure ships. Comparing to `declared` makes a missed string fail loudly.
  const declared = [...source.matchAll(/^\s{2,6}(?:title|body):\s*["'`]/gm)].length;
  const copy = [...source.matchAll(/^\s{2,6}(?:title|body):\s*(?:'([^']*)'|"([^"]*)")/gm)].map(
    (m) => m[1] ?? m[2]
  );
  assert.equal(
    copy.length,
    declared,
    `${declared - copy.length} chapter string(s) were not readable by this test — a quote style it does not parse (a template literal, for instance) would go unchecked`
  );
  assert.ok(copy.length >= 8, `expected title+body for 4 chapters, found ${copy.length}`);
  assert.ok(highlights.length > 0, 'highlights.ts is empty; the figures have nowhere to come from');
  for (const line of copy) {
    const digits = line.match(/\d/g);
    assert.equal(
      digits,
      null,
      `chapter prose contains a figure ("${line.slice(0, 60)}…"). Put it in highlights.ts and render it as a figure instead.`
    );
  }
});

// --- beat windows -----------------------------------------------------------
//
// A chapter whose film is one continuous move carries its copy as beats that
// fade through on windows of the same scroll. The windows are what keep the
// hand-over legible, so they are asserted rather than eyeballed against a
// scrubbing canvas.

// `from:` only ever appears inside a beat, so the whole source can be scanned
// without having to match the enclosing array — which is both simpler and
// immune to how the array happens to be formatted.
const beatWindows = () => [...source.matchAll(/^\s{6}from:\s*([\d.]+)/gm)].map((m) => Number(m[1]));

test('every beat window is inside the runway', () => {
  for (const from of beatWindows()) {
    assert.ok(from > 0 && from < 1, `beat starts at ${from}, outside 0..1`);
  }
});

test('beats start in order, and late enough for the one before to have been read', () => {
  const froms = beatWindows();
  let previous = 0;
  for (const from of froms) {
    assert.ok(from > previous, `beat at ${from} does not follow the one at ${previous}`);
    // A beat needs roughly a third of the runway to arrive, hold and hand over.
    assert.ok(from - previous >= 0.25, `only ${(from - previous).toFixed(2)} of runway before ${from}`);
    previous = from;
  }
});

// The last beat must still have room to arrive before the film stops moving —
// `filmEnd` defaults to 0.8, and copy landing after that would appear over a
// frozen frame.
test('the last beat arrives before the film ends', () => {
  const froms = beatWindows();
  if (froms.length === 0) return;
  assert.ok(Math.max(...froms) < 0.7, 'the final beat arrives too late in the runway');
});

// --- the media a chapter names must actually exist ---------------------------
//
// This is the gap that let a chapter degrade silently. `chapters.ts` names a
// sequence, `scripts/generate-hero-media.mjs` generates one, and nothing tied
// the two together: rename it in one place and CI still generates media, the
// build still passes, and `--check` still reports "present" — because it
// validates the generator's own list against itself. At runtime the manifest
// 404s, `useHeroFrames` reports failed, scrub turns off, and the chapter falls
// back to a static poster that still looks deliberate. Nothing goes red.
const repoFile = (rel: string) => new URL(`../../${rel}`, import.meta.url);
const generatorSource = read('../../scripts/generate-hero-media.mjs');

const chapterSequences = () =>
  [...source.matchAll(/^\s{2}sequence: '([^']+)'/gm)].map((m) => m[1]);

test('every chapter sequence has a tracked manifest that declares real frames', () => {
  const sequences = chapterSequences();
  assert.ok(sequences.length > 0, 'no chapter sequences found');
  for (const name of sequences) {
    const manifestPath = repoFile(`public/media/generated/${name}/manifest.json`);
    assert.ok(existsSync(manifestPath), `no tracked manifest for sequence "${name}"`);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    assert.equal(manifest.name, name, `manifest for "${name}" calls itself "${manifest.name}"`);
    assert.ok(manifest.frameCount > 1, `"${name}" declares ${manifest.frameCount} frames`);
    assert.ok(manifest.tiers?.length > 0, `"${name}" declares no tiers`);
    for (const tier of manifest.tiers) {
      assert.equal(
        tier.count,
        manifest.frameCount,
        `"${name}" tier w${tier.width} declares ${tier.count} frames but the sequence has ${manifest.frameCount}`
      );
    }
  }
});

test('every chapter sequence is one the generator actually builds', () => {
  for (const name of chapterSequences()) {
    assert.ok(
      generatorSource.includes(`name: '${name}'`),
      `"${name}" is not in SEQUENCES in scripts/generate-hero-media.mjs, so CI will never generate it`
    );
  }
});

test('every chapter poster and start still is present', () => {
  // These are what the reader sees before frames arrive and instead of them
  // under reduced motion, so a missing one is a blank chapter, not a slow one.
  //
  // Written as regex literals rather than built with `new RegExp` from a
  // template: in a template literal `\s` is an unrecognised escape and JS
  // silently drops the backslash, so the pattern matched a literal "s" and the
  // test found nothing while looking like it passed its own shape.
  const fields = [
    { name: 'poster', re: /^\s{2}poster: media\('([^']+)'\)/gm },
    { name: 'start', re: /^\s{2}start: media\('([^']+)'\)/gm },
  ];
  for (const { name, re } of fields) {
    const files = [...source.matchAll(re)].map((m) => m[1]);
    assert.ok(files.length > 0, `no ${name} entries found`);
    for (const file of files) {
      assert.ok(existsSync(repoFile(`public/media/${file}`)), `missing public/media/${file}`);
    }
  }
});
