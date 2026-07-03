// Shooting stars as construction agents: a few deliberate, hand-authored
// curved trails that sketch across the hero during the formation overture,
// then one long-period trail that recurs sparsely so the sky stays alive.
//
// Each trail is three stacked strokes on the same Bezier path — a wide violet
// glow tail, a crisp silver-violet line, and a short icy head — all driven by
// the same stroke-dashoffset sweep (pathLength="1" keeps the math unitless,
// and per-layer offsets in CSS keep the leading edges aligned). Pure SVG+CSS:
// no library, perfectly synced head and tail, nothing to run under
// reduced motion (the field is only mounted in interactive mode and hidden on
// mobile).

interface Trail {
  /** Cubic Bezier in the 1440x810 stage space (slice-cropped, uniform scale). */
  d: string;
  variant: 'a' | 'b' | 'c' | 'loop';
}

const TRAILS: Trail[] = [
  { d: 'M -80 150 C 320 40, 720 120, 1120 320', variant: 'a' },
  { d: 'M 1520 80 C 1180 150, 880 160, 560 300', variant: 'b' },
  { d: 'M -60 520 C 240 470, 520 490, 820 640', variant: 'c' },
  { d: 'M -100 260 C 400 110, 950 150, 1540 340', variant: 'loop' },
];

export function ShootingStarField() {
  return (
    <svg
      className="c-trails"
      viewBox="0 0 1440 810"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {TRAILS.map((t) => (
        <g key={t.variant} className={`c-trail c-trail--${t.variant}`}>
          <path className="c-trail__glow" d={t.d} pathLength={1} />
          <path className="c-trail__line" d={t.d} pathLength={1} />
          <path className="c-trail__head" d={t.d} pathLength={1} />
        </g>
      ))}
    </svg>
  );
}
