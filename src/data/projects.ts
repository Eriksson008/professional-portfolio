export interface Project {
  id: string;
  title: string;
  kind: 'Enterprise' | 'Personal' | 'Lab';
  confidential?: boolean;
  summary: string;
  role: string;
  bullets: string[];
  tags: string[];
  link?: { label: string; href: string };
}

// Enterprise entries are sanitized: no internal system names, data, or business logic.
// Personal/Lab entries are the candidate's own work and can be described in full.
export const projects: Project[] = [
  {
    id: 'salesforce-platform',
    title: 'Enterprise Salesforce Platform',
    kind: 'Enterprise',
    confidential: true,
    summary:
      'An enterprise Salesforce platform supporting Group Insurance business workflows, with continuous feature delivery and recurring production releases.',
    role: '#1 contributor — 470+ commits over ~2 years — led the platform team from 2025.',
    bullets: [
      'Built Apex classes, triggers, and test classes alongside LWC, OmniScripts, and FlexCards for business-facing workflows.',
      'Scaled the platform to new product lines, extending the data model and workflows for additional business cases.',
      'Implemented Batch and Queueable Apex for high-volume processing; tuned SOQL and heap usage for reliability.',
      'Piped platform events into Elasticsearch/ELK for observability across lower environments.',
      'Owned Copado deployments, release coordination, hotfixes, and data corrections; led the team through production support.',
    ],
    tags: ['Apex', 'LWC', 'OmniStudio', 'SOQL', 'Batch / Queueable Apex', 'ELK', 'Copado'],
  },
  {
    id: 'ai-client-assist',
    title: 'AI Client-Assist Assistant',
    kind: 'Enterprise',
    confidential: true,
    summary:
      'A secure internal AI assistant that let business users ask natural-language questions about client detail — reaching that information without consuming a Salesforce read-only license, by answering over an Elasticsearch index rather than the CRM itself.',
    role: 'Single largest contributor — 137 of 217 commits (63% of all commits) across frontend, backend, and cloud.',
    bullets: [
      'Integrated the enterprise Salesforce platform with an ELK stack: Logstash pipelines streamed client and policy records out of Salesforce into Elasticsearch indices, making the data queryable outside the CRM, with Kibana for operational visibility.',
      'Built the Spring AI / Spring Boot backend that retrieves from those Elasticsearch indices and reasons over the retrieved records with Claude Sonnet 4.5 on Amazon Bedrock, so answers stay grounded in indexed data rather than model recall.',
      'Built the React interface, and deployed on AWS ECS/Fargate behind an Application Load Balancer with ALB OIDC / Azure AD authentication and Jenkins CI/CD.',
    ],
    tags: [
      'React',
      'Spring AI',
      'Amazon Bedrock',
      'Claude Sonnet 4.5',
      'Elasticsearch / Logstash / Kibana',
      'Salesforce integration',
      'ECS / Fargate',
      'OIDC / Azure AD',
    ],
  },
  {
    id: 'onboarding-portal',
    title: 'Secure Client Onboarding Portal',
    kind: 'Enterprise',
    confidential: true,
    summary:
      'A greenfield onboarding platform — an internal configuration portal paired with an external client portal, built as three integrated microservices.',
    role: 'Lead developer — ~16,000 lines across 144 commits in under 5 weeks.',
    bullets: [
      'Designed and built three integrated microservices spanning the configuration UI, external access flows, and backend APIs.',
      'Implemented passwordless authentication (one-time link → email match → OTP → RS256-signed session) on a stateless, autoscaling topology.',
      'Built to enterprise CIAM and pen-test requirements; deployed on AWS ECS/Fargate with PostgreSQL/Aurora.',
    ],
    tags: [
      'Node / Express',
      'React / TypeScript',
      'Spring Boot / Java 21',
      'PostgreSQL / Aurora',
      'Passwordless auth',
    ],
  },
  {
    id: 'homebase',
    title: 'Homebase — Household Bill & Account Platform',
    kind: 'Personal',
    summary:
      'A production app for bill scheduling, payment tracking, and metadata-only account records, running on Cloudflare Workers and D1 and installed as a phone home-screen app.',
    role: 'Sole engineer — architecture, data model, deployment, and ongoing operation.',
    bullets: [
      'Owns the full production lifecycle: forward-only D1 schema migrations applied to live data behind a documented recovery path, and validate/deploy pipelines in GitHub Actions.',
      'A daily scheduled Worker job sends one reminder summary per run, on the edge and independent of any machine being on.',
      'Cloudflare Access provides identity, with a defense-in-depth check at the Worker so traffic that bypasses it fails closed; every response carries a self-only Content Security Policy.',
      'Stores no credentials of any kind by design — account records are metadata only.',
      '173 tests run inside the workerd runtime that serves production, rather than in Node.',
    ],
    tags: [
      'Cloudflare Workers',
      'Cloudflare D1',
      'Cloudflare Access',
      'Wrangler',
      'Vitest / workerd',
      'GitHub Actions',
      'PWA',
    ],
  },
  {
    id: 'app-dashboard',
    title: 'App Dashboard — Desktop Control Plane',
    kind: 'Personal',
    summary:
      'A native Windows application that discovers local containerized services, validates their manifests, and runs each one in its own window.',
    role: 'Designed and built end to end — Rust backend, desktop shell, and frontend.',
    bullets: [
      'Rebuilds a service only when a per-app content fingerprint changes, and gates startup behind a staged readiness contract: compose validity, containers running, healthchecks, then an HTTP probe.',
      'The Rust backend carries 50 unit tests across manifest validation, compose orchestration, and discovery — including the safety invariants: no volume deletion anywhere, loopback-only URLs, path-traversal and symlink containment.',
      'Each service opens in an isolated webview with zero host capabilities and origin-locked navigation; the frontend can only ever send an application id across the typed IPC boundary.',
    ],
    tags: ['Tauri v2', 'Rust', 'Next.js 15', 'React 19', 'TypeScript', 'Docker Compose'],
  },
  {
    id: 'afr',
    title: 'AFR — The Members’ Hub',
    kind: 'Personal',
    summary:
      'A community website and editorial hub for a small group — a clean blog and opportunity hub across fitness, investing, careers, and more.',
    role: 'Built the site and content system.',
    bullets: [
      'Next.js (App Router) + TypeScript + Tailwind CSS v4, with local-markdown content and no database to run.',
      'Production build type-checks every page; ESLint-clean and deployment-ready.',
    ],
    tags: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Markdown'],
  },
  {
    id: 'second-brain',
    title: 'Second Brain — Knowledge Vault',
    kind: 'Personal',
    summary:
      'A personal knowledge system following the PARA method, readable in both Obsidian and GitHub, and the home of my AI-assisted documentation workflows.',
    role: 'Curator and tooling author.',
    bullets: [
      'Structured projects, areas, resources, and references with consistent note templates and wiki-links.',
      'Drives multi-agent AI workflows that mine engineering sessions and generate cross-project technical handoffs.',
    ],
    tags: ['Markdown', 'Obsidian', 'PARA', 'Multi-agent AI'],
  },
  {
    id: 'self-hosting-lab',
    title: 'Self-Hosting / Tailscale Lab',
    kind: 'Lab',
    summary:
      'A private home lab that runs my own apps as containers, reachable securely over a Tailscale mesh rather than the public internet.',
    role: 'Operate the infrastructure and deployment workflow.',
    bullets: [
      'Runs self-hosted apps as Docker containers behind a config-driven launcher dashboard.',
      'Uses Tailscale for private, encrypted access across devices without exposing services publicly.',
      'Practices the same production patterns used at work — containers, reverse proxy, and least-exposure networking.',
    ],
    tags: ['Docker', 'Tailscale', 'nginx', 'Self-hosting', 'Linux'],
  },
  {
    id: 'professional-portfolio',
    title: 'This Portfolio',
    kind: 'Personal',
    summary:
      'The site you are reading — a production-oriented portfolio built and shipped the way I build enterprise frontends, plus the "Ask Fredrik" assistant behind it.',
    role: 'Designed and built end to end, including the Cloudflare Worker backend.',
    bullets: [
      'Vite + React + TypeScript with a typed content layer as a single source of truth; containerized with a multi-stage Docker build served by nginx, and deployed to GitHub Pages from the same build.',
      'The assistant routes answers through a five-stage pipeline — rate limiting, a sensitive-topic filter, a curated matcher, a Workers AI call, then a deterministic fallback — so an unavailable or off-topic model never produces an unsupported answer, and a leak guard discards any answer echoing its own instructions.',
      'Questions are logged to Cloudflare D1 with FIFO retention and salted IP hashes; the private analytics dashboard sits behind Cloudflare Access and is re-validated in-Worker with RS256 signature, issuer, audience, and expiry checks against the team key set.',
      'Over 400 automated checks cover the answer pipeline and the authentication, running in CI on every change.',
    ],
    tags: [
      'Vite',
      'React',
      'TypeScript',
      'Cloudflare Workers',
      'Workers AI',
      'Cloudflare D1',
      'Cloudflare Access',
      'Docker',
      'nginx',
    ],
    link: {
      label: 'View on GitHub',
      href: 'https://github.com/Eriksson008/professional-portfolio',
    },
  },
];
