# Stacked Playback Area Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the move strip's single scrolling line with a height-capped wrapping stack that expands on demand, and reclaim 12px of dead space under the mobile sheet's grabber.

**Architecture:** All changes are in `Cube Trainer.dc.html`. `.ct-strip-track` becomes `.ct-strip-stack` — the original `flex-wrap:wrap` layout with a `max-height` cap and vertical scroll. `positionRing`, `followChip` and `syncFade` rotate from X to Y; their shapes are unchanged, including the absolute-anchor park with `SCROLL_EPSILON` hysteresis. A new `stripExpanded` state and a corner toggle lift the cap.

**Tech Stack:** Plain ES modules, no build step, no test framework. `node validate.mjs` covers cube-algorithm logic only and has no DOM coverage. Layout is verified by measuring the live DOM in the browser preview.

## Global Constraints

- No new dependencies. No build step. Single file changed: `Cube Trainer.dc.html`.
- Only design-system tokens for colour and type. Do not invent token names.
- The literal `#000` inside a `mask-image` gradient is an accepted exception, not a token violation: a mask reads only the alpha channel, so the value is opacity, not colour.
- Match existing style: two-space indent, single quotes in JS, comments that explain *why* rather than *what*.
- `node validate.mjs` must exit 0 at the end of every task.
- Do not touch the right panel. Its `.ct-loop` rendering is explicitly out of scope.
- Do not re-derive the tooltip hoist (`.ct-strip-tip`, `showTip`/`hideTip`/`tipOver`/`tipOut`) or the `sc-if` badge gating. Both are inherited working and are axis-agnostic.

## Measurement Harness

Start the preview once: `mcp__Claude_Browser__preview_start` with `{"name":"cube-trainer"}` (port 8934). **Append a changing `?nocache=N` on every navigate** — the preview cache served stale code to four agents on the sibling branch. `@media` breakpoints only apply on a *fresh navigate* at the target width; resizing an already-mounted page leaves them stale.

**A javascript_tool timeout does NOT stop the page loop it started.** An orphaned loop once raced the move index to the end and produced a bogus reading. Keep any stepping loop under ~20 iterations per call, and reload before re-measuring if a call times out.

Run via `mcp__Claude_Browser__javascript_tool` (async IIFEs only, no bare top-level `await`):

```js
(async()=>{
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const b=[...document.querySelectorAll('button,a')].filter(x=>/Orient Last Layer/.test(x.textContent));
  if(b[0])b[0].click(); await sleep(900);
  const v=[...document.querySelectorAll('.ct-var')]; if(v[3])v[3].click(); await sleep(900);
  const s=document.querySelector('.ct-strip');
  const k=document.querySelector('.ct-strip-stack')||document.querySelector('.ct-strip-track');
  const stage=document.querySelector('.ct-stage');
  const sr=s.getBoundingClientRect(), st=stage.getBoundingClientRect();
  // Rows by CENTRE line, not by `top`. With align-items:center a 32px spacer
  // chip and a 46px loop block on the SAME row have different tops, so a
  // top-based count reports 8 rows for a 4-row stack and trips this plan's own
  // failure signal. Centres agree; tops do not.
  const rows=[...new Set([...k.children].filter(c=>!c.classList.contains('ct-ring'))
    .map(c=>{const b=c.getBoundingClientRect();return Math.round(b.top+b.height/2);}))];
  return JSON.stringify({
    viewport:innerWidth,
    stripH:Math.round(sr.height*10)/10,
    stripInsideStage: Math.round(sr.left)>=Math.round(st.left)&&Math.round(sr.width)<=Math.round(st.width),
    stackClientH:k.clientHeight, stackScrollH:k.scrollHeight,
    scrollableY:k.scrollHeight>k.clientHeight+4,
    visualRows:rows.length, fade:k.dataset.fade,
    captions:[...document.querySelectorAll('.ct-strip-until')].map(e=>e.textContent),
    toggleShown:!!document.querySelector('.ct-stack-toggle')
  },null,1);
})()
```

**Baseline on this branch's HEAD** (the inherited one-line strip), 375px: `stripH: 87.6`, `visualRows: 1`, `scrollableY: false` (it scrolls on X, not Y).

---

### Task 1: The stack

