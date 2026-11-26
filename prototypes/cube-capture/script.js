import { captureFromPhysical, normalizeCaptured, validateCube } from '../../cube-capture.mjs';

const COLORS = {
  W: { name: 'White', hex: '#f6f5ef' }, Y: { name: 'Yellow', hex: '#f4cd37' },
  R: { name: 'Red', hex: '#e8403c' }, O: { name: 'Orange', hex: '#f18b37' },
  G: { name: 'Green', hex: '#30b968' }, B: { name: 'Blue', hex: '#396adc' }
};
const FACE_ORDER = [
  { key: 'G', name: 'Front', label: 'green', position: 'green center facing the camera; white center on top' },
  { key: 'R', name: 'Right', label: 'red', position: 'red center facing the camera; keep white on top' },
  { key: 'B', name: 'Back', label: 'blue', position: 'blue center facing the camera; keep white on top' },
  { key: 'O', name: 'Left', label: 'orange', position: 'orange center facing the camera; keep white on top' },
  { key: 'W', name: 'Up', label: 'white', position: 'white center facing the camera; orange at the bottom' },
  { key: 'Y', name: 'Down', label: 'yellow', position: 'yellow center facing the camera; orange at the top' }
];
const TURN_CUES = [
  { title: 'Bring the red side forward.', detail: 'Turn the whole cube so the face on your right points at the camera. Keep white on top.', short: 'Right face → front', tip: 'Rotate the entire cube, not one layer.' },
  { title: 'Bring the blue side forward.', detail: 'Turn the whole cube the same way again. The blue center should now face the camera.', short: 'Right face → front', tip: 'White stays on top during this turn.' },
  { title: 'Bring the orange side forward.', detail: 'One more turn in the same direction. Keep the white face pointing up.', short: 'Right face → front', tip: 'Check for an orange center before capturing.' },
  { title: 'Tip the white side toward you.', detail: 'Tilt the whole cube so white faces the camera. The orange face should end up at the bottom.', short: 'Top face → front', tip: 'Keep the orange edge at the bottom of your view.' },
  { title: 'Turn the cube over.', detail: 'Rotate the whole cube forward half a turn until yellow faces the camera. Orange should now be at the top.', short: 'Bottom face → front', tip: 'The orange edge moves from bottom to top.' }
];

const $ = id => document.getElementById(id);
const state = { mode: null, index: 0, phase: 'scan', data: Array(6).fill(null), editData: null, mirroredFaces: Array(6).fill(false), mirrored: false, selected: 'G', stream: null, notice: '', capturing: false, holdStart: 0, lastProbe: null, lastCheck: 0 };
// A legal R U F' L2 D B scramble, shown when a camera is unavailable.
const demoFaces = [
  ['Y','Y','B','G','G','B','G','G','G'],
  ['O','B','B','B','R','Y','B','G','O'],
  ['O','W','Y','O','B','R','R','R','R'],
  ['O','O','W','O','O','W','R','B','Y'],
  ['R','W','G','R','W','R','Y','Y','B'],
  ['W','Y','G','W','Y','G','W','O','W']
];
let cubeViewer = null;
let progressViewer = null;
const faceLetters = ['F', 'R', 'B', 'L', 'U', 'D'];
const mirroredCells = cells => [2, 1, 0, 5, 4, 3, 8, 7, 6].map(i => cells[i]);
const physicalFaces = () => normalizeCaptured(state.data, state.mirroredFaces);

