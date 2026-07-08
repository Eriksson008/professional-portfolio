import type { AskSource, LogQuery, RangeKey } from '../types';
import { RANGE_LABELS } from '../dateRanges';

const RANGES: RangeKey[] = ['today', '7d', '30d', 'all', 'custom'];
const SOURCES: AskSource[] = ['ai', 'static', 'fallback', 'blocked', 'rate_limited'];

interface FiltersProps {
  query: LogQuery;
  intents: string[];
  exporting: boolean;
  onChange: (patch: Partial<LogQuery>) => void;
  onExport: () => void;
  onRefresh: () => void;
}

export function Filters({ query, intents, exporting, onChange, onExport, onRefresh }: FiltersProps) {
  return (
    <div className="admin-filters">
      <div className="admin-range" role="group" aria-label="Time range">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            className={`admin-range-btn${query.range === r ? ' is-active' : ''}`}
            aria-pressed={query.range === r}
            onClick={() => onChange({ range: r })}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      {query.range === 'custom' && (
        <div className="admin-custom-dates">
          <label className="admin-field">
            <span>From</span>
            <input
              type="date"
              value={query.customFrom}
              max={query.customTo || undefined}
              onChange={(e) => onChange({ customFrom: e.target.value })}
            />
          </label>
          <label className="admin-field">
            <span>To</span>
            <input
              type="date"
              value={query.customTo}
              min={query.customFrom || undefined}
              onChange={(e) => onChange({ customTo: e.target.value })}
            />
          </label>
        </div>
      )}

      <div className="admin-filter-row">
        <label className="admin-field admin-search">
          <span className="admin-visually-hidden">Search prompts</span>
          <input
            type="search"
            placeholder="Search prompt text…"
            value={query.q}
            onChange={(e) => onChange({ q: e.target.value })}
          />
        </label>

        <label className="admin-field">
          <span className="admin-visually-hidden">Source</span>
          <select
            value={query.source}
            onChange={(e) => onChange({ source: e.target.value as AskSource | '' })}
          >
            <option value="">All sources</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          <span className="admin-visually-hidden">Intent</span>
          <select value={query.intent} onChange={(e) => onChange({ intent: e.target.value })}>
            <option value="">All intents</option>
            {intents.map((it) => (
              <option key={it} value={it}>
                {it}
              </option>
            ))}
          </select>
        </label>

        <div className="admin-filter-actions">
          <button type="button" className="admin-btn" onClick={onRefresh}>
            Refresh
          </button>
          <button type="button" className="admin-btn" onClick={onExport} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
