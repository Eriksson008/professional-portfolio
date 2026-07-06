import { curatedAnswers, unknownAnswer } from '../data/fredrikContext';

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

/** Lowercase, strip punctuation/diacritic quotes, collapse whitespace. */
function normalize(question: string): string {
  return question
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s/+#.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Keyword scoring over the curated answers: one point per matched phrase,
 * with an exact suggested-question match trumping everything. Ties keep
 * the earliest (most recruiter-relevant) entry.
 */
export function matchStaticAnswer(question: string): string {
  const normalized = ` ${normalize(question)} `;
  if (normalized.trim() === '') return unknownAnswer;

  let best: { score: number; answer: string } | null = null;
  for (const entry of curatedAnswers) {
    if (entry.question && normalize(entry.question) === normalized.trim()) {
      return entry.answer;
    }
    let score = 0;
    for (const keyword of entry.keywords) {
      // Pad single short words so "ai" can't match inside "maintain".
      const needle = keyword.length <= 4 && !keyword.includes(' ') ? ` ${keyword} ` : keyword;
      if (normalized.includes(needle)) score += 1;
    }
    if (score > 0 && (best === null || score > best.score)) {
      best = { score, answer: entry.answer };
    }
  }
  return best ? best.answer : unknownAnswer;
}

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
        body: JSON.stringify({ question }),
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
