// Headless checker for the beginner algorithms.
//
// It deliberately reuses parseMoves / invertMoves / moveSpec from cube-engine.js
// so it tests the engine's interpretation of a move, not a second opinion about
// what "R'" ought to mean. cube-engine.js reads window.THREE at module scope, so
// a stub is installed before the import; none of the three functions touch it.
//
//   node validate.mjs          run the checks, print the table
//   node validate.mjs --dump   also print the decoded case state per variation

globalThis.window = { THREE: {}, matchMedia: () => ({ matches: false }) };

const { parseMoves, invertMoves, moveSpec } = await import('./cube-engine.js');
const { ALGORITHMS, expandRun } = await import('./algorithms.js');

// --------------------------------------------------------------- cubie model
// A cubie is a position vector plus an integer rotation matrix. `bake()` in the
// engine does position.applyQuaternion(q) and quaternion.premultiply(q), so the
// matrix update here is M <- R * M, matching it exactly.

const HALF = Math.PI / 2;
const FACE_VEC = { U: [0, 1, 0], D: [0, -1, 0], R: [1, 0, 0], L: [-1, 0, 0], F: [0, 0, 1], B: [0, 0, -1] };
const FACE_ORDER = ['U', 'D', 'R', 'L', 'F', 'B'];
// Sticker colours are keyed by the face a cubie is at home on. Matches FACE_COLORS.
const HOME_COLOR = { U: 'W', D: 'Y', R: 'R', L: 'O', F: 'G', B: 'B' };
const ID = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

const COS = [1, 0, -1, 0], SIN = [0, 1, 0, -1];

function rot(axis, k) {
  const c = COS[k], s = SIN[k];
  if (axis === 'x') return [[1, 0, 0], [0, c, -s], [0, s, c]];
  if (axis === 'y') return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
  return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
}
const mulVec = (M, v) => [0, 1, 2].map(i => M[i][0] * v[0] + M[i][1] * v[1] + M[i][2] * v[2]);
const mulMat = (A, B) => [0, 1, 2].map(i => [0, 1, 2].map(j => A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j]));

export function solvedCube() {
  const out = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++)
    out.push({ home: [x, y, z], pos: [x, y, z], m: ID.map(r => r.slice()) });
  return out;
}

export function applyMoves(cube, tokens) {
  for (const tok of parseMoves(tokens)) {
    const sp = moveSpec(tok);
    const k = ((Math.round(sp.angle / HALF) % 4) + 4) % 4;
    const R = rot(sp.axis, k);
    const ai = sp.axis === 'x' ? 0 : sp.axis === 'y' ? 1 : 2;
    for (const c of cube) {
      if (sp.layers.indexOf(c.pos[ai]) === -1) continue;
      c.pos = mulVec(R, c.pos);
      c.m = mulMat(R, c.m);
    }
  }
  return cube;
}

// "Home" is judged on stickers, not on the raw matrix: a centre cubie spun about
// its own axis is visually identical, and counting that twist inflates every
// order by a factor of 4 (R U would read 420 instead of 105).
const isHome = cube => cube.every(c =>
  c.pos.every((v, i) => v === c.home[i]) &&
  FACE_ORDER.every(f => {
    const h = FACE_VEC[f];
    if (h[0] * c.home[0] + h[1] * c.home[1] + h[2] * c.home[2] !== 1) return true;
    const cur = mulVec(c.m, h);
    return cur[0] === h[0] && cur[1] === h[1] && cur[2] === h[2];
  }));

export function order(seq, cap = 2000) {
  const cube = solvedCube();
  for (let n = 1; n <= cap; n++) {
    applyMoves(cube, seq);
    if (isHome(cube)) return n;
  }
  return null;
}

// ------------------------------------------------------------ state readers
// Everything below is expressed relative to the *current* centre colours, so it
// stays correct after a whole-cube rotation in the setup (steps 3-7 use z2 y).

const at = (cube, p) => cube.find(c => c.pos[0] === p[0] && c.pos[1] === p[1] && c.pos[2] === p[2]);

export function sticker(cube, p, face) {
  const c = at(cube, p);
  if (!c) return null;
  const n = FACE_VEC[face];
  for (const f of FACE_ORDER) {
    const h = FACE_VEC[f];
    if (h[0] * c.home[0] + h[1] * c.home[1] + h[2] * c.home[2] !== 1) continue;
    const cur = mulVec(c.m, h);
    if (cur[0] === n[0] && cur[1] === n[1] && cur[2] === n[2]) return HOME_COLOR[f];
  }
  return null;
}

