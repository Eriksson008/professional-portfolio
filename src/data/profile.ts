export const profile = {
  name: 'Fredrik Eriksson',
  initials: 'FE',
  role: 'Senior Software Engineer',
  location: 'Austin, TX Metro Area',
  tagline:
    'Senior full-stack engineer and acting Tech Lead — building and owning enterprise Salesforce platforms, Java/Spring services, and React/TypeScript applications on AWS, with AI woven into the way I deliver.',
  links: {
    email: 'eriksson.fredrik08@gmail.com',
    linkedin: 'https://www.linkedin.com/in/eriksson-fredrik',
    github: 'https://github.com/Eriksson008',
    // Base-aware so it resolves under the Pages project path and at "/" in Docker.
    resume: `${import.meta.env.BASE_URL}resume.pdf`,
  },
  // The "title block" — modeled on the title block of an engineering drawing.
  titleBlock: [
    { field: 'Role', value: 'Senior Software Engineer' },
    { field: 'Discipline', value: 'Full-stack · Salesforce · Cloud' },
    { field: 'Leadership', value: 'Acting Tech Lead · ~1.5 yrs' },
    { field: 'Scale', value: '750+ commits · 6 repos · 120+ stories' },
    { field: 'Recognition', value: 'Exceptional Impact · 2023–2025' },
    { field: 'Location', value: 'Austin, TX Metro Area' },
    { field: 'Status', value: 'Open to senior / lead roles' },
  ],
  about: [
    'I started in mechanical engineering — project management, technical drawings, and facility design — where I learned to break ambiguous problems into precise, buildable specifications. After the Dev10 software engineering program I moved into software full-time and joined an enterprise Group Insurance technology organization in 2022.',
    'I joined as an Associate Software Engineer and was promoted to Senior Software Engineer in 2024, working across enterprise Salesforce, Java/Spring Boot services, React applications, and AWS deployment architecture. In 2025 I began leading the enterprise Salesforce platform team, and for roughly the last year and a half I have carried acting Tech Lead-level responsibilities — design decisions, code review, mentoring and onboarding, release ownership, and translating business needs into reliable technical plans.',
    'That ownership has been recognized with my employer’s highest performance rating, "Exceptional Impact," for three consecutive years (2023–2025) across both delivery and leadership. I care about shipping maintainable systems, raising quality through reviews and testing, being a dependable owner for the people and platforms I support, and keeping production stable under enterprise reliability standards.',
  ],
};

export type Profile = typeof profile;
