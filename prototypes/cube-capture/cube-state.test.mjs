import assert from 'node:assert/strict';
import { normalizeCaptured, validateCube } from './cube-state.mjs';
import { solvedCube, applyMoves, sticker } from '../../validate.mjs';

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
  return { faces, captured };
}

for (const moves of ['', 'R', 'U F', "R U R' U'", "R U F' L2 D B"]) {
  const { faces } = fromMoves(moves);
  assert.equal(validateCube(faces).ok, true, `Legal scramble rejected: ${moves}`);
}

const changedColor = structuredClone(fromMoves('').faces);
changedColor.F[0] = 'R';
assert.equal(validateCube(changedColor).ok, false);

const flippedEdge = structuredClone(fromMoves('').faces);
[flippedEdge.U[7], flippedEdge.F[1]] = [flippedEdge.F[1], flippedEdge.U[7]];
assert.equal(validateCube(flippedEdge).ok, false);

const twistedCorner = structuredClone(fromMoves('').faces);
[twistedCorner.U[8], twistedCorner.R[0], twistedCorner.F[2]] = [twistedCorner.R[0], twistedCorner.F[2], twistedCorner.U[8]];
assert.equal(validateCube(twistedCorner).ok, false);

const swappedEdges = structuredClone(fromMoves('').faces);
[swappedEdges.U[5], swappedEdges.R[1], swappedEdges.U[7], swappedEdges.F[1]] =
  [swappedEdges.U[7], swappedEdges.F[1], swappedEdges.U[5], swappedEdges.R[1]];
assert.equal(validateCube(swappedEdges).ok, false);

console.log('Cube capture orientation and validity checks passed.');
