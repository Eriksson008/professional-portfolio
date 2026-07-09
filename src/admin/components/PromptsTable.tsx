import { useState } from 'react';
import type { LogRecord } from '../types';
import { redact } from '../redact';
import { formatDashboardDate } from '../dateRanges';

/** Copy-to-clipboard button with a brief confirmation state. */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="admin-copy"
      title="Copy prompt"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* clipboard blocked — no-op */
        }
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function SourceBadge({ source }: { source: LogRecord['source'] }) {
  const s = source ?? 'unknown';
  return <span className={`admin-badge admin-badge--${s}`}>{s}</span>;
}

function Row({ log }: { log: LogRecord }) {
  const question = redact(log.question);
  const blocked = log.source === 'blocked';
  return (
    <tr className={blocked ? 'is-blocked' : undefined}>
      <td data-label="Time" className="admin-td-time" title={`${log.created_at} (UTC)`}>
        {formatDashboardDate(log.created_at)}
      </td>
      <td data-label="Prompt" className="admin-td-prompt">
        <span className="admin-prompt-text">{question}</span>
        <CopyButton text={question} />
      </td>
      <td data-label="Source">
        <SourceBadge source={log.source} />
      </td>
      <td data-label="Intent" className="admin-td-intent">
        {log.matched_intent ?? '—'}
      </td>
      <td data-label="Latency" className="admin-td-latency">
        {log.latency_ms != null ? `${log.latency_ms} ms` : '—'}
      </td>
    </tr>
  );
}

export function PromptsTable({ logs }: { logs: LogRecord[] }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Prompt</th>
            <th scope="col">Source</th>
            <th scope="col">Intent</th>
            <th scope="col">Latency</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <Row key={log.id} log={log} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
