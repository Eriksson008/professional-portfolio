/**
 * Ask Fredrik — admin authentication tests (Cloudflare Access).
 *
 * Zero-dependency: runs on plain Node (v22.18+/v24, native type stripping):
 *
 *   npm test        (from cloudflare/ask-fredrik-worker)
 *
 * Exercises the exported fetch handler end-to-end with a stub Env: a real
 * RSA keypair is generated locally, its public JWKS is served by a stubbed
 * global fetch, and requests carry locally signed Cf-Access-Jwt-Assertion
 * headers — so the exact production validation path (signature, issuer,
 * audience, expiry, email allowlist, dev mode, D1 gating) is what runs here.
 */

import worker from '../index.ts';
import type { Env } from '../index.ts';
import { parseAllowedEmails, resetJwksCacheForTests, verifyAccessJwt } from '../access.ts';

declare const process: { exitCode?: number };

let passed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed += 1;
  } else {
    failures.push(detail ? `${name} — ${detail}` : name);
  }
}

// ---------------------------------------------------------------------------
// Test scaffolding: keys, JWTs, JWKS-serving fetch stub, Env/D1/ctx stubs.
// ---------------------------------------------------------------------------

const TEAM_DOMAIN = 'https://testteam.cloudflareaccess.com';
const APP_AUD = 'aud-tag-for-tests';
const ADMIN_EMAIL = 'admin@example.com';
const KID = 'test-key-1';
const PROD_URL = 'https://ask-fredrik-worker.example.workers.dev';

function b64url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlJson(value: unknown): string {
  return b64url(new TextEncoder().encode(JSON.stringify(value)));
}

const keyPair = (await crypto.subtle.generateKey(
  {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  },
  true,
  ['sign', 'verify']
)) as CryptoKeyPair;

const publicJwk = (await crypto.subtle.exportKey('jwk', keyPair.publicKey)) as unknown as Record<
  string,
  unknown
>;
const JWKS = { keys: [{ ...publicJwk, kid: KID, alg: 'RS256', use: 'sig' }] };

