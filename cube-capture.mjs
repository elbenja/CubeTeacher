// The cube model behind every way of entering a cube: camera capture, manual entry and
// the solve guide all read and write captures through this module, so they agree on
// colours, face order, orientation and what counts as a possible cube.

const colorToFace = { W: 'U', R: 'R', G: 'F', Y: 'D', O: 'L', B: 'B' };
const names = { W: 'white', R: 'red', G: 'green', Y: 'yellow', O: 'orange', B: 'blue' };
export const mirror = cells => [2, 1, 0, 5, 4, 3, 8, 7, 6].map(i => cells[i]);
export const clockwise = cells => [6, 3, 0, 7, 4, 1, 8, 5, 2].map(i => cells[i]);
export const counterclockwise = cells => [2, 5, 8, 1, 4, 7, 0, 3, 6].map(i => cells[i]);

// Captures follow F, R, B, L, U, D. Each capture keeps its preview orientation.
// U was tipped forward from L (orange at the bottom); D is flipped from U.
// A face that hasn't been captured yet (null) stays null, so a half-entered cube can be drawn.
export function normalizeCaptured(captures, mirrored = Array(6).fill(true)) {
  const [front, right, back, left, up, down] = captures.map((cells, index) => cells && mirrored[index] ? mirror(cells) : cells);
  return { U: up && clockwise(up), R: right, F: front, D: down && counterclockwise(down), L: left, B: back };
}
export function captureFromPhysical(index, cells) {
  return index === 4 ? counterclockwise(cells) : index === 5 ? clockwise(cells) : [...cells];
}

const cornerSlots = [
  [8, 9, 20], [6, 18, 38], [0, 36, 47], [2, 45, 11],
  [29, 26, 15], [27, 44, 24], [33, 53, 42], [35, 17, 51]
];
const cornerPieces = ['URF', 'UFL', 'ULB', 'UBR', 'DFR', 'DLF', 'DBL', 'DRB'];
const edgeSlots = [
  [5, 10], [7, 19], [3, 37], [1, 46], [32, 16], [28, 25],
  [30, 43], [34, 52], [23, 12], [21, 41], [50, 39], [48, 14]
];
const edgePieces = ['UR', 'UF', 'UL', 'UB', 'DR', 'DF', 'DL', 'DB', 'FR', 'FL', 'BL', 'BR'];
const parity = permutation => permutation.reduce((count, value, i) => count + permutation.slice(i + 1).filter(other => value > other).length, 0) % 2;
const slotFaces = slot => [...new Set(slot.map(index => ['U', 'R', 'F', 'D', 'L', 'B'][Math.floor(index / 9)]))];
const fail = (message, suspects = []) => ({ ok: false, message, suspects });
// The sides touched by any piece that shows up more than once.
const twins = (pieces, slots) => [...new Set(slots.filter((_, i) => pieces.indexOf(pieces[i]) !== pieces.lastIndexOf(pieces[i])).flatMap(slotFaces))];
function localSuspects(stickers) {
  for (const slot of cornerSlots) {
    const colors = slot.map(index => stickers[index]), twist = colors.findIndex(color => color === 'U' || color === 'D');
    if (twist < 0 || !cornerPieces.some(piece => piece[1] === colors[(twist + 1) % 3] && piece[2] === colors[(twist + 2) % 3])) return slotFaces(slot);
  }
  for (const slot of edgeSlots) {
    const [a, b] = slot.map(index => stickers[index]);
    if (!edgePieces.some(piece => piece === a + b || piece === b + a)) return slotFaces(slot);
  }
  return [];
}