Replaces the nowrap track with a capped wrapping stack and rotates the three scroll-aware methods to Y. Both halves ship together — a stack whose ring and fades still read `scrollLeft` is visibly broken.

**Files:**
- Modify: `Cube Trainer.dc.html:103-112` (tooltip comment references the old class name)
- Modify: `Cube Trainer.dc.html:145-160` (CSS: the track rules)
- Modify: `Cube Trainer.dc.html:308` (template: class name)
- Modify: `Cube Trainer.dc.html:665-676` (`positionRing`)
- Modify: `Cube Trainer.dc.html:695-722` (`followChip`)
- Modify: `Cube Trainer.dc.html:726-733` (`syncFade`)

**Interfaces:**
- Produces: `--stack-cap` custom property on `.ct` (the collapsed cap, `131px`), read by Task 2's overflow measurement via `getComputedStyle`. `this.stripEl` continues to mean the scroller, now `.ct-strip-stack`.
- Consumes: `RING_SLACK` (4) and `SCROLL_EPSILON` (2), already class fields at `Cube Trainer.dc.html:438` and `:441`.

- [ ] **Step 1: Measure the baseline**

Fresh navigate at 375px, run the harness. Confirm `stripH: 87.6` and `visualRows: 1`. If not, stop and report NEEDS_CONTEXT — the branch has drifted.

- [ ] **Step 2: Declare the cap**

Add to the CSS, immediately before the `.ct-strip-until` rule at `Cube Trainer.dc.html:142`:

```css
/* The collapsed height of the move stack: 2.5 loop-rows (46px block + 8px gap).
   A custom property rather than a bare number because syncStackOverflow() reads
   it back — the button that lifts the cap has to know what the cap is. */
.ct{--stack-cap:131px}
```

- [ ] **Step 3: Replace the track rules with stack rules**

Replace `Cube Trainer.dc.html:145-160` — the four comment lines and the seven `.ct-strip-track` rules — with:

```css
/* Wrapped and height-capped rather than one scrolled line. A block plus its
   spacer is ~270px, so a 323px phone content box takes one pair per row and a
   640px desktop one takes two -- the stacking in the mockup is this wrap at
   phone width, not a column. Capping the height protects the cube while still
   showing the algorithm's shape, which one line cannot. */
.ct-strip-stack{position:relative;display:flex;flex-wrap:wrap;justify-content:center;gap:8px;width:100%;max-height:var(--stack-cap);overflow-y:auto;scrollbar-width:none}
.ct-strip-stack::-webkit-scrollbar{display:none}
/* Expanded, the cap lifts to whatever the content needs, bounded so it can
   never grow past the stage and re-cover the cube it exists to protect. */
.ct-strip-stack[data-expanded="true"]{max-height:min(60vh,100%)}
.ct-strip-stack[data-fade="start"]{mask-image:linear-gradient(180deg,transparent 0,#000 24px)}
.ct-strip-stack[data-fade="end"]{mask-image:linear-gradient(180deg,#000 calc(100% - 24px),transparent 100%)}
.ct-strip-stack[data-fade="both"]{mask-image:linear-gradient(180deg,transparent 0,#000 24px,#000 calc(100% - 24px),transparent 100%)}
```

Three rules from the old block are deliberately **not** carried over:
- `justify-content:safe center` → plain `center`. Safe centring existed because a nowrap line overflows on both sides; a wrapping one cannot.
- `.ct-strip-track>*{flex:0 0 auto}` → gone. Items must be free to wrap.
- `.ct-strip-track .ct-loop-moves{flex-wrap:nowrap}` → gone. Same reason.

- [ ] **Step 4: Rename the class in the template and the comment**

At `Cube Trainer.dc.html:308`, change `class="ct-strip-track"` to `class="ct-strip-stack"`. Leave every other attribute on that element exactly as it is (`data-fade`, `ref`, `onScroll`, `onPointerOver`, `onPointerOut`).

In the tooltip comment at `Cube Trainer.dc.html:103-110`, replace the two references to `.ct-strip-track` with `.ct-strip-stack`, and change `(overflow-x:auto computes overflow-y to auto too, CSS Overflow 3 3.3)` to `(overflow-y:auto computes overflow-x to auto too, CSS Overflow 3 3.3)`. The trap is the same in both directions and the comment must describe the axis actually in use.

