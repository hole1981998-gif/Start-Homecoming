import { forceTailSweep } from './config';
import type { VehicleKind } from './vehicles';

export function tailSweepYaw(kind: VehicleKind, previous: number, lateralVelocity: number,
  forwardSpeed: number, dt: number, steering = 0): number {
  const tune = kind === 'car7' || kind === 'bus' || kind === 'truck' || kind === 'container' ? forceTailSweep[kind] : null;
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

/** The bus's logical x is near its powered rear axle, which stays comparatively planted. */
export function busBodyCenterX(rearAxleX: number, length: number, yaw: number): number {
  return rearAxleX + Math.sin(yaw) * length * forceTailSweep.bus.rearAxleToCenter;
}

/** The seven-seat car turns around a point slightly ahead of its center, giving its tail a small outward sweep. */
export function car7BodyCenterX(frontPivotX: number, length: number, yaw: number): number {
  return frontPivotX - Math.sin(yaw) * length * forceTailSweep.car7.frontPivotToCenter;
}

export function heavyFrontCenterX(kind: 'bus' | 'truck', rearAxleX: number, length: number, yaw: number): number {
  return rearAxleX + Math.sin(yaw) * length * forceTailSweep[kind].rearAxleToCenter;
}

export interface ContainerParts {
  tractorX: number; tractorDistance: number; tractorYaw: number;
  hitchX: number; hitchDistance: number;
  trailerX: number; trailerDistance: number; trailerYaw: number; trailerRearX: number;
}

/** A front tractor and a separate trailer meet at one hitch; only player vehicles use this pose. */
export function containerParts(tractorX: number, distance: number, tractorYaw: number,
  trailerRearX: number): ContainerParts {
  const tractorDistance = distance + forceTailSweep.trailerLength / 2;
  const hitchX = tractorX - Math.sin(tractorYaw) * forceTailSweep.tractorLength / 2;
  const hitchDistance = tractorDistance - Math.cos(tractorYaw) * forceTailSweep.tractorLength / 2;
  const maxOffset = forceTailSweep.trailerLength * Math.sin(forceTailSweep.trailerMaxYaw);
  const offset = Math.max(-maxOffset, Math.min(maxOffset, hitchX - trailerRearX));
  const trailerYaw = Math.asin(offset / forceTailSweep.trailerLength);
  return { tractorX, tractorDistance, tractorYaw, hitchX, hitchDistance,
    trailerX: (hitchX + trailerRearX) / 2,
    trailerDistance: hitchDistance - Math.cos(trailerYaw) * forceTailSweep.trailerLength / 2,
    trailerYaw, trailerRearX };
}

/** Rear axle follows the hitch at a speed-limited rate, creating visible off-tracking. */
export function stepTrailerRearX(tractorX: number, distance: number, tractorYaw: number,
  previousRearX: number, speed: number, dt: number): number {
  const pose = containerParts(tractorX, distance, tractorYaw, previousRearX);
  const next = previousRearX + speed * Math.sin(pose.trailerYaw) * forceTailSweep.trailerFollow * dt;
  const maxOffset = forceTailSweep.trailerLength * Math.sin(forceTailSweep.trailerMaxYaw);
  return Math.max(pose.hitchX - maxOffset, Math.min(pose.hitchX + maxOffset, next));
}
