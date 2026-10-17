import { describe, expect, it } from 'vitest';
import { balance } from '../src/config';
import { noInput, type Input } from '../src/simulation';
import { initialRun, stepRun, type Run } from '../src/survival';
import { entity, fillWorld, initialWorld, leavesOpenLane, sweptContact, warningDistance, type Entity } from '../src/world';

function empty(entities: Entity[] = []): Run {
  const r = initialRun();
  return { ...r, phase: 'running', world: { ...r.world, entities, nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9 } };
}
function advance(run: Run, seconds: number, input: Input = noInput()): Run {
  for (let i = 0; i < Math.round(seconds * 60); i++) run = stepRun(run, input);
  return run;
}
describe('survival, continuous hazards and crash recovery', () => {
  it('money/score/fuel follow actual travel; pause/ready/end have no side effects', () => {
    const r = advance(empty(), 10);
    expect(r.distance).toBeCloseTo(140); expect(r.score).toBeCloseTo(140);
    expect(r.money).toBeCloseTo(270); expect(r.fuel).toBeCloseTo(8 - 140 * balance.fuelPerMeter);
    for (const phase of ['ready', 'paused', 'ended'] as const) {
      const stopped = { ...r, phase }; expect(advance(stopped, 10)).toBe(stopped);
    }
  });
  it('water burns by exact contact duration, separate from HP and distance fuel', () => {
    const r = advance(empty([entity('water', 'water', 7, 0)]), 1);
    expect(r.fuel).toBeCloseTo(8 - 14 * balance.fuelPerMeter - .8 * 9 / 14, 8);
    expect(r.durability).toBe(70); expect(r.money).toBeCloseTo(207);
  });
  it('pothole charges money once and hurts while touching; each traffic car hits once', () => {
    const r = advance({ ...empty([entity('pothole', 'hole', 0, 0)]), money: 2 }, .1);
    expect(r.durability).toBeCloseTo(70 - balance.potholeImpactDamage - .1 * balance.potholeDamagePerSecond);
    expect(r.money).toBeLessThan(1);
    expect(r.eventSequence).toBe(1); expect(r.money).toBeGreaterThanOrEqual(0);
    const car = { ...entity('traffic', 'car', 0, 0), speed: 14 };
    const once = advance(empty([car]), .5); expect(once.durability).toBe(50); expect(once.crash).not.toBeNull();
    const twice = advance(once, 4); expect(twice.durability).toBe(50); expect(twice.world.entities[0].lastHit).toBeGreaterThanOrEqual(0);
  });
  it('swept contacts catch thin obstacles crossed between endpoints, including sideways', () => {
    expect(sweptContact(0, -10, 0, 10, .5, .01)).toEqual([.4995, .5005]);
    expect(sweptContact(-5, 0, 5, 0, .5, 1)).toEqual([.45, .55]);
    expect(sweptContact(2, -10, 2, 10, .5, 1)).toBeNull();
    const thin = { ...entity('pothole', 'thin', 1.11, 0), length: .001 };
    const r = stepRun({ ...empty([thin]), speed: 20 }, { ...noInput(), accelerate: true });
    expect(r.durability).toBeLessThan(70 - balance.potholeImpactDamage);
  });
  it('fuel exhausts at the correct distance, coasts exactly 25m, W cannot power an empty tank', () => {
    let r = { ...empty(), fuel: .003 };
    for (let i = 0; i < 3000 && r.phase !== 'ended'; i++) r = stepRun(r, { ...noInput(), accelerate: true });
    expect(r.phase).toBe('ended'); expect(r.result?.reason).toBe('fuel');
    expect(r.distance).toBeCloseTo(.003 / balance.fuelPerMeter + balance.coastDistance, 7);
    expect(r.fuel).toBe(0); expect(r.coastRemaining).toBe(0);
    const stopped = r; expect(advance(stopped, 10)).toBe(stopped);
    const noFuel = { ...empty(), fuel: 0, speed: 8 };
    const coast = stepRun(noFuel, { ...noInput(), accelerate: true });
    expect(coast.motion).toBe('coasting'); expect(coast.speed).toBeLessThan(8);
  });
  it('a reachable fuel pickup restarts a coasting vehicle without exceeding tank', () => {
    const r = advance({ ...empty([entity('fuel', 'gas', 4, 0)]), fuel: 0, motion: 'coasting' }, .5);
    expect(r.motion).toBe('powered'); expect(r.fuel).toBeGreaterThan(7.9); expect(r.fuel).toBeLessThanOrEqual(8);
    expect(r.world.entities[0].consumed).toBe(true);
  });
  it('later repair/fuel events cannot rescue an earlier lethal collision', () => {
    const r = stepRun({ ...empty([entity('pothole', 'deadly', 1.95, 0), entity('repair', 'late', 1.6, 0)]), durability: balance.potholeImpactDamage, speed: 20 }, { ...noInput(), accelerate: true });
    expect(r.phase).toBe('ended'); expect(r.result?.reason).toBe('damage'); expect(r.distance).toBeCloseTo(.05);
    expect(r.world.entities[1].consumed).toBe(false); expect(r.durability).toBe(0);
    expect(r.result?.score).toBeCloseTo(.05); expect(r.distance).toBeLessThan(.333);
  });
  it('pickups apply once and clamp HP/fuel; restart discards all old entities/results', () => {
    const r = advance({ ...empty([entity('repair', 'fix', 0, 0), entity('fuel', 'gas', 0, 0)]), durability: 60, fuel: 7 }, .1);
    expect(r.durability).toBe(70); expect(r.fuel).toBeLessThanOrEqual(8); expect(r.eventSequence).toBe(2);
    const restarted = initialRun(); expect(restarted.durability).toBe(70); expect(restarted.fuel).toBe(8);
    expect(restarted.score).toBe(0); expect(restarted.money).toBe(200); expect(restarted.result).toBeNull();
  });
  it('seeded lane directions, wide and forced hazards, and accessible supplies', () => {
    expect(fillWorld(initialWorld(42), 1000)).toEqual(fillWorld(initialWorld(42), 1000));
    expect(fillWorld(initialWorld(42), 1000)).not.toEqual(fillWorld(initialWorld(17), 1000));
    const world = fillWorld(initialWorld(42), 5000);
    const fuels = world.entities.filter(e => e.kind === 'fuel');
    expect(fuels.every((e, i) => i === 0 || e.distance - fuels[i - 1].distance <= 500)).toBe(true);
    const hazards = world.entities.filter(e => e.kind === 'water' || e.kind === 'pothole');
    expect(hazards.some(e => e.width > balance.laneWidth)).toBe(true);
    expect(hazards.some(e => e.length > 7)).toBe(true);
    expect(hazards.some(e => e.width >= balance.laneWidth * balance.laneCount - 1e-8)).toBe(true);
    for (const e of hazards.filter(e => e.width < balance.laneWidth * balance.laneCount - 1e-8)) expect([-balance.laneWidth, 0, balance.laneWidth].some(x =>
      Math.abs(x - e.x) > (e.width + balance.vehicleWidth) / 2)).toBe(true);
    const traffic = world.entities.filter(e => e.kind === 'traffic');
    expect(traffic.some(e => e.x < 0)).toBe(true);
    expect(traffic.some(e => e.x > 0)).toBe(true);
    expect(traffic.every(e => e.x < 0 ? e.speed < 0 : e.x > 0 ? e.speed > 0 : Math.abs(e.speed) === balance.trafficSpeed)).toBe(true);
    expect(warningDistance(20, traffic.find(e => e.speed < 0)!)).toBeGreaterThan(warningDistance(20, traffic.find(e => e.speed > 0)!));
  });
  it('opposing traffic reaches sooner and long potholes hurt for longer', () => {
    const toward = entity('traffic', 'toward', 20, 0); toward.speed = -balance.trafficSpeed;
    const away = entity('traffic', 'away', 20, 0); away.speed = balance.trafficSpeed;
    const hitToward = advance(empty([toward]), 1);
    const hitAway = advance(empty([away]), 1);
    expect(hitToward.durability).toBeLessThan(hitAway.durability);
    const long = entity('pothole', 'long', 7, 0); long.length = 12;
    const r = advance(empty([long]), 2);
    expect(r.durability).toBeLessThan(70 - balance.potholeImpactDamage - balance.potholeDamagePerSecond);
    expect(r.eventSequence).toBe(1);
  });
  it('director rejects a hard two-lane patch when a car closes the remaining lane', () => {
    const patch = entity('pothole', 'wide', 100, 1.6); patch.width = 5.7;
    const car = entity('traffic', 'car', 143, -3.2); car.speed = -6;
    expect(leavesOpenLane(patch, [car], 0)).toBe(false);
    expect(leavesOpenLane(patch, [{ ...car, distance: 200 }], 0)).toBe(true);
  });
  it('full-road hazards fall back to a two-lane patch when fuel or HP is too low', () => {
    const waterSeed = Array.from({ length: 1000 }, (_, i) => i + 1).find(seed =>
      fillWorld(initialWorld(seed), 0).entities.some(e => e.kind === 'water' && e.width === 9.6));
    expect(waterSeed).toBeDefined();
    const lowFuel = fillWorld(initialWorld(waterSeed!), 0, 1, 70).entities.find(e => e.kind === 'water')!;
    expect(lowFuel.width).toBe(5.7);
    const holeSeed = Array.from({ length: 1000 }, (_, i) => i + 1).find(seed =>
      fillWorld({ ...initialWorld(seed), nextHazard: 1 }, 100).entities.some(e => e.kind === 'pothole' && e.width === 9.6));
    expect(holeSeed).toBeDefined();
    const lowHp = fillWorld({ ...initialWorld(holeSeed!), nextHazard: 1 }, 100, 8, 20).entities.find(e => e.kind === 'pothole')!;
    expect(lowHp.width).toBe(5.7);
  });
  it('a crash stops the bike, protects it during driver return and then accelerates from zero', () => {
    const car = { ...entity('traffic', 'car', 0, 0), speed: 14 };
    const hole = entity('pothole', 'hole', 0, 0); hole.length = 20;
    const first = stepRun({ ...empty([car, hole]), passengers: 3 }, noInput());
    expect(first.crash).not.toBeNull(); expect(first.speed).toBe(0);
    expect(first.durability).toBe(70 - balance.trafficDamage);
    expect(first.crash!.returningPassengers + first.crash!.lostPassengers).toBe(3);
    expect(first.passengers).toBe(first.crash!.returningPassengers);
    expect(first.lostPassengers).toBe(first.crash!.lostPassengers);
    expect(stepRun({ ...empty([car]), passengers: 3 }, noInput()).crash).toEqual(first.crash);
    const protectedRun = advance(first, 2.5);
    expect(protectedRun.crash).not.toBeNull(); expect(protectedRun.distance).toBeCloseTo(first.distance);
    expect(protectedRun.durability).toBe(first.durability); expect(protectedRun.fuel).toBe(first.fuel);
    const returned = advance({ ...first, world: { ...first.world, entities: [car] } }, 2.7);
    expect(returned.crash).toBeNull(); expect(returned.recovering).toBe(true); expect(returned.speed).toBeGreaterThanOrEqual(0);
    const after = advance(returned, .5);
    const withW = advance(returned, .5, { ...noInput(), accelerate: true });
    expect(withW.speed).toBeGreaterThan(after.speed);
    expect(after.distance).toBeGreaterThan(returned.distance);
    expect(withW.durability).toBe(first.durability);
  });
  it('flavor rotates per kind without consuming gameplay RNG or replacing numeric consequences', () => {
    let r = empty(); const flavors: string[] = []; const rng = r.world.rng;
    for (let i = 0; i < 3; i++) {
      r = stepRun({ ...r, world: { ...r.world, entities: [entity('pothole', `hole-${i}`, r.distance, 0)] } }, noInput());
      flavors.push(r.feedbackFlavor); expect(r.feedback).toContain('−6 HP'); expect(r.world.rng).toBe(rng);
    }
    expect(new Set(flavors).size).toBe(3); expect(r.durability).toBeLessThan(70 - 3 * balance.potholeImpactDamage);
  });
});