- [ ] **Step 5: Rotate `positionRing` to Y**

At `Cube Trainer.dc.html:675`, the transform line currently reads:

```js
    ring.style.transform = 'translate(' + (cr.left - tr.left + track.scrollLeft - 4) + 'px,' + (cr.top - tr.top - 4) + 'px)';
```

Move the scroll term to the Y component:

```js
    ring.style.transform = 'translate(' + (cr.left - tr.left - 4) + 'px,' + (cr.top - tr.top + track.scrollTop - 4) + 'px)';
```

The comment above it explains why the term exists — that `getBoundingClientRect()` is viewport-relative so adding the scroll offset back yields a stable content-space coordinate. That reasoning survives the rotation unchanged; only update it if it names an axis.

- [ ] **Step 6: Rotate `followChip` to Y**

Replace the body of `followChip` at `Cube Trainer.dc.html:695-722` with:

```js
  followChip() {
    const stack = this.stripEl;
    // Same 4px of ring overflow syncFade allows for -- see the note there.
    if (!stack || stack.scrollHeight - stack.clientHeight <= this.RING_SLACK) return;
    const chip = stack.querySelector('[data-i="' + this.state.index + '"]');
    if (!chip) return;
    const sr = stack.getBoundingClientRect(), cr = chip.getBoundingClientRect();
    // One chip plus its gap of headroom: the turn happens while the chip after
    // the live one is still the thing about to be lost, not the live one.
    const lead = cr.height + 8;
    // Anchored to the chip rather than shifted by a fixed page. A relative
    // scrollBy overshoots by an amount that depends on chip size, dropping the
    // chip straight back into the opposite trigger zone -- so the next step
    // scrolls back and the stack flip-flops without ever settling.
    //
    // Park it a whole epsilon clear of the zone rather than exactly `lead`
    // inside the far edge: landing on the boundary leaves the opposite trigger
    // at the mercy of how the browser rounds scrollTop, and followChip runs on
    // every state change, not only on index changes -- so a re-render that
    // doesn't move the index would lurch the stack up and down.
    //
    // Content coordinates, as in positionRing: scrollTop and the rects are read
    // at the same instant, so this is correct even mid-animation.
    const park = lead + this.SCROLL_EPSILON;
    const cur = stack.scrollTop;
    const chipTop = cr.top - sr.top + cur;
    if (cr.bottom > sr.bottom - lead) stack.scrollTo({ top: chipTop - park, behavior: this.smoothness() });
    else if (cr.top < sr.top + lead) stack.scrollTo({ top: chipTop + cr.height + park - stack.clientHeight, behavior: this.smoothness() });
  }
```

- [ ] **Step 7: Rotate `syncFade` to Y**

Replace the body of `syncFade` at `Cube Trainer.dc.html:726-733` with:

```js
  syncFade() {
    const stack = this.stripEl;
    if (!stack) return;
    const start = stack.scrollTop > this.SCROLL_EPSILON;
    const end = stack.scrollTop + stack.clientHeight < stack.scrollHeight - this.RING_SLACK;
    stack.dataset.fade = start && end ? 'both' : start ? 'start' : end ? 'end' : 'none';
  }
```

`RING_SLACK`'s rationale holds on this axis too: the ring is sized `chip.height + 8` at a `-4px` offset, so parked on a chip in the last row its own border box pushes `scrollHeight` past `clientHeight`. If the `RING_SLACK` comment at `Cube Trainer.dc.html:435-437` names width, change it to say the ring overhangs its chip by 4px on every side.

- [ ] **Step 8: Verify**

```bash
node validate.mjs
```
Expected: exits 0, 23 variations, 23 match.

Then fresh-navigate and run the harness at each width. Expected:

| case | width | `stripH` | `visualRows` | `scrollableY` |
|---|---|---|---|---|
| four-block | 375 | ~173 (16 pad + 26 caption + 131 cap) | 4 | `true` |
| four-block | 1280 | ~173 (capped) | **3** | `true` |
| four-block | 1440 | ~142 (16 + 26 + 100, under the cap) | 2 | `false` |
| `First Layer Edges` | 375 | ~48 (16 + one 32px chip row, no caption) | 1 | `false` |
| `Superflip` (Fun Patterns) | 375 | ~147 (16 + 131 cap, no caption) | 4–6 | `true` |

