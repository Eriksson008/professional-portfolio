# Cinematic media converter — skill + hero A/B/C experiment

Date: 2026-08-14 · Branch: `experiment/cinematic-media-converter` · Status: built, measured, **not merged**

## Goal

Two deliverables, in order:

1. A reusable workspace skill that decides what web-native representation a piece of source media
   should take, generates those assets, and proves the choice by measuring it.
2. An isolated proof of concept in this repo that uses the skill against a real hero MP4 and
   compares the result against the shipped implementation.

The skill is the durable artifact. The experiment is evidence that it works on something real.

## The skill

`cinematic-media-converter`, canonical source at `../.agents/skills/cinematic-media-converter/`,
published to the three discovery roots by `ai-workflows/sync-skills.ps1`. Structure mirrors
`scroll-video-optimizer`: `SKILL.md` + `references/` + zero-dependency Node scripts.

**Division of labour, deliberately one-directional:**

- `cinematic-media-converter` — *what should this media become?* Analysis, strategy choice, asset
  generation, test implementation, benchmarking.
- `scroll-video-optimizer` — *how should scroll drive it?* Scroll pipeline, scrub tuning, jitter.

The converter hands off to the optimizer (and defers to it entirely for video encoding, rather
than duplicating its recipes). The optimizer never calls back. No cycle.

## Decisions taken during the work

**WebGL is permitted on `experiment/*` only.** `AGENTS.md` forbade WebGL outright. That rule came
from `aa3511a`, where three + R3F was removed alongside the Career Nebula backdrop — a
design-direction change and a bundle win, not a measured WebGL failure. Reintroducing it to
*measure* it needed the rule amended, so the amendment is scoped to experiment branches and `main`
keeps the prohibition. See the AGENTS.md entry for the conditions.

**GSAP was evaluated and rejected.** The brief asked for GSAP ScrollTrigger "if GSAP already fits
the project". It does not: framer-motion springs already drive hero progress through a tested
`scrollGlide.ts`, and a second scroll system on one runway fights the first. Driving all three
candidates from the *existing* pipeline also made the comparison valid — the renderer is the only
variable. The skill supports GSAP fully for repos where it does fit.

**No 2.5D candidate, because the source does not matte.** The analyser flagged a keyable dark
backdrop (76% of pixels, 73% of the border at background luma). That is necessary but not
sufficient, and this footage fails the sufficient half: the visor and suit shadows sit at
background luma *and* connect to the backdrop through shadow. A plain luma key erased the visor; a
border-connected flood fill kept it at low resolution and leaked at high; morphological sealing
fixed thin bridges but not wide ones. Layering it would have meant inventing content, which the
brief ruled out. The finding is written into the skill so the next source gets the sharper test —
and `--alpha` now emits magenta composites, because no statistic certifies a matte.

**No 3D-geometry candidate.** No real 3D source assets exist, and a photoreal rotating subject
with moving speculars cannot be honestly reconstructed.

## Experiment architecture

`HeroSwitch` reads `?hero=` once at mount and renders one of three implementations. Default and
fallback for anything unrecognised is the shipped `AstronautHero`, which is **not modified** —
`App.tsx` changes one line and nothing else. The 3D candidate is a lazy chunk.

Shared, so the comparison is fair rather than three unrelated things:

- `useHeroRunway` — the scroll → spring → `--p` pipeline, identical for all three, no React state
  per frame.
- `HeroShell` — the hero's DOM around the media layer. Deliberately duplicates `AstronautHero`'s
  markup instead of being extracted from it, so the baseline stays untouched; the duplication
  collapses when a winner is chosen, not before.
- `heroFrames.ts` / `heroVariant.ts` — pure, unit-tested (19 new tests).

Generated frames live in `public/media/generated/<name>/` and are git-ignored; `manifest.json`
beside them is tracked and is what the runtime reads, so regenerating with a different frame count
needs no code change.

## Result

Measured in `docs/cinematic-hero-benchmark.md`. Summary: the frame sequence is categorically
smoother on desktop (0 long frames vs 45) and has the best LCP; the 3D candidate costs 222 kB
gzipped, has the worst LCP, and is *less* smooth than the plain 2D canvas rendering the same
frames. The MP4's jitter is specific to the 1440p desktop encode and absent on mobile's 720p one.

**Recommendation: keep the MP4 hero; try a better desktop encode first (`scroll-video-optimizer`
territory); adopt the frame sequence only if that fails. Do not ship the 3D candidate.**

## What would change the recommendation

- A real-device test showing the desktop jitter reproduces on hardware people actually use.
- A re-encoded 1440p scrub that still stutters.
- A future hero whose source *does* matte, where layered depth is honestly available.