export const centre = (cube, f) => sticker(cube, FACE_VEC[f], f);

export function vecOf(tok) {
  const v = [0, 0, 0];
  for (const ch of tok) { const a = FACE_VEC[ch]; if (a) { v[0] += a[0]; v[1] += a[1]; v[2] += a[2]; } }
  return v;
}
const facesOf = tok => tok.split('').filter(ch => FACE_VEC[ch]);
const tokOf = p => FACE_ORDER.filter(f => {
  const v = FACE_VEC[f];
  return v[0] * p[0] + v[1] * p[1] + v[2] * p[2] === 1;
}).join('');

// right piece, right slot, right way up
export const placed = (cube, tok) =>
  facesOf(tok).every(f => sticker(cube, vecOf(tok), f) === centre(cube, f));

// right piece, right slot, orientation ignored
export function positioned(cube, tok) {
  const p = vecOf(tok), fs = facesOf(tok);
  const want = fs.map(f => centre(cube, f)).sort().join('');
  const got = fs.map(f => sticker(cube, p, f)).sort().join('');
  return want === got;
}

function slotsOf(face, kind) {
  const ax = FACE_VEC[face].findIndex(n => n !== 0), sign = FACE_VEC[face][ax];
  const out = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    const p = [x, y, z];
    const nz = p.filter(v => v !== 0).length;
    if (kind === 'mid' ? p[ax] !== 0 : p[ax] !== sign) continue;
    if (kind === 'edge' && nz !== 2) continue;
    if (kind === 'corner' && nz !== 3) continue;
    if (kind === 'mid' && nz !== 2) continue;
    out.push(p);
  }
  return out;
}

export const layerSolved = (cube, face) => slotsOf(face, 'all').every(p => placed(cube, tokOf(p)));
export const midEdgesSolved = (cube, face) => slotsOf(face, 'mid').every(p => placed(cube, tokOf(p)));
export const f2lSolved = (cube, down) => layerSolved(cube, down) && midEdgesSolved(cube, down);
export const crossSolved = (cube, up) => slotsOf(up, 'edge').every(p => placed(cube, tokOf(p)));
export const faceCross = (cube, up) => slotsOf(up, 'edge').every(p => sticker(cube, p, up) === centre(cube, up));
export const edgesOriented = (cube, up) => slotsOf(up, 'edge').filter(p => sticker(cube, p, up) === centre(cube, up)).map(tokOf);
export const cornersPositioned = (cube, up) => slotsOf(up, 'corner').every(p => positioned(cube, tokOf(p)));
export const cornersPlaced = (cube, up) => slotsOf(up, 'corner').filter(p => positioned(cube, tokOf(p))).map(tokOf);
export const solved = cube => FACE_ORDER.every(f => layerSolved(cube, f));

export function stateOf(setup) { return applyMoves(solvedCube(), setup); }

// ------------------------------------------------------------------ hygiene
// A visible F' F in a teaching animation is a bug: the learner watches two moves
// undo each other. Any two consecutive turns of the same face are redundant.
export function adjacentSameFace(moves) {
  const t = parseMoves(moves), bad = [];
  for (let i = 1; i < t.length; i++) if (t[i][0] === t[i - 1][0]) bad.push(`${t[i - 1]} ${t[i]} @${i - 1}`);
  return bad;
}

// ------------------------------------------------------------- keep tokens
// A typo here fails silently in the browser: 'UD' names two opposite faces, so
// it resolves to [0,0,0] and quietly lights the invisible core instead of a
// piece. Check the tokens resolve to a real slot before trusting the mask.
const OPPOSITE = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };

export function badKeepTokens(keep) {
  const bad = [];
  for (const raw of keep || []) {
    const tok = raw.replace('*', '');
    const fs = tok.split('');
    if (!fs.length || fs.some(ch => !FACE_VEC[ch])) { bad.push(`${raw}: not a face letter`); continue; }
    if (new Set(fs).size !== fs.length) { bad.push(`${raw}: repeated face`); continue; }
    if (fs.some(ch => fs.includes(OPPOSITE[ch]))) { bad.push(`${raw}: opposite faces`); continue; }
    if (fs.length > 3) bad.push(`${raw}: too many faces`);
    if (raw.includes('*') && fs.length !== 1) bad.push(`${raw}: '*' needs a single face`);
  }
  return bad;
}

