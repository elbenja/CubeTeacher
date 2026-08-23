import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHeartbeat, IDLE_MS } from './analytics-core.mjs';

// A fake clock, so idle behaviour is tested in microseconds rather than minutes.
function clock(start = 0) {
  let t = start;
  return { now: () => t, advance: ms => { t += ms; } };
}

test('counts a tick while visible and recently active', () => {
  const c = clock();
  const h = createHeartbeat({ now: c.now });
  h.tick();
  h.tick();
  assert.equal(h.seconds(), 2);
});

test('counts nothing while the tab is hidden', () => {
  const c = clock();
  const h = createHeartbeat({ now: c.now });
  h.setVisible(false);
  h.tick();
  h.tick();
  assert.equal(h.seconds(), 0);
});

test('stops counting once activity is older than the idle window', () => {
  const c = clock();
  const h = createHeartbeat({ now: c.now });
  h.tick();
  c.advance(IDLE_MS + 1);
  h.tick();
  h.tick();
  assert.equal(h.seconds(), 1);
});

test('does not clamp attentive viewing', () => {
  // The bug this guards: a stopwatch clamped to 60s would report 60 here.
  const c = clock();
  const h = createHeartbeat({ now: c.now });
  for (let i = 0; i < 300; i++) { h.activity(); c.advance(1000); h.tick(); }
  assert.equal(h.seconds(), 300);
});

test('activity resumes counting after an idle stretch', () => {
  const c = clock();
  const h = createHeartbeat({ now: c.now });
  c.advance(IDLE_MS + 1);
  h.tick();
  assert.equal(h.seconds(), 0);
  h.activity();
  h.tick();
  assert.equal(h.seconds(), 1);
});

test('returning to a visible tab counts as activity', () => {
  const c = clock();
  const h = createHeartbeat({ now: c.now });
  h.setVisible(false);
  c.advance(IDLE_MS * 10);
  h.setVisible(true);
  h.tick();
  assert.equal(h.seconds(), 1);
});

test('reset zeroes the count and re-arms activity', () => {
  const c = clock();
  const h = createHeartbeat({ now: c.now });
  h.tick();
  c.advance(IDLE_MS + 1);
  h.reset();
  h.tick();
  assert.equal(h.seconds(), 1);
});
