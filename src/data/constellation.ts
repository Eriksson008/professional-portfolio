// src/data/constellation.ts
//
// Single source of truth for the "Constellation of Impact" hero.
// All hero content + geometry lives here; ConstellationHero.tsx only maps over it.
// Every metric is git-verifiable or directly documented (see highlights.ts / profile.ts).
// Positions are normalized 0..1 within the stage field; the component maps them to %.

export type NodeId = string;

export interface Pt {
  x: number;
  y: number;
}

export interface MetricNode {
  id: NodeId;
  value: string;
  label: string;
  /** Scroll-progress threshold (0..1) at which this node reveals and then stays. */
  revealAt: number;
}

export interface ProjectNode {
  id: NodeId;
  title: string;
  tags: string[];
  revealAt: number;
}

export interface SkillCluster {
  id: NodeId;
  name: string;
  items: string[];
  revealAt: number;
}

export interface CareerNode {
  id: NodeId;
  period: string;
  title: string;
  revealAt: number;
}

export interface Connection {
  from: NodeId;
  to: NodeId;
  revealAt: number;
}

export interface Star {
  x: number;
  y: number;
  r: number;
}

/** Fade-in window (in progress units) for nodes and edges. */
export const FADE = 0.05;
/** How long a node/edge stays "active" (red) after it reveals. */
export const FOCUS = 0.1;
/** Progress at which the final identity/CTA resolves. */
export const CTA_AT = 0.88;

// Phase bands: metrics 0.14–0.27 · projects 0.31–0.46 · skills 0.50–0.65 · career 0.70–0.82.

export const metricNodes: MetricNode[] = [
  { id: 'm-impact', value: '3 yrs', label: 'Exceptional Impact', revealAt: 0.14 },
  { id: 'm-commits', value: '750+', label: 'Commits authored', revealAt: 0.17 },
  { id: 'm-jira', value: '120+', label: 'Jira stories delivered', revealAt: 0.2 },
  { id: 'm-repos', value: '6', label: 'Production repositories', revealAt: 0.23 },
  { id: 'm-top', value: '#1', label: 'Contributor on core systems', revealAt: 0.25 },
  { id: 'm-green', value: '~16K', label: 'Lines · greenfield · <5 wks', revealAt: 0.27 },
];

export const projectNodes: ProjectNode[] = [
  {
    id: 'p-onboard',
    title: 'Secure Onboarding Portal',
    tags: ['Java 21', 'React', 'Aurora'],
    revealAt: 0.31,
  },
  { id: 'p-ai', title: 'AI Client-Assist', tags: ['Spring AI', 'Bedrock', 'ECS'], revealAt: 0.34 },
  {
    id: 'p-sf',
    title: 'Enterprise Salesforce Platform',
    tags: ['Apex', 'LWC', 'Copado'],
    revealAt: 0.37,
  },
  { id: 'p-homebase', title: 'Homebase', tags: ['Docker', 'AES-256-GCM', 'SQLite'], revealAt: 0.4 },
  {
    id: 'p-afr',
    title: "AFR — Members' Hub",
    tags: ['Next.js', 'TypeScript', 'Tailwind'],
    revealAt: 0.42,
  },
  { id: 'p-portfolio', title: 'This Portfolio', tags: ['Vite', 'React', 'nginx'], revealAt: 0.44 },
  {
    id: 'p-lab',
    title: 'Self-Hosting / Tailscale Lab',
    tags: ['Docker', 'Tailscale', 'Linux'],
    revealAt: 0.46,
  },
];

export const skillClusters: SkillCluster[] = [
  { id: 's-frontend', name: 'Frontend', items: ['React', 'TypeScript', 'Next.js'], revealAt: 0.5 },
  { id: 's-backend', name: 'Backend', items: ['Java', 'Spring Boot', 'Spring AI'], revealAt: 0.53 },
  { id: 's-cloud', name: 'Cloud', items: ['AWS ECS', 'ALB', 'Bedrock', 'Aurora'], revealAt: 0.56 },
  {
    id: 's-enterprise',
    name: 'Enterprise',
    items: ['Salesforce', 'Apex', 'LWC', 'Copado'],
    revealAt: 0.59,
  },
  {
    id: 's-devops',
    name: 'DevOps',
    items: ['Jenkins', 'GitHub Actions', 'Docker'],
    revealAt: 0.62,
  },
  {
    id: 's-leadership',
    name: 'Leadership',
    items: ['Tech Lead', 'Mentorship', 'Delivery'],
    revealAt: 0.65,
  },
];

