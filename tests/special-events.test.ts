import { expect, it } from 'vitest';
import { balance, eventBalance } from '../src/config';
import { initialRun, stepRun, pickUpPassenger, selectTurn, type Run } from '../src/survival';
import { noInput } from '../src/simulation';
import { entity, fillWorld, initialWorld } from '../src/world';
import { newVehicle, vehicles, type VehicleKind } from '../src/vehicles';
import { requestJump, usePowerItem } from '../src/items';
import { specialKinds, specialPlan, type SpecialKind } from '../src/special-events';
import { developmentScenario } from '../src/development';
import { enterShop, transact } from '../src/shop';

function ready(kind: SpecialKind, distance = 8, reserve = true, vehicle: VehicleKind = 'motorcycle'): Run {
  const run = initialRun(17), active = newVehicle(vehicle, 'active'), obstacle = entity(kind, 'test-event', distance, 0);
  obstacle.eventAt = 0;
  return { ...run, phase: 'running', inventory: ['banana', 'star'], vehicleInstances: [active, ...(reserve ? [newVehicle('car4', 'spare')] : [])],
    activeVehicleId: active.id, fuel: active.fuel, durability: active.durability, speed: vehicles[vehicle].cruiseSpeed,
    world: { ...initialWorld(17), entities: [obstacle], nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9,
      nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 } };
}
function seconds(run: Run, duration: number, brake = false): Run {
  for (let i = 0; i < Math.round(duration / balance.fixedStep); i++) run = stepRun(run, { ...noInput(), brake });
  return run;
}
it('police take available money, confiscate once, halve only existing reserve fuel when short; passengers stay', () => {
  let run = ready('police'); run.money = 20; run.riderIds = ['a', 'b']; run.vehicleInstances[1].fuel = 6;
  run = seconds(run, 1);
  expect(run.phase).toBe('running'); expect(run.activeVehicleId).toBe('spare');
  expect(run.money).toBeLessThan(10); expect(run.money).toBeGreaterThanOrEqual(0);
  expect(run.fuel).toBeLessThanOrEqual(3); expect(run.fuel).toBeGreaterThan(2.9);
  expect(run.riderIds).toEqual(['a', 'b']); expect(run.vehicleInstances.some(v => v.id === 'active')).toBe(false); expect(run.vehicleInstances).toHaveLength(1);
  expect(run.feedbackCounts.police).toBe(1); expect(seconds(run, 2).feedbackCounts.police).toBe(1);
});
it('fixed fines do not grow with wealth; sufficient police money leaves reserve fuel intact; no usable reserve ends', () => {
  for (const money of [500, 50000]) {
    const before = ready('police'); before.money = money;
    const after = seconds(before, .5);
    expect(after.money).toBeCloseTo(money - eventBalance.policeFine + after.distance * balance.moneyPerMeter);
    expect(after.activeVehicleId).toBe('spare'); expect(after.fuel).toBeGreaterThan(vehicles.car4.fuelCapacity - .1);
  }
  for (const fuel of [0, 1]) {
    const run = ready('police'); run.vehicleInstances[1].fuel = fuel; run.vehicleInstances[1].disabled = true;
    expect(seconds(run, 1).result?.reason).toBe('police');
  }
  expect(seconds(ready('police', 8, false), 1).result?.reason).toBe('police');
});
it('militia take up to the fixed fine, never confiscate and never create negative money', () => {
  for (const money of [0, 20, 500]) {
    const before = ready('militia'); before.money = money;
    const after = seconds(before, 1);
    expect(after.activeVehicleId).toBe('active'); expect(after.phase).toBe('running');
    expect(after.money).toBeGreaterThanOrEqual(0); expect(after.feedbackCounts.militia).toBe(1);
    if (money === 500) expect(after.money).toBeCloseTo(money - eventBalance.militiaFine +
      after.distance * balance.moneyPerMeter);
  }
});
it('banana consumes only its slot for one nearest officer in the reaction window, never outside/paused or for train', () => {
  const far = ready('police', 200); expect(usePowerItem(far, 0)).toBe(far);
  const paused = { ...ready('police'), phase: 'paused' as const }; expect(usePowerItem(paused, 0)).toBe(paused);
  for (const kind of ['police', 'militia'] as const) {
    const before = ready(kind), after = usePowerItem(before, 0);
    expect(after.inventory).toEqual([null, 'star']); expect(before.world.entities[0].consumed).toBe(false);
    expect(after.world.entities[0].consumed).toBe(true); expect(seconds(after, 1).activeVehicleId).toBe('active');
    expect(seconds(after, 1).money).toBeGreaterThan(before.money);
    expect(usePowerItem(after, 0)).toBe(after);
  }
  const train = ready('train'); expect(usePowerItem(train, 0)).toBe(train);
});
it('star blocks jam crash, but police/militia/accident/train still trigger; train bypasses reserve', () => {
  const jam = seconds(usePowerItem(ready('jam'), 1), 1); expect(jam.crash).toBeNull(); expect(jam.durability).toBe(balance.durabilityCapacity);
  const police = seconds(usePowerItem(ready('police'), 1), 1); expect(police.activeVehicleId).toBe('spare');
  const militia = seconds(usePowerItem(ready('militia'), 1), 1); expect(militia.money).toBeLessThan(balance.initialMoney);
  const accident = seconds(usePowerItem(ready('accident'), 1), 1); expect(accident.activeVehicleId).toBe('spare');
  const train = seconds(usePowerItem(ready('train'), 1), 1); expect(train.result?.reason).toBe('train');
  expect(train.activeVehicleId).toBe('active'); expect(train.vehicleInstances[1].disabled).toBe(false);
  expect(stepRun(train, noInput())).toBe(train);
});
it('jam crashes once and crash recovery ignores all damage/debuff; a train remains terminal while falling', () => {
  const run = seconds(ready('jam'), .5); expect(run.crash).not.toBeNull(); expect(run.feedbackCounts.jam).toBe(1);
  const hole = entity('pothole', 'hole', run.distance, run.x); hole.width = 9.6; hole.length = 100;
  const water = entity('water', 'water', run.distance, run.x); water.width = 9.6; water.length = 100;
  run.world.entities.push(hole, water);
  const after = seconds(run, 1); expect(after.fuel).toBe(run.fuel); expect(after.durability).toBe(run.durability);
  const train = entity('train', 'train', run.distance + 1, 0); train.eventAt = 0;
  expect(seconds({ ...run, world: { ...run.world, entities: [train] } }, 1).result?.reason).toBe('train');
});
it('accident writes a single result or replaces once, without free refill or a chain of deaths', () => {
  const before = ready('accident'); before.vehicleInstances[1].durability = 41; before.vehicleInstances[1].fuel = 4;
  const run = seconds(before, 1);
  expect(run.activeVehicleId).toBe('spare'); expect(run.durability).toBe(41); expect(run.fuel).toBeLessThanOrEqual(4);
  expect(run.feedbackCounts.accident).toBe(1); expect(run.vehicleInstances[0].durability).toBe(0);
  const ended = seconds(ready('accident', 8, false), 1); expect(ended.result?.reason).toBe('damage');
  expect(stepRun(ended, noInput())).toBe(ended);
});
it('train wins simultaneous ties against repair/accident and cannot be tunneled at high speed', () => {
  for (const kind of ['motorcycle', 'car4', 'container'] as const) {
    const run = ready('train', 8, true, kind); run.speed = 1000;
    const repair = entity('repair', 'repair', 8, 0); repair.length = 2;
    const accident = entity('accident', 'accident', 8, 0); accident.length = 2;
    run.world.entities.unshift(repair, accident);
    const after = stepRun(run, noInput()); expect(after.result?.reason).toBe('train');
    expect(after.world.entities.find(e => e.id === 'repair')?.consumed).toBe(false);
  }
});
it('train clock changes exactly at the closed/open boundary inside a fixed tick', () => {
  const closing = ready('train', 0); closing.activeSeconds = 16 - .001;
  expect(stepRun(closing, noInput()).result?.seconds).toBeCloseTo(16, 8);
  const opening = ready('train', 0); opening.activeSeconds = 8 - .001;
  expect(stepRun(opening, noInput()).result?.seconds).toBeCloseTo(8 - .001, 8);
  const open = ready('train', 0); open.activeSeconds = 8;
  expect(stepRun(open, noInput()).phase).toBe('running');
});
it('turning retires the old event and creates a separate branch event, without copying its state', () => {
  const run = initialRun(17); run.phase = 'running'; run.distance = 1590; run.route.index = 1;
  run.world = fillWorld(initialWorld(17), run.distance);
  const old = run.world.entities.find(e => e.id.startsWith('event-'))!; expect(old).toBeDefined();
  const left = selectTurn(run, 'left'), right = selectTurn(run, 'right');
  for (const chosen of [left, right]) {
    expect(chosen.world.retired.some(e => e.entity.id === old.id)).toBe(true);
    expect(chosen.world.entities.some(e => e.id === old.id)).toBe(false);
    expect(chosen.world.entities.find(e => e.id.startsWith('event-'))?.id).not.toBe(old.id);
  }
});
it('brake stops safely, waiting earns no distance income, releasing in the open phase crosses without nitro', () => {
  let run = ready('train', 70);
  run = seconds(run, 8.1, true); expect(run.speed).toBe(0); expect(run.result).toBeNull();
  const held = seconds(run, .2, true); expect(held.distance).toBe(run.distance); expect(held.money).toBe(run.money);
  run = seconds(held, 7);
  expect(run.distance).toBeGreaterThan(75); expect(run.phase).toBe('running');
});
it('correctly timed nitro+Space clears the actual train; early/late jump and tall/long vehicle cannot cheat contact', () => {
  let run = ready('train', 14); run.inventory = ['nitro', 'star'];
  run = requestJump(usePowerItem(run, 0)); run = seconds(run, 2);
  expect(run.phase).toBe('running'); expect(run.distance).toBeGreaterThan(25);
  const late = ready('train', 4); late.inventory = ['nitro', null];
  expect(seconds(requestJump(usePowerItem(late, 0)), 1).result?.reason).toBe('train');
  const long = ready('train', 14, true, 'container'); long.inventory = ['nitro', null];
  expect(seconds(requestJump(usePowerItem(long, 0)), 2).result?.reason).toBe('train');
});
it('broken event spawns exactly one manual F passenger, no automatic reward, and never duplicates loot', () => {
  let run = seconds(ready('broken'), .5); expect(run.riderIds).toEqual([]);
  expect(run.world.entities.filter(e => e.kind === 'passenger')).toHaveLength(1);
  expect(run.feedbackCounts.broken).toBe(1);
  const npc = run.world.entities.find(e => e.kind === 'passenger')!;
  run = pickUpPassenger({ ...run, x: npc.x, distance: npc.distance }); expect(run.riderIds).toHaveLength(1);
  const later = seconds(run, 2); expect(later.feedbackCounts.broken).toBe(1);
  expect(later.world.entities.filter(e => e.kind === 'passenger' && !e.consumed)).toHaveLength(0);
});
it('shop sells a banana into one empty slot and rejects duplicate/stale purchases', () => {
  const fixture = developmentScenario(initialRun(), 'shop'); fixture.world.entities[0].shopStock!.items!.banana = 1;
  const run = enterShop({ ...fixture, phase: 'running' });
  const command = { kind: 'power-item' as const, item: 'banana' as const, sequence: run.economySequence };
  const bought = transact(run, command).run; expect(bought.inventory).toEqual(['banana', null]);
  expect(bought.money).toBe(run.money - eventBalance.bananaPrice);
  expect(transact(bought, command).run).toBe(bought);
});
it('event stream is reproducible, covers all types, respects cooldown and leaves a lane wide enough for container', () => {
  const kinds = new Set<SpecialKind>(), variants = new Set<string>();
  for (let seed = 1; seed <= 30; seed++) {
    const a = fillWorld(initialWorld(seed), 950), b = fillWorld(initialWorld(seed), 950);
    expect(a).toEqual(b);
    const previous = new Map<SpecialKind, number>();
    for (let i = 0; i < 30; i++) {
      const plan = specialPlan(i, seed); kinds.add(plan.kind);
      if (plan.variant) variants.add(plan.variant);
      if (i) expect(plan.distance - specialPlan(i - 1, seed).distance).toBeGreaterThanOrEqual(eventBalance.gap);
      const cooldown = plan.kind === 'police' ? eventBalance.policeCooldown :
        plan.kind === 'train' ? eventBalance.trainCooldown :
          plan.kind === 'accident' ? eventBalance.accidentCooldown : 0;
      if (previous.has(plan.kind)) expect(plan.distance - previous.get(plan.kind)!).toBeGreaterThanOrEqual(cooldown);
      previous.set(plan.kind, plan.distance);
      if (plan.kind === 'jam' || plan.kind === 'accident') {
        const e = entity(plan.kind, 'test', plan.distance, plan.x);
        const freeWidth = 4.8 + Math.abs(e.x) - e.width / 2;
        expect(freeWidth).toBeGreaterThan(vehicles.container.width);
      }
    }
  }
  expect([...kinds].sort()).toEqual([...specialKinds].sort());
  expect([...variants].sort()).toEqual(['ambulance', 'barrier', 'vendor']);
});

