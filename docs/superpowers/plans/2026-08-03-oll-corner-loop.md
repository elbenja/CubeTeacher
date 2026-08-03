# OLL Corner Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a repeated algorithm block once with its stop condition and a progress tally, instead of expanding it into a wall of identical move chips.

**Architecture:** `algorithms.js` gains an optional `loop` + `run` authoring form. A pure `expandRun()` turns it into the flat `moves` array every consumer already reads, plus a `entries` list (blocks and spacers) and an index map from flat move index into that list. Both chip surfaces — the playback strip and the variation cards in the right panel — render from `entries` instead of from `moves`. `validate.mjs` gains a unit test for the expansion and a proof that the four authored cards' procedure solves all seven corner-orientation cases.

**Tech Stack:** Plain ES modules, no build step, no test framework. Tests live in `validate.mjs` and run with `node validate.mjs`. UI is a DesignCode component (`Cube Trainer.dc.html`) — a class with a `render()` returning a props object, consumed by `<sc-for>` / `<sc-if>` template directives.

## Global Constraints

- No new dependencies. No build step. Everything runs under plain `node` or in the browser as an ES module.
- A variation supplies either `moves` **or** `loop` + `run`, never both.
- Every consumer keeps reading `v.moves`. `expandRun()` populates it; nothing downstream changes its input contract.
- Every beginner variation keeps an explicit `setup`. A setup must never be `invertMoves(v.moves)` — that makes the case solve itself by construction and hides a wrong algorithm.
- Setups for yellow-up steps begin with `z2 y`.
- `node validate.mjs` must exit 0 at the end of every task that touches `.js` files.
- Match the existing code style: two-space indent, single quotes, no semicolon-free lines, comments that explain *why*.

---

### Task 1: `expandRun()` — the repeat model

**Files:**
- Modify: `algorithms.js` (add the function and export it, above `export const ALGORITHMS`)
- Test: `validate.mjs` (new `expansionTest()` called from `main()` before `selfTest()`)

**Interfaces:**
- Produces: `expandRun(v) -> { moves, entries, map }` exported from `algorithms.js`.
  - `moves`: `string[]` — the flat move list.
  - `entries`: `Array<{ kind: 'block', repeat: number, moves: string[], until?: string } | { kind: 'spacer', move: string }>`
  - `map`: `Array<{ entry: number, iteration?: number, offset?: number }>` — one per flat move. Block moves carry `iteration` (0-based) and `offset` (0-based index within `loop`); spacer moves carry `entry` only.
- Consumed by: Tasks 2, 4, 5, 6.

- [ ] **Step 1: Write the failing test**

Add to `validate.mjs`, immediately after the `INVARIANTS` block:

```js
// ---- expansion tests -----------------------------------------------------
// expandRun is the single source of truth for a variation's move list, so a
// silent change here would rewrite algorithms without touching their text.
const EXPANSION_TESTS = [
  {
    name: 'block, spacer, block',
    input: { loop: ["R'", "D'", 'R', 'D'], until: 'yellow points up', run: [2, 'U', 1] },
    moves: ["R'", "D'", 'R', 'D', "R'", "D'", 'R', 'D', 'U', "R'", "D'", 'R', 'D'],
    entries: [
      { kind: 'block', repeat: 2, moves: ["R'", "D'", 'R', 'D'], until: 'yellow points up' },
      { kind: 'spacer', move: 'U' },
      { kind: 'block', repeat: 1, moves: ["R'", "D'", 'R', 'D'], until: 'yellow points up' }
    ],
    map: [
      { entry: 0, iteration: 0, offset: 0 }, { entry: 0, iteration: 0, offset: 1 },
      { entry: 0, iteration: 0, offset: 2 }, { entry: 0, iteration: 0, offset: 3 },
      { entry: 0, iteration: 1, offset: 0 }, { entry: 0, iteration: 1, offset: 1 },
      { entry: 0, iteration: 1, offset: 2 }, { entry: 0, iteration: 1, offset: 3 },
      { entry: 1 },
      { entry: 2, iteration: 0, offset: 0 }, { entry: 2, iteration: 0, offset: 1 },
      { entry: 2, iteration: 0, offset: 2 }, { entry: 2, iteration: 0, offset: 3 }
    ]
  },
  {
    // A flat variation must come out byte-identical to what it is today, with
    // every move its own spacer -- that is what keeps untouched cards rendering
    // exactly as before.
    name: 'flat moves pass through',
    input: { moves: ['F', "U'", 'R', 'U'] },
    moves: ['F', "U'", 'R', 'U'],
    entries: [
      { kind: 'spacer', move: 'F' }, { kind: 'spacer', move: "U'" },
      { kind: 'spacer', move: 'R' }, { kind: 'spacer', move: 'U' }
    ],
    map: [{ entry: 0 }, { entry: 1 }, { entry: 2 }, { entry: 3 }]
  },
  {
    name: 'leading spacer',
    input: { loop: ['R', 'U'], run: ['U', 1, 'y2', 1] },
    moves: ['U', 'R', 'U', 'y2', 'R', 'U'],
    entries: [
      { kind: 'spacer', move: 'U' },
      { kind: 'block', repeat: 1, moves: ['R', 'U'] },
      { kind: 'spacer', move: 'y2' },
      { kind: 'block', repeat: 1, moves: ['R', 'U'] }
    ],
    map: [
      { entry: 0 },
      { entry: 1, iteration: 0, offset: 0 }, { entry: 1, iteration: 0, offset: 1 },
      { entry: 2 },
      { entry: 3, iteration: 0, offset: 0 }, { entry: 3, iteration: 0, offset: 1 }
    ]
  }
];

function expansionTest() {
  let bad = 0;
  console.log('Expansion self-test');
  for (const t of EXPANSION_TESTS) {
    const got = expandRun(t.input);
    const checks = [
      ['moves', JSON.stringify(got.moves) === JSON.stringify(t.moves)],
      ['entries', JSON.stringify(got.entries) === JSON.stringify(t.entries)],
      ['map', JSON.stringify(got.map) === JSON.stringify(t.map)]
    ];
    for (const [what, ok] of checks) {
      if (!ok) { bad++; console.error(`  FAIL ${t.name}: ${what}\n    got  ${JSON.stringify(got[what])}\n    want ${JSON.stringify(t[what])}`); }
    }
    if (checks.every(c => c[1])) console.log(`  ok   ${t.name}`);
  }
  if (bad) { console.error('\nExpansion is wrong. Stopping.'); process.exit(1); }
  console.log('');
}
```

