import { expect, it } from 'vitest';
import { balance, shopBalance } from '../src/config';
import { developmentScenario } from '../src/development';
import { noInput } from '../src/simulation';
import { activeVehicle, initialRun, stepRun, switchVehicle, type Run } from '../src/survival';
import { enterShop, leaveShop, transact, useItem, type ShopCommand } from '../src/shop';
import { entity, fillWorld, initialWorld, nextShopDistance } from '../src/world';
import { effectiveVehicle, newVehicle } from '../src/vehicles';

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
  expect(bought.fuel).toBe(5.5); expect(bought.money).toBe(run.money - shopBalance.fuelPrice);
  expect(transact(bought, command).run).toBe(bought);
  expect(apply(bought, { kind: 'service', item: 'fuel' })).toBe(bought);
  const poor = atShop('shop-insufficient');
  expect(apply(poor, { kind: 'service', item: 'repair' })).toBe(poor);
  expect(run.fuel).toBe(1); expect(run.money).toBe(4000);
});

it('buying a third vehicle needs an explicit discard, preserves riders/resources, and rejects stale confirmation', () => {
  const run = atShop('shop-third'), snapshot = structuredClone(run);
  const rejected = apply(run, { kind: 'vehicle', vehicle: 'car4' });
  expect(rejected).toBe(run); expect(run).toEqual(snapshot);
  expect(apply(run, { kind: 'vehicle', vehicle: 'car4', discardId: 'unknown' })).toBe(run);
  const bought = apply(run, { kind: 'vehicle', vehicle: 'car4', discardId: 'qa-spare' });
  expect(bought.vehicleInstances).toHaveLength(2); expect(bought.riderIds).toEqual(run.riderIds);
  expect(bought.money).toBe(3200); expect(activeVehicle(bought).kind).toBe('car4');
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
  expect(activeVehicle(switched).fuelCapacity).toBe(20);
  expect(switched.vehicleInstances.find(v => v.kind === 'car7')?.upgrades.engine).toBe(0);
});

it('inventory has three slots, stock cannot reroll, and R consumes only a useful selected item', () => {
  let run = atShop();
  const originalStock = structuredClone(run.world.entities[0].shopStock);
  run = apply(run, { kind: 'item', item: 'fuel' });
  run = apply(run, { kind: 'item', item: 'repair' });
  run = apply(run, { kind: 'item', item: 'repair' });
  expect(run.inventory).toEqual(['fuel', 'repair', 'repair']);
  expect(apply(run, { kind: 'item', item: 'fuel' })).toBe(run);
  const reopened = enterShop({ ...leaveShop(run), phase: 'running' });
  expect(reopened.world.entities[0].shopStock).toEqual(run.world.entities[0].shopStock);
  expect(reopened.world.entities[0].shopStock!.repair).toBe(originalStock!.repair - 2);
  const playing: Run = { ...leaveShop(run), phase: 'running', fuel: 0, motion: 'coasting', selectedItem: 0 };
  const used = useItem(playing);
  expect(used.inventory).toEqual(['repair', 'repair']); expect(used.fuel).toBe(5.5); expect(used.motion).toBe('powered');
  const full = { ...used, durability: 70 };
  expect(useItem(full)).toBe(full);
});

it('upgrade caps and sold-out items reject purchases without charging', () => {
  let run = atShop();
  for (let i = 0; i < 3; i++) run = apply(run, { kind: 'upgrade', upgrade: 'engine' });
  expect(run.vehicleInstances[0].upgrades.engine).toBe(3);
  expect(apply(run, { kind: 'upgrade', upgrade: 'engine' })).toBe(run);
  const empty = { ...run, world: { ...run.world, entities: run.world.entities.map(e => e.shopStock ?
    { ...e, shopStock: { ...e.shopStock, fuel: 0 } } : e) } };
  expect(apply(empty, { kind: 'item', item: 'fuel' })).toBe(empty);
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
    let previous = 600;
    for (let i = 0; i < 20; i++) {
      const distance = nextShopDistance(previous, i, seed);
      expect(distance - previous).toBeGreaterThanOrEqual(600); expect(distance - previous).toBeLessThanOrEqual(900);
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

it('a real car purchase on a clear road occurs in 60–90 active seconds at cruise/W', () => {
  const observations = [];
  for (const accelerate of [false, true]) {
    let run: Run = { ...initialRun(17), phase: 'running',
      world: { ...initialWorld(17), nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9 } };
    while (run.distance < 1200 && run.phase === 'running') run = stepRun(run, { ...noInput(), accelerate, right: run.x < 3.2 });
    const shop = enterShop(run);
    expect(shop.shopId).not.toBeNull(); expect(run.activeSeconds).toBeGreaterThanOrEqual(60); expect(run.activeSeconds).toBeLessThanOrEqual(90);
    const bought = apply(shop, { kind: 'vehicle', vehicle: 'car4' });
    expect(activeVehicle(bought).kind).toBe('car4'); expect(bought.money).toBeGreaterThanOrEqual(0);
    observations.push({ accelerate, seconds: run.activeSeconds, moneyAfter: bought.money, fuelBefore: run.fuel });
  }
  console.log(JSON.stringify({ config: balance.version, scenario: 'clear-road-real-car-purchase', observations }));
});
