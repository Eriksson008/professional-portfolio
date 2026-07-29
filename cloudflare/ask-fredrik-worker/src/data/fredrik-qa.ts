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
  // NOTE ON ORDER: matchCuratedKeywords scores by keyword COUNT and breaks ties by array
  // position, so a generic one-word keyword in an earlier entry beats a specific phrase in a
  // later one. role_fit's 'role' matched "why did he leave his last role?" and won on the tie,
  // sending a departure question to the role-fit answer. This entry therefore sits FIRST. It
  // steals nothing: every keyword here is a multi-word 'why ...' phrase.
  {
    // Deliberately steers to a live conversation. The real reasons are private, and any version
    // an assistant gives either reads as a complaint about a former employer or invites a
    // follow-up it cannot handle. Redirects to the record instead, then to what he wants next.
    intent: 'role_change_reason',
    question: 'Why is Fredrik looking for a new role?',
    keywords: [
      'why is he looking',
      'why did he leave',
      'why he left',
      'reason for leaving',
      'why leaving',
      'why move on',
      'why change roles',
      'looking for a new',
      'new role',
      'new opportunity',
      'move on from',
    ],
    answer:
      'Fredrik would rather cover that with you directly than through a portfolio assistant. ' +
      'What the record shows: three consecutive “Exceptional Impact” ratings, 750+ commits across ' +
      '6 production systems, and a year and a half of acting Technical Lead responsibility across ' +
      'two teams. He is looking for a role where that level of ownership comes with the matching ' +
      'title and scope, and where he can keep building and operating platforms end to end.',
  },
  {
    intent: 'strengths',
    question: 'What does Fredrik do well?',
    keywords: ['do well', 'strength', 'good at', 'best at', 'excel', 'superpower', 'strongest'],
    answer:
      'Fredrik’s core strength is end-to-end ownership of enterprise systems: he designs, builds, ' +
      'ships, and then supports what he ships. He works across the full stack — React/TypeScript ' +
      'frontends, Java/Spring Boot services, AWS deployment architecture, and enterprise Salesforce ' +
      '— and carried acting Technical Lead responsibilities for roughly a year and a half: ' +
      'design decisions, code review, mentoring, and release ownership. That ownership earned his ' +
      'employer’s highest performance designation, “Exceptional Impact,” three consecutive years ' +
      '(2023–2025).',
  },
  {
    intent: 'role_fit',
    question: 'What roles is Fredrik best suited for?',
    keywords: ['role', 'suited', 'fit', 'position', 'looking for', 'open to', 'seniority'],
    answer:
      'Fredrik is best suited for Senior Software Engineer, Full-Stack, Backend, Salesforce ' +
      'Engineer, Cloud / Application Engineer, and technical-leadership-track roles. He is strongest where ' +
      'teams need someone who can own a platform — building features, running CI/CD and releases ' +
      '(Copado, Jenkins), handling production support, and leading other engineers — rather than ' +
      'working a single narrow layer.',
  },
  {
    // Claims the timing/scheduling phrasings so they resolve to one fixed answer instead of
    // reaching the model, which has no basis for answering them. Keyword-only by design:
    // `question` is empty, so it never appears as a suggested chip. Points at the résumé and the
    // contact details, which are authoritative for anything it does not state.
    intent: 'availability',
    question: '',
    keywords: [
      'available',
      'availability',
      'start date',
      'when can he start',
      'how soon',
      'notice period',
      'open to work',
      'job hunting',
      'currently employed',
      'employed now',
      'still working',
      'unemployed',
      'out of work',
      'on the market',
    ],
    answer:
      'Start dates and timing are best covered with Fredrik directly — he is glad to talk through ' +
      'those in a conversation rather than here. He is based in the Austin, TX metro area and open ' +
      'to Senior Software Engineer, technical-leadership-track, platform, backend/full-stack, and ' +
      'AI-enabled application roles. His role history and dates are on the résumé linked from this ' +
      'portfolio, and he can be reached at eriksson.fredrik08@gmail.com or on LinkedIn.',
  },
  {
    intent: 'strongest_projects',
    question: 'What are Fredrik’s strongest projects?',
    keywords: ['project', 'strongest', 'built', 'portfolio piece', 'work sample', 'case stud', 'shipped'],
    answer:
      'Three from work: a greenfield client onboarding platform he led the architecture and ' +
      'delivery of — three integrated microservices, roughly 16,000 lines across 144 commits in ' +
      'under five weeks, including a passwordless authentication flow built to enterprise CIAM ' +
      'and penetration-test requirements; an enterprise AI assistant where he was the single ' +
      'largest contributor at 63% of its commits — Salesforce records streamed into Elasticsearch ' +
      'and answered over with Spring AI on Amazon Bedrock, so business users could reach client ' +
      'detail without a Salesforce read-only license; ' +
      'and an enterprise Salesforce platform where he is the top contributor with 470+ commits ' +
      'and led the team from 2025. Three of his own: this portfolio and the assistant ' +
      'answering you now, Homebase — a household app he runs in production on Cloudflare ' +
      'Workers and D1 with live schema migrations, a scheduled job, and 173 tests — and App ' +
      'Dashboard, a Tauri/Rust desktop control plane for local containerized services with its ' +
      'safety invariants under unit test. The personal ones are where he owns deployment and ' +
      'operations end to end.',
  },
  {
    intent: 'technical_stack',
    question: 'What is Fredrik’s technical stack?',
    keywords: ['stack', 'technolog', 'languages', 'frameworks', 'tools', 'skills', 'typescript', 'react', 'spring', 'java'],
    answer:
      'Backend: Java 21 / Spring Boot, REST APIs and service-to-service integration, plus ' +
      'Node/Express. Frontend: React and TypeScript (and Next.js in personal projects). Cloud: ' +
      'AWS — ECS/Fargate, Application Load Balancer, CloudFormation, Secrets Manager, Amazon ' +
      'Bedrock, DynamoDB — with OIDC/Azure AD access control. Data: PostgreSQL/Aurora, DynamoDB, ' +
      'and Elasticsearch/Logstash/Kibana (ELK). Platform: an enterprise Salesforce estate he led and is the top ' +
      'contributor on (Apex, Lightning Web Components, OmniStudio). Delivery: CI/CD with Jenkins, ' +
      'GitHub Actions, and Copado, plus Docker. In his own shipped projects he also works on ' +
      'Cloudflare Workers, D1, Workers AI, and Cloudflare Access, and has built with Tauri/Rust ' +
      'and Model Context Protocol tooling.',
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
      'with real leadership: he led a platform team, owned releases and production ' +
      'support, and mentored other engineers. Every number he claims is documented; the résumé on ' +
      'this site mirrors the same facts.',
  },
  {
    intent: 'leadership',
    question: 'What leadership experience does Fredrik have?',
    keywords: ['lead', 'leadership', 'mentor', 'manage', 'team', 'tech lead', 'code review'],
    answer:
      'Fredrik carried acting Technical Lead responsibilities for roughly a year and a half — from ' +
      '2025 until the role concluded in June 2026 — leading 7 engineers across two teams and ' +
      'mentoring 3 of them: design decisions, code review, onboarding, release ownership, and ' +
      'translating business needs into technical plans. The Salesforce platform he led serves about ' +
      '250 Group Insurance users. He owned Copado deployments, release coordination, and production ' +
      'support, and his leadership was part of what earned three consecutive “Exceptional Impact” ' +
      'ratings.',
  },
  {
    intent: 'ai_experience',
    question: 'What AI experience does Fredrik have?',
    keywords: ['ai', 'llm', 'machine learning', 'genai', 'agent', 'copilot', 'artificial intelligence'],
    answer:
      'Three different things, worth keeping separate. In production at work, he was the single ' +
      'largest contributor (137 commits, 63% of its commits) to an enterprise AI assistant that ' +
      'answers business users’ natural-language questions over enterprise data and search — a ' +
      'React frontend with a Spring AI / Spring Boot backend on Amazon Bedrock, deployed on ' +
      'ECS/Fargate. In his own projects, he designed and operates the assistant answering you now: ' +
      'a five-stage pipeline with rate limiting, a sensitive-topic filter, a curated matcher, a ' +
      'Workers AI call, and a deterministic fallback, plus a guard that discards any model answer ' +
      'echoing its own instructions. Separately, he uses Codex and Claude Code as development ' +
      'tools for review and documentation — that is tooling, not machine-learning engineering, ' +
      'and he does not claim a productivity number for it.',
  },
  {
    intent: 'cloud_experience',
    question: 'How does Fredrik use AWS and cloud?',
    keywords: ['cloud experience', 'use cloud', 'deployment', 'infrastructure', 'devops', 'ci/cd', 'cicd'],
    answer:
      'Fredrik works with AWS daily: containerized services on ECS/Fargate behind an Application ' +
      'Load Balancer, infrastructure defined in CloudFormation, configuration in Secrets ' +
      'Manager/SSM, OIDC/Azure AD access control, Amazon Bedrock and DynamoDB, and release ' +
      'automation in Jenkins alongside GitHub Actions and Copado. Outside work he owns the whole ' +
      'lifecycle himself on Cloudflare’s edge platform: this assistant is a Worker he built and ' +
      'deployed with Workers AI and D1, and his household app runs on Workers and D1 with ' +
      'forward-only schema migrations applied to live data, a daily scheduled job, Cloudflare ' +
      'Access identity, and GitHub Actions deploy pipelines. The enterprise experience is the ' +
      'depth; the personal projects are where he owns the operations end to end.',
  },
  {
    intent: 'salesforce_experience',
    question: 'What Salesforce experience does Fredrik have?',
    keywords: ['salesforce', 'omnistudio', 'crm'],
    answer:
      'Fredrik is the #1 contributor on an enterprise Salesforce platform and led its team from ' +
      '2025. He works in Apex, Lightning Web Components, and OmniStudio, owned Copado ' +
      'deployments and release coordination, and handled production support and data fixes for ' +
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