Add `expandRun` to the existing import on line 14:

```js
const { ALGORITHMS, expandRun } = await import('./algorithms.js');
```

And call it first in `main()`:

```js
function main() {
  expansionTest();
  selfTest();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node validate.mjs`
Expected: crash with `expandRun is not a function` (or `undefined`), before any table prints.

- [ ] **Step 3: Write minimal implementation**

Add to `algorithms.js` just above `export const ALGORITHMS`:

```js
// A variation is authored either as a flat `moves` list or as a `loop` block
// plus a `run`: numbers repeat the block, strings are literal spacer moves
// between blocks. Expanding here keeps `moves` the single thing every consumer
// reads, so the engine, the thumbnails and the validator need no special case.
export function expandRun(v) {
  const moves = [], entries = [], map = [];
  if (!v.run) {
    (v.moves || []).forEach((m, i) => {
      moves.push(m);
      entries.push({ kind: 'spacer', move: m });
      map.push({ entry: i });
    });
    return { moves, entries, map };
  }
  for (const item of v.run) {
    const entry = entries.length;
    if (typeof item === 'string') {
      entries.push({ kind: 'spacer', move: item });
      moves.push(item);
      map.push({ entry });
      continue;
    }
    const block = { kind: 'block', repeat: item, moves: v.loop.slice() };
    if (v.until != null) block.until = v.until;
    entries.push(block);
    for (let iteration = 0; iteration < item; iteration++) {
      v.loop.forEach((m, offset) => {
        moves.push(m);
        map.push({ entry, iteration, offset });
      });
    }
  }
  return { moves, entries, map };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node validate.mjs`
Expected: `Expansion self-test` shows three `ok` lines, then the existing model self-test and variation table run as before, exit 0.

- [ ] **Step 5: Commit**

```bash
git add algorithms.js validate.mjs
git commit -m "Add expandRun: author a repeated block instead of its expansion"
```

---

### Task 2: Wire `expandRun` into the module and adopt it for three variations

**Files:**
- Modify: `algorithms.js` (post-process `ALGORITHMS`; rewrite three variations)
- Test: `validate.mjs` (extend `EXPANSION_TESTS`)

**Interfaces:**
- Consumes: `expandRun` from Task 1.
- Produces: every variation object carries `moves`, `entries` and `runMap` after module load. `v.entries` and `v.runMap` are what Tasks 6–8 render from.

- [ ] **Step 1: Write the failing test**

Add a fourth entry to `EXPANSION_TESTS` in `validate.mjs` pinning the Dot expansion to the exact list it has today, so the refactor cannot change a single move:

```js
  {
    name: 'yellow cross dot, three runs',
    input: { loop: ['F', 'R', 'U', "R'", "U'", "F'"], run: [1, 'y2', 1, 'y2', 1] },
    moves: ['F', 'R', 'U', "R'", "U'", "F'", 'y2', 'F', 'R', 'U', "R'", "U'", "F'", 'y2', 'F', 'R', 'U', "R'", "U'", "F'"],
    entries: [
      { kind: 'block', repeat: 1, moves: ['F', 'R', 'U', "R'", "U'", "F'"] },
      { kind: 'spacer', move: 'y2' },
      { kind: 'block', repeat: 1, moves: ['F', 'R', 'U', "R'", "U'", "F'"] },
      { kind: 'spacer', move: 'y2' },
      { kind: 'block', repeat: 1, moves: ['F', 'R', 'U', "R'", "U'", "F'"] }
    ],
    map: [
      { entry: 0, iteration: 0, offset: 0 }, { entry: 0, iteration: 0, offset: 1 }, { entry: 0, iteration: 0, offset: 2 },
      { entry: 0, iteration: 0, offset: 3 }, { entry: 0, iteration: 0, offset: 4 }, { entry: 0, iteration: 0, offset: 5 },
      { entry: 1 },
      { entry: 2, iteration: 0, offset: 0 }, { entry: 2, iteration: 0, offset: 1 }, { entry: 2, iteration: 0, offset: 2 },
      { entry: 2, iteration: 0, offset: 3 }, { entry: 2, iteration: 0, offset: 4 }, { entry: 2, iteration: 0, offset: 5 },
      { entry: 3 },
      { entry: 4, iteration: 0, offset: 0 }, { entry: 4, iteration: 0, offset: 1 }, { entry: 4, iteration: 0, offset: 2 },
      { entry: 4, iteration: 0, offset: 3 }, { entry: 4, iteration: 0, offset: 4 }, { entry: 4, iteration: 0, offset: 5 }
    ]
  }
```

