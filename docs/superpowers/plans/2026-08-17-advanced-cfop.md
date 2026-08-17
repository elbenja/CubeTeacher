# Advanced 2-look CFOP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four self-solving Advanced stubs with 29 verified 2-look CFOP cases, a derived top-face recognition badge, and validator coverage.

**Architecture:** Content lives in `algorithms.js` in the existing variation shape. Every case is proved by a start predicate plus a goal predicate in `validate.mjs`, which is the arbiter for every algorithm choice. The recognition badge is computed from each case's `setup` at render time, never authored.

**Tech Stack:** Vanilla ES modules, three.js (browser only), Node for `validate.mjs`. No test framework — `node validate.mjs` **is** the test suite.

**Spec:** [2026-08-17-advanced-cfop-design.md](../specs/2026-08-17-advanced-cfop-design.md)

## Global Constraints

- **No wide moves.** `parseMoves` accepts only `/([UDLRFBMESxyz])(2|')?/` (cube-engine.js:26). Wide moves must be expressed as slices: **`r = R M'`**, **`r' = R' M`**, **`f = F S`**, **`f' = F' S'`**. Both expansions used below are verified.
- **Every advanced `setup` is `['z2', 'y', ...invertMoves(moves)]`** — explicit, never omitted. `z2 y` matches the beginner cards' orientation (white to D, Ruwix side colours).
- **No two consecutive turns of the same face** in `moves`. `adjacentSameFace` fails the build on this.
- Every advanced variation needs `keep` (or `dim: false`), or the validator emits a warning.
- Case labels in `algorithms.js` and keys in `CHECKS` must match exactly — a mismatch is reported as an orphan predicate and fails the build.

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `validate.mjs` | Case predicates, goals, the whole test suite | Modify: stub fix, filter, per-case goals, 3 predicates, 4 CHECKS entries, probe mode |
| `algorithms.js` | All content | Modify: 2 keep constants, 4 advanced entries rewritten |
| `cube-engine.js` | Cube state and rendering | Modify: add `topFacePattern` export |
| `Cube Trainer.dc.html` | View model and markup | Modify: badge cells, section headings, CSS |

---

### Task 1: Restore the validator

`validate.mjs` currently dies on import. Commit `74db087` added a module-scope `new THREE.Color()` to cube-engine.js:152 that the `window.THREE = {}` stub cannot satisfy. Nothing else in this plan can be verified until this is fixed.

**Files:**
- Modify: `validate.mjs:11`

**Interfaces:**
- Produces: a runnable `node validate.mjs`.

- [ ] **Step 1: Confirm the failure**

Run: `node validate.mjs`
Expected: `TypeError: THREE.Color is not a constructor`

- [ ] **Step 2: Extend the THREE stub**

Replace line 11 of `validate.mjs`:

```js
globalThis.window = { THREE: {}, matchMedia: () => ({ matches: false }) };
```

with:

```js
// cube-engine.js builds a couple of THREE.Color instances at module scope (the
// hover-ghost WHITE). None of the functions used here touch three.js, but the
// import still has to survive, so the stub carries a Color that satisfies the
// calls made during module evaluation.
globalThis.window = {
  THREE: { Color: class { constructor() {} copy() { return this; } lerp() { return this; } } },
  matchMedia: () => ({ matches: false })
};
```

- [ ] **Step 3: Confirm it runs green**

Run: `node validate.mjs`
Expected: `23 variations, 23 match, 0 need attention`

- [ ] **Step 4: Commit**

```bash
git add validate.mjs
git commit -m "fix: restore validate.mjs after the module-scope THREE.Color"
```

---

### Task 2: Probe mode

Authoring 29 cases means repeatedly asking "what case does this algorithm actually produce?". Doing that by eye is how the current stubs happened. This adds a reporting mode that answers it mechanically.

**Files:**
- Modify: `validate.mjs` (append before `main()`; wire a CLI branch)

**Interfaces:**
- Produces: `node validate.mjs --probe "R U R' U R U2 R'"` printing the case signature of a candidate.
- Consumes: `stateOf`, `applyMoves`, `sticker`, `centre`, `solved`, `adjacentSameFace` (all already in the file).

- [ ] **Step 1: Add the signature readers**

Add near the other state readers in `validate.mjs`:

```js
// ------------------------------------------------------------ case signature
// Advanced cases are chosen by asking what an algorithm's inverse produces, so
// the authoring loop needs to read a candidate's case back out. Everything here
// is reporting only -- nothing in CHECKS depends on it.

const U_CORNER_TOKS = ['UFR', 'UFL', 'UBR', 'UBL'];

export const cornersOriented = (cube, up) =>
  slotsOf(up, 'corner').every(p => sticker(cube, p, up) === centre(cube, up));

export const faceSolid = (cube, up) => faceCross(cube, up) && cornersOriented(cube, up);

export const slotSolved = (cube, cornerTok, edgeTok) =>
  placed(cube, cornerTok) && placed(cube, edgeTok);

// The 3x3 of U-facing stickers, back row first, as the badge draws it.
export function topGrid(cube) {
  const up = centre(cube, 'U');
  const rows = [];
  for (let z = -1; z <= 1; z++) {
    let row = '';
    for (let x = -1; x <= 1; x++) row += sticker(cube, [x, 1, z], 'U') === up ? 'X' : '.';
    rows.push(row);
  }
  return rows;
}

// The twelve side stickers of the top layer. H and Pi share a 3x3 and are told
// apart only here, so this is load-bearing for recognition, not decoration.
export function topTabs(cube) {
  const up = centre(cube, 'U');
  const on = (p, f) => sticker(cube, p, f) === up ? 'X' : '.';
  return {
    B: [-1, 0, 1].map(x => on([x, 1, -1], 'B')).join(''),
    R: [-1, 0, 1].map(z => on([1, 1, z], 'R')).join(''),
    F: [-1, 0, 1].map(x => on([x, 1, 1], 'F')).join(''),
    L: [-1, 0, 1].map(z => on([-1, 1, z], 'L')).join('')
  };
}

const SLOT_PAIRS = { FR: ['DFR', 'FR'], FL: ['DFL', 'FL'], BR: ['DBR', 'BR'], BL: ['DBL', 'BL'] };
export const slotsDone = cube =>
  Object.keys(SLOT_PAIRS).filter(s => slotSolved(cube, SLOT_PAIRS[s][0], SLOT_PAIRS[s][1]));
```

