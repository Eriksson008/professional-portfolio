/**
 * Ask Fredrik — approved public-safe project knowledge.
 *
 * Every entry is publishable directly on the public portfolio site. Private
 * projects (Homebase, AFR Gateway, Second Brain) are described at the
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
    ],
    highlights: [
      'Cinematic dark art direction with a hand-written CSS design-token system',
      '“Ask Fredrik” assistant: curated matcher, sensitive-topic filter, rate limiting, Workers AI fallback',
      'Ships two ways from one build: GitHub Pages and a Dockerized nginx site',
      'Résumé, projects, and contact experience aimed at recruiters',
    ],
    allowedAnswer:
      'The Professional Portfolio is the site you’re on: a Vite + React + TypeScript app with a ' +
      'cinematic dark art direction, built on a hand-written CSS design-token system and deployed ' +
      'both to GitHub Pages and as a Dockerized nginx site. Its “Ask Fredrik” assistant — the ' +
      'thing answering you now — is a Cloudflare Worker Fredrik built, with a curated answer ' +
      'pipeline, sensitive-topic filtering, rate limiting, and a guarded Workers AI fallback.',
  },
  {
    name: 'Homebase',
    status: 'private',
    publicSafe: true,
    aliases: ['homebase', 'home base', 'homeowner dashboard', 'homeowner app', 'home dashboard'],
    summary:
      'Private homeowner/personal “operating system” concept: household dashboard, bills and payments, ' +
      'accounts, rooms, and projects.',
    technologies: ['React', 'TypeScript'],
    highlights: [
      'Household dashboard concept: bills/payments, account manager, room planning, projects',
      'Demonstrates product thinking and full-stack skills on personal infrastructure',
    ],
    boundaries: [
      'Never reveal personal details, bill or payment details, account details, vendors, addresses, or any household data',
      'Describe the concept and skills only',
    ],
    allowedAnswer:
      'Homebase is a private homeowner/“personal operating system” concept Fredrik builds for ' +
      'himself: a household dashboard covering bills and payments, an account manager, room ' +
      'planning, and home projects. It’s private by design, so its personal specifics aren’t ' +
      'shared — what it demonstrates publicly is his product thinking and full-stack skills ' +
      'applied to personal infrastructure.',
  },
  {
    name: 'AFR Gateway',
    status: 'private',
    publicSafe: true,
    aliases: ['afr gateway', 'app launcher', 'launcher dashboard', 'private gateway'],
    summary:
      'Polished private launcher dashboard for self-hosted apps: config-driven app cards, ' +
      'environment-driven URLs, public/private app handling.',
    technologies: ['React', 'TypeScript'],
    highlights: [
      'Config-driven app cards with environment-driven URLs',
      'Public/private app handling behind private networking',
      'Premium, design-led UI',
    ],
    boundaries: [
      'Never reveal internal URLs, private endpoints, or the specific apps and infrastructure behind it',
    ],
    allowedAnswer:
      'AFR Gateway is a polished private launcher dashboard Fredrik built for his self-hosted ' +
      'apps: config-driven app cards, environment-driven URLs, public/private app handling, and a ' +
      'premium UI. The specific apps and endpoints behind it are private, but the project itself ' +
      'shows his design-led frontend work and personal infrastructure skills.',
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
      '#1 contributor; leads the team.',
    technologies: ['Apex', 'Lightning Web Components', 'OmniStudio', 'Copado'],
    highlights: [
      '#1 contributor; has led the team since 2025',
      'Owns Copado deployments, release coordination, and production support',
      'Business-critical delivery and data fixes',
    ],
    boundaries: [
      'No internal system names, client names, URLs, or confidential architecture details — high-level only',
    ],
    allowedAnswer:
      'Fredrik is the #1 contributor on an enterprise Salesforce platform and has led its team ' +
      'since 2025: Apex, Lightning Web Components, and OmniStudio development, Copado deployments ' +
      'and release coordination, and production support for business-critical delivery.',
  },
];