// ---------------------------------------------------------------- self-tests
// If the model is wrong every result after it is noise, so this runs first and
// hard-exits on failure.
const INVARIANTS = [
  ["R U R' U'", 6],
  ["R U R' U R U2 R'", 6],                                  // Sune
  ["R U R' U' R' F R2 U' R' U' R U R' F'", 2],              // T-perm
  ['M2 E2 S2', 2],
  ['R U', 105],
  ["U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2", 2] // superflip
];

// ---- expansion tests -----------------------------------------------------
// expandRun is the single source of truth for a variation's move list, so a
// silent change here would rewrite algorithms without touching their text.
const EXPANSION_TESTS = [
  {
    name: 'block, spacer, block',
    input: { loop: ["R'", "D'", 'R', 'D'], until: 'yellow points up', run: [2, 'U', 1] },
    moves: ["R'", "D'", 'R', 'D', "R'", "D'", 'R', 'D', 'U', "R'", "D'", 'R', 'D'],
    entries: [
      { kind: 'block', repeat: 2, moves: ["R'", "D'", 'R', 'D'], until: 'yellow points up' },
      { kind: 'spacer', move: 'U' },
      { kind: 'block', repeat: 1, moves: ["R'", "D'", 'R', 'D'], until: 'yellow points up' }
    ],
    map: [
      { entry: 0, iteration: 0, offset: 0 }, { entry: 0, iteration: 0, offset: 1 },
      { entry: 0, iteration: 0, offset: 2 }, { entry: 0, iteration: 0, offset: 3 },
      { entry: 0, iteration: 1, offset: 0 }, { entry: 0, iteration: 1, offset: 1 },
      { entry: 0, iteration: 1, offset: 2 }, { entry: 0, iteration: 1, offset: 3 },
      { entry: 1 },
      { entry: 2, iteration: 0, offset: 0 }, { entry: 2, iteration: 0, offset: 1 },
      { entry: 2, iteration: 0, offset: 2 }, { entry: 2, iteration: 0, offset: 3 }
    ]
  },
  {
    // A flat variation must come out byte-identical to what it is today, with
    // every move its own spacer -- that is what keeps untouched cards rendering
    // exactly as before.
    name: 'flat moves pass through',
    input: { moves: ['F', "U'", 'R', 'U'] },
    moves: ['F', "U'", 'R', 'U'],
    entries: [
      { kind: 'spacer', move: 'F' }, { kind: 'spacer', move: "U'" },
      { kind: 'spacer', move: 'R' }, { kind: 'spacer', move: 'U' }
    ],
    map: [{ entry: 0 }, { entry: 1 }, { entry: 2 }, { entry: 3 }]
  },
  {
    name: 'leading spacer',
    input: { loop: ['R', 'U'], run: ['U', 1, 'y2', 1] },
    moves: ['U', 'R', 'U', 'y2', 'R', 'U'],
    entries: [
      { kind: 'spacer', move: 'U' },
      { kind: 'block', repeat: 1, moves: ['R', 'U'] },
      { kind: 'spacer', move: 'y2' },
      { kind: 'block', repeat: 1, moves: ['R', 'U'] }
    ],
    map: [
      { entry: 0 },
      { entry: 1, iteration: 0, offset: 0 }, { entry: 1, iteration: 0, offset: 1 },
      { entry: 2 },
      { entry: 3, iteration: 0, offset: 0 }, { entry: 3, iteration: 0, offset: 1 }
    ]
  }
];

function expansionTest() {
  let bad = 0;
  console.log('Expansion self-test');
  for (const t of EXPANSION_TESTS) {
    const got = expandRun(t.input);
    const checks = [
      ['moves', JSON.stringify(got.moves) === JSON.stringify(t.moves)],
      ['entries', JSON.stringify(got.entries) === JSON.stringify(t.entries)],
      ['map', JSON.stringify(got.map) === JSON.stringify(t.map)]
    ];
    for (const [what, ok] of checks) {
      if (!ok) { bad++; console.error(`  FAIL ${t.name}: ${what}\n    got  ${JSON.stringify(got[what])}\n    want ${JSON.stringify(t[what])}`); }
    }
    if (checks.every(c => c[1])) console.log(`  ok   ${t.name}`);
  }
  if (bad) { console.error('\nExpansion is wrong. Stopping.'); process.exit(1); }
  console.log('');
}

