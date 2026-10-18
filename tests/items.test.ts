import { expect, it } from 'vitest';
import { balance, itemBalance } from '../src/config';
import { clears, hasBoost, hasStar, jumpHeight, usePowerItem } from '../src/items';
import { initialRun, stepRun, switchVehicle, type Run } from '../src/survival';
import { FixedClock, noInput } from '../src/simulation';
import { entity, initialWorld } from '../src/world';
import { newVehicle, vehicles, type VehicleKind } from '../src/vehicles';
import { developmentScenario } from '../src/development';
import { enterShop, transact } from '../src/shop';
import { junction } from '../src/route';

function ready(kind: VehicleKind = 'motorcycle'): Run {
  const run = initialRun(17), v = newVehicle(kind, 'test-car');
  return { ...run, phase: 'running', inventory: ['nitro', 'star'], activeVehicleId: v.id, vehicleInstances: [v],
    fuel: v.fuel, durability: v.durability, speed: vehicles[kind].cruiseSpeed,
    world: { ...initialWorld(17), nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 } };
}
function seconds(run: Run, duration: number): Run {
  for (let i = 0; i < Math.round(duration / balance.fixedStep); i++) run = stepRun(run, noInput());
  return run;
}
it('two fixed slots consume only the selected valid item and reject pause/crash/end/repeat activation', () => {
  const run = ready(), used = usePowerItem(run, 0);
  expect(used.inventory).toEqual([null, 'star']); expect(run.inventory).toEqual(['nitro', 'star']);
  expect(hasBoost(used)).toBe(true); expect(usePowerItem(used, 0)).toBe(used);
  for (const index of [-1, 2, NaN, .5]) expect(usePowerItem(run, index)).toBe(run);
  for (const phase of ['ready', 'paused', 'ended'] as const) {
    const blocked = { ...run, phase }; expect(usePowerItem(blocked, 0)).toBe(blocked);
  }
  const depleted = { ...run, fuel: 0, motion: 'coasting' as const };
  expect(usePowerItem(depleted, 0)).toBe(depleted);
  const active = { ...used, inventory: ['nitro', 'star'] as Run['inventory'] };
  expect(usePowerItem(active, 0)).toBe(active);
});
it('shop fills first empty slot, charges once, cannot reroll stock or overwrite a full inventory', () => {
  let run = enterShop({ ...developmentScenario(initialRun(), 'shop'), phase: 'running' });
  const first = { kind: 'power-item' as const, item: 'nitro' as const, sequence: run.economySequence };
  run = transact(run, first).run;
  expect(run.inventory).toEqual(['nitro', null]); expect(run.money).toBe(4000 - itemBalance.nitroPrice);
  expect(transact(run, first).run).toBe(run);
  const second = { kind: 'power-item' as const, item: 'star' as const, sequence: run.economySequence };
  const both = transact(run, second).run;
  expect(both.inventory).toEqual(['nitro', 'star']);
  expect(transact(both, { ...second, sequence: both.economySequence }).run).toBe(both);
  expect(both.world.entities[0].shopStock?.items).toEqual({ nitro: 0, star: 0 });
  const poor = { ...run, money: 0 };
  expect(transact(poor, second).run).toBe(poor);
  const used = usePowerItem({ ...both, phase: 'running', shopId: null }, 0);
  expect(used.inventory).toEqual([null, 'star']);
});
it('boost accelerates above normal max, ends on active time, and returns smoothly without free fuel', () => {
  let run = usePowerItem(ready(), 0);
  run = seconds(run, 3);
  expect(run.speed).toBeGreaterThan(vehicles.motorcycle.maxSpeed);
  expect(run.speed).toBeLessThanOrEqual(vehicles.motorcycle.maxSpeed * itemBalance.boostFactor + 1e-8);
  expect(run.fuel).toBeCloseTo(vehicles.motorcycle.fuelCapacity - run.distance * vehicles.motorcycle.fuelPerMeter, 7);
  const paused = { ...run, phase: 'paused' as const };
  expect(seconds(paused, 10)).toBe(paused);
  run = seconds(run, 1);
  expect(hasBoost(run)).toBe(false); expect(jumpHeight(run)).toBe(0);
  const slow = seconds(run, 4);
  expect(slow.speed).toBeCloseTo(vehicles.motorcycle.cruiseSpeed);
  expect(initialRun().powers.starUntil).toBe(0); expect(initialRun().inventory).toEqual([null, null]);
});
it('jump clears a short hole but landing in a long hole resumes contact damage for every vehicle footprint', () => {
  for (const kind of Object.keys(vehicles) as VehicleKind[]) {
    let run = ready(kind); const hole = entity('pothole', 'long', 5, 0); hole.length = 150; hole.width = 9.6;
    run.world.entities = [hole]; run = usePowerItem(run, 0);
    // Beginning inside the hole is not immune before lift-off.
    run = seconds(run, .5); const hp = run.durability;
    expect(jumpHeight(run)).toBeGreaterThan(0); expect(clears(run, .15)).toBe(true);
    run = seconds(run, .5); expect(run.durability).toBeCloseTo(hp, 7);
    run = seconds(run, 1); expect(run.durability).toBeLessThan(hp);
  }
  let run = ready(); const hole = entity('pothole', 'short', 15, 0); hole.length = 3;
  run.world.entities = [hole]; run = seconds(usePowerItem(run, 0), 2);
  expect(run.durability).toBe(vehicles.motorcycle.durabilityCapacity);
});
it('jump does not grant blanket immunity to tall traffic and crash cancels boost/flight', () => {
  let run = usePowerItem(ready(), 0);
  const truck = entity('traffic', 'tall', 18, 0); truck.trafficKind = 'container'; truck.width = 2; truck.length = 2;
  truck.speed = 0; truck.baseSpeed = 0; truck.hp = 300;
  run.world.entities = [truck]; run = seconds(run, 1);
  expect(run.crash).not.toBeNull(); expect(hasBoost(run)).toBe(false); expect(jumpHeight(run)).toBe(0);
  const blocked = usePowerItem(run, 1); expect(blocked).toBe(run);
});
it('star blocks water fuel loss, hole money/HP and ordinary traffic without damaging NPCs, then expires inside contact', () => {
  let run = ready();
  const hole = entity('pothole', 'hole', 30, 0), water = entity('water', 'water', 30, 0);
  hole.length = water.length = 200; hole.width = water.width = 9.6;
  const car = entity('traffic', 'car', 2, 0); car.speed = 0; car.baseSpeed = 0;
  run.world.entities = [hole, water, car]; run = usePowerItem(run, 1);
  const maxHP = run.durability, money = run.money;
  run = seconds(run, 4.5);
  expect(run.durability).toBe(maxHP); expect(run.crash).toBeNull();
  expect(run.fuel).toBeCloseTo(vehicles.motorcycle.fuelCapacity - run.distance * vehicles.motorcycle.fuelPerMeter, 7);
  expect(run.money).toBeCloseTo(money + run.distance * balance.moneyPerMeter, 7);
  run = seconds(run, 1); expect(hasStar(run)).toBe(false); expect(run.durability).toBeLessThan(maxHP);
});
it('star expiry within a tick has no spare immunity tick; star cannot refuel or prevent fuel failure', () => {
  const run = ready(); const hole = entity('pothole', 'hole', 0, 0); hole.length = 100; hole.width = 9.6;
  hole.lastHit = 0; run.world.entities = [hole];
  run.powers.starUntil = balance.fixedStep / 2;
  const after = stepRun(run, noInput());
  expect(run.durability - after.durability).toBeCloseTo(balance.potholeDamagePerSecond * balance.fixedStep / 2, 8);
  const coasting = { ...usePowerItem(ready(), 1), fuel: 0, motion: 'coasting' as const, coastRemaining: .01 };
  expect(stepRun(coasting, noInput()).result?.reason).toBe('fuel');
});
it('star preserves the junction event and miss, while blocking ordinary barrier damage; swapping cannot duplicate items', () => {
  let run = usePowerItem(ready(), 1);
  const crossing = junction(run.seed, 0);
  // Find a seeded blocked junction, keeping the proper route index.
  for (let i = 0; i < 20; i++) {
    const j = junction(run.seed, i);
    if (!j.blockedStraight) continue;
    run = { ...run, distance: j.distance + 3.9, route: { ...run.route, index: i } }; break;
  }
  const after = stepRun(run, noInput());
  expect(after.route.misses).toBe(1); expect(after.durability).toBe(run.durability); expect(after.crash).toBeNull();
  expect(crossing.distance).toBeGreaterThan(0);
  const spare = newVehicle('car4', 'spare');
  const swapped = switchVehicle({ ...after, vehicleInstances: [...after.vehicleInstances, spare] });
  expect(swapped.inventory).toEqual(['nitro', null]); expect(swapped.powers).toEqual(after.powers);
});
it('seeded runs using both powers stay finite and reproducible with no mutation of the source state', () => {
  const outcomes = [];
  for (let seed = 1; seed <= 20; seed++) {
    const play = () => {
      let run: Run = { ...initialRun(seed), phase: 'running', inventory: ['nitro', 'star'] };
      for (let tick = 0; tick < 1800 && run.phase === 'running'; tick++) {
        if (tick === 180) run = usePowerItem(run, 0);
        if (tick === 600) run = usePowerItem(run, 1);
        run = stepRun(run, { ...noInput(), left: tick % 360 < 180, right: tick % 360 >= 180 });
        if (!Number.isFinite(run.distance + run.speed + run.fuel + run.durability)) throw new Error('Non-finite power simulation');
      }
      return run;
    };
    const a = play(); expect(a).toEqual(play()); outcomes.push({ seed, distance: Math.round(a.distance), phase: a.phase });
  }
  console.log(JSON.stringify({ config: balance.version, scenario: 'power-items-30s', outcomes }));
});

