/**
 * Date-range utility tests for the admin dashboard.
 *
 * Zero-dependency: runs on plain Node (v22.18+/v24, native type stripping):
 *
 *   npm test        (from the repo root)
 *
 * The assertions are timezone-independent by construction (they check
 * structural invariants and local-clock fields, not absolute UTC strings), so
 * they pass regardless of the machine's TZ. That is the whole point of the
 * fix under test: calendar ranges are anchored to the viewer's local day, then
 * serialized to UTC for the query.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDateRangeForFilter,
  normalizeDateRange,
  startOfLocalDayIso,
  formatDashboardDate,
  RANGE_LABELS,
} from './dateRanges.ts';

const DAY_MS = 86_400_000;
const base = { customFrom: '', customTo: '' };

test('all → no bounds', () => {
  assert.deepEqual(getDateRangeForFilter({ range: 'all', ...base }), {});
});

test('today → local midnight, from only (no upper bound)', () => {
  const now = Date.now();
  const { from, to } = getDateRangeForFilter({ range: 'today', ...base }, now);
  assert.equal(to, undefined);
  assert.ok(from);
  // Reparsed in local time, the lower bound sits exactly at local midnight.
  const d = new Date(from!);
  assert.equal(d.getHours(), 0);
  assert.equal(d.getMinutes(), 0);
  assert.equal(d.getSeconds(), 0);
  assert.equal(d.getMilliseconds(), 0);
  // And it is never in the future.
  assert.ok(new Date(from!).getTime() <= now);
});

test('7d / 30d → exact rolling windows (timezone-independent)', () => {
  const now = Date.UTC(2026, 6, 9, 15, 0, 0);
  assert.equal(
    getDateRangeForFilter({ range: '7d', ...base }, now).from,
    new Date(now - 7 * DAY_MS).toISOString()
  );
  assert.equal(
    getDateRangeForFilter({ range: '30d', ...base }, now).from,
    new Date(now - 30 * DAY_MS).toISOString()
  );
  // Rolling windows carry no `to` bound.
  assert.equal(getDateRangeForFilter({ range: '7d', ...base }, now).to, undefined);
});

test('custom single day → spans exactly one local day, inclusive', () => {
  // 2026-07-15 avoids the EU/US DST switch days, so a local day is a clean 24h.
  const { from, to } = getDateRangeForFilter({
    range: 'custom',
    customFrom: '2026-07-15',
    customTo: '2026-07-15',
  });
  assert.ok(from && to);
  const start = new Date(from!);
  const end = new Date(to!);
  assert.equal(start.getHours(), 0);
  assert.equal(end.getHours(), 23);
  assert.equal(end.getMinutes(), 59);
  assert.equal(end.getSeconds(), 59);
  assert.equal(end.getMilliseconds(), 999);
  // Full local day, inclusive of the last millisecond.
  assert.equal(end.getTime() - start.getTime(), DAY_MS - 1);
});

test('custom with only one side set → only that bound is emitted', () => {
  assert.deepEqual(
    Object.keys(getDateRangeForFilter({ range: 'custom', customFrom: '2026-07-15', customTo: '' })),
    ['from']
  );
  assert.deepEqual(
    Object.keys(getDateRangeForFilter({ range: 'custom', customFrom: '', customTo: '2026-07-15' })),
    ['to']
  );
});

test('custom inverted range is swapped so from <= to', () => {
  const { from, to } = getDateRangeForFilter({
    range: 'custom',
    customFrom: '2026-07-20',
    customTo: '2026-07-10',
  });
  assert.ok(from && to);
  assert.ok(new Date(from!).getTime() < new Date(to!).getTime());
});

test('custom garbage input is dropped, never throws', () => {
  assert.deepEqual(getDateRangeForFilter({ range: 'custom', customFrom: 'nope', customTo: '' }), {});
});

test('normalizeDateRange trims and swaps', () => {
  assert.deepEqual(normalizeDateRange('  2026-07-10 ', ' 2026-07-11 '), {
    from: '2026-07-10',
    to: '2026-07-11',
  });
  assert.deepEqual(normalizeDateRange('2026-07-11', '2026-07-10'), {
    from: '2026-07-10',
    to: '2026-07-11',
  });
  assert.deepEqual(normalizeDateRange('', ''), { from: '', to: '' });
});

test('startOfLocalDayIso is a valid UTC instant at local midnight', () => {
  const iso = startOfLocalDayIso(Date.UTC(2026, 6, 9, 15, 30, 0));
  const d = new Date(iso);
  assert.equal(d.getHours(), 0);
  assert.equal(d.getMinutes(), 0);
  assert.ok(iso.endsWith('Z'));
});

test('formatDashboardDate returns input verbatim for an unparseable value', () => {
  assert.equal(formatDashboardDate('not-a-date'), 'not-a-date');
  // A real ISO renders to a non-empty localized string.
  assert.ok(formatDashboardDate('2026-07-09T12:00:00.000Z').length > 0);
});

test('every RangeKey has a human label', () => {
  assert.deepEqual(Object.keys(RANGE_LABELS).sort(), ['30d', '7d', 'all', 'custom', 'today']);
});
