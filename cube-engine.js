// CubeTeacher — Three.js cube engine.
// Requires window.THREE (UMD build loaded in <helmet>).

const THREE = window.THREE;

export const FACE_COLORS = { U: '#ffffff', D: '#ffd500', R: '#ee2b2b', L: '#ff7a18', F: '#16c464', B: '#1e5fe0' };
export const DIM_COLOR = '#c6c6c6';

// The halo lands in the black gutter between a sticker and the cubie's edge,
// where white is the one colour the cube itself never puts next to it. The gap
// is what makes white safe on the white face too: without it a white ring would
// touch a white sticker and the two would read as one fat sticker rather than a
// marked piece. A sliver of black between them keeps the ring a ring on all six
// faces. Width plus gap stay under the gutter's own 0.11, so the ring never
// reaches the cubie's edge.
export const HALO_COLOR = '#ffffff';
const HALO_WIDTH = 0.072;
const HALO_GAP = 0.018;

const FACE_NAMES = {
  U: 'up face', D: 'down face', R: 'right face', L: 'left face', F: 'front face', B: 'back face',
  M: 'middle slice', E: 'equator slice', S: 'standing slice',
  x: 'whole cube on R', y: 'whole cube on U', z: 'whole cube on F'
};

// [axis, sign, layers] — sign flips for faces viewed from the negative side.
const SPEC = {
  U: ['y', 1, [1]], D: ['y', -1, [-1]], R: ['x', 1, [1]],
  L: ['x', -1, [-1]], F: ['z', 1, [1]], B: ['z', -1, [-1]],
  M: ['x', -1, [0]], E: ['y', -1, [0]], S: ['z', 1, [0]],
  x: ['x', 1, [-1, 0, 1]], y: ['y', 1, [-1, 0, 1]], z: ['z', 1, [-1, 0, 1]]
};
const AXIS_VEC = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

