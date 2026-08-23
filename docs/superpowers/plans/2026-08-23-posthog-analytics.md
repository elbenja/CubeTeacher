# PostHog Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instrument CubeTeacher with a PostHog event stream that answers which algorithms people abandon, whether they return, whether the UI is used, and whether anyone finishes a method.

**Architecture:** Two new modules. `analytics-core.mjs` holds every pure decision — the idle heartbeat, the counters, the property builders — with no DOM and no PostHog, so it is unit-tested headlessly with `node --test`. `analytics.js` is the thin impure shell: PostHog init, DOM listeners, the flush on unload. `CubeTeacher.dc.html` calls only `analytics.js`, and every call is fail-open.

**Tech Stack:** Vanilla ES modules, `posthog-js` via the CDN snippet (US Cloud), `node --test` (built in — no package.json, no dependencies added).

**Spec:** [docs/superpowers/specs/2026-08-23-posthog-analytics-design.md](../specs/2026-08-23-posthog-analytics-design.md)

## Global Constraints

- **Host is `https://us.i.posthog.com`** (US Cloud). Assets host `https://us-assets.i.posthog.com`. Events sent to the EU host vanish silently.
- **`autocapture: false`** in the init config. Non-negotiable — see spec.
- **Every call from the app is fail-open.** A blocked, failed or absent `window.posthog` must be a silent no-op. An ad blocker must never break the cube.
- **No `identify()`, no PII, no email, no free text from the user.** There is nothing to identify.
- **Disabled on `localhost` / `127.0.0.1`** unless `?ph=1` is in the URL.
- **Event and property names are `snake_case`.** PostHog's own properties are `$`-prefixed; never shadow one.
- **No new dependencies and no `package.json`.** The project has neither; keep it that way.
- **Match the existing house style:** 2-space indent, single quotes, comments that explain *why* rather than *what*, as in [cube-engine.js](../../../cube-engine.js) and [algorithms.js](../../../algorithms.js).
- **`APP_VERSION` is the string `'2026-08-23'`**, a hand-maintained constant in `analytics.js`.

---

### Task 1: The idle heartbeat

The one piece of logic that is easy to get wrong in a way that looks right. `active_seconds` must count attentive viewing and exclude a tab left open overnight.

**Files:**
- Create: `analytics-core.mjs`
- Test: `analytics-core.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `createHeartbeat({ now, idleMs }) -> { activity(), setVisible(bool), tick(), seconds(), reset() }` and the constant `IDLE_MS = 60000`. `tick()` adds exactly 1 to the second count when the document is visible and activity happened less than `idleMs` ago. `now` defaults to `() => Date.now()` and exists so tests can drive a fake clock.

- [ ] **Step 1: Write the failing tests**

Create `analytics-core.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHeartbeat, IDLE_MS } from './analytics-core.mjs';

// A fake clock, so idle behaviour is tested in microseconds rather than minutes.
function clock(start = 0) {
  let t = start;
  return { now: () => t, advance: ms => { t += ms; } };
}

test('counts a tick while visible and recently active', () => {
  const c = clock();
  const h = createHeartbeat({ now: c.now });
  h.tick();
  h.tick();
  assert.equal(h.seconds(), 2);
});

test('counts nothing while the tab is hidden', () => {
  const c = clock();
  const h = createHeartbeat({ now: c.now });
  h.setVisible(false);
  h.tick();
  h.tick();
  assert.equal(h.seconds(), 0);
});

test('stops counting once activity is older than the idle window', () => {
  const c = clock();
  const h = createHeartbeat({ now: c.now });
  h.tick();
  c.advance(IDLE_MS + 1);
  h.tick();
  h.tick();
  assert.equal(h.seconds(), 1);
});

test('does not clamp attentive viewing', () => {
  // The bug this guards: a stopwatch clamped to 60s would report 60 here.
  const c = clock();
  const h = createHeartbeat({ now: c.now });
  for (let i = 0; i < 300; i++) { h.activity(); c.advance(1000); h.tick(); }
  assert.equal(h.seconds(), 300);
});

test('activity resumes counting after an idle stretch', () => {
  const c = clock();
  const h = createHeartbeat({ now: c.now });
  c.advance(IDLE_MS + 1);
  h.tick();
  assert.equal(h.seconds(), 0);
  h.activity();
  h.tick();
  assert.equal(h.seconds(), 1);
});

test('returning to a visible tab counts as activity', () => {
  const c = clock();
  const h = createHeartbeat({ now: c.now });
  h.setVisible(false);
  c.advance(IDLE_MS * 10);
  h.setVisible(true);
  h.tick();
  assert.equal(h.seconds(), 1);
});

