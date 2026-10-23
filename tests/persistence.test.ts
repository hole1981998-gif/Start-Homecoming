// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { badges, leaderboard, recordResult, results, saveSeen, seenCards, showFlavor, saveFlavor } from '../src/persistence';
import type { RunResult } from '../src/survival';
it('validates corrupt saves and records a terminal run once by runId', () => {
  localStorage.clear(); localStorage.setItem('dvn.results.v1', '{broken');
  expect(results()).toEqual([]);
  const result: RunResult = { runId: 'a', seed: 17, config: 'p2.0', reason: 'damage', distance: 100, score: 100, money: 200, seconds: 10 };
  expect(recordResult(result)).toBe(true); expect(recordResult(result)).toBe(true); expect(results()).toEqual([result]);
  expect(recordResult({ ...result, runId: 'b', score: NaN })).toBe(false); expect(results()).toHaveLength(1);
  localStorage.setItem('dvn.cards.v1', '["water","unknown",null,123]'); expect([...seenCards()]).toEqual(['water']);
  saveSeen(new Set(['fuel', 'repair', 'wind'])); expect([...seenCards()]).toEqual(['fuel', 'repair', 'wind']);
  expect(showFlavor()).toBe(true); saveFlavor(false); expect(showFlavor()).toBe(false);
});

it('saves the home badge and one local leaderboard entry for a secret terminal result', () => {
  localStorage.clear();
  const base: RunResult = { runId: 'ordinary', seed: 17, config: 'p7-secret-1', reason: 'train',
    distance: 200, score: 200, money: 0, seconds: 20 };
  expect(recordResult(base)).toBe(true);
  const secret: RunResult = { ...base, runId: 'home-run', reason: 'secret', distance: 300, score: 300 };
  expect(recordResult(secret)).toBe(true);
  expect(recordResult(secret)).toBe(true);
  expect(results()).toHaveLength(2);
  expect(leaderboard().map(result => result.runId)).toEqual(['home-run', 'ordinary']);
  expect([...badges()]).toEqual(['home']);
  localStorage.setItem('dvn.badges.v1', '{bad');
  expect([...badges()]).toEqual([]);
  expect(recordResult(secret)).toBe(true);
  expect([...badges()]).toEqual(['home']);
});

it('keeps legacy results while ranking the speed rules separately', () => {
  localStorage.clear();
  const legacy: RunResult = { runId: 'legacy', seed: 17, config: 'old', reason: 'fuel',
    distance: 500, score: 500, money: 0, seconds: 40 };
  const speed: RunResult = { ...legacy, runId: 'speed', scoreVersion: 'speed-v1', score: 300 };
  expect(recordResult(legacy)).toBe(true);
  expect(recordResult(speed)).toBe(true);
  expect(results()).toHaveLength(2);
  expect(leaderboard('legacy-v1').map(r => r.runId)).toEqual(['legacy']);
  expect(leaderboard('speed-v1').map(r => r.runId)).toEqual(['speed']);
});
