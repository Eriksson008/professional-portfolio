# Media budget ledger — fal.ai

## Budget policy

Generated media for this site runs against a **fixed allocation agreed with the repository owner
before any generation starts.** It is a hard cap, not a target. The figure itself is deliberately
**not published here**: this repository is public, and an account balance is personal detail with no
public value. It stays with the owner; what stays here is everything needed to audit spending
against it.

The rules the allocation is spent under:

1. **Reuse before regenerate.** Media that already exists is free. Nothing is remade because a new
   direction appeared — only because the existing asset genuinely cannot serve.
2. **Verify pricing before every call.** Prices are read from the provider's own model page and
   recorded below with the date checked. Never assumed, never remembered.
3. **Cheap test, then one keeper.** Draft at the lowest sensible cost, inspect, refine the prompt,
   buy the production asset once. No buying five variants hoping one lands.
4. **Stop when it is good enough.** Remaining allocation is not a reason to spend.
5. **Secondary work waits.** A supporting asset is only bought once the primary sequence it supports
   is already satisfactory.
6. **Record every paid call**, including the ones that produced nothing usable. A ledger that hides
   its failures is not a ledger.

Per-call costs are recorded in full, because model pricing is public and the running total is what
makes the policy checkable without the cap being stated.

## Verified pricing (checked 2026-08-19)

| Model | Endpoint | Price | Source |
| --- | --- | --- | --- |
| Seedream v4 (text-to-image) | `fal-ai/bytedance/seedream/v4/text-to-image` | **$0.03 / image** | fal.ai model page |
| Kling 2.5 Turbo Pro (image-to-video) | `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` | **$0.35 / 5 s clip**, $0.07/s beyond | fal.ai model page |
| Veo 3.1 (image-to-video) | `fal-ai/veo3.1/image-to-video` | **$0.20/s no audio** (720p/1080p), $0.40/s with audio | fal.ai model page |

Audio is never wanted here — every sequence is decoded to silent canvas frames — so any Veo call
must disable it. Paying the audio rate would be pure waste.

## Ledger

### Round 1 — ignition and launch

| # | Asset | Model | Attempt | Cost | Keep? | Running total |
| ---: | --- | --- | ---: | ---: | --- | ---: |
| 1 | Canonical engine-bell still, round A (4 images) | Seedream v4 | 1 | $0.12 | **yes — `A-01` is the canonical still** | $0.12 |
| 2 | Canonical still, round B — explicit placement (4 images) | Seedream v4 | 2 | $0.12 | no — model mirrored the composition | $0.24 |
| 3 | Ignition clip (ch 03), i2v from `A-01`, 5 s | Kling 2.5 Turbo Pro | 1 | $0.35 | **yes — first attempt, keeper** | $0.59 |
| 4 | Liftoff clip (ch 04), i2v from clip 3's last frame, 5 s | Kling 2.5 Turbo Pro | 1 | $0.35 | **yes — first attempt, keeper** | $0.94 |

Three of four calls produced keepers. Round B ($0.12) is the only waste: asking for the nozzle in
the "lower right quadrant" produced a mirrored composition in all four images, and round A's best
frame was already sitting where it needed to be.

Rule 3 is why this was cheap — the ignition and liftoff clips both landed on their first attempt,
and no variants were bought once they had.

### Round 2 — assembly and orbit

Bought under rule 5: the primary ignition/launch sequence was already satisfactory and unchanged
before any of this was requested, and both launch clips are untouched by this round.

| # | Asset | Model | Attempt | Cost | Keep? | Running total |
| ---: | --- | --- | ---: | ---: | --- | ---: |
| 5 | Exploded-assembly still (4 images) | Seedream v4 | 1 | $0.12 | **yes — `04` is the canonical plate** | $1.06 |
| 6 | Orbit still, round A (4 images) | Seedream v4 | 1 | $0.12 | no — main engines lit | $1.18 |
| 7 | Orbit still, round B (4 images) | Seedream v4 | 2 | $0.12 | **yes — `b-02` is the canonical plate** | $1.30 |
| 8 | Assembly clip (ch 02), i2v from still 5, 5 s | Kling 2.5 Turbo Pro | 1 | $0.35 | **yes — first attempt, keeper** | $1.65 |
| 9 | Orbit clip (ch 05), i2v from still 7, 5 s | Kling 2.5 Turbo Pro | 1 | $0.35 | **yes — first attempt, keeper** | $2.00 |

**Spent across both rounds: $2.00.**

