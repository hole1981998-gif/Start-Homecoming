/** All tunable values are TEMPORARY. Distances m, times s, speeds m/s. */
export const balance = Object.freeze({
  version: 'p4a-passengers-1', laneWidth: 3.2, laneCount: 3, vehicleWidth: 0.28 * 3.2, vehicleLength: 2,
  // P1 currently has only the motorcycle; these move into its definition with the garage.
  minSpeed: 8, cruiseSpeed: 14, maxSpeed: 20, acceleration: 5, braking: 10,
  returnAcceleration: 3, returnDeceleration: 4,
  lateralSpeed: 5, lateralAcceleration: 22, lateralBraking: 30,
  fixedStep: 1 / 60, maxFrameSeconds: 0.1, maxSubsteps: 6,
  fuelCapacity: 5.5, durabilityCapacity: 70, fuelPerMeter: 0.0045,
  initialMoney: 200, scorePerMeter: 1, moneyPerMeter: 0.5,
  riderScoreBonus: 0.04, riderMoneyPerMeter: 0.01, motorcycleCapacity: 2, riderLimit: 6,
  riderCruiseLoss: 2, riderCruiseFloor: 8, overloadSpeedPenalty: 0.08, overloadFuelPenalty: 0.15,
  minSpeedFactor: 0.4, maxFuelLoadFactor: 3,
  firstPassenger: 260, passengerInterval: 400, passengerReach: 12, passengerLateralReach: 1.8,
  passengerReboardDelaySeconds: 2,
  coastDistance: 25, coastDrag: 3, coastCrawlSpeed: 2,
  waterFuelPerSecond: 0.8, potholeImpactDamage: 6, potholeDamagePerSecond: 12, potholeMoneyLoss: 10,
  trafficDamage: 20, trafficSpeed: 6, driverFallSeconds: 0.8, driverPauseSeconds: 0.5, driverReturnSeconds: 1.8,
  crashSlideDeceleration: 8, crashSkidLateralMetres: 1.8,
  driverEjectionSpeedFactor: 1.5, driverEjectionLateralMetres: 2.5,
  fuelPickup: 5.5, repairPickup: 40,
  firstHazard: 130, hazardGap: 90, worldLookAhead: 140,
  hazardGapMin: 75, firstJunction: 800, junctionInterval: 800, junctionClearance: 60,
  fuelInterval: 450, firstRepair: 650, repairInterval: 900,
  warningSeconds: 3.5, discoverySeconds: 8,
});
export type Balance = { [K in keyof typeof balance]: typeof balance[K] extends number ? number : string };
export function validateConfig(c: Balance): void {
  for (const [key, value] of Object.entries(c)) {
    if (typeof value === 'number' && (!Number.isFinite(value) || value <= 0)) {
      throw new Error(`Invalid balance: ${key}`);
    }
  }
  if (c.maxSpeed < c.minSpeed || c.cruiseSpeed < c.minSpeed || c.cruiseSpeed > c.maxSpeed ||
      c.vehicleWidth >= c.laneWidth * 1.5 || c.laneCount !== 3 ||
      c.maxFrameSeconds > c.fixedStep * c.maxSubsteps + 1e-9) throw new Error('Invalid driving bounds');
  if (c.coastCrawlSpeed > c.minSpeed || c.trafficSpeed >= c.minSpeed ||
      c.fuelInterval > 500 || c.hazardGap / c.maxSpeed < c.warningSeconds ||
      c.hazardGapMin > c.hazardGap || c.hazardGapMin / c.maxSpeed < c.warningSeconds ||
      c.junctionInterval <= c.junctionClearance * 2) throw new Error('Invalid survival bounds');
  if (c.riderCruiseFloor < c.minSpeed || c.riderCruiseFloor >= c.cruiseSpeed ||
      c.riderCruiseLoss <= 0 || c.motorcycleCapacity < 1 || c.riderLimit < c.motorcycleCapacity - 1 ||
      c.overloadSpeedPenalty >= 1 || c.minSpeedFactor > 1 || c.maxFuelLoadFactor < 1 ||
      c.passengerReach >= c.passengerInterval / 2) throw new Error('Invalid passenger bounds');
}
validateConfig(balance);

/** P3A geometry candidates, in metres. All are temporary playtest values. */
export const hazardSizes = Object.freeze({
  water: [[2.4, 4], [3.2, 7], [3.2, 14], [5.7, 9], [5.7, 24], [9.6, 30]] as const,
  pothole: [[1.1, 1.2], [1.5, 1.8], [2.3, 4], [5.7, 5], [5.7, 24], [9.6, 18]] as const,
});
for (const variants of Object.values(hazardSizes)) for (const [width, length] of variants) {
  if (width <= 0 || length <= 0 || width > balance.laneWidth * balance.laneCount) {
    throw new Error('Invalid P3A hazard geometry');
  }
}
