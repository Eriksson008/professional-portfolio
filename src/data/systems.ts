/**
 * One real production data flow, stage by stage.
 *
 * Every stage below is taken from the `ai-client-assist` entry in `projects.ts`
 * and says only what that entry already says. This is deliberately *not* a
 * generic "architecture diagram" of boxes labelled Service A and Service B —
 * a topology that does not correspond to something actually built is decoration
 * that claims to be evidence.
 *
 * The flow is a retrieval-augmented pipeline: records leave the CRM, land in a
 * search index, and a model answers over what was retrieved rather than over
 * what it remembers. That last point is the reason the shape matters, so it is
 * what the section is built to show.
 */
export interface SystemStage {
  /** Short label — the node itself. */
  name: string;
  /** The technology, kept separate so the diagram reads at a glance. */
  tech: string;
  /** What this stage does, in one line. */
  role: string;
}

export const clientAssistFlow: SystemStage[] = [
  {
    name: 'System of record',
    tech: 'Salesforce',
    role: 'Client and policy records live in the enterprise CRM.',
  },
  {
    name: 'Extraction',
    tech: 'Logstash',
    role: 'Pipelines stream those records continuously out of the platform.',
  },
  {
    name: 'Index',
    tech: 'Elasticsearch',
    role: 'The data becomes queryable outside the CRM — and without consuming a read-only licence.',
  },
  {
    name: 'Retrieval',
    tech: 'Spring AI · Spring Boot',
    role: 'A question is resolved against the indices before any model is called.',
  },
  {
    name: 'Reasoning',
    tech: 'Claude Sonnet 4.5 · Amazon Bedrock',
    role: 'The model reasons over the retrieved records, so answers stay grounded in indexed data rather than model recall.',
  },
  {
    name: 'Interface',
    tech: 'React',
    role: 'Business users ask in natural language and get an answer with its basis.',
  },
];

/**
 * What the flow runs on. Separated from the stages because it is the same
 * across all of them — drawing it as another node in the chain would imply it
 * sits between two steps, which it does not.
 */
export const clientAssistPlatform: SystemStage[] = [
  {
    name: 'Runtime',
    tech: 'AWS ECS / Fargate',
    role: 'Containerised services behind an Application Load Balancer.',
  },
  {
    name: 'Identity',
    tech: 'ALB OIDC · Azure AD',
    role: 'Authentication terminates at the edge, before the application.',
  },
  {
    name: 'Delivery',
    tech: 'Jenkins CI/CD',
    role: 'Every change ships through the same pipeline.',
  },
  {
    name: 'Observability',
    tech: 'Kibana',
    role: 'Operational visibility across environments.',
  },
];
