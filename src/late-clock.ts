import { balance, lateWorldBalance as c } from './config';

/** Piecewise station clock. The station at each threshold is kept; only following gaps change. */
function schedule(first: number, gaps: readonly [number, number, number], origin = 0) {
  const i5 = origin + Math.ceil((c.firstThreshold - first) / gaps[0]);
  const d5 = first + (i5 - origin) * gaps[0];
  const i8 = i5 + Math.ceil((c.secondThreshold - d5) / gaps[1]);
  const d8 = d5 + (i8 - i5) * gaps[1];
  return {
    at(index: number) {
      return index <= i5 ? first + (index - origin) * gaps[0] :
        index <= i8 ? d5 + (index - i5) * gaps[1] : d8 + (index - i8) * gaps[2];
    },
    atOrAfter(distance: number) {
      return Math.max(origin, distance <= d5 ? origin + Math.ceil((distance - first) / gaps[0]) :
        distance <= d8 ? i5 + Math.ceil((distance - d5) / gaps[1]) :
          i8 + Math.ceil((distance - d8) / gaps[2]));
    },
  };
}
const fuel = schedule(0, c.fuelGap), repair = schedule(balance.firstRepair, c.repairGap);
const normal = schedule(3386.88, c.normalGap, 120);
export const fuelAt = fuel.at;
export const repairAt = repair.at;
export const nextFuelIndex = (distance: number) => Math.max(1, fuel.atOrAfter(distance));
export const nextRepairIndex = repair.atOrAfter;
export const lateNormalAt = normal.at;
export const nextNormalIndex = normal.atOrAfter;
export function shopGaps(shopDistance: number): readonly [number, number] {
  const stage = shopDistance >= c.secondThreshold ? 2 : shopDistance >= c.firstThreshold ? 1 : 0;
  return [c.shopMinGap[stage], c.shopMaxGap[stage]];
}
export function waterLengthFactor(distance: number): number {
  return distance >= c.secondThreshold ? c.waterLengthFactor[2] :
    distance >= c.firstThreshold ? c.waterLengthFactor[1] : c.waterLengthFactor[0];
}
