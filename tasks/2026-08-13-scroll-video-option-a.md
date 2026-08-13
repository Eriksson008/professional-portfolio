# Smooth scroll-video Option A

## Outcome

Make the astronaut hero and finale feel more consistently responsive while retaining the existing
MP4/Framer Motion architecture, exact choreography, visual quality, mobile fallbacks, and 4K masters.

## Problem

The delivery videos are already scrub-optimal GOP-1 H.264, but browser measurements still show
irregular paused-seek presentation. The finale is most affected: its two spring subscriptions can
request duplicate work in one display frame, its desktop spring trails coarse input, and 1440p
decoding presents fewer distinct frames than the existing 720p encode. Scroll geometry is also read
on every raw scroll event instead of being coalesced to the browser paint cadence.

## Scope

- Astronaut hero/finale scrub scheduling and development telemetry
- Shared scroll-glide utilities and tests
- Responsive media-tier selection
- New 1920×1080 all-intra derivatives generated from the tracked 4K masters
- Media/project documentation and the matching Second Brain note

## Non-goals

- Do not add GSAP, ScrollTrigger, canvas, WebGL/WebGPU, AI frame interpolation, or a new framework.
- Do not alter source masters, 24 fps cadence, choreography timing, posters, reduced-motion behavior,
  content, Ask Fredrik behavior, or unrelated user files.
- Do not commit, push, deploy, or delete existing media without separate explicit authorization.

## Acceptance criteria

- Raw scroll/resize geometry work is coalesced to at most one animation-frame callback.
- Hero/finale paint and seek work is coalesced to at most one animation-frame callback, including
  the finale's two springs.
- Desktop/tablet finale response uses the established tighter overdamped spring; phones retain the
  softer touch-oriented spring.
- Viewports below 720 px receive 720p, 720–1199 px receive 1080p, and at least 1200 px receive 1440p.
- New 1080p files remain H.264 High/yuv420p/BT.709, 24 fps, 193-frame GOP-1, faststart, and audio-free.
- Development-only presented-frame telemetry is observable without affecting production behavior.
- Tests cover scheduling and media-tier boundaries; supported verification and representative
  desktop/tablet/mobile/reduced-motion browser checks pass.
- Independent review reports no blocking issues.

## Relevant context

- `src/components/AstronautHero.tsx`
- `src/components/AstronautFinale.tsx`
- `src/components/scrollGlide.ts`
- `src/components/useDesktopViewport.ts`
- `public/media/`, `media-src/`
- `README.md`, `PROJECT_CONTEXT.md`

## Verification

- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify.ps1`
- ffprobe metadata/keyframe/faststart validation for both new files
- Browser validation at phone, tablet/medium, and large-desktop widths plus reduced motion
- Controlled `requestVideoFrameCallback()` presentation measurements
- Independent review

## Risks

- A 1080p middle tier may be visibly softer on high-DPR tablets if its decode benefit is small.
- Tighter finale response could feel abrupt on touch devices if applied below the phone breakpoint.
- Coalescing can leave a frame behind at rest unless seek completion schedules a final render.
- Added binaries increase repository and deployed artifact size even though each visitor downloads
  only one tier per film.

## Completion evidence

- Generated `astronaut-{hero,finale}-scrub-md.mp4` from the tracked 4K masters with the documented
  Lanczos/libx264 GOP-1 pipeline. ffprobe confirmed both are 1920×1080 H.264 High/yuv420p/BT.709,
  24 fps, 8.041667 s, 193 frames/193 keyframes, audio-free, and faststart (`moov` before `mdat`).
  Hero is 5,837,032 bytes (~36% below 1440p); finale is 4,039,765 bytes (~34% below 1440p).
- Controlled 1440×900 Chromium sweeps, fully buffered and with no long tasks: the same 1440p finale
  improved from 136 to 161 distinct presented frames (~18%), with >50 ms gaps falling from 5 to 2;
  hero improved from 137 to 143 frames. At 1024 px, 1080p and 1440p each presented 161–162 distinct
  finale frames, making the middle tier primarily a transfer/decode-headroom win without a measured
  presentation or visual-quality loss.
- Browser-verified 1440×900, 768×1024, and 390×844 plus reduced motion. Source selection was
  1440p/1080p/720p at the documented boundaries; rapid forward/reverse jumps and repeated
  719↔720↔1199↔1200 source changes kept both films paused, hidden priming never leaked, normal
  maximum scroll landed the finale at `duration - 0.05`, the layout had no horizontal overflow,
  and no console/runtime errors appeared. Representative tablet and phone screenshots were
  visually inspected; existing composition and sharpness were preserved.
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify.ps1` passed serially: lint,
  31 tests, TypeScript, and the production Vite build. An earlier parallel lint/admin-build run hit
  a generated-file replacement race; the supported serial gate passed after admin output stabilized.
- `npm run build:admin` passed. Worker `npm run check` and `npm test` passed 479 knowledge checks and
  54 admin-auth checks. The sibling résumé coherence check passed all 36 load-bearing terms and
  privacy/architecture checks. Second Brain quick content validation passed; its unrelated
  pre-existing generated index/maintenance-audit work was preserved.
- Independent review found a source-switch/priming lifecycle race; cleanup generation guards,
  defensive pause, pending-listener removal, and observer guarding were added. Re-review approved
  with no remaining blockers and confirmed no privacy, secret, chatbot, or mobile regressions.
- Real iPhone Safari/Home Screen behavior remains a post-release device check. If optimized MP4 is
  still visibly insufficient there, evaluate Option B: a progressively loaded, memory-windowed
  canvas/frame sequence.
- Released in commit `89a7d83`. Pages run `31740234369`, Worker deploy run `31740234210`, and
  Worker test run `31740234416` passed. Cache-busted live requests confirmed the published bundle
  names both medium tiers and both live MP4s are byte-for-byte SHA-256 matches to the committed
  assets.
