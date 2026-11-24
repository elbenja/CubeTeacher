import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  captureFromPhysical, normalizeCaptured, validateCube, HEX, DEMO_CAPTURES, checkCaptures,
  toPhysical, blankFace, countColours, NEIGHBOURS, FACES, OPPOSITE, session
} from './cube-capture.mjs';
import { solvedCube, applyMoves, sticker } from './validate.mjs';

const mirror = cells => [2, 1, 0, 5, 4, 3, 8, 7, 6].map(i => cells[i]);
const clockwise = cells => [6, 3, 0, 7, 4, 1, 8, 5, 2].map(i => cells[i]);
const counterclockwise = cells => [2, 5, 8, 1, 4, 7, 0, 3, 6].map(i => cells[i]);
const positions = {
  U: (r, c) => [c - 1, 1, r - 1],
  R: (r, c) => [1, 1 - r, 1 - c],
  F: (r, c) => [c - 1, 1 - r, 1],
  D: (r, c) => [c - 1, -1, 1 - r],
  L: (r, c) => [-1, 1 - r, c - 1],
  B: (r, c) => [1 - c, 1 - r, -1]
};
function fromMoves(moves) {
  const cube = applyMoves(solvedCube(), moves);
  const faces = Object.fromEntries(Object.entries(positions).map(([face, position]) => [face,
    Array.from({ length: 9 }, (_, i) => sticker(cube, position(Math.floor(i / 3), i % 3), face))]));
  const captured = [mirror(faces.F), mirror(faces.R), mirror(faces.B), mirror(faces.L),
    mirror(counterclockwise(faces.U)), mirror(clockwise(faces.D))];
  assert.deepEqual(normalizeCaptured(captured), faces);
  const unmirrored = captured.map(mirror);
  assert.deepEqual(normalizeCaptured(unmirrored, Array(6).fill(false)), faces);
  const mixed = captured.map((cells, index) => index % 2 ? mirror(cells) : cells);
  assert.deepEqual(normalizeCaptured(mixed, [true, false, true, false, true, false]), faces);
  const editable = ['F', 'R', 'B', 'L', 'U', 'D'].map((face, index) => captureFromPhysical(index, faces[face]));
  assert.deepEqual(normalizeCaptured(editable, Array(6).fill(false)), faces);
  return { faces, captured };
}

test('legal scrambles round-trip through capture orientation and validate', () => {
  for (const moves of ['', 'R', 'U F', "R U R' U'", "R U F' L2 D B"]) {
    const { faces } = fromMoves(moves);
    assert.equal(validateCube(faces).ok, true, `Legal scramble rejected: ${moves}`);
  }
});

test('impossible cubes are rejected, with suspect faces when one can be named', () => {

const changedColor = structuredClone(fromMoves('').faces);
changedColor.F[0] = 'R';
assert.equal(validateCube(changedColor).ok, false);
assert.ok(validateCube(changedColor).suspects.includes('F'));

const flippedEdge = structuredClone(fromMoves('').faces);
[flippedEdge.U[7], flippedEdge.F[1]] = [flippedEdge.F[1], flippedEdge.U[7]];
assert.equal(validateCube(flippedEdge).ok, false);
assert.deepEqual(validateCube(flippedEdge).suspects, []);

const twistedCorner = structuredClone(fromMoves('').faces);
[twistedCorner.U[8], twistedCorner.R[0], twistedCorner.F[2]] = [twistedCorner.R[0], twistedCorner.F[2], twistedCorner.U[8]];
assert.equal(validateCube(twistedCorner).ok, false);

const swappedEdges = structuredClone(fromMoves('').faces);
[swappedEdges.U[5], swappedEdges.R[1], swappedEdges.U[7], swappedEdges.F[1]] =
  [swappedEdges.U[7], swappedEdges.F[1], swappedEdges.U[5], swappedEdges.R[1]];
assert.equal(validateCube(swappedEdges).ok, false);
});

test('the demo capture is the legal scramble R U F\' L2 D B', () => {
  assert.deepEqual(toPhysical(DEMO_CAPTURES), fromMoves("R U F' L2 D B").faces);
  assert.equal(checkCaptures(DEMO_CAPTURES).ok, true);
});

test('checkCaptures names suspects by capture step', () => {
  const caps = DEMO_CAPTURES.map(c => c.slice());
  [caps[2][1], caps[2][3]] = [caps[2][3], caps[2][1]];
  const r = checkCaptures(caps);
  assert.equal(r.ok, false);
  assert.ok(r.suspects.every(i => Number.isInteger(i) && i >= 0 && i < 6));
});

test('a half-entered cube normalises without throwing', () => {
  const caps = [DEMO_CAPTURES[0], null, null, null, blankFace(4), null];
  const p = toPhysical(caps);
  assert.deepEqual(p.F, DEMO_CAPTURES[0]);
  assert.equal(p.R, null);
  assert.equal(p.U[4], 'W');
  assert.deepEqual(countColours(caps), { W: 1, Y: 2, R: 0, O: 0, G: 5, B: 2 });
});

test('neighbours agree with the capture order and opposite faces', () => {
  NEIGHBOURS.forEach((nb, i) => {
    const centre = FACES[i].key;
    assert.equal(new Set(nb).size, 4);
    assert.ok(!nb.includes(centre) && !nb.includes(OPPOSITE[centre]), `face ${centre}`);
  });
});

test('sticker colours match across JS, CSS tokens and the 3D engine', async () => {
  const css = readFileSync(new URL('./cube-tokens.css', import.meta.url), 'utf8');
  const token = name => (css.match(new RegExp(`--cube-${name}:\\s*(#[0-9a-f]{6})`, 'i')) || [])[1];
  const byName = { W: 'white', Y: 'yellow', R: 'red', O: 'orange', G: 'green', B: 'blue' };
  for (const [k, name] of Object.entries(byName)) assert.equal(token(name), HEX[k], `--cube-${name}`);
  globalThis.window ??= { THREE: { Color: class { copy() { return this; } lerp() { return this; } } }, matchMedia: () => ({ matches: false }) };
  const { FACE_COLORS } = await import('./cube-engine.js');
  const byFace = { U: 'W', D: 'Y', R: 'R', L: 'O', F: 'G', B: 'B' };
  for (const [face, k] of Object.entries(byFace)) assert.equal(FACE_COLORS[face], HEX[k], `engine ${face}`);
});

test('session hand-off round-trips', () => {
  session.clear();
  assert.equal(session.load(), null);
  session.save(DEMO_CAPTURES);
  assert.deepEqual(session.load(), DEMO_CAPTURES);
  session.clear();
  assert.equal(session.load(), null);
});
