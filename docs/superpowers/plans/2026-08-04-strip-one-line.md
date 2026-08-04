# One-Line Move Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut the move strip from 224px to under 80px on the worst case by printing the loop's stop condition once instead of four times, and putting the moves on a single horizontally-scrolling line that follows playback.

**Architecture:** All changes are in `Cube Trainer.dc.html` — CSS in the `<helmet>` block, markup in the template, and three methods on the component class. The `until` string moves from per-block render data to a single caption read off `currentVar().until`. The strip card gains an inner `.ct-strip-track` scroller; `.ct-ring` moves inside it and `positionRing` gains a scroll-offset term. A new `followChip()` runs from `componentDidUpdate` alongside `positionRing`.

**Tech Stack:** Plain ES modules, no build step, no test framework. `node validate.mjs` covers algorithm logic. Layout is verified by measuring the live DOM in the browser preview — there is no DOM test harness and this plan does not add one.

## Global Constraints

- No new dependencies. No build step. Single file changed: `Cube Trainer.dc.html`.
- Only design-system tokens for colour and type. Do not invent token names. The tokens this plan uses and their values: `--amber-50: #fff6e0`, `--text-secondary: #757575`, `--type-caption`, `--radius-full`, `--gray-0`, `--border-default`.
- Match existing style: two-space indent, single quotes in JS, comments that explain *why* rather than *what*.
- `node validate.mjs` must exit 0 at the end of every task.
- The `×N` badge (`it.badge`) must keep rendering for every algorithm that has repeat blocks without an `until`. Only the `until` string is de-duplicated.
- Reduced motion: any programmatic scroll must use `behavior:'auto'` when `prefers-reduced-motion: reduce` matches or `props.motionLevel === 0`.

## Measurement Harness

Every task's verification runs this in the browser preview. Start the server once:

```bash
echo "use preview_start with name 'cube-trainer', then navigate to http://localhost:8934/Cube%20Trainer.dc.html"
```

Then run this via `javascript_tool` after every change (it navigates to the worst case and reports the numbers this plan is about):

```js
(async()=>{
  const b=[...document.querySelectorAll('button,a')].filter(x=>/Orient Last Layer/.test(x.textContent));
  if(b[0])b[0].click();
  await new Promise(r=>setTimeout(r,700));
  const v=[...document.querySelectorAll('.ct-var')];
  if(v[3])v[3].click();
  await new Promise(r=>setTimeout(r,700));
  const s=document.querySelector('.ct-strip'), t=document.querySelector('.ct-strip-track');
  return JSON.stringify({
    stripHeight: Math.round(s.getBoundingClientRect().height),
    captions: [...s.querySelectorAll('.ct-strip-until')].map(e=>e.textContent),
    blockUntilInStrip: [...s.querySelectorAll('.ct-until')].map(e=>e.textContent),
    blockUntilInPanel: [...document.querySelectorAll('.ct-right .ct-until')].map(e=>e.textContent),
    trackScrollable: t ? t.scrollWidth > t.clientWidth : null,
    trackFade: t ? t.dataset.fade : null
  }, null, 1);
})()
```

**Baseline before any work** (verified on `HEAD` and on the live site):

```json
{ "stripHeight": 224,
  "captions": [],
  "blockUntilInStrip": ["repeat loop until yellow points up", ...×4],
  "blockUntilInPanel": ["repeat loop until yellow points up", ...×4],
  "trackScrollable": null, "trackFade": null }
```

---

### Task 1: Stop repeating the stop condition

Removes the string from both surfaces without adding the caption yet. After this task the strip is shorter but the stop condition is missing — that is expected, Task 2 puts it back once.

**Files:**
- Modify: `Cube Trainer.dc.html:125-128` (CSS `.ct-loop`)
- Modify: `Cube Trainer.dc.html:143-145` (CSS `.ct-strip .ct-loop` override + its comment)
- Modify: `Cube Trainer.dc.html:708` and `:719` (render data)

**Interfaces:**
- Produces: `untilText` in both `stripItems` and `variations[].items` now carries **only** the `×N` badge. The `until` string is no longer in any render item.
- Consumed by: Task 2 reads `until` from a new place (`currentVar().until`), not from these items.

