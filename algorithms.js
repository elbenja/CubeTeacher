// Cube Trainer content. One place to edit every algorithm.
// variations[].setup omitted => the engine uses the inverse of the moves,
// so the case is guaranteed to be solved on the last move.

export const ALGORITHMS = [
  // ---------------------------------------------------------------- Beginner
  {
    id: 'b-first-layer-edges', group: 'beginner', name: 'First Layer Edges',
    goal: 'Get the four white edges into a cross on the top face, each matching its side colour.',
    whenToUse: 'Very first step. The cube is scrambled and nothing is built yet.',
    whyItWorks: 'The daisy parks all four white edges on the yellow face first, so each one can drop straight down into place with a single half turn — no piece you already placed ever gets disturbed.',
    variations: [
      { label: 'Petal above its face', moves: ['F2'] },
      { label: 'Edge flipped in place', moves: ['F', 'U', "R'", "U'"] },
      { label: 'Edge stuck in middle layer', moves: ['R', 'U', "R'", "U'"] }
    ]
  },
  {
    id: 'b-first-layer-corners', group: 'beginner', name: 'First Layer Corners',
    goal: 'Drop each white corner under its slot and screw it up into the first layer.',
    whenToUse: 'The white cross is done and a white corner sits in the bottom layer.',
    whyItWorks: "R' D' R D is a three-move loop that lifts the corner out, spins the bottom, and puts it back rotated. Repeat it and the corner walks around until white points up.",
    variations: [
      { label: 'White faces right', moves: ["R'", "D'", 'R'] },
      { label: 'White faces you', moves: ['F', 'D', "F'"] },
      { label: 'White faces down', moves: ["R'", 'D2', 'R', 'D', "R'", "D'", 'R'] }
    ]
  },
  {
    id: 'b-second-layer', group: 'beginner', name: 'Second Layer (F2L)',
    goal: 'Place the four middle-layer edges without breaking the finished first layer.',
    whenToUse: 'First layer complete. An edge with no yellow sits in the top layer.',
    whyItWorks: 'You push the edge down into the wrong slot, restore the corner that was living there, then bring the pair back — a setup, a repair, and an undo.',
    variations: [
      { label: 'Insert to the right', moves: ['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F'] },
      { label: 'Insert to the left', moves: ["U'", "L'", 'U', 'L', 'U', 'F', "U'", "F'"] },
      { label: 'Edge flipped in slot', moves: ['R', 'U', "R'", "U'", 'R', 'U', "R'"] }
    ]
  },
  {
    id: 'b-yellow-cross', group: 'beginner', name: 'Yellow Cross',
    goal: 'Make a yellow plus sign on the top face. Corners can stay wrong.',
    whenToUse: 'Two layers done. The top face shows a dot, an L, or a line.',
    whyItWorks: 'F R U R′ U′ F′ flips exactly two top edges at a time. A line needs it once, an L needs it once from the right angle, a dot needs it twice.',
    variations: [
      { label: 'Line (hold horizontal)', moves: ['F', 'R', 'U', "R'", "U'", "F'"] },
      { label: 'L-shape (hook top-left)', moves: ['F', 'U', 'R', "U'", "R'", "F'"] },
      { label: 'Dot (run it twice)', moves: ['F', 'R', 'U', "R'", "U'", "F'", 'F', 'U', 'R', "U'", "R'", "F'"] }
    ]
  },
  {
    id: 'b-swap-yellow-edges', group: 'beginner', name: 'Swap The Yellow Edges',
    goal: 'Line up the yellow cross edges with their side colours.',
    whenToUse: 'The yellow cross exists but the edge colours do not match the sides.',
    whyItWorks: 'The sequence cycles three top edges and leaves the rest alone, so you can rotate mismatched edges into place one triple at a time.',
    variations: [
      { label: 'Two adjacent edges', moves: ['R', 'U', "R'", 'U', 'R', 'U2', "R'", 'U'] },
      { label: 'Two opposite edges', moves: ['R', 'U', "R'", 'U', 'R', 'U2', "R'", 'U', 'R', 'U', "R'", 'U', 'R', 'U2', "R'", 'U'] }
    ]
  },
  {
    id: 'b-position-yellow-corners', group: 'beginner', name: 'Position Yellow Corners',
    goal: 'Get every yellow corner to its correct corner slot. Twist comes later.',
    whenToUse: 'Yellow cross is matched and at least one corner is already home.',
    whyItWorks: 'This is a pure three-corner cycle. Hold the already-correct corner in the front-right and the other three rotate around it.',
    variations: [
      { label: 'Correct corner front-right', moves: ['U', 'R', "U'", "L'", 'U', "R'", "U'", 'L'] },
      { label: 'No corner correct yet', moves: ['U', 'R', "U'", "L'", 'U', "R'", "U'", 'L', 'U', 'R', "U'", "L'", 'U', "R'", "U'", 'L'] }
    ]
  },
  {
    id: 'b-orient-last-corners', group: 'beginner', name: 'Orient Last Layer Corners',
    goal: 'Twist each yellow corner so yellow points up. This finishes the cube.',
    whenToUse: 'Every corner is in the right slot but some are twisted.',
    whyItWorks: "Same R' D' R D loop as the first layer, applied to a corner held front-right. Two loops twist it one way, four twist it the other. Never rotate the cube between corners — only U.",
    variations: [
      { label: 'Twisted clockwise', moves: ["R'", "D'", 'R', 'D', "R'", "D'", 'R', 'D'] },
      { label: 'Twisted counter-clockwise', moves: ["R'", "D'", 'R', 'D', "R'", "D'", 'R', 'D', "R'", "D'", 'R', 'D', "R'", "D'", 'R', 'D'] },
      { label: 'Then U to the next corner', moves: ["R'", "D'", 'R', 'D', "R'", "D'", 'R', 'D', 'U'] }
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

// Icon slugs are Hugeicons Stroke Rounded names. The graduation cap ships as
// `mortarboard-01` and the hat-and-glasses as `incognito`; the newer
// `graduation-cap` / `hat-glasses` slugs are not in the released font yet.
export const GROUPS = [
  { key: 'beginner', name: "Beginner's Method", icon: 'mortarboard-01', ordered: true },
  { key: 'advanced', name: 'Advanced Method', icon: 'incognito', ordered: false },
  { key: 'patterns', name: 'Fun Patterns', icon: 'geometric-shapes-01', ordered: false },
  { key: 'likes', name: 'Likes', icon: 'favourite', ordered: false }
];
