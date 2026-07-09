import type { LogQuery, LogsResponse, StatsResponse } from './types';
import { getDateRangeForFilter, startOfLocalDayIso } from './dateRanges';

/**
 * Admin API base — the Ask-Fredrik Worker origin. Derived from the public
 * VITE_ASK_FREDRIK_API_URL (.../ask) so no extra config is needed, but an
 * explicit VITE_ASK_FREDRIK_ADMIN_URL overrides it. No secret is ever baked in
 * — the admin token is entered at runtime and lives only in this browser tab.
 */
function resolveAdminBase(): string | null {
  const override = import.meta.env.VITE_ASK_FREDRIK_ADMIN_URL as string | undefined;
  if (override) return override.replace(/\/+$/, '');
  const askUrl = import.meta.env.VITE_ASK_FREDRIK_API_URL as string | undefined;
  if (!askUrl) return null;
  try {
    return new URL(askUrl).origin;
  } catch {
    return null;
  }
}

export const ADMIN_BASE = resolveAdminBase();

/** Page size for the recent-prompts table (also the Worker's max limit). */
export const PAGE_SIZE = 50;

/** Thrown for a failed admin request; `status` lets the UI special-case 401. */
export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

async function adminFetch<T>(path: string, params: URLSearchParams, token: string): Promise<T> {
  if (!ADMIN_BASE) {
    throw new AdminApiError('Admin API URL is not configured for this build.', 0);
  }
  const qs = params.toString();
  const url = `${ADMIN_BASE}${path}${qs ? `?${qs}` : ''}`;
  let res: Response;
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new AdminApiError('Network error reaching the admin API.', 0);
  }
  if (res.status === 401) throw new AdminApiError('Invalid or expired admin token.', 401);
  if (!res.ok) {
    let detail = `Request failed (${res.status}).`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) detail = body.error;
    } catch {
      /* non-JSON error body — keep the generic message */
    }
    throw new AdminApiError(detail, res.status);
  }
  return (await res.json()) as T;
}

/**
 * Anchor the stats "Today" count to the viewer's local calendar day so the
 * summary card matches the "Today" table filter (both local-day; storage stays
 * UTC). Older Workers that predate this param simply ignore it and fall back to
 * their UTC-day count — backward-compatible either way.
 */
export function buildStatsParams(now: number = Date.now()): URLSearchParams {
  const params = new URLSearchParams();
  params.set('today', startOfLocalDayIso(now));
  return params;
}

export function fetchStats(token: string): Promise<StatsResponse> {
  return adminFetch<StatsResponse>('/admin/stats', buildStatsParams(), token);
}

/** Build the /admin/logs query params from the current filter state. */
export function buildLogParams(query: LogQuery): URLSearchParams {
  const params = new URLSearchParams();
  const { from, to } = getDateRangeForFilter(query);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (query.source) params.set('source', query.source);
  if (query.intent) params.set('intent', query.intent);
  if (query.q.trim()) params.set('q', query.q.trim());
  params.set('limit', String(PAGE_SIZE));
  params.set('offset', String(query.page * PAGE_SIZE));
  return params;
}

export function fetchLogs(query: LogQuery, token: string): Promise<LogsResponse> {
  return adminFetch<LogsResponse>('/admin/logs', buildLogParams(query), token);
}

/**
 * Fetch every row matching the current filter (ignoring pagination) for CSV
 * export, walking pages until the server's `total` is covered. Capped so a
 * runaway can't loop forever — the log table is FIFO-capped at ~1000 rows.
 */
export async function fetchAllLogs(query: LogQuery, token: string) {
  const rows = [] as LogsResponse['logs'];
  let page = 0;
  let total = Infinity;
  while (rows.length < total && page < 40) {
    const res = await fetchLogs({ ...query, page }, token);
    total = res.total;
    rows.push(...res.logs);
    if (res.logs.length < PAGE_SIZE) break;
    page += 1;
  }
  return rows;
}
