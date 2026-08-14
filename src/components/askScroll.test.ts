import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FOLLOW_THRESHOLD, nextFollowState } from './askScroll.ts';

const INF = Number.POSITIVE_INFINITY;
const at = (distance: number, over: Partial<Parameters<typeof nextFollowState>[0]> = {}) =>
  nextFollowState({ distance, lastDistance: INF, autoScrolling: false, follow: true, ...over });

test('sitting at the bottom keeps following', () => {
  const state = at(0);
  assert.equal(state.follow, true);
  assert.equal(state.atBottom, true);
  assert.equal(state.autoScrolling, false);
});

test('the threshold is inclusive on both sides', () => {
  assert.equal(at(FOLLOW_THRESHOLD).atBottom, true);
  assert.equal(at(FOLLOW_THRESHOLD + 1).atBottom, false);
});

test('a reader scrolling up stops the log following them down', () => {
  const state = at(900);
  assert.equal(state.follow, false);
  assert.equal(state.atBottom, false);
});

test('scrolling back to the bottom re-arms following', () => {
  assert.equal(at(4, { follow: false }).follow, true);
});

// Rule 2 — our own animation's scroll events must not clear `follow`.
test('an in-flight auto-scroll does not clear follow while the gap is still wide', () => {
  const state = at(900, { autoScrolling: true, lastDistance: INF, follow: true });
  assert.equal(state.autoScrolling, true, 'still in flight');
  assert.equal(state.follow, true, 'follow survives the first frame');
});

test('an auto-scroll that reaches the bottom stops being in flight', () => {
  const state = at(3, { autoScrolling: true, lastDistance: 400 });
  assert.equal(state.autoScrolling, false);
  assert.equal(state.follow, true);
});

// Rule 1 — the case that shipped broken: scrolling up mid-generation.
test('a reader who scrolls up mid-auto-scroll takes control immediately', () => {
  // Gap was closing (800 -> ...), then the reader opens it back up to 1200.
  const state = at(1200, { autoScrolling: true, lastDistance: 800, follow: true });
  assert.equal(state.autoScrolling, false, 'our animation is abandoned');
  assert.equal(state.follow, false, 'the incoming answer must not yank them');
  assert.equal(state.atBottom, false, 'so the jump button is offered instead');
});

test('a closing gap is not mistaken for a reversal', () => {
  const state = at(400, { autoScrolling: true, lastDistance: 800, follow: true });
  assert.equal(state.autoScrolling, true);
  assert.equal(state.follow, true);
});

test('sub-pixel jitter during an auto-scroll is not a reversal', () => {
  // Fractional scrollTop makes distance wobble; only a real move counts.
  const state = at(400.6, { autoScrolling: true, lastDistance: 400, follow: true });
  assert.equal(state.autoScrolling, true, '0.6px is jitter, not the reader');
});

test('a fresh auto-scroll baseline of Infinity is never read as a reversal', () => {
  const state = at(1500, { autoScrolling: true, lastDistance: INF, follow: true });
  assert.equal(state.autoScrolling, true);
});

// Rule 3 — the jump-to-latest button must not flash on every answered turn.
test('the jump button stays hidden while we are scrolling to the latest turn', () => {
  const state = at(1200, { autoScrolling: true, lastDistance: INF, follow: true });
  assert.equal(state.atBottom, true, 'reported as at-bottom: that is where it is going');
});

test('the jump button appears the moment the reader takes over', () => {
  const state = at(1200, { autoScrolling: true, lastDistance: 300, follow: true });
  assert.equal(state.atBottom, false);
});

test('the state machine is total: every input yields a defined triple', () => {
  for (const distance of [0, 1, 56, 57, 1000, INF]) {
    for (const lastDistance of [0, 500, INF]) {
      for (const autoScrolling of [true, false]) {
        for (const follow of [true, false]) {
          const state = nextFollowState({ distance, lastDistance, autoScrolling, follow });
          assert.equal(typeof state.follow, 'boolean');
          assert.equal(typeof state.atBottom, 'boolean');
          assert.equal(typeof state.autoScrolling, 'boolean');
          // An idle log never claims to be auto-scrolling.
          if (!autoScrolling) assert.equal(state.autoScrolling, false);
        }
      }
    }
  }
});
