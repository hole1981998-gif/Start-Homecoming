import { describe, expect, it } from 'vitest';
import { balance } from '../src/config';
import { noInput } from '../src/simulation';
import { dropPassenger, initialRun, passengerDrive, pickUpPassenger, stepRun, type Run } from '../src/survival';
import { advancePassengers, entity, fillWorld, initialWorld } from '../src/world';

function clearRun(): Run {
  const run = initialRun(17);
  return { ...run, phase: 'running', world: { ...run.world, entities: [],
    nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9 } };
}

describe('P4A passenger loop', () => {
  it('spawns the same reachable passenger positions for a seed without consuming hazard RNG', () => {
    const first = fillWorld(initialWorld(17), 130);
    const again = fillWorld(initialWorld(17), 130);
    expect(first).toEqual(again);
    expect(first.entities.find(e => e.kind === 'passenger')).toMatchObject({ id: 'passenger-0', distance: balance.firstPassenger });
    expect(first.rng).toBe(again.rng);
  });

  it('requires F near the person, boards once, and drops a passenger without free distance or money', () => {
    const npc = entity('passenger', 'test-person', 10, balance.laneWidth);
    const run = { ...clearRun(), world: { ...clearRun().world, entities: [npc] } };
    expect(pickUpPassenger(run)).toBe(run);
    const near = { ...run, distance: 10, x: balance.laneWidth };
    const boarded = pickUpPassenger(near);
    expect(boarded.riderIds).toEqual(['test-person']);
    expect(boarded.world.entities[0].consumed).toBe(true);
    expect(pickUpPassenger(boarded)).toBe(boarded);
    const paused = { ...boarded, phase: 'paused' as const };
    expect(dropPassenger(paused)).toBe(paused);
    const dropped = dropPassenger(boarded);
    expect(dropped.riderIds).toEqual([]);
    expect(dropped.world.entities.find(e => e.id.startsWith('dropped-'))?.riderId).toBe('test-person');
    expect(dropped.distance).toBe(near.distance);
    expect(dropped.money).toBe(near.money);
    expect(dropped.world.entities.find(e => e.id.startsWith('dropped-'))).toMatchObject({
      kind: 'passenger', consumed: false, lastHit: near.activeSeconds + balance.passengerReboardDelaySeconds,
    });
    const kicked = dropped.world.entities.find(e => e.id.startsWith('dropped-'))!;
    const otherRun = dropPassenger({ ...boarded, runId: 'different-local-save-id' });
    expect(otherRun.world.entities.find(e => e.id.startsWith('dropped-'))!.passengerMotion)
      .toEqual(kicked.passengerMotion);
    expect(kicked.x).toBe(near.x);
    const midFlight = stepRun(dropped, noInput()).world.entities.find(e => e.id === kicked.id)!;
    expect(midFlight.x).toBeGreaterThan(kicked.x);
    expect(midFlight.x).toBeLessThan(kicked.passengerMotion!.homeX);
    expect(pickUpPassenger(dropped)).toBe(dropped);
    expect(pickUpPassenger({ ...dropped, activeSeconds: balance.passengerReboardDelaySeconds })).not.toBe(dropped);
    expect(dropPassenger(dropped)).toBe(dropped);
  });

  it('keeps waiting and stranded people still or wandering within 1.5 m deterministically', () => {
    const ids = ['passenger-0', 'passenger-1', 'fallen-seed-0-0', 'fallen-seed-0-1'];
    let idle = 0, moving = 0;
    for (const id of ids) {
      const direct = entity('passenger', id, 100, balance.laneWidth);
      const stepped = entity('passenger', id, 100, balance.laneWidth);
      advancePassengers([direct, stepped], 0);
      for (let tick = 1; tick <= 600; tick++) {
        advancePassengers([stepped], tick * balance.fixedStep);
        const radius = Math.hypot(stepped.x - balance.laneWidth, stepped.distance - 100);
        expect(radius).toBeLessThanOrEqual(balance.passengerWanderRadius + 1e-9);
      }
      advancePassengers([direct], 10);
      expect(stepped.x).toBeCloseTo(direct.x, 10);
      expect(stepped.distance).toBeCloseTo(direct.distance, 10);
      if (direct.passengerMotion!.idle) idle++; else moving++;
    }
    expect(idle).toBeGreaterThan(0);
    expect(moving).toBeGreaterThan(0);
  });

  it('slows cruise before overload, then caps max speed and charges extra fuel without rewarding idle time', () => {
    expect(passengerDrive(0)).toEqual({ cruiseSpeed: 14, maxSpeed: 20, fuelFactor: 1 });
    expect(passengerDrive(1).cruiseSpeed).toBe(12);
    expect(passengerDrive(2).maxSpeed).toBeLessThan(passengerDrive(1).maxSpeed);
    const loaded = { ...clearRun(), riderIds: ['rider-0', 'rider-1'] };
    let run = loaded;
    for (let i = 0; i < 600; i++) run = stepRun(run, noInput());
    expect(run.speed).toBeCloseTo(10, 6);
    expect(run.score).toBeGreaterThan(0);
    expect(run.score).toBeLessThan(run.distance * .65 * 1.08);
    expect(run.money).toBeCloseTo(balance.initialMoney + run.distance * (balance.moneyPerMeter + 2 * balance.riderMoneyPerMeter), 6);
    expect(run.fuel).toBeCloseTo(balance.fuelCapacity - run.distance * balance.fuelPerMeter * 1.15, 6);
    expect(stepRun({ ...run, phase: 'paused' }, noInput()).money).toBe(run.money);
    const lighter = dropPassenger(run);
    expect(stepRun(lighter, noInput()).speed).toBeGreaterThan(lighter.speed);
  });

  it('caps boarding for performance while keeping overload allowed', () => {
    let run = { ...clearRun(), world: { ...clearRun().world,
      entities: Array.from({ length: balance.riderLimit + 1 }, (_, i) => entity('passenger', `npc-${i}`, 0, 0)) } };
    for (let i = 0; i < balance.riderLimit + 1; i++) run = pickUpPassenger(run);
    expect(run.riderIds).toHaveLength(balance.riderLimit);
    expect(run.riderIds.length + 1).toBeGreaterThan(balance.motorcycleCapacity);
    expect(run.world.entities.filter(e => !e.consumed)).toHaveLength(1);
  });

  it('samples one minute of solo, full, and overloaded cruise for economy review', () => {
    const samples = [0, 1, 2].map(passengers => {
      let run = { ...clearRun(), riderIds: Array.from({ length: passengers }, (_, i) => `rider-${i}`) };
      for (let i = 0; i < 3600; i++) run = stepRun(run, noInput());
      return { passengers, distance: run.distance, earned: run.money - balance.initialMoney,
        score: run.score, fuelLeft: run.fuel, phase: run.phase };
    });
    expect(samples.every(s => s.phase === 'running')).toBe(true);
    expect(samples[1].earned / samples[1].distance).toBeGreaterThan(samples[0].earned / samples[0].distance);
    expect(samples[1].earned).toBeGreaterThan(samples[0].earned);
    expect((balance.fuelCapacity - samples[2].fuelLeft) / samples[2].distance)
      .toBeGreaterThan((balance.fuelCapacity - samples[1].fuelLeft) / samples[1].distance);
    console.log(JSON.stringify({ config: balance.version, seconds: 60, samples }));
  });
});
