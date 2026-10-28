import { balance } from '../config';
import type { CrashState } from '../survival';
import type { VehicleKind } from '../vehicles';

export const bikeLiftSeconds = .28;
const smooth = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };

/** Presentation only: same crash duration/slide/boarding rules as the simulation. */
export function twoWheelCrashPose(kind: VehicleKind, crash: CrashState | null) {
  const twoWheeler = kind === 'motorcycle' || kind === 'motorbike';
  if (!twoWheeler || !crash) return { roll: 0, height: 0, lifting: false, liftProgress: 0 };
  const end = Math.max(balance.driverFallSeconds + balance.driverPauseSeconds + balance.driverReturnSeconds,
    crash.impactSpeed / balance.crashSlideDeceleration);
  const liftStart = end - bikeLiftSeconds;
  const liftProgress = smooth((crash.elapsed - liftStart) / bikeLiftSeconds);
  const fallen = smooth(crash.elapsed / .28) * (1 - liftProgress);
  return { roll: -crash.side * 1.38 * fallen, height: .14 * fallen,
    lifting: crash.elapsed >= liftStart, liftProgress };
}
