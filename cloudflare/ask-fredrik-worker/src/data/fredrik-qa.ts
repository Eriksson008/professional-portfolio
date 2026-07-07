/**
 * Ask Fredrik — curated Q&A for common recruiter questions.
 *
 * These are answered without calling AI: instant, free, deterministic — and
 * they log a real matched_intent. Ordered by recruiter relevance; keyword
 * scoring keeps the earliest entry on ties, and an exact match on `question`
 * trumps everything (it runs before the skill/project knowledge matcher).
 *
 * Public-safe facts only — same rules as src/data/fredrik-skills.ts.
 */

/** Curated answer for a recognized recruiter intent. */
export interface CuratedAnswer {
  /** Intent id — logged to D1 as matched_intent and returned as matchedIntent. */
  intent: string;
  /** Canonical suggested question (exact matches trump keyword scoring). */
  question: string;
  /** Lowercase phrases matched against the normalized question. */
  keywords: string[];
  answer: string;
}

export const CURATED_ANSWERS: CuratedAnswer[] = [
  {
    intent: 'strengths',
    question: 'What does Fredrik do well?',
    keywords: ['do well', 'strength', 'good at', 'best at', 'excel', 'superpower', 'strongest'],
    answer:
      'Fredrik’s core strength is end-to-end ownership of enterprise systems: he designs, builds, ' +
      'ships, and then supports what he ships. He works across the full stack — React/TypeScript ' +
      'frontends, Java/Spring Boot services, AWS deployment architecture, and enterprise Salesforce ' +
      '— and has carried acting Tech Lead responsibilities for roughly the last year and a half: ' +
      'design decisions, code review, mentoring, and release ownership. That ownership earned his ' +
      'employer’s highest performance rating, “Exceptional Impact,” three consecutive years ' +
      '(2023–2025).',
  },
  {
    intent: 'role_fit',
    question: 'What roles is Fredrik best suited for?',
    keywords: ['role', 'suited', 'fit', 'position', 'looking for', 'open to', 'seniority'],
    answer:
      'Fredrik is best suited for Senior Software Engineer, Full-Stack, Backend, Salesforce ' +
      'Engineer, Cloud / Application Engineer, and Tech Lead-track roles. He is strongest where ' +
      'teams need someone who can own a platform — building features, running CI/CD and releases ' +
      '(Copado, Jenkins), handling production support, and leading other engineers — rather than ' +
      'working a single narrow layer.',
  },
  {
    intent: 'strongest_projects',
    question: 'What are Fredrik’s strongest projects?',
    keywords: ['project', 'strongest', 'built', 'portfolio piece', 'work sample', 'case stud', 'shipped'],
    answer:
      'Three enterprise projects stand out: an Enterprise AI Client Assist assistant (React + ' +
      'Spring AI on an AWS/Bedrock-style architecture — he was the single largest contributor), a ' +
      'Secure Internal/External Onboarding Portal (OTP email verification, session management, and ' +
      'secure onboarding patterns, delivered as lead developer), and an enterprise Salesforce ' +
      'platform where he is the #1 contributor and now leads the team. Personal work includes ' +
      'Homebase (a private homeowner/home-operations dashboard concept), AFR (a content/community ' +
      'concept), AFR Gateway (a private launcher dashboard for self-hosted apps), and this ' +
      'portfolio itself — including the Cloudflare Worker assistant answering you now.',
  },
  {
    intent: 'technical_stack',
    question: 'What is Fredrik’s technical stack?',
    keywords: ['stack', 'technolog', 'languages', 'frameworks', 'tools', 'skills', 'typescript', 'react', 'spring', 'java'],
    answer:
      'Frontend: React and TypeScript (plus Lightning Web Components). Backend: Java / Spring Boot ' +
      'and Node. Cloud: AWS — ECS/Fargate, Bedrock, load balancing, and OIDC/Azure AD auth — plus ' +
      'Cloudflare Workers for edge projects like this assistant. Platform: enterprise Salesforce ' +
      '(Apex, LWC, OmniStudio). Delivery: CI/CD with Copado, Jenkins, and GitHub Actions, Docker, ' +
      'PostgreSQL/Aurora, and Elasticsearch/ELK. He also builds enterprise AI applications and ' +
      'uses Codex and Claude Code for AI-assisted review, documentation, and multi-agent workflows.',
  },
  {
    intent: 'why_interview',
    question: 'Why should we interview Fredrik?',
    keywords: ['why', 'interview', 'hire', 'stand out', 'different', 'convince', 'pitch'],
    answer:
      'Because the track record is verifiable: 750+ commits across production repositories, 120+ ' +
      'Jira stories delivered, top contributor on two production codebases, and “Exceptional ' +
      'Impact” — his employer’s highest rating — three years running (2023–2025). He combines ' +
      'senior hands-on delivery (React, Spring Boot, AWS, Salesforce, enterprise AI applications) ' +
      'with real leadership: he currently leads a platform team, owns releases and production ' +
      'support, and mentors other engineers. Every number he claims is documented; the résumé on ' +
      'this site mirrors the same facts.',
  },
  {
    intent: 'leadership',
    question: 'What leadership experience does Fredrik have?',
    keywords: ['lead', 'leadership', 'mentor', 'manage', 'team', 'tech lead', 'code review'],
    answer:
      'Fredrik has carried acting Tech Lead responsibilities for roughly the last year and a half ' +
      'on an enterprise Salesforce platform team: design decisions, code review, mentoring and ' +
      'onboarding, release ownership, and translating business needs into technical plans. He owns ' +
      'Copado deployments, release coordination, and production support, and his leadership was ' +
      'part of what earned three consecutive “Exceptional Impact” ratings.',
  },
  {
    intent: 'ai_experience',
    question: 'What AI experience does Fredrik have?',
    keywords: ['ai', 'llm', 'machine learning', 'genai', 'agent', 'copilot', 'artificial intelligence'],
    answer:
      'Fredrik builds AI applications at two levels. Professionally, he was the single largest ' +
      'contributor to an enterprise AI Client Assist assistant — a React frontend with a Spring ' +
      'AI / Spring Boot backend integrating AWS Bedrock models, deployed on ECS/Fargate. On his ' +
      'own infrastructure, he built the Cloudflare Workers AI assistant answering you right now, ' +
      'including its curated matcher, safety filters, and guarded model integration. He also uses ' +
      'Codex and Claude Code daily for AI-assisted review, documentation, and multi-agent ' +
      'delivery workflows.',
  },
  {
    intent: 'cloud_experience',
    question: 'How does Fredrik use AWS and cloud?',
    keywords: ['cloud experience', 'use cloud', 'deployment', 'infrastructure', 'devops', 'ci/cd', 'cicd'],
    answer:
      'Fredrik works with AWS daily: he deployed an enterprise AI assistant on ECS/Fargate behind ' +
      'load balancing and OIDC/Azure AD authentication, integrates AWS Bedrock models, and ships ' +
      'with Docker and CI/CD pipelines (Jenkins, Copado, GitHub Actions). He also builds on ' +
      'Cloudflare’s edge platform — this portfolio’s assistant is a Cloudflare Worker with ' +
      'Workers AI and D1 that he built and deployed himself.',
  },
  {
    intent: 'salesforce_experience',
    question: 'What Salesforce experience does Fredrik have?',
    keywords: ['salesforce', 'omnistudio', 'crm'],
    answer:
      'Fredrik is the #1 contributor on an enterprise Salesforce platform and has led its team ' +
      'since 2025. He works in Apex, Lightning Web Components, and OmniStudio, owns Copado ' +
      'deployments and release coordination, and handles production support and data fixes for ' +
      'business-critical delivery — work that contributed to three consecutive “Exceptional ' +
      'Impact” ratings.',
  },
  {
    intent: 'production_support',
    question: 'Does Fredrik have production support experience?',
    keywords: ['production support', 'on call', 'on-call', 'incident', 'support experience', 'troubleshoot', 'operations'],
    answer:
      'Yes — production support is a core part of Fredrik’s role, not an afterthought. He owns ' +
      'production support for an enterprise Salesforce platform (incidents, data fixes, ' +
      'business-critical delivery) and supports the AWS-deployed systems he builds. His working ' +
      'principle is that you support what you ship — it’s part of what earned three consecutive ' +
      '“Exceptional Impact” ratings.',
  },
  {
    intent: 'contact_resume',
    question: 'How can I contact Fredrik or view his resume?',
    keywords: [
      'contact',
      'reach',
      'email',
      'linkedin',
      'github',
      'resume',
      'cv',
      'available',
      'availability',
      'opportunit',
      'get in touch',
    ],
    answer:
      'You can reach Fredrik at eriksson.fredrik08@gmail.com or on LinkedIn ' +
      '(linkedin.com/in/eriksson-fredrik); his code is at github.com/Eriksson008. His one-page ' +
      'résumé — same facts and numbers as this site — is available from the Contact section. He ' +
      'is based in the Austin, TX metro area and open to senior and lead roles — reach out about ' +
      'senior engineer, full-stack, Salesforce, cloud/application, or tech-lead-track ' +
      'opportunities.',
  },
];