async function signJwt(
  payload: Record<string, unknown>,
  opts: { kid?: string; alg?: string; privateKey?: CryptoKey } = {}
): Promise<string> {
  const header = { alg: opts.alg ?? 'RS256', kid: opts.kid ?? KID, typ: 'JWT' };
  const signingInput = `${b64urlJson(header)}.${b64urlJson(payload)}`;
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    opts.privateKey ?? keyPair.privateKey,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${b64url(new Uint8Array(signature))}`;
}

function claims(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const nowS = Math.floor(Date.now() / 1000);
  return {
    iss: TEAM_DOMAIN,
    aud: [APP_AUD],
    email: ADMIN_EMAIL,
    iat: nowS,
    nbf: nowS,
    exp: nowS + 300,
    sub: 'test-subject',
    ...overrides,
  };
}

/** Global fetch stub: serves the (mutable) team JWKS, rejects anything else.
 *  `currentJwks`/`jwksFetchFails` let the rotation/availability tests change
 *  what the "certs endpoint" does mid-run. */
let jwksFetches = 0;
let currentJwks: { keys: unknown[] } = JWKS;
let jwksFetchFails = false;
(globalThis as { fetch: unknown }).fetch = async (input: unknown): Promise<Response> => {
  const requested = String(input instanceof Request ? input.url : input);
  if (requested === `${TEAM_DOMAIN}/cdn-cgi/access/certs`) {
    jwksFetches += 1;
    if (jwksFetchFails) throw new Error('simulated certs outage');
    return new Response(JSON.stringify(currentJwks), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  throw new Error(`Unexpected fetch in tests: ${requested}`);
};

const ctx = {
  waitUntil() {},
  passThroughOnException() {},
} as unknown as ExecutionContext;

/** Minimal D1 stub: every prepare().bind() chain is inert; batch() replays the
 *  canned results in order. */
function stubDb(batchResults: Array<{ results: unknown[] }>): NonNullable<Env['ASK_FREDRIK_DB']> {
  const statement: { bind: (...args: unknown[]) => unknown } = { bind: () => statement };
  return {
    prepare: () => statement,
    batch: async () => batchResults,
  } as unknown as NonNullable<Env['ASK_FREDRIK_DB']>;
}

function accessEnv(overrides: Partial<Env> = {}): Env {
  return {
    ACCESS_TEAM_DOMAIN: TEAM_DOMAIN,
    ACCESS_APP_AUD: APP_AUD,
    ADMIN_ALLOWED_EMAILS: ADMIN_EMAIL,
    ...overrides,
  } as Env;
}

function adminRequest(path: string, jwt?: string, base: string = PROD_URL): Request {
  return new Request(`${base}${path}`, {
    headers: jwt ? { 'Cf-Access-Jwt-Assertion': jwt } : undefined,
  });
}

async function status(request: Request, env: Env): Promise<number> {
  return (await worker.fetch(request, env, ctx)).status;
}

// ---------------------------------------------------------------------------
// 1. Public surface is untouched: /ask answers without any auth, health is open.
// ---------------------------------------------------------------------------
{
  const env = accessEnv();
  const res = await worker.fetch(
    new Request(`${PROD_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Does Fredrik know React?' }),
    }),
    env,
    ctx
  );
  const body = (await res.json()) as { answer?: string; source?: string };
  check('/ask answers 200 with no auth', res.status === 200, `got ${res.status}`);
  check('/ask still resolves curated answers', body.source === 'static', `got ${body.source}`);

  const preflight = await worker.fetch(
    new Request(`${PROD_URL}/ask`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://eriksson008.github.io' },
    }),
    env,
    ctx
  );
  check('/ask preflight still 204', preflight.status === 204, `got ${preflight.status}`);
  check(
    '/ask preflight still allows the portfolio origin',
    preflight.headers.get('Access-Control-Allow-Origin') === 'https://eriksson008.github.io'
  );

  const health = await worker.fetch(new Request(`${PROD_URL}/`), env, ctx);
  check('health endpoint stays open', health.status === 200, `got ${health.status}`);
}

// ---------------------------------------------------------------------------
// 2. Fail closed without Access configuration.
// ---------------------------------------------------------------------------
{
  check(
    'missing all Access config → 503',
    (await status(adminRequest('/admin/me'), {} as Env)) === 503
  );
  check(
    'empty-string Access vars count as unset → 503',
    (await status(
      adminRequest('/admin/me'),
      accessEnv({ ACCESS_TEAM_DOMAIN: '', ACCESS_APP_AUD: '' })
    )) === 503
  );
  check(
    'empty allowlist fails closed → 503',
    (await status(adminRequest('/admin/me'), accessEnv({ ADMIN_ALLOWED_EMAILS: ' , ' }))) === 503
  );
}

// ---------------------------------------------------------------------------
// 3. Missing / malformed / forged assertions → 401.
// ---------------------------------------------------------------------------
{
  const env = accessEnv();
  check('no assertion → 401', (await status(adminRequest('/admin/me'), env)) === 401);
  check(
    'garbage assertion → 401',
    (await status(adminRequest('/admin/me', 'not-a-jwt'), env)) === 401
  );
  check(
    'two-part token → 401',
    (await status(adminRequest('/admin/me', 'aaaa.bbbb'), env)) === 401
  );

  const unsigned = `${b64urlJson({ alg: 'none', kid: KID })}.${b64urlJson(claims())}.`;
  check('alg "none" → 401', (await status(adminRequest('/admin/me', unsigned), env)) === 401);

  const unknownKid = await signJwt(claims(), { kid: 'rotated-away' });
  check('unknown kid → 401', (await status(adminRequest('/admin/me', unknownKid), env)) === 401);

  const expired = await signJwt(claims({ exp: Math.floor(Date.now() / 1000) - 3600 }));
  check('expired assertion → 401', (await status(adminRequest('/admin/me', expired), env)) === 401);

  const wrongAud = await signJwt(claims({ aud: ['some-other-app'] }));
  check('wrong audience → 401', (await status(adminRequest('/admin/me', wrongAud), env)) === 401);

  const wrongIssuer = await signJwt(claims({ iss: 'https://otherteam.cloudflareaccess.com' }));
  check('wrong issuer → 401', (await status(adminRequest('/admin/me', wrongIssuer), env)) === 401);

  const noEmail = await signJwt(claims({ email: undefined }));
  check('assertion without email → 401', (await status(adminRequest('/admin/me', noEmail), env)) === 401);

  // Signature over a different payload: swap the payload segment after signing.
  const valid = await signJwt(claims());
  const [h, , s] = valid.split('.');
  const tampered = `${h}.${b64urlJson(claims({ email: 'attacker@example.com' }))}.${s}`;
  check('tampered payload → 401', (await status(adminRequest('/admin/me', tampered), env)) === 401);
}

