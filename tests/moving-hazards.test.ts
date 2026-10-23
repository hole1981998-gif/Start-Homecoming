import { expect, it } from 'vitest';
import { balance, eventBalance, movingBalance, movingVersion } from '../src/config';
import { advanceCrossMotion, crossX } from '../src/cross-motion';
import { developmentScenario } from '../src/development';
import { usePowerItem, requestJump } from '../src/items';
import { movingScenarios } from '../src/moving-scenarios';
import { initialRun, stepRun, type Run } from '../src/survival';
import { FixedClock, noInput, type Input } from '../src/simulation';
import { entity, type Entity } from '../src/world';
import { advanceInteractingTraffic } from '../src/traffic-interactions';
import { trafficTypes, vehicles, type VehicleKind } from '../src/vehicles';

function ready(scenario: string, seed = 17): Run {
  return { ...developmentScenario(initialRun(seed), scenario), phase: 'running' };
}
function seconds(run: Run, duration: number, input: Input = noInput()): Run {
  for (let i = 0; i < Math.round(duration * 60); i++) run = stepRun(run, input);
  return run;
}
function actor(kind: VehicleKind, id: string, distance: number, speed: number): Entity {
  return { ...entity('traffic', id, distance, 0), trafficKind: kind, hp: trafficTypes[kind].hp,
    width: vehicles[kind].width, length: vehicles[kind].length, speed, baseSpeed: speed,
    fuel: vehicles[kind].fuelCapacity, trafficMotion: 'powered' };
}
function tickActors(entities: Entity[], dt = balance.fixedStep, time = 0): void {
  const previous = entities.map(e => ({ ...e }));
  advanceCrossMotion(entities, time + dt);
  advanceInteractingTraffic(entities, previous, dt);
}
it('normal route enables approved motion/interactions while isolated fixtures keep independent streams', () => {
  const run = seconds({ ...initialRun(17), phase: 'running' }, 10);
  expect(run.world.experimentalTraffic).toBe(true); expect(run.world.integrated).toBe(true); expect(run.world.prototype).toBeUndefined();
  expect(run.world.entities.some(e => e.crossMotion || e.groupId)).toBe(false);
  for (const [name] of movingScenarios) {
    const fixture = ready(name); expect(fixture.world.prototype?.version).toBe(movingVersion);
    expect(fixture.world.nextSpecial).toBe(1e9); expect(fixture.world.nextHazard).toBe(1e9);
    expect(fixture.world.entities.length).toBeGreaterThan(0);
  }
});
it('finite train moves continuously in either direction and releases lanes behind the tail, without a timer toggle', () => {
  for (const name of ['p61-train-left', 'p61-train-right']) {
    const train = ready(name).world.entities[0], m = train.crossMotion!;
    const side = Math.sign(m.velocity);
    expect(crossX(m, 0)).toBe(-side * 20);
    expect(crossX(m, 3)).toBeCloseTo(-side * 20 + m.velocity * 3);
    expect(crossX(m, 5)).toBeCloseTo(-side * 20 + m.velocity * 5);
    expect(crossX(m, 8)).toBeCloseTo(-side * 20 + m.velocity * 8);
    for (const [x, hit] of [[-side * 3.2, false], [0, true], [side * 3.2, true]] as const) {
      const run = ready(name); run.activeSeconds = 30 / movingBalance.trainSpeed; run.distance = 70; run.x = x;
      advanceCrossMotion(run.world.entities, run.activeSeconds);
      const after = stepRun(run, noInput());
      expect(after.result?.reason === 'train').toBe(hit);
    }
  }
});
it('moving train sweep catches a whole-road crossing inside one tick even when its final pose is off-road', () => {
  const run = ready('p61-train-left'); run.distance = 70;
  run.world.entities[0].crossMotion!.velocity = -3000;
  expect(stepRun(run, noInput()).result?.reason).toBe('train');
});
it('S waits for the real tail, nitro+Space clears actual geometry; star alone never bypasses the train', () => {
  const waited = seconds(seconds(ready('p61-train-left'), 8, { ...noInput(), brake: true }), 6, { ...noInput(), accelerate: true });
  expect(waited.result).toBeNull(); expect(waited.distance).toBeGreaterThan(75);
  let jumping = seconds(ready('p61-train-left'), 2.8, { ...noInput(), accelerate: true });
  jumping = requestJump(usePowerItem(jumping, 0));
  jumping = seconds(jumping, 2, { ...noInput(), accelerate: true });
  expect(jumping.result).toBeNull(); expect(jumping.distance).toBeGreaterThan(90);
  expect(seconds(usePowerItem(ready('p61-train-left'), 1), 4.3, { ...noInput(), accelerate: true }).result?.reason).toBe('train');
});
it('pause freezes NPC/train pose, timers and traffic HP; restart restores an identical seeded fixture', () => {
  for (const name of ['p61-train-left', 'p61-police-two', 'p61-traffic-pair']) {
    const run = seconds(ready(name), 1), paused = { ...run, phase: 'paused' as const };
    expect(seconds(paused, 10)).toBe(paused); expect(ready(name)).toEqual(ready(name));
  }
});
it('one banana freezes both group members in place, makes each harmless and does not disable the second group', () => {
  let run = seconds(ready('p61-groups'), 1.5, { ...noInput(), accelerate: true });
  const old = run.world.entities.map(e => ({ id: e.id, x: e.x }));
  run = usePowerItem(run, 0);
  expect(run.inventory).toEqual([null, 'star']);
  expect(run.world.entities.filter(e => e.stunned)).toHaveLength(2);
  expect(run.world.entities.filter(e => e.groupId === 'p61-group-1').every(e => !e.stunned)).toBe(true);
  for (const npc of run.world.entities.filter(e => e.stunned)) {
    expect(npc.consumed).toBe(false);
    expect(npc.x).toBe(old.find(e => e.id === npc.id)!.x);
    const touched = stepRun({ ...run, x: npc.x, distance: npc.distance }, noInput());
    expect(touched.feedbackCounts.police).toBe(0); expect(touched.activeVehicleId).toBe(run.activeVehicleId);
    expect(touched.world.entities.find(e => e.id === npc.id)?.x).toBe(npc.x);
  }
  const second = run.world.entities.find(e => e.groupId === 'p61-group-1')!;
  const caught = stepRun({ ...run, distance: second.distance, x: second.x }, noInput());
  expect(caught.feedbackCounts.police).toBe(1); expect(caught.activeVehicleId).toBe('p61-spare');
});
it('crossing an officer event distance without NPC contact does not fine; two contacts in one group fine only once', () => {
  let run = ready('p61-militia-two'); run.distance = 70;
  // NPCs are at the edges, centre lane is clear at this moment.
  expect(stepRun(run, noInput()).feedbackCounts.militia).toBe(0);
  run = ready('p61-militia-two'); run.distance = 70;
  for (const e of run.world.entities) { e.x = 0; e.crossMotion = undefined; }
  const after = stepRun(run, noInput());
  expect(after.feedbackCounts.militia).toBe(1);
  expect(after.money).toBeCloseTo(Math.max(0, run.money - eventBalance.militiaFine) +
    (after.distance - run.distance) * balance.moneyPerMeter);
});
it('relative sweep catches a fast crossing officer and reflection cuts catch an out-and-back path with clear endpoints', () => {
  for (const bounce of [false, true]) {
    const run = ready('p61-police-one'); run.distance = 70; run.x = bounce ? 3 : 0;
    const e = run.world.entities[0];
    e.x = bounce ? 0 : -20;
    e.crossMotion = { ...e.crossMotion!, origin: e.x, type: bounce ? 'pingpong' : 'linear', velocity: bounce ? 2000 : 2400 };
    expect(stepRun(run, noInput()).feedbackCounts.police).toBe(1);
  }
});
it('traffic pair resolves HP on both sides, stops at contact and never repeats damage while overlapping', () => {
  const entities = [actor('car4', 'a', 10, 10), actor('car4', 'b', 14.3, -10)];
  tickActors(entities);
  expect(entities.map(e => e.hp)).toEqual([10, 10]);
  const at = entities.map(e => e.distance);
  for (let i = 0; i < 60; i++) tickActors(entities);
  expect(entities.map(e => e.hp)).toEqual([10, 10]); expect(entities.map(e => e.distance)).toEqual(at);
});
it('high relative speed cannot tunnel traffic; order of the entity array cannot change the outcome', () => {
  const a = actor('car4', 'a', 0, 2000), b = actor('bus', 'b', 20, -2000);
  const first = [{ ...a }, { ...b }], reversed = [{ ...b }, { ...a }];
  tickActors(first); tickActors(reversed);
  expect(first[0].hp).toBe(0); expect(first[1].hp).toBe(70);
  expect(first.sort((x, y) => x.id.localeCompare(y.id))).toEqual(reversed.sort((x, y) => x.id.localeCompare(y.id)));
  expect(first[1].distance - first[0].distance).toBeCloseTo((a.length + b.length) / 2);
});
it('environment damage integrates contact time; a long pothole kills at the correct position, before leaving it', () => {
  const car = actor('car4', 'car', 85, 6); car.hp = 35;
  const hole = entity('pothole', 'hole', 95, 0); hole.width = 2.4; hole.length = 30;
  const entities = [car, hole];
  for (let i = 0; i < 180; i++) tickActors(entities);
  expect(car.hp).toBe(0); expect(car.wrecked).toBe(true);
  expect(car.distance).toBeCloseTo(85 + (35 - 6) / 12 * 6, 6);
  expect(car.wreckedByPlayer).toBe(false);
});
it('traffic stops and takes one hit from a barrier, while a moving train wrecks traffic without ending the player run', () => {
  const barrier = seconds(ready('p61-traffic-barrier'), 4);
  const stopped = barrier.world.entities.find(e => e.id === 'p61-block-car')!;
  expect(stopped.hp).toBe(10); expect(stopped.speed).toBe(0);
  expect(seconds(barrier, 1).world.entities.find(e => e.id === stopped.id)?.hp).toBe(10);
  const train = seconds(ready('p61-traffic-train'), 2);
  const wreck = train.world.entities.find(e => e.id === 'p61-train-car')!;
  expect(wreck.wrecked).toBe(true); expect(wreck.hp).toBe(0);
  expect(train.result).toBeNull(); expect(wreck.wreckedByPlayer).toBe(false);
  // Any passenger pocket must be clear of the train's current/future swept body.
  const cars = train.world.entities.filter(e => e.kind === 'passenger');
  expect(cars.every(e => e.x < -3 || e.x > 3)).toBe(true);
});
it('a later car hits the stopped survivor of the first accident; NPCs spawn once and wrecks do not become secret colliders', () => {
  const run = seconds(ready('p61-traffic-chain'), 5);
  const cars = run.world.entities.filter(e => e.kind === 'traffic');
  expect(cars.filter(e => e.wrecked)).toHaveLength(2);
  expect(cars.find(e => e.id === 'p61-b')?.hp).toBe(50);
  const ids = run.world.entities.filter(e => e.kind === 'passenger').map(e => e.id);
  expect(new Set(ids).size).toBe(ids.length); expect(ids.length).toBeGreaterThan(0);
  expect(run.world.entities.some(e => e.kind === 'accident')).toBe(false);
  expect(run.world.entities.filter(e => e.kind === 'passenger').every(e => e.pickupable !== false)).toBe(true);
  expect(run.riderIds).toHaveLength(0);
});
it('player-caused wreck provenance follows a secondary collision and its passengers stay refused', () => {
  const wreck = actor('car4', 'source', 80, 0); wreck.hp = 0; wreck.wrecked = true; wreck.wreckedByPlayer = true;
  const target = actor('bus', 'target', 95, -10); target.hp = 10;
  const entities = [wreck, target];
  for (let i = 0; i < 60; i++) tickActors(entities);
  expect(target.wrecked).toBe(true); expect(target.wreckedByPlayer).toBe(true);
});
it('barrier and vendor cause one recoverable crash, ambulance has a real lateral and longitudinal trajectory', () => {
  for (const scenario of ['p61-barrier', 'p61-vendor']) {
    const run = ready(scenario), e = run.world.entities[0]; run.distance = e.distance; run.x = e.x;
    const hit = stepRun(run, noInput()); expect(hit.crash).not.toBeNull(); expect(hit.result).toBeNull();
    expect(seconds(hit, 4).crash).toBeNull(); expect(seconds(hit, 4).feedbackCounts.jam).toBe(1);
  }
  const ambulance = ready('p61-ambulance'), before = ambulance.world.entities[0];
  const after = seconds(ambulance, .5).world.entities.find(e => e.id === before.id)!;
  expect(after.distance).toBeLessThan(before.distance); expect(after.x).not.toBe(before.x);
});
it('scenario results are identical at 30/60/144 FPS including motion, collisions and loot', () => {
  for (const name of ['p61-police-two', 'p61-traffic-chain', 'p61-train-right']) {
    const outcomes = [30, 60, 144].map(fps => {
      let run = ready(name); const clock = new FixedClock();
      for (let i = 0; i < fps * 7; i++) clock.advance(1 / fps, () => { run = stepRun(run, noInput()); });
      return run;
    });
    expect(outcomes[0]).toEqual(outcomes[1]); expect(outcomes[1]).toEqual(outcomes[2]);
  }
});
it('P6.1 fixture simulation: 30 seeds across all scenarios stays finite with reproducible motion/HP', () => {
  const observations: { seed: number; scenario: string; distance: number; result: string; wrecks: number }[] = [];
  for (let seed = 1; seed <= 30; seed++) for (const [name] of movingScenarios) {
    let run = ready(name, seed), violations = 0;
    for (let tick = 0; tick < 60 * 10 && run.phase === 'running'; tick++) {
      if (tick === 120 && name.includes('two')) run = usePowerItem(run, 0);
      run = stepRun(run, { ...noInput(), brake: name.includes('train') && tick < 450 });
      if (![run.distance, run.speed, run.money, run.fuel, run.durability].every(Number.isFinite) || run.money < 0 || run.fuel < 0 || run.durability < 0 ||
          !run.world.entities.every(e => Number.isFinite(e.x) && Number.isFinite(e.distance) && (e.hp ?? 0) >= 0)) violations++;
    }
    expect(violations, name + ' seed ' + seed).toBe(0);
    observations.push({ seed, scenario: name, distance: run.distance, result: run.result?.reason ?? 'running',
      wrecks: run.world.entities.filter(e => e.wrecked).length });
  }
  console.log(JSON.stringify({ version: movingVersion, mode: 'isolated fixtures; not integrated route balance', seeds: '1–30',
    cases: observations.length, scenarios: movingScenarios.map(([name]) => ({ name,
      running: observations.filter(o => o.scenario === name && o.result === 'running').length,
      minDistance: Math.min(...observations.filter(o => o.scenario === name).map(o => o.distance)),
      maxDistance: Math.max(...observations.filter(o => o.scenario === name).map(o => o.distance)) })),
    config: movingBalance }));
}, 15000);

