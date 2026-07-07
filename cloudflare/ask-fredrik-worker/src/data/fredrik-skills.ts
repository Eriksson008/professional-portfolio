/**
 * Ask Fredrik — approved public-safe skill knowledge.
 *
 * Every entry here is publishable directly on the public portfolio site.
 * Rules (same as the résumé and CLAUDE.md):
 *   - Only skills Fredrik actually has, at the confidence level he actually
 *     has them. No inferring experience from adjacent technologies, no
 *     inflating personal/project experience into enterprise experience.
 *   - No internal system/project/product codenames, no client names, no
 *     employer-confidential implementation details.
 *   - `allowedAnswer` is the exact answer the assistant may give — write it
 *     recruiter-friendly, concise, and conservative.
 *   - `aliases` are matched against the normalized question (lowercase, no
 *     punctuation) — keep them lowercase; words of ≤4 chars are matched as
 *     whole words automatically.
 */

/** How Fredrik's experience with a skill is characterized — never overstate. */
export type ExperienceConfidence =
  | 'professional' // used in enterprise production work
  | 'project' // real use in shipped personal/side projects (incl. this portfolio)
  | 'personal' // hands-on personal infrastructure / home-lab use
  | 'learning' // actively exploring, not yet claimable experience
  | 'not_confirmed'; // not in the approved knowledge base — never claim it

export interface SkillKnowledge {
  name: string;
  /** Lowercase, normalized phrases that should route to this skill. */
  aliases?: string[];
  confidence: ExperienceConfidence;
  /** Must be true for every entry in this file — the assistant only ever
   *  sees public-safe knowledge. */
  publicSafe: boolean;
  /** One-to-two sentence summary serialized into the AI system prompt. */
  summary: string;
  /** Public, verifiable backing (repos, this site, résumé facts). */
  evidence?: string[];
  /** Names from fredrik-projects.ts where this skill shows up. */
  relatedProjects?: string[];
  /** The exact curated answer returned when this skill is asked about. */
  allowedAnswer: string;
}

