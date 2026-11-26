// The cubie model: 27 cubies, each a home position, a current position and an
// integer rotation matrix. validate.mjs grew it to check the algorithms; it lives
// here so the solve guide can run the same model in the browser. The validator
// is a node script (it stubs window and reads process.argv) and can't be loaded
// in a page.
//
// Moves are read through parseMoves / moveSpec from cube-engine.js, so this model
// and the 3D engine can't disagree about what "R'" means. cube-engine.js reads
// window.THREE when it loads: in node, install the stub validate.mjs uses before
// importing this module; in a page, import it once three.js is ready.

import { parseMoves, moveSpec } from './cube-engine.js';

// `bake()` in the engine does position.applyQuaternion(q) and
// quaternion.premultiply(q), so the matrix update here is M <- R * M, matching it
// exactly. That also makes M the rotation matrix of the engine cubie's quaternion.
const HALF = Math.PI / 2;
export const FACE_VEC = { U: [0, 1, 0], D: [0, -1, 0], R: [1, 0, 0], L: [-1, 0, 0], F: [0, 0, 1], B: [0, 0, -1] };
export const FACE_ORDER = ['U', 'D', 'R', 'L', 'F', 'B'];
// Sticker colours are keyed by the face a cubie is at home on. Matches FACE_COLORS.
export const HOME_COLOR = { U: 'W', D: 'Y', R: 'R', L: 'O', F: 'G', B: 'B' };
const ID = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

const COS = [1, 0, -1, 0], SIN = [0, 1, 0, -1];

function rot(axis, k) {
  const c = COS[k], s = SIN[k];
  if (axis === 'x') return [[1, 0, 0], [0, c, -s], [0, s, c]];
  if (axis === 'y') return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
  return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
}
// Written out rather than mapped: the solver runs these hundreds of thousands of
// times per cube, and the nested map() allocations were most of its time.
export const mulVec = (M, v) => [
  M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
  M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
  M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]
];
export const mulMat = (A, B) => {
  const row = a => [
    a[0] * B[0][0] + a[1] * B[1][0] + a[2] * B[2][0],
    a[0] * B[0][1] + a[1] * B[1][1] + a[2] * B[2][1],
    a[0] * B[0][2] + a[1] * B[1][2] + a[2] * B[2][2]
  ];
  return [row(A[0]), row(A[1]), row(A[2])];
};

export function solvedCube() {
  const out = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++)
    out.push({ home: [x, y, z], pos: [x, y, z], m: ID.map(r => r.slice()) });
  return out;
}

// Turns replace a cubie's `pos` and `m` with new arrays rather than writing into
// them, so a shallow copy of each cubie is enough to branch a search.
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

// ------------------------------------------------------------ state readers
// Expressed relative to the *current* centre colours, so they stay correct after
// a whole-cube rotation.

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
export const tokOf = p => FACE_ORDER.filter(f => {
  const v = FACE_VEC[f];
  return v[0] * p[0] + v[1] * p[1] + v[2] * p[2] === 1;
}).join('');