it('P6 simulation: 30 seeds × eight vehicles × six event types, with and without the appropriate response', () => {
  const summary = { cases: 0, bananaEscapes: 0, trainStops: 0, accidentReplacements: 0, terminalTrains: 0 };
  for (let seed = 1; seed <= 30; seed++) for (const kind of Object.keys(vehicles) as VehicleKind[]) for (const event of specialKinds) {
    let run = ready(event, 30, true, kind); run.seed = seed; run.money = seed * 10;
    if (event === 'police' || event === 'militia') {
      run = usePowerItem(run, 0); expect(run.inventory[0]).toBeNull(); summary.bananaEscapes++;
    }
    run = seconds(run, 4, event === 'train');
    expect([run.fuel, run.durability, run.money, run.distance, run.activeSeconds].every(Number.isFinite)).toBe(true);
    expect(run.money).toBeGreaterThanOrEqual(0); expect(run.fuel).toBeGreaterThanOrEqual(0);
    if (event === 'train') {
      expect(run.speed).toBe(0); expect(run.phase).toBe('running'); summary.trainStops++;
      const unresponsive = ready('train', 8, true, kind); unresponsive.seed = seed;
      expect(seconds(unresponsive, 1).result?.reason).toBe('train'); summary.terminalTrains++;
    } else if (event === 'accident') {
      expect(run.activeVehicleId).toBe('spare'); expect(run.feedbackCounts.accident).toBe(1); summary.accidentReplacements++;
    } else expect(run.activeVehicleId).toBe('active');
    summary.cases++;
  }
  console.log(JSON.stringify({ config: balance.version, scenario: 'P6 controlled event/response matrix, not a human playtest or natural-route survival rate', seeds: '1–30', ...summary }));
});
