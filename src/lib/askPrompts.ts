import { curatedAnswers, starterPromptIds } from '../data/fredrikContext.ts';

/**
 * A prompt as the UI needs it: the short `label` goes on the card, the full
 * `question` is what gets sent to the matcher and the Worker. Keeping them
 * apart is what lets the phone grid stay two lines tall without changing the
 * text the backend sees.
 */
export interface AskPrompt {
  id: string;
  question: string;
  label: string;
}

/** Every surfaceable topic, in the curated file's own order. */
export const allPrompts: AskPrompt[] = curatedAnswers
  .filter((entry) => entry.question !== '')
  .map((entry) => ({
    id: entry.id,
    question: entry.question,
    label: entry.label ?? entry.question,
  }));

const promptById = new Map(allPrompts.map((prompt) => [prompt.id, prompt]));
const followUpIdsByTopic = new Map(
  curatedAnswers.filter((entry) => entry.followUps).map((entry) => [entry.id, entry.followUps!])
);

/** The opening grid — a fixed, hand-picked set, not "the first N". */
export const starterPrompts: AskPrompt[] = starterPromptIds
  .map((id) => promptById.get(id))
  .filter((prompt): prompt is AskPrompt => prompt !== undefined);

/**
 * What to offer after an answer: the topic's own suggestions first, then
 * anything else still unasked, with the answered topic and everything already
 * asked removed. Returns the whole remaining list — the caller shows the first
 * few and can expand the rest — so "no follow-ups left" is an empty array
 * rather than a special case.
 */
export function followUpPrompts(
  topicId: string | undefined,
  asked: readonly string[]
): AskPrompt[] {
  const seen = new Set(asked);
  if (topicId) seen.add(topicId);

  const ordered: AskPrompt[] = [];
  const take = (id: string) => {
    if (seen.has(id)) return;
    const prompt = promptById.get(id);
    if (!prompt) return;
    seen.add(id);
    ordered.push(prompt);
  };

  if (topicId) followUpIdsByTopic.get(topicId)?.forEach(take);
  allPrompts.forEach((prompt) => take(prompt.id));
  return ordered;
}
