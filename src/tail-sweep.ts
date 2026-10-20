import { forceTailSweep } from './config';
import type { VehicleKind } from './vehicles';

export function tailSweepYaw(kind: VehicleKind, previous: number, lateralVelocity: number,
  forwardSpeed: number, dt: number, steering = 0): number {
  const tune = kind === 'bus' || kind === 'container' ? forceTailSweep[kind] : null;
  if (!tune) return 0;
  // Keep the wheel angle while A/D is held at a road edge, where lateral velocity is clamped.
  const lateral = steering ? Math.sign(steering) *
    Math.max(Math.abs(lateralVelocity), forceTailSweep.steeringLateral) : lateralVelocity;
  const speedFactor = Math.max(0, Math.min(1,
    (forwardSpeed - forceTailSweep.lowSpeed) /
    (forceTailSweep.fullSpeed - forceTailSweep.lowSpeed)));
  const target = Math.max(-tune.maxYaw, Math.min(tune.maxYaw,
    Math.atan2(lateral, Math.max(5, forwardSpeed)) * tune.gain * speedFactor));
  const delta = Math.max(-tune.response * dt, Math.min(tune.response * dt, target - previous));
  return previous + delta;
}

/** The logical x is near the front axle; turning moves the long body's centre away from it. */
export function tailSweepCenterX(kind: VehicleKind, frontX: number, length: number, yaw: number): number {
  const tune = kind === 'bus' || kind === 'container' ? forceTailSweep[kind] : null;
  return tune ? frontX - Math.sin(yaw) * length * tune.pivotFraction : frontX;
}
