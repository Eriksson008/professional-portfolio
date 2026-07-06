export interface SkillGroup {
  name: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    name: 'AI / LLM Systems',
    items: [
      'LLM application development',
      'Tool calling / RAG',
      'Multi-agent workflows',
      'Codex / Claude Code',
      'Spring AI',
      'AWS Bedrock',
      'AI-assisted delivery',
    ],
  },
  {
    name: 'Cloud, DevOps & Security',
    items: [
      'AWS ECS / Fargate',
      'CloudFormation',
      'Secrets Manager / SSM',
      'Application Load Balancer',
      'Docker',
      'Jenkins',
      'GitHub Actions',
      'CI/CD',
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
    name: 'Salesforce & Enterprise Platforms',
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
    name: 'Frontend',
    items: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Lightning Web Components', 'Vite'],
  },
  {
    name: 'Backend & Data',
    items: [
      'Java 21',
      'Spring Boot 3',
      'Node / Express',
      'REST APIs',
      'Microservices',
      'Integrations',
      'SQL',
      'PostgreSQL / Aurora',
      'DynamoDB',
      'Database Migrations',
      'Elasticsearch / ELK',
    ],
  },
  {
    name: 'Delivery & Leadership',
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
