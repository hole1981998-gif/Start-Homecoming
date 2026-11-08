import { balance } from '../config';
import type { CrashState } from '../survival';
import type { VehicleKind } from '../vehicles';
import { openTraffic, trafficFallSeconds, trafficPauseSeconds, trafficRecoverySeconds, trafficReturnSeconds } from '../traffic-recovery';

export const bikeLiftSeconds = .28;
const smooth = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };

/** Wrecks never remount. Stable entity identity picks a side without simulation RNG. */
export function trafficBikeWreckPose(kind: VehicleKind, wrecked: boolean, age: number, id: string, fallAge?: number) {
  if ((!wrecked && fallAge === undefined) || !openTraffic(kind)) return { roll: 0, height: 0 };
  const side = id.split('').reduce((hash, char) => Math.imul(hash, 31) + char.charCodeAt(0) | 0, 0) & 1 ? 1 : -1;
  const fallen = smooth(Math.max(0, wrecked ? age : fallAge ?? 0) / .28) *
    (wrecked ? 1 : 1 - smooth(((fallAge ?? 0) - (trafficRecoverySeconds - bikeLiftSeconds)) / bikeLiftSeconds));
  return { roll: -side * (kind === 'tricycle' ? .9 : 1.38) * fallen, height: .14 * fallen };
}

export function trafficDriverFallPose(age: number, id: string) {
  const side = id.split('').reduce((hash, char) => Math.imul(hash, 31) + char.charCodeAt(0) | 0, 0) & 1 ? 1 : -1;
  const outward = smooth(age / trafficFallSeconds);
  const returning = smooth((age - trafficFallSeconds - trafficPauseSeconds) / trafficReturnSeconds);
  return { x: side * 1.25 * outward * (1 - returning), z: .85 * outward * (1 - returning),
    pose: age < trafficFallSeconds ? 'ejected' as const :
      age < trafficFallSeconds + trafficPauseSeconds ? 'grounded' as const : 'recover' as const,
    phase: age < trafficFallSeconds ? outward : returning };
}

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