export const careerNodes: CareerNode[] = [
  { id: 'c-2022', period: '2022', title: 'Associate Software Engineer', revealAt: 0.7 },
  { id: 'c-2024', period: '2024', title: 'Senior Software Engineer', revealAt: 0.74 },
  { id: 'c-2025', period: '2025', title: 'Acting Tech Lead', revealAt: 0.78 },
  { id: 'c-ai', period: 'Now', title: 'Enterprise AI / cloud systems', revealAt: 0.82 },
];

// Normalized positions. Center band (y ~0.46–0.56) is kept clear for the identity/CTA.
export const layout: Record<NodeId, Pt> = {
  // metrics — top band
  'm-impact': { x: 0.16, y: 0.12 },
  'm-commits': { x: 0.38, y: 0.09 },
  'm-jira': { x: 0.62, y: 0.11 },
  'm-repos': { x: 0.84, y: 0.14 },
  'm-top': { x: 0.26, y: 0.24 },
  'm-green': { x: 0.74, y: 0.24 },
  // projects — upper-mid band
  'p-onboard': { x: 0.5, y: 0.31 },
  'p-ai': { x: 0.3, y: 0.36 },
  'p-sf': { x: 0.7, y: 0.36 },
  'p-homebase': { x: 0.14, y: 0.42 },
  'p-afr': { x: 0.86, y: 0.42 },
  'p-portfolio': { x: 0.38, y: 0.45 },
  'p-lab': { x: 0.62, y: 0.45 },
  // skills — lower-mid band
  's-devops': { x: 0.5, y: 0.58 },
  's-backend': { x: 0.3, y: 0.6 },
  's-cloud': { x: 0.7, y: 0.6 },
  's-frontend': { x: 0.14, y: 0.64 },
  's-enterprise': { x: 0.86, y: 0.64 },
  's-leadership': { x: 0.46, y: 0.66 },
  // career — bottom band, left→right progression
  'c-2022': { x: 0.18, y: 0.84 },
  'c-2024': { x: 0.4, y: 0.86 },
  'c-2025': { x: 0.62, y: 0.84 },
  'c-ai': { x: 0.84, y: 0.86 },
};

export const connections: Connection[] = [
  // metrics → projects
  { from: 'm-commits', to: 'p-ai', revealAt: 0.34 },
  { from: 'm-commits', to: 'p-sf', revealAt: 0.37 },
  { from: 'm-top', to: 'p-sf', revealAt: 0.38 },
  { from: 'm-green', to: 'p-onboard', revealAt: 0.32 },
  { from: 'm-repos', to: 'p-portfolio', revealAt: 0.44 },
  { from: 'm-impact', to: 'p-homebase', revealAt: 0.4 },
  // projects → skills
  { from: 'p-ai', to: 's-frontend', revealAt: 0.5 },
  { from: 'p-ai', to: 's-backend', revealAt: 0.53 },
  { from: 'p-ai', to: 's-cloud', revealAt: 0.56 },
  { from: 'p-sf', to: 's-enterprise', revealAt: 0.59 },
  { from: 'p-onboard', to: 's-backend', revealAt: 0.53 },
  { from: 'p-onboard', to: 's-cloud', revealAt: 0.56 },
  { from: 'p-homebase', to: 's-devops', revealAt: 0.62 },
  { from: 'p-afr', to: 's-frontend', revealAt: 0.5 },
  { from: 'p-lab', to: 's-devops', revealAt: 0.62 },
  // skills → career
  { from: 's-enterprise', to: 'c-2025', revealAt: 0.78 },
  { from: 's-leadership', to: 'c-2025', revealAt: 0.78 },
  { from: 's-backend', to: 'c-2024', revealAt: 0.74 },
  { from: 's-cloud', to: 'c-ai', revealAt: 0.82 },
  { from: 's-frontend', to: 'c-2022', revealAt: 0.7 },
  // career spine
  { from: 'c-2022', to: 'c-2024', revealAt: 0.74 },
  { from: 'c-2024', to: 'c-2025', revealAt: 0.78 },
  { from: 'c-2025', to: 'c-ai', revealAt: 0.82 },
];

// Deterministic starfield (seeded LCG) so it never shifts between renders.
function seededStars(count: number, seed: number): Star[] {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const out: Star[] = [];
  for (let i = 0; i < count; i += 1) {
    // Small radii: the field SVG stretches with preserveAspectRatio="none", so
    // keep these tiny or they render as large ellipses on wide viewports.
    out.push({ x: rand(), y: rand(), r: 0.1 + rand() * 0.24 });
  }
  return out;
}

export const starfield: Star[] = seededStars(52, 20260701);
