# Media budget ledger — fal.ai

**Budget: a fixed allocation agreed in advance. Hard cap — not a target.**

Every paid generation is recorded below, before and after. Pricing is **verified against the fal.ai
model pages, not assumed**; the verification date is recorded so a future session knows how stale it
is.

## Verified pricing (checked 2026-08-19)

| Model | Endpoint | Price | Source |
| --- | --- | --- | --- |
| Seedream v4 (text-to-image) | `fal-ai/bytedance/seedream/v4/text-to-image` | **$0.03 / image** | fal.ai model page |
| Kling 2.5 Turbo Pro (image-to-video) | `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` | **$0.35 / 5 s clip**, $0.07/s beyond | fal.ai model page |
| Veo 3.1 (image-to-video) | `fal-ai/veo3.1/image-to-video` | **$0.20/s no audio** (720p/1080p), $0.40/s with audio | fal.ai model page |

Audio is never wanted here — the sequence is decoded to silent canvas frames — so any Veo call must
disable it. Paying the audio rate would be pure waste.

## Plan (PASS 3)

Priority order is the brief's. The ceiling below is the **maximum** projected spend, assuming every
planned attempt is used; the expectation is to stop earlier.

| Pri | Asset | Model | Attempts planned | Unit | Max projected |
| --- | --- | --- | ---: | ---: | ---: |
| 1 | Canonical shuttle/engine still | Seedream v4 | 12 images | $0.03 | $0.36 |
| 2 | Ignition draft — camera & prompt test | Kling 2.5 Turbo Pro 5 s | 3 | $0.35 | $1.05 |
| 2 | Ignition production keeper | Kling 2.5 Turbo Pro 5 s | 3 | $0.35 | $1.05 |
| 2 | Keeper fallback if Kling underperforms | Veo 3.1 5 s, audio off | 2 | $1.00 | $2.00 |
| 3 | Orbit / upper-atmosphere close (only if needed) | Kling 2.5 Turbo Pro 5 s | 2 | $0.35 | $0.70 |
| — | Contingency for re-prompts | — | — | — | $3.00 |
| | | | | **Ceiling** | **$8.16** |

**$8.16 maximum projected against the allocation.** The plan does not approach the cap, which is the
intended outcome: the expensive part of this work is the existing footage, and that is already paid
for. No generation is initiated whose cost could push the cumulative total over the allocation.

Chapter 08 (orbit/contact) is planned as a **free reuse** of the ascent sequence's tail frames as a
living still. Priority 3 is only spent if that reuse is visibly inadequate.

## Ledger

| # | Asset | Model | Attempt | Cost | Keep? | Running total |
| ---: | --- | --- | ---: | ---: | --- | ---: |
| 1 | Canonical engine-bell still, round A (4 images) | Seedream v4 | 1 | $0.12 | **yes — `A-01` is the canonical still** | $0.12 |
| 2 | Canonical still, round B — explicit placement (4 images) | Seedream v4 | 2 | $0.12 | no — model mirrored the composition | $0.24 |
| 3 | Ignition clip (ch 03), i2v from `A-01`, 5 s | Kling 2.5 Turbo Pro | 1 | $0.35 | **yes — first attempt, keeper** | $0.59 |
| 4 | Liftoff clip (ch 04), i2v from clip 3's last frame, 5 s | Kling 2.5 Turbo Pro | 1 | $0.35 | **yes — first attempt, keeper** | $0.94 |

**Final — spent: $0.94 · remaining: most of the allocation.**

Four paid calls. Three of the four produced keepers; the fourth ($0.12) is the only waste.

Priority 3 (a dedicated orbit/upper-atmosphere asset) was **planned but not bought.** The contact
scene needed a visual anchor once the person-reveal moved to chapter 02, and the answer that worked
was free: the reveal is *split* rather than duplicated — chapter 02 plays it from black to the point
the face begins to read, and the contact scene picks the same move up at 0.55 of the clip and
resolves it to the lit frame. Two windows on one continuous camera move. Buying a third clip would
have cost $0.35 and made the contact section worse, because a face beside a call to action does work
that a vapour trail does not.

Priority 4 (nice-to-haves) was not started. Nothing on the page needed it.

### Notes on why this came in so far under plan

Round A produced a usable canonical still immediately, and the ignition clip landed on its first
attempt — locked camera, credible ignition ramp, blue-white core with the orange confined to the
transient, and the left half of frame preserved as black type space. The brief's instruction was to
stop when the result is good enough rather than buy variations, so no further attempts were bought.

Round B ($0.12) is the one wasted spend: asking for the nozzle in the "lower right quadrant"
produced a mirrored composition in all four images. Round A's best frame already sat at roughly 70 %
across and 65 % down — close to the held helmet it has to cut from — so the reframe was unnecessary.
