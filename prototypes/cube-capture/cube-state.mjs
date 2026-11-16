const colorToFace = { W: 'U', R: 'R', G: 'F', Y: 'D', O: 'L', B: 'B' };
const names = { W: 'white', R: 'red', G: 'green', Y: 'yellow', O: 'orange', B: 'blue' };
const mirror = cells => [2, 1, 0, 5, 4, 3, 8, 7, 6].map(i => cells[i]);
const clockwise = cells => [6, 3, 0, 7, 4, 1, 8, 5, 2].map(i => cells[i]);
const counterclockwise = cells => [2, 5, 8, 1, 4, 7, 0, 3, 6].map(i => cells[i]);

// Captures follow F, R, B, L, U, D. Each capture keeps its preview orientation.
// U was tipped forward from L (orange at the bottom); D is flipped from U.
export function normalizeCaptured(captures, mirrored = Array(6).fill(true)) {
  const [front, right, back, left, up, down] = captures.map((cells, index) => mirrored[index] ? mirror(cells) : cells);
  return { U: clockwise(up), R: right, F: front, D: counterclockwise(down), L: left, B: back };
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
  if (new Set(corners).size !== 8) return fail('A corner piece appears twice or is missing. Check the captured faces.');

  const edges = [], edgeFlips = [];
  for (const slot of edgeSlots) {
    const [a, b] = slot.map(index => stickers[index]);
    const piece = edgePieces.findIndex(name => name[0] === a && name[1] === b);
    const flipped = piece < 0 ? edgePieces.findIndex(name => name[0] === b && name[1] === a) : piece;
    if (flipped < 0) return fail('An edge has colors that cannot meet on this cube. Check the captured faces.', slotFaces(slot));
    edges.push(flipped); edgeFlips.push(piece < 0 ? 1 : 0);
  }
  if (new Set(edges).size !== 12) return fail('An edge piece appears twice or is missing. Check the captured faces.');
  if (cornerTwists.reduce((sum, value) => sum + value, 0) % 3) return fail('The corner orientations do not form a possible cube. Check sticker directions, especially the up and down faces.');
  if (edgeFlips.reduce((sum, value) => sum + value, 0) % 2) return fail('The edge orientations do not form a possible cube. Check sticker directions.');
  if (parity(corners) !== parity(edges)) return fail('The corner and edge positions disagree. Check for a face captured in the wrong direction.');
  return { ok: true, message: 'This sticker layout is physically possible.' };
}
