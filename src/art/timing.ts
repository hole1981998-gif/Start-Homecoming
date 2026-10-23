import { balance } from '../config';
import type { EssentialPose } from './people';

export interface TimedPose { pose: EssentialPose; phase: number }
const progress = (elapsed: number, start: number, duration: number) =>
  Math.max(0, Math.min(1, (elapsed - start) / duration));

/** Visual samples only. Simulation remains the sole owner of crash and passenger state. */
export function driverCrashPose(elapsed: number): TimedPose {
  if (!Number.isFinite(elapsed) || elapsed < 0) return { pose: 'seated', phase: 0 };
  const fall = balance.driverFallSeconds;
  const down = fall + balance.driverPauseSeconds;
  const end = down + balance.driverReturnSeconds;
  if (elapsed < fall) return { pose: 'ejected', phase: progress(elapsed, 0, fall) };
  if (elapsed < down) return { pose: 'grounded', phase: progress(elapsed, fall, balance.driverPauseSeconds) };
  if (elapsed < end) return { pose: 'recover', phase: progress(elapsed, down, balance.driverReturnSeconds) };
  return { pose: 'seated', phase: 1 };
}

export function passengerCrashPose(elapsed: number): TimedPose {
  if (!Number.isFinite(elapsed) || elapsed < 0) return { pose: 'seated', phase: 0 };
  const fall = balance.passengerKickSeconds;
  const down = fall + balance.passengerDownSeconds;
  const end = down + balance.passengerStandSeconds;
  if (elapsed < fall) return { pose: 'ejected', phase: progress(elapsed, 0, fall) };
  if (elapsed < down) return { pose: 'grounded', phase: progress(elapsed, fall, balance.passengerDownSeconds) };
  if (elapsed < end) return { pose: 'recover', phase: progress(elapsed, down, balance.passengerStandSeconds) };
  return { pose: 'stand', phase: 1 };
}
