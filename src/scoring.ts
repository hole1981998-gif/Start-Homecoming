import type { VehicleDefinition } from './vehicles';

export const scoreVersion = 'road-v2' as const;
export const baseScorePerMeter = 0.65;
export const roadScore = Object.freeze({ firstDistance: 96, gap: 8, value: 3, trailLength: 8, width: 1, length: 1, maxCombo: 8 });
export const scoreAudio = Object.freeze({ sliceSeconds: .65, fadeAtSeconds: .42, volume: .8 });

export function scoreStation(distance: number): number {
  return Math.round((distance - roadScore.firstDistance) / roadScore.gap);
}

export function scoreComboPitch(level: number): number {
  return .9 + .105 * (Math.min(roadScore.maxCombo, Math.max(1, level)) - 1);
}

/** Archived speed-v1 rule. Base catalogue stats keep upgrades, water and nitro from moving the reference speed. */
export function scorePerMeter(speed: number, riders: number, vehicle: VehicleDefinition): number {
  const validRiders = Math.min(Math.max(0, riders), vehicle.capacity - 1);
  const cruise = Math.min(vehicle.maxSpeed, Math.max(vehicle.cruiseFloor,
    vehicle.cruiseSpeed - validRiders * vehicle.cruiseLoss));
  const u = Math.min(1, Math.max(0, (speed - vehicle.minSpeed) /
    Math.max(1e-9, cruise - vehicle.minSpeed)));
  const h = Math.min(1, Math.max(0, (speed - cruise) /
    Math.max(1e-9, vehicle.maxSpeed - cruise)));
  const multiplier = speed <= cruise ? u ** 1.2 : 1 + 0.5 * h;
  return baseScorePerMeter * multiplier * (1 + 0.02 * Math.min(Math.max(0, riders), 4));
}
