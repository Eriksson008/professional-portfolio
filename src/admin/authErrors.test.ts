/**
 * classifyAuthFailure — the pure 401/403/error mapping the admin dashboard's
 * auth screens are driven by. Run via `npm test` (node --test).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AdminApiError, classifyAuthFailure } from './authErrors.ts';

test('401 → unauthorized (sign-in screen)', () => {
  assert.deepEqual(classifyAuthFailure(new AdminApiError('Not signed in.', 401)), {
    phase: 'unauthorized',
  });
});

test('403 → forbidden (allowlist screen)', () => {
  assert.deepEqual(classifyAuthFailure(new AdminApiError('This account is not authorized.', 403)), {
    phase: 'forbidden',
  });
});

test('other AdminApiError statuses → error with the API message', () => {
  assert.deepEqual(classifyAuthFailure(new AdminApiError('Admin endpoints are not configured.', 503)), {
    phase: 'error',
    message: 'Admin endpoints are not configured.',
  });
  assert.deepEqual(classifyAuthFailure(new AdminApiError('Could not reach the admin API.', 0)), {
    phase: 'error',
    message: 'Could not reach the admin API.',
  });
});

test('plain Error → error with its message', () => {
  assert.deepEqual(classifyAuthFailure(new TypeError('Failed to fetch')), {
    phase: 'error',
    message: 'Failed to fetch',
  });
});

test('non-Error throwables → generic message', () => {
  assert.deepEqual(classifyAuthFailure('boom'), {
    phase: 'error',
    message: 'Something went wrong.',
  });
  assert.deepEqual(classifyAuthFailure(undefined), {
    phase: 'error',
    message: 'Something went wrong.',
  });
});

test('a bare 401-shaped object is NOT trusted — only AdminApiError maps to auth phases', () => {
  assert.equal(classifyAuthFailure({ status: 401 }).phase, 'error');
});
