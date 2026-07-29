export interface TimelineEntry {
  period: string;
  title: string;
  org?: string;
  detail: string;
  current?: boolean;
}

// Employment history reflects the verified employer record (2026-07-29): Genesis Corp was the
// employer of record February 2022 – June 2023 while on assignment inside the Group Insurance
// technology organization; direct employment ran June 2023 – June 2026. The role has ended —
// no entry here may be marked `current`, and no copy may imply present employment.
export const timeline: TimelineEntry[] = [
  {
    period: '2025 — June 2026',
    title: 'Acting Technical Lead — enterprise Salesforce platform team',
    detail:
      'Carried acting Technical Lead responsibilities: design ownership, code review, mentoring and onboarding junior developers, release ownership, and production support for an enterprise platform. An acting scope, not a formally held title.',
  },
  {
    period: '2024',
    title: 'Promoted to Senior Software Engineer',
    detail:
      'Grew into senior-level ownership across enterprise Salesforce, Java/Spring Boot services, React applications, and AWS deployment — contributing to design decisions, code reviews, and mentoring.',
  },
  {
    period: 'June 2023',
    title: 'Converted to direct employment — Group Insurance Technology',
    detail:
      'Moved from the consulting assignment onto the company payroll in the same organization, continuing on the same platforms and teams.',
  },
  {
    period: 'February 2022 — June 2023',
    title: 'Software Engineer (consultant, Genesis Corp) — Group Insurance Technology',
    detail:
      'Joined the Group Insurance platform teams on assignment through Genesis Corp, the employer of record for this period, building and supporting enterprise Salesforce and full-stack functionality.',
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
      'Project management and design for a fabrication facility — AutoCAD mechanical drawings, cable simulations, specification sheets, and site planning. February 2020 – November 2021.',
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
