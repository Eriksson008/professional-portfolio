# Professional Portfolio — Fredrik Eriksson

A production-oriented personal portfolio for **Fredrik Eriksson**, Senior Software Engineer
and acting Tech Lead. Built as a real React/TypeScript application — the repo itself is meant
to demonstrate the engineering it describes — and shipped as a lightweight, Dockerized static
site.

It presents the same person, same facts, and same confidentiality rules as the résumé:
git-verifiable metrics only, and enterprise work sanitized of internal system names, data, and
business logic.

## Tech stack

| Layer        | Choice                                              |
| ------------ | --------------------------------------------------- |
| Framework    | React 18 + TypeScript                               |
| Build tool   | Vite 5                                              |
| Styling      | Hand-written CSS with a design-token system         |
| Content      | Typed data modules (`src/data/`) as source of truth |
| Container    | Multi-stage Docker build → nginx (Alpine)           |
| Tooling      | ESLint (flat config) + Prettier                     |

No backend, no database, no auth — it is a static site by design.

## Local development

Requires Node 20+.

```bash
npm install          # install dependencies
npm run dev          # dev server with HMR at http://localhost:8789
npm run build        # type-check + production build to dist/
npm run preview      # serve the built dist/ at http://localhost:8789
npm run lint         # ESLint
npm run format       # Prettier
```

## Docker

The container serves the production build via nginx on **port 8789** by default.

```bash
docker compose up --build       # build + run at http://localhost:8789
# or, plain Docker:
docker build -t professional-portfolio .
docker run -p 8789:8789 professional-portfolio
```

The published host port is configurable; the container always serves on 8789 internally:

```bash
PORT=9000 docker compose up --build   # → http://localhost:9000
```

### LAN / Tailscale

Because the container binds normally, it is reachable from other devices on your LAN at
`http://<host-ip>:8789`, or privately over a Tailscale mesh at `http://<tailscale-ip>:8789`
without exposing it to the public internet.

## Deployment notes

- **Static hosting:** the `dist/` output can be served by any static host (GitHub Pages,
  Netlify, S3/CloudFront, nginx). `public/.nojekyll` is included for GitHub Pages.
- **GitHub Pages publish decision is still pending** — the repo is currently private; Pages on
  a private repo needs GitHub Pro, otherwise the repo must be made public. Confirm the
  git-verifiable metrics are OK to expose publicly before enabling Pages (a public site is more
  exposed than a one-recruiter résumé).

## Project structure

```
professional-portfolio/
├── index.html              # Vite entry
├── src/
│   ├── main.tsx, App.tsx
│   ├── data/               # profile, experience, skills, projects, highlights (typed content)
│   ├── components/         # Nav, Hero, About, Experience, Highlights, Projects, Skills, …
│   ├── hooks/useReveal.ts  # reduced-motion-aware scroll reveal
│   └── styles/             # tokens.css + app.css (design system)
├── public/                 # resume.pdf, favicon.svg, .nojekyll
├── Dockerfile              # multi-stage node build → nginx
├── nginx.conf              # listens on ${PORT}; SPA fallback; gzip; security headers
├── docker-compose.yml      # PORT-configurable host mapping
├── CLAUDE.md, PROJECT_CONTEXT.md
└── resources/              # PRIVATE, gitignored — never committed (see below)
```

## Privacy note

`resources/` is **local-only source material** and is gitignored — it is never committed or
published. It holds private career inputs (performance reviews, an older résumé, raw metrics,
and a skills profile) used only to shape safe, public-facing themes. The published site exposes
only honest, defensible, public-safe content:

- No raw performance reviews or internal documents.
- No internal system, project, or product codenames — enterprise work is described generically.
- No personal phone number or home address.
- Only git-verifiable or directly documented metrics.

The canonical personal details and confidentiality mapping live in the sibling
`../resume-project` repo and govern this site too.
