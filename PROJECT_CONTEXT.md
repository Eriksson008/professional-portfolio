# Project Context — Professional Portfolio

## Purpose

A static, GitHub Pages-ready portfolio website that showcases Fredrik Eriksson's work,
skills, and experience and *supports* the resume. Conservative enterprise tone (no
hype words like "rockstar/ninja/guru/10x").

## Current Status

Active. Site is built: `index.html`, `portfolio-standalone.html`, `styles.css`,
`script.js`, `assets/`, `.nojekyll`. Reflects the same git-verifiable metrics and
sanitized case studies as the resume. As of 2026-06-30 it is a standalone Git repo
pushed to the **private** GitHub repo `Eriksson008/professional-portfolio` (branch
`main`); GitHub handle and resume PDF are in place. Publishing via GitHub Pages is not
yet decided.

## Tech Stack

- Plain semantic HTML + CSS, minimal vanilla JS
- No React/framework, no build step, mobile-responsive, accessible
- GitHub Pages-ready (`.nojekyll` present)

## Local Development

No tooling — open `index.html` in a browser. Edit HTML/CSS/JS directly.

## Deployment / Access

- Deploy via GitHub Pages (static). The repo is currently **private**; Pages needs
  GitHub Pro or making the repo public — decision pending.
- No automated tests; verify by opening the page and reviewing against the constraints.
- A public site is more exposed than a one-recruiter resume — confirm before publishing
  raw git-verifiable metrics.

## Important Decisions

- **Shares the resume project's rules** — canonical personal details, no invented
  metrics, and the confidentiality mapping all live in the sibling repo's
  `../resume-project/CLAUDE.md`. Pull facts from there; do not retype/drift them.
- **No Prudential-internal system/project/codenames.** Case studies stay generic
  (Enterprise Salesforce Platform, Internal AI Assistant, Secure Client Onboarding
  Portal, Production Support & Release Ownership, Mechanical Engineering Foundation).
- No stock images, no gimmicky animations, no heavy dependencies.
- **Split out of `resume-project` into its own standalone top-level repo** (2026-06-29).
  Reason: cleaner Git history, easier Claude Code usage, easier deployment, and clearer
  separation from resume experiments.

## Current Next Actions

- Keep the site coherent with the resume whenever a shared fact changes.
- Keep tone conservative and enterprise-friendly.
- **Decide GitHub Pages publishing** (private + Pro, or make public). Tracked in `CLAUDE.md` TODO.
- Confirm the raw git-verifiable metrics are OK to expose publicly *before* enabling Pages.
- After the publish decision, add concrete deployment notes (Pages source branch/folder,
  final URL) to `README.md`.

## Second Brain Sync

Matching note: `../second-brain/02-Projects/Professional-Portfolio/README.md`

Related: `../second-brain/02-Projects/Repository System.md` (and the sibling
`resume-project` repo, which holds the canonical facts).
