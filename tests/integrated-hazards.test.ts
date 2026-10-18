import { expect, it } from 'vitest';
import { balance, cargoBalance, forceBalance } from '../src/config';
import { developmentScenario } from '../src/development';
import { initialRun, stepRun, type Run } from '../src/survival';
import { noInput } from '../src/simulation';
import { fillWorld, initialWorld, type Entity } from '../src/world';

function generated(seed: number, branchVariant = 0): Entity[] {
  let world = { ...initialWorld(seed, true), branchVariant };
  const seen = new Map<string, Entity>();
  for (let distance = 0; distance <= 5000; distance += 80) {
    world = fillWorld(world, distance, balance.fuelCapacity, balance.durabilityCapacity, 1,
      undefined, distance / balance.cruiseSpeed);
    for (const entity of world.entities) seen.set(entity.id, entity);
  }
  return [...seen.values()];
}

it('normal generated routes contain countersteerable wind and live same-direction tail-drop sources', () => {
  let windCount = 0, sourceCount = 0;
  for (let seed = 1; seed <= 30; seed++) for (const branchVariant of [0, 1, 2]) {
    const entities = generated(seed, branchVariant);
    const winds = entities.filter(e => e.kind === 'wind');
    const sources = entities.filter(e => e.cargoReleaseAt !== undefined);
    windCount += winds.length; sourceCount += sources.length;
    expect(winds.length).toBeGreaterThan(0);
    expect(sources.length).toBeGreaterThan(0);
    expect(winds.every(e => e.width === forceBalance.windWidth && e.length === forceBalance.zoneLength &&
      Math.abs(e.lateralPush ?? 0) === forceBalance.windPush)).toBe(true);
    expect(sources.every(e => e.kind === 'traffic' && e.x === balance.laneWidth && e.speed > 0 &&
      (e.trafficKind === 'truck' || e.trafficKind === 'container'))).toBe(true);
    expect(winds.every(wind => entities.every(e => !['water', 'pothole', 'jam', 'train', 'accident', 'broken'].includes(e.kind) ||
      Math.abs(e.distance - wind.distance) > (e.length + wind.length) / 2))).toBe(true);
  }
  expect(generated(17).map(e => [e.id, e.kind, e.cargoReleaseAt, e.lateralPush])).toEqual(
    generated(17).map(e => [e.id, e.kind, e.cargoReleaseAt, e.lateralPush]));
  console.log(JSON.stringify({ mode: 'generated integrated route, 0–5000m, no pilot', seeds: 30,
    branchVariants: 3, windCount, sourceCount }));
});

it('the integrated step applies wind and releases cargo from a generated source only once', () => {
  const entities = generated(17);
  const wind = entities.find(e => e.kind === 'wind')!;
  const source = entities.find(e => e.cargoReleaseAt !== undefined)!;
  const base = initialRun(17);
  const quietWorld = { ...base.world, entities: [wind], nextHazard: 1e9, nextSpecial: 1e9,
    nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 };
  const start = { ...base, phase: 'running' as const, world: quietWorld,
    distance: wind.distance - wind.length / 2 - 6 };
  let windy: Run = start, calm: Run = { ...start, world: { ...quietWorld, entities: [] } };
  for (let frame = 0; frame < 90; frame++) {
    windy = stepRun(windy, noInput());
    calm = stepRun(calm, noInput());
  }
  expect(Math.abs(windy.x - calm.x)).toBeGreaterThan(.1);
  const sourceRun = { ...start, distance: source.distance - 80, activeSeconds: source.cargoReleaseAt! - 1,
    world: { ...quietWorld, entities: [{ ...source }] } };
  let run: Run = sourceRun;
  for (let frame = 0; frame < 90; frame++) run = stepRun(run, noInput());
  const drops = run.world.entities.filter(e => e.kind === 'cargo');
  expect(drops).toHaveLength(1);
  expect(drops[0].cargoSourceId).toBe(source.id);
  expect(drops[0].distance).toBeLessThan(run.world.entities.find(e => e.id === source.id)!.distance);
  expect(run.world.entities.find(e => e.id === source.id)!.cargoDropped).toBe(true);
  expect(run.world.experimentalCargo).toBe(true);
  expect(drops[0].cargoExpiresAt! - run.activeSeconds).toBeLessThanOrEqual(cargoBalance.lifetime);
});

it('the full-game QA checkpoint keeps the live director and exposes both hazards nearby', () => {
  const run = developmentScenario(initialRun(17), 'integrated-hazards');
  expect(run.world.integrated).toBe(true);
  expect(run.world.experimentalCargo).toBe(true);
  expect(run.world.entities.some(e => e.kind === 'wind' && e.distance > run.distance && e.distance < run.distance + 250)).toBe(true);
  let world = run.world;
  let foundSource = false;
  for (let distance = run.distance; distance <= run.distance + 450; distance += 50) {
    world = fillWorld(world, distance);
    foundSource ||= world.entities.some(e => e.cargoReleaseAt !== undefined && e.distance > run.distance);
  }
  expect(foundSource).toBe(true);
});
