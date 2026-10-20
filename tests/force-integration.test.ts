import { describe, expect, it } from 'vitest';
import { ForceIntegration } from '../src/force-integration';
import { noInput } from '../src/simulation';
import { initialRun, pickUpPassenger, stepRun, type Run } from '../src/survival';
import { advancePassengers, entity, passengerPose } from '../src/world';
import { developmentScenario } from '../src/development';
import { vehicles } from '../src/vehicles';
import { busBodyCenterX, containerParts, stepTrailerRearX, tailSweepYaw } from '../src/tail-sweep';

describe('parallel force integration', () => {
  it('plants the bus rear axle while its front swings into the turn', () => {
    const length = vehicles.bus.length;
    const yaw = .2;
    const center = busBodyCenterX(0, length, yaw);
    const rearX = center - Math.sin(yaw) * length * .35;
    const frontX = center + Math.sin(yaw) * length * .5;
    expect(rearX).toBeCloseTo(0, 8);
    expect(frontX).toBeGreaterThan(1);
  });

  it('keeps the container tractor and trailer joined while the rear axle lags', () => {
    let rearX = 0;
    let pose = containerParts(0, 0, 0, rearX);
    for (let i = 0; i < 60; i++) {
      const tractorX = i * .05;
      rearX = stepTrailerRearX(tractorX, i * .3, .2, rearX, 18, 1 / 60);
      pose = containerParts(tractorX, i * .3, .2, rearX);
      expect([pose.tractorX, pose.trailerX, pose.trailerRearX, pose.trailerYaw].every(Number.isFinite)).toBe(true);
      expect(pose.trailerX + Math.sin(pose.trailerYaw) * 5).toBeCloseTo(pose.hitchX, 7);
      expect(pose.trailerDistance + Math.cos(pose.trailerYaw) * 5).toBeCloseTo(pose.hitchDistance, 7);
    }
    expect(pose.trailerYaw).toBeGreaterThan(0);
    expect(pose.trailerYaw).toBeLessThan(.2);
  });

  it('keeps ordinary cars straight and relaxes a bus sweep after steering is released', () => {
    expect(tailSweepYaw('car4', .2, 5, 20, 1 / 60)).toBe(0);
    let fast = 0, slow = 0;
    for (let i = 0; i < 90; i++) {
      fast = tailSweepYaw('bus', fast, 5, 19, 1 / 60, 1);
      slow = tailSweepYaw('bus', slow, 5, 7, 1 / 60, 1);
    }
    expect(fast).toBeGreaterThan(slow * 1.8);
    let yaw = .22;
    for (let i = 0; i < 60; i++) yaw = tailSweepYaw('bus', yaw, 0, 12, 1 / 60);
    expect(yaw).toBeCloseTo(0, 6);
  });

  it.each(['bus', 'container'] as const)('keeps the %s sweep finite in the playable fixture', kind => {
    const sample = developmentScenario(initialRun(17, `tail-play-${kind}`), `force-tail-${kind}`);
    let run: Run = { ...sample, phase: 'running' };
    let arcade: Run = { ...sample, phase: 'running' };
    const physics = new ForceIntegration();
    let peakYaw = 0;
    let moved = 0;
    let arcadeMoved = 0;
    for (let i = 0; i < 180 && run.phase === 'running'; i++) {
      const input = { ...noInput(), right: true };
      run = physics.step(run, input);
      arcade = stepRun(arcade, input);
      peakYaw = Math.max(peakYaw, Math.abs(run.forceYaw));
      const car = run.world.entities.find(e => e.id === `qa-tail-target-${kind}`);
      const targetX = kind === 'bus' ? 2.5 : 2.3;
      if (car) moved = Math.max(moved, Math.hypot(car.x - targetX, car.distance - 32));
      const arcadeCar = arcade.world.entities.find(e => e.id === `qa-tail-target-${kind}`);
      if (arcadeCar) arcadeMoved = Math.max(arcadeMoved, Math.hypot(arcadeCar.x - targetX, arcadeCar.distance - 32));
      expect([run.x, run.distance, run.forceYaw, run.speed].every(Number.isFinite)).toBe(true);
    }
    console.log(JSON.stringify({kind, peakYaw, contacts: physics.contactPairs, moved,
      x: run.x, distance: run.distance, trailerRearX: run.forceTrailerRearX}));
    expect(peakYaw).toBeGreaterThan(.1);
    expect(physics.contactPairs).toBeGreaterThan(0);
    expect(moved).toBeGreaterThan(.1);
    expect(arcade.forceYaw).toBe(0);
    expect(arcadeMoved).toBe(0);
    expect(arcade.durability).toBeGreaterThan(0);
    expect(run.distance).toBeGreaterThan(25);
    console.log(JSON.stringify({ scenario: `force-tail-${kind}`, seed: 17,
      peakYaw, contacts: physics.contactPairs, moved, distance: run.distance }));
  });
  it('flings a struck NPC through fall and stand phases without letting them board', () => {
    const npc = entity('passenger', 'walker', 1.35, 0);
    const base = initialRun(17, 'force-comparison');
    const run = { ...base, phase: 'running' as const,
      world: { ...base.world, entities: [npc], nextHazard: 1000, nextPassenger: 1000,
        nextFuel: 1000, nextRepair: 1000, nextShop: 1000, nextSpecial: 1000 } };
    const arcade = stepRun(run, noInput());
    const force = new ForceIntegration();
    const physical = force.step(run, noInput());
    const newNpc = physical.world.entities.find(e => e.id === npc.id)!;
    expect(force.npcImpacts).toBe(1);
    expect(newNpc.pickupable).toBe(false);
    expect(newNpc.passengerMotion?.homeDistance).toBeGreaterThan(npc.distance + 2);
    expect(physical.speed).toBeGreaterThan(arcade.speed * .95);
    expect(pickUpPassenger(arcade).riderIds).toHaveLength(1);
    expect(pickUpPassenger(physical).riderIds).toHaveLength(0);
    const flight = { ...newNpc };
    advancePassengers([flight], physical.activeSeconds + .3);
    expect(flight.distance).toBeGreaterThan(npc.distance);
    expect(passengerPose(flight, physical.activeSeconds + .3).height).toBeGreaterThan(0);
    advancePassengers([flight], physical.activeSeconds + .9);
    expect(passengerPose(flight, physical.activeSeconds + .9).roll).not.toBe(0);
    advancePassengers([flight], physical.activeSeconds + 1.8);
    expect(passengerPose(flight, physical.activeSeconds + 1.8).roll).toBe(0);
    expect(pickUpPassenger({ ...physical, activeSeconds: physical.activeSeconds + 1.8,
      x: flight.x, distance: flight.distance,
      world: { ...physical.world, entities: [flight] } }).riderIds).toHaveLength(0);
    expect(physical.money).toBe(arcade.money);
    expect(physical.score).toBe(arcade.score);
    expect(physical.fuel).toBe(arcade.fuel);
    const again = force.step(physical, noInput());
    expect(force.npcImpacts).toBe(1);
    expect(again.world.entities.find(e => e.id === npc.id)?.pickupable).toBe(false);
  });

  it('keeps the same force outcome for an identical seed and input', () => {
    const base = initialRun(29, 'repeat');
    const run = { ...base, phase: 'running' as const,
      world: { ...base.world, entities: [entity('cargo', 'crate', 1, .2)],
        nextHazard: 1000, nextPassenger: 1000, nextFuel: 1000, nextRepair: 1000,
        nextShop: 1000, nextSpecial: 1000 } };
    const one = new ForceIntegration().step(run, noInput());
    const two = new ForceIntegration().step(run, noInput());
    expect(one).toEqual(two);
  });

  it('does not add a second damage event or push the fallen driver after a ram', () => {
    const base = initialRun(17, 'ram-force');
    const car = entity('traffic', 'stopped-car', 3.3, 0);
    car.speed = 0; car.baseSpeed = 0;
    const start = { ...base, phase: 'running' as const,
      world: { ...base.world, entities: [car], nextHazard: 1000, nextPassenger: 1000,
        nextFuel: 1000, nextRepair: 1000, nextShop: 1000, nextSpecial: 1000 } };
    const physical = new ForceIntegration();
    let arcade: Run = start, force: Run = start;
    for (let i = 0; i < 3; i++) {
      arcade = stepRun(arcade, noInput());
      force = physical.step(force, noInput());
      if (arcade.crash) break;
    }
    expect(arcade.durability).toBeLessThan(start.durability);
    expect(force.durability).toBe(arcade.durability);
    expect(force.crash?.elapsed).toBe(arcade.crash?.elapsed);
    const crashedX = force.x;
    const stoppedCar = force.world.entities.find(e => e.id === car.id)!.distance;
    const after = physical.step(force, noInput());
    expect(physical.contactPairs).toBe(0);
    expect(after.crash).not.toBeNull();
    expect(after.x).toBeGreaterThanOrEqual(crashedX - .1);
    expect(after.world.entities.find(e => e.id === car.id)!.distance).toBeCloseTo(stoppedCar, 4);
  });

  it('runs a seeded full-game sample without invalid resources or runaway contacts', () => {
    const physics = new ForceIntegration();
    let run: Run = { ...initialRun(17, 'force-sample'), phase: 'running' };
    let frames = 0;
    for (; frames < 1200 && run.phase === 'running'; frames++) {
      run = physics.step(run, { ...noInput(), accelerate: frames % 240 < 120 });
      expect([run.x, run.speed, run.distance, run.fuel, run.durability, run.money].every(Number.isFinite)).toBe(true);
      expect(run.fuel).toBeGreaterThanOrEqual(0);
      expect(run.durability).toBeGreaterThanOrEqual(0);
    }
    expect(run.distance).toBeGreaterThan(0);
    expect(physics.contactPairs).toBeLessThan(500);
    console.log(JSON.stringify({ version: 'ver.force', seed: 17, seconds: run.activeSeconds,
      distance: run.distance, hp: run.durability, fuel: run.fuel, contacts: physics.contactPairs,
      phase: run.phase, end: run.result?.reason ?? null }));
  });

  it('pushes a small traffic car in the playable bus-ram fixture', () => {
    const sample = developmentScenario(initialRun(17, 'bus-force'), 'traffic-ram');
    let run: Run = { ...sample, phase: 'running' };
    const physics = new ForceIntegration();
    let firstImpact: { busSpeed: number; carDistance: number } | null = null;
    for (let i = 0; i < 100 && run.phase === 'running'; i++) {
      run = physics.step(run, noInput());
      if (physics.contactPairs === 1 && !firstImpact) firstImpact = { busSpeed: run.speed,
        carDistance: run.world.entities.find(e => e.id === 'qa-small-car')!.distance };
    }
    const car = run.world.entities.find(e => e.id === 'qa-small-car');
    expect(firstImpact).not.toBeNull();
    expect(firstImpact!.busSpeed).toBeLessThan(10);
    expect(firstImpact!.carDistance).toBeGreaterThan(8.05);
    expect(firstImpact!.carDistance).toBeLessThan(8.3);
    expect(physics.contactPairs).toBe(1);
    expect(car!.distance - firstImpact!.carDistance).toBeGreaterThan(1.5);
    expect(car!.distance - firstImpact!.carDistance).toBeLessThan(4);
    expect(car?.speed).toBe(0);
    expect(run.distance).toBeGreaterThan((car?.distance ?? 0) + 4);
    expect(run.durability).toBeLessThan(sample.durability);
    console.log(JSON.stringify({ scenario: 'traffic-ram', firstImpact, wreckDistance: car?.distance,
      wreckSpeed: car?.speed, playerDistance: run.distance, contacts: physics.contactPairs }));
  });

  it('shoves a surviving car forward, then lets it resume its own driving speed', () => {
    const sample = developmentScenario(initialRun(17, 'car-force'), 'force-car-ram');
    let run: Run = { ...sample, phase: 'running' };
    let arcade: Run = { ...developmentScenario(initialRun(17, 'car-arcade'), 'force-car-ram'), phase: 'running' };
    const physics = new ForceIntegration();
    let hitAt: { time: number; distance: number } | null = null;
    for (let i = 0; i < 240 && run.phase === 'running'; i++) {
      run = physics.step(run, noInput());
      arcade = stepRun(arcade, noInput());
      const target = run.world.entities.find(e => e.id === 'qa-peer-car')!;
      if (target.lastHit > 0 && !hitAt) hitAt = { time: run.activeSeconds, distance: target.distance };
    }
    const target = run.world.entities.find(e => e.id === 'qa-peer-car')!;
    console.log(JSON.stringify({ scenario: 'force-car-ram', hitAt, endTime: run.activeSeconds,
      endDistance: target.distance, speed: target.speed, hp: target.hp, wrecked: target.wrecked,
      contacts: physics.contactPairs, playerCrash: Boolean(run.crash) }));
    expect(hitAt).not.toBeNull();
    expect(target.hp).toBeGreaterThan(0);
    expect(target.wrecked).toBe(false);
    const ownDriveDistance = hitAt!.distance + 5 * (run.activeSeconds - hitAt!.time);
    expect(target.distance - ownDriveDistance).toBeGreaterThan(1.4);
    expect(target.distance - ownDriveDistance).toBeLessThan(2.5);
    expect(target.speed).toBeCloseTo(5, 5);
    expect(target.baseSpeed).toBe(5);
    expect(physics.contactPairs).toBe(1);
    expect(run.durability).toBe(arcade.durability);
    expect(target.hp).toBe(arcade.world.entities.find(e => e.id === 'qa-peer-car')?.hp);
  });
});
