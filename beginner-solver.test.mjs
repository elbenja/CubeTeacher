import { test } from 'node:test';
import assert from 'node:assert/strict';

// cube-engine.js reads window.THREE when it loads; the same stub validate.mjs installs.
globalThis.window ??= { THREE: { Color: class { copy() { return this; } lerp() { return this; } } }, matchMedia: () => ({ matches: false }) };
const { solve, cubeFromFaces } = await import('./beginner-solver.mjs');
const { solvedCube, applyMoves, sticker, FACE_ORDER, FACE_VEC } = await import('./cubie-model.mjs');
const { toPhysical, DEMO_CAPTURES, stickerIndex } = await import('./cube-capture.mjs');
const { ALGORITHMS } = await import('./algorithms.js');
const { badKeepTokens, badFocusTokens, adjacentSameFace } = await import('./validate.mjs');

// The six faces as the capture pages hand them over (U R F D L B, sticker order
// from stickerIndex), read off a cube in the model.
function facesOf(cube) {
  const out = Object.fromEntries(FACE_ORDER.map(f => [f, Array(9)]));
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++)
    for (const f of FACE_ORDER) {
      const v = FACE_VEC[f];
      if (v[0] * x + v[1] * y + v[2] * z === 1) out[f][stickerIndex(f, { x, y, z })] = sticker(cube, [x, y, z], f);
    }
  return out;
}
const scrambled = moves => facesOf(applyMoves(solvedCube(), moves));
const isSolved = cube => Object.values(facesOf(cube)).every(face => face.every(c => c === face[4]));

// Plays a solve on the cube read from the stickers, the way the guide does.
function play(faces) {
  const { state, steps } = solve(faces);
  const cube = state.map(c => ({ ...c }));
  for (const s of steps) applyMoves(cube, [...s.turn, ...s.moves]);
  return { state, steps, cube };
}

// A fixed sequence of random scrambles, so a failure names the same cube every run.
function scrambles(n, length = 25, seed = 20261123) {
  const moves = ['U', 'D', 'R', 'L', 'F', 'B'].flatMap(f => [f, f + "'", f + '2']);
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  return Array.from({ length: n }, () => Array.from({ length }, () => moves[Math.floor(rnd() * moves.length)]));
}

const BEGINNER = ALGORITHMS.filter(a => a.group === 'beginner');
const STAGE = Object.fromEntries(BEGINNER.map((a, i) => [a.id, i]));

test('a scan is read back into cubies that turn like the real cube', () => {
  for (const moves of scrambles(40)) {
    const faces = scrambled(moves), cube = cubeFromFaces(faces);
    assert.deepEqual(facesOf(cube), faces);
    applyMoves(cube, [...moves].reverse().map(t => t.endsWith('2') ? t : t.endsWith("'") ? t[0] : t + "'"));
    assert.ok(isSolved(cube), `undoing ${moves.join(' ')} should solve the read-back cube`);
  }
});

test('the demo capture (R U F\' L2 D B) is solved by its plan', () => {
  const faces = toPhysical(DEMO_CAPTURES);
  assert.deepEqual(faces, scrambled("R U F' L2 D B"));
  const { steps, cube } = play(faces);
  assert.ok(steps.length > 0);
  assert.ok(isSolved(cube));
});

test('random legal scrambles are all solved, step by step, in lesson terms', () => {
  for (const moves of scrambles(200)) {
    const name = moves.join(' ');
    const { steps, cube } = play(scrambled(moves));
    assert.ok(isSolved(cube), `not solved: ${name}`);
    let stage = 0, flips = 0;
    for (const s of steps) {
      const alg = BEGINNER.find(a => a.id === s.id);
      assert.ok(alg, `unknown stage ${s.id}`);
      assert.ok(STAGE[s.id] >= stage, `stages out of order: ${name}`);
      stage = STAGE[s.id];
      if (s.variation) assert.ok(alg.variations.some(v => v.label === s.variation), `${s.id} has no variation "${s.variation}"`);
      assert.ok(s.label, 'every step is named');
      // Whole-cube turns only between steps: y to bring a slot round, z2 once to put yellow on top.
      assert.ok(s.turn.every(t => ['y', "y'", 'y2', 'z2'].includes(t)), `turn ${s.turn}`);
      flips += s.turn.filter(t => t === 'z2').length;
      if (s.turn.includes('z2')) assert.ok(stage >= 2, 'the flip comes after the first layer');
      assert.deepEqual(adjacentSameFace(s.moves), [], `dead pair in ${s.label}: ${s.moves.join(' ')}`);
      assert.equal(s.runMap.length, s.moves.length);
      if (s.keep) assert.deepEqual(badKeepTokens(s.keep), [], `keep ${s.keep}`);
      if (s.focus) assert.deepEqual(badFocusTokens(s.focus, s.keep), [], `focus ${s.focus} / keep ${s.keep}`);
    }
    assert.ok(flips <= 1, `flipped ${flips} times: ${name}`);
  }
});

test('a solved cube needs no steps', () => {
  assert.deepEqual(solve(scrambled('')).steps, []);
});

test('an impossible cube is refused, not solved', () => {
  const faces = scrambled("R U R' U'");
  [faces.U[7], faces.F[1]] = [faces.F[1], faces.U[7]];
  assert.throws(() => solve(faces), /orientations/);
});