- [ ] **Step 2: Add the probe reporter**

```js
// Report what case `['z2','y',...invertMoves(moves)]` sets up, so an author can
// name it before writing the predicate.
export function probe(moves) {
  const setup = ['z2', 'y', ...invertMoves(moves)];
  const start = stateOf(setup);
  const end = applyMoves(stateOf(setup), moves);
  const tabs = topTabs(start);
  const dup = adjacentSameFace(moves);
  console.log('moves     :', parseMoves(moves).join(' '));
  console.log('setup     :', setup.join(' '));
  console.log('length    :', parseMoves(moves).length, dup.length ? 'DEAD PAIR: ' + dup.join(', ') : '');
  console.log('start F2L :', f2lSolved(start, DN), ' crossD:', crossSolved(start, DN), ' slots:', slotsDone(start).join('+') || 'none');
  console.log('start LL  : edgesUp:', edgesOriented(start, UP).join('/') || 'none',
    ' cornersUp:', U_CORNER_TOKS.filter(t => sticker(start, vecOf(t), 'U') === centre(start, 'U')).join('/') || 'none',
    ' cornersPos:', cornersPositioned(start, UP));
  console.log('start grid:', topGrid(start).join(' / '));
  console.log('start tabs: B:' + tabs.B + ' R:' + tabs.R + ' F:' + tabs.F + ' L:' + tabs.L);
  console.log('end       : solved:', solved(end), ' crossD:', crossSolved(end, DN), ' faceSolid:', faceSolid(end, UP));
}
```

- [ ] **Step 3: Wire the CLI branch**

Change the last two lines of `validate.mjs` from:

```js
const { pathToFileURL } = await import('node:url');
if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
```

to:

```js
const { pathToFileURL } = await import('node:url');
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf('--probe');
  if (i !== -1 && process.argv[i + 1]) probe(process.argv[i + 1]);
  else main();
}
```

- [ ] **Step 4: Verify the probe against a known case**

Run: `node validate.mjs --probe "R U R' U R U2 R'"`
Expected, exactly:

```
start grid: .X. / XXX / XX.
start tabs: B:X.. R:X.. F:..X L:...
end       : solved: true  crossD: true  faceSolid: true
```

with `start LL` showing `edgesUp: UF/UR/UB/UL` and `cornersUp: UFL`. That is Sune: all edges oriented, one corner oriented.

- [ ] **Step 5: Verify the normal run is untouched**

Run: `node validate.mjs`
Expected: `23 variations, 23 match, 0 need attention`

- [ ] **Step 6: Commit**

```bash
git add validate.mjs
git commit -m "feat: add --probe to report a candidate algorithm's case signature"
```

---

### Task 3: Cover the advanced group

Widen the checker to the advanced group and allow a case to override its algorithm's goal. This makes the four existing stubs fail, which is the signal the rest of the plan builds against.

**Files:**
- Modify: `validate.mjs` (`main()`)

**Interfaces:**
- Consumes: `crossSolved`, `f2lSolved`, `slotSolved`, `faceSolid`, `cornersOriented` from Task 2.
- Produces: advanced variations appear in the report; `CHECKS[id].cases[label]` may carry `goal` / `goalName`.

- [ ] **Step 1: Widen the filter**

In `main()`, change:

```js
  for (const alg of ALGORITHMS.filter(a => a.group === 'beginner')) {
```

to:

```js
  for (const alg of ALGORITHMS.filter(a => a.group === 'beginner' || a.group === 'advanced')) {
```

- [ ] **Step 2: Run and confirm the stubs fail**

Run: `node validate.mjs`
Expected: **34 variations** total — 23 beginner plus the 11 advanced stubs (`a-white-cross` 2, `a-f2l` 3, `a-oll` 3, `a-pll` 3) — with every advanced row `unchecked` / `no case predicate`, and each also carrying `NO EXPLICIT SETUP`. Exit code 1.

The 11 is the stub count, not the target: Tasks 4-7 replace these with 29 real cases, so the final total is 52.

- [ ] **Step 3: Allow a per-case goal override**

`a-oll` and `a-pll` each hold two looks with different end states, so a case must be able to override its algorithm's goal. In `main()`, change:

```js
      const goal = spec && spec.goal;
      const goalName = spec && spec.goalName;
```

to:

```js
      // Two-look steps hold cases with different end states in one entry: OLL
      // look 1 reaches an oriented cross with the corners still wrong, look 2 a
      // solid face. A case may name its own goal; otherwise the step's applies.
      const goal = (c && c.goal) || (spec && spec.goal);
      const goalName = (c && c.goalName) || (spec && spec.goalName);
```

- [ ] **Step 4: Extend the preservation assertions**

Change:

```js
      if (['b-yellow-cross', 'b-swap-yellow-edges', 'b-position-yellow-corners'].includes(alg.id)
        && !(f2lSolved(start, DN) && f2lSolved(end, DN))) {
        notes.push('F2L not preserved'); verdict = 'mismatch';
      }
```

to:

```js
      if (['b-yellow-cross', 'b-swap-yellow-edges', 'b-position-yellow-corners', 'a-oll', 'a-pll'].includes(alg.id)
        && !(f2lSolved(start, DN) && f2lSolved(end, DN))) {
        notes.push('F2L not preserved'); verdict = 'mismatch';
      }

      // An F2L algorithm that fills its slot by wrecking the cross is worse than
      // useless, and the step goal alone would not notice.
      if (alg.id === 'a-f2l' && !(crossSolved(start, DN) && crossSolved(end, DN))) {
        notes.push('cross not preserved'); verdict = 'mismatch';
      }
```

- [ ] **Step 5: Confirm beginner is unaffected**

Run: `node validate.mjs`
Expected: the 23 beginner rows all still `match`; the 9 advanced rows still fail. Exit code 1.

- [ ] **Step 6: Commit**

```bash
git add validate.mjs
git commit -m "feat: check the advanced group, with per-case goals and cross preservation"
```

---

### Task 4: OLL — 10 cases

Done first because every case is verified and it exercises the two-look machinery. The `keep` constants land here since this is their first use.

**Files:**
- Modify: `algorithms.js` (constants near the top; the `a-oll` entry)
- Modify: `validate.mjs` (a `CHECKS['a-oll']` entry)

**Interfaces:**
- Consumes: `faceSolid`, `cornersOriented` from Task 2; per-case goals from Task 3.
- Produces: `LAST_LAYER` and `CROSS_ONLY` constants used by Tasks 5-7.

