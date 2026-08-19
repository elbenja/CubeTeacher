// Headless checker for the beginner algorithms.
//
// It deliberately reuses parseMoves / invertMoves / moveSpec from cube-engine.js
// so it tests the engine's interpretation of a move, not a second opinion about
// what "R'" ought to mean. cube-engine.js reads window.THREE at module scope, so
// a stub is installed before the import; none of the three functions touch it.
//
//   node validate.mjs          run the checks, print the table
//   node validate.mjs --dump   also print the decoded case state per variation

// cube-engine.js builds a couple of THREE.Color instances at module scope (the
// hover-ghost WHITE). None of the functions used here touch three.js, but the
// import still has to survive, so the stub carries a Color that satisfies the
// calls made during module evaluation.
globalThis.window = {
  THREE: { Color: class { constructor() {} copy() { return this; } lerp() { return this; } } },
  matchMedia: () => ({ matches: false })
};

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

// ------------------------------------------------------------ case signature
// Advanced cases are chosen by asking what an algorithm's inverse produces, so
// the authoring loop needs to read a candidate's case back out. Everything here
// is reporting only -- nothing in CHECKS depends on it.

const U_CORNER_TOKS = ['UFR', 'UFL', 'UBR', 'UBL'];

export const cornersOriented = (cube, up) =>
  slotsOf(up, 'corner').every(p => sticker(cube, p, up) === centre(cube, up));

export const faceSolid = (cube, up) => faceCross(cube, up) && cornersOriented(cube, up);

export const slotSolved = (cube, cornerTok, edgeTok) =>
  placed(cube, cornerTok) && placed(cube, edgeTok);

// The 3x3 of U-facing stickers, back row first, as the badge draws it.
export function topGrid(cube) {
  const up = centre(cube, 'U');
  const rows = [];
  for (let z = -1; z <= 1; z++) {
    let row = '';
    for (let x = -1; x <= 1; x++) row += sticker(cube, [x, 1, z], 'U') === up ? 'X' : '.';
    rows.push(row);
  }
  return rows;
}

// The twelve side stickers of the top layer. H and Pi share a 3x3 and are told
// apart only here, so this is load-bearing for recognition, not decoration.
export function topTabs(cube) {
  const up = centre(cube, 'U');
  const on = (p, f) => sticker(cube, p, f) === up ? 'X' : '.';
  return {
    B: [-1, 0, 1].map(x => on([x, 1, -1], 'B')).join(''),
    R: [-1, 0, 1].map(z => on([1, 1, z], 'R')).join(''),
    F: [-1, 0, 1].map(x => on([x, 1, 1], 'F')).join(''),
    L: [-1, 0, 1].map(z => on([-1, 1, z], 'L')).join('')
  };
}