function stickerStyle(key) { return `--sticker:${COLORS[key]?.hex || '#c9ccc5'}`; }
function faceGrid(index, editable = true) {
  const cells = state.phase === 'edit' ? state.editData : state.data[index] || Array(9).fill(null);
  const current = FACE_ORDER[index];
  return `<div class="sticker-editor" role="group" aria-label="${current.name} face sticker colors">${cells.map((key, cell) => {
    const color = cell === 4 ? current.key : key;
    return `<button class="sticker ${color ? '' : 'is-empty'} ${cell === 4 ? 'is-center' : ''}" type="button" style="${stickerStyle(color)}" data-cell="${cell}" aria-label="${cell === 4 ? 'Center: ' : `Sticker ${cell + 1}: `}${color ? COLORS[color].name : 'empty'}" ${cell === 4 || !editable ? 'disabled' : ''}></button>`;
  }).join('')}</div>`;
}
function palette() {
  return `<div class="palette" role="group" aria-label="Choose sticker color">${Object.entries(COLORS).map(([key, color]) => `<button type="button" class="swatch ${state.selected === key ? 'is-selected' : ''}" data-color="${key}" style="--swatch:${color.hex}" aria-label="${color.name}" aria-pressed="${state.selected === key}"></button>`).join('')}</div><p class="palette-note">Choose a color, then tap any sticker to correct it</p>`;
}
function updateProgress() {
  const count = state.data.filter(cells => cells && cells.every(Boolean)).length;
  $('progress-count').innerHTML = `${count}<span> / 6</span>`;
  $('face-progress').innerHTML = FACE_ORDER.map((face, index) => {
    const done = !!state.data[index] && state.data[index].every(Boolean);
    const current = index === state.index && state.phase === 'scan';
    const canEdit = done && state.phase === 'done';
    return `<button type="button" class="face-step ${done ? 'is-done' : ''} ${current ? 'is-current' : ''}" data-face-index="${index}" style="--face-color:${COLORS[face.key].hex}" ${canEdit ? '' : 'disabled'} aria-label="${face.name} face${done ? ', captured. Select to edit' : ', not captured'}" ${current ? 'aria-current="step"' : ''}><span class="step-num">${String(index + 1).padStart(2, '0')}</span><span class="step-dot"></span><span class="step-name">${face.name}</span><span class="step-check">✓</span></button>`;
  }).join('');
  $('face-progress').querySelectorAll('[data-face-index]:not(:disabled)').forEach(button => button.addEventListener('click', () => {
    enterEdit(Number(button.dataset.faceIndex));
  }));
}
function enterEdit(index) {
  state.editData = [...physicalFaces()[faceLetters[index]]];
  state.index = index; state.phase = 'edit'; state.selected = FACE_ORDER[index].key; state.notice = ''; render();
}
function renderDemo() {
  $('demo-cube').innerHTML = demoFaces[Math.min(state.index, 5)].map(key => `<span style="${stickerStyle(key)}"></span>`).join('');
}
function renderGuide() {
  const face = FACE_ORDER[state.index], guide = $('guide-main');
  const editing = state.phase === 'edit', done = state.phase === 'done';
  $('step-index').textContent = done ? 'CAPTURE COMPLETE' : editing ? 'EDIT CAPTURED FACE' : `FACE ${String(state.index + 1).padStart(2, '0')} OF 06`;
  $('state-pill').classList.toggle('is-invalid', false);
  if (done) {
    const faces = physicalFaces(), verdict = validateCube(faces);
    const flagged = verdict.ok ? [] : verdict.suspects?.length ? verdict.suspects : faceLetters;
    $('state-pill').textContent = verdict.ok ? 'CUBE CHECK PASSED' : 'CHECK STICKERS';
    $('state-pill').classList.toggle('is-invalid', !verdict.ok);
    guide.innerHTML = `<div class="done-heading"><p class="eyebrow">SIX FACES CAPTURED</p><h2>${verdict.ok ? 'Your cube is ready.' : 'Some stickers don’t form a possible cube.'}</h2></div><p class="done-copy">Drag the cube to inspect it. Tap any face to correct its stickers.</p><div class="done-validated ${verdict.ok ? '' : 'is-invalid'}"><span>${verdict.ok ? '✓' : '!'}</span>${verdict.ok ? verdict.message : (verdict.suspects?.length ? 'Review the highlighted faces. ' : 'Check each face. ') + verdict.message}</div><div class="done-net">${FACE_ORDER.map((item, index) => `<button type="button" class="net-face ${flagged.includes(faceLetters[index]) ? 'is-suspect' : ''}" data-edit="${index}" aria-label="Edit ${item.name} face"><div class="net-face-label">${item.name}${flagged.includes(faceLetters[index]) ? ' · CHECK' : ''}</div><div class="net-stickers">${faces[faceLetters[index]].map(key => `<i style="${stickerStyle(key)}"></i>`).join('')}</div></button>`).join('')}</div><div class="guide-actions"><button class="primary-btn" id="restart-btn" type="button">Start another cube <span class="arrow">↗</span></button></div>`;
    guide.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => enterEdit(Number(button.dataset.edit))));
    $('restart-btn').addEventListener('click', () => {
      state.index = 0; state.phase = 'scan'; state.data = Array(6).fill(null); state.editData = null; state.mirroredFaces = Array(6).fill(false);
      state.selected = 'G'; state.notice = ''; state.mode = null; render();
    });
    return;
  }
  $('state-pill').textContent = editing ? 'CORRECT STICKERS' : state.mode === 'camera' ? state.stream ? 'AUTO CAPTURE ON' : 'CAMERA OFF' : 'MANUAL ENTRY';
  const cue = state.index > 0 ? TURN_CUES[state.index - 1] : null;
  if (state.mode === 'camera' && !editing) {
    guide.innerHTML = `<div class="face-heading"><span class="face-color" style="--face-color:${COLORS[face.key].hex}"></span><div><h2>${face.name} face</h2><small>${COLORS[face.key].name} center · ${state.index + 1} of 6</small></div></div><p class="guide-copy">${cue ? `<strong>${cue.title}</strong> ${cue.detail}` : 'Show the green center to the camera with white on top.'}</p><div class="instruction"><span class="instruction-symbol">⌖</span><span>Keep the whole cube in the guide. Capture advances automatically when the face is clear and still.</span></div><p class="scan-feedback" id="scan-feedback" role="status">${state.notice || `Looking for the ${face.label} center…`}</p><div class="guide-actions"><button type="button" class="secondary-btn" id="manual-fallback">Enter colours instead</button></div>`;
    $('manual-fallback').addEventListener('click', () => chooseMode('manual'));
    return;
  }
  const manual = state.mode === 'manual' && !editing;
  guide.innerHTML = `<div class="face-heading"><span class="face-color" style="--face-color:${COLORS[face.key].hex}"></span><div><h2>${face.name} face</h2><small>${COLORS[face.key].name} center · ${state.index + 1} of 6</small></div></div><p class="guide-copy">${editing ? 'Correct this face in the same orientation it was captured or entered.' : `Enter the ${face.label} face. ${cue ? cue.detail : 'Keep white on top.'}`}</p><div class="instruction"><span class="instruction-symbol">⌖</span><span>${state.notice || (editing ? 'The center stays fixed. Save changes to check the cube again.' : 'Select a colour, then tap each sticker. The center is fixed.')}</span></div><div class="editor-heading"><h3>Sticker colours</h3><span>${editing ? 'TAP TO CORRECT' : 'CENTER IS FIXED'}</span></div>${faceGrid(state.index)}${palette()}<div class="guide-actions"><button type="button" class="primary-btn" id="main-action" ${manual && !state.data[state.index]?.every(Boolean) ? 'disabled' : ''}>${editing ? 'Save changes' : state.index === 5 ? 'Review cube' : 'Next face'} <span class="arrow">→</span></button></div>`;
  guide.querySelectorAll('[data-color]').forEach(button => button.addEventListener('click', () => {
    state.selected = button.dataset.color;
    guide.querySelectorAll('[data-color]').forEach(swatch => { swatch.classList.toggle('is-selected', swatch.dataset.color === state.selected); swatch.setAttribute('aria-pressed', swatch.dataset.color === state.selected); });
  }));
  guide.querySelectorAll('[data-cell]').forEach(button => button.addEventListener('click', () => {
    if (!editing && !state.data[state.index]) { state.data[state.index] = Array(9).fill(null); state.data[state.index][4] = face.key; state.mirroredFaces[state.index] = false; }
    const cells = editing ? state.editData : state.data[state.index];
    cells[Number(button.dataset.cell)] = state.selected;
    button.style.setProperty('--sticker', COLORS[state.selected].hex); button.classList.remove('is-empty');
    button.setAttribute('aria-label', `Sticker ${Number(button.dataset.cell) + 1}: ${COLORS[state.selected].name}`);
    $('main-action').disabled = !cells.every(Boolean);
    updateProgress();
    if (editing) renderResultCube({ ...physicalFaces(), [faceLetters[state.index]]: state.editData });
    else renderProgressCube();
  }));
  $('main-action').addEventListener('click', () => {
    if (!(editing ? state.editData : state.data[state.index])?.every(Boolean)) return;
    if (editing) {
      state.data[state.index] = captureFromPhysical(state.index, state.editData);
      state.mirroredFaces[state.index] = false; state.editData = null; state.phase = 'done';
    } else if (state.index === 5) state.phase = 'done';
    else { state.index++; state.selected = FACE_ORDER[state.index].key; state.notice = ''; }
    render();
  });
}
function render() {
  const complete = state.phase === 'done' || state.phase === 'edit';
  if (complete && state.stream) stopCamera();
  $('mode-switch').hidden = !state.mode || complete;
  $('choice-overlay').hidden = !!state.mode;
  $('viewfinder').classList.toggle('is-result', complete);
  $('viewfinder').classList.toggle('is-turning', state.mode === 'camera' && state.phase === 'scan' && state.index > 0);
  $('progress-visual').classList.toggle('is-turning', state.phase === 'scan' && state.index > 0);
  $('progress-visual').hidden = complete || !state.mode;
  $('feed-turn').hidden = state.mode !== 'camera' || state.phase !== 'scan' || state.index === 0;
  if (state.index > 0) {
    const cue = TURN_CUES[state.index - 1], arrow = state.index < 4 ? '↶' : state.index === 4 ? '↧' : '↻';
    $('progress-turn-arrow').textContent = arrow;
    $('feed-turn-arrow').textContent = state.mirrored && state.index < 4 ? '↷' : arrow;
    $('feed-turn-label').textContent = cue.short;
  }
  document.querySelector('.workspace').classList.toggle('is-manual', state.mode === 'manual');
  document.querySelector('.workspace').classList.toggle('is-complete', complete);
  updateMirror();
  updateProgress(); renderDemo(); renderGuide();
  $('camera-foot-status').textContent = complete ? '3D preview · drag to inspect' : state.mode === 'manual' ? 'Enter each sticker by hand' : state.stream ? 'Live camera · automatic capture when aligned' : 'Camera is off';
  document.querySelector('.camera-foot > span:last-child').textContent = complete ? 'Drag the cube to inspect every side' : 'Keep the cube upright between side scans';
  $('viewfinder-note').textContent = complete ? 'All six faces recorded' : state.mode === 'camera' ? `Center the ${FACE_ORDER[state.index].label} face to auto capture` : 'Enter colours on the right';
  if (state.phase !== 'scan') resetHold();
  if (complete) renderResultCube(physicalFaces());
  else if (cubeViewer) { cubeViewer.dispose(); cubeViewer = null; }
  if (complete && progressViewer) { progressViewer.dispose(); progressViewer = null; }
  if (state.mode && !complete) renderProgressCube();
}
function stickerIndex(face, position) {
  const x = Math.round(position.x), y = Math.round(position.y), z = Math.round(position.z);
  const [row, col] = face === 'F' ? [1 - y, x + 1] : face === 'B' ? [1 - y, 1 - x] :
    face === 'R' ? [1 - y, 1 - z] : face === 'L' ? [1 - y, z + 1] :
    face === 'U' ? [z + 1, x + 1] : [1 - z, x + 1];
  return row * 3 + col;
}
let cubeEngineModule;
function paintCube(viewer, faces) {
  const cubies = new Map(viewer.model.userData.cubies.map(cubie => [cubie.userData.id, cubie]));
  viewer.model.userData.stickers.forEach(sticker => {
    const face = sticker.userData.face;
    const key = faces[face][stickerIndex(face, cubies.get(sticker.userData.cubie).position)];
    const color = COLORS[key]?.hex || '#dedfdb';
    sticker.userData.base.set(color);
    sticker.material.color.copy(sticker.userData.base);
    sticker.userData.ghost.material.color.copy(sticker.userData.base);
  });
}
async function renderProgressCube() {
  if (!state.mode || state.phase !== 'scan' || !window.THREE) return;
  try {
    cubeEngineModule ||= import('../../cube-engine.js');
    const { CubeEngine } = await cubeEngineModule;
    if (state.phase !== 'scan') return;
    if (!progressViewer) {
      progressViewer = new CubeEngine($('progress-cube'));
      progressViewer.model.userData.ghosts.forEach(ghost => { ghost.visible = false; });
      progressViewer.model.userData.ghosts.length = 0;
      progressViewer.home.r = progressViewer.sph.r = progressViewer.want.r = 12.5;
    }
    const partial = state.data.map((cells, index) => cells || Array.from({ length: 9 }, (_, cell) => cell === 4 ? FACE_ORDER[index].key : null));
    paintCube(progressViewer, normalizeCaptured(partial, state.mirroredFaces));
    const poses = [0.68, 2.25, 3.82, 5.39, 0.68, 0.68];
    progressViewer.want.theta = poses[state.index];
    progressViewer.want.phi = state.index === 4 ? .55 : state.index === 5 ? 2.55 : 1.03;
    progressViewer.want.r = 12.5;
  } catch { $('progress-cube').textContent = '3D progress preview unavailable.'; }
}
async function renderResultCube(faces) {
  const host = $('result-cube');
  if (!window.THREE) { host.textContent = '3D preview unavailable. The face check is still shown on the right.'; return; }
  try {
    cubeEngineModule ||= import('../../cube-engine.js');
    const { CubeEngine } = await cubeEngineModule;
    if (state.phase !== 'done' && state.phase !== 'edit') return;
    if (!cubeViewer) {
      host.textContent = ''; cubeViewer = new CubeEngine(host);
      cubeViewer.model.userData.ghosts.forEach(ghost => { ghost.visible = false; });
      cubeViewer.model.userData.ghosts.length = 0;
    }
    paintCube(cubeViewer, faces);
  } catch {
    host.textContent = '3D preview unavailable. The face check is still shown on the right.';
  }
}

