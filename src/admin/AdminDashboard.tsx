import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LogQuery, LogsResponse, MeResponse, StatsResponse } from './types';
import { ADMIN_BASE, PAGE_SIZE, fetchAllLogs, fetchLogs, fetchMe, fetchStats } from './api';
import { classifyAuthFailure } from './authErrors';
import { logsToCsv, downloadCsv } from './csv';
import { MetricCards } from './components/MetricCards';
import { Filters } from './components/Filters';
import { PromptsTable } from './components/PromptsTable';

const DEFAULT_QUERY: LogQuery = {
  range: '7d',
  customFrom: '',
  customTo: '',
  source: '',
  intent: '',
  q: '',
  page: 0,
};

type AuthPhase =
  | { phase: 'checking' }
  | { phase: 'ready'; identity: MeResponse }
  | { phase: 'unauthorized' }
  | { phase: 'forbidden' }
  | { phase: 'error'; message: string };

/**
 * Top-level: authenticate via GET /admin/me, then render the dashboard.
 * There is no login form and nothing to store — in production the page and
 * API are Cloudflare-Access-protected on the Worker's own origin, so the
 * browser's Access session is the credential. See docs/ask-fredrik-dashboard.md.
 */
export function AdminDashboard() {
  const [auth, setAuth] = useState<AuthPhase>({ phase: 'checking' });

  const authFailed = useCallback((e: unknown) => {
    setAuth(classifyAuthFailure(e));
  }, []);

  const checkAuth = useCallback(() => {
    setAuth({ phase: 'checking' });
    fetchMe()
      .then((identity) => setAuth({ phase: 'ready', identity }))
      .catch(authFailed);
  }, [authFailed]);

  useEffect(checkAuth, [checkAuth]);

  switch (auth.phase) {
    case 'checking':
      return (
        <AuthScreen title="Checking access…">
          Verifying your Cloudflare Access session with the Worker.
        </AuthScreen>
      );
    case 'unauthorized':
      return (
        <AuthScreen
          title="Sign-in required"
          actionLabel="Sign in"
          onAction={() => window.location.reload()}
        >
          This console is protected by Cloudflare Access. Reloading the page starts the
          sign-in flow; you'll land back here once you're authenticated.
        </AuthScreen>
      );
    case 'forbidden':
      return (
        <AuthScreen title="Not authorized">
          You are signed in, but this account is not on the admin allowlist for this
          console. If that's unexpected, check the Worker's ADMIN_ALLOWED_EMAILS secret.
        </AuthScreen>
      );
    case 'error':
      return (
        <AuthScreen title="Something went wrong" actionLabel="Retry" onAction={checkAuth}>
          {auth.message}
        </AuthScreen>
      );
    case 'ready':
      return <Dashboard identity={auth.identity} onAuthFailed={authFailed} />;
  }
}