export function parseMoves(input) {
  const s = Array.isArray(input) ? input.join(' ') : String(input || '');
  const out = [];
  const re = /([UDLRFBMESxyz])(2|')?/g;
  let m;
  while ((m = re.exec(s))) out.push(m[1] + (m[2] || ''));
  return out;
}

export function invertMoves(input) {
  return parseMoves(input).slice().reverse().map(t => {
    const f = t[0], suf = t.slice(1);
    if (suf === '2') return t;
    return suf === "'" ? f : f + "'";
  });
}

export function moveSpec(token) {
  const f = token[0], suf = token.slice(1);
  const [axis, sign, layers] = SPEC[f];
  const turns = suf === '2' ? 2 : 1;
  const dir = suf === "'" ? -1 : 1;
  return { face: f, axis, sign, layers, turns, prime: dir < 0, angle: -(Math.PI / 2) * turns * dir * sign };
}

export function prettyMove(token) {
  return token.replace("'", '′');
}

export function describeMove(token) {
  const f = token[0], suf = token.slice(1);
  const what = FACE_NAMES[f] || f;
  const how = suf === '2' ? 'half turn' : suf === "'" ? 'counter-clockwise' : 'clockwise';
  return prettyMove(token) + ' — ' + what + ', ' + how;
}

export function faceColorOf(token) {
  return FACE_COLORS[token[0]] || '#9b9b9b';
}

// ----------------------------------------------------------------- geometry
function stickerShape(size, r) {
  const w = size / 2, s = new THREE.Shape();
  s.moveTo(-w + r, -w);
  s.lineTo(w - r, -w); s.absarc(w - r, -w + r, r, -Math.PI / 2, 0, false);
  s.lineTo(w, w - r); s.absarc(w - r, w - r, r, 0, Math.PI / 2, false);
  s.lineTo(-w + r, w); s.absarc(-w + r, w - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-w, -w + r); s.absarc(-w + r, -w + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

function stickerGeometry(size, r) {
  return new THREE.ShapeGeometry(stickerShape(size, r), 6);
}

// The halo: a rounded-square band that sits in the black gutter around a
// sticker, drawn as one shape with the sticker's own outline punched out of it.
// A wireframe box would have been the obvious way to ring a cubie, but
// LineBasicMaterial ignores `linewidth` on virtually every WebGL platform, so
// the stroke would come out a hairline however thick it was asked to be. A mesh
// takes its thickness from geometry, which nothing can override.
function ringGeometry(size, r, w, gap) {
  const inner = size + gap * 2;
  const outer = stickerShape(inner + w * 2, r + gap + w);
  outer.holes.push(stickerShape(inner, r + gap));
  return new THREE.ShapeGeometry(outer, 6);
}

const STICKER_XFORM = {
  U: { p: [0, 0.503, 0], r: [-Math.PI / 2, 0, 0] },
  D: { p: [0, -0.503, 0], r: [Math.PI / 2, 0, 0] },
  R: { p: [0.503, 0, 0], r: [0, Math.PI / 2, 0] },
  L: { p: [-0.503, 0, 0], r: [0, -Math.PI / 2, 0] },
  F: { p: [0, 0, 0.503], r: [0, 0, 0] },
  B: { p: [0, 0, -0.503], r: [0, Math.PI, 0] }
};

// Every sticker gets a twin floating straight out along its own normal. The
// twins of a face land on one plane, so the three faces turned away from the
// camera read as flat 3×3 panels beside the cube — the back of the cube seen
// through it. Only the turned-away ones are shown; the rest stay hidden so they
// don't hang in front of the faces they belong to.
const HOVER = 2;

function buildModel(opts = {}) {
  const finish = opts.finish || 'flat';
  const gap = opts.gap != null ? opts.gap : 0.78;
  const group = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(1, 1, 1);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.7, metalness: 0 });
  const radius = opts.radius != null ? opts.radius : 0.07;
  const geo = stickerGeometry(gap, radius);
  const ringGeo = ringGeometry(gap, radius, HALO_WIDTH, HALO_GAP);
  const ringMat = new THREE.MeshBasicMaterial({ color: HALO_COLOR, side: THREE.DoubleSide });
  const cubies = [];
  const stickers = [];
  const ghosts = [];
  let id = 0;
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    const c = new THREE.Group();
    c.position.set(x, y, z);
    c.userData = { id: id++, home: [x, y, z] };
    c.add(new THREE.Mesh(bodyGeo, bodyMat));
    const faces = [];
    if (y === 1) faces.push('U'); if (y === -1) faces.push('D');
    if (x === 1) faces.push('R'); if (x === -1) faces.push('L');
    if (z === 1) faces.push('F'); if (z === -1) faces.push('B');
    faces.forEach(f => {
      const base = new THREE.Color(FACE_COLORS[f]);
      const mat = stickerMaterial(finish, base.clone());
      const m = new THREE.Mesh(geo, mat);
      const t = STICKER_XFORM[f];
      m.position.set(t.p[0], t.p[1], t.p[2]);
      m.rotation.set(t.r[0], t.r[1], t.r[2]);
      m.userData = { face: f, base, cubie: c.userData.id };
      c.add(m);
      stickers.push(m);
      // Shares its sticker's geometry, but carries its own lighter material —
      // paintGhost keeps the two in step through dimming and finish changes.
      const k = HOVER / 0.503;
      const g = new THREE.Mesh(geo, stickerMaterial(finish, base.clone()));
      g.position.set(t.p[0] * k, t.p[1] * k, t.p[2] * k);
      g.rotation.copy(m.rotation);
      g.visible = false;
      m.userData.ghost = g;
      paintGhost(m);
      c.add(g);
      ghosts.push(g);
      // Each halo band hangs off the sticker it rings rather than off the cubie,
      // so it inherits the sticker's place on the face for free — and the ghost's
      // band, being a child of the ghost, is hidden whenever stepHover hides the
      // panel it belongs to. Lifted clear of the black body so the two never
      // fight over the same depth.
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.z = 0.004;
      ring.visible = false;
      m.add(ring);
      const ghostRing = new THREE.Mesh(ringGeo, ringMat);
      ghostRing.visible = false;
      g.add(ghostRing);
      m.userData.ring = ring;
      m.userData.ghostRing = ghostRing;
    });
    group.add(c);
    cubies.push(c);
  }
  group.userData = { cubies, stickers, ghosts, bodyGeo, bodyMat, geo, ringGeo, ringMat };
  return group;
}

// Two-sided: a hovering panel is always seen from its back, and the cube's own
// stickers hide their back inside the opaque body.
function stickerMaterial(finish, color) {
  return finish === 'clay'
    ? new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0, side: THREE.DoubleSide })
    : new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
}

// A panel is a fifth of the way to white, so it reads as a lighter echo of the
// face rather than a second cube. Follows whatever colour the sticker is
// wearing right now — mid-fade, dimmed or full.
const HOVER_LIGHTEN = 0.2;
const WHITE = new THREE.Color(0xffffff);

