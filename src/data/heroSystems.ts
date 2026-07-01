// Overlay "system cards" for the hero — the professional areas that rise out of the
// vault during the building-blocks / connected-architecture stages. Real, public-safe
// skills content (kept in sync with src/data/skills.ts). Edit here; the component maps it.

export interface HeroSystem {
  /** Area name, e.g. "Frontend". */
  area: string;
  /** Concrete tools/technologies in this area. */
  tools: string[];
}

export const heroSystems: HeroSystem[] = [
  { area: 'Frontend', tools: ['React', 'TypeScript', 'Next.js'] },
  { area: 'Backend', tools: ['Java', 'Spring Boot', 'Spring AI'] },
  { area: 'Cloud', tools: ['AWS ECS', 'ALB', 'Bedrock', 'S3', 'Aurora'] },
  { area: 'Enterprise', tools: ['Salesforce', 'Apex', 'LWC', 'Copado'] },
  { area: 'DevOps', tools: ['Jenkins', 'GitHub Actions', 'Docker'] },
  { area: 'Leadership', tools: ['Tech Lead', 'Mentorship', 'Delivery', 'Prod Support'] },
];
