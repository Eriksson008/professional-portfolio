import { curatedAnswers, unknownAnswer } from '../data/fredrikContext.ts';

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
      const needle = keyword.length <= 4 && !keyword.includes(' ') ? ` ${keyword} ` : keyword;
      if (normalized.includes(needle)) score += 1;
    }
    if (score > 0 && (best === null || score > best.score)) {
      best = { score, answer: entry.answer };
    }
  }
  return best ? best.answer : unknownAnswer;
}
