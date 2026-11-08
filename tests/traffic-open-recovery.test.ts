import { expect, it } from 'vitest';
import { balance } from '../src/config';
import { noInput } from '../src/simulation';
import { initialRun, stepRun, type Run } from '../src/survival';
import { advanceTraffic, entity, spawnWreckPassengers } from '../src/world';
import { trafficRecoverySeconds } from '../src/traffic-recovery';
import { advanceInteractingTraffic } from '../src/traffic-interactions';
import { trafficTypes, vehicles } from '../src/vehicles';

it('surviving open traffic falls after a player impact, remounts and resumes with its existing fuel', () => {
  for (const kind of ['motorcycle', 'motorbike', 'tricycle'] as const) {
    const base = initialRun(17);
    const npc = entity('traffic', `live-${kind}`, 3.3, 0);
    Object.assign(npc, { trafficKind: kind, hp: trafficTypes[kind].hp, width: trafficTypes[kind].width,
      length: trafficTypes[kind].length, fuel: 4, speed: 8, baseSpeed: 8, trafficMotion: 'powered' });
    const run = { ...base, phase: 'running' as const,
      world: { ...base.world, entities: [npc], nextHazard: 1e9, nextSpecial: 1e9,
        nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 } };
    let hit: Run = run;
    for (let i = 0; i < 30 && hit.feedbackCounts.traffic === 0; i++) hit = stepRun(hit, noInput());
    expect(hit.feedbackCounts.traffic).toBe(1);
    const fallen = hit.world.entities.find(e => e.id === npc.id)!;
    expect(fallen.hp).toBeGreaterThan(0);
    expect(fallen.trafficFallAge).toBe(0);
    expect(fallen.speed).toBe(0);
    expect(fallen.trafficStoppedByCollision).toBe(true);
    const fuel = fallen.fuel!;
    for (let i = 0; i < Math.ceil(trafficRecoverySeconds / balance.fixedStep) - 1; i++)
      advanceTraffic(hit.world.entities, balance.fixedStep);
    expect(fallen.trafficFallAge).toBeDefined();
    expect(fallen.fuel).toBe(fuel);
    advanceTraffic(hit.world.entities, balance.fixedStep);
    expect(fallen.trafficFallAge).toBeUndefined();
    expect(fallen.speed).toBeGreaterThan(0);
    expect(fallen.distance).toBeGreaterThan(npc.distance);
  }
});

it('a destroyed open traffic vehicle releases its driver once as an NPC', () => {
  for (const kind of ['motorcycle', 'motorbike', 'tricycle'] as const) {
    const world = initialRun(17).world;
    const car = entity('traffic', `dead-${kind}`, 50, 0);
    car.trafficKind = kind; car.width = vehicles[kind].width; car.length = vehicles[kind].length;
    car.hp = 0; car.wrecked = true; car.wreckedByPlayer = true;
    world.entities = [car];
    spawnWreckPassengers(world, 0, vehicles.motorcycle);
    const released = world.entities.filter(e => e.kind === 'passenger');
    expect(released.length).toBeGreaterThanOrEqual(2);
    expect(released.every(e => e.pickupable === false)).toBe(true);
    spawnWreckPassengers(world, 1, vehicles.motorcycle);
    expect(world.entities.filter(e => e.kind === 'passenger')).toHaveLength(released.length);
  }
});

it('a surviving traffic bike falls after an NPC collision while closed cars keep their stop rule', () => {
  const bike = entity('traffic', 'bike', 10, 0), car = entity('traffic', 'car', 20, 0);
  Object.assign(bike, { trafficKind: 'motorbike', hp: 26, fuel: 5, speed: 10, baseSpeed: 10,
    width: trafficTypes.motorbike.width, length: trafficTypes.motorbike.length, trafficMotion: 'powered' });
  Object.assign(car, { trafficKind: 'car4', hp: 100, fuel: 5, speed: 0, baseSpeed: 0,
    width: trafficTypes.car4.width, length: trafficTypes.car4.length, trafficMotion: 'powered' });
  advanceInteractingTraffic([bike, car], [{ ...bike }, { ...car }], 1);
  expect(bike.hp).toBeGreaterThan(0);
  expect(bike.trafficFallAge).toBe(0);
  expect(bike.trafficStoppedByCollision).toBe(true);
  expect(car.trafficFallAge).toBeUndefined();
  expect(car.trafficStoppedByCollision).toBe(true);
});