/** Full-screen card for the pre-dashboard states (checking / 401 / 403 / error). */
function AuthScreen({
  title,
  children,
  actionLabel,
  onAction,
}: {
  title: string;
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="admin-gate">
      <div className="admin-gate-card">
        <p className="admin-gate-kicker">Ask&nbsp;Fredrik · Mission Control</p>
        <h1 className="admin-gate-title">{title}</h1>
        <p className="admin-gate-sub">{children}</p>
        {actionLabel && onAction && (
          <button type="button" className="admin-btn admin-btn--primary" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function Dashboard({
  identity,
  onAuthFailed,
}: {
  identity: MeResponse;
  onAuthFailed: (e: unknown) => void;
}) {
  const [query, setQuery] = useState<LogQuery>(DEFAULT_QUERY);
  const [debounced, setDebounced] = useState<LogQuery>(DEFAULT_QUERY);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const handleErr = useCallback(
    (e: unknown) => {
      // A mid-session 401/403 (expired Access session, allowlist change) drops
      // the whole dashboard back to the matching auth screen.
      const failure = classifyAuthFailure(e);
      if (failure.phase !== 'error') {
        onAuthFailed(e);
        return;
      }
      setError(failure.message);
    },
    [onAuthFailed]
  );

  // Debounce filter changes (chiefly the search box) before hitting the API.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Overview stats: load once per mount / manual refresh.
  useEffect(() => {
    let cancelled = false;
    fetchStats()
      .then((s) => !cancelled && setStats(s))
      .catch((e) => !cancelled && handleErr(e));
    return () => {
      cancelled = true;
    };
  }, [refreshTick, handleErr]);

  // Recent-prompts page: reload on any filter/pagination change.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchLogs(debounced)
      .then((r) => {
        if (cancelled) return;
        setLogs(r);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        handleErr(e);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, refreshTick, handleErr]);

  const patchQuery = useCallback((patch: Partial<LogQuery>) => {
    setQuery((q) => {
      const next = { ...q, ...patch };
      // Any filter change (anything other than an explicit page jump) resets
      // back to the first page so results stay coherent.
      if (!('page' in patch)) next.page = 0;
      return next;
    });
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const rows = await fetchAllLogs(debounced);
      downloadCsv(logsToCsv(rows), `ask-fredrik-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (e) {
      handleErr(e);
    } finally {
      setExporting(false);
    }
  }, [debounced, handleErr]);

  const intents = useMemo(() => {
    const set = new Set<string>(stats?.topIntents.map((i) => i.intent) ?? []);
    if (query.intent) set.add(query.intent);
    return [...set];
  }, [stats, query.intent]);

  const total = logs?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : query.page * PAGE_SIZE + 1;
  const rangeEnd = Math.min(total, (query.page + 1) * PAGE_SIZE);

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Ask&nbsp;Fredrik</p>
          <h1 className="admin-title">Prompt Mission Control</h1>
        </div>
        <div className="admin-id">
          <span className="admin-id-email" title="Verified by the Worker from your Cloudflare Access identity">
            {identity.email}
          </span>
          {identity.authMode === 'dev' ? (
            <span className="admin-id-badge">dev session</span>
          ) : (
            <a className="admin-btn" href={`${ADMIN_BASE}/cdn-cgi/access/logout`}>
              Sign out
            </a>
          )}
        </div>
      </header>

      {stats && <MetricCards stats={stats} />}

      <Filters
        query={query}
        intents={intents}
        exporting={exporting}
        onChange={patchQuery}
        onExport={handleExport}
        onRefresh={() => setRefreshTick((t) => t + 1)}
      />

      <section className="admin-results">
        <div className="admin-results-head">
          <h2 className="admin-panel-title">Recent prompts</h2>
          {logs && total > 0 && (
            <span className="admin-results-count">
              {rangeStart}–{rangeEnd} of {total.toLocaleString()}
            </span>
          )}
        </div>

        {error ? (
          <div className="admin-state admin-state--error">
            <p>{error}</p>
            <button type="button" className="admin-btn" onClick={() => setRefreshTick((t) => t + 1)}>
              Retry
            </button>
          </div>
        ) : loading && !logs ? (
          <div className="admin-state">Loading prompts…</div>
        ) : logs && logs.logs.length === 0 ? (
          <div className="admin-state">No prompts match these filters.</div>
        ) : (
          logs && (
            <>
              <div className={loading ? 'admin-fade' : undefined}>
                <PromptsTable logs={logs.logs} />
              </div>
              <div className="admin-pager">
                <button
                  type="button"
                  className="admin-btn"
                  disabled={query.page === 0}
                  onClick={() => patchQuery({ page: query.page - 1 })}
                >
                  Previous
                </button>
                <span className="admin-pager-label">
                  Page {query.page + 1} of {pageCount}
                </span>
                <button
                  type="button"
                  className="admin-btn"
                  disabled={query.page + 1 >= pageCount}
                  onClick={() => patchQuery({ page: query.page + 1 })}
                >
                  Next
                </button>
              </div>
            </>
          )
        )}
      </section>

      <footer className="admin-footer">
        Prompts are shown with light PII redaction. Raw data stays unchanged in D1.
      </footer>
    </div>
  );
}
