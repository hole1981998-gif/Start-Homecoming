import { expect, it } from 'vitest';
import { balance, shopBalance } from '../src/config';
import { developmentScenario } from '../src/development';
import { noInput } from '../src/simulation';
import { activeVehicle, initialRun, pickUpPassenger, stepRun, switchVehicle, type Run } from '../src/survival';
import { enterShop, leaveShop, transact, type ShopCommand } from '../src/shop';
import { entity, fillWorld, initialWorld, nextShopDistance } from '../src/world';
import { effectiveVehicle, newVehicle, vehicles } from '../src/vehicles';

const atShop = (scenario = 'shop') => enterShop({ ...developmentScenario(initialRun(17, 'shop-test'), scenario), phase: 'running' });
type WithoutSequence<T> = T extends unknown ? Omit<T, 'sequence'> : never;
const apply = (run: Run, command: WithoutSequence<ShopCommand>) => transact(run, { ...command, sequence: run.economySequence } as ShopCommand).run;

it('shop access requires location and running state, freezes simulation and closes without buying', () => {
  const ready = developmentScenario(initialRun(), 'shop');
  expect(enterShop(ready)).toBe(ready);
  const outside = { ...ready, phase: 'running' as const, x: 4 };
  expect(enterShop(outside)).toBe(outside);
  const shopping = atShop(), before = structuredClone(shopping);
  for (let i = 0; i < 120; i++) expect(stepRun(shopping, noInput())).toBe(shopping);
  expect(shopping).toEqual(before);
  expect(leaveShop(shopping).money).toBe(shopping.money);
  expect(transact({ ...shopping, distance: 100 }, { kind: 'service', item: 'fuel', sequence: 0 }).run.money).toBe(shopping.money);
});

it('services clamp, refuse full resources and insufficient funds, and stale commands cannot charge twice', () => {
  const run = atShop(), command: ShopCommand = { kind: 'service', item: 'fuel', sequence: 0 };
  const bought = transact(run, command).run;
  expect(bought.fuel).toBe(5); expect(bought.money).toBe(run.money - shopBalance.fuelPrice);
  expect(transact(bought, command).run).toBe(bought);
  const toppedUp = apply(bought, { kind: 'service', item: 'fuel' });
  expect(toppedUp.fuel).toBe(balance.fuelCapacity);
  expect(toppedUp.money).toBe(bought.money - shopBalance.fuelPrice);
  expect(apply(toppedUp, { kind: 'service', item: 'fuel' })).toBe(toppedUp);
  const poor = atShop('shop-insufficient');
  expect(apply(poor, { kind: 'service', item: 'repair' })).toBe(poor);
  expect(run.fuel).toBe(1); expect(run.money).toBe(4000);
});

it('removed takeaway commands cannot charge, heal or create inventory, even from a stale UI', () => {
  const run = atShop(), before = structuredClone(run);
  for (const item of ['fuel', 'repair']) {
    const stale = { kind: 'item', item, sequence: run.economySequence } as unknown as ShopCommand;
    expect(transact(run, stale).run).toBe(run);
  }
  expect(run).toEqual(before);
  expect(run.inventory).toEqual([null, null]);
  const repaired = apply(run, { kind: 'service', item: 'repair' });
  expect(repaired.durability).toBe(50);
  expect(repaired.vehicleInstances[0].durability).toBe(50);
  const reopened = enterShop({ ...leaveShop(repaired), phase: 'running' });
  expect(reopened.world.entities[0].shopStock).toEqual(repaired.world.entities[0].shopStock);
});

it('buying a third vehicle needs an explicit discard, preserves riders/resources, and rejects stale confirmation', () => {
  const run = atShop('shop-third'), snapshot = structuredClone(run);
  const rejected = apply(run, { kind: 'vehicle', vehicle: 'car4' });
  expect(rejected).toBe(run); expect(run).toEqual(snapshot);
  expect(apply(run, { kind: 'vehicle', vehicle: 'car4', discardId: 'unknown' })).toBe(run);
  const bought = apply(run, { kind: 'vehicle', vehicle: 'car4', discardId: 'qa-spare' });
  expect(bought.vehicleInstances).toHaveLength(2); expect(bought.riderIds).toEqual(run.riderIds);
  expect(bought.money).toBe(4000 - vehicles.car4.price); expect(activeVehicle(bought).kind).toBe('car4');
  expect(bought.vehicleInstances.find(v => v.kind === 'motorcycle')?.fuel).toBe(1);
  expect(bought.vehicleInstances.find(v => v.kind === 'motorcycle')?.durability).toBe(30);
  expect(transact(bought, { kind: 'vehicle', vehicle: 'car4', discardId: 'qa-spare', sequence: 0 }).run).toBe(bought);
  expect(apply(bought, { kind: 'vehicle', vehicle: 'car4', discardId: bought.vehicleInstances[0].id })).toBe(bought);
  const back = switchVehicle({ ...leaveShop(bought), phase: 'running' });
  expect(back.fuel).toBe(1); expect(back.durability).toBe(30);
});

