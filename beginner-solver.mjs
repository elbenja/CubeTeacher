// Solves a scanned cube with the beginner's method the lessons teach, and returns
// it as steps the solve guide can play: each one a whole-cube turn, then moves,
// filed under one of the seven beginner algorithms in algorithms.js.
//
// Where a lesson case fits, the step runs that variation's moves, sometimes after
// a turn or two of the free layer to line the piece up (D on the white side, U
// once yellow is on top). Some positions have no lesson card: an edge lying white
// side down, a corner twisted in the top layer, an edge stuck in the wrong
// middle slot. Those get short direct moves (to drop the piece in, or lift it out
// so a lesson case can take it) under a label that names what the user is
// looking at. The last stage keeps its lesson label but counts its own loops,
// since how many times R' D' R D runs depends on how each corner is twisted.
//
// Nothing here trusts a reading of the algorithms: every candidate step is
// played on the cubie model and only kept if the pieces it promises are really
// home afterwards, with everything solved before it still in place.

import { ALGORITHMS, expandRun } from './algorithms.js';
import { validateCube, stickerIndex } from './cube-capture.mjs';
import { invertMoves } from './cube-engine.js';
import { FACE_VEC, FACE_ORDER, HOME_COLOR, mulVec, applyMoves, centre, vecOf, tokOf } from './cubie-model.mjs';

// ---------------------------------------------------------------- reading a scan

const COLOUR_FACE = Object.fromEntries(FACE_ORDER.map(f => [HOME_COLOR[f], f]));
const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// The cube as cubies, read straight off the stickers. Each cubie's colours name
// its home; the rotation takes every home normal onto the face that colour shows
// on now, M = sum of n h^T. An edge shows two colours and the third axis follows
// from the cross product, since a real piece can be turned but not mirrored. A
// centre's spin can't be seen, and validateCube has checked that each centre is
// on its own face, so it stays as it is.
export function cubeFromFaces(faces) {
  const cube = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    const pos = [x, y, z];
    const pairs = FACE_ORDER.filter(f => dot(FACE_VEC[f], pos) === 1)
      .map(f => [FACE_VEC[COLOUR_FACE[faces[f][stickerIndex(f, { x, y, z })]]], FACE_VEC[f]]);
    const home = pairs.reduce((h, [n]) => add(h, n), [0, 0, 0]);
    cube.push({ home, pos, m: rotationOf(pairs) });
  }
  return cube;
}
function rotationOf(pairs) {
  if (pairs.length < 2) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const p = pairs.length === 3 ? pairs : [...pairs, [cross(pairs[0][0], pairs[1][0]), cross(pairs[0][1], pairs[1][1])]];
  return [0, 1, 2].map(i => [0, 1, 2].map(j => p.reduce((s, [h, n]) => s + n[i] * h[j], 0)));
}

// ---------------------------------------------------------------- pieces

const copy = cube => cube.map(c => ({ ...c }));
const turned = (cube, moves) => moves.length ? applyMoves(copy(cube), moves) : cube;
const piece = (cube, home) => cube.find(c => same(c.home, home));
const homeFaces = home => FACE_ORDER.filter(f => dot(FACE_VEC[f], home) === 1);

// Where each colour's centre is now. Pieces are judged against their centres, so
// a whole-cube turn never makes a solved piece look unsolved.
function centresOf(cube) {
  const dir = {};
  for (const f of FACE_ORDER) dir[centre(cube, f)] = FACE_VEC[f];
  return dir;
}
const slotOf = (cube, home, dir = centresOf(cube)) => homeFaces(home).reduce((s, f) => add(s, dir[HOME_COLOR[f]]), [0, 0, 0]);
// Home and the right way round: every sticker faces the centre of its colour
// (which also puts the piece in its slot, since a cubie's position is M * home).
const placed = (cube, home, dir = centresOf(cube)) => {
  const c = piece(cube, home);
  return homeFaces(home).every(f => same(mulVec(c.m, FACE_VEC[f]), dir[HOME_COLOR[f]]));
};
const positioned = (cube, home, dir = centresOf(cube)) => same(piece(cube, home).pos, slotOf(cube, home, dir));
const allPlaced = (cube, homes) => { const dir = centresOf(cube); return homes.every(h => placed(cube, h, dir)); };
// Which way a piece's sticker of one home face points now.
const facing = (cube, home, face) => mulVec(piece(cube, home).m, FACE_VEC[face]);