- [ ] **Step 1: Measure the baseline**

Run the measurement harness. Confirm it matches the baseline JSON above. If `stripHeight` is not 224, stop and report — the file has drifted from what this plan was written against.

- [ ] **Step 2: Drop the `until` branch from both render sites**

At `Cube Trainer.dc.html:708`, in `stripItems`, change:

```js
      untilText: it.until ? 'repeat loop until ' + it.until : (it.badge || '')
```

to:

```js
      // The stop condition is a property of the variation, not of each block --
      // expandRun copies it onto all of them. It renders once, above the track.
      untilText: it.badge || ''
```

At `Cube Trainer.dc.html:719`, in `variations[].items`, make the identical change:

```js
        untilText: it.badge || ''
```

(no comment needed on the second one — the first explains it).

- [ ] **Step 3: Collapse `.ct-loop` to one row rule**

Replace `Cube Trainer.dc.html:125-128` — the three comment lines and the `.ct-loop` rule — with:

```css
/* Moves and the repeat tally on one row. This used to be a column so a block
   could stack its stop condition underneath; that string now renders once per
   variation, so there is nothing left to stack and both surfaces agree. */
.ct-loop{display:flex;align-items:center;flex-wrap:nowrap;gap:6px;padding:7px 9px;border-radius:10px;background:var(--gray-0);box-shadow:inset 0 0 0 1px var(--border-default)}
```

The dropped `width:100%` is what forced the trailing spacer onto its own line in the panel; without it the `U` sits on the block's row where there is room.

- [ ] **Step 4: Delete the strip-only direction override**

Delete `Cube Trainer.dc.html:143-145` entirely — the two comment lines and:

```css
.ct-strip .ct-loop{flex-direction:row;align-items:center;flex-wrap:wrap;width:auto;gap:8px}
```

It described a difference between the strip and the panel that no longer exists. Leave line 146 (`.ct-strip .ct-chip[data-spacer=...]`) alone.

- [ ] **Step 5: Verify**

```bash
node validate.mjs
```

Expected: exits 0.

Then run the measurement harness. Expected:

```json
{ "stripHeight": 96, "blockUntilInStrip": [], "blockUntilInPanel": [] }
```

`stripHeight` should be roughly 96 (two rows of chips) — the exact number may differ by a few px, but it must be **well under 224** and both `blockUntil` arrays must be **empty**. If either array is non-empty, Step 2 was applied to only one of the two sites.

Also screenshot the right panel and confirm: each loop block shows `R' D' R D` plus grey pips, with `U` on the same line at 1280px width.

- [ ] **Step 6: Commit**

```bash
git add "Cube Trainer.dc.html"
git commit -m "refactor: render a block's stop condition from the variation, not each block"
```

---

### Task 2: The caption, once

**Files:**
- Modify: `Cube Trainer.dc.html` CSS (add `.ct-strip-until` beside `.ct-until` at :131)
- Modify: `Cube Trainer.dc.html:278` (strip container becomes a column)
- Modify: `Cube Trainer.dc.html` `render()` (add `stripUntil` to the returned props)

**Interfaces:**
- Consumes: nothing from Task 1 beyond it having removed the per-block string.
- Produces: `stripUntil` — a `string` prop on the render object, `''` when the current variation has no `until`. Task 3 wraps the chips below it in `.ct-strip-track`.

- [ ] **Step 1: Add the caption style**

Insert after `Cube Trainer.dc.html:131` (the `.ct-until` rule):

```css
/* One per variation, above the moves, so it stays put while the track scrolls.
   --text-secondary on --amber-50 is 4.6:1, which clears AA for caption text. */
.ct-strip-until{padding:2px 10px;border-radius:var(--radius-full);background:var(--amber-50);color:var(--text-secondary);font:var(--type-caption)}
```

- [ ] **Step 2: Expose the string**

In `render()`, immediately after the line `const cv = this.currentVar();` (around `Cube Trainer.dc.html:697`), no change is needed — `cv` already holds it, because `algorithms.js` mutates the authored variation in place rather than replacing it, so `cv.until` survives expansion.

Add to the returned props object, next to `stripItems` at `Cube Trainer.dc.html:749`:

```js
      stripItems,
      stripUntil: cv && cv.until ? 'repeat loop until ' + cv.until : '',
```

- [ ] **Step 3: Make the strip a column and render the caption**

At `Cube Trainer.dc.html:278`, change the strip's inline style from:

```
display:flex;flex-wrap:wrap;justify-content:center;gap:8px
```

to:

```
display:flex;flex-direction:column;align-items:center;gap:6px
```

and insert the caption as the first child, directly above `<div class="ct-ring" ...>`:

```html
      <sc-if value="{{ stripUntil }}">
        <span class="ct-strip-until">{{ stripUntil }}</span>
      </sc-if>
```

- [ ] **Step 4: Verify**

```bash
node validate.mjs
```

Expected: exits 0.

Then run the measurement harness. Expected:

```json
{ "captions": ["repeat loop until yellow points up"], "blockUntilInStrip": [] }
```

`captions` must have **exactly one** entry. `stripHeight` will be roughly 120 at this point — the column layout stacks the caption above chips that still wrap; Task 3 removes the wrap.

Also check `First Layer Edges` (4 moves, no `until`): `captions` must be `[]` and no empty pill may appear.

- [ ] **Step 5: Commit**

```bash
git add "Cube Trainer.dc.html"
git commit -m "feat: render the loop stop condition once above the move strip"
```

---

### Task 3: One scrolling line

**Files:**
- Modify: `Cube Trainer.dc.html` CSS (add `.ct-strip-track` rules after `.ct-strip-until`)
- Modify: `Cube Trainer.dc.html:278-306` (wrap chips in the track, move `stripRef` and `.ct-ring` into it)
- Modify: `Cube Trainer.dc.html:618-630` (`positionRing`)

**Interfaces:**
- Consumes: `stripUntil` from Task 2.
- Produces: `this.stripEl` now references the **track**, not the card. `positionRing` measures against it. Task 4 also reads `this.stripEl` and calls `.scrollBy()` on it.

- [ ] **Step 1: Add the track styles**

Insert after the `.ct-strip-until` rule added in Task 2:

```css
/* One line, scrolled rather than wrapped: during playback the strip's job is
   "where am I", which one line answers. Whole-shape scanning belongs to the
   variation panel. `safe center` and not `center` -- plain centring overflows
   both ends and puts the first chip out of reach of any scroll. */
.ct-strip-track{position:relative;display:flex;align-items:center;gap:8px;justify-content:safe center;max-width:100%;overflow-x:auto;scrollbar-width:none}
.ct-strip-track::-webkit-scrollbar{display:none}
/* Nothing shrinks: a nowrap flex line squashes its items by default, which
   would compress chips instead of overflowing them. */
.ct-strip-track>*{flex:0 0 auto}
/* The panel can wrap a long block internally; the track never can, or a block
   would grow a second row and undo the whole point. */
.ct-strip-track .ct-loop,.ct-strip-track .ct-loop-moves{flex-wrap:nowrap}
.ct-strip-track[data-fade="start"]{mask-image:linear-gradient(90deg,transparent 0,#000 24px)}
.ct-strip-track[data-fade="end"]{mask-image:linear-gradient(90deg,#000 calc(100% - 24px),transparent 100%)}
.ct-strip-track[data-fade="both"]{mask-image:linear-gradient(90deg,transparent 0,#000 24px,#000 calc(100% - 24px),transparent 100%)}
```

- [ ] **Step 2: Wrap the chips in the track**

At `Cube Trainer.dc.html:278`, move `ref="{{ stripRef }}"` **off** the `.ct-strip` div. Then wrap everything from `<div class="ct-ring" ...>` through the closing `</sc-for>` in the new track element, so the block reads:

```html
    <div class="ct-strip" data-tint="{{ tintState }}" style="pointer-events:auto;position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;max-width:660px;padding:8px 10px;border-radius:var(--radius-2xl);background:var(--surface-float);box-shadow:var(--shadow-float),inset 0 0 0 1px var(--border-hairline)">
      <sc-if value="{{ stripUntil }}">
        <span class="ct-strip-until">{{ stripUntil }}</span>
      </sc-if>
      <div class="ct-strip-track" data-fade="none" ref="{{ stripRef }}">
        <div class="ct-ring" ref="{{ ringRef }}"></div>
        <sc-for list="{{ stripItems }}" as="it" hint-placeholder-count="7">
          ... unchanged ...
        </sc-for>
      </div>
    </div>
```