// ---------------------------------------------------------------------------
// 4. Valid assertion: allowlisted email in, others 403. /admin/me payload.
// ---------------------------------------------------------------------------
{
  const env = accessEnv();
  const jwt = await signJwt(claims());
  const res = await worker.fetch(adminRequest('/admin/me', jwt), env, ctx);
  const body = (await res.json()) as { email?: string; authMode?: string };
  check('valid assertion → /admin/me 200', res.status === 200, `got ${res.status}`);
  check('/admin/me returns the verified email', body.email === ADMIN_EMAIL, `got ${body.email}`);
  check('/admin/me reports access mode', body.authMode === 'access', `got ${body.authMode}`);
  check(
    '/admin/me returns only safe fields',
    Object.keys(body).sort().join(',') === 'authMode,email',
    Object.keys(body).join(',')
  );

  const outsider = await signJwt(claims({ email: 'visitor@example.com' }));
  check(
    'valid assertion, non-allowlisted email → 403',
    (await status(adminRequest('/admin/me', outsider), env)) === 403
  );

  const cased = await signJwt(claims({ email: 'Admin@Example.COM' }));
  check(
    'allowlist match is case-insensitive',
    (await status(adminRequest('/admin/me', cased), env)) === 200
  );

  const multiEnv = accessEnv({ ADMIN_ALLOWED_EMAILS: `other@example.com, ${ADMIN_EMAIL}` });
  check(
    'comma-separated allowlist works',
    (await status(adminRequest('/admin/me', jwt), multiEnv)) === 200
  );
}

// ---------------------------------------------------------------------------
// 5. Protected data routes: same gate, then D1.
// ---------------------------------------------------------------------------
{
  const env = accessEnv();
  const jwt = await signJwt(claims());

  check('/admin/logs without assertion → 401', (await status(adminRequest('/admin/logs'), env)) === 401);
  check('/admin/stats without assertion → 401', (await status(adminRequest('/admin/stats'), env)) === 401);
  check(
    '/admin/logs authorized but no D1 → 503',
    (await status(adminRequest('/admin/logs', jwt), env)) === 503
  );

  const logRow = { id: 'r1', created_at: '2026-07-23T10:00:00.000Z', question: 'hi', answer: 'yo' };
  const logsEnv = accessEnv({
    ASK_FREDRIK_DB: stubDb([{ results: [logRow] }, { results: [{ total: 1 }] }]),
  });
  const logsRes = await worker.fetch(adminRequest('/admin/logs', jwt), logsEnv, ctx);
  const logsBody = (await logsRes.json()) as { total?: number; logs?: unknown[] };
  check('/admin/logs authorized → 200', logsRes.status === 200, `got ${logsRes.status}`);
  check('/admin/logs returns rows + total', logsBody.total === 1 && logsBody.logs?.length === 1);

  const statsEnv = accessEnv({
    ASK_FREDRIK_DB: stubDb([
      { results: [{ c: 12 }] },
      { results: [{ c: 3 }] },
      { results: [{ c: 7 }] },
      { results: [{ c: 12 }] },
      { results: [{ avg_all: 812.4, avg_7d: 640.6 }] },
      { results: [{ source: 'ai', c: 8 }] },
      { results: [{ intent: 'strengths', c: 4 }] },
      { results: [{ day: '2026-07-23', c: 3 }] },
    ]),
  });
  const statsRes = await worker.fetch(adminRequest('/admin/stats', jwt), statsEnv, ctx);
  const statsBody = (await statsRes.json()) as {
    total?: number;
    avgLatencyMs?: number | null;
    avgLatencyMs7d?: number | null;
  };
  check('/admin/stats authorized → 200', statsRes.status === 200, `got ${statsRes.status}`);
  check('/admin/stats aggregates pass through', statsBody.total === 12);
  check('/admin/stats reports rounded avg latency', statsBody.avgLatencyMs === 812);
  check('/admin/stats reports rounded 7d avg latency', statsBody.avgLatencyMs7d === 641);

  const nullLatencyEnv = accessEnv({
    ASK_FREDRIK_DB: stubDb([
      { results: [{ c: 0 }] },
      { results: [{ c: 0 }] },
      { results: [{ c: 0 }] },
      { results: [{ c: 0 }] },
      { results: [{ avg_all: null, avg_7d: null }] },
      { results: [] },
      { results: [] },
      { results: [] },
    ]),
  });
  const nullStats = (await (
    await worker.fetch(adminRequest('/admin/stats', jwt), nullLatencyEnv, ctx)
  ).json()) as { avgLatencyMs?: number | null };
  check('avg latency is null (not 0) when unrecorded', nullStats.avgLatencyMs === null);
}