const WHITE_EDGES = [[0, 1, 1], [1, 1, 0], [0, 1, -1], [-1, 1, 0]];
const WHITE_CORNERS = [[1, 1, 1], [1, 1, -1], [-1, 1, -1], [-1, 1, 1]];
const MIDDLE_EDGES = [[1, 0, 1], [1, 0, -1], [-1, 0, -1], [-1, 0, 1]];
const YELLOW_EDGES = [[0, -1, 1], [1, -1, 0], [0, -1, -1], [-1, -1, 0]];
const YELLOW_CORNERS = [[1, -1, 1], [1, -1, -1], [-1, -1, -1], [-1, -1, 1]];
const FIRST_LAYER = [...WHITE_EDGES, ...WHITE_CORNERS];
const F2L = [...FIRST_LAYER, ...MIDDLE_EDGES];
const ALL = [...F2L, ...YELLOW_EDGES, ...YELLOW_CORNERS];
const CENTRES = ['U', 'D', 'R', 'L', 'F', 'B'];

const slotTok = (cube, home) => tokOf(piece(cube, home).pos);
const layerOf = (cube, home, colour) => dot(piece(cube, home).pos, centresOf(cube)[colour]);

// ---------------------------------------------------------------- lessons

const LESSON = Object.fromEntries(ALGORITHMS.filter(a => a.group === 'beginner').map(a => [a.id, a]));
const lessonBody = v => ({ lesson: v.label, moves: v.moves, shape: v });
const lessons = (id, labels) => LESSON[id].variations.filter(v => !labels || labels.includes(v.label)).map(lessonBody);
const lesson = (id, label) => lessonBody(LESSON[id].variations.find(v => v.label === label));
const freeBody = moves => ({ lesson: null, moves, shape: { moves } });

// ---------------------------------------------------------------- search

const Y_TURNS = [[], ['y'], ["y'"], ['y2']];
const D_TURNS = [[], ['D'], ["D'"], ['D2']];
const U_TURNS = [[], ['U'], ["U'"], ['U2']];
// Asking for a whole-cube turn costs the user more than one more face turn, and
// a step with no lesson behind it has to beat one that teaches by a clear margin.
const TURN_COST = 1.5;
const FREE_COST = 2;

// Two turns of the same face in a row become one, or none: a line-up U followed
// by an algorithm that opens with U' is just the rest of the algorithm. A move
// and its undo side by side is the thing validate.mjs calls a dead pair.
const quarter = t => t.endsWith('2') ? 2 : t.endsWith("'") ? 3 : 1;
function merge(moves) {
  const out = [];
  for (const t of moves) {
    const last = out[out.length - 1];
    if (!last || last[0] !== t[0]) { out.push(t); continue; }
    const q = (quarter(last) + quarter(t)) % 4;
    out.pop();
    if (q) out.push(t[0] + ['', '', '2', "'"][q]);
  }
  return out;
}

// The move strip for a step. A flat algorithm and its line-up turns read as one
// run of moves. A lesson built from loops keeps its blocks, and line-up turns
// join its single moves; a line-up turn of the same face as the move inside the
// block next to it can't be folded in without changing the loop, so that
// combination isn't offered.
function stripOf(pre, body, post) {
  const shape = body.shape;
  if (!shape.run) {
    const { moves, entries, map } = expandRun({ moves: merge([...pre, ...body.moves, ...post]) });
    return { moves, entries, runMap: map, until: '' };
  }
  const run = [];
  for (const it of [...pre, ...shape.run, ...post]) {
    if (typeof it === 'string' && typeof run[run.length - 1] === 'string') run.push(...merge([run.pop(), it]));
    else run.push(it);
  }
  const first = shape.loop[0][0], last = shape.loop[shape.loop.length - 1][0];
  if (run.some((it, i) => typeof it === 'number' && ((typeof run[i - 1] === 'string' && run[i - 1][0] === first) || (typeof run[i + 1] === 'string' && run[i + 1][0] === last)))) return null;
  const { moves, entries, map } = expandRun({ loop: shape.loop, until: shape.until, run });
  return { moves, entries, runMap: map, until: shape.until || '' };
}

