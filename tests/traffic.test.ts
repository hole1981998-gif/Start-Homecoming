import { expect, it } from 'vitest';
import { balance } from '../src/config';
import { noInput } from '../src/simulation';
import { initialRun, stepRun } from '../src/survival';
import { newVehicle, vehicleRam, vehicles } from '../src/vehicles';
import { advanceTraffic, entity, fillWorld, initialWorld, trafficTypes } from '../src/world';

it('traffic varieties are seeded and have distinct collision costs and footprints', () => {
  const a = fillWorld(initialWorld(42), 1800), b = fillWorld(initialWorld(42), 1800);
  expect(a).toEqual(b);
  expect(Object.keys(trafficTypes).sort()).toEqual(Object.keys(vehicles).sort());
  const sampled = new Set<string>();
  for (let seed = 1; seed <= 40; seed++) for (const car of fillWorld(initialWorld(seed), 5000).entities) {
    if (car.kind === 'traffic') sampled.add(car.trafficKind!);
  }
  expect([...sampled].sort()).toEqual(Object.keys(vehicles).sort());
  const cars = a.entities.filter(e => e.kind === 'traffic');
  expect(new Set(cars.map(e => e.trafficKind)).size).toBeGreaterThan(1);
  for (const car of cars) {
    const type = trafficTypes[car.trafficKind!];
    expect([car.hp, car.width, car.length]).toEqual([type.hp, type.width, type.length]);
    expect(Math.abs(car.speed)).toBe(type.speed);
  }
});

it('traffic takes pothole impact once and contact damage over time; water slows without HP damage', () => {
  const car = entity('traffic', 'car', 0, 0), hole = entity('pothole', 'hole', 0, 0);
  hole.length = 24;
  const entities = [car, hole];
  advanceTraffic(entities, 1 / 60);
  expect(car.hp).toBeCloseTo(trafficTypes.car4.hp - balance.potholeImpactDamage - balance.potholeDamagePerSecond / 60);
  advanceTraffic(entities, 1 / 60);
  expect(car.hp).toBeCloseTo(trafficTypes.car4.hp - balance.potholeImpactDamage - balance.potholeDamagePerSecond * 2 / 60);
  for (let i = 0; i < 180; i++) advanceTraffic(entities, 1 / 60);
  expect(car.hp).toBe(0); expect(car.wrecked).toBe(true); expect(car.speed).toBe(0);
  const stopped = car.distance;
  advanceTraffic(entities, 1 / 60);
  expect(car.distance).toBe(stopped);

  const wet = entity('traffic', 'wet', 0, 0), water = entity('water', 'water', 0, 0);
  water.length = 20;
  advanceTraffic([wet, water], 1 / 60);
  expect(wet.speed).toBeCloseTo(balance.trafficSpeed * .6); expect(wet.hp).toBe(trafficTypes.car4.hp);
});

it('a bus can wreck a small car with one reduced self-hit and keep driving; motorcycle still crashes', () => {
  const small = entity('traffic', 'small', 0, 0); small.speed = 14; small.baseSpeed = 14;
  const base = initialRun();
  const bus = newVehicle('bus', 'bus');
  const run = { ...base, phase: 'running' as const, activeVehicleId: bus.id,
    vehicleInstances: [...base.vehicleInstances, bus], fuel: bus.fuel, durability: bus.durability,
    world: { ...base.world, entities: [small], nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9 } };
  const hit = stepRun(run, noInput());
  expect(hit.crash).toBeNull(); expect(hit.durability).toBe(bus.durability - 8);
  expect(hit.world.entities[0].hp).toBe(0); expect(hit.world.entities[0].wrecked).toBe(true);
  const again = stepRun(hit, noInput());
  expect(again.durability).toBe(hit.durability); expect(again.world.entities[0].wrecked).toBe(true);
  const bike = stepRun({ ...run, activeVehicleId: base.activeVehicleId, fuel: base.fuel,
    durability: base.durability }, noInput());
  expect(bike.crash).not.toBeNull(); expect(bike.durability).toBe(base.durability - balance.trafficDamage);
  expect(bike.world.entities[0].hp).toBe(trafficTypes.car4.hp - vehicleRam.motorcycle.damage);
});

it('all traffic types deal their own one-time damage and retain HP after a motorcycle hit', () => {
  for (const kind of Object.keys(trafficTypes) as Array<keyof typeof trafficTypes>) {
    const target = entity('traffic', kind, 0, 0), type = trafficTypes[kind];
    target.trafficKind = kind; target.hp = type.hp; target.width = type.width; target.length = type.length;
    target.speed = 14; target.baseSpeed = 14;
    const base = initialRun();
    const run = { ...base, phase: 'running' as const,
      world: { ...base.world, entities: [target], nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9 } };
    const hit = stepRun(run, noInput());
    expect(hit.durability).toBe(base.durability - type.damage);
    expect(hit.world.entities[0].hp).toBe(type.hp - vehicleRam.motorcycle.damage);
    let recovered = hit;
    for (let i = 0; i < 200; i++) recovered = stepRun(recovered, noInput());
    expect(recovered.durability).toBe(hit.durability);
  }
});

it('every player vehicle has a defined ramming outcome against the same small target', () => {
  expect(Object.keys(vehicleRam).sort()).toEqual(Object.keys(vehicles).sort());
  for (const kind of Object.keys(vehicles) as Array<keyof typeof vehicles>) {
    const base = initialRun(), player = newVehicle(kind, `player-${kind}`);
    const target = entity('traffic', `target-${kind}`, 0, 0); target.speed = 14; target.baseSpeed = 14;
    const run = { ...base, phase: 'running' as const, activeVehicleId: player.id,
      vehicleInstances: [player], fuel: player.fuel, durability: player.durability,
      world: { ...base.world, entities: [target], nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9 } };
    const hit = stepRun(run, noInput());
    const wrecked = vehicleRam[kind].damage >= trafficTypes.car4.hp;
    expect(hit.world.entities[0].hp).toBe(Math.max(0, trafficTypes.car4.hp - vehicleRam[kind].damage));
    expect(hit.crash === null).toBe(wrecked && vehicleRam[kind].breaksThrough);
    expect(hit.durability).toBe(player.durability - (wrecked && vehicleRam[kind].breaksThrough ? 8 : trafficTypes.car4.damage));
  }
});
