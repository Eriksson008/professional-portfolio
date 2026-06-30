export interface TimelineEntry {
  period: string;
  title: string;
  org?: string;
  detail: string;
  current?: boolean;
}

export const timeline: TimelineEntry[] = [
  {
    period: '2025 — Present',
    title: 'Leading the enterprise Salesforce platform team — acting Tech Lead',
    detail:
      'Carry acting Tech Lead-level responsibilities: design ownership, code review, mentoring and onboarding junior developers, release ownership, and production support for an enterprise platform.',
    current: true,
  },
  {
    period: '2024',
    title: 'Promoted to Senior Software Engineer',
    detail:
      'Grew into senior-level ownership across enterprise Salesforce, Java/Spring Boot services, React applications, and AWS deployment — contributing to design decisions, code reviews, and mentoring.',
  },
  {
    period: '2022',
    title: 'Associate Software Engineer — Group Insurance Technology',
    detail:
      'Joined the Group Insurance platform teams, building and supporting enterprise Salesforce and full-stack functionality.',
  },
  {
    period: '2022',
    title: 'Dev10 Software Engineering Program — Genesis10',
    detail:
      'Full-stack training and a capstone application built with React, Spring Boot, and a SQL database on AWS.',
  },
  {
    period: '2020 — 2021',
    title: 'Mechanical Engineer — WTEC',
    detail:
      'Project management and design for a fabrication facility — AutoCAD mechanical drawings, cable simulations, specification sheets, and site planning.',
  },
  {
    period: '2020',
    title: 'B.S. Mechanical Engineering — NJIT',
    detail: 'New Jersey Institute of Technology. Cum Laude, GPA 3.6.',
  },
  {
    period: '2017',
    title: 'A.S. Engineering Science — PCCC',
    detail:
      'Passaic County Community College. Engineering Science Highest Award (top graduating engineering student), GPA 3.8.',
  },
];
