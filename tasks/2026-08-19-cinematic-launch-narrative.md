# Task — Cinematic launch narrative (astronaut → engineer → ignition → systems → work)

**Status:** in progress · **Owner:** single implementation owner (this session) · **Date:** 2026-08-19

## Outcome

Evolve the existing portfolio into an eight-chapter cinematic scroll narrative. **Evolution, not
rebuild.** Existing astronaut media is production media and is reused, not replaced. One new
signature media investment: a shuttle ignition/ascent sequence.

## PASS 1 — Audit (complete)

### Existing media inventory

| Asset | Spec | Role today | Verdict |
| --- | --- | --- | --- |
| `media-src/astronaut-hero-source.mp4` | H.264 3840×2160, 24 fps, 193 f, 8.04 s, 21.8 MB | Hero master | **KEEP** |
| `media-src/astronaut-finale-source.mp4` | H.264 3840×2160, 24 fps, 193 f, 8.04 s, 14.7 MB | Finale master | **KEEP** |
| `public/media/astronaut-hero-scrub{,-md,-sm}.mp4` | 2560×1440 / 1920×1080 / 1280×720, all-intra GOP 1 | Shipped hero scrub ladder | **KEEP** |
| `public/media/astronaut-finale-scrub{,-md,-sm}.mp4` | same ladder | Shipped finale scrub ladder | **KEEP** |
| `public/media/astronaut-hero-start.jpg` | 187 kB | LCP background, first frame | **KEEP** |
| `public/media/astronaut-hero-poster.jpg` | 223 kB | Reduced-motion settled frame | **KEEP** |
| `public/media/astronaut-finale-poster.jpg` | 126 kB | Finale reduced-motion frame | **KEEP** |
| `public/media/generated/astronaut-hero-97/` | 97 frames × w1440/w1080/w720 WebP q82, 9.55 MB | `?hero=frames-97` candidate | **KEEP + extend** |
| `public/media/generated/astronaut-hero/` | 193 frames × 3 tiers, 19.0 MB | Superseded by -97 | Retain, unused |

### What the two clips actually depict (visually inspected, not assumed)

- **Hero** — astronaut, helmet **on**, visor an opaque dark dome. Opens 3/4 profile, left of frame;
  rotates toward camera while the camera pushes in. Ends near-frontal, **helmet filling frame, a
  large centred elliptical visor with a specular arc**. Right half of frame is clean black — that is
  where the typography lives. Reads as *anonymous explorer / ambition*.
- **Finale** — same suit, helmet **off and held under the right arm**. Opens as a pure silhouette,
  head bowed. Light comes up and the head rises to camera. Ends near-frontal, face lit by a low rim,
  **the held helmet catching a bright circular specular at lower-right**. Reads as *the actual
  person*.

The narrative the brief asks for is already latent in the footage. Nothing needs regenerating to get
"explore → the engineer".

### Continuity discoveries that drive the design

1. **Hero ends on a large centred circular visor.** That is a geometric rhyme with an engine bell.
2. **Finale ends on a bright circular specular** on the held helmet, lower-right of frame. That is a
   light-continuity handle into an ignition glow — the brief's "circular visual feature → engine bell
   geometry", already present in the footage, requiring no morph.
3. Both clips are the same suit, same lighting language, same near-black ground. They cut together.

### Architecture (reuse, do not duplicate)

| Concern | Module | Reuse plan |
| --- | --- | --- |
| Scroll → progress springs | `src/components/scrollGlide.ts` | Reuse verbatim |
| Sticky runway driver | `src/components/useHeroRunway.ts` | Reuse for the ignition chapter |
| Frame-sequence contract | `src/components/heroFrames.ts` | Generic already (`name` param) — reuse |
| Frame loader/decoder | `src/components/useHeroFrames.ts` | Generic already — reuse |
| Hero markup | `src/components/HeroShell.tsx` | Hero-specific; ignition gets its own shell |
| Variant switch | `src/components/heroVariant.ts` | Untouched |
| Media generation | `scripts/generate-hero-media.mjs` | **Extend** to a second sequence |

**Measured baseline (`docs/cinematic-hero-benchmark-2.md`), not re-litigated:**
97-frame canvas sequences are stall-free on desktop (0 frames > 16.7 ms in slow/fast/reverse/
oscillation); the MP4 scrub is not (3–4 frames > 50 ms). B97 costs 0.528 MB/s desktop, 0.230 MB/s
mobile — roughly half the MP4. **The new chapter therefore uses a frame sequence, on evidence.**

### The open defect this addresses

