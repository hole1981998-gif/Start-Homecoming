import { expect, it } from 'vitest';
import { balance, eventBalance } from '../src/config';
import { roadScore, scoreDistance, scoreIndexAtOrAfter, scorePerMeter } from '../src/scoring';
import { vehicles } from '../src/vehicles';
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
  let empty: Run = { ...fixture, world: { ...fixture.world, entities: [] } };
  for (let i = 0; i < 60; i++) driven = stepRun(driven, noInput());
  for (let i = 0; i < 60; i++) empty = stepRun(empty, noInput());
  expect(driven.score - empty.score).toBeCloseTo(roadScore.value);
  const firstSecondMovementScore = empty.score;
  expect(driven.world.entities[0].consumed).toBe(true);
  expect(driven.popupEvent?.kind).toBe('score');
  const popupSequence = driven.popupEvent?.sequence;
  expect(driven.money).toBeCloseTo(balance.initialMoney + driven.distance * balance.moneyPerMeter);
  for (let i = 0; i < 60; i++) { driven = stepRun(driven, noInput()); empty = stepRun(empty, noInput()); }
  expect(driven.score - empty.score).toBeCloseTo(roadScore.value);
  expect(driven.popupEvent?.sequence).toBe(popupSequence);
  let missed: Run = { ...fixture, x: balance.laneWidth };
  for (let i = 0; i < 60; i++) missed = stepRun(missed, noInput());
  expect(missed.score).toBeCloseTo(firstSecondMovementScore);
});

it('spawns one sparse seeded packet at each stage and inverts its branch index', () => {
  for (const seed of [1, 17, 42]) {
    expect(scoreDistance(0, seed)).toBe(450);
    for (let index = 0; index < 18; index++) {
      const at = scoreDistance(index, seed), next = scoreDistance(index + 1, seed);
      const [minimum, maximum] = roadScore.gaps[at >= 8000 ? 2 : at >= 5000 ? 1 : 0];
      expect(next - at).toBeGreaterThanOrEqual(minimum);
      expect(next - at).toBeLessThanOrEqual(maximum);
      expect(scoreIndexAtOrAfter(at + .01, seed)).toBe(index + 1);
    }
    const world = fillWorld(initialWorld(seed, true), 2200);
    const points = world.entities.filter(e => e.kind === 'score');
    expect(points.length).toBeGreaterThan(1);
    expect(new Set(points.map(e => e.distance)).size).toBe(points.length);
    expect(new Set(points.map(e => e.id)).size).toBe(points.length);
    expect(points.every(e => [-balance.laneWidth, 0, balance.laneWidth].includes(e.x))).toBe(true);
  }
});

it('grants movement score from catalog speed, never at min or while paused', () => {
  const car = vehicles.car4;
  expect(scorePerMeter(car.minSpeed, 0, car)).toBe(0);
  expect(scorePerMeter(car.cruiseSpeed, 0, car)).toBeCloseTo(.2);
  expect(scorePerMeter(car.maxSpeed, 0, car)).toBeCloseTo(.3);
  expect(scorePerMeter(car.maxSpeed * 2, 3, car)).toBeCloseTo(.3 * 1.06);
  const base = initialRun(17), blank = { ...base.world, entities: [], nextHazard: 1e9,
    nextSpecial: 1e9, nextScore: 1e9, nextFuel: 1e9, nextRepair: 1e9,
    nextPassenger: 1e9, nextShopDistance: 1e9 };
  let run: Run = { ...base, phase: 'running', world: blank };
  run = stepRun(run, { ...noInput(), accelerate: true });
  expect(run.score).toBeGreaterThanOrEqual(0);
  const paused = { ...run, phase: 'paused' as const };
  expect(stepRun(paused, noInput())).toEqual(paused);
});

it('plays one pickup cue per packet, with no eight-station combo', () => {
  const base = initialRun(17);
  const points = [entity('score', 'point-0', 4, 0), entity('score', 'point-1', 12, 0)];
  let run: Run = { ...base, phase: 'running', world: { ...base.world, entities: points,
    nextHazard: 1e9, nextSpecial: 1e9, nextScore: 1e9, nextFuel: 1e9,
    nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 } };
  let empty: Run = { ...run, world: { ...run.world, entities: [] } };
  for (let i = 0; i < 120; i++) { run = stepRun(run, noInput()); empty = stepRun(empty, noInput()); }
  expect(run.scorePickupSequence).toBe(2);
  expect(run.scorePickupLevel).toBe(1);
  expect(run.scoreCombo).toBe(0);
  expect(run.score - empty.score).toBeCloseTo(2 * roadScore.value);
});

it('collects a packet crossed in one high-speed tick once and keeps the noforce backup on legacy score', () => {
  const base = initialRun(17), point = entity('score', 'fast-packet', 8, 0);
  const world = { ...base.world, entities: [point], nextHazard: 1e9, nextSpecial: 1e9,
    nextScore: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 };
  const fast = stepRun({ ...base, phase: 'running', speed: 1000, world }, noInput());
  expect(fast.world.entities.find(e => e.id === point.id)?.consumed).toBe(true);
  const sequence = fast.scorePickupSequence;
  expect(stepRun(fast, noInput()).scorePickupSequence).toBe(sequence);
  const backup = initialRun(17, 'backup-score', 'backup');
  const old = stepRun({ ...backup, phase: 'running', world: { ...backup.world, entities: [],
    nextHazard: 1e9, nextSpecial: 1e9, nextScore: 1e9, nextFuel: 1e9,
    nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 } }, noInput());
  expect(old.score).toBeCloseTo(old.distance * balance.scorePerMeter);
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
  expect(after.score).toBeGreaterThan(roadScore.value);
  expect(after.fuel).toBeLessThan(base.fuel - after.distance * balance.fuelPerMeter);
  expect(after.money).toBeCloseTo(base.money + after.distance * balance.moneyPerMeter);
});

it('keeps all special outcomes in a seeded cycle while adding one train', () => {
  for (const seed of [1, 17, 42]) {
    const cycle = Array.from({ length: 25 }, (_, index) => specialPlan(index + 14, seed).kind);
    for (const kind of ['police', 'militia', 'accident'] as const)
      expect(cycle.filter(value => value === kind)).toHaveLength(4);
    expect(cycle.filter(value => value === 'train')).toHaveLength(5);
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
