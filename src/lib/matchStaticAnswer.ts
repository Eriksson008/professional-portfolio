import { curatedAnswers, unknownAnswer } from '../data/fredrikContext.ts';
import type { CuratedAnswer } from '../data/fredrikContext.ts';

/** Lowercase, strip punctuation/diacritic quotes, collapse whitespace. */
function normalize(question: string): string {
  return question
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s/+#.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Keyword scoring over the curated answers; exact suggested questions win. */
function matchCuratedEntry(question: string): CuratedAnswer | null {
  const normalized = ` ${normalize(question)} `;
  if (normalized.trim() === '') return null;

  let best: { score: number; entry: CuratedAnswer } | null = null;
  for (const entry of curatedAnswers) {
    if (entry.question && normalize(entry.question) === normalized.trim()) {
      return entry;
    }
    let score = 0;
    for (const keyword of entry.keywords) {
      const needle = keyword.length <= 4 && !keyword.includes(' ') ? ` ${keyword} ` : keyword;
      if (normalized.includes(needle)) score += 1;
    }
    if (score > 0 && (best === null || score > best.score)) {
      best = { score, entry };
    }
  }
  return best ? best.entry : null;
}

/** The curated answer for a question, or the catch-all when nothing matches. */
export function matchStaticAnswer(question: string): string {
  return matchCuratedEntry(question)?.answer ?? unknownAnswer;
}

/**
 * Which curated topic a free-text question landed on, if any. The UI uses it
 * to pick follow-ups and to stop re-offering a topic that was just answered —
 * it never changes which answer is returned, and it is deliberately advisory:
 * when the Worker answers, the topic is still the best anchor available.
 */
export function matchCuratedId(question: string): string | undefined {
  return matchCuratedEntry(question)?.id;
}
