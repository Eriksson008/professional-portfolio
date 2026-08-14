import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allPrompts, followUpPrompts, starterPrompts } from './askPrompts.ts';
import { matchCuratedId, matchStaticAnswer } from './matchStaticAnswer.ts';
import { curatedAnswers, unknownAnswer } from '../data/fredrikContext.ts';

test('the starter grid is exactly four resolvable prompts', () => {
  assert.equal(starterPrompts.length, 4);
  assert.deepEqual(
    starterPrompts.map((p) => p.id),
    ['strengths', 'role-fit', 'projects', 'why-interview']
  );
});

test('every prompt keeps a sendable question and a non-empty label', () => {
  for (const prompt of allPrompts) {
    assert.notEqual(prompt.question.trim(), '', `${prompt.id} has a question`);
    assert.notEqual(prompt.label.trim(), '', `${prompt.id} has a label`);
  }
});

test('card labels stay within the 30-character budget', () => {
  // A bound, not a line count: the card grows to fit and never clips, so this
  // guards against a label long enough to unbalance the 2x2 grid, not against
  // wrapping. Actual line count is a rendering question, checked in-browser.
  for (const prompt of starterPrompts) {
    assert.ok(prompt.label.length <= 30, `${prompt.id} label is ${prompt.label.length} chars`);
  }
});

test('a starter card still sends the full curated question', () => {
  // The label is display-only: the matcher must keep resolving the sent text.
  for (const prompt of starterPrompts) {
    assert.equal(matchCuratedId(prompt.question), prompt.id);
  }
});

test('follow-ups lead with the topic’s own suggestions', () => {
  const followUps = followUpPrompts('projects', []);
  assert.equal(followUps[0]?.id, 'stack');
  assert.deepEqual(
    followUps.slice(0, 3).map((p) => p.id),
    ['stack', 'strengths', 'why-interview']
  );
});

test('follow-ups never repeat the answered topic or an asked one', () => {
  const followUps = followUpPrompts('projects', ['strengths', 'stack']);
  const ids = followUps.map((p) => p.id);
  assert.ok(!ids.includes('projects'));
  assert.ok(!ids.includes('strengths'));
  assert.ok(!ids.includes('stack'));
  assert.equal(new Set(ids).size, ids.length);
});

test('follow-ups fall back to canonical order for an unknown topic', () => {
  assert.deepEqual(
    followUpPrompts(undefined, []).map((p) => p.id),
    allPrompts.map((p) => p.id)
  );
});

test('follow-ups run out cleanly once everything has been asked', () => {
  const asked = allPrompts.map((p) => p.id);
  assert.deepEqual(followUpPrompts('projects', asked), []);
});

test('every declared follow-up id resolves to a surfaceable prompt', () => {
  const surfaceable = new Set(allPrompts.map((p) => p.id));
  for (const entry of curatedAnswers) {
    for (const id of entry.followUps ?? []) {
      assert.ok(surfaceable.has(id), `${entry.id} → ${id} is surfaceable`);
      assert.notEqual(id, entry.id, `${entry.id} does not suggest itself`);
    }
  }
});

test('matchCuratedId agrees with the answer the matcher returns', () => {
  const byId = new Map(curatedAnswers.map((e) => [e.id, e]));
  for (const question of ['what does fredrik do well', 'tell me about his leadership', 'react']) {
    const id = matchCuratedId(question);
    assert.ok(id, `${question} matched a topic`);
    assert.equal(matchStaticAnswer(question), byId.get(id)!.answer);
  }
});

test('an unmatched question yields no topic and the catch-all answer', () => {
  assert.equal(matchCuratedId('zzzz'), undefined);
  assert.equal(matchStaticAnswer('zzzz'), unknownAnswer);
  assert.equal(matchCuratedId('   '), undefined);
  assert.equal(matchStaticAnswer('   '), unknownAnswer);
});