it('upgrades belong to one instance and affect real driving without free tank/HP refills', () => {
  let run = atShop('shop-third');
  for (const upgrade of ['engine', 'tank', 'armour', 'economy'] as const) run = apply(run, { kind: 'upgrade', upgrade });
  expect(run.fuel).toBe(1); expect(run.durability).toBe(30);
  expect(activeVehicle(run).maxSpeed).toBeCloseTo(20 * 1.08);
  expect(activeVehicle(run).fuelCapacity).toBeCloseTo(5.5 * 1.15);
  expect(activeVehicle(run).durabilityCapacity).toBeCloseTo(70 * 1.15);
  const driven = stepRun({ ...leaveShop(run), phase: 'running' }, noInput());
  expect(run.fuel - driven.fuel).toBeCloseTo((driven.distance - run.distance) * .0045 * .92);
  const switched = switchVehicle({ ...leaveShop(run), phase: 'running' });
  expect(activeVehicle(switched).fuelCapacity).toBe(vehicles.car7.fuelCapacity);
  expect(switched.vehicleInstances.find(v => v.kind === 'car7')?.upgrades.engine).toBe(0);
});

it('shops expose every catalog type, including tricycle/container; owned kinds cannot be bought even when discarding them', () => {
  for (let seed = 1; seed <= 10; seed++) {
    const shop = fillWorld(initialWorld(seed), 600).entities.find(e => e.kind === 'shop')!;
    expect(shop.shopStock!.vehicles.sort()).toEqual(Object.keys(vehicles).sort());
  }
  const run = atShop('shop-third');
  expect(apply(run, { kind: 'vehicle', vehicle: 'motorcycle', discardId: run.activeVehicleId })).toBe(run);
  expect(apply(run, { kind: 'vehicle', vehicle: 'car7', discardId: 'qa-spare' })).toBe(run);
});

it('upgrading a reserve vehicle changes only that instance without equipping, refilling or healing it', () => {
  const run = atShop('shop-third');
  const upgraded = apply(run, { kind: 'upgrade', upgrade: 'tank', targetId: 'qa-spare' });
  expect(upgraded.activeVehicleId).toBe(run.activeVehicleId);
  expect(upgraded.fuel).toBe(run.fuel); expect(upgraded.durability).toBe(run.durability);
  const spare = upgraded.vehicleInstances.find(v => v.id === 'qa-spare')!;
  expect(spare.upgrades.tank).toBe(1); expect(spare.fuel).toBe(vehicles.car7.fuelCapacity);
  expect(effectiveVehicle(spare).fuelCapacity).toBeCloseTo(vehicles.car7.fuelCapacity * (1 + shopBalance.tankPerLevel));
  expect(upgraded.vehicleInstances[0].upgrades.tank).toBe(0);
  expect(upgraded.money).toBe(run.money - shopBalance.tankPrices[0]);
  expect(apply(run, { kind: 'upgrade', upgrade: 'engine', targetId: 'missing' })).toBe(run);
  const switched = switchVehicle({ ...leaveShop(upgraded), phase: 'running' });
  expect(activeVehicle(switched).fuelCapacity).toBeCloseTo(vehicles.car7.fuelCapacity * (1 + shopBalance.tankPerLevel));
  expect(switched.fuel).toBe(spare.fuel);
});

it('upgrade caps reject purchases without charging', () => {
  let run = atShop();
  for (let i = 0; i < 3; i++) run = apply(run, { kind: 'upgrade', upgrade: 'engine' });
  expect(run.vehicleInstances[0].upgrades.engine).toBe(3);
  expect(apply(run, { kind: 'upgrade', upgrade: 'engine' })).toBe(run);
});