**Verified case data.** Every row below was probed against the engine: F2L intact, all four edges oriented for look 2, ends solved, no dead pairs.

| Label | `moves` | Oriented corners | grid | tabs |
|---|---|---|---|---|
| `Look 1 — line` | `F R U R' U' F'` | n/a | `..X/XXX/..X` | — |
| `Look 1 — L-shape` | `F U R U' R' F'` | n/a | `XX./XX./X..` | — |
| `Look 2 — Sune` | `R U R' U R U2 R'` | UFL | `.X./XXX/XX.` | B:X.. R:X.. F:..X L:... |
| `Look 2 — Anti-Sune` | `R U2 R' U' R U' R'` | UBR | `.XX/XXX/.X.` | — |
| `Look 2 — T` | `R M' U R' U' R' M F R F'` | UBR+UFR | `.XX/XXX/.XX` | B:X.. R:... F:X.. L:... |
| `Look 2 — U` | `R2 D R' U2 R D' R' U2 R'` | UBL+UBR | `XXX/XXX/.X.` | B:... R:... F:X.X L:... |
| `Look 2 — L` | `F R' F' R M' U R U' R' M` | UBL+UFR | `XX./XXX/.XX` | B:... R:X.. F:X.. L:... |
| `Look 2 — H` | `R U R' U R U' R' U R U2 R'` | none | `.X./XXX/.X.` | B:... R:X.X F:... L:X.X |
| `Look 2 — Pi` | `R U2 R2 U' R2 U' R2 U2 R` | none | `.X./XXX/.X.` | B:..X R:... F:..X L:X.X |

H and Pi share a 3×3 and differ only in the tabs. T and U both orient two adjacent corners and also differ only in the tabs.

The dot is the one case not yet pinned — see Step 4.

- [ ] **Step 1: Add the keep constants**

In `algorithms.js`, after the existing `F2L_AND_LL_EDGES` line:

```js
// Advanced masks. CFOP keeps white on the bottom, so the cross being protected
// is the D one; LAST_LAYER greys the two finished layers away and leaves the
// case itself lit.
const CROSS_ONLY = ['DF', 'DR', 'DB', 'DL', 'D', 'F', 'R', 'B', 'L', 'U'];
const LAST_LAYER = ['U*', 'F', 'R', 'B', 'L', 'D'];
```

- [ ] **Step 2: Write the CHECKS entry (the failing test)**

In `validate.mjs`, add to `CHECKS` after `'b-orient-last-corners'`:

```js
  // ---- advanced OLL : yellow up (z2 y). Two looks in one entry, so look 1
  // carries its own goal -- its corners are still wrong and asserting a solid
  // face there would be wrong.
  'a-oll': {
    goal: c => faceSolid(c, UP) && f2lSolved(c, DN),
    goalName: 'whole top face one colour, F2L untouched',
    cases: {
      'Look 1 — line': {
        name: 'horizontal line (UL/UR up), corners unknown',
        goal: c => faceCross(c, UP) && f2lSolved(c, DN),
        goalName: 'top edges oriented, F2L untouched',
        test: c => f2lSolved(c, DN) && twoOriented(c, ['UL', 'UR']) },
      'Look 1 — L-shape': {
        name: 'L hooked back-left (UL/UB up), corners unknown',
        goal: c => faceCross(c, UP) && f2lSolved(c, DN),
        goalName: 'top edges oriented, F2L untouched',
        test: c => f2lSolved(c, DN) && twoOriented(c, ['UL', 'UB']) },
      'Look 2 — Sune': { name: 'edges oriented, one corner up (UFL)', test: c => ocll(c, ['UFL']) },
      'Look 2 — Anti-Sune': { name: 'edges oriented, one corner up (UBR)', test: c => ocll(c, ['UBR']) },
      'Look 2 — T': { name: 'edges oriented, two corners up (UBR/UFR)', test: c => ocll(c, ['UBR', 'UFR']) },
      'Look 2 — U': { name: 'edges oriented, two corners up (UBL/UBR)', test: c => ocll(c, ['UBL', 'UBR']) },
      'Look 2 — L': { name: 'edges oriented, two corners up diagonally (UBL/UFR)', test: c => ocll(c, ['UBL', 'UFR']) },
      'Look 2 — H': { name: 'edges oriented, no corner up, tabs on R and L', test: c => ocll(c, []) && topTabs(c).R === 'X.X' },
      'Look 2 — Pi': { name: 'edges oriented, no corner up, tabs on L only', test: c => ocll(c, []) && topTabs(c).R === '...' }
    }
  },
```

and the helper beside `twoOriented`:

```js
// An OCLL case: F2L done, every top edge oriented, and exactly this set of top
// corners already showing the up colour. H and Pi both orient none, so callers
// separate those two on the side tabs.
const ocll = (c, up) =>
  f2lSolved(c, DN) && faceCross(c, UP) &&
  U_CORNER_TOKS.filter(t => sticker(c, vecOf(t), 'U') === centre(c, 'U')).sort().join(',') === up.slice().sort().join(',');
```

- [ ] **Step 3: Run and confirm it fails for the right reason**

Run: `node validate.mjs`
Expected: `a-oll` rows now report `orphan case predicate: a-oll -> "Look 1 — line"` (and the rest), because `algorithms.js` still holds the stub labels. Exit code 1.

- [ ] **Step 4: Pin the dot case with the probe**

The dot needs an algorithm whose inverse leaves **no** top edge oriented. Two known routes, both wide-move-free:

```bash
node validate.mjs --probe "F R U R' U' F2 S R U R' U' F' S'"
node validate.mjs --probe "F R U R' U' F' U2 F U R U' R' F'"
```

Accept the first candidate whose output shows `edgesUp: none`, `start F2L: true`, `end solved: true`, and no `DEAD PAIR`. Record its `grid` and `tabs`. If neither qualifies, keep probing variants of `F R U R' U' F'` joined to `f R U R' U' f'` (= `F S R U R' U' F' S'`) with different separators (`U`, `U2`, `y2`), merging any `F' F` into `F2` to avoid the dead-pair check.

Then add the case to `CHECKS['a-oll'].cases` using the recorded state:

```js
      'Look 1 — dot': {
        name: 'dot (no top edge up)',
        goal: c => faceCross(c, UP) && f2lSolved(c, DN),
        goalName: 'top edges oriented, F2L untouched',
        test: c => f2lSolved(c, DN) && edgesOriented(c, UP).length === 0 },
```

