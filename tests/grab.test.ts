import { expect, it } from 'vitest';
import { balance, itemBalance } from '../src/config';
import { developmentScenario } from '../src/development';
import { usePowerItem } from '../src/items';
import { noInput } from '../src/simulation';
import { dropPassenger, initialRun, pickUpPassenger, selectTurn, stepRun, switchVehicle, type Run } from '../src/survival';
import { enterShop, transact } from '../src/shop';
import { entity, fillWorld, initialWorld } from '../src/world';
import { newVehicle, vehicles, type VehicleKind } from '../src/vehicles';
import { junction } from '../src/route';

function ready(seed = 17, kind: VehicleKind = 'motorcycle'): Run {
  const run = developmentScenario(initialRun(seed, 'grab-test'), 'grab'), vehicle = newVehicle(kind, 'driver');
  return { ...run, phase: 'running', vehicleInstances: [vehicle, newVehicle('car4', 'spare')], activeVehicleId: vehicle.id,
    fuel: vehicle.fuel, durability: vehicle.durability, speed: vehicles[kind].cruiseSpeed };
}
function drive(run: Run, seconds: number): Run {
  for (let i = 0; i < Math.round(seconds / balance.fixedStep); i++) run = stepRun(run, noInput());
  return run;
}
function board(run: Run): Run {
  const npc = run.world.entities.find(e => e.passengerType === 'grab' && !e.consumed)!;
  // Unit setup moves into the real pickup window; money is still earned only by stepRun.
  const vehicle = vehicles[run.vehicleInstances.find(v => v.id === run.activeVehicleId)!.kind];
  const bound = (balance.laneWidth * balance.laneCount - vehicle.width) / 2;
  return pickUpPassenger({ ...run, distance: npc.distance, x: Math.max(-bound, Math.min(bound, npc.x)) });
}

it('a package keeps its slot for three successful calls, requires F, and never rewards on call or pickup', () => {
  let run = ready(); const initialMoney = run.money;
  for (let i = 0; i < itemBalance.grabUses; i++) {
    run = { ...run, activeSeconds: run.activeSeconds + itemBalance.grabCooldown };
    const before = structuredClone(run), called = usePowerItem(run, 0);
    expect(run).toEqual(before);
    expect(called.grabUses[0]).toBe(itemBalance.grabUses - i - 1);
    expect(called.inventory[0]).toBe(i === itemBalance.grabUses - 1 ? null : 'grab');
    expect(called.money).toBe(initialMoney); expect(called.riderIds).toHaveLength(i);
    expect(usePowerItem(called, 0)).toBe(called); // pending NPC prevents spamming even before cooldown
    const boarded = board(called);
    expect(boarded.riderIds).toHaveLength(i + 1); expect(boarded.grabRiderIds).toEqual(boarded.riderIds);
    expect(pickUpPassenger(boarded)).toBe(boarded);
    expect(boarded.money).toBe(initialMoney); run = boarded;
  }
  expect(new Set(run.riderIds).size).toBe(itemBalance.grabUses);
  expect(usePowerItem(run, 0)).toBe(run); expect(run.grabSequence).toBe(itemBalance.grabUses);
});

it('shop initializes per-slot charges once, rejects stale/full/poor requests, and never refills an existing package', () => {
  const start = enterShop({ ...developmentScenario(initialRun(), 'shop'), phase: 'running' });
  const command = { kind: 'power-item' as const, item: 'grab' as const, sequence: start.economySequence };
  const bought = transact(start, command).run;
  expect(bought.inventory).toEqual(['grab', null]); expect(bought.grabUses).toEqual([3, 0]);
  expect(bought.money).toBe(start.money - itemBalance.grabPrice);
  expect(transact(bought, command).run).toBe(bought);
  expect(transact({ ...start, money: 0 }, command).run.money).toBe(0);
  const partial = { ...bought, grabUses: [1, 0] };
  expect(transact(partial, { ...command, sequence: partial.economySequence }).run).toBe(partial);
  const full: Run = { ...start, inventory: ['star', 'nitro'] };
  expect(transact(full, command).run).toBe(full);
  const slotTwo = transact({ ...start, inventory: ['star', null] }, command).run;
  expect(slotTwo.inventory).toEqual(['star', 'grab']); expect(slotTwo.grabUses).toEqual([0, 3]);
  expect(usePowerItem({ ...slotTwo, phase: 'running', shopId: null }, 0).grabUses).toEqual([0, 3]);
});

