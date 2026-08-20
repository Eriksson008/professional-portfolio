import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

type ManifestIcon = {
  src: string;
  sizes: string;
  type: string;
  purpose: 'any' | 'maskable';
};

type WebManifest = {
  id: string;
  background_color: string;
  theme_color: string;
  icons: ManifestIcon[];
};

const read = (path: string) => readFileSync(path, 'utf8');

function assertAppearanceMetadata(htmlPath: string) {
  const html = read(htmlPath);

  assert.match(html, /name="color-scheme" content="light dark"/);
  assert.match(html, /name="theme-color"[^>]+prefers-color-scheme: light/);
  assert.match(html, /name="theme-color"[^>]+prefers-color-scheme: dark/);
  assert.match(html, /rel="apple-touch-icon"/);
  assert.match(html, /rel="manifest"/);
}

function assertInstallIcons(manifestPath: string) {
  const manifest = JSON.parse(read(manifestPath)) as WebManifest;
  const declarations = new Set(manifest.icons.map((icon) => `${icon.purpose}:${icon.sizes}`));

  assert.ok(manifest.id, `${manifestPath} has a stable application id`);
  assert.match(manifest.background_color, /^#[0-9a-f]{6}$/i);
  assert.match(manifest.theme_color, /^#[0-9a-f]{6}$/i);
  assert.deepEqual(
    declarations,
    new Set(['any:192x192', 'any:512x512', 'maskable:192x192', 'maskable:512x512'])
  );

  for (const icon of manifest.icons) {
    assert.equal(icon.type, 'image/png');
    assert.ok(existsSync(`public/${icon.src}`), `${icon.src} exists`);
  }
}

test('public portfolio and Ask Fredrik publish system-aware browser metadata', () => {
  assertAppearanceMetadata('index.html');
  assertAppearanceMetadata('admin/ask-fredrik/index.html');

  const share = read('public/share.html');
  assert.match(share, /name="color-scheme" content="light dark"/);
  assert.match(share, /name="theme-color"[^>]+prefers-color-scheme: light/);
  assert.match(share, /name="theme-color"[^>]+prefers-color-scheme: dark/);
});

test('shared theme tokens provide intentional light and dark palettes', () => {
  const tokens = read('src/styles/tokens.css');
  const app = read('src/styles/app.css');

  assert.match(tokens, /color-scheme:\s*light;/);
  assert.match(tokens, /@media\s*\(prefers-color-scheme:\s*dark\)/);
  assert.match(tokens, /color-scheme:\s*dark;/);
  // Every cinematic surface is pinned dark in both appearances, so the film
  // runs as one uninterrupted black frame rather than inverting mid-narrative.
  // The chapters joined that list when the launch sequence was added; asserting
  // the whole set is what stops a new one being added and quietly inverting.
  // .site-footer is deliberately absent - it inverts with the document, by
  // decision, so the light appearance ends on paper rather than end credits.
  // The last selector in the list is followed by ` {`, not a comma, so the
  // block is matched whole rather than line by line.
  assert.match(tokens, /\.hero,\s*\n\.chapter,\s*\n\.finale,\s*\n\.nav,\s*\n\.dock\s*\{/);
  assert.match(app, /#root:empty\s*\{[^}]*background:\s*#000000;/s);
});

// The document sections must strictly alternate their surface, because the
// surface IS the boundary: the light appearance draws no rule between sections
// (--section-line is transparent there), so two adjacent sections sharing a
// background have nothing at all between them but whitespace.
//
// That is not hypothetical. highlights and systems were both tinted, and the
// only thing marking the seam was a hairline drawn across a field that was the
// same colour on both sides - a rule dividing nothing, which is what it looked
// like. Assigning the band by meaning rather than by position is what produced
// it, so this asserts position.
test('every document section alternates its surface', () => {
  const app = read('src/App.tsx');
  const main = app.slice(app.indexOf('<main>'), app.indexOf('</main>'));
  assert.ok(main.length > 0, 'App.tsx still renders a <main> block');

  // Components in render order, then only the ones that are a <Section>.
  // AstronautFinale and the chapters render their own cinematic shells and are
  // pinned dark in both appearances, so they are correctly skipped here.
  const rendered = [...main.matchAll(/<([A-Z][A-Za-z]*)\s*\/>/g)].map((m) => m[1]);
  const surfaces: { id: string; alt: boolean }[] = [];
  for (const name of rendered) {
    const path = `src/components/${name}.tsx`;
    if (!existsSync(path)) continue;
    const found = /<Section id="([^"]+)"([^>]*)>/.exec(read(path));
    if (!found) continue;
    surfaces.push({ id: found[1], alt: /\balt\b/.test(found[2]) });
  }

  assert.ok(surfaces.length >= 6, `expected the document sections, found ${surfaces.length}`);
  for (let i = 1; i < surfaces.length; i += 1) {
    const previous = surfaces[i - 1];
    const current = surfaces[i];
    assert.notEqual(
      current.alt,
      previous.alt,
      `"${previous.id}" and "${current.id}" are adjacent and both on ${
        current.alt ? 'the tinted band' : 'paper'
      } — with no rule between sections in light, that seam is invisible`
    );
  }

  // Starting on the tinted surface is what keeps the tint the minority one.
  assert.ok(surfaces[0].alt, `"${surfaces[0].id}" starts the alternation and should be tinted`);
});

test('portfolio and Ask Fredrik manifests separate standard and maskable install icons', () => {
  assertInstallIcons('public/site.webmanifest');
  assertInstallIcons('public/admin.webmanifest');
});

test('browser favicons are separate from opaque installed-app artwork', () => {
  const portfolio = read('index.html');
  const admin = read('admin/ask-fredrik/index.html');

  assert.match(portfolio, /favicon-32x32\.png/);
  assert.match(portfolio, /apple-touch-icon\.png/);
  assert.match(admin, /admin-icons\/favicon-32x32\.png/);
  assert.match(admin, /admin-icons\/apple-touch-icon\.png/);
});
