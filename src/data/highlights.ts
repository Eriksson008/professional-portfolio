export interface Highlight {
  value: string;
  label: string;
  note: string;
}

// Every figure here is git-verifiable or directly documented — defensible under questioning.
export const highlights: Highlight[] = [
  {
    value: '750+',
    label: 'Commits authored',
    note: 'Across 6 production repositories, all as a single verified commit identity.',
  },
  {
    value: '120+',
    label: 'Jira stories delivered',
    note: 'Distinct stories traced commit-to-ticket across full-stack, Salesforce, and Java work.',
  },
  {
    value: '#1',
    label: 'Contributor on core systems',
    note: 'Top individual contributor on two production codebases by commit count.',
  },
  {
    value: '~16K',
    label: 'Lines on a greenfield platform',
    note: 'Three integrated microservices delivered in under five weeks.',
  },
  {
    value: '3 yrs',
    label: 'Exceptional Impact rating',
    note: 'Employer’s highest performance rating, three consecutive years (2023–2025).',
  },
  {
    value: '6 repos',
    label: 'AI-assisted delivery',
    note: 'Standardized agent-driven review, docs, and smart-commit traceability across repos.',
  },
];
