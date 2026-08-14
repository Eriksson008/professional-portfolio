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

---

## Amendment — 2026-08-13, later the same day

The user reviewed the shipped result and reversed **section 4 (the re-composed phone hero)** while
keeping everything else. Two further changes landed in the same pass. The dock, the shared
navigation config, and the one-assistant-two-triggers work above are unchanged and still current.

### 4′. The phone hero goes back to the desktop composition

> "opening hero isn't the overall view anymore when scrolling as Mission Portfolio and Fredrik
> Eriksson do not fade in and are always in view"

The stacked band was solving for dead scroll; what it cost was the opening *shot*. On a phone the
first screen is now the film and nothing else — exactly what desktop shows — and the identity rises
out of it on scroll:

    [ film fills the frame ]        [ film fills the frame ]
    (nothing else)            →     Mission Portfolio
                                    Fredrik Eriksson
                                    Senior Software Engineer building AI, …
                                    [ View Work ] [ Download Résumé ]
      at load                         after ~0.3 of the runway

Removed: the `.hero` flex column, `.hero-media` as an in-flow band, the video `clip-path` seam fix
(no seam without a band), the phone `.hero-glow` override, the load-time `hero-rise-flat`
choreography, and the landscape un-pin block (it existed only because a band + copy + dock could
not share a 375px-tall frame; an overlay can). Kept: the 200svh runway, `FILM_END_PHONE = 0.94`,
the portrait `object-position` pan, hidden telemetry, the hidden scroll cue, the two-column CTAs
without the ghost button, and `--dock-space` clearance. Phones keep the blur-free identity reveal
(`filter: none`) — that part was always about mobile GPU cost, not composition.

**The finale's phone runway is no longer derived from the hero's film travel** (see 4″), so the
three-coupled-constants rule in "Two things worth remembering" now applies to **two** places
(`FILM_END_PHONE` and the ≥720px runway/JS travel constant), not three. The video-quad hairline
note is retained as a warning: it only bites when a short band makes `cover` crop horizontally,
which no longer happens on this page.

### 4″. The closing film moves above the closing text on phones

> "on mobile, I want ending hero to be above 06 Open to Meaningful... text rather than below"

