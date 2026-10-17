import { describe, expect, it } from 'vitest';
import { noInput } from '../src/simulation';
import { activeVehicle, initialRun, passengerDrive, stepRun, switchVehicle, type Run } from '../src/survival';
import { buyVehicle, newVehicle, vehicles } from '../src/vehicles';
import { entity } from '../src/world';

function twoVehicles(): Run {
  const run = initialRun(17, 'vehicles-test');
  return { ...run, phase: 'running', vehicleInstances: [...run.vehicleInstances, newVehicle('car4', 'car')],
    world: { ...run.world, entities: [], nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9 } };
}
describe('P4B vehicle instances', () => {
  it('keeps each tank, HP and upgrades on its instance while Tab changes loaded cruise and capacity', () => {
    const base = twoVehicles();
    const upgraded = { ...base, riderIds: ['rider-0', 'rider-1', 'rider-2'], fuel: 2, durability: 42,
      vehicleInstances: base.vehicleInstances.map(v => v.kind === 'motorcycle' ?
        { ...v, upgrades: { engine: 1, tank: 0, armour: 0 } } : v) };
    const car = switchVehicle(upgraded);
    expect(activeVehicle(car).kind).toBe('car4');
    expect(car.riderIds).toEqual(upgraded.riderIds);
    expect(car.vehicleInstances[0].fuel).toBe(2);
    expect(car.vehicleInstances[0].durability).toBe(42);
    expect(car.vehicleInstances[0].upgrades.engine).toBe(1);
    expect(passengerDrive(car.riderIds.length, activeVehicle(car)).cruiseSpeed)
      .toBeGreaterThan(passengerDrive(upgraded.riderIds.length, activeVehicle(upgraded)).cruiseSpeed);
    const back = switchVehicle({ ...car, fuel: 10, durability: 90 });
    expect(back.fuel).toBe(2); expect(back.durability).toBe(42);
    expect(back.vehicleInstances[1].fuel).toBe(10);
    expect(back.vehicleInstances[1].durability).toBe(90);
  });

  it('requires an explicit discard for a third vehicle and leaves a cancelled/invalid purchase untouched', () => {
    const existing = twoVehicles().vehicleInstances;
    const noDiscard = buyVehicle(existing, 2000, 'car7', 'third');
    const badDiscard = buyVehicle(existing, 2000, 'car7', 'third', 'missing');
    const noMoney = buyVehicle(existing, 100, 'car7', 'third', existing[0].id);
    expect(noDiscard).toBeNull(); expect(badDiscard).toBeNull(); expect(noMoney).toBeNull();
    expect(existing).toHaveLength(2);
    const bought = buyVehicle(existing, 2000, 'car7', 'third', existing[0].id)!;
    expect(bought.inventory).toHaveLength(2);
    expect(bought.inventory.map(v => v.id)).toEqual(['car', 'third']);
    expect(bought.money).toBe(2000 - vehicles.car7.price);
    expect(existing[0].id).toBe('vehicles-test-motorcycle');
  });

  it('automatically changes to a viable backup after lethal damage and protects the new car briefly', () => {
    const traffic = entity('traffic', 'lethal', 0, 0); traffic.speed = 14;
    const base = twoVehicles();
    const hit = stepRun({ ...base, durability: 20, world: { ...base.world, entities: [traffic] } }, noInput());
    expect(hit.phase).toBe('running'); expect(hit.result).toBeNull();
    expect(activeVehicle(hit).kind).toBe('car4');
    expect(hit.vehicleInstances[0].disabled).toBe(true);
    expect(hit.durability).toBe(vehicles.car4.durabilityCapacity);
    const next = stepRun(hit, noInput());
    expect(next.durability).toBe(vehicles.car4.durabilityCapacity);
    expect(next.riderIds).toEqual(hit.riderIds);
    expect(switchVehicle(hit)).toBe(hit);
  });

  it('changes to the backup only after fuel coasting ends, without refilling the old tank', () => {
    let run = { ...twoVehicles(), fuel: .005 };
    for (let i = 0; i < 500 && activeVehicle(run).kind === 'motorcycle'; i++) run = stepRun(run, noInput());
    expect(activeVehicle(run).kind).toBe('car4');
    expect(run.phase).toBe('running'); expect(run.result).toBeNull();
    expect(run.vehicleInstances[0].fuel).toBe(0);
    expect(run.vehicleInstances[0].disabled).toBe(true);
    expect(run.fuel).toBe(vehicles.car4.fuelCapacity);
  });

  it('uses per-vehicle fuel consumption and collision width', () => {
    let car = switchVehicle(twoVehicles());
    const startingFuel = car.fuel;
    for (let i = 0; i < 60; i++) car = stepRun(car, noInput());
    expect(startingFuel - car.fuel).toBeCloseTo(car.distance * vehicles.car4.fuelPerMeter, 5);
    expect(car.vehicleInstances[0].fuel).toBe(vehicles.motorcycle.fuelCapacity);
    expect(activeVehicle(car).width).toBeGreaterThan(vehicles.motorcycle.width);
    const traffic = entity('traffic', 'width-check', 0, 0); traffic.speed = 14;
    const base = twoVehicles();
    const motorcycleHit = stepRun({ ...base, x: 1.6, world: { ...base.world, entities: [traffic] } }, noInput());
    const carOnly: Run = { ...base, x: 1.6, activeVehicleId: 'car', fuel: vehicles.car4.fuelCapacity,
      durability: vehicles.car4.durabilityCapacity, world: { ...base.world, entities: [traffic] } };
    const carHit = stepRun(carOnly, noInput());
    expect(motorcycleHit.durability).toBe(vehicles.motorcycle.durabilityCapacity);
    expect(carHit.durability).toBe(vehicles.car4.durabilityCapacity - 20);
  });

  it('keeps every vehicle load speed finite and nonincreasing as passengers board', () => {
    for (const definition of Object.values(vehicles)) {
      let previous = Number.POSITIVE_INFINITY;
      for (let riders = 0; riders <= 6; riders++) {
        const drive = passengerDrive(riders, definition);
        expect(drive.cruiseSpeed).toBeLessThanOrEqual(previous);
        expect(drive.cruiseSpeed).toBeGreaterThanOrEqual(Math.min(definition.minSpeed, drive.maxSpeed));
        expect(drive.cruiseSpeed).toBeLessThanOrEqual(drive.maxSpeed);
        previous = drive.cruiseSpeed;
      }
    }
  });

  it('simulates 60 seconds for each vehicle at solo and loaded cruise without resource or speed drift', () => {
    const samples = [];
    for (const definition of Object.values(vehicles)) for (const passengers of [0, Math.min(3, definition.capacity - 1)]) {
      const initial = initialRun(17, `${definition.kind}-${passengers}`);
      let run: Run = { ...initial, phase: 'running', riderIds: Array.from({ length: passengers }, (_, i) => `rider-${i}`),
        vehicleInstances: [newVehicle(definition.kind, initial.activeVehicleId)],
        fuel: definition.fuelCapacity, durability: definition.durabilityCapacity,
        speed: definition.cruiseSpeed,
        world: { ...initial.world, entities: [], nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9 } };
      for (let i = 0; i < 3600; i++) run = stepRun(run, noInput());
      expect(run.phase).toBe('running');
      expect(run.speed).toBeCloseTo(passengerDrive(passengers, definition).cruiseSpeed, 5);
      expect(run.fuel).toBeGreaterThan(0);
      expect(run.fuel).toBeLessThan(definition.fuelCapacity);
      expect(run.money).toBeGreaterThan(initial.money);
      samples.push({ kind: definition.kind, passengers, distance: Math.round(run.distance),
        fuelLeft: Number(run.fuel.toFixed(2)), earned: Math.round(run.money - initial.money) });
    }
    console.log(JSON.stringify({ config: 'p4b-vehicles-1', seconds: 60, samples }));
  });
});
