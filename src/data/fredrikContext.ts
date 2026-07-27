/* ============================================================
   Ask Fredrik — curated public knowledge base.
   Approved, public-safe facts ONLY (same rules as the résumé:
   no internal codenames, no invented metrics, git-verifiable
   figures). This file is the entire "brain" of the v1 assistant
   — there is no LLM and no backend; answers are hand-written.
   ============================================================ */

export interface CuratedAnswer {
  id: string;
  /** Suggested-question label shown as a chip (empty for keyword-only topics). */
  question: string;
  /** Lowercase phrases matched against a normalized question. */
  keywords: string[];
  answer: string;
}

/** Shown as the assistant's opening message. */
export const greeting =
  'Hi — I answer recruiter questions about Fredrik Eriksson, Senior Software Engineer and acting Tech Lead. Pick a suggested question below, or ask about his projects, stack, leadership, or role fit.';

/** Curated response when no topic matches. */
export const unknownAnswer =
  'I can answer questions about Fredrik’s portfolio, projects, skills, and software engineering experience. Try asking about his strongest projects, technical stack, leadership experience, or role fit.';

/** Small-print disclosure shown under the input. */
export const disclosure =
  'Questions may be logged to improve this portfolio. Do not submit sensitive information.';

/**
 * Curated answers. The first five are the suggested questions surfaced as
 * chips; the rest are keyword-only topics so common recruiter phrasings
 * still land somewhere useful.
 */
