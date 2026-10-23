import { balance, densityBalance } from './config';

/** Separate, stable draw stream: scenery and shop RNG cannot reroll road patterns. */
export function directorRoll(seed: number, index: number, salt: number): number {
  let value = (seed ^ Math.imul(index + 1, 0x9e3779b1) ^ salt) >>> 0;
  value = Math.imul(value ^ value >>> 16, 0x7feb352d);
  value = Math.imul(value ^ value >>> 15, 0x846ca68b);
  return (value ^ value >>> 16) >>> 0;
}

export type RoadHazard = 'water' | 'pothole' | 'traffic';
export function roadHazard(seed: number, index: number): RoadHazard {
  const roll = directorRoll(seed, index, 0x4f2c9173) %
    (densityBalance.waterWeight + densityBalance.potholeWeight + densityBalance.trafficWeight);
  if (roll < densityBalance.waterWeight) return 'water';
  if (roll < densityBalance.waterWeight + densityBalance.potholeWeight) return 'pothole';
  return 'traffic';
}

export function waterSizeIndex(seed: number, index: number): number {
  const weights = densityBalance.waterSizeWeights;
  let roll = directorRoll(seed, index, 0x217c5ebd) % weights.reduce((sum, n) => sum + n, 0);
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll < 0) return i;
  }
  return weights.length - 1;
}

export type LayerCount = 1 | 2 | 3;
export function layerCount(seed: number, index: number, distance: number): LayerCount {
  if (distance < densityBalance.pairStart) return 1;
  const roll = directorRoll(seed, index, 0x13b49a0d) % 100;
  if (distance < densityBalance.fullPatternsStart) return roll < 40 ? 2 : 1;
  if (roll < densityBalance.triplePercent) return 3;
  if (roll < densityBalance.triplePercent + densityBalance.pairPercent) return 2;
  return 1;
}

/** The player can read a 3.5 s cue before any scheduled crossing. */
export function directorSafeLead(speed: number): number {
  return Math.max(60, speed * balance.warningSeconds);
}