- [ ] **Step 5: Write the content**

Replace the `a-oll` entry in `algorithms.js`. Use the accepted dot algorithm from Step 4 in place of `<DOT>`, and compute each `setup` with:

```bash
node -e "globalThis.window={THREE:{Color:class{}}};import('./cube-engine.js').then(m=>console.log(JSON.stringify(['z2','y',...m.invertMoves(process.argv[1].split(' '))])))" "R U R' U R U2 R'"
```

```js
  {
    id: 'a-oll', group: 'advanced', name: 'Orient Last Layer',
    goal: 'Make the whole top face one colour in two looks: edges, then corners.',
    whenToUse: 'Two layers finished. 2-look OLL — ten cases instead of fifty-seven.',
    whyItWorks: 'Look one flips the edges into a cross. Look two twists the corners. Splitting it costs a few moves and saves fifty algorithms.',
    crossLink: 'b-yellow-cross',
    badge: 'top',
    variations: [
      { label: 'Look 1 — dot', section: 'Look 1 — orient the edges',
        moves: [/* <DOT> from Step 4 */], setup: [/* z2 y + inverse */],
        keep: LAST_LAYER,
        note: 'No top edge is up yet. This is the only look-1 case that needs two passes of the F R U R′ U′ F′ family.' },
      { label: 'Look 1 — L-shape',
        moves: ['F', 'U', 'R', "U'", "R'", "F'"],
        setup: ['z2', 'y', 'F', 'R', 'U', "R'", "U'", "F'"],
        keep: LAST_LAYER,
        note: 'Hold the hook pointing back-left.' },
      { label: 'Look 1 — line',
        moves: ['F', 'R', 'U', "R'", "U'", "F'"],
        setup: ['z2', 'y', 'F', 'U', 'R', "U'", "R'", "F'"],
        keep: LAST_LAYER,
        note: 'Hold the line horizontal, left to right.' },
      { label: 'Look 2 — Sune', section: 'Look 2 — twist the corners',
        moves: ['R', 'U', "R'", 'U', 'R', 'U2', "R'"],
        setup: ['z2', 'y', 'R', 'U2', "R'", "U'", 'R', "U'", "R'"],
        keep: LAST_LAYER,
        note: 'One corner already up, at the front-left. The workhorse of the whole step.' },
      { label: 'Look 2 — Anti-Sune',
        moves: ['R', 'U2', "R'", "U'", 'R', "U'", "R'"],
        setup: ['z2', 'y', 'R', 'U', "R'", 'U', 'R', 'U2', "R'"],
        keep: LAST_LAYER,
        note: 'Sune backwards. One corner up, at the back-right.' },
      { label: 'Look 2 — T',
        moves: ['R', "M'", 'U', "R'", "U'", "R'", 'M', 'F', 'R', "F'"],
        setup: ['z2', 'y', 'F', "R'", "F'", "M'", 'R', 'U', 'R', "U'", 'M', "R'"],
        keep: LAST_LAYER,
        note: "Two corners up on the right. Written with wide moves as r U R′ U′ r′ F R F′; r is the R layer plus the M slice, so it is spelled R M′ here." },
      { label: 'Look 2 — U',
        moves: ['R2', 'D', "R'", 'U2', 'R', "D'", "R'", 'U2', "R'"],
        setup: ['z2', 'y', 'R', 'U2', 'R', 'D', "R'", 'U2', 'R', "D'", 'R2'],
        keep: LAST_LAYER,
        note: 'Two corners up along the back — the headlights case.' },
      { label: 'Look 2 — L',
        moves: ['F', "R'", "F'", 'R', "M'", 'U', 'R', "U'", "R'", 'M'],
        setup: ['z2', 'y', "M'", 'R', 'U', "R'", "U'", 'M', "R'", 'F', 'R', "F'"],
        keep: LAST_LAYER,
        note: 'Two corners up diagonally. Wide-move form is F R′ F′ r U R U′ r′.' },
      { label: 'Look 2 — H',
        moves: ['R', 'U', "R'", 'U', 'R', "U'", "R'", 'U', 'R', 'U2', "R'"],
        setup: ['z2', 'y', 'R', 'U2', "R'", "U'", 'R', 'U', "R'", "U'", 'R', "U'", "R'"],
        keep: LAST_LAYER,
        note: 'No corner is up. Told apart from Pi by the side stickers: H shows a pair on the right and a pair on the left.' },
      { label: 'Look 2 — Pi',
        moves: ['R', 'U2', 'R2', "U'", 'R2', "U'", 'R2', 'U2', 'R'],
        setup: ['z2', 'y', "R'", 'U2', 'R2', 'U', 'R2', 'U', 'R2', 'U2', "R'"],
        keep: LAST_LAYER,
        note: 'No corner is up either. Pi shows its pairs on the left and across the back and front, not mirrored left-right like H.' }
    ]
  },
```

- [ ] **Step 6: Run until green**

Run: `node validate.mjs`
Expected: all 10 `a-oll` rows `match`; 23 beginner rows still `match`.

If a row reports `start is not "<name>"`, the algorithm does not produce that case. Run `node validate.mjs --probe "<the moves>"`, read the actual `cornersUp` / `grid` / `tabs`, and either relabel the case or correct the algorithm. Do not weaken the predicate to fit.

- [ ] **Step 7: Commit**

```bash
git add algorithms.js validate.mjs
git commit -m "feat: 2-look OLL, ten verified cases"
```

---

### Task 5: PLL — 6 cases

**Files:**
- Modify: `algorithms.js` (the `a-pll` entry)
- Modify: `validate.mjs` (a `CHECKS['a-pll']` entry)

**Interfaces:**
- Consumes: `LAST_LAYER` from Task 4; per-case goals from Task 3.

**Verified case data.** All six probed: F2L intact, top face solid at the start, ends solved, no dead pairs. Look-1 cases start with `cornersPos: false`; look-2 cases with `cornersPos: true`.

| Label | `moves` | len |
|---|---|---|
| `Look 1 — A-perm` | `R' F R' B2 R F' R' B2 R2` | 9 |
| `Look 1 — Y-perm` | `F R U' R' U' R U R' F' R U R' U' R' F R F'` | 17 |
| `Look 2 — Ua-perm` | `R U' R U R U R U' R' U' R2` | 11 |
| `Look 2 — Ub-perm` | `R2 U R U R' U' R' U' R' U R'` | 11 |
| `Look 2 — H-perm` | `M2 U M2 U2 M2 U M2` | 7 |
| `Look 2 — Z-perm` | `M2 U M2 U M' U2 M2 U2 M' U2` | 10 |

