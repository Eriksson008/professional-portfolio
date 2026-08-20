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

| # | Chapter | Media | Source | New? |
| --- | --- | --- | --- | --- |
| 01 | Exploration | Astronaut, helmet on | existing `astronaut-hero` | no |
| 02 | The Engineer | Person reveal, helmet off | existing `astronaut-finale` | no |
| 03 | Ignition | Engine bell → full thrust | **new** | **yes** |
| 04 | Liftoff | Ascent + editorial metrics | **new** (same clip's tail) | shared |
| 05 | Systems in flight | Real architecture, DOM/CSS | none | no |
| 06 | Selected work | Differentiated project environments | none | no |
| 07 | Experience | Editorial timeline | none | no |
| 08 | Final orbit / contact | Ascent tail as a living still | **reuse of 03/04** | no |

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

### Structural change and its trade-off

The person reveal currently *is* the contact section (`AstronautFinale`, `id="contact"`) — media and
contact CTAs share one component. Moving the reveal to chapter 02, as the brief directs, would strip
contact of its visual.

**Resolution:** the reveal moves to chapter 02; contact is re-anchored on the ascent tail as a
living still (chapter 08). This costs no extra generation, and it completes the arc — person →
ignition → flight → orbit → contact — rather than ending on the person we already met at the top.

## PASS 3 — Cost plan

See `docs/media-budget-ledger.md`. The cap is a fixed allocation agreed in advance.

## Verification

`npm run lint`, `npm test`, `npm run build`, plus a browser walkthrough of every scroll section at
slow/fast/reverse scrub, mobile width, and forced reduced motion.