Heights are derived, not measured, so treat them as ±10px. **The hard bars are the structural ones:**
- 375 four-block `stripH` between **160 and 185**
- `visualRows` is **4** — not 1 (the wrap did not take effect), and not 8 (blocks and spacers each took their own row, meaning something is still forcing full-width children)
- 1440 four-block does **not** scroll (1280 **does** — see below)
- `First Layer Edges` does **not** scroll and has no caption

**Corrected during execution:** the plan originally predicted 2 rows and no scroll at 1280. That was wrong. `.ct-strip` is `max-width:min(660px,100%)` with `padding:8px 10px`, and the side panels squeeze `.ct-stage` to 584px at 1280 — so the content box is 564px, not the 640px the plan assumed. A block+spacer pair is 287–313px and two need ~582px, which fits a 1440px layout's 640px box but not 1280's 564px. **3 rows and a scroll at 1280 is correct behaviour**, confirmed as a product decision: the toggle is expected to appear there.

If a derived height is off by more than ~10px, report the real number rather than adjusting the code to hit the estimate — a sibling branch burned a fix round chasing a height target that turned out to be arithmetically impossible.

Then the ring's scroll-invariance:

```js
(()=>{const k=document.querySelector('.ct-strip-stack');
 const before=document.querySelector('.ct-ring').style.transform;
 k.scrollTop=60;
 const after=document.querySelector('.ct-ring').style.transform;
 return JSON.stringify({before,after,note:'must be identical — the ring is in content coords'});})()
```
Expected: `before` and `after` are the same string.

Then step through the four-block case at 375px in one call of **at most 18 steps**, sampling at rest:

```js
(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const k=document.querySelector('.ct-strip-stack'); const pos=[]; let clipped=0;
 for(let i=0;i<18;i++){window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight'}));await sleep(560);
   pos.push(Math.round(k.scrollTop*10)/10);
   const live=k.querySelector('.ct-chip[data-state="current"]');
   if(live){const cr=live.getBoundingClientRect(),kr=k.getBoundingClientRect();
     if(cr.bottom<kr.top+1||cr.top>kr.bottom-1)clipped++;}}
 return JSON.stringify({positions:pos,clipped,monotonic:pos.every((x,i)=>!i||x>=pos[i-1])});})()
```
Expected: `clipped: 0` and `monotonic: true`. A non-monotonic sequence means the park is oscillating — check `park` uses `SCROLL_EPSILON`.