- [ ] **Step 2: Run test to verify it passes already, then break it deliberately**

Run: `node validate.mjs`
Expected: four `ok` lines. This test guards the refactor rather than driving it — confirm it is green *before* touching the three variations, so that a red result in Step 4 means the refactor changed moves.

- [ ] **Step 3: Wire the post-process and rewrite three variations**

At the very bottom of `algorithms.js`, after the `ALGORITHMS` array literal:

```js
// Authoring a repeat is only half of it -- every variation is normalised here so
// that `moves`, `entries` and `runMap` are always present, whichever form was
// used. Consumers never have to ask which.
for (const alg of ALGORITHMS) {
  for (const v of alg.variations) {
    const { moves, entries, map } = expandRun(v);
    v.moves = moves;
    v.entries = entries;
    v.runMap = map;
  }
}
```

Then replace the three `moves:` lists. Yellow Cross — Dot (currently `algorithms.js:124`):

```js
      { label: 'Dot (three runs)',
        loop: ['F', 'R', 'U', "R'", "U'", "F'"], run: [1, 'y2', 1, 'y2', 1],
        setup: ['z2', 'y', 'F', 'U', 'R', "U'", "R'", "F'", 'y2', 'F', 'U', 'R', "U'", "R'", "F'", 'y2', 'F', 'U', 'R', "U'", "R'", "F'"],
        keep: F2L_AND_LL_EDGES,
        source: 'ruwix-step-4#dot',
        note: 'Ruwix runs the algorithm three times from a dot, turning the whole cube 180° between runs. Dot to L, L to line, line to cross.' },
```

Swap The Yellow Edges — Two opposite edges (currently `algorithms.js:142`):

```js
      { label: 'Two opposite edges',
        loop: ['R', 'U', "R'", 'U', 'R', 'U2', "R'", 'U'], run: ['U', 1, 'y2', 1],
        setup: ['z2', 'y', "U'", 'R', 'U2', "R'", "U'", 'R', "U'", "R'", 'y2', "U'", 'R', 'U2', "R'", "U'", 'R', "U'", "R'", "U'"],
        keep: F2L_AND_LL_EDGES,
        source: 'ruwix-step-5#applied-twice',
        note: 'Edges facing each other cannot be swapped directly. Ruwix sets up with a U, runs the algorithm, turns the whole cube 180°, and runs it again.' },
```

Position Yellow Corners — Run it again (currently `algorithms.js:160`):

```js
      { label: 'Run it again',
        loop: ['U', 'R', "U'", "L'", 'U', "R'", "U'", 'L'], run: [2],
        setup: ['z2', 'y', "L'", 'U', 'R', "U'", 'L', 'U', "R'", "U'", "L'", 'U', 'R', "U'", 'L', 'U', "R'", "U'"],
        dim: false,
        source: 'ruwix-step-6#cycle-three-corners',
        note: "Ruwix: \"if the pieces didn't get where they belong do the algorithm one more time\" — the three corners cycle the other way round. If no corner is home at all, run it once from any angle to create one, then re-hold with that corner front-right; Ruwix does not animate that setup case." },
```

Leave Second Layer — Edge flipped in its slot (`algorithms.js:102`) alone. Its two halves differ by the merged `U′` its own note documents, so it is not a repeat.

- [ ] **Step 4: Run the full validator**

Run: `node validate.mjs`
Expected: four expansion `ok` lines, model self-test passes, and the variation table shows the **same verdicts as before this task** — every beginner row `match`. If any of the three rewritten rows changes verdict, the expansion produced different moves; compare `node validate.mjs --dump` output against `git stash` of the previous state.

- [ ] **Step 5: Commit**

```bash
git add algorithms.js validate.mjs
git commit -m "Author the three repeat-shaped variations as loop + run"
```

---

### Task 3: Key `CHECKS` by label instead of array position

**Files:**
- Modify: `validate.mjs:218-316` (the `CHECKS` table), `validate.mjs:355-366` (the lookup in `main`)

**Interfaces:**
- Consumes: nothing new.
- Produces: `CHECKS[algId].cases` becomes an object keyed by variation label rather than an array. `main()` reports an unmatched key as a failure.

- [ ] **Step 1: Write the failing test**

There is no separate test file; the guard is the validator's own output. Add this check inside the `alg.variations.forEach` loop in `main()`, right after the existing `const c = spec && spec.cases[i];` line is replaced (see Step 3), and add a post-loop orphan check after the `for (const alg of ...)` loop in `main()`:

```js
  // A predicate keyed to a label that no longer exists is a silent hole: the
  // variation it guarded would report "no case predicate" and still pass.
  for (const [algId, spec] of Object.entries(CHECKS)) {
    const alg = ALGORITHMS.find(a => a.id === algId);
    const labels = alg ? alg.variations.map(v => v.label) : [];
    for (const key of Object.keys(spec.cases)) {
      if (labels.indexOf(key) === -1) {
        console.error(`orphan case predicate: ${algId} -> "${key}"`);
        fails++;
      }
    }
  }
```

- [ ] **Step 2: Run to verify it fails**

Run: `node validate.mjs`
Expected: `spec.cases` is still an array at this point, so `Object.keys` yields `'0'`, `'1'`, … and every one is reported as an orphan. Non-zero exit.

- [ ] **Step 3: Convert the table**

In every entry of `CHECKS`, change `cases: [ ... ]` from an array to an object keyed by the variation's exact `label` string, dropping the now-redundant `name` field only where it duplicates the label — keep `name` where it describes the *start state* rather than the variation. For example `b-orient-last-corners` becomes:

