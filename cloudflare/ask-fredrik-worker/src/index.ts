/**
 * Ask Fredrik — Cloudflare Worker backend.
 *
 * POST /ask         { question, sessionId?, page? }  →  { answer, source }
 * GET  /admin/logs  Bearer ADMIN_TOKEN               →  { count, logs }
 *
 * v1 (this code) validates the request and returns a deterministic fallback
 * answer built from the approved public context below — it does not call any
 * AI model yet. Valid questions are logged to D1 (best-effort, off the
 * response path) so recruiter questions can be reviewed via /admin/logs.
 * The code is shaped so Workers AI can slot in later (see "Upgrading to
 * Workers AI" in the README).
 *
 * Runs entirely on the Workers/D1 Free plans. No API keys in code — the two
 * secrets (ADMIN_TOKEN, IP_HASH_SALT) live in Worker secrets, and every
 * feature degrades gracefully when its binding or secret is absent.
 */

export interface Env {
  /** D1 question log. Optional: without the binding the Worker still answers,
   *  it just doesn't log. */
  ASK_FREDRIK_DB?: D1Database;
  /** Secret: bearer token for GET /admin/logs. Missing → endpoint returns 503. */
  ADMIN_TOKEN?: string;
  /** Secret: salt for hashing the connecting IP. Missing → ip_hash is not stored.
   *  Raw IPs are never stored either way. */
  IP_HASH_SALT?: string;
}

/**
 * Approved, portfolio-safe public context — the only facts this Worker
 * is ever allowed to speak from. Mirrors src/data/fredrikContext.ts in
 * the frontend: public facts and git-verifiable metrics only, no
 * internal system or project codenames.
 */
const APPROVED_CONTEXT = {
  name: 'Fredrik Eriksson',
  role: 'Senior Software Engineer / Acting Tech Lead',
  focusAreas: [
    'Enterprise AI',
    'secure client portals',
    'production support',
    'technical leadership',
  ],
  stack: ['React', 'Spring Boot', 'AWS', 'Salesforce', 'CI/CD (Copado, Jenkins)'],
  trackRecord: [
    '3 consecutive years of Exceptional Impact performance ratings',
    '750+ commits',
    '120+ Jira stories delivered',
  ],
} as const;

/**
 * v1 answer: deterministic, composed once from the approved context.
 * When Workers AI is enabled this becomes the safety net for model
 * failures rather than the primary answer.
 */
const FALLBACK_ANSWER =
  `${APPROVED_CONTEXT.name} is a ${APPROVED_CONTEXT.role} focused on ` +
  `${APPROVED_CONTEXT.focusAreas.join(', ')}. ` +
  `His core stack is ${APPROVED_CONTEXT.stack.join(', ')}. ` +
  `Track record: ${APPROVED_CONTEXT.trackRecord.join('; ')}. ` +
  `For question-specific answers, the portfolio's built-in assistant covers ` +
  `his strongest projects, technical stack, leadership experience, and role fit.`;

const MAX_QUESTION_LENGTH = 500;
const DEFAULT_LOG_LIMIT = 100;
const MAX_LOG_LIMIT = 100;

/**
 * CORS allowlist for /ask: local development (any localhost/127.0.0.1 port —
 * Vite dev 5173, Vite preview 4173, the Docker/nginx site on 8790) plus the
 * GitHub Pages portfolio origin. Everything else gets no CORS headers.
 * /admin/logs deliberately gets no CORS headers at all — it is a curl/CLI
 * endpoint, never callable from a browser page on another origin.
 */
const ALLOWED_ORIGINS = ['https://eriksson008.github.io'];
const ALLOWED_ORIGIN_PATTERNS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

function resolveCorsOrigin(request: Request): string | null {
  const origin = request.headers.get('Origin');
  if (origin === null) return null;
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin))) return origin;
  return null;
}

function json(body: unknown, status: number, origin: string | null, extra?: HeadersInit): Response {
  const headers = new Headers(extra);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  if (origin !== null) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.append('Vary', 'Origin');
  }
  return new Response(JSON.stringify(body), { status, headers });
}

/** Salted SHA-256 of the connecting IP, hex-encoded. Returns null (nothing
 *  stored) when the salt secret or the IP header is absent. */
