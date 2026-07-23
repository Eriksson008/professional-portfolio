/**
 * Cloudflare Access authentication for the /admin/* endpoints.
 *
 * Cloudflare Access sits in front of the Worker's /admin paths at the edge and,
 * after the administrator signs in, forwards a signed JWT on every request in
 * the `Cf-Access-Jwt-Assertion` header. The edge gate alone is not trusted:
 * this module re-validates the assertion inside the Worker — RS256 signature
 * against the team's published JWKS, issuer, audience, and expiry — and then
 * requires the identity's email to be on the configured allowlist. Zero
 * dependencies: WebCrypto only.
 *
 * Outcomes (mapped to HTTP by the caller):
 *   - ok      → identity { email, authMode }
 *   - 503     → Access env config missing (fail closed, like the old token gate)
 *   - 401     → assertion missing or invalid (signature/claims)
 *   - 403     → valid assertion, but the email is not allowlisted
 *
 * The assertion and its claims are never logged.
 *
 * Local development (`wrangler dev`) has no Access edge, so an explicit
 * dev-only mode exists: ASK_FREDRIK_DEV_AUTH="allow" — set it in `.dev.vars`
 * (gitignored), never in wrangler.jsonc. It only takes effect when the request
 * hostname is loopback (localhost/127.0.0.1/[::1]), so even a var that leaks
 * into a production deploy cannot open the endpoints: production requests
 * reach the Worker via its workers.dev hostname, never a loopback host.
 */

import type { Env } from './index.ts';

export interface AdminIdentity {
  email: string;
  authMode: 'access' | 'dev';
}

export type AdminAuthResult =
  | { ok: true; identity: AdminIdentity }
  | { ok: false; status: 401 | 403 | 503; error: string };

const ACCESS_JWT_HEADER = 'Cf-Access-Jwt-Assertion';
/** Clock leeway for exp/nbf, in seconds. */
const CLOCK_LEEWAY_S = 60;
/** How long a fetched JWKS is reused before a background refresh, in ms. */
const JWKS_TTL_MS = 60 * 60 * 1000;
/** Minimum age before an unknown `kid` forces a refetch (rotation), in ms. */
const JWKS_MIN_REFRESH_MS = 60 * 1000;

interface AccessJwk {
  kid?: string;
  kty?: string;
  alg?: string;
  n?: string;
  e?: string;
}

/** Per-isolate JWKS cache — same lifetime/best-effort model as the rate limiter. */
let jwksCache: { url: string; fetchedAt: number; keys: AccessJwk[] } | null = null;

/** Test hook: clears the per-isolate JWKS cache. */
export function resetJwksCacheForTests(): void {
  jwksCache = null;
}

/** Empty string counts as unset — the committed wrangler.jsonc ships "" until
 *  the Access app exists, and the endpoints must fail closed until then. */
function envValue(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Comma-separated allowlist → lowercased set. */
export function parseAllowedEmails(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e !== '')
  );
}

/** Loopback hostnames — the only hosts the dev auth mode can ever apply to. */
export function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
}