it('blocked or moving-traffic pickup pockets, cooldown, inactive phases and unchosen forks do not consume a call', () => {
  const run = ready();
  for (const phase of ['ready', 'paused', 'ended'] as const) {
    const blocked = { ...run, phase }; expect(usePowerItem(blocked, 0)).toBe(blocked);
  }
  const wall = entity('water', 'blocked-all', 90, 0); wall.width = 20; wall.length = 300;
  const blocked = { ...run, world: { ...run.world, entities: [wall] } };
  expect(usePowerItem(blocked, 0)).toBe(blocked);
  const cars = [-3.2, 0, 3.2].map((x, i) => ({ ...entity('traffic', 'moving-' + i, 160, x), speed: -20, width: 3.2 }));
  const moving = { ...run, world: { ...run.world, entities: cars } };
  expect(usePowerItem(moving, 0)).toBe(moving);
  const waiting = usePowerItem(run, 0), boarded = board(waiting);
  expect(usePowerItem(boarded, 0)).toBe(boarded); // cooldown persists after an immediate pickup
  const j = junction(run.seed, 0), atFork = { ...run, distance: j.distance - 12 };
  expect(usePowerItem(atFork, 0)).toBe(atFork);
});

it('safe spawn is seeded, respects current footprint, and preserves hazard RNG for every vehicle', () => {
  for (const kind of Object.keys(vehicles) as VehicleKind[]) for (let seed = 1; seed <= 10; seed++) {
    const run = ready(seed, kind), called = usePowerItem(run, 0);
    expect(called).toEqual(usePowerItem(run, 0));
    expect(called.world.rng).toBe(run.world.rng);
    const npc = called.world.entities.find(e => e.passengerType === 'grab')!;
    expect(npc).toBeDefined(); expect(npc.distance - run.distance).toBeGreaterThanOrEqual(run.speed * balance.warningSeconds);
    expect(Math.abs(npc.x) - npc.width / 2).toBeGreaterThanOrEqual(balance.laneWidth * balance.laneCount / 2 - 1e-9);
    const bound = (balance.laneWidth * balance.laneCount - vehicles[kind].width) / 2;
    expect(Math.abs(npc.x) - bound).toBeLessThanOrEqual(balance.passengerLateralReach);
    expect(board(called).riderIds).toContain(npc.id);
    expect(npc.passengerMotion?.idle).toBe(true);
  }
});

it('clear roads select both verges by seed/sequence, never the middle or simply the nearest player side', () => {
  const banks = new Set<number>(), sequenceBanks = new Set<number>();
  for (let seed = 1; seed <= 100; seed++) {
    const run = ready(seed);
    const spawn = (x: number) => usePowerItem({ ...run, x }, 0).world.entities.find(e => e.passengerType === 'grab')!;
    const middle = spawn(0), left = spawn(-4), right = spawn(4);
    expect(Math.sign(left.x)).toBe(Math.sign(middle.x)); expect(Math.sign(right.x)).toBe(Math.sign(middle.x));
    banks.add(Math.sign(middle.x));
  }
  for (let sequence = 0; sequence < 12; sequence++) {
    const npc = usePowerItem({ ...ready(), grabSequence: sequence }, 0).world.entities.find(e => e.passengerType === 'grab')!;
    sequenceBanks.add(Math.sign(npc.x));
  }
  expect([...banks].sort()).toEqual([-1, 1]); expect([...sequenceBanks].sort()).toEqual([-1, 1]);
});

it('a blocked preferred verge can fall back only to the other safe verge, without moving the passenger onto the road', () => {
  const run = ready(), preferred = usePowerItem(run, 0).world.entities.find(e => e.passengerType === 'grab')!;
  const wall = entity('water', 'blocked-one-verge', 80, Math.sign(preferred.x) * balance.laneWidth);
  wall.width = balance.laneWidth; wall.length = 250;
  const called = usePowerItem({ ...run, world: { ...run.world, entities: [wall] } }, 0);
  const npc = called.world.entities.find(e => e.passengerType === 'grab')!;
  expect(Math.sign(npc.x)).toBe(-Math.sign(preferred.x));
  expect(Math.abs(npc.x)).toBeGreaterThan(balance.laneWidth * balance.laneCount / 2);
  expect(called.grabUses[0]).toBe(2);
});

