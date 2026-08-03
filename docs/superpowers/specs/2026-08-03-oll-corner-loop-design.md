# Representing a loop with a stop condition

Design for the `Orient Last Layer Corners` group, and for repeated blocks
generally.

## Problem

The last-layer corner step is a four-move loop, `R' D' R D`, repeated at one
corner until yellow points up, then `U` to bring the next twisted corner round.
The move strip renders it as a flat run of identical chips — 26 for the
two-corner cases, 51 for the four-corner ones. Nothing in that display says the
block repeats, and nothing says where the repeat count comes from.

The count is not something a learner selects. It is read off the cube: the loop
advances a corner's twist by a fixed step, so a corner is either two loops or
four loops from home, and you stop when you see yellow. Rendering the expansion
teaches an instance; the group needs to teach the procedure.

Three other beginner variations have the same shape — a block run N times with a
spacer between — and carry the same hand-typed expansions.

## Decisions

**The variation list is a case picker, not an example gallery.** A learner looks
at their cube, finds the matching card, and follows it. This obliges the card
set to cover every case a learner can encounter.

**The stop condition is part of the notation, not a caption.** A repeated block
renders once, followed by `↻ until yellow points up`, with a tally of dots that
fills as each iteration completes. Inside the strip, where the learner is
executing, a count decided at the cube is never printed as a number to obey —
the tally carries it, and reads as progress rather than as instruction. The card
header is a different surface with a different job: it summarises structure so
the list can be scanned, and there the counts do appear.

**Four cards, keyed by arrangement.** See the case space below: the seven real
cases form pairs that differ only in per-corner loop counts. Because the learner
derives those counts at the cube, splitting the pairs into separate cards would
force a visual discrimination the procedure makes unnecessary, and would put
near-identical thumbnails side by side. The four cards are keyed by what is
actually distinguishable at a glance. Coverage of all seven cases moves into the
validator, where it can be proven rather than implied.

**The repeat model is general.** It lives in `algorithms.js` for any variation,
not as a special case of this group.

## The case space

Enumerated against the project's own model by applying every legal corner-twist
vector and folding by `U` rotation: 8 classes including solved, so 7 real cases.
A twist costs 4 loops one way and 2 the other, uniformly at all four corners.
Every case below was confirmed to end on a solved cube.

| Corners wrong | Arrangement | Loops per corner | Moves |
| --- | --- | --- | --- |
| 2 | side by side | ×2, ×4 | 26 |
| 2 | side by side, mirrored | ×4, ×2 | 26 |
| 2 | diagonal | ×2, ×4 | 26 |
| 3 | — | ×4, ×4, ×4 | 51 |
| 3 | — | ×2, ×2, ×2 | 27 |
| 4 | — | ×2, ×2, ×4, ×4 | 51 |
| 4 | — | ×2, ×4, ×2, ×4 | 51 |

Rows 1–2 differ only in which adjacent corner carries which twist; rows 4–5 and
6–7 likewise. Hence four cards.

## Data model

A variation may declare a repeated block in place of a flat move list:

```js
{ label: 'Two corners twisted, side by side',
  loop: ["R'", "D'", 'R', 'D'],
  until: 'yellow points up',
  run: [2, 'U', 4, 'U2'],
  setup: [...],
  dim: false,
  source: 'ruwix-step-7#example-1' }
```

- `loop` — the repeated block.
- `run` — an ordered list. A **number** is a repeat count of `loop`; a **string**
  is a literal spacer move inserted between blocks.
- `until` — optional. Present means the count is decided at the cube; absent
  means the count is fixed and known in advance.

`moves` is expanded from `loop` and `run` when the module loads. Every consumer
— the engine, `MiniPool`, `validate.mjs` — keeps reading `v.moves` and needs no
change. A variation supplies either `moves` or `loop` + `run`, never both.

Expansion also emits an index map from each flat move index to its place in the
run, used by the strip. Moves belonging to a block map to
`{ entry, iteration, offset }`; a spacer move maps to `{ entry }` alone, where
`entry` is the index into `run` in both cases.

An algorithm may carry `unit` (default `'run'`) naming what one repeat group
represents. `b-orient-last-corners` sets `unit: 'corner'`.

## Rendering

The strip renders one element per `run` entry.

