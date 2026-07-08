import type { LogRecord } from './types';
import { redact } from './redact';

/** RFC-4180 field escaping: wrap in quotes, double any inner quote. */
function cell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * Serialize the given rows to CSV. Question/answer are redacted to match what
 * the dashboard displays — the export never widens exposure beyond the screen.
 * A UTF-8 BOM keeps Excel happy with non-ASCII prompt text.
 */
export function logsToCsv(rows: LogRecord[]): string {
  const header = [
    'created_at',
    'source',
    'matched_intent',
    'question',
    'answer',
    'latency_ms',
    'model',
    'session_id',
    'page',
  ];
  const lines = rows.map((r) =>
    [
      r.created_at,
      r.source ?? '',
      r.matched_intent ?? '',
      redact(r.question),
      redact(r.answer),
      r.latency_ms ?? '',
      r.model ?? '',
      r.session_id ?? '',
      r.page ?? '',
    ]
      .map(cell)
      .join(',')
  );
  // Leading U+FEFF BOM so Excel reads the file as UTF-8.
  const bom = String.fromCharCode(0xfeff);
  return bom + [header.map(cell).join(','), ...lines].join('\r\n');
}

/** Trigger a client-side download of `content` as a file. */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
