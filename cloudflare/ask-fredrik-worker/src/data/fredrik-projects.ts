/**
 * Ask Fredrik — approved public-safe project knowledge.
 *
 * Every entry is publishable directly on the public portfolio site. Private
 * projects (Homebase, App Dashboard, Second Brain) are described at the
 * concept/architecture level ONLY — their `boundaries` list what the
 * assistant must never reveal, and the `allowedAnswer` is written to stay
 * inside those boundaries. Enterprise projects stay generic: no internal
 * codenames, no client names, no confidential architecture.
 */

export interface ProjectKnowledge {
  name: string;
  status: 'public' | 'private' | 'prototype' | 'professional';
  /** Must be true for every entry in this file — private-project entries are
   *  public-safe *descriptions*, never private content. */
  publicSafe: boolean;
  /** Lowercase, normalized phrases that should route to this project. */
  aliases?: string[];
  /** One-to-two sentence summary serialized into the AI system prompt. */
  summary: string;
  technologies: string[];
  highlights: string[];
  /** What must never be revealed about this project. */
  boundaries?: string[];
  /** The exact curated answer returned when this project is asked about. */
  allowedAnswer: string;
}

export const PROJECTS: ProjectKnowledge[] = [
  {
    name: 'Professional Portfolio',
    status: 'public',
    publicSafe: true,
    aliases: ['portfolio', 'this site', 'this website', 'personal site', 'ask fredrik'],
    summary:
      'Public portfolio: Vite + React + TypeScript, cinematic dark art direction, Dockerized nginx, ' +
      'GitHub Pages deploy, and this Cloudflare Worker AI assistant.',
    technologies: [
      'React',
      'TypeScript',
      'Vite',
      'framer-motion',
      'Docker/nginx',
      'GitHub Actions',
      'Cloudflare Workers',
      'Workers AI',
      'Cloudflare D1',
      'Cloudflare Access',
    ],
    highlights: [
      'Cinematic dark art direction with a hand-written CSS design-token system',
      '“Ask Fredrik” assistant: five-stage answer pipeline — rate limiting, sensitive-topic filter, curated matcher, Workers AI call, deterministic fallback',
      'A leak guard discards any model answer that echoes its own instructions or the knowledge base',
      'Private analytics dashboard gated by Cloudflare Access and re-validated in-Worker with RS256 signature checks',
      '400+ automated checks covering the answer pipeline and the authentication, run in CI',
      'Ships two ways from one build: GitHub Pages and a Dockerized nginx site',
    ],
    allowedAnswer:
      'The Professional Portfolio is the site you’re on: a Vite + React + TypeScript app with a ' +
      'cinematic dark art direction, built on a hand-written CSS design-token system and deployed ' +
      'both to GitHub Pages and as a Dockerized nginx site. The “Ask Fredrik” assistant — the ' +
      'thing answering you now — is a Cloudflare Worker he built: questions route through rate ' +
      'limiting, a sensitive-topic filter, a curated matcher, a Workers AI call, and then a ' +
      'deterministic fallback, so an unavailable or off-topic model never produces an unsupported ' +
      'answer. A leak guard discards any answer that echoes its own instructions. Its private ' +
      'analytics dashboard sits behind Cloudflare Access and is re-validated inside the Worker, ' +
      'and the whole thing carries over 400 automated checks that run in CI.',
  },
  {
    name: 'Homebase',
    status: 'private',
    publicSafe: true,
    aliases: ['homebase', 'home base', 'homeowner dashboard', 'homeowner app', 'home dashboard'],
    summary:
      'Private household app running in production on Cloudflare Workers + D1; metadata-only records, ' +
      'installed as a PWA, owned end to end.',
    technologies: [
      'Cloudflare Workers',
      'Cloudflare D1',
      'Cloudflare Access',
      'Wrangler',
      'Vitest / workerd',
      'GitHub Actions',
      'Service worker / PWA',
    ],
    highlights: [
      'Production deployment owned solo: forward-only D1 schema migrations applied to live data behind a documented recovery path',
      'Daily scheduled job that sends one reminder summary per run, running on the edge independent of any machine being on',
      'Cloudflare Access identity with a defense-in-depth check at the Worker, plus a self-only Content Security Policy',
      '173 tests run inside the workerd runtime that serves production, not in Node',
      'Deliberately stores no credentials of any kind — account records are metadata only',
    ],
    boundaries: [
      'Never reveal personal details, bill or payment details, account details, vendors, addresses, or any household data',
      'Describe the architecture, engineering practices, and skills only',
    ],
    allowedAnswer:
      'Homebase is a private household app Fredrik designed, built, and operates himself — ' +
      'bill scheduling, payment tracking, and metadata-only account records, installed as a phone ' +
      'home-screen app. Architecturally it is the project where he owns the whole production ' +
      'lifecycle himself: Cloudflare Workers and D1, forward-only schema migrations applied ' +
      'against live data behind a documented recovery path, a daily scheduled reminder job, ' +
      'Cloudflare Access identity with a second check at the Worker, a self-only Content Security ' +
      'Policy, and validate/deploy pipelines in GitHub Actions. Its 173 tests run inside the same ' +
      'runtime that serves production. The household data itself is private and never discussed; ' +
      'by design the app stores no credentials at all.',
  },
  {
    name: 'App Dashboard',
    status: 'private',
    publicSafe: true,
    aliases: [
      'app dashboard',
      'afr gateway',
      'app launcher',
      'launcher dashboard',
      'private gateway',
      // deliberately no 'desktop app' alias: that phrase belongs to the Tauri
      // skill, and skills win alias-length ties in matchKnowledge().
    ],
    summary:
      'Private native desktop control plane for local containerized services: discovery, manifest ' +
      'validation, per-service windows. Rust backend, Next.js frontend.',
    technologies: [
      'Tauri v2',
      'Rust',
      'Next.js 15',
      'React 19',
      'TypeScript',
      'Docker Compose',
    ],
    highlights: [
      'Rebuilds a service only when a per-app content fingerprint changes, instead of rebuilding every launch',
      'Staged readiness contract before a window opens: compose validity, containers running, healthchecks, then an HTTP probe',
      'Rust backend covered by 50 unit tests, including the safety invariants: no volume deletion anywhere, loopback-only URLs, path-traversal and symlink containment',
      'Child webviews are granted zero host capabilities and are origin-locked; the frontend can only ever send an application id',
    ],
    boundaries: [
      'Never reveal internal URLs, private endpoints, or the specific apps and infrastructure behind it',
    ],
    allowedAnswer:
      'App Dashboard is a private native desktop application Fredrik built to run his own local ' +
      'containerized services: it discovers repositories, validates their manifests, rebuilds only ' +
      'when a content fingerprint changes, waits on a staged readiness contract, and opens each ' +
      'service in its own window. It is a Tauri v2 app — Rust backend, Next.js and React frontend ' +
      '— and the interesting part is the safety engineering: the Rust backend carries 50 unit ' +
      'tests covering manifest validation, compose orchestration, and discovery, including the ' +
      'invariants that it never removes a volume, keeps URLs loopback-only, ' +
      'path-traversal containment, and child webviews with zero host capabilities. The specific ' +
      'apps and endpoints behind it stay private.',
  },
  {
    name: 'AFR',
    status: 'prototype',
    publicSafe: true,
    aliases: ['afr'],
    summary:
      'Public/friend-facing editorial and community concept around fitness, investing, careers, news, ' +
      'and opportunities.',
    technologies: ['Next.js', 'React', 'TypeScript'],
    highlights: [
      'Publishing/content-driven app concept',
      'Categories across fitness, investing, careers, news, and opportunities',
    ],
    allowedAnswer:
      'AFR is a public/friend-facing editorial and community concept Fredrik builds outside work ' +
      '— a publishing/content-driven app with categories around fitness, investing, careers, ' +
      'news, and opportunities, built with Next.js.',
  },
  {
    name: 'Second Brain',
    status: 'private',
    publicSafe: true,
    aliases: ['second brain', 'knowledge management', 'knowledge base', 'notes system', 'pkm'],
    summary:
      'Private file-based knowledge-management system; discussed at the concept/architecture level only.',
    technologies: ['Markdown', 'file-based tooling'],
    highlights: [
      'Personal knowledge-management architecture and tooling concept',
      'Feeds Fredrik’s organized, documentation-first way of working',
    ],
    boundaries: [
      'Never reveal, quote, or summarize its notes or contents',
      'Never connect it to this public assistant — concept-level description only',
    ],
    allowedAnswer:
      'Second Brain is Fredrik’s private, file-based knowledge-management system — a personal ' +
      'architecture and tooling concept for organizing projects, decisions, and notes. Its ' +
      'contents are private and aren’t part of this assistant; what it says publicly is that he ' +
      'works in an organized, documentation-first way.',
  },
  {
    name: 'Enterprise AI Client Assist',
    status: 'professional',
    publicSafe: true,
    aliases: ['client assist', 'enterprise ai assistant', 'ai client assist'],
    summary:
      'AI-enabled internal support assistant: React frontend, Spring AI/Spring Boot backend, AWS ' +
      'Bedrock, ECS/Fargate. Fredrik was the single largest contributor.',
    technologies: ['React', 'Spring AI', 'Spring Boot', 'AWS Bedrock', 'ECS/Fargate', 'OIDC/Azure AD'],
    highlights: [
      'Single largest contributor',
      'Production deployment on ECS/Fargate behind load balancing and OIDC/Azure AD auth',
      'Enterprise data integrations',
    ],
    boundaries: [
      'No internal system names, client names, URLs, or confidential architecture details — high-level only',
    ],
    allowedAnswer:
      'Fredrik was the single largest contributor to an enterprise AI client-assist assistant: a ' +
      'React frontend with a Spring AI / Spring Boot backend integrating AWS Bedrock models, ' +
      'deployed on ECS/Fargate behind OIDC/Azure AD authentication. Employer-confidential details ' +
      'stay high-level, but the scale and his role are documented.',
  },
  {
    name: 'Secure Client Onboarding Portal',
    status: 'professional',
    publicSafe: true,
    aliases: ['onboarding portal', 'client onboarding', 'onboarding'],
    summary:
      'Secure internal/external onboarding portal: passwordless OTP authentication, session management. ' +
      'Fredrik led development.',
    technologies: ['React', 'Spring Boot', 'OTP email verification', 'JWT/RS256 sessions'],
    highlights: [
      'Led development; delivered as lead developer',
      'Passwordless flow: one-time link → email match → OTP → RS256-signed sessions',
      'Built to enterprise CIAM and pen-test requirements',
    ],
    boundaries: [
      'No internal system names, client names, URLs, or confidential architecture details — high-level only',
    ],
    allowedAnswer:
      'Fredrik led development of a secure client onboarding portal: an internal configuration ' +
      'side plus an external client experience, with passwordless authentication (one-time link → ' +
      'email match → OTP → RS256-signed sessions) built to enterprise CIAM and pen-test ' +
      'requirements. Details stay high-level for confidentiality.',
  },
  {
    name: 'Enterprise Salesforce Platform',
    status: 'professional',
    publicSafe: true,
    aliases: ['salesforce platform', 'salesforce modernization'],
    summary:
      'Enterprise Salesforce engineering: Apex, LWC, OmniStudio, Copado releases, production support. ' +
      '#1 contributor; led the team from 2025.',
    technologies: ['Apex', 'Lightning Web Components', 'OmniStudio', 'Copado'],
    highlights: [
      '#1 contributor; led the team from 2025 to June 2026',
      'Owned Copado deployments, release coordination, and production support',
      'Business-critical delivery and data fixes',
    ],
    boundaries: [
      'No internal system names, client names, URLs, or confidential architecture details — high-level only',
    ],
    allowedAnswer:
      'Fredrik is the #1 contributor on an enterprise Salesforce platform and led its team from ' +
      '2025: Apex, Lightning Web Components, and OmniStudio development, Copado deployments ' +
      'and release coordination, and production support for business-critical delivery.',
  },
];
