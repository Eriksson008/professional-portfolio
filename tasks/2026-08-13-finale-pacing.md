# Match finale scrub pacing to the opening hero

## Outcome

Make the closing astronaut film consume approximately the same physical scroll distance as the
opening astronaut film, while preserving its contact content, reversible scrubbing, endpoint, and
responsive media tiers.

## Problem

The opening film currently spans about 1.7 viewport-heights of desktop scroll and 2.0 on phones.
The finale maps the same eight-second, 193-frame duration into only 0.6 viewport-heights when pinned
and roughly one media-band height in-flow. The Option A endpoint guard then lands directly on the
last frame as soon as that short ramp reaches one, which makes the finale race and appear to skip.

## Scope

- Finale scroll geometry and responsive runway styling
- Shared scroll-progress helper and regression tests
- Project/task documentation and the matching Second Brain project note

## Non-goals

- Do not change either video, source cadence, media tier, contact copy, opening hero, or animation
  framework.
- Do not implement canvas/image sequences, frame interpolation, or a redesign.
- Do not commit, push, or deploy without separate explicit authorization.

## Acceptance criteria

- Pinned finale film travel is within one percent of the opening desktop film travel.
- Phone and in-flow tablet film travel matches the opening hero's responsive runway distance.
- The finale reaches the exact last scrub-visible frame through normal scrolling without an early
  endpoint jump.
- Forward, reverse, resize, reduced-motion, and representative responsive layouts remain correct.
- Supported verification passes and independent review finds no blocking issue.

## Relevant context

- `src/components/AstronautHero.tsx`
- `src/components/AstronautFinale.tsx`
- `src/components/scrollGlide.ts`
- `src/styles/hero.css`
- `src/styles/finale.css`
- `PROJECT_CONTEXT.md`

## Verification

- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify.ps1`
- Browser checks at large desktop, tablet, phone, short desktop, and reduced motion
- Independent review

## Risks

- A longer closing runway adds deliberate document length, especially on phones.
- Mobile sticky media must not cover the contact actions or break under browser-toolbar resizing.
- The exact endpoint must remain reachable without elastic overscroll.

## Completion evidence

- Root cause reproduced at 1440×900: the opening film used 1,544.4 px while the finale used 540 px
  (`2.86×` faster); at 390×844 it used one ~211 px band versus ~1,711 px (`8.1×` faster). The raw
  endpoint branch also reproduced a direct 5.01 s → 7.991667 s jump before the visual choreography
  settled.
- The pinned finale is now 386vh, giving its 0.18–0.78 film phase exactly 1,544.4 px at 1440×900.
  The phone/tablet film uses a sticky runway: measured travel was 1,720.17 px versus the hero's
  ~1,711 px at 390×844 and 1,765.73 px versus 1,757.34 px at 768×1024 (both within 0.5%).
- Browser samples traversed 0/25/50/75/99/100% without an endpoint jump and landed on 7.991667 s.
  Forward/reverse seeks stayed paused and seek-free at rest. Desktop, tablet, phone, and 1024×650
  short-window layouts had no horizontal overflow; the short-window mode uses the same 171.6vh
  media travel as the opening desktop hero. Reduced motion rendered one poster/no video and
  collapsed from the scrubbed 3474 px runway to a normal 828 px section. Console errors: zero.
- After reviewer feedback added the short-desktop pacing case,
  `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\verify.ps1` passed: lint, 33 tests,
  TypeScript, and the production Vite build.
- Independent review identified an uncovered short-desktop pacing gap. The sticky runway now also
  applies below 720 px viewport height and caps the film mapping to 171.6vh; 1024×650 measured
  1,115.4 px versus the hero's 1,116.18 px and reached 7.991667 s. Re-review confirmed the blocker
  resolved with no new blocking findings.
