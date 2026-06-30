export interface SkillGroup {
  name: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    name: 'Salesforce',
    items: [
      'Apex',
      'Apex Triggers',
      'Test Classes',
      'SOQL',
      'Salesforce Data Model',
      'LWC',
      'OmniStudio',
      'OmniScripts',
      'FlexCards',
      'Batch Apex',
      'Queueable Apex',
      'Copado',
    ],
  },
  {
    name: 'Backend',
    items: [
      'Java 21',
      'Spring Boot 3',
      'Spring AI',
      'Node / Express',
      'REST APIs',
      'Microservices',
      'Integrations',
      'SQL',
    ],
  },
  {
    name: 'Frontend',
    items: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Lightning Web Components', 'Vite'],
  },
  {
    name: 'Cloud & DevOps',
    items: [
      'AWS ECS / Fargate',
      'CloudFormation',
      'Secrets Manager / SSM',
      'Application Load Balancer',
      'Docker',
      'AWS Bedrock',
      'Jenkins',
      'GitHub Actions',
      'CI/CD',
    ],
  },
  {
    name: 'Security',
    items: [
      'OAuth2 / OIDC',
      'Azure AD',
      'JWT / RS256',
      'Passwordless / OTP',
      'CIAM',
      'DAST / pen-test',
      'IDOR / CORS / path-traversal',
    ],
  },
  {
    name: 'Data',
    items: [
      'PostgreSQL / Aurora',
      'DynamoDB',
      'Database Migrations',
      'SOQL',
      'Elasticsearch / ELK',
    ],
  },
  {
    name: 'AI Engineering',
    items: [
      'LLM application development',
      'Tool calling / RAG',
      'Multi-agent workflows',
      'Spring AI',
      'AI-assisted delivery',
    ],
  },
  {
    name: 'Ways of Working',
    items: [
      'Git',
      'Jira',
      'Agile / Scrum',
      'Code Reviews',
      'Production Support',
      'Release Management',
      'Mentoring',
    ],
  },
];
