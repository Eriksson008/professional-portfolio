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
      'Three enterprise projects stand out: an Enterprise AI Client-Assist assistant (React + Spring AI/Spring Boot on AWS Bedrock, deployed on ECS/Fargate — he was the single largest contributor), a Secure Client Onboarding Portal (three integrated microservices with passwordless authentication, delivered in under five weeks as lead developer), and an Enterprise Salesforce Platform where he is the #1 contributor and now leads the team. Personal work includes Homebase (an encrypted local accounts manager), AFR (a Next.js community hub), and this portfolio itself — built with the same stack it advertises.',
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
      'Frontend: React and TypeScript (plus Lightning Web Components). Backend: Java / Spring Boot and Node. Cloud: AWS — ECS/Fargate, Bedrock, load balancing, and OIDC/Azure AD auth. Platform: enterprise Salesforce (Apex, LWC, OmniStudio). Delivery: CI/CD with Copado, Jenkins, and GitHub Actions, Docker, PostgreSQL/Aurora, and Elasticsearch/ELK. He also builds enterprise AI applications — LLM integrations, retrieval, and multi-agent workflows.',
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
      'Fredrik builds enterprise AI applications. He was the single largest contributor to an internal AI client-assist assistant — a React frontend with a Spring AI / Spring Boot backend integrating an AWS Bedrock model, deployed on ECS/Fargate behind OIDC/Azure AD auth. He also builds multi-agent AI workflows for code review, documentation, and knowledge transfer, and uses AI-assisted delivery across all of his repositories.',
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
