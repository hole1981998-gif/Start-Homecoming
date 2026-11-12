import { vehicleDefinition, type VehicleDefinition } from './vehicles';

export const scoreVersion = 'hybrid-v2' as const;
export const movementScore = Object.freeze({ cruise: 0.01, catalogMax: 0.40, aboveMaxGain: 0.39 });
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

/** Reward holding W and buying engine upgrades without moving the speed reference. */
export function scorePerMeter(speed: number, riders: number, vehicle: VehicleDefinition): number {
  if (speed <= vehicle.minSpeed) return 0;
  const validRiders = Math.min(Math.max(0, riders), vehicle.capacity - 1);
  const cruise = Math.min(vehicle.maxSpeed, Math.max(vehicle.cruiseFloor,
    vehicle.cruiseSpeed - validRiders * vehicle.cruiseLoss));
  const catalogMax = vehicleDefinition(vehicle.kind).maxSpeed;
  const u = Math.min(1, Math.max(0, (speed - vehicle.minSpeed) /
    Math.max(1e-9, cruise - vehicle.minSpeed)));
  const h = Math.max(0, (speed - cruise) / Math.max(1e-9, catalogMax - cruise));
  const rate = speed <= cruise ? movementScore.cruise * u ** 2 : h <= 1 ?
    movementScore.cruise + (movementScore.catalogMax - movementScore.cruise) * h ** 1.5 :
    movementScore.catalogMax + movementScore.aboveMaxGain * Math.log1p(h - 1);
  return rate * (1 + 0.02 * Math.min(Math.max(0, riders), 4));
}
