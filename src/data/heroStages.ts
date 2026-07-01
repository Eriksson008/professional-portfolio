// The scroll-driven hero narrative — 9 stages, each tied to one cinematic frame.
//
// The frames (public/hero-sequence/*.webp) are decorative background layers only.
// All *real* content is the HTML text below; the frames' baked-in text is reference,
// never read as content. Edit copy here — the component maps over this array.

export type HeroStageKind = 'statement' | 'systems' | 'final';

export interface HeroStage {
  /** Two-digit stage number, e.g. "01". */
  no: string;
  /** Short uppercase label, mirrors the frame's chapter title. */
  label: string;
  /** The real headline for this stage. */
  headline: string;
  /** A word/phrase inside `headline` to accent (red). Optional. */
  accent?: string;
  /** Optional supporting line under the headline. */
  sub?: string;
  /** Frame filename in public/hero-sequence (WebP). */
  frame: string;
  /** Overlay layout for this stage. */
  kind: HeroStageKind;
}

export const heroStages: HeroStage[] = [
  {
    no: '01',
    label: 'The idea',
    headline: 'Ideas become systems.',
    accent: 'systems',
    sub: 'Every enterprise product begins as an ambiguous, high-stakes problem.',
    frame: 'frame-01-the-idea.webp',
    kind: 'statement',
  },
  {
    no: '02',
    label: 'Unlocking potential',
    headline: 'Engineering turns ambiguity into structure.',
    accent: 'structure',
    sub: 'Strategy, architecture, and disciplined execution open the box.',
    frame: 'frame-02-unlocking-potential.webp',
    kind: 'statement',
  },
  {
    no: '03',
    label: 'Building blocks',
    headline: 'Frontend, backend, cloud, data, and AI.',
    accent: 'AI',
    sub: 'The right technologies, chosen deliberately and working together.',
    frame: 'frame-03-building-blocks.webp',
    kind: 'systems',
  },
  {
    no: '04',
    label: 'Connected architecture',
    headline: 'Architecture that connects.',
    accent: 'connects',
    sub: 'Services, data, and interfaces designed as one coherent system.',
    frame: 'frame-04-connected-architecture.webp',
    kind: 'statement',
  },
  {
    no: '05',
    label: 'From design to reality',
    headline: 'From design to production.',
    accent: 'production',
    sub: 'Architecture becomes a system people can actually use.',
    frame: 'frame-05-from-design-to-reality.webp',
    kind: 'statement',
  },
  {
    no: '06',
    label: 'Bringing it to life',
    headline: 'Interfaces that deliver impact.',
    accent: 'impact',
    sub: 'Polished, reliable products — not just working software.',
    frame: 'frame-06-bringing-it-to-life.webp',
    kind: 'statement',
  },
  {
    no: '07',
    label: 'Built for scale',
    headline: 'Built for scale and reliability.',
    accent: 'reliability',
    sub: 'Auto-scaling, high availability, and security under enterprise standards.',
    frame: 'frame-07-built-for-scale.webp',
    kind: 'statement',
  },
  {
    no: '08',
    label: 'Engineered for impact',
    headline: 'Enterprise-grade products with real impact.',
    accent: 'real impact',
    sub: 'Systems that hold up in production and serve real users.',
    frame: 'frame-08-engineered-for-impact.webp',
    kind: 'statement',
  },
  {
    no: '09',
    label: 'Solutions that drive impact',
    headline: 'Fredrik Eriksson',
    sub: 'Senior Software Engineer building AI-enabled enterprise systems, cloud platforms, and polished digital products.',
    frame: 'frame-09-final-impact.webp',
    kind: 'final',
  },
];

/** The four-word identity strip shown on the final stage. */
export const heroRoles = ['Engineer', 'Architect', 'Leader', 'Problem Solver'];
