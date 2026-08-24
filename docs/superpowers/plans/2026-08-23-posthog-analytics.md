# Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instrument CubeTeacher with a GoatCounter event stream that answers which algorithms people abandon and where, which get finished, which controls are used, and whether anyone completes a method.

**Architecture:** Two new modules. `analytics-core.mjs` holds every pure decision — the idle heartbeat, the path builders, the per-case dedupe — with no DOM and no vendor, unit-tested headlessly with `node --test`. `analytics.js` is the thin impure shell: the send queue, the DOM listeners, the keepalive flush. `CubeTeacher.dc.html` calls only `analytics.js`, and every call is fail-open.

**Tech Stack:** Vanilla ES modules, GoatCounter's `count.js` via CDN, `node --test` (built in — no package.json, no dependencies added).

**Spec:** [docs/superpowers/specs/2026-08-23-posthog-analytics-design.md](../specs/2026-08-23-posthog-analytics-design.md)

*(Both filenames say "posthog" for historical reasons — PostHog was the original target, and the SDD workspace keys off this plan's basename. Renamed after the run, not mid-flight.)*

## Global Constraints

- **GoatCounter carries no properties.** Every distinction must live in the path string. Never invent a property argument; it will be silently discarded.
- **Endpoint is `https://<site-code>.goatcounter.com/count`**, script is `//gc.zgo.at/count.js`. The site code is supplied by the human at Task 4.
- **Every call from the app is fail-open.** Absent, blocked, or not-yet-loaded GoatCounter must be a silent no-op. Analytics must never be the reason something in the app breaks.
- **Disabled on `localhost` / `127.0.0.1`** unless `?gc=1` is in the URL.
- **Path segments are lowercase `[a-z0-9-]` only**, joined by `/`. The dashboard groups by exact string; one stray capital or space splits a case's hits across two rows that look identical.
- **No new dependencies and no `package.json`.** The project has neither; keep it that way.
- **Match the existing house style:** 2-space indent, single quotes, comments that explain *why* rather than *what*, as in [cube-engine.js](../../../cube-engine.js) and [algorithms.js](../../../algorithms.js).
- **No identity, no persisted analytics state, no new localStorage key.** See the spec's "What this design deliberately does not have".

---

### Task 1: The idle heartbeat — ✅ COMPLETE

Delivered as commit `73e5bb1`, reviewed clean. `createHeartbeat({ now, idleMs }) -> { activity(), setVisible(bool), tick(), seconds(), reset() }` plus `IDLE_MS = 60000` in `analytics-core.mjs`, with 7 tests in `analytics-core.test.mjs`.

Vendor-neutral, so the switch from PostHog to GoatCounter left it untouched. It still feeds the `time/` buckets. Do not re-implement.

---

### Task 2: Path builders and per-case dedupe

**Files:**
- Modify: `analytics-core.mjs`
- Test: `analytics-core.test.mjs`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces:
  - `eventPath(...parts) -> string` — slugifies each part and joins with `/`.
  - `TIME_BUCKETS` and `timeBucket(seconds) -> string`
  - `createOnce() -> { first(key), reset() }` — `first` returns true the first time a key is seen and false after, until `reset()`.
  - `MILESTONES` and `milestonesCrossed(prevDone, nextDone, total) -> number[]`
  - `groupComplete(algs, group, isDone) -> boolean`

- [ ] **Step 1: Write the failing tests**

Append to `analytics-core.test.mjs`:

```js
import {
  eventPath, timeBucket, createOnce, milestonesCrossed, groupComplete
} from './analytics-core.mjs';

test('eventPath joins parts with slashes', () => {
  assert.equal(eventPath('case', 'b-second-layer'), 'case/b-second-layer');
  assert.equal(eventPath('quit', 'a-oll', 'm7'), 'quit/a-oll/m7');
});

test('eventPath slugifies anything that is not already a clean segment', () => {
  // The dashboard groups by exact string, so "Second Layer (F2L)" and
  // "second-layer-f2l" would be two rows for one case.
  assert.equal(eventPath('case', 'Second Layer (F2L)'), 'case/second-layer-f2l');
  assert.equal(eventPath('ui', 'STACK'), 'ui/stack');
});

test('eventPath drops empty parts rather than emitting a double slash', () => {
  assert.equal(eventPath('case', '', 'x'), 'case/x');
  assert.equal(eventPath('case', null), 'case');
});

test('timeBucket puts each duration in exactly one bucket', () => {
  assert.equal(timeBucket(0), '0-15s');
  assert.equal(timeBucket(14), '0-15s');
  assert.equal(timeBucket(15), '15-60s');
  assert.equal(timeBucket(59), '15-60s');
  assert.equal(timeBucket(60), '1-3m');
  assert.equal(timeBucket(179), '1-3m');
  assert.equal(timeBucket(180), '3m+');
  assert.equal(timeBucket(99999), '3m+');
});

test('createOnce reports the first sighting of a key and nothing after', () => {
  const o = createOnce();
  assert.equal(o.first('keyboard'), true);
  assert.equal(o.first('keyboard'), false);
  assert.equal(o.first('keyboard'), false);
  assert.equal(o.first('scrub'), true);
});

test('createOnce re-arms every key after reset', () => {
  const o = createOnce();
  o.first('keyboard');
  o.reset();
  assert.equal(o.first('keyboard'), true);
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
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
node --test analytics-core.test.mjs
```

Expected: FAIL — `eventPath is not a function` (or a named-export error). The 7 Task 1 tests still pass.

- [ ] **Step 3: Write the minimal implementation**

Append to `analytics-core.mjs`:

```js
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
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
node --test analytics-core.test.mjs
```

Expected: PASS, 18 tests (7 from Task 1 + 11 new).

- [ ] **Step 5: Confirm nothing else broke**

```bash
node validate.mjs
```

Expected: the usual algorithm table, no failures.

- [ ] **Step 6: Commit**

```bash
git add analytics-core.mjs analytics-core.test.mjs
git commit -m "feat: path builders, time buckets and per-case dedupe"
```

---

### Task 3: The GoatCounter shell

The impure half. Not unit-tested; verified in the browser at Task 4, when it first has something to send.

**Files:**
- Create: `analytics.js`

**Interfaces:**
- Consumes: `createHeartbeat`, `createOnce`, `eventPath`, `timeBucket` from `analytics-core.mjs`.
- Produces, all safe to call before or without GoatCounter:
  - `init()` — decides whether analytics is on, binds listeners, starts the heartbeat, drains the queue.
  - `send(path)` — one event hit.
  - `openCase(id)` — closes the previous case, starts a new one, sends `case/<id>`.
  - `closeCase(viaUnload)` — sends `time/<id>/<bucket>`.
  - `ui(control)` — sends `ui/<control>` at most once per case.
  - `currentCase()` — the open case id, or null.
  - `activity()` — feeds the heartbeat.
  - `watchCube(el)` — `ui('rotate')` on pointerdown.

- [ ] **Step 1: Write the module**

Create `analytics.js`:

```js
// The impure half of analytics: GoatCounter, the DOM, and the clock. Every
// export is safe to call when GoatCounter is missing -- which for some
// visitors it will be, because ad blockers catch it. Analytics failing must
// never be visible in the app.

import { createHeartbeat, createOnce, eventPath, timeBucket } from './analytics-core.mjs';

// The site's own GoatCounter endpoint. Public by design -- it ships in the
// page on every GoatCounter site -- so it lives in the repo, not in a secret.
const ENDPOINT = 'https://cubeteacher.goatcounter.com/count';

const heartbeat = createHeartbeat();
const once = createOnce();

let on = false;
let openId = null;
let queue = [];
let tries = 0;
let ticker = null;

// Resolved per call, never cached: count.js is async, so the function does not
// exist for the first moments of the page.
function ready() {
  return typeof window !== 'undefined' &&
    window.goatcounter && typeof window.goatcounter.count === 'function';
}

// Analytics is off for the author. Without this every local run, and every
// browser-driven verification pass, lands in the real dashboard.
function shouldEnable() {
  try {
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    return !local || new URLSearchParams(location.search).has('gc');
  } catch (_) { return false; }
}

function fire(path) {
  try { window.goatcounter.count({ path: path, event: true }); } catch (_) {}
}

export function send(path) {
  if (!on || !path) return;
  // Queued rather than dropped: the very first case event of a cold load fires
  // before count.js has arrived, and it is the one most likely to matter.
  if (!ready()) { queue.push(path); return; }
  // drain()'s retry budget is bounded, so a script that arrives later than that
  // -- slow network rather than blocked outright -- would leave the backlog
  // stranded for the life of the page, losing exactly the first case view the
  // queue exists to protect. Reaching here proves the script is up, so the next
  // event to fire flushes the backlog ahead of itself, in order.
  if (queue.length) drain();
  fire(path);
}

function drain() {
  if (!ready()) {
    // Bounded: if the script is blocked outright it never arrives, and
    // retrying forever would be a timer running for the life of the page.
    if (++tries < 25) setTimeout(drain, 200);
    return;
  }
  const pending = queue;
  queue = [];
  pending.forEach(fire);
}

// count() issues an ordinary request, which the browser cancels while the page
// is going away, so the last -- and most engaged -- case of every session would
// be the one hit that never arrives. A hand-built GET with keepalive survives
// it. sendBeacon is not used: it POSTs, and this endpoint expects a GET.
function fireKeepalive(path) {
  try {
    fetch(ENDPOINT + '?p=' + encodeURIComponent(path) + '&e=1',
      { keepalive: true, mode: 'no-cors' });
  } catch (_) {}
}

export function activity() { heartbeat.activity(); }
export function currentCase() { return openId; }

export function ui(control) {
  if (!openId) return;
  if (once.first(control)) send(eventPath('ui', control));
}

export function openCase(id) {
  closeCase();
  openId = id;
  once.reset();
  heartbeat.reset();
  send(eventPath('case', id));
}

export function closeCase(viaUnload) {
  if (!openId) return;
  const path = eventPath('time', openId, timeBucket(heartbeat.seconds()));
  if (viaUnload) fireKeepalive(path); else send(path);
  // Cleared before returning, so a second pagehide (bfcache restores fire it
  // more than once) cannot double-count the same viewing.
  openId = null;
}

export function watchCube(el) {
  if (!el || !el.addEventListener) return;
  // Rotation lives inside cube-engine's own pointer handling; a listener on the
  // container records that a drag happened without reaching into the engine.
  el.addEventListener('pointerdown', () => { activity(); ui('rotate'); }, { passive: true });
}

export function init() {
  on = shouldEnable();
  if (!on || typeof window === 'undefined') return;

  ['pointerdown', 'keydown', 'wheel'].forEach(evt =>
    window.addEventListener(evt, activity, { passive: true }));

  // Visibility only pauses the clock. The time hit is sent on pagehide alone:
  // flushing on hidden too would end the case while the user is still on it,
  // and every later event for that case would be silently discarded.
  document.addEventListener('visibilitychange', () =>
    heartbeat.setVisible(document.visibilityState === 'visible'));
  window.addEventListener('pagehide', () => closeCase(true));

  ticker = setInterval(() => heartbeat.tick(), 1000);
  drain();
}
```

- [ ] **Step 2: Verify the fail-open paths hold with no browser at all**

```bash
node --input-type=module -e "import('./analytics.js').then(m => { m.init(); m.send('case/x'); m.openCase('x'); m.ui('stack'); m.closeCase(); console.log('no-op OK', m.currentCase()); })"
```

Expected: `no-op OK null`, no exception. `window` and `document` are undefined under Node, which proves the guards hold before a browser is ever involved.

- [ ] **Step 3: Commit**

```bash
git add analytics.js
git commit -m "feat: fail-open GoatCounter wrapper"
```

---

### Task 4: Script tag, wiring, and the first two events

The first task whose result is visible in the dashboard. Nothing after this is worth doing until `case/…` is confirmed arriving.

**Site code:** `cubeteacher`, giving the endpoint `https://cubeteacher.goatcounter.com/count`. Already wired into `analytics.js` by Task 3. Use exactly this — a wrong code sends every hit to a stranger's dashboard, silently and irreversibly.

**Files:**
- Modify: `CubeTeacher.dc.html` — the `<helmet>` block (~line 35), `componentDidMount` (~line 623), `loadCurrent` (~line 765)

**Interfaces:**
- Consumes: `init`, `openCase`, `watchCube` from `analytics.js`.
- Produces: `case/<case_id>` and `time/<case_id>/<bucket>` in the dashboard.

- [ ] **Step 1: Confirm the endpoint**

Check that `analytics.js` reads `const ENDPOINT = 'https://cubeteacher.goatcounter.com/count';`. If Task 3 left a placeholder there, fix it before going further — the keepalive flush builds its URL from this constant and would otherwise post to nowhere.

- [ ] **Step 2: Add the script tag**

In the `<helmet>` block of `CubeTeacher.dc.html`, immediately after the three.js `<script>` line, exactly as GoatCounter supplies it:

```html
<script data-goatcounter="https://cubeteacher.goatcounter.com/count"
        async src="//gc.zgo.at/count.js"></script>
```

It goes in `<helmet>` rather than the document `<head>` because that is where this file already keeps its third-party runtime scripts.

- [ ] **Step 3: Declare the stub, import the module, start it**

`this.A` is populated by an `await`, but `renderVals` runs before that resolves and hands its callbacks to the UI. A click landing in that window would throw on `this.A.ui`. So declare the field with a no-op stub first, beside the existing `legendPos` class field:

```js
  // Replaced by the real module once componentDidMount's import resolves. The
  // stub exists so a click in that window is a no-op rather than a TypeError:
  // analytics must never be the reason something in the app breaks.
  A = new Proxy({}, { get: () => () => {} });
```

Then at the top of `componentDidMount`, before the `try`:

```js
  async componentDidMount() {
    this.varCanvas = [];
    this._refs = {};
    this.A = await import('./analytics.js');
    this.AC = await import('./analytics-core.mjs');
    this.A.init();
    try {
```

- [ ] **Step 4: Watch the cube**

Change the `setState` at the end of the `try` block to:

```js
      this.setState({ ready: true, likes, done, legendOpen: legend === null }, () => {
        this.A.watchCube(this.cubeEl);
        this.loadCurrent();
      });
```

- [ ] **Step 5: Fire the case event**

In `loadCurrent`, inside the `.then()` after `this.creditArmed = true;`:

```js
    this.engine.load(v).then(() => {
      this.creditArmed = true;
      // openCase closes the previous one first, so the time/ hit for the case
      // being left is emitted here rather than at every call site that switches.
      this.A.openCase(this.current().id);
      this.drawThumbs();
```

- [ ] **Step 6: Verify in the browser**

Start the preview, then load `http://127.0.0.1:8934/CubeTeacher.dc.html?gc=1`.

Confirm all five:
1. A network request to `<site-code>.goatcounter.com/count` appears — the request is the proof, not the absence of a console error.
2. Its path is `case/b-first-layer-edges` (or whichever case opens first).
3. **The very first case event of a cold reload arrives**, proving the queue drains rather than dropping it. Check with a hard reload and an empty cache.
4. Clicking a different case produces `time/<old-case>/<bucket>` and then `case/<new-case>`.
5. Loading without `?gc=1` on `127.0.0.1` produces **no** request.
6. The hits appear in the GoatCounter dashboard.

If the query parameters on the keepalive URL turn out not to register a hit, correct them against GoatCounter's endpoint documentation and note the correction in the task report — the `p` / `e` shape in Task 3 is the documented form but must be confirmed against a real dashboard hit, not assumed.

- [ ] **Step 7: Commit**

```bash
git add analytics.js CubeTeacher.dc.html
git commit -m "feat: send case and dwell-time events to GoatCounter"
```

---

### Task 5: Completion, likes, abandonment, progress

**Files:**
- Modify: `CubeTeacher.dc.html` — `stopPlay` / `play` (~lines 814-826), `markDone` (~line 1076), `toggleLike` (~line 1094), the `onIndex` callback (~line 637)

**Interfaces:**
- Consumes: `send`, `currentCase`, `ui` from `analytics.js`; `eventPath`, `milestonesCrossed`, `groupComplete` from `analytics-core.mjs` (already imported as `this.AC` in Task 4).
- Produces: `quit/<case>/m<N>`, `done/<case>`, `like/<case>`, `unlike/<case>`, `milestone/<pct>`, `section/<group>`.

- [ ] **Step 1: Instrument `stopPlay` for abandonment**

```js
  stopPlay() {
    // Abandonment is judged here rather than in play(), because every route out
    // of a running playback -- pause, stepping, switching case -- passes
    // through this one method.
    if (this._playing && this.engine && this.engine.index < this.engine.moves.length) {
      const id = this.A.currentCase();
      if (id) this.A.send(this.AC.eventPath('quit', id, 'm' + this.engine.index));
    }
    this._playing = false;
    if (this.state.playing) this.setState({ playing: false });
  }
```

- [ ] **Step 2: Count replays as a UI signal**

In `play()`, immediately after the `if (this._playing) { this.stopPlay(); return; }` line:

```js
    if (this.playCount) this.A.ui('replay');
    this.playCount = (this.playCount || 0) + 1;
```

And in `loadCurrent`, beside `this.creditArmed = false;`:

```js
    this.creditArmed = false;
    this.playCount = 0;
```

- [ ] **Step 3: Keep playback from looking idle**

Inside `play()`'s `while` loop, after `await this.engine.step(1);`:

```js
      this.A.activity();
```

A fourteen-move algorithm running unattended is still attention; without this the heartbeat would treat a long playback as idle time.

- [ ] **Step 4: Instrument `markDone`**

```js
  markDone() {
    const a = this.current(), v = this.currentVar();
    if (!a || !v) return;
    const key = this.likeId(a.id, v.label);
    if (this.state.done.indexOf(key) !== -1) return;
    const prevCount = this.state.done.length;
    const done = this.state.done.concat([key]);
    this.write('cubeteacher.done', done);
    this.setState({ done }, () => this.reportCompletion(a, prevCount, done));
  }

  // Kept out of markDone so the storage write stays the short, obvious thing it
  // was; everything here is reporting, and none of it may throw into the caller.
  reportCompletion(a, prevCount, done) {
    this.A.send(this.AC.eventPath('done', a.id));

    // Variations, not cases: `done` is keyed per variation, and mixing the two
    // would fire every milestone early.
    const total = this.algs().reduce((n, x) => n + (x.variations || []).length, 0);
    this.AC.milestonesCrossed(prevCount, done.length, total)
      .forEach(pct => this.A.send(this.AC.eventPath('milestone', String(pct))));

    if (this.AC.groupComplete(this.algs(), a.group, x => this.caseDone(x))) {
      this.A.send(this.AC.eventPath('section', a.group));
    }
  }
```

- [ ] **Step 5: Instrument `toggleLike`**

```js
  toggleLike(key) {
    const on = this.state.likes.indexOf(key) !== -1;
    const likes = on ? this.state.likes.filter(x => x !== key) : this.state.likes.concat([key]);
    this.write('cubeteacher.likes', likes);
    this.setState({ likes }, () => {
      // The Likes rail can toggle a row belonging to a case other than the open
      // one, so the id comes from the key, not from currentCase().
      const caseId = key.split('::')[0];
      this.A.send(this.AC.eventPath(on ? 'unlike' : 'like', caseId));
      this.bumpBadge();
    });
  }
```

- [ ] **Step 6: Verify in the browser**

At `http://127.0.0.1:8934/CubeTeacher.dc.html?gc=1`, with `localStorage.clear()` first:

1. Play a case to the end → `done/<case>` fires; the sidebar check appears.
2. Play the same case to the end again → **no** second `done/`.
3. Play and pause halfway → `quit/<case>/m<N>` with N matching the counter in the UI.
4. Play, then immediately click another case → `quit/…`, then `time/…`, then `case/…`.
5. Play a case twice → exactly one `ui/replay`.
6. Open a `patterns` case that uses `open: 'end'` → `case/` fires and `done/` does **not**. (This is the `creditArmed` guard; if it regresses, all 22 patterns check off at once.)
7. Like then unlike a row → `like/<case>` then `unlike/<case>`.
8. Complete enough variations to cross 25% → `milestone/25`.

- [ ] **Step 7: Commit**

```bash
git add CubeTeacher.dc.html
git commit -m "feat: completion, like, abandonment and progress events"
```

---

### Task 6: Control usage and failures

**Files:**
- Modify: `CubeTeacher.dc.html` — `handleKey` (~line 838), `scrubDown` (~line 847), `resetAll` (~line 835), `toggleStack` and `toggleLegend` / `dismissLegend` (in `renderVals`), the `catch` in `componentDidMount`

**Interfaces:**
- Consumes: `ui`, `send` from `analytics.js`; `eventPath` from `analytics-core.mjs`.
- Produces: `ui/keyboard`, `ui/scrub`, `ui/reset`, `ui/stack`, `ui/legend`, `fail/<reason>`.

Each `ui/` call is already deduped per case inside `analytics.js`, so these call sites do not need guards of their own — twenty arrow presses produce one hit.

- [ ] **Step 1: Keyboard**

```js
  handleKey(e) {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    const total = this.state.total;
    if (e.key === 'ArrowRight') { e.preventDefault(); this.A.ui('keyboard'); e.shiftKey ? this.jump(total) : this.step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); this.A.ui('keyboard'); e.shiftKey ? this.jump(0) : this.step(-1); }
    else if (e.key === ' ') { e.preventDefault(); this.A.ui('keyboard'); this.play(); }
    else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); this.A.ui('keyboard'); this.resetAll(); }
    else if (e.key === 'Escape') this.setState({ drawer: false, sheet: false, legendOpen: false });
  }
```

- [ ] **Step 2: Reset and scrub**

```js
  resetAll() { this.A.ui('reset'); this.jump(0); if (this.engine) this.engine.resetView(); }
```

In `scrubDown`, in the `up` handler so a drag counts once rather than once per pointermove:

```js
    const up = () => {
      this.A.ui('scrub');
      el.removeEventListener('pointermove', move);
```

- [ ] **Step 3: Stack and legend**

In `renderVals`:

```js
      toggleStack: () => this.setState(s => { if (!s.stripExpanded) this.A.ui('stack'); return { stripExpanded: !s.stripExpanded }; }),
```

```js
      toggleLegend: () => this.setState(s => { if (!s.legendOpen) this.A.ui('legend'); return { legendOpen: !s.legendOpen }; }),
```

`dismissLegend` is left alone: `ui/legend` already records that the panel was opened, and a separate dismiss path would answer nothing the open count does not.

- [ ] **Step 4: Failures**

```js
    } catch (e) {
      console.error('[cubeteacher]', e);
      // No stack and no message text: this is a health signal, not a crash
      // reporter, and a message could carry a path from the user's machine.
      this.A.send(this.AC.eventPath('fail', e && e.name ? e.name : 'unknown'));
    }
```

Note `this.AC` may be undefined if the failure happened before its import resolved; guard by reading `this.AC && this.AC.eventPath` or by sending the literal `'fail/unknown'` in that case. Choose one and say which in the report.

- [ ] **Step 5: Verify in the browser**

At `http://127.0.0.1:8934/CubeTeacher.dc.html?gc=1`:

1. Press an arrow key twenty times → **exactly one** `ui/keyboard` request.
2. Switch to another case, press an arrow once → a second `ui/keyboard`. (Dedupe is per case, not per session.)
3. Drag the scrubber → one `ui/scrub`. Expand the stack → one `ui/stack`. Open the legend → one `ui/legend`. Press R → `ui/reset`.
4. Block `cdn.jsdelivr.net` in devtools and reload: `waitFor(() => window.THREE)` times out and `fail/error` is sent.

- [ ] **Step 6: Commit**

```bash
git add CubeTeacher.dc.html
git commit -m "feat: control usage and failure events"
```

---

### Task 7: Full verification pass

The plan's last task exists because instrumentation fails silently. A missing event produces a confident empty chart, which is worse than no chart.

**Files:** none modified — this task either passes or sends you back to an earlier one.

- [ ] **Step 1: Re-run the headless tests**

```bash
node --test analytics-core.test.mjs && node validate.mjs
```

Expected: 18 analytics tests pass; the algorithm table prints with no failures.

- [ ] **Step 2: Walk the spec's own test list**

From the spec's Verification section, at `http://127.0.0.1:8934/CubeTeacher.dc.html?gc=1`, confirm each and record the evidence:

- [ ] The very first `case/` event of a cold load arrives (queue drains).
- [ ] Opening a pattern with `open: 'end'` fires `case/` and not `done/`.
- [ ] Switching cases mid-playback fires `quit/…/mN`, then `time/…`, then `case/…`.
- [ ] Closing the tab delivers `time/…` via the keepalive fetch — check with "Preserve log" on.
- [ ] Pressing an arrow key twenty times produces exactly one `ui/keyboard`.
- [ ] Backgrounding the tab for two minutes does not advance the time bucket.
- [ ] Blocking `gc.zgo.at` leaves the app fully functional: cube animates, cases switch, likes and completion still save, no uncaught console errors.

- [ ] **Step 3: Confirm the taxonomy is complete**

In the GoatCounter dashboard, confirm every path prefix has been seen at least once: `case/`, `done/`, `like/`, `unlike/`, `quit/`, `time/`, `ui/`, `milestone/`, `section/`, `fail/`.

Any prefix that never appeared is an unwired call site, not a quiet feature.

- [ ] **Step 4: Confirm the author's own traffic is excluded**

Load `http://127.0.0.1:8934/CubeTeacher.dc.html` with no `?gc=1` and confirm zero requests to GoatCounter across a full open, play, complete cycle.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: corrections from the analytics verification pass"
```

Then use the `superpowers:finishing-a-development-branch` skill to decide how `feat/posthog-analytics` gets integrated.
