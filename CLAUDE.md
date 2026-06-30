# CLAUDE.md

Guidance for Claude Code working in this repo.

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

## TODO / open decisions

- [ ] **Publish via GitHub Pages — decision pending (user, 2026-06-30: "not yet").**
  The GitHub repo (`Eriksson008/professional-portfolio`) is currently **private**.
  GitHub Pages on a private repo requires GitHub Pro; otherwise the repo must be made
  **public** to publish for free. Decide public-vs-private before enabling Pages.
- [ ] **Before publishing publicly, confirm the raw git-verifiable metrics are OK to
  expose** (a public site is more exposed than a one-recruiter resume — see the
  confidentiality rules in the sibling `../resume-project/CLAUDE.md`).
- [ ] Once the publish decision is made, add concrete deployment notes to `README.md`
  (Pages source branch/folder, final URL).

### Done
- [x] GitHub handle set to `Eriksson008` in the header (2026-06-30).
- [x] `assets/resume.pdf` added (one-page layout, generated from the resume repo).
