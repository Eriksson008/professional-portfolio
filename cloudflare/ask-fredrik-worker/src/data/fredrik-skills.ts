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
      'Workers AI in the portfolio assistant: guarded calls, timeouts, output caps, curated fallbacks.',
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
      'Two shipped projects: question logging here, and an app with forward-only migrations on live data.',
    relatedProjects: ['Professional Portfolio', 'Homebase'],
    allowedAnswer:
      'Yes — Fredrik uses Cloudflare D1 in two shipped projects. Here it stores the assistant’s ' +
      'question log with salted IP hashes and FIFO retention (never raw IPs). In Homebase it is ' +
      'the production datastore, with forward-only schema migrations applied against live data ' +
      'behind a documented recovery path. That is project-level rather than enterprise ' +
      'experience — his enterprise database work is PostgreSQL/Aurora and DynamoDB on AWS.',
  },
  {
    name: 'Cloudflare Access',
    aliases: ['cloudflare access', 'zero trust', 'zero-trust', 'access policy'],
    confidence: 'project',
    publicSafe: true,
    summary:
      'Zero-trust gating; the identity assertion is re-validated in-Worker, not trusted at the edge.',
    relatedProjects: ['Professional Portfolio', 'Homebase'],
    allowedAnswer:
      'Yes — Fredrik uses Cloudflare Access to gate the private surfaces of his own projects, and ' +
      'notably does not stop at the edge check: this portfolio’s admin dashboard re-validates the ' +
      'Access identity assertion inside the Worker itself — RS256 against the team key set, with ' +
      'issuer, audience, and expiry all verified, then an email allowlist — so a request that ' +
      'bypasses Access fails closed. It’s project-level experience; his enterprise identity work ' +
      'is OIDC/Azure AD and passwordless OTP flows.',
  },
  {
    name: 'Model Context Protocol (MCP)',
    aliases: ['mcp', 'model context protocol', 'mcp server', 'mcp servers'],
    confidence: 'project',
    publicSafe: true,
    summary:
      'Built a TypeScript MCP server: ten tools, provider integrations, path-safety chokepoint.',
    allowedAnswer:
      'Yes — Fredrik has built a Model Context Protocol server: a TypeScript package exposing ten ' +
      'tools, with external provider integrations, FFmpeg-based media processing, a provenance ' +
      'and licensing evidence trail, and a path-safety chokepoint that rejects traversal, symlink ' +
      'escapes, and UNC paths. It’s project-level developer-tooling work rather than enterprise ' +
      'production experience.',
  },
  {
    name: 'Rust',
    aliases: ['rust', 'rust lang', 'rustlang'],
    confidence: 'project',
    publicSafe: true,
    summary:
      'Rust backend of a personal desktop app: orchestration, manifest validation, safety invariants.',
    relatedProjects: ['App Dashboard'],
    allowedAnswer:
      'Fredrik has project-level Rust experience, not enterprise experience — he wrote the Rust ' +
      'backend of a personal desktop app that orchestrates local containerized services: manifest ' +
      'validation, process lifecycle, content fingerprinting, and the safety invariants that keep ' +
      'it from ever deleting data, with 50 unit tests across the backend. He would describe it as a working ' +
      'competence he is still deepening, not a primary language.',
  },
  {
    name: 'Tauri',
    aliases: ['tauri', 'desktop app', 'native app'],
    confidence: 'project',
    publicSafe: true,
    summary:
      'Tauri v2 desktop shell: multi-webview windows, typed IPC boundary, capability-scoped child webviews.',
    relatedProjects: ['App Dashboard'],
    allowedAnswer:
      'Yes — Fredrik built a Tauri v2 desktop application: a Rust backend behind a typed IPC ' +
      'boundary, a Next.js frontend, custom multi-webview windows with an app-owned title bar, ' +
      'and child webviews granted zero host capabilities. Project-level experience rather than ' +
      'enterprise production work.',
  },
  {
    name: 'SQLite',
    aliases: ['sqlite', 'sqlite3'],
    confidence: 'project',
    publicSafe: true,
    summary: 'SQLite through Cloudflare D1 — schema design, forward-only migrations, and indexed pagination.',
    relatedProjects: ['Homebase', 'Professional Portfolio'],
    allowedAnswer:
      'Yes, at project level — Fredrik works with SQLite through Cloudflare D1, including schema ' +
      'design, forward-only migrations applied to live data, chronological indexes for cursor ' +
      'pagination, and constraint/trigger-backed data invariants. His enterprise relational work ' +
      'is PostgreSQL/Aurora.',
  },
  {
    name: 'Automated testing',
    // Deliberately NOT a bare 'testing' alias: that substring swallows
    // "penetration testing", "load testing", "user acceptance testing" etc.,
    // and this entry's answer opens with "Yes". Those must stay on the
    // conservative not-confirmed path.
    aliases: ['automated testing', 'unit test', 'unit tests', 'unit testing', 'vitest', 'test coverage', 'tdd'],
    confidence: 'professional',
    publicSafe: true,
    summary:
      'Test coverage as a review standard; personal projects test in the runtime that serves production.',
    relatedProjects: ['Homebase', 'Professional Portfolio'],
    allowedAnswer:
      'Yes — professionally Fredrik reviews for test coverage and maintainability as a team ' +
      'standard, including Apex test classes. In his own projects he goes further: Homebase runs ' +
      '173 tests inside the same workerd runtime that serves production rather than in Node, and ' +
      'this portfolio’s assistant carries over 400 automated checks covering its answer pipeline and ' +
      'its authentication, all run in CI on every change.',
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
    aliases: ['aws', 'ecs', 'fargate', 'amazon web services', 'cloudformation', 'infrastructure as code', 'iac', 'secrets manager', 'load balancer', 'alb'],
    confidence: 'professional',
    publicSafe: true,
    summary:
      'Professional AWS: deployed an enterprise AI assistant on ECS/Fargate behind load balancing and OIDC auth.',
    relatedProjects: ['Enterprise AI Client Assist'],
    allowedAnswer:
      'Yes — Fredrik works with AWS professionally. He deployed an enterprise AI assistant on ' +
      'ECS/Fargate behind an Application Load Balancer with OIDC/Azure AD authentication, ' +
      'integrates Amazon Bedrock models, and ships with Docker and CI/CD pipelines. The ' +
      'infrastructure is defined in CloudFormation with configuration held in Secrets ' +
      'Manager/SSM, so the environment is code rather than console clicks. He supports in ' +
      'production what he deploys.',
  },
  {
    name: 'Amazon Bedrock',
    aliases: ['bedrock', 'aws bedrock', 'amazon bedrock'],
    confidence: 'professional',
    publicSafe: true,
    summary:
      'Integrated Bedrock models in an enterprise AI assistant (Spring AI backend) as its largest contributor.',
    relatedProjects: ['Enterprise AI Client Assist'],
    allowedAnswer:
      'Yes — Fredrik integrated Amazon Bedrock models into an enterprise AI client-assist ' +
      'assistant with a Spring AI / Spring Boot backend, as the project’s single largest ' +
      'contributor (137 commits, 63% of its commits). That system runs in production on ' +
      'ECS/Fargate behind OIDC/Azure AD authentication.',
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
    aliases: ['apex', 'salesforce apex', 'soql', 'apex trigger', 'apex triggers', 'batch apex', 'queueable apex', 'test class', 'test classes'],
    confidence: 'professional',
    publicSafe: true,
    summary: '#1 contributor on an enterprise Salesforce platform; daily Apex development.',
    relatedProjects: ['Enterprise Salesforce Platform'],
    allowedAnswer:
      'Yes — Fredrik writes Apex daily as the #1 contributor on an enterprise Salesforce ' +
      'platform, where he led the team from 2025 and owned releases and production support. ' +
      'That includes Apex triggers and classes, asynchronous Batch and Queueable Apex for ' +
      'high-volume processing, test classes, and SOQL — both writing it and tuning it, alongside ' +
      'heap usage, to resolve large-volume data-processing failures against platform governor ' +
      'limits.',
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
      'platform, alongside Apex and OmniStudio. He is the platform’s #1 contributor and led its ' +
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
      'Yes — Fredrik owned Copado deployments and release coordination for an enterprise ' +
      'Salesforce platform, as part of his acting Technical Lead responsibilities.',
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
    // Deliberately generic: naming the specific gateway product would identify
    // the employer's internal stack, which the résumé/portfolio rules forbid.
    name: 'API gateway integration',
    aliases: ['api gateway', 'api gateways'],
    confidence: 'professional',
    publicSafe: true,
    summary: 'Professional exposure to API gateway routing, authentication, and integration patterns.',
    allowedAnswer:
      'Fredrik has professional experience with API gateway concepts — routing, authentication, ' +
      'and service-to-service integration patterns in enterprise environments. It’s a supporting ' +
      'skill in his API and integration work rather than a headline specialty, and the specific ' +
      'products involved are employer-internal, so they aren’t named.',
  },
  {
    name: 'OAuth / OIDC',
    aliases: ['oauth', 'oidc', 'openid', 'sso', 'jwt', 'authentication', 'azure ad', 'azuread', 'entra', 'active directory', 'passwordless', 'otp', 'identity'],
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
      'Personal infrastructure: private networking, remote access, controlled access to self-hosted tools.',
    relatedProjects: ['App Dashboard'],
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
    aliases: ['postgres', 'postgresql', 'aurora', 'rds', 'relational database', 'dynamodb', 'dynamo db', 'nosql', 'database'],
    confidence: 'professional',
    publicSafe: true,
    summary: 'Professional AWS data layer: PostgreSQL/Aurora application databases, plus DynamoDB.',
    allowedAnswer:
      'Yes — Fredrik has professional experience with the data layer of AWS-deployed services: ' +
      'PostgreSQL and Aurora as application databases (schema design, queries, migrations), and ' +
      'DynamoDB behind a document-generation service he co-led through QA. In his own projects he ' +
      'also runs SQLite via Cloudflare D1.',
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
      'Polished accessible UIs: design-token CSS, motion design, reduced-motion support on this site.',
    relatedProjects: ['Professional Portfolio', 'App Dashboard'],
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
