# Fix Ask Fredrik consistency and iPhone cinematic controls

## Outcome

Ask Fredrik gives the same accurate answer every time a visitor asks about the ~16K highlight, and
truthfully explains that it cannot recall prior prompts instead of inventing conversation memory.
On iPhone-sized viewports, the hero never visibly free-runs, the finale reaches its resolved frame
without overscrolling beyond the footer, and the launcher respects comfortable edge/safe-area space.

## Problem

The reported prompts all bypass `resolveLocalAnswer()` and reach the stateless Workers AI model:

- `can you tell me about your 16k lines of code under your highlights ?`
- `Do you have history saved?`
- `what was my last two prompts`

That makes the replies non-deterministic. The model has incorrectly attributed the ~16K figure to
the portfolio, later denied knowing the figure, and claimed it could remember a conversation even
though the Worker sends it only the current question.

Competing hypotheses checked:

- The frontend may send or persist prior messages. It does not: React keeps the visible transcript
  in page memory, while the API sends only `{ question, sessionId, page }`.
- The matcher may route the ~16K wording to the portfolio or onboarding project. It does not: all
  three reported prompts currently resolve to `{ kind: 'none' }`.
- The model may be using conversation history. It is not: the Worker sends one system message and
  one current user message on every AI call. `sessionId` is used for logging/rate limiting only.

## Scope

- Worker curated project/Q&A data and system prompt
- Frontend static fallback matcher/data
- Worker and frontend regression tests
- Mobile hero/finale scrub behavior and launcher positioning
- Relevant project/task documentation

## Non-goals

- Do not add server-side conversational memory or send the transcript to Workers AI.
- Do not change D1 logging, retention, rate limiting, admin analytics, or the widget design.
- Do not redesign or replace the astronaut choreography or delivery assets.
- Do not expose confidential employer names, internal project names, or unsupported metrics.
- Do not commit, push, or deploy without separate explicit authorization.

## Acceptance criteria

- Every reported ~16K wording deterministically explains that the figure belongs to the greenfield
  client onboarding platform, not the portfolio.
- Memory/history questions deterministically state that the assistant receives only the current
  question and cannot retrieve prior prompts.
- The answer distinguishes the current-tab transcript from optional analytics logging without
  implying the assistant can read the log.
- Equivalent handling exists in both the Worker path and the frontend static fallback.
- No mobile priming path allows visible autonomous playback.
- The in-flow finale reaches its final scrub-visible frame within the normal scroll range.
- Ask Fredrik has increased mobile edge spacing and honors iPhone safe-area insets.
- Regression tests cover the three exact reported prompts and representative variants.
- Supported repository and Worker verification pass.

## Relevant context

- `cloudflare/ask-fredrik-worker/src/index.ts`
- `cloudflare/ask-fredrik-worker/src/matcher.ts`
- `cloudflare/ask-fredrik-worker/src/data/fredrik-projects.ts`
- `cloudflare/ask-fredrik-worker/src/data/fredrik-qa.ts`
- `cloudflare/ask-fredrik-worker/src/fredrik-context.ts`
- `src/lib/askFredrik.ts`
- `src/components/AstronautHero.tsx`
- `src/components/AstronautFinale.tsx`
- `src/styles/ask-fredrik.css`
- `src/data/fredrikContext.ts`
- `src/data/highlights.ts`
- `PROJECT_CONTEXT.md`, `README.md`, and the sibling résumé confidentiality/metrics rules

## Verification

- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify.ps1`
- `npm run check` and `npm test` in `cloudflare/ask-fredrik-worker/`
- Focused local resolution of the exact reported prompts before and after the fix
- Mobile browser validation at iPhone, tablet, and desktop sizes, including scroll endpoints
- Independent review

## Risks

- Broad aliases such as `code` or `history` could steal unrelated recruiter questions.
- The Worker and static fallback can drift if only one knowledge base is updated.
- Added system-prompt text must remain below the existing 8,000-character guard.
- Removing play/pause priming must still allow Safari to paint scroll-driven seeks.
- Moving the finale endpoint too early could flatten the intended reveal.

## Completion evidence

- Worker and frontend fallback both resolve the three reported prompts deterministically. Added
  collision regressions proving memory questions outrank named React/Homebase knowledge and a
  generic Homebase line-count question does not inherit the ~16K onboarding metric.
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify.ps1` passed: lint, 27 tests,
  TypeScript production build, and Vite production bundle.
- Worker `npm run check` passed; `npm test` passed 479 knowledge checks and 54 admin-auth checks.
- `npm run build:admin` passed, and the sibling résumé coherence check passed all 36 load-bearing
  terms, contact facts, metrics, privacy boundaries, and retired-architecture checks.
- Browser-verified at 390×844, 768×1024, and 1440×900: both videos remained paused, normal maximum
  scroll landed the finale at `duration - 0.05`, no horizontal overflow appeared, and the phone
  launcher had 20 px right/bottom gaps. The open chat panel fit the phone viewport; reduced-motion
  rendered static media. No runtime errors were observed.
- Independent review found and drove fixes for memory/knowledge priority, overly broad line-count
  matching, disclosure wording, resolution-order documentation, and system-prompt budget margin;
  the reviewer confirmed the functional blockers resolved.
- Second Brain quick content validation passed. Its full quick gate still reports pre-existing,
  unrelated stale generated index/maintenance-audit files from other in-progress vault work; those
  user changes were preserved.
- Real iPhone Safari/Home Screen media behavior remains a post-release device check because local
  Chromium emulation cannot prove WebKit decoder semantics.
- Released in commit `89a7d83`. Worker deploy run `31740234210` and Worker test run `31740234416`
  passed, including the workflow's live `/ask` smoke test. Direct live requests for the two reported
  topics resolved to `highlight_16k` and `conversation_memory` with the intended deterministic
  answers.
