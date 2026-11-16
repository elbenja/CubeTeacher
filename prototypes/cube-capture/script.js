import { normalizeCaptured, validateCube } from './cube-state.mjs';

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
const state = { index: 0, phase: 'scan', data: Array(6).fill(null), selected: 'G', stream: null, notice: '', editingFromDone: false, capturing: false, holdStart: 0, lastProbe: null, lastCheck: 0 };
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

function stickerStyle(key) { return `--sticker:${COLORS[key]?.hex || '#c9ccc5'}`; }
function faceGrid(index, editable = true) {
  const cells = state.data[index] || Array(9).fill(null);
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
    const current = index === state.index && state.phase !== 'done';
    return `<button type="button" class="face-step ${done ? 'is-done' : ''} ${current ? 'is-current' : ''}" data-face-index="${index}" style="--face-color:${COLORS[face.key].hex}" ${done ? '' : 'disabled'} aria-label="${face.name} face${done ? ', captured. Select to edit' : ', not captured'}" ${current ? 'aria-current="step"' : ''}><span class="step-num">${String(index + 1).padStart(2, '0')}</span><span class="step-dot"></span><span class="step-name">${face.name}</span><span class="step-check">✓</span></button>`;
  }).join('');
  $('face-progress').querySelectorAll('[data-face-index]:not(:disabled)').forEach(button => button.addEventListener('click', () => {
    state.editingFromDone = state.phase === 'done'; state.index = Number(button.dataset.faceIndex); state.phase = 'scan'; state.selected = FACE_ORDER[state.index].key; state.notice = ''; render();
  }));
}
function renderDemo() {
  $('demo-cube').innerHTML = demoFaces[Math.min(state.index, 5)].map(key => `<span style="${stickerStyle(key)}"></span>`).join('');
}
function renderGuide() {
  const face = FACE_ORDER[state.index];
  const guide = $('guide-main');
  $('step-index').textContent = state.phase === 'done' ? 'CAPTURE COMPLETE' : `FACE ${String(state.index + 1).padStart(2, '0')} OF 06`;
  $('state-pill').textContent = state.phase === 'review' ? 'CHECK YOUR COLORS' : state.phase === 'done' ? 'ALL FACES SAVED' : state.stream && !state.data[state.index] ? 'AUTO CAPTURE ON' : 'READY TO CAPTURE';
  $('state-pill').classList.remove('is-invalid');
  if (state.phase === 'done') {
    const faces = normalizeCaptured(state.data), verdict = validateCube(faces);
    const faceLetters = ['F', 'R', 'B', 'L', 'U', 'D'];
    $('state-pill').textContent = verdict.ok ? 'CUBE CHECK PASSED' : 'CHECK STICKERS';
    $('state-pill').classList.toggle('is-invalid', !verdict.ok);
    guide.innerHTML = `<div class="done-heading"><p class="eyebrow">SIX FACES CAPTURED</p><h2>${verdict.ok ? 'Your cube is ready.' : 'Check your cube.'}</h2></div><p class="done-copy">The camera mirror is corrected in this physical view. Drag the cube to inspect it, or tap a face to edit.</p><div class="done-validated ${verdict.ok ? '' : 'is-invalid'}"><span>${verdict.ok ? '✓' : '!'}</span>${verdict.message}</div><div class="done-net">${FACE_ORDER.map((item, index) => `<button type="button" class="net-face" data-edit="${index}" aria-label="Edit ${item.name} face"><div class="net-face-label">${item.name}</div><div class="net-stickers">${faces[faceLetters[index]].map(key => `<i style="${stickerStyle(key)}"></i>`).join('')}</div></button>`).join('')}</div><div class="guide-actions"><button class="primary-btn" id="restart-btn" type="button">Capture another cube <span class="arrow">↗</span></button></div>`;
    guide.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => { state.editingFromDone = true; state.index = Number(button.dataset.edit); state.phase = 'scan'; state.selected = FACE_ORDER[state.index].key; render(); }));
    $('restart-btn').addEventListener('click', () => { state.index = 0; state.phase = 'scan'; state.data = Array(6).fill(null); state.selected = 'G'; state.notice = ''; state.editingFromDone = false; render(); });
    return;
  }
  const captured = !!state.data[state.index];
  const review = state.phase === 'review';
  guide.innerHTML = `<div class="face-heading"><span class="face-color" style="--face-color:${COLORS[face.key].hex}"></span><div><h2>${face.name} face</h2><small>${COLORS[face.key].name} center · ${state.index + 1} of 6</small></div></div><p class="guide-copy">${review ? 'Check the 3 × 3 colors below. Tap any sticker that needs a correction.' : `Hold the cube with its ${face.position}. Fit the full face inside the guide.`}</p><div class="instruction"><span class="instruction-symbol">${review ? '✓' : '⌖'}</span><span>${review ? (state.notice || 'The center stays fixed so the face orientation is clear.') : `<strong>Look for the ${face.label} center.</strong> Keep the whole cube still while capturing.`}</span></div><div class="editor-heading"><h3>Sticker colors</h3><span>${captured ? 'TAP TO EDIT' : 'CENTER IS FIXED'}</span></div>${faceGrid(state.index)}${palette()}<div class="guide-actions"><button type="button" class="primary-btn" id="main-action">${review ? (state.editingFromDone ? 'Save changes' : state.index === 5 ? 'Review all faces' : 'Looks right — show next turn') : (captured ? 'Recapture this face' : 'Capture this face')} <span class="arrow">${review ? '→' : '⌖'}</span></button>${review ? `<button type="button" class="secondary-btn" id="recapture-btn">Capture this face again</button>` : `<p class="guide-small">${state.stream ? 'Camera colors are estimated; correct any mistakes above.' : 'Demo preview uses sample stickers; enable camera for your cube.'}</p>`}</div>`;
  if (!review && !captured && state.index > 0) {
    const cue = TURN_CUES[state.index - 1];
    guide.querySelector('.instruction span:last-child').innerHTML = `<strong>${cue.title}</strong> ${cue.detail}`;
  }
  if (review && !state.editingFromDone && state.index < 5) $('main-action').innerHTML = `Looks right — scan ${FACE_ORDER[state.index + 1].label} next <span class="arrow">→</span>`;
  if (state.stream && !review) guide.querySelector('.guide-small').textContent = 'Auto captures after a brief hold. Use the button if needed.';
  guide.querySelectorAll('[data-color]').forEach(button => button.addEventListener('click', () => { state.selected = button.dataset.color; guide.querySelectorAll('[data-color]').forEach(swatch => { swatch.classList.toggle('is-selected', swatch.dataset.color === state.selected); swatch.setAttribute('aria-pressed', swatch.dataset.color === state.selected); }); }));
  guide.querySelectorAll('[data-cell]').forEach(button => button.addEventListener('click', () => {
    if (!state.data[state.index]) { state.data[state.index] = Array(9).fill(null); state.data[state.index][4] = face.key; }
    state.data[state.index][Number(button.dataset.cell)] = state.selected;
    button.style.setProperty('--sticker', COLORS[state.selected].hex); button.classList.remove('is-empty');
    button.setAttribute('aria-label', `Sticker ${Number(button.dataset.cell) + 1}: ${COLORS[state.selected].name}`);
    if (state.data[state.index].every(Boolean) && state.phase === 'scan') {
      state.phase = 'review'; state.notice = 'Colors entered by hand. Check each sticker.'; render();
    } else updateProgress();
  }));
  $('main-action').addEventListener('click', () => {
    if (review) {
      if (state.data[state.index].some(key => !key)) { state.notice = 'Fill each empty sticker before continuing.'; renderGuide(); return; }
      if (state.editingFromDone || state.index === 5) state.phase = 'done';
      else { state.index++; state.phase = 'scan'; state.selected = FACE_ORDER[state.index].key; state.notice = ''; }
      state.editingFromDone = false; render();
    } else captureFace();
  });
  if (review) $('recapture-btn').addEventListener('click', () => captureFace());
}
function render() {
  if (state.phase === 'done' && state.stream) stopCamera();
  updateProgress(); renderDemo(); renderGuide();
  const done = state.phase === 'done';
  $('viewfinder').classList.toggle('is-result', done);
  $('camera-foot-status').textContent = done ? '3D preview · drag to inspect' : state.stream ? 'Live camera · automatic capture when aligned' : 'Sample cube shown until camera is enabled';
  document.querySelector('.camera-foot > span:last-child').textContent = done ? 'Drag the cube to inspect every side' : 'Keep the cube upright between side scans';
  $('viewfinder-note').textContent = done ? 'All six faces recorded' : state.phase === 'review' ? 'Check the colors before turning' : state.stream && !state.data[state.index] ? `Center the ${FACE_ORDER[state.index].label} face to auto capture` : 'Line up one face inside the frame';
  if (state.phase !== 'scan') resetHold();
  if (done) renderResultCube(normalizeCaptured(state.data));
  else if (cubeViewer) { cubeViewer.dispose(); cubeViewer = null; }
}

