import { describe, expect, it } from 'vitest';
import { balance } from '../src/config';
import { driverCrashPose, passengerCrashPose } from '../src/art/timing';

describe('art samples the existing crash clock', () => {
  it('uses the same driver fall, pause and return boundaries as the renderer', () => {
    const fall = balance.driverFallSeconds, down = fall + balance.driverPauseSeconds;
    const end = down + balance.driverReturnSeconds;
    expect(driverCrashPose(fall / 2).pose).toBe('ejected');
    expect(driverCrashPose(fall).pose).toBe('grounded');
    expect(driverCrashPose(down).pose).toBe('recover');
    expect(driverCrashPose(end).pose).toBe('seated');
    expect(driverCrashPose(down + balance.driverReturnSeconds / 2).phase).toBeCloseTo(.5);
  });
  it('uses the same passenger ejection/down/standing boundaries as world motion', () => {
    const fall = balance.passengerKickSeconds, down = fall + balance.passengerDownSeconds;
    const end = down + balance.passengerStandSeconds;
    expect(passengerCrashPose(fall / 2).pose).toBe('ejected');
    expect(passengerCrashPose(fall).pose).toBe('grounded');
    expect(passengerCrashPose(down).pose).toBe('recover');
    expect(passengerCrashPose(end).pose).toBe('stand');
    expect(passengerCrashPose(down + balance.passengerStandSeconds / 2).phase).toBeCloseTo(.5);
  });
});
