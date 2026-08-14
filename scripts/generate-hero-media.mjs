#!/usr/bin/env node
// Regenerate the hero's derived media from the tracked masters in media-src/.
//
// These artifacts are deliberately NOT committed: ~10 MB of WebP frames and
// ~7 MB of MP4 in a public repo would be permanent (a force-push does not
// un-publish), and everything here is reproducible from media-src/, which IS
// tracked. The Pages workflow runs this before `vite build`, so the deployed
// site is complete while the repo stays clean.
//
// This lives in the repo rather than calling the workspace skills' scripts
// (../ai-workflows/skills/...) because CI checks out only this repository. The
// skills are the authoring tools; a build step has to be self-contained.
//
// Parameters below are the ones chosen by measurement in
// docs/cinematic-hero-benchmark-2.md. Changing them changes what was measured.
//
// Usage: node scripts/generate-hero-media.mjs [--force] [--check]
// Exit: 0 = assets present/created, 1 = failure, 2 = usage/tooling error.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const force = process.argv.includes('--force');
const checkOnly = process.argv.includes('--check');

const SOURCE = join(root, 'media-src/astronaut-hero-source.mp4');
const GENERATED = join(root, 'public/media/generated');
const SEQUENCE = 'astronaut-hero-97';
const VIDEO_DIR = join(GENERATED, 'astronaut-hero-video');

/** Every other source frame. 193 = 2*96 + 1, so this keeps frame 0 and frame 192. */
const EVERY = 2;
const TIERS = [1440, 1080, 720];
const WEBP_QUALITY = 82;

/** The optimized desktop encode: fewer pixels, not fewer bits — see the benchmark. */
const ENCODE = { name: 'hero_w1920_g1_crf23.mp4', width: 1920, crf: 23 };

const fmt = (b) => `${(b / 1048576).toFixed(2)} MB`;

function run(bin, args) {
  return execFileSync(bin, args, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
}

function requireFfmpeg() {
  try {
    const v = run('ffmpeg', ['-version']).toString().split('\n')[0];
    console.log(`ffmpeg: ${v}`);
  } catch {
    console.error('ffmpeg not found on PATH. Install it (ubuntu: apt-get install -y ffmpeg).');
    process.exit(2);
  }
}

if (!existsSync(SOURCE)) {
  console.error(`Missing master: ${SOURCE}\nIt is tracked in git — check the working tree.`);
  process.exit(2);
}

// The tracked manifest is the runtime contract: the hero reads frame count,
// tier widths and the filename pattern from it. Regenerating must satisfy it,
// so it is read as the specification rather than rewritten.
const manifestPath = join(GENERATED, SEQUENCE, 'manifest.json');
if (!existsSync(manifestPath)) {
  console.error(`Missing tracked manifest: ${manifestPath}`);
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

function tierComplete(width) {
  const tier = manifest.tiers.find((t) => t.width === width);
  if (!tier) return false;
  const dir = join(GENERATED, SEQUENCE, tier.dir);
  if (!existsSync(dir)) return false;
  return readdirSync(dir).filter((f) => f.endsWith('.webp')).length === tier.count;
}

const framesPresent = TIERS.every(tierComplete);
const encodePresent = existsSync(join(VIDEO_DIR, ENCODE.name));

if (checkOnly) {
  console.log(`frames: ${framesPresent ? 'present' : 'MISSING'}  encode: ${encodePresent ? 'present' : 'MISSING'}`);
  process.exit(framesPresent && encodePresent ? 0 : 1);
}

if (framesPresent && encodePresent && !force) {
  console.log('Hero media already present and complete. Nothing to do (--force to rebuild).');
  process.exit(0);
}

requireFfmpeg();

// ---------- frame sequence ----------
for (const width of TIERS) {
  const tier = manifest.tiers.find((t) => t.width === width);
  if (!tier) {
    console.error(`Manifest has no tier for width ${width}; it and this script disagree.`);
    process.exit(2);
  }
  const dir = join(GENERATED, SEQUENCE, tier.dir);
  if (tierComplete(width) && !force) {
    console.log(`  w${width} ... already complete (${tier.count} frames)`);
    continue;
  }
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  process.stdout.write(`  w${width} ... `);
  try {
    run('ffmpeg', [
      '-v', 'error', '-y', '-i', SOURCE,
      '-vf', `select='not(mod(n\\,${EVERY}))',scale=${width}:-2:flags=lanczos`,
      '-fps_mode', 'passthrough',
      '-c:v', 'libwebp', '-lossless', '0', '-quality', String(WEBP_QUALITY), '-preset', 'picture',
      join(dir, tier.pattern),
    ]);
  } catch (err) {
    console.error(`\nffmpeg failed for width ${width}:\n${err.stderr?.toString().slice(0, 800) ?? err.message}`);
    process.exit(1);
  }

  const files = readdirSync(dir).filter((f) => f.endsWith('.webp'));
  // A short sequence would silently skip frames at runtime; fail the build instead.
  if (files.length !== tier.count) {
    console.error(`\nExpected ${tier.count} frames at w${width}, produced ${files.length}. Refusing to ship a short sequence.`);
    process.exit(1);
  }
  const bytes = files.reduce((sum, f) => sum + statSync(join(dir, f)).size, 0);
  console.log(`${files.length} frames, ${fmt(bytes)}`);
}

// ---------- optimized desktop encode ----------
mkdirSync(VIDEO_DIR, { recursive: true });
const encodePath = join(VIDEO_DIR, ENCODE.name);
if (encodePresent && !force) {
  console.log(`  ${ENCODE.name} ... already present`);
} else {
  process.stdout.write(`  ${ENCODE.name} ... `);
  try {
    run('ffmpeg', [
      '-v', 'error', '-y', '-i', SOURCE, '-an',
      '-vf', `scale=${ENCODE.width}:-2:flags=lanczos`,
      '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
      '-crf', String(ENCODE.crf),
      // All-intra: every frame a keyframe, so a scroll-driven seek never has to
      // decode forward from a distant reference.
      '-g', '1', '-keyint_min', '1', '-sc_threshold', '0',
      '-x264-params', 'bframes=0:ref=1',
      '-movflags', '+faststart',
      encodePath,
    ]);
  } catch (err) {
    console.error(`\nffmpeg failed for the optimized encode:\n${err.stderr?.toString().slice(0, 800) ?? err.message}`);
    process.exit(1);
  }
  console.log(fmt(statSync(encodePath).size));
}

console.log('Hero media ready.');
