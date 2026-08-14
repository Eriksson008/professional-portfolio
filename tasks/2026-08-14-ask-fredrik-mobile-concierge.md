# Ask Fredrik — mobile concierge redesign

## Outcome

On a phone, Ask Fredrik is a full-viewport AI concierge sheet rather than a floating widget: it owns
the screen, opens without forcing the keyboard, shows all four starter prompts in a tappable grid
with no horizontal scrolling, replaces them with contextual follow-ups once the conversation starts,
and keeps the composer above the keyboard. Desktop keeps the floating card it already had.

## Problem

Reported from real-device iPhone testing (numbered in the brief):

1. Welcome text, suggestions and composer fought for the same height with the keyboard up.
2–4. The suggestion chips were clipped; ~1–1.5 of them fit on screen.
5–7. The horizontal chip carousel could not be swiped reliably and advertised nothing off-screen,
so the assistant's most useful affordance was effectively hidden.
8. Disclaimer + suggestion tray + composer were permanent chrome.
9. The portfolio dock painted **above** the panel (`.dock` z-index 130 vs `.af-root` 120), and
nothing locked the page, so the assistant read as a widget over a live site.
10. Chrome outweighed the conversation once answers got long.

Root causes found before editing (full table in the spec): `.af-chip { max-width: 78vw }`;
every scroll affordance suppressed (`scrollbar-width: none`, hidden `::-webkit-scrollbar`, no snap,
no edge fade); a 34px horizontal scroller nested inside a vertical one, which loses iOS axis
arbitration; `.af-log { min-height: 180px }` refusing to shrink and pushing the composer out; and
autofocus-on-open raising the keyboard before anything had been read.

## Scope

`src/components/AskFredrik.tsx`, `useAskFredrik.ts`, `useSheetViewport.ts` (new),
`useDesktopViewport.ts`, `MobileDock.tsx`, `src/lib/askPrompts.ts` + test (new),
`src/lib/matchStaticAnswer.ts`, `src/data/fredrikContext.ts`, `src/styles/ask-fredrik.css`,
`src/styles/dock.css`.

## Non-goals

No backend change — `src/lib/askFredrik.ts`, the `/ask` contract, the session id, D1 logging, the
Worker knowledge base and the admin dashboard are untouched. No new library (framer-motion stays the
only approved one and this needed none — all motion is CSS transform/opacity). No new metrics or
copy claims. **One** new colour value: the full-screen scrim, which has no existing token and must
not invert with the appearance — added to `src/styles/tokens.css` as `--scrim` rather than inlined,
per AGENTS.md. No other new colour or spacing values.

## Acceptance criteria

- No overlap of text, suggestions, or chrome at any tested viewport.
- No suggestion clipped; nothing important behind a horizontal swipe.
- All four starters discoverable on first open **without scrolling** on a normal iPhone.
- Composer never behind the keyboard; no destructive jump when it opens.
- Portfolio dock does not compete with the open sheet; background cannot scroll.
- Suggestions stop consuming permanent vertical space after the first question.
- Long answers stay comfortable and manually scrollable; no forced scroll when the reader is away
  from the bottom.
- Desktop intact. Lint, typecheck, build, tests pass. `/ask` behaviour unchanged.

## Relevant context

- Spec + full diagnosis: `docs/superpowers/specs/2026-08-14-ask-fredrik-mobile-concierge-design.md`
- Chrome geometry tokens (`--dock-h` / `--dock-space`): `src/styles/tokens.css`
- Prior mobile work: `docs/superpowers/specs/2026-08-13-mobile-dock-and-hero-design.md`

## Verification

`pwsh scripts/verify.ps1` — lint, 44 tests, production build. Worker unchanged, so its checks were
not run. Chrome DevTools measurement at 320×568, 390×844, 393×852, 412×915, 430×932, 700×390
landscape, 719×900 (shell boundary), 768×1024, 1534×822 — in both light and dark appearance, with a
simulated `visualViewport` keyboard.

## Risks

- **Scroll lock** is `overflow:hidden` on `html`/`body` plus full-viewport sheet coverage, not the
  `position:fixed` body technique — that technique zeroes `scrollY`, which would re-seek the two
  scroll-scrubbed films on every open and close. Verified against a wheel gesture; the iOS-specific
  leak class is covered by the sheet covering everything and containing its own overscroll.
- **Emulation is not iOS Safari.** The keyboard was simulated by shrinking `window.visualViewport`,
  which exercises the real code path but not WebKit's own behaviour. Real-device confirmation is
  still worth doing.

## Completion evidence

`scripts/verify.ps1`: `OK: lint` · `tests 44 / pass 44 / fail 0` · `OK: build` ·
`All required checks passed.`

Measured in Chrome (values from `getBoundingClientRect`, not inspection):