function paintGhost(m) {
  m.userData.ghost.material.color.copy(m.material.color).lerp(WHITE, HOVER_LIGHTEN);
}

function bake(cubies, axisV, angle) {
  const q = new THREE.Quaternion().setFromAxisAngle(axisV, angle);
  cubies.forEach(c => {
    c.position.applyQuaternion(q);
    c.position.set(Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z));
    c.quaternion.premultiply(q).normalize();
    c.updateMatrix();
  });
}

function layerOf(model, spec) {
  const key = spec.axis;
  return model.userData.cubies.filter(c => {
    const v = key === 'x' ? c.position.x : key === 'y' ? c.position.y : c.position.z;
    return spec.layers.indexOf(Math.round(v)) !== -1;
  });
}

function applyInstant(model, tokens) {
  parseMoves(tokens).forEach(tok => {
    const spec = moveSpec(tok);
    const a = AXIS_VEC[spec.axis];
    bake(layerOf(model, spec), new THREE.Vector3(a[0], a[1], a[2]), spec.angle);
  });
}

function resetModel(model) {
  model.userData.cubies.forEach(c => {
    c.position.set(c.userData.home[0], c.userData.home[1], c.userData.home[2]);
    c.quaternion.identity();
    c.updateMatrix();
  });
}

// Which cubies does this sequence actually touch? That set stays in colour.
export function touchedIds(model, tokens) {
  const pos = new Map();
  model.userData.cubies.forEach(c => pos.set(c.userData.id, c.position.clone()));
  const touched = new Set();
  parseMoves(tokens).forEach(tok => {
    const spec = moveSpec(tok);
    const a = AXIS_VEC[spec.axis];
    const axisV = new THREE.Vector3(a[0], a[1], a[2]);
    const hits = [];
    pos.forEach((p, id) => {
      const v = spec.axis === 'x' ? p.x : spec.axis === 'y' ? p.y : p.z;
      if (spec.layers.indexOf(Math.round(v)) !== -1) hits.push(id);
    });
    hits.forEach(id => {
      touched.add(id);
      const p = pos.get(id).applyAxisAngle(axisV, spec.angle);
      p.set(Math.round(p.x), Math.round(p.y), Math.round(p.z));
    });
  });
  return touched;
}

// Which cubies did the author single out? `tokens` name slots — 'UF', 'DFR',
// 'R' — as they stand in the case position, i.e. after the setup has run, which
// is what an author reads off the screen. A trailing '*' means the whole layer
// of that face, so 'D*' is the nine bottom cubies. Resolution happens once, on
// load, and yields cubie ids, so a piece stays lit while it travels.
const SLOT_VEC = { U: [0, 1, 0], D: [0, -1, 0], R: [1, 0, 0], L: [-1, 0, 0], F: [0, 0, 1], B: [0, 0, -1] };

export function keepIds(model, tokens) {
  const want = (tokens || []).map(tok => {
    const layer = tok.indexOf('*') !== -1;
    const v = [0, 0, 0];
    for (const ch of tok) {
      const a = SLOT_VEC[ch];
      if (a) { v[0] += a[0]; v[1] += a[1]; v[2] += a[2]; }
    }
    return { v, layer, axis: layer ? v.findIndex(n => n !== 0) : -1 };
  });
  const out = new Set();
  model.userData.cubies.forEach(c => {
    const p = [Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z)];
    want.forEach(w => {
      const hit = w.layer
        ? p[w.axis] === w.v[w.axis]
        : p[0] === w.v[0] && p[1] === w.v[1] && p[2] === w.v[2];
      if (hit) out.add(c.userData.id);
    });
  });
  return out;
}

// The flat OLL/PLL diagram for a case: the nine U-facing stickers plus the
// twelve side stickers of the top layer, as 1-based cells of a 5x5 grid whose
// outer ring holds the tabs. Derived from `setup` rather than authored, so the
// badge cannot drift from the animation. The scratch model is built on first
// use: buildModel makes plain THREE objects and needs no GL context, but doing
// it lazily also keeps validate.mjs's window.THREE stub out of the way.
let patternModel = null;

