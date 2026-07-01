// Optimize hero-sequence frames: PNG sources -> web-ready WebP.
//
// Source PNGs live in `assets/hero-sequence/` (not deployed). This script writes
// resized, compressed WebP frames into `public/hero-sequence/` (what the site ships).
//
// Run after adding/replacing frames:  node scripts/optimize-frames.mjs
// Requires the dev-only `sharp` dependency.

import { readdir, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'assets', 'hero-sequence');
const outDir = path.join(root, 'public', 'hero-sequence');

// Frames are shown full-bleed; 1920 wide is plenty for a background layer.
const MAX_WIDTH = 1920;
const QUALITY = 78;

const files = (await readdir(srcDir)).filter((f) => f.toLowerCase().endsWith('.png')).sort();

if (files.length === 0) {
  console.error(`No PNG frames found in ${srcDir}`);
  process.exit(1);
}

await mkdir(outDir, { recursive: true });

let totalIn = 0;
let totalOut = 0;

for (const file of files) {
  const inPath = path.join(srcDir, file);
  const outPath = path.join(outDir, file.replace(/\.png$/i, '.webp'));

  const input = sharp(inPath);
  const meta = await input.metadata();
  const info = await input
    .resize({ width: Math.min(MAX_WIDTH, meta.width ?? MAX_WIDTH), withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(outPath);

  const inBytes = (await sharp(inPath).metadata()).size ?? 0;
  totalIn += inBytes;
  totalOut += info.size;
  console.log(
    `${file} -> ${path.basename(outPath)}  ${(inBytes / 1024).toFixed(0)}KB -> ${(info.size / 1024).toFixed(0)}KB`
  );
}

console.log(
  `\nDone: ${files.length} frames  ${(totalIn / 1024 / 1024).toFixed(2)}MB -> ${(totalOut / 1024 / 1024).toFixed(2)}MB`
);