- [ ] **Step 1: Write the CHECKS entry (the failing test)**

Add to `CHECKS` after `'a-oll'`:

```js
  // ---- advanced PLL : yellow up (z2 y). Top face already solid; look 1 places
  // the corners, look 2 the edges, so look 1 cannot assert a solved cube.
  'a-pll': {
    goal: c => solved(c),
    goalName: 'cube solved',
    cases: {
      'Look 1 — A-perm': {
        name: 'top solid, three corners cycled',
        goal: c => cornersPositioned(c, UP) && faceSolid(c, UP) && f2lSolved(c, DN),
        goalName: 'top corners in their slots, face still solid',
        test: c => f2lSolved(c, DN) && faceSolid(c, UP) && !cornersPositioned(c, UP) },
      'Look 1 — Y-perm': {
        name: 'top solid, two diagonal corners swapped',
        goal: c => cornersPositioned(c, UP) && faceSolid(c, UP) && f2lSolved(c, DN),
        goalName: 'top corners in their slots, face still solid',
        test: c => f2lSolved(c, DN) && faceSolid(c, UP) && !cornersPositioned(c, UP) },
      'Look 2 — Ua-perm': { name: 'corners placed, three edges cycled', test: c => pllEdges(c) },
      'Look 2 — Ub-perm': { name: 'corners placed, three edges cycled the other way', test: c => pllEdges(c) },
      'Look 2 — H-perm': { name: 'corners placed, both pairs of opposite edges swapped', test: c => pllEdges(c) },
      'Look 2 — Z-perm': { name: 'corners placed, two adjacent pairs swapped', test: c => pllEdges(c) }
    }
  },
```

and the helper beside `ocll`:

```js
// Look 2 of PLL: the face is solid and the corners are home, only the top edges
// are still out of place.
const pllEdges = c =>
  f2lSolved(c, DN) && faceSolid(c, UP) && cornersPositioned(c, UP) && !crossSolved(c, UP);
```

- [ ] **Step 2: Run and confirm orphan predicates**

Run: `node validate.mjs`
Expected: `orphan case predicate: a-pll -> "Look 1 — A-perm"` and the other five. Exit code 1.

- [ ] **Step 3: Write the content**

Replace the `a-pll` entry in `algorithms.js`:

```js
  {
    id: 'a-pll', group: 'advanced', name: 'Permutate Last Layer',
    goal: 'Slide the oriented top layer into place: corners first, then edges.',
    whenToUse: 'Top face is solid. 2-look PLL — six cases instead of twenty-one.',
    whyItWorks: 'Corners are cycled or swapped first, then the edges. Every 2-look PLL position reduces to one of each.',
    crossLink: 'b-swap-yellow-edges',
    badge: 'top',
    variations: [
      { label: 'Look 1 — A-perm', section: 'Look 1 — place the corners',
        moves: ["R'", 'F', "R'", 'B2', 'R', "F'", "R'", 'B2', 'R2'],
        setup: ['z2', 'y', 'R2', 'B2', 'R', 'F', "R'", 'B2', 'R', "F'", 'R'],
        keep: LAST_LAYER,
        note: 'Three corners cycle, one stays. Hold the corner that is already home at the back-right.' },
      { label: 'Look 1 — Y-perm',
        moves: ['F', 'R', "U'", "R'", "U'", 'R', 'U', "R'", "F'", 'R', 'U', "R'", "U'", "R'", 'F', 'R', "F'"],
        setup: ['z2', 'y', 'F', "R'", "F'", 'R', 'U', 'R', "U'", "R'", 'F', 'R', "U'", "R'", 'U', 'R', 'U', "R'", "F'"],
        keep: LAST_LAYER,
        note: 'Two corners diagonally opposite need swapping. No corner is home, so there is nothing to line up first.' },
      { label: 'Look 2 — Ua-perm', section: 'Look 2 — place the edges',
        moves: ['R', "U'", 'R', 'U', 'R', 'U', 'R', "U'", "R'", "U'", 'R2'],
        setup: ['z2', 'y', 'R2', 'U', 'R', 'U', "R'", "U'", "R'", "U'", "R'", 'U', "R'"],
        keep: LAST_LAYER,
        note: 'Three edges cycle counter-clockwise around the fixed one. Hold the solved edge at the back.' },
      { label: 'Look 2 — Ub-perm',
        moves: ['R2', 'U', 'R', 'U', "R'", "U'", "R'", "U'", "R'", 'U', "R'"],
        setup: ['z2', 'y', 'R', "U'", 'R', 'U', 'R', 'U', 'R', "U'", "R'", "U'", 'R2'],
        keep: LAST_LAYER,
        note: 'The same cycle the other way round. Ua and Ub are each other’s inverse.' },
      { label: 'Look 2 — H-perm',
        moves: ['M2', 'U', 'M2', 'U2', 'M2', 'U', 'M2'],
        setup: ['z2', 'y', 'M2', "U'", 'M2', 'U2', 'M2', "U'", 'M2'],
        keep: LAST_LAYER,
        note: 'Both pairs of opposite edges swap at once. Seven moves and fully symmetric — the easiest PLL there is.' },
      { label: 'Look 2 — Z-perm',
        moves: ['M2', 'U', 'M2', 'U', "M'", 'U2', 'M2', 'U2', "M'", 'U2'],
        setup: ['z2', 'y', 'U2', 'M', 'U2', 'M2', 'U2', 'M', "U'", 'M2', "U'", 'M2'],
        keep: LAST_LAYER,
        note: 'Two adjacent pairs swap. Same M-slice family as H-perm.' }
    ]
  },
```

- [ ] **Step 4: Run until green**

Run: `node validate.mjs`
Expected: all 6 `a-pll` rows `match`, plus the 10 from Task 4 and the 23 beginner rows.

- [ ] **Step 5: Commit**

```bash
git add algorithms.js validate.mjs
git commit -m "feat: 2-look PLL, six verified cases"
```

---

### Task 6: F2L — 9 cases

The riskiest content task. Three algorithms are verified; six must be found with the probe. The spec flags that the third bucket may need four or five rather than three — if so, adjust the bucket sizes and keep the total at nine.

