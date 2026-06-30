# Fredrik Eriksson — Professional Portfolio

A clean, enterprise-friendly portfolio website that supports my resume and job
search. It presents my professional progression, enterprise engineering
experience, Salesforce depth, broader software skills, production ownership, and
leadership trajectory — honestly and conservatively.

**Stack:** plain semantic HTML + CSS with a small amount of vanilla JavaScript.
No build step, no frameworks, no tracking. Static and GitHub Pages-ready.

> **For Claude Code context, read `CLAUDE.md` and `PROJECT_CONTEXT.md` first.**

```
professional-portfolio/
├── index.html        # the entire site (single page)
├── styles.css        # design system + layout
├── script.js         # progressive enhancement: mobile nav, scroll reveal, active link
├── assets/
│   ├── README.md      # how to add your resume PDF
│   └── resume.pdf     # ← you add this (see Placeholders below)
├── .nojekyll         # tells GitHub Pages to serve files as-is
└── README.md
```

---

## Run locally

It's a static site, so any of these work:

```bash
# Option A — just open the file
#   double-click index.html, or
open index.html              # macOS
start index.html             # Windows

# Option B — a tiny local server (better; matches how Pages serves it)
python -m http.server 8000   # then visit http://localhost:8000
```

No dependencies to install.

---

## Deploy on GitHub Pages

1. Create a repo (suggested name below) and push these files to the default
   branch (`main`).
2. In the repo: **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Branch: **`main`**, folder: **`/ (root)`**. Save.
5. Wait ~1 minute. Your site publishes at
   `https://<your-username>.github.io/<repo-name>/`.

> If you'd rather publish from a `/docs` folder, move these files into `docs/`
> and pick that folder in step 4. Root is simplest for this repo.

> **Note:** these portfolio files currently live in a `professional-portfolio/`
> subfolder of a larger project. To deploy, push **the contents of this folder**
> to the root of a dedicated repo (so `index.html` is at the repo root).

---

## Update contact links

All links live in `index.html`. Search for these and edit in place:

| What | Where to find it | Current value |
|------|------------------|---------------|
| Email | `mailto:` links | `eriksson.fredrik08@gmail.com` |
| LinkedIn | `linkedin.com/in/...` links | `linkedin.com/in/eriksson-fredrik` |
| GitHub | `data-placeholder="github"` links | `github.com/[your-username]` ← **replace** |
| Resume | `data-placeholder="resume"` links | `assets/resume.pdf` |

There are two of each (hero + contact section) — update both.

---

## Replace the resume PDF

Add your resume as `assets/resume.pdf`. See **`assets/README.md`** for a step by
step (you can export it from the companion resume package in
`../resume-project/resume-building/output/`). Keep the filename `resume.pdf` and the links work
automatically.

---

## Edit the case studies

Each case study is an `<article class="case">` block inside the
**Selected Case Studies** section of `index.html`. To edit one, change the text
inside its fields:

- `<h3>` — the title
- `.tag-row` — the technology chips
- `.case-field` blocks — **Overview**, **My Role**, **Contributions**,
  **What It Demonstrates**
- `.case-note` — the confidentiality-safe note

To add a case study, copy an existing `<article class="case"> … </article>`
block and edit it. The grid handles layout automatically.

---

## Confidentiality checklist (run before every publish)

- [ ] No internal Prudential project or system names anywhere.
- [ ] No proprietary business logic, data names, or internal identifiers.
- [ ] No screenshots, exports, or diagrams from employer systems.
- [ ] No private review or feedback content (themes only).
- [ ] No architecture diagrams showing internal networks/systems.
- [ ] Only generic labels used ("enterprise Salesforce platform", "internal AI
      assistant", "secure client onboarding portal", "Group Insurance
      workflows").
- [ ] No fabricated metrics — placeholders only, clearly marked, or omitted.
- [ ] Resume PDF you upload is also confidentiality-clean.
- [ ] All `[your-username]` placeholders replaced; Resume/GitHub buttons resolve.

---

## Suggested repo settings

**Repo name:** `professional-portfolio` (clean and reusable). Alternatives:
`fredrik-eriksson-portfolio`, `engineering-portfolio`, `fredrik-portfolio`.

**Description:**
> Professional portfolio for Fredrik Eriksson, a Senior Software Engineer focused
> on enterprise Salesforce platforms, Java/Spring services, React applications,
> cloud deployment, and technical leadership.

**Topics / tags:**
`portfolio`, `senior-software-engineer`, `salesforce`, `apex`, `lwc`,
`java`, `spring-boot`, `react`, `aws`, `ci-cd`, `github-pages`, `resume`

---

## Where to link this

- **Resume header:** add the published URL next to your email/LinkedIn, e.g.
  `Portfolio: yourname.github.io/professional-portfolio`.
- **LinkedIn:** add it to your profile's **Website / Contact info**, and
  consider a short Featured-section card linking to it.
- **Email signature / applications:** include the link where a portfolio line
  fits.

---

## Design notes (brief)

- **Direction:** "engineering documentation" — warm off-white paper, slate-navy
  brand, a single restrained muted-teal accent, and monospace metadata labels
  (eyebrows, timeline dates, the hero "title block"). It ties the mechanical-
  engineering origin to the software present while staying conservative enough
  for enterprise HR.
- **Type:** Space Grotesk (display) + Inter (body) + IBM Plex Mono (labels/data),
  loaded from Google Fonts.
- **Accessibility/quality floor:** semantic landmarks, skip link, visible
  keyboard focus, `prefers-reduced-motion` respected, responsive to mobile, no
  layout tables.
- **Honesty:** "acting Tech Lead" is framed as scope of responsibility, not an
  officially held title; no Staff/Principal claims; not undersold as
  Salesforce-only.
