import { expect, it } from 'vitest';
import { balance, eventBalance } from '../src/config';
import { roadScore, scoreComboPitch } from '../src/scoring';
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

it('builds seeded multi-lane score trails without moving them off hazards', () => {
  const allLaneCounts = new Set<number>();
  for (const seed of [1, 17, 42]) {
    const points = fillWorld(initialWorld(seed, true), 1100).entities.filter(e => e.kind === 'score');
    expect(new Set(points.map(e => e.id)).size).toBe(points.length);
    const stations = new Map<number, number>();
    for (const point of points) stations.set(point.distance, (stations.get(point.distance) ?? 0) + 1);
    for (const count of stations.values()) allLaneCounts.add(count);
    expect([...stations.keys()].some((distance, index, all) => index > 0 && distance - all[index - 1] === roadScore.gap)).toBe(true);
  }
  expect(allLaneCounts).toEqual(new Set([1, 2, 3]));
});

it('mostly offers one-lane trails while retaining occasional two- and three-lane choices', () => {
  const points = fillWorld(initialWorld(17, true), 3600).entities.filter(e => e.kind === 'score');
  const counts = new Map<number, number>();
  for (const point of points) counts.set(point.distance, (counts.get(point.distance) ?? 0) + 1);
  const stations = [...counts.values()];
  expect(stations.filter(count => count === 1).length / stations.length).toBeGreaterThan(.8);
  expect(stations).toContain(2);
  expect(stations).toContain(3);
});

it('raises one cue per collected station, caps pitch, and resets after a missed station', () => {
  const base = initialRun(17);
  const points = Array.from({ length: 12 }, (_, index) => entity('score', `point-${index}`, 96 + index * 8,
    index === 9 ? balance.laneWidth : 0));
  points.push(entity('score', 'same-station', 96, .2));
  let run: Run = { ...base, phase: 'running', distance: 90,
    world: { ...base.world, entities: points, nextHazard: 1e9, nextSpecial: 1e9, nextScore: 1e9,
      nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 } };
  while (run.distance < 165) run = stepRun(run, noInput());
  expect(run.scorePickupSequence).toBe(9);
  expect(run.scoreCombo).toBe(8);
  expect(run.scorePickupLevel).toBe(8);
  expect(run.score).toBe(10 * roadScore.value); // Two gems on the first station, one sound.
  while (run.distance < 174) run = stepRun(run, noInput());
  expect(run.scoreCombo).toBe(0);
  while (run.distance < 186) run = stepRun(run, noInput());
  expect(run.scorePickupSequence).toBe(11);
  expect(run.scorePickupLevel).toBe(2);
  expect(scoreComboPitch(1)).toBeLessThan(scoreComboPitch(8));
  expect(scoreComboPitch(1)).toBeLessThan(.9);
  expect(scoreComboPitch(8)).toBeLessThan(1.5);
  expect(scoreComboPitch(20)).toBe(scoreComboPitch(8));
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