Also confirm chip tooltips still appear on a chip in the **last visible row** (dispatch `pointerover` on it and read `.ct-strip-tip`'s `data-show`).

- [ ] **Step 9: Commit**

```bash
git add "Cube Trainer.dc.html"
git commit -m "feat: stack the move strip into a height-capped scroller"
```

---

### Task 2: Expand and collapse

**Files:**
- Modify: `Cube Trainer.dc.html:432-433` (state object — add `stripExpanded` and `stackOverflows`)
- Modify: `Cube Trainer.dc.html:478-483` (`componentDidUpdate`)
- Modify: `Cube Trainer.dc.html` `selectAlg` / `selectVar` (reset on case change)
- Modify: `Cube Trainer.dc.html` CSS (add `.ct-stack-toggle` beside `.ct-strip-until`)
- Modify: `Cube Trainer.dc.html:305-341` (template — the toggle button, and `data-expanded` on the stack)
- Modify: `Cube Trainer.dc.html` `render()` return object

**Interfaces:**
- Consumes: `--stack-cap` from Task 1; `this.stripEl` is `.ct-strip-stack`.
- Produces: nothing later tasks depend on. Task 3 is independent.

- [ ] **Step 1: Add the state**

In the `state = { … }` initialiser at `Cube Trainer.dc.html:432-433`, add both fields to the existing last line:

```js
    sideCollapsed: false, rightCollapsed: false, drawer: false, sheet: false,
    stripExpanded: false, stackOverflows: false
```

- [ ] **Step 2: Add the overflow measurement**

Insert this method immediately after `syncFade`:

```js
  // Measured against the collapsed cap, never against clientHeight: expanded,
  // clientHeight grows to fit the content, so a clientHeight test would go
  // false and hide the very button that collapses it again. scrollHeight is the
  // content height in both states, so comparing it to the cap is stable.
  syncStackOverflow() {
    const stack = this.stripEl;
    if (!stack || !this.rootEl) return;
    const cap = parseFloat(getComputedStyle(this.rootEl).getPropertyValue('--stack-cap')) || 131;
    const overflows = stack.scrollHeight > cap + this.RING_SLACK;
    // Guarded: this runs from componentDidUpdate, so setting state on every
    // pass would be an infinite render loop.
    if (overflows !== this.state.stackOverflows) this.setState({ stackOverflows: overflows });
  }
```

- [ ] **Step 3: Call it**

In `componentDidUpdate` at `Cube Trainer.dc.html:478-483`, add the call after `this.syncFade();`:

```js
  componentDidUpdate(prev) {
    this.followChip();
    this.positionRing();
    this.syncFade();
    this.syncStackOverflow();
    this.applyMotion();
    if (this.engine && this.props.cubeFinish !== prev.cubeFinish) this.engine.setFinish(this.props.cubeFinish || 'flat');
  }
```

- [ ] **Step 4: Reset on case change**

A new case means looking at the cube first. In `selectAlg`, change:

```js
    this.setState({ algId: id, varIdx: 0 }, () => this.loadCurrent(true));
```

to:

```js
    this.setState({ algId: id, varIdx: 0, stripExpanded: false }, () => this.loadCurrent(true));
```

In `selectVar`, add `stripExpanded: false` to its `setState` object the same way.

- [ ] **Step 5: Style the toggle**

Add after the `.ct-strip-until` rule:

```css
/* Anchored to the card's corner rather than beside the caption: only the four
   OLL variations carry a stop condition, so most algorithms have no caption for
   a button to sit next to -- and a flat 20-move pattern is exactly the case
   that needs the toggle. Outside the stack so it cannot scroll away. */
.ct-stack-toggle{position:absolute;right:6px;top:6px;z-index:2}
```

- [ ] **Step 6: Render the toggle and wire `data-expanded`**

At `Cube Trainer.dc.html:308`, add `data-expanded="{{ stackExpanded }}"` to the `.ct-strip-stack` element.

Immediately after the `.ct-strip-tip` span at `Cube Trainer.dc.html:341`, add:

```html
      <sc-if value="{{ stackOverflows }}">
        <span class="ct-stack-toggle ct-tip" data-tip="{{ stackToggleTip }}" data-align="end">
          <x-import component-from-global-scope="Ds3DandCanvasDesignSystem_39c2f2.IconButton" icon="{{ stackToggleIcon }}" label="{{ stackToggleTip }}" size="sm" onClick="{{ toggleStack }}" hint-size="28px,28px"></x-import>
        </span>
      </sc-if>
```

- [ ] **Step 7: Expose the props**

Add to the object `render()` returns, next to `stripUntil`:

```js
      stackExpanded: S.stripExpanded ? 'true' : 'false',
      stackOverflows: S.stackOverflows,
      stackToggleIcon: S.stripExpanded ? 'arrow-shrink-01' : 'arrow-expand-01',
      stackToggleTip: S.stripExpanded ? 'Collapse moves' : 'Expand moves',
      toggleStack: () => this.setState(s => ({ stripExpanded: !s.stripExpanded })),
```

**Verify the icon actually renders a glyph.** The icon set is Hugeicons Stroke Rounded and the file already documents that some expected slugs are absent from the released font (see the comment above `GROUPS` in `algorithms.js`). Take a screenshot and confirm the button shows an icon, not a blank box. If `arrow-expand-01`/`arrow-shrink-01` are missing, try `maximize-01`/`minimize-01`. If neither set renders, stop and report NEEDS_CONTEXT rather than shipping an invisible button.

- [ ] **Step 8: Verify**

```bash
node validate.mjs
```
Expected: exits 0.

Then, at 375px fresh navigate:

- Four-block case: `toggleShown: true`, `stripH` ~173.
- Click the toggle: `stripH` grows to fit all four rows, `scrollableY` becomes `false`, `toggleShown` stays **`true`**. This is the regression the collapsed-cap measurement exists to prevent — if the button disappears here, Step 2 was implemented against `clientHeight`.
- Click again: returns to ~173.
- `First Layer Edges` at 375px: `toggleShown: false`.
- Four-block at 1280px: `toggleShown: false` (two rows fit under the cap).
- `Superflip` at 375px: `toggleShown: true`; expanded, the stack shows all ~5 rows and `stripH` stays under 60vh.
- Expand, then switch to another algorithm in the sidebar: comes back collapsed.
- Same-index re-renders at a scrolled position (toggle the legend 4×, index unchanged): `scrollTop` does not move, and `stackOverflows` does not thrash.

- [ ] **Step 9: Commit**

```bash
git add "Cube Trainer.dc.html"
git commit -m "feat: expand and collapse the move stack"
```

---

### Task 3: Reclaim the sheet handle's dead space

Independent of the stack. Measured at 375px: `.ct-sheet-handle` is 32px tall with `padding-top:10px` around a 4px grabber, leaving **18px below the grabber that renders nothing**, with `.ct-rhead` sitting immediately under it at `padding-top:0`.

**Files:**
- Modify: `Cube Trainer.dc.html:221` (`--peek`)
- Modify: `Cube Trainer.dc.html:362` (the handle's inline `height`)

**Interfaces:**
- Consumes: nothing. Produces: nothing.

- [ ] **Step 1: Shrink the handle**

At `Cube Trainer.dc.html:362`, in the `.ct-sheet-handle` inline style, change `height:32px` to `height:20px`. Leave `padding-top:10px` — that is the grabber's inset from the sheet's top edge and is doing work. 10 above + 4 of grabber + 6 below = 20.

- [ ] **Step 2: Track it in `--peek`**

At `Cube Trainer.dc.html:221`, change:

```css
  .ct{--peek:78px}
```

to:

```css
  .ct{--peek:66px}
```

The comment above it defines the peek as the grabber plus the title row, so it has to move with the handle's height — 78 − 12 = 66. `.ct-stage`'s `bottom:var(--peek)` is what turns the saving into room for the cube; without this change the 12px is reclaimed from the sheet and immediately given back to dead space.

- [ ] **Step 3: Verify**

```bash
node validate.mjs
```
Expected: exits 0.

At 375px, fresh navigate:

```js
(()=>{const h=document.querySelector('.ct-sheet-handle'),g=h.firstElementChild,
 e=document.querySelector('.ct-rhead'),st=document.querySelector('.ct-stage');
 const hr=h.getBoundingClientRect(),gr=g.getBoundingClientRect(),er=e.getBoundingClientRect();
 return JSON.stringify({handleH:Math.round(hr.height),
  gapBelowGrabber:Math.round(hr.bottom-gr.bottom),
  grabberToTitle:Math.round(er.top-gr.bottom),
  peek:getComputedStyle(document.querySelector('.ct')).getPropertyValue('--peek').trim(),
  stageBottom:Math.round(st.getBoundingClientRect().bottom)},null,1);})()
```

Expected: `handleH: 20`, `gapBelowGrabber: 6`, `peek: "66px"`, and `stageBottom` **12px larger** than before the change.

Screenshot the closed sheet and confirm the grabber and the case title are both still visible and not touching — the peek must still show grabber plus title, which is what it is for.

- [ ] **Step 4: Commit**

```bash
git add "Cube Trainer.dc.html"
git commit -m "fix: reclaim the dead space under the sheet grabber"
```

---

## Notes for the reviewer

- **The class rename is mechanical but wide.** `.ct-strip-track` → `.ct-strip-stack` touches seven CSS rules, one template attribute and one comment. A missed selector fails silently as an unstyled scroller, so grep for the old name before approving Task 1.
- **`lead` changes meaning subtly.** Horizontally it was `cr.width + 8` (one chip); vertically it is `cr.height + 8` ≈ 40px, while a loop row is 54px tall. The trigger therefore fires slightly less than a full row from the edge. That is intentional and safe — the park still clears both zones by `SCROLL_EPSILON` — but it is the number to revisit if the follow feels twitchy.
- **`min(60vh,100%)` on the expanded cap is a judgement call**, not a measured value. It bounds the expanded stack so a long flat pattern cannot swallow the cube. If `Superflip` expanded looks cramped at 375px, raising it is a one-value change.