export function topFacePattern(spec) {
  if (!patternModel) patternModel = buildModel({ gap: 0.76, radius: 0.05 });
  const model = patternModel;
  resetModel(model);
  applyInstant(model, spec.setup != null ? spec.setup : invertMoves(spec.moves));

  const v = new THREE.Vector3();
  const norm = m => {
    const h = SLOT_VEC[m.userData.face];
    v.set(h[0], h[1], h[2]).applyQuaternion(m.parent.quaternion);
    return [Math.round(v.x), Math.round(v.y), Math.round(v.z)];
  };
  const pos = m => [Math.round(m.parent.position.x), Math.round(m.parent.position.y), Math.round(m.parent.position.z)];

  // The up colour is whatever the U centre wears after the setup, so a case set
  // up with a different rotation still reads correctly.
  const centreSticker = model.userData.stickers.find(m => {
    const p = pos(m), n = norm(m);
    return p[0] === 0 && p[1] === 1 && p[2] === 0 && n[1] === 1;
  });
  const upFace = centreSticker ? centreSticker.userData.face : 'U';
  const upColor = FACE_COLORS[upFace];

  // Cells and tabs are coloured by different rules, deliberately: OLL is read
  // off the 3x3 face, where all that matters is oriented-up vs not, so cells
  // stay binary (up-face letter or 'off'). PLL runs after OLL, so by then the
  // whole top face is already the up colour and a binary tab would make every
  // PLL case look identical — recognition there comes from the pattern of
  // colour blocks and headlights around the ring, so tabs carry the sticker's
  // own true face colour and are never 'off'.
  const cells = [], tabs = [];
  model.userData.stickers.forEach(m => {
    const p = pos(m), n = norm(m);
    if (p[1] !== 1) return;
    if (n[1] === 1) {
      // Face cell: back row first, so row = z + 3 and column = x + 3.
      const face = FACE_COLORS[m.userData.face] === upColor ? upFace : 'off';
      cells.push({ r: p[2] + 3, c: p[0] + 3, face });
    } else if (n[1] === 0) {
      // Tab: pushed out to the ring on whichever side the sticker points.
      const r = n[2] !== 0 ? (n[2] < 0 ? 1 : 5) : p[2] + 3;
      const c = n[0] !== 0 ? (n[0] < 0 ? 1 : 5) : p[0] + 3;
      tabs.push({ r, c, face: m.userData.face });
    }
  });
  return { cells, tabs };
}

// What stays in colour: an explicit `keep` list if the algorithm has one,
// nothing dimmed at all when `dim` is false, otherwise the pieces the moves
// physically touch.
function relevantFor(model, alg) {
  if (alg.dim === false) return null;
  if (alg.keep) return keepIds(model, alg.keep);
  return touchedIds(model, alg.moves);
}

// The halo set, resolved the same way `keep` is: slot names read in the case
// position, turned into cubie ids once. Ids rather than slots is the whole
// point — the ring is bound to the piece, so it travels with it through every
// turn instead of staying parked on a square of space.
function focusFor(model, alg) {
  return alg.focus && alg.focus.length ? keepIds(model, alg.focus) : null;
}

function paintFocus(model, focus) {
  model.userData.stickers.forEach(m => {
    const on = !!(focus && focus.has(m.userData.cubie));
    m.userData.ring.visible = on;
    m.userData.ghostRing.visible = on;
  });
}

// Default camera swing: the front-right corner faces the viewer. A case whose
// action happens on the left face asks for the mirror of it (`view: 'left'`),
// so the slot being filled is in sight from the first move to the last.
const HOME_THETA = 0.68;
const viewTheta = alg => (alg && alg.view === 'left' ? -HOME_THETA : HOME_THETA);

