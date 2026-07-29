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
    value: '7',
    label: 'Engineers led',
    note: 'Across two teams as acting Technical Lead, mentoring 3 of them through code review.',
  },
  {
    value: '3 yrs',
    label: 'Exceptional Impact rating',
    note: 'Employer’s highest performance rating, three consecutive years (2023–2025).',
  },
  {
    value: '63%',
    label: 'Of an AI assistant’s commits',
    note: 'Top contributor (137 of 217 commits) on a production assistant built with Spring AI on Amazon Bedrock.',
  },
];