it('active effects and landing produce the same state at 30/60/144 render FPS', () => {
  const play = (fps: number) => {
    let run = usePowerItem(usePowerItem(ready('container'), 0), 1);
    const hole = entity('pothole', 'long-fps-hole', 20, 0); hole.width = 9.6; hole.length = 140;
    run.world.entities = [hole]; const clock = new FixedClock();
    for (let frame = 0; frame < fps * 6; frame++) clock.advance(1 / fps, () => { run = stepRun(run, noInput()); });
    return run;
  };
  expect(play(30)).toEqual(play(60)); expect(play(144)).toEqual(play(60));
});
it('flight clears low traffic only while the entire footprint passes before landing', () => {
  const small = entity('traffic', 'low-car', 16, 0); small.length = 2; small.speed = 0; small.baseSpeed = 0;
  let run = usePowerItem(ready(), 0); run.world.entities = [small];
  run = seconds(run, 2); expect(run.crash).toBeNull(); expect(run.durability).toBe(70);
  const long = { ...small, id: 'long-contact', distance: 25, length: 70, hp: 10000 };
  run = usePowerItem(ready('container'), 0); run.world.entities = [long];
  // Start at the jump apex to isolate the rear footprint remaining in contact at landing.
  run.activeSeconds = itemBalance.jumpSeconds / 2;
  run = seconds(run, 1); expect(run.crash).not.toBeNull();
});