```js
  'b-orient-last-corners': {
    goal: c => solved(c),
    goalName: 'cube solved',
    cases: {
      'Twist one corner (two loops)': { name: 'URF twisted, F2L intact', test: twistCase,
        goal: c => sticker(c, vecOf('UFR'), 'U') === centre(c, 'U') && cornersPositioned(c, UP),
        goalName: 'front-right corner now yellow-up (F2L still open — two more loops owed)' },
      'Twist one corner (four loops)': { name: 'URF twisted the other way, F2L intact', test: twistCase,
        goal: c => sticker(c, vecOf('UFR'), 'U') === centre(c, 'U') && cornersPositioned(c, UP),
        goalName: 'front-right corner now yellow-up (F2L still open — two more loops owed)' },
      'Two corners, start to finish': { name: 'two adjacent corners twisted, F2L intact', test: twistCase }
    }
  }
```

Apply the same shape to all seven beginner entries, using each variation's current `label` from `algorithms.js` as the key.

Then change the lookup in `main()`:

```js
      const c = spec && spec.cases[v.label];
```

Update the comment at `validate.mjs:207` from "Keyed by `${id}#${index}`" to describe label keying.

- [ ] **Step 4: Run to verify it passes**

Run: `node validate.mjs`
Expected: no orphan lines, every beginner row `match`, exit 0. Deliberately misspell one key, re-run, confirm one orphan is reported and one row says `no case predicate`, then restore it.

- [ ] **Step 5: Commit**

```bash
git add validate.mjs
git commit -m "Key case predicates by variation label, not array position"
```

---

### Task 4: Prove the procedure solves all seven cases

**Files:**
- Modify: `validate.mjs` (new `procedureTest()`, called from `main()` after `selfTest()`)

**Interfaces:**
- Consumes: `solvedCube`, `applyMoves`, `sticker`, `vecOf`, `centre`, `solved` — all already defined in `validate.mjs`.
- Produces: `TWIST_CLASSES` — an array of `{ key, counts }`, one per non-solved corner-orientation class, used by Task 5 to pick setup targets.

A working reference implementation lives at `scratchpad/enumerate-oll.mjs`. Two bugs to avoid, both of which produced plausible-looking wrong output: the initial hold must be counted into the final `U` restore, and conjugating the 120° twist matrix by `diag(p)` reverses the turn direction at corners of negative sign parity, so it must be transposed back.

- [ ] **Step 1: Write the failing test**

Add to `validate.mjs` after `selfTest()`:

```js
// -------------------------------------------------- corner-orientation cases
// Four cards cover seven cases, which is only defensible if the procedure they
// teach -- loop until yellow is up, U to the next twisted corner -- provably
// solves every one. So it is asserted here rather than asserted in prose.

const TWIST_SLOTS = ['UFR', 'UFL', 'UBL', 'UBR'];   // U maps UFR -> UFL
const TWIST_LOOP = ["R'", "D'", 'R', 'D'];
const TWIST_BASE = [[0, 0, 1], [1, 0, 0], [0, 1, 0]];

// Rotation by 120 degrees about the body diagonal through a corner. diag(p) is a
// reflection when the sign parity is negative, which silently flips the turn
// direction, so transpose it back -- otherwise "twist 1" means opposite things
// at different corners and the class count comes out wrong.
function twistMat(p) {
  const T = [0, 1, 2].map(i => [0, 1, 2].map(j => p[i] * TWIST_BASE[i][j] * p[j]));
  return p[0] * p[1] * p[2] > 0 ? T : [0, 1, 2].map(i => [0, 1, 2].map(j => T[j][i]));
}

function twistedCube(counts) {
  const cube = solvedCube();
  TWIST_SLOTS.forEach((tok, i) => {
    const p = vecOf(tok);
    const c = cube.find(x => x.pos.every((v, k) => v === p[k]));
    const T = twistMat(p);
    for (let n = 0; n < ((counts[i] % 3) + 3) % 3; n++) c.m = mulMat(T, c.m);
  });
  return cube;
}

const cornerUp = (cube, tok) => sticker(cube, vecOf(tok), 'U') === centre(cube, 'U');
const allCornersUp = cube => TWIST_SLOTS.every(t => cornerUp(cube, t));

export const TWIST_CLASSES = (() => {
  const canon = v => {
    let best = null;
    for (let r = 0; r < 4; r++) {
      const k = v.slice(r).concat(v.slice(0, r)).join('');
      if (best === null || k < best) best = k;
    }
    return best;
  };
  const seen = new Map();
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) for (let d = 0; d < 3; d++) {
    if ((a + b + c + d) % 3 !== 0) continue;          // corner twists must sum to 0 mod 3
    const key = canon([a, b, c, d]);
    if (!seen.has(key) && key !== '0000') seen.set(key, [a, b, c, d]);
  }
  return [...seen].map(([key, counts]) => ({ key, counts }));
})();

// Run the beginner procedure from a given hold. Returns the loop/spacer shape,
// or null if it failed to terminate.
export function runProcedure(counts, hold) {
  const cube = twistedCube(counts);
  applyMoves(cube, Array(hold).fill('U'));
  const shape = [];
  let uTurns = hold, guard = 0;
  while (!allCornersUp(cube)) {
    if (++guard > 20) return null;
    let k = 0;
    while (cornerUp(cube, 'UFR')) { applyMoves(cube, ['U']); k++; uTurns++; }
    if (k) shape.push(k === 1 ? 'U' : k === 2 ? 'U2' : "U'");
    let n = 0;
    while (!cornerUp(cube, 'UFR')) { applyMoves(cube, TWIST_LOOP); n++; if (n > 6) return null; }
    shape.push(n);
  }
  const fin = (4 - (uTurns % 4)) % 4;
  if (fin) { applyMoves(cube, Array(fin).fill('U')); shape.push(fin === 1 ? 'U' : fin === 2 ? 'U2' : "U'"); }
  return { shape, solved: solved(cube) };
}

function procedureTest() {
  console.log('Corner-orientation procedure');
  let bad = 0;
  if (TWIST_CLASSES.length !== 7) {
    console.error(`  FAIL expected 7 non-solved classes, got ${TWIST_CLASSES.length}`);
    bad++;
  }
  for (const { key, counts } of TWIST_CLASSES) {
    const runs = [0, 1, 2, 3].map(h => runProcedure(counts, h));
    const ok = runs.every(r => r && r.solved);
    if (!ok) { bad++; console.error(`  FAIL [${key}] procedure did not solve from every hold`); }
    else console.log(`  ok   [${key}] ${runs[1].shape.map(s => (typeof s === 'number' ? '×' + s : s)).join(' ')}`);
  }
  if (bad) { console.error('\nProcedure is wrong. Stopping.'); process.exit(1); }
  console.log('');
}
```

