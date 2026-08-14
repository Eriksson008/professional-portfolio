# Mobile bottom dock + re-composed phone hero — design record

**Date:** 2026-08-13
**Scope:** phones only (≤719px). Desktop and tablet (≥720px) are unchanged.
**Source:** user-directed numbered brief (24 points) covering navigation, hero composition,
performance, and validation.

---

## Problem

Two mobile-only failures, both from the same cause — the phone inherited the desktop
composition instead of getting its own.

1. **Navigation.** The top header collapsed to a hamburger: two taps to reach anything, at the
   far end of the screen from the thumb, plus a separate floating "Ask Fredrik" pill competing
   for the same corner.
2. **The hero.** The desktop hero is a full-screen film with the identity laid over its lower
   right, played across a 360svh runway. On a portrait screen that reads as **2.6 viewports of
   scrolling through a mostly-black frame**: the copy is welded to the bottom of a pinned
   viewport, the film's approach occupies 203svh of travel, and the last 57svh is a hold that
   assembles telemetry which is `display: none` on phones. Dead scroll, by construction.

## What shipped

### 1. Bottom dock (`MobileDock.tsx`, `dock.css`)

A fixed, rounded, near-black slab inset 10px from the screen edges, sitting in the home-indicator
safe area. Seven icon-only destinations, `flex: 1` each, 48px tall:

    Home · Impact · Projects · Skills · Career · Contact · Ask Fredrik

- **Home replaces Summary.** The opening film and the summary that follows it are one landing,
  so Home owns both (`matches: ['', 'about']`) and taps through to `#top`. That is what keeps
  seven items at a usable width instead of squeezing in an eighth. The boxed `FE` mark does not
  appear on phones.
- **Icon-only, not label-on-active.** At 320px each cell is 40.9px wide; a label under the active
  icon would either clip or need a reserved row that pushes the target below 44px. Every item
  carries an `aria-label`, and the active one carries `aria-current`.
- **Active state:** a soft `--accent-wash` capsule with a hairline border scales in behind the
  glyph, and the glyph goes from `--faint` to `--text`. Driven by IntersectionObserver
  (`useActiveSection`), never by scroll position.
- **Ask Fredrik** gets one degree more presence than a destination — a 5px `--ice` dot that
  gains a soft ring while the panel is open — and its capsule takes an `--ice-line` border.
- **Tap feedback** is a 0.9 scale compression over 180ms, `transform` only, disabled under
  `prefers-reduced-motion`.

Geometry lives in `tokens.css` as `--dock-h` / `--dock-inset` / `--dock-space`, because the hero,
the assistant sheet, and the footer all reserve space against it. `.dock` joins
`.hero, .finale, .nav` in the forced-dark token block, so it stays near-black in Light Mode.

### 2. Shared navigation configuration

`navigation.ts` holds `headerSections`, `contactDestination`, and `dockDestinations`; `Nav.tsx`
and `MobileDock.tsx` are two presentations of it. The scroll-spy moved out of `Nav.tsx` into
`useActiveSection(ids, clearWhenNone?)` unchanged, apart from one opt-in: the dock passes
`clearWhenNone` so the active id resets to `''` above the first section and Home lights up. The
desktop header does not pass it and keeps its existing behaviour of holding the last section it
saw. `NavIcons.tsx` hand-draws the seven glyphs on one 24×24 grid (1.6 stroke, round caps,
`currentColor`, no fills) — no icon dependency for seven paths.

### 3. One assistant, two triggers

`useAskFredrik()` owns `open` plus the element that opened it; `App` passes the controller to
both `AskFredrik` and `MobileDock`. No duplicated state, one panel, one transcript, and closing
returns focus to whichever trigger is actually on screen. The floating pill is `display: none`
≤719px; the sheet anchors above the dock (`--dock-space`) and above an open keyboard
(`--kb-inset`, published from `visualViewport` by `useKeyboardInset`).

### 4. Re-composed phone hero (`hero.css`)

The scene is stacked, not overlaid:

    [ film band — the astronaut, ~52svh ]
    Mission Portfolio
    Fredrik Eriksson
    Senior Software Engineer building AI, cloud, …
    [ View Work ] [ Download Résumé ]

- `.hero` becomes a flex column inside the sticky frame; `.hero-media` becomes an in-flow band
  (`flex: 1 1 52svh`, so it grows into whatever the copy leaves and shrinks rather than pushing
  the actions off-frame); `.hero-content` sits directly beneath it with `--dock-space` clearance.
- **The scrim is the seam.** Its lower stop is now solid `var(--black)`, so the band dissolves
  into the copy area instead of ending on an edge.
