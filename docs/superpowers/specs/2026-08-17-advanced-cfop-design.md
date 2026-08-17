# Advanced Method: 2-look CFOP

Design for making the Advanced group real. 2026-08-17.

## Why

The Advanced group already exists in [algorithms.js](../../../algorithms.js) with four
entries — `a-white-cross`, `a-f2l`, `a-oll`, `a-pll` — and 2-3 variations each.
None of them carries `setup`, `keep`, `source` or `note`.

A missing `setup` means the engine scrambles by `invertMoves(moves)`
(cube-engine.js, `load`), so every advanced case solves itself by construction.
The animations play; they teach nothing. The file's own header comment warns
about exactly this failure, and the validator never caught it because
`validate.mjs` walks only `group === 'beginner'`.

So this is not "add an advanced section". It is "make the advanced section real",
and the card copy already commits to the shape: *"2-look OLL — ten cases instead
of fifty-seven"*, *"2-look PLL — six cases instead of twenty-one"*.

## Scope

2-look CFOP: **29 cases**. Full CFOP (~41 F2L + 57 OLL + 21 PLL) is a reference
library, not a lesson, and is out of scope.

Also out of scope, stated so the boundary is unambiguous:

- The other 47 OLL and 15 PLL cases; the full 41-case F2L library.
- Scraping ruwix.com's advanced pages for upstream move lists. Advanced entries
  carry `note` but **not** `source`. (The technique, if it is ever wanted, is
  recorded in the `ruwix-algorithm-extraction` memory.)
- Timing, drilling, scramble generation.

## Data model

Advanced variations reuse the beginner shape exactly — `label`, `moves` or
`loop`+`run`, `setup`, `keep`, `note` — so the engine, thumbnails, move strip and
`expandRun` all work unchanged. Three additions:

- **`setup` is mandatory for advanced.** The `invertMoves` fallback stays for the
  patterns group. The validator rejects an advanced variation with no `setup`.
- **`badge: 'top'`** on the `a-oll` and `a-pll` entries, opting those two into the
  flat top-face diagram. Cross and F2L keep only the 3D thumbnail: their action
  is in the bottom two layers, where a top-face view shows nothing.
- **`section`** — an optional string on a variation, rendered as a heading above
  it. See "Two-look sectioning" below.

Two new `keep` constants alongside the existing four: `CROSS_ONLY` (bottom cross
plus centres) and `LAST_LAYER` (U layer plus centres).

### Orientation

Beginner setups open with `z2 y`, which lands yellow up with Ruwix's side colours.
CFOP keeps white on the bottom throughout, so advanced strictly needs only `z2` —
but advanced setups **also open with `z2 y`**, matching beginner, so a learner
crossing between sections sees the same colours on the same sides. Internal
consistency beats matching an external convention we are no longer scraping.

## Content inventory

Exact move sequences are chosen during implementation with the validator as the
arbiter. What is fixed here is the case inventory and each case's goal.

The goal names below (`cross`, `slot`, and so on) are shorthand for this document.
They are **not** a field on the algorithm data — goals live in the validator's
`CHECKS` table, as predicate functions. See "Validation".

### `a-white-cross` — 4 cases, goal `cross`, `keep: CROSS_ONLY`

Advanced cross is planned, not algorithmic, so the teaching unit is a worked
example rather than an algorithm.

1. Edge already oriented on U.
2. Edge misoriented on U.
3. Edge in the equator.
4. Full four-edge worked example: `setup` is a scramble, `moves` is the efficient
   solution, and `note` walks the planning — trace all four before turning.

Cases 1-3 use a `setup` that displaces only the one edge, so "cross solved" is a
valid goal for them.

### `a-f2l` — 9 cases, goal `slot`, `keep: CROSS_ONLY` plus the pair

Three buckets, three cases each:

- Pair already joined in the U layer: insert right, insert left, insert back.
- Corner and edge both in U but separated: three joins.
- One piece stuck in the slot: three extractions, each handing back a bucket-1 or
  bucket-2 case.

The goal predicate is "the FR slot's corner and edge are both solved **and** the
cross is still intact". The second clause catches an algorithm that fills the slot
while wrecking the cross.

### `a-oll` — 10 cases, `keep: LAST_LAYER`, `badge: 'top'`