// Every way of doing a step out of these parts that reaches the goal, cheapest
// first: a whole-cube turn, line-up turns, the body, line-up turns after.
function candidates(cube, { turns = [[]], pres = [[]], bodies, posts = [[]], goal }) {
  const out = [];
  for (const turn of turns) {
    const start = turned(cube, turn);
    for (const pre of pres) for (const body of bodies) for (const post of posts) {
      const strip = stripOf(pre, body, post);
      if (!strip) continue;
      const end = turned(start, strip.moves);
      if (!goal(end)) continue;
      const cost = (turn.length ? TURN_COST : 0) + strip.moves.length + (body.lesson ? 0 : FREE_COST);
      out.push({ turn, pre, body, strip, start, end, cost });
    }
  }
  return out.sort((a, b) => a.cost - b.cost);
}
const cheapest = (cube, parts) => candidates(cube, parts)[0] || null;

// The y-turn that brings the slot a piece belongs in round to `slot`.
const turnBringing = (cube, home, slot) => Y_TURNS.find(t => same(slotOf(turned(cube, t), home), slot));

// Shortest plain moves that reach the goal, for the first layer's edges, where a
// lesson case doesn't fit. Searched on the centres and the pieces the goal
// names, which is all it reads.
const FREE_MOVES = ['F2', 'F', "F'", 'D', "D'", 'D2', 'R', "R'", 'R2', 'L', "L'", 'L2', 'U', "U'", 'U2', 'B', "B'", 'B2'];
const OPPOSITE = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };
function direct(cube, homes, goal, maxDepth) {
  const lean = cube.filter(c => c.home.filter(Boolean).length === 1 || homes.some(h => same(h, c.home)));
  const path = [];
  const dfs = (c, depth, last) => {
    if (!depth) return goal(c);
    for (const t of FREE_MOVES) {
      const f = t[0];
      // D U and U D are the same position; only try one order.
      if (f === last || (OPPOSITE[f] === last && 'DLB'.includes(last))) continue;
      path.push(t);
      if (dfs(turned(c, [t]), depth - 1, f)) return true;
      path.pop();
    }
    return false;
  };
  for (let d = 1; d <= maxDepth; d++) if (dfs(lean, d, '')) return path.slice();
  return null;
}

// ---------------------------------------------------------------- steps

// A lesson names its pieces as they stand once the line-up turns are done; the 3D
// view reads `focus` and `keep` before the step's first move, so rename each slot
// to where that piece starts.
const before = (cand, toks) => {
  const lined = turned(cand.start, cand.pre);
  return toks.map(t => {
    if (t.includes('*')) return t;
    const c = lined.find(x => same(x.pos, vecOf(t)));
    return tokOf(piece(cand.start, c.home).pos);
  });
};

function emit(S, id, cand, { label, keep, focus, dim }) {
  S.steps.push({
    id, label: label || cand.body.lesson, variation: cand.body.lesson, turn: cand.turn,
    ...cand.strip, keep, focus, dim
  });
  S.cube = cand.end;
  if (cand.turn.includes('z2')) S.flip = false;
}
// Once the first layer is done the cube is held yellow up, so the first step
// after it opens with the flip.
const turnsAfterFlip = S => S.flip ? Y_TURNS.map(t => ['z2', ...t]) : Y_TURNS;