**Files:**
- Modify: `algorithms.js` (the `a-f2l` entry)
- Modify: `validate.mjs` (a `CHECKS['a-f2l']` entry)

**Interfaces:**
- Consumes: `CROSS_ONLY` from Task 4, `slotSolved` / `slotsDone` from Task 2.

**Verified so far**, all on the FR slot, cross intact, three other slots solved at the start, ending solved:

| Bucket | `moves` | len | start slots done |
|---|---|---|---|
| 1 — pair joined | `U R U' R'` | 4 | FL+BR+BL |
| 3 — corner in slot | `R U' R' U R U' R'` | 7 | FL+BR+BL |
| 3 — edge in slot | `R U R' U' R U R'` | 7 | FL+BR+BL |

Two candidates that were probed and **rejected** — do not reuse them:
- `U R U' R' U' F U F'` disturbs both FR and FL, so it is not a single-slot case.
- `R U R' U' R' F R F'` leaves all four slots solved at the start; it is a last-layer algorithm, not F2L.

- [ ] **Step 1: Find the remaining six with the probe**

Every F2L case must satisfy, at the start: `crossD: true`, `slots: FL+BR+BL` (exactly the three other slots done, FR open), and at the end `solved: true`, with no dead pair. Probe candidates until six more qualify:

```bash
node validate.mjs --probe "U' R U R'"
node validate.mjs --probe "U R U2 R' U R U' R'"
node validate.mjs --probe "R U2 R' U' R U R'"
node validate.mjs --probe "U' R U' R' U R U R'"
node validate.mjs --probe "R U R' U2 R U' R'"
node validate.mjs --probe "U R U' R' U R U' R'"
node validate.mjs --probe "R U' R' U' R U R'"
node validate.mjs --probe "U2 R U R' U R U' R'"
```

Record for each accepted candidate its `start LL` line — that is what the case predicate keys on. Sort the nine into the three buckets by what the start state shows: pair already joined in U, corner and edge both in U but apart, or one piece sitting in the FR slot.

- [ ] **Step 2: Write the CHECKS entry**

Add to `CHECKS` after `'a-pll'`. Fill each `test` from the recorded start states — the shared clause is fixed, only the discriminating clause differs per case:

```js
  // ---- advanced F2L : yellow up (z2 y). Cross plus three slots done, the FR
  // slot is the case. The cross-preservation assertion in main() is what stops
  // a slot being filled at the cross's expense.
  'a-f2l': {
    goal: c => slotSolved(c, 'DFR', 'FR') && crossSolved(c, DN),
    goalName: 'FR pair solved, cross intact',
    cases: {
      // Every case shares this shape; the second clause names the case.
      //   test: c => f2lExceptFR(c) && <discriminator>
    }
  },
```

with the helper beside `pllEdges`:

```js
// Cross done and three slots done, FR open: the shared precondition of every
// advanced F2L case.
const f2lExceptFR = c =>
  crossSolved(c, DN) && !slotSolved(c, 'DFR', 'FR') &&
  slotSolved(c, 'DFL', 'FL') && slotSolved(c, 'DBR', 'BR') && slotSolved(c, 'DBL', 'BL');
```

For a bucket-1 case where the pair is joined at the top with the corner at UFR, the discriminator reads:

```js
  'Pair joined, insert right': {
    name: 'corner at UFR with white on the U face, edge at UR beside it',
    test: c => f2lExceptFR(c) && positioned(c, 'UFR') === false && sticker(c, vecOf('UR'), 'U') === centre(c, 'F') },
```

Adapt the sticker clauses to the states recorded in Step 1. If a probe shows a state you cannot express as a short clause, prefer naming the exact stickers over loosening the test.

- [ ] **Step 3: Write the content**

Replace the `a-f2l` entry in `algorithms.js`, using the nine accepted algorithms and their computed setups:

```js
  {
    id: 'a-f2l', group: 'advanced', name: 'First Two Layers',
    goal: 'Pair each corner with its edge and insert both at once.',
    whenToUse: 'Cross done. You want to stop solving corners and edges separately.',
    whyItWorks: 'A corner and its edge are joined in the top layer, then dropped into the slot as a unit. The other thirty-odd cases are these nine composed, so learn the buckets, not the list.',
    crossLink: 'b-second-layer',
    variations: [
      // bucket 1, section 'Pair already joined in the top layer'
      // bucket 2, section 'Corner and edge both up, but apart'
      // bucket 3, section 'One piece stuck in the slot'
    ]
  },
```

Each variation carries `keep: CROSS_ONLY.concat(['FR', 'DFR'])`, a `setup` of `z2 y` plus the inverted moves, and a `note` naming what the learner is looking at. Give the first variation of each bucket a `section`.

- [ ] **Step 4: Run until green**

Run: `node validate.mjs`
Expected: all 9 `a-f2l` rows `match`, alongside Tasks 4-5 and the beginner rows.

- [ ] **Step 5: Commit**

```bash
git add algorithms.js validate.mjs
git commit -m "feat: 2-look F2L, nine verified cases in three buckets"
```

---

### Task 7: White cross — 4 cases

**Files:**
- Modify: `algorithms.js` (the `a-white-cross` entry)
- Modify: `validate.mjs` (a `CHECKS['a-white-cross']` entry)

**Verified so far:**

| Case | `moves` | Start |
|---|---|---|
| Edge on top, white up | `F2` | only DF out of the cross |
| Edge on top, flipped | `U R' F' R` | only DF out of the cross |
| Four-edge worked example | `D' R F' L D2 B'` | several cross edges out, ends with the cross solved |

The equator case still needs probing: `R' D' R D` displaces more than DF, so identify which edge it targets and write the predicate for that slot, or find a candidate that isolates DF.

- [ ] **Step 1: Write the CHECKS entry**

```js
  // ---- advanced cross : white down (z2 y). Cases 1-3 displace one cross edge;
  // the worked example displaces several and is checked only on its end state.
  'a-white-cross': {
    goal: c => crossSolved(c, DN),
    goalName: 'white cross solved on the bottom',
    cases: {
      'Edge on top, white up': {
        name: 'DF edge at UF, white facing up',
        test: c => crossExceptD(c, ['DF']) && sticker(c, vecOf('UF'), 'U') === centre(c, 'D') },
      'Edge on top, flipped': {
        name: 'DF edge at UF, white facing front',
        test: c => crossExceptD(c, ['DF']) && sticker(c, vecOf('UF'), 'F') === centre(c, 'D') },
      'Four edges, planned': {
        name: 'several cross edges out of place',
        test: c => !crossSolved(c, DN) }
    }
  },
```

