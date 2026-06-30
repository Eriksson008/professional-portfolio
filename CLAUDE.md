# CLAUDE.md

Guidance for Claude Code working in this sub-project.

## What this is

**Professional Portfolio** - a static, GitHub Pages-ready website for Fredrik Eriksson
that supports the resume (same person, same facts, same confidentiality rules). Plain
semantic HTML + CSS + minimal vanilla JS, no build step.

This is its own standalone top-level repo (moved out of `resume-project` on 2026-06-29).
The sibling [`../resume-project/CLAUDE.md`](../resume-project/CLAUDE.md) holds the
canonical personal details, verifiable-metrics rules, and confidentiality mapping -
**those still govern this site too**; keep the two in sync when a shared fact changes.

## Working agreement (read first)

- **Read `PROJECT_CONTEXT.md` first**, then the sibling
  [`../resume-project/CLAUDE.md`](../resume-project/CLAUDE.md) for canonical facts and
  the confidentiality rules.
- **Check `README.md`** (publishing/advisory notes).
- Keep changes simple - avoid over-engineering. No framework, no build step, no stock
  images, no gimmicky animations.
- Do **not** add auth, databases, services, or a build pipeline unless explicitly requested.
- No lint/build/test exists; verify by opening the HTML and reviewing against the constraints.
- Update `PROJECT_CONTEXT.md` when important project decisions change.
- Update the Second Brain project note
  (`../second-brain/02-Projects/Professional-Portfolio/README.md`) when a major
  decision is made.