`mulMat` already exists at `validate.mjs:37`. Call `procedureTest();` from `main()` after `selfTest();`.

- [ ] **Step 2: Run to verify it fails**

Before adding the function body, run `node validate.mjs` — expected: `procedureTest is not defined`. After adding, it should pass; if it reports fewer than 7 classes or an unsolved case, the twist matrix handedness fix is missing.

- [ ] **Step 3: (folded into Step 1)**

The implementation is the test here — this task asserts a property of the existing engine, not of new production code.

- [ ] **Step 4: Run to verify it passes**

Run: `node validate.mjs`
Expected: `Corner-orientation procedure` prints 7 `ok` lines, exit 0.

- [ ] **Step 5: Commit**

```bash
git add validate.mjs
git commit -m "Assert the corner loop solves all seven orientation cases"
```

---

### Task 5: Author the four cards and derive their setups

**Files:**
- Modify: `algorithms.js:167-189` (`b-orient-last-corners`), `validate.mjs` (its `CHECKS` entry)
- Create: `scratchpad/find-setups.mjs` (throwaway; not committed)

**Interfaces:**
- Consumes: `TWIST_CLASSES`, `runProcedure` from Task 4; `expandRun` from Task 1.
- Produces: four variations with `loop`, `until`, `run`, `setup`, and an `unit: 'corner'` field on the algorithm.

- [ ] **Step 1: Write the setup search**

Setups must not be the inverse of their own moves. Search `⟨R, U⟩` instead — that subgroup contains exactly the algorithms that twist last-layer corners while returning F2L, so it yields genuinely independent setups. Consecutive same-face moves collapse, so restricting to alternating faces makes the search tiny (about 350k sequences to depth 11).

Create `scratchpad/find-setups.mjs`:

```js
const V = await import('../algorithms.js') && await import('../validate.mjs');
const { stateOf, applyMoves, solvedCube, sticker, vecOf, centre, f2lSolved, crossSolved, cornersPositioned } = V;

const SLOTS = ['UFR', 'UFL', 'UBL', 'UBR'];
const BASE = ['R', 'U'];
const SUF = ['', "'", '2'];

// Read the twist of each U corner: 0 if yellow is up, else 1 or 2 depending on
// which side face the U sticker landed on.
function twistVector(cube) {
  return SLOTS.map(tok => {
    const p = vecOf(tok);
    if (sticker(cube, p, 'U') === centre(cube, 'U')) return 0;
    const sides = tok.split('').filter(f => f !== 'U');
    return sticker(cube, p, sides[0]) === centre(cube, 'U') ? 1 : 2;
  });
}

const START = ['z2', 'y'];
function search(target, maxLen) {
  const want = target.join('');
  const out = [];
  const walk = (seq, lastFace) => {
    if (seq.length) {
      const cube = applyMoves(stateOf(START), seq);
      if (f2lSolved(cube, 'D') && crossSolved(cube, 'U') && cornersPositioned(cube, 'U')
        && twistVector(cube).join('') === want) { out.push(seq.slice()); return true; }
    }
    if (seq.length >= maxLen) return false;
    for (const f of BASE) {
      if (f === lastFace) continue;
      for (const s of SUF) { seq.push(f + s); if (walk(seq, f)) { seq.pop(); return true; } seq.pop(); }
    }
    return false;
  };
  for (let d = 1; d <= maxLen; d++) { out.length = 0; if (walk([], null) && out.length) return out[0]; }
  return null;
}

// Targets: the exact twist vector each card's run is authored against.
const TARGETS = {
  'Two corners twisted, side by side': [0, 0, 1, 2],
  'Two corners twisted, diagonal': [0, 1, 0, 2],
  'Three corners twisted': [0, 2, 2, 2],
  'All four corners twisted': [1, 1, 2, 2]
};
for (const [name, t] of Object.entries(TARGETS)) {
  const seq = search(t, 11);
  console.log(name, '->', seq ? JSON.stringify(START.concat(seq)) : 'NOT FOUND');
}
```

Run: `node scratchpad/find-setups.mjs`

- [ ] **Step 2: Verify each found setup produces the claimed case**