async function hashIp(request: Request, salt: string | undefined): Promise<string | null> {
  if (!salt) return null;
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return null;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface LogEntry {
  question: string;
  answer: string;
  source: string;
  /** Which curated intent/answer matched — null until intent matching or AI exists. */
  matchedIntent: string | null;
  sessionId: string | null;
  page: string | null;
  /** AI model that produced the answer — null until Workers AI exists. */
  model: string | null;
  latencyMs: number;
}

/** Best-effort insert, run via ctx.waitUntil off the response path. Any
 *  failure is warned and swallowed — logging must never break an answer. */
async function logQuestion(env: Env, request: Request, entry: LogEntry): Promise<void> {
  const db = env.ASK_FREDRIK_DB;
  if (!db) return;
  try {
    const ipHash = await hashIp(request, env.IP_HASH_SALT);
    await db
      .prepare(
        `INSERT INTO ask_fredrik_logs
           (id, created_at, question, answer, source, matched_intent,
            session_id, page, referrer, user_agent, ip_hash, model, latency_ms)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`
      )
      .bind(
        crypto.randomUUID(),
        new Date().toISOString(),
        entry.question,
        entry.answer,
        entry.source,
        entry.matchedIntent,
        entry.sessionId,
        entry.page,
        request.headers.get('Referer'),
        request.headers.get('User-Agent'),
        ipHash,
        entry.model,
        entry.latencyMs
      )
      .run();
  } catch (err) {
    console.warn('ask_fredrik_logs insert failed:', err);
  }
}

/** Body shape for POST /ask. */
interface AskRequestBody {
  question?: unknown;
  sessionId?: unknown;
  page?: unknown;
}

/** Optional client-supplied string: kept only if it's a string, length-capped. */
function optionalString(value: unknown, maxLength: number): string | null {
  return typeof value === 'string' && value !== '' ? value.slice(0, maxLength) : null;
}

async function handleAsk(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  origin: string | null
): Promise<Response> {
  const startedAt = Date.now();

  let body: AskRequestBody;
  try {
    body = await request.json<AskRequestBody>();
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400, origin);
  }

  if (typeof body.question !== 'string') {
    return json({ error: '"question" is required and must be a string.' }, 400, origin);
  }
  const question = body.question.trim();
  if (question === '') {
    return json({ error: '"question" must not be empty.' }, 400, origin);
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return json(
      { error: `"question" must be ${MAX_QUESTION_LENGTH} characters or fewer.` },
      400,
      origin
    );
  }

  // v2 (Workers AI): replace the constant below with a guarded
  // `env.AI.run(...)` call using APPROVED_CONTEXT as the system prompt,
  // keeping FALLBACK_ANSWER as the catch-all — see README.md.
  const answer = FALLBACK_ANSWER;
  const source = 'fallback';

  // Log after the response is sent — never on the answer's critical path.
  ctx.waitUntil(
    logQuestion(env, request, {
      question,
      answer,
      source,
      matchedIntent: null,
      sessionId: optionalString(body.sessionId, 100),
      page: optionalString(body.page, 300),
      model: null,
      latencyMs: Date.now() - startedAt,
    })
  );

  return json({ answer, source }, 200, origin);
}

async function handleAdminLogs(request: Request, env: Env, url: URL): Promise<Response> {
  // No CORS headers anywhere in this handler: browser pages on other origins
  // can never read these responses.
  if (!env.ADMIN_TOKEN) {
    return json({ error: 'Admin endpoint is not configured.' }, 503, null);
  }
  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${env.ADMIN_TOKEN}`) {
    return json({ error: 'Unauthorized.' }, 401, null, { 'WWW-Authenticate': 'Bearer' });
  }
  if (!env.ASK_FREDRIK_DB) {
    return json({ error: 'Logging database is not configured.' }, 503, null);
  }

  let limit = DEFAULT_LOG_LIMIT;
  const limitParam = url.searchParams.get('limit');
  if (limitParam !== null) {
    const parsed = Number.parseInt(limitParam, 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LOG_LIMIT) {
      return json(
        { error: `"limit" must be an integer between 1 and ${MAX_LOG_LIMIT}.` },
        400,
        null
      );
    }
    limit = parsed;
  }

  try {
    const { results } = await env.ASK_FREDRIK_DB.prepare(
      `SELECT id, created_at, question, answer, source, matched_intent,
              session_id, page, referrer, user_agent, ip_hash, model, latency_ms
       FROM ask_fredrik_logs
       ORDER BY created_at DESC
       LIMIT ?1`
    )
      .bind(limit)
      .all();
    return json({ count: results.length, logs: results }, 200, null);
  } catch (err) {
    console.warn('ask_fredrik_logs query failed:', err);
    return json({ error: 'Failed to read logs.' }, 500, null);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/ask') {
      const origin = resolveCorsOrigin(request);
      if (request.method === 'OPTIONS') {
        const headers = new Headers({
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        });
        if (origin !== null) {
          headers.set('Access-Control-Allow-Origin', origin);
          headers.append('Vary', 'Origin');
        }
        return new Response(null, { status: 204, headers });
      }
      if (request.method !== 'POST') {
        return json({ error: 'Method not allowed. Use POST.' }, 405, origin, {
          Allow: 'POST, OPTIONS',
        });
      }
      return handleAsk(request, env, ctx, origin);
    }

    if (url.pathname === '/admin/logs') {
      if (request.method !== 'GET') {
        return json({ error: 'Method not allowed. Use GET.' }, 405, null, { Allow: 'GET' });
      }
      return handleAdminLogs(request, env, url);
    }

    if (url.pathname === '/' && request.method === 'GET') {
      return json(
        { status: 'ok', service: 'ask-fredrik-worker', endpoints: ['POST /ask', 'GET /admin/logs'] },
        200,
        resolveCorsOrigin(request)
      );
    }

    return json({ error: 'Not found.' }, 404, null);
  },
} satisfies ExportedHandler<Env>;
