// Cube Trainer content. One place to edit every algorithm.
//
// Every beginner variation carries an explicit `setup`. Do not drop it: when
// `setup` is missing the engine falls back to the inverse of the moves, which
// makes the case solve itself by construction and hides a wrong algorithm.
//
// The beginner entries are checked against ruwix.com by `node validate.mjs`.
// Ruwix holds the cube white-up for steps 1-2 and yellow-up from step 3 on, so
// those setups open with `z2 y` — that lands yellow on top with the same side
// colours Ruwix shows (green left, orange front). `z2` on its own would put red
// and orange on the wrong sides.
//
// `keep` names the pieces that stay in full colour while everything else greys
// out, by the slot each one occupies in the case position (after `setup` has
// run). `D*` means the whole D layer. `dim: false` keeps the whole cube in
// colour. Ruwix does the same thing with its roofpig `colored=` lists.
//
// `view: 'left'` mirrors the camera to the front-left corner, for cases whose
// slot sits on the left face and would otherwise be hidden behind the cube.

const CROSS_AND_CENTRES = ['U', 'UR', 'UB', 'UL', 'F', 'R', 'B', 'L', 'D'];
const WHITE_LAYER = ['U', 'UF', 'UR', 'UB', 'UL', 'UFL', 'UBR', 'UBL', 'F', 'R', 'B', 'L', 'D'];
const FIRST_LAYER = ['D*', 'F', 'R', 'B', 'L', 'U'];
const F2L_AND_LL_EDGES = ['D*', 'FR', 'FL', 'BR', 'BL', 'F', 'R', 'B', 'L', 'U', 'UF', 'UR', 'UB', 'UL'];

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

