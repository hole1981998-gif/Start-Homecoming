import { describe, expect, it } from 'vitest';
import { balance } from '../src/config';
import { driverCrashPose, driverVisualReturnProgress, passengerCrashPose,
  passengerVisualReturnProgress, returningPassengerPose } from '../src/art/timing';

describe('art samples the existing crash clock', () => {
  it('uses the same driver fall, pause and return boundaries as the renderer', () => {
    const fall = balance.driverFallSeconds, down = fall + balance.driverPauseSeconds;
    const end = down + balance.driverReturnSeconds;
    expect(driverCrashPose(fall / 2).pose).toBe('ejected');
    expect(driverCrashPose(fall).pose).toBe('grounded');
    expect(driverCrashPose(down).pose).toBe('recover');
    expect(driverCrashPose(down + .2).pose).toBe('recover');
    expect(driverCrashPose(down + .6).pose).toBe('run');
    expect(driverCrashPose(end).pose).toBe('run');
    expect(driverCrashPose(end + .5).pose).toBe('run');
    expect(driverVisualReturnProgress(down)).toBe(0);
    expect(driverVisualReturnProgress(down + .6)).toBeGreaterThan(0);
    expect(driverVisualReturnProgress(end)).toBe(1);
  });
  it('uses the same passenger ejection/down/standing boundaries as world motion', () => {
    const fall = balance.passengerKickSeconds, down = fall + balance.passengerDownSeconds;
    const end = down + balance.passengerStandSeconds;
    expect(passengerCrashPose(fall / 2).pose).toBe('ejected');
    expect(passengerCrashPose(fall).pose).toBe('grounded');
    expect(passengerCrashPose(down).pose).toBe('recover');
    expect(passengerCrashPose(end).pose).toBe('stand');
    expect(passengerCrashPose(down + balance.passengerStandSeconds / 2).phase).toBeCloseTo(.5);
    expect(returningPassengerPose(down + balance.passengerStandSeconds / 2).pose).toBe('recover');
    expect(returningPassengerPose(end + .2).pose).toBe('run');
    expect(returningPassengerPose(balance.driverFallSeconds + balance.driverPauseSeconds +
      balance.driverReturnSeconds + .5).pose).toBe('run');
    expect(passengerVisualReturnProgress(end)).toBe(0);
    expect(passengerVisualReturnProgress(balance.driverFallSeconds + balance.driverPauseSeconds +
      balance.driverReturnSeconds)).toBe(1);
  });
});
