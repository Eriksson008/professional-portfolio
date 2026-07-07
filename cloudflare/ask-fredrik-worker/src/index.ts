/**
 * Ask Fredrik — Cloudflare Worker backend.
 *
 * POST /ask         { question, sessionId?, page? }  →  { answer, source, matchedIntent? }
 * GET  /admin/logs  Bearer ADMIN_TOKEN               →  { count, logs }
 *
 * Answer pipeline for a valid question, in order:
 *   1. rate limit   → source "rate_limited"  (in-memory, best-effort)
 *   2. sensitive    → source "blocked"       (salary/private/confidential)
 *   3. curated      → source "static"        (curated Q&A, skill/project
 *                     knowledge base, and the conservative not-confirmed
 *                     answer — see resolveLocalAnswer in matcher.ts)
 *   4. Workers AI   → source "ai"            (only if enabled + bound; guarded)
 *   5. fallback     → source "fallback"      (deterministic curated answer)
 *
 * Every valid question is logged to D1 (best-effort, off the response path).
 * Runs entirely on the Workers/D1/Workers-AI Free plans. No API keys in code
 * — the two secrets (ADMIN_TOKEN, IP_HASH_SALT) live in Worker secrets, and
 * every feature degrades gracefully when its binding, var, or secret is
 * absent: no AI binding or ASK_FREDRIK_AI_ENABLED != "true" simply means
 * step 4 is skipped.
 */

import { FALLBACK_ANSWER, RATE_LIMITED_ANSWER, SYSTEM_PROMPT } from './fredrik-context.ts';
import { resolveLocalAnswer } from './matcher.ts';

/** Minimal structural type for the Workers AI binding — keeps the Worker
 *  compiling and running whether or not the binding is configured. */
interface AiBinding {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
}

export interface Env {
  /** D1 question log. Optional: without the binding the Worker still answers,
   *  it just doesn't log. */
  ASK_FREDRIK_DB?: D1Database;
  /** Workers AI binding. Optional: without it, unmatched questions get the
   *  curated fallback answer. */
  AI?: AiBinding;
  /** Secret: bearer token for GET /admin/logs. Missing → endpoint returns 503. */
  ADMIN_TOKEN?: string;
  /** Secret: salt for hashing the connecting IP. Missing → ip_hash is not stored.
   *  Raw IPs are never stored either way. */
  IP_HASH_SALT?: string;

  // Non-secret tuning vars (wrangler.jsonc "vars"). All optional — safe
  // defaults apply when unset or unparseable.
  /** "true" enables Workers AI for unmatched questions. Anything else: off. */
  ASK_FREDRIK_AI_ENABLED?: string;
  /** Workers AI model id. Default: a small free instruct model. */
  ASK_FREDRIK_MODEL?: string;
  /** AI call timeout in ms. Default 6000. */
  ASK_FREDRIK_AI_TIMEOUT_MS?: string;
  /** Max tokens the model may generate. Default 250. */
  ASK_FREDRIK_MAX_OUTPUT_TOKENS?: string;
  /** Rate-limit window in seconds. Default 60. */
  ASK_FREDRIK_RATE_LIMIT_WINDOW_SECONDS?: string;
  /** Max valid /ask requests per window per client. Default 10. */
  ASK_FREDRIK_RATE_LIMIT_MAX_REQUESTS?: string;
  /** FIFO retention for the D1 log: newest N rows are kept, older rows are
   *  trimmed after each insert. Default 1000. "0" disables trimming. */
  ASK_FREDRIK_LOG_MAX_ROWS?: string;
}

type AskSource = 'ai' | 'fallback' | 'static' | 'blocked' | 'rate_limited';

const DEFAULT_AI_MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8';
const DEFAULT_AI_TIMEOUT_MS = 6000;
const DEFAULT_MAX_OUTPUT_TOKENS = 250;
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 10;
const DEFAULT_LOG_MAX_ROWS = 1000;

