import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LogQuery, LogsResponse, StatsResponse } from './types';
import {
  ADMIN_BASE,
  AdminApiError,
  PAGE_SIZE,
  fetchAllLogs,
  fetchLogs,
  fetchStats,
} from './api';
import { logsToCsv, downloadCsv } from './csv';
import { TokenGate } from './components/TokenGate';
import { MetricCards } from './components/MetricCards';
import { Filters } from './components/Filters';
import { PromptsTable } from './components/PromptsTable';

const TOKEN_KEY = 'ask_fredrik_admin_token';

const DEFAULT_QUERY: LogQuery = {
  range: '7d',
  customFrom: '',
  customTo: '',
  source: '',
  intent: '',
  q: '',
  page: 0,
};

/** Top-level: token gate → dashboard. Token lives in sessionStorage only. */
export function AdminDashboard() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [authError, setAuthError] = useState<string | null>(null);

  const signOut = useCallback((message?: string) => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setAuthError(message ?? null);
  }, []);

  if (!token) {
    return (
      <TokenGate
        error={authError}
        configured={ADMIN_BASE !== null}
        onSubmit={(t) => {
          sessionStorage.setItem(TOKEN_KEY, t);
          setAuthError(null);
          setToken(t);
        }}
      />
    );
  }

  return <Dashboard token={token} onSignOut={signOut} />;
}

function Dashboard({ token, onSignOut }: { token: string; onSignOut: (message?: string) => void }) {
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
      if (e instanceof AdminApiError && e.status === 401) {
        onSignOut('Invalid or expired admin token.');
        return;
      }
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    },
    [onSignOut]
  );

  // Debounce filter changes (chiefly the search box) before hitting the API.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Overview stats: load once per token / manual refresh.
  useEffect(() => {
    let cancelled = false;
    fetchStats(token)
      .then((s) => !cancelled && setStats(s))
      .catch((e) => !cancelled && handleErr(e));
    return () => {
      cancelled = true;
    };
  }, [token, refreshTick, handleErr]);

  // Recent-prompts page: reload on any filter/pagination change.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchLogs(debounced, token)
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
  }, [debounced, token, refreshTick, handleErr]);

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
      const rows = await fetchAllLogs(debounced, token);
      downloadCsv(logsToCsv(rows), `ask-fredrik-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (e) {
      handleErr(e);
    } finally {
      setExporting(false);
    }
  }, [debounced, token, handleErr]);

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
        <button type="button" className="admin-btn" onClick={() => onSignOut()}>
          Sign out
        </button>
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