// ---- 1. white cross, white on top. Each edge is held at the front.
// Names for the positions no lesson card covers, said the way the cards say
// theirs ("White faces right"), and short enough for the solve list.
const TOWARD = { R: 'right', L: 'left', B: 'back', F: 'you', U: 'up', D: 'down' };
function edgeCase(cube, home) {
  const white = facing(cube, home, 'U'), side = FACE_ORDER.find(f => same(FACE_VEC[f], white));
  const layer = layerOf(cube, home, 'W');
  if (layer === 1) return 'Top edge, wrong slot';
  if (layer === 0) return `Middle edge, white faces ${TOWARD[side]}`;
  return side === 'D' ? 'Bottom edge, white down' : 'Bottom edge, white to the side';
}
function whiteCross(S) {
  const id = 'b-first-layer-edges', done = [];
  for (;;) {
    for (const h of WHITE_EDGES) if (!done.some(d => same(d, h)) && placed(S.cube, h)) done.push(h);
    const todo = WHITE_EDGES.filter(h => !done.some(d => same(d, h)));
    if (!todo.length) return;
    let best = null;
    for (const h of todo) {
      const goal = c => allPlaced(c, [...done, h]);
      const turn = turnBringing(S.cube, h, [0, 1, 1]);
      const lib = cheapest(S.cube, { turns: [turn], pres: D_TURNS, bodies: lessons(id), goal });
      if (lib && (!best || lib.cost < best.cost)) best = { ...lib, h };
      const tc = turn.length ? TURN_COST : 0;
      const depth = Math.min(5, best ? Math.ceil(best.cost - FREE_COST - tc) - 1 : 5);
      const start = turned(S.cube, turn), path = depth > 0 ? direct(start, [...done, h], goal, depth) : null;
      if (path) {
        const cand = { turn, pre: [], body: freeBody(path), strip: stripOf([], freeBody(path), []), start, end: turned(start, path), cost: tc + path.length + FREE_COST };
        if (!best || cand.cost < best.cost) best = { ...cand, h };
      }
    }
    if (!best) throw new Error('No step found for the white cross');
    const toks = [...done, best.h].map(p => slotTok(best.start, p));
    emit(S, id, best, { label: best.body.lesson ? null : edgeCase(best.start, best.h), keep: [...CENTRES, ...toks], focus: [slotTok(best.start, best.h)] });
    done.push(best.h);
  }
}

// ---- 2. white corners, white on top. Each corner's slot is held front-right.
// A corner stuck in the top layer is lifted out first (a face turn, a D turn,
// the face back), then taken in from below like any other.
const LIFTS = ['R', "R'", 'L', "L'", 'F', "F'", 'B', "B'"]
  .flatMap(a => ['D', "D'", 'D2'].map(d => freeBody([a, d, invertMoves([a])[0]])));
function whiteCorners(S) {
  const id = 'b-first-layer-corners', done = [];
  const insert = (cube, h, turn) => cheapest(cube, { turns: [turn], pres: D_TURNS, bodies: lessons(id), goal: c => allPlaced(c, [...WHITE_EDGES, ...done, h]) });
  for (;;) {
    for (const h of WHITE_CORNERS) if (!done.some(d => same(d, h)) && placed(S.cube, h)) done.push(h);
    const todo = WHITE_CORNERS.filter(h => !done.some(d => same(d, h)));
    if (!todo.length) return;
    let best = null, lift = null;
    for (const h of todo) {
      const turn = turnBringing(S.cube, h, [1, 1, 1]);
      const c = insert(S.cube, h, turn);
      if (c && (!best || c.cost < best.cost)) best = { ...c, h };
    }
    if (!best) {
      for (const h of todo) {
        const turn = turnBringing(S.cube, h, [1, 1, 1]);
        const outs = candidates(S.cube, { turns: [turn], bodies: LIFTS, goal: c => allPlaced(c, [...WHITE_EDGES, ...done]) && layerOf(c, h, 'W') === -1 });
        for (const o of outs) {
          const next = insert(o.end, h, []);
          if (next && (!lift || o.cost + next.cost < lift.total)) lift = { ...o, h, total: o.cost + next.cost };
        }
      }
      if (!lift) throw new Error('No step found for the white corners');
      emit(S, id, lift, {
        label: positioned(lift.start, lift.h) ? 'Corner twisted in its slot' : 'Corner stuck on top',
        keep: [...CENTRES, ...[...WHITE_EDGES, ...done, lift.h].map(p => slotTok(lift.start, p))], focus: [slotTok(lift.start, lift.h)]
      });
      continue;
    }
    emit(S, id, best, { keep: [...CENTRES, ...[...WHITE_EDGES, ...done, best.h].map(p => slotTok(best.start, p))], focus: [slotTok(best.start, best.h)] });
    done.push(best.h);
  }
}