export const SKILLS: SkillKnowledge[] = [
  {
    name: 'React',
    aliases: ['react', 'react.js', 'reactjs'],
    confidence: 'professional',
    publicSafe: true,
    summary:
      'Primary professional frontend technology — enterprise React frontends in production, plus this portfolio.',
    evidence: ['Enterprise AI Client Assist frontend', 'Professional Portfolio (Vite + React + TS)'],
    relatedProjects: ['Enterprise AI Client Assist', 'Professional Portfolio'],
    allowedAnswer:
      'Yes — React is one of Fredrik’s primary professional technologies. He built the React ' +
      'frontend of an enterprise AI assistant used in production, and this portfolio itself is a ' +
      'Vite + React + TypeScript app he designed and built end to end.',
  },
  {
    name: 'TypeScript',
    aliases: ['typescript', 'ts'],
    confidence: 'professional',
    publicSafe: true,
    summary: 'Daily professional language for frontend work; strict-mode TypeScript across projects.',
    relatedProjects: ['Professional Portfolio', 'Enterprise AI Client Assist'],
    allowedAnswer:
      'Yes — TypeScript is part of Fredrik’s daily professional stack. His enterprise React work ' +
      'and this portfolio (including its Cloudflare Worker backend) are written in strict-mode ' +
      'TypeScript.',
  },
  {
    name: 'JavaScript',
    aliases: ['javascript', 'js', 'ecmascript'],
    confidence: 'professional',
    publicSafe: true,
    summary: 'Professional JavaScript across frontend and Node tooling.',
    allowedAnswer:
      'Yes — JavaScript is core to Fredrik’s professional work: React/TypeScript frontends, ' +
      'Lightning Web Components on Salesforce, and Node-based tooling all build on it.',
  },
  {
    name: 'Node.js',
    aliases: ['node', 'node.js', 'nodejs'],
    confidence: 'professional',
    publicSafe: true,
    summary: 'Uses Node for backend and tooling work; primary backend production stack is Java/Spring Boot.',
    allowedAnswer:
      'Fredrik uses Node.js for backend and tooling work alongside his primary backend stack. ' +
      'Most of his backend production experience is Java / Spring Boot; Node shows up in build ' +
      'tooling, scripts, and project backends.',
  },
  {
    name: 'Next.js',
    aliases: ['next.js', 'nextjs', 'next js'],
    confidence: 'project',
    publicSafe: true,
    summary: 'Project experience via AFR, a content/community concept app. Not his enterprise stack.',
    relatedProjects: ['AFR'],
    allowedAnswer:
      'Fredrik has project experience with Next.js through AFR, a content/community concept app ' +
      'he builds outside work. His primary professional frontend stack is React + TypeScript; ' +
      'Next.js is part of his personal project toolkit rather than his enterprise production stack.',
  },
  {
    name: 'Cloudflare Workers',
    aliases: ['cloudflare worker', 'cloudflare', 'edge function', 'edge functions', 'serverless'],
    confidence: 'project',
    publicSafe: true,
    summary:
      "Built and deployed this portfolio's assistant Worker: curated pipeline, rate limiting, D1 logging, Workers AI.",
    evidence: ['This portfolio’s Ask Fredrik assistant runs on a Worker he built'],
    relatedProjects: ['Professional Portfolio'],
    allowedAnswer:
      'Yes — Fredrik built and deployed the Cloudflare Worker that powers this portfolio’s ' +
      '“Ask Fredrik” assistant: an edge API with a curated answer pipeline, sensitive-topic ' +
      'filtering, rate limiting, D1 question logging, and a guarded Workers AI integration, all ' +
      'on the Workers free tier. It’s project experience — his enterprise cloud work is on AWS — ' +
      'but it’s real, shipped, and publicly visible.',
  },
  {
    name: 'Workers AI',
    aliases: ['workers ai', 'workersai', 'cloudflare ai', 'serverless ai', 'edge ai'],
    confidence: 'project',
    publicSafe: true,
    summary:
      'Integrated Workers AI in the portfolio assistant: guarded model calls, timeouts, output caps, curated fallbacks.',
    relatedProjects: ['Professional Portfolio'],
    allowedAnswer:
      'Yes — this portfolio’s assistant uses Cloudflare Workers AI. Fredrik built the guarded ' +
      'integration himself: a strictly scoped approved context, timeouts, output caps, and ' +
      'deterministic curated fallbacks so the widget never errors out. It’s project-level ' +
      'experience that complements his enterprise AI work on AWS Bedrock.',
  },
  {
    name: 'Cloudflare D1',
    aliases: ['d1', 'cloudflare d1'],
    confidence: 'project',
    publicSafe: true,
    summary:
      'Project exploration: privacy-conscious question logging for the portfolio assistant (salted hashes, no raw IPs).',
    relatedProjects: ['Professional Portfolio'],
    allowedAnswer:
      'Fredrik has used Cloudflare D1 in this portfolio’s assistant for privacy-conscious ' +
      'question logging (salted IP hashes, never raw IPs). It’s project-level exploration of the ' +
      'platform, not deep production database experience — that side of his work is ' +
      'PostgreSQL/Aurora on AWS.',
  },
  {
    name: 'GitHub Pages',
    aliases: ['github pages', 'gh pages', 'static hosting'],
    confidence: 'project',
    publicSafe: true,
    summary: 'This portfolio deploys to GitHub Pages via a GitHub Actions workflow.',
    relatedProjects: ['Professional Portfolio'],
    allowedAnswer:
      'Yes — this portfolio is deployed to GitHub Pages through a GitHub Actions workflow Fredrik ' +
      'set up, with an environment-driven Vite base path so the same build also ships as a ' +
      'Dockerized nginx site.',
  },
  {
    name: 'AWS (ECS / Fargate)',
    aliases: ['aws', 'ecs', 'fargate', 'amazon web services'],
    confidence: 'professional',
    publicSafe: true,
    summary:
      'Professional AWS: deployed an enterprise AI assistant on ECS/Fargate behind load balancing and OIDC auth.',
    relatedProjects: ['Enterprise AI Client Assist'],
    allowedAnswer:
      'Yes — Fredrik works with AWS professionally. He deployed an enterprise AI assistant on ' +
      'ECS/Fargate behind load balancing and OIDC/Azure AD authentication, integrates AWS Bedrock ' +
      'models, and ships with Docker and CI/CD pipelines. He supports in production what he ' +
      'deploys.',
  },
  {
    name: 'AWS Bedrock',
    aliases: ['bedrock', 'aws bedrock', 'amazon bedrock'],
    confidence: 'professional',
    publicSafe: true,
    summary:
      'Integrated Bedrock models in an enterprise AI assistant (Spring AI backend) as its largest contributor.',
    relatedProjects: ['Enterprise AI Client Assist'],
    allowedAnswer:
      'Yes — Fredrik integrated AWS Bedrock models into an enterprise AI client-assist assistant ' +
      'with a Spring AI / Spring Boot backend, as the project’s single largest contributor. ' +
      'That system runs in production on ECS/Fargate.',
  },
  {
    name: 'Spring Boot / Spring AI',
    aliases: ['spring', 'spring boot', 'spring ai', 'springboot'],
    confidence: 'professional',
    publicSafe: true,
    summary: 'Professional backend stack: Spring Boot services and Spring AI integration work.',
    relatedProjects: ['Enterprise AI Client Assist', 'Secure Client Onboarding Portal'],
    allowedAnswer:
      'Yes — Java / Spring Boot is Fredrik’s primary professional backend stack, including ' +
      'Spring AI for an enterprise AI assistant he was the largest contributor to, and secure ' +
      'portal services with OTP verification and session management.',
  },
  {
    name: 'Java',
    aliases: ['java'],
    confidence: 'professional',
    publicSafe: true,
    summary: 'Primary professional backend language (Spring Boot services in production).',
    allowedAnswer:
      'Yes — Java is Fredrik’s primary professional backend language. He builds and supports ' +
      'Spring Boot services in production, including the backend of an enterprise AI assistant ' +
      'and secure onboarding portal services.',
  },
  {
    name: 'Salesforce Apex',
    aliases: ['apex', 'salesforce apex'],
    confidence: 'professional',
    publicSafe: true,
    summary: '#1 contributor on an enterprise Salesforce platform; daily Apex development.',
    relatedProjects: ['Enterprise Salesforce Platform'],
    allowedAnswer:
      'Yes — Fredrik writes Apex daily as the #1 contributor on an enterprise Salesforce ' +
      'platform, where he has led the team since 2025 and owns releases and production support.',
  },
  {
    name: 'Salesforce Lightning Web Components',
    aliases: ['lwc', 'lightning web component', 'lightning web components', 'lightning'],
    confidence: 'professional',
    publicSafe: true,
    summary: 'Professional LWC development on an enterprise Salesforce platform (plus OmniStudio).',
    relatedProjects: ['Enterprise Salesforce Platform'],
    allowedAnswer:
      'Yes — Fredrik builds Lightning Web Components professionally on an enterprise Salesforce ' +
      'platform, alongside Apex and OmniStudio. He is the platform’s #1 contributor and leads its ' +
      'team.',
  },
  {
    name: 'Copado',
    aliases: ['copado'],
    confidence: 'professional',
    publicSafe: true,
    summary: 'Owns Copado deployments and release coordination on an enterprise Salesforce platform.',
    relatedProjects: ['Enterprise Salesforce Platform'],
    allowedAnswer:
      'Yes — Fredrik owns Copado deployments and release coordination for an enterprise ' +
      'Salesforce platform, as part of his acting Tech Lead responsibilities.',
  },
  {
    name: 'Jenkins',
    aliases: ['jenkins'],
    confidence: 'professional',
    publicSafe: true,
    summary: 'Professional CI/CD with Jenkins pipelines.',
    allowedAnswer:
      'Yes — Jenkins is part of Fredrik’s professional CI/CD toolkit, alongside Copado for ' +
      'Salesforce releases and GitHub Actions for repository automation.',
  },
  {
    name: 'GitHub Actions',
    aliases: ['github actions', 'gh actions', 'actions workflow'],
    confidence: 'professional',
    publicSafe: true,
    summary: 'CI/CD with GitHub Actions professionally and for this portfolio’s Pages deployment.',
    relatedProjects: ['Professional Portfolio'],
    allowedAnswer:
      'Yes — Fredrik uses GitHub Actions in his CI/CD work, and this portfolio’s own deploy ' +
      'pipeline is a GitHub Actions workflow he wrote that builds and publishes to GitHub Pages ' +
      'on every push to main.',
  },
  {
    name: 'API gateways (Kong)',
    aliases: ['kong', 'api gateway', 'api gateways'],
    confidence: 'professional',
    publicSafe: true,
    summary: 'Professional exposure to API gateway routing/auth/integration patterns, including Kong-style gateways.',
    allowedAnswer:
      'Fredrik has professional experience with API gateway concepts — routing, authentication, ' +
      'and integration patterns in enterprise environments, including Kong-style gateways. It’s a ' +
      'supporting skill in his API and integration work rather than a headline specialty.',
  },
  {
    name: 'OAuth / OIDC',
    aliases: ['oauth', 'oidc', 'openid', 'sso', 'jwt', 'authentication'],
    confidence: 'professional',
    publicSafe: true,
    summary:
      'Professional auth work: OIDC/Azure AD, JWT/RS256 sessions, passwordless OTP onboarding flows.',
    relatedProjects: ['Secure Client Onboarding Portal', 'Enterprise AI Client Assist'],
    allowedAnswer:
      'Yes — authentication is a recurring theme in Fredrik’s work. He led development of a ' +
      'secure client onboarding portal with passwordless authentication (one-time link → email ' +
      'match → OTP → RS256-signed sessions) and works with OIDC/Azure AD and JWT on AWS-deployed ' +
      'services.',
  },
  {
    name: 'Tailscale',
    aliases: ['tailscale', 'tail scale', 'vpn', 'private networking', 'remote access', 'mesh network'],
    confidence: 'personal',
    publicSafe: true,
    summary:
      'Hands-on personal infrastructure: secure private networking, remote access, and controlled access to self-hosted tools.',
    relatedProjects: ['AFR Gateway'],
    allowedAnswer:
      'Yes — Fredrik has hands-on experience with Tailscale in personal infrastructure and ' +
      'self-hosted app workflows, especially around private networking, remote access, and access ' +
      'control. It is not presented as one of his primary enterprise technologies, but it is part ' +
      'of his practical infrastructure experience.',
  },
  {
    name: 'Docker & WSL',
    aliases: ['docker', 'wsl', 'container', 'containers', 'containerization'],
    confidence: 'professional',
    publicSafe: true,
    summary: 'Docker professionally and across personal projects; WSL-based local dev environment.',
    relatedProjects: ['Professional Portfolio'],
    allowedAnswer:
      'Yes — Docker is part of Fredrik’s regular toolkit: enterprise CI/CD pipelines, and this ' +
      'portfolio itself ships as a Dockerized nginx site. He also runs a WSL-based local ' +
      'development environment for his personal infrastructure.',
  },
  {
    name: 'PostgreSQL / Aurora',
    aliases: ['postgres', 'postgresql', 'aurora', 'rds', 'relational database'],
    confidence: 'professional',
    publicSafe: true,
    summary: 'Professional use of PostgreSQL/Aurora as application databases on AWS.',
    allowedAnswer:
      'Yes — Fredrik has professional experience using PostgreSQL and Aurora as application ' +
      'databases on AWS-deployed services: schema design, queries, and supporting the data layer ' +
      'of systems he ships.',
  },
  {
    name: 'Elasticsearch / ELK',
    aliases: ['elasticsearch', 'elastic search', 'kibana', 'elk'],
    confidence: 'professional',
    publicSafe: true,
    summary: 'Professional use of Elasticsearch/ELK for search and log analytics.',
    allowedAnswer:
      'Yes — Fredrik has worked with Elasticsearch and the ELK stack professionally for search ' +
      'and log analytics as part of supporting production systems.',
  },
  {
    name: 'UI/UX implementation',
    aliases: [
      'ui/ux',
      'ui ux',
      'ux',
      'ui design',
      'user experience',
      'user interface',
      'frontend design',
      'design system',
      'css',
      'accessibility',
    ],
    confidence: 'professional',
    publicSafe: true,
    summary:
      'Implements polished, accessible UIs: design-token CSS system, motion design, reduced-motion support on this site.',
    relatedProjects: ['Professional Portfolio', 'AFR Gateway'],
    allowedAnswer:
      'Yes — Fredrik implements polished, accessible UIs. This portfolio demonstrates it ' +
      'directly: a hand-written CSS design-token system, cinematic motion design with ' +
      'framer-motion, semantic HTML, keyboard focus, and prefers-reduced-motion support. ' +
      'Professionally he builds enterprise React and Lightning UIs.',
  },
  {
    name: 'AI-assisted development (Claude Code, Codex)',
    aliases: [
      'claude code',
      'codex',
      'ai-assisted',
      'ai assisted',
      'ai pair programming',
      'agentic development',
      'ai tooling',
    ],
    confidence: 'professional',
    publicSafe: true,
    summary:
      'Daily AI-assisted engineering: Claude Code and Codex for review, documentation, and multi-agent workflows.',
    relatedProjects: ['Professional Portfolio'],
    allowedAnswer:
      'Yes — Fredrik works AI-assisted daily. He uses Claude Code and Codex for code review, ' +
      'documentation, knowledge transfer, and multi-agent delivery workflows across his ' +
      'repositories — including building this portfolio and its Cloudflare Worker assistant.',
  },
];
