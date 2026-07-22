# CLAUDE.md

@AGENTS.md

The line above imports this repo's canonical, cross-tool guide (`AGENTS.md`) — what-this-is, the
framer-motion-only visual constraint, privacy/public-safe content rules, Docker commands, verification
commands, the TODO/Done log, and the Second Brain Sync Rule. All of it applies to Claude Code. Only
Claude-specific notes live below, so there is nothing to keep "in sync" by hand.

## Claude Code specifics

- Use **plan mode** for broad or architectural changes (visual system, data model in `src/data/`,
  the Ask Fredrik Worker) before touching code.
- Delegate broad read-only investigation to the **`explorer`** subagent
  (`.claude/agents/explorer.md`) so the main session keeps its context.
- Keep **one implementation owner** per feature. After implementing, hand the diff to the
  **`reviewer`** subagent (`.claude/agents/reviewer.md`) — which did not write the code — before merge.
  The reviewer must check the privacy/public-safe rules (no codenames, no unverifiable metrics, no PII).
- Use an isolated **git worktree** for genuinely independent write tasks.
- **Verify with evidence:** run `scripts/verify.ps1` (or `npm run lint` / `npm test` /
  `npm run build`) and paste real output before claiming success.
- At the end of a meaningful session, follow the **Second Brain Sync Rule** in `AGENTS.md`.