For each printed setup, confirm by hand that it is not `invertMoves` of the card's moves (it cannot be — it is `⟨R,U⟩` only, and the cards are `R'/D'/R/D` plus `U`). If `search` returns `NOT FOUND` for a target, raise `maxLen` to 13 and re-run.

- [ ] **Step 3: Author the four cards**

Replace the `variations` array of `b-orient-last-corners` in `algorithms.js`, and add `unit: 'corner'` to the algorithm object. Substitute each `setup` with the array printed in Step 1.

```js
    id: 'b-orient-last-corners', group: 'beginner', name: 'Orient Last Layer Corners',
    unit: 'corner',
    goal: 'Twist each yellow corner so yellow points up. This finishes the cube.',
    whenToUse: 'Every corner is in the right slot but some are twisted.',
    whyItWorks: "Same R' D' R D loop as the first layer, applied to a corner held front-right. Each loop advances that corner's twist by a fixed step, so a corner is either two loops or four from home — you never count, you stop when yellow is up. The loop has order six, so the two layers below only come back together once the counts across every corner add up to a multiple of six, which is why the cube looks wrecked in between. Never rotate the cube between corners — only U.",
    variations: [
      { label: 'Two corners twisted, side by side',
        loop: ["R'", "D'", 'R', 'D'], until: 'yellow points up', run: [2, 'U', 4, 'U2'],
        setup: [/* from Step 1 */],
        dim: false,
        source: 'ruwix-step-7#example-1' },
      { label: 'Two corners twisted, diagonal',
        loop: ["R'", "D'", 'R', 'D'], until: 'yellow points up', run: [2, 'U2', 4, 'U'],
        setup: [/* from Step 1 */],
        dim: false,
        source: 'ruwix-step-7#example-1' },
      { label: 'Three corners twisted',
        loop: ["R'", "D'", 'R', 'D'], until: 'yellow points up', run: [2, 'U', 2, 'U', 2, 'U'],
        setup: [/* from Step 1 */],
        dim: false,
        source: 'ruwix-step-7#example-1' },
      { label: 'All four corners twisted',
        loop: ["R'", "D'", 'R', 'D'], until: 'yellow points up', run: [2, 'U', 2, 'U', 4, 'U', 4],
        setup: [/* from Step 1 */],
        dim: false,
        source: 'ruwix-step-7#example-1' }
    ]
```

- [ ] **Step 4: Update the case predicates and run the validator**

Replace the `b-orient-last-corners` entry in `CHECKS` (now label-keyed from Task 3):

```js
  'b-orient-last-corners': {
    goal: c => solved(c),
    goalName: 'cube solved',
    cases: {
      'Two corners twisted, side by side': { name: 'two adjacent corners twisted, F2L intact', test: twistCase },
      'Two corners twisted, diagonal': { name: 'two diagonal corners twisted, F2L intact', test: twistCase },
      'Three corners twisted': { name: 'three corners twisted, F2L intact', test: twistCase },
      'All four corners twisted': { name: 'all four corners twisted, F2L intact', test: twistCase }
    }
  }
```

Add an assertion inside `main()`'s per-variation loop that no setup inverts its own moves:

```js
      if (v.setup && JSON.stringify(parseMoves(v.setup)) === JSON.stringify(invertMoves(v.moves))) {
        notes.push('setup is the inverse of moves'); verdict = 'mismatch';
      }
```

Run: `node validate.mjs`
Expected: all four new rows `match`, goal `cube solved`, no orphan predicates, exit 0.

- [ ] **Step 5: Commit**

```bash
git add algorithms.js validate.mjs
git commit -m "Replace the corner-orientation cards with four keyed by arrangement"
```

---

### Task 6: A shared render model for entries

**Files:**
- Modify: `Cube Trainer.dc.html` (helper method on the component class, near `currentVar()` around line 348)

**Interfaces:**
- Consumes: `v.entries` and `v.runMap` from Task 2.
- Produces two methods on the component class:
  - `structureLabel(v)` → `string` — the header badge text.
  - `renderEntries(v, opts)` → `Array<{ key, kind, chips?, dots?, until?, face?, label?, state?, tip?, jump? }>` where `opts` is `{ index, interactive }`. `kind` is `'block'` or `'spacer'`.

- [ ] **Step 1: Write `structureLabel`**

Add to the component class:

```js
  // The header badge reports structure, not a move total. A 51-move card is the
  // easiest kind of case -- three identical corners -- and a raw count says the
  // opposite.
  structureLabel(v) {
    const blocks = (v.entries || []).filter(e => e.kind === 'block');
    const total = (v.moves || []).length + ' moves';
    if (!blocks.length) return total;
    const reps = blocks.map(b => b.repeat);
    if (blocks.length === 1) return reps[0] > 1 ? '×' + reps[0] : total;
    const unit = this.current() && this.current().unit ? this.current().unit : 'run';
    const head = blocks.length + ' ' + unit + 's';
    if (reps.every(r => r === 1)) return head;
    return head + ' · ' + (reps.every(r => r === reps[0]) ? '×' + reps[0] + ' each' : reps.map(r => '×' + r).join(', '));
  }
```

Expected outputs, to check by eye once the panel renders in Task 7: side by side → `2 corners · ×2, ×4`; three corners → `3 corners · ×2 each`; all four → `4 corners · ×2, ×2, ×4, ×4`; Dot → `3 runs`; Two opposite edges → `2 runs`; Run it again → `×2`; every untouched variation → `N moves` exactly as today.

- [ ] **Step 2: Write `renderEntries`**