test('reset zeroes the count and re-arms activity', () => {
  const c = clock();
  const h = createHeartbeat({ now: c.now });
  h.tick();
  c.advance(IDLE_MS + 1);
  h.reset();
  h.tick();
  assert.equal(h.seconds(), 1);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
node --test analytics-core.test.mjs
```

Expected: FAIL — `Cannot find module './analytics-core.mjs'`.

- [ ] **Step 3: Write the minimal implementation**

Create `analytics-core.mjs`:

```js
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
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
node --test analytics-core.test.mjs
```

Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add analytics-core.mjs analytics-core.test.mjs
git commit -m "feat: idle-aware heartbeat for measuring attentive time"
```

---

### Task 2: Counters and property builders

**Files:**
- Modify: `analytics-core.mjs`
- Test: `analytics-core.test.mjs`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces:
  - `CASE_COUNTERS` — the frozen list of tier-2 counter names.
  - `createCounters(names = CASE_COUNTERS) -> { bump(name, by = 1), snapshot(), reset() }`. `snapshot()` always returns every name, zeros included, so PostHog never sees a missing property. `bump` on an unknown name is ignored.
  - `caseProps(alg, vari, index, moveCount) -> { case_id, case_name, group, variation, variation_index, move_count }`
  - `pctThrough(index, total) -> number` (0 when total is 0)
  - `MILESTONES` and `milestonesCrossed(prevDone, nextDone, total) -> number[]`
  - `groupComplete(algs, group, isDone) -> boolean`
  - `daysSince(iso, nowMs) -> number | null`

- [ ] **Step 1: Write the failing tests**

Append to `analytics-core.test.mjs`:

```js
import {
  createCounters, CASE_COUNTERS, caseProps, pctThrough,
  milestonesCrossed, groupComplete, daysSince
} from './analytics-core.mjs';

test('counters start at zero for every known name', () => {
  const snap = createCounters().snapshot();
  assert.deepEqual(Object.keys(snap).sort(), [...CASE_COUNTERS].sort());
  assert.ok(Object.values(snap).every(v => v === 0));
});

test('counters accumulate and reset', () => {
  const c = createCounters();
  c.bump('scrubs');
  c.bump('scrubs', 3);
  assert.equal(c.snapshot().scrubs, 4);
  c.reset();
  assert.equal(c.snapshot().scrubs, 0);
});

test('counters ignore an unknown name rather than inventing a property', () => {
  const c = createCounters();
  c.bump('not_a_counter');
  assert.equal('not_a_counter' in c.snapshot(), false);
});

test('caseProps reads the shape algorithms.js actually uses', () => {
  const alg = { id: 'b-second-layer', name: 'Second Layer (F2L)', group: 'beginner' };
  const vari = { label: 'Edge goes right' };
  assert.deepEqual(caseProps(alg, vari, 2, 8), {
    case_id: 'b-second-layer',
    case_name: 'Second Layer (F2L)',
    group: 'beginner',
    variation: 'Edge goes right',
    variation_index: 2,
    move_count: 8
  });
});

test('pctThrough rounds, and survives an unloaded case', () => {
  assert.equal(pctThrough(7, 14), 50);
  assert.equal(pctThrough(1, 3), 33);
  assert.equal(pctThrough(0, 0), 0);
});

test('milestonesCrossed reports only newly crossed thresholds', () => {
  assert.deepEqual(milestonesCrossed(0, 1, 4), [25]);
  assert.deepEqual(milestonesCrossed(1, 2, 4), [50]);
  assert.deepEqual(milestonesCrossed(2, 2, 4), []);
  assert.deepEqual(milestonesCrossed(3, 4, 4), [100]);
});

test('milestonesCrossed can report two at once on a big jump', () => {
  assert.deepEqual(milestonesCrossed(0, 3, 4), [25, 50]);
});

test('milestonesCrossed is safe before the algorithm list loads', () => {
  assert.deepEqual(milestonesCrossed(0, 0, 0), []);
});

test('groupComplete needs every case in the group', () => {
  const algs = [
    { id: 'a', group: 'beginner' },
    { id: 'b', group: 'beginner' },
    { id: 'c', group: 'advanced' }
  ];
  const done = new Set(['a']);
  assert.equal(groupComplete(algs, 'beginner', x => done.has(x.id)), false);
  done.add('b');
  assert.equal(groupComplete(algs, 'beginner', x => done.has(x.id)), true);
});

test('groupComplete is false for a group with no cases', () => {
  assert.equal(groupComplete([], 'beginner', () => true), false);
});

test('daysSince counts whole days and refuses junk', () => {
  const base = Date.parse('2026-08-01T00:00:00.000Z');
  assert.equal(daysSince('2026-08-01T00:00:00.000Z', base + 86400000 * 3), 3);
  assert.equal(daysSince('2026-08-01T00:00:00.000Z', base), 0);
  assert.equal(daysSince('not a date', base), null);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
node --test analytics-core.test.mjs
```

Expected: FAIL — `createCounters is not a function` (or a named-export error).

- [ ] **Step 3: Write the minimal implementation**

Append to `analytics-core.mjs`:

```js
// Tier 2: interactions too frequent to send one event each. A study session
// would emit hundreds of step events, nearly all noise, so they accumulate
// here and ship as properties of a single case_closed event.
export const CASE_COUNTERS = Object.freeze([
  'steps_manual', 'steps_keyboard', 'scrubs', 'resets',
  'replays', 'rotated', 'stack_expanded'
]);

// The snapshot always carries every name, zeros included. A property that is
// merely absent when nothing happened makes "average scrubs per case" quietly
// wrong, because PostHog averages over the events that have the property.
export function createCounters(names = CASE_COUNTERS) {
  const zero = () => names.reduce((o, n) => (o[n] = 0, o), {});
  let c = zero();
  return {
    bump(name, by = 1) { if (name in c) c[name] += by; },
    snapshot() { return Object.assign({}, c); },
    reset() { c = zero(); }
  };
}

export function caseProps(alg, vari, index, moveCount) {
  return {
    case_id: alg.id,
    case_name: alg.name,
    group: alg.group,
    variation: vari.label,
    variation_index: index,
    move_count: moveCount
  };
}

export function pctThrough(index, total) {
  return total > 0 ? Math.round((index / total) * 100) : 0;
}

export const MILESTONES = Object.freeze([25, 50, 75, 100]);

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

export function daysSince(iso, nowMs) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((nowMs - t) / 86400000));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
node --test analytics-core.test.mjs
```

Expected: PASS, 18 tests.

- [ ] **Step 5: Verify nothing else broke**

```bash
node validate.mjs
```

Expected: the usual algorithm table, no failures. (This task touches no algorithm content; the run is a cheap guard against a stray edit.)

- [ ] **Step 6: Commit**

```bash
git add analytics-core.mjs analytics-core.test.mjs
git commit -m "feat: counters and event property builders for analytics"
```

---

### Task 3: The PostHog shell

The impure half. Nothing here is unit-tested; it is verified in the browser in Task 4, when it first has something to send.

**Files:**
- Create: `analytics.js`

**Interfaces:**
- Consumes: everything Task 1 and Task 2 export.
- Produces, all safe to call before or without PostHog:
  - `init()` — decides whether analytics is on, starts the 1s heartbeat interval, binds `visibilitychange` and `pagehide`.
  - `ready({ casesDone, likesCount })` — registers super properties, fires `first_visit` once ever.
  - `track(name, props)` — one discrete event.
  - `openCase(alg, vari, index, moveCount)` — flushes the previous case, starts a new one.
  - `closeCase(reason)` — flushes `case_closed`.
  - `bump(name, by)` — a tier-2 counter.
  - `setVia(kind)` / `getVia()` — the last transport interaction, `'play' | 'step' | 'scrub' | 'jump'`.
  - `activity()` — feeds the heartbeat.
  - `watchCube(el)` — bumps `rotated` on pointerdown.
  - `progress({ casesDone, likesCount })` — re-registers the two counts after they change.
  - `firstSeen()` — ISO date string, created on first call.

- [ ] **Step 1: Write the module**

Create `analytics.js`:

```js
// The impure half of analytics: PostHog, the DOM, and the clock. Every export
// is safe to call when window.posthog is missing -- which for a real share of
// visitors it will be, because ad blockers block the ingestion host. Analytics
// failing must never be visible in the app.

import {
  createHeartbeat, createCounters, caseProps, pctThrough
} from './analytics-core.mjs';

// Bumped by hand on a release worth telling apart in the data.
const APP_VERSION = '2026-08-23';
const FIRST_SEEN_KEY = 'cubeteacher.firstSeen';

const heartbeat = createHeartbeat();
const counters = createCounters();

let on = false;
let openCaseProps = null;
let lastVia = null;
let ticker = null;

function ph() {
  // Resolved per call, not cached: the snippet's array.js stub is replaced by
  // the real library once it loads, and a cached reference would keep the stub.
  return on && typeof window !== 'undefined' && window.posthog ? window.posthog : null;
}

// Analytics is off for the author. Without this every local run, and every
// browser-driven verification pass, lands in the same project as real users.
function shouldEnable() {
  try {
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    return !local || new URLSearchParams(location.search).has('ph');
  } catch (_) { return false; }
}

export function track(name, props) {
  const p = ph();
  if (!p) return;
  try { p.capture(name, props || {}); } catch (_) {}
}

// The unload path needs its own transport: a normal XHR is cancelled while the
// page is going away, so the last and most engaged case of a session would be
// the one event that never arrives.
function trackBeacon(name, props) {
  const p = ph();
  if (!p) return;
  try { p.capture(name, props || {}, { transport: 'sendBeacon' }); } catch (_) {}
}

export function firstSeen() {
  try {
    const seen = localStorage.getItem(FIRST_SEEN_KEY);
    if (seen) return JSON.parse(seen);
    const today = new Date().toISOString();
    localStorage.setItem(FIRST_SEEN_KEY, JSON.stringify(today));
    return today;
  } catch (_) { return null; }
}

export function progress({ casesDone, likesCount }) {
  const p = ph();
  if (!p) return;
  // Registered rather than sent: on every future event these two turn any
  // trend into "beginners vs. people who have finished twenty cases", with no
  // login and no second instrumentation pass.
  try {
    p.register({
      cases_done_count: casesDone,
      likes_count: likesCount,
      app_version: APP_VERSION
    });
  } catch (_) {}
}

export function activity() { heartbeat.activity(); }
export function bump(name, by = 1) { counters.bump(name, by); }
export function setVia(kind) { lastVia = kind; }
export function getVia() { return lastVia; }

// Set by the app while the case is open, read when it closes. They live at
// module scope because closeCase also fires from a page-unload handler, which
// has no view of engine or component state to ask.
let reachedEnd = false;
let completed = false;
export function markReachedEnd() { reachedEnd = true; }
export function markCompleted() { completed = true; }

export function openCase(alg, vari, index, moveCount) {
  closeCase('switch');
  openCaseProps = caseProps(alg, vari, index, moveCount);
  counters.reset();
  heartbeat.reset();
  lastVia = null;
  reachedEnd = false;
  completed = false;
  track('case_opened', openCaseProps);
}

export function closeCase(reason) {
  if (!openCaseProps) return;
  const props = Object.assign({}, openCaseProps, counters.snapshot(), {
    active_seconds: heartbeat.seconds(),
    reached_end: reachedEnd,
    completed: completed,
    close_reason: reason
  });
  if (reason === 'unload') trackBeacon('case_closed', props);
  else track('case_closed', props);
  openCaseProps = null;
}

export function currentCase() { return openCaseProps; }
export function progressProps(index, total) {
  return { pct_through: pctThrough(index, total), stopped_at_move: index };
}

export function watchCube(el) {
  if (!el || !el.addEventListener) return;
  // Rotation lives inside cube-engine's own pointer handling; a listener on the
  // container records that a drag happened without reaching into the engine.
  el.addEventListener('pointerdown', () => { activity(); bump('rotated'); }, { passive: true });
}

export function ready({ casesDone, likesCount }) {
  if (!ph()) return;
  progress({ casesDone, likesCount });
  const seen = firstSeen();
  const isNew = seen && Date.now() - Date.parse(seen) < 5000;
  if (isNew) track('first_visit', {});
}

export function init() {
  on = shouldEnable();
  if (!on || typeof window === 'undefined') return;

  ['pointerdown', 'keydown', 'wheel'].forEach(evt =>
    window.addEventListener(evt, activity, { passive: true }));

  document.addEventListener('visibilitychange', () => {
    const visible = document.visibilityState === 'visible';
    heartbeat.setVisible(visible);
    if (visible) flushed = false;
    else flush();
  });
  window.addEventListener('pagehide', flush);

  ticker = setInterval(() => heartbeat.tick(), 1000);
}

let flushed = false;
function flush() {
  // visibilitychange-to-hidden and pagehide both fire on a real tab close, in
  // that order. Guarding means one case_closed, not two -- and coming back to
  // a visible tab re-arms it for the next departure.
  if (flushed) return;
  flushed = true;
  closeCase('unload');
}
```

- [ ] **Step 2: Verify the module parses and its pure paths are inert without a browser**

```bash
node --input-type=module -e "import('./analytics.js').then(m => { m.track('x'); m.bump('scrubs'); m.closeCase('switch'); console.log('no-op OK', typeof m.init); })"
```

Expected: `no-op OK function`. No exception. (`window` and `document` are undefined under Node — this proves the fail-open guards hold before a browser is ever involved.)

- [ ] **Step 3: Commit**

```bash
git add analytics.js
git commit -m "feat: fail-open PostHog wrapper"
```

---

### Task 4: Snippet, wiring, and the first two events

The first task whose result is visible in PostHog. Nothing after this is worth doing until `case_opened` is confirmed arriving.

**Prerequisite:** the PostHog project API key, from Project Settings in the PostHog UI. It is a public client key and belongs in the repo.

**Files:**
- Modify: `CubeTeacher.dc.html` — the `<helmet>` block (~line 35), `componentDidMount` (~line 623), `loadCurrent` (~line 765)

**Interfaces:**
- Consumes: `init`, `ready`, `openCase`, `watchCube`, `progress` from `analytics.js`.
- Produces: `case_opened` and `first_visit` in the live event stream.

- [ ] **Step 1: Add the snippet**

**Required input:** replace `phc_YOUR_PROJECT_KEY` below with the project's real key, from PostHog's Project Settings. It is the one value this plan cannot supply.

In the `<helmet>` block, immediately after the three.js `<script>` line:

```html
<script src="https://us-assets.i.posthog.com/static/array.js"></script>
<script>
  posthog.init('phc_YOUR_PROJECT_KEY', {
    api_host: 'https://us.i.posthog.com',
    // A canvas app has hundreds of structural divs; autocapture would bury the
    // events that mean something under $autocapture clicks on none of them.
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'cookie'
  });
</script>
```

`array.js` is the built posthog-js library, not a stub, so a plain script tag
followed by an inline `init` is deterministic: the inline script cannot run
before the one above it has loaded. PostHog's onboarding page offers an async
snippet that queues calls against a stub instead; either works, and this one is
easier to read next to the three.js tag it sits beside. It goes in `<helmet>`
rather than the document `<head>` because that is where this file already keeps
its third-party runtime scripts.

- [ ] **Step 2: Import the module and start it**

`this.A` is populated by an `await`, but `renderVals` runs before that resolves
and hands its callbacks to the UI. A click landing in that window would throw
on `this.A.track`. So the field is declared with a no-op stub first, beside the
existing `legendPos` class field:

```js
  // Replaced by the real module once componentDidMount's import resolves. The
  // stub exists so a click in that window is a no-op rather than a TypeError:
  // analytics must never be the reason something in the app breaks.
  A = new Proxy({}, { get: () => () => {} });
```

Then, at the top of `componentDidMount`, before the `try`:

```js
  async componentDidMount() {
    this.varCanvas = [];
    this._refs = {};
    this.A = await import('./analytics.js');
    this.A.init();
    try {
```

- [ ] **Step 3: Fire `first_visit` and register super properties once data has loaded**

Change the `setState` at the end of the `try` block (currently `this.setState({ ready: true, likes, done, legendOpen: legend === null }, ...)`) to:

```js
      this.setState({ ready: true, likes, done, legendOpen: legend === null }, () => {
        this.A.ready({ casesDone: done.length, likesCount: likes.length });
        this.A.watchCube(this.cubeEl);
        this.loadCurrent();
      });
```

- [ ] **Step 4: Fire `case_opened`**

In `loadCurrent`, inside the `.then()` after `this.creditArmed = true;`:

```js
    this.engine.load(v).then(() => {
      this.creditArmed = true;
      // After load, because move_count comes from the engine's parsed move
      // list -- a loop/run variation has no flat `moves` array to count.
      this.A.openCase(this.current(), v, this.state.varIdx, this.engine.moves.length);
      this.drawThumbs();
```

- [ ] **Step 5: Verify in the browser**

Start the preview, then load `http://127.0.0.1:8934/CubeTeacher.dc.html?ph=1`.

Confirm all four:
1. A network POST to `us.i.posthog.com/e/` (or `/i/v0/e/`) appears — the request is the proof, not the absence of a console error.
2. PostHog's Activity feed shows `case_opened` with `case_id`, `group`, `variation_index` and a non-zero `move_count`.
3. Clicking a different case in the sidebar produces a second `case_opened` with the new `case_id`.
4. Loading without `?ph=1` on `127.0.0.1` produces **no** network request.

- [ ] **Step 6: Commit**

```bash
git add CubeTeacher.dc.html
git commit -m "feat: send case_opened and first_visit to PostHog"
```

---

### Task 5: Playback events

Delivers `playback_abandoned` — per the spec, the most actionable event in the project.

**Files:**
- Modify: `CubeTeacher.dc.html` — `stopPlay` and `play` (~lines 814-826), `jump` and `step` (~lines 828-831)

**Interfaces:**
- Consumes: `track`, `setVia`, `bump`, `currentCase`, `progressProps`, `markReachedEnd` from `analytics.js`.
- Produces: `playback_started`, `playback_finished`, `playback_abandoned`.

- [ ] **Step 1: Instrument `stopPlay` for abandonment**

```js
  stopPlay() {
    // Abandonment is judged here rather than in play(), because every route out
    // of a running playback -- pause, stepping, switching case -- passes
    // through this one method.
    if (this._playing && this.engine && this.engine.index < this.engine.moves.length) {
      const c = this.A.currentCase();
      if (c) this.A.track('playback_abandoned',
        Object.assign({}, c, this.A.progressProps(this.engine.index, this.engine.moves.length)));
    }
    this._playing = false;
    if (this.state.playing) this.setState({ playing: false });
  }
```

- [ ] **Step 2: Instrument `play`**

```js
  async play() {
    if (!this.engine) return;
    if (this._playing) { this.stopPlay(); return; }
    if (this.engine.index >= this.engine.moves.length) await this.engine.reset();
    const c = this.A.currentCase();
    const started = Date.now();
    if (c) {
      this.A.setVia('play');
      this.A.track('playback_started', Object.assign({}, c, {
        replay_index: this.replayIndex = (this.replayIndex || 0),
        from_move: this.engine.index
      }));
      this.replayIndex++;
      this.A.bump('replays');
    }
    this._playing = true;
    this.setState({ playing: true });
    while (this._playing && this.engine.index < this.engine.moves.length) {
      await this.engine.step(1);
      this.A.activity();
    }
    if (this._playing && c) {
      this.A.markReachedEnd();
      this.A.track('playback_finished', Object.assign({}, c, {
        seconds: Math.round((Date.now() - started) / 1000)
      }));
    }
    this._playing = false;
    this.setState({ playing: false });
  }
```

Note the `this.A.activity()` inside the loop: a long algorithm playing counts as attention, not as idling.

- [ ] **Step 3: Reset the replay counter per case**

In `loadCurrent`, beside `this.creditArmed = false;`:

```js
    this.creditArmed = false;
    this.replayIndex = 0;
```

- [ ] **Step 4: Thread `via` through the manual transports**

```js
  jump(n) { this.A.setVia('jump'); this.stopPlay(); if (this.engine) this.engine.goTo(n, true); }
  step(d) { this.A.setVia('step'); this.A.bump('steps_manual'); this.stopPlay(); if (this.engine) this.engine.step(d); }
```

- [ ] **Step 5: Verify in the browser**

At `http://127.0.0.1:8934/CubeTeacher.dc.html?ph=1`:

1. Press play, let it run to the end → `playback_started` then `playback_finished` with a plausible `seconds`. No `playback_abandoned`.
2. Press play, pause halfway → `playback_abandoned` with `stopped_at_move` matching the counter in the UI and `pct_through` near 50.
3. Press play, then immediately click another case → `playback_abandoned` for the old case, then `case_opened` for the new one, in that order.
4. Play a case twice → the second `playback_started` carries `replay_index: 1`.

- [ ] **Step 6: Commit**

```bash
git add CubeTeacher.dc.html
git commit -m "feat: playback start, finish and abandonment events"
```

---

### Task 6: Completion, likes, and progress milestones

**Files:**
- Modify: `CubeTeacher.dc.html` — `markDone` (~line 1076), `toggleLike` (~line 1094), the `onIndex` callback (~line 637)

**Interfaces:**
- Consumes: `track`, `getVia`, `markCompleted`, `markReachedEnd`, `progress` from `analytics.js`; `milestonesCrossed`, `groupComplete`, `daysSince` from `analytics-core.mjs`.
- Produces: `algorithm_completed`, `variation_liked`, `variation_unliked`, `progress_milestone`, `section_completed`.

Note one deviation from the spec's event table, adopted deliberately: `algorithm_completed` carries **no `first_time` property**. `markDone` returns early when the variation is already in `done`, so the event can only ever fire on a first completion and the property would be a constant `true`. Repeat visits to a finished case are already visible as `case_closed.reached_end` with `completed: true`.

- [ ] **Step 1: Import the core helpers**

At the top of the `<script type="text/x-dc">` block, alongside the existing imports, or — matching how `algorithms.js` is loaded — inside `componentDidMount`:

```js
    this.AC = await import('./analytics-core.mjs');
```

Place it on the line after `this.A.init();`.

- [ ] **Step 2: Instrument `markDone`**

```js
  markDone() {
    const a = this.current(), v = this.currentVar();
    if (!a || !v) return;
    const key = this.likeId(a.id, v.label);
    if (this.state.done.indexOf(key) !== -1) return;
    const prevCount = this.state.done.length;
    const done = this.state.done.concat([key]);
    this.write('cubeteacher.done', done);
    this.setState({ done }, () => this.reportCompletion(a, v, prevCount, done));
  }

  // Kept out of markDone so the storage write stays the short, obvious thing it
  // was; everything here is reporting, and none of it may throw into the caller.
  reportCompletion(a, v, prevCount, done) {
    const c = this.A.currentCase();
    this.A.markCompleted();
    if (c) this.A.track('algorithm_completed', Object.assign({}, c, { via: this.A.getVia() }));
    this.A.progress({ casesDone: done.length, likesCount: this.state.likes.length });

    const total = this.algs().reduce((n, x) => n + (x.variations || []).length, 0);
    this.AC.milestonesCrossed(prevCount, done.length, total)
      .forEach(pct => this.A.track('progress_milestone', { pct, cases_done: done.length }));

    if (this.AC.groupComplete(this.algs(), a.group, x => this.caseDone(x))) {
      this.A.track('section_completed', {
        group: a.group,
        cases: this.algs().filter(x => x.group === a.group).length,
        days_since_first_visit: this.AC.daysSince(this.A.firstSeen(), Date.now())
      });
    }
  }
```

`total` counts variations, not cases, because `done` is keyed per variation — mixing the two would make every milestone fire early.

- [ ] **Step 3: Record reaching the end even when it is not the first time**

In the `onIndex` callback in `componentDidMount`:

```js
        onIndex: (index, total) => {
          this.setState({ index, total });
          if (this.creditArmed && total > 0 && index >= total) { this.A.markReachedEnd(); this.markDone(); }
        }
```

- [ ] **Step 4: Instrument `toggleLike`**

```js
  toggleLike(key) {
    const on = this.state.likes.indexOf(key) !== -1;
    const likes = on ? this.state.likes.filter(x => x !== key) : this.state.likes.concat([key]);
    this.write('cubeteacher.likes', likes);
    this.setState({ likes }, () => {
      const c = this.A.currentCase();
      const [caseId, variation] = key.split('::');
      this.A.track(on ? 'variation_unliked' : 'variation_liked', {
        case_id: caseId,
        variation,
        group: c ? c.group : null,
        likes_total: likes.length
      });
      this.A.progress({ casesDone: this.state.done.length, likesCount: likes.length });
      this.bumpBadge();
    });
  }
```

The key is split rather than read from `currentCase()` because the Likes rail can like a row belonging to a case other than the open one.

- [ ] **Step 5: Verify in the browser**

At `http://127.0.0.1:8934/CubeTeacher.dc.html?ph=1`, with `localStorage.clear()` first:

1. Play a case to the end → `algorithm_completed` with `via: "play"`, and the sidebar check appears.
2. Play the same case to the end again → **no** second `algorithm_completed`.
3. Step to the end of a different case with the arrow keys → `algorithm_completed` with `via: "step"`.
4. Open a `patterns` case that uses `open: 'end'` → `case_opened` fires and `algorithm_completed` does **not**. (This is the `creditArmed` guard; if it regresses, all 22 patterns check off at once.)
5. Like and unlike a row → `variation_liked` then `variation_unliked`, with `likes_total` 1 then 0.
6. Confirm a later event carries `cases_done_count` above 0 in its properties.

- [ ] **Step 6: Commit**

```bash
git add CubeTeacher.dc.html
git commit -m "feat: completion, like and progress milestone events"
```

---

### Task 7: Tier-2 counters and the case_closed flush

**Files:**
- Modify: `CubeTeacher.dc.html` — `handleKey` (~line 838), `scrubDown` (~line 847), `resetAll` (~line 835), `toggleStack` (~line 1255)

**Interfaces:**
- Consumes: `bump`, `closeCase` from `analytics.js`.
- Produces: `case_closed` carrying `active_seconds` and the seven counters.

- [ ] **Step 1: Count keyboard transport separately from clicks**

`step` already bumps `steps_manual` for every route. `handleKey` reclassifies the keyboard ones, so the click-vs-keyboard split survives:

```js
  handleKey(e) {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    const total = this.state.total;
    if (e.key === 'ArrowRight') { e.preventDefault(); this.A.bump('steps_keyboard'); this.A.bump('steps_manual', -1); e.shiftKey ? this.jump(total) : this.step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); this.A.bump('steps_keyboard'); this.A.bump('steps_manual', -1); e.shiftKey ? this.jump(0) : this.step(-1); }
    else if (e.key === ' ') { e.preventDefault(); this.play(); }
    else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); this.resetAll(); }
    else if (e.key === 'Escape') this.setState({ drawer: false, sheet: false, legendOpen: false });
  }
```

The `-1` looks odd and is deliberate: `step` cannot tell who called it, so the keyboard path corrects the count it just caused rather than every call site learning to pass a source.

- [ ] **Step 2: Count scrubs and resets**

```js
  resetAll() { this.A.setVia('jump'); this.A.bump('resets'); this.jump(0); if (this.engine) this.engine.resetView(); }
```

In `scrubDown`, in the `up` handler so a drag counts once rather than once per pointermove:

```js
    const up = () => {
      this.A.bump('scrubs');
      this.A.setVia('scrub');
      el.removeEventListener('pointermove', move);
```

- [ ] **Step 3: Count stack expansion**

In `renderVals`:

```js
      toggleStack: () => this.setState(s => { if (!s.stripExpanded) this.A.bump('stack_expanded'); return { stripExpanded: !s.stripExpanded }; }),
```

- [ ] **Step 4: Verify in the browser**

At `http://127.0.0.1:8934/CubeTeacher.dc.html?ph=1`:

1. Open a case, click the forward arrow 3 times, press → twice, drag the scrubber once, hit reset, expand the stack. Then switch to another case.
2. The `case_closed` event must read `steps_manual: 3`, `steps_keyboard: 2`, `scrubs: 1`, `resets: 1`, `stack_expanded: 1`.
3. `active_seconds` must be roughly the wall-clock time spent on that case, not zero and not the whole session.
4. Drag-rotate the cube, switch case → `rotated` is at least 1.
5. Switch to a background tab for 2 minutes, come back, then switch case → `active_seconds` must **not** include those 2 minutes.
6. Leave a case open and untouched for 2 minutes with the tab visible, then switch → `active_seconds` must be about 60, not 120.

- [ ] **Step 5: Verify the unload flush**

1. Open a case, interact for ~10 seconds, then close the tab.
2. In devtools' Network panel with "Preserve log" on, confirm a `sendBeacon` request leaves on `pagehide`.
3. Confirm PostHog shows exactly **one** `case_closed` for that case — not two. (`visibilitychange`-to-hidden and `pagehide` both fire on a real close; the `flushed` guard is what makes it one.)

- [ ] **Step 6: Commit**

```bash
git add CubeTeacher.dc.html
git commit -m "feat: per-case counters and case_closed summary event"
```

---

### Task 8: Legend and failure events

The two small ones. `legend_opened` answers a question you already have about a feature you just built; `render_failed` is breakage you would otherwise never hear about.

**Files:**
- Modify: `CubeTeacher.dc.html` — `toggleLegend` and `dismissLegend` (~lines 1294-1295), the `catch` in `componentDidMount` (~line 647)

**Interfaces:**
- Consumes: `track` from `analytics.js`.
- Produces: `legend_opened`, `legend_dismissed`, `render_failed`.

- [ ] **Step 1: Instrument the legend**

```js
      toggleLegend: () => this.setState(s => {
        if (!s.legendOpen) this.A.track('legend_opened', { first_time: this.read('cubeteacher.legend', null) === null });
        return { legendOpen: !s.legendOpen };
      }),
      dismissLegend: () => {
        this.A.track('legend_dismissed', {});
        this.write('cubeteacher.legend', 'seen');
        this.setState({ legendOpen: false });
      },
```

`first_time` is read before the `seen` flag is written, so it means "had never dismissed it before".

- [ ] **Step 2: Instrument the failure path**

```js
    } catch (e) {
      console.error('[cubeteacher]', e);
      // No stack and no message text: this is a health signal, not a crash
      // reporter, and the message could carry a path from the user's machine.
      this.A.track('render_failed', { reason: e && e.name ? e.name : 'unknown' });
    }
```

- [ ] **Step 3: Verify in the browser**

1. Open and dismiss the legend → `legend_opened` with `first_time: true`, then `legend_dismissed`.
2. Reload, open the legend again → `legend_opened` with `first_time: false`.
3. Force the failure path: in devtools, block `cdn.jsdelivr.net` and reload. The `waitFor(() => window.THREE)` times out, and `render_failed` must arrive with `reason: "Error"`.

- [ ] **Step 4: Commit**

```bash
git add CubeTeacher.dc.html
git commit -m "feat: legend usage and render failure events"
```

---

### Task 9: Full verification pass

The plan's last task exists because instrumentation fails silently. A missing event produces a confident empty chart, which is worse than no chart.

**Files:** none modified — this task either passes or sends you back to an earlier one.

- [ ] **Step 1: Re-run the headless tests**

```bash
node --test analytics-core.test.mjs && node validate.mjs
```

Expected: 18 analytics tests pass; the algorithm table prints with no failures.

- [ ] **Step 2: Walk the spec's own test list**

From the spec's Testing section, at `http://127.0.0.1:8934/CubeTeacher.dc.html?ph=1`, confirm each and record the evidence:

- [ ] Opening a pattern with `open: 'end'` fires `case_opened` and not `algorithm_completed`.
- [ ] Switching cases mid-playback fires `playback_abandoned`, then `case_closed`, then `case_opened` — in that order.
- [ ] Closing the tab fires `case_closed` via `sendBeacon`, exactly once.
- [ ] Backgrounding the tab for two minutes adds no time to `active_seconds`.
- [ ] Blocking `us.i.posthog.com` in devtools leaves the app fully functional: cube animates, cases switch, likes and completion still save to localStorage, no uncaught console errors.

- [ ] **Step 3: Confirm the taxonomy is complete**

In PostHog's Activity feed, confirm all 14 event names have been seen at least once: `first_visit`, `case_opened`, `case_closed`, `playback_started`, `playback_finished`, `playback_abandoned`, `algorithm_completed`, `variation_liked`, `variation_unliked`, `progress_milestone`, `section_completed`, `legend_opened`, `legend_dismissed`, `render_failed`.

Any name that never appeared is an unwired call site, not a quiet feature.

- [ ] **Step 4: Confirm the author's own traffic is excluded**

Load `http://127.0.0.1:8934/CubeTeacher.dc.html` with no `?ph=1` and confirm zero network requests to PostHog across a full case-open, play, complete cycle.

- [ ] **Step 5: Build the five insights**

In the PostHog UI, per the spec's Insights section: the two `case_id` trends, the four-step funnel, retention on `algorithm_completed`, the `playback_abandoned` breakdown by `stopped_at_move`, and the `case_closed` averages by `group`. Save them to one dashboard.

- [ ] **Step 6: Commit any fixes and merge**

```bash
git add -A
git commit -m "fix: corrections from the analytics verification pass"
```

Then use the `superpowers:finishing-a-development-branch` skill to decide how `feat/posthog-analytics` gets integrated.