export const curatedAnswers: CuratedAnswer[] = [
  {
    id: 'strengths',
    question: 'What does Fredrik do well?',
    keywords: ['do well', 'strength', 'good at', 'best at', 'excel', 'superpower'],
    answer:
      'Fredrik’s core strength is end-to-end ownership of enterprise systems: he designs, builds, ships, and then supports what he ships. He works across the full stack — React/TypeScript frontends, Java/Spring Boot services, AWS deployment architecture, and enterprise Salesforce — and has carried acting Tech Lead responsibilities for roughly the last year and a half: design decisions, code review, mentoring, and release ownership. That ownership earned his employer’s highest performance rating, “Exceptional Impact,” three consecutive years (2023–2025).',
  },
  {
    id: 'role-fit',
    question: 'What roles is Fredrik best suited for?',
    keywords: [
      'role',
      'suited',
      'fit',
      'position',
      'looking for',
      'open to',
      'hire him as',
      'seniority',
    ],
    answer:
      'Fredrik is best suited for Senior Software Engineer, Full-Stack, Backend, Salesforce Engineer, Cloud / Application Engineer, and Tech Lead-track roles. He is strongest where teams need someone who can own a platform — building features, running CI/CD and releases (Copado, Jenkins), handling production support, and leading other engineers — rather than working a single narrow layer.',
  },
  {
    id: 'projects',
    question: 'What are Fredrik’s strongest projects?',
    keywords: ['project', 'built', 'portfolio piece', 'work sample', 'case stud', 'shipped'],
    answer:
      'Three from work: a greenfield client onboarding platform he led the architecture and delivery of — three integrated microservices, roughly 16,000 lines across 144 commits in under five weeks, including a passwordless authentication flow built to enterprise CIAM and penetration-test requirements; an enterprise AI assistant where he was the single largest contributor at 63% of its commits (React, Spring AI, Amazon Bedrock, ECS/Fargate); and an enterprise Salesforce platform where he is the top contributor and has led the team since 2025. Three of his own: this portfolio and the assistant answering you, Homebase — a household app he runs in production on Cloudflare Workers and D1 with live schema migrations, a scheduled job, and 173 tests — and App Dashboard, a Tauri/Rust desktop control plane for local containerized services.',
  },
  {
    id: 'stack',
    question: 'What is Fredrik’s technical stack?',
    keywords: [
      'stack',
      'technolog',
      'tech he uses',
      'languages',
      'frameworks',
      'tools',
      'skills',
      'react',
      'spring',
      'aws',
      'salesforce',
      'java',
      'typescript',
    ],
    answer:
      'Backend: Java 21 / Spring Boot, REST APIs and service-to-service integration, plus Node/Express. Frontend: React and TypeScript (and Next.js in personal projects). Cloud: AWS — ECS/Fargate, Application Load Balancer, CloudFormation, Secrets Manager, Amazon Bedrock, DynamoDB — with OIDC/Azure AD access control. Data: PostgreSQL/Aurora, DynamoDB, and Elasticsearch/ELK. Platform: an enterprise Salesforce estate he leads and is the top contributor on (Apex, Lightning Web Components, OmniStudio). Delivery: CI/CD with Jenkins, GitHub Actions, and Copado, plus Docker. In his own shipped projects he also works on Cloudflare Workers, D1, Workers AI, and Cloudflare Access, and has built with Tauri/Rust and Model Context Protocol tooling.',
  },
  {
    id: 'why-interview',
    question: 'Why should we interview Fredrik?',
    keywords: ['why', 'interview', 'hire', 'stand out', 'different', 'convince', 'pitch'],
    answer:
      'Because the track record is verifiable: 750+ commits across production repositories, 120+ Jira stories delivered, top contributor on two production codebases, and “Exceptional Impact” — his employer’s highest rating — three years running (2023–2025). He combines senior hands-on delivery (React, Spring Boot, AWS, Salesforce, enterprise AI applications) with real leadership: he currently leads a platform team, owns releases and production support, and mentors other engineers. Every number he claims is documented; the résumé on this site mirrors the same facts.',
  },
  // ---- keyword-only topics (no chip) ----
  {
    id: 'leadership',
    question: '',
    keywords: ['lead', 'leadership', 'mentor', 'manage', 'team', 'tech lead', 'review'],
    answer:
      'Fredrik has carried acting Tech Lead responsibilities for roughly the last year and a half on an enterprise Salesforce platform team: design decisions, code review, mentoring and onboarding, release ownership, and translating business needs into technical plans. He owns Copado deployments, release coordination, and production support, and his leadership was part of what earned three consecutive “Exceptional Impact” ratings.',
  },
  {
    id: 'ai',
    question: '',
    keywords: ['ai', 'llm', 'bedrock', 'machine learning', 'genai', 'agent', 'copilot'],
    answer:
      'Three different things, worth keeping separate. In production at work, he was the single largest contributor (137 commits, 63% of its commits) to an internal AI assistant that answers business users’ natural-language questions over enterprise data and search — a React frontend with a Spring AI / Spring Boot backend on Amazon Bedrock, deployed on ECS/Fargate behind OIDC/Azure AD auth. In his own projects, he designed and operates this portfolio’s assistant: a five-stage pipeline with rate limiting, a sensitive-topic filter, a curated matcher, a Workers AI call, and a deterministic fallback. Separately, he uses Codex and Claude Code as development tools for review and documentation — tooling, not machine-learning engineering, and he claims no productivity number for it.',
  },
  {
    id: 'experience',
    question: '',
    keywords: ['experience', 'years', 'career', 'background', 'history', 'senior', 'how long'],
    answer:
      'Fredrik joined an enterprise Group Insurance technology organization in 2022, was promoted to Senior Software Engineer in 2024, and has led the enterprise Salesforce platform team since 2025 with acting Tech Lead responsibilities. Before software he worked in mechanical engineering, which shows in how he turns ambiguous problems into precise, buildable plans. Highlights: 750+ commits, 120+ Jira stories, and three straight years of “Exceptional Impact.”',
  },
  {
    id: 'security',
    question: '',
    keywords: ['security', 'auth', 'secure', 'compliance', 'pen test', 'ciam', 'oidc'],
    answer:
      'Security is a recurring theme in Fredrik’s work: he led development of a secure client onboarding portal built to enterprise CIAM and pen-test requirements, implemented passwordless authentication (one-time link → email match → OTP → RS256-signed sessions), and works daily with OIDC/Azure AD, JWT, and secure internal/external portal workflows on AWS.',
  },
  {
    id: 'contact',
    question: '',
    keywords: ['contact', 'reach', 'email', 'linkedin', 'available', 'availability', 'resume', 'cv'],
    answer:
      'You can reach Fredrik at eriksson.fredrik08@gmail.com or on LinkedIn (linkedin.com/in/eriksson-fredrik). His one-page résumé — same facts and numbers as this site — is available from the Contact section. He is based in the Austin, TX metro area and open to senior and lead roles.',
  },
];

/** The five chips surfaced in the widget, in display order. */
export const suggestedQuestions = curatedAnswers
  .filter((entry) => entry.question !== '')
  .map((entry) => ({ id: entry.id, question: entry.question }));
