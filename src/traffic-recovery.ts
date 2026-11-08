import { balance } from './config';
import type { VehicleKind } from './vehicles';
import type { Entity } from './world';

export const trafficFallSeconds = balance.driverFallSeconds;
export const trafficPauseSeconds = balance.driverPauseSeconds;
export const trafficReturnSeconds = balance.driverReturnSeconds;
export const trafficRecoverySeconds = trafficFallSeconds + trafficPauseSeconds + trafficReturnSeconds;

export const openTraffic = (kind: VehicleKind | undefined): boolean =>
  kind === 'motorcycle' || kind === 'motorbike' || kind === 'tricycle';

/** A surviving open vehicle stops while its driver falls, stands and boards again. */
export function startTrafficFall(car: Entity): void {
  if (!openTraffic(car.trafficKind) || car.wrecked || (car.hp ?? 0) <= 0 || car.trafficFallAge !== undefined) return;
  car.trafficFallAge = 0;
  car.trafficStoppedByCollision = true;
  car.trafficMotion = 'stopped';
  car.speed = 0;
}

export function advanceTrafficFall(car: Entity, dt: number): void {
  if (car.trafficFallAge === undefined || car.wrecked) return;
  car.trafficFallAge += dt;
  if (car.trafficFallAge + 1e-9 < trafficRecoverySeconds) return;
  car.trafficFallAge = undefined;
  if ((car.hp ?? 0) <= 0 || (car.fuel ?? 0) <= 0 || !car.baseSpeed) return;
  car.trafficStoppedByCollision = false;
  car.trafficMotion = 'powered';
  car.speed = car.baseSpeed;
}
