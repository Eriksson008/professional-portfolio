/**
 * Shared types for the Ask-Fredrik admin dashboard. These mirror the Worker's
 * /admin/logs and /admin/stats response shapes (cloudflare/ask-fredrik-worker).
 */

/** The five answer sources the Worker pipeline records. */
export type AskSource = 'ai' | 'static' | 'fallback' | 'blocked' | 'rate_limited';

/** One row of the ask_fredrik_logs D1 table, as returned by /admin/logs. */
export interface LogRecord {
  id: string;
  created_at: string;
  question: string;
  answer: string | null;
  source: AskSource | null;
  matched_intent: string | null;
  session_id: string | null;
  page: string | null;
  referrer: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  model: string | null;
  latency_ms: number | null;
}

/** GET /admin/logs response. `total` is the count matching the current filter
 *  (for pagination); `logs` is the current page. */
export interface LogsResponse {
  count: number;
  total: number;
  limit: number;
  offset: number;
  logs: LogRecord[];
}

/** GET /admin/stats response — aggregate overview metrics. */
export interface StatsResponse {
  total: number;
  today: number;
  last7d: number;
  last30d: number;
  bySource: Partial<Record<AskSource | 'unknown', number>>;
  blocked: number;
  fallback: number;
  topIntents: Array<{ intent: string; count: number }>;
  daily: Array<{ day: string; count: number }>;
}

/** Named time ranges for the selector; `custom` uses the from/to date inputs. */
export type RangeKey = 'today' | '7d' | '30d' | 'all' | 'custom';

/** Filter state driving the logs query. */
export interface LogQuery {
  range: RangeKey;
  /** ISO bounds (only used when range === 'custom'). */
  customFrom: string;
  customTo: string;
  source: AskSource | '';
  intent: string;
  q: string;
  page: number;
}