function selfTest() {
  const rows = INVARIANTS.map(([seq, want]) => {
    const got = order(seq);
    return { seq, want, got, ok: got === want };
  });
  const bad = rows.filter(r => !r.ok);
  console.log('Model self-test');
  rows.forEach(r => console.log(`  ${r.ok ? 'ok  ' : 'FAIL'} order(${r.seq}) = ${r.got}  expected ${r.want}`));
  if (bad.length) { console.error('\nModel is wrong. Stopping.'); process.exit(1); }
  console.log('');
}

// ------------------------------------------------------------- case checks
// Keyed by `${id}#${index}`. Each entry says what Ruwix's picture claims the
// start state is, and what the step is supposed to have achieved at the end.
// The goal is the *step* goal, not "solved" -- step 4 ends with a yellow cross
// and unsolved corners, and asserting "solved" there would be wrong.

const UP = 'U', DN = 'D';
const twoOriented = (c, pair) => {
  const on = edgesOriented(c, UP).sort().join(',');
  return on === pair.slice().sort().join(',');
};

const CHECKS = {
  // ---- step 1 : white up. Three cross edges done, the fourth is the case.
  'b-first-layer-edges': {
    goal: c => crossSolved(c, UP),
    goalName: 'white cross on U, side colours matched',
    cases: [
      { name: 'UF flipped in place',
        test: c => solvedExcept(c, ['UF']) && sticker(c, vecOf('UF'), 'U') === centre(c, 'F') && sticker(c, vecOf('UF'), 'F') === centre(c, 'U') },
      { name: 'edge at DF, white on F',
        test: c => solvedExcept(c, ['UF']) && sticker(c, vecOf('DF'), 'F') === centre(c, 'U') && sticker(c, vecOf('DF'), 'D') === centre(c, 'F') },
      { name: 'edge at FR, white on F',
        test: c => solvedExcept(c, ['UF']) && sticker(c, vecOf('FR'), 'F') === centre(c, 'U') && sticker(c, vecOf('FR'), 'R') === centre(c, 'F') },
      { name: 'edge at FL, white on F',
        test: c => solvedExcept(c, ['UF']) && sticker(c, vecOf('FL'), 'F') === centre(c, 'U') && sticker(c, vecOf('FL'), 'L') === centre(c, 'F') },
      { name: 'edge at BR, white on B',
        test: c => solvedExcept(c, ['UF']) && sticker(c, vecOf('BR'), 'B') === centre(c, 'U') && sticker(c, vecOf('BR'), 'R') === centre(c, 'F') }
    ]
  },

  // ---- step 2 : white up. Cross plus three corners done, UFR is the case.
  'b-first-layer-corners': {
    goal: c => layerSolved(c, UP),
    goalName: 'whole white layer solved',
    cases: [
      { name: 'corner at DFR, white facing R', test: c => cornerCase(c, 'DFR', 'R') },
      { name: 'corner at DFR, white facing F', test: c => cornerCase(c, 'DFR', 'F') },
      { name: 'corner at DFR, white facing D', test: c => cornerCase(c, 'DFR', 'D') },
      { name: 'UFR corner sitting in the UFL slot', test: c => cornerTop(c) }
    ]
  },

  // ---- step 3 : yellow up (z2 y). First layer done, one middle edge to place.
  'b-second-layer': {
    goal: c => f2lSolved(c, DN),
    goalName: 'first two layers solved',
    cases: [
      { name: 'edge at UF, F-colour on F (goes right)',
        test: c => layerSolved(c, DN) && sticker(c, vecOf('UF'), 'F') === centre(c, 'F') && sticker(c, vecOf('UF'), 'U') === centre(c, 'R') },
      { name: 'edge at UF, F-colour on F (goes left)',
        test: c => layerSolved(c, DN) && sticker(c, vecOf('UF'), 'F') === centre(c, 'F') && sticker(c, vecOf('UF'), 'U') === centre(c, 'L') },
      { name: 'edge in the FR slot, flipped',
        test: c => layerSolved(c, DN) && sticker(c, vecOf('FR'), 'F') === centre(c, 'R') && sticker(c, vecOf('FR'), 'R') === centre(c, 'F') }
    ]
  },

  // ---- step 4 : yellow up. F2L intact, top edges make dot / L / line.
  'b-yellow-cross': {
    goal: c => faceCross(c, UP) && f2lSolved(c, DN),
    goalName: 'yellow cross on top, F2L untouched',
    cases: [
      { name: 'horizontal line (UL/UR up)', test: c => f2lSolved(c, DN) && twoOriented(c, ['UL', 'UR']) },
      { name: 'L-shape hooked back-left (UL/UB up)', test: c => f2lSolved(c, DN) && twoOriented(c, ['UL', 'UB']) },
      { name: 'dot (no top edge up)', test: c => f2lSolved(c, DN) && edgesOriented(c, UP).length === 0 }
    ]
  },

  // ---- step 5 : yellow up. Cross made, edges need permuting.
  'b-swap-yellow-edges': {
    goal: c => crossSolved(c, UP) && f2lSolved(c, DN),
    goalName: 'top edges matched to their centres, F2L untouched',
    cases: [
      { name: 'two adjacent edges swapped (UF/UL)',
        test: c => f2lSolved(c, DN) && faceCross(c, UP) && swapped(c, 'UF', 'UL') },
      { name: 'two opposite edges swapped (UL/UR)',
        test: c => f2lSolved(c, DN) && faceCross(c, UP) && swapped(c, 'UL', 'UR') }
    ]
  },

  // ---- step 6 : yellow up. Corners into their slots, twist ignored.
  'b-position-yellow-corners': {
    goal: c => cornersPositioned(c, UP) && crossSolved(c, UP) && f2lSolved(c, DN),
    goalName: 'all four top corners in their slots, F2L untouched',
    cases: [
      { name: 'one corner home (URF), other three cycled',
        test: c => f2lSolved(c, DN) && crossSolved(c, UP) && cornersPlaced(c, UP).join() === 'URF' },
      { name: 'one corner home (URF), cycled the other way',
        test: c => f2lSolved(c, DN) && crossSolved(c, UP) && cornersPlaced(c, UP).join() === 'URF' }
    ]
  },

  // ---- step 7 : yellow up. Everything placed, corners need twisting.
  // R' D' R D wrecks F2L while you work and only restores it once the loop
  // counts across every corner total six, so a single-corner drill legitimately
  // ends on a broken-looking cube. Only the endpoint of each run is asserted,
  // and what counts as the endpoint differs per variation.
  'b-orient-last-corners': {
    goal: c => solved(c),
    goalName: 'cube solved',
    cases: [
      { name: 'URF twisted, F2L intact', test: twistCase,
        goal: c => sticker(c, vecOf('UFR'), 'U') === centre(c, 'U') && cornersPositioned(c, UP),
        goalName: 'front-right corner now yellow-up (F2L still open — two more loops owed)' },
      { name: 'URF twisted the other way, F2L intact', test: twistCase,
        goal: c => sticker(c, vecOf('UFR'), 'U') === centre(c, 'U') && cornersPositioned(c, UP),
        goalName: 'front-right corner now yellow-up (F2L still open — two more loops owed)' },
      { name: 'two adjacent corners twisted, F2L intact', test: twistCase }
    ]
  }
};

