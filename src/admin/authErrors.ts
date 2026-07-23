/**
 * Admin API error type + the pure mapping from a failed request to the
 * dashboard's auth phase. Kept free of import.meta/Vite dependencies so
 * `node --test` can exercise it directly (unlike api.ts, whose module scope
 * reads build-time env).
 */

/** Thrown for a failed admin request; `status` lets the UI map auth states
 *  (401 unauthorized / 403 forbidden). Status 0 = network / non-JSON. */
export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

export type AuthFailure =
  | { phase: 'unauthorized' }
  | { phase: 'forbidden' }
  | { phase: 'error'; message: string };

/**
 * Classify a failed admin call: 401 → the Access session is missing/expired
 * (sign-in screen), 403 → signed in but not allowlisted, anything else →
 * unexpected error with a human message. Network failures (status 0) land in
 * 'error' — in production they usually mean the fetch died on the Access
 * login redirect, and the message tells the admin to reload.
 */
export function classifyAuthFailure(e: unknown): AuthFailure {
  if (e instanceof AdminApiError && e.status === 401) return { phase: 'unauthorized' };
  if (e instanceof AdminApiError && e.status === 403) return { phase: 'forbidden' };
  return {
    phase: 'error',
    message: e instanceof Error ? e.message : 'Something went wrong.',
  };
}
