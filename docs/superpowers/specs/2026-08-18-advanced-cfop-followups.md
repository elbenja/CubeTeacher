# Advanced CFOP — deferred follow-ups

Recorded 2026-08-18, at the end of the `advanced-cfop` branch. Everything here was
found by review, triaged as non-blocking, and deliberately not fixed. Nothing in
this list is a known-wrong behaviour today — each was verified correct at the time
of writing. They are gaps in what is *enforced*, not defects.

## 1. No keep-mask regression guard  — highest value

`keep` tokens name the slot a piece occupies **after the setup has run**, not its
destination. All nine F2L cards originally named the destination, so six of them
greyed out the very pair the lesson was about and lit two irrelevant last-layer
pieces instead. It was found by hand and fixed by hand across 13 cards.

`badKeepTokens` only checks a token is well-formed, so nothing stops this
recurring — editing a `setup` can silently move the taught piece out from under
its mask while the suite stays green.

The check is computable in ~15 lines of pure JS against the validator's own cubie
model, no three.js needed: locate the taught piece by colour in `stateOf(setup)`,
resolve the keep tokens to positions, assert the piece falls on a lit one. All 13
masks pass today.

## 2. No orphan-predicate check for the reverse direction

`main()` walks variations and reports a `CHECKS` key with no matching label, but
the plan's "Done" criteria also assumed the reverse. Zero orphans today.

## 3. The badge palette is a second source of truth

`Cube Trainer.dc.html` hard-codes the six face hexes as CSS literals; the design
intended them to come from `FACE_COLORS` in `cube-engine.js`. They match exactly
today, and nothing enforces it. Note `off` deliberately uses `var(--gray-300)`
(`#dedede`) rather than `DIM_COLOR` (`#c6c6c6`) — arguably the better design-token
choice, but it does mean the spec's claimed "cannot disagree" invariant is not
actually held anywhere.

## 4. The `window.THREE` stub is a hand-maintained duplicate

`validate.mjs` stubs only what `cube-engine.js` touches at module-evaluation time
— currently just `new THREE.Color`. One new module-scope THREE API kills the whole
suite before it prints a line. This has already happened once: commit `74db087`
added a module-scope `THREE.Color` and left `validate.mjs` dead until Task 1 of
this branch repaired it.

A headless harness that loads real three.js exists and works, kept outside the
repo during this branch. Wiring `validate.mjs` to it would remove the trap.

## 5. `frEdgeAt` assumes a two-letter slot token

`tok.split('').find(f => f !== fFace)` picks an arbitrary face for a three-letter
token. All four current call sites pass two-letter tokens, so it is correct today;
it is simply unpinned against someone extending it to corners.

## Not a follow-up — settled by explicit decision

- 2-look scope rather than full CFOP (the other 47 OLL, 15 PLL and ~32 F2L cases).
- Advanced entries carry `note` but no `source`; ruwix's advanced pages were not
  scraped.
- Badge face cells are binary (up-colour or grey) while tabs carry their true
  sticker colour. Deliberate: OLL is recognised by orientation, PLL by the ring of
  colours. Without it all six PLL badges render identically.