function rgbToColor(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  const saturation = max ? delta / max : 0;
  if (saturation < .2 && max > 85) return 'W';
  let hue = 0;
  if (delta) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  if (hue < 13 || hue >= 345) return 'R';
  if (hue < 43) return 'O';
  if (hue < 77) return 'Y';
  if (hue < 175) return 'G';
  return 'B';
}
const detectorCanvas = document.createElement('canvas');
const detectorContext = detectorCanvas.getContext('2d', { willReadFrequently: true });
function inspectCamera() {
  const video = $('camera');
  if (!state.stream || !video.videoWidth) return null;
  const width = Math.min(640, video.videoWidth), height = Math.round(width * video.videoHeight / video.videoWidth);
  if (detectorCanvas.width !== width || detectorCanvas.height !== height) { detectorCanvas.width = width; detectorCanvas.height = height; }
  detectorContext.drawImage(video, 0, 0, detectorCanvas.width, detectorCanvas.height);
  const view = $('viewfinder').getBoundingClientRect(), frame = $('scan-frame').getBoundingClientRect();
  const scale = Math.max(view.width / detectorCanvas.width, view.height / detectorCanvas.height);
  const cropX = (detectorCanvas.width * scale - view.width) / 2, cropY = (detectorCanvas.height * scale - view.height) / 2;
  function sample(u, v) {
    const displayX = frame.left - view.left + u * frame.width;
    const displayY = frame.top - view.top + v * frame.height;
    const x = Math.min(detectorCanvas.width - 4, Math.max(3, Math.round(((state.mirrored ? view.width - displayX : displayX) + cropX) / scale)));
    const y = Math.min(detectorCanvas.height - 4, Math.max(3, Math.round((displayY + cropY) / scale)));
    const pixels = detectorContext.getImageData(x - 3, y - 3, 7, 7).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < pixels.length; i += 4) { r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2]; }
    return [r / 49, g / 49, b / 49];
  }
  const rgb = Array.from({ length: 9 }, (_, cell) => sample((cell % 3 + .5) / 3, (Math.floor(cell / 3) + .5) / 3));
  const colors = rgb.map(([r, g, b]) => rgbToColor(r, g, b));
  const light = ([r, g, b]) => (r + g + b) / 3;
  const valid = rgb.filter(([r, g, b]) => {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    return max >= 70 && ((max - min) / max >= .18 || max >= 125);
  }).length;
  let seams = 0;
  for (let row = 0; row < 3; row++) for (let split = 1; split < 3; split++) {
    const neighbor = (light(rgb[row * 3 + split - 1]) + light(rgb[row * 3 + split])) / 2;
    const gap = Math.min(...[-.025, 0, .025].map(offset => light(sample(split / 3 + offset, (row + .5) / 3))));
    if (gap < neighbor * .78 && neighbor - gap > 14) seams++;
  }
  for (let col = 0; col < 3; col++) for (let split = 1; split < 3; split++) {
    const neighbor = (light(rgb[(split - 1) * 3 + col]) + light(rgb[split * 3 + col])) / 2;
    const gap = Math.min(...[-.025, 0, .025].map(offset => light(sample((col + .5) / 3, split / 3 + offset))));
    if (gap < neighbor * .78 && neighbor - gap > 14) seams++;
  }
  const center = colors[4];
  const brightness = rgb.reduce((sum, cell) => sum + light(cell), 0) / 9;
  const glare = seams < 4 && rgb.filter(([r, g, b]) => Math.min(r, g, b) > 247).length >= 3;
  const centered = center === FACE_ORDER[state.index].key && valid >= 8 && seams >= 4 && brightness >= 65 && !glare;
  colors[4] = FACE_ORDER[state.index].key;
  return { colors, rgb, centered, center, valid, seams, brightness, glare };
}
function cameraMessage(message) {
  if ($('viewfinder-note').textContent !== message) $('viewfinder-note').textContent = message;
  const feedback = $('scan-feedback');
  if (feedback && feedback.textContent !== message) feedback.textContent = message;
}
function resetHold() {
  state.holdStart = 0; state.lastProbe = null;
  $('viewfinder').classList.remove('is-aligned');
  $('auto-hold').style.setProperty('--hold-progress', 0);
}
function monitorCamera(now) {
  requestAnimationFrame(monitorCamera);
  if (!state.stream || state.phase !== 'scan' || state.data[state.index] || state.capturing || document.hidden) return;
  if (now - state.lastCheck < 140) return;
  state.lastCheck = now;
  const probe = inspectCamera();
  if (!probe?.centered) {
    resetHold();
    const needsTurn = state.index > 0 && probe?.center !== FACE_ORDER[state.index].key;
    $('viewfinder').classList.toggle('is-turning', needsTurn);
    $('progress-visual').classList.toggle('is-turning', needsTurn);
    const seen = FACE_ORDER.find(face => face.key === probe?.center);
    const duplicate = seen && state.data[FACE_ORDER.indexOf(seen)];
    const message = !probe ? 'Fit one full face inside the frame.' : probe.brightness < 65 ? 'More light needed. Move to a brighter spot.' : probe.glare ? 'Tilt the cube slightly to reduce glare.' : probe.valid < 5 || probe.seams < 4 ? 'Fit one full face inside the frame.' : probe.valid < 8 ? 'Move closer so we can read the center sticker.' : seen && seen.key !== FACE_ORDER[state.index].key ? duplicate ? 'We have this color. Turn to the next side.' : 'Follow the arrow to show the next side.' : `Center the ${FACE_ORDER[state.index].label} face inside the frame.`;
    cameraMessage(message);
    return;
  }
  const difference = state.lastProbe ? probe.rgb.reduce((sum, cell, i) => sum + cell.reduce((n, value, channel) => n + Math.abs(value - state.lastProbe.rgb[i][channel]), 0), 0) / 27 : Infinity;
  if (difference > 18) state.holdStart = now;
  state.lastProbe = probe;
  $('viewfinder').classList.add('is-aligned');
  $('viewfinder').classList.remove('is-turning');
  $('progress-visual').classList.remove('is-turning');
  cameraMessage(difference > 18 ? 'Hold still for a moment.' : 'Hold still — capturing automatically');
  const progress = Math.min(1, (now - state.holdStart) / 900);
  $('auto-hold').style.setProperty('--hold-progress', progress);
  if (progress >= 1) captureFace(probe.colors);
}
function captureFace(capturedCells) {
  if (state.phase !== 'scan' || state.capturing || !state.stream || !Array.isArray(capturedCells)) return;
  state.capturing = true; resetHold();
  $('viewfinder').classList.add('is-scanning');
  const index = state.index, mirrored = state.mirrored;
  window.setTimeout(() => {
    if (state.mode !== 'camera' || !state.stream) {
      state.capturing = false; $('viewfinder').classList.remove('is-scanning'); return;
    }
    state.data[index] = capturedCells; state.mirroredFaces[index] = mirrored;
    if (index === 5) state.phase = 'done';
    else { state.index = index + 1; state.selected = FACE_ORDER[state.index].key; }
    state.notice = '';
    state.capturing = false;
    $('viewfinder').classList.remove('is-scanning');
    $('flash').classList.remove('on'); void $('flash').offsetWidth; $('flash').classList.add('on');
    render();
  }, 650);
}
function stopCamera() {
  state.stream?.getTracks().forEach(track => track.stop()); state.stream = null;
  $('camera').srcObject = null; $('viewfinder').classList.remove('has-camera');
  $('camera-label').textContent = 'CAMERA OFF'; $('camera-switch').textContent = 'Start camera'; resetHold();
}
async function toggleCamera() {
  if (state.stream) {
    stopCamera(); render(); return;
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    $('camera').srcObject = stream; await $('camera').play(); state.stream = stream;
    const facing = stream.getVideoTracks()[0]?.getSettings().facingMode;
    state.mirrored = facing === 'user' || (!facing && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    updateMirror();
    state.notice = '';
    $('viewfinder').classList.add('has-camera'); $('camera-label').textContent = 'LIVE CAMERA';
    $('camera-switch').textContent = 'Stop camera'; render();
  } catch {
    stream?.getTracks().forEach(track => track.stop()); $('camera').srcObject = null;
    stopCamera();
    state.notice = 'Camera unavailable. Try again or enter colours by hand.';
    render(); cameraMessage(state.notice);
  }
}
function updateMirror() {
  $('viewfinder').classList.toggle('is-mirrored', state.mirrored);
  $('progress-visual').classList.toggle('is-mirrored', state.mode === 'camera' && state.mirrored);
  $('progress-cube').setAttribute('aria-label', state.mode === 'camera' && state.mirrored ? 'Mirrored 3D progress cube showing three adjacent sides' : '3D progress cube showing three adjacent sides');
  $('mirror-switch').textContent = state.mirrored ? 'Mirror on' : 'Mirror off';
  $('mirror-switch').setAttribute('aria-pressed', String(state.mirrored));
  if (state.index > 0 && state.index < 4) $('feed-turn-arrow').textContent = state.mirrored ? '↷' : '↶';
}
function chooseMode(mode) {
  if (mode === 'manual') {
    stopCamera();
    state.data = state.data.map((cells, index) => state.mirroredFaces[index] && cells ? mirroredCells(cells) : cells);
    state.mirroredFaces.fill(false);
  }
  state.mode = mode; state.notice = ''; render();
  if (mode === 'camera' && !state.stream) toggleCamera();
}
$('choose-camera').addEventListener('click', () => chooseMode('camera'));
$('choose-manual').addEventListener('click', () => chooseMode('manual'));
$('mode-switch').addEventListener('click', () => { stopCamera(); state.mode = null; render(); });
$('mirror-switch').addEventListener('click', () => { state.mirrored = !state.mirrored; updateMirror(); resetHold(); });
$('camera-switch').addEventListener('click', toggleCamera);
$('reset-view').addEventListener('click', () => cubeViewer?.resetView());
$('result-cube').addEventListener('keydown', event => {
  if (!cubeViewer || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
  event.preventDefault();
  if (event.key === 'ArrowLeft') cubeViewer.want.theta -= .25;
  if (event.key === 'ArrowRight') cubeViewer.want.theta += .25;
  if (event.key === 'ArrowUp') cubeViewer.want.phi = Math.max(.22, cubeViewer.want.phi - .25);
  if (event.key === 'ArrowDown') cubeViewer.want.phi = Math.min(Math.PI - .22, cubeViewer.want.phi + .25);
});
window.addEventListener('pagehide', () => { stopCamera(); cubeViewer?.dispose(); progressViewer?.dispose(); });
render();
requestAnimationFrame(monitorCamera);