const MAX_QUESTION_LENGTH = 500;
const DEFAULT_LOG_LIMIT = 100;
const MAX_LOG_LIMIT = 100;

/** Integer env var with a fallback and sane bounds (unset/garbage → fallback). */
function envInt(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

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
 *  stored) when the salt or the IP header is absent. */
async function hashIp(request: Request, salt: string | undefined): Promise<string | null> {
  if (!salt) return null;
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return null;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * In-memory sliding-window rate limiter — basic abuse protection, not
 * enterprise-grade bot protection. State is per Worker isolate and vanishes
 * on eviction, so it's best-effort by design: free, zero-latency, and good
 * enough to stop one client burning the Workers AI daily allocation. Clients
 * are keyed by sessionId and by a salted IP hash (using IP_HASH_SALT when
 * set, otherwise a random per-isolate salt) — raw IPs are never stored, in
 * memory or anywhere else. Only /ask is limited; /admin/logs is untouched.
 */
const RATE_BUCKETS = new Map<string, number[]>();

// Lazily created inside a handler — the Workers runtime forbids generating
// random values in global scope.
let ephemeralRateSalt: string | null = null;
function getEphemeralRateSalt(): string {
  ephemeralRateSalt ??= crypto.randomUUID();
  return ephemeralRateSalt;
}

function isRateLimited(keys: string[], windowMs: number, maxRequests: number, now: number): boolean {
  let limited = false;
  for (const key of keys) {
    const recent = (RATE_BUCKETS.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= maxRequests) limited = true;
    recent.push(now);
    RATE_BUCKETS.set(key, recent);
  }
  // Bound memory: drop buckets whose entries have all aged out.
  if (RATE_BUCKETS.size > 1000) {
    for (const [key, stamps] of RATE_BUCKETS) {
      if (stamps.every((t) => now - t >= windowMs)) RATE_BUCKETS.delete(key);
    }
  }
  return limited;
}

/**
 * Guarded Workers AI call: strict system prompt + approved context + the
 * question — nothing else (no logs, tokens, hashes, or metadata). Timeout,
 * empty/invalid responses, quota errors, and thrown errors all resolve to
 * null so the caller falls back. No retries, no streaming.
 */
async function callWorkersAi(env: Env, question: string): Promise<{ answer: string; model: string } | null> {
  const ai = env.AI;
  if (!ai) return null;
  const model = env.ASK_FREDRIK_MODEL || DEFAULT_AI_MODEL;
  const timeoutMs = envInt(env.ASK_FREDRIK_AI_TIMEOUT_MS, DEFAULT_AI_TIMEOUT_MS, 500, 30000);
  const maxTokens = envInt(env.ASK_FREDRIK_MAX_OUTPUT_TOKENS, DEFAULT_MAX_OUTPUT_TOKENS, 16, 1024);
  try {
    const result = await Promise.race([
      ai.run(model, {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question },
        ],
        max_tokens: maxTokens,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Workers AI timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
    const answer = extractAiText(result);
    return answer ? { answer, model } : null;
  } catch (err) {
    console.warn('Workers AI call failed:', err);
    return null;
  }
}

/** Pull the generated text out of a Workers AI result; empty string if the
 *  shape is unexpected. Text-generation models return { response: string }. */
function extractAiText(result: unknown): string {
  if (typeof result === 'string') return result.trim();
  if (typeof result === 'object' && result !== null && 'response' in result) {
    const response = (result as { response: unknown }).response;
    if (typeof response === 'string') return response.trim();
  }
  return '';
}

interface LogEntry {
  question: string;
  answer: string;
  source: AskSource;
  /** Curated intent that matched, or "sensitive" for blocked questions. */
  matchedIntent: string | null;
  sessionId: string | null;
  page: string | null;
  /** AI model that produced the answer — null unless source is "ai". */
  model: string | null;
  latencyMs: number;
}

/** Best-effort insert + FIFO trim, run via ctx.waitUntil off the response
 *  path. The trim keeps only the newest ASK_FREDRIK_LOG_MAX_ROWS rows
 *  (default 1000, "0" disables), so the log is a rolling window rather than
 *  an ever-growing archive. Both statements run in one transactional batch.
 *  Any failure is warned and swallowed — logging must never break an answer. */
async function logQuestion(env: Env, request: Request, entry: LogEntry): Promise<void> {
  const db = env.ASK_FREDRIK_DB;
  if (!db) return;
  try {
    const ipHash = await hashIp(request, env.IP_HASH_SALT);
    const insert = db
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
      );

    const maxRows = envInt(env.ASK_FREDRIK_LOG_MAX_ROWS, DEFAULT_LOG_MAX_ROWS, 0, 100000);
    const statements = [insert];
    if (maxRows > 0) {
      // Cheap on a capped table: created_at is indexed and the table never
      // holds more than maxRows + a handful of rows.
      statements.push(
        db
          .prepare(
            `DELETE FROM ask_fredrik_logs
             WHERE id NOT IN (
               SELECT id FROM ask_fredrik_logs
               ORDER BY created_at DESC, id DESC
               LIMIT ?1
             )`
          )
          .bind(maxRows)
      );
    }
    await db.batch(statements);
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

  const sessionId = optionalString(body.sessionId, 100);
  const page = optionalString(body.page, 300);

  /** Log (off the response path) and answer in one step. Always HTTP 200 —
   *  the widget renders the answer whatever the source. */
  const respond = (
    answer: string,
    source: AskSource,
    matchedIntent: string | null,
    model: string | null
  ): Response => {
    ctx.waitUntil(
      logQuestion(env, request, {
        question,
        answer,
        source,
        matchedIntent,
        sessionId,
        page,
        model,
        latencyMs: Date.now() - startedAt,
      })
    );
    return json(
      matchedIntent !== null ? { answer, source, matchedIntent } : { answer, source },
      200,
      origin
    );
  };

  // 1. Rate limit (valid questions only — validation errors don't count).
  const windowMs =
    envInt(env.ASK_FREDRIK_RATE_LIMIT_WINDOW_SECONDS, DEFAULT_RATE_LIMIT_WINDOW_SECONDS, 1, 3600) *
    1000;
  const maxRequests = envInt(
    env.ASK_FREDRIK_RATE_LIMIT_MAX_REQUESTS,
    DEFAULT_RATE_LIMIT_MAX_REQUESTS,
    1,
    1000
  );
  const rateKeys: string[] = [];
  if (sessionId) rateKeys.push(`s:${sessionId}`);
  const rateIpHash = await hashIp(request, env.IP_HASH_SALT ?? getEphemeralRateSalt());
  if (rateIpHash) rateKeys.push(`i:${rateIpHash}`);
  if (isRateLimited(rateKeys, windowMs, maxRequests, startedAt)) {
    return respond(RATE_LIMITED_ANSWER, 'rate_limited', null, null);
  }

  // 2–3. Deterministic local resolution: the sensitive filter, curated Q&A,
  // the skill/project knowledge base, and the conservative not-confirmed
  // answer — free, instant, and never reaches the model.
  const local = resolveLocalAnswer(question);
  if (local.kind === 'blocked') {
    return respond(local.answer, 'blocked', 'sensitive', null);
  }
  if (local.kind === 'match') {
    return respond(local.answer, 'static', local.intent, null);
  }

  // 4. Workers AI, only when explicitly enabled and bound.
  if ((env.ASK_FREDRIK_AI_ENABLED ?? '').toLowerCase() === 'true') {
    const ai = await callWorkersAi(env, question);
    if (ai) {
      return respond(ai.answer, 'ai', null, ai.model);
    }
  }

  // 5. Curated fallback — AI disabled, missing, timed out, or failed.
  return respond(FALLBACK_ANSWER, 'fallback', null, null);
}

async function handleAdminLogs(request: Request, env: Env, url: URL): Promise<Response> {
  // No CORS headers anywhere in this handler: browser pages on other origins
  // can never read these responses. The /ask rate limiter does not apply here.
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
