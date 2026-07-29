export const profile = {
  name: 'Fredrik Eriksson',
  initials: 'FE',
  role: 'Senior Software Engineer',
  location: 'Austin, TX Metro Area',
  tagline:
    'Senior software engineer with acting Technical Lead experience — architecture and delivery across Java/Spring services, React/TypeScript applications, AWS infrastructure, and a large Salesforce platform, with AI-enabled applications shipped in production.',
  links: {
    email: 'eriksson.fredrik08@gmail.com',
    linkedin: 'https://www.linkedin.com/in/eriksson-fredrik',
    github: 'https://github.com/Eriksson008',
    portfolioGithub: 'https://github.com/Eriksson008/professional-portfolio',
    // Base-aware so it resolves under the Pages project path and at "/" in Docker.
    resume: `${import.meta.env.BASE_URL}resume.pdf`,
  },
  // The "title block" — modeled on the title block of an engineering drawing.
  titleBlock: [
    { field: 'Role', value: 'Senior Software Engineer' },
    { field: 'Discipline', value: 'Backend · Full-stack · Cloud · Platform' },
    { field: 'Leadership', value: 'Acting Technical Lead · 7 engineers · ~1.5 yrs' },
    { field: 'Scale', value: '750+ commits · 6 repos · 120+ stories' },
    { field: 'Recognition', value: 'Exceptional Impact · 2023–2025' },
    { field: 'Location', value: 'Austin, TX Metro Area' },
    { field: 'Status', value: 'Open to senior / lead roles' },
  ],
  about: [
    'I started in mechanical engineering — project management, technical drawings, and facility design — where I learned to break ambiguous problems into precise, buildable specifications. After the Dev10 software engineering program I moved into software full-time and joined an enterprise Group Insurance technology organization in February 2022 — first as a consultant through Genesis Corp, then as a direct employee from June 2023.',
    'I worked across enterprise Salesforce, Java/Spring Boot services, React applications, and AWS deployment architecture, and was promoted to Senior Software Engineer in 2024. From 2025 until the role concluded in June 2026 I carried acting Technical Lead responsibilities — design decisions, code review, mentoring and onboarding, release ownership, and translating business needs into reliable technical plans — leading 7 engineers across two teams.',
    'That ownership was recognized with my employer’s highest performance designation, "Exceptional Impact," for three consecutive years (2023–2025) across both delivery and leadership. I care about shipping maintainable systems, raising quality through reviews and testing, being a dependable owner for the people and platforms I support, and keeping production stable under enterprise reliability standards.',
  ],
};

export type Profile = typeof profile;