```js
  // One render item per run entry. `index` is the current flat move index, used
  // to fill the tally and mark the live chip; pass -1 for a static card.
  renderEntries(v, opts) {
    const entries = v.entries || [], map = v.runMap || [];
    const at = opts.index >= 0 && opts.index < map.length ? map[opts.index] : null;
    let flat = 0;
    return entries.map((e, ei) => {
      if (e.kind === 'spacer') {
        const i = flat++;
        return {
          key: ei + ':s', kind: 'spacer', i, face: e.move[0], label: pretty(e.move),
          state: i < opts.index ? 'past' : i === opts.index ? 'current' : 'future',
          tip: describe(e.move),
          jump: opts.interactive ? this.cache('jump-' + i, () => () => this.jump(i)) : null
        };
      }
      const first = flat;
      flat += e.repeat * e.moves.length;
      const live = at && at.entry === ei;
      const iteration = live ? at.iteration : (opts.index >= first ? e.repeat : 0);
      return {
        key: ei + ':b', kind: 'block', until: e.until || null,
        badge: e.until ? null : (e.repeat > 1 ? '×' + e.repeat : null),
        dots: Array.from({ length: e.repeat }, (_, k) => ({ key: k, on: k < iteration ? 'true' : 'false' })),
        chips: e.moves.map((m, off) => {
          const target = first + (live ? at.iteration : 0) * e.moves.length + off;
          return {
            key: ei + ':' + off, i: target, face: m[0], label: pretty(m),
            state: live && off < at.offset ? 'past' : live && off === at.offset ? 'current' : 'future',
            tip: describe(m),
            jump: opts.interactive ? this.cache('jump-' + ei + '-' + off, () => () => this.jump(target)) : null
          };
        })
      };
    });
  }
```

- [ ] **Step 3: Verify the flat path is unchanged**

Open the app and select **First Layer Edges → Flip the last edge**, which has no `run`. Every move is a `spacer` item, so the strip must look and behave exactly as before: four chips, same colours, same click-to-jump.

- [ ] **Step 4: Check the console**

Expected: no errors from `renderEntries` on any variation. Cycle every beginner algorithm once.

- [ ] **Step 5: Commit**

```bash
git add "Cube Trainer.dc.html"
git commit -m "Add a shared render model for run entries"
```

---

### Task 7: Render blocks in the variation cards

**Files:**
- Modify: `Cube Trainer.dc.html:109-113` (card CSS), `:249-264` (card template), `:534-543` (the `variations` prop)

**Interfaces:**
- Consumes: `structureLabel`, `renderEntries` from Task 6.
- Produces: `v.items` on each variation prop, replacing `v.chips`.

- [ ] **Step 1: Add the block CSS**

After `.ct-var canvas` at line 113:

```css
.ct-loop{display:inline-flex;align-items:center;gap:5px;padding:5px 7px;border-radius:10px;background:var(--gray-0);box-shadow:inset 0 0 0 1px var(--border-default)}
.ct-until{font:var(--type-caption);color:var(--text-secondary);padding-left:4px;white-space:nowrap}
.ct-tally{display:inline-flex;align-items:center;gap:4px}
.ct-pip{width:7px;height:7px;border-radius:50%;background:var(--gray-300)}
.ct-pip[data-on="true"]{background:var(--text-primary)}
```

- [ ] **Step 2: Swap the card template**

Replace the header line at `:251-254` and the chip loop at `:257-261`:

```html
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
            <span style="font:var(--type-section-label)">{{ v.label }}</span>
            <span style="font:var(--type-mono);font-size:var(--text-2xs);color:var(--text-tertiary);margin-left:auto">{{ v.structure }}</span>
          </div>
```

```html
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin-top:8px">
              <sc-for list="{{ v.items }}" as="it" hint-placeholder-count="3">
                <sc-if condition="{{ it.isBlock }}">
                  <span class="ct-loop">
                    <sc-for list="{{ it.chips }}" as="mc" hint-placeholder-count="4">
                      <span class="ct-mini" data-face="{{ mc.face }}">{{ mc.label }}</span>
                    </sc-for>
                    <span class="ct-until">{{ it.untilText }}</span>
                  </span>
                  <span class="ct-tally">
                    <sc-for list="{{ it.dots }}" as="d" hint-placeholder-count="2">
                      <span class="ct-pip" data-on="{{ d.on }}"></span>
                    </sc-for>
                  </span>
                </sc-if>
                <sc-if condition="{{ it.isSpacer }}">
                  <span class="ct-mini" data-face="{{ it.face }}">{{ it.label }}</span>
                </sc-if>
              </sc-for>
            </div>
```

**Nesting risk:** this is three levels of `sc-for` (variations → items → chips). Verify it renders before continuing. If the templating flattens or drops the innermost loop, fall back to giving each block item a pre-joined `text` string (`"R′ D′ R D"`) rendered in one `.ct-loop` span, and drop the per-move mini chips inside cards only — the playback strip in Task 8 keeps per-move chips because it is only two levels deep there.

- [ ] **Step 3: Feed the props**

Replace the `variations` mapping at `:534-543`:

```js
    const variations = (alg ? alg.variations : []).map((v, i) => ({
      key: alg.id + ':' + i, label: v.label,
      structure: this.structureLabel(v),
      sel: i === S.varIdx ? 'true' : 'false',
      items: this.renderEntries(v, { index: -1, interactive: false }).map(it => ({
        key: it.key, isBlock: it.kind === 'block', isSpacer: it.kind === 'spacer',
        face: it.face, label: it.label, chips: it.chips, dots: it.dots,
        untilText: it.until ? '↻ until ' + it.until : (it.badge || '')
      })),
      canvasRef: this.cache('cv-' + i, () => el => { this.varCanvas[i] = el; if (el && this.pool) requestAnimationFrame(() => this.drawThumbs()); }),
      select: this.cache('var-' + i, () => () => this.selectVar(i)),
      tilt: this.cache('tilt', () => e => this.tilt(e)),
      untilt: this.cache('untilt', () => e => this.untilt(e))
    }));
```