export const ALGORITHMS = [
  // ---------------------------------------------------------------- Beginner
  {
    id: 'b-first-layer-edges', group: 'beginner', name: 'First Layer Edges',
    goal: 'Get the four white edges into a cross on the top face, each matching its side colour.',
    whenToUse: 'Very first step. The cube is scrambled and nothing is built yet.',
    whyItWorks: 'Each white edge is worked straight into the cross one at a time. The tricks below all do the same thing: swing the edge out through the front or the equator, spin the top to open the gap it needs, and bring it back the right way up.',
    variations: [
      { label: 'Flip the last edge', moves: ['F', "U'", 'R', 'U'],
        setup: ["U'", "R'", 'U', "F'"],
        keep: CROSS_AND_CENTRES.concat(['UF']),
        source: 'ruwix-step-1#flipping-an-edge',
        note: 'Three edges are done and the fourth is in its slot upside down. F drops it to the equator, U′ opens the gap, R lifts it back, U puts the top back.' },
      { label: 'Edge on the front face', moves: ["F'", "U'", 'R', 'U'],
        setup: ["U'", "R'", 'U', 'F'],
        keep: CROSS_AND_CENTRES.concat(['DF']),
        source: 'ruwix-step-1#from-the-bottom-layer',
        note: 'Ruwix writes this as F2 then (F U′ R U); three quarter turns of F in a row collapse to the single F′ shown here.' },
      { label: 'Edge in the middle layer', moves: ["U'", 'R', 'U'],
        setup: ["U'", "R'", 'U'],
        keep: CROSS_AND_CENTRES.concat(['FR']),
        source: 'ruwix-step-1#from-the-middle-layer' },
      { label: 'Same case mirrored', moves: ['U', "L'", "U'"],
        setup: ['U', 'L', "U'"],
        keep: CROSS_AND_CENTRES.concat(['FL']),
        source: 'ruwix-step-1#from-the-middle-layer' },
      { label: 'Edge stuck in the equator', moves: ["U'", "R'", 'U'],
        setup: ["U'", 'R', 'U'],
        keep: CROSS_AND_CENTRES.concat(['BR']),
        source: 'ruwix-step-1#from-the-middle-layer',
        note: 'The last white edge is in the equator but behind the slot, not beside it.' }
    ]
  },
  {
    id: 'b-first-layer-corners', group: 'beginner', name: 'First Layer Corners',
    goal: 'Drop each white corner under its slot and screw it up into the first layer.',
    whenToUse: 'The white cross is done and a white corner sits in the bottom layer.',
    whyItWorks: "R' D' R D is a four-move loop that lifts the corner out, spins the bottom, and puts it back rotated. Repeat it and the corner walks around until white points up.",
    variations: [
      { label: 'White faces right', moves: ["R'", "D'", 'R'],
        setup: ["R'", 'D', 'R'],
        keep: WHITE_LAYER.concat(['DFR']),
        source: 'ruwix-step-2#white-sticker-to-the-right',
        note: "Ruwix also solves this with the single loop R' D' R D applied once." },
      { label: 'White faces you', moves: ['F', 'D', "F'"],
        setup: ['F', "D'", "F'"],
        keep: WHITE_LAYER.concat(['DFR']),
        source: 'ruwix-step-2#white-facing-you',
        note: "With the one-algorithm approach this is R' D' R D five times, or its inverse D' R' D R once." },
      { label: 'White points down', moves: ["R'", 'D2', 'R', 'D', "R'", "D'", 'R'],
        setup: ["R'", 'D', 'R', "D'", "R'", 'D2', 'R'],
        keep: WHITE_LAYER.concat(['DFR']),
        source: 'ruwix-step-2#white-pointing-down',
        note: "Ruwix gives a five-turn shortcut for the same case: R2 D' R2 D R2. With the one-algorithm approach it is R' D' R D three times." },
      { label: 'Right layer, wrong slot', moves: ['L', 'D', "L'", "R'", "D'", 'R'],
        setup: ["R'", 'D', 'R', 'L', "D'", "L'"],
        keep: WHITE_LAYER,
        source: 'ruwix-step-2#good-layer-wrong-position',
        note: 'The corner is already in the white layer but in the wrong slot. The first three moves drop it out to the bottom, the last three screw it back into the right one.' }
    ]
  },
  {
    id: 'b-second-layer', group: 'beginner', name: 'Second Layer (F2L)',
    goal: 'Place the four middle-layer edges without breaking the finished first layer.',
    whenToUse: 'First layer complete. Turn the cube over so yellow is up. An edge with no yellow sits in the top layer.',
    whyItWorks: 'You push the edge down into the wrong slot, restore the corner that was living there, then bring the pair back — a setup, a repair, and an undo.',
    variations: [
      { label: 'Insert to the right', moves: ['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F'],
        setup: ['z2', 'y', "F'", "U'", 'F', 'U', 'R', 'U', "R'", "U'"],
        keep: FIRST_LAYER.concat(['UF']),
        source: 'ruwix-step3#right-algorithm' },
      { label: 'Insert to the left', moves: ["U'", "L'", 'U', 'L', 'U', 'F', "U'", "F'"],
        setup: ['z2', 'y', 'F', 'U', "F'", "U'", "L'", "U'", 'L', 'U'],
        keep: FIRST_LAYER.concat(['UF']),
        view: 'left',
        source: 'ruwix-step3#left-algorithm' },
      { label: 'Edge flipped in its slot', moves: ['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F', "U'", 'R', "U'", "R'", "U'", "F'", 'U', 'F'],
        setup: ['z2', 'y', "F'", "U'", 'F', 'U', 'R', 'U', "R'", 'U', "F'", "U'", 'F', 'U', 'R', 'U', "R'", "U'"],
        keep: FIRST_LAYER.concat(['FR']),
        source: 'ruwix-step3#wrong-orientation',
        note: 'Ruwix writes this as the Right algorithm, U2, then the Right algorithm again: the first run kicks the flipped edge up to the top, the second puts it back the right way round. The U2 and the U that opens the second run are merged into the single U′ here.' }
    ]
  },
  {
    id: 'b-yellow-cross', group: 'beginner', name: 'Yellow Cross',
    goal: 'Make a yellow plus sign on the top face. Corners can stay wrong.',
    whenToUse: 'Two layers done. The top face shows a dot, an L, or a line.',
    whyItWorks: 'F R U R′ U′ F′ flips exactly two top edges at a time. A line needs it once, an L needs it once from the right angle, a dot needs three runs with the cube turned round between them.',
    variations: [
      { label: 'Line (hold horizontal)', moves: ['F', 'R', 'U', "R'", "U'", "F'"],
        setup: ['z2', 'y', 'F', 'U', 'R', "U'", "R'", "F'"],
        keep: F2L_AND_LL_EDGES,
        source: 'ruwix-step-4#line' },
      { label: 'L-shape (hook back-left)', moves: ['F', 'U', 'R', "U'", "R'", "F'"],
        setup: ['z2', 'y', 'F', 'R', 'U', "R'", "U'", "F'"],
        keep: F2L_AND_LL_EDGES,
        source: 'ruwix-step-4#l-shape-shortcut',
        note: 'This is the inverse of F R U R′ U′ F′ and takes the L straight to the cross in one run instead of two.' },
      { label: 'Dot (three runs)',
        loop: ['F', 'R', 'U', "R'", "U'", "F'"], run: [1, 'y2', 1, 'y2', 1],
        setup: ['z2', 'y', 'F', 'U', 'R', "U'", "R'", "F'", 'y2', 'F', 'U', 'R', "U'", "R'", "F'", 'y2', 'F', 'U', 'R', "U'", "R'", "F'"],
        keep: F2L_AND_LL_EDGES,
        source: 'ruwix-step-4#dot',
        note: 'Ruwix runs the algorithm three times from a dot, turning the whole cube 180° between runs. Dot to L, L to line, line to cross.' }
    ]
  },
  {
    id: 'b-swap-yellow-edges', group: 'beginner', name: 'Swap The Yellow Edges',
    goal: 'Line up the yellow cross edges with their side colours.',
    whenToUse: 'The yellow cross exists but the edge colours do not match the sides.',
    whyItWorks: 'The sequence swaps the front and left top edges and leaves everything below untouched, so you can rotate mismatched edges into place one pair at a time.',
    variations: [
      { label: 'Two adjacent edges', moves: ['R', 'U', "R'", 'U', 'R', 'U2', "R'", 'U'],
        setup: ['z2', 'y', "U'", 'R', 'U2', "R'", "U'", 'R', "U'", "R'"],
        keep: F2L_AND_LL_EDGES,
        source: 'ruwix-step-5#switch-two-edges',
        note: 'Hold the two edges that need swapping at the front and the left.' },
      { label: 'Two opposite edges',
        loop: ['R', 'U', "R'", 'U', 'R', 'U2', "R'", 'U'], run: ['U', 1, 'y2', 1],
        setup: ['z2', 'y', "U'", 'R', 'U2', "R'", "U'", 'R', "U'", "R'", 'y2', "U'", 'R', 'U2', "R'", "U'", 'R', "U'", "R'", "U'"],
        keep: F2L_AND_LL_EDGES,
        source: 'ruwix-step-5#applied-twice',
        note: 'Edges facing each other cannot be swapped directly. Ruwix sets up with a U, runs the algorithm, turns the whole cube 180°, and runs it again.' }
    ]
  },
  {
    id: 'b-position-yellow-corners', group: 'beginner', name: 'Position Yellow Corners',
    goal: 'Get every yellow corner to its correct corner slot. Twist comes later.',
    whenToUse: 'Yellow cross is matched and at least one corner is already home.',
    whyItWorks: 'This is a pure three-corner cycle. Hold the already-correct corner in the front-right and the other three rotate around it counter-clockwise.',
    variations: [
      { label: 'One corner already home', moves: ['U', 'R', "U'", "L'", 'U', "R'", "U'", 'L'],
        setup: ['z2', 'y', "L'", 'U', 'R', "U'", 'L', 'U', "R'", "U'"],
        dim: false,
        source: 'ruwix-step-6#cycle-three-corners',
        note: 'The front-right corner stays put; the other three move round it. Orientation is ignored at this stage.' },
      { label: 'Run it again',
        loop: ['U', 'R', "U'", "L'", 'U', "R'", "U'", 'L'], run: [2],
        setup: ['z2', 'y', "L'", 'U', 'R', "U'", 'L', 'U', "R'", "U'", "L'", 'U', 'R', "U'", 'L', 'U', "R'", "U'"],
        dim: false,
        source: 'ruwix-step-6#cycle-three-corners',
        note: "Ruwix: \"if the pieces didn't get where they belong do the algorithm one more time\" — the three corners cycle the other way round. If no corner is home at all, run it once from any angle to create one, then re-hold with that corner front-right; Ruwix does not animate that setup case." }
    ]
  },
  {
    id: 'b-orient-last-corners', group: 'beginner', name: 'Orient Last Layer Corners',
    unit: 'corner',
    goal: 'Twist each yellow corner so yellow points up. This finishes the cube.',
    whenToUse: 'Every corner is in the right slot but some are twisted.',
    whyItWorks: "Same R' D' R D loop as the first layer, applied to a corner held front-right. Each loop advances that corner's twist by a fixed step, so a corner is either two loops or four from home — you never count, you stop when yellow is up. Run each loop to the end: stopping when you see yellow, before the final D, is the classic way to wreck the cube. The loop has order six, so the two layers below only come back together once the counts across every corner add up to a multiple of six, which is why the cube looks wrecked in between. Never rotate the cube between corners — only U.",
    variations: [
      { label: 'Two corners twisted, side by side',
        loop: ["R'", "D'", 'R', 'D'], until: 'yellow points up', run: [2, 'U', 4, "U'"],
        setup: ['z2', 'y', 'U', 'R2', "U'", "R'", 'U', "R'", "U'", 'R2', "U'", 'R2', 'U', 'R', "U'", 'R', 'U', 'R2'],
        dim: false,
        source: 'ruwix-step-7#example-1' },
      { label: 'Two corners twisted, diagonal',
        loop: ["R'", "D'", 'R', 'D'], until: 'yellow points up', run: [2, 'U2', 4, 'U2'],
        setup: ['z2', 'y', "R'", 'U2', 'R', 'U2', 'R', 'U', "R'", 'U', 'R', 'U2', "R'", 'U2', "R'", "U'", 'R', "U'"],
        dim: false,
        source: 'ruwix-step-7#example-1' },
      { label: 'Three corners twisted',
        loop: ["R'", "D'", 'R', 'D'], until: 'yellow points up', run: [2, 'U', 2, 'U', 2, 'U2'],
        setup: ['z2', 'y', 'R', "U'", 'R2', 'U', "R'", 'U', 'R2', 'U', "R'", 'U', 'R2', 'U2', 'R', "U'", "R'", 'U2', "R'", 'U2'],
        dim: false,
        source: 'ruwix-step-7#example-1' },
      { label: 'All four corners twisted',
        loop: ["R'", "D'", 'R', 'D'], until: 'yellow points up', run: [2, 'U', 2, 'U', 4, 'U', 4, 'U'],
        setup: ['z2', 'y', "R'", 'U2', 'R', 'U', "R'", "U'", 'R2', 'U2', 'R2', "U'", 'R2', "U'", 'R2', 'U', 'R', 'U'],
        dim: false,
        source: 'ruwix-step-7#example-1' }
    ]
  },

  // ---------------------------------------------------------------- Advanced
  {
    id: 'a-white-cross', group: 'advanced', name: 'White Cross',
    goal: 'Build the whole cross in eight moves or fewer, planned during inspection.',
    whenToUse: 'You already know the beginner cross and want to stop hunting piece by piece.',
    whyItWorks: 'Solving the cross on the bottom removes the daisy detour entirely. You trace all four edges before touching the cube, then execute without pausing.',
    crossLink: 'b-first-layer-edges',
    variations: [
      { label: 'Four edges, six moves', moves: ["D'", 'R', "F'", 'L', 'D2', "B'"] },
      { label: 'Free pair first', moves: ['R', "D'", 'F2', 'L', "U'", 'B', "D'"] }
    ]
  },
  {
    id: 'a-f2l', group: 'advanced', name: 'First Two Layers',
    goal: 'Pair each corner with its edge and insert both at once.',
    whenToUse: 'Cross done. You want to stop solving corners and edges separately.',
    whyItWorks: 'A corner and its edge are joined in the top layer, then dropped into the slot as a unit. Roughly 41 cases, all built out of the same two three-move insertions.',
    variations: [
      { label: 'Pair ready, insert right', moves: ['U', 'R', "U'", "R'"] },
      { label: 'Pair ready, insert left', moves: ["U'", "L'", 'U', 'L'] },
      { label: 'Corner in slot, edge on top', moves: ['R', "U'", "R'", 'U', 'R', "U'", "R'"] }
    ]
  },
  {
    id: 'a-oll', group: 'advanced', name: 'Orient Last Layer',
    goal: 'Make the whole top face one colour in two looks: edges, then corners.',
    whenToUse: 'Two layers finished. 2-look OLL — ten cases instead of fifty-seven.',
    whyItWorks: 'Look one flips the edges into a cross. Look two twists the corners. Splitting it costs a few moves and saves fifty algorithms.',
    variations: [
      { label: 'Look 1 — edge cross', moves: ['F', 'R', 'U', "R'", "U'", "F'"] },
      { label: 'Look 2 — Sune', moves: ['R', 'U', "R'", 'U', 'R', 'U2', "R'"] },
      { label: 'Look 2 — Anti-Sune', moves: ['R', 'U2', "R'", "U'", 'R', "U'", "R'"] }
    ]
  },
  {
    id: 'a-pll', group: 'advanced', name: 'Permutate Last Layer',
    goal: 'Slide the oriented top layer into place: corners first, then edges.',
    whenToUse: 'Top face is solid. 2-look PLL — six cases instead of twenty-one.',
    whyItWorks: 'Corners are cycled by an A-perm, edges by a U- or H-perm. Every 2-look PLL position reduces to one of each.',
    variations: [
      { label: 'A-perm — corner cycle', moves: ["R'", 'F', "R'", 'B2', 'R', "F'", "R'", 'B2', 'R2'] },
      { label: 'U-perm — three edges', moves: ['R', "U'", 'R', 'U', 'R', 'U', 'R', "U'", "R'", "U'", 'R2'] },
      { label: 'H-perm — opposite edges', moves: ['M2', 'U', 'M2', 'U2', 'M2', 'U', 'M2'] }
    ]
  },

  // ------------------------------------------------------------ Fun Patterns
  ...[
    ['Checkerboard', 'A six-sided checker grid.', 'M2 E2 S2'],
    ['Cross', 'A plus sign on every face.', "R2 L' D F2 R' D' R' L U' D R D B2 R' U D2"],
    ['Superflip', 'Every edge flipped. Twenty moves from solved — the hardest state there is.', "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2"],
    ['Cube in a Cube', 'A smaller cube nested in one corner.', "F L F U' R U F2 L2 U' L' B D' B' L2 U"],
    ['Cube in a Cube in a Cube', 'Three nested cubes.', "U' L' U' F' R2 B' R F U B2 U B' L U' F U R F'"],
    ['Six Spots', 'One centre dot of the wrong colour on all six faces.', "U D' R L' F B' U D'"],
    ['Four Spots', 'Four faces get swapped centres.', "F2 B2 U D' R2 L2 U D'"],
    ['Anaconda', 'A snake winding around the cube.', "L U B' U' R L' B R' F B' D R D' F'"],
    ['Python', 'A fatter snake, coiled the other way.', "F2 R' B' U R' L F' L F' B D' R B L2"],
    ['Black Mamba', 'A third snake variant.', "R D L F' R L' D R' U D' B U' R' D'"],
    ['Union Jack', 'Diagonal flags on four faces.', "U F B' L2 U2 L2 F' B U2 L2 U"],
    ['Tetris', 'Interlocking blocks, eight moves.', "L R F B U' D' L' R'"],
    ['Spiral', 'A band spiralling around the cube.', "L' B' D U R U' R' D2 R2 D L D' L' R' F U"],
    ['Gift Box', 'The cube wrapped like a present.', "U B2 R2 B2 L2 F2 R2 D' F2 L R' U R' L D2 R2 F' L R' D2 F2 U2 D"]
  ].map(([name, desc, seq]) => ({
    id: 'p-' + name.toLowerCase().replace(/[^a-z]+/g, '-'),
    group: 'patterns', name,
    goal: desc,
    whenToUse: 'Any time. Patterns always start from a solved cube.',
    whyItWorks: 'Pattern sequences are symmetric: the same turns applied to opposite layers cancel out into a shape instead of a solve. Run the sequence backwards to return to solved.',
    variations: [{ label: 'From solved', moves: seq.split(/\s+/), setup: [] }]
  }))
];

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

// Icon slugs are Hugeicons Stroke Rounded names. The graduation cap ships as
// `mortarboard-01` and the hat-and-glasses as `incognito`; the newer
// `graduation-cap` / `hat-glasses` slugs are not in the released font yet.
export const GROUPS = [
  { key: 'beginner', name: "Beginner's Method", icon: 'mortarboard-01' },
  { key: 'advanced', name: 'Advanced Method', icon: 'incognito' },
  { key: 'patterns', name: 'Fun Patterns', icon: 'geometric-shapes-01' },
  { key: 'likes', name: 'Likes', icon: 'favourite' }
];
