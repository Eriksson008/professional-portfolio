/**
 * Ask Fredrik — Worker-side question matching.
 *
 * Two cheap, deterministic passes that run before any AI call:
 *   1. isSensitiveQuestion — blocks salary/private/confidential questions.
 *   2. matchIntent — answers common recruiter questions from the curated set.
 *
 * Same normalization and keyword-scoring approach as the frontend's
 * src/lib/askFredrik.ts, so a question answered statically here reads the
 * same as it did in the widget's offline mode. Deliberately simple keyword
 * matching — no NLP, no fuzzy scoring.
 */

import { CURATED_ANSWERS, SENSITIVE_KEYWORDS } from './fredrik-context';

/** Lowercase, strip apostrophes/punctuation, collapse whitespace. */
export function normalize(question: string): string {
  return question
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s/+#.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Pad short single words so "ai" can't match inside "maintain". */
function asNeedle(keyword: string): string {
  return keyword.length <= 4 && !keyword.includes(' ') ? ` ${keyword} ` : keyword;
}

/** True when the question touches a sensitive/off-limits topic. */
export function isSensitiveQuestion(question: string): boolean {
  const haystack = ` ${normalize(question)} `;
  return SENSITIVE_KEYWORDS.some((keyword) => haystack.includes(asNeedle(keyword)));
}

export interface IntentMatch {
  intent: string;
  answer: string;
}

/**
 * Keyword scoring over the curated answers: one point per matched phrase,
 * an exact suggested-question match trumps everything, ties keep the
 * earliest (most recruiter-relevant) entry. Null when nothing matches —
 * the caller then tries AI (if enabled) or the curated fallback.
 */
export function matchIntent(question: string): IntentMatch | null {
  const normalized = normalize(question);
  if (normalized === '') return null;
  const haystack = ` ${normalized} `;

  let best: { score: number; match: IntentMatch } | null = null;
  for (const entry of CURATED_ANSWERS) {
    if (normalize(entry.question) === normalized) {
      return { intent: entry.intent, answer: entry.answer };
    }
    let score = 0;
    for (const keyword of entry.keywords) {
      if (haystack.includes(asNeedle(keyword))) score += 1;
    }
    if (score > 0 && (best === null || score > best.score)) {
      best = { score, match: { intent: entry.intent, answer: entry.answer } };
    }
  }
  return best ? best.match : null;
}
