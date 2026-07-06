/**
 * Ask Fredrik — Cloudflare Worker backend (v1).
 *
 * POST /ask  { question, sessionId?, page? }  →  { answer, source }
 *
 * v1 validates the request and returns a deterministic fallback answer
 * built from the approved public context below — it does not call any
 * AI model yet. The code is shaped so Workers AI can slot in later
 * (see "Upgrading to Workers AI" in the README): the answer is produced
 * behind a single seam, and the request already carries the fields a
 * logged/AI-backed version needs.
 *
 * Runs entirely on the Workers Free plan. No API keys, no secrets,
 * no paid services.
 */

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

/**
 * CORS allowlist: local development (any localhost/127.0.0.1 port — Vite
 * dev 5173, Vite preview 4173, the Docker/nginx site on 8790) plus the
 * GitHub Pages portfolio origin. Everything else gets no CORS headers.
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

/** Body shape for POST /ask. sessionId and page are accepted for future
 *  logging/analytics behind the AI path; v1 validates but does not store them. */
interface AskRequestBody {
  question?: unknown;
  sessionId?: unknown;
  page?: unknown;
}

async function handleAsk(request: Request, origin: string | null): Promise<Response> {
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
  return json({ answer: FALLBACK_ANSWER, source: 'fallback' }, 200, origin);
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const origin = resolveCorsOrigin(request);

    // CORS preflight for any route.
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

    if (url.pathname === '/ask') {
      if (request.method !== 'POST') {
        return json({ error: 'Method not allowed. Use POST.' }, 405, origin, {
          Allow: 'POST, OPTIONS',
        });
      }
      return handleAsk(request, origin);
    }

    if (url.pathname === '/' && request.method === 'GET') {
      return json(
        { status: 'ok', service: 'ask-fredrik-worker', endpoints: ['POST /ask'] },
        200,
        origin
      );
    }

    return json({ error: 'Not found.' }, 404, origin);
  },
} satisfies ExportedHandler;
