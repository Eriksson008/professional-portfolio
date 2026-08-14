import assert from 'node:assert/strict';
import { test } from 'node:test';
import { stickyMediaProgress, viewportTravelProgress } from './scrollGlide.ts';

test('viewport travel progress spans entry to the reveal endpoint', () => {
  const vh = 844;
  const end = 0.18;
  assert.equal(viewportTravelProgress(vh, vh, end), 0);
  assert.equal(viewportTravelProgress(vh - (vh * (1 - end)) / 2, vh, end), 0.5);
  assert.equal(viewportTravelProgress(vh * end, vh, end), 1);
});

test('viewport travel progress clamps beyond both endpoints', () => {
  assert.equal(viewportTravelProgress(900, 844, 0.18), 0);
  assert.equal(viewportTravelProgress(-200, 844, 0.18), 1);
  assert.equal(viewportTravelProgress(100, 0, 0.18), 1);
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
