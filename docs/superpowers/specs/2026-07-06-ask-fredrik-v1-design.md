# Ask Fredrik v1 — frontend-only recruiter concierge (2026-07-06)

User-directed 10-point brief: add a free, safe, production-ready "Ask Fredrik" assistant with
no backend, no LLM, no keys, and no paid services — the frontend foundation a future
Cloudflare-Worker/LLM backend can plug into. This doc records the decisions made inside the
brief's degrees of freedom.

## Decisions

### Widget, not a section (brief allowed either)

A floating concierge is less intrusive than a seventh numbered section, matches the
"premium concierge" framing, and is reachable from anywhere on the page. It renders as a
fixed bottom-right pill (`Ask Fredrik` + ice status dot) that opens a non-modal black-glass
dialog panel.

**Hero-respecting reveal:** the launcher stays hidden (opacity 0, `aria-hidden`,
`tabIndex -1`) until `scrollY > 0.55 × viewport height`, then fades in — the established art
direction opens on the astronaut alone with only a scroll cue, and a chat pill at load would
break that frame. Visibility latches on while the panel is open; scrolling back to the top
re-hides the pill (matching the hero choreography, which also reverses).

### Architecture (three new files + wiring)

- `src/data/fredrikContext.ts` — the entire curated "brain": greeting, unknown-question
  fallback, disclosure line, and `curatedAnswers` (question + keywords + answer). The first
  five entries are the brief's suggested questions and surface as chips; six keyword-only
  topics (leadership, AI, experience, security, contact) catch common recruiter phrasings.
  All content follows the résumé rules: approved public facts only, git-verifiable metrics,
  no internal codenames.
- `src/lib/askFredrik.ts` — `askFredrik(question)` abstraction. If
  `VITE_ASK_FREDRIK_API_URL` is set at build time it POSTs `{question}` and expects
  `{answer}`; any failure (network, non-OK, bad shape) silently falls back to the static
  matcher, so the widget can never error out in front of a recruiter. Unset (v1 / GitHub
  Pages), it goes straight to the static matcher.
- `src/components/AskFredrik.tsx` — the widget. Plain React state + CSS (no framer-motion —
  a fixed overlay doesn't participate in scroll reveals).
- Wiring: mounted once in `App.tsx` after `Footer`; `ask-fredrik.css` imported in
  `main.tsx`; env var typed in `vite-env.d.ts`; documented (commented out) in
  `.env.example` with an explicit "public URL, never a key" note.

### Static answer matching

Normalize (lowercase, strip punctuation/smart quotes, collapse whitespace), then score one
point per matched keyword phrase; exact match on a suggested question short-circuits.
Keywords of ≤4 chars are padded with spaces so `ai` can't match inside "maintain". Ties keep
the earliest entry. Score 0 → the brief's exact fallback copy.

### UX details

- Suggested-question chips sit between the log and the input; an asked chip is removed
  (asked-ids state) so the list shrinks as the conversation progresses.
- A 550 ms minimum "considered pause" with a three-dot typing indicator runs before each
  answer — instant static answers read as canned. The pause is content pacing, not motion,
  so it stays under reduced motion (the dots stop animating via the global rule +
  explicit `animation: none`).
- Disclosure ("Questions may be logged…") is permanently visible under the input in faint
  mono — not hidden behind a tooltip. Note: v1 does **not** actually log anything; the
  disclosure future-proofs the API path.
- Input `maxLength` 300; whitespace-only submits are inert; send disabled while busy.

### Accessibility

Non-modal `role="dialog"` (page stays scrollable/usable — deliberately not a focus trap);
`role="log"` + `aria-live="polite"` on the conversation; Escape closes and returns focus to
the launcher; opening focuses the input (visually-hidden label); launcher carries
`aria-expanded`/`aria-controls`; hidden launcher is removed from the tab order. User
messages are near-white-on-black inverted bubbles, assistant bubbles `--muted` on glass —
both well past AA on the black panel.

### Visual language

Reuses the existing token system wholesale: `--panel-2` glass, hairline top light-edge
(copied from `.glow-panel`), `--radius-card`, mono eyebrow "PORTFOLIO CONCIERGE", pill
buttons. The panel is the one place `backdrop-filter: blur(18px)` is used — it's a fixed
overlay over live content, exactly the case the in-flow panels deliberately avoid.
≤560px the panel becomes a full-width bottom sheet capped at `100dvh − 10.5rem` so the
open sheet + launcher never ride up over the 68 px nav (caught in verification).

## Verification (headless Chrome via puppeteer-core — Claude-in-Chrome extension was
not connected in this remote session)

Drove the real dev server at 1440×900 and 375×812: launcher hidden at top / revealed after
scroll with correct aria+tabindex flips; open focuses input; all five chips present; chip
answer returns the curated copy and removes the chip; unknown question ("weather on the
moon") returns the exact fallback; free-typed "AWS and Salesforce experience" keyword-lands
on the stack answer; whitespace submit inert; Escape closes and refocuses launcher;
keyboard reopen preserves the conversation; mobile sheet fits the viewport below the nav.
Zero console errors. `npm run lint` + `npm run build` green; bundle unchanged at ~84 KB gz.

## Future (explicitly out of scope for v1)

Cloudflare Worker (or similar) exposing POST `{question}` → `{answer}` backed by an LLM
with the same curated context; set `VITE_ASK_FREDRIK_API_URL` in the Pages build and the
widget upgrades itself with zero component changes. Real logging would live behind that
endpoint, never in the client.