// helpers used by the tables above
function solvedExcept(c, skip) {
  return slotsOf(UP, 'edge').every(p => skip.includes(tokOf(p)) || placed(c, tokOf(p)));
}
function cornerCase(c, slot, face) {
  return crossSolved(c, UP)
    && slotsOf(UP, 'corner').filter(p => placed(c, tokOf(p))).length === 3
    && sticker(c, vecOf(slot), face) === centre(c, 'U');
}
// The corner that belongs at URF is sitting in the ULF slot, white already up.
// Only two of the four top corners are actually done: the ULF piece has been
// pushed out to the bottom layer, so it is not one of them.
function cornerTop(c) {
  const home = cornersPlaced(c, UP);
  const want = ['U', 'R', 'F'].map(f => centre(c, f)).sort().join('');
  const got = ['U', 'L', 'F'].map(f => sticker(c, vecOf('ULF'), f)).sort().join('');
  return crossSolved(c, UP) && home.join() === 'ULB,URB'
    && got === want && sticker(c, vecOf('ULF'), 'U') === centre(c, 'U');
}
function swapped(c, a, b) {
  const fa = facesOf(a).filter(f => f !== UP)[0], fb = facesOf(b).filter(f => f !== UP)[0];
  return sticker(c, vecOf(a), fa) === centre(c, fb) && sticker(c, vecOf(b), fb) === centre(c, fa);
}
function twistCase(c) {
  return f2lSolved(c, DN) && crossSolved(c, UP) && cornersPositioned(c, UP)
    && sticker(c, vecOf('UFR'), 'U') !== centre(c, 'U');
}

