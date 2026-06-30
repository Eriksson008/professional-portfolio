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
      'An enterprise Salesforce platform supporting Group Insurance business workflows, with ongoing feature delivery and weekly production releases.',
    role: '#1 contributor — 470+ commits over ~2 years — now leading the platform team.',
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
      'A secure internal AI assistant that lets business users query enterprise information in natural language, backed by a managed large language model.',
    role: 'Single largest contributor — 137 commits (63% of total) across frontend, backend, and cloud.',
    bullets: [
      'Built the React interface and Spring AI / Spring Boot backend integrating an AWS Bedrock (Claude) model.',
      'Connected search and logging via Elasticsearch/ELK for retrieval over enterprise data.',
      'Deployed on AWS ECS/Fargate behind an Application Load Balancer with ALB OIDC / Azure AD authentication.',
      'Built multi-agent AI automation workflows supporting code review, documentation, and knowledge transfer.',
    ],
    tags: ['React', 'Spring AI', 'AWS Bedrock', 'ECS / Fargate', 'OIDC / Azure AD', 'ELK'],
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
    tags: ['Node / Express', 'React / TypeScript', 'Spring Boot / Java 21', 'PostgreSQL / Aurora', 'Passwordless auth'],
  },
  {
    id: 'homebase',
    title: 'Homebase — Local Accounts Manager',
    kind: 'Personal',
    summary:
      'A localhost-only web app that replaces an accounts spreadsheet, with secret fields encrypted at rest behind a single master password.',
    role: 'Designed and built end to end — security model, data layer, and UI.',
    bullets: [
      'Derives an encryption key from a never-stored master password with Argon2id; encrypts secret fields with AES-256-GCM.',
      'Auto-locks after inactivity and on restart; the derived key lives only in server memory while unlocked.',
      'Bound to 127.0.0.1 only and shipped as a Docker container with a host-mounted SQLite volume.',
    ],
    tags: ['Docker', 'SQLite', 'Argon2id', 'AES-256-GCM', 'Node'],
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
      'The site you are reading — a production-oriented portfolio built and shipped the way I build enterprise frontends.',
    role: 'Designed and built end to end.',
    bullets: [
      'Vite + React + TypeScript with a typed content layer as a single source of truth.',
      'Containerized with a multi-stage Docker build served by nginx; accessible, responsive, and reduced-motion aware.',
    ],
    tags: ['Vite', 'React', 'TypeScript', 'Docker', 'nginx'],
    link: { label: 'View on GitHub', href: 'https://github.com/Eriksson008/professional-portfolio' },
  },
];