// ---------------------------------------------------------------------------
// 6. Dev auth mode: explicit var AND loopback host — never one without the other.
// ---------------------------------------------------------------------------
{
  const devEnv = { ASK_FREDRIK_DEV_AUTH: 'allow' } as Env;
  const local = await worker.fetch(
    adminRequest('/admin/me', undefined, 'http://127.0.0.1:8787'),
    devEnv,
    ctx
  );
  const localBody = (await local.json()) as { email?: string; authMode?: string };
  check('dev mode on loopback → 200', local.status === 200, `got ${local.status}`);
  check('dev mode reports dev authMode', localBody.authMode === 'dev', `got ${localBody.authMode}`);
  check('dev mode default identity', localBody.email === 'dev-admin@localhost');

  check(
    'dev mode on localhost hostname → 200',
    (await status(adminRequest('/admin/me', undefined, 'http://localhost:8787'), devEnv)) === 200
  );
  check(
    'dev var leaked to production host → still refused (503, no Access config)',
    (await status(adminRequest('/admin/me'), devEnv)) === 503
  );
  check(
    'dev var leaked alongside real Access config → still 401 without assertion',
    (await status(adminRequest('/admin/me'), accessEnv({ ASK_FREDRIK_DEV_AUTH: 'allow' }))) === 401
  );
  check(
    'no dev var on loopback → fail closed (503, no Access config)',
    (await status(adminRequest('/admin/me', undefined, 'http://127.0.0.1:8787'), {} as Env)) === 503
  );
  check(
    'wrong dev var value → no bypass',
    (await status(
      adminRequest('/admin/me', undefined, 'http://127.0.0.1:8787'),
      { ASK_FREDRIK_DEV_AUTH: 'true' } as Env
    )) === 503
  );

  const namedDev = await worker.fetch(
    adminRequest('/admin/me', undefined, 'http://localhost:8787'),
    { ASK_FREDRIK_DEV_AUTH: 'allow', ASK_FREDRIK_DEV_AUTH_EMAIL: 'me@local.test' } as Env,
    ctx
  );
  check(
    'dev identity email is configurable',
    ((await namedDev.json()) as { email?: string }).email === 'me@local.test'
  );
}