it('a longer purchase protects overlapping hazards until clear without granting general immunity', () => {
  const shop = atShop(), hole = entity('pothole', 'behind-shop', -4, 0);
  const run = { ...shop, world: { ...shop.world, entities: [...shop.world.entities, hole] } };
  const bought = apply(run, { kind: 'vehicle', vehicle: 'bus' });
  expect(bought.protectedEntities).toContain(hole.id);
  const driven = stepRun({ ...leaveShop(bought), phase: 'running' }, noInput());
  expect(driven.durability).toBe(bought.durability);
});

it('upgraded top speed still gives oncoming traffic at least the configured reaction window', () => {
  const instance = newVehicle('motorbike', 'fast'); instance.upgrades.engine = 3;
  const d = effectiveVehicle(instance);
  let checked = 0;
  for (let seed = 1; seed <= 10; seed++) {
    let world = initialWorld(seed); const seen = new Set<string>();
    for (let distance = 0; distance < 400; distance += d.maxSpeed * balance.fixedStep) {
      world = fillWorld(world, distance, d.fuelCapacity, d.durabilityCapacity, 1, d);
      for (const e of world.entities) if (e.kind === 'traffic' && !seen.has(e.id)) {
        seen.add(e.id);
        if (e.speed < 0) {
          expect((e.distance - distance) / (d.maxSpeed - e.speed)).toBeGreaterThanOrEqual(balance.warningSeconds - balance.fixedStep);
          checked++;
        }
      }
    }
  }
  expect(checked).toBeGreaterThan(0);
});

it('shop generation is seeded, has bounded gaps away from junctions and does not alter stock on revisit', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const world = fillWorld(initialWorld(seed), 1200);
    expect(world).toEqual(fillWorld(initialWorld(seed), 1200));
    expect(world.rng).toBe(fillWorld({ ...initialWorld(seed), nextShopDistance: 1e9 }, 1200).rng);
    let previous: number = shopBalance.firstDistance;
    for (let i = 0; i < 20; i++) {
      const distance = nextShopDistance(previous, i, seed);
      expect(distance - previous).toBeGreaterThanOrEqual(i === 0 ? shopBalance.secondDistance - shopBalance.firstDistance : shopBalance.minGap);
      expect(distance - previous).toBeLessThanOrEqual(shopBalance.maxGap);
      expect(Math.min(distance % 800, 800 - distance % 800)).toBeGreaterThanOrEqual(60);
      previous = distance;
    }
  }
});

it('the shop remains interactable after passing it until the advertised reach expires', () => {
  const run = atShop(), at = run.world.entities[0].distance;
  const world = fillWorld(run.world, at + 25);
  const behind = { ...leaveShop(run), world, phase: 'running' as const, distance: at + 25 };
  expect(enterShop(behind).shopId).toBe(run.shopId);
  expect(fillWorld(world, at + shopBalance.reach + 1).entities.some(e => e.id === run.shopId)).toBe(false);
});

it('a real first car purchase follows one pickup and reaches the first shop within 30 seconds', () => {
  const observations = [];
  for (const accelerate of [false, true]) {
    let run: Run = { ...initialRun(17), phase: 'running',
      world: { ...initialWorld(17), nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextSpecial: 1e9 } };
    while (run.distance < shopBalance.firstDistance + shopBalance.reach && run.phase === 'running') {
      const passenger = run.world.entities.find(e => e.kind === 'passenger' && !e.consumed);
      const target = run.riderIds.length ? -balance.laneWidth : passenger?.x ?? 0;
      run = stepRun(run, { ...noInput(), accelerate, left: run.x > target + .15, right: run.x < target - .15 });
      run = pickUpPassenger(run);
      const shop = enterShop(run);
      if (shop.shopId && shop.money >= vehicles.car4.price) { run = shop; break; }
    }
    const shop = enterShop(run);
    expect(run.riderIds).toHaveLength(1);
    expect(shop.shopId).not.toBeNull(); expect(run.activeSeconds).toBeGreaterThanOrEqual(accelerate ? 11 : 18);
    expect(run.activeSeconds).toBeLessThanOrEqual(30);
    const bought = apply(shop, { kind: 'vehicle', vehicle: 'car4' });
    expect(activeVehicle(bought).kind).toBe('car4'); expect(bought.money).toBeGreaterThanOrEqual(0);
    observations.push({ accelerate, seconds: run.activeSeconds, moneyAfter: bought.money, fuelBefore: run.fuel });
  }
  console.log(JSON.stringify({ config: balance.version, scenario: 'clear-road-real-car-purchase', observations }));
});
