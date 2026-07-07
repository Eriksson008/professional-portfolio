# Finale phase choreography — design decisions (2026-07-07)

User brief: refine the astronaut finale into a phased cinematic ending — eyebrow →
headline/body → astronaut reveal → CTAs, with a hold; smoothed/glided scroll progress driving
the animation; desktop text-left / film-right; mobile text-first; reduced-motion static.

The brief left several degrees of freedom open. Decisions made and why:

## One smoothed progress variable, CSS-side ramps

- The component's existing rAF lerp loop (the hero's proven pattern) now publishes the smoothed
  section progress as `--fp` (0→1) on `.finale`; every staged element in `finale.css` derives
  its own phase window from it:
  `--t: clamp(0, calc((var(--fp, 1) - start) / span), 1)` → `opacity: var(--t)` +
  `translateY(calc((1 - var(--t)) * 12px))`.
  This mirrors the hero's `--p`/`--t` convention, keeps framer-motion out of the scroll path
  (the finale no longer uses `m.*` at all), and gives the reduced-motion / video-failure /
  no-JS fallback for free: `--fp` unset defaults every ramp to 1 (fully settled scene).
- **Glide:** the brief's "inertia" requirement is the lerp itself — scroll updates only the
  target; the shown value approaches it at 0.14/frame and the loop keeps running after scroll
  stops until it settles. 0.14 (down from the previous 0.2) reads as gentle momentum without
  feeling delayed. Two smoothed tracks: `shown` (drives `--fp`) and `filmShown` (drives the
  video seek), so the film can run on its own window.

## Phase windows (pinned desktop, fractions of the runway)

- Eyebrow 0.02–0.16 · headline 0.10–0.30 · body 0.18–0.38 · roles 0.26–0.44 (phase 1–2)
- Film scrub occupies 0.18–0.78 of the runway (`FILM_START`/`FILM_END`) and the media element
  fades from near-invisible over 0.06–0.30 while its first frames are still black — text is
  readable before the visual gets bright (phase 3)
- CTAs 0.60–0.75 · contact note 0.70–0.84 · repo line 0.74–0.88 (phase 4)
- 0.88–1.0 is the held lit composition before the section unpins

## Runway: 200vh, not the brief's 120–160vh

The brief's "section height around 120–160vh" doesn't account for sticky mechanics: the pinned
scene consumes 100vh of the section, so 160vh would leave only 60vh of animated runway — far
too fast for four phases plus a hold. 200vh gives a 100vh runway (still shorter than the
previous 230vh and the hero's 230vh) and keeps the 30/40/30 phase proportions legible.

## Layout

- DOM order is now panel-then-media (was media-then-panel): desktop grid places text left /
  film right without an `order` override, and phones naturally stack **content first, film band
  beneath** — the brief's "don't force users to scroll through a huge video before contact
  actions". In in-flow mode the film's scrub progress is therefore measured from the media
  band's own viewport travel (not the section's), so the reveal happens where the film actually
  is; text phases keep following the section's travel.
- Desktop columns rebalanced to `1fr / 0.95fr` (film ≈ brief's 45–50% before the right-edge
  bleed) and the film hangs slightly low (`margin-top: clamp(1.5rem, 5vh, 3.5rem)`) —
  "emerging from darkness", not centered. A left-edge scrim
  (`linear-gradient(90deg, var(--black), transparent 22%)`) dissolves the film toward the text
  column; the mobile scrim now feathers both the top (content above) and bottom (footer below)
  of the band.
- No filters or grading touch the film — the face/head stays as dark as the source.

## Accessibility

- CTA links are focusable while their ramp is at 0, so `.finale-panel:focus-within > *` snaps
  the whole panel to `--t: 1` — keyboard users never focus an invisible control (verified:
  opacity 0 → 1 on focusing "Contact Me").
- Reduced motion: the scrub effect doesn't attach at all; the poster still + fully settled
  text render statically (`--fp` default). Video stays `aria-hidden`, muted, `playsInline`,
  decorative.

## Verification notes (2026-07-07 session)

Verified in the automation Chrome at its locked 500×750 viewport (in-flow mode): phase
ordering, glide settling (`--fp` 0 → 0.78 easing after a jump), focus-within snap, settled
default. **Not visually verifiable in this browser:** the film itself — `<video>` elements
never leave `readyState 0` in this Chrome (confirmed identical on the unchanged live site, so
environmental, not a regression), and the window refuses resize, so the pinned desktop mode
ran only as code review + the unchanged, previously-verified scrub math. rAF is also throttled
in the offscreen automation tab (frames render only on screenshots), which made `--fp` appear
frozen between screenshots — not a code issue.
