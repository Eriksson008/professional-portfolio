# Ask Fredrik — mobile concierge redesign

**Date:** 2026-08-14
**Scope:** UX/UI architecture of the Ask Fredrik surface. **No backend change** — the Worker, the
`/ask` contract, D1 logging, the curated matcher, and the admin dashboard are untouched.

---

## 1. Diagnosis of the shipped implementation

Read before editing (brief §17). Files: `src/components/AskFredrik.tsx`,
`src/styles/ask-fredrik.css`, `src/styles/dock.css`, `src/components/useKeyboardInset.ts`,
`src/components/MobileDock.tsx`, `src/styles/tokens.css`.

| Question | Finding |
| --- | --- |
| Root component | `src/components/AskFredrik.tsx` — launcher + panel in one `.af-root`. |
| Modal/sheet | None. `.af-panel` is a `role="dialog"` card inside a fixed `.af-root`, deliberately **non-modal**. |
| Mobile breakpoints | CSS only: `max-width: 560px`, `max-width: 719px`, `max-height: 520px`. No JS breakpoint. |
| Suggestion list | Inline `.af-tray` / `.af-chips` / `.af-chip`, rendered as a sibling *below* the transcript. |
| Suggestion overflow | `≤560px`: `.af-chips { display:flex; flex-wrap:nowrap; overflow-x:auto }`, `.af-chip { flex:none; max-width:78vw }`. |
| `overflow:hidden` parents | `.af-panel { overflow:hidden; overscroll-behavior:contain }` (deliberate — makes the panel a scroll container so wheel can't fall through to the scrubbed film). |
| `touch-action` | Not set anywhere in `src/styles/**`. Not the cause. |
| `pointer-events` | Only on decorative overlays. Not the cause. |
| Viewport height | `max-height: calc(100dvh - var(--dock-space) - var(--kb-inset) - 2rem)`; `--kb-inset` from `useKeyboardInset` (visualViewport, ≥120px only). |
| Composer | `.af-form` in normal flow, last-but-one child; `.af-disclosure` under it. |
| Autofocus | **Yes** — `useEffect(() => { if (open) inputRef.current?.focus() }, [open])`, and again after every answer. Forces the iOS keyboard open on first paint. |
| Body scroll lock | **None.** The page scrolls freely behind the open panel. |
| Mobile bottom nav | `.dock`, `z-index: 130`. |
| z-index hierarchy | hero 0–3 · nav 100 · **`.af-root` 120** · **`.dock` 130** · skip-link 200 · grain 2000. |

### Why the suggestion row cannot reliably be swiped

Four causes compounding, none of them `touch-action`:

1. **`.af-chip { max-width: 78vw }`** — one chip is ~78% of the screen, so 1–1.5 fit. Observations
   3 and 4 are this line.
2. **Every scroll affordance is suppressed** — `scrollbar-width: none`, a hidden
   `::-webkit-scrollbar`, no scroll-snap, no edge gradient. Nothing on screen says "more exists"
   (observation 6).
3. **Axis arbitration.** The row is a ~34px-tall horizontal scroller nested inside a vertical
   scroller (`.af-log`) inside a page that is itself the scroll-scrubbed film. iOS commits a touch
   to one axis on the first move; a thumb arc across a 34px band is rarely horizontal enough, so
   the gesture is handed to a vertical ancestor (observation 5).
4. **`.af-panel { overflow: hidden }` + `.af-chips { margin-inline: -1.25rem }`** bleeds the track
   to the panel edge, where the 22px `--radius-card` clips it — so the partial chip reads as
   "broken", not as "scrollable".

### Why the dock stays prominent under the open panel

`.dock` is `z-index: 130`; `.af-root` is `z-index: 120`. The dock paints **above** the assistant.
Nothing suspends it, nothing locks the page, so the portfolio stays fully live behind a widget
(observations 8 and 9).

### Why the first-open state is cramped with the keyboard up

`.af-log { min-height: 180px }` — with `flex: 1` in a height-capped column the log refuses to
shrink below 180px, so the tray and composer are pushed past the sheet's bottom edge. Combined with
autofocus opening the keyboard immediately, the suggestions are off-screen before the user has done
anything (observations 1 and 2).

---

## 2. Design

Desktop (**≥720px**) keeps the floating concierge card, the launcher pill, the text `Send` button,
and its non-modal behaviour. Phones (**≤719px**) get a full-viewport sheet. One component, one
transcript, one controller; **only the shell** changes responsively.

To be precise about what "desktop is preserved" means here, because it is easy to overclaim: the
brief (§15) asks for the message components, prompt definitions, backend state and API integration
to be **shared**, with the shell/layout responsive. So desktop keeps its shell unchanged and
deliberately *does* inherit the new content model — the welcome state in place of the greeting
paragraph, the starter grid in place of the chip tray, contextual follow-ups, the auto-growing
textarea, the jump-to-latest button and the near-bottom scroll policy. Desktop is preserved, not
frozen.

### 2.1 Mobile shell

```
.af-root.is-open      position:fixed; top:var(--af-vt); height:var(--af-vh); z-index:140
├── .af-backdrop      fixed inset:0, scrim only (see note)
└── .af-panel         absolute inset:0; display:flex; flex-direction:column
    ├── .af-head      flex:none, safe-area top, compact
    ├── .af-log-shell flex:1; min-height:0   ← the only scroller
    │   ├── .af-log       overflow-y:auto; overscroll-behavior:contain
    │   │   ├── .af-welcome + .af-starters   (empty state, in flow)
    │   │   ├── .af-msg …                     (conversation)
    │   │   └── .af-followups                 (after the newest answer)
    │   └── .af-jump   absolute, appears when scrolled away from the bottom
    ├── .af-form      flex:none  (textarea + circular send)
    └── .af-disclosure flex:none, shrinks after the first message
```

Nothing is absolutely positioned except the two overlays (edge fades, jump button). `--af-vh` /
`--af-vt` come from `window.visualViewport` via `useSheetViewport`, so the sheet is exactly the
*visible* box — with the keyboard up the composer sits on top of it by construction rather than by
subtracting a guessed keyboard height.

### 2.2 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D1 | Starter prompts become a **2-column grid inside the scroll region**, not a pinned tray. | Kills the carousel and the permanent vertical cost in one move (brief §1, §2, §19). |
| D2 | `grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr))` | 2 columns at ≥320px, 1 column below, with no extra media query (§1). |
| D3 | **Four** starters: `strengths`, `role-fit`, `projects`, `why-interview`. `stack` moves to follow-ups. | §1 asks for ~4 high-value prompts; five never fit a 2×2. |
| D4 | Card labels are a new optional `label` on `CuratedAnswer`; the **full `question` is still what gets sent**. | Short cards, unchanged matcher/Worker input (§16). |
| D5 | After an answer, up to **3 contextual follow-ups** render beneath it, ordered by a new `followUps` id list, then by canonical order; already-asked topics are removed. | §2, §11. Real context, not a rotated library. |
| D6 | `More questions ↓` expands the rest in place (wrapping chips, never a carousel). | §11. |
| D7 | Free-text questions resolve a topic id via new `matchCuratedId()` so follow-ups stay relevant and answered topics stop being re-offered. | §2. |
| D8 | The `greeting` paragraph is replaced by structured `welcome.headline` + `welcome.lead`. | §3 — hierarchy, not a wall. |
| D9 | Mobile assistant messages lose their card: full width, no border, `--text` instead of `--muted`. User turns stay a compact right-aligned bubble. | §10 — readability over chrome. `overflow-wrap: anywhere` everywhere. |
| D10 | `<input>` → auto-growing `<textarea>` (1→4 lines then internal scroll), 16px font on mobile, Enter sends / Shift+Enter newlines. | §7. 16px is what stops iOS zoom. |
| D11 | Send button renders both a `Send` label and an arrow glyph; CSS shows the label ≥720px and a 44px circular arrow ≤719px. | §7 mobile, §15 desktop. 44px is the touch-target floor. |
| D12 | Autofocus is gated on `useAskSheet()` — the same `(max-width: 719px)` query the stylesheet uses. Phones open with no keyboard; refocus after an answer is also desktop-only. | §9. See D21 for why it is that query and not a second spelling of it. |
| D13 | The dock gets `.is-suspended` (translate + fade + `pointer-events:none` + `aria-hidden` + `tabIndex=-1`) while the assistant is open. | §4. |
| D14 | `useAskFredrik` restores focus in an **effect** after close, not synchronously inside `close()`. | The dock button is hidden at the moment `close()` runs; focusing it before React re-renders silently fails. |
| D15 | Page lock = `html.af-open, html.af-open body { overflow: hidden }` **scoped to ≤719px**, plus full-viewport sheet coverage with `overflow:hidden; overscroll-behavior:contain` on `.af-panel` (the repo's existing anti-fall-through idiom) and `overscroll-behavior:contain` on `.af-log`. | §4. Deliberately **not** the `position:fixed` body hack: that zeroes `scrollY`, and this page scrubs two videos off `scrollY`. See "Known limits". |
| D16 | Auto-follow only when the log is within 56px of the bottom. The rule is a pure function in `src/components/askScroll.ts` (`nextFollowState`), not inline component logic. A `↓` button appears when away from the bottom. | §13, and repo precedent (`scrollGlide.ts`, `videoMediaTierForWidth`): it is the most bug-prone part of a chat log, and three of its rules exist because the obvious version got them wrong. |
| D17 | Motion stays CSS (transform/opacity, 150–300ms). No framer-motion added; nothing animates height. | §20, and the repo's framer-motion-only rule is about *libraries* — this needs none, and height animation fights the keyboard. |
| D18 | `.af-log { min-height: 180px }` → `min-height: 0` on mobile. | The direct cause of the composer being crushed. |
| D19 | All `≤560px` carousel CSS is deleted, not overridden. | §17 — no dead broken styling left behind. |
| D20 | Mobile sheet is `aria-modal` **with** a Tab focus trap; desktop stays non-modal with no trap. | `aria-modal` without a trap is a false claim. |

### 2.3 Decisions added during verification and review

D1–D20 were written before the code. These came out of measuring the result and out of independent
review, and each one is a defect that inspection did not catch.

| # | Decision | Why |
| --- | --- | --- |
| D21 | The shell breakpoint is written **once**: `useAskSheet()` matches `'(max-width: 719px)'`, character-identical to the stylesheet. `useDesktopViewport()` was deleted rather than left as a second spelling. | `(min-width: 720px)` and `(max-width: 719px)` are complements only at whole-pixel widths. Measured at a fractional 719.2px viewport: **neither matched**, and the desktop card ran with the phone sheet's `aria-modal` and Tab trap. |
| D22 | Focus is parked on a stable element (`parkFocus()`) **before** any state change that unmounts the control that triggered it. | Every prompt control removes itself when used — a starter card ends the empty state, a follow-up is replaced by the thinking indicator, "More questions" is replaced by the questions. The browser then drops focus to `<body>`, outside `panelRef`, where the keydown-scoped trap cannot see it: the next Tab walked into the page behind the opaque sheet, with no visible focus ring and no way back. Found by review, not by measurement. |
| D23 | A curated topic is retired from future follow-ups only when `promptId` was explicit **or** `result.source === 'static'`. | `topicId` for free text is a keyword guess, and several topics match on a single common word (`'why'` → `why-interview`). Production sets `VITE_ASK_FREDRIK_API_URL`, so the Worker answers — "why did he build this site?" would otherwise delete the strongest recruiter prompt from every later list on the strength of an answer nobody saw. |
| D24 | `atBottom` reports `true` while our own scroll is in flight; the composer's height is `scrollHeight + borders`; the disclaimer uses `--silver`. | Three measured defects. The jump button flashed on every answered turn because `syncScroll()` ran synchronously before a smooth scroll had moved anything. The textarea showed a 2px scrollbar on one line of text because it is `border-box` and `scrollHeight` excludes borders. And the disclaimer failed AA in **both** appearances — `--faint`@.62 is 2.62:1 dark, `--faint` at full strength is 4.24:1 light; `--silver` is 10.62:1 / 5.38:1. |
| D25 | The mobile backdrop is a scrim with **no** click handler, and `useKeyboardInset` was deleted. | The sheet covers the whole visible viewport, so the only reachable backdrop is the strip behind the keyboard — a tap-to-close that can never be tapped is worse than none. `useKeyboardInset` published `--kb-inset` for the old panel's `max-height`; that was its only consumer, so it had become a global `visualViewport` listener writing a property nobody read, on a page that scrubs video off scroll. |

### 2.4 Second review round — making the modal structural

D22 (park focus before the trigger unmounts) closed every escape route that existed, but it is
**preventive**: a rule each future control has to remember, with nothing to catch a forgotten call.
These two replace the convention with structure. Chosen over a full `#ask` page and over native
`<dialog showModal()>` — see "Alternatives weighed".

| # | Decision | Why |
| --- | --- | --- |
| D26 | While the sheet is open, every **sibling** of `.af-root` gets the `inert` attribute (`useSheetViewport`). Attributes already present are left alone and only what was set is removed on cleanup. | Structural, not preventive: the background cannot take focus, a pointer, or a screen-reader cursor regardless of where focus lands, so the whole bug class behind D22 stops existing. Verified by calling `.focus()` directly on a `main` link with the sheet open — it is refused. Siblings-of-root rather than a hard-coded list so a future top-level element is covered automatically. Ordering is load-bearing and commented in the hook: focus is parked in a **layout** effect and React runs every layout effect before any passive one, so focus is already inside the sheet before `inert` is applied — the reverse order would drop it to `<body>` at exactly the wrong moment. |
| D27 | Opening the sheet pushes one history entry (`#ask`); Back closes it, and closing any other way retires the entry. `/#ask` is a deep link, handled on load **and** on `hashchange`. | Before this the site created **no** history entries at all — `useAnchorGlide` only ever calls `replaceState` — so pressing Back with the sheet open left the site. On a full-screen surface Back (and the iOS edge-swipe that maps to it) is the first gesture people reach for, and the × was the only way out. `hashchange` as well as load because a hash-only navigation never remounts React, so a load-time check alone does nothing for anyone already on the page. The handler only ever *opens*: a hashchange back to `''` is what Back itself produces, and acting on it would fight `useSheetHistory`. |

#### Alternatives weighed

- **Ask Fredrik as its own `#ask` page on phones.** Dissolves the focus problem outright — with no
  modal there is nothing to trap — and would delete the scroll lock and its iOS caveat entirely.
  Rejected because it reintroduces the problem the lock was designed around: if the portfolio
  unmounts, returning re-seeks the scroll-scrubbed hero, and if it merely hides, the lock is needed
  anyway. It also forces a choice between showing the dock (competing again) and hiding it (needing
  a back affordance, i.e. the × again), and it takes a recruiter out of their place in the page.
  D27 buys the part that mattered — Back dismisses it, the URL is shareable — for none of that.
- **Native `<dialog showModal()>`.** The strongest correctness story: browser-owned focus trap,
  automatic inerting, Escape, and top-layer rendering that would make the dock z-index conflict
  disappear. Rejected for now because `showModal()` in the top layer has known iOS interactions with
  the on-screen keyboard, and the `--af-vh` sizing that makes the composer sit on the keyboard is
  the one part of this change that is measured and proven. `inert` gets the same containment
  guarantee without re-opening it. Worth revisiting if the shell is ever rebuilt.

### 2.5 Known limits (stated, not hidden)

- **Scroll lock** uses `overflow:hidden` on `html`/`body` rather than the `position:fixed` body
  technique. On iOS Safari `overflow:hidden` alone has historically been leaky; here it is backed by
  a sheet that covers the whole visible viewport and contains its own overscroll, so there is no
  exposed surface for a page-scrolling gesture to start on. The `position:fixed` alternative was
  rejected because it forces `scrollY` to 0, and `AstronautHero` / `AstronautFinale` scrub video
  `currentTime` off `scrollY` — locking would seek both films on open and again on close.
- Verification below is Chrome DevTools device emulation. Emulation reproduces layout, safe areas
  (via manual insets) and `visualViewport` resize, but **not** iOS Safari's real keyboard.
  **Resolved 2026-08-14: the user confirmed the shipped result on a real iPhone** — the same device
  and the same keyboard-open scenario that produced the original ten findings. Emulation's blind
  spot is closed for this change; it is still a blind spot for the next one.

---

## 3. Files

| File | Change |
| --- | --- |
| `src/data/fredrikContext.ts` | `label?` + `followUps?` on `CuratedAnswer`; `welcome` replaces `greeting`; `starterPromptIds`. |
| `src/lib/matchStaticAnswer.ts` | Extract `matchCuratedEntry`; add `matchCuratedId`. Answer semantics unchanged. |
| `src/lib/askPrompts.ts` *(new)* | Pure prompt selection: `starterPrompts`, `followUpPrompts()`. |
| `src/lib/askPrompts.test.ts` *(new)* | Unit tests for the above. |
| `src/components/askScroll.ts` + `.test.ts` *(new)* | `nextFollowState` — the follow-the-conversation rule as a pure, tested function. |
| `src/components/useSheetViewport.ts` *(new)* | `--af-vh` / `--af-vt` / `.af-open` / `.af-kb` and background `inert` while the sheet is open, plus `useAskSheet()` (D21) and `useSheetHistory()` (D27). |
| `src/components/useDesktopViewport.ts` | `useDesktopViewport()` removed (D21); `useVideoMediaTier` untouched. |
| `src/components/useKeyboardInset.ts` | **Deleted** (D25), and its call removed from `src/App.tsx`. |
| `src/styles/tokens.css` | `--scrim` added — the one new colour, given a name rather than inlined. |
| `src/components/AskFredrik.tsx` | Shell, empty state, follow-ups, composer, scroll policy, focus policy. |
| `src/components/useAskFredrik.ts` | Focus restore moved to an effect. |
| `src/components/MobileDock.tsx` | Suspend while the assistant is open. |
| `src/styles/ask-fredrik.css` | Rewritten; carousel CSS deleted. |
| `src/styles/dock.css` | `.is-suspended`. |

Unchanged: `src/lib/askFredrik.ts`, the whole `cloudflare/ask-fredrik-worker/**` tree, analytics,
D1 logging, admin.