export function validateCube(faces) {
  const order = ['U', 'R', 'F', 'D', 'L', 'B'];
  if (order.some(face => !Array.isArray(faces[face]) || faces[face].length !== 9 || faces[face].some(color => !colorToFace[color])))
    return fail('One or more faces have missing stickers. Check each captured face.', order.filter(face => !Array.isArray(faces[face]) || faces[face].length !== 9 || faces[face].some(color => !colorToFace[color])));
  for (const face of order) if (colorToFace[faces[face][4]] !== face)
    return fail('A center color is on the wrong face. Check the cube orientation.', [face]);

  const allColors = order.flatMap(face => faces[face]);
  const wrongCounts = Object.keys(colorToFace).filter(color => allColors.filter(sticker => sticker === color).length !== 9);
  if (wrongCounts.length) return fail(`Color counts are off: ${wrongCounts.map(color => `${names[color]} ${allColors.filter(sticker => sticker === color).length}/9`).join(', ')}. Check those stickers.`, localSuspects(allColors.map(color => colorToFace[color])));

  const stickers = order.flatMap(face => faces[face]).map(color => colorToFace[color]);
  const corners = [], cornerTwists = [];
  for (const slot of cornerSlots) {
    const colors = slot.map(index => stickers[index]);
    const twist = colors.findIndex(color => color === 'U' || color === 'D');
    if (twist < 0) return fail('A corner has no white or yellow sticker. Check the captured faces.', slotFaces(slot));
    const sideA = colors[(twist + 1) % 3], sideB = colors[(twist + 2) % 3];
    const piece = cornerPieces.findIndex(name => name[1] === sideA && name[2] === sideB);
    if (piece < 0) return fail('A corner has colors that cannot meet on this cube. Check the captured faces.', slotFaces(slot));
    corners.push(piece); cornerTwists.push(twist);
  }
  if (new Set(corners).size !== 8) return fail('A corner piece appears twice or is missing. Check the captured faces.', twins(corners, cornerSlots));

  const edges = [], edgeFlips = [];
  for (const slot of edgeSlots) {
    const [a, b] = slot.map(index => stickers[index]);
    const piece = edgePieces.findIndex(name => name[0] === a && name[1] === b);
    const flipped = piece < 0 ? edgePieces.findIndex(name => name[0] === b && name[1] === a) : piece;
    if (flipped < 0) return fail('An edge has colors that cannot meet on this cube. Check the captured faces.', slotFaces(slot));
    edges.push(flipped); edgeFlips.push(piece < 0 ? 1 : 0);
  }
  if (new Set(edges).size !== 12) return fail('An edge piece appears twice or is missing. Check the captured faces.', twins(edges, edgeSlots));
  if (cornerTwists.reduce((sum, value) => sum + value, 0) % 3) return fail('The corner orientations do not form a possible cube. Check sticker directions, especially the up and down faces.');
  if (edgeFlips.reduce((sum, value) => sum + value, 0) % 2) return fail('The edge orientations do not form a possible cube. Check sticker directions.');
  if (parity(corners) !== parity(edges)) return fail('The corner and edge positions disagree. Check for a face captured in the wrong direction.');
  return { ok: true, message: 'This sticker layout is physically possible.' };
}

// ---------------------------------------------------------------- shared by the guided-solve pages

// Sticker colours for three.js. The DOM uses the --cube-* tokens in cube-tokens.css instead;
// cube-capture.test.mjs fails if the two, or the 3D engine's FACE_COLORS, ever drift apart.
export const HEX = { W: '#ffffff', Y: '#ffd500', R: '#ee2b2b', O: '#ff7a18', G: '#16c464', B: '#1e5fe0' };
export const EMPTY_HEX = '#dcdcdc';
export const COLOUR_VAR = { W: 'var(--cube-white)', Y: 'var(--cube-yellow)', R: 'var(--cube-red)', O: 'var(--cube-orange)', G: 'var(--cube-green)', B: 'var(--cube-blue)' };
export const EMPTY_VAR = 'var(--cube-empty)';
export const colourVar = key => COLOUR_VAR[key] || EMPTY_VAR;
export const NAMES = names;
export const isLight = key => key === 'W' || key === 'Y';
export const titleCase = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

// Palette order for manual entry (also the 1–6 keyboard shortcuts).
export const PALETTE = ['W', 'Y', 'R', 'O', 'G', 'B'];
export const OPPOSITE = { G: 'B', B: 'G', R: 'O', O: 'R', W: 'Y', Y: 'W' };