Round A of the orbit still ($0.12) is round 2's only waste, and it is a useful failure to record:
the composition, the flare palette and the Earth limb were all right, but the three main engine
bells glowed bright cyan. That is both physically wrong — an orbiter coasting on orbit has its main
engines shut down — and precisely the "arcade-style glowing engines" the direction ruled out. It was
not fixable by grading, because the glow is light in the plate rather than a colour cast over it.
Round B named the physics explicitly ("COLD, DARK and COMPLETELY UNLIT … because the vehicle is
coasting on orbit with its engines shut down") and every one of the four came back correct.

The general lesson, which is why it is written down: when a generator keeps adding something,
telling it *why* the thing should not be there works better than telling it not to add it.

### Round 3 — retakes and the receding shot

Two of round 2's keepers were rejected on review and are re-bought here. Both rejections are worth
reading, because neither was a quality lottery — each had a nameable cause and a repeatable fix.

| # | Asset | Model | Attempt | Cost | Keep? | Running total |
| ---: | --- | --- | ---: | ---: | --- | ---: |
| 10 | Assembly clip — retake, camera-only motion | Kling 2.5 Turbo Pro | 2 | $0.35 | pending | $2.35 |
| 11 | Orbit still — retake, "unmarked hull" (4 images) | Seedream v4 | 3 | $0.12 | no — neon limb, text still present | $2.47 |
| 12 | Receding still, round A (4 images) | Seedream v4 | 1 | $0.12 | no — side view, neon limb, glowing bells | $2.59 |
| 13 | Orbit still — retake, softened limb (4 images) | Seedream v4 | 4 | $0.12 | **yes — `orbit-c-02`** | $2.71 |
| 14 | Receding still, round B (4 images) | Seedream v4 | 2 | $0.12 | **yes — `recede-b-02`, mirrored** | $2.83 |
| 15 | Receding clip | Kling 2.5 Turbo Pro | 1 | $0.35 | pending | $3.18 |
| 16 | Orbit clip — retake from the clean plate | Kling 2.5 Turbo Pro | 2 | $0.35 | pending | $3.53 |

**Why the assembly clip was rejected.** Its parts appeared to *merge* rather than connect: surfaces
dissolved into each other as gaps closed, part count was not conserved between frames, and the
convergence never actually completed. That is not a bad seed. Video models have no rigid-body solver
and no contact constraints — an assembly shot asks for articulated part motion, contact events and
conserved topology, which are the three things they are worst at, simultaneously. Re-prompting the
same motion is buying lottery tickets against the architecture.

**Three more things this round taught, all of them cheap and all of them repeatable:**

1. **Naming a colour makes the model shout it.** Asking for a "thin luminous cyan airglow line" — an
   attempt to deliver the site's cool accent physically — produced a hard neon band across the limb
   in every image, worse than the plate it was meant to replace. Describing the *quality* instead
   ("a soft low-contrast band of pale blue-white haze that fades gradually into black … subtle,
   diffuse, softly out of focus, NOT a bright band, NOT a glowing line") produced exactly the
   restrained limb wanted. Two rounds, $0.24, and the lesson is that colour words are amplitude
   controls, not hue controls.
2. **"Unmarked hull" language alone did not remove the lettering — scale did.** Round 3's first
   orbit retake still carried faint markings. What actually worked was the third instruction:
   *"the spacecraft is SMALL in the frame, occupying only about one sixth of the frame width, far
   enough away that no surface detail smaller than a panel line is resolvable."* Glyphs cannot
   render below roughly 15–20 px, so denying the resolution denies the text. Structural, not
   persuasive.
3. **Do not put brand names in a prompt, even as a style reference.** "Apple restraint" was in the
   receding-shot prompt as a taste cue. One of the four images came back with a literal **Apple
   logo** rendered in the corner of frame. Brand tokens are objects to these models, not adjectives.
   The word is out of every prompt here.

**The fix is to stop asking.** The parts are frozen and the *camera* moves instead — a slow lateral
arc with a gentle push. Parallax over static geometry is the thing image-to-video does almost
perfectly, because no part ever approaches another and there is no contact to hallucinate. It also
reverses cleanly, which a convergence does not: played backwards, an assembly is a disassembly, and
this page is scrubbed in both directions.

**Why the orbit plate was rejected: invented lettering on the hull.** Negative prompts had no effect,
and could not have: the text was in the *still* the clip was animated from, so the video model was
faithfully reproducing it. And at the image stage, "space shuttle" carries NASA livery as part of the
concept — a negative down-weights that prior rather than outweighing it. What works is to remove the
prior instead: call it a *"white winged orbital spaceplane"*, describe the hull positively
(*"pristine unmarked matte-white thermal tile panels, bare tile only, livery-free"*), and keep the
vehicle small enough in frame that glyphs cannot resolve at all.

### Reframing instead of regenerating

The assembly plate came back composed too far left — the subject ran nearly to the left edge, where
every other plate on this page leaves the left half empty for the typography. That is normally a
regenerate. It was not, because a 16:9 plate rendered into a 16:9-ish viewport has no horizontal
crop room left at render time, so no amount of focal-point adjustment could fix it either.

Instead the master is reframed in ffmpeg: the content is inset to 75 % and placed right of centre on
black. The plate is already black, so the pad is invisible and the left third comes free. Cost: zero.
The exact command is in the commit that added it.
