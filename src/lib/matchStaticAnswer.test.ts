import assert from 'node:assert/strict';
import { test } from 'node:test';
import { matchStaticAnswer } from './matchStaticAnswer.ts';

test('the static fallback explains the 16K highlight consistently', () => {
  for (const question of [
    'can you tell me about your 16k lines of code under your highlights ?',
    'What are the 16,000 lines about?',
    'Explain the lines of code highlight',
  ]) {
    const answer = matchStaticAnswer(question);
    assert.match(answer, /not the size of this portfolio/i);
    assert.match(answer, /client onboarding platform/i);
    assert.match(answer, /144 commits/i);
  }
});

test('the static fallback does not claim access to prior prompts', () => {
  for (const question of [
    'Do you have history saved?',
    'what was my last two prompts',
    'Can you remember our conversation?',
  ]) {
    const answer = matchStaticAnswer(question);
    assert.match(answer, /don’t receive earlier messages/i);
    assert.match(answer, /not used as conversational memory/i);
  }
});

test('memory capability outranks named skill and project keywords', () => {
  for (const question of [
    'What did I ask about React?',
    'Can you remember our conversation about Homebase?',
  ]) {
    assert.match(matchStaticAnswer(question), /don.t receive earlier messages/i);
  }
});

test('generic project line-count questions do not inherit the onboarding metric', () => {
  const answer = matchStaticAnswer('How many lines of code are in Homebase?');
  assert.doesNotMatch(answer, /~16K net authored lines/i);
});