function base64UrlDecode(segment: string): Uint8Array | null {
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function decodeJsonSegment(segment: string): Record<string, unknown> | null {
  const bytes = base64UrlDecode(segment);
  if (!bytes) return null;
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function fetchJwks(certsUrl: string): Promise<AccessJwk[] | null> {
  try {
    const res = await fetch(certsUrl, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const body = (await res.json()) as { keys?: unknown };
    if (!Array.isArray(body.keys)) return null;
    return body.keys.filter(
      (k): k is AccessJwk => typeof k === 'object' && k !== null && typeof (k as AccessJwk).kid === 'string'
    );
  } catch {
    return null;
  }
}

/** JWKS for the team domain, cached per isolate; an unknown kid triggers one
 *  refetch (key rotation) as long as the cache isn't brand new. A failed or
 *  empty refetch never overwrites a previously good cache — stale keys are
 *  better than an availability blip turning every admin request into a 401. */
async function getSigningKey(teamDomain: string, kid: string, now: number): Promise<AccessJwk | null> {
  const certsUrl = `${teamDomain}/cdn-cgi/access/certs`;
  if (jwksCache?.url === certsUrl && now - jwksCache.fetchedAt < JWKS_TTL_MS) {
    const hit = jwksCache.keys.find((k) => k.kid === kid);
    if (hit) return hit;
    if (now - jwksCache.fetchedAt < JWKS_MIN_REFRESH_MS) return null;
  }
  const keys = await fetchJwks(certsUrl);
  if (keys && keys.length > 0) {
    jwksCache = { url: certsUrl, fetchedAt: now, keys };
    return keys.find((k) => k.kid === kid) ?? null;
  }
  // Refetch failed or came back empty: fall back to whatever we already had.
  if (jwksCache?.url === certsUrl) {
    return jwksCache.keys.find((k) => k.kid === kid) ?? null;
  }
  return null;
}

interface AccessClaims {
  iss?: unknown;
  aud?: unknown;
  exp?: unknown;
  nbf?: unknown;
  email?: unknown;
}

/**
 * Validate a Cloudflare Access JWT: structure, RS256 signature against the
 * team JWKS, issuer, audience, and time window. Returns the verified email or
 * null — the caller never learns *why* validation failed (and neither do
 * clients or logs).
 */
export async function verifyAccessJwt(
  token: string,
  teamDomain: string,
  expectedAud: string,
  now: number = Date.now()
): Promise<string | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerSeg, payloadSeg, signatureSeg] = parts;

  const header = decodeJsonSegment(headerSeg);
  if (!header || header.alg !== 'RS256' || typeof header.kid !== 'string') return null;

  const jwk = await getSigningKey(teamDomain, header.kid, now);
  if (!jwk || jwk.kty !== 'RSA' || typeof jwk.n !== 'string' || typeof jwk.e !== 'string') return null;

  const signature = base64UrlDecode(signatureSeg);
  if (!signature) return null;

  let valid = false;
  try {
    const key = await crypto.subtle.importKey(
      'jwk',
      { kty: 'RSA', n: jwk.n, e: jwk.e },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      signature,
      new TextEncoder().encode(`${headerSeg}.${payloadSeg}`)
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  const claims = decodeJsonSegment(payloadSeg) as AccessClaims | null;
  if (!claims) return null;

  if (claims.iss !== teamDomain) return null;
  const audList = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audList.includes(expectedAud)) return null;
  const nowS = now / 1000;
  if (typeof claims.exp !== 'number' || nowS > claims.exp + CLOCK_LEEWAY_S) return null;
  if (typeof claims.nbf === 'number' && nowS < claims.nbf - CLOCK_LEEWAY_S) return null;

  const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : '';
  return email !== '' ? email : null;
}

/**
 * The shared /admin/* authentication middleware. Dev mode first (explicit var
 * + loopback host only), then the real Access validation.
 */
export async function authenticateAdmin(request: Request, env: Env): Promise<AdminAuthResult> {
  if (env.ASK_FREDRIK_DEV_AUTH === 'allow' && isLoopbackHostname(new URL(request.url).hostname)) {
    const email = envValue(env.ASK_FREDRIK_DEV_AUTH_EMAIL) ?? 'dev-admin@localhost';
    return { ok: true, identity: { email, authMode: 'dev' } };
  }

  const teamDomain = envValue(env.ACCESS_TEAM_DOMAIN)?.replace(/\/+$/, '') ?? null;
  const expectedAud = envValue(env.ACCESS_APP_AUD);
  const allowedEmails = parseAllowedEmails(env.ADMIN_ALLOWED_EMAILS);
  if (!teamDomain || !expectedAud || allowedEmails.size === 0) {
    return { ok: false, status: 503, error: 'Admin endpoints are not configured.' };
  }

  const token = request.headers.get(ACCESS_JWT_HEADER);
  if (!token) {
    return { ok: false, status: 401, error: 'Unauthorized.' };
  }

  const email = await verifyAccessJwt(token, teamDomain, expectedAud);
  if (!email) {
    return { ok: false, status: 401, error: 'Unauthorized.' };
  }
  if (!allowedEmails.has(email)) {
    return { ok: false, status: 403, error: 'Forbidden.' };
  }
  return { ok: true, identity: { email, authMode: 'access' } };
}
