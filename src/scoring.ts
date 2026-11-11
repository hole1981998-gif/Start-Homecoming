import type { VehicleDefinition } from './vehicles';

export const scoreVersion = 'hybrid-v1' as const;
export const baseScorePerMeter = 0.20;
export const roadScore = Object.freeze({ firstDistance: 450, gaps: [[600, 900], [750, 1050], [900, 1200]] as const,
  value: 50, width: 1, length: 1, maxCombo: 8 });
export const scoreAudio = Object.freeze({ sliceSeconds: .65, fadeAtSeconds: .42, volume: .14,
  lowpassHz: 3200, warmthHz: 700, warmthDb: 5 });

/** Separate seeded stream; a packet's stage is set at the previous packet. */
export function scoreDistance(index: number, seed: number): number {
  let at = roadScore.firstDistance;
  for (let i = 0; i < index; i++) {
    const stage = at >= 8000 ? 2 : at >= 5000 ? 1 : 0;
    const [minimum, maximum] = roadScore.gaps[stage];
    const hash = (Math.imul(seed ^ Math.imul(i + 1, 0x9e3779b1), 1664525) + 1013904223) >>> 0;
    at += minimum + hash % (maximum - minimum + 1);
  }
  return at;
}
export function scoreIndexAtOrAfter(distance: number, seed: number): number {
  let index = 0;
  while (scoreDistance(index, seed) < distance) index++;
  return index;
}

/** Hybrid movement rule. Base catalogue stats keep upgrades, water and nitro from moving the reference speed. */
export function scorePerMeter(speed: number, riders: number, vehicle: VehicleDefinition): number {
  if (speed <= vehicle.minSpeed) return 0;
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