// ---- 3. middle edges, yellow on top. An edge stuck in the wrong middle slot is
// popped out by inserting a top edge in its place.
function middleLayer(S) {
  const id = 'b-second-layer', done = [], inserts = lessons(id, ['Insert to the right', 'Insert to the left']);
  const keepOf = (cube, h) => ['D*', 'U', 'F', 'R', 'B', 'L', ...[...done, h].map(p => slotTok(cube, p))];
  for (;;) {
    for (const h of MIDDLE_EDGES) if (!done.some(d => same(d, h)) && placed(S.cube, h)) done.push(h);
    const todo = MIDDLE_EDGES.filter(h => !done.some(d => same(d, h)));
    if (!todo.length) return;
    let best = null, pop = null;
    for (const h of todo) {
      const c = cheapest(S.cube, { turns: turnsAfterFlip(S), pres: U_TURNS, bodies: lessons(id), goal: c => allPlaced(c, [...FIRST_LAYER, ...done, h]) });
      if (c && (!best || c.cost < best.cost)) best = { ...c, h };
    }
    if (!best) {
      for (const h of todo) {
        const outs = candidates(S.cube, { turns: turnsAfterFlip(S), pres: U_TURNS, bodies: inserts, goal: c => allPlaced(c, [...FIRST_LAYER, ...done]) && layerOf(c, h, 'Y') === 1 });
        for (const o of outs.slice(0, 6)) {
          const next = cheapest(o.end, { turns: Y_TURNS, pres: U_TURNS, bodies: inserts, goal: c => allPlaced(c, [...FIRST_LAYER, ...done, h]) });
          if (next && (!pop || o.cost + next.cost < pop.total)) pop = { ...o, h, total: o.cost + next.cost };
        }
      }
      if (!pop) throw new Error('No step found for the middle layer');
      emit(S, id, pop, { label: 'Edge stuck in the wrong slot', keep: keepOf(pop.start, pop.h), focus: [slotTok(pop.start, pop.h)] });
      continue;
    }
    emit(S, id, best, { keep: keepOf(best.start, best.h), focus: [slotTok(best.start, best.h)] });
    done.push(best.h);
  }
}

// ---- 4. yellow cross: every top edge yellow side up.
function yellowCross(S) {
  const id = 'b-yellow-cross';
  const oriented = c => { const up = centresOf(c).Y; return YELLOW_EDGES.every(h => same(facing(c, h, 'D'), up)); };
  if (oriented(S.cube)) return;
  const best = cheapest(S.cube, { turns: turnsAfterFlip(S), pres: U_TURNS, bodies: lessons(id), goal: c => allPlaced(c, F2L) && oriented(c) });
  if (!best) throw new Error('No step found for the yellow cross');
  const v = best.body.shape;
  emit(S, id, best, { keep: v.keep, focus: before(best, v.focus) });
}

// ---- 5. top edges matched to their sides.
function swapYellowEdges(S) {
  const id = 'b-swap-yellow-edges', goal = c => allPlaced(c, [...F2L, ...YELLOW_EDGES]);
  if (goal(S.cube)) return;
  const best = cheapest(S.cube, { turns: turnsAfterFlip(S), pres: U_TURNS, bodies: [...lessons(id), freeBody([])], posts: U_TURNS, goal });
  if (!best) throw new Error('No step found for the yellow edges');
  const keep = LESSON[id].variations[0].keep;
  emit(S, id, best, best.body.lesson
    ? { keep, focus: before(best, best.body.shape.focus) }
    : { label: 'Line up the top edges', keep });
}

// ---- 6. top corners into their slots, twist ignored.
function positionYellowCorners(S) {
  const id = 'b-position-yellow-corners';
  const base = [...F2L, ...YELLOW_EDGES];
  const goal = c => { const dir = centresOf(c); return base.every(h => placed(c, h, dir)) && YELLOW_CORNERS.every(h => positioned(c, h, dir)); };
  if (goal(S.cube)) return;
  let best = cheapest(S.cube, { turns: turnsAfterFlip(S), bodies: lessons(id), goal });
  if (!best) {
    // No corner home yet: one run from anywhere brings exactly one home.
    const one = cheapest(S.cube, {
      turns: turnsAfterFlip(S), bodies: [lesson(id, 'One corner already home')],
      goal: c => allPlaced(c, base) && YELLOW_CORNERS.some(h => positioned(c, h))
    });
    if (!one) throw new Error('No step found for the yellow corners');
    emit(S, id, one, { label: 'No corner home yet', dim: false, focus: one.body.shape.focus });
    best = cheapest(S.cube, { turns: Y_TURNS, bodies: lessons(id), goal });
    if (!best) throw new Error('No step found for the yellow corners');
  }
  emit(S, id, best, { dim: false, focus: best.body.shape.focus });
}

