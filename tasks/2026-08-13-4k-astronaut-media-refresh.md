# 4K astronaut media refresh

## Outcome

Replace the portfolio's astronaut video and social-image sources with the user-provided 4K renders,
then publish optimized responsive derivatives without changing the established scroll choreography.

## Problem

The existing hero source is 1080p and the finale source originated at 720p before being upscaled.
Both full-size scrub encodes and their poster stills are limited to 1080p, while the two social cards
were generated only at their 1200×630 delivery size.

## Scope

- `media-src/astronaut-*-source.mp4` and `media-src/og-*-source.png`
- `public/media/astronaut-*`
- `public/og-image-v2.png` and `public/og-ask-fredrik.png`
- Media documentation in `README.md` and `PROJECT_CONTEXT.md`
- The matching Second Brain project note

## Non-goals

- No functional component, choreography, breakpoint, content, icon, backend, auth, or dependency
  changes; comments may be corrected to describe the new derivatives.
- Do not add the Desktop source filenames or any machine-specific paths to tracked files.
- Do not touch the unrelated untracked `public/resume-old.pdf`.

## Acceptance criteria

- The two tracked source masters are 3840×2160, 24 fps, 193 frames, and 8.041667 seconds.
- Desktop scrub encodes are optimized 2560×1440 all-intra H.264; phone encodes remain optimized
  1280×720 all-intra H.264.
- Hero start/final and finale final posters are regenerated from the exact first or final
  scrub-visible source frames at 2560×1440.
- Both social cards are regenerated from their 4800×2520 masters at the declared 1200×630 size.
- Every file in `public/media` remains referenced; no unrelated media or icons are removed.
- Supported repository verification and representative desktop/tablet/mobile browser validation pass.
- Independent review reports no blocking issues.
- Authorized commits are pushed and the Pages and Worker deployments are observed to completion;
  live asset metadata matches the new outputs.

## Relevant context

- `src/components/AstronautHero.tsx`
- `src/components/AstronautFinale.tsx`
- `src/components/useDesktopViewport.ts`
- `README.md` astronaut hero/finale sections
- `.github/workflows/deploy.yml` and `.github/workflows/deploy-worker.yml`
- `vite.config.ts` admin asset copy list

## Verification

- `pwsh scripts/verify.ps1`
- `npm run build:admin`
- `npm run check` and `npm test` in `cloudflare/ask-fredrik-worker/` because
  `public/og-ask-fredrik.png` ships with the Worker asset bundle
- `powershell -NoProfile -File scripts\verify.ps1` in `../second-brain`
- Browser validation at representative desktop, tablet, mobile, and reduced-motion settings
- `ffprobe` metadata/keyframe validation for generated media

## Risks

- All-intra 1440p video can increase initial transfer and decode cost if encoded too generously.
- A poster extracted from a non-matching frame could flash when video seeking begins.
- `og-ask-fredrik.png` deploys through the Worker rather than the Pages artifact.
- Large binary replacement can bloat Git history; source masters must remain below GitHub's normal
  per-file limit and public-safe.

## Completion evidence

- Media metadata: both tracked masters are 3840×2160/24 fps/193 frames/8.041667 s BT.709; desktop
  derivatives are 2560×1440, phone derivatives 1280×720, and every scrub encode has 193/193
  keyframes. Posters are 2560×1440; social cards are 1200×630 RGB PNGs.
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\verify.ps1`: lint, 21 tests, and
  production build passed. (`pwsh` is unavailable on this machine, so Windows PowerShell ran the
  same supported script.)
- `npm run build:admin`: passed; copied Worker social-card hash exactly matched the source asset.
- Worker `npm run check` + `npm test`: passed (457 knowledge checks and 54 admin-auth checks).
- Browser: Playwright inspected 1440×900, 768×1024, and 390×844; desktop/tablet selected the 1440p
  files, mobile selected 720p, both scrubs sought correctly, no horizontal overflow or runtime
  errors appeared, mobile navigation worked, and reduced motion replaced both videos with posters.
  Framer Motion emitted its expected reduced-motion-enabled warning only.
- Second Brain content validation passed. Its full gate remains blocked by unrelated pre-existing
  stale generated index/audit files and unrelated user-owned vault changes; they were not modified.
- Independent read-only review: no blocking correctness, deployment, privacy, media-reference, or
  runtime findings. Documentation cleanup from the review was applied before staging.
- Deployment/live verification: pending the authorized push; append evidence after both workflows
  and live assets are verified.
