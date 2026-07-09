import type { LogQuery, RangeKey } from './types';

/** Milliseconds in a day. */
const DAY_MS = 86_400_000;

/**
 * Resolved query bounds. `from`/`to` are inclusive UTC ISO instants; an absent
 * side is unbounded. An empty object means "all time".
 *
 * Timezone model (important): the log's `created_at` is stored and queried in
 * **UTC**, and that never changes. User-facing calendar ranges ("today", a
 * custom day) are anchored to the **viewer's local timezone** — the same one
 * the table renders timestamps in (`formatDashboardDate` → `toLocaleString`) —
 * and then serialized to UTC here. That keeps the filter boundaries aligned
 * with the dates the admin actually sees, instead of shifting by the UTC
 * offset. Rolling windows (7d / 30d) are timezone-independent by construction.
 */
export interface ResolvedRange {
  from?: string;
  to?: string;
}

/** Start of the local calendar day containing `ms`, as a UTC ISO string. */
export function startOfLocalDayIso(ms: number = Date.now()): string {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** A `YYYY-MM-DD` calendar day → UTC ISO for its first local instant
 *  (00:00:00.000 local). Undefined if the input isn't a valid date.
 *  The `T00:00:00` suffix (no trailing `Z`) forces local-time parsing. */
function localDayStartIso(day: string): string | undefined {
  const d = new Date(`${day}T00:00:00.000`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** A `YYYY-MM-DD` calendar day → UTC ISO for its last local instant
 *  (23:59:59.999 local), so a "to = day" bound includes that whole local day. */
function localDayEndIso(day: string): string | undefined {
  const d = new Date(`${day}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/**
 * Tidy a pair of `YYYY-MM-DD` custom inputs: trim blanks and, if both are set
 * but inverted (from is after to), swap them so the range is always valid.
 * Lexical comparison is correct for zero-padded ISO date strings.
 */
export function normalizeDateRange(
  rawFrom: string,
  rawTo: string
): { from: string; to: string } {
  const from = rawFrom.trim();
  const to = rawTo.trim();
  if (from && to && from > to) return { from: to, to: from };
  return { from, to };
}

function resolveCustomRange(rawFrom: string, rawTo: string): ResolvedRange {
  const { from, to } = normalizeDateRange(rawFrom, rawTo);
  const out: ResolvedRange = {};
  if (from) {
    const iso = localDayStartIso(from);
    if (iso) out.from = iso;
  }
  if (to) {
    const iso = localDayEndIso(to);
    if (iso) out.to = iso;
  }
  return out;
}

/**
 * Resolve a named range (or the custom date inputs) into UTC ISO `from`/`to`
 * bounds for the /admin/logs query. `now` is injectable for testing.
 *
 * - `today`  → from local midnight today (no upper bound).
 * - `7d`/`30d` → rolling window, exactly N×24h back from now.
 * - `custom` → the picked local calendar day(s), `to` inclusive of the whole day.
 * - `all`    → no bounds.
 */
export function getDateRangeForFilter(
  query: Pick<LogQuery, 'range' | 'customFrom' | 'customTo'>,
  now: number = Date.now()
): ResolvedRange {
  switch (query.range) {
    case 'today':
      return { from: startOfLocalDayIso(now) };
    case '7d':
      return { from: new Date(now - 7 * DAY_MS).toISOString() };
    case '30d':
      return { from: new Date(now - 30 * DAY_MS).toISOString() };
    case 'custom':
      return resolveCustomRange(query.customFrom, query.customTo);
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

/**
 * Compact, locale-stable timestamp for the table. Rendered in the viewer's
 * local timezone (matching the local-day range boundaries above); the raw UTC
 * ISO is surfaced via the cell's `title` for unambiguous reference.
 */
export function formatDashboardDate(iso: string): string {
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
