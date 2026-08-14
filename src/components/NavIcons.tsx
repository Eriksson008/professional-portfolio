/* ============================================================
   Navigation glyphs — one hand-drawn family, no icon dependency.
   Every glyph is a 24×24 outline on the same grid: 1.6 stroke,
   round caps and joins, no fills, currentColor. That keeps the
   optical weight identical across the dock (a stroked house and
   a stroked envelope read as the same object at 22px) without
   adding a package for seven paths.
   ============================================================ */

const svg = {
  viewBox: '0 0 24 24',
  width: 22,
  height: 22,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

/** Home — back to the opening frame. */
export function HomeIcon() {
  return (
    <svg {...svg}>
      <path d="M4 10.6 12 4l8 6.6V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

/** Impact — a telemetry pulse. */
export function ImpactIcon() {
  return (
    <svg {...svg}>
      <path d="M3 12h3.6l2.4-6.6 4 13.2 2.4-6.6H21" />
    </svg>
  );
}

/** Projects — modules on a grid. */
export function ProjectsIcon() {
  return (
    <svg {...svg}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </svg>
  );
}

/** Skills — angle brackets. */
export function SkillsIcon() {
  return (
    <svg {...svg}>
      <path d="M9 6.5 4 12l5 5.5" />
      <path d="m15 6.5 5 5.5-5 5.5" />
    </svg>
  );
}

/** Career — the trajectory, as a briefcase. */
export function CareerIcon() {
  return (
    <svg {...svg}>
      <rect x="2.8" y="7" width="18.4" height="13" rx="2.4" />
      <path d="M8.6 7V5.6a2 2 0 0 1 2-2h2.8a2 2 0 0 1 2 2V7" />
    </svg>
  );
}

/** Contact — the closing scene. */
export function ContactIcon() {
  return (
    <svg {...svg}>
      <rect x="2.8" y="5" width="18.4" height="14" rx="2.4" />
      <path d="m3.8 7.4 7 4.9a2.1 2.1 0 0 0 2.4 0l7-4.9" />
    </svg>
  );
}

/** Ask Fredrik — a two-star spark, the one "assistant" mark on the page. */
export function AskIcon() {
  return (
    <svg {...svg}>
      <path d="m11 3.6 1.7 4.4 4.4 1.7-4.4 1.7L11 15.8l-1.7-4.4L4.9 9.7l4.4-1.7z" />
      <path d="m17.8 15.2.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z" />
    </svg>
  );
}
