import { expect, it } from 'vitest';
import { balance } from '../src/config';
import { FixedClock, noInput } from '../src/simulation';
import { initialRun, stepRun } from '../src/survival';
import { vehicles, type VehicleKind } from '../src/vehicles';
import { advanceTraffic, entity, fillWorld, initialWorld, spawnWreckPassengers } from '../src/world';

it('each traffic instance consumes its own per-type fuel for both directions, without refilling', () => {
  for (const kind of Object.keys(vehicles) as VehicleKind[]) for (const sign of [-1, 1]) {
    const car = entity('traffic', kind, 0, 0); car.trafficKind = kind; car.speed = sign * 6; car.baseSpeed = car.speed;
    for (let i = 0; i < 60; i++) advanceTraffic([car], balance.fixedStep);
    expect(car.distance).toBeCloseTo(sign * 6);
    expect(car.fuel).toBeCloseTo(vehicles[kind].fuelCapacity - 6 * vehicles[kind].fuelPerMeter);
    const fuel = car.fuel!;
    advanceTraffic([car], balance.fixedStep);
    expect(car.fuel).toBeLessThan(fuel);
  }
  for (const car of fillWorld(initialWorld(17), 5000).entities.filter(e => e.kind === 'traffic')) {
    expect(car.fuel).toBe(vehicles[car.trafficKind!].fuelCapacity);
  }
});

it('water drains fuel only during swept contact, and depletion splits powered travel from coasting', () => {
  const car = entity('traffic', 'wet', 0, 0), water = entity('water', 'water', 0, 0);
  car.fuel = .1; water.length = 30;
  advanceTraffic([car, water], balance.fixedStep);
  expect(car.fuel).toBeCloseTo(.1 - .1 * vehicles.car4.fuelPerMeter - balance.waterFuelPerSecond / 60);
  for (let i = 0; i < 20; i++) advanceTraffic([car, water], balance.fixedStep);
  expect(car.fuel).toBe(0); expect(car.trafficMotion).toBe('coasting'); expect(car.hp).toBe(30);
  const partial = entity('traffic', 'partial', 0, 0); partial.fuel = 3 * vehicles.car4.fuelPerMeter;
  advanceTraffic([partial], 1);
  expect(partial.fuel).toBe(0);
  expect(partial.distance).toBeCloseTo(3 + 6 * .5 - .5 * balance.coastDrag * .5 ** 2);
});

it('empty traffic coasts exactly 25 m, stops permanently and never becomes an HP wreck from fuel alone', () => {
  for (const sign of [-1, 1]) {
    const car = entity('traffic', 'empty', 0, 0); car.fuel = 0; car.speed = sign * 6; car.baseSpeed = car.speed;
    const world = initialWorld(17); world.entities.push(car);
    let previous = car.speed;
    for (let i = 0; i < 1200; i++) {
      advanceTraffic(world.entities, balance.fixedStep);
      expect(Math.abs(car.speed)).toBeLessThanOrEqual(Math.abs(previous)); previous = car.speed;
      spawnWreckPassengers(world, i / 60, vehicles.motorcycle);
    }
    expect(car.distance).toBeCloseTo(sign * balance.coastDistance);
    expect(car.speed).toBe(0); expect(car.trafficMotion).toBe('stopped'); expect(car.fuel).toBe(0);
    expect(car.hp).toBe(30); expect(car.wrecked).toBe(false); expect(car.consumed).toBe(false);
    expect(world.entities).toHaveLength(1);
  }
});

it('stopped traffic still damages the player once and remains vulnerable to potholes', () => {
  const car = entity('traffic', 'stopped', 0, 0); car.fuel = 0; car.speed = 0; car.baseSpeed = 6;
  car.trafficMotion = 'stopped'; car.coastRemaining = 0;
  const base = initialRun();
  const run = stepRun({ ...base, phase: 'running', world: { ...base.world, entities: [car],
    nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9 } }, noInput());
  expect(run.durability).toBe(vehicles.motorcycle.durabilityCapacity - 20); expect(run.crash).not.toBeNull();
  const hole = entity('pothole', 'hole', 0, 0); hole.length = 30;
  for (let i = 0; i < 180; i++) advanceTraffic([car, hole], balance.fixedStep);
  expect(car.hp).toBe(0); expect(car.wrecked).toBe(true);
});

it('fuel depletion in world simulation is independent of 30/60/144 render FPS', () => {
  const outcomes = [30, 60, 144].map(fps => {
    const car = entity('traffic', 'fuel-fps', 0, 0); car.fuel = .02;
    const water = entity('water', 'water', 0, 0); water.length = 10;
    const clock = new FixedClock();
    for (let i = 0; i < fps * 20; i++) clock.advance(1 / fps, () => advanceTraffic([car, water], balance.fixedStep));
    return car;
  });
  expect(outcomes[0]).toEqual(outcomes[1]); expect(outcomes[0]).toEqual(outcomes[2]);
});
