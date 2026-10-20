import { expect, it } from 'vitest';
import { developmentScenario } from '../src/development';
import { requestJump, usePowerItem } from '../src/items';
import { secretLanding, secretTrainOverlap } from '../src/secret';
import { FixedClock, noInput } from '../src/simulation';
import { transact } from '../src/shop';
import { dropPassenger, initialRun, pickUpPassenger, stepRun, switchVehicle, type Run } from '../src/survival';
import { entity } from '../src/world';
import { newVehicle } from '../src/vehicles';

it('a bought or equipped car4 needs three new riders after an empty cabin', () => {
  let run = initialRun(17, 'p7-purchase');
  const shop = entity('shop', 'p7-shop', 0, 0);
  shop.shopStock = { vehicles: ['car4'] };
  run = { ...run, phase: 'paused', shopId: shop.id, money: 2000,
    world: { ...run.world, entities: [shop] } };
  run = transact(run, { kind: 'vehicle', vehicle: 'car4', sequence: 0 }).run;
  expect(run.secret.step).toBe(1);
  run = { ...run, phase: 'running', shopId: null,
    world: { ...run.world, entities: [1, 2, 3].map(i => entity('passenger', `p7-rider-${i}`, 0, 0)) } };
  run = pickUpPassenger(run); expect(run.secret.step).toBe(1);
  run = pickUpPassenger(run); expect(run.secret.step).toBe(1);
  run = pickUpPassenger(run); expect(run.secret.step).toBe(2);
  expect(dropPassenger(run).secret.step).toBe(0);
  const spare = newVehicle('motorbike', 'p7-spare');
  expect(switchVehicle({ ...run, vehicleInstances: [...run.vehicleInstances, spare] }).secret.step).toBe(0);

  let loaded = initialRun(17, 'p7-loaded');
  loaded = { ...loaded, riderIds: ['already-here'], phase: 'paused', shopId: shop.id, money: 2000,
    world: { ...loaded.world, entities: [shop] } };
  loaded = transact(loaded, { kind: 'vehicle', vehicle: 'car4', sequence: 0 }).run;
  expect(loaded.secret.step).toBe(0);
  loaded = { ...loaded, phase: 'running', shopId: null };
  loaded = dropPassenger(loaded);
  expect(loaded.secret.step).toBe(1);
  const car = newVehicle('car4', 'equipped-car');
  let equipped: Run = { ...initialRun(17, 'p7-equip'), phase: 'running',
    vehicleInstances: [newVehicle('motorcycle', 'first'), car], activeVehicleId: 'first', riderIds: ['old'] };
  equipped = switchVehicle(equipped, car.id);
  expect(equipped.secret.step).toBe(0);
  equipped = dropPassenger(equipped);
  expect(equipped.secret.step).toBe(1);
  equipped = { ...equipped, world: { ...equipped.world,
    entities: [1, 2, 3].map(i => entity('passenger', `new-${i}`, 0, 0)) } };
  for (let i = 0; i < 3; i++) equipped = pickUpPassenger(equipped);
  expect(equipped.secret.step).toBe(2);
});

it('a real moving train requires witnessed high crossing and landing beyond its far side', () => {
  const run = developmentScenario(initialRun(17, 'p7-flight'), 'p7-secret');
  const armed = requestJump(usePowerItem({ ...run, phase: 'running' }, 0));
  expect(armed.secret.step).toBe(2);
  expect(armed.secret.jumpAt).toBe(0);
  let flying = armed;
  for (let i = 0; i < 240 && flying.phase === 'running'; i++) flying = stepRun(flying, noInput());
  expect(flying.result?.reason).toBe('secret');
  expect(flying.secret.step).toBe(3);
  expect(flying.durability).toBeGreaterThan(0);
  expect(flying.riderIds).toHaveLength(3);
  expect(stepRun(flying, noInput())).toEqual(flying);

  const fake = secretTrainOverlap(armed.secret, 'train', 15, 3.5);
  expect(secretLanding(fake, 1.6, 17, 1.6).step).toBe(2);
  expect(secretLanding(armed.secret, 1.6, 100, 1.6).step).toBe(2);
});

it('train contact still ends normally and render FPS cannot change the secret outcome', () => {
  const initial = developmentScenario(initialRun(42, 'p7-train-contact'), 'p7-secret');
  let withoutJump: Run = { ...initial, phase: 'running' };
  for (let i = 0; i < 200 && withoutJump.phase === 'running'; i++) withoutJump = stepRun(withoutJump, noInput());
  expect(withoutJump.result?.reason).toBe('train');

  const outcomes = [30, 60, 144].map(fps => {
    let run = requestJump(usePowerItem({ ...initial, phase: 'running' }, 0));
    const clock = new FixedClock();
    for (let frame = 0; frame < fps * 4 && run.phase === 'running'; frame++)
      clock.advance(1 / fps, () => { run = stepRun(run, noInput()); });
    return { reason: run.result?.reason, score: run.score, distance: run.distance, step: run.secret.step };
  });
  expect(outcomes[1]).toEqual(outcomes[0]); expect(outcomes[2]).toEqual(outcomes[0]);
});

it('after the train, a traffic collision can end the run without requiring immediate contact', () => {
  let run = developmentScenario(initialRun(17, 'p7-traffic'), 'p7-secret-traffic');
  run = { ...run, world: { ...run.world, entities: run.world.entities.map(e =>
    e.kind === 'traffic' ? { ...e, distance: 130 } : e) } };
  run = requestJump(usePowerItem({ ...run, phase: 'running' }, 0));
  for (let i = 0; i < 700 && run.phase === 'running'; i++) run = stepRun(run, noInput());
  expect(run.secret.step).toBe(3);
  expect(run.result?.reason).toBe('secret');
  expect(run.distance).toBeGreaterThan(100);
});