it('future hazards reserve the on-road pickup footprint for a passenger waiting beyond either verge', () => {
  let checked = 0;
  for (let seed = 1; seed <= 30; seed++) for (const side of [-1, 1]) {
    const pocket = entity('passenger', 'verge', 130, 0); pocket.passengerType = 'grab';
    pocket.x = side * (balance.laneWidth * balance.laneCount / 2 + pocket.width / 2);
    const world = initialWorld(seed), plain = fillWorld(world, 0);
    const reserved = fillWorld({ ...world, entities: [pocket] }, 0);
    expect(reserved.rng).toBe(plain.rng);
    const pickupX = side * (balance.laneWidth * balance.laneCount - vehicles.motorcycle.width) / 2;
    const blocks = (e: typeof pocket) => e.kind === 'water' &&
      Math.abs(e.x - pickupX) <= (e.width + vehicles.motorcycle.width) / 2 + itemBalance.grabClearance &&
      Math.abs(e.distance - pocket.distance) <= (e.length + vehicles.motorcycle.length) / 2 + itemBalance.grabClearance;
    if (plain.entities.some(blocks)) checked++;
    expect(reserved.entities.some(blocks)).toBe(false);
  }
  expect(checked).toBeGreaterThan(0);
});

it('Grab changes only the boarded rider bonus, retains ordinary score and load penalties, and never earns during pause', () => {
  const special = board(usePowerItem(ready(), 0));
  const normal = { ...special, grabRiderIds: [] };
  const a = drive(special, 1), b = drive(normal, 1), ds = a.distance - special.distance;
  expect(a.distance).toBe(b.distance); expect(a.score).toBe(b.score); expect(a.fuel).toBe(b.fuel);
  expect(a.money - special.money).toBeCloseTo(ds * (balance.moneyPerMeter + balance.riderMoneyPerMeter * itemBalance.grabMoneyMultiplier), 7);
  expect(a.money - b.money).toBeCloseTo(ds * balance.riderMoneyPerMeter * (itemBalance.grabMoneyMultiplier - 1), 7);
  const paused = { ...special, phase: 'paused' as const }; expect(drive(paused, 5)).toBe(paused);
});

it('special identity follows G/F and Tab without duplication, lost crash riders stay refused and stop earning', () => {
  let run = board(usePowerItem(ready(), 0)); const id = run.riderIds[0];
  run = switchVehicle(run); expect(run.grabRiderIds).toEqual([id]);
  const dropped = dropPassenger(run);
  expect(dropped.grabRiderIds).toEqual([]);
  const npc = dropped.world.entities.find(e => !e.consumed && e.riderId === id)!;
  expect(npc.passengerType).toBe('grab');
  const back = pickUpPassenger({ ...dropped, activeSeconds: npc.lastHit + 1, distance: npc.passengerMotion!.homeDistance, x: npc.passengerMotion!.homeX,
    world: { ...dropped.world, entities: dropped.world.entities.map(e => e.id === npc.id ? { ...e, x: npc.passengerMotion!.homeX, distance: npc.passengerMotion!.homeDistance } : e) } });
  expect(back.riderIds).toEqual([id]); expect(back.grabRiderIds).toEqual([id]);
  for (let seed = 1; seed <= 10; seed++) {
    let crash = { ...ready(seed, 'car4'), riderIds: ['a', 'b', 'c'], grabRiderIds: ['a', 'b', 'c'] };
    const car = entity('traffic', 'hit', 6, 0); car.speed = 0; car.baseSpeed = 0;
    crash.world.entities = [car];
    for (let i = 0; i < 60 && !crash.crash; i++) crash = stepRun(crash, noInput());
    expect(crash.crash).not.toBeNull();
    const returning = crash.crash!.returningRiderIds;
    for (const fallen of crash.world.entities.filter(e => e.id.startsWith('fallen-'))) {
      expect(fallen.passengerType).toBe('grab'); expect(fallen.pickupable).toBe(false);
      expect(crash.grabRiderIds).not.toContain(fallen.riderId);
    }
    crash = drive(crash, 5);
    expect(crash.riderIds).toEqual(returning); expect(crash.grabRiderIds).toEqual(returning);
  }
});

