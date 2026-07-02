import { m } from 'framer-motion';
import { cardRise, ringPulse } from './motion';
import type { Highlight } from '../data/highlights';

/** A highlight figure as a constellation node: dot + one-shot reveal ring. */
export function MetricNode({ value, label, note }: Highlight) {
  return (
    <m.li className="metric" variants={cardRise}>
      <span className="mn-dot" aria-hidden="true">
        <m.span className="mn-ring" variants={ringPulse} />
      </span>
      <p className="metric-value">{value}</p>
      <p className="metric-label">{label}</p>
      <p className="metric-note">{note}</p>
    </m.li>
  );
}