function stickerIndex(face, position) {
  const x = Math.round(position.x), y = Math.round(position.y), z = Math.round(position.z);
  const [row, col] = face === 'F' ? [1 - y, x + 1] : face === 'B' ? [1 - y, 1 - x] :
    face === 'R' ? [1 - y, 1 - z] : face === 'L' ? [1 - y, z + 1] :
    face === 'U' ? [z + 1, x + 1] : [1 - z, x + 1];
  return row * 3 + col;
}
let cubeEngineModule;
async function renderResultCube(faces) {
  const host = $('result-cube');
  if (!window.THREE) { host.textContent = '3D preview unavailable. The face check is still shown on the right.'; return; }
  try {
    cubeEngineModule ||= import('../../cube-engine.js');
    const { CubeEngine } = await cubeEngineModule;
    if (state.phase !== 'done') return;
    if (!cubeViewer) {
      host.textContent = ''; cubeViewer = new CubeEngine(host);
      cubeViewer.model.userData.ghosts.forEach(ghost => { ghost.visible = false; });
      cubeViewer.model.userData.ghosts.length = 0;
    }
    const cubies = new Map(cubeViewer.model.userData.cubies.map(cubie => [cubie.userData.id, cubie]));
    cubeViewer.model.userData.stickers.forEach(sticker => {
      const face = sticker.userData.face;
      const color = COLORS[faces[face][stickerIndex(face, cubies.get(sticker.userData.cubie).position)]].hex;
      sticker.userData.base.set(color);
      sticker.material.color.copy(sticker.userData.base);
      sticker.userData.ghost.material.color.copy(sticker.userData.base);
    });
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
    const x = Math.min(detectorCanvas.width - 4, Math.max(3, Math.round((view.width - displayX + cropX) / scale)));
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
  const centered = colors[4] === FACE_ORDER[state.index].key && valid >= 8 && seams >= 4;
  colors[4] = FACE_ORDER[state.index].key;
  return { colors, rgb, centered };
}
function sampleCamera() { return inspectCamera()?.colors || null; }
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
    $('viewfinder-note').textContent = `Center the ${FACE_ORDER[state.index].label} face inside the frame`;
    return;
  }
  const difference = state.lastProbe ? probe.rgb.reduce((sum, cell, i) => sum + cell.reduce((n, value, channel) => n + Math.abs(value - state.lastProbe.rgb[i][channel]), 0), 0) / 27 : Infinity;
  if (difference > 18) state.holdStart = now;
  state.lastProbe = probe;
  $('viewfinder').classList.add('is-aligned');
  $('viewfinder-note').textContent = 'Hold still — capturing automatically';
  const progress = Math.min(1, (now - state.holdStart) / 900);
  $('auto-hold').style.setProperty('--hold-progress', progress);
  if (progress >= 1) captureFace(probe.colors, true);
}
function captureFace(capturedCells = null, automatic = false) {
  if (state.phase === 'done' || state.capturing) return;
  state.capturing = true; resetHold();
  $('viewfinder').classList.add('is-scanning');
  const next = Array.isArray(capturedCells) ? capturedCells : sampleCamera() || [...demoFaces[state.index]];
  window.setTimeout(() => {
    state.data[state.index] = next; state.phase = 'review';
    state.notice = automatic ? 'Captured automatically. Check every sticker.' : state.stream ? 'Colors estimated from the camera. Check every sticker.' : 'Sample colors captured. Edit the stickers to match your cube.';
    state.capturing = false;
    $('viewfinder').classList.remove('is-scanning');
    $('flash').classList.remove('on'); void $('flash').offsetWidth; $('flash').classList.add('on');
    render();
  }, 650);
}
function stopCamera() {
  state.stream?.getTracks().forEach(track => track.stop()); state.stream = null;
  $('camera').srcObject = null; $('viewfinder').classList.remove('has-camera');
  $('camera-label').textContent = 'DEMO PREVIEW'; $('camera-switch').innerHTML = 'Enable camera <span aria-hidden="true">↗</span>';
  $('camera-foot-status').textContent = 'Sample cube shown until camera is enabled'; resetHold();
}
async function toggleCamera() {
  if (state.stream) {
    stopCamera(); render(); return;
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    $('camera').srcObject = stream; await $('camera').play(); state.stream = stream;
    $('viewfinder').classList.add('has-camera'); $('camera-label').textContent = 'LIVE CAMERA';
    $('camera-switch').textContent = 'Stop camera'; $('camera-foot-status').textContent = 'Live camera · automatic capture when aligned'; render();
  } catch {
    stream?.getTracks().forEach(track => track.stop()); $('camera').srcObject = null;
    $('camera-foot-status').textContent = 'Camera unavailable — sample preview is ready';
  }
}
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
window.addEventListener('pagehide', () => { stopCamera(); cubeViewer?.dispose(); });
render();
requestAnimationFrame(monitorCamera);
