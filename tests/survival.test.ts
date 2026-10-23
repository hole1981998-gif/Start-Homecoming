import { describe, expect, it } from 'vitest';
import { balance } from '../src/config';
import { noInput, type Input } from '../src/simulation';
import { initialRun, pickUpPassenger, stepRun, type Run } from '../src/survival';
import { entity, fillWorld, initialWorld, leavesOpenLane, sweptContact, trafficTypes, warningDistance, type Entity } from '../src/world';

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
    expect(r.money).toBeCloseTo(balance.initialMoney + 140 * balance.moneyPerMeter); expect(r.fuel).toBeCloseTo(balance.fuelCapacity - 140 * balance.fuelPerMeter);
    for (const phase of ['ready', 'paused', 'ended'] as const) {
      const stopped = { ...r, phase }; expect(advance(stopped, 10)).toBe(stopped);
    }
  });
  it('water burns by exact contact duration, separate from HP and distance fuel', () => {
    const r = advance(empty([entity('water', 'water', 7, 0)]), 1);
    expect(r.fuel).toBeCloseTo(balance.fuelCapacity - 14 * balance.fuelPerMeter - balance.waterFuelPerSecond * 9 / 14, 8);
    expect(r.durability).toBe(balance.durabilityCapacity); expect(r.money).toBeCloseTo(balance.initialMoney + 14 * balance.moneyPerMeter);
  });
  it('pothole charges money once and hurts while touching; each traffic car hits once', () => {
    const r = advance({ ...empty([entity('pothole', 'hole', 0, 0)]), money: 2 }, .1);
    expect(r.durability).toBeCloseTo(balance.durabilityCapacity - balance.potholeImpactDamage - .1 * balance.potholeDamagePerSecond);
    expect(r.money).toBeLessThan(1);
    expect(r.eventSequence).toBe(1); expect(r.money).toBeGreaterThanOrEqual(0);
    const car = { ...entity('traffic', 'car', 0, 0), speed: 14 };
    const once = advance(empty([car]), .5); expect(once.durability).toBe(balance.durabilityCapacity - balance.trafficDamage); expect(once.crash).not.toBeNull();
    const twice = advance(once, 4); expect(twice.durability).toBe(once.durability); expect(twice.world.entities[0].lastHit).toBeGreaterThanOrEqual(0);
  });
  it('swept contacts catch thin obstacles crossed between endpoints, including sideways', () => {
    expect(sweptContact(0, -10, 0, 10, .5, .01)).toEqual([.4995, .5005]);
    expect(sweptContact(-5, 0, 5, 0, .5, 1)).toEqual([.45, .55]);
    expect(sweptContact(2, -10, 2, 10, .5, 1)).toBeNull();
    const thin = { ...entity('pothole', 'thin', 1.11, 0), length: .001 };
    const r = stepRun({ ...empty([thin]), speed: 20 }, { ...noInput(), accelerate: true });
    expect(r.durability).toBeLessThan(balance.durabilityCapacity - balance.potholeImpactDamage);
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
    expect(r.motion).toBe('powered'); expect(r.fuel).toBeGreaterThan(balance.fuelPickup - .1);
    expect(r.fuel).toBeLessThanOrEqual(balance.fuelCapacity);
    expect(r.world.entities[0].consumed).toBe(true);
  });
  it('later repair/fuel events cannot rescue an earlier lethal collision', () => {
    const r = stepRun({ ...empty([entity('pothole', 'deadly', 1.95, 0), entity('repair', 'late', 1.6, 0)]), durability: balance.potholeImpactDamage, speed: 20 }, { ...noInput(), accelerate: true });
    expect(r.phase).toBe('ended'); expect(r.result?.reason).toBe('damage'); expect(r.distance).toBeCloseTo(.05);
    expect(r.world.entities[1].consumed).toBe(false); expect(r.durability).toBe(0);
    expect(r.result?.score).toBeCloseTo(.05); expect(r.distance).toBeLessThan(.333);
  });
  it('pickups apply once and clamp HP/fuel; restart discards all old entities/results', () => {
    const r = advance({ ...empty([entity('repair', 'fix', 0, 0), entity('fuel', 'gas', 0, 0)]), durability: 60, fuel: 4 }, .1);
    expect(r.durability).toBeCloseTo(60 + balance.repairPickup); expect(r.fuel).toBeLessThanOrEqual(balance.fuelCapacity); expect(r.eventSequence).toBe(2);
    const restarted = initialRun(); expect(restarted.durability).toBe(balance.durabilityCapacity); expect(restarted.fuel).toBe(balance.fuelCapacity);
    expect(restarted.score).toBe(0); expect(restarted.money).toBe(balance.initialMoney); expect(restarted.result).toBeNull();
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
    let sampled = initialWorld(42);
    const trafficById = new Map<string, ReturnType<typeof entity>>();
    for (let distance = 0; distance <= 5000; distance += 80) {
      sampled = fillWorld(sampled, distance);
      for (const e of sampled.entities) if (e.kind === 'traffic') trafficById.set(e.id, e);
    }
    const traffic = [...trafficById.values()];
    expect(traffic.some(e => e.x < 0)).toBe(true);
    expect(traffic.some(e => e.x > 0)).toBe(true);
    expect(traffic.every(e => Math.abs(e.speed) === trafficTypes[e.trafficKind!].speed &&
      (e.x < 0 ? e.speed < 0 : e.x > 0 ? e.speed > 0 : true))).toBe(true);
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
    expect(r.durability).toBeLessThan(balance.durabilityCapacity - balance.potholeImpactDamage - balance.potholeDamagePerSecond);
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
  it('a crash slides to a stop, protects the bike and then accelerates from zero', () => {
    const car = { ...entity('traffic', 'car', 0, 0), speed: 14 };
    const hole = entity('pothole', 'hole', 0, 0); hole.length = 20;
    const riderIds = ['rider-0', 'rider-1', 'rider-2'];
    const first = stepRun({ ...empty([car, hole]), riderIds }, noInput());
    expect(first.crash).not.toBeNull(); expect(first.speed).toBeCloseTo(first.crash!.impactSpeed - balance.crashSlideDeceleration * first.crash!.elapsed);
    expect(first.durability).toBe(balance.durabilityCapacity - balance.trafficDamage);
    expect([...first.crash!.returningRiderIds, ...first.crash!.strandedRiderIds].sort()).toEqual(riderIds);
    expect(first.riderIds).toEqual([]);
    expect(first.lostPassengers).toBe(first.crash!.strandedRiderIds.length);
    const fallenAtImpact = first.world.entities.filter(e => e.id.startsWith('fallen-'));
    expect(fallenAtImpact).toHaveLength(first.crash!.strandedRiderIds.length);
    expect(fallenAtImpact.length).toBeGreaterThan(0);
    expect(fallenAtImpact.map(e => e.riderId)).toEqual(first.crash!.strandedRiderIds);
    expect(fallenAtImpact.every(e => e.pickupable === false && e.passengerMotion?.ejectedAt !== undefined)).toBe(true);
    expect(stepRun({ ...empty([car]), riderIds }, noInput()).crash).toEqual(first.crash);
    const sliding = advance(first, .5);
    expect(sliding.speed).toBeGreaterThan(0); expect(sliding.speed).toBeLessThan(first.speed);
    expect(sliding.distance).toBeGreaterThan(first.distance);
    expect(Math.abs(sliding.x - first.x)).toBeGreaterThan(.5);
    const protectedRun = advance(first, 2.5);
    expect(protectedRun.crash).not.toBeNull(); expect(protectedRun.speed).toBe(0);
    expect(protectedRun.distance - first.distance).toBeCloseTo(first.speed ** 2 / (2 * balance.crashSlideDeceleration), 7);
    expect(protectedRun.score).toBe(first.score); expect(protectedRun.money).toBe(first.money);
    expect(protectedRun.durability).toBe(first.durability); expect(protectedRun.fuel).toBe(first.fuel);
    const fallen = advance(first, balance.driverFallSeconds + balance.driverPauseSeconds / 2);
    expect(fallen.crash).not.toBeNull();
    const withStranded = advance(first, 3.2);
    const stranded = withStranded.world.entities.filter(e => e.id.startsWith('fallen-'));
    expect(stranded).toHaveLength(first.crash!.strandedRiderIds.length);
    expect(stranded.every(e => e.passengerMotion && !e.consumed)).toBe(true);
    expect(stranded.every(e => e.pickupable === false)).toBe(true);
    expect(stranded.map(e => e.id)).toEqual(fallenAtImpact.map(e => e.id));
    const strandedInReach = { ...stranded[0], x: withStranded.x, distance: withStranded.distance,
      passengerMotion: { ...stranded[0].passengerMotion!, homeX: withStranded.x, homeDistance: withStranded.distance } };
    const pickupAttempt = { ...withStranded, riderIds: [],
      world: { ...withStranded.world, entities: [strandedInReach] } };
    expect(pickUpPassenger(pickupAttempt)).toBe(pickupAttempt);
    const returned = advance(first, 3.2);
    expect(returned.crash).toBeNull(); expect(returned.recovering).toBe(true); expect(returned.speed).toBeGreaterThanOrEqual(0);
    expect(returned.riderIds).toEqual(first.crash!.returningRiderIds);
    const afterReboard = returned.world.entities.filter(e => e.id.startsWith('fallen-'));
    expect(afterReboard.map(e => e.id)).toEqual(stranded.map(e => e.id));
    expect(afterReboard.map(e => [e.x, e.distance])).toEqual(stranded.map(e => [e.x, e.distance]));
    const after = advance(returned, .5);
    const withW = advance(returned, .5, { ...noInput(), accelerate: true });
    expect(withW.speed).toBeGreaterThan(after.speed);
    expect(after.distance).toBeGreaterThan(returned.distance);
    expect(withW.durability).toBe(first.durability);
  });
  it('a max-speed crash stops before driver return and skids inward near an edge', () => {
    const car = { ...entity('traffic', 'car', 0, 3.9), speed: balance.trafficSpeed };
    const first = stepRun({ ...empty([car]), x: 3.9, speed: balance.maxSpeed }, { ...noInput(), accelerate: true });
    expect(first.crash?.side).toBe(-1);
    const stopped = advance(first, balance.driverFallSeconds + balance.driverReturnSeconds);
    expect(stopped.speed).toBe(0);
    expect(stopped.crash).not.toBeNull();
    expect(stopped.distance - first.distance).toBeCloseTo(first.speed ** 2 / (2 * balance.crashSlideDeceleration), 7);
    expect(stopped.x).toBeLessThan(first.x);
    expect(stopped.durability).toBe(first.durability);
    expect(stopped.fuel).toBe(first.fuel);
  });
  it('a later crash rolls only riders who actually reboarded', () => {
    const firstCar = { ...entity('traffic', 'first-car', 0, 0), speed: 14 };
    const first = stepRun({ ...empty([firstCar]), riderIds: ['rider-0', 'rider-1', 'rider-2'] }, noInput());
    const reboarded = advance(first, 3.2);
    expect(reboarded.riderIds.length).toBeGreaterThan(0);
    const secondCar = entity('traffic', 'second-car', reboarded.distance, reboarded.x);
    secondCar.speed = 0;
    const again = stepRun({ ...reboarded, world: { ...reboarded.world,
      entities: [secondCar, ...reboarded.world.entities.filter(e => e.id.startsWith('fallen-'))] } }, noInput());
    expect(again.crash).not.toBeNull();
    expect([...again.crash!.returningRiderIds, ...again.crash!.strandedRiderIds].sort())
      .toEqual([...reboarded.riderIds].sort());
    expect(again.riderIds).toEqual([]);
    expect(again.lostPassengers).toBe(first.lostPassengers + again.crash!.strandedRiderIds.length);
    expect(new Set(again.world.entities.filter(e => e.id.startsWith('fallen-')).map(e => e.id)).size)
      .toBe(first.lostPassengers + again.crash!.strandedRiderIds.length);
  });
  it('does not apply water or pothole effects landed in during the fall or immediately after boarding', () => {
    const car = { ...entity('traffic', 'car', 0, 0), speed: balance.cruiseSpeed };
    const water = entity('water', 'landing-water', 14, 0); water.width = 9.6; water.length = 10;
    const hole = entity('pothole', 'landing-hole', 13, 0); hole.width = 9.6; hole.length = 8;
    const first = stepRun(empty([car, water, hole]), noInput());
    expect(first.crash).not.toBeNull();
    const landed = advance(first, 2.5);
    expect(landed.protectedEntities).toContain('landing-water');
    expect(landed.protectedEntities).toContain('landing-hole');
    expect(landed.fuel).toBe(first.fuel);
    expect(landed.durability).toBe(first.durability);
    const returned = advance(landed, 1);
    expect(returned.crash).toBeNull();
    const withoutHazards = { ...returned, world: { ...returned.world, entities: returned.world.entities.filter(e =>
      e.id !== 'landing-water' && e.id !== 'landing-hole') } };
    const next = stepRun(returned, noInput());
    const baseline = stepRun(withoutHazards, noInput());
    expect(next.fuel).toBeCloseTo(baseline.fuel, 8);
    expect(next.durability).toBe(baseline.durability);
    expect(next.money).toBeCloseTo(baseline.money, 8);
  });
  it('protects both hazards at the actual P4A passenger crash position', () => {
    const car = { ...entity('traffic', 'qa-traffic', 8, 0), speed: 0 };
    const water = entity('water', 'qa-water', 16, 0); water.width = 9.6; water.length = 10;
    const hole = entity('pothole', 'qa-hole', 15, 0); hole.width = 9.6; hole.length = 8;
    let run = { ...empty([car, water, hole]), riderIds: ['rider-0', 'rider-1', 'rider-2'] };
    for (let i = 0; i < 240 && !run.crash; i++) run = stepRun(run, noInput());
    expect(run.crash).not.toBeNull();
    const landed = advance(run, 2.5);
    expect(landed.protectedEntities).toContain('qa-water');
    expect(landed.protectedEntities).toContain('qa-hole');
    const returned = advance(landed, 1);
    expect(returned.crash).toBeNull();
    const baseline = { ...returned, world: { ...returned.world, entities: returned.world.entities.filter(e =>
      e.id !== 'qa-water' && e.id !== 'qa-hole') } };
    const next = advance(returned, .5), clean = advance(baseline, .5);
    expect(next.fuel).toBeCloseTo(clean.fuel, 8);
    expect(next.durability).toBe(clean.durability);
  });
  it('flavor rotates per kind without consuming gameplay RNG or replacing numeric consequences', () => {
    let r = empty(); const flavors: string[] = []; const rng = r.world.rng;
    for (let i = 0; i < 3; i++) {
      r = stepRun({ ...r, world: { ...r.world, entities: [entity('pothole', `hole-${i}`, r.distance, 0)] } }, noInput());
      flavors.push(r.feedbackFlavor); expect(r.feedback).toContain('−6 HP'); expect(r.world.rng).toBe(rng);
    }
    expect(new Set(flavors).size).toBe(3); expect(r.durability).toBeLessThan(balance.durabilityCapacity - 3 * balance.potholeImpactDamage);
  });
});