// Capture order: one centre colour per step. The order is green/front, red/right,
// blue/back, orange/left, white/up, yellow/down, with white on top for the first four.
export const FACES = [
  { key: 'G', name: 'Front', letter: 'F' }, { key: 'R', name: 'Right', letter: 'R' }, { key: 'B', name: 'Back', letter: 'B' },
  { key: 'O', name: 'Left', letter: 'L' }, { key: 'W', name: 'Up', letter: 'U' }, { key: 'Y', name: 'Down', letter: 'D' }
];
export const STEP_OF_LETTER = { F: 0, R: 1, B: 2, L: 3, U: 4, D: 5 };
export const stepOfColour = key => FACES.findIndex(f => f.key === key);

// What surrounds each face while it is being captured, as you look at it: [up, down, left, right].
export const NEIGHBOURS = [
  ['W', 'Y', 'O', 'R'], ['W', 'Y', 'G', 'B'], ['W', 'Y', 'R', 'O'],
  ['W', 'Y', 'B', 'G'], ['R', 'O', 'B', 'G'], ['O', 'R', 'B', 'G']
];

export const blankFace = step => Array.from({ length: 9 }, (_, k) => (k === 4 ? FACES[step].key : null));
export const isComplete = cells => !!cells && cells.every(Boolean);
export function countColours(captures) {
  const n = { W: 0, Y: 0, R: 0, O: 0, G: 0, B: 0 };
  captures.forEach(c => c && c.forEach(k => { if (k) n[k]++; }));
  return n;
}

// Captures are stored as the camera sees them (not mirrored), so this is the physical cube.
const UNMIRRORED = Array(6).fill(false);
export const toPhysical = (captures, mirrored = UNMIRRORED) => normalizeCaptured(captures, mirrored);

// Validation by capture step: which of the six steps to flag when the cube can't exist.
export function checkCaptures(captures) {
  const result = validateCube(toPhysical(captures));
  return { ok: result.ok, message: result.message, suspects: (result.suspects || []).map(l => STEP_OF_LETTER[l]) };
}

// Re-read a finished scan against its own six centres. A centre's colour is known (it never
// moves), so the six centres are a colour chart shot in the user's own light; every other
// sticker takes the colour of the centre it looks most like. That separates red from orange
// under warm bulbs, where fixed hue cut-offs slide. A cube has nine of each colour, so when
// one colour comes out over, its least certain stickers go to the colour that's short.
// Counting can't see two stickers that traded colours (a red read as orange and an orange as
// red), but the cube can: almost no trade leaves a cube that could exist. So if the result is
// impossible, the cheapest one or two trades that make it possible are taken back.
// samples: six sides in capture order, each nine [r, g, b] readings, as previewed (mirrored
// says which sides were read from a mirrored preview). Returns six sides of keys.
export function classifyByCentres(samples, mirrored = UNMIRRORED) {
  const chroma = ([r, g, b]) => { const s = r + g + b || 1; return [r / s, g / s, b / s]; };
  const keys = FACES.map(f => f.key), refs = samples.map(side => chroma(side[4]));
  const cells = [];
  samples.forEach((side, s) => side.forEach((rgb, i) => {
    if (i === 4) return;
    const c = chroma(rgb), d = refs.map(ref => Math.hypot(c[0] - ref[0], c[1] - ref[1], c[2] - ref[2]));
    cells.push({ s, i, d, at: d.indexOf(Math.min(...d)) });
  }));
  const count = keys.map((_, k) => cells.filter(c => c.at === k).length);
  for (let guard = 0; guard < cells.length && count.some(n => n > 8); guard++) {
    let best = null;
    for (const c of cells) if (count[c.at] > 8) count.forEach((n, k) => {
      if (n < 8 && (!best || c.d[k] - c.d[c.at] < best.cost)) best = { c, k, cost: c.d[k] - c.d[c.at] };
    });
    if (!best) break;
    count[best.c.at]--; count[best.k]++; best.c.at = best.k;
  }
  const build = () => {
    const out = samples.map((_, s) => Array(9).fill(keys[s]));
    cells.forEach(c => { out[c.s][c.i] = keys[c.at]; });
    return out;
  };
  const possible = () => validateCube(normalizeCaptured(build(), mirrored)).ok;
  if (possible()) return build();
  const trade = ({ a, b }) => { [a.at, b.at] = [b.at, a.at]; };
  const trades = [];
  cells.forEach((a, n) => cells.slice(n + 1).forEach(b => {
    if (a.at !== b.at) trades.push({ a, b, cost: a.d[b.at] - a.d[a.at] + b.d[a.at] - b.d[b.at] });
  }));
  trades.sort((x, y) => x.cost - y.cost);
  for (const t of trades) { trade(t); if (possible()) return build(); trade(t); }
  const near = trades.slice(0, 60);
  let best = null;
  near.forEach((x, n) => near.slice(n + 1).forEach(y => {
    if ((best && x.cost + y.cost >= best.cost) || [y.a, y.b].some(c => c === x.a || c === x.b)) return;
    trade(x); trade(y);
    if (possible()) best = { x, y, cost: x.cost + y.cost };
    trade(y); trade(x);
  }));
  if (best) { trade(best.x); trade(best.y); }
  return build();
}

