# PROJECT_CONTEXT - Professional Portfolio

## Purpose

A static, GitHub Pages-ready portfolio website that showcases Fredrik Eriksson's work,
skills, and experience and *supports* the resume. Conservative enterprise tone (no
hype words like "rockstar/ninja/guru/10x").

## Current status

Active. Site is built: `index.html`, `portfolio-standalone.html`, `styles.css`,
`script.js`, `assets/`, `.nojekyll`. Reflects the same git-verifiable metrics and
sanitized case studies as the resume.

## Tech stack

- Plain semantic HTML + CSS, minimal vanilla JS
- No React/framework, no build step, mobile-responsive, accessible
- GitHub Pages-ready (`.nojekyll` present)

## Important constraints

- **Shares the resume project's rules** - canonical personal details, no invented
  metrics, and the confidentiality mapping all live in the sibling repo's
  [`../resume-project/CLAUDE.md`](../resume-project/CLAUDE.md). Pull facts from there;
  do not retype/drift them.
- **No Prudential-internal system/project/codenames.** Case studies stay generic
  (Enterprise Salesforce Platform, Internal AI Assistant, Secure Client Onboarding
  Portal, Production Support & Release Ownership, Mechanical Engineering Foundation).
- A public site is more exposed than a resume - confirm with the user before
  publishing raw metrics.
- No stock images, no gimmicky animations, no heavy dependencies.

## Current priorities

- Keep the site coherent with the resume whenever a shared fact changes.
- Keep tone conservative and enterprise-friendly.

## Local development

No tooling - open `index.html` in a browser. Edit HTML/CSS/JS directly.

## Deployment / testing

- Deploy via GitHub Pages (static). No automated tests; verify by opening the page
  and reviewing against the constraints.

## Related Second Brain notes

- [Professional Portfolio project note](../second-brain/02-Projects/Professional-Portfolio/README.md)
- [Repository System](../second-brain/02-Projects/Repository%20System.md)
