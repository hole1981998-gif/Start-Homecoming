// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { recordResult, results, saveSeen, seenCards, showFlavor, saveFlavor } from '../src/persistence';
import type { RunResult } from '../src/survival';
it('validates corrupt saves and records a terminal run once by runId', () => {
  localStorage.clear(); localStorage.setItem('dvn.results.v1', '{broken');
  expect(results()).toEqual([]);
  const result: RunResult = { runId: 'a', seed: 17, config: 'p2.0', reason: 'damage', distance: 100, score: 100, money: 200, seconds: 10 };
  expect(recordResult(result)).toBe(true); expect(recordResult(result)).toBe(true); expect(results()).toEqual([result]);
  expect(recordResult({ ...result, runId: 'b', score: NaN })).toBe(false); expect(results()).toHaveLength(1);
  localStorage.setItem('dvn.cards.v1', '["water","unknown",null,123]'); expect([...seenCards()]).toEqual(['water']);
  saveSeen(new Set(['fuel', 'repair'])); expect([...seenCards()]).toEqual(['fuel', 'repair']);
  expect(showFlavor()).toBe(true); saveFlavor(false); expect(showFlavor()).toBe(false);
});
