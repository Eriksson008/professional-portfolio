import type { LogQuery, RangeKey } from './types';

/** Milliseconds in a day. */
const DAY_MS = 86_400_000;

/**
 * Resolve a named range (or the custom date inputs) into ISO `from`/`to`
 * bounds for the /admin/logs query. `to` is pushed to end-of-day so a custom
 * "to = 2026-07-07" is inclusive of that whole day. `all` returns no bounds.
 */
export function resolveRange(query: Pick<LogQuery, 'range' | 'customFrom' | 'customTo'>): {
  from?: string;
  to?: string;
} {
  const now = Date.now();
  switch (query.range) {
    case 'today': {
      const start = new Date(now);
      start.setUTCHours(0, 0, 0, 0);
      return { from: start.toISOString() };
    }
    case '7d':
      return { from: new Date(now - 7 * DAY_MS).toISOString() };
    case '30d':
      return { from: new Date(now - 30 * DAY_MS).toISOString() };
    case 'custom': {
      const out: { from?: string; to?: string } = {};
      if (query.customFrom) out.from = new Date(`${query.customFrom}T00:00:00.000Z`).toISOString();
      if (query.customTo) out.to = new Date(`${query.customTo}T23:59:59.999Z`).toISOString();
      return out;
    }
    case 'all':
    default:
      return {};
  }
}

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  all: 'All time',
  custom: 'Custom',
};

/** Compact, locale-stable timestamp for the table (UTC, no seconds noise). */
export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
