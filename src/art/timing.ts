import { balance } from '../config';
import type { EssentialPose } from './people';

export interface TimedPose { pose: EssentialPose; phase: number }
const progress = (elapsed: number, start: number, duration: number) =>
  Math.max(0, Math.min(1, (elapsed - start) / duration));
const driverRiseSeconds = Math.min(.4, balance.driverReturnSeconds * .25);
const driverDownEnd = balance.driverFallSeconds + balance.driverPauseSeconds;
const driverRunStart = driverDownEnd + driverRiseSeconds;
const driverReturnEnd = driverDownEnd + balance.driverReturnSeconds;
const passengerStandEnd = balance.passengerKickSeconds + balance.passengerDownSeconds +
  balance.passengerStandSeconds;

/** Visual travel starts after the rider is upright; simulation collision timing is unchanged. */
export const driverVisualReturnProgress = (elapsed: number) =>
  progress(elapsed, driverRunStart, driverReturnEnd - driverRunStart);
export const passengerVisualReturnProgress = (elapsed: number) =>
  progress(elapsed, passengerStandEnd, driverReturnEnd - passengerStandEnd);

/** Visual samples only. Simulation remains the sole owner of crash and passenger state. */
export function driverCrashPose(elapsed: number): TimedPose {
  if (!Number.isFinite(elapsed) || elapsed < 0) return { pose: 'seated', phase: 0 };
  const fall = balance.driverFallSeconds;
  const down = driverDownEnd;
  if (elapsed < fall) return { pose: 'ejected', phase: progress(elapsed, 0, fall) };
  if (elapsed < down) return { pose: 'grounded', phase: progress(elapsed, fall, balance.driverPauseSeconds) };
  if (elapsed < driverRunStart) return { pose: 'recover', phase: progress(elapsed, down, driverRiseSeconds) };
  // A fast car can still be sliding after the nominal return time; keep feet moving until crash clears.
  return { pose: 'run', phase: ((elapsed - driverRunStart) * 1.6) % 1 };
}

export function passengerCrashPose(elapsed: number): TimedPose {
  if (!Number.isFinite(elapsed) || elapsed < 0) return { pose: 'seated', phase: 0 };
  const fall = balance.passengerKickSeconds;
  const down = fall + balance.passengerDownSeconds;
  const end = passengerStandEnd;
  if (elapsed < fall) return { pose: 'ejected', phase: progress(elapsed, 0, fall) };
  if (elapsed < down) return { pose: 'grounded', phase: progress(elapsed, fall, balance.passengerDownSeconds) };
  if (elapsed < end) return { pose: 'recover', phase: progress(elapsed, down, balance.passengerStandSeconds) };
  return { pose: 'stand', phase: 1 };
}

/** Only passengers explicitly returning to their seats run after standing up. */
export function returningPassengerPose(elapsed: number): TimedPose {
  const pose = passengerCrashPose(elapsed);
  if (pose.pose !== 'stand') return pose;
  return { pose: 'run', phase: ((elapsed - passengerStandEnd) * 1.6) % 1 };
}
