import type { LogQuery, LogsResponse, MeResponse, StatsResponse } from './types';
import { AdminApiError } from './authErrors';
import { getDateRangeForFilter, startOfLocalDayIso } from './dateRanges';

export { AdminApiError };

/**
 * Admin API base. In production the Ask-Fredrik Worker serves this dashboard
 * itself, so the API is same-origin ('' → relative URLs) and the browser sends
 * the Cloudflare Access session cookie automatically — no token, no secret,
 * nothing stored by this app. For local dev (Vite on :8790, `wrangler dev` on
 * :8787) set VITE_ASK_FREDRIK_ADMIN_URL, or let it derive from the public
 * VITE_ASK_FREDRIK_API_URL origin.
 */
function resolveAdminBase(): string {
  const override = import.meta.env.VITE_ASK_FREDRIK_ADMIN_URL as string | undefined;
  if (override) return override.replace(/\/+$/, '');
  const askUrl = import.meta.env.VITE_ASK_FREDRIK_API_URL as string | undefined;
  if (askUrl) {
    try {
      return new URL(askUrl).origin;
    } catch {
      /* fall through to same-origin */
    }
  }
  return '';
}

export const ADMIN_BASE = resolveAdminBase();

/** Page size for the recent-prompts table (also the Worker's max limit). */
export const PAGE_SIZE = 50;

async function adminFetch<T>(path: string, params?: URLSearchParams): Promise<T> {
  const qs = params?.toString() ?? '';
  const url = `${ADMIN_BASE}${path}${qs ? `?${qs}` : ''}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    // In production an expired Access session surfaces here: the fetch is
    // redirected to the Access login page cross-origin and dies as a network
    // error. A page reload runs the interactive login again.
    throw new AdminApiError(
      'Could not reach the admin API. If your session expired, reload to sign in again.',
      0
    );
  }
  if (res.status === 401) throw new AdminApiError('Not signed in.', 401);
  if (res.status === 403) throw new AdminApiError('This account is not authorized.', 403);
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
  try {
    return (await res.json()) as T;
  } catch {
    throw new AdminApiError(
      'The admin API did not return JSON — for local dev, point VITE_ASK_FREDRIK_ADMIN_URL at the Worker (see docs/ask-fredrik-dashboard.md).',
      0
    );
  }
}

/** GET /admin/me — the safe identity payload the dashboard boots from. */
export function fetchMe(): Promise<MeResponse> {
  return adminFetch<MeResponse>('/admin/me');
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

export function fetchStats(): Promise<StatsResponse> {
  return adminFetch<StatsResponse>('/admin/stats', buildStatsParams());
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

export function fetchLogs(query: LogQuery): Promise<LogsResponse> {
  return adminFetch<LogsResponse>('/admin/logs', buildLogParams(query));
}

/**
 * Fetch every row matching the current filter (ignoring pagination) for CSV
 * export, walking pages until the server's `total` is covered. Capped so a
 * runaway can't loop forever — the log table is FIFO-capped at ~1000 rows.
 */
export async function fetchAllLogs(query: LogQuery) {
  const rows = [] as LogsResponse['logs'];
  let page = 0;
  let total = Infinity;
  while (rows.length < total && page < 40) {
    const res = await fetchLogs({ ...query, page });
    total = res.total;
    rows.push(...res.logs);
    if (res.logs.length < PAGE_SIZE) break;
    page += 1;
  }
  return rows;
}