- **Look 1 — orient the edges** (3): dot, L, line. Goal: U edges oriented. Corners
  are still wrong at this point, so this look cannot assert a solid face.
- **Look 2 — twist the corners** (7): the canonical OCLL set — Sune, Anti-Sune, T,
  U, L, Pi, H. Goal: the entire U face is one colour.

### `a-pll` — 6 cases, `keep: LAST_LAYER`, `badge: 'top'`

- **Look 1 — permute the corners** (2): adjacent swap, diagonal swap. Goal:
  corners permuted correctly, edges not yet.
- **Look 2 — permute the edges** (4): Ua, Ub, Z, H. Goal: cube solved.

### Cross-links

`a-white-cross` already sets `crossLink: 'b-first-layer-edges'`, and the card
renders it through `hasCrossLink` / `crossLinkName` / `goCrossLink`. The other
three entries have none. Add them:

- `a-f2l` → `b-second-layer`
- `a-oll` → `b-yellow-cross`
- `a-pll` → `b-swap-yellow-edges`

Three lines, and a stuck learner gets a one-tap route back to the method they
already know. The cheapest newbie affordance in this design.

## The top-face badge

OLL and PLL recognition is entirely "the U face plus which side stickers point
up". The existing 3D thumbnail is a 3/4 view and cannot show that at once, so the
badge is an addition for those two entries, not a replacement.

### Deriving the pattern

New export in [cube-engine.js](../../../cube-engine.js):

```
topFacePattern(spec) -> { cells: [9], tabs: [12] }
```

It builds a module-scratch model lazily and reuses it. `buildModel` creates plain
THREE objects and needs no GL context, so this costs nothing. Then `resetModel`,
`applyInstant(model, spec.setup)`, and read the state back:

- Transform each sticker's local outward normal by its cubie's world matrix.
- Stickers now pointing +Y are the U face; the grid cell comes from the cubie's
  world x/z.
- Stickers on a top-layer cubie pointing ±X/±Z are the twelve side tabs.
- Colour is `m.userData.base`, the sticker's home colour.

Each returned entry is `{ on }`, true when that sticker's colour equals the U
centre's colour.

This is the same read-the-world-matrix technique the `ruwix-algorithm-extraction`
memory records for reading roofpig's scene, so it is already proven here.

The pattern is **derived, never authored**. A hand-written pattern string would be
a second source of truth for the same case that can silently disagree with
`setup` — and a data/behaviour disagreement is precisely the bug that produced the
current stubs.

### Rendering

CSS-grid divs, not SVG and not canvas. The template drives DOM through `sc-for`
over lists, and this design does not depend on `sc-for` working inside an `<svg>`.

A 5-column grid, tracks `4px 1fr 1fr 1fr 4px`, rows the same. The face cells
occupy the inner 3×3; the tabs are the twelve thin cells on the outer ring's
non-corner positions. One `sc-for` over a flat 21-item list, each item carrying
its grid position and `on` state. Colours come from the same `FACE_COLORS` and
`DIM_COLOR` the 3D uses, so badge and cube cannot disagree.

**Placement:** the variation header row in `Cube Trainer.dc.html` becomes a flex
row — a 40px badge on the left, the existing label/structure stack on the right —
wrapped in `sc-if` on `v.hasBadge`. Beginner, patterns, cross and F2L rows render
exactly as they do today.

**Accessibility:** the badge is `aria-hidden`. The variation label already names
the case in words ("Sune", "Dot", "Ua-perm") and the button carries `aria-pressed`
and a label. A screen-reader user gets nothing useful from "nine squares, four
filled", so decorative is the honest call rather than inventing prose for a shape.

## Two-look sectioning

`a-oll` and `a-pll` each hold two sequential looks in one flat variation list.
Nothing in the UI says "do one of these three first, *then* one of these seven".
A learner sees ten chips and reasonably assumes they pick one. This is the worst
newbie trap in the feature, and it is a data gap rather than a content gap.

An optional `section` string on a variation, rendered as a small heading above the
first variation carrying it: "Look 1 — orient the edges", "Look 2 — twist the
corners". One `sc-if` in the template, one field in the data, invisible wherever
it is not set.

Nothing else new is warranted. AUF ("turn the top to line up before you start")
and slot-holding are real stumbling blocks but are per-case prose: the existing
`note` field and `view: 'left'` already cover them, as the beginner cards show.