// ------------------------------------------------------------------- engine
export class CubeEngine {
  constructor(host, opts = {}) {
    this.host = host;
    this.opts = opts;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.speed = 1;
    this.moves = [];
    this.setup = [];
    this.index = 0;
    this.relevant = null;
    this.busy = false;
    this.chain = Promise.resolve();

    this.scene = new THREE.Scene();
    this.model = buildModel({ finish: opts.finish });
    this.scene.add(this.model);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.86));
    const d1 = new THREE.DirectionalLight(0xffffff, 0.5); d1.position.set(4, 7, 6);
    const d2 = new THREE.DirectionalLight(0xffffff, 0.26); d2.position.set(-5, -2, -4);
    this.scene.add(d1, d2);

    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    this.home = { theta: HOME_THETA, phi: 1.03, r: 9.6 };
    this.sph = Object.assign({}, this.home);
    this.want = Object.assign({}, this.home);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    const cv = this.renderer.domElement;
    cv.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;cursor:grab';
    host.appendChild(cv);

    this.resize();
    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(host);
    this.bindPointer(cv);
    this.tick = this.tick.bind(this);
    this.raf = requestAnimationFrame(this.tick);
  }

  resize() {
    const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    this.camera.aspect = aspect;
    // Fit the cube's bounding sphere (radius ~1.85) inside the frustum on both axes,
    // with a comfortable margin — independent of how wide/tall the host is.
    const vFov = this.camera.fov * Math.PI / 180;
    const halfExtent = 1.85 * 1.2 * 3 / 1.1;
    const rForHeight = halfExtent / Math.tan(vFov / 2);
    const hFovTan = Math.tan(vFov / 2) * aspect;
    const rForWidth = halfExtent / hFovTan;
    const next = Math.min(34, Math.max(6.4, Math.max(rForHeight, rForWidth)));
    const ratio = this.want.r / this.home.r;
    this.home.r = next;
    this.want.r = Math.min(34, Math.max(6.4, next * (this._zoomed ? ratio : 1)));
    this.camera.updateProjectionMatrix();
  }

  bindPointer(cv) {
    let drag = null;
    const down = e => {
      drag = { x: e.clientX, y: e.clientY, t: this.want.theta, p: this.want.phi };
      cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing';
    };
    const move = e => {
      if (!drag) return;
      this.want.theta = drag.t - (e.clientX - drag.x) * 0.0085;
      this.want.phi = Math.min(Math.PI - 0.22, Math.max(0.22, drag.p - (e.clientY - drag.y) * 0.0085));
    };
    const up = e => { drag = null; cv.style.cursor = 'grab'; try { cv.releasePointerCapture(e.pointerId); } catch (_) {} };
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      this._zoomed = true;
      this.want.r = Math.min(34, Math.max(6.4, this.want.r + e.deltaY * 0.006));
    }, { passive: false });
    cv.addEventListener('dblclick', () => this.resetView());
    this._cv = cv;
  }

  // Send the camera back to its default angle and distance. tick() eases
  // `sph` toward `want`, so the view glides home instead of snapping.
  resetView() {
    this._zoomed = false;
    this.want.theta = this.home.theta;
    this.want.phi = this.home.phi;
    this.want.r = this.home.r;
  }

  tick() {
    this.raf = requestAnimationFrame(this.tick);
    const s = this.sph, w = this.want;
    const moved = Math.abs(s.theta - w.theta) + Math.abs(s.phi - w.phi) + Math.abs(s.r - w.r) > 0.0004;
    if (moved) {
      s.theta += (w.theta - s.theta) * 0.16;
      s.phi += (w.phi - s.phi) * 0.16;
      s.r += (w.r - s.r) * 0.16;
    }
    this.camera.position.set(
      s.r * Math.sin(s.phi) * Math.sin(s.theta),
      s.r * Math.cos(s.phi),
      s.r * Math.sin(s.phi) * Math.cos(s.theta)
    );
    this.camera.lookAt(0, 0, 0);
    if (this.colorUntil && performance.now() < this.colorUntil) this.stepColors();
    this.stepHover();
    this.renderer.render(this.scene, this.camera);
    // Runs every frame: React re-renders rewrite the guide spans' style attribute,
    // so the transforms have to be re-applied unconditionally.
    this.updateGuide();
  }

  // -------------------------------------------------------------- dimming
  stepColors() {
    const dim = new THREE.Color(DIM_COLOR);
    this.model.userData.stickers.forEach(m => {
      const want = (this.relevant && !this.relevant.has(m.userData.cubie)) ? dim : m.userData.base;
      m.material.color.lerp(want, 0.16);
      paintGhost(m);
    });
  }

  // A hovering twin shows only while its sticker faces away from the camera,
  // which is decided fresh every frame: the camera swings, and so do the
  // stickers as layers turn.
  stepHover() {
    const n = this._hn || (this._hn = new THREE.Vector3());
    const p = this._hp || (this._hp = new THREE.Vector3());
    const cam = this.camera.position;
    this.model.userData.ghosts.forEach(g => {
      g.getWorldDirection(n);
      g.getWorldPosition(p);
      g.visible = n.dot(p.sub(cam)) > 0;
    });
  }

  setFocus(set) {
    this.focus = set && set.size ? set : null;
    paintFocus(this.model, this.focus);
  }

  setRelevant(set) {
    this.relevant = set && set.size && set.size < 27 ? set : null;
    this.colorUntil = performance.now() + 700;
    if (this.reduced) {
      const dim = new THREE.Color(DIM_COLOR);
      this.model.userData.stickers.forEach(m => {
        const want = (this.relevant && !this.relevant.has(m.userData.cubie)) ? dim : m.userData.base;
        m.material.color.copy(want);
        paintGhost(m);
      });
      this.colorUntil = 0;
    }
  }

  // ------------------------------------------------------------ orientation
  attachGuide(el) { this.guide = el; this._guideDirty = true; }

  updateGuide() {
    if (!this.guide) return;
    const R = 26;
    const o = new THREE.Vector3(0, 0, 0).project(this.camera);
    ['U', 'F', 'R'].forEach(k => {
      const el = this.guide.querySelector('[data-ax="' + k + '"]');
      if (!el) return;
      const v = k === 'U' ? new THREE.Vector3(0, 1.4, 0) : k === 'F' ? new THREE.Vector3(0, 0, 1.4) : new THREE.Vector3(1.4, 0, 0);
      const depth = v.clone().applyMatrix4(this.camera.matrixWorldInverse || new THREE.Matrix4().copy(this.camera.matrixWorld).invert()).z;
      const p = v.project(this.camera);
      let dx = p.x - o.x, dy = -(p.y - o.y);
      const len = Math.hypot(dx, dy) || 1;
      dx = dx / len * R; dy = dy / len * R;
      el.style.transform = 'translate(-50%,-50%) translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px)';
      el.style.opacity = depth > 0 ? '0.34' : '1';
    });
  }

  // ---------------------------------------------------------------- moves
  duration(turns) {
    if (this.reduced) return 0;
    return (turns === 2 ? 500 : 350) / this.speed;
  }

  animate(tok) {
    const spec = moveSpec(tok);
    const a = AXIS_VEC[spec.axis];
    const axisV = new THREE.Vector3(a[0], a[1], a[2]);
    const cubies = layerOf(this.model, spec);
    const dur = this.duration(spec.turns);
    if (!dur) { bake(cubies, axisV, spec.angle); return Promise.resolve(); }
    const pivot = new THREE.Group();
    this.model.add(pivot);
    cubies.forEach(c => pivot.add(c));
    const t0 = performance.now();
    return new Promise(res => {
      const run = () => {
        const k = Math.min(1, (performance.now() - t0) / dur);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; // ease-in-out cubic
        pivot.setRotationFromAxisAngle(axisV, spec.angle * e);
        if (k < 1) return requestAnimationFrame(run);
        pivot.rotation.set(0, 0, 0);
        pivot.quaternion.identity();
        cubies.forEach(c => this.model.add(c));
        this.model.remove(pivot);
        bake(cubies, axisV, spec.angle);
        res();
      };
      run();
    });
  }

  enqueue(fn) {
    this.chain = this.chain.then(fn).catch(() => {});
    return this.chain;
  }

  load(alg) {
    return this.enqueue(() => {
      this.moves = parseMoves(alg.moves);
      this.setup = parseMoves(alg.setup != null ? alg.setup : invertMoves(alg.moves));
      resetModel(this.model);
      applyInstant(this.model, this.setup);
      this.home.theta = viewTheta(alg);
      this.want.theta = this.home.theta;
      this.index = 0;
      this.setRelevant(relevantFor(this.model, alg));
      this.setFocus(focusFor(this.model, alg));
      // A pattern's setup is empty, so move one is a plain solved cube -- the
      // same picture for all of them, and nothing to tell one apart from
      // another while browsing. `open: 'end'` opens on the finished pattern
      // instead; Replay and "reset to start" both run it from solved. Ordered
      // after setFocus for the reason MiniPool resolves focus first: focus
      // names slots as they stand in the case position.
      if (alg.open === 'end') {
        applyInstant(this.model, this.moves);
        this.index = this.moves.length;
      }
      this.emit();
    });
  }

  goTo(n, animate) {
    const target = Math.max(0, Math.min(this.moves.length, n));
    return this.enqueue(async () => {
      if (target === this.index) return;
      if (animate && Math.abs(target - this.index) === 1) {
        if (target > this.index) await this.animate(this.moves[this.index]);
        else await this.animate(invertMoves([this.moves[this.index - 1]])[0]);
        this.index = target;
        this.emit();
        return;
      }
      while (this.index < target) { applyInstant(this.model, [this.moves[this.index]]); this.index++; }
      while (this.index > target) { applyInstant(this.model, invertMoves([this.moves[this.index - 1]])); this.index--; }
      this.emit();
    });
  }

  step(dir) { return this.goTo(this.index + dir, true); }
  reset() { return this.goTo(0, false); }
  emit() { if (this.opts.onIndex) this.opts.onIndex(this.index, this.moves.length); }

  setFinish(finish) {
    if (finish === this._finish) return;
    this._finish = finish;
    this.model.userData.stickers.forEach(m => {
      const g = m.userData.ghost;
      const next = stickerMaterial(finish, m.material.color.clone());
      const nextGhost = stickerMaterial(finish, g.material.color.clone());
      m.material.dispose();
      g.material.dispose();
      m.material = next;
      g.material = nextGhost;
    });
    this.colorUntil = performance.now() + 700;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    if (this._ro) this._ro.disconnect();
    this.model.userData.stickers.forEach(m => { m.material.dispose(); m.userData.ghost.material.dispose(); });
    this.model.userData.geo.dispose();
    this.model.userData.ringGeo.dispose();
    this.model.userData.ringMat.dispose();
    this.model.userData.bodyGeo.dispose();
    this.model.userData.bodyMat.dispose();
    this.renderer.dispose();
    if (this._cv && this._cv.parentNode) this._cv.parentNode.removeChild(this._cv);
  }
}

