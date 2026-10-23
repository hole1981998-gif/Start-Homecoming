import { expect, it } from 'vitest';
import { balance } from '../src/config';
import { noInput } from '../src/simulation';
import { enterShop, transact } from '../src/shop';
import { activeVehicle, initialRun, stepRun, type Run } from '../src/survival';
import { vehicleDefinition, waterFuelPerSecond } from '../src/vehicles';
import { advanceTraffic, entity, fillWorld, initialWorld } from '../src/world';

it('keeps the playable C3 resource profile separate from the noforce backup through driving, traffic and purchase', () => {
  const main = initialRun(17, 'c3'), backup = initialRun(17, 'backup', 'backup');
  expect(main.world.directorVersion).toBe('p8');
  expect(backup.world.directorVersion).toBe('backup');
  expect(main.fuel).toBe(7.15); expect(main.durability).toBe(122.5);
  expect(backup.fuel).toBe(5.5); expect(backup.durability).toBe(70);
  expect(activeVehicle(main).fuelPerMeter).toBe(.0036);
  expect(activeVehicle(backup).fuelPerMeter).toBe(.0045);

  const wet = entity('water', 'test-water', 0, 0); wet.length = 100;
  const drive = (run: typeof main) => {
    let next: Run = { ...run, phase: 'running', world: { ...run.world, entities: [wet],
      nextHazard: 1e9, nextSpecial: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9,
      nextShopDistance: 1e9 } };
    for (let i = 0; i < 60; i++) next = stepRun(next, noInput());
    return next;
  };
  const c3Wet = drive(main), backupWet = drive(backup);
  expect(c3Wet.distance).toBeCloseTo(backupWet.distance);
  expect(main.fuel - c3Wet.fuel).toBeCloseTo(14 * .0036 + waterFuelPerSecond());
  expect(backup.fuel - backupWet.fuel).toBeCloseTo(14 * .0045 + waterFuelPerSecond('backup'));

  const traffic = fillWorld(initialWorld(17, true, 'backup'), 1000).entities.find(e => e.kind === 'traffic')!;
  expect(traffic.balanceProfile).toBe('backup');
  expect(traffic.fuel).toBe(vehicleDefinition(traffic.trafficKind ?? 'car4', 'backup').fuelCapacity);
  const clone = { ...traffic, id: 'c3-car', balanceProfile: undefined, fuel: vehicleDefinition(traffic.trafficKind ?? 'car4').fuelCapacity };
  const beforeBackupFuel = traffic.fuel!, beforeC3Fuel = clone.fuel!;
  advanceTraffic([traffic, clone], balance.fixedStep);
  expect(beforeBackupFuel - traffic.fuel!).toBeCloseTo(Math.abs(traffic.speed) * balance.fixedStep *
    vehicleDefinition(traffic.trafficKind ?? 'car4', 'backup').fuelPerMeter);
  expect(beforeC3Fuel - clone.fuel!).toBeCloseTo(Math.abs(clone.speed) * balance.fixedStep *
    vehicleDefinition(clone.trafficKind ?? 'car4').fuelPerMeter);

  const shop = entity('shop', 'shop-c3', 0, 0);
  shop.shopStock = { vehicles: ['car4'], items: { nitro: 0, star: 0 } };
  const purchase = (run: typeof main) => {
    const atShop = enterShop({ ...run, phase: 'running', money: 300,
      world: { ...run.world, entities: [shop] } });
    return transact(atShop, { kind: 'vehicle', vehicle: 'car4', sequence: 0 }).run;
  };
  const c3Car = purchase(main), backupCar = purchase(backup);
  expect(c3Car.money).toBe(0); expect(backupCar.money).toBe(0);
  expect(activeVehicle(c3Car).fuelCapacity).toBe(13);
  expect(activeVehicle(backupCar).fuelCapacity).toBe(10);
  expect(c3Car.durability).toBe(183.75);
  expect(backupCar.durability).toBe(105);
});