## Validation

### The validator does not currently run

Commit `74db087` added a module-scope `const WHITE = new THREE.Color(0xffffff)` to
cube-engine.js:152. validate.mjs:11 stubs `window.THREE = {}`, which has no
`Color`, so importing cube-engine throws and **validate.mjs dies before running a
single check**. Verified: at `HEAD~1` it reports `23 variations, 23 match`; at
`HEAD` it throws `TypeError: THREE.Color is not a constructor`.

The fix is one line — extend the stub with a minimal `Color`:

```js
globalThis.window = {
  THREE: { Color: class { constructor() {} copy() { return this; } lerp() { return this; } } },
  matchMedia: () => ({ matches: false })
};
```

Verified to restore `23 variations, 23 match`.

Note the fragility: this breaks again the moment cube-engine.js uses another THREE
API at module scope. Hardening that boundary properly is out of scope here, but it
is worth knowing the trap exists.

### Existing machinery

`CHECKS` in [validate.mjs](../../../validate.mjs) is
keyed by algorithm id and holds `{ goal, goalName, cases: { label: { name, test } } }`,
with per-case **start** predicates as well as end goals.

The start predicate is the real guarantee, not any ban on inverse setups. An
earlier draft of this design proposed rejecting `setup === invertMoves(moves)`
outright; that is wrong as a blanket rule, and validate.mjs already documents why.
For a case whose definition *is* "the position this algorithm undoes", an inverse
setup is legitimate and the start predicate is what pins the case down. The
existing inverse ban is scoped to `b-orient-last-corners` alone, whose cases are
twist arrangements chosen independently of the run. OLL and PLL cases are genuine
"undo this algorithm" cases and will use inverse-derived setups legitimately.

### Changes

1. **Widen the filter** from `a.group === 'beginner'` to beginner and advanced. On
   its own this reports the four existing stubs as failures — the red signal to
   build against.
2. **Per-case goal override.** `CHECKS` holds one `goal` per algorithm, but
   `a-oll` and `a-pll` each contain two looks with different end states. A case
   entry may carry its own `goal`/`goalName`, falling back to the algorithm's.
   Roughly four lines at the call site.
3. **Four new `CHECKS` entries**, one per advanced algorithm, with a start
   predicate for every case.

### New predicates

Everything else is reused — `crossSolved`, `f2lSolved`, `layerSolved`, `faceCross`,
`cornersPositioned`, `solved`, `edgesOriented`, `cornerUp`, `misorientedCorners`.

- `slotSolved(c, slot)` — one F2L pair home and oriented.
- `faceSolid(c, face)` — every sticker on a face matches its centre.
- `cornersOriented(c, face)` — a four-way fold of the existing `cornerUp`.

### Preservation assertions

The F2L-preservation list gains `a-oll` and `a-pll`, so an OLL algorithm that
solves the top face while breaking the bottom two layers fails. For `a-f2l` the
analogous assertion is that the cross survives. `a-white-cross` has nothing below
it to preserve.

## Build order

0. **Restore the validator** with the one-line `THREE.Color` stub above. Confirm
   `23 variations, 23 match` before touching anything else. Nothing downstream
   means anything until this passes.
1. Widen the validator filter, add the per-case goal override and the three
   predicates. Run it; the four stubs fail.
2. Author `CHECKS` entries for all 29 cases — start predicates and goals — *before*
   the algorithms. This writes each case's definition in executable form.
3. Author the algorithms in `algorithms.js` one entry at a time, running
   `node validate.mjs` until each goes green.
4. Add `topFacePattern` and the badge markup.
5. Add the `section` headings and the three `crossLink` values.

## Done

- `node validate.mjs` runs at all.
- All 29 advanced cases report `match`.
- All 23 beginner cases still report `match` — the count and verdict measured at
  `HEAD~1`, before commit `74db087` broke the run.
- No orphan predicates.

## Risks

**Authoring 29 correct start predicates is the hard part** — harder than the
algorithms. If a predicate is wrong in the same direction as its algorithm, the
pair passes while being wrong together. Mitigation: predicates are written from
the case description in step 2, before the algorithm exists in step 3, so they
cannot be reverse-engineered from it.

**The F2L "stuck in slot" bucket may not reduce to three representatives.** It may
need four or five. Flagged rather than assumed; the bucket structure holds either
way.