it('four-second train occupancy, officer variations and longer/faster vendor preserve readable physical motion', () => {
  for (const name of ['p61-train-left', 'p61-train-right']) {
    const train = ready(name).world.entities[0], m = train.crossMotion!;
    const halfRoad = balance.laneWidth * balance.laneCount / 2;
    const entering = (Math.abs(m.origin) - train.width / 2 - halfRoad) / Math.abs(m.velocity);
    const leaving = entering + 4;
    expect(Math.abs(crossX(m, entering))).toBeCloseTo(train.width / 2 + halfRoad);
    expect(Math.abs(crossX(m, leaving))).toBeCloseTo(train.width / 2 + halfRoad);
    expect(Math.sign(crossX(m, entering))).not.toBe(Math.sign(crossX(m, leaving)));
  }
  for (const kind of ['police', 'militia']) {
    const fast = ready('p61-' + kind + '-fast'), stagger = ready('p61-' + kind + '-stagger');
    expect(Math.abs(fast.world.entities[0].crossMotion!.velocity)).toBeGreaterThan(4.5);
    const [a,b] = stagger.world.entities;
    expect(a.distance).not.toBe(b.distance);
    expect(Math.abs(a.crossMotion!.velocity)).not.toBe(Math.abs(b.crossMotion!.velocity));
    for (let t=0;t<8;t+=.1) for (const e of [a,b]) expect(Math.abs(crossX(e.crossMotion!,t)) + e.width/2).toBeLessThanOrEqual(balance.laneWidth*balance.laneCount/2);
    stagger.distance = 40;
    const banana = usePowerItem(stagger,0);
    expect(banana.world.entities.every(e=>e.stunned)).toBe(true);
    expect(seconds(banana,1).world.entities.map(e=>e.x)).toEqual(banana.world.entities.map(e=>e.x));
  }
  const vendor = ready('p61-vendor').world.entities[0];
  expect(vendor.length).toBeGreaterThan(1.5);
  expect(vendor.crossMotion!.velocity).toBeGreaterThan(2.2);
  expect(crossX(vendor.crossMotion!,2.5)-crossX(vendor.crossMotion!,1.5)).toBeCloseTo(vendor.crossMotion!.velocity);
});