const SLOT_PAIRS = { FR: ['DFR', 'FR'], FL: ['DFL', 'FL'], BR: ['DBR', 'BR'], BL: ['DBL', 'BL'] };
export const slotsDone = cube =>
  Object.keys(SLOT_PAIRS).filter(s => slotSolved(cube, SLOT_PAIRS[s][0], SLOT_PAIRS[s][1]));

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
  },
  {
    name: 'yellow cross dot, three runs',
    input: { loop: ['F', 'R', 'U', "R'", "U'", "F'"], run: [1, 'y2', 1, 'y2', 1] },
    moves: ['F', 'R', 'U', "R'", "U'", "F'", 'y2', 'F', 'R', 'U', "R'", "U'", "F'", 'y2', 'F', 'R', 'U', "R'", "U'", "F'"],
    entries: [
      { kind: 'block', repeat: 1, moves: ['F', 'R', 'U', "R'", "U'", "F'"] },
      { kind: 'spacer', move: 'y2' },
      { kind: 'block', repeat: 1, moves: ['F', 'R', 'U', "R'", "U'", "F'"] },
      { kind: 'spacer', move: 'y2' },
      { kind: 'block', repeat: 1, moves: ['F', 'R', 'U', "R'", "U'", "F'"] }
    ],
    map: [
      { entry: 0, iteration: 0, offset: 0 }, { entry: 0, iteration: 0, offset: 1 }, { entry: 0, iteration: 0, offset: 2 },
      { entry: 0, iteration: 0, offset: 3 }, { entry: 0, iteration: 0, offset: 4 }, { entry: 0, iteration: 0, offset: 5 },
      { entry: 1 },
      { entry: 2, iteration: 0, offset: 0 }, { entry: 2, iteration: 0, offset: 1 }, { entry: 2, iteration: 0, offset: 2 },
      { entry: 2, iteration: 0, offset: 3 }, { entry: 2, iteration: 0, offset: 4 }, { entry: 2, iteration: 0, offset: 5 },
      { entry: 3 },
      { entry: 4, iteration: 0, offset: 0 }, { entry: 4, iteration: 0, offset: 1 }, { entry: 4, iteration: 0, offset: 2 },
      { entry: 4, iteration: 0, offset: 3 }, { entry: 4, iteration: 0, offset: 4 }, { entry: 4, iteration: 0, offset: 5 }
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

// -------------------------------------------------- corner-orientation cases
// Four cards cover seven cases, which is only defensible if the procedure they
// teach -- loop until yellow is up, U to the next twisted corner -- provably
// solves every one. So it is asserted here rather than asserted in prose.

const TWIST_SLOTS = ['UFR', 'UFL', 'UBL', 'UBR'];   // U maps UFR -> UFL
const TWIST_LOOP = ["R'", "D'", 'R', 'D'];
const TWIST_BASE = [[0, 0, 1], [1, 0, 0], [0, 1, 0]];

// Rotation by 120 degrees about the body diagonal through a corner. diag(p) is a
// reflection when the sign parity is negative, which silently flips the turn
// direction, so transpose it back -- otherwise "twist 1" means opposite things
// at different corners and the class count comes out wrong.
function twistMat(p) {
  const T = [0, 1, 2].map(i => [0, 1, 2].map(j => p[i] * TWIST_BASE[i][j] * p[j]));
  return p[0] * p[1] * p[2] > 0 ? T : [0, 1, 2].map(i => [0, 1, 2].map(j => T[j][i]));
}

function twistedCube(counts) {
  const cube = solvedCube();
  TWIST_SLOTS.forEach((tok, i) => {
    const p = vecOf(tok);
    const c = cube.find(x => x.pos.every((v, k) => v === p[k]));
    const T = twistMat(p);
    for (let n = 0; n < ((counts[i] % 3) + 3) % 3; n++) c.m = mulMat(T, c.m);
  });
  return cube;
}

const cornerUp = (cube, tok) => sticker(cube, vecOf(tok), 'U') === centre(cube, 'U');
const allCornersUp = cube => TWIST_SLOTS.every(t => cornerUp(cube, t));

export const TWIST_CLASSES = (() => {
  const canon = v => {
    let best = null;
    for (let r = 0; r < 4; r++) {
      const k = v.slice(r).concat(v.slice(0, r)).join('');
      if (best === null || k < best) best = k;
    }
    return best;
  };
  const seen = new Map();
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) for (let d = 0; d < 3; d++) {
    if ((a + b + c + d) % 3 !== 0) continue;          // corner twists must sum to 0 mod 3
    const key = canon([a, b, c, d]);
    if (!seen.has(key) && key !== '0000') seen.set(key, [a, b, c, d]);
  }
  return [...seen].map(([key, counts]) => ({ key, counts }));
})();

// Run the beginner procedure from a given hold. Returns the loop/spacer shape,
// or null if it failed to terminate.
export function runProcedure(counts, hold) {
  const cube = twistedCube(counts);
  applyMoves(cube, Array(hold).fill('U'));
  const shape = [];
  let uTurns = hold, guard = 0;
  while (!allCornersUp(cube)) {
    if (++guard > 20) return null;
    let k = 0;
    while (cornerUp(cube, 'UFR')) { applyMoves(cube, ['U']); k++; uTurns++; }
    if (k) shape.push(k === 1 ? 'U' : k === 2 ? 'U2' : "U'");
    let n = 0;
    while (!cornerUp(cube, 'UFR')) { applyMoves(cube, TWIST_LOOP); n++; if (n > 6) return null; }
    shape.push(n);
  }
  const fin = (4 - (uTurns % 4)) % 4;
  if (fin) { applyMoves(cube, Array(fin).fill('U')); shape.push(fin === 1 ? 'U' : fin === 2 ? 'U2' : "U'"); }
  return { shape, solved: solved(cube) };
}

function procedureTest() {
  console.log('Corner-orientation procedure');
  let bad = 0;
  if (TWIST_CLASSES.length !== 7) {
    console.error(`  FAIL expected 7 non-solved classes, got ${TWIST_CLASSES.length}`);
    bad++;
  }
  for (const { key, counts } of TWIST_CLASSES) {
    const runs = [0, 1, 2, 3].map(h => runProcedure(counts, h));
    const ok = runs.every(r => r && r.solved);
    if (!ok) { bad++; console.error(`  FAIL [${key}] procedure did not solve from every hold`); }
    else console.log(`  ok   [${key}] ${runs[1].shape.map(s => (typeof s === 'number' ? '×' + s : s)).join(' ')}`);
  }
  if (bad) { console.error('\nProcedure is wrong. Stopping.'); process.exit(1); }
  console.log('');
}

// ------------------------------------------------------------- case checks
// `cases` is keyed by the variation's exact `label` string from algorithms.js,
// not by array position -- a positional index silently misaligns the moment a
// variation list is reordered or resized. Each entry says what Ruwix's picture
// claims the start state is, and what the step is supposed to have achieved at
// the end. The goal is the *step* goal, not "solved" -- step 4 ends with a
// yellow cross and unsolved corners, and asserting "solved" there would be
// wrong.

const UP = 'U', DN = 'D';
const twoOriented = (c, pair) => {
  const on = edgesOriented(c, UP).sort().join(',');
  return on === pair.slice().sort().join(',');
};

// An OCLL case: F2L done, every top edge oriented, and exactly this set of top
// corners already showing the up colour. H and Pi both orient none, so callers
// separate those two on the side tabs.
const ocll = (c, up) =>
  f2lSolved(c, DN) && faceCross(c, UP) &&
  U_CORNER_TOKS.filter(t => sticker(c, vecOf(t), 'U') === centre(c, 'U')).sort().join(',') === up.slice().sort().join(',');

// Look 2 of PLL: the face is solid and the corners are home, only the top edges
// are still out of place.
const pllEdges = c =>
  f2lSolved(c, DN) && faceSolid(c, UP) && cornersPositioned(c, UP) && !crossSolved(c, UP);

// The bottom cross with named slots excused -- the mirror of solvedExcept.
const crossExceptD = (c, skip) =>
  slotsOf(DN, 'edge').every(p => skip.includes(tokOf(p)) || placed(c, tokOf(p)));

// Cross done and three slots done, FR open: the shared precondition of every
// advanced F2L case.
const f2lExceptFR = c =>
  crossSolved(c, DN) && !slotSolved(c, 'DFR', 'FR') &&
  slotSolved(c, 'DFL', 'FL') && slotSolved(c, 'DBR', 'BR') && slotSolved(c, 'DBL', 'BL');

// The two pieces of the FR pair, pinned by naming the face each colour is on.
//
// Naming a single sticker is not enough: "white on the corner's front face" is
// unique, but "the R colour on the UB edge's back face" is also true of the
// yellow-red last-layer edge parked there, so a one-sticker test would match
// two different cases. Naming both stickers of the edge, and white plus the F
// colour on the corner, fixes the piece *and* its orientation -- the third
// corner sticker then follows -- which makes the pair (corner, edge) a complete
// signature of the case. That is what stops two F2L cards sharing a predicate.
const frEdgeAt = (c, tok, fFace) => {
  const other = tok.split('').find(f => f !== fFace);
  return sticker(c, vecOf(tok), fFace) === centre(c, 'F')
      && sticker(c, vecOf(tok), other) === centre(c, 'R');
};
const frCornerAt = (c, tok, whiteFace, fFace) =>
  sticker(c, vecOf(tok), whiteFace) === centre(c, 'D') &&
  sticker(c, vecOf(tok), fFace) === centre(c, 'F');

const CHECKS = {
  // ---- step 1 : white up. Three cross edges done, the fourth is the case.
  'b-first-layer-edges': {
    goal: c => crossSolved(c, UP),
    goalName: 'white cross on U, side colours matched',
    cases: {
      'Flip the last edge':
        { name: 'UF flipped in place',
          test: c => solvedExcept(c, ['UF']) && sticker(c, vecOf('UF'), 'U') === centre(c, 'F') && sticker(c, vecOf('UF'), 'F') === centre(c, 'U') },
      'Edge on the front face':
        { name: 'edge at DF, white on F',
          test: c => solvedExcept(c, ['UF']) && sticker(c, vecOf('DF'), 'F') === centre(c, 'U') && sticker(c, vecOf('DF'), 'D') === centre(c, 'F') },
      'Edge in the middle layer':
        { name: 'edge at FR, white on F',
          test: c => solvedExcept(c, ['UF']) && sticker(c, vecOf('FR'), 'F') === centre(c, 'U') && sticker(c, vecOf('FR'), 'R') === centre(c, 'F') },
      'Same case mirrored':
        { name: 'edge at FL, white on F',
          test: c => solvedExcept(c, ['UF']) && sticker(c, vecOf('FL'), 'F') === centre(c, 'U') && sticker(c, vecOf('FL'), 'L') === centre(c, 'F') },
      'Edge stuck in the equator':
        { name: 'edge at BR, white on B',
          test: c => solvedExcept(c, ['UF']) && sticker(c, vecOf('BR'), 'B') === centre(c, 'U') && sticker(c, vecOf('BR'), 'R') === centre(c, 'F') }
    }
  },

  // ---- step 2 : white up. Cross plus three corners done, UFR is the case.
  'b-first-layer-corners': {
    goal: c => layerSolved(c, UP),
    goalName: 'whole white layer solved',
    cases: {
      'White faces right': { name: 'corner at DFR, white facing R', test: c => cornerCase(c, 'DFR', 'R') },
      'White faces you': { name: 'corner at DFR, white facing F', test: c => cornerCase(c, 'DFR', 'F') },
      'White points down': { name: 'corner at DFR, white facing D', test: c => cornerCase(c, 'DFR', 'D') },
      'Right layer, wrong slot': { name: 'UFR corner sitting in the UFL slot', test: c => cornerTop(c) }
    }
  },

  // ---- step 3 : yellow up (z2 y). First layer done, one middle edge to place.
  'b-second-layer': {
    goal: c => f2lSolved(c, DN),
    goalName: 'first two layers solved',
    cases: {
      'Insert to the right':
        { name: 'edge at UF, F-colour on F (goes right)',
          test: c => layerSolved(c, DN) && sticker(c, vecOf('UF'), 'F') === centre(c, 'F') && sticker(c, vecOf('UF'), 'U') === centre(c, 'R') },
      'Insert to the left':
        { name: 'edge at UF, F-colour on F (goes left)',
          test: c => layerSolved(c, DN) && sticker(c, vecOf('UF'), 'F') === centre(c, 'F') && sticker(c, vecOf('UF'), 'U') === centre(c, 'L') },
      'Edge flipped in its slot':
        { name: 'edge in the FR slot, flipped',
          test: c => layerSolved(c, DN) && sticker(c, vecOf('FR'), 'F') === centre(c, 'R') && sticker(c, vecOf('FR'), 'R') === centre(c, 'F') }
    }
  },

  // ---- step 4 : yellow up. F2L intact, top edges make dot / L / line.
  'b-yellow-cross': {
    goal: c => faceCross(c, UP) && f2lSolved(c, DN),
    goalName: 'yellow cross on top, F2L untouched',
    cases: {
      'Line (hold horizontal)': { name: 'horizontal line (UL/UR up)', test: c => f2lSolved(c, DN) && twoOriented(c, ['UL', 'UR']) },
      'L-shape (hook back-left)': { name: 'L-shape hooked back-left (UL/UB up)', test: c => f2lSolved(c, DN) && twoOriented(c, ['UL', 'UB']) },
      'Dot (three runs)': { name: 'dot (no top edge up)', test: c => f2lSolved(c, DN) && edgesOriented(c, UP).length === 0 }
    }
  },

  // ---- step 5 : yellow up. Cross made, edges need permuting.
  'b-swap-yellow-edges': {
    goal: c => crossSolved(c, UP) && f2lSolved(c, DN),
    goalName: 'top edges matched to their centres, F2L untouched',
    cases: {
      'Two adjacent edges':
        { name: 'two adjacent edges swapped (UF/UL)',
          test: c => f2lSolved(c, DN) && faceCross(c, UP) && swapped(c, 'UF', 'UL') },
      'Two opposite edges':
        { name: 'two opposite edges swapped (UL/UR)',
          test: c => f2lSolved(c, DN) && faceCross(c, UP) && swapped(c, 'UL', 'UR') }
    }
  },

  // ---- step 6 : yellow up. Corners into their slots, twist ignored.
  'b-position-yellow-corners': {
    goal: c => cornersPositioned(c, UP) && crossSolved(c, UP) && f2lSolved(c, DN),
    goalName: 'all four top corners in their slots, F2L untouched',
    cases: {
      'One corner already home':
        { name: 'one corner home (URF), other three cycled',
          test: c => f2lSolved(c, DN) && crossSolved(c, UP) && cornersPlaced(c, UP).join() === 'URF' },
      'Run it again':
        { name: 'one corner home (URF), cycled the other way',
          test: c => f2lSolved(c, DN) && crossSolved(c, UP) && cornersPlaced(c, UP).join() === 'URF' }
    }
  },

  // ---- step 7 : yellow up. Everything placed, corners need twisting.
  // R' D' R D wrecks F2L while you work and only restores it once the loop
  // counts across every corner total a multiple of six, so the cube looks broken
  // part-way through. Each card runs the whole arrangement, so every one of them
  // ends on a solved cube.
  'b-orient-last-corners': {
    goal: c => solved(c),
    goalName: 'cube solved',
    cases: {
      'Two corners twisted, side by side':
        { name: 'two adjacent corners twisted (URF, URB), F2L intact',
          test: c => twistCase(c, 2, 'adjacent') },
      'Two corners twisted, diagonal':
        { name: 'two diagonal corners twisted (URF, ULB), F2L intact',
          test: c => twistCase(c, 2, 'diagonal') },
      'Three corners twisted':
        { name: 'three corners twisted (URF, ULB, URB), F2L intact',
          test: c => twistCase(c, 3) },
      'All four corners twisted':
        { name: 'all four corners twisted, F2L intact',
          test: c => twistCase(c, 4) }
    }
  },

  // ---- advanced cross : white down (z2 y). Cases 1-3 each displace exactly
  // one bottom-cross edge and are told apart by which slot is missing plus
  // which sticker of the displaced edge shows white; the worked example
  // displaces several at once and is checked only on its end state, per the
  // brief's own note that there is no single piece to pin there.
  'a-white-cross': {
    goal: c => crossSolved(c, DN),
    goalName: 'white cross solved on the bottom',
    cases: {
      'Edge on top, white up': {
        name: 'DF edge at UF, white facing up',
        test: c => crossExceptD(c, ['DF']) && sticker(c, vecOf('UF'), 'U') === centre(c, 'D') },
      'Edge on top, flipped': {
        name: 'DF edge at UF, white facing front',
        test: c => crossExceptD(c, ['DF']) && sticker(c, vecOf('UF'), 'F') === centre(c, 'D') },
      'Edge in the equator': {
        name: 'DR edge wedged at BR, white facing back',
        test: c => crossExceptD(c, ['DR']) && sticker(c, vecOf('BR'), 'B') === centre(c, 'D') },
      'Four edges, planned': {
        name: 'several cross edges out of place',
        test: c => !crossSolved(c, DN) }
    }
  },

  // ---- advanced OLL : yellow up (z2 y). Two looks in one entry, so look 1
  // carries its own goal -- its corners are still wrong and asserting a solid
  // face there would be wrong.
  'a-oll': {
    goal: c => faceSolid(c, UP) && f2lSolved(c, DN),
    goalName: 'whole top face one colour, F2L untouched',
    cases: {
      'Look 1 — dot': {
        name: 'dot (no top edge up)',
        goal: c => faceCross(c, UP) && f2lSolved(c, DN),
        goalName: 'top edges oriented, F2L untouched',
        test: c => f2lSolved(c, DN) && edgesOriented(c, UP).length === 0 },
      'Look 1 — line': {
        name: 'horizontal line (UL/UR up), corners unknown',
        goal: c => faceCross(c, UP) && f2lSolved(c, DN),
        goalName: 'top edges oriented, F2L untouched',
        test: c => f2lSolved(c, DN) && twoOriented(c, ['UL', 'UR']) },
      'Look 1 — L-shape': {
        name: 'L hooked back-left (UL/UB up), corners unknown',
        goal: c => faceCross(c, UP) && f2lSolved(c, DN),
        goalName: 'top edges oriented, F2L untouched',
        test: c => f2lSolved(c, DN) && twoOriented(c, ['UL', 'UB']) },
      'Look 2 — Sune': { name: 'edges oriented, one corner up (UFL)', test: c => ocll(c, ['UFL']) },
      'Look 2 — Anti-Sune': { name: 'edges oriented, one corner up (UBR)', test: c => ocll(c, ['UBR']) },
      'Look 2 — T': { name: 'edges oriented, two corners up (UBR/UFR)', test: c => ocll(c, ['UBR', 'UFR']) },
      'Look 2 — U': { name: 'edges oriented, two corners up (UBL/UBR)', test: c => ocll(c, ['UBL', 'UBR']) },
      'Look 2 — L': { name: 'edges oriented, two corners up diagonally (UBL/UFR)', test: c => ocll(c, ['UBL', 'UFR']) },
      'Look 2 — H': { name: 'edges oriented, no corner up, tabs on R and L', test: c => ocll(c, []) && topTabs(c).R === 'X.X' },
      'Look 2 — Pi': { name: 'edges oriented, no corner up, tabs on L only', test: c => ocll(c, []) && topTabs(c).R === '...' }
    }
  },

  // ---- advanced PLL : yellow up (z2 y). Top face already solid; look 1 places
  // the corners, look 2 the edges, so look 1 cannot assert a solved cube.
  'a-pll': {
    goal: c => solved(c),
    goalName: 'cube solved',
    cases: {
      'Look 1 — A-perm': {
        name: 'top solid, three corners cycled',
        goal: c => cornersPositioned(c, UP) && faceSolid(c, UP) && f2lSolved(c, DN),
        goalName: 'top corners in their slots, face still solid',
        test: c => f2lSolved(c, DN) && faceSolid(c, UP) && !cornersPositioned(c, UP) },
      'Look 1 — Y-perm': {
        name: 'top solid, two diagonal corners swapped',
        goal: c => cornersPositioned(c, UP) && faceSolid(c, UP) && f2lSolved(c, DN),
        goalName: 'top corners in their slots, face still solid',
        test: c => f2lSolved(c, DN) && faceSolid(c, UP) && !cornersPositioned(c, UP) },
      'Look 2 — Ua-perm': { name: 'corners placed, three edges cycled', test: c => pllEdges(c) },
      'Look 2 — Ub-perm': { name: 'corners placed, three edges cycled the other way', test: c => pllEdges(c) },
      'Look 2 — H-perm': { name: 'corners placed, both pairs of opposite edges swapped', test: c => pllEdges(c) },
      'Look 2 — Z-perm': { name: 'corners placed, two adjacent pairs swapped', test: c => pllEdges(c) }
    }
  },

  // ---- advanced F2L : yellow up (z2 y). Cross plus three slots done, the FR
  // slot is the case. The cross-preservation assertion in main() is what stops
  // a slot being filled at the cross's expense.
  'a-f2l': {
    goal: c => slotSolved(c, 'DFR', 'FR') && crossSolved(c, DN),
    goalName: 'FR pair solved, cross intact',
    cases: {
      // Every case shares f2lExceptFR; the frCornerAt/frEdgeAt pair after it is
      // the case. Those two clauses pin both pieces completely, so no two of the
      // nine can satisfy each other's test -- swapping any two algorithms here
      // fails the run rather than passing quietly.

      // -- bucket 1: corner and edge adjacent in U, same colour on the face they
      // share, so the pair is already built.
      'Pair joined, insert right':                  // block down the right face
        { name: 'corner UFR white on F, edge UR with the F colour up',
          test: c => f2lExceptFR(c) && frCornerAt(c, 'UFR', 'F', 'U') && frEdgeAt(c, 'UR', 'U') },
      'Pair joined, insert left':                   // block across the front face
        { name: 'corner UFR white on R, edge UF with the F colour on F',
          test: c => f2lExceptFR(c) && frCornerAt(c, 'UFR', 'R', 'F') && frEdgeAt(c, 'UF', 'F') },
      'Pair joined, white on top':                  // same block, white pointing up
        { name: 'corner UFR white on U, edge UF with the F colour up',
          test: c => f2lExceptFR(c) && frCornerAt(c, 'UFR', 'U', 'R') && frEdgeAt(c, 'UF', 'U') },

      // -- bucket 2: both pieces in U, no matching pair. The corner of the first
      // and third is identically oriented, so the edge is what tells them apart.
      'Corner ready, edge at the back':
        { name: 'corner UFR white on R, edge round at UB with the F colour up',
          test: c => f2lExceptFR(c) && frCornerAt(c, 'UFR', 'R', 'F') && frEdgeAt(c, 'UB', 'U') },
      'Corner white up, edge beside it':
        { name: 'corner UFR white on U, edge UR with the F colour up',
          test: c => f2lExceptFR(c) && frCornerAt(c, 'UFR', 'U', 'R') && frEdgeAt(c, 'UR', 'U') },
      'False pair':                                 // edge flipped, so not a pair
        { name: 'corner UFR white on R, edge UR with the F colour on R',
          test: c => f2lExceptFR(c) && frCornerAt(c, 'UFR', 'R', 'F') && frEdgeAt(c, 'UR', 'R') },

      // -- bucket 3: one piece already down in the FR slot. The two corner cards
      // differ only in which way the corner is twisted, which is exactly what
      // frCornerAt's white-face argument names.
      'Corner in slot, white forward':
        { name: 'corner DFR white on F, edge still at UR',
          test: c => f2lExceptFR(c) && frCornerAt(c, 'DFR', 'F', 'R') && frEdgeAt(c, 'UR', 'U') },
      'Corner in slot, white to the right':
        { name: 'corner DFR white on R, edge still at UR',
          test: c => f2lExceptFR(c) && frCornerAt(c, 'DFR', 'R', 'D') && frEdgeAt(c, 'UR', 'U') },
      'Edge in slot, flipped':
        { name: 'edge in the FR slot flipped, corner UFR white on U',
          test: c => f2lExceptFR(c) && frCornerAt(c, 'UFR', 'U', 'R') && frEdgeAt(c, 'FR', 'R') }
    }
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
// Which top corners are twisted. The step-7 cards differ only in this set, so a
// predicate that stopped at "F2L intact, corners home" would pass with any of
// the four setups pasted into any other card.
const misorientedCorners = c =>
  slotsOf(UP, 'corner').map(tokOf).filter(t => sticker(c, vecOf(t), 'U') !== centre(c, 'U'));

// Two top corners are adjacent when they share a side face, which makes the
// horizontal parts of their position vectors perpendicular; diagonal corners
// point straight away from each other.
const pairing = (a, b) => {
  const p = vecOf(a), q = vecOf(b);
  return p[0] * q[0] + p[2] * q[2] === 0 ? 'adjacent' : 'diagonal';
};

// `pair` is only meaningful for the two-corner cases. Every card is held so that
// the first corner to fix sits at URF, so that one must be twisted.
function twistCase(c, count, pair) {
  if (!(f2lSolved(c, DN) && crossSolved(c, UP) && cornersPositioned(c, UP))) return false;
  const off = misorientedCorners(c);
  if (off.length !== count || off.indexOf('URF') === -1) return false;
  return pair == null || pairing(off[0], off[1]) === pair;
}

// Report what case `['z2','y',...invertMoves(moves)]` sets up, so an author can
// name it before writing the predicate.
export function probe(moves) {
  const setup = ['z2', 'y', ...invertMoves(moves)];
  const start = stateOf(setup);
  const end = applyMoves(stateOf(setup), moves);
  const tabs = topTabs(start);
  const dup = adjacentSameFace(moves);
  console.log('moves     :', parseMoves(moves).join(' '));
  console.log('setup     :', setup.join(' '));
  console.log('length    :', parseMoves(moves).length, dup.length ? 'DEAD PAIR: ' + dup.join(', ') : '');
  console.log('start F2L :', f2lSolved(start, DN), ' crossD:', crossSolved(start, DN), ' slots:', slotsDone(start).join('+') || 'none');
  console.log('start LL  : edgesUp:', edgesOriented(start, UP).join('/') || 'none',
    ' cornersUp:', U_CORNER_TOKS.filter(t => sticker(start, vecOf(t), 'U') === centre(start, 'U')).join('/') || 'none',
    ' cornersPos:', cornersPositioned(start, UP));
  console.log('start grid:', topGrid(start).join(' / '));
  console.log('start tabs: B:' + tabs.B + ' R:' + tabs.R + ' F:' + tabs.F + ' L:' + tabs.L);
  console.log('end       : solved:', solved(end), ' crossD:', crossSolved(end, DN), ' faceSolid:', faceSolid(end, UP));
}

// --------------------------------------------------------------------- main
function main() {
  expansionTest();
  selfTest();
  procedureTest();
  const dump = process.argv.includes('--dump');
  const rows = [];
  let fails = 0;

  for (const alg of ALGORITHMS.filter(a => a.group === 'beginner' || a.group === 'advanced')) {
    const spec = CHECKS[alg.id];
    alg.variations.forEach((v, i) => {
      const label = `${alg.id}#${i}`;
      const notes = [];
      let verdict = 'match';

      if (v.setup == null) { notes.push('NO EXPLICIT SETUP'); verdict = 'mismatch'; }

      // Spelling the setup out as the inverse of the moves makes the case solve
      // itself by construction. Steps 1-2 do that on purpose -- their case *is*
      // "the position this algorithm undoes", and the start predicate pins the
      // exact sticker layout, so the inverse is still checked content. Step 7 is
      // different: its cases are twist arrangements picked independently of the
      // run, and an inverted setup would erase the only claim being tested --
      // that this run of loop counts solves that arrangement.
      if (alg.id === 'b-orient-last-corners' && v.setup
        && JSON.stringify(parseMoves(v.setup)) === JSON.stringify(invertMoves(v.moves))) {
        notes.push('setup is the inverse of moves'); verdict = 'mismatch';
      }

      const start = stateOf(v.setup != null ? v.setup : invertMoves(v.moves));
      const end = applyMoves(stateOf(v.setup != null ? v.setup : invertMoves(v.moves)), v.moves);

      const c = spec && spec.cases[v.label];
      if (!c) { notes.push('no case predicate'); verdict = 'unchecked'; }
      else if (!c.test(start)) { notes.push(`start is not "${c.name}"`); verdict = 'mismatch'; }

      // Two-look steps hold cases with different end states in one entry: OLL
      // look 1 reaches an oriented cross with the corners still wrong, look 2 a
      // solid face. A case may name its own goal; otherwise the step's applies.
      const goal = (c && c.goal) || (spec && spec.goal);
      const goalName = (c && c.goalName) || (spec && spec.goalName);
      if (goal && !goal(end)) { notes.push(`end is not "${goalName}"`); verdict = 'mismatch'; }

      // Steps 4-6 must hand the first two layers back exactly as they found
      // them. Asserted separately from the step goal so that a later edit to a
      // goal predicate cannot quietly drop it.
      if (['b-yellow-cross', 'b-swap-yellow-edges', 'b-position-yellow-corners', 'a-oll', 'a-pll'].includes(alg.id)
        && !(f2lSolved(start, DN) && f2lSolved(end, DN))) {
        notes.push('F2L not preserved'); verdict = 'mismatch';
      }

      // An F2L algorithm that fills its slot by wrecking the cross is worse than
      // useless, and the step goal alone would not notice.
      if (alg.id === 'a-f2l' && !(crossSolved(start, DN) && crossSolved(end, DN))) {
        notes.push('cross not preserved'); verdict = 'mismatch';
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

  // A predicate keyed to a label that no longer exists is a silent hole: the
  // variation it guarded would report "no case predicate" and still pass.
  for (const [algId, spec] of Object.entries(CHECKS)) {
    const alg = ALGORITHMS.find(a => a.id === algId);
    const labels = alg ? alg.variations.map(v => v.label) : [];
    for (const key of Object.keys(spec.cases)) {
      if (labels.indexOf(key) === -1) {
        console.error(`orphan case predicate: ${algId} -> "${key}"`);
        fails++;
      }
    }
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
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf('--probe');
  if (i !== -1 && process.argv[i + 1]) probe(process.argv[i + 1]);
  else main();
}