it('a missed or retired customer never boards automatically, and restart removes charges/traits/call sequence', () => {
  let run = usePowerItem(ready(), 0);
  run = drive(run, 12);
  expect(run.riderIds).toEqual([]); expect(run.grabUses[0]).toBe(2);
  expect(run.world.entities.some(e => e.passengerType === 'grab' && !e.consumed)).toBe(false);
  const j = junction(17, 0);
  let fork: Run = { ...ready(), distance: j.distance - 15 };
  fork = selectTurn(fork, 'left'); expect(fork.route.choice).toBe('left');
  const called = usePowerItem(fork, 0);
  expect(called.world.entities.filter(e => e.passengerType === 'grab')).toHaveLength(1);
  expect(called.world.retired.filter(e => e.entity.passengerType === 'grab')).toHaveLength(0);
  const fresh = initialRun(17);
  expect(fresh.grabUses).toEqual([0, 0]); expect(fresh.grabRiderIds).toEqual([]); expect(fresh.grabSequence).toBe(0);
});

it('future generation preserves hazard RNG and never places a new hazard into a reserved Grab pickup pocket', () => {
  const base = initialWorld(17), pocket = entity('passenger', 'reserved-grab', 130, 0); pocket.passengerType = 'grab';
  const reserved = fillWorld({ ...base, entities: [pocket] }, 0);
  const plain = fillWorld(base, 0);
  expect(reserved.rng).toBe(plain.rng);
  expect(reserved.entities.filter(e => e.kind === 'water').every(e => Math.abs(e.x) > (e.width + vehicles.motorcycle.width) / 2 + itemBalance.grabClearance ||
    Math.abs(e.distance - pocket.distance) > (e.length + vehicles.motorcycle.length) / 2 + itemBalance.grabClearance)).toBe(true);
});

it('measures actual earnings per minute for normal/Grab riders at equal load and exposes package break-even separately', () => {
  const samples = [];
  for (const kind of ['motorcycle', 'car4', 'bus'] as const) for (const count of kind === 'bus' ? [0, 1, 3, 12, 24] : [0, 1, 3]) {
    const run = ready(17, kind); run.riderIds = Array.from({ length: count }, (_, i) => 'income-' + i);
    const normal = drive(run, 60), special = drive({ ...run, grabRiderIds: [...run.riderIds] }, 60);
    expect(special.distance).toBeCloseTo(normal.distance, 7);
    samples.push({ kind, count, metres: Math.round(special.distance), ordinaryIncome: +(normal.money - run.money).toFixed(2),
      grabIncome: +(special.money - run.money).toFixed(2), fuelLeft: +special.fuel.toFixed(2) });
  }
  console.log(JSON.stringify({ config: balance.version, scenario: 'grab-income-60s', samples,
    idealBreakEvenMetresWithThreeRiders: itemBalance.grabPrice / (itemBalance.grabUses * balance.riderMoneyPerMeter * (itemBalance.grabMoneyMultiplier - 1)) }));
});

it('samples real calls and manual pickup commands on 30 seeded hazardous routes without charge or roster drift', () => {
  const outcomes = [];
  for (let seed = 1; seed <= 30; seed++) {
    const play = () => {
      let run: Run = { ...initialRun(seed, 'grab-seeded-' + seed), phase: 'running', inventory: ['grab', null], grabUses: [3, 0] };
      for (let tick = 0; tick < 1200 && run.phase === 'running'; tick++) {
        if (tick % 120 === 0) run = usePowerItem(run, 0);
        const target = run.world.entities.find(e => e.passengerType === 'grab' && !e.consumed && e.pickupable !== false);
        const x = target?.x ?? 0;
        run = pickUpPassenger(run);
        run = stepRun(run, { ...noInput(), left: run.x > x + .1, right: run.x < x - .1 });
        if (!Number.isFinite(run.money + run.fuel + run.distance) || run.grabUses.some(n => n < 0)) throw new Error('Invalid Grab run');
      }
      return run;
    };
    const run = play(); expect(run).toEqual(play());
    expect(new Set(run.riderIds).size).toBe(run.riderIds.length);
    expect(run.grabSequence + run.grabUses[0]).toBe(3);
    outcomes.push({ seed, calls: run.grabSequence, aboard: run.grabRiderIds.length, lost: run.lostPassengers,
      metres: Math.round(run.distance), money: +run.money.toFixed(2), phase: run.phase });
  }
  console.log(JSON.stringify({ config: balance.version, scenario: 'grab-real-route-20s', outcomes }));
});
