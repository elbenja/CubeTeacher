// Pure analytics logic. No DOM, no PostHog, no globals -- everything here is
// unit-tested headlessly by analytics-core.test.mjs. The impure shell that
// binds this to the browser and to PostHog lives in analytics.js.

// How long after the last interaction a visible tab still counts as "being
// watched". Long enough to cover reading the teach card and watching a slow
// algorithm run; short enough that a tab left open overnight scores nothing.
export const IDLE_MS = 60000;

// Time is measured by heartbeat rather than by stopwatch, and the difference
// matters. A stopwatch clamped against overnight tabs also clamps genuine
// attentive viewing -- five minutes of study would record as one. Here each
// tick is judged on its own: it counts only if the tab is visible and the user
// did something recently, so attentive viewing accrues without limit and idle
// time accrues nothing.
export function createHeartbeat({ now = () => Date.now(), idleMs = IDLE_MS } = {}) {
  let seconds = 0;
  let lastActivity = now();
  let visible = true;
  return {
    activity() { lastActivity = now(); },
    // Coming back to the tab is itself a sign of attention, so it re-arms the
    // idle window; leaving does not need to touch it.
    setVisible(v) { visible = !!v; if (visible) lastActivity = now(); },
    tick() { if (visible && now() - lastActivity < idleMs) seconds += 1; },
    seconds() { return seconds; },
    reset() { seconds = 0; lastActivity = now(); }
  };
}