// ---- 7. twist the top corners. Same procedure the lesson proves for every
// arrangement (validate.mjs, runProcedure): hold a twisted corner front-right,
// loop R' D' R D until yellow is up, U to the next one, U the top back at the end.
const LOOP = ["R'", "D'", 'R', 'D'];
function twistRun(cube) {
  const c = copy(cube), run = [];
  // Read between whole loops only, when the corner front-right is a yellow one.
  const up = () => same(facing(c, c.find(x => same(x.pos, [1, 1, 1])).home, 'D'), centresOf(c).Y);
  const allUp = () => { const y = centresOf(c).Y; return YELLOW_CORNERS.every(h => same(facing(c, h, 'D'), y)); };
  let u = 0;
  for (let guard = 0; !allUp(); guard++) {
    if (guard > 4) return null;
    let k = 0;
    while (up()) { applyMoves(c, ['U']); k++; }
    if (k) { run.push(k === 1 ? 'U' : k === 2 ? 'U2' : "U'"); u += k; }
    let n = 0;
    while (!up()) { applyMoves(c, LOOP); if (++n > 4) return null; }
    run.push(n);
  }
  const back = (4 - u % 4) % 4;
  if (back) run.push(back === 1 ? 'U' : back === 2 ? 'U2' : "U'");
  return run;
}
function orientYellowCorners(S) {
  const id = 'b-orient-last-corners';
  if (allPlaced(S.cube, ALL)) return;
  let best = null;
  for (const turn of turnsAfterFlip(S)) {
    const start = turned(S.cube, turn), run = twistRun(start);
    if (!run) continue;
    const shape = { loop: LOOP, until: LESSON[id].variations[0].until, run };
    const body = { lesson: null, moves: expandRun(shape).moves, shape }, strip = stripOf([], body, []);
    const end = turned(start, strip.moves);
    if (!allPlaced(end, ALL)) continue;
    const cost = (turn.length ? TURN_COST : 0) + strip.moves.length;
    if (!best || cost < best.cost) best = { turn, pre: [], body, strip, start, end, cost };
  }
  if (!best) throw new Error('No step found for the last corners');
  // The lesson card this arrangement belongs to; the loop counts are this cube's own.
  const y = centresOf(best.start).Y;
  const twisted = YELLOW_CORNERS.filter(h => !same(facing(best.start, h, 'D'), y)).map(h => piece(best.start, h).pos);
  const label = twisted.length === 4 ? 'All four corners twisted' : twisted.length === 3 ? 'Three corners twisted'
    : twisted[0][0] * twisted[1][0] + twisted[0][2] * twisted[1][2] === 0 ? 'Two corners twisted, side by side' : 'Two corners twisted, diagonal';
  best.body.lesson = label;
  emit(S, id, best, { dim: false, focus: twisted.map(tokOf) });
}

// ---------------------------------------------------------------- entry point

// `faces` is the physical cube from cube-capture.mjs's toPhysical: U R F D L B,
// held white up and green in front. Returns the cube as cubies (for the 3D view
// to start from) and the steps that solve it.
export function solve(faces) {
  const check = validateCube(faces);
  if (!check.ok) throw new Error(check.message);
  const state = cubeFromFaces(faces);
  const S = { cube: state, steps: [], flip: true };
  whiteCross(S);
  whiteCorners(S);
  middleLayer(S);
  yellowCross(S);
  swapYellowEdges(S);
  positionYellowCorners(S);
  orientYellowCorners(S);
  if (!allPlaced(S.cube, ALL)) throw new Error('The solve did not finish');
  return { state, steps: S.steps };
}