Slow scrolling can expose individual frame transitions. The benchmark measured *render* smoothness
(frame times), which is already perfect; it did not measure *temporal* resolution. With 97 frames
across a long runway the playhead lands between frames and snaps to the nearest one — visible
stepping on slow scroll, independent of frame time.

**Fix: sub-frame blending.** Draw frame `floor(t)` at full alpha, then frame `floor(t)+1` at
`globalAlpha = frac(t)`. One extra `drawImage` per paint, zero extra bytes, zero extra requests.
To be measured, not assumed.

## PASS 2 — Storyboard

Chapters, media source, and what is new. **Five of eight chapters need no new media at all.**

**As shipped** (revised in a second round — see the revision note below).

| # | Chapter | Media | Source | New? |
| --- | --- | --- | --- | --- |
| 01 | Exploration | Astronaut, helmet on | existing `astronaut-hero` | no |
| 02 | The Engineer | Exploded assembly closing together | **new** `assembly` | **yes** |
| 03 | Ignition | Engine bell → full thrust | **new** `ignition` | **yes** |
| 04 | Liftoff | Ascent + editorial figures | **new** `liftoff` | **yes** |
| 05 | In flight | Orbiter coasting, Earth limb, one flare | **new** `orbit` | **yes** |
| — | Systems in flight | Real architecture, DOM/CSS | none | no |
| — | Selected work | Grouped by kind | none | no |
| — | Media band | Orbit plate as a living still | reuse of `orbit` | no |
| — | Experience | Editorial timeline | none | no |
| — | Contact | The person reveal, played whole | existing `astronaut-finale` | no |

### Motion spec

```
01 EXPLORATION
INTENT hero · CAMERA push+orbit (baked) · SUBJECT natural · SCROLL scrubbed
CONTAINER typography · MEDIA frame-sequence · INTENSITY 5
reduced-motion → settled poster, full composition, no media requests

02 THE ENGINEER
INTENT transition · CAMERA locked (baked light rise) · SUBJECT natural · SCROLL scrubbed
CONTAINER typography · MEDIA frame-sequence · INTENSITY 4
reduced-motion → lit-face poster + copy

03 IGNITION
INTENT hero · CAMERA locked-then-slow-pull · SUBJECT dramatic · SCROLL scrubbed
CONTAINER mask+typography · MEDIA frame-sequence · INTENSITY 5   ← the one new high moment
reduced-motion → full-thrust still

04 LIFTOFF
INTENT scroll-driven · CAMERA follow · SUBJECT natural · SCROLL scrubbed
CONTAINER typography · MEDIA frame-sequence (continuation) · INTENSITY 4

05 SYSTEMS IN FLIGHT
INTENT reveal · CAMERA locked · SUBJECT micro · SCROLL triggered
CONTAINER none · MEDIA css-dom · INTENSITY 2   ← deliberate de-escalation

06 SELECTED WORK
INTENT reveal · SCROLL triggered · MEDIA css-dom · INTENSITY 2

07 EXPERIENCE
INTENT reveal · SCROLL triggered · MEDIA css-dom · INTENSITY 1

08 FINAL ORBIT / CONTACT
INTENT ambient · CAMERA locked · SUBJECT micro · SCROLL independent
CONTAINER none · MEDIA living-still · INTENSITY 1   ← deceleration to quiet
```

Intensity curve: **5 · 4 · 5 · 4 · 2 · 2 · 1 · 1**. Rises, peaks twice, then falls and stays down.
The page is not loud throughout, which is the point.

### Revision (same day, second round)

The first round split the person-reveal between chapter 02 and the contact scene. That was reverted:
entering the contact scene at 0.55 of the clip meant the figure was already resolved and facing
camera when the reader arrived, so the silhouette, the turn and the light coming up — the reason the
plate is good — all happened before the scene opened. **A reveal that starts after the reveal is not
a reveal.**

Chapter 02 got its own footage instead, which turned out to be the better answer on its own terms:
the site's one statement about *mechanical engineering* was being illustrated by a portrait, and is
now illustrated by an exploded technical assembly. A fifth beat (`orbit`) was added after liftoff,
and the orbit plate is reused once more as a still band in the middle of the document.

### Structural change and its trade-off

The person reveal currently *is* the contact section (`AstronautFinale`, `id="contact"`) — media and
contact CTAs share one component. Moving the reveal to chapter 02, as the brief directs, would strip
contact of its visual, and a face beside a call to action does work that a vapour trail does not.

**Resolution (revised during implementation): split the reveal rather than move it.** Chapter 02
plays the clip from black to the point the face begins to read (`range={[0, 0.68]}` over the frame
sequence); the contact scene picks the same camera move up at 0.55 of the clip (`FILM_FROM`) and
resolves it to the lit frame. The windows overlap slightly on purpose so the two read as continuous.