// ---------------------------------------------------------------------------
// 7. Unit-level checks: allowlist parsing + direct JWT verification.
// ---------------------------------------------------------------------------
{
  const parsed = parseAllowedEmails(' A@b.c ,, d@e.f ');
  check('parseAllowedEmails trims, lowercases, drops empties', parsed.size === 2 && parsed.has('a@b.c') && parsed.has('d@e.f'));
  check('parseAllowedEmails of undefined is empty', parseAllowedEmails(undefined).size === 0);

  const direct = await verifyAccessJwt(await signJwt(claims()), TEAM_DOMAIN, APP_AUD);
  check('verifyAccessJwt returns the lowercased email', direct === ADMIN_EMAIL);
  check(
    'verifyAccessJwt accepts a string aud claim',
    (await verifyAccessJwt(await signJwt(claims({ aud: APP_AUD })), TEAM_DOMAIN, APP_AUD)) ===
      ADMIN_EMAIL
  );
  check('JWKS was fetched (and cached) at most a handful of times', jwksFetches >= 1 && jwksFetches <= 4, `fetched ${jwksFetches}×`);
  resetJwksCacheForTests();
}

// ---------------------------------------------------------------------------
// 8. JWKS rotation + availability (driven via verifyAccessJwt's `now` param).
// ---------------------------------------------------------------------------
{
  const MINUTE = 60_000;
  const HOUR = 60 * MINUTE;
  const T = Date.now();

  const rotatedPair = (await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  )) as CryptoKeyPair;
  const rotatedJwk = (await crypto.subtle.exportKey('jwk', rotatedPair.publicKey)) as unknown as Record<
    string,
    unknown
  >;
  const ROTATED_KID = 'test-key-2';
  // Long-lived claims: these tests advance `now` by hours to expire the JWKS
  // cache, and the token itself must outlive that window so what's under test
  // is the key lookup, not the exp check.
  const longLived = { exp: Math.floor(T / 1000) + 8 * 3600 };
  const rotatedToken = await signJwt(claims(longLived), {
    kid: ROTATED_KID,
    privateKey: rotatedPair.privateKey,
  });
  const originalToken = await signJwt(claims(longLived));

  resetJwksCacheForTests();
  currentJwks = JWKS;
  check(
    'baseline: original kid verifies (fresh cache)',
    (await verifyAccessJwt(originalToken, TEAM_DOMAIN, APP_AUD, T)) === ADMIN_EMAIL
  );

  // Key rotation: certs endpoint now serves only the new key; an unknown kid
  // after the min-refresh window triggers a refetch that finds it.
  currentJwks = { keys: [{ ...rotatedJwk, kid: ROTATED_KID, alg: 'RS256', use: 'sig' }] };
  check(
    'rotated kid recovered via refetch',
    (await verifyAccessJwt(rotatedToken, TEAM_DOMAIN, APP_AUD, T + 2 * MINUTE)) === ADMIN_EMAIL
  );

  // Availability: an empty JWKS response after TTL expiry must not clobber the
  // good cache — the stale key still verifies.
  currentJwks = { keys: [] };
  check(
    'empty certs response falls back to stale cache',
    (await verifyAccessJwt(rotatedToken, TEAM_DOMAIN, APP_AUD, T + 2 * MINUTE + 2 * HOUR)) ===
      ADMIN_EMAIL
  );

  // Availability: a failing certs fetch after TTL expiry also falls back.
  jwksFetchFails = true;
  check(
    'certs outage falls back to stale cache',
    (await verifyAccessJwt(rotatedToken, TEAM_DOMAIN, APP_AUD, T + 2 * MINUTE + 3 * HOUR)) ===
      ADMIN_EMAIL
  );
  jwksFetchFails = false;

  // A kid that exists nowhere (refetch empty, stale cache lacks it) still fails.
  check(
    'unknown kid stays rejected through the fallback path',
    (await verifyAccessJwt(originalToken, TEAM_DOMAIN, APP_AUD, T + 2 * MINUTE + 4 * HOUR)) === null
  );

  currentJwks = JWKS;
  resetJwksCacheForTests();
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
if (failures.length > 0) {
  console.error(`\n${failures.length} admin-auth check(s) FAILED (of ${passed + failures.length}):\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exitCode = 1;
} else {
  console.log(`admin-auth: all ${passed} checks passed.`);
}