`.finale-inner` becomes a flex column at ≤719px with `.finale-media-runway { order: -1 }`, and the
band **stops pinning**: no runway, `position: static`, and its scrub follows its own travel through
the viewport (complete when its top reaches 18% of the screen — one screen of scroll, chosen over
the pinned runway's two so the contact actions are not behind a viewport of film). Tablets
(720–879px) and wide-but-short windows keep the film below the text on the sticky runway,
unchanged.

Three consequences worth knowing:

- **The staged text ramps off the panel's travel wherever the band is ordered first.** With the
  band as the section's first child, a section-relative ramp finishes before the copy it stages is
  on screen. `AstronautFinale.measure()` reads the band's **computed `order`** — the same
  CSS-owns-the-mode idiom as the existing computed-`position` check — and measures `.finale-panel`
  only when it is `-1`. Everywhere else it keeps measuring the section, which matters more than it
  looks: in the wide-but-short bracket the panel is vertically centred against a 2,011px media row,
  so a panel-relative ramp measures **−0.845** where the section measures 0.766. Reviewer-caught.
- **The band no longer fades in on `--fp`.** It is on screen before the panel whose progress it
  used to borrow, so `.finale.is-scrub .finale-media` is opaque and untransformed on phones.
- **`#contact` has to land on the copy, not on the film.** The anchor glide lands in-flow sections
  at their top, which is now a viewport of film with the contact copy below it and un-revealed
  (measured: `--fp` 0.75, the note and repo lines still faded). `useAnchorGlide` now honours an
  opt-in `[data-anchor-landing]` element inside the target section, and `AstronautFinale` sets it
  on the panel **on phones only** — so the landing settles at `--fp` 1 with the copy at the top of
  the frame, as it did before the reorder, while every other viewport is untouched.

`inFlowMediaProgress` (finish when the band is fully visible — 219px of scroll on a phone, far too
fast without a runway) was replaced by `viewportTravelProgress(top, viewportHeight, endFraction)`,
which both the text ramp and the phone film now use. Tests moved with it.

### 5. The header brand mark is the monogram

The boxed `FE` lettering in the desktop header is now `public/logo-fe.png` — the user's monogram
lockup, downscaled to 216px for a 36px tile. The square crop is centred on the **glyph** (x 420–920
of the 1254px source) rather than on the artwork's bounding box, because the "FREDRIK ERIKSSON"
wordmark is wider than the monogram and centring on it pushes the mark visibly off-centre in a
36px box. The wordmark itself stays — it crosses the glyph at mid-height and cannot be cropped out
without cutting the monogram — and at this size it reads as a hairline across the mark rather than
as text. `alt=""` because the link already carries `aria-label="Fredrik Eriksson — home"`; that
also retired `profile.initials`, which nothing rendered any more. The dock's Home glyph stays a
line icon: it belongs to a set of seven drawn on one 24×24 grid, and photographic artwork at 22px
would read as a smudge.

### 1′. The readout's ceiling, after review

The first version of the fix capped the anchor with a flat 60px floor and a 52px half-height, and
an independent review found two holes, both reproduced before fixing:

- **Below ~600px of viewport the floor re-created the collision it existed to prevent.** A 1536×864
  laptop at 200% browser zoom is **768×432 CSS px** — still wide enough for every desktop rule. The
  identity alone takes ~330px of that 364px frame, so no anchor fits the readout: it clamped to the
  floor, clipped its first line against `overflow: hidden`, and sat on the eyebrow (**measured
  −84px**). Below 600px of viewport height the readout is now hidden outright, exactly as on
  phones — every figure in it appears again in the Impact section.
- **The 52px half-height is wrong below 900px wide**, where `.hud-cell` gains padding and the list
  is ~140px tall, not ~104px. It is now a variable (`--hud-half`) raised in the same block that
  adds the padding, and both the ceiling and the floor are expressed in it — so the floor is "half
  the readout + 8px", which is what actually keeps it inside the frame.

### Verification of the amendment

`npm run lint`, `npm test` (33 pass), `npm run build` green. In-browser (Playwright, real video
decode), measuring the readout-to-eyebrow gap that started this pass:

| Viewport | Before | After | Readout |
| --- | --- | --- | --- |
| 1920×1080 | +128px | +128px | shown, anchor 41% (unchanged) |
| 1534×822 | **−5px** | +23px | shown, 38.6% |
| 1366×768 | overlap | +23px | shown, 34.7% |
| 1280×600 | overlap | +24px | shown, 17.9% |
| 1024×640 | overlap | +44px | shown, 22.8% |
| 900×620 | overlap | +51px | shown, 17.2% (140px-tall list) |
| 880×740 | +35px¹ | +53px | shown, 29.8% |
| 720×800 | overlap | +61px | shown, 34.6% |
| 900×560, 820×560 | clipped | — | hidden |
| **768×432** (200% zoom) | **−84px, clipped** | — | hidden |

¹ the first version's gap, which only looked safe because the panel is shorter at that width; the
reserve itself was 18px short there.

Phone hero at 390×844 and 360×640: film full-frame at load with `--p` 0 and the identity at
opacity 0, identity risen and clearing the dock by 27px at rest after scrolling; landscape 712×390
fits without the old un-pin block. Phone finale at 390×844: band above the panel, section 1789px →
987px, `--fp` tracks the panel (0.3194 measured vs 0.319 expected) and the film tracks the band
(5.44s of 7.99 vs 0.682 expected); tapping Contact in the dock lands with the panel top at 0 and
the copy settled. Tablet 760×900 unchanged: panel first, 1972px sticky runway, `--fp` 0.8672 =
section travel 0.867; wide-short 1440×700 likewise (0.7665 = 0.766). Reduced motion at 390×844:
no `is-scrub`, poster `<img>`, band still above the panel, everything opaque, actions clear the
dock. Desktop finale at 1534×822 still pins (3,174px runway, grid, `--fp` 0.8224 at 0.85 of it).
