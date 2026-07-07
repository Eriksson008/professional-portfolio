# Ask Fredrik v5 — curated public-safe knowledge base (2026-07-06)

User-directed brief: the bot answered "I don't know" for real skills like Tailscale. Build
a curated public-safe knowledge layer (skills + projects + Q&A with confidence levels and
explicit boundaries) so the bot answers confidently when a skill/project is approved —
without connecting anything private (second brain, notes, employer details, finances,
household data) to the public chatbot, without inferring/overstating experience, and
without breaking the pipeline (rate limit → sensitive → curated → Workers AI → fallback).
Static TypeScript only — explicitly no D1/Vectorize/RAG. This doc records the decisions
made inside the brief's degrees of freedom.

## Decisions

### Module layout (Worker-side, brief's "desired architecture" adapted to repo style)

- `src/data/fredrik-skills.ts` — `ExperienceConfidence` + `SkillKnowledge` (name, aliases,
  confidence, publicSafe, summary, evidence, relatedProjects, **allowedAnswer** = the exact
  curated reply). ~24 entries per the brief's list; Tailscale carries the brief's verbatim
  approved answer.
- `src/data/fredrik-projects.ts` — `ProjectKnowledge` (status public/private/prototype/
  professional, publicSafe, aliases, summary, technologies, highlights, **boundaries**,
  allowedAnswer). Private projects (Homebase, AFR Gateway, Second Brain) are public-safe
  *descriptions* with explicit boundaries; enterprise projects stay generic.
- `src/data/fredrik-qa.ts` — the curated intents (moved from fredrik-context), +
  `production_support`; `ai_experience`/`technical_stack`/`cloud_experience` now name the
  Cloudflare Worker assistant itself (git-verifiable — it's this repo).
- `src/fredrik-context.ts` — aggregator: base facts, sensitive keywords, canned answers
  (incl. new `NOT_CONFIRMED_ANSWER`), `buildFredrikSystemPrompt()`, re-exports.
- `src/matcher.ts` — adds `findSkillKnowledge` / `findProjectKnowledge` / `matchKnowledge`
  / `isUnconfirmedExperienceQuestion` / `normalizeQuery` and **`resolveLocalAnswer()`** —
  the whole pre-AI pipeline in one function, shared by index.ts and the tests so tests
  exercise exactly what production runs.

### Local resolution order (stage 3 of the unchanged 5-stage pipeline)

sensitive → **curated exact** → **knowledge (skills/projects, longest alias wins)** →
curated keywords → **not-confirmed detector** → (AI → fallback unchanged).

- Curated exact runs *before* knowledge so canonical questions ("How does Fredrik use AWS
  and cloud?") keep their curated answers even though `aws` is a skill alias.
- Knowledge runs *before* curated keyword scoring so "Does Fredrik know Cloudflare
  Workers?" gets the specific skill answer instead of a generic keyword hit.
- Skills and projects compete on longest matched alias ("AFR Gateway" beats "AFR",
  "workers ai" vs "cloudflare worker" resolves to the longer mention).
- Not-confirmed detector: regexes for "experience with X"-shaped questions that reach the
  end unmatched → deterministic `NOT_CONFIRMED_ANSWER` (`skill_not_confirmed` intent).
  Deliberately runs *before* AI: unknown-skill questions must never be model-guessed.
  Open-ended non-skill questions still fall through to AI/fallback.
- matched_intent namespacing for D1 analytics: `skill:tailscale`, `project:homebase`,
  `skill_not_confirmed`.

### Alias/keyword collision rules

- No generic aliases (`ai`, `cloud`, bare `salesforce`, `experience`) on skills — those
  belong to curated intents. `cloud_experience` keyword `cloud` was replaced by
  `cloud experience` etc. so "cloudflare" can't hijack it (substring matching).
- Sensitive filter still wins over everything: kept `household` sensitive, so the brief's
  suggested "household app" Homebase alias was dropped (unreachable); `homeowner
  dashboard`/`home dashboard` route instead. Added finances/bills/mortgage/bank/private-
  notes/internal-url keywords; rejected `financial` (would block "financial services
  experience" recruiter questions).
- Tailscale answer text is the brief's, verbatim. `vpn`/`private networking`/`remote
  access` route to it.

### System prompt

`buildFredrikSystemPrompt()` — rules first (brief's exact "You may answer only from this
approved public context…" sentence, confidence-level semantics, never present
project/personal as enterprise experience), then compact line-based serialization
(`- Name [confidence]: summary`) instead of a JSON dump. ~6 KB; test guards < 8 KB.

### Tests without a test framework

Node 24 native type stripping → zero-dependency `npm test` running
`src/tests/knowledge.test.ts` (custom check harness, 281 checks). This required explicit
`.ts` import extensions across the Worker (`allowImportingTsExtensions` in tsconfig;
wrangler/esbuild accepts them). Invariant tests enforce: every entry `publicSafe`, private
projects declare `boundaries`, aliases pre-normalized, no `not_confirmed` entries in data
(omission is the mechanism), prompt contains the rules and stays compact.

### Frontend deliberately untouched

`src/data/fredrikContext.ts` (offline/static fallback) keeps its 10 answers — it only
serves when the Worker is unreachable. Known drift risk already accepted in the v4 spec;
extending the KB there is a future extraction candidate.

## Verified

`npm run check` clean; `npm test` 281/281; end-to-end via `wrangler dev` (noai config):
Tailscale → approved answer, Cloudflare Workers → skill answer, Homebase → concept-only,
Kubernetes → not-confirmed, salary → blocked, "second brain notes" → concept-only.