with the helper:

```js
// The bottom cross with named slots excused -- the mirror of solvedExcept.
const crossExceptD = (c, skip) =>
  slotsOf(DN, 'edge').every(p => skip.includes(tokOf(p)) || placed(c, tokOf(p)));
```

- [ ] **Step 2: Probe the equator case**

```bash
node validate.mjs --probe "R' D' R D"
node validate.mjs --probe "R' D' R"
node validate.mjs --probe "F D F'"
```

Accept one whose start shows exactly one cross edge out of place, note which slot, and add its case with a matching `crossExceptD` skip list.

- [ ] **Step 3: Write the content**

Replace the `a-white-cross` entry, keeping its existing `crossLink: 'b-first-layer-edges'`, adding `keep: CROSS_ONLY` and explicit setups. The worked example's `note` must walk the planning: trace all four edges during inspection, then execute without pausing.

- [ ] **Step 4: Run until green**

Run: `node validate.mjs`
Expected: **all 29 advanced rows and all 23 beginner rows `match`, 0 need attention.** Exit code 0. This is the content milestone.

- [ ] **Step 5: Commit**

```bash
git add algorithms.js validate.mjs
git commit -m "feat: advanced white cross, four verified cases"
```

---

### Task 8: `topFacePattern`

**Files:**
- Modify: `cube-engine.js` (new export near `keepIds`)

**Interfaces:**
- Produces: `topFacePattern(spec) -> { cells: [{ r, c, face }], tabs: [{ r, c, face }] }`, 9 cells and 12 tabs, `r`/`c` being 1-based CSS grid lines in a 5×5 grid, `face` the letter of the U-centre's home face when the sticker matches it and `'off'` otherwise. Consumed by Task 9.

Note this is simpler than the spec sketched: cube-engine's cubies carry a clean quaternion, so the sticker's world normal is `SLOT_VEC[face]` rotated by the cubie's quaternion — no matrixWorld or vertex-centroid work needed.

- [ ] **Step 1: Add the function**

```js
// The flat OLL/PLL diagram for a case: the nine U-facing stickers plus the
// twelve side stickers of the top layer, as 1-based cells of a 5x5 grid whose
// outer ring holds the tabs. Derived from `setup` rather than authored, so the
// badge cannot drift from the animation. The scratch model is built on first
// use: buildModel makes plain THREE objects and needs no GL context, but doing
// it lazily also keeps validate.mjs's window.THREE stub out of the way.
let patternModel = null;

export function topFacePattern(spec) {
  if (!patternModel) patternModel = buildModel({ gap: 0.76, radius: 0.05 });
  const model = patternModel;
  resetModel(model);
  applyInstant(model, spec.setup != null ? spec.setup : invertMoves(spec.moves));

  const v = new THREE.Vector3();
  const norm = m => {
    const h = SLOT_VEC[m.userData.face];
    v.set(h[0], h[1], h[2]).applyQuaternion(m.parent.quaternion);
    return [Math.round(v.x), Math.round(v.y), Math.round(v.z)];
  };
  const pos = m => [Math.round(m.parent.position.x), Math.round(m.parent.position.y), Math.round(m.parent.position.z)];

  // The up colour is whatever the U centre wears after the setup, so a case set
  // up with a different rotation still reads correctly.
  const centreSticker = model.userData.stickers.find(m => {
    const p = pos(m), n = norm(m);
    return p[0] === 0 && p[1] === 1 && p[2] === 0 && n[1] === 1;
  });
  const upFace = centreSticker ? centreSticker.userData.face : 'U';
  const upColor = FACE_COLORS[upFace];

  const cells = [], tabs = [];
  model.userData.stickers.forEach(m => {
    const p = pos(m), n = norm(m);
    if (p[1] !== 1) return;
    const face = FACE_COLORS[m.userData.face] === upColor ? upFace : 'off';
    if (n[1] === 1) {
      // Face cell: back row first, so row = z + 3 and column = x + 3.
      cells.push({ r: p[2] + 3, c: p[0] + 3, face });
    } else if (n[1] === 0) {
      // Tab: pushed out to the ring on whichever side the sticker points.
      const r = n[2] !== 0 ? (n[2] < 0 ? 1 : 5) : p[2] + 3;
      const c = n[0] !== 0 ? (n[0] < 0 ? 1 : 5) : p[0] + 3;
      tabs.push({ r, c, face });
    }
  });
  return { cells, tabs };
}
```

- [ ] **Step 2: Verify against the Sune signature**

`topFacePattern` needs three.js, so check it in the browser rather than in Node. Start the preview, open the OLL card, and in the console:

```js
const { topFacePattern } = await import('./cube-engine.js');
const { ALGORITHMS } = await import('./algorithms.js');
const sune = ALGORITHMS.find(a => a.id === 'a-oll').variations.find(v => v.label === 'Look 2 — Sune');
const p = topFacePattern(sune);
console.log(p.cells.length, p.tabs.length);
console.log([1,2,3].map(r => [1,2,3].map(c => p.cells.find(x => x.r === r+1 && x.c === c+1).face === 'off' ? '.' : 'X').join('')).join(' / '));
```

Expected: `9 12` and `.X. / XXX / XX.` — the Sune grid recorded in Task 4.

- [ ] **Step 3: Commit**

```bash
git add cube-engine.js
git commit -m "feat: derive the flat top-face pattern for a case"
```

---

### Task 9: Render the badge

**Files:**
- Modify: `Cube Trainer.dc.html` (CSS block near the variation-card styles; the view model at ~line 990; the variation header at ~line 470)

**Interfaces:**
- Consumes: `topFacePattern` from Task 8, `badge: 'top'` from Tasks 4-5.

- [ ] **Step 1: Add the CSS**

Colours come from attribute selectors rather than interpolated inline styles, matching the existing `.ct-mini[data-face]` pattern.

