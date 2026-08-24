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

// GoatCounter records a path and an event flag and carries no properties, so
// every distinction this design wants has to survive as a path segment.
// Segments are lowercased and stripped to [a-z0-9-] because the dashboard
// groups by exact string: one stray space or capital splits a case's hits
// across two rows that look identical to a reader.
export function eventPath(...parts) {
  return parts
    .map(p => String(p == null ? '' : p).toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, ''))
    .filter(Boolean)
    .join('/');
}

// Buckets rather than seconds: a path per distinct second would be thousands
// of rows saying nothing. Four buckets answer the only question being asked --
// glanced at, read, or studied.
export const TIME_BUCKETS = Object.freeze([
  { max: 15, label: '0-15s' },
  { max: 60, label: '15-60s' },
  { max: 180, label: '1-3m' },
  { max: Infinity, label: '3m+' }
]);

export function timeBucket(seconds) {
  return TIME_BUCKETS.find(b => seconds < b.max).label;
}

// One hit per control per case viewing. Twenty arrow presses is one
// ui/keyboard hit, because the question is "is this control used at all" and a
// per-case boolean answers it; a raw press count would drown every other path.
export function createOnce() {
  let seen = new Set();
  return {
    first(key) {
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    },
    reset() { seen = new Set(); }
  };
}

export const MILESTONES = Object.freeze([25, 50, 100]);

// Crossing is derived from the before/after counts rather than from a stored
// list of milestones already sent, so there is no new persisted state to keep
// in sync -- and no double-fire if the same completion is processed twice.
export function milestonesCrossed(prevDone, nextDone, total) {
  if (!total) return [];
  const pct = n => (n / total) * 100;
  return MILESTONES.filter(m => pct(prevDone) < m && pct(nextDone) >= m);
}

export function groupComplete(algs, group, isDone) {
  const inGroup = algs.filter(a => a.group === group);
  return inGroup.length > 0 && inGroup.every(isDone);
}