// ------------------------------------------------- shared thumbnail renderer
// One offscreen WebGL context + one model, blitted into any number of 2D canvases.
export class MiniPool {
  constructor(size = 256) {
    this.size = size;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(size, size, false);
    this.scene = new THREE.Scene();
    this.model = buildModel({ gap: 0.76, radius: 0.05 });
    this.scene.add(this.model);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const d = new THREE.DirectionalLight(0xffffff, 0.42); d.position.set(4, 7, 6);
    this.scene.add(d);
    this.camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  }

  draw(canvas, spec) {
    if (!canvas) return;
    const setup = spec.setup != null ? spec.setup : invertMoves(spec.moves);
    resetModel(this.model);
    applyInstant(this.model, setup);
    // Resolved here, before any `thumb: 'end'` moves run, because `focus` names
    // slots as they stand in the case position. Ids survive the extra moves, so
    // an end-state thumbnail still rings the piece the author meant.
    const focus = focusFor(this.model, spec);
    // A case's thumbnail is the position you have to recognise, so it stops at
    // the setup. A pattern has nothing to recognise -- its setup is empty and
    // the picture would be a solved cube -- so `thumb: 'end'` runs the moves too
    // and shows what you are aiming for.
    if (spec.thumb === 'end') applyInstant(this.model, spec.moves);
    paintFocus(this.model, focus);
    const rel = relevantFor(this.model, spec);
    const dim = new THREE.Color(DIM_COLOR);
    this.model.userData.stickers.forEach(m => {
      const on = !rel || rel.size >= 27 || rel.has(m.userData.cubie);
      m.material.color.copy(on ? m.userData.base : dim);
      paintGhost(m);
    });
    // Honour `view` here too, or a mirrored case shows its slot from one side on
    // the thumbnail and the other on the stage.
    const theta = viewTheta(spec) + (spec.theta || 0), phi = 1.0;
    const r = 10.4;
    this.camera.position.set(r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.cos(theta));
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
    // Square buffer in, square buffer out, centred by object-fit rather than by
    // arithmetic. Sizing the backing store from clientWidth raced the panel's
    // layout: measure a box a few pixels wider than the one that finally lays
    // out and every thumbnail is squeezed horizontally by the difference.
    const px = this.size;
    canvas.width = px; canvas.height = px;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, px, px);
    ctx.drawImage(this.renderer.domElement, 0, 0, px, px);
  }

  dispose() {
    this.model.userData.stickers.forEach(m => { m.material.dispose(); m.userData.ghost.material.dispose(); });
    this.model.userData.geo.dispose();
    this.model.userData.ringGeo.dispose();
    this.model.userData.ringMat.dispose();
    this.model.userData.bodyGeo.dispose();
    this.model.userData.bodyMat.dispose();
    this.renderer.dispose();
  }
}
