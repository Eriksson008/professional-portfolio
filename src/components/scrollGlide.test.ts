import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inFlowMediaProgress, stickyMediaProgress } from './scrollGlide.ts';

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

test('sticky media progress spans the full runway travel', () => {
  const viewportHeight = 844;
  const mediaHeight = 219;
  const travel = 1711;
  const runwayHeight = mediaHeight + travel;
  const stickyTop = viewportHeight - mediaHeight;

  assert.equal(stickyMediaProgress(stickyTop, runwayHeight, mediaHeight, viewportHeight), 0);
  assert.equal(
    stickyMediaProgress(stickyTop - travel / 2, runwayHeight, mediaHeight, viewportHeight),
    0.5
  );
  assert.equal(
    stickyMediaProgress(stickyTop - travel, runwayHeight, mediaHeight, viewportHeight),
    1
  );
  assert.equal(
    stickyMediaProgress(stickyTop - travel - 200, runwayHeight, mediaHeight, viewportHeight),
    1
  );
});

test('sticky media progress can use a shorter matched travel and hold afterward', () => {
  const viewportHeight = 650;
  const mediaHeight = 288;
  const targetTravel = viewportHeight * 1.716;
  const runwayHeight = mediaHeight + 1403;
  const stickyTop = viewportHeight - mediaHeight;

  assert.equal(
    stickyMediaProgress(
      stickyTop - targetTravel / 2,
      runwayHeight,
      mediaHeight,
      viewportHeight,
      targetTravel
    ),
    0.5
  );
  assert.equal(
    stickyMediaProgress(
      stickyTop - targetTravel,
      runwayHeight,
      mediaHeight,
      viewportHeight,
      targetTravel
    ),
    1
  );
});
