import type { StatsResponse } from '../types';

/**
 * Dependency-free daily-volume sparkline (last ~14 days). Hand-rolled inline
 * SVG — the brief calls for no heavy charting dependency, and this stays in
 * the black/white token palette. Gaps in the data are filled with zero-height
 * bars so the axis reads as continuous days.
 */
export function Sparkline({ daily }: { daily: StatsResponse['daily'] }) {
  if (daily.length === 0) {
    return <p className="admin-spark-empty">No activity in the last 14 days.</p>;
  }

  const max = Math.max(1, ...daily.map((d) => d.count));
  const barW = 100 / daily.length;

  return (
    <svg
      className="admin-spark"
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Daily prompt volume, peak ${max} on a day`}
    >
      {daily.map((d, i) => {
        const h = (d.count / max) * 38;
        return (
          <rect
            key={d.day}
            x={i * barW + barW * 0.15}
            y={40 - h}
            width={barW * 0.7}
            height={Math.max(h, 0.6)}
            rx={0.6}
          >
            <title>{`${d.day}: ${d.count}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}