- 390×844 first open — 4 starter cards, all inside the log, `log.scrollHeight <= clientHeight`
  (no scrolling needed); dock suspended; `html` locked; focus on the panel, **not** the input.
- 390×844 with a 508px visual viewport (keyboard) — panel `0→508`, composer bottom `469`,
  disclosure bottom `508`, all four cards still fully visible, nothing overlapping.
- Composer growth 1→4 lines: `46 / 69 / 92 / 116px`, 5th line scrolls internally; send button
  stays 44×44 throughout; font-size `16px`.
- Follow-up row: `scrollWidth === clientWidth` (no carousel), min touch height 40px.
- Reader scrolled up mid-generation: position held at `0` and a `↓` button offered instead.
- Close → dock restored, page unlocked, `scrollY` preserved exactly (2400 → 2400), `--af-vh`
  cleared, focus returned to the dock's Ask button.
- Desktop 1534×822 — 420×494 card bottom-right, launcher pill, `Send` word, non-modal, page still
  scrolls, no backdrop.

Four defects were found by measurement during this task and fixed: a 2px textarea scrollbar from
border-box height math; a disabled send button that read as active; a WCAG failure on the disclaimer
(`--faint`@.62 = 2.62:1 dark, `--faint` full = 4.24:1 light → `--silver` = 10.62:1 dark / 5.38:1
light); and a JS/CSS breakpoint mismatch at fractional widths that gave the **desktop** card the
phone sheet's modal focus trap.

## Independent review round

The `reviewer` agent (not the author) reviewed the diff and returned **NEEDS WORK**. Every finding
was accepted; nothing was argued down. Fixed before merge:

- **Blocking — focus escaped the "modal".** Every prompt control unmounts itself when used, dropping
  focus to `<body>`, outside the keydown-scoped Tab trap; the next Tab entered the page behind the
  opaque sheet. Focus is now parked on a stable element first (`parkFocus()`, D22).
- **Blocking — "Desktop is unchanged" was false** in `PROJECT_CONTEXT.md` and `AGENTS.md`. Desktop
  keeps its *shell* but shares the new content model, which is what the brief asked for. Both files
  and the spec now say that instead.
- Free-text questions permanently retired curated topics on a bare keyword match, even when the
  Worker had answered something else (D23).
- The jump-to-latest button flashed on every auto-scrolled turn; reopening after scrolling up landed
  on the oldest message. Both are now covered by `askScroll.test.ts` (D24, D16).
- The scroll-follow state machine was extracted to a pure, tested `askScroll.ts` — 13 tests, repo
  precedent being `scrollGlide.ts`.
- `--scrim` token instead of an inline `rgba()`; dead `useKeyboardInset` and `suggestedQuestions`
  deleted; dead backdrop click handler removed; IME `isComposing` guard on Enter-to-send; the
  ironic second spelling of the shell breakpoint in a `min-width: 720px` media query deleted.

Re-verified after the fixes: `OK: lint` · `tests 57 / pass 57 / fail 0` · `OK: build`.

### Second round — hardening chosen after review (user decision)

`parkFocus` closed every known escape route but was preventive, so the fix was made structural, and
the same pass fixed a dismissal gap review had not raised:

- **`inert` on every sibling of `.af-root` while the sheet is open** (D26). The background cannot
  take focus, a pointer, or a screen-reader cursor regardless of where focus lands. Measured: with
  the sheet open, `document.querySelector('main a').focus()` leaves `document.activeElement` on
  `.af-panel` — the background refuses focus. 5 siblings inert while open, 0 after close.
- **Back-gesture dismissal + `#ask` deep link** (D27). Measured: Back closes the sheet and stays on
  the site (`hash` → `''`, scroll preserved, inert restored, focus back on the dock's Ask button);
  the × retires the pushed entry so `history.length` does not grow; `/#ask` opens the assistant on a
  cold load *and* from a same-document link, with exactly one entry in the stack so one Back exits.
- Desktop re-checked: 0 inert, no history entry, page still scrolls, a background link is still
  focusable, `aria-modal` still absent, 420px card, `Send` word. Unaffected.

A full `#ask` page and native `<dialog showModal()>` were both weighed; the reasoning for choosing
`inert` + history over them is recorded in the spec under "Alternatives weighed".

Re-verified: `OK: lint` · `tests 57 / pass 57 / fail 0` · `OK: build`.

The reviewer explicitly confirmed clean: `matchStaticAnswer` answer-selection is behaviourally
identical; no curated `answer:` or `keywords:` line changed; no phone number, codename, new metric
or PII anywhere in the diff; no new dependency and no framer-motion misuse; `prefers-reduced-motion`
fully covered; the scroll lock correctly never applies to desktop.
