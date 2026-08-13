import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inFlowMediaProgress } from './scrollGlide.ts';

test('in-flow media progress spans entry to full visibility', () => {
  assert.equal(inFlowMediaProgress(844, 220, 844), 0);
  assert.equal(inFlowMediaProgress(734, 220, 844), 0.5);
  assert.equal(inFlowMediaProgress(624, 220, 844), 1);
});

test('in-flow media progress clamps beyond both endpoints', () => {
  assert.equal(inFlowMediaProgress(900, 220, 844), 0);
  assert.equal(inFlowMediaProgress(400, 220, 844), 1);
  assert.equal(inFlowMediaProgress(400, 0, 844), 1);
});
