/**
 * Light display-only redaction. The raw D1 data is never changed — this only
 * masks obvious PII in what the dashboard renders, so an over-the-shoulder
 * glance or a screenshot doesn't leak a visitor's email/phone/id. Order
 * matters: emails first (they contain digits), then phone-like runs, then any
 * remaining long digit sequence.
 */

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
// A phone-like run: optional +, then 7+ digits possibly split by spaces/()-.
const PHONE_RE = /(?:\+?\d[\d ().-]{7,}\d)/g;
// Any leftover long numeric identifier (order/account/etc.).
const LONG_ID_RE = /\b\d{7,}\b/g;

export function redact(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(EMAIL_RE, '[email]')
    .replace(PHONE_RE, (m) => (/\d/.test(m) && m.replace(/\D/g, '').length >= 7 ? '[phone]' : m))
    .replace(LONG_ID_RE, '[id]');
}