One plate, two beats, no repeat — the reader meets the person in shadow at the top of the page and
sees them resolved next to the contact actions. This also avoided buying a third clip for chapter 08
and avoided surgery on `AstronautFinale`, which is the most intricate component in the repo (pinned
and in-flow modes, two springs, a WebKit priming dance) and had no need to change beyond one offset.

The original plan — re-anchor contact on the ascent tail as a living still — was dropped because the
liftoff clip's tail is busy with sparks and vapour rather than quiet, so it made a worse close than
the face it would have replaced.

## PASS 3 — Cost plan

See `docs/media-budget-ledger.md` for the policy, the verified pricing and every paid call. The
cap is a fixed allocation agreed with the repository owner and is deliberately not written down in
this public repo; spend is.

## Verification

`npm run lint`, `npm test`, `npm run build`, plus a browser walkthrough of every scroll section at
slow/fast/reverse scrub, mobile width, and forced reduced motion.

## PASS 9/10 — Measured results

Production build (`npm run build`) served by `vite preview`, Chrome via Playwright, desktop
1440×900 DPR 1, localhost. Sequences fully loaded before measuring, so these are scrubbing figures
rather than loading figures — the same protocol as `docs/cinematic-hero-benchmark-2.md`.

### Scroll smoothness — *frames over 16.7 ms / over 50 ms · longest frame*

| Chapter | slow (8 s) | fast (1.2 s) | reverse (1.2 s) |
| --- | --- | --- | --- |
| 02 engineer | 0 / 0 · 8.6 ms † | 0 / 0 · 8.6 ms | 0 / 0 · 8.1 ms |
| 03 ignition | 0 / 0 · 8.6 ms | 0 / 0 · 8.1 ms | 0 / 0 · 8.5 ms |
| 04 liftoff | 0 / 0 · 9.5 ms | 0 / 0 · 8.1 ms | 0 / 0 · 8.6 ms |

† Median of 5 runs. One run in five showed a single 23.2 ms frame; four showed none. An earlier
first-run-after-load measurement showed one 52.9 ms frame that did not reproduce in any of nine
subsequent runs.

**Stall-free**, matching what benchmark 2 measured for the 97-frame hero candidate. Adding the
sub-frame dissolve did not cost smoothness — it is one extra `drawImage` on an already-cheap paint.

### The stepping fix, measured directly

Sampling the ignition canvas at 1 px scroll increments across 11 px — one full frame interval at
this runway length — produced **12 distinct rendered images out of 12 samples**. The previous
renderer produced exactly **1** across the same span by construction: it rounded to the nearest
frame and returned early when that frame had not changed.

### Load and weight (cold cache, desktop)

| | Value |
| --- | --- |
| LCP | **124 ms** |
| CLS | **0.0066** |
| Initial transfer | 9.24 MB over 16 requests |
| — of which the pre-existing hero MP4 | 8.70 MB |
| **Added by the three new chapters, before scrolling** | **0 bytes, 0 requests** |
| After scrolling the whole page | 16.29 MB, 250 requests |
| JS heap after full scroll | 15 MB |
| JS bundle | 98.05 kB gzip (was 96.5 kB — **+1.5 kB** for three chapters and a new section) |

The chapters cost nothing until they are approached, which is the whole point of gating the loader
on `useNearViewport`. Desktop tier per chapter: reveal 2.44 MB, ignition 4.12 MB, liftoff 3.58 MB.

### Mobile (390×844)

All three chapters serve the **w720** tier — 97 + 121 + 121 = 339 frames, 1.05 / 1.69 / 1.62 MB,
each fetched only on approach. Per benchmark 2, mobile has no smoothness problem in any
representation and the decision there is bytes; these are in the same range as the 1.85 MB phone
tier that benchmark already accepted.

### Reduced motion

Forced `prefers-reduced-motion: reduce`, whole page scrolled:

- **0** frame requests, **0** manifest requests, **0** video requests.
- All three chapters still fully composed — copy, eyebrow, all four editorial figures.
- Runways collapse 2303 px → 641 px; no canvas is mounted at all.

### Known gaps

- `AstronautHeroFrames` (the `?hero=frames-97` candidate, not the default) still centre-crops on
  phones where the MP4 hero pans via `object-position`. Pre-existing, and deliberately not changed
  here because that component is the benchmarked candidate.
- Per-tier frame decimation (fewer frames in `w720` than `w1440`) would cut mobile bytes further.
  The manifest format already supports a different `count` per tier; the extractor does not.