- Number ≥ 2 → the block's move chips once, inside a bordered group, followed by
  a tally of that many dots. If `until` is set, the block also carries
  `↻ until <until>`; if not, it carries a `×n` badge instead.
- Number = 1 → the block's chips once, no tally, no badge. A single run is not a
  loop and must not be dressed as one.
- String → a single spacer chip, visually distinct from the block chips.

The card's count badge stops reporting move totals. It reports structure, built
from `run` and `unit`: `3 corners · ×4 each` when every repeat count is equal,
`2 corners · ×2, ×4` when they differ. A 51-move card is the easiest kind of
case, and a raw move count says the opposite.

The 3D render stays as the card thumbnail. It is directly manipulable, so a
corner hidden at the default angle can be brought into view.

## Playback

Flat `moves` continues to drive the engine, and the move index stays flat.
Reset, step, scrub and play are unchanged.

- The highlighted chip is the one at `offset` within the active block.
- The tally fills to `iteration`.
- Clicking a chip inside a block seeks to that offset in the block's current
  iteration if the block is active, otherwise to its first iteration. Clicking a
  spacer chip seeks to that move.

## Validation

- `expand()` gains a unit test in `selfTest`, asserting that `loop` + `run`
  produces the expected flat sequence and index map.
- `CHECKS` currently pairs predicates to variations by array position
  (`spec.cases[i]`). Authoring a new case set silently misaligns that. It moves
  to keying by variation label, and a missing or unmatched key is reported.
- The case enumeration is ported into `validate.mjs` as a check: build all legal
  corner-twist states, fold by `U` rotation, and assert that "loop until yellow
  points up, then `U` to the next twisted corner" solves all seven. This is what
  licenses four cards covering seven cases, so it is a test, not a comment.

### Setups

Each of the four cards needs a `setup` that is **not** the inverse of its own
`moves` — an inverted setup makes the case solve itself by construction and
hides a wrong algorithm, which is the failure `algorithms.js` opens by warning
about. Each setup must:

1. begin with `z2 y`, matching the yellow-up convention used from step 3 on;
2. produce exactly the enumerated twist class claimed by its card, asserted by
   the case predicate in `validate.mjs`;
3. differ from `invertMoves(v.moves)`, asserted directly.

Condition 2 is the acceptance test. Any setup satisfying all three is correct;
finding them is implementation work, not a design choice.

## Content changes

Four cards replace the three current variations of `b-orient-last-corners`. Runs
are taken from the enumeration:

| Card | `run` | Moves |
| --- | --- | --- |
| Two corners twisted, side by side | `[2, 'U', 4, 'U2']` | 26 |
| Two corners twisted, diagonal | `[2, 'U2', 4, 'U']` | 26 |
| Three corners twisted | `[2, 'U', 2, 'U', 2, 'U']` | 27 |
| All four corners twisted | `[2, 'U', 2, 'U', 4, 'U', 4]` | 51 |

All four share `loop: ["R'", "D'", 'R', 'D']` and
`until: 'yellow points up'`.

Three existing variations adopt `loop` + `run` and stop being hand-typed:

| Variation | `loop` | `run` |
| --- | --- | --- |
| Yellow Cross — Dot (three runs) | `F R U R' U' F'` | `[1, 'y2', 1, 'y2', 1]` |
| Swap The Yellow Edges — Two opposite edges | `R U R' U R U2 R' U` | `['U', 1, 'y2', 1]` |
| Position Yellow Corners — Run it again | `U R U' L' U R' U' L` | `[2]` |

**Second Layer — Edge flipped in its slot keeps its flat list.** Its two halves
differ by the merged `U′` already documented in its note, so it is not a repeat
and must not be forced into one.

## Out of scope

- Setups stay hand-authored and Ruwix-sourced; they are not generated.
- No camera, 3D or thumbnail changes.
- No content changes beyond the four new cards and the three collapses above.
- Advanced groups are untouched.

## Acceptance

- `node validate.mjs` passes, including the new expansion test, the seven-case
  procedure check, and the label-keyed `CHECKS`.
- Every `b-orient-last-corners` card renders as loop blocks with an until-chip
  and a tally, never as a flat expansion. The four-corner card, the longest,
  shows four blocks rather than 51 chips.
- No card header reports a raw move count.
- Stepping, scrubbing and chip-clicking land on the same cube states as before
  for every variation that did not change content.
