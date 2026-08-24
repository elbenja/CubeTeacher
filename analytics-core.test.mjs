import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createHeartbeat, IDLE_MS, eventPath, timeBucket, createOnce,
  milestonesCrossed, groupComplete
} from './analytics-core.mjs';

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

test('eventPath joins parts with slashes', () => {
  assert.equal(eventPath('case', 'b-second-layer'), 'case/b-second-layer');
  assert.equal(eventPath('quit', 'a-oll', 'm7'), 'quit/a-oll/m7');
});

test('eventPath slugifies anything that is not already a clean segment', () => {
  // The dashboard groups by exact string, so "Second Layer (F2L)" and
  // "second-layer-f2l" would be two rows for one case.
  assert.equal(eventPath('case', 'Second Layer (F2L)'), 'case/second-layer-f2l');
  assert.equal(eventPath('ui', 'STACK'), 'ui/stack');
});

test('eventPath drops empty parts rather than emitting a double slash', () => {
  assert.equal(eventPath('case', '', 'x'), 'case/x');
  assert.equal(eventPath('case', null), 'case');
});

test('timeBucket puts each duration in exactly one bucket', () => {
  assert.equal(timeBucket(0), '0-15s');
  assert.equal(timeBucket(14), '0-15s');
  assert.equal(timeBucket(15), '15-60s');
  assert.equal(timeBucket(59), '15-60s');
  assert.equal(timeBucket(60), '1-3m');
  assert.equal(timeBucket(179), '1-3m');
  assert.equal(timeBucket(180), '3m+');
  assert.equal(timeBucket(99999), '3m+');
});

test('createOnce reports the first sighting of a key and nothing after', () => {
  const o = createOnce();
  assert.equal(o.first('keyboard'), true);
  assert.equal(o.first('keyboard'), false);
  assert.equal(o.first('keyboard'), false);
  assert.equal(o.first('scrub'), true);
});

test('createOnce re-arms every key after reset', () => {
  const o = createOnce();
  o.first('keyboard');
  o.reset();
  assert.equal(o.first('keyboard'), true);
});

test('milestonesCrossed reports only newly crossed thresholds', () => {
  assert.deepEqual(milestonesCrossed(0, 1, 4), [25]);
  assert.deepEqual(milestonesCrossed(1, 2, 4), [50]);
  assert.deepEqual(milestonesCrossed(2, 2, 4), []);
  assert.deepEqual(milestonesCrossed(3, 4, 4), [100]);
});

test('milestonesCrossed can report two at once on a big jump', () => {
  assert.deepEqual(milestonesCrossed(0, 3, 4), [25, 50]);
});

test('milestonesCrossed is safe before the algorithm list loads', () => {
  assert.deepEqual(milestonesCrossed(0, 0, 0), []);
});

test('groupComplete needs every case in the group', () => {
  const algs = [
    { id: 'a', group: 'beginner' },
    { id: 'b', group: 'beginner' },
    { id: 'c', group: 'advanced' }
  ];
  const done = new Set(['a']);
  assert.equal(groupComplete(algs, 'beginner', x => done.has(x.id)), false);
  done.add('b');
  assert.equal(groupComplete(algs, 'beginner', x => done.has(x.id)), true);
});

test('groupComplete is false for a group with no cases', () => {
  assert.equal(groupComplete([], 'beginner', () => true), false);
});
