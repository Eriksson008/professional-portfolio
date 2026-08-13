import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createFrameScheduler, mediaFrameDuration } from './scrollGlide.ts';
import { videoMediaTierForWidth } from './useDesktopViewport.ts';

test('video media tiers switch at the documented boundaries', () => {
  assert.equal(videoMediaTierForWidth(390), 'small');
  assert.equal(videoMediaTierForWidth(719), 'small');
  assert.equal(videoMediaTierForWidth(720), 'medium');
  assert.equal(videoMediaTierForWidth(1199), 'medium');
  assert.equal(videoMediaTierForWidth(1200), 'large');
  assert.equal(videoMediaTierForWidth(1440), 'large');
});

test('frame duration follows verified source cadence', () => {
  assert.equal(mediaFrameDuration(24), 1 / 24);
  assert.equal(mediaFrameDuration(60), 1 / 60);
  assert.equal(mediaFrameDuration(0), 0);
});

test('frame scheduler coalesces calls and can be scheduled again after painting', () => {
  const queued = new Map<number, FrameRequestCallback>();
  let nextHandle = 1;
  let calls = 0;
  const scheduler = createFrameScheduler(
    () => calls++,
    (callback) => {
      const handle = nextHandle++;
      queued.set(handle, callback);
      return handle;
    },
    (handle) => queued.delete(handle)
  );

  scheduler.schedule();
  scheduler.schedule();
  assert.equal(queued.size, 1);
  const first = queued.get(1);
  queued.delete(1);
  first?.(0);
  assert.equal(calls, 1);

  scheduler.schedule();
  assert.equal(queued.size, 1);
  const second = queued.get(2);
  queued.delete(2);
  second?.(16.7);
  assert.equal(calls, 2);
});

test('frame scheduler cancellation drops pending work', () => {
  const queued = new Map<number, FrameRequestCallback>();
  const scheduler = createFrameScheduler(
    () => assert.fail('cancelled callback should not run'),
    (callback) => {
      queued.set(7, callback);
      return 7;
    },
    (handle) => queued.delete(handle)
  );
  scheduler.schedule();
  scheduler.cancel();
  assert.equal(queued.size, 0);
});
