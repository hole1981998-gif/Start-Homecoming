import { expect, it } from 'vitest';
import { balance } from '../src/config';
import { twoWheelCrashPose, bikeLiftSeconds, trafficBikeWreckPose } from '../src/art/vehicle-recovery';
import { createVehicleArt, setTrafficDriverSeated } from '../src/art/vehicle-catalog';
import type { CrashState } from '../src/survival';

const crash: CrashState = { elapsed: 0, side: 1, originX: 0, originDistance: 0, impactSpeed: 14,
  returningRiderIds: [], strandedRiderIds: [] };
it('topples only wrecked two-wheel traffic, keeps it down and clears tilt for healthy pool reuse', () => {
  for (const kind of ['motorcycle', 'motorbike'] as const) for (const id of ['bike-a', 'bike-b']) {
    const start = trafficBikeWreckPose(kind, true, 0, id);
    const mid = trafficBikeWreckPose(kind, true, .14, id);
    const down = trafficBikeWreckPose(kind, true, 1, id);
    expect(Math.abs(start.roll)).toBe(0);
    expect(Math.abs(mid.roll)).toBeGreaterThan(0);
    expect(Math.abs(mid.roll)).toBeLessThan(Math.abs(down.roll));
    expect(Math.abs(down.roll)).toBeGreaterThan(1.2);
    expect(trafficBikeWreckPose(kind, true, 100, id)).toEqual(down);
    expect(trafficBikeWreckPose(kind, false, 100, id)).toEqual({ roll: 0, height: 0 });
  }
  expect(trafficBikeWreckPose('tricycle', true, 2, 'bike-a')).toEqual({ roll: 0, height: 0 });
  expect(trafficBikeWreckPose('car4', true, 2, 'bike-a')).toEqual({ roll: 0, height: 0 });
});
it('falls on the impact side, stays down until return, then lifts quickly without changing crash state', () => {
  const end = balance.driverFallSeconds + balance.driverPauseSeconds + balance.driverReturnSeconds;
  for (const kind of ['motorcycle', 'motorbike'] as const) for (const side of [-1, 1] as const) {
    const state = { ...crash, side, elapsed: 1 };
    const before = structuredClone(state);
    expect(Math.abs(twoWheelCrashPose(kind, state).roll)).toBeGreaterThan(1.2);
    expect(Math.sign(twoWheelCrashPose(kind, state).roll)).toBe(-side);
    expect(twoWheelCrashPose(kind, { ...state, elapsed: end - bikeLiftSeconds - .01 }).lifting).toBe(false);
    const midway = twoWheelCrashPose(kind, { ...state, elapsed: end - bikeLiftSeconds / 2 });
    expect(midway.lifting).toBe(true); expect(Math.abs(midway.roll)).toBeLessThan(1);
    expect(twoWheelCrashPose(kind, { ...state, elapsed: end }).roll).toBeCloseTo(0);
    expect(twoWheelCrashPose(kind, null).height).toBe(0); expect(state).toEqual(before);
  }
  expect(twoWheelCrashPose('car4', { ...crash, elapsed: 1 }).roll).toBe(0);
  expect(twoWheelCrashPose('motorcycle', { ...crash, impactSpeed: 40, elapsed: 3 }).lifting).toBe(false);
});
it('removes seated duplicates on all open traffic and restores a pooled healthy vehicle', () => {
  for (const kind of ['motorcycle', 'motorbike', 'tricycle'] as const) {
    const art = createVehicleArt(kind, 'traffic', 'far');
    const driver = art.root.getObjectByName('chr_driver_root')!;
    expect(driver.visible).toBe(true);
    setTrafficDriverSeated(art, false); expect(driver.visible).toBe(false);
    setTrafficDriverSeated(art, true); expect(driver.visible).toBe(true);
    art.dispose();
  }
});
