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
  // The last selector in the list is followed by ` {`, not a comma, so the
  // block is matched whole rather than line by line.
  assert.match(tokens, /\.hero,\s*\n\.chapter,\s*\n\.finale,\s*\n\.nav,\s*\n\.dock\s*\{/);
  assert.match(app, /#root:empty\s*\{[^}]*background:\s*#000000;/s);
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