`data-tint` stays on the card — the tint rules select descendants (`.ct-strip[data-tint="true"] .ct-chip`), and the track is one.

- [ ] **Step 3: Give `positionRing` the scroll offset**

Replace the body of `positionRing` at `Cube Trainer.dc.html:618-630` with:

```js
  positionRing() {
    const track = this.stripEl, ring = this.ringEl;
    if (!track || !ring) return;
    // No clamp: once index reaches total every move is done, so there is no
    // current chip to ring — the lookup misses and the ring hides itself.
    const chip = track.querySelector('[data-i="' + this.state.index + '"]');
    if (!chip || !this.state.total) { ring.style.opacity = '0'; return; }
    const tr = track.getBoundingClientRect(), cr = chip.getBoundingClientRect();
    ring.style.width = (cr.width + 8) + 'px';
    ring.style.height = (cr.height + 8) + 'px';
    // Content coordinates, not viewport: adding scrollLeft back cancels the
    // shift getBoundingClientRect() reports, so this value is the same whether
    // it is read before, during, or after a smooth scroll. That is what lets
    // followChip() and this run in either order.
    ring.style.transform = 'translate(' + (cr.left - tr.left + track.scrollLeft - 4) + 'px,' + (cr.top - tr.top - 4) + 'px)';
    ring.style.opacity = '1';
  }
```

- [ ] **Step 4: Verify**

```bash
node validate.mjs
```

Expected: exits 0.

Then run the measurement harness. Expected:

```json
{ "stripHeight": 72, "captions": ["repeat loop until yellow points up"], "trackScrollable": true }
```

`stripHeight` must be **≤ 80**. `trackScrollable` must be `true`.

Then check the ring tracks correctly across a scroll:

```js
(()=>{const t=document.querySelector('.ct-strip-track');
 const before=document.querySelector('.ct-ring').style.transform;
 t.scrollLeft=200;
 const after=document.querySelector('.ct-ring').style.transform;
 return JSON.stringify({before,after,note:'must be identical — the ring is in content coords'});})()
```

Expected: `before` and `after` are the same string.

Then click a chip near the right end after scrolling and confirm the cube jumps to that move and the ring lands on it.

Finally check `First Layer Edges`: 4 chips, `trackScrollable: false`, and the row is centred in the card.

- [ ] **Step 5: Commit**

```bash
git add "Cube Trainer.dc.html"
git commit -m "feat: put the move strip on a single scrolling line"
```

---

### Task 4: Follow the current move

**Files:**
- Modify: `Cube Trainer.dc.html:433-437` (`componentDidUpdate`)
- Modify: `Cube Trainer.dc.html` (add `smoothness()`, `followChip()` and `syncFade()` next to `positionRing`, under the `// ---- ring` banner)

**Interfaces:**
- Consumes: `this.stripEl` (the track) from Task 3.
- Produces: nothing later tasks depend on. This is the last task.

- [ ] **Step 1: Add the three methods**

Insert directly after `positionRing()` in `Cube Trainer.dc.html`:

```js
  // 'auto' rather than 'smooth' under reduced motion. The CSS route for this is
  // --m, which a scrollBy() cannot read, so the preference is checked directly.
  smoothness() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return reduce || this.props.motionLevel === 0 ? 'auto' : 'smooth';
  }

  // Edge-triggered, not centred. Centring would move the strip on all 52 steps
  // of a four-corner case; this leaves it still until the live chip is about to
  // fall off, then turns a page. Matches how the ring already reads -- a marker
  // that travels, rather than a fixed sight the moves slide under.
  followChip() {
    const track = this.stripEl;
    if (!track || track.scrollWidth <= track.clientWidth) return;
    const chip = track.querySelector('[data-i="' + this.state.index + '"]');
    if (!chip) return;
    const tr = track.getBoundingClientRect(), cr = chip.getBoundingClientRect();
    const lead = cr.width + 8;
    const page = track.clientWidth * 0.8;
    if (cr.right > tr.right - lead) track.scrollBy({ left: page, behavior: this.smoothness() });
    else if (cr.left < tr.left + lead) track.scrollBy({ left: -page, behavior: this.smoothness() });
  }

  // Only fade an edge that actually has content past it -- a fade over a fully
  // scrolled end reads as content that is not there.
  syncFade() {
    const track = this.stripEl;
    if (!track) return;
    // Bound here rather than in componentDidMount: the track is a template
    // child, so it does not exist yet when the component mounts. This runs on
    // every update, and the flag makes the second one onwards a no-op.
    if (!track._fadeBound) {
      track._fadeBound = true;
      track.addEventListener('scroll', () => this.syncFade(), { passive: true });
    }
    const start = track.scrollLeft > 2;
    const end = track.scrollLeft + track.clientWidth < track.scrollWidth - 2;
    track.dataset.fade = start && end ? 'both' : start ? 'start' : end ? 'end' : 'none';
  }
```

- [ ] **Step 2: Call them**

Replace `componentDidUpdate` at `Cube Trainer.dc.html:433-437` with:

```js
  componentDidUpdate(prev) {
    this.followChip();
    this.positionRing();
    this.syncFade();
    this.applyMotion();
    if (this.engine && this.props.cubeFinish !== prev.cubeFinish) this.engine.setFinish(this.props.cubeFinish || 'flat');
  }
```

The scroll listener that keeps the fade correct during a manual swipe is bound inside `syncFade` itself (Step 1), so there is nothing to add in `componentDidMount`.

- [ ] **Step 3: Verify**

```bash
node validate.mjs
```

Expected: exits 0.

Then, on the four-corner case, step through and confirm the track only scrolls near the edges:

```js
(async()=>{
  const t=document.querySelector('.ct-strip-track');
  const seen=[];
  for(let i=0;i<52;i++){
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight'}));
    await new Promise(r=>setTimeout(r,220));
    seen.push(Math.round(t.scrollLeft));
  }
  const jumps=seen.filter((x,i)=>i&&x!==seen[i-1]).length;
  return JSON.stringify({jumps, finalFade:t.dataset.fade, seenSample:seen.slice(0,12)});
})()
```

Expected: `jumps` is small — roughly 3 to 8 over 52 moves, **not** anything close to 52. If it is near 52 the follow is behaving as centred, not edge-triggered.

Then confirm by eye:
- The live chip is visible at every step of a full playthrough.
- `trackFade` reads `end` at the start, `both` in the middle, `start` at the end.
- Swiping the track by hand updates the fade without moving the ring off its chip.
- With macOS *Reduce motion* on, the follow jumps instead of animating.

- [ ] **Step 4: Full regression pass**

Check every surface the change could have touched:

- `First Layer Edges`, `Yellow Cross`, and one `Fun Patterns` entry: no caption, no fade, chips centred, ring correct.
- An algorithm with `×N` blocks and no `until`: the `×N` badge still renders in the panel. Find one with:
  ```bash
  grep -n "run: \[" algorithms.js | head
  ```
- Right panel at 1280px, at 1180px, and as a mobile sheet at 390px: block rows read correctly at all three.
- Mobile at 390px: strip is one line, cube is visibly less occluded than the 224px baseline.

- [ ] **Step 5: Commit**

```bash
git add "Cube Trainer.dc.html"
git commit -m "feat: scroll the move strip to follow the current move"
```

---

## Notes for the reviewer

Two places where this plan makes a call the spec left open:

1. **`.ct-loop` gap unifies at 6px.** The strip used 8px and the panel 5px through two separate rules. Collapsing to one rule means one value; 6px splits the difference. Visible only if you diff screenshots.
2. **The caption's colour.** The mockup shows warm amber-brown text; the design system has no token for it (`--amber-400` is `#ffc93d`, which fails contrast on `--amber-50`). This plan uses `--text-secondary` on an `--amber-50` pill — the same text colour `.ct-until` already used, just relocated and tinted. Matching the mockup exactly needs a new token added to the design system, which is out of scope here.
