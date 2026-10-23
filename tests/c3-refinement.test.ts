import { describe, expect, it } from 'vitest';
import { earlyBalance, movingBalance } from '../src/config';
import { crossX, type CrossMotion } from '../src/cross-motion';
import { softenEarlyEncounter } from '../src/p8-encounters';
import { scorePerMeter } from '../src/scoring';
import { vehicles } from '../src/vehicles';
import { entity } from '../src/world';

describe('C3 targeted balance', () => {
  it('removes about a quarter of eligible third layers before 45 s and none after 90 s', () => {
    const plan = { id: 7, heavy: true, actors: [0, 1, 2].map(i => entity('water', `layer-${i}`, 100, i)) };
    const sample = (seconds: number) => Array.from({ length: 1000 }, (_, seed) =>
      softenEarlyEncounter(plan, seed, 7, seconds)).filter(p => p.actors.length === 2).length;
    expect(sample(20)).toBeGreaterThan(190);
    expect(sample(20)).toBeLessThan(310);
    expect(sample(67.5)).toBeLessThan(sample(20));
    expect(sample(earlyBalance.endSeconds)).toBe(0);
    expect(softenEarlyEncounter(plan, 17, 7, 20)).toEqual(softenEarlyEncounter(plan, 17, 7, 20));
  });

  it('uses one continuous two-sided vendor path with a fast start and faster cruise', () => {
    for (const sign of [-1, 1]) {
      const m: CrossMotion = { type: 'vendor', origin: -sign * 8, velocity: sign * 6,
        startedAt: 3, min: -8, max: 8 };
      const position = (t: number) => crossX(m, 3 + t);
      expect(position(.15) - m.origin).toBeCloseTo(sign * .9, 8);
      expect(Math.abs(position(.60) - m.origin)).toBeGreaterThan(.9 + .45 * movingBalance.vendorCruiseSpeed);
      expect(position(.60 + .001) - position(.60)).toBeCloseTo(sign * movingBalance.vendorCruiseSpeed * .001, 4);
      expect(position(1) - position(.6)).toBeCloseTo(sign * movingBalance.vendorCruiseSpeed * .4, 6);
      expect(position(-1)).toBe(m.origin);
    }
  });

  it('scores every catalogue vehicle relative to its loaded cruise, capped above base maximum', () => {
    for (const vehicle of Object.values(vehicles)) {
      expect(scorePerMeter(vehicle.minSpeed, 0, vehicle)).toBe(0);
      expect(scorePerMeter(vehicle.cruiseSpeed, 0, vehicle)).toBeCloseTo(.65);
      expect(scorePerMeter(vehicle.maxSpeed * 2, 0, vehicle)).toBeCloseTo(.975);
      const riders = Math.max(0, vehicle.capacity - 1);
      const cruise = Math.min(vehicle.maxSpeed, Math.max(vehicle.cruiseFloor,
        vehicle.cruiseSpeed - riders * vehicle.cruiseLoss));
      expect(scorePerMeter(cruise, riders, vehicle)).toBeCloseTo(.65 * (1 + .02 * Math.min(riders, 4)));
      expect(scorePerMeter(vehicle.maxSpeed * 2, riders + 10, vehicle)).toBeLessThanOrEqual(1.053 + 1e-9);
    }
  });

});