// --------------------------------------------------------------------- main
function main() {
  expansionTest();
  selfTest();
  const dump = process.argv.includes('--dump');
  const rows = [];
  let fails = 0;

  for (const alg of ALGORITHMS.filter(a => a.group === 'beginner')) {
    const spec = CHECKS[alg.id];
    alg.variations.forEach((v, i) => {
      const label = `${alg.id}#${i}`;
      const notes = [];
      let verdict = 'match';

      if (v.setup == null) { notes.push('NO EXPLICIT SETUP'); verdict = 'mismatch'; }

      const start = stateOf(v.setup != null ? v.setup : invertMoves(v.moves));
      const end = applyMoves(stateOf(v.setup != null ? v.setup : invertMoves(v.moves)), v.moves);

      const c = spec && spec.cases[i];
      if (!c) { notes.push('no case predicate'); verdict = 'unchecked'; }
      else if (!c.test(start)) { notes.push(`start is not "${c.name}"`); verdict = 'mismatch'; }

      // A variation may narrow the step goal: step 7's single-corner drills end
      // with F2L still open on purpose.
      const goal = (c && c.goal) || (spec && spec.goal);
      const goalName = (c && c.goalName) || (spec && spec.goalName);
      if (goal && !goal(end)) { notes.push(`end is not "${goalName}"`); verdict = 'mismatch'; }

      // Steps 4-6 must hand the first two layers back exactly as they found
      // them. Asserted separately from the step goal so that a later edit to a
      // goal predicate cannot quietly drop it.
      if (['b-yellow-cross', 'b-swap-yellow-edges', 'b-position-yellow-corners'].includes(alg.id)
        && !(f2lSolved(start, DN) && f2lSolved(end, DN))) {
        notes.push('F2L not preserved'); verdict = 'mismatch';
      }

      const badKeep = badKeepTokens(v.keep);
      if (badKeep.length) { notes.push('keep: ' + badKeep.join(', ')); verdict = 'mismatch'; }
      if (!v.keep && v.dim !== false) { notes.push('no keep mask (falls back to touched pieces)'); }

      const dup = adjacentSameFace(v.moves);
      if (dup.length) { notes.push('dead pair: ' + dup.join(', ')); verdict = 'mismatch'; }

      if (verdict !== 'match') fails++;
      rows.push({ label, name: v.label, src: v.source || '-', verdict, notes: notes.join('; ') });

      if (dump) {
        console.log(`\n--- ${label}  ${v.label}`);
        console.log('    moves :', parseMoves(v.moves).join(' '));
        console.log('    setup :', parseMoves(v.setup != null ? v.setup : invertMoves(v.moves)).join(' '));
        console.log('    start : F2L(D)=', f2lSolved(start, DN), ' layer(U)=', layerSolved(start, UP),
          ' crossU=', crossSolved(start, UP), ' upOriented=', edgesOriented(start, UP).join('/') || 'none',
          ' cornersHome=', cornersPlaced(start, UP).join('/') || 'none');
        console.log('    end   : F2L(D)=', f2lSolved(end, DN), ' crossU=', crossSolved(end, UP),
          ' faceCrossU=', faceCross(end, UP), ' cornersPos=', cornersPositioned(end, UP), ' solved=', solved(end));
      }
    });
  }

  const w = [22, 34, 26, 10];
  const pad = (s, n) => String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s).padEnd(n);
  console.log('\n' + pad('variation', w[0]) + pad('label', w[1]) + pad('ruwix source', w[2]) + pad('verdict', w[3]) + 'notes');
  console.log('-'.repeat(130));
  rows.forEach(r => console.log(pad(r.label, w[0]) + pad(r.name, w[1]) + pad(r.src, w[2]) + pad(r.verdict, w[3]) + r.notes));
  console.log('-'.repeat(130));
  console.log(`${rows.length} variations, ${rows.length - fails} match, ${fails} need attention`);
  process.exitCode = fails ? 1 : 0;
}

const { pathToFileURL } = await import('node:url');
if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
