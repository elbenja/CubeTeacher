# A stacked playback area, capped and expandable

Design for the move strip. This is **Option B** — a sibling to
`strip-one-line`, built so the two can be compared as running builds and one
chosen. The right panel is not touched.

## Problem

`strip-one-line` cut the strip from 224px to 87.6px by putting the moves on a
single horizontally-scrolling line. It buys the most cube back, but it shows
about one loop block at a time: the strip answers "where am I" and stops
answering "what shape is this algorithm".

For a case built from four near-identical loops, the shape is the lesson. A
learner comparing block two against block four cannot do it through a 323px
window.

## Decisions

**The stack is the original layout, capped.** Before `strip-one-line`, the
strip was already `flex-wrap:wrap`. The mockup's vertical stacking is that
behaviour at mobile width, not a new column: a block plus its spacer is ~270px,
so one pair fits per row in a 323px content box and two fit in a 640px one.
Option B therefore reverts the nowrap track and constrains height instead of
constraining the line.

Measured, this is what the two branches trade:

| | A (`strip-one-line`) | B (`strip-stacked`) |
|---|---|---|
| Four-block case, collapsed | 87.6px | ~173px |
| Flat variation, no caption | ~74px | ~147px |
| Desktop, four blocks | one scrolling line | two rows, no button |
| Visible at once | ~1 block | ~2.5 rows |

B spends about 85px of cube to show roughly three times as much algorithm.

**Collapsed is the resting state; expanding is a deliberate act.** The cap is
what protects the cube, so it is what you get by default. Switching algorithm
or variation resets to collapsed — a new case means looking at the cube first.

**The stack follows the current move while collapsed.** Without it the
collapsed state is dead during playback, which is most of the time. This is
`strip-one-line`'s edge-triggered follow rotated to the Y axis, including its
absolute-anchor park, which exists because a relative page turn oscillated.
That bug is not re-derived here; the fix carries over.

**The toggle is anchored to the container, not to the caption.** Only the four
OLL variations carry an `until`, so most algorithms have no caption for a
button to sit beside — and `Superflip`, flat and about five rows at 375px, is
the case that needs the button most. A corner button works identically with or
without a caption.

## The stack

`.ct-strip-track` becomes `.ct-strip-stack`:

```css
.ct-strip-stack{position:relative;display:flex;flex-wrap:wrap;justify-content:center;
  gap:8px;max-height:131px;overflow-y:auto;scrollbar-width:none}
```

`131px` is 2.5 loop-rows (46px block + 8px gap). Flat variations have 32px
rows and will show closer to three. That is intended: "about 2.5 rows" is a
look, not a constant, and a partial row at the fold is what signals more below.

`strip-one-line`'s `flex:0 0 auto` and its `nowrap` overrides come off — items
wrapping again is the whole point. `justify-content:safe center` reverts to
plain `center`; safe centring existed because a nowrap line overflows on both
sides, which a wrapping one cannot do.

## Axis changes

Three methods rotate from X to Y. None changes shape.

- `positionRing` swaps `+ track.scrollLeft` for `+ track.scrollTop` on the Y
  term. The reason survives the rotation: `getBoundingClientRect()` is
  viewport-relative, so adding the scroll offset back yields a content-space
  coordinate that is stable mid-animation.
- `followChip` tests `cr.bottom > tr.bottom - lead` and
  `cr.top < tr.top + lead`, with `lead` one row rather than one chip, and parks
  with `scrollTo({top: chipTop ± park})`. `park` keeps its `SCROLL_EPSILON`
  hysteresis — landing exactly on the boundary let sub-pixel scroll rounding
  leave the opposite trigger armed, and `followChip` runs on every state
  change, not only index changes.
- `syncFade`'s three states become top/bottom masks: the same rules with
  `90deg` → `180deg`. Cheap enough to keep rather than skip.

## Expand and collapse

New `stripExpanded` state. Expanded, the stack's `max-height` fits its content,
capped so it can never exceed the stage.

The button is absolutely positioned in the container's top-right, outside the
scroller so it cannot scroll away.

**It appears only when the content overflows the collapsed cap.** The obvious
test — `scrollHeight > clientHeight` — is wrong: expanded, `clientHeight` grows
to fit, the test goes false, and the button disappears exactly when it is
needed to collapse again. The measurement compares `scrollHeight` against the
**collapsed cap constant**, which is stable in both states.

That measurement runs in `componentDidUpdate` and writes state, so it must only
`setState` when the boolean actually flips. Unguarded it is an infinite render
loop.

Expanded, the stack usually fits its content and stops overflowing, so
`followChip`'s existing no-overflow early return disables the follow on its own.

## The sheet handle

Independent of the stack, and a straight reclaim of dead space.

Measured at 375px: `.ct-sheet-handle` is 32px tall with `padding-top:10px`
around a 4px grabber, leaving **18px below the grabber that renders nothing**.
`.ct-rhead` sits immediately under it with `padding-top:0`.

Reduce the handle to 20px — 10px above the grabber, 4px of grabber, 6px below —
reclaiming **12px**. Keeping ~4px below the grabber would reclaim 14px, at the
cost of the grabber nearly touching the title. Not the 20px estimated by eye;
18px is all that exists and some of it is doing work.

`--peek` drops by the same amount, 78px → 66px. It is defined as the grabber
plus the title row, so it must track the handle's height; `.ct-stage`'s
`bottom:var(--peek)` is what converts the saving into room for the cube.

This applies equally to `strip-one-line` and could be cherry-picked there if
that branch wins.

## Reused unchanged

From `strip-one-line`, all axis-agnostic: the `untilText` de-duplication and
the single `.ct-loop` row rule; the `.ct-strip-until` caption at `--gray-700`;
the hoisted `.ct-strip-tip` with its delegated pointer handlers and its
transition-mute reposition; the `sc-if` gating that removes empty badge nodes;
`smoothness()`, `RING_SLACK` and `SCROLL_EPSILON`.

The tooltip hoist is required here for the same reason it was there: a
scroller clips on both axes regardless of which one you asked for, and the
tooltip renders above its chip.

## Verification

- Four-block case at 375px: collapsed height ~173px, button present, exactly
  one caption.
- `Superflip` at 375px: about five rows, button present, collapsed to the cap.
- `First Layer Edges` at 375px: one row, **no button**, no fade.
- Desktop at 1280px, four-block case: two rows, no button, no scroll.
- Expand, then collapse: button remains visible throughout — the regression the
  collapsed-cap measurement exists to prevent.
- Play the four-block case collapsed: the live chip stays inside the window and
  the stack scrolls only near an edge.
- Same-index re-renders (legend toggle, sidebar collapse) at a parked scroll
  position: `scrollTop` does not move.
- Switch algorithm while expanded: returns to collapsed.
- Chip tooltips work, including on a chip in the last visible row.
- Sheet handle: 12px reclaimed, `--peek` 66px, title still clear of the
  grabber, and the closed sheet still shows grabber plus title.
- `node validate.mjs` exits 0.