- [ ] **Step 4: Verify in the browser**

Open the app, select **Orient Last Layer Corners**. Expected: four cards; each shows one `R′ D′ R D` group per corner with `↻ until yellow points up` and a tally, `U` / `U2` chips between, and a header reading `2 corners · ×2, ×4`, `2 corners · ×2, ×4`, `3 corners · ×2 each`, `4 corners · ×2, ×2, ×4, ×4`. No card shows a raw move count. Then check **First Layer Edges** still shows four plain chips and `4 moves`.

- [ ] **Step 5: Commit**

```bash
git add "Cube Trainer.dc.html"
git commit -m "Render variation cards as loop blocks with a stop condition"
```

---

### Task 8: Render blocks in the playback strip

**Files:**
- Modify: `Cube Trainer.dc.html:209-216` (strip template), `:527-532` (the `chips` prop), `:440-455` (`positionRing`)

**Interfaces:**
- Consumes: `renderEntries` from Task 6 with `{ index: S.index, interactive: true }`.
- Produces: `stripItems` replacing the `chips` prop.

- [ ] **Step 1: Swap the strip template**

```html
      <sc-for list="{{ stripItems }}" as="it" hint-placeholder-count="7">
        <sc-if condition="{{ it.isBlock }}">
          <span class="ct-loop">
            <sc-for list="{{ it.chips }}" as="c" hint-placeholder-count="4">
              <button class="ct-chip ct-tip" data-face="{{ c.face }}" data-state="{{ c.state }}" data-i="{{ c.i }}" data-tip="{{ c.tip }}" onClick="{{ c.jump }}" aria-label="{{ c.tip }}">
                <span class="ct-dot"></span>{{ c.label }}
              </button>
            </sc-for>
            <span class="ct-until">{{ it.untilText }}</span>
          </span>
          <span class="ct-tally">
            <sc-for list="{{ it.dots }}" as="d" hint-placeholder-count="2">
              <span class="ct-pip" data-on="{{ d.on }}"></span>
            </sc-for>
          </span>
        </sc-if>
        <sc-if condition="{{ it.isSpacer }}">
          <button class="ct-chip ct-tip" data-face="{{ it.face }}" data-state="{{ it.state }}" data-i="{{ it.i }}" data-tip="{{ it.tip }}" onClick="{{ it.jump }}" aria-label="{{ it.tip }}">
            <span class="ct-dot"></span>{{ it.label }}
          </button>
        </sc-if>
      </sc-for>
```

- [ ] **Step 2: Feed the props**

Replace the `chips` mapping at `:527-532` with:

```js
    const stripItems = cv ? this.renderEntries(cv, { index: S.index, interactive: true }).map(it => ({
      key: it.key, isBlock: it.kind === 'block', isSpacer: it.kind === 'spacer',
      face: it.face, label: it.label, state: it.state, tip: it.tip, jump: it.jump,
      i: it.i != null ? String(it.i) : '',
      chips: it.chips, dots: it.dots,
      untilText: it.until ? '↻ until ' + it.until : (it.badge || '')
    })) : [];
```

Return `stripItems` instead of `chips` from `render()`. The `i` field each item carries comes from `renderEntries` (Task 6) and is the move's flat index — for a block chip, the index of that move *in the block's current iteration*, which is what keeps `data-i` unique across the strip.

- [ ] **Step 3: Fix the focus ring lookup**

`positionRing` finds the live chip with `strip.querySelector('[data-i="' + this.state.index + '"]')`. Because a block renders only its current iteration's chips, that selector still matches exactly one element — but only if `data-i` carries the *flat* index of the chip's current target, which Step 2 arranges. Verify by stepping through a four-corner card and watching the ring track the highlighted chip through all four iterations.

- [ ] **Step 4: Verify playback end to end**

Open **Orient Last Layer Corners → All four corners twisted**. Expected:
- Play runs all 51 moves and ends on a solved cube.
- The tally on each block fills one pip per completed loop.
- The move counter still reads `n / 51`.
- Left/right arrows and scrub move one flat move at a time.
- Clicking the second chip of the third block jumps into that block's current iteration.
- Then check an untouched variation (**Yellow Cross → Line**) behaves exactly as before.

- [ ] **Step 5: Commit**

```bash
git add "Cube Trainer.dc.html"
git commit -m "Render the playback strip as loop blocks with a live tally"
```

---

## Self-review notes

Checked against the spec:

- Data model (`loop`/`run`/`until`, expansion, index map) — Tasks 1, 2.
- Rendering rules (count ≥2, count 1, spacer, structural badge, `unit`) — Tasks 6, 7.
- Playback (flat index, highlight, tally, click-to-seek) — Tasks 6, 8.
- Validation (expansion test, label-keyed `CHECKS`, seven-case proof, setup constraints) — Tasks 1, 3, 4, 5.
- Content changes (four cards, three collapses, Edge-flipped left alone) — Tasks 2, 5.
- Out of scope (no camera/thumbnail/advanced changes) — respected; no task touches `cube-engine.js`.

Known risk carried into execution: the three-level `sc-for` nesting in Task 7 is unverified against the DesignCode templating. The fallback is written into that task's Step 2.
