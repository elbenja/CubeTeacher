# Giving the cube back its space

Design for the move strip and the variation panel, on desktop and mobile.

## Problem

The cube canvas is a full-window layer at `z-index:0`; the stage floats over it.
Nothing about the cube reflows when the strip grows, so every row the strip
gains is a row of cube hidden behind it.

On `Orient Last Layer Corners → All four corners twisted` the strip is **224px
tall** — four wrapped rows — and covers roughly half the cube. Measured on the
live build, which is identical to `HEAD`.

The height comes from one string. Each of the four loop blocks prints `repeat
loop until yellow points up` beside its moves, which takes a block from ~225px
to ~440px, so four blocks and four spacers need ~1050px against the strip's
660px cap and wrap to four rows. The right panel prints the same string on the
same four blocks.

The string is authored once, on the variation:

```js
loop: ["R'","D'","R","D"], until: 'yellow points up', run: [2,'U',4,"U'"]
```

`expandRun` copies it onto every block (`algorithms.js:49`), and both renderers
print every copy. The repetition is an artifact of expansion, not a decision.

## Decisions

**The stop condition is variation-level, and renders once.** This supersedes the
`2026-08-03` decision that "the stop condition is part of the notation, not a
caption." That decision was made when a variation showed one block; at four
blocks the same reasoning inverts — repeating an invariant beside each block
stops reading as notation and starts reading as noise. What that decision was
protecting is unaffected: the count still is not printed as a number to obey,
and the tally still carries progress.

**The strip is one line that scrolls.** Wrapping trades cube for overview, and
the overview is worth less than it looks: a learner executing a case reads the
two or three chips around the ring, not all 52. The strip's job during playback
is "where am I", which one line does. The panel remains the surface for "what is
this case", which is where whole-shape scanning belongs.

**Desktop scrolls the same way mobile does.** On a 1440px window the stage is
744px wide against the strip's 660px cap, so widening the strip on desktop buys
~80px — not enough to avoid scrolling on a four-block case, and not worth a
second behaviour to maintain.

**Auto-follow is edge-triggered, not centred.** Centring means the strip moves
on every one of the 52 steps. Edge-triggered means it is still most of the time
and turns a page occasionally, which matches how the ring already reads: a
marker that travels, not a fixed sight the content slides under.

**The panel keeps its counts.** `4 corners · ×2, ×2, ×4, ×4` and the grey pips
stay. They contradict the `whyItWorks` line "you never count" only if read as
instruction; the `2026-08-03` spec already settled that the card header
summarises structure so the list can be scanned, and the four cases need to stay
distinguishable at a glance. Only the repeated sentence goes.

## Strip

Structure splits into a caption and a scroller:

```
.ct-strip                 card; flex-direction:column
  ├─ .ct-strip-until      caption; rendered only when the variation has `until`
  └─ .ct-strip-track      overflow-x:auto; flex-wrap:nowrap; holds .ct-ring + chips
```

- The caption sits above the track, so it stays put while moves scroll under it.
  It reads from `currentVar().until` — the variation, not a block — so it cannot
  disagree with the blocks it describes.
- `justify-content:safe center` on the track. Plain `center` puts overflow on
  both sides and makes the first chip unreachable by scrolling.
- `max-width:660px` unchanged.
- Scrollbar hidden. A mask-image fade marks whichever edge has content past it,
  driven by a scroll handler setting a data attribute; no fade when the content
  fits.

**Auto-follow.** After any change to `index`, if the live chip's rect falls
within one chip-width of either edge of the track, scroll the track by
approximately its own width in that direction. `behavior:'smooth'`, suppressed
under `prefers-reduced-motion` — the file already routes that through `--m`.

**Ring.** `.ct-ring` moves inside the track, which becomes the positioned
ancestor. `positionRing` measures against the track and adds the scroll offset:

```js
const tr = track.getBoundingClientRect(), cr = chip.getBoundingClientRect();
ring.style.transform = 'translate(' +
  (cr.left - tr.left + track.scrollLeft - 4) + 'px,' +
  (cr.top - tr.top - 4) + 'px)';
```

Auto-follow and ring placement both run after the same state change; the ring
positions after the scroll settles so it does not chase a moving container.

**Result.** 224px → ~72px on this case (caption row, one 32px chip row, 8px
padding each side), ~48px where the variation has no `until`.

## Panel

`untilText` drops its `until` branch and carries only the badge, so the `×N`
label every other algorithm depends on is untouched:

```js
untilText: it.badge || ''
```

`.ct-loop` inside the panel drops `flex-direction:column` and `width:100%`. The
column existed to stack moves over the stop condition; with the sentence gone
there is nothing to stack. `width:auto` lets the trailing spacer sit on the
block's line.

That single line fits the mobile sheet, which spans the window, and does not
always fit the desktop panel: a `×4` block plus its `U` is ~321px against 308px
usable at 328px, and less at the ≤1180px breakpoint where the panel narrows to
296px. It wraps there rather than being forced — desktop puts the spacer on its
own line on the widest blocks, mobile does not. Both are correct for their
width.

The CSS comment at `Cube Trainer.dc.html:143` explaining why the strip opts back
into a row no longer describes a difference between the two surfaces, and goes.

## Unchanged

- The transport bar stays a separate card below the strip.
- Click-to-jump still works. On long cases a distant chip now needs a scroll
  first; the drag-scrub counter already covers reaching a far index.
- Algorithms with no `until` and no blocks are unaffected apart from losing the
  wrap they never used.

## Verification

- `Orient Last Layer Corners → All four corners twisted`: strip is one row,
  height ≤ 80px, caption appears exactly once.
- Play through all 52 moves: the ring stays visible throughout, and the track
  scrolls only when the live chip nears an edge.
- Scroll the track to the far right, then click a chip: it jumps to that move
  and the ring lands on it.
- `First Layer Edges` (4 moves, no blocks): no caption row, strip centred, no
  fade, no scrollbar.
- An algorithm with `×N` blocks and no `until`: the `×N` badge still renders in
  the panel.
- Panel at 1280px, at 1180px, and as a mobile sheet: block rows read correctly
  at all three widths.
- `prefers-reduced-motion`: follow scroll jumps without animating.
