// The impure half of analytics: GoatCounter, the DOM, and the clock. Every
// export is safe to call when GoatCounter is missing -- which for some
// visitors it will be, because ad blockers catch it. Analytics failing must
// never be visible in the app.

import { createHeartbeat, createOnce, eventPath, timeBucket } from './analytics-core.mjs';

// The site's own GoatCounter endpoint. Public by design -- it ships in the
// page on every GoatCounter site -- so it lives in the repo, not in a secret.
const ENDPOINT = 'https://cubeteacher.goatcounter.com/count';

const heartbeat = createHeartbeat();
const once = createOnce();

let on = false;
let openId = null;
let queue = [];
let tries = 0;
let ticker = null;

// Resolved per call, never cached: count.js is async, so the function does not
// exist for the first moments of the page.
function ready() {
  return typeof window !== 'undefined' &&
    window.goatcounter && typeof window.goatcounter.count === 'function';
}

// Analytics is off for the author. Without this every local run, and every
// browser-driven verification pass, lands in the real dashboard.
function shouldEnable() {
  try {
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    return !local || new URLSearchParams(location.search).has('gc');
  } catch (_) { return false; }
}

function fire(path) {
  try { window.goatcounter.count({ path: path, event: true }); } catch (_) {}
}

export function send(path) {
  if (!on || !path) return;
  // Queued rather than dropped: the very first case event of a cold load fires
  // before count.js has arrived, and it is the one most likely to matter.
  if (!ready()) { queue.push(path); return; }
  // drain()'s retry budget is bounded, so a script that arrives later than that
  // -- slow network rather than blocked outright -- would leave the backlog
  // stranded for the life of the page, losing exactly the first case view the
  // queue exists to protect. Reaching here proves the script is up, so the next
  // event to fire flushes the backlog ahead of itself, in order.
  if (queue.length) drain();
  fire(path);
}

function drain() {
  if (!ready()) {
    // Bounded: if the script is blocked outright it never arrives, and
    // retrying forever would be a timer running for the life of the page.
    if (++tries < 25) setTimeout(drain, 200);
    return;
  }
  const pending = queue;
  queue = [];
  pending.forEach(fire);
}

// count() issues an ordinary request, which the browser cancels while the page
// is going away, so the last -- and most engaged -- case of every session would
// be the one hit that never arrives. A hand-built GET with keepalive survives
// it. sendBeacon is not used: it POSTs, and this endpoint expects a GET.
function fireKeepalive(path) {
  try {
    fetch(ENDPOINT + '?p=' + encodeURIComponent(path) + '&e=1',
      { keepalive: true, mode: 'no-cors' });
  } catch (_) {}
}

export function activity() { heartbeat.activity(); }
export function currentCase() { return openId; }

export function ui(control) {
  if (!openId) return;
  if (once.first(control)) send(eventPath('ui', control));
}

export function openCase(id) {
  closeCase();
  openId = id;
  once.reset();
  heartbeat.reset();
  send(eventPath('case', id));
}

export function closeCase(viaUnload) {
  if (!openId) return;
  const path = eventPath('time', openId, timeBucket(heartbeat.seconds()));
  if (viaUnload) fireKeepalive(path); else send(path);
  // Cleared before returning, so a second pagehide (bfcache restores fire it
  // more than once) cannot double-count the same viewing.
  openId = null;
}

export function watchCube(el) {
  if (!el || !el.addEventListener) return;
  // Rotation lives inside cube-engine's own pointer handling; a listener on the
  // container records that a drag happened without reaching into the engine.
  el.addEventListener('pointerdown', () => { activity(); ui('rotate'); }, { passive: true });
}

export function init() {
  on = shouldEnable();
  if (!on || typeof window === 'undefined') return;

  ['pointerdown', 'keydown', 'wheel'].forEach(evt =>
    window.addEventListener(evt, activity, { passive: true }));

  // Visibility only pauses the clock. The time hit is sent on pagehide alone:
  // flushing on hidden too would end the case while the user is still on it,
  // and every later event for that case would be silently discarded.
  document.addEventListener('visibilitychange', () =>
    heartbeat.setVisible(document.visibilityState === 'visible'));
  window.addEventListener('pagehide', () => closeCase(true));

  ticker = setInterval(() => heartbeat.tick(), 1000);
  drain();
}
