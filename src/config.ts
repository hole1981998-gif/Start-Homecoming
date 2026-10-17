/** All tunable values are TEMPORARY. Distances m, times s, speeds m/s. */
export const balance = Object.freeze({
  version: 'p2.0', laneWidth: 3.2, laneCount: 3, vehicleWidth: 0.28 * 3.2, vehicleLength: 2,
  // P1 currently has only the motorcycle; these move into its definition with the garage.
  minSpeed: 8, cruiseSpeed: 14, maxSpeed: 20, acceleration: 5, braking: 10,
  returnAcceleration: 3, returnDeceleration: 4,
  lateralSpeed: 5, lateralAcceleration: 22, lateralBraking: 30,
  fixedStep: 1 / 60, maxFrameSeconds: 0.1, maxSubsteps: 6,
  fuelCapacity: 8, durabilityCapacity: 70, fuelPerMeter: 0.003,
  initialMoney: 200, scorePerMeter: 1, moneyPerMeter: 0.15,
  coastDistance: 25, coastDrag: 3, coastCrawlSpeed: 2,
  waterFuelPerSecond: 0.8, potholeDamage: 12, potholeMoneyLoss: 10,
  trafficDamage: 20, trafficCooldown: 1, trafficSpeed: 6,
  fuelPickup: 8, repairPickup: 40,
  firstHazard: 130, hazardGap: 90, worldLookAhead: 140,
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
      c.fuelInterval > 500 || c.hazardGap / c.maxSpeed < c.warningSeconds) throw new Error('Invalid survival bounds');
}
validateConfig(balance);
