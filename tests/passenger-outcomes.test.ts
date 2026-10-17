import { describe, expect, it } from 'vitest';
import { balance } from '../src/config';
import { splitCrashRiders } from '../src/passenger-outcomes';
import { entity, passengerPose } from '../src/world';

describe('crash rider decisions and roadside recovery', () => {
  it('gives each rider a stable decision and allows every loss count across seeds', () => {
    const ids = ['r0', 'r1', 'r2', 'r3'];
    const outcomes = new Set<number>();
    for (let seed = 1; seed <= 256; seed++) {
      const first = splitCrashRiders(ids, seed, 0, balance.passengerReturnChance);
      const replay = splitCrashRiders([...ids].reverse(), seed, 0, balance.passengerReturnChance);
      expect([...first.returning, ...first.stranded].sort()).toEqual(ids);
      expect(new Set([...first.returning, ...first.stranded]).size).toBe(ids.length);
      expect([...replay.returning].sort()).toEqual([...first.returning].sort());
      outcomes.add(first.stranded.length);
    }
    expect([...outcomes].sort()).toEqual([0, 1, 2, 3, 4]);
    const first = splitCrashRiders(ids, 17, 0, balance.passengerReturnChance);
    const nextCrash = splitCrashRiders(ids, 17, 1, balance.passengerReturnChance);
    expect(nextCrash).not.toEqual(first);
  });

  it('lands, stays down, then stands before the stranded rider wanders', () => {
    const rider = entity('passenger', 'stranded', 20, 3);
    rider.passengerMotion = { homeX: 3, homeDistance: 20, fromX: 0, fromDistance: 0,
      ejectedAt: 0, startedAt: balance.passengerKickSeconds + balance.passengerDownSeconds +
        balance.passengerStandSeconds, phase: 0, idle: false, crashRecovery: true };
    expect(passengerPose(rider, 0).height).toBeGreaterThan(0);
    const landing = passengerPose(rider, balance.passengerKickSeconds);
    expect(landing.height).toBe(0);
    expect(landing.roll).toBeCloseTo(1.2);
    expect(passengerPose(rider, balance.passengerKickSeconds + balance.passengerDownSeconds / 2).roll)
      .toBeCloseTo(landing.roll);
    const standing = passengerPose(rider, balance.passengerKickSeconds + balance.passengerDownSeconds +
      balance.passengerStandSeconds / 2);
    expect(standing.roll).toBeGreaterThan(0);
    expect(standing.roll).toBeLessThan(landing.roll);
    expect(passengerPose(rider, rider.passengerMotion.startedAt).roll).toBe(0);
  });
});
