import { expect, it } from 'vitest';
import { balance, eventBalance } from '../src/config';
import { roadScore } from '../src/scoring';
import { specialPlan } from '../src/special-events';
import { noInput } from '../src/simulation';
import { initialRun, stepRun, type Run } from '../src/survival';
import { entity, fillWorld, initialWorld } from '../src/world';

it('grants points only for a swept on-road pickup, once, without changing money income', () => {
  const pickup = entity('score', 'point', 4, 0);
  const run = initialRun(17);
  const fixture = { ...run, phase: 'running' as const,
    world: { ...run.world, entities: [pickup], nextHazard: 1e9, nextSpecial: 1e9, nextScore: 1e9,
      nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 } };
  let driven: Run = fixture;
  for (let i = 0; i < 60; i++) driven = stepRun(driven, noInput());
  expect(driven.score).toBe(roadScore.value);
  expect(driven.world.entities[0].consumed).toBe(true);
  expect(driven.money).toBeCloseTo(balance.initialMoney + driven.distance * balance.moneyPerMeter);
  for (let i = 0; i < 60; i++) driven = stepRun(driven, noInput());
  expect(driven.score).toBe(roadScore.value);
  let missed: Run = { ...fixture, x: balance.laneWidth };
  for (let i = 0; i < 60; i++) missed = stepRun(missed, noInput());
  expect(missed.score).toBe(0);
});

it('can place score on a hazardous patch without removing either object', () => {
  const samples = Array.from({ length: 12 }, (_, seed) => fillWorld(initialWorld(seed + 1, true), 900).entities);
  const overlap = samples.some(entities => entities.some(point => point.kind === 'score' && entities.some(hazard =>
    (hazard.kind === 'water' || hazard.kind === 'pothole') &&
    Math.abs(point.distance - hazard.distance) <= (point.length + hazard.length) / 2 &&
    Math.abs(point.x - hazard.x) <= (point.width + hazard.width) / 2)));
  expect(overlap).toBe(true);
});

it('lets a player take points while paying the water cost of the same lane', () => {
  const base = initialRun(17);
  const water = entity('water', 'wet', 4, 0);
  const point = entity('score', 'wet-point', 4, 0);
  const run: Run = { ...base, phase: 'running', world: { ...base.world,
    entities: [water, point], nextHazard: 1e9, nextSpecial: 1e9, nextScore: 1e9,
    nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 } };
  let after = run;
  for (let i = 0; i < 60; i++) after = stepRun(after, noInput());
  expect(after.score).toBe(roadScore.value);
  expect(after.fuel).toBeLessThan(base.fuel - after.distance * balance.fuelPerMeter);
  expect(after.money).toBeCloseTo(base.money + after.distance * balance.moneyPerMeter);
});

it('keeps all special outcomes in a seeded cycle while tightening the normal schedule', () => {
  for (const seed of [1, 17, 42]) {
    const cycle = Array.from({ length: 12 }, (_, index) => specialPlan(index, seed).kind);
    for (const kind of ['police', 'militia', 'train'] as const)
      expect(cycle.filter(value => value === kind)).toHaveLength(2);
    expect(cycle.filter(value => value === 'accident')).toHaveLength(2);
    expect(specialPlan(1, seed).distance - specialPlan(0, seed).distance).toBe(eventBalance.gap);
    expect(specialPlan(1, seed).distance).toBeLessThan(specialPlan(1, seed, true).distance);
  }
});

it('militia charge a floor below 220 and half of larger wallets, without a cap', () => {
  for (const money of [0, 100, 220, 220.01, 2000]) {
    const base = initialRun(17);
    const guard = entity('militia', 'guard', 0, 0);
    const run = { ...base, phase: 'running' as const, money,
      world: { ...base.world, entities: [guard], nextSpecial: 1e9, nextHazard: 1e9,
        nextScore: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 } };
    const after = stepRun(run, noInput());
    const fine = money > 220 ? money / 2 : Math.min(110, money);
    expect(after.money).toBeCloseTo(money - fine + after.distance * balance.moneyPerMeter);
    expect(after.feedbackCounts.militia).toBe(1);
  }
});
