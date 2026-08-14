/**
 * The assistant transcript's follow-the-conversation rule, as a pure function.
 *
 * It lives outside the component because it is the most bug-prone part of a
 * chat log and the only way to prove it is to run it: two of its rules exist
 * because the obvious version got them wrong. Same reason `scrollGlide.ts` and
 * `videoMediaTierForWidth` are extracted.
 */

/** Within this many px of the bottom counts as "following the conversation". */
export const FOLLOW_THRESHOLD = 56;

export interface FollowInput {
  /** Pixels of content below the viewport of the log. */
  distance: number;
  /** The previous `distance`, or Infinity when a new scroll has just begun. */
  lastDistance: number;
  /** Is a scroll we started ourselves still in flight? */
  autoScrolling: boolean;
  /** Should new turns pull the log down? */
  follow: boolean;
  threshold?: number;
}

export interface FollowState {
  autoScrolling: boolean;
  follow: boolean;
  /** Drives the jump-to-latest button. */
  atBottom: boolean;
}

/**
 * Resolve the next scroll state from one scroll event.
 *
 * Three rules, each earning its place:
 *
 *  1. Our own animation only ever *closes* the gap to the bottom. So it has
 *     landed once it is near, and anything that *opens* the gap mid-flight is
 *     the reader taking over. Without that second half, scrolling up while an
 *     answer is still being written left `follow` stuck on and the answer
 *     yanked the reader back down.
 *  2. `follow` is only ever set from a scroll the reader owns. Reading it from
 *     our own animation's events would clear it on the first frame, when the
 *     gap is still wide.
 *  3. While we are auto-scrolling, report `atBottom` as true. It is where the
 *     log is heading, and reporting the in-flight distance instead made the
 *     jump-to-latest button flash on screen during every answered turn.
 */
export function nextFollowState({
  distance,
  lastDistance,
  autoScrolling,
  follow,
  threshold = FOLLOW_THRESHOLD,
}: FollowInput): FollowState {
  const near = distance <= threshold;
  const reversed = distance > lastDistance + 1;
  const stillAuto = autoScrolling && !near && !reversed;
  return {
    autoScrolling: stillAuto,
    follow: stillAuto ? follow : near,
    atBottom: near || stillAuto,
  };
}
