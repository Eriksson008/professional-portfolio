import { matchStaticAnswer } from './matchStaticAnswer';

export { matchStaticAnswer } from './matchStaticAnswer';

export interface AskFredrikResult {
  answer: string;
  /** Where the answer came from — lets the UI adapt when an API exists. */
  source: 'static' | 'api';
}

/**
 * Build-time optional: when a future backend exists (e.g. a Cloudflare
 * Worker fronting an LLM), set VITE_ASK_FREDRIK_API_URL and the widget
 * upgrades itself. Unset (the default, and always on GitHub Pages v1),
 * answers come from the curated static knowledge base. No keys in the
 * bundle either way — the URL is public by design, secrets live behind it.
 */
const apiUrl: string | undefined = import.meta.env.VITE_ASK_FREDRIK_API_URL;

/**
 * One anonymous id per page load so the backend can group a conversation's
 * questions without any user identity attached. Optional in the API contract;
 * omitted (undefined) where crypto.randomUUID is unavailable.
 */
const sessionId: string | undefined =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : undefined;

/**
 * Ask a question. Static curated answers by default; if an API URL is
 * configured it is tried first and any failure falls back to static, so
 * the widget can never error out in front of a recruiter.
 */
export async function askFredrik(question: string): Promise<AskFredrikResult> {
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, sessionId, page: window.location.pathname }),
      });
      if (res.ok) {
        const data = (await res.json()) as { answer?: unknown };
        if (typeof data.answer === 'string' && data.answer.trim() !== '') {
          return { answer: data.answer, source: 'api' };
        }
      }
    } catch {
      // Network/CORS/parse failure — fall through to the static answer.
    }
  }
  return { answer: matchStaticAnswer(question), source: 'static' };
}
