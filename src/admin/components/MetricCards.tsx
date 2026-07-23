import type { StatsResponse } from '../types';
import { Sparkline } from './Sparkline';

const SOURCE_ORDER: Array<{ key: string; label: string }> = [
  { key: 'ai', label: 'AI' },
  { key: 'static', label: 'Curated' },
  { key: 'fallback', label: 'Fallback' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'rate_limited', label: 'Rate-limited' },
];

function Card({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="admin-card">
      <span className="admin-card-label">{label}</span>
      <span className="admin-card-value">{value}</span>
      {hint && <span className="admin-card-hint">{hint}</span>}
    </div>
  );
}

/** Honest formatting for the stored latency aggregate: the Worker sends null
 *  (and older Workers send nothing) when no row carries a latency — show that
 *  as unrecorded rather than a fake 0. */
function formatMs(value: number | null | undefined): string {
  return typeof value === 'number' ? `${value.toLocaleString()} ms` : 'not recorded';
}

export function MetricCards({ stats }: { stats: StatsResponse }) {
  const maxSource = Math.max(1, ...Object.values(stats.bySource).map((v) => v ?? 0));

  return (
    <div className="admin-metrics">
      <div className="admin-metric-row">
        <Card label="Total prompts" value={stats.total.toLocaleString()} hint="rolling log window" />
        <Card label="Today" value={stats.today.toLocaleString()} />
        <Card label="Last 7 days" value={stats.last7d.toLocaleString()} />
        <Card label="Last 30 days" value={stats.last30d.toLocaleString()} />
        <Card label="Blocked / sensitive" value={stats.blocked.toLocaleString()} />
        <Card label="Fallbacks" value={stats.fallback.toLocaleString()} />
        <Card label="Avg answer time" value={formatMs(stats.avgLatencyMs)} hint="server-side, log window" />
        <Card label="Avg answer · 7d" value={formatMs(stats.avgLatencyMs7d)} hint="server-side" />
      </div>

      <div className="admin-metric-panels">
        <section className="admin-panel">
          <h2 className="admin-panel-title">Result sources</h2>
          {/* This is the honest success/failure picture: every request gets an
              answer; "Blocked" and "Rate-limited" are refusals, "Fallback"
              means neither the curated matcher nor AI produced one. No separate
              error metric is stored. */}
          <ul className="admin-bars">
            {SOURCE_ORDER.map(({ key, label }) => {
              const count = stats.bySource[key as keyof typeof stats.bySource] ?? 0;
              return (
                <li key={key} className="admin-bar-row">
                  <span className="admin-bar-label">{label}</span>
                  <span className="admin-bar-track">
                    <span
                      className="admin-bar-fill"
                      style={{ width: `${(count / maxSource) * 100}%` }}
                    />
                  </span>
                  <span className="admin-bar-value">{count}</span>
                </li>
              );
            })}
          </ul>
          <p className="admin-panel-note">
            Every request is answered: AI + Curated are full answers, Fallback is the generic
            answer, Blocked and Rate-limited are refusals. No separate error log is stored.
          </p>
        </section>

        <section className="admin-panel">
          <h2 className="admin-panel-title">Top intents</h2>
          {stats.topIntents.length === 0 ? (
            <p className="admin-panel-empty">No matched intents yet.</p>
          ) : (
            <ul className="admin-intents">
              {stats.topIntents.map((it) => (
                <li key={it.intent} className="admin-intent-row">
                  <span className="admin-intent-name" title={it.intent}>
                    {it.intent}
                  </span>
                  <span className="admin-intent-count">{it.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-panel">
          <h2 className="admin-panel-title">Daily volume · 14d</h2>
          <Sparkline daily={stats.daily} />
        </section>
      </div>
    </div>
  );
}