// The verdict on a finished cube, worded once for every way of entering it.
export const verdictNotice = check => check.ok
  ? { tone: 'ok', icon: 'tick-02', text: 'Every sticker fits' }
  : { tone: 'warn', icon: 'alert-circle', text: check.suspects.length ? 'Check the marked sides' : 'Stickers don’t fit. Check each side' };

// A legal scramble (R U F' L2 D B), one face per capture step, written as a mirrored preview
// shows it and flipped once here into the camera's own view. Drives the demo feed and the
// "review a state" tweaks.
export const DEMO_CAPTURES = [
  ['Y', 'Y', 'B', 'G', 'G', 'B', 'G', 'G', 'G'], ['O', 'B', 'B', 'B', 'R', 'Y', 'B', 'G', 'O'],
  ['O', 'W', 'Y', 'O', 'B', 'R', 'R', 'R', 'R'], ['O', 'O', 'W', 'O', 'O', 'W', 'R', 'B', 'Y'],
  ['R', 'W', 'G', 'R', 'W', 'R', 'Y', 'Y', 'B'], ['W', 'Y', 'G', 'W', 'Y', 'G', 'W', 'O', 'W']
].map(mirror);

// 3D progress cube camera per capture step, [theta, phi]: the face being entered faces you
// and the next one is already in view.
export const POSES = [[0.68, 1.03], [2.25, 1.03], [3.82, 1.03], [5.39, 1.03], [0.68, 0.55], [0.68, 2.55]];

// Which sticker of a face a cubie at engine position p shows.
export function stickerIndex(face, p) {
  const x = Math.round(p.x), y = Math.round(p.y), z = Math.round(p.z);
  const [row, col] = face === 'F' ? [1 - y, x + 1] : face === 'B' ? [1 - y, 1 - x] :
    face === 'R' ? [1 - y, 1 - z] : face === 'L' ? [1 - y, z + 1] :
    face === 'U' ? [z + 1, x + 1] : [1 - z, x + 1];
  return row * 3 + col;
}

// ---------------------------------------------------------------- session hand-off
// Progress lives in sessionStorage for this tab: switching between camera and manual entry
// never loses a side, and the solve guide reads the finished cube. Every access is guarded,
// since storage can be blocked (private windows, embeds) and the flow must still work.
const STORE = 'cubeteacher.capture';
const storage = () => { try { return globalThis.sessionStorage || null; } catch (_) { return null; } };
export const session = {
  load() {
    try {
      const v = JSON.parse(storage()?.getItem(STORE) || 'null');
      return v && Array.isArray(v.caps) && v.caps.length === 6 ? v.caps : null;
    } catch (_) { return null; }
  },
  save(caps) { try { storage()?.setItem(STORE, JSON.stringify({ caps })); } catch (_) {} },
  clear() { try { storage()?.removeItem(STORE); } catch (_) {} }
};