- **The identity arrives on load, not on scroll** (0.25s → 1.1s stagger, blur-free rise). Nothing
  waits for a scroll gesture, so there is no state where half the screen is empty.
- **Runway 360svh → 200svh** (100svh of travel) and the film runs to `FILM_END_PHONE = 0.94`
  instead of 0.78 — no telemetry to assemble means no reason to hold. The film now completes
  exactly as the frame unpins into the summary.
- The header is gone on phones, so `--nav-h` is 0 and the band starts at the top of the screen.
- **Short phones** (`max-height: 700px`) tighten the type so the band keeps ≥40svh; **landscape
  phones** (`≤719 × ≤520`) drop the pin entirely and let the scene flow, since a 375px-tall frame
  cannot hold a band, the copy, and the dock at once.

## Decisions inside the brief's degrees of freedom

| Decision | Why |
| --- | --- |
| Breakpoint = **≤719px** | The project's existing phone boundary (`useVideoMediaTier`, hero, finale). No new breakpoint invented. Tablets 720–879px keep the header. |
| Icon-only dock | Seven destinations at 320px; see above. |
| Home → `#top`, Summary dropped | Avoids a duplicate landing destination and keeps targets ≥40px. |
| Contact removed from the **hero CTAs** on phones | Contact is a permanent dock destination in thumb reach; a third stacked button cost more frame than it earned. Desktop keeps all three. |
| Scroll cue hidden on phones | It would sit under the dock, and visible copy below the band is its own invitation. |
| Dock is near-opaque (0.88) with a 14px blur | A translucent slab over a scrubbing film is the most expensive thing a fixed bar can ask a phone GPU to composite each frame. The blur is a finish, not the surface. |
| Both navigations always rendered, CSS-hidden | `display: none` also removes the hidden one from the a11y tree and tab order, and avoids remounting on resize. |
| Keyboard inset only counts >120px | Collapsing browser chrome moves these numbers on every scroll; reacting to that would make the bottom of the page twitch. |

## Two things worth remembering

- **The finale's phone runway is derived from the hero's film travel.** `finale.css` sizes
  `.finale-media-runway` as `calc(<hero travel> + 56.25vw)` and `AstronautFinale.tsx` passes the
  same constant to `stickyMediaProgress`, so the closing film costs the same scroll as the
  opening one. The hero change from 202.8vh to 94vh of travel had to be applied in **three**
  places: `FILM_END_PHONE`, the CSS runway height, and that JS constant.
- **A composited video quad bleeds its last row past an ancestor clip.** The phone band is short
  enough that `cover` crops horizontally only, so the film frame's own bottom row is on screen —
  and it drew a bright hairline along the seam, through both `overflow: hidden` and an opaque
  scrim (reproduced in Chrome at DPR 2 and 3). Fixed by ending the film one pixel *inside* the
  band with its own `clip-path` (`height: calc(100% + 2px)` + `clip-path: inset(0 0 3px 0)`).
  Matching the clip exactly to the band edge brings the hairline back.

## Verification

`npm run lint`, `npm test` (33 pass), `npm run build` all green; `prettier --check` clean on every
touched file. In-browser (Chrome via DevTools protocol, device emulation, real video decode —
`readyState 4`):

- **320×568, 375×667, 390×844, 430×932**: band 41–59svh, hero actions clear the dock, no
  horizontal overflow, no seam, no console errors.
- **Full hero scroll sequence at 390×844**: `--p` 0 → 0.948 over 844px with the film tracking it
  (`currentTime` 0 → 7.97 of 8.04) and the identity on screen throughout — no blank state at any
  scroll position.
- **Dock scroll-spy**: Home → Impact → Projects → Skills → Career → Contact → Home on return to
  the top. Dock links glide to their sections and update the active state.
- **Ask Fredrik from the dock**: sheet opens above the dock (bottom 755.6 vs dock top 772), Ask
  shows active, floating pill hidden, input focused; closing returns focus to the dock button. With
  a simulated 336px keyboard the sheet and its input clear the keyboard line.
- **Static / reduced-motion phone hero** (no `is-scrub`): 100svh, band 52%, identity fully
  visible, actions clear the dock.
- **Desktop unchanged at 1440×900** — nav 68px sticky, runway 320vh, hero sticky at `top: 68px`,
  media absolute inset 0 with no clip-path, content bottom-right at 108px, HUD/scroll cue/ghost
  CTA all visible, footer padding 2.5rem, dock `display: none`. **Tablet 768×1024** keeps the
  header, the 320vh runway, and the ≥720px finale runway (2189px).

Not verifiable here: real iOS Safari safe areas and the on-screen keyboard (emulation only), and
touch tap feedback on a physical device.