```css
/* ---- recognition badge ----
   OLL and PLL are recognised from the top face plus the twelve side stickers;
   the 3D thumbnail is a 3/4 view and cannot show both at once. H and Pi share a
   face and differ only in the tabs, so the ring is load-bearing. */
.ct-badge{display:grid;grid-template-columns:4px 1fr 1fr 1fr 4px;grid-template-rows:4px 1fr 1fr 1fr 4px;gap:1px;width:40px;height:40px;flex:0 0 auto}
.ct-badge span{border-radius:1px;background:var(--gray-300)}
.ct-badge span[data-face="U"]{background:#ffffff;box-shadow:inset 0 0 0 1px var(--gray-300)}
.ct-badge span[data-face="D"]{background:#ffd500}
.ct-badge span[data-face="R"]{background:#ee2b2b}
.ct-badge span[data-face="L"]{background:#ff7a18}
.ct-badge span[data-face="F"]{background:#16c464}
.ct-badge span[data-face="B"]{background:#1e5fe0}
.ct-badge span[data-face="off"]{background:var(--gray-300)}
.ct-badge span[data-r="1"]{grid-row:1}.ct-badge span[data-r="2"]{grid-row:2}.ct-badge span[data-r="3"]{grid-row:3}
.ct-badge span[data-r="4"]{grid-row:4}.ct-badge span[data-r="5"]{grid-row:5}
.ct-badge span[data-c="1"]{grid-column:1}.ct-badge span[data-c="2"]{grid-column:2}.ct-badge span[data-c="3"]{grid-column:3}
.ct-badge span[data-c="4"]{grid-column:4}.ct-badge span[data-c="5"]{grid-column:5}
```

- [ ] **Step 2: Build the cells in the view model**

In the `variations` map (~line 990), add after `structure: this.structureLabel(v),`:

```js
      hasBadge: alg.badge === 'top' ? 'true' : 'false',
      badgeCells: alg.badge === 'top' && this.eng
        ? (() => { const p = this.eng.topFacePattern(v); return p.cells.concat(p.tabs).map((x, n) => ({ key: 'bc' + n, r: String(x.r), c: String(x.c), face: x.face })); })()
        : [],
      sectionLabel: v.section || '',
```

- [ ] **Step 3: Render it**

Replace the variation header block at ~line 470:

```html
          <div style="margin-bottom:7px">
            <span style="display:block;font:var(--type-section-label)">{{ v.label }}</span>
            <span style="display:block;margin-top:2px;font:var(--type-mono);font-size:var(--text-2xs);color:var(--text-tertiary)">{{ v.structure }}</span>
          </div>
```

with:

```html
          <sc-if value="{{ v.sectionLabel }}">
            <div style="margin:2px 0 8px;font:var(--type-section-label);color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em">{{ v.sectionLabel }}</div>
          </sc-if>
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:7px">
            <sc-if value="{{ v.hasBadge }}">
              <span class="ct-badge" aria-hidden="true">
                <sc-for list="{{ v.badgeCells }}" as="bc" hint-placeholder-count="21">
                  <span data-r="{{ bc.r }}" data-c="{{ bc.c }}" data-face="{{ bc.face }}"></span>
                </sc-for>
              </span>
            </sc-if>
            <span style="flex:1 1 auto;min-width:0">
              <span style="display:block;font:var(--type-section-label)">{{ v.label }}</span>
              <span style="display:block;margin-top:2px;font:var(--type-mono);font-size:var(--text-2xs);color:var(--text-tertiary)">{{ v.structure }}</span>
            </span>
          </div>
```

- [ ] **Step 4: Verify in the browser**

Start the preview, open **Advanced Method → Orient Last Layer**.

Expected:
- Every variation shows a 40px badge left of its label; the H and Pi badges differ visibly in their side tabs.
- "Look 1 — orient the edges" and "Look 2 — twist the corners" headings appear above the first variation of each group.
- Open **Beginner's Method → Yellow Cross**: no badges, no headings, layout unchanged from before.
- The console is clean.

- [ ] **Step 5: Commit**

```bash
git add "Cube Trainer.dc.html"
git commit -m "feat: top-face recognition badge and two-look section headings"
```

---

### Task 10: Cross-links and final sweep

**Files:**
- Modify: `algorithms.js` (confirm `crossLink` on all four advanced entries)

- [ ] **Step 1: Confirm every advanced entry links back**

`a-white-cross` → `b-first-layer-edges`, `a-f2l` → `b-second-layer`, `a-oll` → `b-yellow-cross`, `a-pll` → `b-swap-yellow-edges`. Tasks 4-7 add these; this step confirms all four are present and that each target id exists in `ALGORITHMS`.

- [ ] **Step 2: Full verification**

Run: `node validate.mjs`
Expected: **52 variations, 52 match, 0 need attention.** Exit code 0.

Confirm there is no `no keep mask` warning on any advanced row, and no `orphan case predicate` line above the table.

- [ ] **Step 3: Browser sweep**

For each of the four advanced cards: the 3D thumbnail renders per variation, the animation plays, the "see the beginner version" link appears and navigates. Console clean.

- [ ] **Step 4: Commit**

```bash
git add algorithms.js
git commit -m "feat: link each advanced step back to its beginner counterpart"
```

---

## Self-Review

**Spec coverage.** Data model → Tasks 4-7 (`setup`, `badge`, `section`, keep constants). Content inventory → Tasks 4-7, 29 cases. Cross-links → Task 10. Badge derivation → Task 8; rendering → Task 9. Two-look sectioning → Tasks 4-5 (data), Task 9 (markup). Validator, all three changes → Tasks 1-3. Build order → task order. Done criteria → Task 10 Step 2.

**Deviations from the spec, both deliberate:**
- The spec described reading sticker normals via `matrixWorld` and vertex centroids, borrowed from the roofpig extraction notes. Task 8 uses the cubie quaternion instead — cube-engine's own model carries one, so the centroid trick is unnecessary. Same result, less code.
- The spec listed `slotSolved`, `faceSolid`, `cornersOriented` as the new predicates. Task 2 adds `topGrid`, `topTabs`, `slotsDone` as well, because the probe needs them and the H/Pi split depends on `topTabs`.

**Known gaps, all bounded and assigned:** the OLL dot algorithm (Task 4 Step 4), six F2L algorithms (Task 6 Step 1), and the cross equator case (Task 7 Step 2). Each has a probe command, an explicit acceptance test, and a fallback. These are unresolved because they were probed and the obvious candidates failed — recording that is more useful than guessing.

**Type consistency:** `topFacePattern` returns `{cells, tabs}` in Task 8 and is consumed as `p.cells.concat(p.tabs)` in Task 9. `slotSolved(cube, cornerTok, edgeTok)` has the same signature in Tasks 2, 6, 7. `badge: 'top'` on the algorithm is distinct from `it.badge` on a move entry (the existing "until" text) — different objects, no collision.
